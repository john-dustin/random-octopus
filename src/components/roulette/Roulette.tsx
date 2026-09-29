'use client';

import Link from 'next/link';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, animate, motion, useMotionValue, useTransform, useVelocity } from 'motion/react';
import { Dices, Play, Bookmark, BookmarkCheck, RotateCw, ArrowUpRight, Volume2, VolumeX, Sparkles, Ticket } from 'lucide-react';
import type { Card, DiscoverFilters, DiscoverPage, TitleDetail } from '@/lib/types';
import { GENRES } from '@/lib/types';
import { cx, img, poster, runtime, titleHref, years } from '@/lib/format';
import { useLibrary, useUI } from '@/lib/store';
import { useHotkey, useImageColor, useMounted } from '@/lib/hooks';
import { Button, ButtonLink, Chip, Container, RatingRing } from '@/components/ui';
import { MOOD_BY_SLUG } from '@/components/discover/moods';
import { MoodIcon } from '@/components/discover/MoodIcon';
import { chime, tick, unlockAudio } from './sound';

const DECADES = [1970, 1980, 1990, 2000, 2010, 2020];
const RUNTIMES = [
  { v: 0, label: 'Any length' },
  { v: 100, label: 'Under 100m' },
  { v: 130, label: 'Under 2h10' },
  { v: 160, label: 'Under 2h40' },
];
const BARS = [
  { v: 6, label: 'Watchable', hint: '6+' },
  { v: 7, label: 'Good', hint: '7+' },
  { v: 8, label: 'Great', hint: '8+' },
];
const ROULETTE_MOODS = ['mindbender', 'feelgood', 'gems', 'midnight', 'epic', 'heist', 'animated', 'romance', 'space', 'cult'];

const GAP = 14;
const LEAD = 3; // index of the frame centred before a spin
const RUN = 46; // frames that fly past per spin
const HISTORY_KEY = 'lumiere-roulette-history';
const SOUND_KEY = 'lumiere-roulette-sound';

type Prefs = { mood: string | null; genre: string | null; decade: number | null; runtime: number; bar: number };

function buildFilters(p: Prefs): DiscoverFilters {
  const m = p.mood ? MOOD_BY_SLUG[p.mood]?.filters ?? {} : {};
  const gems = p.mood === 'gems';
  const genres = [...new Set([...(m.genres ?? []), ...(p.genre ? [p.genre] : [])])];
  return {
    ...m,
    types: ['movie'],
    genres: genres.length ? genres : undefined,
    from: p.decade ?? m.from,
    to: p.decade ? p.decade + 9 : m.to,
    maxRuntime: p.runtime || m.maxRuntime,
    minRating: Math.max(p.bar, m.minRating ?? 0),
    minVotes: gems ? m.minVotes : Math.max(15000, m.minVotes ?? 0),
    sort: 'POPULARITY',
  };
}

const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

function readStore<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
function writeStore(key: string, v: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {
    /* private mode */
  }
}

