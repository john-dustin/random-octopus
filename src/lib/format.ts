// Client-safe formatting helpers.

/**
 * IMDb's image CDN resizes on the fly via URL modifiers.
 * img(url, 400)        → 400px wide
 * img(url, 400, 600)   → at least 600px tall (frame with object-cover)
 */
export function img(url: string | undefined | null, w: number, h?: number): string | undefined {
  if (!url) return undefined;
  if (!url.includes('m.media-amazon.com')) return url;
  const base = url.replace(/\._V1_.*?(\.(jpe?g|png|webp))$/i, '$1').replace(/(\.(jpe?g|png|webp))$/i, '');
  const ext = url.match(/\.(jpe?g|png|webp)$/i)?.[0] ?? '.jpg';
  // No CDN crop (it pads with white when the source aspect doesn't cover the box);
  // scale along the dominant axis and let CSS object-cover do the framing.
  const mod = h && h > w ? `QL80_UY${h}_` : `QL80_UX${w}_`;
  return `${base}._V1_${mod}${ext}`;
}

/**
 * Poster at a given width. Deliberately no CDN crop: IMDb pads (white) when the
 * source is wider than the crop box, so framing is left to CSS object-cover.
 */
export const poster = (url: string | undefined, w = 342) => img(url, w);

export function runtime(sec?: number | null): string | undefined {
  if (!sec) return undefined;
  const m = Math.round(sec / 60);
  const h = Math.floor(m / 60);
  return h ? `${h}h ${String(m % 60).padStart(2, '0')}m` : `${m}m`;
}

export function compact(n?: number | null): string | undefined {
  if (n == null) return undefined;
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: n >= 1e6 ? 1 : 0 }).format(n);
}

export function money(n?: number | null, currency = 'USD'): string | undefined {
  if (n == null) return undefined;
  return new Intl.NumberFormat('en', { style: 'currency', currency, notation: 'compact', maximumFractionDigits: 1 }).format(n);
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function date(d?: { day?: number; month?: number; year?: number } | null, long = false): string | undefined {
  if (!d?.year) return undefined;
  if (!d.month) return String(d.year);
  const m = long
    ? new Date(2000, d.month - 1, 1).toLocaleString('en', { month: 'long' })
    : MONTHS[d.month - 1];
  return d.day ? `${m} ${d.day}, ${d.year}` : `${m} ${d.year}`;
}

export function daysUntil(d?: { day?: number; month?: number; year?: number } | null): number | undefined {
  if (!d?.year || !d.month) return undefined;
  const target = new Date(d.year, d.month - 1, d.day || 1).getTime();
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((target - now.getTime()) / 86400000);
}

export function years(y?: number, end?: number, series?: boolean): string {
  if (!y) return '';
  if (!series) return String(y);
  return end ? (end === y ? String(y) : `${y}–${end}`) : `${y}–`;
}

export function age(born?: { year?: number; month?: number; day?: number }, died?: { year?: number; month?: number; day?: number }) {
  if (!born?.year) return undefined;
  const end = died?.year ? new Date(died.year, (died.month || 1) - 1, died.day || 1) : new Date();
  const start = new Date(born.year, (born.month || 1) - 1, born.day || 1);
  let a = end.getFullYear() - start.getFullYear();
  if (end < new Date(end.getFullYear(), start.getMonth(), start.getDate())) a--;
  return a;
}

/** Rating → colour along the iOS system palette: red → orange → yellow → green → mint. */
const RAMP: [number, [number, number, number]][] = [
  [1, [255, 69, 58]],    // systemRed
  [5, [255, 159, 10]],   // systemOrange
  [6.5, [255, 214, 10]], // systemYellow
  [7.6, [48, 209, 88]],  // systemGreen
  [8.8, [99, 230, 226]], // systemMint
];

export function ratingColor(r?: number | null): string {
  if (r == null) return 'rgb(142 142 147)'; // systemGray
  const v = Math.max(1, Math.min(8.8, r));
  for (let i = 1; i < RAMP.length; i++) {
    const [r1, c1] = RAMP[i - 1];
    const [r2, c2] = RAMP[i];
    if (v <= r2) {
      const t = (v - r1) / (r2 - r1);
      const c = c1.map((x, k) => Math.round(x + (c2[k] - x) * t));
      return `rgb(${c[0]} ${c[1]} ${c[2]})`;
    }
  }
  return 'rgb(99 230 226)';
}

export const titleHref = (id: string) => `/title/${id}`;
export const nameHref = (id: string) => `/name/${id}`;

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(' ');
}
