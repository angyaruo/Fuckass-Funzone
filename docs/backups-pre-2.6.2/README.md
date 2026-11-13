# Fuckass Funzone · Arcade Intermission

**v2.6.1 — Production wallet cleanup (v2.6.0 difficulty & timer modes retained).** A frontend-only, self-contained Lumiverse Spindle arcade. Installation ID remains `fuckass_funzone` and storage remains `fuckass_funzone:v1:<extensionInstallationId>`. **Nine games**, one floating widget, one shared fictional-ticket wallet, and no runtime network requests or real-money purchases.

## New in v2.6.1: Retire the test-money printer

Removed both +500 COINS buttons (Prize Counter and Arcade behavior settings), the debugging wallet grant function, its global shortcut, and unused CSS. The real wallet, earned coins, wagers, purchases, saved balances, and v2.6.0 timer/speed settings are unchanged. No save migration is needed.

## New in v2.6.0: Difficulty, timed challenges & custom arcade icon

- **Trinket Panic:** timer choices **Zen / untimed (default), Sprint / 60 seconds, Arcade / 120 seconds, Relaxed / 180 seconds**. The canvas shows the remaining clock and a distinct **TIME’S UP!** loss when a timed board expires, separate from **NO MOVES LEFT**. Hints, 6/7/8-column boards, specials, and score rewards remain unchanged.
- **Duck Hunt:** **Free hunt / untimed, Sprint / 30 seconds, Classic / 45 seconds (default), Relaxed / 60 seconds, Marathon / 90 seconds**. Eight missed shots still end every hunt, including unlimited-time hunts. The clock explicitly shows **OPEN** when untimed, and time-based losses show the selected duration.
- **Duck speed:** **Chill** lowers flight speed and spawn frequency, **Normal** preserves the original physics, **Chaos** increases flight speed and spawn frequency. Speed/timer preferences persist separately from the current saved hunt.
- Preferences live under the **Trinket Panic** and **Duck Hunt** game settings tabs. Changing them does **not erase the board or restart an active run**. Press **Restart / New Board**, or launch the next hunt, to use new choices. Pausing, switching modes, hiding the cabinet, and restoring saved rounds preserve the active clock and selected physics.
- **Sidebar & chat launcher:** uses the user-supplied 32×32 arcade-machine SVG through Spindle's supported `iconSvg` option. `scripts/build.mjs` validates and embeds the standalone `assets/funzone/arcade-tab.svg` without external URLs.
- Includes the **full cumulative editable tree** (sources, scripts, tests, docs, assets and built `dist/frontend.js`) and a new regression suite. Installation identifier and `fuckass_funzone:v1:` storage namespace have **not changed**. No backend access or network permissions added.

**Installation:** extract the full ZIP with its canonical `fuckass_funzone/repo/` paths preserved into `data/extensions/`, then reload/re-enable the extension. Keep a backup of your previous extension folder. Run `node scripts/build.mjs` and `node --test tests/*.test.mjs` if you want to rebuild/test locally. See `docs/CHANGELOG-2.6.1.md` and `docs/UPDATE-MANIFEST-2.6.1.json` (and the preserved v2.6.0 history).

## Previous release, v2.5.0: An unreasonably large arcade

