/** A small falling-block rules engine. No browser, canvas, or host dependencies. */
export const TETRIS_COLS = 10, TETRIS_ROWS = 20;
export const TETRIS_TYPES = Object.freeze(['I', 'O', 'T', 'S', 'Z', 'J', 'L']);
const seeds = {
  I: ['0000', '1111', '0000', '0000'], O: ['11', '11'],
  T: ['010', '111', '000'], S: ['011', '110', '000'], Z: ['110', '011', '000'],
  J: ['100', '111', '000'], L: ['001', '111', '000'],
};
export const TETRIS_SHAPES = Object.freeze(Object.fromEntries(TETRIS_TYPES.map(type => {
  let matrix = seeds[type].map(row => [...row].map(Number));
  const rotations = [];
  for (let r = 0; r < 4; r++) {
    rotations.push(Object.freeze(matrix.flatMap((row, y) => row.flatMap((value, x) => value ? [Object.freeze({ x, y })] : []))));
    matrix = matrix.map((row, y) => row.map((_, x) => matrix[matrix.length - 1 - x][y]));
  }
  return [type, Object.freeze(rotations)];
})));
export function pieceCells(piece) {
  if (!piece || !TETRIS_TYPES.includes(piece.type) || !Number.isInteger(piece.rotation) || piece.rotation < 0 || piece.rotation > 3) return [];
  return TETRIS_SHAPES[piece.type][piece.rotation].map(cell => ({ x: piece.x + cell.x, y: piece.y + cell.y }));
}
const boundedInt = (value, low, high) => Number.isSafeInteger(value) && value >= low && value <= high;
const validType = type => TETRIS_TYPES.includes(type);
const copyPiece = piece => piece ? { type: piece.type, rotation: piece.rotation, x: piece.x, y: piece.y } : null;
const fitsBoard = (board, piece) => pieceCells(piece).length === 4 && pieceCells(piece).every(({ x, y }) => x >= 0 && x < TETRIS_COLS && y < TETRIS_ROWS && (y < 0 || board[y][x] === 0));

