/** Compact, vector-drawn Klondike table. Coordinates are always 360 by 452. */
import { solitaireRank, solitaireSuit, solitaireRed } from './solitaire.js';

const CARD_W = 44, CARD_H = 62, TOP = 65, TABLE = 151, BOTTOM = 401;
const columnX = index => 8 + index * 50;
const foundationX = index => 158 + index * 50;
const inside = (x, y, left, top, width = CARD_W, height = CARD_H) => x >= left && x < left + width && y >= top && y < top + height;
const round = (ctx, x, y, w, h, r, color, stroke) => {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fillStyle = color; ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.2; ctx.stroke(); }
};
const text = (ctx, value, x, y, size = 12, color = '#fff2fb', align = 'left') => {
  ctx.font = `800 ${size}px ui-sans-serif,system-ui,sans-serif`; ctx.textAlign = align; ctx.fillStyle = color; ctx.fillText(String(value), x, y);
};
function cardPositions(column) {
  const hidden = column.filter(card => !card.faceUp).length, exposed = column.length - hidden;
  const step = Math.max(2, Math.min(20, (BOTTOM - TABLE - CARD_H - hidden * 9) / Math.max(1, exposed - 1)));
  let y = TABLE;
  return column.map(card => { const current = y; y += card.faceUp ? step : 9; return current; });
}

