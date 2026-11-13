# Fuckass Funzone v2.1.0 — Snake Art and Snacks

This is a focused polish release. Bird Brain, Gabi Jetpack, 2048, HUD,
controls, and arcade ticket rules are unchanged.

- Snake now renders as a **connected curved ribbon** with a neon outline,
  highlight, tapered tail, and an illustrated rotating snake head, rather
  than independent rectangular body tiles.
- Added six individually illustrated transparent PNG snacks: apple, berry,
  star, fish, cookie, and wrapped candy.
- Snack appearance changes on successive spawns, with deterministic variation
  and preserved progression across save/reload.
- Previously saved v2.0 Snake boards (without a snack kind) are compatible.
- Rendering tests verify curved-body strokes, directional head rotation,
  and correct food PNG selection; tests also guard against malformed saves.
- All HUD icons remain inline SVG or PNG assets. No emojis or ASCII icons.

To regenerate just the new sprites: `python scripts/make_snake_assets.py`.
To rebuild everything: `node scripts/build.mjs`.

Preview images: `docs/snake-v2.1-board-preview.png` and `docs/snake-v2.1-food-preview.png`.
These are illustrative Pillow previews. Live Spindle UI verification remains pending.
