// main.js — Bootstrap: init game, ganti layar (title -> meja -> menang/kalah),
// alur giliran pemain + AI, keyboard, tombol, staging ?shot=.

import { createGame, starsFor, scoreForWin, addLog } from './state.js';
import { startTurn, endTurnCleanup, playCard, checkWinner } from './hand.js';
import { planTurn } from './ai.js';
import { makeIntent } from './intent.js';
import { render, cardElement } from './render.js';
import { CARDS, cardById, suitById } from './cards.js';
import { makeInstance, DUPLICATES } from './deck.js';
import { stageShot } from './shots.js';
import { sfx } from './audio.js';

let state = createGame();
let staged = false;

function hooks() {
  return { onCardClick: onCardClick };
}

function show() {
  render(state, hooks());
}

function el(id) {
  return document.getElementById(id);
}

// ---------- Layar akhir ----------

function showEnd(winner) {
  state.winner = winner;
  if (winner === 'player') {
    state.phase = 'win';
    state.score = scoreForWin(state.player.life, state.round);
    state.stars = starsFor(state.player.life);
    sfx.win();
  } else {
    state.phase = 'loss';
    state.score = state.player.life * 10;
    state.stars = starsFor(state.player.life);
    sfx.lose();
  }
  show();
}

function maybeEnd() {
  const w = checkWinner(state);
  if (w) { showEnd(w); return true; }
  return false;
}

// ---------- Giliran pemain ----------

function startPlayerTurn() {
  state.phase = 'player';
  const msgs = startTurn(state, 'player');
  for (const m of msgs) addLog(state, m);
  addLog(state, 'PUTARAN ' + state.round + ' — GILIRANMU');
  // Intent lawan dihitung dari rencana nyata AI untuk giliran berikutnya.
  const plan = planTurn(state.enemy, state.player, state.round);
  state.intent = makeIntent(plan);
  state.aiPlan = plan.cards.map((c) => c.uid);
  state.selectedIndex = -1;
  if (maybeEnd()) return; // Pedagang bisa menutup game di awal giliran (v3)
  show();
}

function onCardClick(i) {
  if (state.phase !== 'player' || staged) return;
  if (state.selectedIndex === i) {
    playSelected();
    return;
  }
  state.selectedIndex = i;
  sfx.click();
  show();
}

function playSelected() {
  if (state.phase !== 'player' || state.selectedIndex < 0) return;
  const card = state.player.hand[state.selectedIndex];
  if (!card) return;
  const res = playCard(state, 'player', card.uid);
  if (!res.ok) {
    if (res.reason === 'no-coins') addLog(state, 'Koin tidak cukup untuk ' + card.name);
    else if (res.reason === 'board-full') addLog(state, 'Meja penuh — maksimal 3 Pedagang');
    show();
    return;
  }
  sfx.flip();
  for (const ev of res.events) {
    if (ev.type === 'damage') sfx.attack();
    else if (ev.type === 'shield') sfx.shield();
    else if (ev.type === 'heal') sfx.heal();
    else if (ev.type === 'combo') sfx.combo();
    else if (ev.type === 'draw') sfx.deal();
  }
  addLog(state, card.name + ' dimainkan');
  state.selectedIndex = -1;
  show();
  if (maybeEnd()) return;
  setTimeout(() => { state.floating = null; show(); }, 900);
  setTimeout(() => { state.banner = null; show(); }, 1600);
}

function endTurn() {
  if (state.phase !== 'player' || staged) return;
  endTurnCleanup(state, 'player');
  state.phase = 'enemy';
  show();
  runEnemyTurn();
}

// ---------- Giliran AI ----------

