# Fuckass Funzone 2.6.1 — Remove debug wallet grants

- Removed the `+500 COINS` button from the Prize Counter and Arcade behavior settings.
- Deleted the `addDebugTickets` function, the `window.__funzoneAddCoins` global dev shortcut, and their unused CSS styles.
- The live wallet balance still displays in the header and Prize Counter. Normal ticket rewards, purchases, wager payouts, and saves are unaffected.
- Kept the previous v2.6.0 Match-3 timers, Duck Hunt time/speed modes, custom arcade icon, and all prior functionality.
- Added real mock-host UI regression checks for both cheat buttons, global shortcut absence, and a seeded 250-ticket wallet.
- No storage migration: same installation ID and `fuckass_funzone:v1:<extensionInstallationId>` storage namespace.

## Verification

From the `repo` folder, run `node scripts/build.mjs` and `node --test tests/*.test.mjs`. Open the drawer (Arcade behavior) and Prize Counter to confirm the test grant controls are absent. Try earning a coin normally or buying an item to confirm the live wallet still updates.
