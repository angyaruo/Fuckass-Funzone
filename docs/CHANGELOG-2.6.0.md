# Fuckass Funzone 2.6.0 — Arcade difficulty settings

## What's new

- **Trinket Panic** has four timer modes: untimed Zen, 60s Sprint, 120s Arcade, and 180s Relaxed. Time runs down only during active play, is paused when the game pauses, restores from its saved clock, and ends with a TIME’S UP overlay. NO MOVES LEFT is still a separate loss.
- **Duck Hunt** has untimed Free hunt, 30s Sprint, 45s Classic, 60s Relaxed and 90s Marathon. The original 45s physics stay the default. Untimed removes the clock deadline but retains the eight-miss limit.
- **Duck speed** is independent of the timer: Chill (72% flight speed and longer spawn intervals), Normal (original flight speed and spawn timing), Chaos (148% flight speed, shorter spawn intervals). Difficulty modifies actual duck motion and spawn timing, not only menu labels.
- Each game has its own **persistent preferences**. A configuration change takes effect when the player begins a new board/hunt; it does not mutate an ongoing saved run. Mode switching and reload preserve active round timing/speed. Previous save snapshots without the new fields restore compatibly.
- **Custom sidebar/chat launcher icon:** `assets/funzone/arcade-tab.svg`, exactly from the user's supplied artwork, embedded via Spindle `registerDrawerTab({iconSvg})` and `registerInputBarAction({iconSvg})`. Its XML is validated at build time.
- No changes to existing ticket milestone formulas, cosmetic shop inventory, 2048/Snake/Simon/Plinko/Slots, match grid widths, hint behavior, or installation identifier.

## Acceptance checklist

1. Open **Drawer → Trinket Panic**. Select **Sprint (60s)** and restart. The board's lower HUD shows the countdown, stops when paused, and displays TIME’S UP when it expires. Untimed Zen never reaches TIME’S UP. Existing no-moves failure still displays NO MOVES LEFT.
2. Switch between **6/7/8 columns** while timed. Existing in-progress boards retain their remaining time. A new board uses the currently selected timer preference.
3. Open **Drawer → Duck Hunt**. Select 90s/Chaos and restart the hunt. Ducks should fly faster and appear more frequently than Normal, and the scoreboard should begin at 90s. Chill should visibly slow both. Try untimed and confirm it says OPEN and does not expire; eight misses still end it.
4. Pause either game, visit Funzone OS, switch games, reload the extension, and resume. Remaining clock/duck speed must not silently reset. Changing preferences should not silently erase the current progress.
5. Verify the new **arcade machine SVG** is used on both Lumiverse's drawer tab and chat action; not the generic Extensions icon.
6. Run `node scripts/build.mjs` and `node --test tests/*.test.mjs` from `repo/`; tests cover real engine state, renderer labels, preset persistence, mock host icon options and game switching.

## Compatibility

No data migration. Uses the existing `fuckass_funzone:v1:<extensionInstallationId>` localStorage key. Adds `matchTimerSeconds`, `duckTimerSeconds`, `duckSpeed` to the same save envelope, plus `timerSeconds`, `timeLeft`, and end-reason state in the matching game snapshots. The full editable tree and rebuilt browser bundle ship together in the cumulative ZIP.
