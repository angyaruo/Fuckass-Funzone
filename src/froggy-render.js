/** Hand-drawn vector pond and touch controls for the shared 360 x 452 cabinet. */
import { FROGGY_COLS, FROGGY_ROWS, FROGGY_HOME_COLUMNS } from './froggy.js';

const LEFT = 18, TOP = 72, CELL_W = 36, CELL_H = 28;
const CONTROLS = [['left', 25], ['up', 105], ['down', 185], ['right', 265]];
const label = (ctx, value, x, y, size = 12, color = '#fff', align = 'center') => {
  ctx.font = `800 ${size}px ui-sans-serif, system-ui, sans-serif`; ctx.textAlign = align;
  ctx.fillStyle = color; ctx.fillText(String(value), x, y);
};
function box(ctx, x, y, width, height, radius, fill, stroke) {
  ctx.beginPath(); ctx.roundRect(x, y, width, height, radius);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.lineWidth = 1.5; ctx.strokeStyle = stroke; ctx.stroke(); }
}
function oval(ctx, x, y, rx, ry, fill) {
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill();
}
function frog(ctx, x, y, scale = 1, hopping = false) {
  ctx.save(); ctx.translate(x, y);
  const spread = hopping ? 1.2 : 1;
  oval(ctx, -9 * scale * spread, 5 * scale, 5 * scale, 3 * scale, '#5ae1b3');
  oval(ctx, 9 * scale * spread, 5 * scale, 5 * scale, 3 * scale, '#5ae1b3');
  oval(ctx, 0, 1 * scale, 10 * scale, 8 * scale, '#85f0b1');
  oval(ctx, 0, 4 * scale, 6 * scale, 4 * scale, '#d7ffd1');
  for (const side of [-1, 1]) {
    oval(ctx, side * 6 * scale, -6 * scale, 4.5 * scale, 4.5 * scale, '#85f0b1');
    oval(ctx, side * 6 * scale, -7 * scale, 2.5 * scale, 2.8 * scale, '#fff8e3');
    oval(ctx, side * 6 * scale, -7.4 * scale, 1.2 * scale, 1.7 * scale, '#251a45');
    oval(ctx, side * 7 * scale, 1 * scale, 2 * scale, 1.2 * scale, '#f894b8');
  }
  ctx.beginPath(); ctx.moveTo(-3 * scale, 1 * scale); ctx.quadraticCurveTo(0, 4 * scale, 3 * scale, 1 * scale);
  ctx.lineWidth = scale; ctx.strokeStyle = '#27856b'; ctx.stroke(); ctx.restore();
}
function arrow(ctx, direction, x, y) {
  const points = direction === 'left' ? [[7, -9], [-4, 0], [7, 9]] : direction === 'right' ? [[-7, -9], [4, 0], [-7, 9]] :
    direction === 'up' ? [[-9, 6], [0, -5], [9, 6]] : [[-9, -6], [0, 5], [9, -6]];
  ctx.beginPath(); ctx.moveTo(x + points[0][0], y + points[0][1]);
  ctx.lineTo(x + points[1][0], y + points[1][1]); ctx.lineTo(x + points[2][0], y + points[2][1]);
  ctx.strokeStyle = '#f8e8ff'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
}

export function froggyControlAt(x, y) {
  if (!Number.isFinite(x) || !Number.isFinite(y) || y < 403 || y > 445) return null;
  return CONTROLS.find(([, left]) => x >= left && x <= left + 70)?.[0] || null;
}

