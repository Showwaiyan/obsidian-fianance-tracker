# Finance Tracker Plugin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an Obsidian community plugin that tracks financial transactions in markdown files and updates account balances stored in YAML frontmatter.

**Architecture:** 
- A central `settings.ts` to manage Categories, Subcategories, Parent Folder, and Account Creation.
- A `transaction-modal.ts` containing the UI form to capture transaction details.
- A `transaction-service.ts` to handle file creation and ledger (frontmatter) mutation via `app.fileManager.processFrontMatter` and `app.vault`.
- The plugin will strictly use Obsidian Vault/FileManager APIs (no Node `fs`) to ensure mobile compatibility.

**Tech Stack:** TypeScript, Obsidian API (Vault, FileManager, Modal, PluginSettingTab)

---

### Task 1: Setup Plugin Settings Schema & Tab

**Files:**
- Create/Modify: `src/settings.ts`
- Modify: `src/main.ts`

- [ ] **Step 1: Define the settings interface**

In `src/settings.ts` define the data structures for Categories and the Plugin Settings:

```typescript
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
```

- [ ] **Step 2: Create the basic Settings Tab skeleton**

In `src/settings.ts`:

```typescript
import { App, PluginSettingTab, Setting, Notice } from 'obsidian';
import FinanceTrackerPlugin from './main';

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
```

- [ ] **Step 3: Wire settings into `main.ts`**

In `src/main.ts` (cleaning up boilerplate):

```typescript
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
```

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: PASS (no type errors)

- [ ] **Step 5: Commit**

```bash
git add src/settings.ts src/main.ts
git commit -m "feat: setup plugin settings schema and tab"
```

---

### Task 2: Implement Account Creation UI

**Files:**
- Modify: `src/settings.ts`
- Create: `src/account-service.ts`

- [ ] **Step 1: Write Account Creation Service**

Create `src/account-service.ts` using strictly Obsidian Vault APIs:

```typescript
import { App, TFolder } from 'obsidian';

export class AccountService {
    constructor(private app: App) {}

    async createAccount(parentFolder: string, name: string, balance: number, currency: string): Promise<void> {
        const accountsPath = `${parentFolder}/Accounts`;
        
        // Ensure Accounts folder exists
        const folder = this.app.vault.getAbstractFileByPath(accountsPath);
        if (!folder) {
            // Note: In a real implementation we should create intermediate folders recursively, 
            // but for this step we assume the parentFolder exists or we create it.
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
```

- [ ] **Step 2: Add Account Creation UI to Settings Tab**

In `src/settings.ts`, add to `display()`:

```typescript
import { AccountService } from './account-service';
// ... inside display()

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
                // Clear fields visually in a full implementation, but for now just show notice
            } catch (e: any) {
                new Notice(`Error: ${e.message}`);
            }
        }));
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/settings.ts src/account-service.ts
git commit -m "feat: add account creation UI and service"
```

---

### Task 3: Transaction Execution Service

**Files:**
- Create: `src/transaction-service.ts`

- [ ] **Step 1: Write Transaction Execution Logic**

Create `src/transaction-service.ts` to handle file creation and ledger updates:

```typescript
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
        const accountFile = this.app.vault.getAbstractFileByPath(`${parentFolder}/Accounts/${payload.accountName}.md`);
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
            const currentBalance = typeof frontmatter.balance === 'number' ? frontmatter.balance : 0;
            if (payload.type === 'income') {
                frontmatter.balance = currentBalance + payload.amount;
            } else {
                frontmatter.balance = currentBalance - payload.amount;
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
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/transaction-service.ts
git commit -m "feat: implement transaction logic and ledger mutation"
```

---

### Task 4: Transaction UI Modal & Ribbon Integration

**Files:**
- Create: `src/transaction-modal.ts`
- Modify: `src/main.ts`

- [ ] **Step 1: Write the Transaction Modal**

Create `src/transaction-modal.ts`:

```typescript
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

    onOpen() {
        const {contentEl} = this;
        contentEl.createEl('h2', {text: 'New Transaction'});

        // Get accounts
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
                .onChange(val => this.payload.type = val as 'income'|'expense'));

        new Setting(contentEl)
            .setName('Account')
            .addDropdown(drop => {
                accounts.forEach(acc => drop.addOption(acc, acc));
                drop.onChange(val => this.payload.accountName = val);
            });

        new Setting(contentEl)
            .setName('Amount')
            .addText(text => text
                .setPlaceholder('0.00')
                .onChange(val => this.payload.amount = parseFloat(val)));

        new Setting(contentEl)
            .setName('Date')
            .addText(text => text
                .setValue(this.payload.date!)
                .onChange(val => this.payload.date = val));

        // Basic category mapping for MVP UI
        const cats = this.plugin.settings.categories.map(c => c.name);
        if (cats.length > 0) this.payload.category = cats[0];
        
        new Setting(contentEl)
            .setName('Category')
            .addDropdown(drop => {
                cats.forEach(c => drop.addOption(c, c));
                drop.onChange(val => this.payload.category = val);
            });

        new Setting(contentEl)
            .setName('Subcategory')
            .addText(text => text.onChange(val => this.payload.subcategory = val));

        new Setting(contentEl)
            .setName('Note')
            .addText(text => text.onChange(val => this.payload.note = val));

        new Setting(contentEl)
            .setName('Description')
            .addTextArea(text => text.onChange(val => this.payload.description = val));

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
                        new Notice('Transaction Saved!');
                        this.close();
                    } catch (e: any) {
                        new Notice(`Error: ${e.message}`);
                    }
                }));
    }

    onClose() {
        this.contentEl.empty();
    }
}
```

- [ ] **Step 2: Add Ribbon Icon in `main.ts`**

Update `src/main.ts` `onload()`:

```typescript
import { TransactionModal } from './transaction-modal';

// inside onload()...
this.addRibbonIcon('coins', 'New Transaction', (evt: MouseEvent) => {
    new TransactionModal(this.app, this).open();
});
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/transaction-modal.ts src/main.ts
git commit -m "feat: add transaction UI modal and ribbon button"
```