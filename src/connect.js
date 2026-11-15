/** Berry Drop: drop strawberries, line up four, and keep a win streak alive against Gabu's blueberries.
 * Pure rules and search: no DOM or Spindle APIs. Cells run row-major from the top-left.
 */
export const BERRY_COLS = 7;
export const BERRY_ROWS = 6;
export const BERRY_LEVELS = Object.freeze(['chill', 'normal', 'sharp']);
const DEPTH = Object.freeze({ chill: 2, normal: 4, sharp: 6 });
const LEVEL_BONUS = Object.freeze({ chill: 60, normal: 120, sharp: 220 });
const ORDER = [3, 2, 4, 1, 5, 0, 6];
const WIN = 1000000;
const level = value => BERRY_LEVELS.includes(value) ? value : 'normal';
const unit = random => Math.max(0, Math.min(.999999999, Number(random()) || 0));
const whole = (value, max) => Number.isSafeInteger(value) && value >= 0 && value <= max;

export function dropRow(board, col) {
  if (!Number.isInteger(col) || col < 0 || col >= BERRY_COLS) return -1;
  for (let row = BERRY_ROWS - 1; row >= 0; row--) if (!board[row * BERRY_COLS + col]) return row;
  return -1;
}
/** Winning cells through `cell`, or null. Only lines through the newest token can be new. */
export function lineThrough(board, cell) {
  const who = board[cell]; if (!who) return null;
  const row = Math.floor(cell / BERRY_COLS), col = cell % BERRY_COLS;
  for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
    const line = [cell];
    for (const sign of [1, -1]) {
      let r = row + dr * sign, c = col + dc * sign;
      while (r >= 0 && r < BERRY_ROWS && c >= 0 && c < BERRY_COLS && board[r * BERRY_COLS + c] === who) { line.push(r * BERRY_COLS + c); r += dr * sign; c += dc * sign; }
    }
    if (line.length >= 4) return line.sort((a, b) => a - b);
  }
  return null;
}
/** Columns where `who` would connect four with the very next drop. */
export function winningColumns(board, who) {
  const out = [];
  for (let col = 0; col < BERRY_COLS; col++) {
    const row = dropRow(board, col); if (row < 0) continue;
    const cell = row * BERRY_COLS + col; board[cell] = who;
    if (lineThrough(board, cell)) out.push(col);
    board[cell] = 0;
  }
  return out;
}
function windowScore(a, b, c, d, who) {
  const mine = (a === who) + (b === who) + (c === who) + (d === who), empty = !a + !b + !c + !d, theirs = 4 - mine - empty;
  if (mine && theirs) return 0;
  if (mine === 3) return 50; if (mine === 2) return 8;
  if (theirs === 3) return -60; if (theirs === 2) return -8;
  return 0;
}
function evaluate(board, who) {
  let total = 0;
  for (let row = 0; row < BERRY_ROWS; row++) total += (board[row * BERRY_COLS + 3] === who ? 6 : board[row * BERRY_COLS + 3] ? -6 : 0);
  for (let row = 0; row < BERRY_ROWS; row++) for (let col = 0; col < BERRY_COLS; col++) {
    const at = (r, c) => board[r * BERRY_COLS + c];
    if (col + 3 < BERRY_COLS) total += windowScore(at(row, col), at(row, col + 1), at(row, col + 2), at(row, col + 3), who);
    if (row + 3 < BERRY_ROWS) total += windowScore(at(row, col), at(row + 1, col), at(row + 2, col), at(row + 3, col), who);
    if (row + 3 < BERRY_ROWS && col + 3 < BERRY_COLS) total += windowScore(at(row, col), at(row + 1, col + 1), at(row + 2, col + 2), at(row + 3, col + 3), who);
    if (row + 3 < BERRY_ROWS && col - 3 >= 0) total += windowScore(at(row, col), at(row + 1, col - 1), at(row + 2, col - 2), at(row + 3, col - 3), who);
  }
  return total;
}
function negamax(board, depth, alpha, beta, who, ply) {
  const other = 3 - who; let any = false, best = -Infinity;
  for (const col of ORDER) {
    const row = dropRow(board, col); if (row < 0) continue; any = true;
    const cell = row * BERRY_COLS + col; board[cell] = who;
    const value = lineThrough(board, cell) ? WIN - ply : depth <= 1 ? evaluate(board, who) : -negamax(board, depth - 1, -beta, -alpha, other, ply + 1);
    board[cell] = 0;
    if (value > best) best = value;
    if (value > alpha) alpha = value;
    if (alpha >= beta) break;
  }
  return any ? best : 0;
}
/** Gabu's column. Chill sometimes just vibes; every level still takes a win or blocks one in front of it. */
export function chooseBerryColumn(board, levelName = 'normal', random = Math.random, who = 2) {
  const scratch = [...board], open = ORDER.filter(col => dropRow(scratch, col) >= 0); if (!open.length) return -1;
  const wins = winningColumns(scratch, who); if (wins.length) return wins[0];
  const blocks = winningColumns(scratch, 3 - who); if (blocks.length) return blocks[0];
  const name = level(levelName);
  if (name === 'chill' && unit(random) < .3) return open[Math.floor(unit(random) * open.length)];
  let best = open[0], bestValue = -Infinity;
  for (const col of open) {
    const cell = dropRow(scratch, col) * BERRY_COLS + col; scratch[cell] = who;
    const value = -negamax(scratch, DEPTH[name] - 1, -Infinity, Infinity, 3 - who, 1) + unit(random) * (name === 'sharp' ? 1 : 6);
    scratch[cell] = 0;
    if (value > bestValue) { bestValue = value; best = col; }
  }
  return best;
}

