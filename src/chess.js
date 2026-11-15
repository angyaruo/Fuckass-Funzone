/** Catmate: full-rules chess against Gabu. Pure rules and search: no DOM or Spindle APIs.
 * Squares run 0..63 from the top-left (Gabu's back rank) to the bottom-right (yours).
 * Uppercase pieces are the player's cream kittens; lowercase pieces belong to Gabu.
 */
export const CHESS_LEVELS = Object.freeze(['chill', 'normal', 'sharp']);
export const CHESS_START = Object.freeze([
  'r','n','b','q','k','b','n','r', 'p','p','p','p','p','p','p','p',
  '','','','','','','','', '','','','','','','','', '','','','','','','','', '','','','','','','','',
  'P','P','P','P','P','P','P','P', 'R','N','B','Q','K','B','N','R',
]);
const PIECES = 'PNBRQKpnbrqk';
const VALUE = Object.freeze({ p: 100, n: 310, b: 325, r: 500, q: 900, k: 0 });
const MATERIAL = Object.freeze({ p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 });
const KNIGHT = [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]];
const KING = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
const ROOK = [[1, 0], [-1, 0], [0, 1], [0, -1]], BISHOP = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
const MATE = 100000;
const LEVEL_DEPTH = Object.freeze({ chill: 1, normal: 2, sharp: 3 });
const LEVEL_BONUS = Object.freeze({ chill: 150, normal: 300, sharp: 600 });
const level = value => CHESS_LEVELS.includes(value) ? value : 'normal';
const colorOf = piece => piece ? (piece === piece.toUpperCase() ? 'w' : 'b') : '';
const kindOf = piece => piece.toLowerCase();
const fileOf = sq => sq & 7, rankOf = sq => sq >> 3;
const onBoard = (f, r) => f >= 0 && f < 8 && r >= 0 && r < 8;
export const chessSquare = (file, rank) => onBoard(file, rank) ? rank * 8 + file : -1;

export function initialPosition() {
  return { board: [...CHESS_START], turn: 'w', castling: 'KQkq', ep: -1, halfmove: 0, fullmove: 1 };
}
const copyPosition = pos => ({ board: [...pos.board], turn: pos.turn, castling: pos.castling, ep: pos.ep, halfmove: pos.halfmove, fullmove: pos.fullmove });

/** True when `by` attacks `sq`. Used for check, castling lanes and legality. */
export function isAttacked(board, sq, by) {
  const f = fileOf(sq), r = rankOf(sq);
  const pawn = by === 'w' ? 'P' : 'p', dir = by === 'w' ? 1 : -1;
  for (const df of [-1, 1]) { const from = chessSquare(f + df, r + dir); if (from >= 0 && board[from] === pawn) return true; }
  const knight = by === 'w' ? 'N' : 'n', king = by === 'w' ? 'K' : 'k';
  for (const [df, dr] of KNIGHT) { const from = chessSquare(f + df, r + dr); if (from >= 0 && board[from] === knight) return true; }
  for (const [df, dr] of KING) { const from = chessSquare(f + df, r + dr); if (from >= 0 && board[from] === king) return true; }
  for (const [dirs, kinds] of [[ROOK, 'rq'], [BISHOP, 'bq']]) {
    for (const [df, dr] of dirs) {
      let nf = f + df, nr = r + dr;
      while (onBoard(nf, nr)) {
        const piece = board[nr * 8 + nf];
        if (piece) { if (colorOf(piece) === by && kinds.includes(kindOf(piece))) return true; break; }
        nf += df; nr += dr;
      }
    }
  }
  return false;
}
export function kingSquare(board, color) { return board.indexOf(color === 'w' ? 'K' : 'k'); }
export function inCheck(pos, color = pos.turn) {
  const king = kingSquare(pos.board, color);
  return king >= 0 && isAttacked(pos.board, king, color === 'w' ? 'b' : 'w');
}

