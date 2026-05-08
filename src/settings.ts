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
        { name: 'Food', subcategories: ['Breakfast', 'Lunch', 'Dinner', 'Groceries'] },
        { name: 'Transport', subcategories: ['Gas', 'Transit', 'Maintenance'] },
        { name: 'Utilities', subcategories: ['Internet', 'Electricity', 'Water'] },
        { name: 'Shopping', subcategories: ['Clothing', 'Electronics'] }
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

        // --- Account Creation Section ---
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

        // --- Categories Management Section ---
        containerEl.createEl('h3', {text: 'Manage Categories'});

        let newCategoryName = '';
        new Setting(containerEl)
            .setName('Add New Category')
            .addText(text => text.setPlaceholder('Category Name').onChange(val => newCategoryName = val))
            .addButton(btn => btn
                .setButtonText('Add Category')
                .setCta()
                .onClick(async () => {
                    if (newCategoryName && !this.plugin.settings.categories.find(c => c.name === newCategoryName)) {
                        this.plugin.settings.categories.push({ name: newCategoryName, subcategories: [] });
                        await this.plugin.saveSettings();
                        this.display(); // Re-render to show new category
                    } else if (newCategoryName) {
                        new Notice('Category already exists');
                    }
                }));

        this.plugin.settings.categories.forEach((category, catIndex) => {
            const catContainer = containerEl.createDiv('category-container');
            catContainer.style.border = '1px solid var(--background-modifier-border)';
            catContainer.style.padding = '10px';
            catContainer.style.marginBottom = '10px';
            catContainer.style.borderRadius = '5px';

            new Setting(catContainer)
                .setName(category.name)
                .setHeading()
                .addButton(btn => btn
                    .setButtonText('Delete Category')
                    .setWarning()
                    .onClick(async () => {
                        this.plugin.settings.categories.splice(catIndex, 1);
                        await this.plugin.saveSettings();
                        this.display();
                    }));

            category.subcategories.forEach((sub, subIndex) => {
                new Setting(catContainer)
                    .setName(`- ${sub}`)
                    .addButton(btn => btn
                        .setIcon('trash')
                        .setTooltip('Delete Subcategory')
                        .onClick(async () => {
                            category.subcategories.splice(subIndex, 1);
                            await this.plugin.saveSettings();
                            this.display();
                        }));
            });

            let newSubName = '';
            new Setting(catContainer)
                .setName('Add Subcategory')
                .addText(text => text.setPlaceholder('Subcategory Name').onChange(val => newSubName = val))
                .addButton(btn => btn
                    .setButtonText('Add Subcategory')
                    .onClick(async () => {
                        if (newSubName && !category.subcategories.includes(newSubName)) {
                            category.subcategories.push(newSubName);
                            await this.plugin.saveSettings();
                            this.display();
                        }
                    }));
        });
    }
}
