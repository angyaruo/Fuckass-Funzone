import test from 'node:test';
import assert from 'node:assert/strict';
import { GAMBIT_SUIT_COLORS, drawGambitCard, drawGambitJoker, drawGambitDeck, drawGambitPack } from '../src/gambit-art.js';
import { GAMBIT_JOKERS } from '../src/gambit-rules.js';

function recordingContext() {
  const calls = [], fills = [], labels = [], stack = [];
  const state = { fillStyle: '#000', strokeStyle: '#000', lineWidth: 1, font: '', textAlign: 'left', textBaseline: 'alphabetic' };
  const ctx = new Proxy({
    save() { stack.push({ ...state }); calls.push(['save']); },
    restore() { assert.ok(stack.length, 'restore has a matching save'); Object.assign(state, stack.pop()); calls.push(['restore']); },
    fill() { fills.push(state.fillStyle); calls.push(['fill', state.fillStyle]); },
    fillText(value, ...args) { labels.push({ value: String(value), color: state.fillStyle }); calls.push(['fillText', String(value), ...args]); },
  }, {
    get(target, key) {
      if (key in target) return target[key];
      if (key in state) return state[key];
      return (...args) => { assert.ok(args.filter(arg => typeof arg === 'number').every(Number.isFinite), key + ' has finite coordinates'); calls.push([key, ...args]); };
    },
    set(_, key, value) { state[key] = value; return true; },
  });
  return { ctx, calls, fills, labels, state, stack };
}

test('four suits have distinct colors and number cards contain their actual pips plus mirrored corner suits', () => {
  assert.equal(new Set(GAMBIT_SUIT_COLORS).size, 4);
  assert.ok(Object.isFrozen(GAMBIT_SUIT_COLORS));
  for (let suit = 0; suit < 4; suit++) for (let rank = 2; rank <= 10; rank++) {
    const art = recordingContext(); drawGambitCard(art.ctx, suit * 13 + rank - 1, 5, 9, 70, 100);
    assert.equal(art.fills.filter(color => color === GAMBIT_SUIT_COLORS[suit]).length, rank + 2, `suit ${suit} rank ${rank} has exact pips`);
    assert.equal(art.labels.filter(label => label.value === String(rank)).length, 2, 'rank appears in both corners');
    assert.ok(art.calls.some(call => call[0] === 'rotate' && call[1] === Math.PI), 'lower indices are mirrored');
    assert.equal(art.stack.length, 0);
  }
});

test('Aces use a large central suit and court ranks have distinct mirrored illustrations', () => {
  const ace = recordingContext(); drawGambitCard(ace.ctx, 0, 0, 0, 70, 100);
  assert.equal(ace.fills.filter(color => color === GAMBIT_SUIT_COLORS[0]).length, 3, 'Ace has one central suit and two corner suits');
  assert.equal(ace.labels.filter(label => label.value === 'A').length, 2);
  const geometry = [];
  for (let rank = 11; rank <= 13; rank++) {
    const art = recordingContext(); drawGambitCard(art.ctx, rank - 1, 0, 0, 70, 100);
    const label = ({11:'J',12:'Q',13:'K'})[rank];
    assert.equal(art.labels.filter(item => item.value === label).length, 2);
    geometry.push(JSON.stringify(art.calls.filter(call => call[0] !== 'fillText')));
  }
  assert.equal(new Set(geometry).size, 3, 'Jack, Queen, and King differ in drawing geometry, not just letters');
});

test('every Joker has distinct original geometry and a card silhouette', () => {
  const drawings = [];
  for (const joker of GAMBIT_JOKERS) {
    const art = recordingContext(); drawGambitJoker(art.ctx, joker.id, 17, 4, 60, 86, { selected: true });
    assert.ok(art.calls.some(call => call[0] === 'roundRect' && call[3] === 98 && call[4] === 136), joker.id + ' uses a playing-card frame');
    assert.equal(art.labels.filter(label => label.value.length === 1 && 'JOKER'.includes(label.value)).length, 5, 'Joker has its vertical label');
    assert.equal(art.stack.length, 0);
    drawings.push(JSON.stringify(art.calls.filter(call => !['fillText', 'fill', 'stroke'].includes(call[0]))));
  }
  assert.equal(new Set(drawings).size, 12, 'all twelve Joker symbols have different path geometry');
});

test('card fanning, boosts, sealed boosters, and deck counts keep the parent canvas state intact', () => {
  const art = recordingContext(); art.ctx.fillStyle = '#123456'; art.ctx.font = '12px serif';
  drawGambitCard(art.ctx, 51, 10, 20, 56, 80, { selected: true, boost: 20, tilt: -.12 });
  assert.ok(art.calls.some(call => call[0] === 'rotate' && call[1] === -.12));
  assert.ok(art.labels.some(label => label.value === '+20'));
  assert.equal(art.state.fillStyle, '#123456'); assert.equal(art.state.font, '12px serif');
  drawGambitDeck(art.ctx, 10, 20, 50, 80, 37);
  assert.ok(art.labels.some(label => label.value === '37/52'));
  const joker = recordingContext(), upgrade = recordingContext();
  drawGambitPack(joker.ctx, 'joker', 0, 0, 55, 85); drawGambitPack(upgrade.ctx, 'upgrade', 0, 0, 55, 85);
  assert.ok(joker.labels.some(label => label.value === 'JOKER')); assert.ok(upgrade.labels.some(label => label.value === 'UPGRADE'));
  assert.notDeepEqual(joker.calls.filter(call => call[0] !== 'fillText'), upgrade.calls.filter(call => call[0] !== 'fillText'));
  assert.equal(art.stack.length, 0); assert.equal(art.state.fillStyle, '#123456');
});

test('invalid card coordinates and IDs paint nothing, while narrow art still has finite coordinates', () => {
  const art = recordingContext();
  drawGambitCard(art.ctx, -1, 0, 0, 50, 70); drawGambitCard(art.ctx, 52, 0, 0, 50, 70);
  drawGambitCard(art.ctx, 0, NaN, 0, 50, 70); drawGambitCard(art.ctx, 0, 0, 0, 0, 70);
  assert.equal(art.calls.length, 0);
  for (const [w, h] of [[28,40], [50,70], [88,126]]) {
    drawGambitCard(art.ctx, 38, 0, 0, w, h); drawGambitJoker(art.ctx, 'last_laugh', 0, 0, w, h);
    drawGambitDeck(art.ctx, 0, 0, w, h, 0); drawGambitPack(art.ctx, 'upgrade', 0, 0, w, h);
  }
  assert.equal(art.stack.length, 0);
});
