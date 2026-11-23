// shots.js — Staging screenshot (§10 CONCEPT.md) via query param ?shot=.
// table | title | win | loss. State dipaksa persis, lalu dirender game asli
// (bukan mockup) supaya HUD angka konsisten antar shot.

import { createGame } from './state.js';
import { cardById } from './cards.js';
import { makeInstance } from './deck.js';
import { makeMerchant } from './merchants.js';

function inst(id) {
  return makeInstance(cardById(id));
}

// Satu Pedagang di meja untuk staging (objek merchant asli, bukan kartu).
function stagedMerchant(id, atk, hp, ready) {
  const m = makeMerchant(inst(id));
  m.atk = atk;
  m.hp = hp;
  m.maxHp = hp === m.maxHp ? m.maxHp : Math.max(hp, m.maxHp);
  m.ready = ready;
  return m;
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
  // table — Shot 1 cover (§6 Pilihan C, setelah kartu ketiga dimainkan, v2).
  // v3: Pedagang Tetap di kedua barisan + log 3 baris + tanpa angka melayang
  // (satu banner pahlawan: RANTAI SENJA). Putaran 6, lawan baru turun ke 6.
  state.phase = 'player';
  state.round = 6;
  state.player.life = 22;
  state.player.shield = 0;
  state.player.coins = 2;
  state.player.coinsMax = 4;
  state.player.hand = [inst('obor'), inst('sate'), inst('daun-pisang'), inst('ikan'), inst('koin-receh')];
  state.player.deck = fillPile(17, 'obor');
  state.player.discard = fillPile(9, 'daun-pisang');
  state.player.played = [{ card: inst('koin-receh'), cost: 0 }, { card: inst('obor'), cost: 1 }, { card: inst('sate'), cost: 2 }];
  // Pedagang pemain: Tukang Sayur (1/5) + Nakhoda Perahu (2/4), sudah siap.
  state.player.merchants = [
    stagedMerchant('sayur', 1, 5, true),
    stagedMerchant('perahu', 2, 4, true),
  ];
  state.enemy.life = 6;
  state.enemy.shield = 0;
  state.enemy.hand = fillPile(5, 'pohon-mangga');
  state.enemy.deck = fillPile(24, 'pohon-mangga');
  // Pedagang lawan: Penjaga Lampion (3/6, sudah kena 3 damage → Darah 3)
  // + Juru Lelang (2/3), sudah siap.
  state.enemy.merchants = [
    stagedMerchant('lampion-raksasa', 3, 3, true),
    stagedMerchant('lelang', 2, 3, true),
  ];
  state.lastEnemyCard = inst('pohon-mangga');
  state.lastPlayerCard = inst('sate');
  state.banner = 'RANTAI SENJA ×2! +3';
  state.floating = null; // v3: satu banner pahlawan saja, tanpa angka melayang
  state.intent = {
    kind: 'attack', value: 8, mood: 'menyerang',
    text: 'AKAN MENYERANG 8', sub: 'WILL ATTACK',
    icon: '🔥', color: '#E8442E', bg: '#5A1410',
    note: 'Perkiraan — bisa meleset 2',
  };
  state.stars = 3; // Reputasi 22 >= 20 -> 3 bintang (rumus starsFor).
  state.selectedIndex = 1;
  state.log = [
    'Tukang Sayur dipanggil ke meja (Serang 1, Darah 5)',
    'Nakhoda Perahu menyerang 2 — Juru Lelang tersisa 1 Darah',
    'Sate Membara menyerang 11 — Roda Senja mengalahkan Daun',
  ];
  return state;
}