function runEnemyTurn() {
  const msgs = startTurn(state, 'enemy');
  for (const m of msgs) addLog(state, m);
  if (maybeEnd()) return; // Pedagang AI bisa menutup game di awal gilirannya (v3)
  // Pakai rencana yang sudah ditampilkan sebagai intent bila masih valid.
  let plan = null;
  if (state.aiPlan) {
    const cards = state.aiPlan
      .map((uid) => state.enemy.hand.find((c) => c.uid === uid))
      .filter(Boolean)
      .filter((c) => c.cost <= state.enemy.coins);
    if (cards.length > 0) plan = { cards };
  }
  if (!plan) {
    plan = planTurn(state.enemy, state.player, state.round);
  }
  const queue = plan.cards.slice(0, 6); // v2: rencana AI hasil simulasi bisa sampai 6 kartu (ekonomi + inti); potongan 3 kartu v1 membuang rencana itu.
  let i = 0;
  show();
  const step = () => {
    if (i >= queue.length) {
      endTurnCleanup(state, 'enemy');
      state.round += 1;
      startPlayerTurn();
      return;
    }
    const card = queue[i];
    i += 1;
    const res = playCard(state, 'enemy', card.uid);
    if (res.ok) {
      sfx.flip();
      for (const ev of res.events) {
        if (ev.type === 'damage') sfx.attack();
        else if (ev.type === 'shield') sfx.shield();
        else if (ev.type === 'heal') sfx.heal();
        else if (ev.type === 'combo') sfx.combo();
      }
      addLog(state, 'Juragan Bara memainkan ' + card.name);
    }
    show();
    if (maybeEnd()) return;
    setTimeout(() => { state.floating = null; show(); }, 900);
    setTimeout(step, 1100);
  };
  setTimeout(step, 700);
}

// ---------- Mulai / ulang ----------

function startGame() {
  state = createGame();
  staged = false;
  startPlayerTurn();
  sfx.deal();
}

function backToTitle() {
  state = createGame();
  staged = false;
  show();
}

// ---------- Title screen: 3 kartu contoh ----------

// ---------- Menu title (ala Hearthstone: Koleksi / Cara Main / Pengaturan) ----------

const OVERLAY_IDS = ['howto-panel', 'collection-panel', 'settings-panel'];
let colFilter = 'all';
let colBuilt = false;

function hideOverlays() {
  for (const id of OVERLAY_IDS) { const n = el(id); if (n) n.classList.add('hidden'); }
}
function showOverlay(id) {
  hideOverlays();
  const n = el(id);
  if (n) n.classList.remove('hidden');
}
function toggleOverlay(id) {
  const n = el(id);
  if (n && !n.classList.contains('hidden')) hideOverlays();
  else showOverlay(id);
}
function syncMuteLabels() {
  const m = sfx.isMuted();
  const b1 = el('mute-btn');
  if (b1) b1.textContent = m ? '🔇 Bisu' : '🔊 Suara';
  const b2 = el('btn-mute-setting');
  if (b2) b2.textContent = m ? '🔇 SUARA: BISU' : '🔊 SUARA: NYALA';
}

