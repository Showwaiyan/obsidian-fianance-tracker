# Obsidian Finance Tracker - Design Specification

## 1. Overview
The Obsidian Finance Tracker is a community plugin for Obsidian that allows users to manage financial accounts and log transactions entirely within markdown files. It uses a strict ledger approach where account balances are stored in YAML frontmatter and mutated upon transaction entry, while individual transactions are stored as historical markdown notes.

**Compatibility:** The plugin must work seamlessly on both **Mobile and Desktop** versions of Obsidian. This means strictly relying on Obsidian's internal `Vault` and `FileManager` APIs, and completely avoiding Node.js or Electron-specific APIs (like `fs` or `path`).

## 2. Configuration & Settings
The plugin will have a settings tab providing the following controls:
*   **Parent Folder:** A text input defining the root folder for all financial data (e.g., `Finance`). Default: `Finance`.
*   **Categories Manager:** A UI to define Categories and their associated Subcategories.
*   **Account Creator:** A dedicated section to create new Accounts.
    *   **Fields:** Name, Initial Balance (number), Currency (string, e.g., USD, EUR).
    *   **Action:** Clicking "Create" creates the file `{ParentFolder}/Accounts/{Name}.md`.

## 3. Data Structure & Schema
All data is stored in the Obsidian vault using standard Markdown + YAML frontmatter.

### 3.1 Accounts
*   **Path:** `{ParentFolder}/Accounts/{AccountName}.md`
*   **Schema (YAML):**
    ```yaml
    ---
    balance: 1000.00
    currency: USD
    ---
    ```
    *The body of this file can be left empty or used by the user for personal notes.*

### 3.2 Transactions
*   **Path:** `{ParentFolder}/{YYYY}/{MM}/YYYY-MM-DD-<timestamp>.md`
*   **Schema:**
    ```yaml
    ---
    type: expense # or "income"
    amount: 50.00
    account: "Main Checking" # Matches an existing account file name
    category: "Food"
    subcategory: "Groceries"
    date: "2024-05-08"
    note: "Weekly groceries"
    ---
    This is the optional long description of the transaction.
    ```

## 4. User Interface
*   **Ribbon Icon:** A plugin icon added to the left ribbon.
*   **Transaction Modal:** Clicking the ribbon icon opens a "New Transaction" modal window.
*   **Modal Fields:**
    *   Type (Dropdown: Income / Expense)
    *   Amount (Number input)
    *   Account (Dropdown: populated by scanning `{ParentFolder}/Accounts/`)
    *   Category (Dropdown: populated from settings)
    *   Subcategory (Dropdown: populated based on selected category)
    *   Date (Date input, defaults to today)
    *   Note (Short text input)
    *   Description (Textarea)
*   **Submission:** A "Save" button triggers the execution flow.

## 5. Execution Flow & State Mutation
When a user saves a transaction:
1.  **Validation:** Ensure Amount > 0, Account is selected, and Category is selected.
2.  **File Creation:** Construct the markdown string and create the transaction file using `app.vault.create()`, automatically creating `{YYYY}` and `{MM}` folders if they don't exist.
3.  **Ledger Mutation:** 
    *   Use `app.fileManager.processFrontMatter` on the selected Account file.
    *   If Type is "income", add `Amount` to the current `balance`.
    *   If Type is "expense", subtract `Amount` from the current `balance`.
4.  **Feedback:** Show an Obsidian `Notice` on success.

## 6. Error Handling
*   If the target Account file is missing during mutation, abort and show an error Notice.
*   Missing folders during transaction creation must be handled gracefully by creating them recursively.