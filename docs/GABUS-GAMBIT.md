# Gabu's Gambit — playable prototype

An original, dependency-free poker roguelike for Funzone's 360 × 452 logical canvas. This branch incorporates upstream 2.7.0's twenty games, including the merged Tetris/Solitaire/Froggy contribution, and adds Gambit as the twenty-first game. The working title, vector artwork, and twelve Joker effects are original to this prototype.

## The run

Each round shuffles a standard 52-card deck and draws eight cards. Select one to five, then play the selection or discard it. Played and discarded cards stay out of that round's draw pile. You have four plays and three discards; discarding requires cards left to draw. Only the cards contributing to the recognized poker category score, so a Pair's unrelated kickers do not receive suit or card enhancements.

The six targets are 180, 350, 600, 1,000, 1,500, and 2,200. Scores accumulate toward the current target, while the run total is recorded as a personal best. Clearing round six wins. Failing a target after the final play ends the run. The scoring breakdown waits for Continue, so there is time to read the calculation. A new run clears its money, deck enhancements, and Jokers.

The first run starts with Pair Gremlin and eight run coins. A cleared round awards six coins plus one for each remaining play, then opens the shop. Run coins never spend or award arcade tickets. Targets were eased after an early heuristic simulation struggled in later rounds; this is an initial balance pass, not a measured claim of difficulty or player win rate.

## Scoring and Jokers

The scoring order is hand base and hand level, contributing card chips, flat Joker chips, added Mult, then multiplied Mult. Final points are floored. Joker position does not change the result. Aces are high except in A–2–3–4–5 straights; Ace contributes 11 chips, face cards 10, other cards their rank. A hand level adds 15 base chips and one base Mult, capped at five purchased levels.

| Joker | Effect |
| --- | --- |
| Pair Gremlin | +4 Mult if any played rank repeats. |
| Heart Hoarder | +20 chips per scoring Heart. |
| Last Laugh | ×1.5 Mult on the final available play. |
| Growing Suspicion | +5 chips per previously cleared round. |
| Pocket Ace | +3 Mult if an Ace scores. |
| Club Regular | +12 chips per scoring Club. |
| Face Value | +8 chips per scoring Jack, Queen, or King. |
| Clean Slate | +3 Mult while no discards have been used that round. |
| Little Scheme | +3 Mult when playing three or fewer cards. |
| Straight Talker | ×1.6 Mult on Straight or Straight Flush. |
| Velvet Flush | ×1.5 Mult on Flush or Straight Flush. |
| Lonely Crown | +35 chips on High Card. |

Three Jokers can be equipped at once. Identical Jokers cannot be stacked. Each shop has two direct Joker offers, one Joker Pack, and one Upgrade Pack; direct Jokers and Joker Packs cost four coins, Upgrade Packs three. Equipped Jokers sell for two coins in the shop. Rarity labels describe the initial catalog; offers currently sample available Jokers uniformly.

## Boosters

A Joker Pack reveals three different, unequipped Jokers and keeps one. An Upgrade Pack offers two different hand upgrades and one specific playing-card enhancement. A card enhancement gives that exact card +10 chips whenever it contributes to a hand, up to +30, and stays through round reshuffles. Tap a pack option to highlight it, then Choose Card to claim it. Skipping spends the already-purchased pack. If a claimed or purchased Joker meets a full row, explicitly choose an existing Joker to replace or keep the current row and discard the incoming one.

The purchase charge, generated offers, and RNG state are saved before the interface reveals a pack. Reload returns to the same options and selection. Claims and replacements cannot be repeated to grant extra items. Persisted state validates card conservation, phases, Joker limits, levels, and purchased-pack provenance, and ignores unknown fields rather than replacing methods or callbacks.

## Controls and preview

The table keeps target, round score, blue Chips, red Mult, remaining hands/discards, and run money in a persistent left panel. Jokers are illustrated cards along the top. Playing cards have corner indices, correct suit pips, mirrored court portraits, and a raised/fanned selection. Clubs are green, diamonds orange, spades blue, and hearts red; the normal suit shapes remain visible as well. Shop cards and sealed boosters have separate Inspect and Buy actions. Tap the draw pile for a remaining-deck summary, or Run Info for the poker guide.

Touch uses the visible cards and buttons. Rank and Suit sorting sit between Play Hand and Discard and preserve selected card identities. Keyboard uses 1–8 for cards, Space for Play/Continue, D for Discard, P for Pause, R for rank sorting, S for suit sorting, I for Run Info, arrows for action focus, Enter for activation, and Escape for closing details. The main cabinet button also pauses and resumes. Keyboard input only controls the focused game canvas. The accessibility status describes selection, preview, score calculation, currency, inspected offers, and focused action.

Run `npm run check`, then serve the repository with `python -m http.server 8766 --bind 127.0.0.1`. Open `http://127.0.0.1:8766/demo-gambit-qa.html`. Its selector includes shop/Joker Pack/Upgrade Pack examples generated through legal first-round plays, in separate local save namespaces. Those examples regenerate on page reload; the ordinary playable run retains its progress.

## Verification and remaining work

Automated checks cover all poker categories and Ace-low straights; contributing-card identity; score order and preview equality; levels and enhancements; seeded deck conservation; complete win/loss transitions; pause; every key save phase; atomic purchases; replacement/skip behavior; malformed saves; high-DPI rendering; touch/keyboard routing; production-bundle teardown; and preservation of old and unknown game saves/bests. The redesign also checks topmost-card hits in overlapping fans, selection lift, resource-preserving sorting, inspect-before-buy, four suit colors, distinct Joker artwork, and mirrored/pipped cards. Browser QA covered the prototype and the redesigned hand. Direct Canvas rendering verified all redesigned screens and the narrow cabinet after browser access became unavailable; remaining live browser/device checks are still required.

Before release, check a live Lumiverse install on desktop and a touch device: generation start/end/stop, minimizing/reopening, blur and visibility changes, unload/re-enable, shop/pack reload, and a full natural six-round run. Playtest the late-round curve and modifier usefulness with people. Joker editions, copying/retrigger effects, boss rules, deck additions, meta progression, additional content, and audio polish remain future work; they are not represented as implemented features.

## Upstream 2.7.0 compatibility

The combined branch retains Catmate Chess, Berry Drop, Tic Tac Treats, Cake Tower, Bubble Bloom, Boop-a-Bun, Wobbly Wafers, and Gacha Match, with their saved opponent levels, toy paces, board sizes, reactions, sounds, and ticket milestones. It also retains the screen-height-capped phone launcher and touch scrolling that keeps swipes from dragging the cabinet. Gambit's run currency and pending booster choices remain separate from arcade tickets and the other game snapshots.

The installation identifier, `ui_panels` permission, `fuckass_funzone:v1:<extensionInstallationId>` storage namespace, and upstream 2.7.0 release metadata are preserved. Continue editing source and rebuilding the self-contained `dist/frontend.js`; the upstream changelog and update manifest describe the upstream release and are retained as historical release records.
