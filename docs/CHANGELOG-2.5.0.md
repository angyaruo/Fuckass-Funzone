# Fuckass Funzone 2.5.0 — The nine-game situation

## Changes

- Fixed Jetpack collectible coins never reaching the saved ticket wallet. Each coin emits a single immediate ticket credit in the existing frontend event callback; no end-of-run delay.
- Centralized safe best-score payouts in `src/rewards.js`: Snake 1/2, 2048 1/64, Match-3 1/400, Bird/Gabi 1/5, Simon 1/2 rounds, Duck Hunt 1/3 hits. Tickets are capped at 100,000,000.
- Match-3 power creation and activation mint real tickets: +1 each created, +2 each activated. Powered cascade clears also emit trigger events, without duplicating regular directly-triggered special events.
- Added nine-game app roster and settings tabs, including individual rule cards, saved highs, images and icon-safe SVGs.
- Added Simon Says pattern game, Duck Hunt timed target game, and Gabu's fictional-ticket three-reel slots, all pure dependency-free cores with independent canvas renderers.
- Slots pay once after landing and preserve the predetermined pending reel results through reloads; cancelling a paid spin refunds the pending stake. Free spins never mint money. The platform provides zero real-money payments or payouts.
- No change to shop reward catalog/unlocks, legacy storage key, or game-specific cosmetics.

## Build & test

- `node scripts/build.mjs` builds a self-contained `dist/frontend.js` with embedded sprites, CSS, and SVG icons.
- `node --test tests/*.test.mjs` runs the full host mock/engine suite, including the new three-game rules, milestones, slot reload/refund, and cross-mode lifecycle regression.
- No host backend privileges or network calls are added.

## Manual acceptance (real Lumiverse)

1. Open Funzone OS: nine app icons show in a three-by-three launcher; game-specific drawer radio tabs include Simon, Duck and Slots. On narrow devices the launcher and settings remain usable and scroll as appropriate.
2. Gabi Jetpack: collect one airborne coin and watch the **top ticket wallet** increase +1 immediately, without dying. Crash and reopen: coin credit remains. Score milestones still grant tickets.
3. Snake: eat snacks; newly exceeded best counts pay 1 ticket every 2. Restart below old best: no duplicate score payout.
4. 2048: earn score and watch wallet pay each new 64-point best milestone. Undo/replay the same score: no duplicate payouts. Reload and continue.
5. Trinket Panic: create a four-match rocket (+1), activate it (+2), trigger powered cascades (+2 each); score best thresholds still reward tickets. Test 6/7/8-column saves and NO MOVES state.
6. Simon: start, watch the complete pattern before the pads unlock, repeat with touch and keyboard digits 1–4, observe sequence growth, die on an incorrect note, reopen a paused round.
7. Duck Hunt: moving ducks, touch targeting, 45-second countdown, misses, and reload pause. Verify hits and 3-hit best milestones grant tickets.
8. Slots: FREE / 1 / 3 / 5 toggles, independent wager styling, real reel symbols, winning pairs/triples. FREE never changes wallet. Paid stake debits once, lands with 0 or a multiplier payout. Test pausing via phone, unloading in mid-spin, and restarting for an exact pending-stake refund.
9. Switch between all nine games while model generation events start, stop, and finish; sound, safe reloads, hide, reduced-motion, and shop balances should remain stable. Try narrow viewport and resizing for clipping.

## Compatibility

Unchanged `fuckass_funzone:v1:<extensionInstallationId>` localStorage namespace. New `puzzles.simon`, `puzzles.duck`, `puzzles.slots`, and `slotStake` are additive, no migration required. Keep original `spindle.json` identifier. All editable source and tests are included in the cumulative ZIP.
