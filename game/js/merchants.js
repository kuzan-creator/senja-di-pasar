// merchants.js — Pedagang Tetap: kartu yang menetap di meja (MURNI).
// Ala Hearthstone: dipanggil dari tangan, punya Serang + Darah, menyerang
// otomatis di awal giliran pemiliknya, dan tidak bisa menyerang di giliran
// ia dipanggil (summoning sickness). Maks 3 Pedagang per pihak.
// Sumber: CONCEPT.md §4B (v3). Tidak menyentuh DOM.

import { applyDamageTo } from './state.js';

export const MAX_MERCHANTS = 3;

const SHORT_NAMES = {
  'lampion-raksasa': 'Lampion',
  perahu: 'Perahu',
  sayur: 'Sayur',
  lelang: 'Lelang',
};

const TILE_EMOJI = {
  'lampion-raksasa': '🏮',
  perahu: '⛵',
  sayur: '🥬',
  lelang: '🔨',
};

export function merchantShort(id) {
  return SHORT_NAMES[id] || id;
}

export function merchantEmoji(id) {
  return TILE_EMOJI[id] || '🧑‍🌾';
}

// Satu Pedagang di meja dari kartu yang baru dimainkan.
export function makeMerchant(card) {
  const m = card.merchant || { atk: 2, hp: 3 };
  return {
    uid: card.uid,
    defId: card.id,
    name: card.name,
    short: merchantShort(card.id),
    emoji: merchantEmoji(card.id),
    suit: card.suit,
    atk: m.atk,
    hp: m.hp,
    maxHp: m.hp,
    ready: false, // baru dipanggil: belum bisa menyerang giliran ini
  };
}

// Proyeksi damage Pedagang penyerang ke Reputasi bertahan (murni, tanpa
// mengubah state): tiap Pedagang menyerang Pedagang bertahan yang Serangnya
// paling besar (saling pukul), sisanya menghantam Reputasi. Dipakai intent
// (ai.js planTurn) supaya damage Pedagang ikut terbaca sebelum giliran AI.
export function projectMerchantDamage(attackers, defenders) {
  const defs = defenders.map((m) => ({ atk: m.atk, hp: m.hp }));
  let heroDmg = 0;
  for (const a of attackers) {
    if (!a.ready) continue;
    if (defs.length === 0) {
      heroDmg += a.atk;
      continue;
    }
    let ti = 0;
    for (let i = 1; i < defs.length; i++) {
      if (defs[i].atk > defs[ti].atk) ti = i;
    }
    defs[ti].hp -= a.atk;
    if (defs[ti].hp <= 0) defs.splice(ti, 1);
  }
  return heroDmg;
}

// Serangan Pedagang di awal giliran pemiliknya. Mengembalikan pesan log.
// Urutan: semua Pedagang jadi siap (yang dipanggil giliran lalu kini bisa
// menyerang), lalu tiap Pedagang yang siap menyerang sekali. Pedagang yang
// Darahnya 0 hancur dan hilang dari meja (tidak masuk Kotak Sisa, supaya
// tidak tercampur ke deck saat dikocok ulang).
export function resolveMerchantAttacks(state, sideName) {
  const me = state[sideName];
  const foeName = sideName === 'player' ? 'enemy' : 'player';
  const foe = state[foeName];
  const messages = [];
  if (me.merchants.length === 0) return messages;
  for (const m of me.merchants) m.ready = true;
  for (const m of me.merchants.slice()) {
    if (m.hp <= 0) continue;
    if (foe.merchants.length > 0) {
      let ti = 0;
      for (let i = 1; i < foe.merchants.length; i++) {
        if (foe.merchants[i].atk > foe.merchants[ti].atk) ti = i;
      }
      const target = foe.merchants[ti];
      target.hp -= m.atk;
      m.hp -= target.atk;
      messages.push(m.name + ' menyerang ' + target.name + ' ' + m.atk + ' — dibalas ' + target.atk);
      if (target.hp <= 0) {
        foe.merchants.splice(ti, 1);
        messages.push(target.name + ' hancur!');
      }
      if (m.hp <= 0) {
        me.merchants.splice(me.merchants.indexOf(m), 1);
        messages.push(m.name + ' hancur!');
      }
    } else {
      const res = applyDamageTo(foe, m.atk, false);
      messages.push(m.name + ' menyerang Reputasi ' + res.dealt);
      if (res.dealt > 0) state.floating = { text: '−' + res.dealt, target: foeName };
    }
  }
  return messages;
}