function pseudoMoves(pos) {
  const { board, turn } = pos, moves = [], enemy = turn === 'w' ? 'b' : 'w';
  const add = (from, to, extra = {}) => moves.push({ from, to, piece: board[from], captured: board[to] || '', ...extra });
  for (let from = 0; from < 64; from++) {
    const piece = board[from]; if (colorOf(piece) !== turn) continue;
    const f = fileOf(from), r = rankOf(from), kind = kindOf(piece);
    if (kind === 'p') {
      const dir = turn === 'w' ? -1 : 1, startRank = turn === 'w' ? 6 : 1, lastRank = turn === 'w' ? 0 : 7;
      const pushPawn = (to, extra = {}) => {
        if (rankOf(to) === lastRank) for (const promo of 'qrbn') add(from, to, { ...extra, promo: turn === 'w' ? promo.toUpperCase() : promo });
        else add(from, to, extra);
      };
      const one = chessSquare(f, r + dir);
      if (one >= 0 && !board[one]) {
        pushPawn(one);
        const two = chessSquare(f, r + dir * 2);
        if (r === startRank && !board[two]) add(from, two, { double: true });
      }
      for (const df of [-1, 1]) {
        const to = chessSquare(f + df, r + dir); if (to < 0) continue;
        if (board[to] && colorOf(board[to]) === enemy) pushPawn(to);
        else if (to === pos.ep) add(from, to, { enPassant: true, captured: enemy === 'w' ? 'P' : 'p' });
      }
      continue;
    }
    if (kind === 'n' || kind === 'k') {
      for (const [df, dr] of kind === 'n' ? KNIGHT : KING) {
        const to = chessSquare(f + df, r + dr);
        if (to >= 0 && colorOf(board[to]) !== turn) add(from, to);
      }
      if (kind === 'k') {
        const home = turn === 'w' ? 60 : 4, [short, long] = turn === 'w' ? ['K', 'Q'] : ['k', 'q'];
        if (from === home && !isAttacked(board, home, enemy)) {
          if (pos.castling.includes(short) && !board[home + 1] && !board[home + 2] && board[home + 3] === (turn === 'w' ? 'R' : 'r') &&
            !isAttacked(board, home + 1, enemy) && !isAttacked(board, home + 2, enemy)) add(from, home + 2, { castle: 'short' });
          if (pos.castling.includes(long) && !board[home - 1] && !board[home - 2] && !board[home - 3] && board[home - 4] === (turn === 'w' ? 'R' : 'r') &&
            !isAttacked(board, home - 1, enemy) && !isAttacked(board, home - 2, enemy)) add(from, home - 2, { castle: 'long' });
        }
      }
      continue;
    }
    const dirs = kind === 'r' ? ROOK : kind === 'b' ? BISHOP : [...ROOK, ...BISHOP];
    for (const [df, dr] of dirs) {
      let nf = f + df, nr = r + dr;
      while (onBoard(nf, nr)) {
        const to = nr * 8 + nf, target = board[to];
        if (target) { if (colorOf(target) === enemy) add(from, to); break; }
        add(from, to); nf += df; nr += dr;
      }
    }
  }
  return moves;
}
const CORNER_RIGHTS = Object.freeze({ 0: 'q', 7: 'k', 56: 'Q', 63: 'K' });
export function applyMove(pos, move) {
  const next = copyPosition(pos), board = next.board, mover = pos.turn;
  board[move.to] = move.promo || move.piece; board[move.from] = '';
  if (move.enPassant) board[move.to + (mover === 'w' ? 8 : -8)] = '';
  if (move.castle) {
    const rookFrom = move.castle === 'short' ? move.from + 3 : move.from - 4, rookTo = move.castle === 'short' ? move.from + 1 : move.from - 1;
    board[rookTo] = board[rookFrom]; board[rookFrom] = '';
  }
  let rights = next.castling;
  if (kindOf(move.piece) === 'k') rights = rights.replace(mover === 'w' ? /[KQ]/g : /[kq]/g, '');
  for (const sq of [move.from, move.to]) if (CORNER_RIGHTS[sq]) rights = rights.replace(CORNER_RIGHTS[sq], '');
  next.castling = rights;
  next.ep = move.double ? (move.from + move.to) / 2 : -1;
  next.halfmove = kindOf(move.piece) === 'p' || move.captured ? 0 : pos.halfmove + 1;
  if (mover === 'b') next.fullmove = pos.fullmove + 1;
  next.turn = mover === 'w' ? 'b' : 'w';
  return next;
}
export function legalMoves(pos) {
  return pseudoMoves(pos).filter(move => !inCheck(applyMove(pos, move), pos.turn));
}
/** Leaf-node count used by tests to prove move generation against published perft tables. */
export function perft(pos, depth) {
  if (depth <= 0) return 1;
  const moves = legalMoves(pos);
  if (depth === 1) return moves.length;
  let total = 0; for (const move of moves) total += perft(applyMove(pos, move), depth - 1);
  return total;
}
function insufficientMaterial(board) {
  const rest = board.filter(piece => piece && kindOf(piece) !== 'k');
  if (!rest.length) return true;
  return rest.length === 1 && ['n', 'b'].includes(kindOf(rest[0]));
}
/** null while the game continues, otherwise checkmate / stalemate / fifty / material. */
export function outcome(pos, moves = legalMoves(pos)) {
  if (!moves.length) return inCheck(pos) ? { result: pos.turn === 'w' ? 'loss' : 'win', reason: 'checkmate' } : { result: 'draw', reason: 'stalemate' };
  if (pos.halfmove >= 100) return { result: 'draw', reason: 'fifty' };
  if (insufficientMaterial(pos.board)) return { result: 'draw', reason: 'material' };
  return null;
}

