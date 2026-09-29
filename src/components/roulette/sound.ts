'use client';

/** Tiny WebAudio synth for the reel: mechanical ticks and a landing chime. No assets. */
let ctx: AudioContext | null = null;

function ac() {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function tick(intensity = 1) {
  const a = ac();
  if (!a) return;
  const t = a.currentTime;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = 'square';
  o.frequency.setValueAtTime(2200 + Math.random() * 300, t);
  o.frequency.exponentialRampToValueAtTime(900, t + 0.025);
  g.gain.setValueAtTime(0.035 * intensity, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.035);
  o.connect(g).connect(a.destination);
  o.start(t);
  o.stop(t + 0.04);
}

export function chime() {
  const a = ac();
  if (!a) return;
  const t = a.currentTime;
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = 'triangle';
    o.frequency.value = f;
    const s = t + i * 0.07;
    g.gain.setValueAtTime(0.0001, s);
    g.gain.exponentialRampToValueAtTime(0.08, s + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, s + 1.1);
    o.connect(g).connect(a.destination);
    o.start(s);
    o.stop(s + 1.2);
  });
}

/** Must be called from a user gesture once so browsers allow audio. */
export function unlockAudio() {
  ac();
}
