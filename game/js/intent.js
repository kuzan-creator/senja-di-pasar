// intent.js — Hitung + tampilkan intent lawan (MURNI).
// Sumber: CONCEPT.md §5. Lencana 260x72 di sisi lawan: jenis aksi + angka.
// Angka adalah rencana nyata AI; teks kecil "Perkiraan — bisa meleset 2".

export const INTENT_STYLE = {
  attack: { color: '#E8442E', bg: '#5A1410', icon: '🔥', en: 'WILL ATTACK' },
  shield: { color: '#7FB3FF', bg: '#12294A', icon: '🛡', en: 'WILL SHIELD' },
  heal: { color: '#3DDC84', bg: '#0E3D24', icon: '✚', en: 'WILL HEAL' },
  draw: { color: '#9AD7FF', bg: '#12303F', icon: '▤', en: 'WILL DRAW' },
};

export function intentText(kind, value) {
  switch (kind) {
    case 'attack': return 'AKAN MENYERANG ' + value;
    case 'shield': return 'AKAN BERTAHAN +' + value;
    case 'heal': return 'AKAN MEMULIHKAN ' + value;
    case 'draw': return 'AKAN DRAW ' + value;
    default: return 'MENUNGGU…';
  }
}

export function intentSub(kind) {
  return INTENT_STYLE[kind] ? INTENT_STYLE[kind].en : '';
}

// Bentuk intent lengkap dari rencana AI (lihat ai.js planTurn).
export function makeIntent(plan) {
  const style = INTENT_STYLE[plan.kind] || INTENT_STYLE.draw;
  return {
    kind: plan.kind,
    value: plan.value,
    mood: plan.mood,
    text: intentText(plan.kind, plan.value),
    sub: style.en,
    icon: style.icon,
    color: style.color,
    bg: style.bg,
    note: 'Perkiraan — bisa meleset 2',
  };
}