// Small center preferences keep Gabu's play recognizably chess-like at shallow depth.
const CENTER = [0, 1, 2, 3, 3, 2, 1, 0];
function evaluate(board) {
  let total = 0;
  for (let sq = 0; sq < 64; sq++) {
    const piece = board[sq]; if (!piece) continue;
    const kind = kindOf(piece), f = fileOf(sq), r = rankOf(sq), mine = colorOf(piece) === 'b' ? 1 : -1;
    let value = VALUE[kind];
    if (kind === 'n' || kind === 'b') value += (CENTER[f] + CENTER[r]) * 6;
    else if (kind === 'p') value += (mine > 0 ? r - 1 : 6 - r) * 9 + CENTER[f] * 4;
    else if (kind === 'q') value += (CENTER[f] + CENTER[r]) * 2;
    total += mine * value;
  }
  return total;
}
const ordered = moves => moves.sort((a, b) => (b.captured ? VALUE[kindOf(b.captured)] * 10 - VALUE[kindOf(b.piece)] : 0) + (b.promo ? 800 : 0) -
  ((a.captured ? VALUE[kindOf(a.captured)] * 10 - VALUE[kindOf(a.piece)] : 0) + (a.promo ? 800 : 0)));
function search(pos, depth, alpha, beta, ply) {
  const moves = legalMoves(pos);
  if (!moves.length) return inCheck(pos) ? -MATE + ply : 0;
  if (pos.halfmove >= 100) return 0;
  if (depth === 0) return (pos.turn === 'b' ? 1 : -1) * evaluate(pos.board);
  let best = -Infinity;
  for (const move of ordered(moves)) {
    const value = -search(applyMove(pos, move), depth - 1, -beta, -alpha, ply + 1);
    if (value > best) best = value;
    if (value > alpha) alpha = value;
    if (alpha >= beta) break;
  }
  return best;
}
/** Gabu's move for the side to move. A little noise stops identical games on Chill and Normal. */
export function chooseChessMove(pos, levelName = 'normal', random = Math.random) {
  const moves = ordered(legalMoves(pos)); if (!moves.length) return null;
  const depth = LEVEL_DEPTH[level(levelName)], noise = levelName === 'chill' ? 140 : levelName === 'normal' ? 24 : 4;
  let best = null, bestValue = -Infinity;
  for (const move of moves) {
    const roll = Math.max(0, Math.min(.999999999, Number(random()) || 0));
    // A root move that cannot beat the leader even with maximum noise only needs a bound.
    const bound = bestValue === -Infinity ? Infinity : -(bestValue - noise);
    const value = -search(applyMove(pos, move), depth - 1, -Infinity, bound, 1) + roll * noise;
    if (value > bestValue) { bestValue = value; best = move; }
  }
  return best;
}