- **Jetpack wallet fix:** collectible Gabi coins are credited **immediately on collection** (+1 ticket each), rather than being trapped in the run-only HUD. Score milestones still pay independently. Wallet and save update without waiting for death or restart.
- **Snake:** +1 ticket per 2 snacks above the previously saved personal best; **2048:** +1 per 64 new personal-best score points; **Trinket Panic:** +1 per created special, +2 per triggered special (including powered cascades), plus +1 per 400 new best-score points. Score milestone rewards are only credited above the historical personal best; undo/replay cannot mint the same milestone twice. These are additive to existing Plinko/Bird/Jetpack milestone rules.
- **Simon Says:** four touch/number-key pads, genuine timed sequence playback, escalating patterns, game-over on an incorrect note, +1 ticket per 2 new best rounds.
- **Duck Hunt:** independently flying vector ducks, tap-to-shoot hit detection, 45-second rounds, eight allowed misses, +1 ticket per 3 new personal-best hits. It is an original mini-game, not a bundled ROM.
- **Gabu Slots:** three symbol reels, weighted symbols, fictional-ticket bets of FREE / 1 / 3 / 5, pair payout 1×, triple payouts 3–40×, and animated spins. Practice is always available; free spins cannot award tickets. Stakes are deducted on spin, winning proceeds are credited **once when reels settle**. In-flight paid results are snapshotted and resume after mode changes or reloads; cancelling a spin refunds its stake. No cash value, payments, or external gambling service.
- Three vector app icons, individual radio-style drawer instruction pages, new best-score rows, persistent game state, and game-specific Gabu remarks. The nine-app phone page scrolls within the widget.

**Installing:** this is a **full cumulative source archive**, not a partial file overlay. Back up your existing extension, then extract preserving `fuckass_funzone/repo/` into `data/extensions/`, and unload/re-enable the extension. Existing `v1` localStorage saves, shop unlocks, other game boards, and settings are preserved. Rebuild from source with `node scripts/build.mjs`; run all harness tests with `node --test tests/*.test.mjs`.

**QA:** `docs/CHANGELOG-2.5.0.md` includes a practical acceptance checklist. Automated tests include real bundle/Spindle-host mocks, rendering paths, wallet milestones, pending-slot-resume, and new game rules. Live Lumiverse/mobile screenshots were not available in this sandbox, so visual QA on device remains recommended.

## New in v2.4.1: Shop Window Containment

The Prize Counter now uses a **bounded floating layout** (max 605px tall, also capped to the viewport). The nine reward cards scroll inside a dedicated, keyboard-focusable **Prize catalog** region, while the OS back control, Gabu shop hero, wallet balance, category filters, and purchase-status message remain in view. No more giant floating window extending below the desktop. Filter changes or reopening the shop reset the catalog scroll position. Small-height viewports receive a shorter Gabu hero to maximize catalog space.

No economy, game rules, unlocks, or saved data changed. **From v2.4.0**, extract the v2.4.1 update overlay over `data/extensions/`, or install the full cumulative ZIP. Unload and re-enable the extension.

## New in v2.4.0: The Prize Counter

The **Funzone OS** launcher now includes a **Prize Counter** tile; you can also tap the ticket wallet in the floating HUD to open the store directly. Everything is entirely local: there are **no payments, no real-money purchases, no odds-based unlocks, no cash-out**, and no network calls. Tickets are the same points you already earn in the six existing games, including Plinko's fictional payouts. Your previous balance and saves remain intact under the same installation ID and localStorage key.

The shop offers **nine permanent cosmetic rewards**, with a live wallet balance and category filters: 

- **Cabinet:** Midnight Mint (35), Cherry Afterhours (55), The House Royale (95). Changes the actual floating arcade frame, controls, phone launcher and accent colors.
- **Snake:** Mint Noodle (22), Sunset Noodle (38). Changes Snake's continuous ribbon, glints and tail without altering the animal's movement.
- **Plinko:** Aqua Comet (28), Gilded Descent (48). Changes the falling-chip trail and nothing about the game physics, prize multipliers, or odds.
- **2048:** Sea-Glass (30), Sugar Rush (42). Changes the real game tile palette; numbers and merge rules are unchanged.

Purchases deduct the exact listed ticket price once; rewards become permanently owned and are automatically equipped. After that the button reads **EQUIP** or **EQUIPPED**, and switching skins costs nothing. To use an original look again, open its category and press **USE ORIGINAL LOOK**. Your currently equipped cosmetic and all owned rewards persist in an additive `shop` field, validated against the built-in catalog. Existing high scores and game boards are neither reset nor migrated.

A new `src/shop.js` implements a standalone, regression-tested economy and inventory. The game renderers receive only the equipped visual identifier; purchases never modify gameplay rules. The shop UI uses bundled transparent PNG/SVG icons (no emoji or ASCII control glyphs). Open `demo-shop-qa.html` for the mock-host shop preview; actual Lumiverse/mobile visual validation is still recommended.

