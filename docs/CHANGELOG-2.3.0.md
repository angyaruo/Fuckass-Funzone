# v2.3.0 — The House Always Meows

## Funzone OS

- Replaced the permanently visible, increasingly crowded five-tab rail with one compact **Games** button carrying a proper inline SVG phone icon.
- The in-widget launcher uses a three-column app grid with six separate PNG app icons/mascots, best-score subtitles, a monocled Gabu wallpaper, and a Continue shortcut.
- Selecting an app resumes/starts its corresponding game; Plinko never spends tickets automatically just because it was opened.
- All in-progress games pause when the launcher opens, persist their state, and may resume after the AI response finishes.
- Drawer has all six games and a Funzone OS launcher shortcut. No second floating host widget, no DOM hacks, no permanent new gameplay panels.

## Plinko

- **New actual game module:** `src/plinko.js`, deterministic stepping through 60 physical pegs with wall reflections, collision impulses, bounded subframes and real ball trajectories.
- **Renderer:** `src/plinko-render.js`, independent quiet playfield, distinct multiplier bins, PNG cat-chip, PNG Gabu with snobby monocle and a small handcrafted cat-crest SVG.
- Fictional/local-only tickets: choose Practice (zero ticket winnings), 1, 5, 10, or 25 ticket wagers. No cash, purchases, gambling service, network, user accounts or real prizes.
- The prize slots read `8x 2x 1x 1x 0x 1x 1x 2x 8x`. Physical bounce steering is constrained so aiming at the edge does not produce an automatic jackpot; the average on the tested seeded sample returns fewer virtual tickets than wagered.
- One paid chip at a time. A canceled in-flight ball refunds once; completed chips cannot be reclaimed or scored twice. Paused balls safely persist between generations and extension reopenings.
- Separate save data, drop history, best payout, money-in and ticket winnings. Plinko integrates with the same local wallet and saved `bird_brain:v1:*` namespace as all earlier games.
- Gabu reacts to ordinary results, jackpot, bust and free practice using an independent `gabu_magnate` portrait. No emoji or text-glyph icons.

## Artwork

- `assets/plinko/gabu-monocle.png`: 192×166 RGBA asset derived from the project's existing Gabu pose, adding gold-framed monocle, chain, velvet hat and cheeky bow.
- `assets/plinko/cat-chip.png`: 128×128 RGBA cat chip.
- `assets/plinko/plinko-app.png`: 128×128 RGBA app icon.
- `assets/plinko/cat-crest.svg`: safe, self-contained 64×64 independent SVG art.
- `docs/plinko-phone-preview.png`: offline representative asset/layout preview, **not** a Chromium screenshot.

## Code / QA

- `scripts/build.mjs` statically bundles new engine, renderer, PNGs, SVG and CSS in `dist/frontend.js` with prior safety checks.
- `tests/plinko.test.mjs` validates bounce settlement, single payout, true no-stake practice, cancellation, persistence, sanitization, long-run deterministic economy and byte-identical PNG embeddings.
- Original Bird, Jetpack, Snake, 2048 and Match-3 modules, scoring rules, input hitboxes, and saved data remain intact.
- Existing fake-host lifecycle tests now exercise the phone launcher and a real practice drop.

## Installation

Extract full ZIP or apply the **v2.2.1-only** overlay into `data/extensions/` so the file `data/extensions/bird_brain/repo/spindle.json` remains in place. Back up your local extension folder before overwriting; unload and re-enable in Spindle after installing.
