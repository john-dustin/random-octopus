'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Bookmark, BookOpenCheck, BarChart3, Download, Upload, Trash2, Shuffle, Check, X, Clock, Film, Star, Dices, Compass,
} from 'lucide-react';
import type { Card } from '@/lib/types';
import { cx, poster, ratingColor, runtime, titleHref, years } from '@/lib/format';
import { useLibrary, useUI, type LibEntry, type SeenEntry } from '@/lib/store';
import { useMounted } from '@/lib/hooks';
import { Button, ButtonLink, Chip, Container, Empty } from '@/components/ui';
import { PosterCard, PosterSkeleton } from '@/components/PosterCard';
import { Columns, HBars } from '@/components/charts/Bars';

type Tab = 'watchlist' | 'diary' | 'stats';

export function Library() {
  const mounted = useMounted();
  const watchlist = useLibrary((s) => s.watchlist);
  const seen = useLibrary((s) => s.seen);
  const importData = useLibrary((s) => s.importData);
  const clear = useLibrary((s) => s.clear);
  const toast = useUI((s) => s.toast);
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('watchlist');
  const fileRef = useRef<HTMLInputElement>(null);

  const w = useMemo(() => Object.values(watchlist), [watchlist]);
  const s = useMemo(() => Object.values(seen), [seen]);
  const hours = Math.round(s.reduce((a, c) => a + (c.runtime ?? 0), 0) / 3600);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ app: 'lumiere', version: 1, exportedAt: new Date().toISOString(), watchlist, seen }, null, 2)], {
      type: 'application/json',
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `lumiere-library-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast('Library exported', 'check');
  };

  const importJson = async (file: File) => {
    try {
      const d = JSON.parse(await file.text());
      const ok = (o: unknown) => o && typeof o === 'object' && !Array.isArray(o);
      if (!ok(d) || (!ok(d.watchlist) && !ok(d.seen))) throw new Error('bad');
      const valid = <T,>(o: Record<string, T>) =>
        Object.fromEntries(Object.entries(o ?? {}).filter(([k, v]) => /^tt\d+$/.test(k) && v && typeof v === 'object')) as Record<string, T>;
      const wl = valid<LibEntry>(d.watchlist);
      const sn = valid<SeenEntry>(d.seen);
      importData({ watchlist: wl, seen: sn });
      toast(`Imported ${Object.keys(wl).length + Object.keys(sn).length} titles`, 'sparkles');
    } catch {
      toast('That file isn’t a Lumière export', 'x');
    }
  };

  const surprise = () => {
    if (!w.length) return;
    const c = w[Math.floor(Math.random() * w.length)];
    toast(`Tonight: ${c.title}`, 'sparkles');
    router.push(titleHref(c.id));
  };

  const TABS: { id: Tab; label: string; icon: typeof Bookmark; count?: number }[] = [
    { id: 'watchlist', label: 'Watchlist', icon: Bookmark, count: w.length },
    { id: 'diary', label: 'Diary', icon: BookOpenCheck, count: s.length },
    { id: 'stats', label: 'Stats', icon: BarChart3 },
  ];

  return (
    <div className="pb-10 pt-28">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="eyebrow mb-3 text-bloom">Your library</div>
            <h1 className="display text-[clamp(3rem,7vw,6.5rem)]">
              The <span className="text-accent">screening room</span>
            </h1>
            <p className="mt-4 text-muted tabular">
              {mounted ? (
                <>
                  {w.length} on your watchlist · {s.length} watched{hours ? ` · ${hours.toLocaleString('en')} hours in the dark` : ''}
                </>
              ) : (
                <span className="skeleton inline-block h-4 w-64 rounded align-middle" />
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="primary" onClick={surprise} disabled={!mounted || !w.length}>
              <Shuffle size={14} /> Surprise me
            </Button>
            <Button size="sm" onClick={exportJson} disabled={!mounted || (!w.length && !s.length)}>
              <Download size={14} /> Export
            </Button>
            <Button size="sm" onClick={() => fileRef.current?.click()}>
              <Upload size={14} /> Import
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) importJson(f);
                e.target.value = '';
              }}
            />
            <Button
              size="sm"
              variant="ghost"
              disabled={!mounted || (!w.length && !s.length)}
              onClick={() => {
                if (confirm('Clear your entire watchlist, diary and ratings? This can’t be undone — export first if you want a backup.')) {
                  clear();
                  toast('Library cleared', 'x');
                }
              }}
            >
              <Trash2 size={14} /> Clear all
            </Button>
          </div>
        </div>

        <div className="mt-10 flex gap-1 border-b border-line">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cx('relative flex items-center gap-2 px-4 pb-3 pt-1 text-sm transition-colors', tab === t.id ? 'text-fg' : 'text-muted hover:text-fg')}
            >
              <t.icon size={15} />
              {t.label}
              {mounted && t.count != null && <span className="rounded-full bg-white/[0.07] px-1.5 font-mono text-[10px] tabular">{t.count}</span>}
              {tab === t.id && <motion.span layoutId="lib-tab" className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-accent" />}
            </button>
          ))}
        </div>

        <div className="mt-8">
          {!mounted ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="[&>div]:w-full"><PosterSkeleton /></div>
              ))}
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                {tab === 'watchlist' && <Watchlist items={w} />}
                {tab === 'diary' && <Diary items={s} />}
                {tab === 'stats' && <Stats items={s} watchlist={w} />}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </Container>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Watchlist                                                           */
/* ------------------------------------------------------------------ */

const W_SORTS = {
  added: { label: 'Recently added', fn: (a: LibEntry, b: LibEntry) => b.addedAt - a.addedAt },
  rating: { label: 'Highest rated', fn: (a: LibEntry, b: LibEntry) => (b.rating ?? 0) - (a.rating ?? 0) },
  short: { label: 'Shortest first', fn: (a: LibEntry, b: LibEntry) => (a.runtime ?? 9e9) - (b.runtime ?? 9e9) },
  year: { label: 'Newest release', fn: (a: LibEntry, b: LibEntry) => (b.year ?? 0) - (a.year ?? 0) },
} as const;

function Watchlist({ items }: { items: LibEntry[] }) {
  const [sort, setSort] = useState<keyof typeof W_SORTS>('added');
  const [kind, setKind] = useState<'all' | 'movie' | 'series'>('all');
  const toggleSeen = useLibrary((s) => s.toggleSeen);
  const toast = useUI((s) => s.toast);

  const list = useMemo(
    () => items.filter((c) => kind === 'all' || (kind === 'series' ? c.series : !c.series)).sort(W_SORTS[sort].fn),
    [items, sort, kind]
  );
  const queued = Math.round(list.reduce((a, c) => a + (c.series ? 0 : c.runtime ?? 0), 0) / 3600);

  if (!items.length)
    return (
      <Empty title="Your watchlist is empty" icon={<Bookmark size={34} />}>
        Tap the bookmark on any poster to save it for later. Not sure where to start?
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <ButtonLink href="/discover" size="sm"><Compass size={14} /> Browse moods</ButtonLink>
          <ButtonLink href="/roulette" size="sm" variant="primary"><Dices size={14} /> Spin the roulette</ButtonLink>
        </div>
      </Empty>
    );

  return (
    <div>
      <div className="mb-7 flex flex-wrap items-center gap-2">
        {(['all', 'movie', 'series'] as const).map((k) => (
          <Chip key={k} active={kind === k} onClick={() => setKind(k)}>
            {k === 'all' ? 'Everything' : k === 'movie' ? 'Films' : 'Series'}
          </Chip>
        ))}
        {queued > 0 && (
          <span className="ml-2 inline-flex items-center gap-1.5 text-xs text-faint tabular">
            <Clock size={12} /> {queued} hours of film queued
          </span>
        )}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as keyof typeof W_SORTS)}
          className="glass ml-auto h-9 rounded-full px-4 text-sm outline-none [&>option]:bg-s2"
          aria-label="Sort watchlist"
        >
          {Object.entries(W_SORTS).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>
      <motion.div layout className="grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
        <AnimatePresence>
          {list.map((c) => (
            <motion.div
              layout
              key={c.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.35 }}
              className="min-w-0 [&_a]:w-full"
            >
              <PosterCard card={c} className="w-full" />
              <button
                onClick={() => {
                  toggleSeen(c);
                  toast(`Logged “${c.title}” to your diary`, 'check');
                }}
                className="mt-2 inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-xs text-muted ring-1 ring-line transition hover:bg-ok hover:text-night hover:ring-ok"
              >
                <Check size={12} /> Seen it
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Diary                                                               */
/* ------------------------------------------------------------------ */

function Diary({ items }: { items: SeenEntry[] }) {
  const rate = useLibrary((s) => s.rate);
  const toggleSeen = useLibrary((s) => s.toggleSeen);

  const groups = useMemo(() => {
    const sorted = [...items].sort((a, b) => b.seenAt - a.seenAt);
    const m = new Map<string, SeenEntry[]>();
    for (const c of sorted) {
      const k = new Date(c.seenAt).toLocaleDateString('en', { month: 'long', year: 'numeric' });
      m.set(k, [...(m.get(k) ?? []), c]);
    }
    return [...m.entries()];
  }, [items]);

  if (!items.length)
    return (
      <Empty title="Nothing logged yet" icon={<BookOpenCheck size={34} />}>
        Mark titles as seen — or rate them — and they’ll appear here as a film diary, month by month.
        <div className="mt-5 flex justify-center">
          <ButtonLink href="/charts/top-movies" size="sm">Start with the Top 250</ButtonLink>
        </div>
      </Empty>
    );

  return (
    <div className="space-y-12">
      {groups.map(([month, list]) => (
        <section key={month}>
          <div className="mb-3 flex items-baseline gap-3">
            <h3 className="display text-3xl">{month}</h3>
            <span className="font-mono text-xs text-faint tabular">{list.length} {list.length === 1 ? 'title' : 'titles'}</span>
          </div>
          <ul className="divide-y divide-line">
            <AnimatePresence initial={false}>
              {list.map((c) => {
                const d = new Date(c.seenAt);
                return (
                  <motion.li
                    key={c.id}
                    layout
                    exit={{ opacity: 0, x: -20 }}
                    className="grid grid-cols-[2.5rem_48px_1fr_auto] items-center gap-3 py-3 sm:grid-cols-[3.5rem_56px_1fr_auto_auto] sm:gap-5"
                  >
                    <div className="text-center">
                      <div className="display text-3xl leading-none tabular">{d.getDate()}</div>
                      <div className="font-mono text-[10px] uppercase text-faint">{d.toLocaleDateString('en', { weekday: 'short' })}</div>
                    </div>
                    <Link href={titleHref(c.id)} className="sheen block aspect-[2/3] overflow-hidden rounded-md bg-s2 ring-1 ring-white/5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {c.poster && <img src={poster(c.poster, 120)} alt="" loading="lazy" className="size-full object-cover" />}
                    </Link>
                    <div className="min-w-0">
                      <Link href={titleHref(c.id)} className="block truncate font-medium hover:text-white">{c.title}</Link>
                      <div className="truncate text-xs text-faint tabular">
                        {[years(c.year, c.endYear, c.series), runtime(c.runtime), c.rating != null && `IMDb ★ ${c.rating.toFixed(1)}`].filter(Boolean).join(' · ')}
                      </div>
                      <div className="mt-2 sm:hidden">
                        <Pips value={c.myRating} onChange={(r) => rate(c, r)} />
                      </div>
                    </div>
                    <div className="hidden sm:block">
                      <Pips value={c.myRating} onChange={(r) => rate(c, r)} />
                    </div>
                    <button
                      onClick={() => toggleSeen(c)}
                      className="grid size-8 place-items-center rounded-full text-faint transition hover:bg-white/5 hover:text-fg"
                      aria-label={`Remove ${c.title} from diary`}
                    >
                      <X size={15} />
                    </button>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        </section>
      ))}
    </div>
  );
}

/** 10-point rating as a row of pips; hover to preview, click again to clear. */
function Pips({ value, onChange }: { value?: number; onChange: (v: number | undefined) => void }) {
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? value ?? 0;
  return (
    <div className="flex items-center gap-2" onMouseLeave={() => setHover(null)}>
      <div className="flex gap-[3px]" role="radiogroup" aria-label="Your rating">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} out of 10`}
            onMouseEnter={() => setHover(n)}
            onClick={() => onChange(value === n ? undefined : n)}
            className="h-4 w-[9px] rounded-[3px] transition-all duration-150 hover:scale-y-125"
            style={{ background: n <= shown ? ratingColor(shown) : 'var(--s4)' }}
          />
        ))}
      </div>
      <span className="w-8 font-mono text-xs tabular text-muted">{shown ? `${shown}/10` : '—'}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Stats                                                               */
