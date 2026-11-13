# v1.1.0 — Sprite separation fix

## Root cause

The original `scripts/build_assets.py` used rectangles with overlapping positions on an AI-generated composite sheet. `bird_flap_2` was missing part of its left silhouette and caught decorative exclamation marks; Gabi's flight frames lost parts of the exhaust/hair where their source bounds extended outside their crop; the HUD heart was cut from a single connected three-heart motif and showed a fragment of the next heart; cloud art also caught its neighbor.

## Resolution

The new reproducible pipeline treats each sprite as its **own object** rather than a grid cell:

1. Check the original sheets' SHA-256 hashes and dimensions. Do not silently retarget a different sheet.
2. Detect alpha-foreground components at threshold 80 by 8-connected scanline union-find (Pillow + NumPy; no OpenCV dependency).
3. Use one explicit interior seed for every independent character/icon/banner; validate its exact silhouette bounds before any writes. Build its alpha mask and restore a small antialiasing fringe without admitting pixels from other components.
4. The only connected multi-item sprite is the *three-heart strip*. It gets a carefully selected **single heart** ROI, with the seam feathered to avoid capturing a second heart.
5. Fit sprites individually by their real aspect ratio, add transparent padding, and generate a fresh icon and labeled QA contact sheet.
6. Verify each staged PNG's dimensions, RGBA transparency, nonempty alpha, and transparent borders, then replace the outputs. Record per-sprite source seeds, source bounds, dimensions, and hashes in `assets/sprites/manifest.json`.
7. Re-embed the corrected PNGs in `dist/frontend.js`; the runtime still loads the same stable sprite keys.

The game logic, collision boxes, Spindle hooks, storage namespace, and approved jetpack cover are not modified by this patch.

## Validation / local rebuild

```bash
python scripts/build_assets.py
node scripts/build.mjs
node --test tests/*.test.mjs
```

Open `assets/cover/sprite-preview.png` to visually inspect every exported sprite (not a scaled mock of the original sheets). The Node asset suite also checks all file hashes, PNG dimensions, alpha format, and exact embedded PNG bytes in the production frontend bundle.

**Important:** Replacing the original source sheets invalidates the pinned hashes and likely the seed/bounds contract; that is intentional fail-before-write behavior, not a bug. Don't edit hashes without checking every silhouette again.


## v1.2.0 additions

Four more isolated silhouettes have been pinned to the original **Gabi** sheet: `flame_0`, `flame_1`, `flame_2`, and `record_flag`. They use the same alpha component and source SHA validation as the existing 28 assets. The HUD/generation art also embeds the existing `best_banner` and `game_over_banner` (previously generated but unused). This increases the generated sprite count to **32** and embedded PNG count to **29**, including cover/icon. The approved cover stays unchanged.
