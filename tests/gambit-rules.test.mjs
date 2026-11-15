import test from 'node:test';
import assert from 'node:assert/strict';
import { GAMBIT_HANDS, GAMBIT_JOKERS, evaluateGambitHand, scoreGambitHand } from '../src/gambit-rules.js';

const card = (rank, suit = 0) => suit * 13 + rank - 1;
const evaluate = (...cards) => evaluateGambitHand(cards);

test('all nine categories are recognized, including Ace-low and Ace-high straights', () => {
  assert.equal(evaluate(card(1), card(4, 1), card(8, 2)).id, 'high_card');
  assert.equal(evaluate(card(7), card(7, 1)).id, 'pair');
  assert.equal(evaluate(card(7), card(7, 1), card(12), card(12, 2)).id, 'two_pair');
  assert.equal(evaluate(card(8), card(8, 1), card(8, 2), card(3)).id, 'three_kind');
  assert.equal(evaluate(card(1), card(2, 1), card(3, 2), card(4, 3), card(5)).id, 'straight');
  assert.equal(evaluate(card(10), card(11, 1), card(12, 2), card(13, 3), card(1)).id, 'straight');
  assert.equal(evaluate(card(2, 1), card(4, 1), card(7, 1), card(11, 1), card(13, 1)).id, 'flush');
  assert.equal(evaluate(card(8), card(8, 1), card(8, 2), card(3), card(3, 3)).id, 'full_house');
  assert.equal(evaluate(card(8), card(8, 1), card(8, 2), card(8, 3), card(3)).id, 'four_kind');
  assert.equal(evaluate(card(1, 3), card(2, 3), card(3, 3), card(4, 3), card(5, 3)).id, 'straight_flush');
  assert.equal(evaluate(card(12), card(13, 1), card(1, 2), card(2, 3), card(3)).id, 'high_card', 'Ace cannot wrap through King to Two');
});

test('only contributing cards score; kicks and extra cards cannot trigger scoring-card boosts', () => {
  const pair = [card(5), card(5, 1), card(1, 3), card(11, 2), card(9, 2)];
  assert.deepEqual(evaluateGambitHand(pair).scoringCards, pair.slice(0, 2));
  const score = scoreGambitHand(pair, ['heart_hoarder', 'pocket_ace', 'face_value']);
  assert.equal(score.total, 40, '(10 base + two Fives) × 2');
  assert.equal(score.steps.length, 2, 'non-scoring Heart, Ace, and face card trigger nothing');
  const twoPair = [card(2), card(2, 1), card(13), card(13, 2), card(1, 3)];
  assert.deepEqual(evaluateGambitHand(twoPair).scoringCards, twoPair.slice(0, 4));
  const four = [card(2), card(2, 1), card(2, 2), card(2, 3), card(1)];
  assert.deepEqual(evaluateGambitHand(four).scoringCards, four.slice(0, 4));
  const trips = [card(3), card(3, 1), card(3, 2), card(13), card(1, 3)];
  assert.deepEqual(evaluateGambitHand(trips).scoringCards, trips.slice(0, 3));
  assert.deepEqual(evaluate(card(3), card(1, 1), card(13, 3)).scoringCards, [card(1, 1)]);
});

test('flushes and straights need five cards, while a full house scores all five', () => {
  assert.equal(evaluate(card(2), card(3), card(4), card(5)).id, 'high_card');
  const full = [card(9), card(9, 1), card(9, 2), card(4, 1), card(4, 2)];
  assert.deepEqual(evaluateGambitHand(full).scoringCards, full);
  assert.equal(scoreGambitHand(full, ['pair_gremlin']).mult, 8, 'a full house contains a repeated rank');
});

test('Jokers resolve flat chips, added Mult, then multiplied Mult regardless of slot order', () => {
  const pair = [card(7), card(7, 3)];
  const jokers = ['last_laugh', 'pair_gremlin', 'heart_hoarder'];
  const first = scoreGambitHand(pair, jokers, {}, { playsLeft: 1 });
  assert.equal(first.chips, 44); assert.equal(first.mult, 9); assert.equal(first.total, 396);
  assert.deepEqual(first.steps.slice(2).map(step => step.label.split(':')[0]), ['Heart Hoarder', 'Pair Gremlin', 'Last Laugh']);
  const reversed = scoreGambitHand(pair, [...jokers].reverse(), {}, { playsLeft: 1 });
  assert.equal(reversed.total, first.total);
  assert.equal(scoreGambitHand(pair, jokers, {}, { playsLeft: 2 }).mult, 6);
});

