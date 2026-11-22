// shots.js — Staging screenshot (§10 CONCEPT.md) via query param ?shot=.
// table | title | win | loss. State dipaksa persis, lalu dirender game asli
// (bukan mockup) supaya HUD angka konsisten antar shot.

import { createGame } from './state.js';
import { cardById } from './cards.js';
import { makeInstance } from './deck.js';

function inst(id) {
  return makeInstance(cardById(id));
}

function fillPile(n, id) {
  const out = [];
  for (let i = 0; i < n; i++) out.push(inst(id || 'obor'));
  return out;
}

export function stageShot(name) {
  const state = createGame();
  if (name === 'title') {
    state.phase = 'title';
    return state;
  }
  if (name === 'win') {
    state.phase = 'win';
    state.round = 7;
    state.player.life = 14;
    state.enemy.life = 0;
    state.score = 200;
    state.stars = 3;
    state.winner = 'player';
    return state;
  }
  if (name === 'loss') {
    state.phase = 'loss';
    state.round = 9;
    state.player.life = 0;
    state.enemy.life = 4;
    state.score = 40;
    state.stars = 1;
    state.winner = 'enemy';
    return state;
  }
  // table — Shot 1 cover (§6 Pilihan C, setelah kartu ketiga dimainkan).
  state.phase = 'player';
  state.round = 4;
  state.player.life = 22;
  state.player.shield = 0;
  state.player.coins = 3;
  state.player.coinsMax = 7;
  state.player.hand = [inst('obor'), inst('sate'), inst('daun-pisang'), inst('ikan'), inst('koin-receh')];
  state.player.deck = fillPile(24, 'obor');
  state.player.discard = fillPile(7, 'daun-pisang');
  state.player.played = [{ card: inst('koin-receh'), cost: 0 }, { card: inst('obor'), cost: 1 }, { card: inst('sate'), cost: 2 }];
  state.enemy.life = 6;
  state.enemy.shield = 0;
  state.enemy.hand = fillPile(5, 'pohon-mangga');
  state.enemy.deck = fillPile(24, 'pohon-mangga');
  state.lastEnemyCard = inst('pohon-mangga');
  state.lastPlayerCard = inst('sate');
  state.banner = 'RANTAI SENJA ×2! +3';
  state.floating = { text: '−11', target: 'enemy' };
  state.intent = {
    kind: 'attack', value: 8, mood: 'menyerang',
    text: 'AKAN MENYERANG 8', sub: 'WILL ATTACK',
    icon: '🔥', color: '#E8442E', bg: '#5A1410',
    note: 'Perkiraan — bisa meleset 2',
  };
  state.stars = 2;
  state.selectedIndex = 1;
  state.log = ['Sate Membara menyerang 11 — Roda Senja mengalahkan Daun'];
  return state;
}
