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
        contentEl.createEl('h2', {text: 'New transaction'});

        const accountsFolder = this.app.vault.getAbstractFileByPath(`${this.plugin.settings.parentFolder}/accounts`);
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

        new Setting(contentEl)
            .setName('Type')
            .addDropdown(drop => {
                drop.addOption('expense', 'Expense');
                drop.addOption('income', 'Income');
                drop.onChange(val => { this.payload.type = val as 'income'|'expense'; });
            });

        new Setting(contentEl)
            .setName('Account')
            .addDropdown(drop => {
                for (const acc of accounts) {
                    drop.addOption(acc, acc);
                }
                drop.onChange(val => { this.payload.accountName = val; });
            });

        new Setting(contentEl)
            .setName('Amount')
            .addText(text => text
                .setPlaceholder('0.00')
                .onChange(val => { this.payload.amount = parseFloat(val); }));

        new Setting(contentEl)
            .setName('Date')
            .addText(text => text
                .setValue(this.payload.date!)
                .onChange(val => { this.payload.date = val; }));

        const cats = this.plugin.settings.categories.map(c => c.name);
        if (cats.length > 0) this.payload.category = cats[0];

        new Setting(contentEl)
            .setName('Category')
            .addDropdown(drop => {
                for (const c of cats) {
                    drop.addOption(c, c);
                }
                drop.onChange(val => { this.payload.category = val; });
            });

        new Setting(contentEl)
            .setName('Subcategory')
            .addDropdown(drop => {
                drop.addOption('', 'None');
                drop.onChange(val => { this.payload.subcategory = val; });
            });

        new Setting(contentEl)
            .setName('Note')
            .addText(text => text.onChange(val => { this.payload.note = val; }));

        new Setting(contentEl)
            .setName('Description')
            .addTextArea(text => text.onChange(val => { this.payload.description = val; }));

        new Setting(contentEl)
            .addButton(btn => btn
                .setButtonText('Save transaction')
                .setCta()
                .onClick(() => {
                    if (!this.payload.amount || !this.payload.accountName || !this.payload.category) {
                        new Notice('Amount, account, and category are required.');
                        return;
                    }
                    this.doSave();
                }));
    }

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