// Koleksi: 28 kartu unik (4 di antaranya ×2 di deck 36 kartu). Grid kecil +
// detail kartu penuh saat diklik; filter per suit.
function fillCollection() {
  const grid = el('col-grid');
  const filters = el('col-filters');
  if (!grid || !filters || colBuilt) return;
  colBuilt = true;
  const counts = {};
  for (const id of DUPLICATES) counts[id] = 2;
  const suits = [
    { id: 'all', name: 'Semua', emoji: '🃏' },
    { id: 'lampion', name: 'Lampion', emoji: '🔥' },
    { id: 'ombak', name: 'Ombak', emoji: '🌊' },
    { id: 'daun', name: 'Daun', emoji: '🌿' },
    { id: 'bulan', name: 'Bulan', emoji: '🌙' },
  ];
  for (const s of suits) {
    const chip = document.createElement('button');
    chip.className = 'col-chip' + (s.id === 'all' ? ' active' : '');
    chip.textContent = s.emoji + ' ' + s.name;
    chip.addEventListener('click', () => {
      colFilter = s.id;
      filters.querySelectorAll('.col-chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      renderCollectionTiles(counts);
      sfx.click();
    });
    filters.appendChild(chip);
  }
  renderCollectionTiles(counts);
  // Detail awal: kartu pertama.
  const first = CARDS[0];
  if (first) showCollectionDetail(first, counts);
}

function renderCollectionTiles(counts) {
  const grid = el('col-grid');
  if (!grid) return;
  grid.innerHTML = '';
  for (const def of CARDS) {
    if (colFilter !== 'all' && def.suit !== colFilter) continue;
    const suit = suitById(def.suit);
    const tile = document.createElement('button');
    tile.className = 'col-tile';
    tile.style.setProperty('--suit', suit.color);
    tile.innerHTML =
      '<span class="col-tile-cost">' + def.cost + '</span>' +
      '<span><span class="col-tile-name">' + def.name + '</span><br>' +
      '<span class="col-tile-sub">' + suit.emoji + ' ' + suit.name + '</span></span>' +
      (counts[def.id] ? '<span class="col-tile-count">×2</span>' : '') +
      '<span class="col-tile-big">' + def.big + '</span>';
    tile.addEventListener('click', () => {
      grid.querySelectorAll('.col-tile').forEach((t) => t.classList.remove('selected'));
      tile.classList.add('selected');
      showCollectionDetail(def, counts);
      sfx.click();
    });
    grid.appendChild(tile);
  }
}

function showCollectionDetail(def, counts) {
  const detail = el('col-detail');
  if (!detail) return;
  detail.innerHTML = '';
  detail.appendChild(cardElement(makeInstance(def), {}));
  const suit = suitById(def.suit);
  const info = document.createElement('div');
  info.className = 'col-detail-text';
  let html = '<b>' + def.name + '</b> — ' + suit.emoji + ' ' + suit.name +
    '<br>Biaya: <b>' + def.cost + ' Koin</b> • Di deck: <b>×' + (counts[def.id] || 1) + '</b>';
  if (def.merchant) {
    html += '<br>Pedagang Tetap: Serang <b>' + def.merchant.atk + '</b>, Darah <b>' + def.merchant.hp + '</b>. Menetap di meja, menyerang tiap giliran.';
  } else {
    html += '<br>' + def.text;
  }
  info.innerHTML = html;
  detail.appendChild(info);
}

function fillTitleCards() {
  const box = el('title-cards');
  if (!box || box.hasChildNodes()) return;
  for (const id of ['sate', 'panen-raya', 'bulan-purnama']) {
    const def = cardById(id);
    if (def) box.appendChild(cardElement(makeInstance(def), {}));
  }
}

// ---------- Keyboard ----------

function onKey(e) {
  if (staged) return;
  const k = e.key.toLowerCase();
  if (k === 'escape') { hideOverlays(); return; }
  if (k === 'm') {
    const m = sfx.toggleMute();
    syncMuteLabels();
    return;
  }
  if (state.phase === 'player') {
    if (k >= '1' && k <= '8') {
      const idx = Number(k) - 1;
      if (idx < state.player.hand.length) { state.selectedIndex = idx; sfx.click(); show(); }
    } else if (k === 'enter') {
      e.preventDefault();
      playSelected();
    } else if (k === ' ') {
      e.preventDefault();
      endTurn();
    }
  }
  if ((state.phase === 'win' || state.phase === 'loss') && k === 'r') startGame();
}

// ---------- Init ----------

function init() {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  if (shot) {
    state = stageShot(shot);
    staged = true;
    // Bekukan angka damage melayang di staging meja (animasi floatUp
    // memudar setelah 0,9 dtk; di screenshot ia harus tetap terlihat).
    document.body.dataset.shot = shot;
  }
  fillTitleCards();
  fillCollection();
  syncMuteLabels();
  const bind = (id, fn) => { const n = el(id); if (n) n.addEventListener('click', fn); };
  bind('btn-start', () => { sfx.click(); startGame(); });
  bind('btn-howto', () => { toggleOverlay('howto-panel'); sfx.click(); });
  bind('btn-collection', () => { toggleOverlay('collection-panel'); sfx.click(); });
  bind('btn-settings', () => { syncMuteLabels(); toggleOverlay('settings-panel'); sfx.click(); });
  bind('btn-close-howto', () => { hideOverlays(); sfx.click(); });
  bind('btn-close-collection', () => { hideOverlays(); sfx.click(); });
  bind('btn-close-settings', () => { hideOverlays(); sfx.click(); });
  bind('btn-mute-setting', () => { sfx.toggleMute(); syncMuteLabels(); sfx.click(); });
  bind('btn-end-turn', () => { sfx.click(); endTurn(); });
  bind('btn-again-win', () => { sfx.click(); startGame(); });
  bind('btn-menu-win', () => { sfx.click(); backToTitle(); });
  bind('btn-again-loss', () => { sfx.click(); startGame(); });
  bind('btn-menu-loss', () => { sfx.click(); backToTitle(); });
  bind('mute-btn', () => {
    sfx.toggleMute();
    syncMuteLabels();
  });
  bind('center-area', () => { if (state.selectedIndex >= 0) playSelected(); });
  document.addEventListener('keydown', onKey);
  show();
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
}

export { startGame, backToTitle };
