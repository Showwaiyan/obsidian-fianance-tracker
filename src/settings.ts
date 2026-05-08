import { App, PluginSettingTab, Setting, Notice } from 'obsidian';
import FinanceTrackerPlugin from './main';
import { AccountService } from './account-service';

export interface CategoryDef {
    name: string;
    subcategories: string[];
}

export interface FinanceTrackerSettings {
    parentFolder: string;
    categories: CategoryDef[];
}

export const DEFAULT_SETTINGS: FinanceTrackerSettings = {
    parentFolder: 'Finance',
    categories: [
        { name: 'Income', subcategories: ['Salary', 'Gift'] },
        { name: 'Expense', subcategories: ['Food', 'Transport'] }
    ]
}

export class FinanceTrackerSettingTab extends PluginSettingTab {
    plugin: FinanceTrackerPlugin;

    constructor(app: App, plugin: FinanceTrackerPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const {containerEl} = this;
        containerEl.empty();
        containerEl.createEl('h2', {text: 'Finance Tracker Settings'});

        new Setting(containerEl)
            .setName('Parent Folder')
            .setDesc('Root folder for accounts and transactions')
            .addText(text => text
                .setPlaceholder('Finance')
                .setValue(this.plugin.settings.parentFolder)
                .onChange(async (value) => {
                    this.plugin.settings.parentFolder = value;
                    await this.plugin.saveSettings();
                }));

        containerEl.createEl('h3', {text: 'Create New Account'});

        let newAccountName = '';
        let newAccountBalance = '0';
        let newAccountCurrency = 'USD';

        new Setting(containerEl)
            .setName('Account Name')
            .addText(text => text.onChange(val => newAccountName = val));

        new Setting(containerEl)
            .setName('Initial Balance')
            .addText(text => text.onChange(val => newAccountBalance = val));

        new Setting(containerEl)
            .setName('Currency')
            .addText(text => text.onChange(val => newAccountCurrency = val));

        new Setting(containerEl)
            .addButton(btn => btn
                .setButtonText('Create Account')
                .setCta()
                .onClick(async () => {
                    if (!newAccountName) {
                        new Notice('Account name is required');
                        return;
                    }
                    try {
                        const service = new AccountService(this.app);
                        await service.createAccount(
                            this.plugin.settings.parentFolder, 
                            newAccountName, 
                            parseFloat(newAccountBalance), 
                            newAccountCurrency
                        );
                        new Notice(`Account ${newAccountName} created`);
                    } catch (e: any) {
                        new Notice(`Error: ${e.message}`);
                    }
                }));
    }
}
