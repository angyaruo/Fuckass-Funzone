# Fuckass Funzone · Arcade Intermission

**v2.3.3 — Gabu's Pity Hints.** A frontend-only, self-contained Lumiverse Spindle arcade. The extension installation ID is still `bird_brain` and the localStorage key is still `bird_brain:v1:<extensionInstallationId>`. Six games, one draggable widget, zero emoji/ASCII icons.

## What's new: Match-3 hint, dead boards, and width difficulty

**Pity hint.** After **4 seconds without input** in a running Match-3 game, two neighboring pieces receive mint SVG sparkles and a softly pulsing outline. This is a *real legal swap* returned by the same solver used to detect unsolvable boards; it never invents a match. Tap, drag, or keyboard input dismisses the hint until you go idle again. Hints do not animate while paused, in reduced-motion mode, or after game over.

**Actual no-moves state.** A board with no available adjacent match or valid powered swap becomes **NO MOVES LEFT**, with a prominent overlay and a **New Board** action in the bottom control strip. No automatic reshuffle hides the failure. Game-over status survives saving/reloading and opening Funzone OS. A deliberately pathological cascade remains bounded, using the existing emergency board rebuild safeguard.

**Three board widths, seven rows:** **Cozy 6×7**, **Classic 7×7**, and **Busy 8×7**. Switch using the compact **6 COL / 7 COL / 8 COL** control below the Match-3 board or via **Drawer → Trinket Panic width**. Each width keeps its own independently saved board/score/moves/specials; changing width does not erase the Classic game. All touch bounds, keyboard coordinates, match scanning, gravity, rockets, bombs, and spawn rules scale with the selected width. The official best score and ticket milestones remain shared across board widths, as before.

The existing 7×7 save format remains compatible, including snapshots that predate the new `width` field. New saves add `match3Width` and `match3Boards` under the *same* localStorage key; no installation reconfiguration or migration step is needed. A self-contained hint SVG is bundled at `assets/match3/vector/hint.svg` and embedded into the extension, with a canvas-vector fallback. The old PNGs remain available for normal trinkets if SVG decoding fails. All current games and the Plinko physics are unchanged.

See `docs/match3-v2.3.3-hints-and-widths-preview.png` for a **reference composition made from the actual SVG trinket assets**, not a live browser screenshot. The reproducible optional preview script is `scripts/make_match3_hint_preview.py` (Pillow/CairoSVG only for QA, not runtime). Open `demo-match3-qa.html` for the local mock-host game UI. Live Lumiverse mobile/desktop verification is still recommended.

## Installation / update

1. Back up your existing `data/extensions/bird_brain` folder and any locally edited source.
2. **Full ZIP:** extract so the final file is `data/extensions/bird_brain/repo/spindle.json`.
3. **v2.3.2 overlay ZIP:** extract *over* `data/extensions/`, preserving the ZIP's `bird_brain/repo/` path. This contains only changed/new files and does not duplicate the whole extension.
4. Unload/re-enable Fuckass Funzone in Spindle, or re-import locally if required. Browser reload may be needed to replace the prior embedded bundle.

## The games

| Game | Controls | Saved progress |
| --- | --- | --- |
| Fuckass Bird | Tap, Space, or Up to flap | Best score |
| Gabi Jetpack | Hold to thrust; dodge buildings | Best score, record building landmark |
| Snake | Swipe or Arrows/WASD; six snack variants | Board, food, score, length |
| 2048 | Swipe or Arrows/WASD; Z, Backspace or Undo | Board, score, best |
| Gabu's Trinket Panic | Tap two adjacent pieces or drag; Arrow/WASD + Enter/Space; 4s idle hint | Separate Cozy/Classic/Busy boards, scores, moves, powers |
| Plinko | Choose a fictional-ticket wager or free practice, then Drop | Best payout, ticket balance, paused ball/history |

The **Funzone OS** phone picker opens all six games without a separate window. The floating widget reacts to model generation start/end/stop events but never reads prompts or model output. The arcade continues running when a response finishes. Gabu's short event-driven commentary can be disabled in drawer settings. Visual decorations use bundled SVG and PNG assets, not emoji/ASCII substitutes or icon fonts.

Plinko's tickets are fictional and local-only: no purchasing, cash-out, or real-money gambling. Its collision, probability tuning and wallet settlement are unchanged in this version. The v2.3.2 miniature luxury cabinet, monocled Gabu host, and payout-bin lighting remain intact.

## Editable source

- `src/match3.js` — width-aware 7-row match engine, legal-move solver, hint timer, no-moves detection, specials, cascades and saves.
- `src/match3-render.js` — centered board geometry, SVG pieces, hint highlights, no-moves overlay, exact hitboxes.
- `src/frontend.js` and `src/style.css` — Spindle host, player input, drawer and compact width selector, per-width save bank.
- `src/reactions.js` — Gabu's commentary, including a prioritized no-moves reaction.
- `src/plinko.js`, `src/plinko-render.js` — existing fictional-ticket Plinko and tiny cabinet visuals.
- `src/engine.js`, `src/puzzles.js`, `src/puzzle-render.js` — Bird, Jetpack, Snake and 2048.
- `assets/` — all original art, SVG/PNG pieces and standalone mascot sprites.
- `scripts/build.mjs` — guarded zero-dependency bundler that embeds assets and styles into `dist/frontend.js`.
- `tests/` — existing games, mocked Spindle lifecycle, phone picker, save compatibility, icon-policy checks and new Match-3 hint/width/no-moves regressions.
- `docs/backups-2.3.3/` — source copies before this update; `docs/UPDATE-MANIFEST-2.3.3.json` lists the changes and file hashes.

Rebuild/test without external dependencies:

```bash
node scripts/build.mjs
node --test tests/*.test.mjs
```

**Validation:** 65 / 65 automated tests pass against the source. The full ZIP and overlay are also independently extracted, rebuilt and tested before release. A live Lumiverse screenshot could not be captured in this container; the offline visual preview is for checking geometry/art direction, not a claim about host pixels.

**Current limits:** Match-3 remains endless, not a timed Blitz mode. Piece swaps and gravity resolve instantly rather than using fully tweened animation. Cosmetic unlocks and achievements are future work.
