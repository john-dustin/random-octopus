'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion, useInView } from 'motion/react';
import { ArrowLeftRight, Crown, Loader2, Search, X, Trophy, Sparkles } from 'lucide-react';
import type { Card, Suggestion, TitleDetail } from '@/lib/types';
import { compact, cx, img, money, poster, runtime, titleHref, years } from '@/lib/format';
import { useImageColor } from '@/lib/hooks';
import { Ambient } from '@/components/Ambient';
import { Container } from '@/components/ui';

const ID = /^tt\d{5,}$/;

const PRESETS: { a: string; b: string; tag: string }[] = [
  { a: 'tt0068646', b: 'tt0071562', tag: 'The eternal sequel debate' },
  { a: 'tt0078748', b: 'tt0090605', tag: 'Horror vs. action' },
  { a: 'tt0468569', b: 'tt7286456', tag: 'Two faces of Gotham' },
  { a: 'tt0133093', b: 'tt1375666', tag: 'Reality is negotiable' },
  { a: 'tt0816692', b: 'tt0062622', tag: 'Space odysseys, 46 years apart' },
  { a: 'tt0110912', b: 'tt0114814', tag: 'The class of ’94–’95' },
];

async function fetchTitle(id: string): Promise<TitleDetail> {
  const r = await fetch(`/api/title?id=${id}`);
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error ?? `HTTP ${r.status}`);
  return r.json();
}

/* ------------------------------------------------------------------ */
/* Metrics                                                             */
/* ------------------------------------------------------------------ */

type Metric = {
  key: string;
  label: string;
  get: (t: TitleDetail) => number | undefined;
  fmt: (v: number, t: TitleDetail) => string;
  better: 'higher' | null; // null → informational, not scored
  note?: string;
};

const oscarWins = (t: TitleDetail) => (t.oscars?.award?.text === 'Oscar' ? t.oscars.wins : 0);

const METRICS: Metric[] = [
  { key: 'rating', label: 'IMDb rating', get: (t) => t.rating, fmt: (v) => v.toFixed(1), better: 'higher' },
  { key: 'votes', label: 'Audience size', get: (t) => t.votes, fmt: (v) => `${compact(v)} votes`, better: 'higher' },
  { key: 'meta', label: 'Metascore', get: (t) => t.metascore, fmt: (v) => String(v), better: 'higher', note: 'critics' },
  { key: 'gross', label: 'Worldwide gross', get: (t) => t.gross, fmt: (v) => money(v)!, better: 'higher' },
  {
    key: 'roi',
    label: 'Return on budget',
    get: (t) => (t.gross && t.budget?.amount && t.budget.currency === 'USD' ? t.gross / t.budget.amount : undefined),
    fmt: (v) => `${v >= 10 ? v.toFixed(0) : v.toFixed(1)}×`,
    better: 'higher',
  },
  { key: 'oscars', label: 'Oscars won', get: (t) => oscarWins(t), fmt: (v, t) => `${v}${t.oscars?.award?.text === 'Oscar' ? ` of ${t.oscars.wins + t.oscars.nominations}` : ''}`, better: 'higher' },
  { key: 'wins', label: 'Total award wins', get: (t) => t.wins, fmt: (v) => String(v), better: 'higher' },
  { key: 'budget', label: 'Budget', get: (t) => t.budget?.amount, fmt: (v, t) => money(v, t.budget?.currency)!, better: null },
  { key: 'runtime', label: 'Runtime', get: (t) => t.runtime, fmt: (v) => runtime(v)!, better: null },
  { key: 'year', label: 'Released', get: (t) => t.year, fmt: (v) => String(v), better: null },
];

type Row = { m: Metric; a?: number; b?: number; winner: 'a' | 'b' | 'tie' | null };

function score(A: TitleDetail, B: TitleDetail): Row[] {
  return METRICS.map((m) => {
    const a = m.get(A);
    const b = m.get(B);
    let winner: Row['winner'] = null;
    if (m.better && a != null && b != null && !(a === 0 && b === 0)) winner = a === b ? 'tie' : a > b ? 'a' : 'b';
    return { m, a, b, winner };
  }).filter((r) => r.a != null || r.b != null);
}

/* ------------------------------------------------------------------ */
/* Page component                                                      */
/* ------------------------------------------------------------------ */

