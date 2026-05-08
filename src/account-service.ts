import { App } from 'obsidian';

export class AccountService {
    constructor(private app: App) {}

    async createAccount(parentFolder: string, name: string, balance: number, currency: string): Promise<void> {
        const accountsPath = `${parentFolder}/accounts`;
        
        // Ensure accounts folder exists
        const folder = this.app.vault.getAbstractFileByPath(accountsPath);
        if (!folder) {
            await this.ensureFolderExists(parentFolder);
            await this.app.vault.createFolder(accountsPath);
        }

        const filePath = `${accountsPath}/${name}.md`;
        if (this.app.vault.getAbstractFileByPath(filePath)) {
            throw new Error('Account already exists');
        }

        const content = `---\nbalance: ${balance}\ncurrency: ${currency}\n---\n`;
        await this.app.vault.create(filePath, content);
    }

    private async ensureFolderExists(path: string): Promise<void> {
        const parts = path.split('/');
        let currentPath = '';
        for (const part of parts) {
            currentPath = currentPath === '' ? part : `${currentPath}/${part}`;
            const folder = this.app.vault.getAbstractFileByPath(currentPath);
            if (!folder) {
                await this.app.vault.createFolder(currentPath);
            }
        }
    }
}
