// state.js — State game: Reputasi, koin, tangan, deck, giliran, skor (MURNI).
// Tidak menyentuh DOM. Sumber: CONCEPT.md §2.

import { buildDeck } from './deck.js';

export const MAX_LIFE = 30;
export const MAX_HAND = 8;
export const BASE_COINS = 5;

export function freshSide() {
  return {
    life: MAX_LIFE,
    shield: 0,
    coins: BASE_COINS,
    coinsMax: BASE_COINS,
    coinsNext: 0,
    burn: 0,
    hand: [],
    deck: [],
    discard: [],
    played: [],
    coinsSpent: 0,
    firstAttackDone: false,
    pasarRamaiDone: false,
    panenUsed: false,
  };
}

export function createGame() {
  const state = {
    round: 1,
    phase: 'title', // title | player | enemy | win | loss
    player: freshSide(),
    enemy: freshSide(),
    lastPlayerCard: null,
    lastEnemyCard: null,
    intent: null,
    aiPlan: null,
    banner: null,
    floating: null,
    log: [],
    winner: null,
    score: 0,
    stars: 3,
    selectedIndex: -1,
    muted: false,
  };
  state.player.deck = buildDeck();
  state.enemy.deck = buildDeck();
  state.player.hand = state.player.deck.splice(0, 5);
  state.enemy.hand = state.enemy.deck.splice(0, 5);
  return state;
}

// Bintang skor berjalan dari Reputasi tersisa (§2).
export function starsFor(life) {
  if (life >= 20) return 3;
  if (life >= 10) return 2;
  return 1;
}

// Skor menang: Reputasi tersisa x 10 + bonus putaran cepat (§2).
export function scoreForWin(life, round) {
  return life * 10 + Math.max(0, 10 - round) * 20;
}

export function senjaTerakhirActive(side) {
  return side.life <= 10;
}

// Damage mengurangi Terpal dulu, sisanya ke Reputasi. Pierce mengabaikan Terpal.
export function applyDamageTo(target, amount, pierce) {
  let absorbed = 0;
  let dealt = amount;
  if (!pierce && target.shield > 0) {
    absorbed = Math.min(target.shield, amount);
    target.shield -= absorbed;
    dealt = amount - absorbed;
  }
  target.life = Math.max(0, target.life - dealt);
  return { absorbed, dealt };
}

export function healSide(side, amount) {
  const before = side.life;
  side.life = Math.min(MAX_LIFE, side.life + amount);
  return side.life - before;
}

export function addLog(state, msg) {
  state.log.push(msg);
  if (state.log.length > 6) state.log.shift();
}
