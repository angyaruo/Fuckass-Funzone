# Fuckass Funzone v2.2.1 — Match-3 Readability

- Retained the same 7×7 board coordinates, gameplay logic, score saves and five-game HUD.
- Eight custom hand-authored, standalone SVGs in `assets/match3/vector/`: six shape/color-separated trinkets, rocket, and bomb. Responsive Canvas loads SVG first and uses the original PNG artwork on failed/slow vector decode.
- Clearly separated palette: charcoal/cyan cat, saturated pink heart, amber star, cyan fish, beige cookie, lavender gem.
- Neutral graphite board and dark charcoal cells instead of purple/purple framing. Selected cell uses light-teal border and corner brackets. Rocket is teal, bomb is pink, including their special-piece borders.
- Cream best-score text; no more neon yellow score next to golden star icons. Cool selected Match-3 tab underline, leaving other game palettes alone.
- Build rejects unsafe or externally-referenced SVG content and embeds SVG as self-contained data URLs. No emoji, ASCII-as-icon, font glyphs or external requests.
- Added SVG integrity, byte-embedding, visual affordance, PNG fallback and selection regression checks.
- `docs/match3-readability-preview.png` is an offline composition from the actual SVGs and in-engine palette; it is NOT an in-browser screenshot. Chromium automated browsing is blocked here; final live visual acceptance remains in Lumiverse.
- Based strictly on v2.2.0. Same extension id `bird_brain` and localStorage namespace; update overlay contains only changed/new files.
