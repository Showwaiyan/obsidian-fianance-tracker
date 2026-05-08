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
                drop.onChange(async (val: string) => {
                    this.payload.type = val as 'income'|'expense';
                });
            });

        // Account dropdown
        new Setting(contentEl)
            .setName('Account')
            .addDropdown(drop => {
                accounts.forEach(acc => drop.addOption(acc, acc));
                drop.onChange(async (val: string) => {
                    this.payload.accountName = val;
                });
            });

        // Amount
        new Setting(contentEl)
            .setName('Amount')
            .addText(text => text
                .setPlaceholder('0.00')
                .onChange(async (val: string) => {
                    this.payload.amount = parseFloat(val);
                }));

        // Date
        new Setting(contentEl)
            .setName('Date')
            .addText(text => text
                .setValue(this.payload.date!)
                .onChange(async (val: string) => {
                    this.payload.date = val;
                }));

        const cats = this.plugin.settings.categories.map(c => c.name);
        if (cats.length > 0) this.payload.category = cats[0];
        
        // Category dropdown
        const catsList = cats;
        new Setting(contentEl)
            .setName('Category')
            .addDropdown(drop => {
                catsList.forEach(c => drop.addOption(c, c));
                drop.onChange(async (val: string) => {
                    this.payload.category = val;
                });
            });

        // Subcategory dropdown
        new Setting(contentEl)
            .setName('Subcategory')
            .addDropdown(drop => {
                drop.addOption('', 'None');
                drop.onChange(async (val: string) => {
                    this.payload.subcategory = val;
                });
            });

        // Note
        new Setting(contentEl)
            .setName('Note')
            .addText(text => text.onChange(async (val: string) => {
                this.payload.note = val;
            }));

        // Description
        new Setting(contentEl)
            .setName('Description')
            .addTextArea(text => text.onChange(async (val: string) => {
                this.payload.description = val;
            }));

        // Save button
        new Setting(contentEl)
            .addButton(btn => btn
                .setButtonText('Save Transaction')
                .setCta()
                .onClick(async () => {
                    if (!this.payload.amount || !this.payload.accountName || !this.payload.category) {
                        new Notice('Amount, Account, and Category are required.');
                        return;
                    }
                    try {
                        const service = new TransactionService(this.app);
                        await service.createTransaction(this.plugin.settings.parentFolder, this.payload as TransactionPayload);
                        new Notice('Transaction saved!');
                        this.close();
                    } catch (e: unknown) {
                        const message = e instanceof Error ? e.message : 'Unknown error';
                        new Notice(`Error: ${message}`);
                    }
                }));
    }

    onClose(): void {
        this.contentEl.empty();
    }
}