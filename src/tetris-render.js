/** Original vector cabinet art and touch targets for the falling-block game. */
import { TETRIS_TYPES, TETRIS_SHAPES, pieceCells } from './tetris.js';

const blockColors = ['#100c20', '#67dbea', '#f3cc70', '#c596f5', '#84d8ba', '#ed91af', '#8499ef', '#f5b37a'];
const controls = ['left', 'right', 'rotate', 'down', 'drop', 'hold'];
export function tetrisControlAt(x, y) {
  if (!Number.isFinite(x) || !Number.isFinite(y) || y < 390 || y >= 442) return null;
  const index = Math.floor((x - 14) / 56);
  return index >= 0 && index < controls.length && x >= 14 + index * 56 && x < 64 + index * 56 ? controls[index] : null;
}
function panel(ctx, x, y, w, h, fill, stroke = '#59416e', radius = 8) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, radius); ctx.fillStyle = fill; ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
}
function label(ctx, text, x, y, size = 12, color = '#f6e8ff', align = 'left') {
  ctx.font = `800 ${size}px ui-sans-serif, system-ui, sans-serif`; ctx.textAlign = align; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = color; ctx.fillText(String(text), x, y);
}
function block(ctx, x, y, size, color, ghost = false) {
  if (ghost) { ctx.strokeStyle = color; ctx.lineWidth = 1.2; ctx.strokeRect(x + 2, y + 2, size - 4, size - 4); return; }
  panel(ctx, x + 1, y + 1, size - 2, size - 2, color, null, 2);
  ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.fillRect(x + 3, y + 3, size - 6, 2);
}
function preview(ctx, type, x, y, size = 12) {
  if (!type) return;
  const cells = TETRIS_SHAPES[type][0], minX = Math.min(...cells.map(p => p.x)), minY = Math.min(...cells.map(p => p.y));
  const width = Math.max(...cells.map(p => p.x)) - minX + 1;
  for (const cell of cells) block(ctx, x + (cell.x - minX - width / 2) * size, y + (cell.y - minY) * size, size, blockColors[TETRIS_TYPES.indexOf(type) + 1]);
}
function controlIcon(ctx, name, x, y, enabled) {
  ctx.strokeStyle = enabled ? '#f5dcff' : '#81718e'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath();
  if (name === 'left' || name === 'right') {
    const sign = name === 'left' ? -1 : 1;
    ctx.moveTo(x - sign * 8, y); ctx.lineTo(x + sign * 8, y); ctx.lineTo(x + sign * 2, y - 6);
    ctx.moveTo(x + sign * 8, y); ctx.lineTo(x + sign * 2, y + 6);
  } else if (name === 'down' || name === 'drop') {
    ctx.moveTo(x, y - 8); ctx.lineTo(x, y + 5); ctx.moveTo(x - 6, y); ctx.lineTo(x, y + 6); ctx.lineTo(x + 6, y);
    if (name === 'drop') { ctx.moveTo(x - 8, y + 10); ctx.lineTo(x + 8, y + 10); }
  } else if (name === 'rotate') {
    ctx.arc(x, y, 8, -.7, Math.PI * 1.3); ctx.moveTo(x + 6, y - 7); ctx.lineTo(x + 8, y - 1); ctx.lineTo(x + 2, y - 2);
  } else {
    ctx.moveTo(x - 8, y - 6); ctx.lineTo(x + 8, y - 6); ctx.lineTo(x + 4, y - 10);
    ctx.moveTo(x + 8, y + 5); ctx.lineTo(x - 8, y + 5); ctx.lineTo(x - 4, y + 9);
  }
  ctx.stroke();
}

