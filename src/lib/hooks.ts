'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';

const noop = () => () => {};

/** False during SSR + hydration, true afterwards. Use to gate localStorage-backed UI. */
export function useMounted() {
  return useSyncExternalStore(noop, () => true, () => false);
}

/** Dominant, reasonably saturated colour of an image as an "r g b" triplet. */
export function useImageColor(url?: string | null, fallback = '143 212 107') {
  const [color, setColor] = useState(fallback);
  useEffect(() => {
    if (!url) return;
    let alive = true;
    extractColor(url).then((c) => alive && c && setColor(c));
    return () => {
      alive = false;
    };
  }, [url]);
  return color;
}

const colorCache = new Map<string, Promise<string | null>>();

export function extractColor(url: string): Promise<string | null> {
  if (colorCache.has(url)) return colorCache.get(url)!;
  const p = new Promise<string | null>((resolve) => {
    const im = new Image();
    im.crossOrigin = 'anonymous';
    im.onload = () => {
      try {
        const S = 48;
        const c = document.createElement('canvas');
        c.width = S;
        c.height = S;
        const ctx = c.getContext('2d', { willReadFrequently: true })!;
        ctx.drawImage(im, 0, 0, S, S);
        const { data } = ctx.getImageData(0, 0, S, S);
        // Bucket by hue, weight by saturation × mid-luminance, pick the strongest bucket.
        const buckets = new Map<number, { w: number; r: number; g: number; b: number }>();
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2];
          const max = Math.max(r, g, b), min = Math.min(r, g, b);
          const l = (max + min) / 510;
          const s = max === min ? 0 : (max - min) / (255 - Math.abs(max + min - 255));
          if (l < 0.12 || l > 0.9 || s < 0.22) continue;
          let h = 0;
          if (max === r) h = ((g - b) / (max - min)) % 6;
          else if (max === g) h = (b - r) / (max - min) + 2;
          else h = (r - g) / (max - min) + 4;
          const key = Math.round(((h * 60 + 360) % 360) / 24);
          const w = s * (1 - Math.abs(l - 0.5) * 1.6);
          const bk = buckets.get(key) ?? { w: 0, r: 0, g: 0, b: 0 };
          bk.w += w; bk.r += r * w; bk.g += g * w; bk.b += b * w;
          buckets.set(key, bk);
        }
        let best: { w: number; r: number; g: number; b: number } | null = null;
        for (const bk of buckets.values()) if (!best || bk.w > best.w) best = bk;
        if (!best || best.w < 2) return resolve(null);
        let r = best.r / best.w, g = best.g / best.w, b = best.b / best.w;
        // Lift so it reads as an accent on near-black.
        const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        if (lum < 130) {
          const k = 130 / Math.max(lum, 1);
          r = Math.min(255, r * k); g = Math.min(255, g * k); b = Math.min(255, b * k);
        }
        resolve(`${Math.round(r)} ${Math.round(g)} ${Math.round(b)}`);
      } catch {
        resolve(null);
      }
    };
    im.onerror = () => resolve(null);
    im.src = url.replace(/\._V1_.*?(\.\w+)$/, '._V1_QL50_UX64_$1');
  });
  colorCache.set(url, p);
  return p;
}

/** Keyboard shortcut helper. */
export function useHotkey(key: string, fn: (e: KeyboardEvent) => void, opts: { meta?: boolean } = {}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (opts.meta && !(e.metaKey || e.ctrlKey)) return;
      if (!opts.meta) {
        const t = e.target as HTMLElement;
        if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      }
      if (e.key.toLowerCase() === key.toLowerCase()) fn(e);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [key, fn, opts.meta]);
}
