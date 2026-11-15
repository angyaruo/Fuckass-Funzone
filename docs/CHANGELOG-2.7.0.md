# Fuckass Funzone 2.7.0 · Eight cute classics

## What's new

Eight new games join Funzone OS, bringing the cabinet to twenty. Each one has its own vector art and app icon, a help tab with settings in the drawer, a personal best, ticket milestones, saves that resume paused, and Gabu commentary using Gabu's existing faces.

| Game | What it is | Settings |
| --- | --- | --- |
| **Catmate Chess** | Full-rules chess against Gabu (castling, en passant, promotion, check, checkmate, stalemate, fifty-move and insufficient-material draws). Plush cat pieces: the hat is the piece. Gabu's side wears Gabu's cyan right-eye interface. Undo takes back your move and Gabu's reply. | Gabu: Chill / Normal / Sharp |
| **Berry Drop** | Four in a row: your strawberries against Gabu's blueberries. Wins and draws build a streak; one loss ends it. Starters alternate each round. | Gabu: Chill / Normal / Sharp |
| **Tic Tac Treats** | Tic-tac-toe with pocky crosses against Gabu's donuts, played as a streak. Sharp Gabu plays perfectly. | Gabu: Chill / Normal / Sharp |
| **Cake Tower** | Drop swinging cake tiers onto the stack. Perfect drops steady the tower and build a streak; sloppy drops make it wobble until it topples. Three misses end the run. The sky climbs from morning to a starry night. | Pace: Chill / Normal / Chaos |
| **Bubble Bloom** | Bubble shooter with glossy symbol bubbles, a one-bounce aim guide, and a cloud launcher. Pop three of a kind, drop what hangs, clear the board to level up. | Pace: Chill / Normal / Chaos |
| **Boop-a-Bun** | Whac-a-mole with bunnies. Golden bunnies pay extra; Gabu's robot decoys cost points and your streak. 45-second rounds. | Pace: Chill / Normal / Chaos |
| **Wobbly Wafers** | Tower-pulling game against Gabu with wafer cookies. A steady-hand meter decides how cleanly each wafer comes out. The top two layers are off-limits and a lone edge wafer can't hold the tower. Whoever topples it loses the round. | Gabu: Chill / Normal / Sharp |
| **Sticker Match** | Memory with ten hand-drawn stickers. Streak bonuses, a finish bonus that shrinks with misses, and a Gabu roast when you miss a pair you had already seen. | Board: Cozy / Classic / Busy |

Gabu judges each game through the existing `ReactionDirector`, with new lines, moods and throttles in `src/reactions.js`. In the four games where Gabu is the opponent, a win shocks Gabu and a loss makes Gabu smug. Ordinary moves stay quiet; frequent events (captures, blocks, perfect drops, misses, whiffs) speak only every few occurrences.

Sound cues for the new games use the existing `makeSound` synth (three new notes: `pop`, `drop`, `tick`). With **Sound effects** off, which is still the default, they stay silent like every other game.

Difficulty, pace, and board-size choices are saved per game (`gabuLevels`, `toyPaces`) and, like Duck Hunt and Trinket Panic, apply to your next new game rather than the one in progress.

## Files changed

- `src/chess.js`, `src/chess-render.js`, `src/connect.js`, `src/connect-render.js`, `src/tictac.js`, `src/tictac-render.js`, `src/cake.js`, `src/cake-render.js`, `src/bubble.js`, `src/bubble-render.js`, `src/boop.js`, `src/boop-render.js`, `src/wafer.js`, `src/wafer-render.js`, `src/memory.js`, `src/memory-render.js`: new rules engines and canvas renderers. Engines have no DOM or Spindle dependencies.
- `assets/funzone/{chess,berry,treats,cake,bubble,boop,wafer,memory}-app.svg`: new launcher icons, self-contained vector paths that pass the build's SVG checks.
- `src/frontend.js`: roster, input routing (tap, keyboard, Bubble Bloom hover and drag aim), rendering, sound cues, saves, drawer tips and selects.
- `src/reactions.js`: Gabu lines, moods and timing for the new games.
- `src/rewards.js`: ticket milestone steps for the new games.
- `scripts/build.mjs`: bundles the new modules and icons; release banner.
- `tests/chess.test.mjs`, `tests/berry.test.mjs`, `tests/treats.test.mjs`, `tests/cake.test.mjs`, `tests/bubble.test.mjs`, `tests/boop.test.mjs`, `tests/wafer.test.mjs`, `tests/memory.test.mjs`, `tests/sweets-integration.test.mjs`: new rule and bundled-host tests. `tests/lifecycle.test.mjs`: roster count.
- `spindle.json`, `package.json`, `README.md`, `docs/TESTING.md`, `demo-classics-qa.html`: release metadata, instructions, and preview links.
- `dist/frontend.js`: rebuilt self-contained Spindle frontend with all 82 PNG/SVG assets embedded.

Original versions of every edited source, config, doc and test are retained at `docs/backups-pre-2.7.0/`. The update manifest lists changed files and their checksums.

## Verification

- `node scripts/build.mjs` builds successfully.
- `node --test tests/*.test.mjs`: **175/175 passed** (the 125 existing tests plus 50 new ones, including the mock Lumiverse host integration).
- Chess move generation matches the published perft counts for the starting position and three standard test positions. Sharp Tic Tac Treats was checked against every possible sequence of player moves and never loses.
- Each game was played in headless Chromium through `demo-classics-qa.html` at 382 px and 292 px cabinet widths with no page errors.
- Live Lumiverse and real device visual QA are not available here, so verify the feel on desktop and mobile after upgrading.

## Compatibility

No data migration. Uses the existing `fuckass_funzone:v1:<extensionInstallationId>` localStorage key and adds `gabuLevels`, `toyPaces`, and one snapshot per new game to the same save envelope. Existing saves, scores, tickets, and cosmetics are untouched. No changes to existing games' rules, art, ticket formulas, shop inventory, or installation identifier.
