import test from 'node:test';
import assert from 'node:assert/strict';
import { SolitaireGame } from '../src/solitaire.js';
import { drawSolitaire, solitaireHitAt } from '../src/solitaire-render.js';

function fixture({ tableau = [[], [], [], [], [], [], []], waste = [], foundations = [[], [], [], []], status = 'paused' } = {}) {
  const used = new Set([...waste, ...foundations.flat(), ...tableau.flat().map(card => card.id)]);
  const score = foundations.flat().length * 10;
  return { version: 1, stock: Array.from({ length: 52 }, (_, id) => id).filter(id => !used.has(id)),
    waste, foundations, tableau, status, moves: 0, recycles: 0, score, won: score === 520 };
}
const up = id => ({ id, faceUp: true }), down = id => ({ id, faceUp: false });
const column = (index, card) => ({ pile: 'tableau', index, ...(card === undefined ? {} : { card }) });
const foundation = index => ({ pile: 'foundation', index });
const allCards = game => [...game.stock, ...game.waste, ...game.foundations.flat(), ...game.tableau.flat().map(card => card.id)];

test('Klondike deals every card exactly once, seven exposed tops and 24 in the stock', () => {
  const game = new SolitaireGame({ random: () => .37 }), same = new SolitaireGame({ random: () => .37 });
  assert.equal(game.status, 'idle'); assert.equal(game.stock.length, 24);
  assert.deepEqual(game.tableau.map(pile => pile.length), [1, 2, 3, 4, 5, 6, 7]);
  assert.equal(game.tableau.flat().filter(card => card.faceUp).length, 7);
  assert.ok(game.tableau.every(pile => pile.at(-1).faceUp));
  assert.equal(new Set(allCards(game)).size, 52); assert.deepEqual(game.snapshot(), same.snapshot());
  const snapshot = game.snapshot(); snapshot.tableau[0][0].id = 500;
  assert.notEqual(game.tableau[0][0].id, 500, 'snapshots do not alias the board');
});

test('stock draws one at a time and recycles in the original order with reversible actions', () => {
  const game = new SolitaireGame({ random: () => .6 }), original = game.stock.slice();
  assert.equal(game.drawStock(), true); assert.equal(game.waste.length, 1);
  assert.equal(game.waste.at(-1), original.at(-1));
  for (let i = 1; i < 24; i++) game.drawStock();
  assert.equal(game.stock.length, 0); const emptyStock = game.snapshot();
  assert.equal(game.drawStock(), true); assert.equal(game.waste.length, 0);
  assert.deepEqual(game.stock, original); assert.equal(game.recycles, 1);
  assert.equal(game.undo(), true); assert.deepEqual(game.snapshot(), emptyStock);
  game.drawStock(); game.drawStock(); assert.equal(game.waste.at(-1), original.at(-1));
  assert.equal(new Set(allCards(game)).size, 52);
});

test('tableau accepts descending alternating runs and reveals a hidden card; undo reverses both', () => {
  const game = new SolitaireGame({ saved: fixture({ tableau: [[down(6), up(18), up(30)], [up(32)], [], [], [], [], []] }) });
  game.start(); const before = game.snapshot();
  assert.equal(game.move(column(0, 0), column(1)), false, 'hidden cards cannot move');
  assert.equal(game.move(column(0, 1), column(1)), true);
  assert.deepEqual(game.tableau[0], [up(6)]);
  assert.deepEqual(game.tableau[1], [up(32), up(18), up(30)]);
  assert.equal(game.undo(), true); assert.deepEqual(game.snapshot(), before);
  const badColor = new SolitaireGame({ saved: fixture({ tableau: [[up(18)], [up(19)], [], [], [], [], []] }) });
  badColor.start(); const unchanged = badColor.snapshot();
  assert.equal(badColor.move(column(0), column(1)), false);
  assert.deepEqual(badColor.snapshot(), unchanged);
});

test('empty columns require kings and foundation piles require ascending cards of their own suit', () => {
  const game = new SolitaireGame({ saved: fixture({ tableau: [[up(12)], [up(11)], [], [], [], [], []], waste: [1, 0] }) });
  game.start();
  assert.equal(game.move(column(1), column(2)), false, 'a queen cannot start an empty column');
  assert.equal(game.move(column(0), column(2)), true);
  assert.equal(game.move({ pile: 'waste' }, foundation(1)), false, 'ace must match foundation suit');
  assert.equal(game.move({ pile: 'waste' }, foundation(0)), true); assert.equal(game.score, 10);
  assert.equal(game.autoMove({ pile: 'waste' }), true); assert.deepEqual(game.foundations[0], [0, 1]);
  assert.equal(game.score, 20); assert.equal(new Set(allCards(game)).size, 52);
});

test('selection, keyboard destinations and pause behave without advancing or discarding cards', () => {
  const game = new SolitaireGame({ saved: fixture({ tableau: [[up(12)], [up(24)], [], [], [], [], []] }) });
  game.start(); assert.equal(game.select(column(2)), false, 'empty destination without a source changes nothing');
  assert.equal(game.select(column(0, 0)), true); assert.deepEqual(game.selection, column(0, 0));
  assert.equal(game.select(column(2)), true); assert.deepEqual(game.tableau[2], [up(12)]);
  const targets = game.keyboardHits();
  assert.equal(targets.filter(hit => hit.pile === 'foundation').length, 4);
  assert.ok(targets.some(hit => hit.pile === 'tableau' && hit.index === 0 && hit.card === undefined));
  assert.ok(targets.some(hit => hit.pile === 'tableau' && hit.index === 2 && hit.card === 0));
  game.pause(); const paused = game.snapshot();
  assert.equal(game.select({ pile: 'stock' }), false); assert.equal(game.drawStock(), false); assert.equal(game.undo(), false);
  game.update(9999); assert.deepEqual(game.snapshot(), paused);
  game.start(); assert.equal(game.status, 'playing');
});