**Installation:** Back up `data/extensions/fuckass_funzone`, extract the full archive into `data/extensions/`, then unload and re-enable the extension. The in-archive installation root is `fuckass_funzone/repo/`. Both archive paths are independently rebuilt and tested after extraction.

## Previous release: Sidebar redesign in v2.3.5

The drawer keeps one **Funzone OS** launcher card, followed by a separate, compact **Arcade behavior** section and a labeled **GAMES** selector. Originally six illustrated **radio-style, accessible tabs** (3 across at the normal drawer width) switch one settings/help panel beneath them. No tower of accordion sections, no redundant cover, no duplicate launch buttons. Keyboard navigation supports Arrow keys, Home, and End. The active tab alone has `aria-selected="true"`; inactive panels are hidden.

The Match-3 / Trinket Panic app, sidebar and personal-best icon now use the **new charcoal cat SVG** (`match_vec_cat`) that matches the game board, replacing the obsolete purple PNG icon. The normal game art is unchanged. Match-3's illustrated guide still explains **3-piece clears, 4-match row/column rockets, 5-match or cross Gabu bombs**, and the **NO MOVES LEFT** state. Its board widths, per-width saves and configurable hint timing (Off, 8, 12 or 20 seconds; default 12) are preserved, as are all other game controls.

The change is presentation-only; no game physics, tickets, saves or reward logic changed. There is a local mock-host QA page at `demo-drawer-qa.html`. A real Lumiverse screenshot remains the final visual check.

## Previously: Match-3 hint, dead boards, and width difficulty (v2.3.3)

**Pity hint.** After the configured idle delay (**12 seconds by default**) in a running Match-3 game, two neighboring pieces receive mint SVG sparkles and a softly pulsing outline. This is a *real legal swap* returned by the same solver used to detect unsolvable boards; it never invents a match. Tap, drag, or keyboard input dismisses the hint until you go idle again. Hints do not animate while paused, in reduced-motion mode, or after game over.

**Actual no-moves state.** A board with no available adjacent match or valid powered swap becomes **NO MOVES LEFT**, with a prominent overlay and a **New Board** action in the bottom control strip. No automatic reshuffle hides the failure. Game-over status survives saving/reloading and opening Funzone OS. A deliberately pathological cascade remains bounded, using the existing emergency board rebuild safeguard.

**Three board widths, seven rows:** **Cozy 6×7**, **Classic 7×7**, and **Busy 8×7**. Switch using the compact **6 COL / 7 COL / 8 COL** control below the Match-3 board or via **Drawer → Trinket Panic settings**. Each width keeps its own independently saved board/score/moves/specials; changing width does not erase the Classic game. All touch bounds, keyboard coordinates, match scanning, gravity, rockets, bombs, and spawn rules scale with the selected width. The official best score and ticket milestones remain shared across board widths, as before.

The existing 7×7 save format remains compatible, including snapshots that predate the new `width` field. New saves add `match3Width` and `match3Boards` under the *same* localStorage key; no installation reconfiguration or migration step is needed. A self-contained hint SVG is bundled at `assets/match3/vector/hint.svg` and embedded into the extension, with a canvas-vector fallback. The old PNGs remain available for normal trinkets if SVG decoding fails. All current games and the Plinko physics are unchanged.

See `docs/match3-v2.3.3-hints-and-widths-preview.png` for a **reference composition made from the actual SVG trinket assets**, not a live browser screenshot. The reproducible optional preview script is `scripts/make_match3_hint_preview.py` (Pillow/CairoSVG only for QA, not runtime). Open `demo-match3-qa.html` for the local mock-host game UI. Live Lumiverse mobile/desktop verification is still recommended.

## Installation / update

