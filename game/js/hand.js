// hand.js — Logika tangan: main kartu, cek biaya, giliran, tangan penuh.
// Bekerja di atas state.js / combos.js / deck.js. Tanpa DOM.

import { computeBonuses } from './combos.js';
import { BASE_COINS } from './state.js';
import { drawFromDeck, discardRandom } from './deck.js';
import { applyDamageTo, healSide, senjaTerakhirActive, MAX_HAND, addLog } from './state.js';

export function canPlay(side, card) {
  return card && card.cost <= side.coins;
}

// Mulai giliran satu pihak: Terpal lama hilang, bara membakar, koin diisi,
// draw 2 kartu (tangan max 8, kelebihan dibuang). Mengembalikan pesan-pesan.
export function startTurn(state, sideName) {
  const me = state[sideName];
  const messages = [];
  me.shield = 0;
  if (me.burn > 0) {
    const burn = me.burn;
    me.burn = 0;
    me.life = Math.max(0, me.life - burn);
    messages.push('Bara membakar ' + (sideName === 'player' ? 'Sari' : 'Juragan Bara') + ' −' + burn);
  }
  me.coinsMax = BASE_COINS + (senjaTerakhirActive(me) ? 1 : 0);
  me.coins = me.coinsMax + me.coinsNext;
  me.coinsNext = 0;
  me.played = [];
  me.pasarRamaiDone = false;
  me.firstAttackDone = false;
  const res = drawFromDeck(me, 2);
  me.hand.push(...res.drawn);
  messages.push(...res.messages);
  if (res.fatigue) {
    me.life = Math.max(0, me.life - 1);
    messages.push('Kelelahan −1 Reputasi');
  }
  while (me.hand.length > MAX_HAND) {
    const extra = me.hand.pop();
    me.discard.push(extra);
    messages.push('Tangan penuh — kartu dibuang');
  }
  return messages;
}

// Pindahkan kartu yang sudah dimainkan giliran ini ke Kotak Sisa.
export function endTurnCleanup(state, sideName) {
  const me = state[sideName];
  for (const p of me.played) me.discard.push(p.card);
  me.played = [];
  state.selectedIndex = -1;
}

// Mainkan satu kartu dari tangan. Mengembalikan { ok, events, banners, messages }.
// events: [{type:'damage'|'shield'|'heal'|'draw'|'coins'|'combo'|'discard', ...}]
// untuk dipakai render + suara. Cek menang/kalah dilakukan pemanggil lewat state.
export function playCard(state, sideName, uid) {
  const me = state[sideName];
  const foeName = sideName === 'player' ? 'enemy' : 'player';
  const foe = state[foeName];
  const idx = me.hand.findIndex((c) => c.uid === uid);
  if (idx < 0) return { ok: false, reason: 'not-in-hand' };
  const card = me.hand[idx];
  if (card.cost > me.coins) return { ok: false, reason: 'no-coins' };

  me.hand.splice(idx, 1);
  me.coins -= card.cost;
  me.coinsSpent += card.cost;

  const lastFoeCard = sideName === 'player' ? state.lastEnemyCard : state.lastPlayerCard;
  const bonuses = computeBonuses(card, me.played, {
    lastFoeCard,
    firstAttack: !me.firstAttackDone,
    senjaActive: senjaTerakhirActive(me),
    pasarRamaiDone: me.pasarRamaiDone,
  });

  const events = [];
  const messages = [];

  // Hancurkan Terpal lawan (Roda Senja / Ombak Pasar) sebelum damage.
  if (bonuses.breakShield > 0 && foe.shield > 0) {
    const broken = Math.min(foe.shield, bonuses.breakShield);
    foe.shield -= broken;
    events.push({ type: 'break-shield', amount: broken, target: foeName });
  }

  // Serangan.
  const totalDmg = (card.dmg || 0) + bonuses.bonusDmg;
  if (totalDmg > 0) {
    const shieldBefore = foe.shield;
    const res = applyDamageTo(foe, totalDmg, bonuses.pierce);
    events.push({ type: 'damage', amount: res.dealt, absorbed: res.absorbed, target: foeName, pierce: bonuses.pierce });
    state.floating = { text: '−' + res.dealt, target: foeName };
    if (card.special === 'juragan' && shieldBefore > 0) {
      me.coins += 2;
      messages.push('Juragan Datang: terpal dihancurkan, +2 koin');
    }
    if (card.special === 'lelang' && foe.life <= 10 && foe.life > 0) {
      me.coins += 2;
      messages.push('Lelang Kilat: lawan sekarat, +2 koin');
    }
    me.firstAttackDone = true;
  }

  // Perisai / heal / draw / koin / bara.
  const totalShield = (card.shield || 0) + bonuses.bonusShield;
  if (totalShield > 0) {
    me.shield += totalShield;
    events.push({ type: 'shield', amount: totalShield, target: sideName });
  }
  const totalHeal = (card.heal || 0) + bonuses.bonusHeal;
  if (totalHeal > 0) {
    const healed = healSide(me, totalHeal);
    events.push({ type: 'heal', amount: healed, target: sideName });
  }
  const totalDraw = (card.draw || 0) + bonuses.bonusDraw;
  if (totalDraw > 0) {
    const res = drawFromDeck(me, totalDraw);
    me.hand.push(...res.drawn);
    messages.push(...res.messages);
    if (res.fatigue) {
      me.life = Math.max(0, me.life - 1);
      messages.push('Kelelahan −1 Reputasi');
    }
    while (me.hand.length > MAX_HAND) {
      const extra = me.hand.pop();
      me.discard.push(extra);
      messages.push('Tangan penuh — kartu dibuang');
    }
    events.push({ type: 'draw', amount: res.drawn.length, target: sideName });
  }
  const totalCoins = (card.coins || 0) + bonuses.refund;
  if (totalCoins > 0) {
    me.coins += totalCoins;
    events.push({ type: 'coins', amount: totalCoins, target: sideName });
  }
  if (card.coinsNext) me.coinsNext += card.coinsNext;
  if (card.burn) {
    foe.burn += card.burn;
    events.push({ type: 'burn', amount: card.burn, target: foeName });
  }
  if (card.discardEnemy) {
    const out = discardRandom(foe, card.discardEnemy);
    if (out.length > 0) events.push({ type: 'discard-enemy', amount: out.length, target: foeName });
  }
  if (card.discardSelf) {
    const out = discardRandom(me, card.discardSelf);
    if (out.length > 0) events.push({ type: 'discard-self', amount: out.length, target: sideName });
  }
  if (card.id === 'panen-raya') me.panenUsed = true;
  if (bonuses.pasarRamai) me.pasarRamaiDone = true;

  // Catat kartu yang dimainkan (untuk kombo + kartu terakhir di meja).
  me.played.push({ card, cost: card.cost });
  if (sideName === 'player') state.lastPlayerCard = card;
  else state.lastEnemyCard = card;

  const banners = bonuses.banners.slice();
  if (banners.length > 0) {
    state.banner = banners.join('  •  ');
    events.push({ type: 'combo', banners });
  }
  for (const m of messages) addLog(state, m);
  return { ok: true, events, banners, messages, card };
}

// Cek akhir game setelah tiap efek. Mengembalikan 'player' | 'enemy' | null.
export function checkWinner(state) {
  if (state.enemy.life <= 0) return 'player';
  if (state.player.life <= 0) return 'enemy';
  return null;
}
