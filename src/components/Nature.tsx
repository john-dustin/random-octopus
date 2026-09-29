/*
 * iOS dark-mode system colours, used for small semantic accents
 * (genre tiles, chart categories). Stable per key.
 */

export const PALETTE = ['var(--pine)', 'var(--sky)', 'var(--gold)', 'var(--bloom)', 'var(--lavender)', 'var(--lagoon)', 'var(--poppy)', 'var(--moss)'] as const;

export function toneFor(key: string) {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}
