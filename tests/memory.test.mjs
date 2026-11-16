import test from 'node:test';
import assert from 'node:assert/strict';
import { GachaMatchGame, MEMORY_SIZES, MEMORY_PREVIEW, CHARMS } from '../src/memory.js';
import { capsuleAt, drawGachaMatch, memoryLayout } from '../src/memory-render.js';

const pairOf = (g, kind) => g.cards.flatMap((c, i) => c.kind === kind ? [i] : []);
// Starts a tray and skips the memorize countdown, the way a player's first tap does.
const begin = g => { g.start(); g.flip(0); return g; };

test('Gacha Match deals every charm exactly twice for each board size', () => {
  for (const [size, [cols, rows]] of Object.entries(MEMORY_SIZES)) {
    const g = new GachaMatchGame({ pace: size, random: () => .37 });
    assert.equal(g.cards.length, cols * rows);
    for (let k = 0; k < cols * rows / 2; k++) assert.equal(pairOf(g, k).length, 2, `${size}: ${CHARMS[k]} appears twice`);
  }
});

test('matches score with a growing streak, misses flip back, and a third tap covers a showing miss', () => {
  const events = [], g = begin(new GachaMatchGame({ random: () => .37, onEvent: e => events.push(e) }));
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
  const events = [], g = begin(new GachaMatchGame({ random: () => .37, onEvent: e => events.push(e) }));
  const [a1, a2] = pairOf(g, 0), [b1] = pairOf(g, 1);
  g.flip(a1); g.flip(b1); for (let i = 0; i < 10; i++) g.update(.1);
  g.flip(a2); const [c1] = pairOf(g, 2); g.flip(c1);
  assert.equal(events.at(-1), 'forgot', 'the first heart was already seen, so this miss is a lapse');
});

test('finishing a tray wins with a bonus that shrinks with misses, and pause stops the clock', () => {
  const events = [], g = begin(new GachaMatchGame({ pace: 'cozy', random: () => .37, onEvent: e => events.push(e) }));
  for (let i = 0; i < 10; i++) g.update(.1); g.pause(); g.update(.1); g.update(.1);
  assert.ok(Math.abs(g.elapsed - 1) < 1e-9, 'the clock only runs while playing'); g.start();
  for (let k = 0; k < 6; k++) { const [a, b] = pairOf(g, k); g.flip(a); g.flip(b); }
  assert.equal(g.status, 'dead'); assert.equal(g.won, true); assert.ok(events.includes('win'));
  assert.equal(g.score, [20, 30, 40, 50, 60, 70].reduce((s, v) => s + v, 0) + 100 + 200);
});

test('Gacha Match saves restore paused with no cards left showing, and tampered trays are rejected', () => {
  const g = begin(new GachaMatchGame({ pace: 'busy', random: () => .37 }));
  const [a, b] = pairOf(g, 0); g.flip(a); g.flip(b); const [c] = pairOf(g, 1); g.flip(c);
  const saved = g.snapshot(), back = new GachaMatchGame({ saved });
  assert.equal(back.status, 'paused'); assert.equal(back.size, 'busy'); assert.equal(back.matches, 1); assert.equal(back.faceUp().length, 0);
  const bad = patch => new GachaMatchGame().restore({ ...saved, ...patch });
  assert.equal(bad({ kinds: saved.kinds.map((k, i) => i === 0 ? (k + 1) % 10 : k) }), false, 'three of one charm');
  assert.equal(bad({ matched: saved.matched.map((m, i) => i === a ? m : false) }), false, 'half a matched pair');
  assert.equal(bad({ matches: 3 }), false); assert.equal(bad({ status: 'dead' }), false); assert.equal(bad({ size: 'huge' }), false);
});

test('Gacha Match renderer maps taps to capsules and draws every state', () => {
  const { x0, y0, cw, ch } = memoryLayout(4, 4);
  assert.equal(capsuleAt(x0 + 2, y0 + 2, 4, 4), 0); assert.equal(capsuleAt(x0 + cw + 3, y0 + 2, 4, 4), -1, 'the gap between cards is not a card');
  assert.equal(capsuleAt(x0 + 3 * (cw + 8) + 2, y0 + 3 * (ch + 8) + 2, 4, 4), 15);
  const text = [];
  const ctx = new Proxy({ createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }) }, {
    get(target, name) { return name in target ? target[name] : (...args) => { if (name === 'fillText') text.push(args[0]); }; },
    set(target, name, value) { target[name] = value; return true; },
  });
  const canvas = { width: 720, height: 904, getContext: () => ctx };
  for (const size of Object.keys(MEMORY_SIZES)) { const g = new GachaMatchGame({ pace: size }); drawGachaMatch(canvas, g, {}); g.start(); drawGachaMatch(canvas, g, {}); g.flip(0); g.flip(0); g.update(.2); drawGachaMatch(canvas, g, {}); }
  assert.ok(text.some(t => /^MEMORIZE THE CHARMS · \d$/.test(t)), 'the countdown shows while the capsules are open');
  assert.ok(text.includes('GACHA MATCH'));
});

test('each new tray starts open for a memorize countdown that grows with the board but shrinks per card', () => {
  const perCard = [];
  for (const size of ['cozy', 'classic', 'busy']) {
    const events = [], g = new GachaMatchGame({ pace: size, random: () => .37, onEvent: e => events.push(e) }); g.start();
    assert.equal(g.preview, MEMORY_PREVIEW[size]); perCard.push(MEMORY_PREVIEW[size] / g.cards.length);
    g.update(.1); g.update(.1); assert.ok(g.cards.every(c => c.turn > 0), 'every card turns face up');
    assert.equal(g.flip(3), false, 'a tap during the countdown does not flip a card'); assert.equal(g.preview, 0); assert.equal(g.cards[3].up, false);
    assert.ok(events.includes('preview_end'));
  }
  assert.ok(perCard[0] > perCard[1] && perCard[1] > perCard[2], 'bigger boards get less time per card');
  const g = new GachaMatchGame({ pace: 'classic', random: () => .37 }); g.start();
  for (let i = 0; i < 20; i++) g.update(.1); assert.ok(g.preview > 0); assert.equal(g.elapsed, 0, 'the clock waits during the countdown');
  for (let i = 0; i < 20; i++) g.update(.1); assert.equal(g.preview, 0); assert.ok(g.elapsed > 0);
  for (let i = 0; i < 10; i++) g.update(.1); assert.ok(g.cards.every(c => c.turn === 0), 'the capsules close again');
  const mid = new GachaMatchGame({ random: () => .37 }); mid.start(); mid.update(.1); mid.pause();
  const back = new GachaMatchGame({ saved: mid.snapshot() }); assert.ok(back.preview > 3, 'a save during the countdown resumes the countdown');
});