export function drawTetris(canvas, game, { best = 0 } = {}) {
  const ctx = canvas.getContext('2d'); if (!ctx) return;
  ctx.save(); ctx.setTransform(canvas.width / 360, 0, 0, canvas.height / 452, 0, 0);
  ctx.fillStyle = '#160e27'; ctx.fillRect(0, 0, 360, 452);
  label(ctx, 'TETRIS', 20, 28, 19, '#f2b2d7'); label(ctx, 'STACK / CLEAR / REPEAT', 340, 26, 9, '#bd9cce', 'right');
  panel(ctx, 16, 44, 168, 328, '#080a17', '#a57cbf', 6);
  for (let y = 0; y < 20; y++) for (let x = 0; x < 10; x++) {
    ctx.fillStyle = (x + y) % 2 ? '#131127' : '#100f22'; ctx.fillRect(20 + x * 16, 48 + y * 16, 16, 16);
    if (game.board[y][x]) block(ctx, 20 + x * 16, 48 + y * 16, 16, blockColors[game.board[y][x]]);
  }
  if (game.piece) {
    const color = blockColors[TETRIS_TYPES.indexOf(game.piece.type) + 1];
    for (const cell of pieceCells({ ...game.piece, y: game.dropY() })) if (cell.y >= 0) block(ctx, 20 + cell.x * 16, 48 + cell.y * 16, 16, color, true);
    for (const cell of pieceCells(game.piece)) if (cell.y >= 0) block(ctx, 20 + cell.x * 16, 48 + cell.y * 16, 16, color);
  }
  panel(ctx, 196, 44, 148, 112, '#251737');
  label(ctx, 'SCORE', 208, 63, 9, '#bfa1cf'); label(ctx, game.score, 208, 84, 21, '#fff2c9');
  label(ctx, `BEST ${Math.max(best, game.score)}`, 208, 103, 10, '#c8b4db');
  label(ctx, `LINES ${game.lines}`, 208, 124, 11); label(ctx, `LEVEL ${game.level}`, 208, 144, 11, '#88dfc3');
  panel(ctx, 196, 166, 70, 86, '#251737', game.canHold ? '#796091' : '#42314e');
  label(ctx, 'HOLD', 231, 184, 9, '#bfa1cf', 'center'); preview(ctx, game.held, 231, 202, 12);
  label(ctx, game.canHold ? 'C / TAP' : 'USED', 231, 240, 8, '#a98cba', 'center');
  panel(ctx, 274, 166, 70, 174, '#251737'); label(ctx, 'NEXT', 309, 184, 9, '#bfa1cf', 'center');
  game.next.slice(0, 4).forEach((type, i) => preview(ctx, type, 309, 196 + i * 35, 11));
  label(ctx, 'ARROWS: MOVE', 197, 273, 8, '#c8b4db'); label(ctx, 'UP / X: ROTATE', 197, 290, 8, '#c8b4db');
  label(ctx, 'SPACE: DROP', 197, 307, 8, '#c8b4db'); label(ctx, 'P: PAUSE', 197, 324, 8, '#c8b4db');
  label(ctx, 'Fill a row to clear it.', 198, 359, 9, '#d2b6dd'); label(ctx, 'Ghost marks the landing.', 198, 373, 8, '#a98cba');
  for (let i = 0; i < controls.length; i++) {
    const name = controls[i], x = 14 + i * 56, enabled = name !== 'hold' || game.canHold;
    panel(ctx, x, 390, 50, 52, enabled ? '#322044' : '#23192e', enabled ? '#8a5ea5' : '#493351');
    controlIcon(ctx, name, x + 25, 409, enabled); label(ctx, name.toUpperCase(), x + 25, 434, 8, enabled ? '#e7d2f3' : '#81718e', 'center');
  }
  if (game.status !== 'playing') {
    ctx.fillStyle = 'rgba(8,6,20,.72)'; ctx.fillRect(20, 48, 160, 320);
    panel(ctx, 25, 154, 150, 102, '#261536', '#d09cda');
    label(ctx, game.status === 'dead' ? 'STACKED OUT' : game.status === 'paused' ? 'PAUSED' : 'READY?', 100, 183, 15, '#f8d6e8', 'center');
    label(ctx, game.status === 'dead' ? `Score ${game.score}` : 'Make a little order', 100, 207, 10, '#d7c0e3', 'center');
    label(ctx, game.status === 'paused' ? 'PRESS PLAY TO RESUME' : 'PRESS PLAY TO START', 100, 235, 8, '#f9d88c', 'center');
  }
  ctx.restore();
}
