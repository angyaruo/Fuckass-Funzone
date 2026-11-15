import test from 'node:test';
import assert from 'node:assert/strict';
import { drawGambit, gambitActions, gambitHitAt } from '../src/gambit-render.js';
import { GAMBIT_JOKERS } from '../src/gambit-rules.js';

function fixture(overrides = {}) {
  return { status: 'playing', phase: 'play', won: false, round: 1, target: 180,
    roundScore: 30, score: 30, money: 8, playsLeft: 4, discardsLeft: 3,
    deck: Array.from({ length: 44 }, (_, id) => id + 8), hand: [0, 1, 2, 3, 4, 5, 6, 7], selected: [],
    jokers: ['pair_gremlin', 'growing_suspicion', 'last_laugh'], handLevels: {}, cardBoosts: {},
    preview: () => null, scoreTime: .5,
    shop: [{ kind: 'joker', id: 'velvet_flush', price: 4, sold: false },
      { kind: 'joker', id: 'heart_hoarder', price: 4, sold: true },
      { kind: 'pack', pack: 'joker', price: 4, sold: false }, { kind: 'pack', pack: 'upgrade', price: 3, sold: false }],
    pack: { kind: 'joker', selected: null, options: [{ kind: 'joker', id: 'heart_hoarder' }, { kind: 'joker', id: 'last_laugh' }, { kind: 'joker', id: 'straight_talker' }] },
    pendingJoker: 'velvet_flush',
    lastResult: { name: 'Pair', chips: 30, mult: 6, total: 180,
      steps: [{ label: 'Base Pair', chips: 10, mult: 2 }, { label: 'Scoring cards', chips: 30, mult: 2 }, { label: 'Pair Gremlin +4 Mult', chips: 30, mult: 6 }] },
    ...overrides };
}
function mockCanvas() {
  const calls = [], labels = [];
  const ctx = new Proxy({
    measureText(value) { const size = Number(this.font.match(/([\d.]+)px/)?.[1] || 12); return { width: String(value).length * size * .55 }; },
    fillText(value, x, y, maxWidth) {
      const measured = this.measureText(value).width;
      const width = maxWidth ? Math.min(measured, maxWidth) : measured;
      const start = this.textAlign === 'center' ? x - width / 2 : this.textAlign === 'right' ? x - width : x;
      labels.push({ value: String(value), x, y, width, start, end: start + width, color: this.fillStyle });
    },
    setTransform(...args) { calls.push(['setTransform', ...args]); },
  }, { get(target, key) { return key in target ? target[key] : () => {}; }, set(target, key, value) { target[key] = value; return true; } });
  return { width: 720, height: 904, getContext: () => ctx, calls, labels };
}

test('logical action rectangles stay disjoint and inside the cabinet across every phase', () => {
  for (const phase of ['play', 'score', 'shop', 'pack', 'replace']) {
    const game = fixture({ phase, selected: [0, 7] });
    const actions = gambitActions(game);
    for (const action of actions) {
      assert.ok(action.x >= 0 && action.y >= 0 && action.x + action.w <= 360 && action.y + action.h <= 452, `${phase} ${action.kind} fits`);
      const hit = gambitHitAt(action.x + action.w / 2, action.y + action.h / 2, game);
      if (action.enabled) assert.equal(hit?.kind, action.kind, `${phase} ${action.kind} receives its own tap`);
    }
    for (let i = 0; i < actions.length; i++) for (let j = i + 1; j < actions.length; j++) {
      const a = actions[i], b = actions[j];
      const overlap = Math.min(a.x + a.w, b.x + b.w) > Math.max(a.x, b.x) && Math.min(a.y + a.h, b.y + b.h) > Math.max(a.y, b.y);
      assert.equal(overlap, false, `${phase} ${a.kind} and ${b.kind} have separate touch regions`);
    }
  }
});

test('selection, exhausted resources, paid offers, and explicit pack confirmation control input availability', () => {
  const game = fixture();
  assert.equal(gambitHitAt(220, 415, game), null, 'empty hand cannot be played');
  assert.equal(gambitHitAt(90, 415, game), null, 'empty selection cannot be discarded');
  game.selected = [0]; assert.equal(gambitHitAt(220, 415, game)?.kind, 'play');
  game.deck = []; assert.equal(gambitHitAt(90, 415, game), null, 'cannot discard into an empty draw deck');
  game.phase = 'shop'; assert.equal(gambitHitAt(100, 130, game)?.kind, 'buy');
  assert.equal(gambitHitAt(100, 194, game), null, 'sold offer is inert');
  game.money = 0; assert.equal(gambitHitAt(100, 130, game), null, 'unaffordable offer is inert');
  game.phase = 'pack'; assert.equal(gambitHitAt(100, 415, game), null, 'Choose requires an inspected pack option');
  game.pack.selected = 2; assert.equal(gambitHitAt(100, 415, game)?.kind, 'claim');
  for (const status of ['idle', 'paused', 'dead']) { game.status = status; assert.deepEqual(gambitActions(game), []); }
  assert.equal(gambitHitAt(NaN, 20, game), null); assert.equal(gambitHitAt(12, Infinity, game), null);
});

