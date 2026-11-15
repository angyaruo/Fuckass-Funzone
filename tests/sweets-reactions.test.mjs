import test from 'node:test';
import assert from 'node:assert/strict';
import { ReactionDirector } from '../src/reactions.js';

const say = (game, event, data) => { const d = new ReactionDirector(); return d.emit(game, event, data); };

test('in games against Gabu, Gabu winning is hype, Gabu losing is panic, and a draw is dizzy', () => {
  for (const game of ['chess', 'berry', 'tictac', 'wafer']) {
    assert.equal(say(game, 'death').art, 'gabu_hype', `${game}: Gabu celebrates beating you`);
    assert.equal(say(game, 'win').art, 'gabu_panic', `${game}: Gabu melts down when you win`);
  }
  for (const game of ['chess', 'berry', 'tictac']) assert.equal(say(game, 'draw').art, 'gabu_dizzy');
});

test('solo games keep Kitty’s rules: dying is panic, a new record is hype, ordinary progress is smug', () => {
  for (const game of ['cake', 'bubble', 'boop']) assert.equal(say(game, 'death').art, 'gabu_panic');
  for (const game of ['chess', 'berry', 'tictac', 'cake', 'bubble', 'boop', 'wafer', 'memory']) {
    const r = say(game, 'new_best'); assert.equal(r.art, 'gabu_hype'); assert.equal(r.priority, 5);
  }
  assert.equal(say('bubble', 'pop').art, 'gabu_smug'); assert.equal(say('wafer', 'pull').art, 'gabu_smug');
  assert.equal(say('memory', 'match').art, 'gabu_smug'); assert.equal(say('cake', 'land').art, 'gabu_annoyed');
  assert.equal(say('bird', 'death').art, 'gabu_panic'); assert.equal(say('bird', 'new_best').art, 'gabu_hype');
});

test('ordinary progress lines are throttled, so Gabu does not comment on every pop, boop or pull', () => {
  const d = new ReactionDirector(), spoke = event => { let n = 0; for (let i = 0; i < 24; i++) { d.clear(); if (d.emit(...event)) n++; } return n; };
  assert.equal(spoke(['bubble', 'pop']), 6); assert.equal(spoke(['boop', 'boop']), 3); assert.equal(spoke(['wafer', 'pull']), 8);
  assert.equal(spoke(['chess', 'move']), 0, 'ordinary chess moves stay quiet');
});
