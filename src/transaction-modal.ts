import { App, Modal, Setting, Notice, TFile, TFolder, moment } from 'obsidian';
import FinanceTrackerPlugin from './main';
import { TransactionService, TransactionPayload } from './transaction-service';

export class TransactionModal extends Modal {
    payload: Partial<TransactionPayload> = {
        type: 'expense',
        date: moment().format('YYYY-MM-DD')
    };

    constructor(app: App, private plugin: FinanceTrackerPlugin) {
        super(app);
    }

    onOpen(): void {
        const {contentEl} = this;
        contentEl.createEl('h2', {text: 'New Transaction'});

        const accountsFolder = this.app.vault.getAbstractFileByPath(`${this.plugin.settings.parentFolder}/Accounts`);
        const accounts: string[] = [];
        if (accountsFolder instanceof TFolder) {
            accountsFolder.children.forEach(c => {
                if (c instanceof TFile && c.extension === 'md') {
                    accounts.push(c.basename);
                }
            });
        }

        if (accounts.length > 0) {
            this.payload.accountName = accounts[0];
        }

        // Type dropdown
        new Setting(contentEl)
            .setName('Type')
            .addDropdown(drop => {
                drop.addOption('expense', 'Expense');
                drop.addOption('income', 'Income');
                drop.onChange(() => { return; });
            });

        // Account dropdown
        new Setting(contentEl)
            .setName('Account')
            .addDropdown(drop => {
                accounts.forEach(acc => drop.addOption(acc, acc));
                drop.onChange(() => { return; });
            });

        // Amount
        new Setting(contentEl)
            .setName('Amount')
            .addText(text => text
                .setPlaceholder('0.00')
                .onChange(() => { return; }));

        // Date
        new Setting(contentEl)
            .setName('Date')
            .addText(text => text
                .setValue(this.payload.date!)
                .onChange(() => { return; }));

        const cats = this.plugin.settings.categories.map(c => c.name);
        if (cats.length > 0) this.payload.category = cats[0];
        
        // Category dropdown
        new Setting(contentEl)
            .setName('Category')
            .addDropdown(drop => {
                cats.forEach(c => drop.addOption(c, c));
                drop.onChange(() => { return; });
            });

        // Subcategory dropdown
        new Setting(contentEl)
            .setName('Subcategory')
            .addDropdown(drop => {
                drop.addOption('', 'None');
                drop.onChange(() => { return; });
            });

        // Note
        new Setting(contentEl)
            .setName('Note')
            .addText(text => text.onChange(() => { return; }));

        // Description
        new Setting(contentEl)
            .setName('Description')
            .addTextArea(text => text.onChange(() => { return; }));

        // Save button
        new Setting(contentEl)
            .addButton(btn => btn
                .setButtonText('Save transaction')
                .setCta()
                .onClick(() => {
                    if (!this.payload.amount || !this.payload.accountName || !this.payload.category) {
                        new Notice('Amount, Account, and Category are required.');
                        return;
                    }
                    this.doSave();
                }));
    }

    /* eslint-disable @typescript-eslint/no-misused-promises */
    doSave(): void {
        const service = new TransactionService(this.app);
        service.createTransaction(this.plugin.settings.parentFolder, this.payload as TransactionPayload)
            .then(() => {
                new Notice('Transaction saved!');
                this.close();
            })
            .catch((e: unknown) => {
                const message = e instanceof Error ? e.message : 'Unknown error';
                new Notice(`Error: ${message}`);
            });
    }

    onClose(): void {
        this.contentEl.empty();
    }
}