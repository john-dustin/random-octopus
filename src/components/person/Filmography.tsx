'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { LayoutGrid, List } from 'lucide-react';
import type { Card, Person } from '@/lib/types';
import { compact, cx, poster, ratingColor, titleHref, years } from '@/lib/format';
import { Chip } from '@/components/ui';
import { PosterCard } from '@/components/PosterCard';

type Dept = keyof Person['credits'];
type Sort = 'newest' | 'rating' | 'popular';
type Kind = 'all' | 'movies' | 'series';

const SERIES = new Set(['tvSeries', 'tvMiniSeries']);
const PAGE = 36;

export function Filmography({ credits }: { credits: Person['credits'] }) {
  const depts = useMemo(
    () =>
      (Object.keys(credits) as Dept[])
        .map((d) => [d, dedupe(credits[d])] as const)
        .filter(([, l]) => l.length > 0),
    [credits]
  );
  // Open on the department they're most watched for (e.g. Directing for Nolan).
  const [dept, setDept] = useState<Dept>(
    () => [...depts].sort((a, b) => weight(b[1]) - weight(a[1]))[0]?.[0] ?? 'Acting'
  );
  const [sort, setSort] = useState<Sort>('popular');
  const [kind, setKind] = useState<Kind>('all');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [limit, setLimit] = useState(PAGE);

  const list = useMemo(() => {
    const base = depts.find(([d]) => d === dept)?.[1] ?? [];
    const filtered = base.filter((c) =>
      kind === 'all' ? true : kind === 'series' ? SERIES.has(c.type ?? '') || c.series : !c.series && !SERIES.has(c.type ?? '')
    );
    const s = [...filtered];
    if (sort === 'newest') s.sort((a, b) => (b.year ?? 9999) - (a.year ?? 9999));
    if (sort === 'rating') s.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1) || (b.votes ?? 0) - (a.votes ?? 0));
    if (sort === 'popular') s.sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0));
    return s;
  }, [depts, dept, kind, sort]);

  if (!depts.length) return null;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-5">
        <div>
          <div className="eyebrow mb-2 text-lavender">Complete works</div>
          <h2 className="display text-[clamp(1.9rem,3.2vw,2.8rem)]">Filmography</h2>
        </div>
      </div>

      {/* department tabs */}
      <div className="scrollbar-none -mx-4 mb-5 flex gap-1 overflow-x-auto border-b border-line px-4 sm:mx-0 sm:px-0">
        {depts.map(([d, l]) => (
          <button
            key={d}
            onClick={() => { setDept(d); setLimit(PAGE); }}
            className={cx('relative shrink-0 px-4 pb-3 pt-1 text-sm transition-colors', dept === d ? 'text-fg' : 'text-muted hover:text-fg')}
          >
            {d}
            <span className="ml-2 font-mono text-[11px] text-faint">{l.length}</span>
            {dept === d && <motion.span layoutId="filmo-tab" className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-accent" />}
          </button>
        ))}
      </div>

      {/* controls — one row above the content */}
      <div className="mb-7 flex flex-wrap items-center gap-2">
        {(['all', 'movies', 'series'] as Kind[]).map((k) => (
          <Chip key={k} active={kind === k} onClick={() => { setKind(k); setLimit(PAGE); }}>
            {k === 'all' ? 'Everything' : k === 'movies' ? 'Films' : 'Series'}
          </Chip>
        ))}
        <span className="mx-2 hidden h-5 w-px bg-line sm:block" />
        <div className="flex items-center gap-1 rounded-full border border-line p-1">
          {([['newest', 'Newest'], ['rating', 'Top rated'], ['popular', 'Popular']] as [Sort, string][]).map(([k, l]) => (
            <button
              key={k}
              onClick={() => setSort(k)}
              className={cx('rounded-full px-3 py-1 text-[12.5px] transition-colors', sort === k ? 'bg-white/10 text-fg' : 'text-muted hover:text-fg')}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-1 rounded-full border border-line p-1">
          <button onClick={() => setView('grid')} aria-label="Grid view" className={cx('grid size-7 place-items-center rounded-full transition', view === 'grid' ? 'bg-white/10 text-fg' : 'text-faint hover:text-fg')}>
            <LayoutGrid size={14} />
          </button>
          <button onClick={() => setView('list')} aria-label="List view" className={cx('grid size-7 place-items-center rounded-full transition', view === 'list' ? 'bg-white/10 text-fg' : 'text-faint hover:text-fg')}>
            <List size={14} />
          </button>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="panel px-6 py-14 text-center text-sm text-muted">Nothing here with these filters.</div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-x-4 gap-y-7 sm:grid-cols-[repeat(auto-fill,minmax(168px,1fr))]">
          {list.slice(0, limit).map((c) => (
            <PosterCard
              key={c.id}
              card={c}
              className="[&>a]:w-full"
              meta={[years(c.year, c.endYear, c.series), c.character].filter(Boolean).join(' · ')}
            />
          ))}
        </div>
      ) : (
        <ListView list={list.slice(0, limit)} />
      )}

      {list.length > limit && (
        <div className="mt-10 flex justify-center">
          <button
            onClick={() => setLimit((l) => l + PAGE * 2)}
            className="glass rounded-full px-6 py-3 text-sm transition hover:bg-white/10"
          >
            Show more <span className="ml-1 font-mono text-xs text-faint">{list.length - limit} left</span>
          </button>
        </div>
      )}
    </div>
  );
}

function ListView({ list }: { list: Card[] }) {
  return (
    <ol className="panel divide-y divide-line overflow-hidden p-0">
      {list.map((c, i) => {
        const showYear = i === 0 || c.year !== list[i - 1].year;
        return (
          <li key={c.id}>
            <Link href={titleHref(c.id)} className="group flex items-center gap-4 px-4 py-3 transition-colors hover:bg-white/[0.03] sm:gap-6 sm:px-6">
              <span className={cx('w-12 shrink-0 font-mono text-sm tabular', showYear ? 'text-muted' : 'text-transparent')}>
                {c.year ?? 'TBA'}
              </span>
              <span className="h-[60px] w-10 shrink-0 overflow-hidden rounded-md bg-s3 ring-1 ring-white/5">
                {c.poster && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={poster(c.poster, 80)} alt="" loading="lazy" className="size-full object-cover transition-transform duration-500 group-hover:scale-110" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-medium transition-colors group-hover:text-white">{c.title}</span>
                <span className="block truncate text-xs text-faint">
                  {[c.typeText !== 'Movie' ? c.typeText : null, c.character ? `as ${c.character}` : null].filter(Boolean).join(' · ') || ' '}
                </span>
              </span>
              {c.votes != null && <span className="hidden font-mono text-xs text-faint tabular sm:block">{compact(c.votes)}</span>}
              <span className="w-12 shrink-0 text-right font-mono text-sm font-semibold tabular" style={{ color: ratingColor(c.rating) }}>
                {c.rating?.toFixed(1) ?? '–'}
              </span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

const weight = (l: Card[]) => l.reduce((s, c) => s + (c.votes ?? 0), 0);

function dedupe(list: Card[]): Card[] {
  const m = new Map<string, Card>();
  for (const c of list) {
    const prev = m.get(c.id);
    if (!prev) m.set(c.id, c);
    else if (c.character && prev.character && !prev.character.includes(c.character))
      m.set(c.id, { ...prev, character: `${prev.character} / ${c.character}` });
  }
  return [...m.values()];
}
