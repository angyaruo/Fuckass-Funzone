<p align="center">
  <img src="assets/funzone/funzone-logo.png" alt="Fuckass Funzone" width="660">
</p>

<h1 align="center">Arcade Intermission</h1>

<p align="center">
  A pocket arcade for Lumiverse. Play a round while your next reply is on its way.
</p>

<p align="center">
  <img src="assets/sprites/gabi_fly_2.png" alt="Gabi in flight" width="72">
  <img src="assets/match3/gabu-smug.png" alt="Gabu looking smug" width="72">
  <img src="assets/plinko/gabu-monocle.png" alt="Gabu wearing a monocle" width="72">
</p>

## Pick a game

Open **Funzone OS** from the arcade drawer to launch any of the ten games in the floating cabinet.

| Game | How to play |
| --- | --- |
| **Fuckass Bird** | Tap, press Space, or press Up to flap through the gaps. |
| **Gabi Jetpack** | Hold to thrust, dodge buildings, and collect coins. |
| **Snake** | Swipe or use the arrow keys or WASD to steer toward snacks. |
| **2048** | Swipe or use the arrow keys or WASD to merge tiles. |
| **Trinket Panic** | Swap adjacent trinkets, make rockets and Gabu bombs, and choose a cozy, classic, or busy board. Timed rounds are optional. |
| **Plinko** | Drop a chip in free practice or play for fictional tickets. |
| **Simon Says** | Repeat the flashing sequence with the four pads or keys 1–4. |
| **Duck Hunt** | Tap or click flying ducks. Choose a timer or play an untimed hunt. |
| **Gabu Slots** | Spin in free practice or choose a fictional-ticket wager. |
| **Gabu's Gambit** | Build poker hands across six rounds, equip three original Jokers, and open Joker or Upgrade booster packs between rounds. |

### Gabu's Gambit prototype

Select one to five cards from an eight-card hand; your score preview includes your equipped boosts. Beat each target in four plays, with three optional discards. Between rounds, buy Jokers and booster packs with run coins; arcade tickets are separate. Packs reveal three options and require an explicit choice. Runs, purchases, and revealed packs survive reload; the cabinet restores them paused.

Use taps or keys **1–8** to select cards, **Space** to play or continue a scoring breakdown, **D** to discard, and **P** to pause. Arrow keys focus every visible action; **Enter** activates it and **Escape** closes Joker details. See [the full rules and development notes](docs/GABUS-GAMBIT.md).

This prototype lives on `codex/gabus-gambit`, based directly on upstream `master`. The separate Tetris/Solitaire/Froggy contribution is kept on its own branch.

### Visit the Prize Counter

Earn tickets as you play and trade them for cabinet themes, Snake skins, Plinko trails, and 2048 palettes. High scores, supported game saves, and cosmetics stay in your browser. Tickets have no cash value. The extension runs locally and reacts to generation events without reading prompts or replies.

## A peek inside

<table>
  <tr>
    <td width="50%"><img src="docs/match3-v2.3.3-hints-and-widths-preview.png" alt="Trinket Panic reference art showing three board widths"></td>
    <td width="50%"><img src="docs/plinko-funzone-os-preview.png" alt="Plinko cabinet beside the nine-game Funzone OS launcher and Prize Counter shortcut"></td>
  </tr>
  <tr>
    <td align="center"><strong>Trinket Panic</strong></td>
    <td align="center"><strong>Plinko &amp; Funzone OS</strong></td>
  </tr>
</table>

## Install or update

1. Copy this repo link 
```txt
https://github.com/kittyafterdark/Fuckass-Funzone
```
2. Paste it on the Extensions sidebar tab > Add Extensions

## Local development

Run `npm run check` to rebuild the self-contained extension and run the tests; no npm dependencies are required. For the playable mock-host preview, run `python -m http.server 8766 --bind 127.0.0.1` from this repository and open [Gabu's Gambit locally](http://127.0.0.1:8766/demo-gambit-qa.html). The preview also includes isolated shop and booster examples. Live Lumiverse and real touch-device checks remain pending.
