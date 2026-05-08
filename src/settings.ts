import { App, PluginSettingTab, Setting, Notice } from 'obsidian';
import FinanceTrackerPlugin from './main';

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
    }
}
