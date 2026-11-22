// deck.js — Kocok Keranjang, draw, buang ke Kotak Sisa, isi ulang (MURNI).
// Deck 36 kartu: 28 unik + 8 duplikat kartu serang murah (§2, §6A).

import { CARDS, cardById } from './cards.js';

const DUPLICATES = ['obor', 'sate', 'ikan', 'timbangan'];

export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = a[i];
    a[i] = a[j];
    a[j] = t;
  }
  return a;
}

let uidCounter = 0;
export function makeInstance(def) {
  uidCounter += 1;
  return { uid: def.id + '-' + uidCounter, ...def };
}

export function buildDeck() {
  const defs = CARDS.slice();
  for (const id of DUPLICATES) {
    const def = cardById(id);
    if (def) defs.push(def);
  }
  return shuffle(defs.map((d) => makeInstance(d)));
}

// Tarik n kartu dari deck pemilik. Deck habis -> kocok ulang dari discard.
// Deck + discard sama-sama kosong -> fatigue (pemilik kehilangan 1 Reputasi).
export function drawFromDeck(side, n) {
  const drawn = [];
  const messages = [];
  let fatigue = false;
  for (let i = 0; i < n; i++) {
    if (side.deck.length === 0) {
      if (side.discard.length > 0) {
        side.deck = shuffle(side.discard);
        side.discard = [];
        messages.push('Keranjang diisi ulang dari Kotak Sisa');
      } else {
        fatigue = true;
        messages.push('Kelelahan — tidak ada kartu tersisa');
        break;
      }
    }
    drawn.push(side.deck.pop());
  }
  return { drawn, messages, fatigue };
}

// Buang n kartu acak dari tangan ke discard. Mengembalikan kartu yang dibuang.
export function discardRandom(side, n) {
  const out = [];
  for (let i = 0; i < n && side.hand.length > 0; i++) {
    const idx = Math.floor(Math.random() * side.hand.length);
    const card = side.hand.splice(idx, 1)[0];
    side.discard.push(card);
    out.push(card);
  }
  return out;
}
