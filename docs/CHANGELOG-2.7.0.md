# Fuckass Funzone 2.7.0 · Eight cute classics

## What's new

Eight new games join Funzone OS, bringing the cabinet to twenty. Each one has its own vector art and app icon, a help tab with settings in the drawer, a personal best, ticket milestones, saves that resume paused, and Gabu commentary using Gabu's existing faces.

| Game | What it is | Settings |
| --- | --- | --- |
| **Catmate Chess** | Full-rules chess against Gabu (castling, en passant, promotion, check, checkmate, stalemate, fifty-move and insufficient-material draws). Plush cat pieces: the hat is the piece. Gabu's side wears Gabu's cyan right-eye interface. Undo takes back your move and Gabu's reply. | Gabu: Chill / Normal / Sharp |
| **Berry Drop** | Four in a row: your strawberries against Gabu's blueberries. Wins and draws build a streak; one loss ends it. Starters alternate each round. | Gabu: Chill / Normal / Sharp |
| **Tic Tac Treats** | Tic-tac-toe with pocky crosses against Gabu's donuts, played as a streak. Sharp Gabu plays perfectly. | Gabu: Chill / Normal / Sharp |
| **Cake Tower** | Drop swinging cake tiers onto the stack. A tier stays only if its middle sits over the tier below; a stack that leans or wobbles too far slides off from its weak joint. Misses and collapses each cost one of three hearts. Fallen tiers land and stay put. The sky climbs from morning to a starry night. | Pace: Chill / Normal / Chaos |
| **Bubble Bloom** | Bubble shooter with glossy symbol bubbles, a one-bounce aim guide, and a cloud launcher. Pop three of a kind, drop what hangs, clear the board to level up. | Pace: Chill / Normal / Chaos |
| **Boop-a-Bun** | Whac-a-mole with bunnies. Golden bunnies pay extra; Gabu's robot decoys cost points and your streak. 45-second rounds. | Pace: Chill / Normal / Chaos |
| **Wobbly Wafers** | Tower-pulling game against Gabu with wafer cookies. A steady-hand meter decides how cleanly each wafer comes out. The top two layers are off-limits, and a lone edge wafer tips everything above it toward the empty side. Fallen wafers land on the saucer or table. Whoever topples it loses the round. | Gabu: Chill / Normal / Sharp |
| **Sticker Match** | Memory with ten hand-drawn stickers. Each page starts face up for a memorize countdown (3, 3.5 or 4 seconds by size), then turns over. Streak bonuses, a finish bonus that shrinks with misses, and a Gabu roast when you miss a pair you had already flipped. | Board: Cozy / Classic / Busy |

Gabu judges each game through the existing `ReactionDirector`, with new lines, moods and throttles in `src/reactions.js`, using the existing faces the same way the original games do: a NEW BEST is hype (announced once per run, like the flight engine), ordinary progress is smug, and dying in a solo game is panic. In the four games where Gabu is the opponent, Gabu winning is hype, Gabu losing is panic, and a draw is dizzy. Ordinary moves stay quiet; frequent events (captures, blocks, pops, boops, pulls, misses) speak only every few occurrences.

Sound cues for the new games use the existing `makeSound` synth (three new notes: `pop`, `drop`, `tick`). With **Sound effects** off, which is still the default, they stay silent like every other game.

Difficulty, pace, and board-size choices are saved per game (`gabuLevels`, `toyPaces`) and, like Duck Hunt and Trinket Panic, apply to your next new game rather than the one in progress.

## Fairness and difficulty

Each Gabu level and each pace was checked with simulated players before release, so every step up is harder for every kind of player and Gabu only wins by playing better:

