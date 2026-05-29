# AGENTS.md

## Project Overview
- Dynamic Calc is a browser-based showdown calculator fork with dynamic data loading and Nuzlocke-focused features.
- Tech stack is plain HTML/CSS/JavaScript plus local `calc/` engine modules.
- Primary entry points are `index.html`, `dashboard.html`, `mastersheet.html`, and scripts in `js/`.

## High-Value Directories/Files
- `js/`: UI behavior, controls, import hooks, save readers, mastersheet logic.
- `js/analytics`: UI for dashboard.html
- `js/fragsheet`: UI for fragsheet tab
- `js/mastersheet/render`: UI for rendering mastersheet.html
- `'js/savereaders`: savereader.js is for gen 4/5, g3 g6 and g7 savereaders are gen 3,6,7, null is for Pokemon Null, pokeemerald is for Emerald Imperium 
- `css/`: page styling.
- `calc/`: calculation engine logic.
- `cypress/`: end-to-end tests and fixtures.
- `tools/`: data utilities and large reference JSON files.
- `initialize.js`: sets up globals and hardcoded game specific data configs/adjustments
- `moveset_import.js`: UI and logic for importing sets from user input and from external tools via http api for clipboard
- `shared_controls.js` and `index_random_controls.js`: UI for damage calculations 
- `showdown_hooks.js`: mostly additional event bindings for calculator UI

## File Scope And Performance Rules
- Default to editing only files needed for the task.
- Ignore very large data files unless the task explicitly requires them.
- Specifically avoid scanning or editing these by default:
  - `backups/**` (large backup datasets)
  - `tools/*.json` (large reference datasets such as `trainers.json`, `elite_setdex.json`)
  - `js/mastersheet/data/**` (large generated data bundles)
  - `node_modules/**`
- Do not mass-read entire large files to answer small questions. Prefer targeted reads.

## Working Style
- Make small, focused changes that match existing patterns.
- Preserve current architecture (global browser scripts, existing event wiring) unless asked to refactor.
- Avoid unrelated cleanup and broad formatting changes.
- Ask before changing data format assumptions used by imports, setdex, or save parsing.

## Safety Rules
- Never run destructive git commands (`reset --hard`, `checkout --`) unless explicitly requested.
- Do not modify backup datasets as part of routine bugfixes/features.

## Change Reporting
- In summaries, include:
  - files changed
  - behavior impact
