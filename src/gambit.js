/** Gabu's Gambit: a small, original poker roguelike. All money stays in this run. */
import { GAMBIT_HANDS, GAMBIT_JOKERS, scoreGambitHand } from './gambit-rules.js';

export const GAMBIT_TARGETS = Object.freeze([180, 350, 600, 1000, 1500, 2200]);
const jokerIds = GAMBIT_JOKERS.map(item => item.id);
const handIds = GAMBIT_HANDS.map(item => item.id);
const phases = ['play', 'score', 'shop', 'pack', 'replace'];
const integer = (n, low, high) => Number.isSafeInteger(n) && n >= low && n <= high;
const card = id => integer(id, 0, 51);
const plain = value => !!value && typeof value === 'object' && !Array.isArray(value);
const dense = (values, max, check) => Array.isArray(values) && values.length <= max &&
  Array.from({length: values.length}, (_, i) => Object.hasOwn(values, i) && check(values[i])).every(Boolean);
const clone = value => JSON.parse(JSON.stringify(value));
const validLevels = value => plain(value) && Object.entries(value).every(([key, level]) => handIds.includes(key) && integer(level, 0, 5));
const validBoosts = value => plain(value) && Object.entries(value).every(([key, boost]) => String(Number(key)) === key && card(Number(key)) && integer(boost, 0, 30) && boost % 10 === 0);
const validOption = option => plain(option) && (option.kind === 'joker' ? jokerIds.includes(option.id) :
  option.kind === 'hand' ? handIds.includes(option.id) : option.kind === 'card' && card(option.id));

