'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useInfiniteQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowDownWideNarrow, ArrowUpNarrowWide, SlidersHorizontal, X, RotateCcw, Telescope } from 'lucide-react';
import type { DiscoverPage } from '@/lib/types';
import { GENRES } from '@/lib/types';
import { cx } from '@/lib/format';
import { Button, ButtonLink, Chip, Container, Empty } from '@/components/ui';
import { PosterCard, PosterSkeleton } from '@/components/PosterCard';
import { MOODS, MOOD_BY_SLUG } from './moods';
import { MoodIcon } from './MoodIcon';
import {
  DECADES, EMPTY, MAX_YEAR, MIN_YEAR, RUNTIMES, SORTS, TYPES, VOTES,
  isEmpty, parse, serialize, toFilters, type DiscoverState,
} from './state';

function useDebounced<T>(value: T, ms: number) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export function Discover() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<DiscoverState>(() => parse(new URLSearchParams(sp.toString())));
  const [drawer, setDrawer] = useState(false);

  // External URL changes (footer links, back/forward) → local state.
  // (React's "adjust state while rendering" pattern — no effect round-trip.)
  const spString = sp.toString();
  const [lastSp, setLastSp] = useState(spString);
  if (spString !== lastSp) {
    setLastSp(spString);
    const next = parse(new URLSearchParams(spString));
    if (serialize(next) !== serialize(state)) setState(next);
  }

  const debounced = useDebounced(state, 350);

  // Local state → URL (debounced so sliders don't spam history).
  useEffect(() => {
    const qs = serialize(debounced);
    if (qs !== spString) router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const filters = useMemo(() => toFilters(debounced), [debounced]);

  const q = useInfiniteQuery({
    queryKey: ['discover', filters],
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam, signal }) => {
      const r = await fetch('/api/discover', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ filters, after: pageParam, first: 48 }),
        signal,
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Search failed');
      return j as DiscoverPage;
    },
    getNextPageParam: (last) => last.cursor ?? undefined,
  });

  const items = useMemo(() => {
    const seen = new Set<string>();
    return (q.data?.pages ?? []).flatMap((p) => p.items).filter((c) => (seen.has(c.id) ? false : (seen.add(c.id), true)));
  }, [q.data]);
  const total = q.data?.pages[0]?.total;

  // Infinite scroll
  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (es) => {
        if (es[0].isIntersecting && q.hasNextPage && !q.isFetchingNextPage) q.fetchNextPage();
      },
      { rootMargin: '1200px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [q]);

  const set = (patch: Partial<DiscoverState>) => setState((s) => ({ ...s, ...patch }));
  const toggleIn = (key: 'genres' | 'types' | 'keywords', v: string) =>
    setState((s) => ({ ...s, [key]: s[key].includes(v) ? s[key].filter((x) => x !== v) : [...s[key], v] }));

  const mood = state.mood ? MOOD_BY_SLUG[state.mood] : undefined;

  // Bring the active mood card into view (e.g. arriving from a footer link on mobile).
  const moodRow = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const row = moodRow.current;
    const el = row?.querySelector<HTMLElement>(`[data-mood="${state.mood}"]`);
    if (row && el) row.scrollTo({ left: el.offsetLeft - row.offsetLeft - 16, behavior: 'smooth' });
  }, [state.mood]);
  const pills = activePills(state, set, toggleIn);

  return (
    <div className="pb-10 pt-28">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="eyebrow mb-3 text-leaf">Discover</div>
            <h1 className="display text-[clamp(3rem,7vw,6.5rem)]">
              {mood ? (
                <>
                  <span className="text-accent">{mood.label}</span>
                </>
              ) : (
                <>
                  Find your next <span className="text-accent">obsession</span>
                </>
              )}
            </h1>
            <p className="mt-4 max-w-xl text-muted">
              {mood ? mood.line : 'Every film and series on IMDb, filtered exactly the way you think about movies. Start with a mood, or build your own.'}
            </p>
          </div>
        </div>
      </Container>

      {/* Mood presets */}
      <div className="mt-10">
        <div ref={moodRow} className="scrollbar-none flex snap-x gap-3 overflow-x-auto scroll-px-4 px-4 pb-3 sm:scroll-px-8 sm:px-8 lg:scroll-px-12 lg:px-12">
          {MOODS.map((m, i) => {
            const active = state.mood === m.slug;
            return (
              <motion.button
                key={m.slug}
                data-mood={m.slug}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                onClick={() => setState({ ...EMPTY, sort: state.sort, order: state.order, mood: active ? undefined : m.slug })}
                className={cx(
                  'group relative h-36 w-52 shrink-0 snap-start overflow-hidden rounded-2xl p-4 text-left ring-1 transition-all duration-500 ease-out-expo sm:w-60',
                  active ? 'ring-2 ring-white/80 shadow-[0_20px_60px_-15px_rgb(0_0_0/0.9)]' : 'ring-white/10 hover:-translate-y-1 hover:ring-white/25'
                )}
                style={{ background: m.gradient }}
              >
                <span className="absolute inset-0 bg-gradient-to-t from-night/60 via-night/10 to-transparent" />
                <span className="absolute -right-3 -top-3 opacity-20 transition-all duration-700 group-hover:rotate-12 group-hover:scale-110 group-hover:opacity-30">
                  <MoodIcon icon={m.icon} size={96} strokeWidth={1.2} />
                </span>
                <span className="relative flex h-full flex-col justify-between">
                  <span className="grid size-9 place-items-center rounded-full bg-white/15 backdrop-blur">
                    <MoodIcon icon={m.icon} size={17} />
                  </span>
                  <span>
                    <span className="display block text-[1.7rem] leading-none">{m.label}</span>
                    <span className="mt-1 block text-xs text-white/70">{m.line}</span>
                  </span>
                </span>
                {active && (
                  <span className="absolute right-3 top-3 grid size-6 place-items-center rounded-full bg-white text-night">
                    <X size={13} strokeWidth={3} />
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      <Container className="mt-10 grid gap-10 lg:grid-cols-[280px_1fr]">
        {/* Sidebar (desktop) */}
        <aside className="hidden lg:block">
          <div className="sticky top-[calc(var(--nav-offset,4rem)+2rem)] transition-[top] duration-300 max-h-[calc(100dvh-7rem)] overflow-y-auto pr-2 scrollbar-none">
            <FilterPanel state={state} set={set} toggleIn={toggleIn} />
          </div>
        </aside>

        <section className="min-w-0">
          {/* Toolbar */}
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <Button size="sm" className="lg:hidden" onClick={() => setDrawer(true)}>
              <SlidersHorizontal size={14} /> Filters{pills.length ? ` · ${pills.length}` : ''}
            </Button>
            <div className="font-mono text-sm text-muted tabular">
              {total != null ? (
                <>
                  <span className="text-fg">{total.toLocaleString('en')}</span> titles
                </>
              ) : (
                <span className="animate-pulse-soft">Searching the archive…</span>
              )}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <label className="sr-only" htmlFor="sort">Sort by</label>
              <select
                id="sort"
                value={state.sort ?? 'POPULARITY'}
                onChange={(e) => set({ sort: e.target.value === 'POPULARITY' ? undefined : (e.target.value as DiscoverState['sort']), order: undefined })}
                className="glass h-9 rounded-full px-4 text-sm outline-none [&>option]:bg-s2"
              >
                {SORTS.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
              <OrderToggle state={state} set={set} />
            </div>
          </div>

          {pills.length > 0 && (
            <div className="mb-6 flex flex-wrap items-center gap-2">
              {pills.map((p) => (
                <button
                  key={p.key}
                  onClick={p.remove}
                  className="group inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.07] pl-3 pr-2 text-[13px] ring-1 ring-line-strong transition hover:bg-white/[0.12]"
                >
                  {p.label}
                  <X size={13} className="text-faint transition group-hover:text-fg" />
                </button>
              ))}
              <button onClick={() => setState({ ...EMPTY })} className="ml-1 inline-flex items-center gap-1.5 text-[13px] text-faint hover:text-fg">
                <RotateCcw size={12} /> Reset all
              </button>
            </div>
          )}

          {q.isError ? (
            <Empty title="The projector jammed" icon={<Telescope size={36} />}>
              IMDb didn’t answer this time. <button className="text-gold underline" onClick={() => q.refetch()}>Try again</button>
            </Empty>
          ) : !q.isLoading && items.length === 0 ? (
            <Empty title="Nothing on this reel" icon={<Telescope size={36} />}>
              No titles match every filter. Loosen a constraint or two — or let fate decide.
              <div className="mt-5 flex justify-center gap-2">
                <Button size="sm" onClick={() => setState({ ...EMPTY })}>Reset filters</Button>
                <ButtonLink size="sm" href="/roulette" variant="primary">Spin the roulette</ButtonLink>
              </div>
            </Empty>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {items.map((c, i) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: Math.min(i % 48, 16) * 0.02, ease: [0.22, 1, 0.36, 1] }}
                  className="min-w-0 [&_a]:w-full"
                >
                  <PosterCard card={c} className="w-full" priority={i < 12} />
                </motion.div>
              ))}
              {(q.isLoading || q.isFetchingNextPage) &&
                Array.from({ length: q.isLoading ? 18 : 12 }).map((_, i) => (
                  <div key={`sk${i}`} className="[&>div]:w-full">
                    <PosterSkeleton />
                  </div>
                ))}
            </div>
          )}
          <div ref={sentinel} className="h-10" />
          {!q.hasNextPage && items.length > 0 && !q.isFetching && (
            <div className="mt-6 text-center">
              <div className="eyebrow">Fin.</div>
              <div className="mt-2 text-sm text-faint">That’s the whole reel for these filters.</div>
            </div>
          )}
        </section>
      </Container>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawer && (
          <motion.div className="fixed inset-0 z-[70] lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-night/70 backdrop-blur-sm" onClick={() => setDrawer(false)} />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 360, damping: 36 }}
              className="absolute inset-y-0 right-0 flex w-[min(360px,92vw)] flex-col border-l border-line bg-s1"
            >
              <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <div className="display text-2xl">Filters</div>
                <button onClick={() => setDrawer(false)} className="glass grid size-9 place-items-center rounded-full" aria-label="Close filters">
                  <X size={16} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-5">
                <FilterPanel state={state} set={set} toggleIn={toggleIn} />
              </div>
              <div className="border-t border-line p-4">
                <Button variant="primary" className="w-full" onClick={() => setDrawer(false)}>
                  Show {total != null ? total.toLocaleString('en') : ''} titles
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function OrderToggle({ state, set }: { state: DiscoverState; set: (p: Partial<DiscoverState>) => void }) {
  const sort = state.sort ?? 'POPULARITY';
  const def = sort === 'POPULARITY' || sort === 'TITLE_REGIONAL' ? 'ASC' : 'DESC';
  const cur = state.order ?? def;
  // For popularity, ASC means "most popular first" — present it as the natural "descending" arrow.
  const natural = cur === def;
  return (
    <button
      onClick={() => set({ order: natural ? (def === 'ASC' ? 'DESC' : 'ASC') : undefined })}
      className="glass grid size-9 place-items-center rounded-full transition hover:bg-white/10"
      aria-label={natural ? 'Reverse order' : 'Restore default order'}
      title={natural ? 'Reverse order' : 'Restore default order'}
    >
      {natural ? <ArrowDownWideNarrow size={15} /> : <ArrowUpNarrowWide size={15} />}
    </button>
  );
}

function FilterPanel({
  state,
  set,
  toggleIn,
}: {
  state: DiscoverState;
  set: (p: Partial<DiscoverState>) => void;
  toggleIn: (k: 'genres' | 'types' | 'keywords', v: string) => void;
}) {
  const from = state.from ?? MIN_YEAR;
  const to = state.to ?? MAX_YEAR;
  const decade = state.from && state.to && state.to - state.from === 9 && state.from % 10 === 0 ? state.from : null;

  return (
    <div className="space-y-8">
      <Group label="Format">
        <div className="flex flex-wrap gap-2">
          {TYPES.map((t) => (
            <Chip key={t.id} active={state.types.includes(t.id)} onClick={() => toggleIn('types', t.id)}>
              {t.label}
            </Chip>
          ))}
        </div>
      </Group>

      <Group label="Genres" hint={state.genres.length > 1 ? 'Matching all selected' : undefined}>
        <div className="flex flex-wrap gap-1.5">
          {GENRES.map((g) => (
            <Chip key={g} active={state.genres.includes(g)} onClick={() => toggleIn('genres', g)} className="h-7 px-3 text-[12px]">
              {g}
            </Chip>
          ))}
        </div>
      </Group>

      <Group label="Era" value={state.from || state.to ? `${from}–${Math.min(to, MAX_YEAR)}` : 'All time'}>
        <div className="mb-4 grid grid-cols-4 gap-1.5">
          {DECADES.map((d) => (
            <button
              key={d}
              onClick={() => (decade === d ? set({ from: undefined, to: undefined }) : set({ from: d, to: d + 9 }))}
              className={cx(
                'h-8 rounded-lg font-mono text-[12px] transition',
                decade === d ? 'bg-leaf text-night' : 'bg-white/[0.04] text-muted ring-1 ring-line hover:text-fg'
              )}
            >
              {String(d).slice(2)}s
            </button>
          ))}
        </div>
        <DualRange
          min={MIN_YEAR}
          max={MAX_YEAR}
          lo={from}
          hi={to}
          onChange={(lo, hi) => set({ from: lo === MIN_YEAR ? undefined : lo, to: hi === MAX_YEAR ? undefined : hi })}
        />
      </Group>

      <Group label="Minimum IMDb rating" value={state.rating ? `★ ${state.rating.toFixed(1)}+` : 'Any'}>
        <input
          type="range"
          min={0}
          max={9.5}
          step={0.5}
          value={state.rating ?? 0}
          onChange={(e) => set({ rating: +e.target.value || undefined })}
          aria-label="Minimum rating"
        />
        <div className="mt-1 flex justify-between font-mono text-[10px] text-faint">
          <span>0</span><span>5</span><span>9.5</span>
        </div>
      </Group>

      <Group label="Minimum votes">
        <div className="grid grid-cols-3 gap-1.5">
          {VOTES.map((v) => (
            <button
              key={v.v}
              onClick={() => set({ votes: v.v || undefined })}
              className={cx(
                'h-8 rounded-lg font-mono text-[12px] transition',
                (state.votes ?? 0) === v.v ? 'bg-leaf text-night' : 'bg-white/[0.04] text-muted ring-1 ring-line hover:text-fg'
              )}
            >
              {v.label}
            </button>
          ))}
        </div>
      </Group>

      <Group label="Runtime">
        <div className="flex flex-wrap gap-1.5">
          {RUNTIMES.map((r) => (
            <Chip key={r.v} active={(state.runtime ?? 0) === r.v} onClick={() => set({ runtime: r.v || undefined })} className="h-7 px-3 text-[12px]">
              {r.label}
            </Chip>
          ))}
        </div>
      </Group>

      {!isEmpty(state) && (
        <Button variant="ghost" size="sm" onClick={() => set({ ...EMPTY, mood: undefined, from: undefined, to: undefined, rating: undefined, votes: undefined, runtime: undefined, sort: undefined, order: undefined })}>
          <RotateCcw size={13} /> Reset filters
        </Button>
      )}
    </div>
  );
}

function Group({ label, value, hint, children }: { label: string; value?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <span className="eyebrow">{label}</span>
        {value && <span className="font-mono text-xs text-fg tabular">{value}</span>}
        {hint && <span className="text-[11px] text-faint">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

/** Two overlaid native range inputs with a filled track between the thumbs. */
function DualRange({ min, max, lo, hi, onChange }: { min: number; max: number; lo: number; hi: number; onChange: (lo: number, hi: number) => void }) {
  const pct = (v: number) => ((v - min) / (max - min)) * 100;
  return (
    <div className="relative h-6">
      <div className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded bg-s4" />
      <div
        className="absolute top-1/2 h-[3px] -translate-y-1/2 rounded bg-accent"
        style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }}
      />
      {[
        { v: lo, set: (v: number) => onChange(Math.min(v, hi - 1), hi), label: 'From year' },
        { v: hi, set: (v: number) => onChange(lo, Math.max(v, lo + 1)), label: 'To year' },
      ].map((t, i) => (
        <input
          key={i}
          type="range"
          min={min}
          max={max}
          value={t.v}
          aria-label={t.label}
          onChange={(e) => t.set(+e.target.value)}
          className="pointer-events-none absolute inset-0 [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-track]:bg-transparent [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto"
        />
      ))}
    </div>
  );
}

function activePills(
  s: DiscoverState,
  set: (p: Partial<DiscoverState>) => void,
  toggleIn: (k: 'genres' | 'types' | 'keywords', v: string) => void
) {
  const out: { key: string; label: string; remove: () => void }[] = [];
  if (s.mood) out.push({ key: 'mood', label: `Mood: ${MOOD_BY_SLUG[s.mood]?.label}`, remove: () => set({ mood: undefined }) });
  for (const t of s.types) out.push({ key: `t:${t}`, label: TYPES.find((x) => x.id === t)?.label ?? t, remove: () => toggleIn('types', t) });
  for (const g of s.genres) out.push({ key: `g:${g}`, label: g, remove: () => toggleIn('genres', g) });
  for (const k of s.keywords) out.push({ key: `k:${k}`, label: `#${k}`, remove: () => toggleIn('keywords', k) });
  if (s.from || s.to) out.push({ key: 'yr', label: `${s.from ?? MIN_YEAR}–${s.to ?? 'now'}`, remove: () => set({ from: undefined, to: undefined }) });
  if (s.rating) out.push({ key: 'r', label: `★ ${s.rating}+`, remove: () => set({ rating: undefined }) });
  if (s.votes) out.push({ key: 'v', label: `${VOTES.find((v) => v.v === s.votes)?.label ?? s.votes} votes`, remove: () => set({ votes: undefined }) });
  if (s.runtime) out.push({ key: 'rt', label: RUNTIMES.find((r) => r.v === s.runtime)?.label ?? `≤ ${s.runtime}m`, remove: () => set({ runtime: undefined }) });
  return out;
}
