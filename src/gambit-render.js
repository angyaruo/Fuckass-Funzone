/** Original card-table artwork and shared touch/keyboard targets. Logical size: 360 x 452. */
import { GAMBIT_JOKERS, GAMBIT_HANDS } from './gambit-rules.js';

const ink = '#f8efdc', muted = '#b7b2c9', gold = '#e8bf76', mint = '#86d6c6';
const jokerBy = id => GAMBIT_JOKERS.find(item => item.id === id);
const handBy = id => GAMBIT_HANDS.find(item => item.id === id);
const number = value => Math.floor(Number(value) || 0).toLocaleString('en-US');
const region = (kind, x, y, w, h, label, extra = {}) => ({ kind, x, y, w, h, label, enabled: true, ...extra });
const cardName = id => {
  const rank = id % 13 + 1;
  return (({ 1: 'Ace', 11: 'Jack', 12: 'Queen', 13: 'King' })[rank] || rank) + ' of ' + ['Clubs', 'Diamonds', 'Spades', 'Hearts'][Math.floor(id / 13)];
};
const ownedOffer = (game, offer) => offer.kind === 'joker' && game.jokers.includes(offer.id);
function offerLabel(game, offer) {
  const name = offer.kind === 'joker' ? jokerBy(offer.id)?.name || 'Joker' : offer.pack === 'joker' ? 'Joker Pack' : 'Upgrade Pack';
  const detail = offer.kind === 'joker' ? jokerBy(offer.id)?.description || '' : offer.pack === 'joker' ? 'Reveal three Jokers and keep one.' : 'Reveal three hand or card boosts and keep one.';
  const state = offer.sold ? 'Sold. ' : ownedOffer(game, offer) ? 'Already equipped. ' : game.money < offer.price ? 'Not enough run coins. ' : '';
  return state + 'Buy ' + name + ' for ' + offer.price + ' run coins. ' + detail;
}

/** These exact rectangles drive painting, pointer hits, and keyboard focus. */
export function gambitActions(game, { inspection = null } = {}) {
  if (game.status !== 'playing') return [];
  if (inspection) {
    const index = game.jokers.indexOf(inspection);
    return [region('close', 14, 390, game.phase === 'shop' && index >= 0 ? 220 : 332, 48, 'BACK TO TABLE'),
      ...(game.phase === 'shop' && index >= 0 ? [region('sell', 244, 390, 102, 48, 'SELL +$2', { index })] : [])];
  }
  if (game.phase === 'pack') {
    const options = game.pack?.options || [];
    return [...options.map((option, index) => {
      const copy = optionCopy(option, game);
      return region('packOption', 14, 76 + index * 98, 332, 88, (game.pack.selected === index ? 'Selected: ' : 'Inspect ') + copy.title + '. ' + copy.detail, { index });
    }),
      region('claim', 14, 390, 220, 48, 'CHOOSE CARD', { enabled: Number.isInteger(game.pack?.selected) }),
      region('skip', 244, 390, 102, 48, 'SKIP')];
  }
  if (game.phase === 'replace') {
    return [...game.jokers.map((id, index) => region('replace', 14, 164 + index * 70, 332, 62, 'Replace ' + (jokerBy(id)?.name || 'Joker') + ' with ' + (jokerBy(game.pendingJoker)?.name || 'incoming Joker') + '. Current boost: ' + (jokerBy(id)?.description || ''), { id, index })),
      region('skip', 14, 390, 332, 48, 'KEEP CURRENT JOKERS')];
  }
  const jokerY = game.phase === 'shop' ? 54 : 102;
  const jokers = game.jokers.map((id, index) => region('joker', 14 + index * 112, jokerY, 108, 47, 'Inspect ' + (jokerBy(id)?.name || 'Joker') + '. ' + (jokerBy(id)?.description || ''), { id, index }));
  if (game.phase === 'shop') {
    return [...jokers, ...game.shop.map((offer, index) => region('buy', 14, 112 + index * 62, 332, 56, offerLabel(game, offer), {
      index, enabled: !offer.sold && game.money >= offer.price && !ownedOffer(game, offer),
    })), region('next', 14, 390, 332, 48, 'NEXT ROUND')];
  }
  if (game.phase === 'score') return [...jokers, region('continue', 14, 390, 332, 48, 'CONTINUE')];
  if (game.phase !== 'play') return [];
  return [...jokers, ...game.hand.map((id, index) => region('card', 13 + index * 42, 266 - (game.selected.includes(id) ? 10 : 0), 39, 76, cardName(id) + ', ' + (game.selected.includes(id) ? 'selected' : 'unselected') + (game.cardBoosts[id] ? '. Bonus ' + game.cardBoosts[id] + ' chips when scoring.' : ''), { id, index })),
    region('discard', 14, 390, 158, 48, 'DISCARD', { enabled: game.selected.length > 0 && game.discardsLeft > 0 && game.deck.length > 0 }),
    region('play', 188, 390, 158, 48, 'PLAY HAND', { enabled: game.selected.length > 0 && game.playsLeft > 0 })];
}

