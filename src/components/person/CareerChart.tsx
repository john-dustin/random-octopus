'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Table2, ChartScatter } from 'lucide-react';
import type { Card, Person } from '@/lib/types';
import { compact, cx, poster, ratingColor, titleHref } from '@/lib/format';
import { Chip } from '@/components/ui';

type Dept = keyof Person['credits'];
type Point = Card & { dept: Dept };

const MAIN_TYPES = new Set(['movie', 'tvSeries', 'tvMiniSeries', 'tvMovie', 'tvSpecial']);
const M = { top: 28, right: 20, bottom: 34, left: 40 };

/**
 * Career scatter — every feature/series credit placed by year (x) and IMDb rating (y),
 * sized by vote count. Colour redundantly encodes rating on the house ramp.
 */
export function CareerChart({ credits, name, bornYear }: { credits: Person['credits']; name: string; bornYear?: number }) {
  const router = useRouter();
  const depts = (Object.keys(credits) as Dept[]).filter((d) => credits[d].some(ok));
  // Start on their most-watched department; the others can be toggled in.
  const [active, setActive] = useState<Set<Dept>>(() => {
    const w = (d: Dept) => credits[d].filter(ok).reduce((s, c) => s + (c.votes ?? 0), 0);
    return new Set([...depts].sort((a, b) => w(b) - w(a)).slice(0, 1));
  });
  const [hover, setHover] = useState<Point | null>(null);
  const [showTable, setShowTable] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(900);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(300, e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const points: Point[] = useMemo(() => {
    const seen = new Set<string>();
    const out: Point[] = [];
    for (const d of depts) {
      if (!active.has(d)) continue;
      for (const c of credits[d]) {
        if (!ok(c) || seen.has(c.id) || (bornYear && c.year! < bornYear)) continue;
        seen.add(c.id);
        out.push({ ...c, dept: d });
      }
    }
    return out.sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0)); // big first → small drawn on top
  }, [credits, active, depts, bornYear]);

  const h = w < 640 ? 320 : 420;
  const iw = w - M.left - M.right;
  const ih = h - M.top - M.bottom;

  const scales = useMemo(() => {
    const ys = points.map((p) => p.year!);
    const rs = points.map((p) => p.rating!);
    const x0 = ys.length ? Math.min(...ys) - 1 : 2000;
    const x1 = ys.length ? Math.max(...ys) + 1 : 2025;
    const y0 = rs.length ? Math.max(1, Math.floor(Math.min(...rs)) - 0.5) : 1;
    const maxV = Math.max(1, ...points.map((p) => p.votes ?? 0));
    return {
      x0, x1, y0, maxV,
      x: (y: number) => M.left + ((y - x0) / Math.max(1, x1 - x0)) * iw,
      y: (r: number) => M.top + (1 - (r - y0) / (10 - y0)) * ih,
      r: (v?: number) => 4 + Math.sqrt((v ?? 0) / maxV) * (w < 640 ? 12 : 18),
    };
  }, [points, iw, ih, w]);

  // Career average — rolling mean over a ±3 year window.
  const trend = useMemo(() => {
    if (points.length < 6) return null;
    const { x0, x1 } = scales;
    const pts: [number, number][] = [];
    for (let y = x0 + 1; y <= x1 - 1; y++) {
      const win = points.filter((p) => Math.abs(p.year! - y) <= 3);
      if (win.length < 2) continue;
      const wsum = win.reduce((s, p) => s + Math.log10((p.votes ?? 1) + 10), 0);
      pts.push([y, win.reduce((s, p) => s + p.rating! * Math.log10((p.votes ?? 1) + 10), 0) / wsum]);
    }
    if (pts.length < 3) return null;
    return pts.map(([y, r], i) => `${i ? 'L' : 'M'}${scales.x(y).toFixed(1)},${scales.y(r).toFixed(1)}`).join(' ');
  }, [points, scales]);

  const top3 = useMemo(
    () =>
      [...points]
        .filter((p) => (p.votes ?? 0) >= 5000)
        .sort((a, b) => b.rating! - a.rating! || (b.votes ?? 0) - (a.votes ?? 0))
        .slice(0, 3),
    [points]
  );

  const labels = useMemo(() => {
    const placed: { x0: number; x1: number; y: number }[] = [];
    return [...top3]
      .sort((a, b) => scales.y(a.rating!) - scales.y(b.rating!))
      .map((p) => {
        const cx = scales.x(p.year!);
        const cy = scales.y(p.rating!);
        const r = scales.r(p.votes);
        const left = cx > w * 0.62;
        const text = truncate(p.title, w < 640 ? 16 : 28);
        const width = text.length * 6.4 + 34;
        const lx = cx + (left ? -12 : 12);
        const x0 = left ? lx - width : lx;
        const x1 = left ? lx : lx + width;
        let ly = Math.max(12, cy - r - 14);
        // bump upward (then downward if we hit the top) until clear of earlier labels
        for (let guard = 0; guard < 8 && placed.some((q) => q.x0 < x1 && x0 < q.x1 && Math.abs(q.y - ly) < 15); guard++) {
          ly -= 16;
          if (ly < 10) ly = cy + r + 16 + guard * 16;
        }
        placed.push({ x0, x1, y: ly });
        return { p, cx, cy, r, left, lx, ly, text };
      });
  }, [top3, scales, w]);

  const xTicks = useMemo(() => {
    const span = scales.x1 - scales.x0;
    const step = span > 40 ? 10 : span > 16 ? 5 : span > 6 ? 2 : 1;
    const out: number[] = [];
    for (let y = Math.ceil(scales.x0 / step) * step; y <= scales.x1; y += step) out.push(y);
    return out;
  }, [scales]);
  const yTicks = useMemo(() => {
    const out: number[] = [];
    for (let r = Math.ceil(scales.y0); r <= 10; r++) out.push(r);
    return out;
  }, [scales]);

  // Nearest-point hit layer: the pointer only has to be closest, not dead-centre.
  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    let best: Point | null = null;
    let bd = Infinity;
    for (const p of points) {
      const dx = scales.x(p.year!) - mx;
      const dy = scales.y(p.rating!) - my;
      const d = dx * dx + dy * dy - scales.r(p.votes) ** 2 * 0.5;
      if (d < bd) { bd = d; best = p; }
    }
    setHover(bd < 44 * 44 ? best : null);
  };

  if (!depts.length) return null;

  const hx = hover ? scales.x(hover.year!) : 0;
  const hy = hover ? scales.y(hover.rating!) : 0;
  const flip = hx > w - 260;

  return (
    <div className="panel relative overflow-hidden p-5 sm:p-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow mb-2 text-sky">Career chart · {points.length} titles</div>
          <h2 className="display text-[clamp(1.9rem,3.2vw,2.8rem)]">
            The shape of a <em>career</em>
          </h2>
          <p className="mt-2 max-w-xl text-sm text-muted">
            Every feature and series {name.split(' ')[0]} worked on, by year and IMDb rating. Bigger dots drew bigger audiences.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {depts.map((d) => (
            <Chip
              key={d}
              active={active.has(d)}
              onClick={() =>
                setActive((s) => {
                  const n = new Set(s);
                  if (n.has(d)) { if (n.size > 1) n.delete(d); } else n.add(d);
                  return n;
                })
              }
            >
              {d}
            </Chip>
          ))}
          <button
            onClick={() => setShowTable((t) => !t)}
            className="ml-1 grid size-8 place-items-center rounded-full border border-line text-muted transition hover:border-line-strong hover:text-fg"
            aria-label={showTable ? 'Show chart' : 'Show as table'}
            title={showTable ? 'Show chart' : 'Show as table'}
          >
            {showTable ? <ChartScatter size={14} /> : <Table2 size={14} />}
          </button>
        </div>
      </div>

      <div ref={wrap} className="relative">
        {showTable ? (
          <div className="max-h-[420px] overflow-auto rounded-xl border border-line">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-s2 text-left text-xs text-faint">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Year</th>
                  <th className="px-4 py-2.5 font-medium">Title</th>
                  <th className="px-4 py-2.5 text-right font-medium">Rating</th>
                  <th className="px-4 py-2.5 text-right font-medium">Votes</th>
                </tr>
              </thead>
              <tbody>
                {[...points].sort((a, b) => b.year! - a.year!).map((p) => (
                  <tr key={p.id} className="cursor-pointer border-t border-line hover:bg-white/[0.03]" onClick={() => router.push(titleHref(p.id))}>
                    <td className="px-4 py-2 font-mono text-xs text-muted tabular">{p.year}</td>
                    <td className="px-4 py-2">{p.title}</td>
                    <td className="px-4 py-2 text-right font-mono tabular">{p.rating!.toFixed(1)}</td>
                    <td className="px-4 py-2 text-right font-mono text-muted tabular">{compact(p.votes)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <>
            <svg
              width={w}
              height={h}
              className={cx('block touch-none select-none', hover && 'cursor-pointer')}
              onPointerMove={onMove}
              onPointerLeave={() => setHover(null)}
              onClick={() => hover && router.push(titleHref(hover.id))}
              role="img"
              aria-label={`Scatter chart of ${points.length} titles by year and IMDb rating`}
            >
              {/* grid */}
              {yTicks.map((r) => (
                <g key={r}>
                  <line x1={M.left} x2={w - M.right} y1={scales.y(r)} y2={scales.y(r)} stroke="var(--line)" />
                  <text x={M.left - 10} y={scales.y(r)} dy="0.32em" textAnchor="end" className="fill-[var(--fg-faint)] font-mono text-[10px]">
                    {r}
                  </text>
                </g>
              ))}
              {xTicks.map((y) => (
                <text key={y} x={scales.x(y)} y={h - 10} textAnchor="middle" className="fill-[var(--fg-faint)] font-mono text-[10px]">
                  {y}
                </text>
              ))}
              <line x1={M.left} x2={w - M.right} y1={M.top + ih} y2={M.top + ih} stroke="var(--line-strong)" />

              {/* hover crosshair */}
              {hover && (
                <g pointerEvents="none">
                  <line x1={hx} x2={hx} y1={M.top} y2={M.top + ih} stroke="var(--line-strong)" strokeDasharray="2 3" />
                  <line x1={M.left} x2={w - M.right} y1={hy} y2={hy} stroke="var(--line-strong)" strokeDasharray="2 3" />
                </g>
              )}

              {/* trend */}
              {trend && (
                <path d={trend} fill="none" stroke="var(--fg-muted)" strokeWidth={2} strokeDasharray="1 5" strokeLinecap="round" opacity={0.7} />
              )}

              {/* dots */}
              {points.map((p, i) => {
                const isHover = hover?.id === p.id;
                return (
                  <motion.circle
                    key={p.id}
                    initial={{ r: 0, opacity: 0 }}
                    animate={{ r: scales.r(p.votes) * (isHover ? 1.25 : 1), opacity: hover && !isHover ? 0.35 : 0.92 }}
                    transition={{ delay: Math.min(i * 0.008, 0.8), type: 'spring', stiffness: 260, damping: 22 }}
                    cx={scales.x(p.year!)}
                    cy={scales.y(p.rating!)}
                    fill={ratingColor(p.rating)}
                    stroke="var(--s1)"
                    strokeWidth={2}
                  />
                );
              })}

              {/* annotations for the top 3 — stacked to avoid collisions */}
              {labels.map((l) => (
                <g key={l.p.id} pointerEvents="none" opacity={hover && hover.id !== l.p.id ? 0.25 : 1} className="transition-opacity">
                  <path d={`M${l.cx},${l.cy - l.r - 2} L${l.cx},${l.ly} L${l.lx},${l.ly}`} fill="none" stroke="var(--fg-faint)" strokeWidth={1} />
                  <text x={l.lx + (l.left ? -4 : 4)} y={l.ly} dy="0.32em" textAnchor={l.left ? 'end' : 'start'} className="fill-[var(--fg)] text-[11.5px] font-medium">
                    {l.text}
                    <tspan className="fill-[var(--fg-faint)] font-mono text-[10px]"> {l.p.rating!.toFixed(1)}</tspan>
                  </text>
                </g>
              ))}
            </svg>

            <AnimatePresence>
              {hover && (
                <motion.div
                  key={hover.id}
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.14 }}
                  className="pointer-events-none absolute z-20 flex w-[240px] gap-3 rounded-2xl border border-line-strong bg-s1/95 p-2.5 shadow-2xl backdrop-blur-xl"
                  style={{
                    left: flip ? hx - 252 : hx + 16,
                    top: Math.max(0, Math.min(h - 120, hy - 50)),
                  }}
                >
                  <div className="h-[84px] w-14 shrink-0 overflow-hidden rounded-lg bg-s3">
                    {hover.poster && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={poster(hover.poster, 112)} alt="" className="size-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 py-0.5">
                    <div className="font-mono text-xl font-semibold tabular text-fg">
                      {hover.rating!.toFixed(1)}
                      <span className="ml-1.5 text-[11px] font-normal text-faint">{compact(hover.votes)} votes</span>
                    </div>
                    <div className="mt-0.5 line-clamp-2 text-[13px] font-medium leading-snug">{hover.title}</div>
                    <div className="mt-0.5 truncate text-[11px] text-faint">
                      {hover.year} · {hover.character || hover.dept}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>

      {/* legend */}
      {!showTable && (
        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] text-faint">
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-24 rounded-full" style={{ background: `linear-gradient(90deg, ${[3, 5, 6.5, 7.5, 8.5, 9.5].map(ratingColor).join(',')})` }} />
            IMDb rating, low → high
          </span>
          <span className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-muted" />
            <span className="size-3 rounded-full bg-muted" />
            vote count
          </span>
          {trend && (
            <span className="flex items-center gap-2">
              <svg width="22" height="4"><line x1="1" x2="21" y1="2" y2="2" stroke="var(--fg-muted)" strokeWidth={2} strokeDasharray="1 4" strokeLinecap="round" /></svg>
              rolling career average
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function ok(c: Card) {
  return c.year != null && c.rating != null && MAIN_TYPES.has(c.type ?? '') && (c.votes ?? 0) >= 20;
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}
