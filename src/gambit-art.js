/** Original vector card artwork. Suit order matches the rules: C, D, S, H. */
export const GAMBIT_SUIT_COLORS = Object.freeze(['#17765b', '#c05a11', '#244d93', '#c8324a']);

const ivory = '#fff9e9', ink = '#253748', gold = '#e7b84d';
const validRect = (ctx, x, y, w, h) => !!ctx && [x, y, w, h].every(Number.isFinite) && w > 0 && h > 0;
const frame = (ctx, x, y, w, h, fill, stroke = null, radius = 5, lineWidth = 1) => {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, radius); ctx.fillStyle = fill; ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lineWidth; ctx.stroke(); }
};
const oval = (ctx, x, y, rx, ry, fill, stroke = null) => {
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); }
};
const polygon = (ctx, points, fill, stroke = null, lineWidth = 1) => {
  ctx.beginPath(); points.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lineWidth; ctx.stroke(); }
};
const label = (ctx, value, x, y, size, color = ink, maxWidth = 90) => {
  ctx.font = `900 ${size}px ui-monospace,Consolas,monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = color; ctx.fillText(String(value), x, y, maxWidth);
};
const line = (ctx, points, color, width = 2) => {
  ctx.beginPath(); points.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke();
};

function suit(ctx, kind, x, y, size, color) {
  const r = size / 2;
  ctx.beginPath(); ctx.fillStyle = color;
  if (kind === 1) {
    ctx.moveTo(x, y - r); ctx.lineTo(x + r * .7, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r * .7, y); ctx.closePath();
  } else if (kind === 3) {
    ctx.moveTo(x, y + r);
    ctx.bezierCurveTo(x - r * 1.65, y - r * .1, x - r * .8, y - r * 1.5, x, y - r * .45);
    ctx.bezierCurveTo(x + r * .8, y - r * 1.5, x + r * 1.65, y - r * .1, x, y + r);
  } else if (kind === 2) {
    ctx.moveTo(x, y - r);
    ctx.bezierCurveTo(x - r * 1.8, y + r * .5, x - r * .55, y + r, x, y + r * .25);
    ctx.bezierCurveTo(x + r * .55, y + r, x + r * 1.8, y + r * .5, x, y - r);
    ctx.moveTo(x, y); ctx.lineTo(x - r * .38, y + r); ctx.lineTo(x + r * .38, y + r); ctx.closePath();
  } else {
    for (const [dx, dy] of [[0, -.48], [-.47, .15], [.47, .15]]) {
      ctx.moveTo(x + (dx + .5) * r, y + dy * r); ctx.arc(x + dx * r, y + dy * r, r * .5, 0, Math.PI * 2);
    }
    ctx.moveTo(x, y); ctx.lineTo(x - r * .38, y + r); ctx.lineTo(x + r * .38, y + r); ctx.closePath();
  }
  ctx.fill();
}

const pipPositions = Object.freeze({
  2: [[50, 39], [50, 101]],
  3: [[50, 36], [50, 70], [50, 104]],
  4: [[32, 39], [68, 39], [32, 101], [68, 101]],
  5: [[32, 39], [68, 39], [50, 70], [32, 101], [68, 101]],
  6: [[32, 36], [68, 36], [32, 70], [68, 70], [32, 104], [68, 104]],
  7: [[32, 36], [68, 36], [50, 53], [32, 70], [68, 70], [32, 104], [68, 104]],
  8: [[32, 36], [68, 36], [50, 53], [32, 70], [68, 70], [50, 87], [32, 104], [68, 104]],
  9: [[32, 33], [68, 33], [32, 57], [68, 57], [50, 70], [32, 83], [68, 83], [32, 107], [68, 107]],
  10: [[32, 33], [68, 33], [50, 45], [32, 57], [68, 57], [32, 83], [68, 83], [50, 95], [32, 107], [68, 107]],
});

function corner(ctx, rank, kind, color) {
  label(ctx, ({ 1: 'A', 11: 'J', 12: 'Q', 13: 'K' })[rank] || rank, 11, 21, 20, color, 21);
  suit(ctx, kind, 11, 31, 11, color);
}

function courtHalf(ctx, rank, kind, color) {
  const accent = ['#45ac8b', '#ef9a35', '#5687d1', '#e97987'][kind];
  // Each court uses the same mirrored framing, but a distinct headpiece and silhouette.
  polygon(ctx, [[28, 70], [34, 58], [45, 54], [55, 54], [66, 58], [72, 70]], color, ink);
  polygon(ctx, [[34, 70], [40, 57], [49, 62], [59, 57], [66, 70]], gold, ink);
  line(ctx, [[42, 59], [50, 68], [58, 59]], accent, 3);
  if (rank === 12) oval(ctx, 50, 48, 16, 17, '#5b4456');
  oval(ctx, 50, 47, 11, 13, '#f3d09e', ink);
  if (rank === 11) {
    polygon(ctx, [[36, 38], [38, 29], [51, 32], [59, 28], [64, 38]], color, ink);
    polygon(ctx, [[57, 33], [64, 21], [68, 22], [61, 35]], ivory, ink);
    frame(ctx, 37, 37, 28, 4, accent, ink, 1);
  } else if (rank === 12) {
    polygon(ctx, [[37, 36], [37, 27], [44, 32], [50, 23], [56, 32], [63, 27], [63, 36]], gold, ink);
    oval(ctx, 50, 31, 2.5, 3, color);
    oval(ctx, 35, 47, 2, 3, gold); oval(ctx, 65, 47, 2, 3, gold);
  } else {
    polygon(ctx, [[36, 36], [35, 24], [43, 29], [50, 19], [57, 29], [65, 24], [64, 36]], gold, ink);
    frame(ctx, 37, 34, 26, 5, accent, ink, 1);
    polygon(ctx, [[41, 51], [46, 53], [50, 62], [54, 53], [59, 51], [57, 60], [50, 65], [43, 60]], '#694535', ink);
  }
  line(ctx, [[42, 45], [46, 45]], ink, 1.6); line(ctx, [[54, 45], [58, 45]], ink, 1.6);
  line(ctx, [[50, 46], [48, 51], [52, 51]], '#a67d5c', 1);
  if (rank !== 13) line(ctx, [[46, 55], [50, 56], [54, 55]], '#8e4251', 1.3);
  suit(ctx, kind, 50, 67, 9, color);
}

/** Draw a full playing card; positions and hit testing remain the renderer's responsibility. */
export function drawGambitCard(ctx, id, x, y, w, h, { selected = false, boost = 0, tilt = 0 } = {}) {
  if (!validRect(ctx, x, y, w, h) || !Number.isInteger(id) || id < 0 || id > 51 || !Number.isFinite(tilt)) return;
  const rank = id % 13 + 1, kind = Math.floor(id / 13), color = GAMBIT_SUIT_COLORS[kind];
  ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.rotate(tilt); ctx.scale(w / 100, h / 140); ctx.translate(-50, -70);
  frame(ctx, 2, 4, 98, 136, '#10232d66', null, 6);
  frame(ctx, 0, 0, 98, 136, ivory, selected ? '#ffce5c' : '#aaaea3', 6, selected ? 3 : 1.5);
  frame(ctx, 3, 3, 92, 130, '#ffffff00', selected ? '#e4aa2f' : '#e3dcc8', 4, .6);
  if (rank === 1) {
    suit(ctx, kind, 49, 73, 47, color);
    line(ctx, [[34, 109], [64, 109]], color, 1);
  } else if (rank < 11) {
    const size = rank <= 5 ? 20 : 16;
    for (const [px, py] of pipPositions[rank]) {
      ctx.save(); ctx.translate(px, py); if (py > 70) ctx.rotate(Math.PI);
      suit(ctx, kind, 0, 0, size, color); ctx.restore();
    }
  } else {
    frame(ctx, 24, 24, 50, 88, '#f7e7b8', color, 1.5, 1.2);
    courtHalf(ctx, rank, kind, color);
    ctx.save(); ctx.translate(98, 136); ctx.rotate(Math.PI); courtHalf(ctx, rank, kind, color); ctx.restore();
    line(ctx, [[25, 68], [73, 68]], color, .8);
  }
  corner(ctx, rank, kind, color);
  ctx.save(); ctx.translate(98, 136); ctx.rotate(Math.PI); corner(ctx, rank, kind, color); ctx.restore();
  if (Number.isFinite(boost) && boost > 0) {
    frame(ctx, 30, 115, 39, 14, '#225f64', '#b4ebda', 3, .6);
    label(ctx, '+' + Math.floor(boost), 49.5, 125, 10, '#edffe4', 36);
  }
  ctx.restore();
}

const jokerStyles = Object.freeze({
  pair_gremlin: ['#174d57', '#e9c554', ['PAIR', 'GREMLIN']],
  heart_hoarder: ['#7c2948', '#f59daf', ['HEART', 'HOARDER']],
  last_laugh: ['#59396d', '#edbc5b', ['LAST', 'LAUGH']],
  growing_suspicion: ['#174d3f', '#b5de6a', ['GROWING', 'SUSPICION']],
  pocket_ace: ['#285176', '#b1d2e5', ['POCKET', 'ACE']],
  club_regular: ['#38654d', '#f0c978', ['CLUB', 'REGULAR']],
  face_value: ['#825531', '#f1cb68', ['FACE', 'VALUE']],
  clean_slate: ['#345a6d', '#8ce0d6', ['CLEAN', 'SLATE']],
  little_scheme: ['#57315a', '#d3b2ee', ['LITTLE', 'SCHEME']],
  straight_talker: ['#286273', '#8be3dc', ['STRAIGHT', 'TALKER']],
  velvet_flush: ['#5d2b56', '#efa4d3', ['VELVET', 'FLUSH']],
  lonely_crown: ['#323760', '#edc46c', ['LONELY', 'CROWN']],
});

function crown(ctx, x, y, size, fill = gold) {
  polygon(ctx, [[x - size, y + size * .5], [x - size * 1.1, y - size * .6], [x - size * .45, y - size * .1],
    [x, y - size], [x + size * .45, y - size * .1], [x + size * 1.1, y - size * .6], [x + size, y + size * .5]], fill, '#573f2d', 1.4);
  frame(ctx, x - size, y + size * .4, size * 2, size * .3, '#dd9b3e', '#573f2d', 1.5);
}
function star(ctx, x, y, size, color) {
  polygon(ctx, Array.from({ length: 8 }, (_, i) => {
    const radius = i % 2 ? size * .24 : size, angle = -Math.PI / 2 + i * Math.PI / 4;
    return [x + Math.cos(angle) * radius, y + Math.sin(angle) * radius];
  }), color);
}
function jokerSymbol(ctx, id, accent) {
  if (id === 'pair_gremlin') {
    for (const [x, fill] of [[41, '#e6bb54'], [65, '#82d7bc']]) {
      polygon(ctx, [[x - 12, 61], [x - 19, 43], [x - 3, 49], [x + 13, 43], [x + 12, 64]], fill, ink);
      oval(ctx, x, 65, 14, 18, fill, ink); oval(ctx, x - 5, 61, 2.5, 3, ivory); oval(ctx, x + 5, 61, 2.5, 3, ivory);
      oval(ctx, x - 5, 62, 1, 1.8, ink); oval(ctx, x + 5, 62, 1, 1.8, ink);
      line(ctx, [[x - 7, 71], [x, 75], [x + 7, 70]], ink, 2);
    }
  } else if (id === 'heart_hoarder') {
    ctx.beginPath(); ctx.arc(54, 46, 14, Math.PI, Math.PI * 2); ctx.strokeStyle = gold; ctx.lineWidth = 4; ctx.stroke();
    suit(ctx, 3, 54, 68, 50, '#ef88a5');
    oval(ctx, 54, 67, 7, 8, gold, ink); line(ctx, [[54, 66], [54, 76]], ink, 3);
    for (const x of [30, 78]) oval(ctx, x, 49, 3.5, 3.5, gold, ink);
  } else if (id === 'last_laugh') {
    polygon(ctx, [[31, 50], [28, 29], [46, 41], [56, 23], [65, 41], [83, 30], [78, 52]], accent, ink);
    oval(ctx, 54, 67, 25, 28, '#f8e7cf', ink);
    line(ctx, [[36, 61], [42, 57], [47, 61]], '#62364e', 3); line(ctx, [[61, 61], [67, 57], [73, 61]], '#62364e', 3);
    ctx.beginPath(); ctx.moveTo(37, 72); ctx.quadraticCurveTo(54, 84, 72, 72); ctx.quadraticCurveTo(55, 104, 37, 72); ctx.fillStyle = '#7b2e49'; ctx.fill();
    line(ctx, [[43, 78], [67, 78]], ivory, 4); oval(ctx, 54, 68, 4, 4, '#dc596b');
  } else if (id === 'growing_suspicion') {
    ctx.beginPath(); ctx.moveTo(53, 96); ctx.bezierCurveTo(25, 75, 78, 58, 52, 31); ctx.strokeStyle = accent; ctx.lineWidth = 5; ctx.stroke();
    for (const [x, y, sign] of [[45, 84, -1], [61, 71, 1], [47, 40, -1]]) polygon(ctx, [[x, y], [x + sign * 17, y - 12], [x + sign * 15, y + 4]], '#6cab70', '#d0df83');
    ctx.beginPath(); ctx.moveTo(29, 57); ctx.quadraticCurveTo(54, 35, 80, 57); ctx.quadraticCurveTo(54, 79, 29, 57); ctx.fillStyle = '#f1df98'; ctx.fill();
    oval(ctx, 54, 57, 10, 13, '#799748'); oval(ctx, 54, 57, 4, 10, ink);
  } else if (id === 'pocket_ace') {
    ctx.save(); ctx.translate(43, 58); ctx.rotate(-.18); frame(ctx, -19, -28, 38, 55, '#ddded3', '#152b43', 3); label(ctx, 'A', 0, -8, 18, GAMBIT_SUIT_COLORS[2]); suit(ctx, 2, 0, 9, 19, GAMBIT_SUIT_COLORS[2]); ctx.restore();
    frame(ctx, 49, 30, 38, 55, ivory, '#152b43', 3); label(ctx, 'A', 68, 50, 18, GAMBIT_SUIT_COLORS[3]); suit(ctx, 3, 68, 66, 19, GAMBIT_SUIT_COLORS[3]);
    polygon(ctx, [[25, 72], [83, 72], [79, 94], [54, 102], [29, 94]], '#356d9c', '#acd4e9', 2);
    line(ctx, [[31, 78], [35, 90], [54, 96], [73, 90], [77, 78]], '#d0b778', 1.5);
  } else if (id === 'club_regular') {
    ctx.beginPath(); ctx.arc(78, 65, 15, -Math.PI / 2, Math.PI / 2); ctx.strokeStyle = '#e3be76'; ctx.lineWidth = 8; ctx.stroke();
    frame(ctx, 28, 46, 45, 46, '#c9e6c0', '#193c35', 6, 2); frame(ctx, 30, 45, 41, 7, '#f8e9bb', '#193c35', 3);
    suit(ctx, 0, 51, 70, 26, '#1b6f57');
    for (const x of [40, 54, 67]) { ctx.beginPath(); ctx.moveTo(x, 38); ctx.quadraticCurveTo(x - 7, 31, x, 24); ctx.strokeStyle = '#eff3c5'; ctx.lineWidth = 2; ctx.stroke(); }
  } else if (id === 'face_value') {
    oval(ctx, 54, 69, 29, 29, '#b77b28', '#ffe5a3'); oval(ctx, 54, 67, 24, 24, '#eac05c', '#76572c');
    oval(ctx, 54, 68, 10, 12, '#fff0bb'); line(ctx, [[48, 65], [50, 65]], '#79592f', 2); line(ctx, [[58, 65], [60, 65]], '#79592f', 2);
    line(ctx, [[49, 73], [54, 75], [59, 73]], '#79592f', 2); crown(ctx, 54, 38, 19, '#f2da86');
    for (const x of [23, 86]) star(ctx, x, 68, 5, ivory);
  } else if (id === 'clean_slate') {
    ctx.save(); ctx.translate(54, 64); ctx.rotate(-.13);
    frame(ctx, -27, -30, 54, 66, '#143941', '#b4d1c9', 4, 3); line(ctx, [[-17, -16], [15, -16]], '#6d9e9a', 2); line(ctx, [[-17, -7], [8, -7]], '#6d9e9a', 2);
    polygon(ctx, [[-16, 18], [-2, 3], [21, 15], [6, 31]], '#efaa9f', '#fbe4c4', 1.5); polygon(ctx, [[6, 31], [21, 15], [29, 20], [14, 36]], '#e8deba');
    ctx.restore(); star(ctx, 77, 34, 11, '#e9f9bc'); star(ctx, 28, 83, 6, '#e9f9bc');
  } else if (id === 'little_scheme') {
    line(ctx, [[30, 79], [54, 37], [78, 79], [30, 79]], '#cba0d8', 2);
    for (const [x, y, fill] of [[30, 79, '#8fd3c0'], [54, 37, '#edbf65'], [78, 79, '#dba4ce']]) {
      polygon(ctx, [[x, y - 15], [x + 14, y + 11], [x - 14, y + 11]], fill, '#273043', 2);
      oval(ctx, x, y + 2, 3, 4, '#273043');
    }
    star(ctx, 54, 70, 7, ivory);
  } else if (id === 'straight_talker') {
    const colors = ['#c78568', '#d5a754', '#9fc77e', '#74cdbb', '#78b8e0'];
    for (let i = 0; i < 5; i++) { const x = 26 + i * 11, y = 82 - i * 10; frame(ctx, x, y, 15, 17, colors[i], '#132f3c', 2); label(ctx, i + 1, x + 7.5, y + 12, 10, '#193746', 13); }
    line(ctx, [[28, 61], [48, 42], [72, 22]], '#e2f6cd', 4); polygon(ctx, [[64, 21], [78, 18], [76, 32]], '#e2f6cd');
  } else if (id === 'velvet_flush') {
    for (let i = 0; i < 4; i++) {
      ctx.save(); ctx.translate(54, 93); ctx.rotate((i - 1.5) * .22);
      frame(ctx, -16, -62, 32, 59, ivory, '#67334d', 3); suit(ctx, i, 0, -37, 21, GAMBIT_SUIT_COLORS[i]); ctx.restore();
    }
    oval(ctx, 54, 95, 6, 5, gold, '#603b42');
  } else {
    polygon(ctx, [[54, 26], [28, 100], [82, 100]], '#52567e');
    frame(ctx, 37, 82, 34, 16, '#55416b', '#d4b775', 3); frame(ctx, 41, 92, 5, 9, '#d4b775', null, 1); frame(ctx, 63, 92, 5, 9, '#d4b775', null, 1);
    crown(ctx, 54, 57, 24); oval(ctx, 54, 56, 4, 6, '#bb4263'); star(ctx, 28, 35, 4, '#e8d3a5');
  }
}

/** Twelve distinct illustrated modifiers, drawn as collectible cards rather than badges. */
export function drawGambitJoker(ctx, id, x, y, w, h, { selected = false } = {}) {
  if (!validRect(ctx, x, y, w, h)) return;
  const [background, accent, names] = jokerStyles[id] || jokerStyles.lonely_crown;
  ctx.save(); ctx.translate(x, y); ctx.scale(w / 100, h / 140);
  frame(ctx, 2, 4, 98, 136, '#10232d66', null, 6);
  frame(ctx, 0, 0, 98, 136, ivory, selected ? '#ffd763' : '#d3cfb7', 5, selected ? 3 : 1.4);
  frame(ctx, 5, 5, 88, 126, background, accent, 2, .7);
  // Original foil-like diagonal hatch, kept quieter than the central illustration.
  for (let yLine = 12; yLine < 100; yLine += 13) line(ctx, [[22, yLine], [86, yLine + 15]], '#ffffff0c', .6);
  for (let i = 0; i < 5; i++) label(ctx, 'JOKER'[i], 12, 22 + i * 11, 9, '#fff4ce', 10);
  ctx.save(); jokerSymbol(ctx, id, accent); ctx.restore();
  frame(ctx, 20, 106, 68, 23, '#fff1cf', accent, 2, .8);
  label(ctx, names[0], 54, 116, 8.7, background, 64); label(ctx, names[1], 54, 126, 8.7, background, 64);
  ctx.restore();
}

function cardBack(ctx, x, y, w, h) {
  ctx.save(); ctx.translate(x, y); ctx.scale(w / 100, h / 140);
  frame(ctx, 0, 0, 98, 136, '#fcf0d6', '#9aa9ab', 5, 1.5);
  frame(ctx, 5, 5, 88, 126, '#245b81', '#bde1e1', 2, 1.2);
  for (let row = 0; row < 8; row++) for (let col = 0; col < 5; col++) {
    const px = 14 + col * 17, py = 17 + row * 14;
    polygon(ctx, [[px, py - 4], [px + 4, py], [px, py + 4], [px - 4, py]], null, '#79afbb', .8);
  }
  polygon(ctx, [[49, 35], [76, 68], [49, 101], [22, 68]], '#1b4b71', '#e7d6a0', 2);
  oval(ctx, 49, 68, 15, 20, null, '#e7d6a0');
  suit(ctx, 2, 49, 68, 21, '#f2e4bc');
  frame(ctx, 10, 10, 78, 116, '#ffffff00', '#d6dfc8', 1, .7);
  ctx.restore();
}

/** Backed draw pile, including a count contained within the supplied rectangle. */
export function drawGambitDeck(ctx, x, y, w, h, count) {
  if (!validRect(ctx, x, y, w, h)) return;
  ctx.save();
  const offset = Math.min(w * .06, h * .03, 4), labelHeight = Math.min(h * .18, Math.max(9, h * .11)), cardHeight = Math.max(.1, h - labelHeight - offset * 2);
  for (let i = 2; i >= 0; i--) cardBack(ctx, x + i * offset, y + i * offset, w - offset * 2, cardHeight);
  const safeCount = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
  label(ctx, safeCount + '/52', x + w / 2, y + h - 1, labelHeight * .85, '#f8efcf', w);
  ctx.restore();
}

/** An unopened booster has a sealed wrapper silhouette, not a playing-card face. */
export function drawGambitPack(ctx, kind, x, y, w, h) {
  if (!validRect(ctx, x, y, w, h)) return;
  const joker = kind === 'joker', background = joker ? '#734b86' : '#237ca0', accent = joker ? '#ef9dcd' : '#f0d365';
  ctx.save(); ctx.translate(x, y); ctx.scale(w / 100, h / 140);
  const seam = Array.from({ length: 13 }, (_, i) => [8 + i * 7, i % 2 ? 8 : 4]);
  polygon(ctx, [...seam, [92, 132], ...seam.slice().reverse().map(([px, py]) => [px, 140 - py]), [8, 8]], background, '#f7e9c5', 1.5);
  frame(ctx, 12, 14, 76, 111, joker ? '#503364' : '#165b7c', accent, 2, 1);
  for (let i = 0; i < 4; i++) line(ctx, [[18, 19 + i * 3], [82, 19 + i * 3]], '#ffffff29', 1);
  if (joker) {
    polygon(ctx, [[28, 54], [26, 34], [44, 47], [54, 27], [64, 47], [81, 34], [79, 57]], '#e5be65', '#352844', 1.5);
    oval(ctx, 53, 64, 23, 24, '#f7e3c5', '#3e2d50');
    line(ctx, [[36, 61], [42, 57], [47, 61]], '#73425b', 2.5); line(ctx, [[59, 61], [65, 57], [71, 61]], '#73425b', 2.5);
    line(ctx, [[42, 74], [53, 80], [65, 73]], '#a74669', 3); oval(ctx, 53, 68, 3, 3, '#de728d');
  } else {
    star(ctx, 50, 58, 27, '#f1ce68');
    line(ctx, [[50, 74], [50, 44]], '#175f82', 6); polygon(ctx, [[36, 54], [50, 38], [64, 54]], '#175f82');
    for (const [px, py] of [[24, 38], [79, 72], [28, 85]]) star(ctx, px, py, 5, '#b8e9dc');
  }
  label(ctx, joker ? 'JOKER' : 'UPGRADE', 50, 107, 13, ivory, 72);
  label(ctx, 'PACK', 50, 120, 10, accent, 65);
  for (let i = 0; i < 3; i++) line(ctx, [[18, 129 + i * 2], [82, 129 + i * 2]], '#ffffff32', 1);
  ctx.restore();
}
