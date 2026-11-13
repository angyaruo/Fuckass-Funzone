# Acceptance checklist (staging)

1. Spindle Import Local sees `bird_brain` with manifest name/version and only `ui_panels` requested.
2. Enabling mounts a drawer tab and float widget; float starts hidden. Open each game from drawer and from chat input action.
3. Press start and test mouse taps, Space while canvas focused, hold/release in jetpack mode, and touch on mobile.
4. Switch bird → Gabi → bird. Lives, score, pipes, coins and animation state reset coherently.
5. Send a real generation; it should auto-open once. Try duplicates/stop/end and finish with gameplay ongoing: game keeps moving, ready indicator appears.
6. Change `Open on generation` to off; next generation should not open automatically. Restore to on.
7. Enable `Auto-hide when idle`; finish a generation on the lobby screen or game-over screen: closes. Finish while actively playing: **does not close**.
8. Blur the window or switch tabs while playing: should pause without a giant physics step on resume.
9. Resize/drag on desktop and check mobile viewport; minimize and reopen with preserved paused game.
10. Toggle sound off/on, test invalid/corrupt browser local storage, unload/re-enable repeatedly, ensure no duplicated generation handlers or dangling arcade windows.

Code-only harness: `node --test tests/*.test.mjs` (18 automated tests). The included `demo.html` is a standalone fake-host mock, **not** proof that a live Spindle install works.

## v1.1.0 visual regression pass

11. Open `assets/cover/sprite-preview.png`: no duplicate bird wings, cut-off faces, stray adjacent jet flames, additional hearts, or detached cloud pieces.
12. Bird still cycles through all six flight frames. As of v2.6.3 Gabi only cycles calm frames 0–2 during idle flight; hold thrust to see 3–5. Check that hair and thrusters remain whole in every expression.
13. Confirm Gabi HUD shows exactly **three distinct single hearts** rather than fragments of a single connected graphic.
14. Review `assets/sprites/manifest.json` for per-sprite explicit source selections. Run `python scripts/build_assets.py` and `node scripts/build.mjs` to check source reconstruction; then `node --test tests/*.test.mjs` (18 automated tests).
15. On upgrade, verify that high scores and settings were retained and the new bundled assets are loaded after unloading/re-enabling the extension.


## v1.2.0 rooftop-and-record regression

16. Gabi mode: run with a prior best above zero. The **specific building** whose pass earns the old best must display the cat flag on the roof of its *lower* skyscraper. It is a visual marker, not an extra collision surface.
17. Once that building is passed, the score should match the old best. Survive one additional building to get the **NEW BEST!** image during active play, and confirm the high score updates in the drawer/HUD. If you then crash, the celebration should still appear in the game-over overlay.
18. If the score grows by several more points in that run, the original flagged building must **not** move or be re-tagged. On retry/new run, the new saved best becomes the marker's target.
19. Gabi's hazards should be purple neon apartment skyscrapers with window patterns and rooflines, not the green Bird pipes; Bird mode must retain its original pipes.
20. Hold thrust to see *actual PNG flames*, no ellipses or smoke dots. Release to stop the extra flame trail. Coin total must be stark white and legible.
21. Run long enough to feel the progressive speed. It should accelerate smoothly but remain bounded to 1.72x the starting speed for that mode/difficulty. Higher speeds must not create gaps in obstacle spawning.
22. Verify local storage, focus behavior, touch gameplay, and generation-state interactions again after upgrade. There was no additional inference-side permission.

Unit/mocked renderer tests (`tests/rendering.test.mjs`) verify flame selection, building-window rendering, milestone flag drawing, coin HUD ink, and NEW BEST/game-over art. These are not a substitute for testing the extension in live Lumiverse.


## v2.6.2 first-frame HUD & flight difficulty QA

23. From Funzone OS, choose **Fuckass Bird** while coming from another game (especially Simon or Duck). Start a round without touching the ground; **SCORE** and **BEST** must be left-aligned inside their HUD pills on the first frame. Repeat after visiting another mini-game and after restarting.
24. In both Bird and Jetpack settings, verify **Chill / Normal / Medium (former Chaos) / Hard** appear and stay synchronized. Change modes during a running round: the current flight is not interrupted and the next retry uses the updated selection.
25. On **Medium**, verify the former 1.28× Chaos physics is unchanged. On **Hard**, hazards are significantly faster/tighter/closer; Bird stays one-hit, and Jetpack Gabi loses on a single collision with one lit heart. The tallest obstacle jumps should still be traversable rather than random unavoidable death.
26. Check an older save with flight `settings.difficulty = "chaos"`. It loads as **Medium**, preserving the old physics, existing bests, shop, and wallet. Duck Hunt's separate Chaos duck-speed preference must remain unchanged.

The code-only checks now include canvas-state bleed simulation, compatibility migration, Hard collision and obstacle scaling, and the real bundled frontend inside a mock Spindle host. Live Lumiverse QA still matters for actual layout pixels.

## v2.6.3 Gabi animation checks

27. Launch Jetpack Gabi without touching thrust. Watch for several seconds: only flight sprites 0–2 should cycle; the open-mouthed 3–5 expressions must never appear during idle cruising.
28. Tap very quickly: expression 3 appears briefly even if the press/release occurs between animation frames. Hold for ~0.15s: expression 4; hold for ~0.35s: expression 5. Release: the last expression lingers ~0.16s before returning to the calm loop.
29. Try both mouse/touch and Space/Up. Also verify reduced-motion mode keeps calm frame 0 while still showing the thrust cue. Pause/resume, die, restart, and switch to Bird; no stale held expressions should leak. Bird retains its unchanged six-frame cycling.

Automated engine and mocked canvas regression tests confirm the frame selection, tap-duration progression, sub-frame taps, release decay, and resets. The self-contained `dist/frontend.js` is rebuilt and exercised in the Spindle host mock. Actual device feel still needs live visual QA.