export class GambitGame {
  constructor({ seed = Math.floor(Math.random() * 0xffffffff), onEvent = () => {}, saved } = {}) {
    this.onEvent = onEvent; this.rngState = 1; this.reset(seed); if (saved) this.restore(saved);
  }
  nextRandom() {
    let n = this.rngState; n ^= n << 13; n ^= n >>> 17; n ^= n << 5;
    this.rngState = n >>> 0 || 1; return this.rngState / 0x100000000;
  }
  shuffled(values) {
    const items = [...values];
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(this.nextRandom() * (i + 1)); [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  }
  reset(seed) {
    this.rngState = integer(seed, 0, 0xffffffff) ? seed || 1 : (Math.floor(this.nextRandom() * 0xffffffff) || 1);
    this.status = 'idle'; this.phase = 'play'; this.won = false; this.round = 1;
    this.score = 0; this.money = 8; this.jokers = ['pair_gremlin']; this.handLevels = {}; this.cardBoosts = {};
    this.shop = []; this.pack = null; this.pendingJoker = null; this.lastResult = null; this.lastPlay = null; this.scoreTime = 0;
    this.dealRound(); this.onEvent('reset');
  }
  get target() { return GAMBIT_TARGETS[this.round - 1]; }
  dealRound() {
    this.deck = this.shuffled(Array.from({ length: 52 }, (_, i) => i)); this.hand = []; this.discard = [];
    this.selected = []; this.playsLeft = 4; this.discardsLeft = 3; this.roundScore = 0;
    this.refill(); this.phase = 'play'; this.lastResult = null; this.lastPlay = null; this.scoreTime = 0;
  }
  refill() { while (this.hand.length < 8 && this.deck.length) this.hand.push(this.deck.pop()); }
  start() {
    if (this.status === 'dead') this.reset();
    if (this.status === 'playing') return;
    const resumed = this.status === 'paused'; this.status = 'playing'; this.onEvent(resumed ? 'resume' : 'start');
  }
  pause() { if (this.status === 'playing') { this.status = 'paused'; this.onEvent('pause'); } }
  togglePause() { if (this.status === 'playing') this.pause(); else if (this.status === 'paused') this.start(); }
  update(delta) {
    if (this.status !== 'playing' || this.phase !== 'score' || !Number.isFinite(delta) || delta <= 0) return;
    this.scoreTime = Math.min(1.2, this.scoreTime + Math.min(delta, .12));
  }
  toggleCard(id) {
    if (this.status !== 'playing' || this.phase !== 'play' || !this.hand.includes(id)) return false;
    const index = this.selected.indexOf(id);
    if (index >= 0) this.selected.splice(index, 1);
    else if (this.selected.length < 5) this.selected.push(id); else return false;
    this.onEvent('select'); return true;
  }
  sortHand(mode) {
    if (this.status !== 'playing' || this.phase !== 'play' || !['rank', 'suit'].includes(mode)) return false;
    const rank = id => id % 13 === 0 ? 14 : id % 13 + 1;
    const suit = id => Math.floor(id / 13);
    this.hand = [...this.hand].sort((a, b) => mode === 'rank' ?
      rank(b) - rank(a) || suit(a) - suit(b) : suit(a) - suit(b) || rank(b) - rank(a));
    this.onEvent('sort', { mode }); return true;
  }
  preview() {
    return this.selected.length ? scoreGambitHand(this.selected, this.jokers, this.handLevels, {
      round: this.round, playsLeft: this.playsLeft, discardsUsed: 3 - this.discardsLeft, cardBoosts: this.cardBoosts,
    }) : null;
  }
  consumeSelection() {
    const ids = new Set(this.selected); this.discard.push(...this.hand.filter(id => ids.has(id)));
    this.hand = this.hand.filter(id => !ids.has(id)); this.selected = []; this.refill();
  }
  playHand() {
    if (this.status !== 'playing' || this.phase !== 'play' || this.playsLeft < 1) return false;
    const report = this.preview(); if (!report) return false;
    this.lastPlay = { cards: [...this.selected], playsLeft: this.playsLeft, discardsUsed: 3 - this.discardsLeft };
    this.consumeSelection(); this.playsLeft--;
    this.roundScore = Math.min(1e9, this.roundScore + report.total); this.score = Math.min(1e9, this.score + report.total);
    this.lastResult = report; this.scoreTime = 0; this.phase = 'score';
    this.onEvent('score', { score: this.score, total: report.total }); return true;
  }
  discardSelected() {
    if (this.status !== 'playing' || this.phase !== 'play' || !this.discardsLeft || !this.selected.length || !this.deck.length) return false;
    this.consumeSelection(); this.discardsLeft--; this.onEvent('discard'); return true;
  }
  continueScore() {
    if (this.status !== 'playing' || this.phase !== 'score') return false;
    this.scoreTime = 0; this.lastPlay = null; this.lastResult = null;
    if (this.roundScore >= this.target) {
      if (this.round === GAMBIT_TARGETS.length) {
        this.phase = 'play'; this.status = 'dead'; this.won = true; this.onEvent('win', { score: this.score });
      } else {
        this.money = Math.min(9999, this.money + 6 + this.playsLeft);
        this.phase = 'shop'; this.makeShop(); this.onEvent('round_clear', { round: this.round, money: this.money });
      }
    } else if (this.playsLeft === 0 || !this.hand.length) {
      this.phase = 'play'; this.status = 'dead'; this.onEvent('death', { score: this.score });
    } else { this.phase = 'play'; this.onEvent('continue'); }
    return true;
  }
  availableJokers() { return jokerIds.filter(id => !this.jokers.includes(id)); }
  makeShop() {
    const choices = this.shuffled(this.availableJokers());
    this.shop = choices.slice(0, 2).map(id => ({ kind: 'joker', id, price: 4, sold: false }));
    this.shop.push({ kind: 'pack', pack: 'joker', price: 4, sold: false }, { kind: 'pack', pack: 'upgrade', price: 3, sold: false });
  }
  upgradeOptions() {
    return [...handIds.filter(id => (this.handLevels[id] || 0) < 5).map(id => ({ kind: 'hand', id })),
      ...Array.from({ length: 52 }, (_, id) => id).filter(id => (this.cardBoosts[id] || 0) < 30).map(id => ({ kind: 'card', id }))];
  }
  buy(index) {
    if (this.status !== 'playing' || this.phase !== 'shop' || !integer(index, 0, this.shop.length - 1)) return false;
    const offer = this.shop[index]; if (offer.sold || offer.price > this.money) return false;
    if (offer.kind === 'joker' && this.jokers.includes(offer.id)) return false;
    this.money -= offer.price; offer.sold = true;
    if (offer.kind === 'joker') this.receiveJoker(offer.id);
    else {
      let options;
      if (offer.pack === 'joker') options = this.shuffled(this.availableJokers()).slice(0, 3).map(id => ({ kind: 'joker', id }));
      else {
        // Always offer two hand upgrades and one specific card enhancement.
        const all = this.upgradeOptions();
        options = [...this.shuffled(all.filter(item => item.kind === 'hand')).slice(0, 2), ...this.shuffled(all.filter(item => item.kind === 'card')).slice(0, 1)];
      }
      this.pack = { kind: offer.pack, options, selected: null }; this.phase = 'pack';
    }
    this.onEvent('purchase'); return true;
  }
  receiveJoker(id) {
    if (this.jokers.length < 3) { this.jokers.push(id); this.pendingJoker = null; this.phase = 'shop'; }
    else { this.pendingJoker = id; this.phase = 'replace'; }
  }
  selectPack(index) {
    if (this.status !== 'playing' || this.phase !== 'pack' || !integer(index, 0, this.pack.options.length - 1)) return false;
    this.pack.selected = index; this.onEvent('select'); return true;
  }
  claimPack() {
    if (this.status !== 'playing' || this.phase !== 'pack' || !integer(this.pack.selected, 0, this.pack.options.length - 1)) return false;
    const choice = this.pack.options[this.pack.selected]; this.pack = null;
    if (choice.kind === 'joker') this.receiveJoker(choice.id);
    else {
      if (choice.kind === 'hand') this.handLevels[choice.id] = Math.min(5, (this.handLevels[choice.id] || 0) + 1);
      else this.cardBoosts[choice.id] = Math.min(30, (this.cardBoosts[choice.id] || 0) + 10);
      this.phase = 'shop';
    }
    this.onEvent('upgrade'); return true;
  }
  replaceJoker(index) {
    if (this.status !== 'playing' || this.phase !== 'replace' || !integer(index, 0, this.jokers.length - 1)) return false;
    this.jokers[index] = this.pendingJoker; this.pendingJoker = null; this.phase = 'shop'; this.onEvent('upgrade'); return true;
  }
  skipPack() {
    if (this.status !== 'playing' || !['pack', 'replace'].includes(this.phase)) return false;
    this.pack = null; this.pendingJoker = null; this.phase = 'shop'; this.onEvent('skip'); return true;
  }
  sellJoker(index) {
    if (this.status !== 'playing' || this.phase !== 'shop' || !integer(index, 0, this.jokers.length - 1)) return false;
    this.jokers.splice(index, 1); this.money = Math.min(9999, this.money + 2); this.onEvent('sell'); return true;
  }
  nextRound() {
    if (this.status !== 'playing' || this.phase !== 'shop' || this.round >= GAMBIT_TARGETS.length) return false;
    this.round++; this.shop = []; this.pack = null; this.pendingJoker = null; this.dealRound(); this.onEvent('round'); return true;
  }
  snapshot() {
    return clone({ version: 1, rngState: this.rngState, status: this.status === 'playing' ? 'paused' : this.status,
      phase: this.phase, won: this.won, round: this.round, score: this.score, roundScore: this.roundScore, money: this.money,
      jokers: this.jokers, handLevels: this.handLevels, cardBoosts: this.cardBoosts,
      deck: this.deck, hand: this.hand, discard: this.discard, selected: this.selected,
      playsLeft: this.playsLeft, discardsLeft: this.discardsLeft, shop: this.shop, pack: this.pack,
      pendingJoker: this.pendingJoker, lastPlay: this.lastPlay, scoreTime: this.scoreTime });
  }
  restore(data) {
    if (!plain(data) || data.version !== 1 || !integer(data.rngState, 1, 0xffffffff) || !phases.includes(data.phase) ||
      !['idle', 'paused', 'playing', 'dead'].includes(data.status) || typeof data.won !== 'boolean' ||
      !integer(data.round, 1, 6) || !integer(data.score, 0, 1e9) || !integer(data.roundScore, 0, data.score) || !integer(data.money, 0, 9999) ||
      !dense(data.jokers, 3, id => jokerIds.includes(id)) || new Set(data.jokers).size !== data.jokers.length ||
      !validLevels(data.handLevels) || !validBoosts(data.cardBoosts) || !integer(data.playsLeft, 0, 4) || !integer(data.discardsLeft, 0, 3) ||
      !dense(data.deck, 52, card) || !dense(data.hand, 8, card) || !dense(data.discard, 52, card) ||
      !dense(data.selected, 5, id => data.hand.includes(id)) || new Set(data.selected).size !== data.selected.length ||
      !Number.isFinite(data.scoreTime) || data.scoreTime < 0 || data.scoreTime > 1.2) return false;
    const cards = [...data.deck, ...data.hand, ...data.discard];
    if (cards.length !== 52 || new Set(cards).size !== 52 || data.hand.length < Math.min(8, 52 - data.discard.length)) return false;
    if (!dense(data.shop, 4, item => plain(item) && typeof item.sold === 'boolean' &&
      (item.kind === 'joker' ? jokerIds.includes(item.id) && item.price === 4 : item.kind === 'pack' &&
        ['joker', 'upgrade'].includes(item.pack) && item.price === (item.pack === 'joker' ? 4 : 3)))) return false;
    const shopping = ['shop', 'pack', 'replace'].includes(data.phase);
    if (shopping !== (data.shop.length === 4) || (shopping && (data.roundScore < GAMBIT_TARGETS[data.round - 1] || data.round === 6))) return false;
    if (shopping && (data.shop[0].kind !== 'joker' || data.shop[1].kind !== 'joker' || data.shop[0].id === data.shop[1].id ||
      data.shop[2].kind !== 'pack' || data.shop[2].pack !== 'joker' || data.shop[3].kind !== 'pack' || data.shop[3].pack !== 'upgrade')) return false;
    if (data.phase === 'pack') {
      if (!plain(data.pack) || !['joker', 'upgrade'].includes(data.pack.kind) || !dense(data.pack.options, 3, validOption) || !data.pack.options.length ||
        !(data.pack.selected === null || integer(data.pack.selected, 0, data.pack.options.length - 1))) return false;
      if (data.pack.options.some(option => data.pack.kind === 'joker' ? option.kind !== 'joker' || data.jokers.includes(option.id) : option.kind === 'joker')) return false;
      if (data.pack.options.some(option => option.kind === 'hand' && (data.handLevels[option.id] || 0) >= 5 || option.kind === 'card' && (data.cardBoosts[option.id] || 0) >= 30)) return false;
      if (new Set(data.pack.options.map(option => `${option.kind}:${option.id}`)).size !== data.pack.options.length) return false;
      if (!data.shop.some(offer => offer.kind === 'pack' && offer.pack === data.pack.kind && offer.sold)) return false;
    } else if (data.pack !== null) return false;
    if (data.phase === 'replace') {
      if (!jokerIds.includes(data.pendingJoker) || data.jokers.includes(data.pendingJoker) || data.jokers.length !== 3) return false;
      if (!data.shop.some(offer => offer.sold && (offer.kind === 'joker' && offer.id === data.pendingJoker || offer.kind === 'pack' && offer.pack === 'joker'))) return false;
    } else if (data.pendingJoker !== null) return false;
    let lastResult = null;
    if (data.phase === 'score') {
      if (!plain(data.lastPlay) || !dense(data.lastPlay.cards, 5, id => data.discard.includes(id)) || !data.lastPlay.cards.length ||
        new Set(data.lastPlay.cards).size !== data.lastPlay.cards.length || data.lastPlay.playsLeft !== data.playsLeft + 1 ||
        data.lastPlay.discardsUsed !== 3 - data.discardsLeft) return false;
      lastResult = scoreGambitHand(data.lastPlay.cards, data.jokers, data.handLevels, { round: data.round,
        playsLeft: data.lastPlay.playsLeft, discardsUsed: data.lastPlay.discardsUsed, cardBoosts: data.cardBoosts });
      if (!lastResult || lastResult.total > data.roundScore || data.selected.length) return false;
    } else if (data.lastPlay !== null || data.scoreTime !== 0) return false;
    if (data.won && (data.status !== 'dead' || data.round !== 6 || data.roundScore < GAMBIT_TARGETS[5])) return false;
    if (data.status === 'dead' && (data.phase !== 'play' || (!data.won && data.playsLeft > 0 && data.hand.length))) return false;
    if (data.status === 'dead' && !data.won && data.roundScore >= GAMBIT_TARGETS[data.round - 1]) return false;
    if (data.status !== 'dead' && data.phase === 'play' && (data.playsLeft === 0 || !data.hand.length)) return false;
    if (shopping && data.selected.length) return false;
    if (data.status === 'idle' && (data.phase !== 'play' || data.round !== 1 || data.score !== 0 || data.playsLeft !== 4 || data.discardsLeft !== 3 || data.selected.length)) return false;
    if (data.status !== 'dead' && data.phase === 'play' && data.roundScore >= GAMBIT_TARGETS[data.round - 1]) return false;
    const keys = ['rngState','phase','won','round','score','roundScore','money','jokers','handLevels','cardBoosts','deck','hand','discard','selected','playsLeft','discardsLeft','shop','pack','pendingJoker','lastPlay','scoreTime'];
    const state = clone(Object.fromEntries(keys.map(key => [key, data[key]])));
    Object.assign(this, state, { status: data.status === 'playing' ? 'paused' : data.status, lastResult }); return true;
  }
}
