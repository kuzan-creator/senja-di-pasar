// render.js — Gambar ulang meja: tangan, Reputasi, koin, banner, intent.
// Dipakai main.js setiap kali state berubah. DOM hanya di sini (dan main.js).

import { suitById } from './cards.js';
import { LAYOUT, rectStyle } from './table.js';
import { starsFor } from './state.js';
import { MAX_MERCHANTS } from './merchants.js';

function el(id) {
  return document.getElementById(id);
}

function starsText(n) {
  return '★'.repeat(n) + '☆'.repeat(Math.max(0, 3 - n));
}

// Satu kartu pemain (DOM div 150x210, kartu putih #FFF7E8, teks hitam).
export function cardElement(card, opts) {
  const o = opts || {};
  const suit = suitById(card.suit);
  const div = document.createElement('div');
  div.className = 'card' + (o.selected ? ' selected' : '') + (o.disabled ? ' disabled' : '') + (o.glow ? ' glow' : '') + (o.chain ? ' chain' : '');
  div.style.setProperty('--suit', suit.color);
  const chainMark = o.chain ? '<span class="chain-mark">→</span>' : '';
  const resMark = o.resonance ? '<span class="res-mark">+2</span>' : '';
  div.innerHTML =
    '<div class="card-band"></div>' +
    '<div class="card-cost">' + card.cost + '</div>' +
    '<div class="card-icon">' + suit.svg + '</div>' +
    '<div class="card-name">' + card.name + '</div>' +
    '<div class="card-en">' + card.en + '</div>' +
    '<div class="card-watermark">' + suit.svg + '</div>' +
    '<div class="card-big">' + card.big + '</div>' +
    '<div class="card-text">' + card.text + '</div>' +
    '<div class="card-suit-name">' + suit.emoji + ' ' + suit.name + '</div>' +
    chainMark + resMark;
  if (o.onClick) div.addEventListener('click', o.onClick);
  if (o.rotate || o.selected) {
    const rot = o.rotate ? 'rotate(' + o.rotate + 'deg)' : '';
    const lift = o.selected ? ' translateY(-8px)' : '';
    div.style.transform = (rot + lift).trim();
  }
  return div;
}

// Punggung kartu lawan (biru gelap + bulan).
function cardBackElement() {
  const div = document.createElement('div');
  div.className = 'card-back';
  div.innerHTML = '<span class="back-moon">🌙</span><span class="back-text">SENJA</span>';
  return div;
}

// Baris Pedagang Tetap (v3): ubin horizontal — emoji + nama singkat +
// Serang/Darah besar, warna tepi mengikuti suit. Label opsional di atas.
function renderMerchants(container, merchants, label) {
  if (!container) return;
  container.innerHTML = '';
  if (label) {
    const lab = document.createElement('div');
    lab.className = 'merchant-label';
    lab.textContent = label;
    container.appendChild(lab);
  }
  const tiles = document.createElement('div');
  tiles.className = 'merchant-tiles';
  for (const m of merchants) {
    const suit = suitById(m.suit);
    const tile = document.createElement('div');
    tile.className = 'merchant-tile' + (m.ready ? '' : ' merchant-sleeping');
    tile.style.setProperty('--suit', suit.color);
    tile.title = m.name + ' — Serang ' + m.atk + ', Darah ' + m.hp + (m.ready ? '' : ' (baru dipanggil, belum menyerang)');
    tile.innerHTML =
      '<span class="mt-emoji">' + m.emoji + '</span>' +
      '<span class="mt-name">' + m.short + '</span>' +
      '<span class="mt-stats"><b class="mt-atk">⚔ ' + m.atk + '</b><b class="mt-hp">♥ ' + m.hp + '</b></span>';
    tiles.appendChild(tile);
  }
  container.appendChild(tiles);
}

function sideInfo(sideEl, name, stall, life, shield, isEnemy) {
  sideEl.querySelector('.side-name').textContent = name;
  sideEl.querySelector('.side-stall').textContent = stall;
  sideEl.querySelector('.side-life').textContent = '♥ ' + life;
  const sh = sideEl.querySelector('.side-shield');
  sh.textContent = shield > 0 ? '🛡 ' + shield : '🛡 0';
  sh.style.visibility = shield > 0 ? 'visible' : 'visible';
  sideEl.classList.toggle('enemy', !!isEnemy);
}