/* ------------------------------------------------------------------ */

function Stats({ items, watchlist }: { items: SeenEntry[]; watchlist: LibEntry[] }) {
  const stats = useMemo(() => {
    const hours = items.reduce((a, c) => a + (c.runtime ?? 0), 0) / 3600;
    const rated = items.filter((c) => c.myRating != null);
    const both = rated.filter((c) => c.rating != null);
    const myAvg = rated.length ? rated.reduce((a, c) => a + c.myRating!, 0) / rated.length : undefined;
    const crowd = both.length ? both.reduce((a, c) => a + c.rating!, 0) / both.length : undefined;
    const mine = both.length ? both.reduce((a, c) => a + c.myRating!, 0) / both.length : undefined;
    const delta = mine != null && crowd != null ? mine - crowd : undefined;

    const g = new Map<string, number>();
    for (const c of items) for (const x of c.genres ?? []) g.set(x, (g.get(x) ?? 0) + 1);
    const genres = [...g.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k, v]) => ({ key: k, label: k, value: v }));

    const ys = items.map((c) => c.year).filter(Boolean) as number[];
    const decades = [];
    if (ys.length) {
      const lo = Math.floor(Math.min(...ys) / 10) * 10;
      const hi = Math.floor(Math.max(...ys) / 10) * 10;
      for (let d = lo; d <= hi; d += 10)
        decades.push({ key: String(d), label: `${String(d).slice(2)}s`, value: ys.filter((y) => Math.floor(y / 10) * 10 === d).length, hint: `${d}s` });
    }

    const top = [...rated].sort((a, b) => b.myRating! - a.myRating! || (b.rating ?? 0) - (a.rating ?? 0)).slice(0, 12);
    const disagreements = [...both]
      .map((c) => ({ c, d: c.myRating! - c.rating! }))
      .filter((x) => Math.abs(x.d) >= 1.5)
      .sort((a, b) => Math.abs(b.d) - Math.abs(a.d))
      .slice(0, 4);
    return { hours, rated, myAvg, crowd, delta, genres, decades, top, disagreements, films: items.filter((c) => !c.series).length };
  }, [items]);

  if (!items.length)
    return (
      <Empty title="No stats — yet" icon={<BarChart3 size={34} />}>
        Your viewing statistics build up as you log films in your diary. Watch something wonderful and come back.
        <div className="mt-5 flex justify-center gap-2">
          <ButtonLink href="/roulette" size="sm" variant="primary"><Dices size={14} /> Pick something for me</ButtonLink>
        </div>
      </Empty>
    );

  const verdict =
    stats.delta == null
      ? 'Rate a few titles in your diary to see how you compare with the crowd.'
      : stats.delta > 0.5
        ? `You’re a generous critic — ${stats.delta.toFixed(1)} points kinder than IMDb on average.`
        : stats.delta < -0.5
          ? `You’re a harsh critic — ${Math.abs(stats.delta).toFixed(1)} points tougher than IMDb on average.`
          : 'Your taste is in tune with the crowd — within half a point of IMDb.';

  const watchlistHours = Math.round(watchlist.reduce((a, c) => a + (c.series ? 0 : c.runtime ?? 0), 0) / 3600);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile label="Titles watched" value={items.length.toLocaleString('en')} sub={`${stats.films} films · ${items.length - stats.films} series`} icon={Film} />
        <Tile label="Hours in the dark" value={Math.round(stats.hours).toLocaleString('en')} sub={`${(stats.hours / 24).toFixed(1)} days of screen time`} icon={Clock} />
        <Tile label="Your average" value={stats.myAvg != null ? stats.myAvg.toFixed(1) : '—'} sub={`${stats.rated.length} rated`} icon={Star} />
        <Tile label="IMDb average" value={stats.crowd != null ? stats.crowd.toFixed(1) : '—'} sub="Same titles, the crowd" icon={BarChart3} />
      </div>

      <div className="panel flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:gap-6">
        <div className="display text-5xl text-accent">
          {stats.delta == null ? '?' : stats.delta > 0.5 ? 'Generous' : stats.delta < -0.5 ? 'Harsh' : 'In tune'}
        </div>
        <p className="max-w-xl text-muted">{verdict}</p>
        {watchlistHours > 0 && (
          <p className="text-sm text-faint sm:ml-auto sm:text-right">
            {watchlistHours} hours still waiting
            <br />
            on your watchlist
          </p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="panel p-6">
          <div className="eyebrow mb-1 text-leaf">What you watch</div>
          <div className="mb-5 text-xs text-faint">Titles per genre (a title can count towards several)</div>
          <HBars data={stats.genres} caption="Titles watched per genre" />
        </div>
        <div className="panel p-6">
          <div className="eyebrow mb-1 text-sky">When it was made</div>
          <div className="mb-5 text-xs text-faint">Titles watched by release decade</div>
          {stats.decades.length ? <Columns data={stats.decades} height={220} caption="Titles watched by release decade" /> : <div className="text-sm text-faint">No release years yet.</div>}
        </div>
      </div>

      {stats.disagreements.length > 0 && (
        <div className="panel p-6">
          <div className="eyebrow mb-4 text-poppy">Where you part ways with the crowd</div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {stats.disagreements.map(({ c, d }) => (
              <Link key={c.id} href={titleHref(c.id)} className="group flex items-center gap-3 rounded-xl p-2 transition hover:bg-white/[0.04]">
                <span className="aspect-[2/3] w-12 shrink-0 overflow-hidden rounded-md bg-s2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {c.poster && <img src={poster(c.poster, 100)} alt="" className="size-full object-cover" />}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{c.title}</span>
                  <span className="block font-mono text-xs text-faint tabular">
                    You {c.myRating} · IMDb {c.rating?.toFixed(1)}
                  </span>
                  <span className={cx('text-xs font-medium', d > 0 ? 'text-ok' : 'text-danger')}>
                    {d > 0 ? '▲' : '▼'} {Math.abs(d).toFixed(1)} {d > 0 ? 'kinder' : 'harsher'}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {stats.top.length > 0 && (
        <div>
          <div className="eyebrow mb-1 mt-4 text-gold">Your favourites</div>
          <div className="display mb-5 text-3xl">Top rated by you</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
            {stats.top.map((c: Card & { myRating?: number }) => (
              <div key={c.id} className="min-w-0 [&_a]:w-full">
                <PosterCard card={c} className="w-full" meta={`You: ${c.myRating}/10 · ${years(c.year, c.endYear, c.series)}`} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Tile({ label, value, sub, icon: Icon }: { label: string; value: string; sub?: string; icon: typeof Film }) {
  return (
    <div className="panel relative overflow-hidden p-5">
      <Icon size={60} strokeWidth={1} className="absolute -right-3 -top-3 text-white/[0.04]" />
      <div className="text-[13px] text-muted">{label}</div>
      <div className="mt-2 text-4xl font-semibold tabular sm:text-5xl">{value}</div>
      {sub && <div className="mt-1 text-xs text-faint">{sub}</div>}
    </div>
  );
}
