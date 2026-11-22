// cards.js — Data 28 kartu unik + 4 suit (MURNI, tanpa DOM).
// Sumber: CONCEPT.md §3. Nama Indonesia + subtitle Inggris, biaya 0-5.

export const SUITS = [
  {
    id: 'lampion',
    name: 'Lampion',
    en: 'LANTERN',
    emoji: '🔥',
    color: '#E8442E',
    role: 'Serang — damage besar',
    svg: '<svg viewBox="0 0 64 64" aria-hidden="true"><line x1="32" y1="4" x2="32" y2="12" stroke="#E8442E" stroke-width="3"/><rect x="20" y="12" width="24" height="40" rx="10" fill="#E8442E"/><line x1="25" y1="17" x2="25" y2="47" stroke="#FFF7E8" stroke-width="2" opacity="0.8"/><line x1="32" y1="17" x2="32" y2="47" stroke="#FFF7E8" stroke-width="2" opacity="0.8"/><line x1="39" y1="17" x2="39" y2="47" stroke="#FFF7E8" stroke-width="2" opacity="0.8"/></svg>',
  },
  {
    id: 'ombak',
    name: 'Ombak',
    en: 'WAVE',
    emoji: '🌊',
    color: '#1E90D6',
    role: 'Serang + draw / ganggu',
    svg: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M8 20 Q16 12 24 20 T40 20 T56 20" fill="none" stroke="#1E90D6" stroke-width="4" stroke-linecap="round"/><path d="M8 32 Q16 24 24 32 T40 32 T56 32" fill="none" stroke="#1E90D6" stroke-width="4" stroke-linecap="round"/><path d="M8 44 Q16 36 24 44 T40 44 T56 44" fill="none" stroke="#1E90D6" stroke-width="4" stroke-linecap="round"/></svg>',
  },
  {
    id: 'daun',
    name: 'Daun',
    en: 'LEAF',
    emoji: '🌿',
    color: '#2FA84F',
    role: 'Bertahan + heal',
    svg: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 6 C50 20 50 44 32 58 C14 44 14 20 32 6Z" fill="#2FA84F"/><line x1="32" y1="12" x2="32" y2="52" stroke="#FFF7E8" stroke-width="2" opacity="0.8"/><line x1="32" y1="24" x2="42" y2="18" stroke="#FFF7E8" stroke-width="2" opacity="0.6"/><line x1="32" y1="34" x2="22" y2="28" stroke="#FFF7E8" stroke-width="2" opacity="0.6"/></svg>',
  },
  {
    id: 'bulan',
    name: 'Bulan',
    en: 'MOON',
    emoji: '🌙',
    color: '#F2B705',
    role: 'Ekonomi + serang fleksibel',
    svg: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M42 6 A26 26 0 1 0 42 58 A20 20 0 1 1 42 6Z" fill="#F2B705"/><circle cx="46" cy="46" r="9" fill="#F2B705" stroke="#B8860B" stroke-width="2"/></svg>',
  },
];

export function suitById(id) {
  return SUITS.find((s) => s.id === id) || SUITS[0];
}

