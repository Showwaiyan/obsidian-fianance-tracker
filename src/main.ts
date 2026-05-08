import { Plugin } from 'obsidian';
import { FinanceTrackerSettings, DEFAULT_SETTINGS, FinanceTrackerSettingTab } from './settings';

export default class FinanceTrackerPlugin extends Plugin {
    settings: FinanceTrackerSettings;

    async onload() {
        await this.loadSettings();
        this.addSettingTab(new FinanceTrackerSettingTab(this.app, this));
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}
