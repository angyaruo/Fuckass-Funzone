# Fuckass Funzone 2.6.3 — Gabi's Jetpack Faces

## Gabi flight animation: idle and thrust have separate expressions

Regular flight now uses only **`gabi_fly_0`, `gabi_fly_1`, `gabi_fly_2`** in a three-frame 9fps loop. The other three frames are reserved for active thrust, with the face determined by the duration of the current press:

| Input state | Sprite |
| --- | --- |
| Normal flight, not pressing | `gabi_fly_0`–`gabi_fly_2` |
| First 0–119ms of pressing | `gabi_fly_3` |
| 120–299ms held | `gabi_fly_4` |
| 300ms or more held | `gabi_fly_5` |
| After release | Last thrust face for up to 160ms; then calm loop |

The 160ms release hold makes quick taps visible even when a press and release both happen between two animation frames. The hold clock counts simulation time only while the game is playing, resets on a fresh press, and is independent of mouse/touch/keyboard input repetition. Pausing, dying, or resetting removes the pending reaction. `reduceMotion` keeps the regular flight sprite at 0 while retaining the thrust expression as an actionable visual cue. The extra jet flame still appears only while actually holding thrust.

**No changes** to the existing sprite PNGs, input methods, thrust physics, difficulty tiers, collision rules, coin rewards, saved balances, HUD, other games, or storage namespace. Fuckass Bird retains its existing six-frame cycle.

## Files changed

- `src/engine.js`: deterministic thrust-held time, release expression, and single-source `gabiFlightFrame` selector.
- `src/frontend.js`: use the shared selector for Gabi instead of cycling all six sprites regardless of input.
- `scripts/build.mjs`: update the exact engine import/build anchor and the release banner.
- `tests/engine.test.mjs`, `tests/rendering.test.mjs`: tests for calm-only idle, three hold durations, repeated input, reduced motion, sub-frame taps, release decay, pause/death/reset, and real canvas image choice.
- `spindle.json`, `package.json`, `README.md`, `docs/TESTING.md`: release metadata and instructions.
- `dist/frontend.js`: rebuilt self-contained Spindle frontend with the change and all 71 PNG/SVG assets embedded.

Original versions of every edited source/config/doc/test are retained at `docs/backups-pre-2.6.3/`. The update manifest lists changed files and their checksums. All historical docs/tests/assets are present in the full cumulative ZIP.

## Verification

- `node scripts/build.mjs` builds successfully.
- `node --test tests/*.test.mjs`: **94/94 passed** (includes the existing mock Lumiverse host integration).
- The final release ZIP is independently extracted and rebuilt/retested in a clean folder before delivery.
- Live Lumiverse and real device visual QA are not available here, so verify the feel on desktop and mobile after upgrading.

Install by backing up the existing extension folder, then overlay `fuckass_funzone/repo/` from this ZIP on the same path and reload/re-enable the extension. Existing localStorage data is compatible with no migration.
