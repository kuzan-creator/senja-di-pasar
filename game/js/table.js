// table.js — Layout meja 1280x800 (koordinat elemen utama, CONCEPT.md §7).
// Dipakai render.js untuk memosisikan elemen dinamis (banner, angka melayang,
// kartu tengah meja). Posisi statis diatur di css/style.css dengan angka yang sama.

export const TABLE = { width: 1280, height: 800 };

export const LAYOUT = {
  enemyInfo: { x: 24, y: 24, w: 300, h: 96 },
  enemyHand: { x: 380, y: 16, w: 520, h: 110 },
  roundLabel: { x: 540, y: 130, w: 200, h: 28 },
  intentBadge: { x: 510, y: 140, w: 260, h: 72 },
  wheelMini: { x: 800, y: 140, w: 150, h: 72 },
  centerArea: { x: 380, y: 240, w: 520, h: 240 },
  lastEnemyCard: { x: 470, y: 260, w: 150, h: 210 },
  playedCard: { x: 660, y: 260, w: 150, h: 210 },
  banner: { x: 340, y: 470, w: 600, h: 48 },
  playerInfo: { x: 24, y: 640, w: 285, h: 120 },
  deckPile: { x: 24, y: 540, w: 110, h: 90 },
  discardPile: { x: 1146, y: 540, w: 110, h: 90 },
  playerHand: { x: 310, y: 580, w: 680, h: 210 },
  coinsBox: { x: 980, y: 545, w: 160, h: 60 },
  endTurnButton: { x: 1020, y: 700, w: 220, h: 64 },
  logLine: { x: 340, y: 520, w: 600, h: 24 },
};

export function rectStyle(r) {
  return 'left:' + r.x + 'px;top:' + r.y + 'px;width:' + r.w + 'px;height:' + r.h + 'px;';
}
