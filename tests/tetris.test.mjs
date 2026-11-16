import test from 'node:test';
import assert from 'node:assert/strict';
import { TetrisGame, TETRIS_TYPES, TETRIS_SHAPES, pieceCells } from '../src/tetris.js';
import { tetrisControlAt, drawTetris } from '../src/tetris-render.js';

const game = () => new TetrisGame({ random: () => .31 });
const emptyBoard = () => Array.from({ length: 20 }, () => Array(10).fill(0));

test('Tetris seven-bag supplies every type once per bag, with five previews', () => {
  const g = game(); g.start(); const pieces = [];
  for (let i = 0; i < 14; i++) { pieces.push(g.piece.type); g.board = emptyBoard(); g.hardDrop(); }
  assert.deepEqual([...pieces.slice(0, 7)].sort(), [...TETRIS_TYPES].sort());
  assert.deepEqual([...pieces.slice(7)].sort(), [...TETRIS_TYPES].sort());
  assert.equal(g.next.length, 5);
  for (const type of TETRIS_TYPES) for (const shape of TETRIS_SHAPES[type]) {
    assert.equal(shape.length, 4); assert.equal(new Set(shape.map(p => `${p.x},${p.y}`)).size, 4);
  }
});

test('Tetris movement respects walls, floor, and settled blocks; kicks rotate at a wall', () => {
  const g = game(); g.start(); g.piece = { type: 'T', rotation: 0, x: 0, y: 5 };
  assert.equal(g.move(-1), false); assert.equal(g.move(1), true);
  g.board[6][4] = 1; assert.equal(g.move(1), false);
  g.board = emptyBoard(); g.piece = { type: 'I', rotation: 1, x: -2, y: 3 };
  assert.equal(g.rotate(-1), true); assert.ok(pieceCells(g.piece).every(p => p.x >= 0));
  g.piece = { type: 'T', rotation: 0, x: 3, y: 18 };
  assert.equal(g.rotate(), true); assert.ok(pieceCells(g.piece).every(p => p.y < 20));
});

test('Tetris hard drop settles at its ghost, clears a four-line well, and advances levels', () => {
  const g = game(); g.start();
  for (let y = 16; y < 20; y++) g.board[y] = Array(10).fill(2), g.board[y][5] = 0;
  g.lines = 6; g.piece = { type: 'I', rotation: 1, x: 3, y: -1 };
  const expectedDropPoints = (g.dropY() - g.piece.y) * 2;
  assert.equal(g.dropY(), 16); assert.equal(g.hardDrop(), true);
  assert.equal(g.lines, 10); assert.equal(g.level, 2); assert.equal(g.score, 800 + expectedDropPoints);
  assert.ok(g.board.every(row => row.every(cell => cell === 0))); assert.equal(g.status, 'playing');
});

test('Tetris gravity, soft drop, hold, and pause have independent rules', () => {
  const g = game(); g.start(); const first = g.piece.type;
  assert.equal(g.hold(), true); assert.equal(g.held, first); assert.equal(g.hold(), false);
  const second = g.piece.type; g.hardDrop(); assert.equal(g.hold(), true); assert.equal(g.piece.type, first); assert.notEqual(second, first);
  const before = g.piece.y; for (let i = 0; i < 7; i++) g.update(.12);
  assert.equal(g.piece.y, before + 1); const score = g.score; g.softDrop(); assert.equal(g.score, score + 1);
  g.pause(); const snapshot = g.snapshot();
  g.update(1000); assert.equal(g.move(1), false); assert.equal(g.rotate(), false); assert.equal(g.hardDrop(), false); assert.equal(g.hold(), false);
  assert.deepEqual(g.snapshot(), snapshot); g.start(); assert.equal(g.status, 'playing');
});

test('Tetris top-out ends the run without writing outside its board', () => {
  const g = game(); g.start(); g.board[1] = Array(10).fill(1);
  g.piece = { type: 'T', rotation: 0, x: 3, y: -1 };
  assert.equal(g.hardDrop(), true); assert.equal(g.status, 'dead'); assert.equal(g.piece, null);
  assert.equal(g.board.length, 20); assert.ok(g.board.every(row => row.length === 10));
  g.start(); assert.equal(g.status, 'playing'); assert.equal(g.score, 0);
});

test('Tetris saves round-trip without aliasing and invalid saves cannot mutate a run', () => {
  const g = game(); g.start(); g.move(-1); g.rotate(); g.softDrop(); g.hold();
  const saved = g.snapshot(), restored = game(); assert.equal(restored.restore(saved), true);
  assert.equal(restored.status, 'paused'); assert.deepEqual(restored.snapshot(), saved);
  saved.board[19][0] = 3; assert.equal(restored.board[19][0], 0);
  const unchanged = restored.snapshot();
  const corruptions = [
    data => { data.board[0][0] = NaN; }, data => { data.piece.rotation = 4; }, data => { data.piece.x = 100; },
    data => { data.bag = ['I', 'I']; }, data => { data.next = ['I']; }, data => { data.score = -1; },
    data => { data.lines = Infinity; }, data => { data.level = 90; }, data => { data.held = '__proto__'; },
    data => { data.piece = null; }, data => { data.status = 'idle'; }, data => { data.canHold = 'yes'; },
    data => { delete data.board[0]; }, data => { delete data.board[0][0]; }, data => { delete data.next[0]; },
    data => { for (let y = 15; y < 20; y++) data.board[y].fill(1); },
  ];
  for (const corrupt of corruptions) { const bad = structuredClone(unchanged); corrupt(bad); assert.equal(restored.restore(bad), false); assert.deepEqual(restored.snapshot(), unchanged); }
  assert.equal(restored.restore(null), false); assert.equal(restored.restore({}), false);
  const idle = game(); assert.equal(restored.restore(idle.snapshot()), true); assert.equal(restored.status, 'idle');
});

test('Tetris event snapshots are valid after a line clear and an occupied spawn', () => {
  const snapshots = [], g = game();
  g.onEvent = () => snapshots.push(g.snapshot()); g.start();
  g.board[19] = Array(10).fill(2); g.board[19][4] = 0; g.board[19][5] = 0;
  g.piece = { type: 'O', rotation: 0, x: 4, y: 17 }; g.hardDrop();
  for (const saved of snapshots) assert.equal(game().restore(saved), true);
  g.board = emptyBoard(); for (const x of [3, 4, 5, 6]) g.board[0][x] = 2; g.piece = { type: 'O', rotation: 0, x: 0, y: 17 }; g.hardDrop();
  assert.equal(g.status, 'dead'); assert.equal(game().restore(g.snapshot()), true);
});

test('Tetris vector renderer visits every state and touch targets have no off-canvas hits', () => {
  const names = ['left', 'right', 'rotate', 'down', 'drop', 'hold'];
  names.forEach((name, i) => assert.equal(tetrisControlAt(39 + i * 56, 413), name));
  for (const [x, y] of [[0, 410], [360, 410], [40, 389], [40, 442], [NaN, 400]]) assert.equal(tetrisControlAt(x, y), null);
  const text = [], ctx = new Proxy({ fillText: value => text.push(String(value)) }, { get: (obj, key) => key in obj ? obj[key] : () => {} });
  const canvas = { width: 720, height: 904, getContext: () => ctx }, g = game();
  drawTetris(canvas, g); assert.ok(text.includes('READY?')); g.start(); drawTetris(canvas, g); g.pause(); drawTetris(canvas, g);
  assert.ok(text.includes('PAUSED')); g.status = 'dead'; drawTetris(canvas, g); assert.ok(text.includes('STACKED OUT'));
});