- **Berry Drop**, with a Normal-strength player bot: player wins 87% against Chill, 40% against Normal, 3% against Sharp.
- **Tic Tac Treats**, with a perfect player: wins 56% against Chill, 27% against Normal, and always draws Sharp, which never loses by design.
- **Wobbly Wafers**, 300 rounds per cell with starters alternating: steady, average and shaky hands win 82/73/57%, 70/52/48% and 63/43/29% against Chill/Normal/Sharp. Towers almost always fall from wobble rather than from running out of safe pulls, so the ending is decided by steady hands, not by turn order.
- **Catmate Chess**: a Normal-strength bot beats Chill Gabu every game, splits with Normal, and loses to Sharp.
- **Cake Tower** and **Bubble Bloom**: each pace shortens the median run for careful, average and sloppy players alike.
- **Boop-a-Bun**: Chaos halves slow players' scores; quick players can score more on Chaos because more bunnies appear, the same trade Duck Hunt's Chaos speed makes.

Taps on Boop-a-Bun count for the critter you can see, even where a bunny's ears reach into the row above, and Wobbly Wafers taps follow the tower's lean.

## Also fixed

- **Funzone OS launcher on phones:** with a long game list, the bottom apps, The Prize Counter and the Continue button could sit below the screen with no way to scroll to them. The launcher now gets the same screen-height cap the Prize Counter already uses (`100dvh`, with a `100vh` fallback), and scrolls inside it.
- **Bubble Bloom aim guide:** the dots are evenly spaced and still. They never animate or blink.

## Files changed

- `src/chess.js`, `src/chess-render.js`, `src/connect.js`, `src/connect-render.js`, `src/tictac.js`, `src/tictac-render.js`, `src/cake.js`, `src/cake-render.js`, `src/bubble.js`, `src/bubble-render.js`, `src/boop.js`, `src/boop-render.js`, `src/wafer.js`, `src/wafer-render.js`, `src/memory.js`, `src/memory-render.js`: new rules engines and canvas renderers. Engines have no DOM or Spindle dependencies.
- `assets/funzone/{chess,berry,treats,cake,bubble,boop,wafer,memory}-app.svg`: new launcher icons, self-contained vector paths that pass the build's SVG checks.
- `src/frontend.js`: roster, input routing (tap, keyboard, Bubble Bloom hover and drag aim), rendering, sound cues, saves, once-per-run NEW BEST reactions, drawer tips and selects.
- `src/style.css`: the launcher's screen-height cap.
- `src/reactions.js`: Gabu lines, moods and timing for the new games.
- `src/rewards.js`: ticket milestone steps for the new games.
- `scripts/build.mjs`: bundles the new modules and icons; release banner.
- `tests/chess.test.mjs`, `tests/berry.test.mjs`, `tests/treats.test.mjs`, `tests/cake.test.mjs`, `tests/bubble.test.mjs`, `tests/boop.test.mjs`, `tests/wafer.test.mjs`, `tests/memory.test.mjs`, `tests/sweets-integration.test.mjs`, `tests/sweets-reactions.test.mjs`: new rule, physics, reaction and bundled-host tests. `tests/lifecycle.test.mjs`: roster count.
- `spindle.json`, `package.json`, `README.md`, `docs/TESTING.md`, `demo-classics-qa.html`: release metadata, instructions, and preview links.
- `dist/frontend.js`: rebuilt self-contained Spindle frontend with all 82 PNG/SVG assets embedded.

Original versions of every edited source, config, doc and test are retained at `docs/backups-pre-2.7.0/`. The update manifest lists changed files and their checksums.

## Verification

- `node scripts/build.mjs` builds successfully.
- `node --test tests/*.test.mjs`: **181/181 passed** (the 125 existing tests plus 56 new ones, including the mock Lumiverse host integration).
- Chess move generation matches the published perft counts for the starting position and three standard test positions. Sharp Tic Tac Treats was checked against every possible sequence of player moves and never loses.
- Each game was played in headless Chromium through `demo-classics-qa.html` at 382 px and 292 px cabinet widths with no page errors, and the launcher was checked on an emulated phone with the cabinet taller than the screen.
- Live Lumiverse and real device visual QA are not available here, so verify the feel on desktop and mobile after upgrading.

## Compatibility

No data migration. Uses the existing `fuckass_funzone:v1:<extensionInstallationId>` localStorage key and adds `gabuLevels`, `toyPaces`, and one snapshot per new game to the same save envelope. Existing saves, scores, tickets, and cosmetics are untouched. No changes to existing games' rules, art, ticket formulas, shop inventory, or installation identifier.
