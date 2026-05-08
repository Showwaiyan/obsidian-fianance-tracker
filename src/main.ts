import { Plugin } from 'obsidian';
import { FinanceTrackerSettings, DEFAULT_SETTINGS, FinanceTrackerSettingTab } from './settings';
import { TransactionModal } from './transaction-modal';

export default class FinanceTrackerPlugin extends Plugin {
    settings: FinanceTrackerSettings;

    async onload() {
        await this.loadSettings();
        
        this.addRibbonIcon('coins', 'New Transaction', (evt: MouseEvent) => {
            new TransactionModal(this.app, this).open();
        });

        this.addSettingTab(new FinanceTrackerSettingTab(this.app, this));
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}
