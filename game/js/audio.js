// audio.js — Semua suara WebAudio synth + tombol bisu (nol file eksternal).
// Sumber: CONCEPT.md §8. Oscillator + noise buffer yang dibuat di kode.

let ctx = null;
let muted = false;

function ac() {
  if (typeof window === 'undefined') return null;
  try {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch (e) {
    return null;
  }
}

function tone(freq, dur, type, vol, delay) {
  const c = ac();
  if (!c || muted) return;
  try {
    const t0 = c.currentTime + (delay || 0);
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(vol || 0.12, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g);
    g.connect(c.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  } catch (e) { /* suara tidak boleh mematikan game */ }
}

function toneSlide(f0, f1, dur, type, vol) {
  const c = ac();
  if (!c || muted) return;
  try {
    const t0 = c.currentTime;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type || 'sawtooth';
    o.frequency.setValueAtTime(f0, t0);
    o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t0 + dur);
    g.gain.setValueAtTime(vol || 0.12, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g);
    g.connect(c.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  } catch (e) { /* abaikan */ }
}

function noiseBurst(dur, vol, freq) {
  const c = ac();
  if (!c || muted) return;
  try {
    const len = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource();
    src.buffer = buf;
    const filter = c.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = freq || 800;
    const g = c.createGain();
    g.gain.value = vol || 0.1;
    src.connect(filter);
    filter.connect(g);
    g.connect(c.destination);
    src.start();
  } catch (e) { /* abaikan */ }
}

export const sfx = {
  click() { tone(660, 0.06, 'sine', 0.12); },
  deal() { noiseBurst(0.12, 0.08, 900); },
  flip() { tone(440, 0.05, 'sine', 0.1); tone(880, 0.05, 'sine', 0.1, 0.05); },
  attack() { toneSlide(220, 90, 0.25, 'sawtooth', 0.14); noiseBurst(0.2, 0.1, 300); },
  shield() { tone(520, 0.2, 'sine', 0.1); tone(780, 0.2, 'sine', 0.06, 0.05); },
  heal() { tone(523, 0.12, 'sine', 0.1); tone(659, 0.12, 'sine', 0.1, 0.1); tone(784, 0.16, 'sine', 0.1, 0.2); },
  combo() { tone(784, 0.09, 'sine', 0.12); tone(988, 0.09, 'sine', 0.12, 0.08); tone(1175, 0.09, 'sine', 0.12, 0.16); tone(1568, 0.16, 'sine', 0.12, 0.24); },
  win() { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.22, 'sine', 0.13, i * 0.14)); },
  lose() { tone(392, 0.25, 'sine', 0.12); tone(311, 0.25, 'sine', 0.12, 0.22); tone(233, 0.4, 'sine', 0.12, 0.44); },
  toggleMute() {
    muted = !muted;
    return muted;
  },
  isMuted() { return muted; },
  setMuted(m) { muted = !!m; },
};