// Efek: dmg, shield, heal, draw, coins (giliran ini), coinsNext (giliran depan),
// burn (damage di putaran berikut), discardEnemy, breakShield, pierce,
// discardSelf, special ('lelang' | 'juragan').
export const CARDS = [
  { id: 'obor', name: 'Obor Keliling', en: '3 DMG', suit: 'lampion', cost: 1, dmg: 3, text: 'Serang 3. Pembuka paling murah.', big: '⚔ 3' },
  { id: 'arang', name: 'Arang Panas', en: '2 DMG + BURN 2', suit: 'lampion', cost: 1, dmg: 2, burn: 2, text: 'Bara yang terus menyala.', big: '⚔ 2' },
  { id: 'sate', name: 'Sate Membara', en: '5 DMG', suit: 'lampion', cost: 2, dmg: 5, text: 'Serang 5.', big: '⚔ 5' },
  { id: 'cabai', name: 'Cabai Rawit', en: '4 DMG PIERCE', suit: 'lampion', cost: 2, dmg: 4, pierce: true, text: 'Pedasnya menembus terpal.', big: '⚔ 4' },
  { id: 'mercon', name: 'Mercon Senja', en: '6 DMG', suit: 'lampion', cost: 3, dmg: 6, text: 'Serang 6.', big: '⚔ 6' },
  { id: 'lampion-raksasa', name: 'Lampion Raksasa', en: '7 DMG', suit: 'lampion', cost: 4, dmg: 7, text: 'Serang 7.', big: '⚔ 7' },
  { id: 'kembang-api', name: 'Kembang Api', en: '9 DMG', suit: 'lampion', cost: 5, dmg: 9, discardSelf: 1, text: 'Serang 9. Buang 1 kartu.', big: '⚔ 9' },
  { id: 'es-batu', name: 'Es Batu', en: 'SHIELD 3 + DRAW 1', suit: 'ombak', cost: 1, shield: 3, draw: 1, text: 'Perisai 3. Ambil 1 kartu.', big: '🛡 3' },
  { id: 'ikan', name: 'Ikan Segar', en: '2 DMG + DRAW 1', suit: 'ombak', cost: 1, dmg: 2, draw: 1, text: 'Serang 2. Ambil 1 kartu.', big: '⚔ 2' },
  { id: 'jala', name: 'Jala Nelayan', en: '3 DMG + DISCARD', suit: 'ombak', cost: 2, dmg: 3, discardEnemy: 1, text: 'Serang 3. Lawan buang 1 kartu.', big: '⚔ 3' },
  { id: 'ombak-pasar', name: 'Ombak Pasar', en: '4 DMG + BREAK 3', suit: 'ombak', cost: 2, dmg: 4, breakShield: 3, text: 'Serang 4. Hancurkan 3 perisai.', big: '⚔ 4' },
  { id: 'hujan', name: 'Hujan Gerimis', en: 'HEAL 5 + 2 DMG', suit: 'ombak', cost: 3, heal: 5, dmg: 2, text: 'Pulih 5. Serang 2.', big: '✚ 5' },
  { id: 'perahu', name: 'Perahu Layar', en: '5 DMG + DRAW 1', suit: 'ombak', cost: 3, dmg: 5, draw: 1, text: 'Serang 5. Ambil 1 kartu.', big: '⚔ 5' },
  { id: 'badai', name: 'Badai Pesisir', en: '6 DMG + DISCARD 2', suit: 'ombak', cost: 5, dmg: 6, discardEnemy: 2, text: 'Serang 6. Lawan buang 2 kartu.', big: '⚔ 6' },
  { id: 'daun-pisang', name: 'Daun Pisang', en: 'SHIELD 4', suit: 'daun', cost: 1, shield: 4, text: 'Perisai 4.', big: '🛡 4' },
  { id: 'rempah', name: 'Rempah Wangi', en: '+1 COIN NEXT', suit: 'daun', cost: 1, coinsNext: 1, text: 'Koin +1 giliran depan.', big: '🪙 1' },
  { id: 'jamu', name: 'Jamu Kunyit', en: 'HEAL 5', suit: 'daun', cost: 2, heal: 5, text: 'Pulih 5.', big: '✚ 5' },
  { id: 'sayur', name: 'Sayur Segar', en: 'SHIELD 5 + DRAW 1', suit: 'daun', cost: 2, shield: 5, draw: 1, text: 'Perisai 5. Ambil 1 kartu.', big: '🛡 5' },
  { id: 'pohon-mangga', name: 'Pohon Mangga', en: 'HEAL 7 + SHIELD 2', suit: 'daun', cost: 3, heal: 7, shield: 2, text: 'Pulih 7. Perisai 2.', big: '✚ 7' },
  { id: 'kebun', name: 'Kebun Tetangga', en: 'HEAL 4 + DRAW 2', suit: 'daun', cost: 3, heal: 4, draw: 2, text: 'Pulih 4. Ambil 2 kartu.', big: '✚ 4' },
  { id: 'panen-raya', name: 'Panen Raya', en: 'HEAL 8 + SHIELD 4', suit: 'daun', cost: 5, heal: 8, shield: 4, text: 'Pulih 8. Perisai 4.', big: '✚ 8' },
  { id: 'koin-receh', name: 'Koin Receh', en: '+1 COIN', suit: 'bulan', cost: 0, coins: 1, text: 'Gratis. Koin +1 sekarang.', big: '🪙 1' },
  { id: 'dompet', name: 'Dompet Kulit', en: 'DRAW 1', suit: 'bulan', cost: 1, draw: 1, text: 'Ambil 1 kartu.', big: '▤ 1' },
  { id: 'tabungan', name: 'Tabungan Senja', en: 'SHIELD 4 + COIN 1', suit: 'bulan', cost: 2, shield: 4, coins: 1, text: 'Perisai 4. Koin +1.', big: '🛡 4' },
  { id: 'timbangan', name: 'Timbangan Adil', en: '3 DMG + COIN 1', suit: 'bulan', cost: 2, dmg: 3, coins: 1, text: 'Serang 3. Koin +1.', big: '⚔ 3' },
  { id: 'lelang', name: 'Lelang Kilat', en: '5 DMG', suit: 'bulan', cost: 3, dmg: 5, special: 'lelang', text: 'Serang 5. Lawan sekarat: +2 koin.', big: '⚔ 5' },
  { id: 'juragan-datang', name: 'Juragan Datang', en: '7 DMG', suit: 'bulan', cost: 4, dmg: 7, special: 'juragan', text: 'Serang 7. Hancurkan terpal: +2 koin.', big: '⚔ 7' },
  { id: 'bulan-purnama', name: 'Bulan Purnama', en: '8 DMG + HEAL 5', suit: 'bulan', cost: 5, dmg: 8, heal: 5, text: 'Serang 8. Pulih 5.', big: '⚔ 8' },
];

export function cardById(id) {
  return CARDS.find((c) => c.id === id) || null;
}

// Kartu heal murni (tanpa damage) — dipakai batasan heal AI (§5).
export function isPureHeal(card) {
  return (card.heal || 0) > 0 && (card.dmg || 0) === 0;
}

export function isAttack(card) {
  return (card.dmg || 0) > 0;
}
