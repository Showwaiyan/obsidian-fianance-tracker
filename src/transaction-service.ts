import { App, TFile, moment } from 'obsidian';

export interface TransactionPayload {
    type: 'income' | 'expense';
    amount: number;
    accountName: string;
    category: string;
    subcategory: string;
    date: string; // YYYY-MM-DD
    note: string;
    description: string;
}

export class TransactionService {
    constructor(private app: App) {}

    async createTransaction(parentFolder: string, payload: TransactionPayload): Promise<void> {
        // 1. Verify account exists
        const accountFile = this.app.vault.getAbstractFileByPath(`${parentFolder}/accounts/${payload.accountName}.md`);
        if (!accountFile || !(accountFile instanceof TFile)) {
            throw new Error(`Account ${payload.accountName} not found.`);
        }

        // 2. Create Transaction File
        const m = moment(payload.date);
        const year = m.format('YYYY');
        const month = m.format('MM');
        const folderPath = `${parentFolder}/${year}/${month}`;
        
        await this.ensureFolderExists(folderPath);

        const timestamp = moment().format('x');
        const filename = `${payload.date}-${timestamp}.md`;
        const filePath = `${folderPath}/${filename}`;

        const fileContent = `---
type: ${payload.type}
amount: ${payload.amount}
account: "${payload.accountName}"
category: "${payload.category}"
subcategory: "${payload.subcategory}"
date: "${payload.date}"
note: "${payload.note}"
---
${payload.description}`;

        await this.app.vault.create(filePath, fileContent);

        // 3. Mutate Account Ledger
        await this.app.fileManager.processFrontMatter(accountFile, (frontmatter) => {
            const fm = frontmatter as { balance?: number };
            const currentBalance = Number(fm.balance) || 0;
            if (payload.type === 'income') {
                fm.balance = currentBalance + payload.amount;
            } else {
                fm.balance = currentBalance - payload.amount;
            }
        });
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