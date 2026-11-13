# v2.4.0 — The Prize Counter

- Funzone OS now hosts a real ticket-funded cosmetics shop; tapping the HUD wallet opens it directly.
- Nine permanent rewards across Cabinet, Snake, Plinko and 2048; ownership, equipping, category filtering and original-look reset are fully functional.
- Existing tickets, saved games, scores, and unrelated settings remain compatible.
- Cosmetic effects apply to actual gameplay/renderers, not only shop previews.
- No payments, no chance-based lootboxes, no performance modifiers, no external services.
- Added pure economy tests, mock-host purchase and persistence tests, and actual canvas palette checks.
- `node --test tests/*.test.mjs`: 74 of 74 passed.
- Live graphical screenshot remains unverified because headless Chromium hangs in this environment; `demo-shop-qa.html` included.
