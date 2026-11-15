/** Sticker Match canvas: a sticker-book page of flip cards with ten hand-drawn vector stickers. */
import { STICKERS } from './memory.js';

const W = 360, H = 452, TOP = 78, BOTTOM = 404;
const rounded = (ctx, x, y, w, h, r, fill) => { ctx.fillStyle = fill; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill(); };
const drawTxt = (ctx, t, x, y, size, color = '#fbf3ef', align = 'left') => {
  ctx.font = `800 ${size}px ui-sans-serif,system-ui,sans-serif`; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'alphabetic'; ctx.fillText(String(t), x, y); ctx.textAlign = 'left';
};
export function memoryLayout(cols, rows) {
  const gap = 8, cw = Math.min(68, (W - 40 - gap * (cols - 1)) / cols), ch = Math.min(cw * 1.3, (BOTTOM - TOP - gap * (rows - 1)) / rows);
  const x0 = (W - (cw * cols + gap * (cols - 1))) / 2, y0 = TOP + (BOTTOM - TOP - (ch * rows + gap * (rows - 1))) / 2;
  return { gap, cw, ch, x0, y0 };
}
export function memoryCardAt(x, y, cols, rows) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return -1;
  const { gap, cw, ch, x0, y0 } = memoryLayout(cols, rows), col = Math.floor((x - x0) / (cw + gap)), row = Math.floor((y - y0) / (ch + gap));
  if (col < 0 || col >= cols || row < 0 || row >= rows || x - x0 - col * (cw + gap) > cw || y - y0 - row * (ch + gap) > ch) return -1;
  return row * cols + col;
}
function face(ctx, s, ink = '#3a2638') {
  ctx.fillStyle = ink; ctx.beginPath(); ctx.arc(-s * .22, 0, s * .07, 0, Math.PI * 2); ctx.arc(s * .22, 0, s * .07, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = ink; ctx.lineWidth = s * .05; ctx.beginPath(); ctx.arc(0, s * .1, s * .1, .2, Math.PI - .2); ctx.stroke();
}
/** Each sticker is distinct by shape as well as color. `s` is the sticker radius. */
export function drawSticker(ctx, kind, s) {
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const fillStroke = (fill, ink) => { ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = ink; ctx.lineWidth = s * .07; ctx.stroke(); };
  if (kind === 'star') { ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? s * .45 : s; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); fillStroke('#ffd36e', '#b07a1a'); ctx.translate(0, s * .1); face(ctx, s * .8); }
  else if (kind === 'moon') { ctx.beginPath(); ctx.arc(0, 0, s * .85, Math.PI * .35, Math.PI * 1.65); ctx.arc(s * .4, -s * .05, s * .62, Math.PI * 1.5, Math.PI * .5, true); ctx.closePath(); fillStroke('#c9c0ff', '#5a4fb0'); ctx.translate(-s * .53, 0); face(ctx, s * .42); }
  else if (kind === 'rainbow') { for (const [r, c] of [[1, '#ff7fae'], [.8, '#ffcf5a'], [.6, '#7fcf8a'], [.42, '#7fb2ff']]) { ctx.beginPath(); ctx.arc(0, s * .35, s * r, Math.PI, 0); ctx.lineTo(s * r - s * .17, s * .35); ctx.arc(0, s * .35, s * r - s * .17, 0, Math.PI, true); ctx.closePath(); ctx.fillStyle = c; ctx.fill(); }
    for (const x of [-.72, .72]) { ctx.beginPath(); ctx.arc(x * s, s * .42, s * .24, 0, Math.PI * 2); ctx.arc(x * s + s * .2, s * .38, s * .2, 0, Math.PI * 2); ctx.fillStyle = '#ffffff'; ctx.fill(); } }
  else if (kind === 'cloud') { ctx.beginPath(); ctx.arc(-s * .45, s * .1, s * .38, Math.PI * .5, Math.PI * 1.5); ctx.arc(0, -s * .2, s * .48, Math.PI, 0); ctx.arc(s * .48, s * .1, s * .38, Math.PI * 1.5, Math.PI * .5); ctx.closePath(); fillStroke('#f4f7ff', '#7f8cc4'); ctx.translate(0, s * .1); face(ctx, s * .8); }
  else if (kind === 'mushroom') { ctx.beginPath(); ctx.roundRect(-s * .28, -s * .05, s * .56, s * .75, s * .2); fillStroke('#fff1dc', '#b08a6a'); ctx.beginPath(); ctx.arc(0, 0, s * .85, Math.PI, 0); ctx.closePath(); fillStroke('#ff6f8f', '#a8324f');
    ctx.fillStyle = '#ffffff'; for (const [x, y, r] of [[-.45, -.35, .14], [.1, -.6, .12], [.5, -.25, .13]]) { ctx.beginPath(); ctx.arc(x * s, y * s, r * s, 0, Math.PI * 2); ctx.fill(); } ctx.translate(0, s * .32); face(ctx, s * .55); }
  else if (kind === 'flower') { ctx.fillStyle = '#ffb3cf'; for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5 - Math.PI / 2; ctx.beginPath(); ctx.arc(Math.cos(a) * s * .5, Math.sin(a) * s * .5, s * .38, 0, Math.PI * 2); ctx.fill(); } ctx.beginPath(); ctx.arc(0, 0, s * .36, 0, Math.PI * 2); fillStroke('#ffd36e', '#b07a1a'); face(ctx, s * .55); }
  else if (kind === 'planet') { ctx.beginPath(); ctx.arc(0, 0, s * .6, 0, Math.PI * 2); fillStroke('#9fe6d6', '#2f7d6d'); ctx.strokeStyle = '#ffb3cf'; ctx.lineWidth = s * .14; ctx.beginPath(); ctx.ellipse(0, 0, s * .98, s * .3, -.35, Math.PI * .1, Math.PI * .9); ctx.stroke(); face(ctx, s * .6); }
  else if (kind === 'ghost') { ctx.beginPath(); ctx.arc(0, -s * .15, s * .62, Math.PI, 0); ctx.lineTo(s * .62, s * .7); for (let i = 0; i < 3; i++) ctx.quadraticCurveTo(s * (.42 - i * .42), s * .45, s * (.2 - i * .42), s * .7); ctx.lineTo(-s * .62, s * .7); ctx.closePath(); fillStroke('#ffffff', '#8a7fb0');
    ctx.translate(0, -s * .1); face(ctx, s * .7); ctx.fillStyle = '#ffb3cf'; ctx.globalAlpha = .7; ctx.beginPath(); ctx.ellipse(-s * .32, s * .12, s * .1, s * .06, 0, 0, Math.PI * 2); ctx.ellipse(s * .32, s * .12, s * .1, s * .06, 0, 0, Math.PI * 2); ctx.fill(); }
  else if (kind === 'cherry') { ctx.strokeStyle = '#4f9a50'; ctx.lineWidth = s * .08; ctx.beginPath(); ctx.moveTo(-s * .35, s * .2); ctx.quadraticCurveTo(-s * .1, -s * .6, s * .15, -s * .75); ctx.moveTo(s * .4, s * .25); ctx.quadraticCurveTo(s * .3, -s * .4, s * .15, -s * .75); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(s * .32, -s * .78, s * .26, s * .12, -.4, 0, Math.PI * 2); ctx.fillStyle = '#7fcf8a'; ctx.fill(); for (const x of [-.38, .42]) { ctx.beginPath(); ctx.arc(x * s, s * .42, s * .34, 0, Math.PI * 2); fillStroke('#ff4f7b', '#8f2148'); } }
  else { ctx.fillStyle = '#ffb347'; for (let i = 0; i < 8; i++) { ctx.save(); ctx.rotate(i * Math.PI / 4); ctx.beginPath(); ctx.moveTo(-s * .16, -s * .62); ctx.lineTo(0, -s * .98); ctx.lineTo(s * .16, -s * .62); ctx.closePath(); ctx.fill(); ctx.restore(); }
    ctx.beginPath(); ctx.arc(0, 0, s * .58, 0, Math.PI * 2); fillStroke('#ffd36e', '#c47a1c'); face(ctx, s * .7); }
  ctx.restore();
}
const SIZE_NAMES = Object.freeze({ cozy: 'COZY · 6 PAIRS', classic: 'CLASSIC · 8 PAIRS', busy: 'BUSY · 10 PAIRS' });
export function drawStickerMatch(canvas, game, { best = 0, reduced = false } = {}) {
  if (!canvas?.getContext) return; const ctx = canvas.getContext('2d'); if (!ctx) return;
  ctx.save(); ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
  const page = ctx.createLinearGradient(0, 0, 0, H); page.addColorStop(0, '#fff3e6'); page.addColorStop(1, '#ffe3ee'); ctx.fillStyle = page; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#f2c9d8'; ctx.lineWidth = 1; for (let y = 64; y < 410; y += 18) { ctx.beginPath(); ctx.moveTo(12, y); ctx.lineTo(348, y); ctx.stroke(); }
  rounded(ctx, 0, 0, W, 48, 0, '#2c1a33');
  ctx.save(); ctx.translate(26, 24); drawSticker(ctx, 'star', 10); ctx.restore();
  drawTxt(ctx, 'STICKER MATCH', 42, 31, 12, '#ffe6ef');
  drawTxt(ctx, `SCORE ${game.score}`, 214, 31, 11, '#fdfaf7', 'center');
  drawTxt(ctx, `BEST ${Math.max(best, game.score)}`, 342, 31, 11, '#ead4c4', 'right');
  const time = Math.floor(game.elapsed);
  drawTxt(ctx, `PAIRS ${game.matches}/${game.cards.length / 2}  ·  MISSES ${game.misses}  ·  ${Math.floor(time / 60)}:${String(time % 60).padStart(2, '0')}`, 20, 66, 10, '#7a4f63');
  drawTxt(ctx, game.streak >= 2 ? `STREAK ×${game.streak}` : SIZE_NAMES[game.size], 340, 66, 10, game.streak >= 2 ? '#d63a72' : '#7a4f63', 'right');
  const { gap, cw, ch, x0, y0 } = memoryLayout(game.cols, game.rows), s = Math.min(cw, ch) * .32;
  game.cards.forEach((card, i) => {
    const x = x0 + (i % game.cols) * (cw + gap), y = y0 + Math.floor(i / game.cols) * (ch + gap), turn = reduced ? (card.up || card.matched ? 1 : 0) : card.turn;
    const squash = Math.abs(Math.cos(turn * Math.PI)), showFace = turn >= .5;
    ctx.save(); ctx.translate(x + cw / 2, y + ch / 2); ctx.scale(Math.max(.04, squash), 1);
    rounded(ctx, -cw / 2 + 1, -ch / 2 + 3, cw, ch, 10, '#00000018');
    if (showFace) {
      rounded(ctx, -cw / 2, -ch / 2, cw, ch, 10, card.matched ? '#f3fff2' : '#ffffff');
      ctx.strokeStyle = card.matched ? '#7fcf8a' : '#f2a7c3'; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(-cw / 2 + 1, -ch / 2 + 1, cw - 2, ch - 2, 9); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, s * 1.25, 0, Math.PI * 2); ctx.fillStyle = card.matched ? '#e3f7df' : '#fff0f5'; ctx.fill();
      drawSticker(ctx, STICKERS[card.kind], s);
    } else {
      const back = ctx.createLinearGradient(-cw / 2, -ch / 2, cw / 2, ch / 2); back.addColorStop(0, '#b9a2f0'); back.addColorStop(1, '#ff9fc0');
      rounded(ctx, -cw / 2, -ch / 2, cw, ch, 10, back);
      ctx.fillStyle = '#ffffff55'; for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) { ctx.beginPath(); ctx.arc(dx * cw * .28, dy * ch * .3, 2.4, 0, Math.PI * 2); ctx.fill(); }
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(-cw / 2 + 4, -ch / 2 + 4, cw - 8, ch - 8, 7); ctx.stroke();
      // The back carries a plain heart, never one of the stickers, so a face-down card can't be mistaken for a pair.
      ctx.beginPath(); ctx.moveTo(0, s * .5); ctx.bezierCurveTo(-s * .8, -s * .05, -s * .35, -s * .65, 0, -s * .22); ctx.bezierCurveTo(s * .35, -s * .65, s * .8, -s * .05, 0, s * .5); ctx.fillStyle = '#ffffff'; ctx.fill();
    }
    ctx.restore();
    if (game.status === 'playing' && i === game.cursor) { ctx.strokeStyle = '#5fd8d2'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.roundRect(x - 3, y - 3, cw + 6, ch + 6, 12); ctx.stroke(); }
  });
  rounded(ctx, 0, 412, W, 40, 0, '#2c1a33');
  const memorizing = game.status === 'playing' && game.preview > 0;
  drawTxt(ctx, game.status === 'dead' ? 'ALL PAIRS FOUND!' : memorizing ? `MEMORIZE THE PAGE · ${Math.ceil(game.preview)}` : game.faceUp().length === 2 ? 'NOT A MATCH. REMEMBER THEM!' : 'FLIP TWO CARDS TO FIND A PAIR', 180, 430, 11, game.status === 'dead' || memorizing ? '#ffe08a' : '#fdf2f7', 'center');
  drawTxt(ctx, memorizing ? 'TAP TO START EARLY' : 'TAP  ·  ARROWS + SPACE', 180, 445, 8, '#bfa9c4', 'center');
  if (game.status === 'dead') overlay(ctx, 'ALL MATCHED!', `${game.moves} turns · ${game.misses} misses · best streak ${game.bestStreak}`, 'PRESS PLAY FOR A NEW PAGE', '#7fcf8a');
  else if (game.status === 'paused') overlay(ctx, 'PAUSED', 'No peeking. Gabu is watching.', 'PRESS PLAY TO RESUME', '#b8a7ff');
  else if (game.status === 'idle') overlay(ctx, 'STICKER MATCH', 'Flip two cards. Find every pair.', 'PRESS PLAY OR TAP TO START', '#ff9fc0');
  ctx.restore();
}
function overlay(ctx, message, sub, hint, accent) {
  ctx.fillStyle = '#1a1220a0'; ctx.fillRect(0, 48, W, H - 48);
  rounded(ctx, 30, 176, 300, 104, 14, accent); rounded(ctx, 32, 178, 296, 100, 12, '#2a1d31');
  drawTxt(ctx, message, 180, 220, 22, '#fff0f5', 'center'); drawTxt(ctx, sub, 180, 244, 11, '#ead5e4', 'center');
  drawTxt(ctx, hint, 180, 265, 9, '#ffd98c', 'center');
}