const whole = (value, max) => Number.isSafeInteger(value) && value >= 0 && value <= max;
export class ChessGame {
  constructor({ random = Math.random, onEvent = () => {}, saved, level: chosen = 'normal' } = {}) {
    this.random = random; this.onEvent = onEvent; this.level = level(chosen); this.reset(); if (saved) this.restore(saved);
  }
  reset(chosen = this.level) {
    this.level = level(chosen); this.pos = initialPosition(); this.status = 'idle'; this.selected = -1;
    this.history = []; this.lastMove = null; this.result = null; this.reason = null; this.score = 0; this.thinking = 0; this.flash = 0;
    this.onEvent('reset');
  }
  get board() { return this.pos.board; }
  start() {
    if (this.status === 'playing') return;
    if (this.status === 'dead') this.reset();
    const resumed = this.status === 'paused'; this.status = 'playing';
    if (this.pos.turn === 'b' && this.thinking <= 0) this.thinking = .55;
    this.onEvent(resumed ? 'resume' : 'start');
  }
  pause() { if (this.status === 'playing') { this.status = 'paused'; this.onEvent('pause'); } }
  togglePause() { if (this.status === 'playing') this.pause(); else if (this.status === 'paused') this.start(); }
  materialTaken() {
    const left = this.pos.board.reduce((sum, piece) => sum + (piece && colorOf(piece) === 'b' ? MATERIAL[kindOf(piece)] : 0), 0);
    return Math.max(0, 39 - left);
  }
  /** Score comes from the position, never from an accumulating counter, so undo cannot farm it. */
  rescore() {
    const previous = this.score;
    this.score = this.materialTaken() * 10 + (this.result === 'win' ? LEVEL_BONUS[this.level] + Math.max(0, 80 - this.pos.fullmove) * 3 : 0);
    if (this.score !== previous) this.onEvent('score', { score: this.score });
  }
  targets(from = this.selected) {
    if (from < 0 || this.pos.turn !== 'w') return [];
    return legalMoves(this.pos).filter(move => move.from === from);
  }
  /** Tap flow: a cream piece selects, a glowing square moves, anything else clears. */
  select(sq) {
    if (this.status !== 'playing' || this.pos.turn !== 'w' || !Number.isInteger(sq) || sq < 0 || sq > 63) return false;
    if (this.selected >= 0) {
      const options = this.targets().filter(move => move.to === sq);
      if (options.length) return this.play(options.find(move => !move.promo || kindOf(move.promo) === 'q') || options[0]);
    }
    this.selected = colorOf(this.pos.board[sq]) === 'w' && this.selected !== sq ? sq : -1;
    return false;
  }
  play(move) {
    const mover = this.pos.turn;
    this.history.push({ pos: copyPosition(this.pos), lastMove: this.lastMove });
    if (this.history.length > 300) this.history.shift();
    this.pos = applyMove(this.pos, move); this.lastMove = { from: move.from, to: move.to }; this.selected = -1; this.flash = .35;
    const moves = legalMoves(this.pos), checked = inCheck(this.pos), mine = mover === 'w';
    const info = { piece: kindOf(move.piece), captured: move.captured ? kindOf(move.captured) : '', check: checked };
    this.onEvent(mine ? 'move' : 'gabu_move', info);
    if (move.captured) this.onEvent(mine ? (info.captured === 'q' ? 'queen_taken' : 'capture') : (info.captured === 'q' ? 'queen_lost' : 'gabu_capture'), info);
    if (move.castle && mine) this.onEvent('castle', info);
    if (move.promo && mine) this.onEvent('promote', info);
    const end = outcome(this.pos, moves);
    if (end) {
      this.result = end.result; this.reason = end.reason; this.status = 'dead'; this.rescore();
      this.onEvent(end.result === 'win' ? 'win' : end.result === 'loss' ? 'death' : 'draw', { score: this.score, reason: end.reason });
      return true;
    }
    if (checked) this.onEvent(mine ? 'check' : 'gabu_check', info);
    this.rescore();
    if (this.pos.turn === 'b') this.thinking = .5 + Math.max(0, Math.min(.999999999, Number(this.random()) || 0)) * .5;
    return true;
  }
  update(delta) {
    if (!Number.isFinite(delta) || delta <= 0) return;
    this.flash = Math.max(0, this.flash - delta);
    if (this.status !== 'playing' || this.pos.turn !== 'b') return;
    this.thinking -= Math.min(delta, .12);
    if (this.thinking > 0) return;
    const move = chooseChessMove(this.pos, this.level, this.random);
    if (move) this.play(move);
  }
  /** Takes back your last move and Gabu's reply. History lives for this session only. */
  undo() {
    if (!this.history.length || this.status === 'paused' || this.status === 'idle') return false;
    let entry = this.history.pop();
    if (entry.pos.turn === 'b' && this.history.length) entry = this.history.pop();
    if (entry.pos.turn === 'b') { this.history.push(entry); return false; }
    this.pos = entry.pos; this.lastMove = entry.lastMove; this.selected = -1; this.result = null; this.reason = null;
    this.status = 'playing'; this.thinking = 0; this.rescore(); this.onEvent('undo'); return true;
  }
  keyboardSquares() { return Array.from({ length: 64 }, (_, sq) => sq); }
  snapshot() {
    const { board, turn, castling, ep, halfmove, fullmove } = this.pos;
    return { version: 1, board: [...board], turn, castling, ep, halfmove, fullmove, level: this.level, score: this.score,
      result: this.result, reason: this.reason, lastMove: this.lastMove ? { ...this.lastMove } : null,
      status: this.status === 'playing' ? 'paused' : this.status };
  }
  restore(data) {
    if (!data || data.version !== 1 || !Array.isArray(data.board) || data.board.length !== 64 ||
      data.board.some(piece => piece !== '' && (typeof piece !== 'string' || piece.length !== 1 || !PIECES.includes(piece))) ||
      data.board.filter(piece => piece === 'K').length !== 1 || data.board.filter(piece => piece === 'k').length !== 1 ||
      data.board.some((piece, sq) => kindOf(piece || 'x') === 'p' && (rankOf(sq) === 0 || rankOf(sq) === 7)) ||
      !['w', 'b'].includes(data.turn) || typeof data.castling !== 'string' || !/^K?Q?k?q?$/.test(data.castling) ||
      !(data.ep === -1 || whole(data.ep, 63) && [2, 5].includes(rankOf(data.ep))) || !whole(data.halfmove, 200) || !whole(data.fullmove, 5000) ||
      !CHESS_LEVELS.includes(data.level) || !['idle', 'paused', 'playing', 'dead'].includes(data.status)) return false;
    const pos = { board: [...data.board], turn: data.turn, castling: data.castling, ep: data.ep, halfmove: data.halfmove, fullmove: data.fullmove };
    if (inCheck(pos, pos.turn === 'w' ? 'b' : 'w')) return false;
    const end = outcome(pos);
    if (data.status === 'dead' ? !end : !!end) return false;
    const last = data.lastMove;
    if (last !== null && (!last || !whole(last.from, 63) || !whole(last.to, 63))) return false;
    this.pos = pos; this.level = data.level; this.lastMove = last ? { from: last.from, to: last.to } : null;
    this.result = end ? end.result : null; this.reason = end ? end.reason : null; this.history = []; this.selected = -1; this.flash = 0;
    this.status = data.status === 'playing' ? 'paused' : data.status; this.thinking = this.pos.turn === 'b' ? .55 : 0;
    this.score = 0; this.rescore(); return true;
  }
}
