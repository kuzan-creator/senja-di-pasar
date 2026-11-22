// ai.js — Juragan Bara: watak Bertahan / Menyerang / Membuang / Berimbang (MURNI).
// Sumber: CONCEPT.md §5. AI memakai deck, tangan, dan koin yang sama aturannya
// dengan pemain; tidak melihat tangan pemain; tidak mendapat koin lebih.

import { isPureHeal, isAttack } from './cards.js';

export function determineMood(ai, player) {
  if (ai.life < 10) return 'bertahan';
  if (player.shield === 0 && ai.hand.some(isAttack)) return 'menyerang';
  if (ai.hand.length >= 6) return 'membuang';
  return 'berimbang';
}

export function moodLabel(mood) {
  return {
    bertahan: 'BERTAHAN',
    menyerang: 'MENYERANG',
    membuang: 'MEMBUANG',
    berimbang: 'BERIMBANG',
  }[mood] || 'BERIMBANG';
}

// Nilai satu kartu menurut watak AI saat ini (makin besar makin diprioritaskan).
function cardScore(card, mood, round) {
  let s = 0;
  const dmg = card.dmg || 0;
  const shield = card.shield || 0;
  const heal = card.heal || 0;
  const draw = card.draw || 0;
  const coins = (card.coins || 0) + (card.coinsNext || 0);
  if (mood === 'bertahan') {
    s += heal * 3 + shield * 2 + dmg * 0.5;
  } else if (mood === 'menyerang') {
    s += dmg * 3 + draw * 1 + shield * 0.3;
  } else if (mood === 'membuang') {
    s += draw * 2 + dmg * 1.5 + shield * 1 - card.cost * 2;
  } else {
    s += dmg * 2 + shield * 1.2 + heal * 1.2 + draw * 1.5 + coins * 1.5;
  }
  // Kartu mahal terasa pamungkas, tapi jangan boros di awal game.
  if (round <= 2 && card.cost >= 5) s -= 100;
  return s - card.cost * 0.4;
}

// Pilih kartu yang akan dimainkan AI di gilirannya. Mengembalikan array kartu
// (urut main), tanpa mengubah state.
export function chooseCards(ai, player, round) {
  const mood = determineMood(ai, player);
  let coins = ai.coins;
  const maxCards = round === 1 ? 1 : 3;
  const chosen = [];
  const pool = ai.hand.slice().sort((a, b) => cardScore(b, mood, round) - cardScore(a, mood, round));

  for (const card of pool) {
    if (chosen.length >= maxCards) break;
    if (card.cost > coins) continue;
    // AI hanya heal saat watak Bertahan (§5, perbaikan §6A).
    if (isPureHeal(card) && mood !== 'bertahan') continue;
    // Panen Raya maksimal 1x per game.
    if (card.id === 'panen-raya' && ai.panenUsed) continue;
    // AI tidak memakai kartu biaya 5 di Putaran 1-2 (ia "menabung").
    if (round <= 2 && card.cost >= 5) continue;
    chosen.push(card);
    coins -= card.cost;
  }
  return chosen;
}

// Rencana giliran AI + ringkasan intent (jenis + angka) untuk ditampilkan
// ke pemain sebelum giliran AI berjalan.
export function planTurn(ai, player, round) {
  const mood = determineMood(ai, player);
  const cards = chooseCards(ai, player, round);
  let dmg = 0;
  let shield = 0;
  let heal = 0;
  let draw = 0;
  for (const c of cards) {
    dmg += c.dmg || 0;
    shield += c.shield || 0;
    heal += c.heal || 0;
    draw += c.draw || 0;
  }
  let kind = 'draw';
  let value = draw;
  if (dmg > 0 && dmg >= shield && dmg >= heal) { kind = 'attack'; value = dmg; }
  else if (heal > 0 && heal >= shield) { kind = 'heal'; value = heal; }
  else if (shield > 0) { kind = 'shield'; value = shield; }
  return { mood, cards, kind, value, totals: { dmg, shield, heal, draw } };
}