export function gambitHitAt(x, y, game, view = {}) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  return gambitActions(game, view).find(item => item.enabled && x >= item.x && x < item.x + item.w && y >= item.y && y < item.y + item.h) || null;
}

function box(ctx, x, y, w, h, fill, stroke = null, r = 9) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fillStyle = fill; ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
}
function text(ctx, value, x, y, size = 12, color = ink, align = 'left', maxWidth = null) {
  const str = String(value); ctx.font = `750 ${size}px ui-sans-serif,system-ui,sans-serif`;
  ctx.textAlign = align; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = color;
  if (maxWidth) ctx.fillText(str, x, y, maxWidth); else ctx.fillText(str, x, y);
}
function wrap(ctx, value, x, y, width, size = 11, color = muted, maxLines = 3, lineHeight = size + 4) {
  ctx.font = `750 ${size}px ui-sans-serif,system-ui,sans-serif`;
  const measure = str => ctx.measureText ? ctx.measureText(str).width : str.length * size * .57;
  const words = String(value).split(/\s+/), lines = []; let current = '';
  for (const word of words) {
    const next = current ? current + ' ' + word : word;
    if (current && measure(next) > width) { lines.push(current); current = word; }
    else current = next;
  }
  if (current) lines.push(current);
  lines.slice(0, maxLines).forEach((line, index) => {
    let content = line;
    if (index === maxLines - 1 && lines.length > maxLines) {
      while (content.length && measure(content + '...') > width) content = content.slice(0, -1);
      content += '...';
    }
    text(ctx, content, x, y + index * lineHeight, size, color, 'left', width);
  });
}
function suit(ctx, kind, x, y, size, color) {
  const r = size / 2; ctx.fillStyle = color; ctx.beginPath();
  if (kind === 1) { ctx.moveTo(x, y - r); ctx.lineTo(x + r * .7, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r * .7, y); ctx.closePath(); }
  else if (kind === 3) {
    ctx.moveTo(x, y + r); ctx.bezierCurveTo(x - r * 1.6, y - r * .1, x - r * .8, y - r * 1.5, x, y - r * .45);
    ctx.bezierCurveTo(x + r * .8, y - r * 1.5, x + r * 1.6, y - r * .1, x, y + r);
  } else if (kind === 2) {
    ctx.moveTo(x, y - r); ctx.bezierCurveTo(x - r * 1.8, y + r * .5, x - r * .55, y + r, x, y + r * .25);
    ctx.bezierCurveTo(x + r * .55, y + r, x + r * 1.8, y + r * .5, x, y - r);
    ctx.moveTo(x, y); ctx.lineTo(x - r * .4, y + r); ctx.lineTo(x + r * .4, y + r); ctx.closePath();
  } else {
    for (const [dx, dy] of [[0, -.48], [-.47, .15], [.47, .15]]) { ctx.moveTo(x + (dx + .5) * r, y + dy * r); ctx.arc(x + dx * r, y + dy * r, r * .5, 0, Math.PI * 2); }
    ctx.moveTo(x, y); ctx.lineTo(x - r * .4, y + r); ctx.lineTo(x + r * .4, y + r); ctx.closePath();
  }
  ctx.fill();
}
function card(ctx, id, x, y, width = 39, height = 76, selected = false, boost = 0) {
  const rank = id % 13 + 1, kind = Math.floor(id / 13), red = kind % 2 === 1;
  const label = ({ 1: 'A', 11: 'J', 12: 'Q', 13: 'K' })[rank] || rank;
  const color = red ? '#a53359' : '#253b44';
  box(ctx, x, y, width, height, '#f8efd9', selected ? gold : '#baa98b', 5);
  if (selected) { ctx.strokeStyle = gold; ctx.lineWidth = 2; ctx.strokeRect(x + 2, y + 2, width - 4, height - 4); }
  text(ctx, label, x + 5, y + 15, 13, color); suit(ctx, kind, x + width - 9, y + 10, 10, color);
  suit(ctx, kind, x + width / 2, y + height / 2, Math.min(22, width * .6), color);
  text(ctx, boost ? '+' + boost : label, x + width - 5, y + height - 7, boost ? 10 : 12, boost ? '#5c764f' : color, 'right', width - 8);
}
function emblem(ctx, id, x, y, radius = 16) {
  const index = Math.max(0, GAMBIT_JOKERS.findIndex(item => item.id === id));
  const colors = [mint, '#e9a6c4', gold, '#b8a1e9'];
  ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fillStyle = '#172a34'; ctx.fill(); ctx.strokeStyle = colors[index % 4]; ctx.lineWidth = 1.2; ctx.stroke();
  if (index % 4 === 0) {
    ctx.beginPath(); ctx.moveTo(x - radius * .65, y + radius * .2); ctx.quadraticCurveTo(x, y - radius * .8, x + radius * .65, y + radius * .2);
    ctx.quadraticCurveTo(x, y + radius * .8, x - radius * .65, y + radius * .2); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y + radius * .1, radius * .2, 0, Math.PI * 2); ctx.fillStyle = colors[index % 4]; ctx.fill();
  } else if (index % 4 === 1) suit(ctx, 3, x, y, radius * 1.25, colors[index % 4]);
  else if (index % 4 === 2) {
    ctx.beginPath(); ctx.moveTo(x - radius * .6, y + radius * .4); ctx.lineTo(x - radius * .7, y - radius * .4); ctx.lineTo(x - radius * .2, y); ctx.lineTo(x, y - radius * .65); ctx.lineTo(x + radius * .2, y); ctx.lineTo(x + radius * .7, y - radius * .4); ctx.lineTo(x + radius * .6, y + radius * .4); ctx.closePath(); ctx.fillStyle = gold; ctx.fill();
  } else {
    ctx.beginPath(); ctx.moveTo(x, y - radius * .65); ctx.lineTo(x + radius * .5, y); ctx.lineTo(x, y + radius * .65); ctx.lineTo(x - radius * .5, y); ctx.closePath(); ctx.stroke();
  }
}
function background(ctx) {
  ctx.fillStyle = '#101c27'; ctx.fillRect(0, 0, 360, 452);
  for (let y = 7; y < 452; y += 14) { ctx.fillStyle = '#ffffff02'; ctx.fillRect(0, y, 360, 1); }
  ctx.strokeStyle = '#37535d'; ctx.lineWidth = 1; ctx.strokeRect(6, 6, 348, 440);
  for (const [x, y, sx, sy] of [[10, 10, 1, 1], [350, 10, -1, 1], [10, 442, 1, -1], [350, 442, -1, -1]]) {
    ctx.beginPath(); ctx.moveTo(x + 14 * sx, y); ctx.lineTo(x, y); ctx.lineTo(x, y + 14 * sy); ctx.strokeStyle = gold; ctx.stroke();
  }
}
function header(ctx, game, title = "GABU'S GAMBIT") {
  text(ctx, title, 16, 28, 16, ink, 'left', 252);
  text(ctx, 'ROUND ' + game.round + '/6', 344, 27, 10, gold, 'right');
}
function jokerRow(ctx, game, y) {
  for (let index = 0; index < 3; index++) {
    const id = game.jokers[index], x = 14 + index * 112;
    box(ctx, x, y, 108, 47, id ? '#263340' : '#172630', id ? '#6f7182' : '#344a54', 7);
    if (!id) { text(ctx, 'EMPTY SLOT', x + 54, y + 28, 9, '#768b91', 'center'); continue; }
    emblem(ctx, id, x + 20, y + 23, 12);
    const name = jokerBy(id)?.name || id;
    wrap(ctx, name, x + 37, y + 18, 65, 9, ink, 2, 12);
    text(ctx, 'TAP TO INSPECT', x + 54, y + 42, 6.5, muted, 'center');
  }
}
function button(ctx, item, active = false, selected = false) {
  box(ctx, item.x, item.y, item.w, item.h, item.enabled ? active ? '#376761' : '#2b3449' : '#1b2733', selected ? '#b7f0dc' : item.enabled ? active ? '#91cdb6' : '#85809a' : '#40505c');
  text(ctx, item.label, item.x + item.w / 2, item.y + item.h / 2 + 4, 11, item.enabled ? ink : '#788a92', 'center', item.w - 12);
}
function optionCopy(option, game) {
  if (option.kind === 'joker') {
    const item = jokerBy(option.id);
    return { title: item?.name || 'Joker', detail: item?.description || '', tag: item?.rarity || 'JOKER', art: 'joker' };
  }
  if (option.kind === 'hand') {
    const item = handBy(option.id);
    return { title: (item?.name || option.id) + ' upgrade', detail: 'Raise this hand by one level: +15 base chips and +1 base multiplier.', tag: 'LEVEL ' + ((game.handLevels[option.id] || 0) + 1) + ' TO ' + ((game.handLevels[option.id] || 0) + 2), art: 'hand' };
  }
  return { title: cardName(option.id), detail: 'Add +10 chips whenever this card scores. The boost stays with the card throughout the run.', tag: 'CARD BOOST', art: 'card' };
}
function cardOption(ctx, option, game, x, y, w, h, selected = false, tag = null) {
  const copy = optionCopy(option, game);
  box(ctx, x, y, w, h, selected ? '#314742' : '#23313e', selected ? gold : '#4e626e');
  if (copy.art === 'card') card(ctx, option.id, x + 10, y + 10, 42, h - 20, false, Math.min(30, (game.cardBoosts[option.id] || 0) + 10));
  else if (copy.art === 'joker') emblem(ctx, option.id, x + 32, y + h / 2, 20);
  else {
    box(ctx, x + 13, y + h / 2 - 21, 39, 42, '#1d2837', gold, 5);
    text(ctx, '+1', x + 32, y + h / 2 + 5, 19, gold, 'center');
  }
  text(ctx, tag || copy.tag.toUpperCase(), x + 65, y + 15, 8, mint, 'left', w - 77);
  text(ctx, copy.title, x + 65, y + 32, 12, ink, 'left', w - 77);
  wrap(ctx, copy.detail, x + 65, y + 49, w - 77, h > 70 ? 10 : 9, muted, 2, h > 70 ? 14 : 11);
}
function playScreen(ctx, game, best, reduced) {
  header(ctx, game);
  box(ctx, 14, 39, 332, 54, '#1f303a', '#52616e');
  text(ctx, number(game.roundScore), 26, 62, 20, ink); text(ctx, '/ ' + number(game.target) + ' TARGET', 26, 81, 9, muted);
  text(ctx, '$' + game.money, 333, 61, 16, gold, 'right'); text(ctx, 'RUN ' + number(game.score) + ' / BEST ' + number(best), 333, 81, 8, muted, 'right', 200);
  const ratio = Math.max(0, Math.min(1, game.roundScore / Math.max(1, game.target)));
  ctx.fillStyle = '#15232d'; ctx.fillRect(16, 89, 328, 3); ctx.fillStyle = mint; ctx.fillRect(16, 89, 328 * ratio, 3);
  jokerRow(ctx, game, 102);
  if (game.phase === 'score') {
    const report = game.lastResult;
    text(ctx, report?.name || 'HAND SCORED', 180, 176, 16, gold, 'center');
    text(ctx, '+' + number(report?.total || 0), 180, 207, 26, mint, 'center');
    const steps = report?.steps || [], visible = steps.slice(-8), offset = steps.length - visible.length;
    const elapsed = Math.max(0, Math.min(1.2, game.scoreTime || 0));
    const activeStep = reduced || elapsed >= 1.2 ? -1 : Math.min(steps.length - 1, Math.floor(elapsed / 1.2 * steps.length));
    visible.forEach((step, index) => {
      const y = 232 + index * 17, current = index + offset === activeStep, future = activeStep >= 0 && index + offset > activeStep;
      if (current) box(ctx, 20, y - 12, 320, 16, '#315048', null, 3);
      text(ctx, step.label, 24, y, 9, future ? '#627783' : current ? mint : muted, 'left', 202);
      text(ctx, number(step.chips) + ' x ' + Number(step.mult.toFixed(2)), 335, y, 10, future ? '#627783' : current || index === visible.length - 1 ? gold : ink, 'right', 99);
    });
    text(ctx, 'Every boost is counted in the same order.', 180, 377, 9, muted, 'center');
    return;
  }
  const report = game.preview();
  text(ctx, report?.name || 'CHOOSE YOUR HAND', 180, 183, 16, report ? gold : ink, 'center');
  text(ctx, report ? number(report.chips) + ' CHIPS  x  ' + Number(report.mult.toFixed(2)) + ' MULT' : 'Select 1 to 5 cards. Make the target.', 180, 206, 11, muted, 'center');
  if (report) text(ctx, number(report.total), 180, 235, 25, mint, 'center');
  else text(ctx, 'Jokers turn modest hands into trouble.', 180, 232, 10, '#7fa9a6', 'center');
  game.hand.forEach((id, index) => {
    const selected = game.selected.includes(id), x = 13 + index * 42, y = 266 - (selected ? 10 : 0);
    card(ctx, id, x, y, 39, 76, selected, game.cardBoosts[id] || 0);
    text(ctx, index + 1, x + 19.5, 356, 9, selected ? gold : '#80949b', 'center');
  });
  text(ctx, game.playsLeft + ' PLAYS', 20, 376, 10, mint);
  text(ctx, game.deck.length + ' IN DECK', 180, 376, 9, muted, 'center');
  text(ctx, game.discardsLeft + ' DISCARDS', 340, 376, 10, muted, 'right');
}
function shopScreen(ctx, game) {
  header(ctx, game, 'THE BACK ROOM');
  text(ctx, 'RUN CASH  $' + game.money + '  /  CHOOSE YOUR NEXT EDGE', 16, 44, 9, gold);
  jokerRow(ctx, game, 54);
  game.shop.forEach((offer, index) => {
    const y = 112 + index * 62, owned = ownedOffer(game, offer), enabled = !offer.sold && game.money >= offer.price && !owned;
    box(ctx, 14, y, 332, 56, offer.sold ? '#17232e' : '#243440', enabled ? '#687b83' : '#3a4d57');
    let title, detail;
    if (offer.kind === 'joker') { const item = jokerBy(offer.id); title = item?.name || offer.id; detail = item?.description || ''; emblem(ctx, offer.id, 38, y + 28, 15); }
    else {
      title = offer.pack === 'joker' ? 'Joker Pack' : 'Upgrade Pack';
      detail = offer.pack === 'joker' ? 'Reveal three Jokers. Choose one to keep.' : 'Reveal three hand or card boosts. Choose one.';
      box(ctx, 25, y + 11, 27, 34, offer.pack === 'joker' ? '#584361' : '#305951', gold, 4);
      text(ctx, '?', 38.5, y + 34, 19, gold, 'center');
    }
    text(ctx, title, 65, y + 20, 11, offer.sold ? '#70828c' : ink, 'left', 210);
    wrap(ctx, detail, 65, y + 33, 211, 9.5, offer.sold ? '#667780' : muted, 2, 12);
    box(ctx, 285, y + 9, 51, 38, enabled ? '#3b5c51' : '#26313e', enabled ? '#84b7a4' : '#465261', 6);
    text(ctx, offer.sold ? 'SOLD' : owned ? 'OWNED' : '$' + offer.price, 310.5, y + 33, offer.sold || owned ? 8 : 16, offer.sold || owned ? '#788a91' : gold, 'center');
  });
  text(ctx, 'Tap an equipped Joker to inspect or sell it.', 180, 375, 9, muted, 'center');
}
function packScreen(ctx, game) {
  header(ctx, game, game.pack?.kind === 'joker' ? 'JOKER PACK' : 'UPGRADE PACK');
  text(ctx, 'THREE POSSIBILITIES. ONE DECISION.', 16, 49, 10, mint);
  (game.pack?.options || []).forEach((option, index) => cardOption(ctx, option, game, 14, 76 + index * 98, 332, 88, game.pack.selected === index));
  text(ctx, 'Tap a card to inspect, then choose. Skipping spends the pack.', 180, 377, 8.5, muted, 'center', 330);
}
function replaceScreen(ctx, game) {
  header(ctx, game, 'MAKE SOME ROOM');
  text(ctx, 'YOUR THREE JOKER SLOTS ARE FULL', 16, 49, 10, gold);
  if (game.pendingJoker) cardOption(ctx, { kind: 'joker', id: game.pendingJoker }, game, 14, 64, 332, 83, true, 'INCOMING JOKER');
  game.jokers.forEach((id, index) => cardOption(ctx, { kind: 'joker', id }, game, 14, 164 + index * 70, 332, 62, false, 'REPLACE THIS JOKER'));
}
function inspectionScreen(ctx, game, id) {
  header(ctx, game, 'THE COMPANY YOU KEEP');
  const item = jokerBy(id); emblem(ctx, id, 180, 116, 47);
  text(ctx, item?.name || 'Joker', 180, 193, 22, gold, 'center', 314);
  text(ctx, (item?.rarity || 'JOKER').toUpperCase() + ' / ACTIVE FOR THIS RUN', 180, 216, 9, mint, 'center');
  wrap(ctx, item?.description || '', 35, 254, 290, 15, ink, 4, 23);
  text(ctx, 'Added chips, added Mult, then multiplier boosts.', 180, 361, 10, muted, 'center', 325);
  if (game.phase === 'shop') text(ctx, 'Selling returns $2 to this run.', 180, 378, 10, gold, 'center');
}
function overlay(ctx, game) {
  ctx.fillStyle = '#0c1529dc'; ctx.fillRect(8, 8, 344, 436);
  box(ctx, 26, 133, 308, 185, '#243041', '#8d8f9c', 13);
  text(ctx, game.status === 'dead' ? game.won ? 'HOUSE OUTPLAYED' : 'THE HOUSE HOLDS' : game.status === 'paused' ? 'RUN ON HOLD' : "GABU'S GAMBIT", 180, 170, 20, gold, 'center', 282);
  wrap(ctx, game.status === 'dead' ? 'Round ' + game.round + ' of 6. Run score: ' + number(game.score) + '.' : 'Build poker hands. Collect unusual company. Make the numbers misbehave.', 47, 204, 266, 12, ink, 3, 18);
  text(ctx, game.status === 'paused' ? 'PRESS PLAY TO RESUME' : game.status === 'dead' ? 'PRESS PLAY FOR A NEW RUN' : 'PRESS PLAY OR TAP TO START', 180, 284, 10, mint, 'center');
}

