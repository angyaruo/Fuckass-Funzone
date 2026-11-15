/** Original poker scoring and Joker catalog. Pure, deterministic rules without host APIs. */
export const GAMBIT_HANDS = Object.freeze([
  { id: 'high_card', name: 'High Card', chips: 5, mult: 1 },
  { id: 'pair', name: 'Pair', chips: 10, mult: 2 },
  { id: 'two_pair', name: 'Two Pair', chips: 20, mult: 2 },
  { id: 'three_kind', name: 'Three of a Kind', chips: 30, mult: 3 },
  { id: 'straight', name: 'Straight', chips: 30, mult: 4 },
  { id: 'flush', name: 'Flush', chips: 35, mult: 4 },
  { id: 'full_house', name: 'Full House', chips: 45, mult: 4 },
  { id: 'four_kind', name: 'Four of a Kind', chips: 60, mult: 7 },
  { id: 'straight_flush', name: 'Straight Flush', chips: 90, mult: 8 },
].map(hand => Object.freeze(hand)));

export const GAMBIT_JOKERS = Object.freeze([
  { id: 'pair_gremlin', name: 'Pair Gremlin', description: '+4 Mult when the played cards contain a repeated rank.', rarity: 'common' },
  { id: 'heart_hoarder', name: 'Heart Hoarder', description: '+20 chips for every scoring Heart.', rarity: 'common' },
  { id: 'last_laugh', name: 'Last Laugh', description: 'Mult ×1.5 on the final available play of a round.', rarity: 'rare' },
  { id: 'growing_suspicion', name: 'Growing Suspicion', description: '+5 chips for each round already cleared.', rarity: 'common' },
  { id: 'pocket_ace', name: 'Pocket Ace', description: '+3 Mult when an Ace scores.', rarity: 'uncommon' },
  { id: 'club_regular', name: 'Club Regular', description: '+12 chips for every scoring Club.', rarity: 'common' },
  { id: 'face_value', name: 'Face Value', description: '+8 chips for every scoring Jack, Queen, or King.', rarity: 'common' },
  { id: 'clean_slate', name: 'Clean Slate', description: '+3 Mult while no discards have been used this round.', rarity: 'uncommon' },
  { id: 'little_scheme', name: 'Little Scheme', description: '+3 Mult when playing three or fewer cards.', rarity: 'common' },
  { id: 'straight_talker', name: 'Straight Talker', description: 'Mult ×1.6 on a Straight or Straight Flush.', rarity: 'rare' },
  { id: 'velvet_flush', name: 'Velvet Flush', description: 'Mult ×1.5 on a Flush or Straight Flush.', rarity: 'rare' },
  { id: 'lonely_crown', name: 'Lonely Crown', description: '+35 chips on a High Card hand.', rarity: 'common' },
].map(joker => Object.freeze(joker)));

const handById = Object.fromEntries(GAMBIT_HANDS.map(hand => [hand.id, hand]));
const jokerById = Object.fromEntries(GAMBIT_JOKERS.map(joker => [joker.id, joker]));
const isCard = card => Number.isInteger(card) && card >= 0 && card <= 51;
const rankOf = card => card % 13 + 1;
const pokerRank = card => rankOf(card) === 1 ? 14 : rankOf(card);
const suitOf = card => Math.floor(card / 13);
const cardChips = card => rankOf(card) === 1 ? 11 : Math.min(10, rankOf(card));
const integer = (value, low, high) => Number.isSafeInteger(value) && value >= low && value <= high;
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const safeTotal = (chips, mult) => Math.min(1000000000, Math.floor(chips * mult));

/** Identify the highest valid category within the selected one to five cards. */
export function evaluateGambitHand(cards) {
  if (!Array.isArray(cards) || cards.length < 1 || cards.length > 5 ||
      Array.from(cards).some(card => !isCard(card)) || new Set(cards).size !== cards.length) return null;
  const ranks = new Map();
  for (const card of cards) {
    const rank = rankOf(card);
    if (!ranks.has(rank)) ranks.set(rank, []);
    ranks.get(rank).push(card);
  }
  const groups = [...ranks.values()].sort((a, b) => b.length - a.length || pokerRank(b[0]) - pokerRank(a[0]));
  const ordered = [...new Set(cards.map(pokerRank))].sort((a, b) => a - b);
  const straight = cards.length === 5 && ordered.length === 5 &&
    (ordered[4] - ordered[0] === 4 || ordered.join(',') === '2,3,4,5,14');
  const flush = cards.length === 5 && cards.every(card => suitOf(card) === suitOf(cards[0]));
  let id = 'high_card', scoringCards;
  if (straight && flush) id = 'straight_flush';
  else if (groups[0].length === 4) id = 'four_kind';
  else if (groups[0].length === 3 && groups[1]?.length === 2) id = 'full_house';
  else if (flush) id = 'flush';
  else if (straight) id = 'straight';
  else if (groups[0].length === 3) id = 'three_kind';
  else if (groups[0].length === 2 && groups[1]?.length === 2) id = 'two_pair';
  else if (groups[0].length === 2) id = 'pair';
  if (['straight_flush', 'full_house', 'flush', 'straight'].includes(id)) scoringCards = [...cards];
  else if (id === 'two_pair') scoringCards = [...groups[0], ...groups[1]];
  else if (id === 'high_card') scoringCards = [cards.reduce((best, card) => pokerRank(card) > pokerRank(best) ? card : best)];
  else scoringCards = [...groups[0]];
  // Preserve hand order so the scoring display can highlight the actual selected cards.
  const scoring = new Set(scoringCards);
  return { ...handById[id], scoringCards: cards.filter(card => scoring.has(card)) };
}

