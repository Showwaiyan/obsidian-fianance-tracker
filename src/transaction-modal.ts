import { App, Modal, Setting, Notice, TFile, TFolder, moment, DropdownComponent } from 'obsidian';
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

    onOpen() {
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

        new Setting(contentEl)
            .setName('Type')
            .addDropdown(drop => drop
                .addOption('expense', 'Expense')
                .addOption('income', 'Income')
                .onChange(val => { this.payload.type = val as 'income'|'expense'; }));

        new Setting(contentEl)
            .setName('Account')
            .addDropdown(drop => {
                accounts.forEach(acc => drop.addOption(acc, acc));
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
        
        let subcatDropdown: DropdownComponent;

        new Setting(contentEl)
            .setName('Category')
            .addDropdown(drop => {
                cats.forEach(c => drop.addOption(c, c));
                drop.onChange(val => {
                    this.payload.category = val;
                    const selectedCat = this.plugin.settings.categories.find(c => c.name === val);
                    const subcats = selectedCat ? selectedCat.subcategories : [];
                    
                    subcatDropdown.selectEl.empty();
                    if (subcats.length > 0) {
                        subcats.forEach(s => subcatDropdown.addOption(s, s));
                        this.payload.subcategory = subcats[0];
                    } else {
                        subcatDropdown.addOption('', 'None');
                        this.payload.subcategory = '';
                    }
                });
            });

        new Setting(contentEl)
            .setName('Subcategory')
            .addDropdown(drop => {
                subcatDropdown = drop;
                const initialCat = this.plugin.settings.categories.find(c => c.name === this.payload.category);
                const initialSubcats = initialCat ? initialCat.subcategories : [];
                
                if (initialSubcats.length > 0) {
                    initialSubcats.forEach(s => drop.addOption(s, s));
                    this.payload.subcategory = initialSubcats[0];
                } else {
                    drop.addOption('', 'None');
                    this.payload.subcategory = '';
                }
                
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
                        new Notice('Amount, Account, and Category are required.');
                        return;
                    }
                    void this.saveTransaction();
                }));
    }

    async saveTransaction() {
        try {
            const service = new TransactionService(this.app);
            await service.createTransaction(this.plugin.settings.parentFolder, this.payload as TransactionPayload);
            new Notice('Transaction saved!');
            this.close();
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : 'Unknown error';
            new Notice(`Error: ${message}`);
        }
    }

    onClose() {
        this.contentEl.empty();
    }
}