export class BerryDropGame {
  constructor({ random = Math.random, onEvent = () => {}, saved, level: chosen = 'normal' } = {}) {
    this.random = random; this.onEvent = onEvent; this.level = level(chosen); this.reset(); if (saved) this.restore(saved);
  }
  reset(chosen = this.level) {
    this.level = level(chosen); this.status = 'idle'; this.score = 0; this.wins = 0; this.draws = 0; this.round = 1;
    this.cursor = 3; this.onEvent('reset'); this.clearBoard(1);
  }
  clearBoard(starter) {
    this.board = Array(BERRY_COLS * BERRY_ROWS).fill(0); this.starter = starter; this.turn = starter; this.phase = 'turn';
    this.falling = null; this.winLine = null; this.result = null; this.thinking = starter === 2 ? .7 : 0; this.lastCell = -1; this.glow = 0;
  }
  start() {
    if (this.status === 'playing') return;
    if (this.status === 'dead') this.reset();
    const resumed = this.status === 'paused'; this.status = 'playing';
    this.onEvent(resumed ? 'resume' : 'start');
  }
  pause() { if (this.status === 'playing') { this.status = 'paused'; this.onEvent('pause'); } }
  togglePause() { if (this.status === 'playing') this.pause(); else if (this.status === 'paused') this.start(); }
  /** Round over and still alive: the next tap deals a fresh board and swaps who starts. */
  nextRound() {
    if (this.status !== 'playing' || this.phase !== 'over') return false;
    this.round++; this.clearBoard(this.round % 2 ? 1 : 2); this.onEvent('round', { round: this.round, starter: this.starter }); return true;
  }
  moveCursor(step) { this.cursor = Math.max(0, Math.min(BERRY_COLS - 1, this.cursor + step)); }
  drop(col = this.cursor) {
    if (this.status !== 'playing') return false;
    if (this.phase === 'over') return this.nextRound();
    if (this.turn !== 1 || this.falling || dropRow(this.board, col) < 0) return false;
    this.cursor = col; this.launch(col, 1); return true;
  }
  launch(col, who) {
    const row = dropRow(this.board, col);
    // Remember what this drop answers before it lands, so a block is judged on the board it saw.
    const blocked = winningColumns(this.board, 3 - who).includes(col);
    this.falling = { col, row, who, y: -.8, vy: 0, blocked };
    this.onEvent(who === 1 ? 'drop' : 'gabu_drop', { col });
  }
  settle() {
    const { col, row, who, blocked } = this.falling, cell = row * BERRY_COLS + col;
    this.falling = null; this.board[cell] = who; this.lastCell = cell;
    // Every landing is announced so the arcade saves the settled board, even when nothing else happens.
    this.onEvent('land', { who, cell });
    const line = lineThrough(this.board, cell);
    if (line) {
      this.winLine = line; this.phase = 'over'; this.glow = 0;
      if (who === 1) {
        this.wins++; this.result = 'win';
        const earned = 100 + LEVEL_BONUS[this.level] + (BERRY_COLS * BERRY_ROWS - this.board.filter(Boolean).length) * 3;
        this.score = Math.min(999999999, this.score + earned);
        this.onEvent('score', { score: this.score, earned }); this.onEvent('win', { score: this.score, wins: this.wins });
      } else {
        this.result = 'loss'; this.status = 'dead'; this.onEvent('death', { score: this.score, wins: this.wins });
      }
      return;
    }
    if (this.board.every(Boolean)) {
      this.phase = 'over'; this.result = 'draw'; this.draws++; this.score = Math.min(999999999, this.score + 40);
      this.onEvent('score', { score: this.score, earned: 40 }); this.onEvent('draw', { score: this.score }); return;
    }
    if (blocked) this.onEvent(who === 1 ? 'block' : 'gabu_block', { col });
    const mineNext = winningColumns(this.board, who).length;
    if (who === 1 && mineNext >= 2) this.onEvent('fork', { col });
    else if (who === 2 && mineNext >= 1) this.onEvent('gabu_threat', { col });
    this.turn = 3 - who;
    if (this.turn === 2) this.thinking = .45 + unit(this.random) * .4;
  }
  update(delta) {
    if (this.status !== 'playing' || !Number.isFinite(delta) || delta <= 0) return;
    const dt = Math.min(delta, .12);
    this.glow += dt;
    if (this.falling) {
      this.falling.vy += 38 * dt; this.falling.y += this.falling.vy * dt;
      if (this.falling.y >= this.falling.row) this.settle();
      return;
    }
    if (this.phase !== 'turn' || this.turn !== 2) return;
    this.thinking -= dt; if (this.thinking > 0) return;
    const col = chooseBerryColumn(this.board, this.level, this.random, 2);
    if (col >= 0) this.launch(col, 2);
  }
  snapshot() {
    return { version: 1, board: [...this.board], turn: this.turn, starter: this.starter, round: this.round, score: this.score, wins: this.wins, draws: this.draws,
      level: this.level, phase: this.phase, result: this.result, cursor: this.cursor, falling: this.falling ? { col: this.falling.col, who: this.falling.who } : null,
      status: this.status === 'playing' ? 'paused' : this.status };
  }
  restore(data) {
    if (!data || data.version !== 1 || !Array.isArray(data.board) || data.board.length !== BERRY_COLS * BERRY_ROWS || data.board.some(v => ![0, 1, 2].includes(v)) ||
      ![1, 2].includes(data.turn) || ![1, 2].includes(data.starter) || !whole(data.round, 100000) || data.round < 1 || !whole(data.score, 999999999) ||
      !whole(data.wins, 100000) || !whole(data.draws, 100000) || !BERRY_LEVELS.includes(data.level) || !['turn', 'over'].includes(data.phase) ||
      !whole(data.cursor, BERRY_COLS - 1) || !['idle', 'paused', 'playing', 'dead'].includes(data.status)) return false;
    // Tokens only ever sit on the floor or on another token.
    for (let cell = 0; cell < BERRY_COLS * (BERRY_ROWS - 1); cell++) if (data.board[cell] && !data.board[cell + BERRY_COLS]) return false;
    const lines = data.board.map((_, cell) => lineThrough(data.board, cell)).filter(Boolean);
    const winner = lines.length ? data.board[lines[0][0]] : 0;
    if (lines.some(line => data.board[line[0]] !== winner)) return false;
    const full = data.board.every(Boolean), over = !!winner || full;
    if (data.phase === 'over' !== over || data.status === 'dead' !== (winner === 2)) return false;
    const falling = data.falling;
    if (falling !== null && (!falling || over || !whole(falling.col, BERRY_COLS - 1) || ![1, 2].includes(falling.who) || falling.who !== data.turn || dropRow(data.board, falling.col) < 0)) return false;
    this.board = [...data.board]; this.turn = data.turn; this.starter = data.starter; this.round = data.round; this.score = data.score;
    this.wins = data.wins; this.draws = data.draws; this.level = data.level; this.phase = data.phase; this.cursor = data.cursor;
    this.result = winner === 1 ? 'win' : winner === 2 ? 'loss' : full ? 'draw' : null; this.winLine = lines[0] || null; this.lastCell = -1; this.glow = 0;
    this.falling = null; this.thinking = this.turn === 2 ? .6 : 0;
    if (falling) { const row = dropRow(this.board, falling.col); this.falling = { col: falling.col, row, who: falling.who, y: -.8, vy: 0, blocked: winningColumns(this.board, 3 - falling.who).includes(falling.col) }; }
    this.status = data.status === 'playing' ? 'paused' : data.status; return true;
  }
}