test('hand levels and individual card enhancements affect the preview without mutation', () => {
  const cards = [card(6), card(6, 1), card(1, 2)];
  const levels = { pair: 2 }, cardBoosts = { [cards[0]]: 10, [cards[2]]: 30 };
  const initial = structuredClone({ cards, levels, cardBoosts });
  const score = scoreGambitHand(cards, [], levels, { cardBoosts });
  assert.equal(score.chips, 62); assert.equal(score.mult, 4); assert.equal(score.total, 248);
  assert.deepEqual({ cards, levels, cardBoosts }, initial, 'preview is a pure read');
  assert.equal(scoreGambitHand([0], [], Object.create({ high_card: 5 }), { cardBoosts: Object.create({ 0: 30 }) }).total, 16,
    'inherited properties do not masquerade as purchased upgrades');
});

test('all twelve original Joker effects have deterministic, conditional outcomes', () => {
  assert.equal(GAMBIT_JOKERS.length, 12); assert.equal(new Set(GAMBIT_JOKERS.map(joker => joker.id)).size, 12);
  const high = [card(13)], ace = [card(1)], pair = [card(2), card(2, 1)];
  assert.equal(scoreGambitHand(high, ['lonely_crown']).chips, 50);
  assert.equal(scoreGambitHand(pair, ['lonely_crown']).chips, 14);
  assert.equal(scoreGambitHand(ace, ['pocket_ace']).mult, 4);
  assert.equal(scoreGambitHand(high, ['face_value']).chips, 23);
  assert.equal(scoreGambitHand(high, ['club_regular']).chips, 27);
  assert.equal(scoreGambitHand(high, ['growing_suspicion'], {}, { round: 4 }).chips, 30);
  assert.equal(scoreGambitHand(high, ['clean_slate']).mult, 4);
  assert.equal(scoreGambitHand(high, ['clean_slate'], {}, { discardsUsed: 1 }).mult, 1);
  assert.equal(scoreGambitHand(pair, ['little_scheme']).mult, 5);
  const straight = [card(2), card(3, 1), card(4, 2), card(5, 3), card(6)];
  assert.equal(scoreGambitHand(straight, ['straight_talker']).mult, 6.4);
  const flush = [card(2), card(4), card(6), card(8), card(10)];
  assert.equal(scoreGambitHand(flush, ['velvet_flush']).mult, 6);
  const straightFlush = [card(2), card(3), card(4), card(5), card(6)];
  assert.equal(scoreGambitHand(straightFlush, ['straight_talker', 'velvet_flush']).mult, 19.2);
});

test('invalid or sparse hands and malformed effect data are rejected safely', () => {
  const invalid = [null, {}, [], [0, 0], [52], [-1], [1.5], [NaN], [0, 1, 2, 3, 4, 5], Array(2)];
  for (const cards of invalid) { assert.equal(evaluateGambitHand(cards), null); assert.equal(scoreGambitHand(cards), null); }
  for (const jokers of [['missing'], ['pair_gremlin', 'pair_gremlin'], Array(1), {}, null]) assert.equal(scoreGambitHand([0], jokers), null);
  for (const levels of [null, [], { missing: 1 }, { pair: -1 }, { pair: 6 }, { pair: 1.5 }]) assert.equal(scoreGambitHand([0], [], levels), null);
  for (const context of [null, [], { round: 0 }, { round: 7 }, { playsLeft: 0 }, { playsLeft: 5 },
    { discardsUsed: 4 }, { cardBoosts: null }, { cardBoosts: { '01': 10 } }, { cardBoosts: { 52: 10 } }, { cardBoosts: { 0: 31 } }]) {
    assert.equal(scoreGambitHand([0], [], {}, context), null);
  }
  assert.equal(Object.isFrozen(GAMBIT_HANDS), true); assert.equal(Object.isFrozen(GAMBIT_JOKERS[0]), true);
});