export class TetrisGame {
  constructor({ random = Math.random, onEvent = () => {}, saved } = {}) {
    this.random = random; this.onEvent = onEvent; this.reset(); if (saved) this.restore(saved);
  }
  reset() {
    this.board = Array.from({ length: TETRIS_ROWS }, () => Array(TETRIS_COLS).fill(0));
    this.bag = []; this.next = []; this.piece = null; this.held = null; this.canHold = true;
    this.score = 0; this.lines = 0; this.level = 1; this.status = 'idle'; this.accumulator = 0; this.lastClear = 0;
    this.fillQueue(); this.onEvent('reset');
  }
  randomIndex(length) { return Math.floor(Math.max(0, Math.min(.999999999, Number(this.random()) || 0)) * length); }
  fillQueue() {
    while (this.next.length < 5) {
      if (!this.bag.length) {
        this.bag = [...TETRIS_TYPES];
        for (let i = this.bag.length - 1; i > 0; i--) { const j = this.randomIndex(i + 1); [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]]; }
      }
      this.next.push(this.bag.pop());
    }
  }
  spawn(type = null) {
    const chosen = type || this.next.shift(); if (!type) this.fillQueue();
    this.piece = { type: chosen, rotation: 0, x: chosen === 'O' ? 4 : 3, y: -1 };
    this.accumulator = 0;
    if (!fitsBoard(this.board, this.piece)) { this.piece = null; this.die(); return false; }
    return true;
  }
  die() { this.status = 'dead'; this.onEvent('death', { score: this.score, lines: this.lines }); }
  start() {
    if (this.status === 'playing') return;
    if (this.status === 'dead') this.reset();
    const resumed = this.status === 'paused';
    this.status = 'playing'; if (!this.piece && !this.spawn()) return;
    this.onEvent(resumed ? 'resume' : 'start');
  }
  pause() { if (this.status === 'playing') { this.status = 'paused'; this.onEvent('pause'); } }
  togglePause() { if (this.status === 'playing') this.pause(); else if (this.status === 'paused') this.start(); }
  interval() { return Math.max(.07, .8 * Math.pow(.82, this.level - 1)); }
  update(delta) {
    if (this.status !== 'playing' || !Number.isFinite(delta) || delta <= 0) return;
    this.accumulator += Math.min(delta, .12);
    let steps = 0;
    while (this.status === 'playing' && this.accumulator >= this.interval() && steps++ < 3) {
      this.accumulator -= this.interval();
      if (fitsBoard(this.board, { ...this.piece, y: this.piece.y + 1 })) this.piece.y++;
      else this.lock();
    }
  }
  move(dx) {
    if (this.status !== 'playing' || !this.piece || ![-1, 1].includes(dx)) return false;
    const candidate = { ...this.piece, x: this.piece.x + dx };
    if (!fitsBoard(this.board, candidate)) return false;
    this.piece = candidate; return true;
  }
  rotate(direction = 1) {
    if (this.status !== 'playing' || !this.piece || ![-1, 1].includes(direction) || this.piece.type === 'O') return false;
    const rotation = (this.piece.rotation + direction + 4) % 4;
    // Small horizontal and upward kicks make rotations at walls and the floor forgiving.
    for (const [dx, dy] of [[0, 0], [-1, 0], [1, 0], [-2, 0], [2, 0], [0, -1], [0, -2]]) {
      const candidate = { ...this.piece, rotation, x: this.piece.x + dx, y: this.piece.y + dy };
      if (fitsBoard(this.board, candidate)) { this.piece = candidate; return true; }
    }
    return false;
  }
  addScore(points) {
    if (points <= 0) return;
    this.score = Math.min(999999999, this.score + points); this.onEvent('score', { score: this.score, earned: points });
  }
  softDrop() {
    if (this.status !== 'playing' || !this.piece) return false;
    const candidate = { ...this.piece, y: this.piece.y + 1 };
    if (fitsBoard(this.board, candidate)) { this.piece = candidate; this.addScore(1); }
    else this.lock();
    this.accumulator = 0; return true;
  }
  dropY() {
    if (!this.piece) return 0;
    let y = this.piece.y;
    while (fitsBoard(this.board, { ...this.piece, y: y + 1 })) y++;
    return y;
  }
  hardDrop() {
    if (this.status !== 'playing' || !this.piece) return false;
    const y = this.dropY(); const distance = y - this.piece.y;
    this.piece.y = y; this.lock(distance * 2); return true;
  }
  hold() {
    if (this.status !== 'playing' || !this.piece || !this.canHold) return false;
    const type = this.piece.type, previous = this.held;
    this.held = type; this.canHold = false; this.spawn(previous); this.onEvent('hold'); return true;
  }
  lock(dropPoints = 0) {
    const cells = pieceCells(this.piece);
    if (cells.some(cell => cell.y < 0)) { this.piece = null; this.die(); return; }
    const color = TETRIS_TYPES.indexOf(this.piece.type) + 1;
    for (const { x, y } of cells) this.board[y][x] = color;
    const remaining = this.board.filter(row => row.some(value => value === 0));
    const cleared = TETRIS_ROWS - remaining.length; this.lastClear = cleared;
    while (remaining.length < TETRIS_ROWS) remaining.unshift(Array(TETRIS_COLS).fill(0));
    this.board = remaining;
    const earned = dropPoints + [0, 100, 300, 500, 800][Math.min(cleared, 4)] * this.level;
    if (cleared) {
      this.lines += cleared; this.level = Math.floor(this.lines / 10) + 1;
    }
    this.score = Math.min(999999999, this.score + earned);
    this.piece = null; this.canHold = true; this.spawn();
    if (earned) this.onEvent('score', { score: this.score, earned });
    if (cleared) this.onEvent('line', { count: cleared, lines: this.lines, score: this.score });
    this.onEvent('lock', { score: this.score });
  }
  snapshot() {
    return { version: 1, board: this.board.map(row => [...row]), piece: copyPiece(this.piece), next: [...this.next], bag: [...this.bag], held: this.held, canHold: this.canHold,
      score: this.score, lines: this.lines, level: this.level, status: this.status === 'playing' ? 'paused' : this.status };
  }
  restore(data) {
    if (!data || data.version !== 1 || !Array.isArray(data.board) || data.board.length !== TETRIS_ROWS ||
      Array.from(data.board).some(row => !Array.isArray(row) || row.length !== TETRIS_COLS || Array.from(row).some(value => !boundedInt(value, 0, 7)) || row.every(Boolean)) ||
      !Array.isArray(data.next) || data.next.length !== 5 || Array.from(data.next).some(type => !validType(type)) ||
      !Array.isArray(data.bag) || data.bag.length > 7 || Array.from(data.bag).some(type => !validType(type)) || new Set(data.bag).size !== data.bag.length ||
      !(data.held === null || validType(data.held)) || typeof data.canHold !== 'boolean' ||
      !boundedInt(data.score, 0, 999999999) || !boundedInt(data.lines, 0, 1000000) || data.level !== Math.floor(data.lines / 10) + 1 ||
      !['idle', 'paused', 'playing', 'dead'].includes(data.status)) return false;
    const piece = data.piece;
    if (piece !== null && (!piece || !validType(piece.type) || !boundedInt(piece.rotation, 0, 3) || !boundedInt(piece.x, -3, 9) || !boundedInt(piece.y, -4, 19) || !fitsBoard(data.board, piece))) return false;
    if (data.status === 'idle' && piece !== null || data.status === 'dead' && piece !== null || ['paused', 'playing'].includes(data.status) && piece === null) return false;
    this.board = data.board.map(row => [...row]); this.piece = copyPiece(piece); this.next = [...data.next]; this.bag = [...data.bag];
    this.held = data.held; this.canHold = data.canHold; this.score = data.score; this.lines = data.lines; this.level = data.level;
    this.status = data.status === 'playing' ? 'paused' : data.status; this.accumulator = 0; this.lastClear = 0; return true;
  }
}
