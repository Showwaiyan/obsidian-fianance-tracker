import { Plugin } from 'obsidian';
import { FinanceTrackerSettings, DEFAULT_SETTINGS, FinanceTrackerSettingTab } from './settings';
import { TransactionModal } from './transaction-modal';

export default class FinanceTrackerPlugin extends Plugin {
    settings: FinanceTrackerSettings;

    async onload() {
        await this.loadSettings();
        
        // Changed from 'coins' to 'dollar-sign' to ensure compatibility with Obsidian's bundled lucide icons
        this.addRibbonIcon('dollar-sign', 'Create new transaction', (evt: MouseEvent) => {
            new TransactionModal(this.app, this).open();
        });

        this.addCommand({
            id: 'open-new-transaction-modal',
            name: 'Create new transaction',
            callback: () => {
                new TransactionModal(this.app, this).open();
            }
        });

        this.addSettingTab(new FinanceTrackerSettingTab(this.app, this));
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData()) as FinanceTrackerSettings;
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}