/**
 * Score in four explicit stages: hand + cards, flat chips, added Mult, multiplied Mult.
 * Joker position never changes the result; steps report cumulative totals for the UI.
 */
export function scoreGambitHand(cards, jokers = [], handLevels = {}, context = {}) {
  const hand = evaluateGambitHand(cards);
  if (!hand || !Array.isArray(jokers) || jokers.length > 3 || new Set(jokers).size !== jokers.length ||
      Array.from(jokers).some(id => !Object.hasOwn(jokerById, id)) || !record(handLevels) ||
      Object.entries(handLevels).some(([id, level]) => !Object.hasOwn(handById, id) || !integer(level, 0, 5)) || !record(context)) return null;
  const { round = 1, playsLeft = 4, discardsUsed = 0, cardBoosts = {} } = context;
  if (!integer(round, 1, 6) || !integer(playsLeft, 1, 4) || !integer(discardsUsed, 0, 3) || !record(cardBoosts) ||
      Object.entries(cardBoosts).some(([id, bonus]) => !/^(?:[0-9]|[1-4][0-9]|5[01])$/.test(id) || !integer(bonus, 0, 30))) return null;
  const level = Object.hasOwn(handLevels, hand.id) ? handLevels[hand.id] : 0;
  let chips = hand.chips + level * 15, mult = hand.mult + level;
  const steps = [{ label: `${hand.name}${level ? ` · level ${level + 1}` : ''}`, chips, mult }];
  const scored = hand.scoringCards;
  const cardPoints = scored.reduce((sum, card) => sum + cardChips(card) + (Object.hasOwn(cardBoosts, card) ? cardBoosts[card] : 0), 0);
  chips += cardPoints; steps.push({ label: `Scoring cards +${cardPoints} chips`, chips, mult });
  const effects = [];
  const add = (id, type, amount) => { if (amount > 0) effects.push({ id, type, amount }); };
  for (const id of jokers) {
    if (id === 'pair_gremlin' && new Set(cards.map(rankOf)).size < cards.length) add(id, 'mult', 4);
    else if (id === 'heart_hoarder') add(id, 'chips', scored.filter(card => suitOf(card) === 3).length * 20);
    else if (id === 'last_laugh' && playsLeft === 1) add(id, 'times', 1.5);
    else if (id === 'growing_suspicion') add(id, 'chips', (round - 1) * 5);
    else if (id === 'pocket_ace' && scored.some(card => rankOf(card) === 1)) add(id, 'mult', 3);
    else if (id === 'club_regular') add(id, 'chips', scored.filter(card => suitOf(card) === 0).length * 12);
    else if (id === 'face_value') add(id, 'chips', scored.filter(card => rankOf(card) >= 11).length * 8);
    else if (id === 'clean_slate' && discardsUsed === 0) add(id, 'mult', 3);
    else if (id === 'little_scheme' && cards.length <= 3) add(id, 'mult', 3);
    else if (id === 'straight_talker' && ['straight', 'straight_flush'].includes(hand.id)) add(id, 'times', 1.6);
    else if (id === 'velvet_flush' && ['flush', 'straight_flush'].includes(hand.id)) add(id, 'times', 1.5);
    else if (id === 'lonely_crown' && hand.id === 'high_card') add(id, 'chips', 35);
  }
  for (const type of ['chips', 'mult', 'times']) {
    for (const effect of effects.filter(item => item.type === type)) {
      if (type === 'chips') chips += effect.amount;
      else if (type === 'mult') mult += effect.amount;
      else mult *= effect.amount;
      mult = Math.round(mult * 10000) / 10000;
      const bonus = type === 'chips' ? `+${effect.amount} chips` : type === 'mult' ? `+${effect.amount} Mult` : `Mult ×${effect.amount}`;
      steps.push({ label: `${jokerById[effect.id].name}: ${bonus}`, chips, mult });
    }
  }
  return { id: hand.id, name: hand.name, scoringCards: [...scored], chips, mult, total: safeTotal(chips, mult), steps };
}
