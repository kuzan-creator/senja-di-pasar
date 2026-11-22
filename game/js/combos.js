// combos.js — Resonansi, Rantai, Roda Senja, Pasar Ramai (MURNI).
// Sumber: CONCEPT.md §4. Semua bonus dihitung otomatis saat kartu dimainkan.

// Roda Senja: Lampion > Daun > Ombak > Lampion. Bulan netral, menembus Terpal.
export const WHEEL_BEATS = { lampion: 'daun', daun: 'ombak', ombak: 'lampion' };

export function wheelBeats(attackerSuit, defenderSuit) {
  return WHEEL_BEATS[attackerSuit] === defenderSuit;
}

export function resonanceBonus(suit) {
  switch (suit) {
    case 'lampion': return { label: 'RESONANSI LAMPION! +2 SERANG', dmg: 2 };
    case 'ombak': return { label: 'RESONANSI OMBAK! +1 DRAW', draw: 1 };
    case 'daun': return { label: 'RESONANSI DAUN! +3 PERISAI', shield: 3 };
    case 'bulan': return { label: 'RESONANSI BULAN! +1 KOIN', refund: 1 };
    default: return { label: '' };
  }
}

// Hitung semua bonus untuk satu kartu yang sedang dimainkan.
// played: kartu yang sudah dimainkan pihak ini di giliran ini (array {card, cost}).
// opts: { lastFoeCard, firstAttack, senjaActive, pasarRamaiDone }
export function computeBonuses(card, played, opts) {
  const banners = [];
  let bonusDmg = 0;
  let bonusShield = 0;
  let bonusHeal = 0;
  let bonusDraw = 0;
  let refund = 0;
  let breakShield = card.breakShield || 0;
  let pierce = !!card.pierce;

  // Bulan menembus Terpal (Roda Senja).
  if (card.suit === 'bulan' && (card.dmg || 0) > 0) pierce = true;

  // 1. Resonansi — suit sama sudah dimainkan di giliran ini.
  const sameSuit = played.some((p) => p.card.suit === card.suit);
  if (sameSuit) {
    const r = resonanceBonus(card.suit);
    banners.push(r.label);
    bonusDmg += r.dmg || 0;
    bonusDraw += r.draw || 0;
    refund += r.refund || 0;
    if (r.shield) {
      if ((card.shield || 0) > 0) bonusShield += r.shield;
      else if ((card.heal || 0) > 0) bonusHeal += r.shield;
      else bonusShield += r.shield;
    }
  }

  // 2. Rantai Senja — biaya berurutan naik (1 -> 2 -> 3).
  const costs = played.map((p) => p.cost).concat([card.cost]);
  let chain = 1;
  for (let i = costs.length - 1; i > 0; i--) {
    if (costs[i] === costs[i - 1] + 1) chain += 1;
    else break;
  }
  if (chain >= 3) {
    banners.push('RANTAI SENJA ×3! +5');
    if ((card.dmg || 0) > 0) bonusDmg += 5;
    else if ((card.shield || 0) > 0) bonusShield += 5;
    else if ((card.heal || 0) > 0) bonusHeal += 5;
    else bonusDmg += 5;
  } else if (chain === 2) {
    banners.push('RANTAI SENJA ×2! +3');
    if ((card.dmg || 0) > 0) bonusDmg += 3;
    else if ((card.shield || 0) > 0) bonusShield += 3;
    else if ((card.heal || 0) > 0) bonusHeal += 3;
    else bonusDmg += 3;
  }

  // 3. Roda Senja — suit serang mengalahkan suit kartu terakhir lawan.
  if ((card.dmg || 0) > 0 && opts.lastFoeCard && wheelBeats(card.suit, opts.lastFoeCard.suit)) {
    banners.push('RODA SENJA! ' + suitName(card.suit) + ' > ' + suitName(opts.lastFoeCard.suit) + ' +3');
    bonusDmg += 3;
    breakShield += 2;
  }

  // 4. Senja Terakhir — serangan pertama tiap giliran +2 saat Reputasi <= 10.
  if (opts.senjaActive && opts.firstAttack && (card.dmg || 0) > 0) {
    banners.push('SENJA TERAKHIR! +2 SERANG');
    bonusDmg += 2;
  }

  // 5. Pasar Ramai — 3 suit berbeda dalam 1 giliran: draw 2 + heal 3.
  let pasarRamai = false;
  if (!opts.pasarRamaiDone) {
    const suits = new Set(played.map((p) => p.card.suit));
    suits.add(card.suit);
    if (suits.size >= 3) {
      pasarRamai = true;
      banners.push('PASAR RAMAI! +2 DRAW, +3 PULIH');
      bonusDraw += 2;
      bonusHeal += 3;
    }
  }

  return { banners, bonusDmg, bonusShield, bonusHeal, bonusDraw, refund, breakShield, pierce, pasarRamai };
}

function suitName(id) {
  return { lampion: 'Lampion', ombak: 'Ombak', daun: 'Daun', bulan: 'Bulan' }[id] || id;
}

// Kartu di tangan yang bisa melanjutkan rantai (biaya = biaya terakhir + 1).
export function canContinueChain(card, played) {
  if (played.length === 0) return false;
  return card.cost === played[played.length - 1].cost + 1;
}