test('restore preserves a legitimate deal paused and rejects missing/duplicate/badly ordered cards atomically', () => {
  const game = new SolitaireGame({ random: () => .43 }); game.drawStock();
  const saved = game.snapshot(), restored = new SolitaireGame({ saved });
  assert.equal(restored.status, 'paused'); assert.deepEqual(restored.snapshot(), saved);
  const corruptions = [
    data => data.stock.pop(),
    data => { data.stock[0] = data.stock[1]; },
    data => { data.tableau[0][0].faceUp = false; },
    data => { data.foundations[0] = [5]; },
    data => { data.score = 100; },
    data => { data.won = true; },
    data => { data.tableau[1][0].faceUp = true; },
    data => { data.moves = NaN; }
  ];
  for (const mutate of corruptions) {
    const invalid = structuredClone(saved); mutate(invalid);
    assert.equal(restored.restore(invalid), false); assert.deepEqual(restored.snapshot(), saved);
  }
});

test('putting the final king away wins once, survives save, and can be undone', () => {
  const foundations = Array.from({ length: 4 }, (_, suit) => Array.from({ length: suit === 3 ? 12 : 13 }, (__, rank) => suit * 13 + rank));
  const events = [], snapshots = [], game = new SolitaireGame({ saved: fixture({ foundations, tableau: [[up(51)], [], [], [], [], [], []] }),
    onEvent: name => { events.push(name); if (name === 'move' || name === 'score' || name === 'win') snapshots.push(game.snapshot()); } });
  game.start(); assert.equal(game.autoMove(column(0)), true);
  assert.equal(game.won, true); assert.equal(game.status, 'dead'); assert.equal(game.score, 520);
  assert.equal(events.filter(name => name === 'win').length, 1);
  for (const saved of snapshots) {
    assert.equal(saved.won, true); assert.equal(saved.status, 'dead');
    assert.equal(new SolitaireGame().restore(saved), true, 'every victory event exposes a valid final-state snapshot');
  }
  const copy = new SolitaireGame({ saved: game.snapshot() }); assert.equal(copy.won, true); assert.equal(copy.status, 'dead');
  assert.equal(game.select({ pile: 'stock' }), false); assert.equal(game.undo(), true);
  assert.equal(game.won, false); assert.equal(game.status, 'playing'); assert.equal(game.score, 510);
  assert.deepEqual(game.tableau[0], [up(51)]);
});

test('restore rejects impossible hidden stacks that could overflow the compact table', () => {
  const game = new SolitaireGame({ random: () => .2 }), before = game.snapshot();
  const invalid = fixture({ tableau: [[...Array.from({ length: 7 }, (_, id) => down(id)), up(12)], [], [], [], [], [], []] });
  assert.equal(game.restore(invalid), false); assert.deepEqual(game.snapshot(), before);
});

test('canvas hit testing distinguishes exposed cards, hidden cards, empty targets and out-of-bounds points', () => {
  const game = new SolitaireGame({ saved: fixture({ tableau: [[down(6), up(18), up(30)], [], [], [], [], [], []] }) });
  assert.deepEqual(solitaireHitAt(25, 80, game), { pile: 'stock' });
  assert.deepEqual(solitaireHitAt(175, 80, game), foundation(0));
  assert.equal(solitaireHitAt(15, 154, game), null, 'hidden top strip is not selectable');
  assert.deepEqual(solitaireHitAt(15, 165, game), column(0, 1));
  assert.deepEqual(solitaireHitAt(15, 190, game), column(0, 2));
  assert.deepEqual(solitaireHitAt(65, 180, game), column(1));
  assert.equal(solitaireHitAt(-1, 0, game), null); assert.equal(solitaireHitAt(NaN, 0, game), null);
});

test('renderer keeps a long legal tableau within the canvas and draws suits without font glyphs', () => {
  const calls = [], ctx = new Proxy({ createLinearGradient: () => ({ addColorStop() {} }) }, {
    get(target, key) { if (key in target) return target[key]; return (...args) => { calls.push([key, ...args]); }; },
    set(target, key, value) { target[key] = value; return true; }
  });
  const run = Array.from({ length: 13 }, (_, i) => up((i % 2 ? 13 : 0) + 12 - i));
  const game = new SolitaireGame({ saved: fixture({ tableau: [run, [], [], [], [], [], []] }) }); game.start();
  drawSolitaire({ width: 720, height: 904, getContext: () => ctx }, game, { cursor: column(0, 12) });
  const cards = calls.filter(([name, , , width, height]) => name === 'roundRect' && width === 44 && height === 62);
  assert.ok(cards.length >= 13);
  assert.ok(cards.every(([, x, y, width, height]) => x >= 0 && x + width <= 360 && y >= 0 && y + height <= 402));
  assert.ok(calls.some(([name]) => name === 'bezierCurveTo'), 'vector suits draw paths');
  assert.ok(!calls.filter(([name]) => name === 'fillText').some(call => /[\u2660-\u2667\u{1F000}-\u{1FAFF}]/u.test(String(call[1]))));
});
