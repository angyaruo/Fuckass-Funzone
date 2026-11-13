# v2.3.1 — The House Has Opinions

A narrow Plinko composition and UI polish pass on top of v2.3.0.

**Visible:** compact score header; no double house plaque; monocled Gabu peeks from behind the cabinet edge with a temporary speech bubble; fictional wager choices and drop/pause live in one action strip; payout feedback belongs to the lit winning slot, not a central blocking rectangle; zero icon-font/emoji/ASCII substitutes.

**Correctness:** payout `flash` now decays after the chip settles; all tickets and game saves use the same storage schema; paid/free bounce physics and payouts are unchanged. The image generator script reproduces the approved Gabu PNG and new peeking crop from the bundled original artwork.

**Validation:** 59 Node tests passing before ZIP verification; mock host exercises Plinko controls and mascot layering; standalone game-state and renderer tests guard feedback expiry. Headless Chromium timed out in this runtime; offline preview is a composition, not a browser screenshot. Verify visually on desktop and mobile in Lumiverse.

**Installation:** overlay is for **v2.3.0 only**; extract at `data/extensions/`, retaining `bird_brain/repo/` paths, after backing up the previous folder. Reload Spindle.
