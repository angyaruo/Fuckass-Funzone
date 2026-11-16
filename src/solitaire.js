/** Draw-one Klondike rules. Card IDs are suit * 13 + rank - 1. No browser APIs. */
export const SOLITAIRE_SUITS = Object.freeze(['clubs', 'diamonds', 'spades', 'hearts']);
export const solitaireRank = id => id % 13 + 1;
export const solitaireSuit = id => Math.floor(id / 13);
export const solitaireRed = id => solitaireSuit(id) % 2 === 1;
const isCard = id => Number.isInteger(id) && id >= 0 && id < 52;
const integer = n => Number.isSafeInteger(n) && n >= 0 && n <= 10000000;
const follows = (upper, lower) => solitaireRank(upper) === solitaireRank(lower) + 1 && solitaireRed(upper) !== solitaireRed(lower);
const copyHit = hit => hit ? { pile: hit.pile, ...(hit.index === undefined ? {} : { index: hit.index }), ...(hit.card === undefined ? {} : { card: hit.card }) } : null;
const sameHit = (a, b) => a === b || !!a && !!b && a.pile === b.pile && a.index === b.index && a.card === b.card;

function validated(data) {
  if (!data || !Array.isArray(data.stock) || !Array.isArray(data.waste) ||
      !Array.isArray(data.foundations) || data.foundations.length !== 4 ||
      !Array.isArray(data.tableau) || data.tableau.length !== 7 ||
      !integer(data.moves) || !integer(data.recycles) || !['idle', 'playing', 'paused', 'dead'].includes(data.status)) return null;
  const stock = data.stock.slice(), waste = data.waste.slice(), foundations = [], tableau = [];
  const ids = [...stock, ...waste];
  if (ids.length > 52 || ids.some(id => !isCard(id))) return null;
  for (let suit = 0; suit < 4; suit++) {
    const pile = data.foundations[suit];
    if (!Array.isArray(pile) || pile.length > 13 || pile.some((id, index) => id !== suit * 13 + index)) return null;
    foundations.push(pile.slice()); ids.push(...pile);
  }
  let hiddenCount = 0;
  for (const pile of data.tableau) {
    if (!Array.isArray(pile) || pile.length > 52) return null;
    let exposed = false, previous = null, hidden = 0;
    const column = [];
    for (const card of pile) {
      if (!card || !isCard(card.id) || typeof card.faceUp !== 'boolean' || exposed && !card.faceUp) return null;
      if (card.faceUp && previous !== null && !follows(previous, card.id)) return null;
      if (card.faceUp) { exposed = true; previous = card.id; }
      else hidden++;
      column.push({ id: card.id, faceUp: card.faceUp }); ids.push(card.id);
    }
    if (pile.length && !exposed || hidden > 6) return null;
    hiddenCount += hidden;
    tableau.push(column);
  }
  if (ids.length !== 52 || new Set(ids).size !== 52 || hiddenCount > 21) return null;
  const score = foundations.reduce((sum, pile) => sum + pile.length * 10, 0), won = score === 520;
  if (data.score !== score || typeof data.won !== 'boolean' || data.won !== won || (data.status === 'dead') !== won) return null;
  return { stock, waste, foundations, tableau, score, won, moves: data.moves, recycles: data.recycles,
    status: won ? 'dead' : data.status === 'idle' ? 'idle' : 'paused' };
}

