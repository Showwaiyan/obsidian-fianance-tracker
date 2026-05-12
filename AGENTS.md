# Obsidian Finance Tracker - Agent Instructions

## Architecture & Entrypoints
- **Type:** Obsidian Community Plugin (TypeScript → bundled JavaScript).
- **Entrypoint:** `src/main.ts`. Keep this file minimal (focus on plugin lifecycle and command registration). Delegate logic to other modules (e.g., `src/commands`, `src/settings.ts`, `src/ui`).
- **Styles:** Modify `styles.css` directly for any UI changes.

## Developer Workflow & Commands
- **Install:** `npm install`
- **Watch mode:** `npm run dev` (Uses esbuild to continuously build `main.js`)
- **Production Build:** `npm run build` (Typechecks first, then minimizes with esbuild)
- **Linting:** `npm run lint` (ESLint)
- **Versioning:** Run `npm run version` to bump versions in `manifest.json` and `versions.json` and auto-stage them to git.

## Build Artifacts & Git Conventions
- **Required Release Artifacts:** `main.js`, `manifest.json`, and `styles.css`.
- **Do NOT commit `main.js`**: It is explicitly ignored in `.gitignore`. These are uploaded to GitHub Releases instead.
- Treat the plugin `id` in `manifest.json` as immutable. 

## Framework Quirks & Gotchas
- **Lifecycle Cleanup:** Always use Obsidian's `this.registerEvent()`, `this.registerDomEvent()`, and `this.registerInterval()` to ensure listeners are cleaned up properly when the plugin unloads.
- **Settings Persistence:** Use `this.loadData()` and `this.saveData()` for user settings.
- **No external network calls** without explicit user opt-in and documentation. Default to local/offline operations.
- Avoid Node/Electron APIs (like `fs` or `path`) unless `isDesktopOnly` is `true`. Prefer the Obsidian Vault API (`this.app.vault`).
- **TypeScript `baseUrl: "src"`**: Module imports are relative to `src/`. Write `import './foo'` not `import 'src/foo'`.
- **Ribbon icons**: Must use Obsidian's bundled Lucide icon names (e.g., `'dollar-sign'`, not custom SVGs or other icon libraries).