1. Back up your existing `data/extensions/fuckass_funzone` folder and any locally edited source.
2. **Full ZIP:** extract so the final file is `data/extensions/fuckass_funzone/repo/spindle.json`.
3. Extract preserving the ZIP's `fuckass_funzone/repo/` path. This contains the complete editable source and rebuilt `dist/frontend.js`.
4. Unload/re-enable Fuckass Funzone in Spindle, or re-import locally if required. Browser reload may be needed to replace the prior embedded bundle.

## The games

| Game | Controls | Saved progress |
| --- | --- | --- |
| Fuckass Bird | Tap, Space, or Up to flap | Best score |
| Gabi Jetpack | Hold to thrust; dodge buildings | Best score, record building landmark |
| Snake | Swipe or Arrows/WASD; six snack variants | Board, food, score, length |
| 2048 | Swipe or Arrows/WASD; Z, Backspace or Undo | Board, score, best |
| Gabu's Trinket Panic | Tap two adjacent pieces or drag; Arrow/WASD + Enter/Space; configurable idle hint | Separate Cozy/Classic/Busy boards, scores, moves, powers |
| Plinko | Choose a fictional-ticket wager or free practice, then Drop | Best payout, ticket balance, paused ball/history |
| Simon Says | Four color pads or keys 1–4 | Growing sequence, best cleared round |
| Duck Hunt | Tap/click moving ducks | Hit count, timer, misses |
| Gabu Slots | Tap/Space to spin, select FREE / 1 / 3 / 5 stake | Paid pending reel outcome, spins, best payout |

The **Funzone OS** phone picker opens all nine games without a separate window. The floating widget reacts to model generation start/end/stop events but never reads prompts or model output. The arcade continues running when a response finishes. Gabu's short event-driven commentary can be disabled in drawer settings. Visual decorations use bundled SVG and PNG assets, not emoji/ASCII substitutes or icon fonts.

Plinko's tickets are fictional and local-only: no purchasing, cash-out, or real-money gambling. Its collision, probability tuning and wallet settlement are unchanged in this version. The v2.3.2 miniature luxury cabinet, monocled Gabu host, and payout-bin lighting remain intact.

## Editable source

- `src/rewards.js` — shared, clamped ticket-credit and personal-best milestones.
- `src/mini-games.js`, `src/mini-games-render.js` — Simon, Duck Hunt, fictional-ticket Slots with saveable results and standalone vector renderers.
- `src/match3.js` — width-aware 7-row match engine, legal-move solver, hint timer, no-moves detection, specials, cascades and saves.
- `src/match3-render.js` — centered board geometry, SVG pieces, hint highlights, no-moves overlay, exact hitboxes.
- `src/frontend.js` and `src/style.css` — Spindle host, player input, game settings tabs, configurable hint-delay selector and width selector, per-width save bank.
- `src/reactions.js` — Gabu's commentary, including a prioritized no-moves reaction.
- `src/plinko.js`, `src/plinko-render.js` — existing fictional-ticket Plinko and tiny cabinet visuals.
- `src/engine.js`, `src/puzzles.js`, `src/puzzle-render.js` — Bird, Jetpack, Snake and 2048.
- `assets/` — all original art, SVG/PNG pieces and standalone mascot sprites.
- `scripts/build.mjs` — guarded zero-dependency bundler that embeds assets and styles into `dist/frontend.js`.
- `tests/` — existing games, mocked Spindle lifecycle, phone picker, save compatibility, icon-policy checks and new Match-3 hint/width/no-moves regressions.
- `docs/backups-2.3.5/` — pre-edit source backups; `docs/UPDATE-MANIFEST-2.3.5.json` lists changed file hashes.

Rebuild/test without external dependencies:

```bash
node scripts/build.mjs
node --test tests/*.test.mjs
```

**Validation:** Automated tests pass against the source. The full ZIP and overlay are also independently extracted, rebuilt and tested before release. A live Lumiverse screenshot could not be captured in this container; the offline visual preview is for checking geometry/art direction, not a claim about host pixels.

**Current limits:** Match-3 remains endless, not a timed Blitz mode. Piece swaps and gravity resolve instantly rather than using fully tweened animation. Cosmetic unlocks and achievements are future work.
