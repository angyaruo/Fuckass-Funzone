# v2.3.3 · Gabu's Pity Hints

Base: v2.3.2, unchanged `bird_brain` installation identifier and persistent localStorage key.

- Idle for four seconds during Match-3 to highlight a real legal swap with a mint vector sparkle on each tile. Hints stop on input, pause, game over, or game switching; reduced-motion turns off the pulse.
- A board with zero legal swaps enters the **NO MOVES LEFT** game-over state. Press **New Board** to retry. No silent reshuffle at ordinary stalemates.
- Added Cozy 6×7, Classic 7×7, Busy 8×7 via the compact action-strip selector and drawer setting. Touch mapping, keyboard cursor, rockets, bombs, gravity, detection and rendering honor width.
- Progress is banked per width while existing 7×7 saves are accepted unchanged. The global best score and shared ticket economy persist.
- Tiny special overlays scale with cell size; no source-sheet cuts, emoji, ASCII icon placeholders, or network assets.
- Added dedicated hint/width/no-moves regression tests and mock-host input/save-switch checks. **65 / 65 passed**.
- Rendered `match3-v2.3.3-hints-and-widths-preview.png` from bundled SVG art for QA; Chromium screenshot capture remained unavailable. Live host verification remains pending.