export class SolitaireGame {
  constructor({ random = Math.random, onEvent = () => {}, saved } = {}) {
    this.random = random; this.onEvent = onEvent; this.reset(); if (saved) this.restore(saved);
  }
  reset() {
    const deck = Array.from({ length: 52 }, (_, id) => id);
    for (let i = deck.length - 1; i > 0; i--) {
      const roll = Math.max(0, Math.min(.999999999, Number(this.random()) || 0));
      const j = Math.floor(roll * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    this.tableau = Array.from({ length: 7 }, (_, index) => Array.from({ length: index + 1 }, (__, row) => ({ id: deck.pop(), faceUp: row === index })));
    this.stock = deck; this.waste = []; this.foundations = [[], [], [], []];
    this.status = 'idle'; this.score = 0; this.won = false; this.moves = 0; this.recycles = 0;
    this.selection = null; this.history = []; this.onEvent('reset');
  }
  start() {
    if (this.status === 'dead') this.reset();
    if (this.status === 'playing') return;
    const resumed = this.status === 'paused'; this.status = 'playing'; this.onEvent(resumed ? 'resume' : 'start');
  }
  pause() { if (this.status === 'playing') { this.status = 'paused'; this.selection = null; this.onEvent('pause'); } }
  togglePause() { if (this.status === 'playing') this.pause(); else if (this.status === 'paused') this.start(); }
  update() {}
  playable() { if (this.status === 'idle') this.start(); return this.status === 'playing'; }
  remember() { this.history.push(this.snapshot()); if (this.history.length > 100) this.history.shift(); }
  finishMove() {
    this.moves++; this.selection = null;
    const previousScore = this.score;
    this.score = this.foundations.reduce((sum, pile) => sum + pile.length * 10, 0);
    this.won = this.score === 520;
    if (this.won) this.status = 'dead';
    this.onEvent('move', { moves: this.moves });
    if (this.score !== previousScore) this.onEvent('score', { score: this.score });
    if (this.won) this.onEvent('win', { score: this.score, moves: this.moves });
  }
  drawStock() {
    if (!this.playable() || !this.stock.length && !this.waste.length) return false;
    this.remember();
    if (this.stock.length) this.waste.push(this.stock.pop());
    else { this.stock = this.waste.reverse(); this.waste = []; this.recycles++; }
    this.finishMove(); return true;
  }
  sourceCards(hit) {
    if (!hit) return null;
    if (hit.pile === 'waste') return this.waste.length ? [this.waste.at(-1)] : null;
    if (hit.pile === 'foundation' && Number.isInteger(hit.index) && hit.index >= 0 && hit.index < 4) {
      const pile = this.foundations[hit.index]; return pile.length ? [pile.at(-1)] : null;
    }
    if (hit.pile !== 'tableau' || !Number.isInteger(hit.index) || hit.index < 0 || hit.index > 6) return null;
    const pile = this.tableau[hit.index], index = hit.card === undefined ? pile.length - 1 : hit.card;
    if (!Number.isInteger(index) || index < 0 || index >= pile.length || !pile[index].faceUp) return null;
    const cards = pile.slice(index).map(card => card.id);
    return cards.every((id, i) => !i || follows(cards[i - 1], id)) ? cards : null;
  }
  canMove(source, destination) {
    const cards = this.sourceCards(source);
    if (!cards || !destination || source.pile === destination.pile && source.index === destination.index) return false;
    if (destination.pile === 'foundation') {
      if (!Number.isInteger(destination.index) || destination.index < 0 || destination.index > 3 || cards.length !== 1) return false;
      return solitaireSuit(cards[0]) === destination.index && solitaireRank(cards[0]) === this.foundations[destination.index].length + 1;
    }
    if (destination.pile !== 'tableau' || !Number.isInteger(destination.index) || destination.index < 0 || destination.index > 6) return false;
    const column = this.tableau[destination.index];
    return column.length ? column.at(-1).faceUp && follows(column.at(-1).id, cards[0]) : solitaireRank(cards[0]) === 13;
  }
  move(source, destination) {
    if (!this.playable() || !this.canMove(source, destination)) return false;
    const cards = this.sourceCards(source); this.remember();
    if (source.pile === 'waste') this.waste.pop();
    else if (source.pile === 'foundation') this.foundations[source.index].pop();
    else {
      const column = this.tableau[source.index]; column.splice(column.length - cards.length);
      if (column.length) column.at(-1).faceUp = true;
    }
    if (destination.pile === 'foundation') this.foundations[destination.index].push(cards[0]);
    else this.tableau[destination.index].push(...cards.map(id => ({ id, faceUp: true })));
    this.finishMove(); return true;
  }
  select(hit) {
    if (!this.playable()) return false;
    if (!hit) { const changed = !!this.selection; this.selection = null; return changed; }
    if (hit.pile === 'stock') return this.drawStock();
    if (this.selection && this.move(this.selection, hit)) return true;
    const next = this.sourceCards(hit) ? copyHit(hit) : null;
    const changed = !sameHit(this.selection, next) || !!this.selection !== !!next;
    this.selection = sameHit(this.selection, next) ? null : next;
    return changed || !!next;
  }
  autoMove(hit = this.selection) {
    if (!this.playable() || !hit) return false;
    const cards = this.sourceCards(hit);
    return !!cards && cards.length === 1 && this.move(hit, { pile: 'foundation', index: solitaireSuit(cards[0]) });
  }
  undo() {
    if (!this.history.length || this.status === 'paused') return false;
    const state = this.history.pop(), remaining = this.history;
    this.restore(state); this.history = remaining; this.status = 'playing';
    this.onEvent('undo', { score: this.score, moves: this.moves }); return true;
  }
  /** Ordered focus targets: stock, waste, foundations, then exposed tableau cards/empty spaces. */
  keyboardHits() {
    const hits = [{ pile: 'stock' }, { pile: 'waste' }, ...this.foundations.map((_, index) => ({ pile: 'foundation', index }))];
    this.tableau.forEach((column, index) => {
      if (!column.length) hits.push({ pile: 'tableau', index });
      else column.forEach((card, row) => { if (card.faceUp) hits.push({ pile: 'tableau', index, card: row }); });
    });
    return hits;
  }
  snapshot() {
    return { version: 1, status: this.status === 'playing' ? 'paused' : this.status,
      stock: this.stock.slice(), waste: this.waste.slice(), foundations: this.foundations.map(pile => pile.slice()),
      tableau: this.tableau.map(pile => pile.map(card => ({ ...card }))), score: this.score,
      moves: this.moves, recycles: this.recycles, won: this.won };
  }
  restore(data) {
    const state = validated(data); if (!state) return false;
    Object.assign(this, state); this.selection = null; this.history = []; return true;
  }
}