export function render(state, hooks) {
  hooks = hooks || {};
  const screen = state.phase === 'title' ? 'screen-title'
    : state.phase === 'win' ? 'screen-win'
    : state.phase === 'loss' ? 'screen-loss'
    : 'screen-table';
  for (const id of ['screen-title', 'screen-table', 'screen-win', 'screen-loss']) {
    const s = el(id);
    if (s) s.classList.toggle('hidden', id !== screen);
  }
  if (screen === 'screen-title') { renderTitle(state); return; }
  if (screen === 'screen-win') { renderEnd(state, true); return; }
  if (screen === 'screen-loss') { renderEnd(state, false); return; }
  renderTable(state, hooks);
}

function renderTitle(state) {
  // Kartu contoh di title screen diisi sekali oleh main.js (fillTitleCards).
}

function renderEnd(state, won) {
  const prefix = won ? 'win' : 'loss';
  const set = (id, v) => { const n = el(id); if (n) n.textContent = v; };
  set(prefix + '-life', won ? state.player.life : state.enemy.life);
  if (!won) set('loss-life-inline', state.enemy.life);
  set(prefix + '-round', state.round);
  set(prefix + '-score', state.score);
  set(prefix + '-stars', starsText(state.stars));
  const sub = el(prefix + '-sub');
  if (sub) {
    sub.textContent = won
      ? 'Reputasi tersisa ' + state.player.life + ' • Putaran ' + state.round + ' • Skor = Reputasi × 10 + bonus putaran cepat'
      : 'Reputasi lawan tersisa ' + state.enemy.life + ' • Putaran ' + state.round + ' • Kembang Api AI menutup game';
  }
  const fire = el('win-fireworks');
  if (fire) fire.style.display = won ? 'block' : 'none';
}