export function drawGambit(canvas, game, { best = 0, reduced = false, cursor = -1, inspection = null } = {}) {
  const ctx = canvas?.getContext?.('2d'); if (!ctx) return;
  ctx.save(); ctx.setTransform(canvas.width / 360, 0, 0, canvas.height / 452, 0, 0);
  ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left'; ctx.globalAlpha = 1; ctx.lineCap = 'butt'; ctx.lineJoin = 'miter';
  background(ctx);
  if (inspection) inspectionScreen(ctx, game, inspection);
  else if (game.phase === 'shop') shopScreen(ctx, game);
  else if (game.phase === 'pack') packScreen(ctx, game);
  else if (game.phase === 'replace') replaceScreen(ctx, game);
  else playScreen(ctx, game, best, reduced);
  const actions = gambitActions(game, { inspection });
  actions.forEach((action, index) => {
    if (['play', 'discard', 'continue', 'next', 'claim', 'skip', 'close', 'sell'].includes(action.kind)) button(ctx, action, ['play', 'claim', 'next', 'continue'].includes(action.kind), index === cursor);
    if (index === cursor) { ctx.strokeStyle = mint; ctx.lineWidth = 2; ctx.strokeRect(action.x - 2, action.y - 2, action.w + 4, action.h + 4); }
  });
  if (!reduced && game.phase === 'score' && game.status === 'playing') {
    const brightness = Math.max(0, Math.min(1, game.scoreTime || 0));
    ctx.fillStyle = `rgba(134,214,198,${brightness * .25})`; ctx.fillRect(14, 151, 332, 3);
  }
  if (game.status !== 'playing') overlay(ctx, game);
  ctx.restore();
}
