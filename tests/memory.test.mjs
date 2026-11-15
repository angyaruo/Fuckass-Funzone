import test from 'node:test';
import assert from 'node:assert/strict';
import { StickerMatchGame, MEMORY_SIZES, STICKERS } from '../src/memory.js';
import { memoryCardAt, drawStickerMatch, memoryLayout } from '../src/memory-render.js';

const pairOf = (g, kind) => g.cards.flatMap((c, i) => c.kind === kind ? [i] : []);

test('Sticker Match deals every sticker exactly twice for each board size', () => {
  for (const [size, [cols, rows]] of Object.entries(MEMORY_SIZES)) {
    const g = new StickerMatchGame({ pace: size, random: () => .37 });
    assert.equal(g.cards.length, cols * rows);
    for (let k = 0; k < cols * rows / 2; k++) assert.equal(pairOf(g, k).length, 2, `${size}: ${STICKERS[k]} appears twice`);
  }
});

test('matches score with a growing streak, misses flip back, and a third tap covers a showing miss', () => {
  const events = [], g = new StickerMatchGame({ random: () => .37, onEvent: e => events.push(e) }); g.start();
  for (const k of [0, 1, 2]) { const [a, b] = pairOf(g, k); g.flip(a); g.flip(b); }
  assert.equal(g.matches, 3); assert.equal(g.score, 20 + 30 + 40); assert.ok(events.includes('streak'));
  const [a] = pairOf(g, 3), [b] = pairOf(g, 4); g.flip(a); g.flip(b);
  assert.equal(g.streak, 0); assert.equal(g.faceUp().length, 2); assert.ok(events.includes('miss'));
  const step = (n, dt = .1) => { for (let i = 0; i < n; i++) g.update(dt); };
  step(5); assert.equal(g.faceUp().length, 2, 'the miss stays visible for a moment'); step(5); assert.equal(g.faceUp().length, 0);
  const [c] = pairOf(g, 5), [d] = pairOf(g, 6); g.flip(c); g.flip(d); const [e] = pairOf(g, 7); g.flip(e);
  assert.deepEqual(g.faceUp(), [e], 'a third tap flips the missed pair down and opens the new card');
});

test('missing a pair you had already seen counts as forgetting', () => {
  const events = [], g = new StickerMatchGame({ random: () => .37, onEvent: e => events.push(e) }); g.start();
  const [a1, a2] = pairOf(g, 0), [b1] = pairOf(g, 1);
  g.flip(a1); g.flip(b1); for (let i = 0; i < 10; i++) g.update(.1);
  g.flip(a2); const [c1] = pairOf(g, 2); g.flip(c1);
  assert.equal(events.at(-1), 'forgot', 'the first heart was already seen, so this miss is a lapse');
});

test('finishing a page wins with a bonus that shrinks with misses, and pause stops the clock', () => {
  const events = [], g = new StickerMatchGame({ pace: 'cozy', random: () => .37, onEvent: e => events.push(e) }); g.start();
  for (let i = 0; i < 10; i++) g.update(.1); g.pause(); g.update(.1); g.update(.1);
  assert.ok(Math.abs(g.elapsed - 1) < 1e-9, 'the clock only runs while playing'); g.start();
  for (let k = 0; k < 6; k++) { const [a, b] = pairOf(g, k); g.flip(a); g.flip(b); }
  assert.equal(g.status, 'dead'); assert.equal(g.won, true); assert.ok(events.includes('win'));
  assert.equal(g.score, [20, 30, 40, 50, 60, 70].reduce((s, v) => s + v, 0) + 100 + 200);
});

test('Sticker Match saves restore paused with no cards left showing, and tampered pages are rejected', () => {
  const g = new StickerMatchGame({ pace: 'busy', random: () => .37 }); g.start();
  const [a, b] = pairOf(g, 0); g.flip(a); g.flip(b); const [c] = pairOf(g, 1); g.flip(c);
  const saved = g.snapshot(), back = new StickerMatchGame({ saved });
  assert.equal(back.status, 'paused'); assert.equal(back.size, 'busy'); assert.equal(back.matches, 1); assert.equal(back.faceUp().length, 0);
  const bad = patch => new StickerMatchGame().restore({ ...saved, ...patch });
  assert.equal(bad({ kinds: saved.kinds.map((k, i) => i === 0 ? (k + 1) % 10 : k) }), false, 'three of one sticker');
  assert.equal(bad({ matched: saved.matched.map((m, i) => i === a ? m : false) }), false, 'half a matched pair');
  assert.equal(bad({ matches: 3 }), false); assert.equal(bad({ status: 'dead' }), false); assert.equal(bad({ size: 'huge' }), false);
});

test('Sticker Match renderer maps taps to cards and draws every state', () => {
  const { x0, y0, cw, ch } = memoryLayout(4, 4);
  assert.equal(memoryCardAt(x0 + 2, y0 + 2, 4, 4), 0); assert.equal(memoryCardAt(x0 + cw + 3, y0 + 2, 4, 4), -1, 'the gap between cards is not a card');
  assert.equal(memoryCardAt(x0 + 3 * (cw + 8) + 2, y0 + 3 * (ch + 8) + 2, 4, 4), 15);
  const text = [];
  const ctx = new Proxy({ createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }) }, {
    get(target, name) { return name in target ? target[name] : (...args) => { if (name === 'fillText') text.push(args[0]); }; },
    set(target, name, value) { target[name] = value; return true; },
  });
  const canvas = { width: 720, height: 904, getContext: () => ctx };
  for (const size of Object.keys(MEMORY_SIZES)) { const g = new StickerMatchGame({ pace: size }); drawStickerMatch(canvas, g, {}); g.start(); g.flip(0); g.update(.2); drawStickerMatch(canvas, g, {}); }
  assert.ok(text.includes('STICKER MATCH'));
});
