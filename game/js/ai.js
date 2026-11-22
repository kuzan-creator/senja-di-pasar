// ai.js — Juragan Bara: watak Bertahan / Menyerang / Membuang / Berimbang (MURNI).
// Sumber: CONCEPT.md §5. AI memakai deck, tangan, dan koin yang sama aturannya
// dengan pemain; tidak melihat tangan pemain; tidak mendapat koin lebih.

import { isPureHeal, isAttack } from './cards.js';

export function determineMood(ai, player) {
  if (ai.life < 10) return 'bertahan';
  if (player.shield <= 4 && ai.hand.some(isAttack)) return 'menyerang';
  if (ai.hand.length >= 7) return 'membuang';
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
// v2: AI dinilai seperti pemain serakah — damage dan ekonomi (draw/koin) berat,
// karena AI v1 terlalu sering membuang koin untuk kartu bertahan/draw yang
// tidak menutup game, sehingga damage AI cuma ~5/giliran.
function cardScore(card, mood, round, foeLife) {
  let s = 0;
  const dmg = card.dmg || 0;
  const shield = card.shield || 0;
  const heal = card.heal || 0;
  const draw = card.draw || 0;
  const coins = (card.coins || 0) + (card.coinsNext || 0);
  const dmgW = foeLife <= 10 ? 5 : 3;
  if (mood === 'bertahan') {
    s += heal * 3 + shield * 2 + dmg * 1;
  } else if (mood === 'menyerang') {
    s += dmg * dmgW + draw * 2 + coins * 2 + shield * 0.5;
  } else if (mood === 'membuang') {
    s += draw * 2 + dmg * 2 + shield * 1 + coins * 2 - card.cost * 2;
  } else {
    s += dmg * 3 + shield * 1 + heal * 0.5 + draw * 2 + coins * 2;
  }
  // Kartu mahal terasa pamungkas, tapi jangan boros di awal game.
  if (round <= 2 && card.cost >= 5) s -= 100;
  return s - card.cost * 0.4;
}

// Pilih kartu yang akan dimainkan AI di gilirannya. Mengembalikan array kartu
// (urut main), tanpa mengubah state.
// v2: rencana dibuat dengan SIMULASI giliran di atas salinan tangan + deck —
// kartu draw/koin yang dimainkan di tengah giliran ikut membuka kartu
// berikutnya, persis seperti pemain serakah. Rencana v1 (pilih sekali dari
// tangan awal) membuat AI tidak pernah memakai kartu hasil draw, sehingga
// damage AI mentok ~5/giliran sementara pemain ~8-11.
export function chooseCards(ai, player, round) {
  const mood = determineMood(ai, player);
  const hand = ai.hand.slice();
  const deck = ai.deck.slice();
  let coins = ai.coins;
  const chosen = [];
  const maxCards = round === 1 ? 2 : 6;
  const blocked = (card) => {
    if (card.cost > coins) return true;
    if (isPureHeal(card) && mood !== 'bertahan') return true;
    if (card.id === 'panen-raya' && ai.panenUsed) return true;
    if (round <= 2 && card.cost >= 5) return true;
    return false;
  };
  const scoreOf = (card) => {
    let s = cardScore(card, mood, round, player.life);
    if (chosen.some((c) => c.suit === card.suit)) s += 4; // Resonansi
    if (chosen.length > 0 && card.cost === chosen[chosen.length - 1].cost + 1) s += 4; // Rantai
    return s;
  };
  while (chosen.length < maxCards) {
    const affordable = hand.filter((c) => !blocked(c));
    if (affordable.length === 0) break;
    // Kartu ekonomi murah didahulukan bila belum ada kartu dipilih (mendanai serangan).
    let pick = null;
    if (chosen.length === 0) {
      const econ = affordable
        .filter((c) => ((c.coins || 0) > 0 || (c.draw || 0) > 0) && c.cost <= 1)
        .sort((a, b) => ((b.coins || 0) + (b.draw || 0)) - ((a.coins || 0) + (a.draw || 0)));
      if (econ.length > 0) pick = econ[0];
    }
    if (!pick) {
      affordable.sort((a, b) => scoreOf(b) - scoreOf(a));
      pick = affordable[0];
    }
    const idx = hand.indexOf(pick);
    hand.splice(idx, 1);
    chosen.push(pick);
    coins -= pick.cost;
    coins += pick.coins || 0;
    for (let k = 0; k < (pick.draw || 0); k++) {
      if (deck.length > 0) hand.push(deck.pop());
    }
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
