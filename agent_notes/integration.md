# Integration Notes

## Overview

The main page now behaves as a single-shell app:

- `Calculator`, `Box`, `Fragsheet`, and `Battle Log` are top-level content views.
- `Dex` is still an action, not a view. Clicking it opens the existing dex iframe overlay.
- `Fragsheet` and `Battle Log` share one embedded DOM shell in `index.html`.
- `frags.html` still works as a standalone page because the fragsheet scripts now support both standalone auto-init and embedded lazy init.

The key files involved are:

- `index.html`
- `js/calc_ui/main_nav.js`
- `js/fragsheet/aggrid_options.js`
- `js/fragsheet/controls.js`
- `js/fragsheet/battle_log.js`
- `js/fragsheet/frags.js`
- `js/moveset_import.js`
- `js/calc_ui/master_file_poller.js`

## View wiring

### Top-level navigation

`js/calc_ui/main_nav.js` owns the main header tabs.

- `setMainPageView("calculator" | "box" | "fragsheet" | "battle-log")` is the single entry point for page view changes.
- The controller shows and hides:
  - `#calculator-view`
  - `#fragsheet-shell`
  - `#box-view`
- `Dex` is intentionally excluded from this view switcher. `dex.js` handles it directly as a click action.

### Embedded fragsheet/battle-log shell

`#fragsheet-shell` contains the shared embedded UI:

- fragsheet buttons
- split tabs
- AG Grid
- battle-log toolbar and container
- frag-history sidebar
- delete/reset actions

`battle_log.js` still owns the inner fragsheet vs battle-log mode. The new public hooks are:

- `window.ensureBattleLogUiInitialized()`
- `window.setEmbeddedFragsheetMode(mode)`
- `window.isBattleLogEnabledForTitle()`

`main_nav.js` calls those hooks when the user switches top-level tabs.

## Data model

There are three separate storage channels that matter:

### 1. Calc box data: `localStorage.customsets`

This is the source of truth for imported player box/team sets.

- Save import and box import ultimately write here.
- The calc box UI renders from this data.
- `player_box.js` reads this data to build the calc-side box list.

### 2. Fragsheet data: `localStorage.encounters`

This is the source of truth for the fragsheet grid and frag history.

- It is derived from `customsets` the first time a species is seen.
- It also stores fragsheet-only state:
  - `fragCount`
  - `frags`
  - `alive`
  - met location / nickname edits
  - pre-evo merged frag state

### 3. Battle log data: `localStorage.battleLogs`

This is the source of truth for the battle-log screen.

- It is populated by manual battle-log import, `/battle_log` sync, or master-file polling.
- Rendering battle log does not read from `customsets`.
- It can rebuild `encounters`, but it does not rewrite `customsets`.

## Save and box import flow

### Manual save import from the calc page

The save readers parse `.sav` data and normalize it into Showdown-style import text.

High-level flow:

1. A save reader parses party and box data.
2. The parsed import text is written into `.import-team-text`.
3. The normal import path runs through `moveset_import.js`.
4. Imported mons are written into `localStorage.customsets`.
5. The calc box refreshes via `get_box()`.
6. `importEncounters()` creates or extends `localStorage.encounters` from the imported `My Box` sets.

Important consequence:

- importing box/save data updates both the calc box and the fragsheet seed data.
- the fragsheet starts from imported box state, but then diverges into its own encounter/frag state in `localStorage.encounters`.

### Master-file polling box sync

`js/calc_ui/master_file_poller.js` splits master sync into two independent channels:

- `parsedMaster.box` goes through `importPolledMasterBoxPayload()`
- `parsedMaster.battlelog` goes through `localStorage.battleLogs`

For the box side:

1. `master_file_poller.js` extracts `parsedMaster.box.payload`
2. `importPolledMasterBoxPayload()` in `moveset_import.js` imports that payload
3. that import updates `localStorage.customsets`
4. the calc box refreshes
5. `importEncounters()` extends `localStorage.encounters` for any new species

So master-file box sync behaves like a structured box import into the calc.

## Fragsheet flow

The fragsheet grid is owned by `aggrid_options.js`.

Initialization:

- `ensureFragsheetGridInitialized()` builds the grid once
- it reads `localStorage.encounters`
- it stores the live grid API on `window.gridApi`

Runtime behavior:

- row edits update `localStorage.encounters`
- delete/reset actions update `localStorage.encounters`
- clicking calc sprites can add/remove frags through `frags.js`
- when `encounters` changes, the fragsheet refreshes from that store

Important boundary:

- fragsheet edits do not automatically rewrite `localStorage.customsets`, except for the explicit encounter delete path that also removes the matching `My Box` set.

## Battle-log flow

### Manual sync / file import

`battle_log.js` writes battle-log payloads into `localStorage.battleLogs`.

The render path is:

1. read `localStorage.battleLogs`
2. normalize grouped sessions
3. render battle sessions
4. call `rebuildEncounterFragsFromBattleLog(sessions)`

### What `rebuildEncounterFragsFromBattleLog()` changes

This function updates `window.encounters` / `localStorage.encounters` only.

It:

- clears frag state for encounter species seen in the battle-log sessions
- rebuilds per-species frag entries from `pKo` events
- marks species dead on `aiKo` events
- recalculates `prevoFragCount`
- persists the rebuilt result back to `localStorage.encounters`
- refreshes the fragsheet grid if it exists

It does **not** touch:

- `localStorage.customsets`
- the calc-side box set definitions
- imported move/item/nature data in the calc box

That is why battle-log sync updates the fragsheet but does not rewrite the calc box.

## Why battle-log sync affects fragsheet but not the calc box

This is the intended split:

- calc box is team/set data
- fragsheet is encounter/run-state data
- battle log is battle outcome data

Battle log contains outcome information such as KOs and deaths, so it maps naturally onto `encounters`.
It does not contain the same responsibility as the calc box import path, which is about full movesets and set definitions.

In practice:

- box/save import updates `customsets`, then seeds `encounters`
- battle-log sync updates `battleLogs`, then rebuilds `encounters`
- battle-log sync does not update `customsets`

So the dependency direction is:

- `customsets` can seed `encounters`
- `battleLogs` can rebuild `encounters`
- neither fragsheet edits nor battle-log sync are allowed to redefine the calc box by default

## Standalone `frags.html` compatibility

The fragsheet scripts were refactored to support both page types:

- standalone page:
  - `DOMContentLoaded` still initializes the grid/controls/battle-log UI automatically
- embedded page:
  - `main_nav.js` calls the exported init functions lazily when needed

That is why the same fragsheet/battle-log code now works in both places without splitting the logic into separate versions.

## Practical mental model

If you need to reason about a future change, use this rule:

- If it changes what mons exist in the player box or what their set data is, it belongs in `customsets`.
- If it changes encounter status, frags, deaths, met data, or run tracking, it belongs in `encounters`.
- If it changes battle session history, it belongs in `battleLogs`.

The current integration intentionally keeps those responsibilities separate so battle history can enrich run tracking without silently mutating the imported calc box.