function renderTable(state, hooks) {
  const p = state.player;
  const e = state.enemy;

  // v3.1: indikator giliran digabung ke baris putaran (satu baris,
  // "PUTARAN 6 • GILIRANMU") — .turn-label disembunyikan di CSS supaya
  // tidak menumpuk badge intent / kartu tengah / panel Roda Senja.
  set('round-label', 'PUTARAN ' + state.round + (state.phase === 'player' ? ' • GILIRANMU' : state.phase === 'enemy' ? ' • GILIRAN JURAGAN' : ''));
  set('turn-label', '');

  sideInfo(el('enemy-info'), 'Juragan Bara', 'Lapak Bara Membara', e.life, e.shield, true);
  sideInfo(el('player-info'), 'Sari', 'Lapak Sari Senja', p.life, p.shield, false);

  const stars = el('player-stars');
  if (stars) stars.textContent = starsText(state.stars);
  const senja = el('senja-badge');
  if (senja) {
    const active = p.life <= 10;
    senja.style.display = active ? 'block' : 'none';
    if (active) senja.textContent = '🌇 SENJA TERAKHIR +1 KOIN, +2 SERANG';
  }

  set('coins-value', '🪙 ' + p.coins);
  set('coins-max', 'dari ' + p.coinsMax + ' Koin Senja');
  set('deck-count', String(p.deck.length));
  set('discard-count', String(p.discard.length));
  set('enemy-hand-count', 'Kartu lawan: ' + e.hand.length);

  // Tangan lawan (punggung kartu).
  const eh = el('enemy-hand');
  if (eh) {
    eh.innerHTML = '';
    const shown = Math.min(5, e.hand.length);
    for (let i = 0; i < shown; i++) eh.appendChild(cardBackElement());
  }

  // Baris Pedagang Tetap (v3) — ubin kecil: nama singkat + Serang/Darah besar.
  renderMerchants(el('enemy-merchants'), e.merchants, 'PEDAGANG JURAGAN');
  renderMerchants(el('player-merchants'), p.merchants, '');

  // Intent lawan.
  const intentBox = el('intent-badge');
  if (intentBox) {
    if (state.intent) {
      intentBox.style.display = 'flex';
      intentBox.style.background = state.intent.bg;
      intentBox.style.borderColor = state.intent.color;
      intentBox.querySelector('.intent-icon').textContent = state.intent.icon;
      intentBox.querySelector('.intent-text').textContent = state.intent.text;
      intentBox.querySelector('.intent-sub').textContent = state.intent.sub + ' • ' + state.intent.note;
      intentBox.style.color = state.intent.color;
    } else {
      intentBox.style.display = 'none';
    }
  }

  // Kartu terakhir lawan + kartu yang baru kamu mainkan.
  const lastE = el('last-enemy-card');
  if (lastE) {
    lastE.innerHTML = '';
    if (state.lastEnemyCard) {
      lastE.appendChild(cardElement(state.lastEnemyCard, {}));
      lastE.querySelector('.card').classList.add('mini');
    }
    const lab = lastE.querySelector('.center-label') || document.createElement('div');
    lab.className = 'center-label';
    lab.textContent = 'Terakhir dimainkan lawan';
    if (!lastE.contains(lab)) lastE.appendChild(lab);
  }
  const played = el('played-card');
  if (played) {
    played.innerHTML = '';
    if (state.lastPlayerCard) {
      played.appendChild(cardElement(state.lastPlayerCard, { glow: true }));
      played.querySelector('.card').classList.add('mini');
    }
    const lab = document.createElement('div');
    lab.className = 'center-label';
    lab.textContent = 'Kartu yang kamu mainkan';
    played.appendChild(lab);
  }

  // Banner kombo.
  const banner = el('combo-banner');
  if (banner) {
    if (state.banner) {
      banner.style.display = 'block';
      banner.textContent = state.banner;
    } else {
      banner.style.display = 'none';
    }
  }

  // Angka damage melayang: di samping kartu yang menyerang, di ruang
  // meja yang kosong — bukan di atas nama lawan (dulu menutupi namanya).
  const fl = el('floating-damage');
  if (fl) {
    if (state.floating) {
      fl.style.display = 'block';
      fl.textContent = state.floating.text;
      if (state.floating.target === 'enemy') {
        fl.style.left = '815px';
        fl.style.top = '320px';
      } else {
        fl.style.left = '330px';
        fl.style.top = '320px';
      }
    } else {
      fl.style.display = 'none';
    }
  }

  // Log terakhir — 3 baris, yang terbaru paling bawah dan paling terang.
  const log = el('log-line');
  if (log) {
    log.innerHTML = '';
    const lines = state.log.slice(-3);
    lines.forEach((line, i) => {
      const row = document.createElement('div');
      row.className = 'log-row' + (i < lines.length - 1 ? ' log-old' : '');
      row.textContent = line;
      log.appendChild(row);
    });
  }

  // Tangan pemain (kipas 5 kartu).
  const hand = el('player-hand');
  if (hand) {
    hand.innerHTML = '';
    const n = p.hand.length;
    p.hand.forEach((card, i) => {
      // Kipas 2°/kartu (dulu 3°): ujung kartu yang miring tidak lagi
      // menutupi baris terakhir log di atas tangan.
      const rotate = n > 1 ? (i - (n - 1) / 2) * 2 : 0;
      const boardFull = !!card.merchant && p.merchants.length >= MAX_MERCHANTS;
      const playable = card.cost <= p.coins && state.phase === 'player' && !boardFull;
      const resonance = p.played.some((pl) => pl.card.suit === card.suit);
      const chain = p.played.length > 0 && card.cost === p.played[p.played.length - 1].cost + 1;
      const cardEl = cardElement(card, {
        selected: state.selectedIndex === i,
        disabled: !playable,
        glow: playable,
        resonance,
        chain,
        rotate,
        onClick: () => { if (hooks.onCardClick) hooks.onCardClick(i); },
      });
      hand.appendChild(cardEl);
    });
  }

  // Tombol tutup lapak.
  const btn = el('btn-end-turn');
  if (btn) {
    btn.disabled = state.phase !== 'player';
    btn.textContent = state.phase === 'enemy' ? 'MENUNGGU…' : 'TUTUP LAPAK ⏎';
  }
}

function set(id, v) {
  const n = el(id);
  if (n) n.textContent = v;
}

export function positionDynamic(state) {
  const banner = el('combo-banner');
  if (banner) banner.style.cssText += ';' + rectStyle(LAYOUT.banner);
}
