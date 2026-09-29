'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Search, LayoutList, LayoutGrid, Bookmark, BookmarkCheck, Check, X } from 'lucide-react';
import type { Card } from '@/lib/types';
import { compact, cx, poster, ratingColor, runtime, titleHref, years } from '@/lib/format';
import { useLibrary, useUI } from '@/lib/store';
import { useMounted } from '@/lib/hooks';
import { PosterCard } from '@/components/PosterCard';
import { Empty } from '@/components/ui';
import { Columns, HBars } from './Bars';

export function ChartList({ items, shame = false }: { items: Card[]; shame?: boolean }) {
  const [q, setQ] = useState('');
  const [genre, setGenre] = useState<string | null>(null);
  const [decade, setDecade] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'grid'>('list');

  const decadeOf = (c: Card) => (c.year ? `${Math.floor(c.year / 10) * 10}` : '—');

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter(
      (c) =>
        (!needle || c.title.toLowerCase().includes(needle)) &&
        (!genre || c.genres.includes(genre)) &&
        (!decade || decadeOf(c) === decade)
    );
  }, [items, q, genre, decade]);

  // Decade distribution responds to the genre filter (but not to itself).
  const decades = useMemo(() => {
    const pool = items.filter((c) => !genre || c.genres.includes(genre));
    const years = items.map((c) => c.year).filter(Boolean) as number[];
    if (!years.length) return [];
    const lo = Math.floor(Math.min(...years) / 10) * 10;
    const hi = Math.floor(Math.max(...years) / 10) * 10;
    const out = [];
    for (let d = lo; d <= hi; d += 10) {
      const n = pool.filter((c) => decadeOf(c) === String(d)).length;
      out.push({ key: String(d), label: `${String(d).slice(2)}s`, value: n, hint: `${d}s` });
    }
    return out;
  }, [items, genre]);

  const genres = useMemo(() => {
    const pool = items.filter((c) => !decade || decadeOf(c) === decade);
    const m = new Map<string, number>();
    for (const c of pool) for (const g of c.genres) m.set(g, (m.get(g) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([g, n]) => ({ key: g, label: g, value: n }));
  }, [items, decade]);

  // Hall of Shame stays monochrome red; other charts use the botanical defaults.
  const color = shame ? 'var(--danger)' : undefined;

  return (
    <div>
      {/* Insight panels */}
      <div className="grid gap-4 md:grid-cols-[1.35fr_1fr]">
        <div className="panel p-5 sm:p-6">
          <div className="mb-5 flex items-baseline justify-between gap-3">
            <div>
              <div className="eyebrow text-sky">Titles by decade</div>
              <div className="mt-1 text-xs text-faint">Click a bar to filter{genre ? ` · within ${genre}` : ''}</div>
            </div>
            {decade && (
              <button onClick={() => setDecade(null)} className="inline-flex items-center gap-1 text-xs text-muted hover:text-fg">
                <X size={12} /> {decade}s
              </button>
            )}
          </div>
          <Columns data={decades} selected={decade} onSelect={setDecade} height={140} caption="Titles by decade" color={color} />
        </div>
        <div className="panel p-5 sm:p-6">
          <div className="mb-5 flex items-baseline justify-between gap-3">
            <div>
              <div className="eyebrow text-bloom">Top genres</div>
              <div className="mt-1 text-xs text-faint">Click to filter{decade ? ` · ${decade}s only` : ''}</div>
            </div>
            {genre && (
              <button onClick={() => setGenre(null)} className="inline-flex items-center gap-1 text-xs text-muted hover:text-fg">
                <X size={12} /> {genre}
              </button>
            )}
          </div>
          <HBars data={genres.slice(0, 6)} caption="Most common genres" color={color} onSelect={(g) => setGenre(genre === g ? null : g)} />
        </div>
      </div>

      {/* Toolbar */}
      <div className="sticky top-[var(--nav-offset,4rem)] z-30 transition-[top] duration-300 -mx-4 mt-8 flex flex-wrap items-center gap-2 border-b-[0.5px] border-white/10 bg-black/35 px-4 py-3 backdrop-blur-2xl backdrop-saturate-150 sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12">
        <label className="glass flex h-9 min-w-0 basis-full items-center gap-2 rounded-full px-3.5 sm:max-w-xs sm:flex-1 sm:basis-auto">
          <Search size={14} className="shrink-0 text-faint" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={`Search ${items.length} titles…`}
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-faint"
          />
          {q && (
            <button onClick={() => setQ('')} aria-label="Clear search">
              <X size={13} className="text-faint" />
            </button>
          )}
        </label>
        <select
          value={genre ?? ''}
          onChange={(e) => setGenre(e.target.value || null)}
          className="glass h-9 rounded-full px-3.5 text-sm outline-none [&>option]:bg-s2"
          aria-label="Filter by genre"
        >
          <option value="">All genres</option>
          {genres.map((g) => (
            <option key={g.key} value={g.key}>{g.label} ({g.value})</option>
          ))}
        </select>
        <span className="font-mono text-xs text-faint tabular">{filtered.length} shown</span>
        <div className="ml-auto flex rounded-full bg-white/[0.05] p-1 ring-1 ring-line">
          {(['list', 'grid'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              aria-label={`${v} view`}
              aria-pressed={view === v}
              className={cx('grid h-7 w-9 place-items-center rounded-full transition', view === v ? 'bg-leaf text-night' : 'text-muted hover:text-fg')}
            >
              {v === 'list' ? <LayoutList size={14} /> : <LayoutGrid size={14} />}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        {filtered.length === 0 ? (
          <Empty title="No titles match">Try another search, genre or decade.</Empty>
        ) : view === 'list' ? (
          <ol className="divide-y divide-line">
            {filtered.map((c, i) => (
              <Row key={c.id} card={c} index={i} shame={shame} />
            ))}
          </ol>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-7">
            {filtered.map((c) => (
              <div key={c.id} className="min-w-0 [&_a]:w-full">
                <PosterCard card={c} className="w-full" meta={`#${c.rank} · ${years(c.year, c.endYear, c.series)}`} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ card: c, index, shame }: { card: Card; index: number; shame: boolean }) {
  const mounted = useMounted();
  const inList = useLibrary((s) => !!s.watchlist[c.id]);
  const seen = useLibrary((s) => s.seen[c.id]);
  const toggle = useLibrary((s) => s.toggleWatchlist);
  const toast = useUI((s) => s.toast);
  const podium = (c.rank ?? 99) <= 3;

  return (
    <motion.li
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -40px 0px' }}
      transition={{ duration: 0.45, delay: Math.min(index, 8) * 0.03, ease: [0.22, 1, 0.36, 1] }}
      className="group relative"
    >
      <Link
        href={titleHref(c.id)}
        prefetch={false}
        className="grid grid-cols-[3rem_56px_1fr] items-center gap-3 rounded-2xl px-2 py-3 transition-colors hover:bg-white/[0.03] sm:grid-cols-[5.5rem_64px_1fr_13rem_3rem] sm:gap-5 sm:px-3"
      >
        <span
          className={cx('display text-right text-[2.2rem] leading-none tabular sm:text-[3.4rem]', podium ? '' : 'text-transparent')}
          style={
            podium
              ? { color: shame ? 'var(--danger)' : 'rgb(var(--accent))', textShadow: `0 0 30px ${shame ? 'rgb(239 91 76 / .4)' : 'rgb(var(--accent) / .45)'}` }
              : { WebkitTextStroke: '1px rgb(255 255 255 / 0.3)' }
          }
        >
          {c.rank}
        </span>
        <span className="sheen relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-s2 ring-1 ring-white/5">
          {c.poster && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={poster(c.poster, 128)} alt="" loading="lazy" className={cx('size-full object-cover', shame && 'grayscale-[0.4] sepia-[0.2]')} />
          )}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[15px] font-medium text-fg/95 group-hover:text-white sm:text-base">{c.title}</span>
          <span className="mt-0.5 block truncate text-xs text-faint tabular">
            {[years(c.year, c.endYear, c.series), runtime(c.runtime), c.cert].filter(Boolean).join(' · ')}
          </span>
          <span className="mt-1.5 hidden flex-wrap gap-1 sm:flex">
            {c.genres.slice(0, 3).map((g) => (
              <span key={g} className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10.5px] text-muted">{g}</span>
            ))}
          </span>
          {/* mobile rating line */}
          <span className="mt-1 flex items-center gap-2 font-mono text-xs sm:hidden" style={{ color: ratingColor(c.rating) }}>
            ★ {c.rating?.toFixed(1) ?? '–'} <span className="text-faint">{compact(c.votes)}</span>
          </span>
        </span>
        <span className="hidden items-center gap-3 sm:flex">
          <span className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-s3">
            <span
              className="absolute inset-y-0 left-0 rounded-full"
              style={{ width: `${((c.rating ?? 0) / 10) * 100}%`, background: ratingColor(c.rating) }}
            />
          </span>
          <span className="w-16 text-right">
            <span className="block font-mono text-sm font-semibold tabular">{c.rating?.toFixed(1) ?? '–'}</span>
            <span className="block font-mono text-[10px] text-faint tabular">{compact(c.votes)} votes</span>
          </span>
        </span>
        <span className="hidden sm:block" />
      </Link>
      <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1.5 sm:right-3">
        {mounted && seen && (
          <span className="grid size-7 place-items-center rounded-full bg-ok text-night" title={seen.myRating ? `Seen · you rated ${seen.myRating}` : 'Seen'}>
            <Check size={13} strokeWidth={3} />
          </span>
        )}
        <button
          onClick={() => {
            const on = toggle(c);
            toast(on ? `Added “${c.title}” to your watchlist` : `Removed “${c.title}”`, on ? 'bookmark' : 'x');
          }}
          aria-label={inList ? 'Remove from watchlist' : 'Add to watchlist'}
          className={cx(
            'grid size-8 place-items-center rounded-full transition',
            mounted && inList ? 'bg-gold text-night' : 'bg-white/[0.06] text-muted opacity-100 hover:text-fg sm:opacity-0 sm:group-hover:opacity-100'
          )}
        >
          {mounted && inList ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
        </button>
      </div>
    </motion.li>
  );
}
