# Fuckass Funzone 2.6.2 — First-Frame HUD + No-Mercy Flight

## Fixed: first-launch Bird/Gabi score alignment

The flight renderer used `textAlign` from the existing shared canvas, so a renderer that left `center` active could displace **SCORE** and **BEST** left when entering Fuckass Bird or Jetpack Gabi. The flight HUD now sets `ctx.textAlign = 'left'` unconditionally before painting both counters. The game-over overlay is no longer necessary to correct alignment. A mock renderer test starts the canvas in the wrong state to reproduce the bug and checks both flight modes across multiple playing frames.

## Flight balance: existing hardest mode becomes Medium; true Hard added

| Tier | Movement multiplier | Obstacle geometry | Lives |
| --- | ---: | --- | --- |
| Chill | 0.83× | Widest gaps / most spaced obstacles | Bird 1 / Gabi 3 |
| Normal | 1.00× | Baseline | Bird 1 / Gabi 3 |
| Medium (former Chaos) | 1.28× | **Identical** to v2.6.1 Chaos | Bird 1 / Gabi 3 |
| Hard (no mercy) | 1.90× | Considerably narrower gaps and tighter obstacle spacing; reachable altitude deltas | **Bird 1 / Gabi 1** |

Movement accelerates smoothly with score and distance as before, to a maximum of 1.72× the selected tier's base speed. A Hard-only clamp limits changes in successive obstacle altitude (70 px Bird / 90 px Gabi) to avoid random, physically impossible jumps at the much higher traversal speed. It does not soften the increased speed, narrow gaps, or reduced horizontal spacing.

Settings remain shared between Bird and Jetpack, appear in both game pages, and apply on the **next reset/new run** rather than interrupting live gameplay. Older saved flight preference `chaos` is interpreted as `medium` (same 1.28× physics). All scores, wallet coins/tickets, shop items, and other saved games stay in the original localStorage namespace. Duck Hunt's separate `chaos` speed remains untouched.

## Files and safety

- Edited engine, frontend, lifecycle/render/engine tests, package/Spindle version, build banner and docs.
- Previous original files are backed up at `docs/backups-pre-2.6.2/`; original source checksums and updated file checksums are recorded in `docs/UPDATE-MANIFEST-2.6.2.json`.
- Includes the entire cumulative installable extension at `fuckass_funzone/repo/`, including all assets and the rebuilt embedded frontend.
- `node scripts/build.mjs` and `node --test tests/*.test.mjs` succeed, **91/91 tests**. The release ZIP is independently extracted, rebuilt and tested. Live Lumiverse screenshots were not available; verify actual mobile and desktop pixels on device.

Install by backing up your existing `data/extensions/fuckass_funzone`, then overlaying the complete `fuckass_funzone/repo/` directory. Reload/re-enable the extension. No save migration needed.