export function Versus() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const a = ID.test(params.get('a') ?? '') ? params.get('a')! : null;
  const b = ID.test(params.get('b') ?? '') ? params.get('b')! : null;

  const set = useCallback(
    (next: { a?: string | null; b?: string | null }) => {
      const na = next.a !== undefined ? next.a : a;
      const nb = next.b !== undefined ? next.b : b;
      const qs = new URLSearchParams();
      if (na) qs.set('a', na);
      if (nb) qs.set('b', nb);
      const s = qs.toString();
      router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false });
    },
    [a, b, pathname, router]
  );

  const qa = useQuery({ queryKey: ['title', a], queryFn: () => fetchTitle(a!), enabled: !!a });
  const qb = useQuery({ queryKey: ['title', b], queryFn: () => fetchTitle(b!), enabled: !!b });
  const A = qa.data;
  const B = qb.data;

  const rows = useMemo(() => (A && B ? score(A, B) : []), [A, B]);
  const tally = useMemo(() => {
    const t = { a: 0, b: 0 };
    for (const r of rows) if (r.winner === 'a') t.a++; else if (r.winner === 'b') t.b++;
    return t;
  }, [rows]);
  // Level on rounds → the bigger audience takes it on the tiebreaker.
  const tiebreak = !!(A && B && tally.a === tally.b && (A.votes ?? 0) !== (B.votes ?? 0));
  const champ = A && B
    ? tally.a > tally.b ? 'a' : tally.b > tally.a ? 'b' : tiebreak ? ((A.votes ?? 0) > (B.votes ?? 0) ? 'a' : 'b') : null
    : null;

  const colA = useImageColor(A?.poster, '120 150 255');
  const colB = useImageColor(B?.poster, '255 120 90');

  return (
    <div className="relative pb-10">
      <Ambient image={champ === 'b' ? B?.poster : A?.poster ?? B?.poster} intensity={0} />
      {/* split ambient wash — each side glows in its film's colour */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -left-[20vw] top-0 h-[80vh] w-[70vw] rounded-full blur-[140px] transition-[background] duration-1000" style={{ background: `radial-gradient(closest-side, rgb(${colA} / ${A ? 0.22 : 0.08}), transparent)` }} />
        <div className="absolute -right-[20vw] top-0 h-[80vh] w-[70vw] rounded-full blur-[140px] transition-[background] duration-1000" style={{ background: `radial-gradient(closest-side, rgb(${colB} / ${B ? 0.22 : 0.08}), transparent)` }} />
      </div>

      <Container className="pt-28 text-center sm:pt-32">
        <div className="eyebrow mb-3 text-poppy">Head to head</div>
        <h1 className="display text-[clamp(3.4rem,10vw,8rem)] leading-[0.85]">
          Ver<em className="text-accent">sus</em>
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-[15px] text-muted">
          Pick two titles. Ratings, box office, awards and audience go head to head until one is left standing.
        </p>
      </Container>

      {/* ---------- Face-off ---------- */}
      <Container className="mt-12 sm:mt-16">
        <div className="relative grid grid-cols-[1fr_auto_1fr] items-start gap-3 sm:gap-8 lg:gap-14">
          <Side id={a} q={qa} other={b} crowned={champ === 'a'} dim={champ === 'b'} align="right" onPick={(id) => set({ a: id })} onClear={() => set({ a: null })} />

          <div className="relative flex flex-col items-center pt-[22vw] sm:pt-40">
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 220, damping: 16, delay: 0.2 }}
              className="relative grid size-14 place-items-center sm:size-24"
            >
              <span className="absolute inset-0 animate-pulse-soft rounded-full bg-accent/40 blur-2xl" />
              <span className="absolute inset-0 rounded-full border border-accent/50 bg-bg/80 backdrop-blur" />
              <span className="bulbs absolute -inset-2 animate-spin-slow rounded-full opacity-50 [mask-image:radial-gradient(circle,transparent_58%,#000_60%,#000_70%,transparent_72%)]" />
              <span className="display relative text-2xl text-fg [text-shadow:0_0_24px_rgb(var(--accent))] sm:text-5xl">vs</span>
            </motion.div>
            {(a || b) && (
              <button
                onClick={() => set({ a: b, b: a })}
                className="glass mt-5 grid size-10 place-items-center rounded-full text-muted transition hover:rotate-180 hover:text-fg"
                style={{ transitionDuration: '600ms' }}
                aria-label="Swap sides"
                title="Swap sides"
              >
                <ArrowLeftRight size={16} />
              </button>
            )}
          </div>

          <Side id={b} q={qb} other={a} crowned={champ === 'b'} dim={champ === 'a'} align="left" onPick={(id) => set({ b: id })} onClear={() => set({ b: null })} />
        </div>
      </Container>

      {/* ---------- Scorecard ---------- */}
      {A && B && (
        <Container className="mt-16 sm:mt-24">
          <div className="mx-auto max-w-4xl">
            <div className="mb-6 flex items-center justify-between gap-4 text-xs">
              <span className="eyebrow">Tale of the tape</span>
              <span className="hidden text-faint sm:inline">Bars grow toward the winner of each round</span>
            </div>
            <div className="panel divide-y divide-line overflow-hidden">
              {rows.map((r, i) => (
                <MetricRow key={r.m.key} row={r} A={A} B={B} i={i} />
              ))}
            </div>
            <Tally A={A} B={B} tally={tally} champ={champ} tiebreak={tiebreak} />
          </div>
        </Container>
      )}

      {(qa.isError || qb.isError) && (
        <Container className="mt-10 text-center text-sm text-danger">
          Couldn’t load {qa.isError ? 'the left' : 'the right'} contender. Try picking again.
        </Container>
      )}

      {/* ---------- Presets ---------- */}
      {!a && !b && <Presets onPick={(p) => set({ a: p.a, b: p.b })} />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* A contender                                                         */
/* ------------------------------------------------------------------ */

function Side({
  id, q, other, crowned, dim, align, onPick, onClear,
}: {
  id: string | null;
  q: { data?: TitleDetail; isLoading: boolean; isFetching: boolean };
  other: string | null;
  crowned: boolean;
  dim: boolean;
  align: 'left' | 'right';
  onPick: (id: string) => void;
  onClear: () => void;
}) {
  const t = q.data;
  if (!id) return <Picker exclude={other} onPick={onPick} align={align} />;
  if (!t || (q.isFetching && t.id !== id)) {
    return (
      <div className={cx('flex flex-col', align === 'right' ? 'items-end' : 'items-start')}>
        <div className="skeleton aspect-[2/3] w-full max-w-[340px] rounded-2xl" />
        <div className="skeleton mt-5 h-7 w-3/4 max-w-[260px] rounded" />
        <div className="skeleton mt-2 h-3 w-24 rounded" />
      </div>
    );
  }
  const director = t.directors[0]?.name ?? t.creators[0]?.name;
  return (
    <motion.div
      key={t.id}
      initial={{ opacity: 0, x: align === 'right' ? -30 : 30 }}
      animate={{ opacity: dim ? 0.55 : 1, x: 0, scale: dim ? 0.97 : 1 }}
      transition={{ type: 'spring', stiffness: 160, damping: 22 }}
      className={cx('flex min-w-0 flex-col', align === 'right' ? 'items-end text-right' : 'items-start text-left')}
    >
      <div className="relative w-full max-w-[340px]">
        {/* spotlight beam on the champion */}
        <AnimatePresence>
          {crowned && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              aria-hidden
              className="pointer-events-none absolute -inset-x-16 -top-40 bottom-1/3 -z-10 [background:conic-gradient(from_180deg_at_50%_0%,transparent_160deg,rgb(var(--accent)/0.35)_176deg,rgb(255_255_255/0.28)_180deg,rgb(var(--accent)/0.35)_184deg,transparent_200deg)] blur-md"
            />
          )}
        </AnimatePresence>
        <Tilt>
          <Link href={titleHref(t.id)} className="sheen group relative block aspect-[2/3] overflow-hidden rounded-2xl bg-s2 ring-1 ring-white/10 shadow-[0_40px_80px_-20px_rgb(0_0_0/0.95)]">
            {t.poster && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={poster(t.poster, 520)} alt={t.title} className="size-full object-cover" />
            )}
          </Link>
        </Tilt>
        <AnimatePresence>
          {crowned && (
            <motion.span
              initial={{ scale: 0, rotate: -30, x: '-50%' }}
              animate={{ scale: 1, rotate: 0, x: '-50%' }}
              exit={{ scale: 0, x: '-50%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 14, delay: 0.6 }}
              className="pointer-events-none absolute -top-5 left-1/2 z-10 grid size-10 place-items-center rounded-full bg-gold text-night shadow-[0_0_30px_rgb(233_180_84/0.8)] ring-4 ring-bg sm:-top-6 sm:size-12"
            >
              <Crown size={18} strokeWidth={2.4} />
            </motion.span>
          )}
        </AnimatePresence>
        <button
          onClick={onClear}
          className={cx('glass absolute bottom-3 grid size-8 place-items-center rounded-full text-muted transition hover:text-fg', align === 'right' ? 'left-3' : 'right-3')}
          aria-label="Choose a different title"
          title="Change"
        >
          <X size={14} />
        </button>
      </div>
      <h2 className="display mt-5 line-clamp-3 w-full text-[clamp(1.35rem,3.2vw,2.6rem)] leading-[0.95]">{t.title}</h2>
      <div className="mt-2 text-[11px] text-faint sm:text-sm">
        {[years(t.year, t.endYear, t.series), director].filter(Boolean).join(' · ')}
      </div>
    </motion.div>
  );
}

function Tilt({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [r, setR] = useState({ x: 0, y: 0 });
  return (
    <div
      ref={ref}
      style={{ perspective: 900 }}
      onPointerMove={(e) => {
        if (e.pointerType !== 'mouse') return;
        const b = ref.current!.getBoundingClientRect();
        setR({ x: ((e.clientY - b.top) / b.height - 0.5) * -10, y: ((e.clientX - b.left) / b.width - 0.5) * 12 });
      }}
      onPointerLeave={() => setR({ x: 0, y: 0 })}
    >
      <motion.div animate={{ rotateX: r.x, rotateY: r.y }} transition={{ type: 'spring', stiffness: 200, damping: 18 }}>
        {children}
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Picker — debounced title search                                     */
/* ------------------------------------------------------------------ */

function Picker({ exclude, onPick, align }: { exclude: string | null; onPick: (id: string) => void; align: 'left' | 'right' }) {
  const [q, setQ] = useState('');
  const [res, setRes] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const term = q.trim();
    if (!term) return;
    setLoading(true); // eslint-disable-line react-hooks/set-state-in-effect -- spinner for the in-flight request
    const ctl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/suggest?q=${encodeURIComponent(term)}`, { signal: ctl.signal });
        const all: Suggestion[] = await r.json();
        setRes(all.filter((s) => s.kind === 'title' && s.id !== exclude).slice(0, 7));
        setActive(0);
      } catch { /* aborted */ } finally { setLoading(false); }
    }, 160);
    return () => { clearTimeout(t); ctl.abort(); };
  }, [q, exclude]);

  return (
    <div className={cx('flex flex-col', align === 'right' ? 'items-end' : 'items-start')}>
      <div className="relative flex aspect-[2/3] w-full max-w-[340px] flex-col rounded-2xl border border-dashed border-line-strong bg-white/[0.015] p-3 sm:p-5">
        <div className="relative">
          <Search size={15} className={cx('absolute left-3 top-1/2 -translate-y-1/2', loading ? 'animate-pulse text-accent' : 'text-faint')} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(res.length - 1, a + 1)); }
              if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
              if (e.key === 'Enter' && res[active]) onPick(res[active].id);
            }}
            placeholder="Pick a title…"
            className="h-10 w-full rounded-xl border border-line bg-s1/80 pl-9 pr-3 text-sm outline-none transition focus:border-accent/60 sm:h-11"
          />
        </div>
        <div className="mt-2 min-h-0 flex-1 space-y-1 overflow-y-auto">
          {(q.trim() ? res : []).map((s, i) => (
            <button
              key={s.id}
              onMouseEnter={() => setActive(i)}
              onClick={() => onPick(s.id)}
              className={cx('flex w-full items-center gap-2.5 rounded-xl p-1.5 text-left transition-colors', i === active ? 'bg-white/[0.07]' : 'hover:bg-white/[0.04]')}
            >
              <span className="h-12 w-8 shrink-0 overflow-hidden rounded-md bg-s3">
                {s.img && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={img(s.img, 64, 96)} alt="" className="size-full object-cover" />
                )}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-medium">{s.label}</span>
                <span className="block truncate text-[11px] text-faint">{[s.year, s.sub].filter(Boolean).join(' · ')}</span>
              </span>
            </button>
          ))}
          {!q.trim() && (
            <div className="grid h-full place-items-center px-2 text-center">
              <div>
                <div className="display text-4xl text-faint/70 sm:text-6xl">?</div>
                <div className="mt-2 text-xs text-faint">Choose a contender</div>
              </div>
            </div>
          )}
          {q.trim() && !loading && res.length === 0 && <div className="px-2 py-6 text-center text-xs text-faint">No titles found</div>}
          {loading && res.length === 0 && (
            <div className="grid place-items-center py-6 text-faint"><Loader2 size={16} className="animate-spin" /></div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Scorecard row                                                       */
/* ------------------------------------------------------------------ */

function MetricRow({ row, A, B, i }: { row: Row; A: TitleDetail; B: TitleDetail; i: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const { m, a, b, winner } = row;
  const max = Math.max(a ?? 0, b ?? 0) || 1;
  const pa = a != null ? Math.max(0.04, a / max) : 0;
  const pb = b != null ? Math.max(0.04, b / max) : 0;
  const scored = m.better != null;

  const bar = (side: 'a' | 'b', pct: number) => {
    const win = winner === side;
    const lose = winner && winner !== side && winner !== 'tie';
    return (
      <div className={cx('flex h-2 w-full overflow-hidden', side === 'a' ? 'justify-end' : 'justify-start')}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: inView ? `${pct * 100}%` : 0 }}
          transition={{ duration: 1.1, delay: 0.1 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
          className={cx(
            'h-full',
            side === 'a' ? 'rounded-l-[4px]' : 'rounded-r-[4px]',
            !scored ? 'bg-fg/25' : win ? 'bg-accent shadow-[0_0_16px_rgb(var(--accent)/0.7)]' : lose ? 'bg-fg/15' : 'bg-fg/40'
          )}
        />
      </div>
    );
  };

  const val = (side: 'a' | 'b', v: number | undefined, t: TitleDetail) => (
    <div className={cx('flex items-center gap-2', side === 'a' ? 'justify-end' : 'justify-start')}>
      {winner === side && side === 'b' && <Trophy size={13} className="text-gold" />}
      <span className={cx('font-mono text-[13px] tabular sm:text-[15px]', winner === side ? 'font-semibold text-fg' : v == null ? 'text-faint' : 'text-muted')}>
        {v != null ? m.fmt(v, t) : '—'}
      </span>
      {winner === side && side === 'a' && <Trophy size={13} className="text-gold" />}
    </div>
  );

  return (
    <div ref={ref} className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-4 sm:gap-6 sm:px-7">
      <div className="space-y-2">
        {val('a', a, A)}
        {bar('a', pa)}
      </div>
      <div className="w-[88px] text-center sm:w-[148px]">
        <div className="text-[11.5px] font-medium leading-tight text-fg/90 sm:text-[13px]">{m.label}</div>
        <div className="mt-0.5 text-[10px] text-faint">{!scored ? 'for the record' : winner === 'tie' ? 'dead even' : m.note ?? ' '}</div>
      </div>
      <div className="space-y-2">
        {val('b', b, B)}
        {bar('b', pb)}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tally + confetti                                                    */
/* ------------------------------------------------------------------ */

function Tally({ A, B, tally, champ, tiebreak }: { A: TitleDetail; B: TitleDetail; tally: { a: number; b: number }; champ: 'a' | 'b' | null; tiebreak: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const winner = champ === 'a' ? A : champ === 'b' ? B : null;
  const hi = Math.max(tally.a, tally.b);
  const lo = Math.min(tally.a, tally.b);

  return (
    <div ref={ref} className="relative mt-10 overflow-hidden rounded-[28px] border border-line-strong bg-gradient-to-b from-accent/[0.12] to-transparent px-6 py-14 text-center sm:py-20">
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-0 h-full w-[140%] -translate-x-1/2 [background:radial-gradient(ellipse_at_top,rgb(var(--accent)/0.28),transparent_60%)]" />
      {inView && winner && <Confetti />}
      <div className="relative">
        <div className="eyebrow mb-4 flex items-center justify-center gap-2">
          <Sparkles size={12} className="text-gold" /> The verdict
        </div>
        {winner ? (
          <motion.h3
            initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
            animate={inView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="display mx-auto max-w-3xl text-[clamp(2.4rem,6.5vw,5.2rem)] leading-[0.92]"
          >
            <em className="text-accent">{winner.title}</em> {tiebreak ? 'edges it' : 'wins'}{' '}
            <span className="whitespace-nowrap font-mono text-[0.62em] not-italic tabular">
              {hi}–{lo}
            </span>
          </motion.h3>
        ) : (
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            className="display text-[clamp(2.4rem,6.5vw,5.2rem)] leading-[0.92]"
          >
            A dead heat, <span className="font-mono text-[0.62em] tabular">{tally.a}–{tally.b}</span>
          </motion.h3>
        )}
        <p className="mx-auto mt-5 max-w-md text-sm text-muted">
          {winner && tiebreak
            ? `Level on rounds — ${winner.title} takes it on the tiebreaker: a bigger audience (${compact(winner.votes)} votes).`
            : winner
            ? `${winner.title} took ${hi} of ${tally.a + tally.b} scored rounds.${lo === 0 ? ' A clean sweep.' : hi - lo === 1 ? ' It went down to the wire.' : ''}`
            : 'Neither blinked. Maybe watch both and decide for yourself.'}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          <Link href={titleHref((winner ?? A).id)} className="inline-flex h-11 items-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--gold),var(--leaf)_60%,var(--lagoon))] text-night px-5 text-sm font-semibold transition hover:brightness-110">
            Open {(winner ?? A).title}
          </Link>
        </div>
      </div>
    </div>
  );
}

function Confetti() {
  // Deterministic pseudo-random scatter (pure render).
  const rnd = (i: number, k: number) => {
    const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
    return x - Math.floor(x);
  };
  const bits = Array.from({ length: 64 }, (_, i) => ({
    i,
    x: rnd(i, 1) * 100,
    drift: (rnd(i, 2) - 0.5) * 160,
    delay: rnd(i, 3) * 0.6,
    dur: 2.2 + rnd(i, 4) * 1.8,
    rot: rnd(i, 5) * 720 - 360,
    w: 5 + rnd(i, 6) * 6,
    h: 8 + rnd(i, 7) * 10,
    c: ['rgb(var(--accent))', 'var(--gold)', 'var(--fg)', 'rgb(var(--accent) / 0.6)'][i % 4],
  }));
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {bits.map((b) => (
        <motion.span
          key={b.i}
          className="absolute top-0 rounded-[2px]"
          style={{ left: `${b.x}%`, width: b.w, height: b.h, background: b.c }}
          initial={{ y: -30, x: 0, rotate: 0, opacity: 1 }}
          animate={{ y: 520, x: b.drift, rotate: b.rot, opacity: [1, 1, 0] }}
          transition={{ duration: b.dur, delay: b.delay, ease: [0.2, 0.6, 0.4, 1] }}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Preset matchups                                                     */
/* ------------------------------------------------------------------ */

function Presets({ onPick }: { onPick: (p: { a: string; b: string }) => void }) {
  const ids = PRESETS.flatMap((p) => [p.a, p.b]);
  const { data } = useQuery({
    queryKey: ['cards', ids.join(',')],
    queryFn: async (): Promise<Card[]> => (await fetch(`/api/cards?ids=${ids.join(',')}`)).json(),
  });
  const by = new Map((data ?? []).map((c) => [c.id, c]));

  return (
    <Container className="mt-20 sm:mt-28">
      <div className="mb-6 text-center">
        <div className="eyebrow mb-2 text-gold">Or settle an old argument</div>
        <h2 className="display text-[clamp(1.9rem,3.2vw,2.8rem)]">Classic <em>matchups</em></h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PRESETS.map((p, i) => {
          const ca = by.get(p.a);
          const cb = by.get(p.b);
          return (
            <motion.button
              key={p.a + p.b}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              onClick={() => onPick(p)}
              className="panel group relative overflow-hidden p-4 text-left transition-all duration-500 hover:-translate-y-1 hover:border-line-strong"
            >
              <div className="flex items-center gap-3">
                <MiniPoster c={ca} tilt={-4} />
                <span className="display text-2xl text-faint transition-colors group-hover:text-accent">vs</span>
                <MiniPoster c={cb} tilt={4} />
              </div>
              <div className="mt-4 text-[14px] font-medium leading-snug">
                {ca?.title ?? '…'} <span className="text-faint">vs</span> {cb?.title ?? '…'}
              </div>
              <div className="mt-1 text-xs text-faint">{p.tag}</div>
            </motion.button>
          );
        })}
      </div>
    </Container>
  );
}

function MiniPoster({ c, tilt }: { c?: Card; tilt: number }) {
  return (
    <span
      className="block aspect-[2/3] flex-1 overflow-hidden rounded-xl bg-s3 ring-1 ring-white/10 transition-transform duration-500 group-hover:rotate-0"
      style={{ transform: `rotate(${tilt}deg)` }}
    >
      {c?.poster && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={poster(c.poster, 260)} alt="" loading="lazy" className="size-full object-cover" />
      )}
    </span>
  );
}