/** Draw actual suit paths; no font-dependent suit symbols or emoji. */
function suit(ctx, kind, x, y, size, color) {
  ctx.fillStyle = color; ctx.beginPath();
  const r = size / 2;
  if (kind === 1) { ctx.moveTo(x, y - r); ctx.lineTo(x + r * .7, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r * .7, y); ctx.closePath(); }
  else if (kind === 3) {
    ctx.moveTo(x, y + r); ctx.bezierCurveTo(x - r * 1.65, y - r * .1, x - r * .8, y - r * 1.5, x, y - r * .45);
    ctx.bezierCurveTo(x + r * .8, y - r * 1.5, x + r * 1.65, y - r * .1, x, y + r);
  } else if (kind === 2) {
    ctx.moveTo(x, y - r); ctx.bezierCurveTo(x - r * 1.8, y + r * .5, x - r * .55, y + r, x, y + r * .25);
    ctx.bezierCurveTo(x + r * .55, y + r, x + r * 1.8, y + r * .5, x, y - r);
    ctx.moveTo(x, y); ctx.lineTo(x - r * .4, y + r); ctx.lineTo(x + r * .4, y + r); ctx.closePath();
  } else {
    for (const [dx, dy] of [[0, -.48], [-.47, .15], [.47, .15]]) { ctx.moveTo(x + dx * r + r * .5, y + dy * r); ctx.arc(x + dx * r, y + dy * r, r * .5, 0, Math.PI * 2); }
    ctx.moveTo(x, y); ctx.lineTo(x - r * .4, y + r); ctx.lineTo(x + r * .4, y + r); ctx.closePath();
  }
  ctx.fill();
}
function card(ctx, id, x, y, faceUp = true, selected = false) {
  round(ctx, x, y, CARD_W, CARD_H, 5, faceUp ? '#fff6e9' : '#633d80', selected ? '#ffd27f' : faceUp ? '#d6bdd6' : '#cba2df');
  if (!faceUp) {
    round(ctx, x + 5, y + 5, CARD_W - 10, CARD_H - 10, 3, '#432254', '#a97bbc');
    for (let row = 0; row < 4; row++) for (let col = 0; col < 3; col++) {
      ctx.fillStyle = '#b987d4'; ctx.fillRect(x + 10 + col * 10, y + 10 + row * 12, 3, 3);
    }
    return;
  }
  const color = solitaireRed(id) ? '#b72d66' : '#352343', rank = solitaireRank(id);
  const label = rank === 1 ? 'A' : rank === 11 ? 'J' : rank === 12 ? 'Q' : rank === 13 ? 'K' : rank;
  text(ctx, label, x + 4, y + 11, 11, color); suit(ctx, solitaireSuit(id), x + 34, y + 7, 9, color);
  suit(ctx, solitaireSuit(id), x + 22, y + 33, 23, color);
  text(ctx, label, x + 39, y + 57, 11, color, 'right');
  if (selected) { ctx.strokeStyle = '#f6bc60'; ctx.lineWidth = 2.5; ctx.strokeRect(x + 1, y + 1, CARD_W - 2, CARD_H - 2); }
}
function placeholder(ctx, x, y, kind) {
  round(ctx, x, y, CARD_W, CARD_H, 5, '#ffffff07', '#9c6b9b');
  if (kind !== undefined) suit(ctx, kind, x + CARD_W / 2, y + CARD_H / 2, 22, '#a67f9b');
}
function rectFor(hit, game) {
  if (!hit) return null;
  if (hit.pile === 'stock') return [8, TOP];
  if (hit.pile === 'waste') return [58, TOP];
  if (hit.pile === 'foundation') return [foundationX(hit.index), TOP];
  if (hit.pile === 'tableau') return [columnX(hit.index), cardPositions(game.tableau[hit.index])[hit.card] ?? TABLE];
  return null;
}
export function solitaireHitAt(x, y, game) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  if (inside(x, y, 8, TOP)) return { pile: 'stock' };
  if (inside(x, y, 58, TOP)) return { pile: 'waste' };
  for (let index = 0; index < 4; index++) if (inside(x, y, foundationX(index), TOP)) return { pile: 'foundation', index };
  for (let index = 0; index < 7; index++) {
    const column = game.tableau[index], positions = cardPositions(column);
    if (!column.length && inside(x, y, columnX(index), TABLE)) return { pile: 'tableau', index };
    for (let row = column.length - 1; row >= 0; row--) if (inside(x, y, columnX(index), positions[row])) {
      return column[row].faceUp ? { pile: 'tableau', index, card: row } : null;
    }
  }
  return null;
}
export function drawSolitaire(canvas, game, { best = 0, reduced = false, cursor = null } = {}) {
  if (!canvas?.getContext) return; const ctx = canvas.getContext('2d'); if (!ctx) return;
  ctx.save(); ctx.setTransform(canvas.width / 360, 0, 0, canvas.height / 452, 0, 0);
  const gradient = ctx.createLinearGradient(0, 0, 0, 452); gradient.addColorStop(0, '#39203e'); gradient.addColorStop(1, '#161d30');
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, 360, 452);
  text(ctx, 'SOLITAIRE', 10, 28, 12, '#ffdded'); text(ctx, `${game.score} / 520`, 185, 28, 12, '#fff6e9', 'center');
  text(ctx, `BEST ${best}`, 350, 28, 11, '#ffd496', 'right');
  ctx.fillStyle = '#b483a7'; ctx.fillRect(8, 43, 344, 1);
  text(ctx, 'DRAW', 30, 58, 9, '#e3c7da', 'center'); text(ctx, 'WASTE', 80, 58, 9, '#e3c7da', 'center'); text(ctx, 'FOUNDATIONS', 255, 58, 9, '#e3c7da', 'center');
  placeholder(ctx, 8, TOP); if (game.stock.length) card(ctx, game.stock.at(-1), 8, TOP, false);
  else if (game.waste.length) { text(ctx, 'DEAL', 30, 92, 9, '#ffd496', 'center'); text(ctx, 'AGAIN', 30, 106, 8, '#ffd496', 'center'); }
  else text(ctx, 'EMPTY', 30, 100, 9, '#cbb4cf', 'center');
  placeholder(ctx, 58, TOP); if (game.waste.length) card(ctx, game.waste.at(-1), 58, TOP, true, game.selection?.pile === 'waste');
  for (let index = 0; index < 4; index++) {
    placeholder(ctx, foundationX(index), TOP, index);
    if (game.foundations[index].length) card(ctx, game.foundations[index].at(-1), foundationX(index), TOP, true, game.selection?.pile === 'foundation' && game.selection.index === index);
  }
  game.tableau.forEach((column, index) => {
    const positions = cardPositions(column); if (!column.length) placeholder(ctx, columnX(index), TABLE);
    column.forEach((item, row) => card(ctx, item.id, columnX(index), positions[row], item.faceUp,
      game.selection?.pile === 'tableau' && game.selection.index === index && row >= (game.selection.card ?? column.length - 1)));
  });
  if (cursor) { const rect = rectFor(cursor, game); if (rect) { ctx.strokeStyle = '#a8f3db'; ctx.lineWidth = 2; ctx.strokeRect(rect[0] - 2, rect[1] - 2, CARD_W + 4, CARD_H + 4); } }
  text(ctx, `${game.stock.length} in stock  /  ${game.moves} moves`, 180, 420, 10, '#edcde0', 'center');
  text(ctx, game.selection ? 'Choose a destination. Tap selected card to cancel.' : 'Tap a card, then its destination. Draw one from the stock.', 180, 440, 9, '#cbb4cf', 'center');
  if (game.status === 'idle' || game.status === 'paused' || game.won) {
    ctx.fillStyle = '#140f23b8'; ctx.fillRect(0, 46, 360, 359);
    round(ctx, 28, 176, 304, 111, 13, '#281b39', '#cd93bd');
    text(ctx, game.won ? 'TABLE CLEARED!' : game.status === 'paused' ? 'PAUSED' : 'DRAW-ONE KLONDIKE', 180, 209, 18, '#ffe3f2', 'center');
    text(ctx, game.won ? `${game.moves} moves. Nicely played.` : 'Build alternating colors down; same suits up.', 180, 238, 11, '#ead6e9', 'center');
    text(ctx, game.won ? 'PRESS PLAY FOR A NEW DEAL' : game.status === 'paused' ? 'PRESS PLAY TO RESUME' : 'PRESS PLAY OR TAP TO START', 180, 263, 10, '#ffd496', 'center');
  }
  ctx.restore();
}
