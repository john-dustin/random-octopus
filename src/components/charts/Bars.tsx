'use client';

import { useState } from 'react';
import { cx } from '@/lib/format';

/*
 * Bar primitives. Ordered data (decades) gets a sequential botanical ramp,
 * categories (genres) one hue each; a fixed colour can be passed. Thin marks with a
 * 4px rounded data-end and a square baseline, hairline axis, a hover tooltip
 * per bar, and an sr-only table so nothing is colour- or hover-gated.
 */

export type Datum = { key: string; label: string; value: number; hint?: string };

/** A bar colour: one fixed hue, or a function of the bar's position. */
type Paint = string | ((i: number, n: number) => string);
const paint = (p: Paint, i: number, n: number) => (typeof p === 'function' ? p(i, n) : p);

// Ordered data → a sequential lagoon → fern → moss → sunflower ramp that reads as time passing.
const RAMP = ['var(--lagoon)', 'var(--leaf)', 'var(--moss)', 'var(--gold)'];
export const timeRamp: Paint = (i, n) => {
  const t = n <= 1 ? 1 : i / (n - 1);
  const k = Math.min(RAMP.length - 2, Math.floor(t * (RAMP.length - 1)));
  const f = t * (RAMP.length - 1) - k;
  return `color-mix(in oklch, ${RAMP[k]} ${Math.round((1 - f) * 100)}%, ${RAMP[k + 1]})`;
};

// Categories → one botanical hue each.
const CATS = ['var(--leaf)', 'var(--bloom)', 'var(--sky)', 'var(--gold)', 'var(--lavender)', 'var(--lagoon)', 'var(--poppy)', 'var(--moss)'];
export const categorical: Paint = (i) => CATS[i % CATS.length];

export function Columns({
  data,
  height = 120,
  selected,
  onSelect,
  format = (n: number) => n.toLocaleString('en'),
  caption,
  color = timeRamp,
}: {
  data: Datum[];
  height?: number;
  selected?: string | null;
  onSelect?: (key: string | null) => void;
  format?: (n: number) => string;
  caption: string;
  color?: Paint;
}) {
  const [hover, setHover] = useState<string | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value));
  const peak = data.reduce((a, b) => (b.value > a.value ? b : a), data[0]);
  const everyOther = data.length > 12;

  return (
    <figure className="w-full">
      <div className="relative flex items-end gap-[2px] border-b border-line" style={{ height }}>
        {data.map((d, i) => {
          const h = d.value ? Math.max(3, (d.value / max) * (height - 22)) : 0;
          const dim = selected && selected !== d.key;
          const showLabel = d.key === hover || d.key === selected || (!hover && !selected && d.key === peak?.key);
          return (
            <button
              key={d.key}
              type="button"
              disabled={!onSelect}
              onMouseEnter={() => setHover(d.key)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(d.key)}
              onBlur={() => setHover(null)}
              onClick={() => onSelect?.(selected === d.key ? null : d.key)}
              aria-label={`${d.label}: ${format(d.value)}`}
              aria-pressed={onSelect ? selected === d.key : undefined}
              className="group relative flex h-full flex-1 items-end justify-center disabled:cursor-default"
            >
              {/* hit target is the full column; the mark is capped at 24px */}
              <span
                className="block w-full max-w-6 rounded-t-[4px] transition-all duration-500 ease-out-expo"
                style={{ height: h, background: paint(color, i, data.length), opacity: dim ? 0.25 : d.key === hover ? 1 : 0.8 }}
              />
              {showLabel && d.value > 0 && (
                <span
                  className="pointer-events-none absolute z-10 -translate-y-1.5 whitespace-nowrap rounded-md bg-s3 px-1.5 py-0.5 font-mono text-[10px] text-fg shadow-lg ring-1 ring-line-strong tabular"
                  style={{ bottom: h }}
                >
                  {d.key === hover || d.key === selected ? `${d.label} · ` : ''}
                  {format(d.value)}
                  {d.hint && (d.key === hover) ? ` · ${d.hint}` : ''}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-1.5 flex gap-[2px]">
        {data.map((d, i) => (
          <span key={d.key} className="flex-1 truncate text-center font-mono text-[10px] text-faint">
            {everyOther && i % 2 ? '' : d.label}
          </span>
        ))}
      </div>
      <SrTable caption={caption} data={data} format={format} />
    </figure>
  );
}

export function HBars({
  data,
  format = (n: number) => n.toLocaleString('en'),
  caption,
  color = categorical,
  onSelect,
}: {
  data: Datum[];
  format?: (n: number) => string;
  caption: string;
  color?: Paint;
  onSelect?: (key: string) => void;
}) {
  const [hover, setHover] = useState<string | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <figure className="w-full">
      <ul className="space-y-2.5">
        {data.map((d, i) => (
          <li key={d.key}>
            <button
              type="button"
              onClick={() => onSelect?.(d.key)}
              disabled={!onSelect}
              onMouseEnter={() => setHover(d.key)}
              onMouseLeave={() => setHover(null)}
              className="grid w-full grid-cols-[7.5rem_1fr_3.5rem] items-center gap-3 text-left disabled:cursor-default sm:grid-cols-[9rem_1fr_4rem]"
            >
              <span className={cx('truncate text-[13px] transition-colors', hover === d.key ? 'text-fg' : 'text-muted')}>{d.label}</span>
              <span className="relative h-[18px] border-l border-line">
                <span
                  className="absolute inset-y-0 left-0 rounded-r-[4px] transition-all duration-700 ease-out-expo"
                  style={{ width: `${(d.value / max) * 100}%`, background: paint(color, i, data.length), opacity: hover && hover !== d.key ? 0.45 : 0.85 }}
                />
              </span>
              <span className="text-right font-mono text-xs text-muted tabular">
                {format(d.value)}
                {d.hint && hover === d.key && <span className="sr-only"> {d.hint}</span>}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <SrTable caption={caption} data={data} format={format} />
    </figure>
  );
}

function SrTable({ caption, data, format }: { caption: string; data: Datum[]; format: (n: number) => string }) {
  return (
    <table className="sr-only">
      <caption>{caption}</caption>
      <tbody>
        {data.map((d) => (
          <tr key={d.key}>
            <th scope="row">{d.label}</th>
            <td>{format(d.value)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
