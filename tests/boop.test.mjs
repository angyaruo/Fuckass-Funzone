import test from 'node:test';
import assert from 'node:assert/strict';
import { BoopGame, BOOP_DURATION, BOOP_PACES } from '../src/boop.js';
import { boopHoleAt, drawBoopABun } from '../src/boop-render.js';

const critter = (kind, age = .5) => ({ kind, age, life: 2, booped: false, after: 0 });

test('Boop-a-Bun scores bunnies, golden bunnies and streak bonuses, and fines Gabu’s robots', () => {
  const events = [], g = new BoopGame({ random: () => .5, onEvent: e => events.push(e) }); g.start();
  g.holes[0] = critter('bun'); assert.equal(g.boop(0), true); assert.equal(g.score, 10); assert.equal(g.combo, 1);
  g.holes[4] = critter('gold'); g.boop(4); assert.equal(g.score, 60); assert.ok(events.includes('gold'));
  for (let i = 0; i < 3; i++) { g.holes[1] = critter('bun'); g.boop(1); g.holes[1] = null; }
  assert.equal(g.combo, 5); assert.equal(g.score, 60 + 10 + 10 + 15, 'the fifth boop in a streak earns a bonus');
  g.holes[8] = critter('bot'); g.boop(8); assert.equal(g.combo, 0); assert.equal(g.score, 75); assert.ok(events.includes('bot'));
  assert.equal(g.boop(2), false); assert.ok(events.includes('whiff'), 'booping an empty burrow is a whiff');
  g.holes[3] = critter('bun', .02); assert.equal(g.boop(3), false, 'a bunny barely peeking out cannot be booped yet');
});

test('Boop-a-Bun bunnies that escape break the streak, and the round ends on time', () => {
  const events = [], g = new BoopGame({ random: () => .99, onEvent: e => events.push(e) }); g.start(); g.combo = 4;
  g.holes[5] = critter('bun', 1.95); g.update(.1);
  assert.equal(g.holes[5], null); assert.equal(g.combo, 0); assert.ok(events.includes('escape'));
  for (let i = 0; i < BOOP_DURATION * 10 + 5 && g.status === 'playing'; i++) g.update(.1);
  assert.equal(g.status, 'dead'); assert.equal(g.timeLeft, 0); assert.ok(events.includes('death'));
  assert.ok(g.holes.every(h => h === null));
});

test('Boop-a-Bun pace changes real pop-up time, crowding and spawn rate; pause freezes the garden', () => {
  const spawned = BOOP_PACES.map(pace => { const g = new BoopGame({ pace, random: () => .3 }); g.start(); for (let i = 0; i < 60; i++) g.update(.05); return g; });
  const lives = BOOP_PACES.map(pace => { const g = new BoopGame({ pace, random: () => .3 }); g.spawn(); return g.holes.find(Boolean).life; });
  assert.ok(lives[0] > lives[1] && lives[1] > lives[2], 'Chill bunnies stay up longest');
  assert.ok(spawned[0].holes.filter(Boolean).length <= 2 && spawned[2].holes.filter(Boolean).length <= 4);
  const g = new BoopGame({ random: () => .3 }); g.start(); g.update(.5); g.pause();
  const frozen = JSON.stringify([g.timeLeft, g.holes]); g.update(1); assert.equal(JSON.stringify([g.timeLeft, g.holes]), frozen);
});

test('Boop-a-Bun saves restore paused with an empty garden, and tampered saves are rejected', () => {
  const g = new BoopGame({ pace: 'chaos', random: () => .5 }); g.start(); g.holes[0] = critter('bun'); g.boop(0); g.update(.3);
  const saved = g.snapshot(), back = new BoopGame({ saved });
  assert.equal(back.status, 'paused'); assert.equal(back.score, 10); assert.equal(back.pace, 'chaos'); assert.ok(back.holes.every(h => h === null));
  const bad = patch => new BoopGame().restore({ ...saved, ...patch });
  assert.equal(bad({ timeLeft: 99 }), false); assert.equal(bad({ status: 'dead' }), false, 'dead needs the clock at zero');
  assert.equal(bad({ status: 'dead', timeLeft: 0 }), true); assert.equal(bad({ pace: 'turbo' }), false);
});

test('Boop-a-Bun renderer maps taps to burrows and draws every state', () => {
  assert.equal(boopHoleAt(70, 150), 0); assert.equal(boopHoleAt(290, 370), 8); assert.equal(boopHoleAt(180, 260), 4); assert.equal(boopHoleAt(180, 40), -1);
  const text = [];
  const ctx = new Proxy({ createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }) }, {
    get(target, name) { return name in target ? target[name] : (...args) => { if (name === 'fillText') text.push(args[0]); }; },
    set(target, name, value) { target[name] = value; return true; },
  });
  const canvas = { width: 720, height: 904, getContext: () => ctx }, g = new BoopGame({ random: () => .5 });
  drawBoopABun(canvas, g, {}); g.start(); g.holes[0] = critter('bun'); g.holes[1] = critter('gold'); g.holes[2] = critter('bot'); g.boop(0); drawBoopABun(canvas, g, {});
  g.timeLeft = 0; g.update(.1); drawBoopABun(canvas, g, {});
  assert.ok(text.includes('BOOP-A-BUN')); assert.ok(text.includes('+10')); assert.ok(text.includes('TIME’S UP!'));
});