test('Joker inspection blocks background controls and exposes selling only in the shop', () => {
  const game = fixture(), view = { inspection: 'pair_gremlin' };
  assert.deepEqual(gambitActions(game, view).map(action => action.kind), ['close']);
  assert.equal(gambitHitAt(35, 280, game, view), null, 'inspection consumes card taps');
  game.phase = 'shop';
  const actions = gambitActions(game, view);
  assert.deepEqual(actions.map(action => action.kind), ['close', 'sell']);
  assert.equal(actions[1].index, 0); assert.equal(gambitHitAt(300, 410, game, view)?.kind, 'sell');
});

test('action labels describe actual cards, effects, pack choices, and replacement decisions', () => {
  const game = fixture({ hand: [0, 22, 38, 51], selected: [22], cardBoosts: { 22: 10 } });
  const labels = gambitActions(game).filter(item => item.kind === 'card').map(item => item.label);
  assert.equal(labels[0], 'Ace of Clubs, unselected');
  assert.match(labels[1], /^10 of Diamonds, selected\. Bonus 10 chips/);
  assert.equal(labels[2], 'King of Spades, unselected');
  assert.equal(labels[3], 'King of Hearts, unselected');
  game.phase = 'shop';
  const offers = gambitActions(game).filter(item => item.kind === 'buy');
  assert.match(offers[0].label, /Buy Velvet Flush for 4 run coins.*Mult/);
  assert.match(offers[2].label, /Joker Pack.*three Jokers/);
  game.jokers.push('velvet_flush');
  assert.equal(gambitActions(game).find(item => item.kind === 'buy' && item.index === 0).enabled, false, 'a Joker acquired through a pack cannot be bought twice');
  assert.match(gambitActions(game).find(item => item.kind === 'buy' && item.index === 0).label, /^Already equipped/);
  game.phase = 'pack'; game.pack.selected = 1;
  const choices = gambitActions(game).filter(item => item.kind === 'packOption');
  assert.match(choices[0].label, /Heart Hoarder.*20 chips/);
  assert.match(choices[1].label, /^Selected: Last Laugh.*1\.5/);
  game.phase = 'replace'; game.jokers.pop();
  assert.match(gambitActions(game)[0].label, /^Replace Pair Gremlin with Velvet Flush\. Current boost:/);
});

test('score counting highlights each calculation while reduced motion reveals the complete breakdown immediately', () => {
  const game = fixture({ phase: 'score', scoreTime: 0 });
  const labelsAt = (elapsed, reduced = false) => {
    const canvas = mockCanvas(); game.scoreTime = elapsed;
    drawGambit(canvas, game, { reduced });
    return canvas.labels.filter(label => game.lastResult.steps.some(step => step.label === label.value));
  };
  let labels = labelsAt(0);
  assert.equal(labels[0].color, '#86d6c6', 'base calculation starts highlighted');
  assert.equal(labels[1].color, '#627783', 'future calculation remains visible but dimmed');
  labels = labelsAt(.5); assert.equal(labels[1].color, '#86d6c6', 'highlight advances to card chips');
  labels = labelsAt(1); assert.equal(labels[2].color, '#86d6c6', 'highlight reaches the Joker contribution');
  assert.ok(labelsAt(1.2).every(label => label.color !== '#627783'), 'finished calculation reveals all rows');
  assert.ok(labelsAt(0, true).every(label => label.color !== '#627783' && label.color !== '#86d6c6'), 'reduced motion shows the final breakdown without counting');
  assert.equal(gambitActions(game).at(-1).kind, 'continue', 'the player can continue at every animation step');
});

test('deck resources and upgrade offers show their resulting level explicitly', () => {
  const canvas = mockCanvas(), game = fixture(); drawGambit(canvas, game);
  assert.ok(canvas.labels.some(label => label.value === '44 IN DECK'));
  game.phase = 'pack'; game.pack = { kind: 'upgrade', selected: null, options: [{ kind: 'hand', id: 'pair' }] };
  const first = mockCanvas(); drawGambit(first, game);
  assert.ok(first.labels.some(label => label.value === 'LEVEL 1 TO 2'));
  game.handLevels.pair = 3; const upgraded = mockCanvas(); drawGambit(upgraded, game);
  assert.ok(upgraded.labels.some(label => label.value === 'LEVEL 4 TO 5'));
});

test('high-DPI painting keeps legible text within bounds for all screens and every original Joker', () => {
  for (const phase of ['play', 'score', 'shop', 'pack', 'replace']) {
    for (const status of ['playing', 'paused', 'idle', 'dead']) {
      const canvas = mockCanvas(), game = fixture({ phase, status });
      drawGambit(canvas, game, { best: 999999999, reduced: true, cursor: 0 });
      assert.deepEqual(canvas.calls[0], ['setTransform', 2, 0, 0, 2, 0, 0], 'paints the whole production canvas');
      for (const label of canvas.labels) {
        assert.ok(label.start >= 8 && label.end <= 352, `${phase}/${status}: ${label.value} fits horizontally (${label.start}..${label.end})`);
        assert.ok(label.y >= 10 && label.y <= 443, `${phase}/${status}: ${label.value} fits vertically`);
      }
    }
  }
  for (const joker of GAMBIT_JOKERS) {
    const canvas = mockCanvas(); drawGambit(canvas, fixture(), { inspection: joker.id });
    assert.ok(canvas.labels.some(label => label.value === joker.name));
    assert.ok(canvas.labels.some(label => label.value.includes('ACTIVE FOR THIS RUN')));
    assert.ok(canvas.labels.every(label => label.start >= 8 && label.end <= 352));
  }
});
