# Adding Games From `backup_data` JS Files

Use this note when adding a new romhack/game from a `backup_data` JavaScript file, such as `aetherwhite.js` or `wishywashy.js`.

This is also a contributor guide for merge requests: if you have your own generated `backup_data` file, follow the same checklist and include the copied `backups/<slug>.js` file plus the calc wiring in one MR.

## Before Opening A Merge Request

- Choose a short lowercase slug for the game, for example `wishywashy`.
- Confirm the file is safe to commit and does not contain private local paths, save files, secrets, or personal notes.
- Confirm it assigns a global `backup_data` object. The calc loads these files as browser scripts, not as modules.
- Make sure `backup_data.title` is the exact title users should see in the calc.
- Know the requested settings before wiring the game:
  - base ROM/save reader, such as White 2/BW2, Platinum, HGSS, GBA, etc.
  - damage generation
  - type chart
  - crit generation
  - switch preview behavior
  - whether Dex should show
  - whether AI info should show
  - any special mode flags, such as challenge mode or EV/no-EV variants
- Keep the MR focused on one game unless the games intentionally share one settings helper.

## Quick Checklist

1. Confirm the source file exists and defines `backup_data`.
   - For agent work, it often lives one directory above the calc repo, for example `../newgame.js`.
   - For contributor work, place or copy it into `backups/<slug>.js` as part of the MR.
   - Read only the header/title and any fields needed for the request; these files are large.
2. Copy the source into `backups/<slug>.js`.
   - Keep the file as a global script assigning `backup_data = ...`.
   - If the embedded `backup_data.title` is not the desired display title, patch only that title.
   - Do not reformat the whole data file; that creates noisy diffs.
3. Register the title and slug in `backups/title_to_backup_mappings.js`.
   - Add `backupFiles["Display Title"] = "<slug>"`.
   - Add `sourceTitleAliases["<slug>"] = "Display Title"` when `data=<slug>` should resolve immediately from URL/catalog links.
4. Add the game to `js/romhack_catalog.js`.
   - Create a stable kebab-case game id.
   - Set `title`, `sourceTitle`, and one or more variants.
   - Use a URL like `https://hzla.github.io/Dynamic-Calc-Decomps/?data=<slug>&...`.
   - Add the game id to the appropriate section. Use `sortGames: "alphabetical"` sections when available instead of hand-ordering.
5. Add the same link to the legacy selector in `index.html`.
   - Also bump the cache query strings for `js/romhack_catalog.js` and `backups/title_to_backup_mappings.js` in `index.html`.
   - The legacy selector is still used, so do not skip it just because the catalog modal exists.
6. Add or reuse a `setGameSettings(title)` branch in `js/initialize.js`.
   - Match the requested mechanics/settings, not necessarily the displayed generation in the URL.
   - Common fields:
     - `gameGen`
     - `settings.damageGen`
     - `settings.gameSwitchIn`
     - `settings.switchIn` when switch preview is enabled
     - `settings.sourceType = "full"` for normal `backup_data.formatted_sets`
     - `settings.typeChart`
     - `settings.critGen`
     - `save_expansion`
     - `showDex`
     - `showAI`
7. Confirm save-reader behavior.
   - `setBaseGame(title)` infers DS readers from title text:
     - Titles containing `Platinum` -> `Pt`
     - Titles containing `Gold` or `Silver` -> `HGSS`
     - Titles containing `Black` or `White` -> `BW`
     - Titles containing `Black 2` or `White 2` -> `baseVersion = "BW2"`
   - If a title does not naturally include the needed base game text, add an explicit title check.
8. Wire optional feature defaults only when requested.
   - Dex visibility is controlled by `showDex`; only add `dexGameIdsByTitle` in `js/calc_ui/dex.js` if there is a real Dex target.
   - Switch AI info defaults use `getDefaultSwitchAiInfoEnabled`, `canUseSwitchAiInfoForTitle`, and `shouldShowSwitchAiInfo`.
   - Prefer a small title allowlist/helper for related games over duplicating settings branches.
9. Add focused Cypress coverage.
   - Put small config smoke tests under `cypress/e2e/calc-ui/`.
   - Assert title, key settings, save-reader globals, Dex visibility, AI visibility/defaults, and `backup_data.title`.
   - For async backup scripts, wait on `cy.window().its('backup_data.title').should('eq', title)` before asserting loaded data.
10. Verify.
   - Run `node --check` on changed JS/test files.
   - Run the focused Cypress spec, for example:
     - `npx cypress run --spec cypress/e2e/calc-ui/aetherWhite.cy.js`

## MR Checklist For Contributors

Include these in the merge request description:

- Game title and slug.
- Base ROM and save-reader expectation.
- URL tested, for example `index.html?data=<slug>&gen=8&types=5`.
- Settings copied from another existing game, if applicable, and any intentional differences.
- Whether Dex is expected to show.
- Whether AI info or switch preview is expected to show.
- Test command run and result.

Expected changed files for a normal one-game MR:

- `backups/<slug>.js`
- `backups/title_to_backup_mappings.js`
- `js/romhack_catalog.js`
- `index.html`
- `js/initialize.js`
- one focused Cypress spec, or an existing config spec extended for the new game

Only add other files when the game truly needs special mechanics, save parsing, Dex integration, sprites, mastersheet data, or UI behavior.

## White 2 Base Rom Pattern

Aether White 2 and Wishy Washy White 2 share a White 2 base-rom path:

- Data URLs use `gen=8&types=5`.
- Runtime settings use Gen 5 mechanics/switching:
  - `gameGen = 5`
  - `settings.damageGen = 5`
  - `settings.gameSwitchIn = 5`
  - `settings.switchIn = 5` when switch preview is enabled
  - `settings.sourceType = "full"`
  - `settings.typeChart = 5`
  - `settings.critGen = 5`
  - `save_expansion = false`
  - `showDex = false`
  - `showAI = true`
- Title text includes `White 2`, so the existing DS save-reader detection sets `baseGame = "BW"` and `baseVersion = "BW2"`.
- Gen 5 switch AI info is allowed/defaulted through the White 2 base-rom title helper in `initialize.js`.

## Safety Notes

- Check `git status --short` before editing. Do not revert unrelated dirty files.
- Do not edit large `backups/**` data manually beyond copying the new source and, if needed, changing the title.
- Keep cache-busting query strings simple and intentional; they just need to change when referenced scripts change.
- If a user requests settings copied from another game, inspect that existing branch and copy behavior deliberately, then apply only the requested differences.
- In a merge request, avoid drive-by cleanup or formatting churn. Reviewers should be able to see the game addition clearly.