export function Roulette() {
  const mounted = useMounted();
  const seen = useLibrary((s) => s.seen);
  const play = useUI((s) => s.play);
  const toast = useUI((s) => s.toast);

  const [prefs, setPrefs] = useState<Prefs>({ mood: null, genre: null, decade: null, runtime: 0, bar: 7 });
  const [strip, setStrip] = useState<Card[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<{ card: Card; detail?: TitleDetail } | null>(null);
  const [history, setHistory] = useState<Card[]>(() => readStore<Card[]>(HISTORY_KEY, []));
  const [sound, setSound] = useState(() => readStore<boolean>(SOUND_KEY, true));
  const [error, setError] = useState<string | null>(null);
  const [width, setWidth] = useState(0);

  const pools = useRef(new Map<string, Card[]>());
  const reelRef = useRef<HTMLDivElement>(null);
  const blurRef = useRef<SVGFEGaussianBlurElement>(null);
  const pending = useRef<{ target: number } | null>(null);
  const lastIdx = useRef(-1);
  const soundRef = useRef(true);
  const spinningRef = useRef(false);
  const runRef = useRef<(() => void) | null>(null);

  const itemW = width && width < 640 ? 118 : 164;
  const step = itemW + GAP;
  const centerX = useCallback((i: number) => width / 2 - (i * step + itemW / 2), [width, step, itemW]);

  // Motion: position → velocity → directional blur + skew
  const x = useMotionValue(0);
  const v = useVelocity(x);
  const blur = useTransform(v, [-9000, 0, 9000], [14, 0, 14], { clamp: true });
  const skew = useTransform(v, [-9000, 0, 9000], [3, 0, -3], { clamp: true });

  useEffect(() => blur.on('change', (b) => blurRef.current?.setAttribute('stdDeviation', `${b.toFixed(1)} 0`)), [blur]);

  // Ticks as each frame crosses the gate
  useEffect(
    () =>
      x.on('change', (px) => {
        if (!step) return;
        const idx = Math.round((width / 2 - itemW / 2 - px) / step);
        if (idx !== lastIdx.current) {
          lastIdx.current = idx;
          if (soundRef.current && pending.current === null && spinningRef.current) tick(0.9);
        }
      }),
    [x, step, width, itemW]
  );

  useEffect(() => {
    soundRef.current = sound;
  }, [sound]);

  // Container width
  useEffect(() => {
    const el = reelRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Idle: recentre when the layout changes
  useEffect(() => {
    if (!spinningRef.current && width) x.set(centerX(winner ? LEAD + RUN : LEAD));
  }, [width, centerX, x, winner]);

  const getPool = useCallback(async (p: Prefs) => {
    const filters = buildFilters(p);
    const key = JSON.stringify(filters);
    const hit = pools.current.get(key);
    if (hit) return hit;
    const r = await fetch('/api/discover', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ filters, first: 150 }),
    });
    const j = (await r.json()) as DiscoverPage & { error?: string };
    if (!r.ok) throw new Error(j.error || 'IMDb is unreachable');
    const items = j.items.filter((c) => c.poster);
    pools.current.set(key, items);
    return items;
  }, []);

  // Warm up an idle reel on first load
  useEffect(() => {
    getPool(prefs)
      .then((pool) => setStrip((s) => (s.length ? s : Array.from({ length: LEAD + 8 }, () => pick(pool)))))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const spin = useCallback(async () => {
    if (spinningRef.current) return;
    unlockAudio();
    spinningRef.current = true;
    setSpinning(true);
    setError(null);
    const stage = document.getElementById('reel-stage');
    if (stage) {
      const r = stage.getBoundingClientRect();
      if (r.top < 64 || r.bottom > window.innerHeight) stage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    try {
      const pool = await getPool(prefs);
      if (!pool.length) throw new Error('No films match that combination — loosen a filter and spin again.');
      const recent = new Set(history.slice(0, 6).map((h) => h.id));
      let candidates = pool.filter((c) => !seen[c.id] && !recent.has(c.id));
      if (!candidates.length) candidates = pool.filter((c) => !seen[c.id]);
      if (!candidates.length) candidates = pool;
      const win = pick(candidates);

      // Prefetch the reveal while the reel runs.
      const detailP = fetch(`/api/title?id=${win.id}`)
        .then((r) => (r.ok ? (r.json() as Promise<TitleDetail>) : undefined))
        .catch(() => undefined);

      // Keep the currently centred frame so the swap is invisible, then fill the run.
      const current = strip[winner ? LEAD + RUN : LEAD] ?? pick(pool);
      const filler = () => pick(pool.filter((c) => c.id !== win.id)) ?? win;
      const next = [
        ...Array.from({ length: LEAD }, filler),
        current,
        ...Array.from({ length: RUN - 1 }, filler),
        win,
        ...Array.from({ length: 5 }, filler),
      ];
      setWinner(null);
      pending.current = { target: LEAD + RUN };
      lastIdx.current = -1;
      setStrip(next);
      const detail = await new Promise<TitleDetail | undefined>((resolve) => {
        runRef.current = async () => {
          const target = centerX(LEAD + RUN);
          const jitter = (Math.random() - 0.5) * itemW * 0.7;
          pending.current = null;
          await animate(x, target + jitter, { duration: 5.6, ease: [0.55, 0, 0.08, 1] });
          await animate(x, target, { type: 'spring', stiffness: 260, damping: 18 });
          resolve(await detailP);
        };
      });
      if (soundRef.current) chime();
      setWinner({ card: win, detail });
      setHistory((h) => {
        const nh = [win, ...h.filter((c) => c.id !== win.id)].slice(0, 10);
        writeStore(HISTORY_KEY, nh);
        return nh;
      });
      setTimeout(() => document.getElementById('reveal')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 250);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      spinningRef.current = false;
      setSpinning(false);
    }
  }, [getPool, prefs, history, seen, strip, winner, centerX, itemW, x]);

  // Kick the animation once the new strip is in the DOM, starting from the matching frame.
  useLayoutEffect(() => {
    if (pending.current && runRef.current) {
      x.set(centerX(LEAD));
      const run = runRef.current;
      runRef.current = null;
      requestAnimationFrame(() => run());
    }
  }, [strip, centerX, x]);

  useHotkey(' ', (e) => {
    e.preventDefault();
    spin();
  });

  const toggleSound = () => {
    const s = !sound;
    setSound(s);
    soundRef.current = s;
    writeStore(SOUND_KEY, s);
    if (s) {
      unlockAudio();
      tick();
    }
  };

  const set = (p: Partial<Prefs>) => setPrefs((o) => ({ ...o, ...p }));

  return (
    <div className="pb-10 pt-28">
      <Container>
        <div className="grid items-end gap-8 lg:grid-cols-[1fr_auto]">
          <div>
            <div className="eyebrow mb-4 flex items-center gap-2 text-poppy">
              <Dices size={13} /> Movie Roulette
            </div>
            <h1 className="display text-[clamp(3.2rem,8.5vw,8rem)]">
              Can’t decide? <br className="hidden sm:block" />
              <span className="text-accent">Let fate pick.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted">
              Set the mood, pull the lever, and the reel lands on tonight’s film. We skip anything you’ve already seen.
            </p>
          </div>
          <button
            onClick={toggleSound}
            className="glass inline-flex h-10 items-center gap-2 self-start rounded-full px-4 text-sm text-muted transition hover:text-fg lg:self-end"
            aria-pressed={!mounted || sound}
          >
            {!mounted || sound ? <Volume2 size={15} /> : <VolumeX size={15} />} Sound {!mounted || sound ? 'on' : 'off'}
          </button>
        </div>

        {/* Controls */}
        <div className="panel mt-10 grid gap-7 p-5 sm:p-7 lg:grid-cols-[1.6fr_1fr]">
          <div>
            <div className="eyebrow mb-3 text-bloom">Mood</div>
            <div className="flex flex-wrap gap-2">
              <Chip active={!prefs.mood} onClick={() => set({ mood: null })}>
                <span className="inline-flex items-center gap-1.5"><Sparkles size={13} /> Anything</span>
              </Chip>
              {ROULETTE_MOODS.map((slug) => {
                const m = MOOD_BY_SLUG[slug];
                return (
                  <Chip key={slug} active={prefs.mood === slug} onClick={() => set({ mood: prefs.mood === slug ? null : slug })}>
                    <span className="inline-flex items-center gap-1.5">
                      <MoodIcon icon={m.icon} size={13} /> {m.label}
                    </span>
                  </Chip>
                );
              })}
            </div>
            <div className="eyebrow mb-3 mt-6 text-sky">Decade</div>
            <div className="flex flex-wrap gap-2">
              <Chip active={prefs.decade == null} onClick={() => set({ decade: null })}>Any era</Chip>
              {DECADES.map((d) => (
                <Chip key={d} active={prefs.decade === d} onClick={() => set({ decade: prefs.decade === d ? null : d })}>
                  {d}s
                </Chip>
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <div>
              <label className="eyebrow mb-3 block text-leaf" htmlFor="rgenre">Genre</label>
              <select
                id="rgenre"
                value={prefs.genre ?? ''}
                onChange={(e) => set({ genre: e.target.value || null })}
                className="glass h-10 w-full rounded-xl px-3.5 text-sm outline-none [&>option]:bg-s2"
              >
                <option value="">Any genre</option>
                {GENRES.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <Segmented label="Runtime" options={RUNTIMES.map((r) => ({ v: r.v, label: r.label }))} value={prefs.runtime} onChange={(v) => set({ runtime: v })} />
            <Segmented label="Quality bar" options={BARS.map((b) => ({ v: b.v, label: `${b.label} ${b.hint}` }))} value={prefs.bar} onChange={(v) => set({ bar: v })} />
          </div>
        </div>
      </Container>

      {/* The reel */}
      <section id="reel-stage" className="relative mt-14">
        <svg width="0" height="0" className="absolute" aria-hidden>
          <filter id="reel-blur" x="-10%" y="0" width="120%" height="100%">
            <feGaussianBlur ref={blurRef} stdDeviation="0 0" />
          </filter>
        </svg>

        <div className={cx('bulbs h-3.5 transition-opacity duration-500', spinning ? 'animate-pulse-soft opacity-100' : 'opacity-40')} aria-hidden />
        <div
          ref={reelRef}
          className="relative h-[250px] overflow-hidden bg-[#17140f] shadow-[inset_0_10px_30px_rgb(0_0_0/0.6),inset_0_-10px_30px_rgb(0_0_0/0.6)] sm:h-[318px]"
          style={{ maskImage: 'linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)' }}
        >
          <motion.div className="absolute inset-y-0 left-0 flex will-change-transform" style={{ x, skewX: skew, filter: 'url(#reel-blur)' }}>
            {strip.map((c, i) => (
              <Frame key={`${i}-${c.id}`} card={c} w={itemW} win={!!winner && i === LEAD + RUN} />
            ))}
          </motion.div>

          {/* Gate */}
          <div className="pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2" style={{ width: itemW + 18 }}>
            <div
              className={cx(
                'absolute inset-y-4 inset-x-0 rounded-[18px] border-2 transition-all duration-500',
                winner ? 'border-accent shadow-[0_0_60px_rgb(var(--accent)/0.7),inset_0_0_40px_rgb(var(--accent)/0.25)]' : 'border-white/70 shadow-[0_0_30px_rgb(255_255_255/0.2)]'
              )}
            />
            <div className="absolute left-1/2 top-0 -translate-x-1/2 border-x-[9px] border-t-[12px] border-x-transparent border-t-accent" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 border-x-[9px] border-b-[12px] border-x-transparent border-b-accent" />
          </div>

          {strip.length === 0 && (
            <div className="absolute inset-0 flex items-center gap-[14px] px-6">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="skeleton aspect-[2/3] h-[70%] shrink-0 rounded-lg" />
              ))}
            </div>
          )}
        </div>
        <div className={cx('bulbs h-3.5 transition-opacity duration-500', spinning ? 'animate-pulse-soft opacity-100' : 'opacity-40')} aria-hidden />

        {/* Lever */}
        <div className="mt-10 flex flex-col items-center gap-4">
          <motion.button
            onClick={spin}
            disabled={spinning}
            whileHover={{ scale: spinning ? 1 : 1.04 }}
            whileTap={{ scale: 0.94 }}
            className={cx(
              'group relative grid size-36 place-items-center rounded-full text-night transition-shadow duration-500 sm:size-40',
              'bg-[radial-gradient(circle_at_35%_30%,#ffe7a8,#e9b454_45%,#a8711f)]',
              spinning ? 'shadow-[0_0_80px_rgb(233_180_84/0.8)]' : 'shadow-[0_20px_60px_-10px_rgb(233_180_84/0.6)] hover:shadow-[0_20px_90px_-5px_rgb(233_180_84/0.8)]'
            )}
          >
            <span className="absolute inset-2 rounded-full border border-night/15" />
            <span className={cx('absolute inset-0 rounded-full border-2 border-dashed border-night/20', spinning && 'animate-spin-slow')} />
            <span className="relative flex flex-col items-center">
              <motion.span animate={spinning ? { rotate: 360 } : { rotate: 0 }} transition={spinning ? { repeat: Infinity, duration: 0.8, ease: 'linear' } : { duration: 0.4 }}>
                <Dices size={30} strokeWidth={1.8} />
              </motion.span>
              <span className="display mt-1 text-3xl leading-none">{spinning ? 'Rolling…' : winner ? 'Again' : 'Spin'}</span>
            </span>
          </motion.button>
          <div className="text-xs text-faint">
            or press <kbd className="rounded border border-line-strong px-1.5 py-0.5 font-mono text-[10px]">Space</kbd>
          </div>
          {error && <div className="max-w-md text-center text-sm text-danger">{error}</div>}
        </div>
      </section>

      {/* Reveal */}
      <div id="reveal" className="scroll-mt-20">
        <AnimatePresence mode="wait">
          {winner && (
            <Reveal
              key={winner.card.id}
              card={winner.card}
              detail={winner.detail}
              onSpin={spin}
              onTrailer={() => winner.detail?.videos.length && play(winner.detail.videos, 0, winner.card.title)}
              toast={toast}
            />
          )}
        </AnimatePresence>
      </div>

      {/* History */}
      {mounted && history.length > 0 && (
        <Container className="mt-20">
          <div className="mb-4 flex items-baseline justify-between">
            <div>
              <div className="eyebrow text-lavender">Previous spins</div>
              <div className="display mt-1 text-3xl">Fate’s recent picks</div>
            </div>
            <button
              className="text-xs text-faint hover:text-fg"
              onClick={() => {
                setHistory([]);
                writeStore(HISTORY_KEY, []);
              }}
            >
              Clear
            </button>
          </div>
          <div className="scrollbar-none flex gap-3 overflow-x-auto pb-2">
            {history.map((c) => (
              <Link key={c.id} href={titleHref(c.id)} className="group w-24 shrink-0 sm:w-28" title={c.title}>
                <div className="sheen aspect-[2/3] overflow-hidden rounded-lg bg-s2 ring-1 ring-white/5 transition group-hover:-translate-y-1 group-hover:ring-white/20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {c.poster && <img src={poster(c.poster, 200)} alt="" loading="lazy" className="size-full object-cover" />}
                </div>
                <div className="mt-1.5 truncate text-xs text-muted">{c.title}</div>
              </Link>
            ))}
          </div>
        </Container>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Frame({ card, w, win }: { card: Card; w: number; win: boolean }) {
  const holes = (
    <div className="flex justify-around px-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <span key={i} className="h-2.5 w-3.5 rounded-[3px] bg-night shadow-[inset_0_1px_2px_rgb(0_0_0/0.9),0_1px_0_rgb(255_255_255/0.05)]" />
      ))}
    </div>
  );
  return (
    <div className="flex h-full shrink-0 flex-col justify-between py-2.5" style={{ width: w + GAP }}>
      {holes}
      <div className="px-[7px]">
        <div
          className={cx(
            'relative aspect-[2/3] overflow-hidden rounded-md bg-s2 ring-1 transition-all duration-700',
            win ? 'ring-2 ring-accent brightness-110' : 'ring-white/10'
          )}
        >
          {card.poster && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={poster(card.poster, 320)} alt="" draggable={false} className="size-full object-cover" />
          )}
          <span className="absolute inset-0 bg-gradient-to-b from-white/[0.06] to-transparent" />
        </div>
      </div>
      {holes}
    </div>
  );
}

function Segmented({ label, options, value, onChange }: { label: string; options: { v: number; label: string }[]; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="eyebrow mb-3 text-gold">{label}</div>
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
        {options.map((o) => (
          <button
            key={o.v}
            onClick={() => onChange(o.v)}
            aria-pressed={value === o.v}
            className={cx(
              'h-9 rounded-lg px-2 text-[12px] transition',
              value === o.v ? 'bg-leaf font-semibold text-night' : 'bg-white/[0.04] text-muted ring-1 ring-line hover:text-fg'
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Reveal({
  card,
  detail,
  onSpin,
  onTrailer,
  toast,
}: {
  card: Card;
  detail?: TitleDetail;
  onSpin: () => void;
  onTrailer: () => void;
  toast: (t: string, i?: string) => void;
}) {
  const mounted = useMounted();
  const inList = useLibrary((s) => !!s.watchlist[card.id]);
  const toggle = useLibrary((s) => s.toggleWatchlist);
  const d = detail ?? (card as TitleDetail);
  const still = detail?.stills?.[0]?.url;
  const color = useImageColor(card.poster);
  const watch = (detail?.watch ?? []).flatMap((c) => c.options.map((o) => ({ ...o, category: c.category }))).slice(0, 4);
  const director = detail?.directors?.[0]?.name;

  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20, transition: { duration: 0.25 } }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      className="relative mt-20"
    >
      <Container>
        <div className="relative overflow-hidden rounded-[28px] ring-1 ring-white/10" style={{ background: `rgb(${color} / 0.08)` }}>
          {/* Backdrop */}
          <motion.div initial={{ scale: 1.15, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }} className="absolute inset-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img(still ?? card.poster, 1600)} alt="" className={cx('size-full object-cover', still ? 'opacity-50' : 'scale-110 opacity-30 blur-2xl')} />
          </motion.div>
          <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/85 to-bg/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-transparent" />
          {/* Spotlight cone */}
          <motion.div
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 1.2 }}
            className="pointer-events-none absolute -top-40 left-[8%] h-[140%] w-[420px] origin-top -rotate-12"
            style={{ background: `conic-gradient(from 180deg at 50% 0%, transparent 160deg, rgb(${color} / 0.22) 180deg, transparent 200deg)` }}
          />

          <div className="relative grid gap-8 p-6 sm:p-10 md:grid-cols-[240px_1fr] lg:grid-cols-[300px_1fr] lg:p-14">
            <motion.div
              initial={{ rotateY: -90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              transition={{ delay: 0.15, duration: 1, ease: [0.22, 1, 0.36, 1] }}
              style={{ transformPerspective: 1200 }}
              className="mx-auto w-48 md:w-full"
            >
              <Link href={titleHref(card.id)} className="sheen block aspect-[2/3] overflow-hidden rounded-2xl shadow-[0_40px_90px_-20px_rgb(0_0_0/0.95)] ring-1 ring-white/15">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={poster(card.poster, 600)} alt={card.title} className="size-full object-cover" />
              </Link>
            </motion.div>

            <div className="min-w-0">
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="eyebrow flex items-center gap-2 text-accent">
                <Ticket size={13} /> Tonight you’re watching
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ delay: 0.45, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                className="display mt-3 text-[clamp(2.6rem,6vw,5.5rem)]"
              >
                {card.title}
              </motion.h2>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }}>
                <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted tabular">
                  <span>{years(card.year, card.endYear, card.series)}</span>
                  {card.runtime && <><Dot /><span>{runtime(card.runtime)}</span></>}
                  {card.cert && <><Dot /><span className="rounded border border-line-strong px-1.5 text-xs">{card.cert}</span></>}
                  {director && <><Dot /><span>Directed by <span className="text-fg">{director}</span></span></>}
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {card.genres.map((g) => (
                    <span key={g} className="rounded-full bg-white/[0.07] px-2.5 py-1 text-xs text-muted ring-1 ring-line">{g}</span>
                  ))}
                </div>
                <div className="mt-6 flex flex-wrap items-center gap-6">
                  <RatingRing value={card.rating} size={62} label="IMDb" sub={card.votes ? `${card.votes.toLocaleString('en')} votes` : undefined} />
                  {detail?.metascore != null && <RatingRing value={detail.metascore} max={100} size={62} label="Metascore" sub="Critics" />}
                </div>
                {(detail?.tagline || d.plot) && (
                  <div className="mt-6 max-w-2xl">
                    {detail?.tagline && <p className="display text-2xl text-fg/90">“{detail.tagline}”</p>}
                    {d.plot && <p className="mt-3 leading-relaxed text-muted">{d.plot}</p>}
                  </div>
                )}

                {watch.length > 0 && (
                  <div className="mt-7">
                    <div className="eyebrow mb-3 text-lagoon">Where to watch</div>
                    <div className="flex flex-wrap gap-2">
                      {watch.map((o) => (
                        <a
                          key={`${o.category}-${o.name}`}
                          href={o.link}
                          target="_blank"
                          rel="noreferrer"
                          className="glass inline-flex h-10 items-center gap-2 rounded-full pl-1.5 pr-4 text-sm transition hover:bg-white/10"
                        >
                          {o.logo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={img(o.logo, 60)} alt="" className="size-7 rounded-full object-cover" />
                          ) : (
                            <span className="size-7 rounded-full bg-s3" />
                          )}
                          {o.name}
                          <span className="text-[10px] uppercase tracking-wider text-faint">{o.category === 'STREAMING' ? 'Stream' : o.category === 'RENT/BUY' ? 'Rent/buy' : o.category?.toLowerCase()}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-8 flex flex-wrap gap-3">
                  {detail?.videos?.length ? (
                    <Button variant="primary" size="lg" onClick={onTrailer}>
                      <Play size={16} fill="currentColor" /> Play trailer
                    </Button>
                  ) : null}
                  <Button
                    size="lg"
                    onClick={() => {
                      const on = toggle(card);
                      toast(on ? `Added “${card.title}” to your watchlist` : `Removed “${card.title}”`, on ? 'bookmark' : 'x');
                    }}
                  >
                    {mounted && inList ? <BookmarkCheck size={16} className="text-gold" /> : <Bookmark size={16} />}
                    {mounted && inList ? 'On your watchlist' : 'Add to watchlist'}
                  </Button>
                  <Button size="lg" variant="outline" onClick={onSpin}>
                    <RotateCw size={16} /> Spin again
                  </Button>
                  <ButtonLink size="lg" variant="ghost" href={titleHref(card.id)}>
                    Details <ArrowUpRight size={16} />
                  </ButtonLink>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </Container>
    </motion.section>
  );
}

const Dot = () => <span className="size-1 rounded-full bg-faint" />;