export function drawFroggy(canvas, game, { best = 0, reduced = false } = {}) {
  const ctx = canvas?.getContext?.('2d'); if (!ctx) return;
  ctx.save(); ctx.setTransform(canvas.width / 360, 0, 0, canvas.height / 452, 0, 0); ctx.clearRect(0, 0, 360, 452);
  ctx.textBaseline = 'alphabetic'; ctx.lineCap = 'butt'; ctx.lineJoin = 'miter'; ctx.globalAlpha = 1;
  ctx.fillStyle = '#130e26'; ctx.fillRect(0, 0, 360, 452);
  label(ctx, 'FROGGY', 20, 22, 17, '#b8ffd0', 'left');
  label(ctx, `POND ${game.level}`, 340, 22, 11, '#e7c9ff', 'right');
  box(ctx, 18, 32, 99, 31, 8, '#2a1d40', '#604478');
  box(ctx, 125, 32, 110, 31, 8, '#2a1d40', '#604478');
  box(ctx, 243, 32, 99, 31, 8, '#2a1d40', '#604478');
  label(ctx, `SCORE ${game.score}`, 67, 52, 11, '#fff5c5');
  label(ctx, `BEST ${best}`, 180, 52, 11, '#e8d3ff');
  for (let i = 0; i < 3; i++) {
    if (i < game.lives) frog(ctx, 265 + i * 27, 48, .58);
    else oval(ctx, 265 + i * 27, 48, 6, 5, '#594561');
  }
  box(ctx, LEFT - 2, TOP - 2, FROGGY_COLS * CELL_W + 4, FROGGY_ROWS * CELL_H + 4, 8, '#423052');
  for (let row = 0; row < FROGGY_ROWS; row++) {
    const y = TOP + row * CELL_H;
    ctx.fillStyle = row === 0 ? '#173d49' : row <= 4 ? (row % 2 ? '#17465e' : '#1b526b') :
      [5, 10].includes(row) ? '#38534d' : row % 2 ? '#3a304f' : '#30283f';
    ctx.fillRect(LEFT, y, FROGGY_COLS * CELL_W, CELL_H);
    if (row >= 6 && row <= 9) {
      ctx.fillStyle = '#786780'; for (let x = LEFT + 9; x < 342; x += 36) ctx.fillRect(x, y + CELL_H - 2, 17, 1);
    }
    if ([5, 10].includes(row)) {
      for (let x = LEFT + 8; x < 342; x += 26) {
        ctx.fillStyle = '#779065'; ctx.fillRect(x, y + 6, 2, 5); ctx.fillRect(x + 4, y + 13, 2, 4);
      }
    }
    if (row > 0 && row <= 4) {
      const drift = reduced ? 0 : Math.sin(game.elapsed * 2 + row) * 3;
      ctx.fillStyle = '#3a7890'; for (let x = LEFT + 12; x < 330; x += 58) ctx.fillRect(x + drift, y + 20, 14, 1);
    }
  }
  FROGGY_HOME_COLUMNS.forEach((col, index) => {
    const x = LEFT + (col + .5) * CELL_W, y = TOP + 14;
    oval(ctx, x, y, 15, 11, game.homes[index] ? '#3c9b75' : '#4f8d75');
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 14, y - 5); ctx.lineTo(x + 14, y + 2);
    ctx.closePath(); ctx.fillStyle = '#173d49'; ctx.fill();
    if (game.homes[index]) frog(ctx, x, y, .7);
  });
  for (const lane of game.lanes) {
    const y = TOP + lane.row * CELL_H;
    for (const center of game.objects(lane)) {
      const rawX = LEFT + (center + .5 - lane.size / 2) * CELL_W;
      const x = Math.max(LEFT, rawX), end = Math.min(342, rawX + lane.size * CELL_W);
      if (end <= x) continue;
      if (lane.type === 'river') {
        box(ctx, x, y + 4, end - x, 20, Math.min(6, (end - x) / 2), '#b27b55', '#dfaa79');
        ctx.fillStyle = '#7c513d'; if (end - x > 12) { ctx.fillRect(x + 6, y + 10, end - x - 12, 1); ctx.fillRect(x + 8, y + 18, Math.max(0, end - x - 16), 1); }
      } else {
        const color = lane.row % 2 ? '#e7a8ca' : '#eeb864';
        box(ctx, x, y + 4, end - x, 20, Math.min(5, (end - x) / 2), color, '#ffe2c6');
        if (end - x > 20) {
          box(ctx, x + (end - x) * .33, y + 6, (end - x) * .34, 16, 3, '#4a466d');
          ctx.fillStyle = '#d8f3ff'; ctx.fillRect(x + (end - x) * .39, y + 8, (end - x) * .22, 3);
          ctx.fillStyle = '#211a2c'; ctx.fillRect(x + 5, y + 2, 8, 3); ctx.fillRect(end - 13, y + 23, 8, 3);
        }
      }
    }
  }
  frog(ctx, LEFT + (game.frog.x + .5) * CELL_W, TOP + (game.frog.y + .5) * CELL_H, 1, !reduced && game.hopFlash > 0);
  label(ctx, game.message || 'ARROWS / WASD  ·  TAP TO HOP', 180, 395, 10, game.message ? '#ffd3a0' : '#c7adc9');
  for (const [direction, x] of CONTROLS) {
    box(ctx, x, 403, 70, 42, 10, '#352044', '#97659f'); arrow(ctx, direction, x + 35, 424);
  }
  if (game.status !== 'playing') {
    box(ctx, 33, 175, 294, 122, 16, 'rgba(23, 13, 37, .96)', '#cc93d7');
    label(ctx, game.status === 'dead' ? 'OUT OF HOPS' : game.status === 'paused' ? 'POND ON PAUSE' : 'A LITTLE ROAD TRIP', 180, 208, 19, '#d4ffd7');
    label(ctx, game.status === 'dead' ? `SCORE ${game.score}  /  POND ${game.level}` : 'Dodge traffic. Ride logs. Fill five lilies.', 180, 234, 12, '#e6cbe7');
    label(ctx, game.status === 'dead' ? 'PRESS PLAY TO TRY AGAIN' : game.status === 'paused' ? 'PRESS PLAY TO RESUME' : 'PRESS PLAY OR TAP TO START', 180, 267, 10, '#ffe3a4');
  }
  ctx.restore();
}
