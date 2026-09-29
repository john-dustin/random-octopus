'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import { Crown, TrendingDown, Calendar, Clock } from 'lucide-react';
import type { Episode, SeasonGrid } from '@/lib/types';
import { compact, cx, date, img, ratingColor, runtime, titleHref } from '@/lib/format';
import { RatingBadge } from '@/components/ui';
import { Heading } from './Sections';

async function getJSON<T>(url: string): Promise<T> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

export function EpisodeGuide({ id, seasons, title }: { id: string; seasons: number[]; title: string }) {
  return (
    <section id="episodes" className="scroll-mt-32 space-y-14">
      <Heatmap id={id} seasons={seasons} title={title} />
      <SeasonBrowser id={id} seasons={seasons} />
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Ratings heatmap — episodes (rows) × seasons (columns)               */
/* ------------------------------------------------------------------ */

type Cell = Episode & { season: number };

function Heatmap({ id, seasons, title }: { id: string; seasons: number[]; title: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['grid', id, seasons.join(',')],
    queryFn: () => getJSON<SeasonGrid>(`/api/grid?id=${id}&seasons=${seasons.join(',')}`),
  });
  const [hover, setHover] = useState<Cell | null>(null);

  const stats = useMemo(() => {
    if (!data) return null;
    const all: Cell[] = data.flatMap((s) => s.episodes.map((e) => ({ ...e, season: s.season })));
    const rated = all.filter((e) => e.rating != null && (e.votes ?? 0) > 0);
    if (!rated.length) return null;
    const best = rated.reduce((a, b) => ((b.rating! > a.rating! || (b.rating === a.rating && (b.votes ?? 0) > (a.votes ?? 0))) ? b : a));
    const worst = rated.reduce((a, b) => ((b.rating! < a.rating! || (b.rating === a.rating && (b.votes ?? 0) > (a.votes ?? 0))) ? b : a));
    const rows = Math.max(...data.map((s) => s.episodes.length));
    const avg = (eps: Episode[]) => {
      const r = eps.filter((e) => e.rating != null);
      return r.length ? r.reduce((s, e) => s + e.rating!, 0) / r.length : undefined;
    };
    return { best, worst, rows, avgs: data.map((s) => avg(s.episodes)), overall: avg(rated), count: rated.length };
  }, [data]);

  const readout = hover ?? stats?.best ?? null;

  return (
    <div>
      <Heading
        eyebrow="Every episode, at a glance"
        title="Ratings heatmap"
        aside={
          stats?.overall != null ? (
            <div className="hidden text-right sm:block">
              <div className="font-mono text-2xl font-semibold tabular">{stats.overall.toFixed(2)}</div>
              <div className="text-xs text-faint">avg across {stats.count} episodes</div>
            </div>
          ) : null
        }
      />
      <div className="panel overflow-hidden">
        {/* Readout bar */}
        <div className="flex min-h-[76px] flex-wrap items-center gap-4 border-b border-line px-5 py-4">
          {readout ? (
            <>
              <span
                className="grid size-11 shrink-0 place-items-center rounded-xl font-mono text-sm font-bold tabular text-night"
                style={{ background: ratingColor(readout.rating) }}
              >
                {readout.rating?.toFixed(1) ?? '–'}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-xs text-faint">
                  <span className="font-mono">
                    S{readout.season} · E{readout.n}
                  </span>
                  {!hover && stats && readout.id === stats.best.id && (
                    <span className="inline-flex items-center gap-1 text-gold">
                      <Crown size={12} /> Highest rated
                    </span>
                  )}
                  {hover && stats && readout.id === stats.best.id && <span className="text-gold">★ Best episode</span>}
                  {hover && stats && readout.id === stats.worst.id && <span className="text-muted">Lowest rated</span>}
                </div>
                <div className="truncate text-[15px] font-medium">{readout.title}</div>
              </div>
              {readout.votes ? <span className="text-xs text-faint tabular">{compact(readout.votes)} votes</span> : null}
            </>
          ) : (
            <span className="text-sm text-faint">{isLoading ? `Charting every episode of ${title}…` : 'Hover an episode'}</span>
          )}
        </div>

        {/* Grid */}
        <div className="scrollbar-none overflow-x-auto p-5">
          {isLoading && (
            <div className="flex gap-1.5">
              {seasons.slice(0, 12).map((s) => (
                <div key={s} className="flex flex-col gap-1.5">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="skeleton h-7 w-11 rounded-md" />
                  ))}
                </div>
              ))}
            </div>
          )}
          {isError && <div className="py-8 text-center text-sm text-faint">Couldn’t load the episode ratings.</div>}
          {data && stats && (
            <div className="inline-grid gap-1.5" style={{ gridTemplateColumns: `28px repeat(${data.length}, 44px)` }} onMouseLeave={() => setHover(null)}>
              {/* header row */}
              <div />
              {data.map((s) => (
                <div key={s.season} className="pb-1 text-center font-mono text-[11px] text-faint">
                  S{s.season}
                </div>
              ))}
              {Array.from({ length: stats.rows }).map((_, row) => (
                <Row key={row} row={row} data={data} stats={stats} hover={hover} setHover={setHover} />
              ))}
              {/* averages */}
              <div className="pt-2 text-right font-mono text-[10px] leading-7 text-faint">avg</div>
              {stats.avgs.map((a, i) => (
                <div
                  key={i}
                  className="mt-2 grid h-7 place-items-center rounded-md border border-line font-mono text-[11px] tabular"
                  style={{ color: a != null ? ratingColor(a) : undefined }}
                >
                  {a != null ? a.toFixed(1) : '–'}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Legend */}
        {data && stats && (
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-line px-5 py-3.5 text-xs text-faint">
            <div className="flex items-center gap-2">
              <span>Lower</span>
              <span className="flex h-2.5 w-40 overflow-hidden rounded-full">
                {[4, 5.5, 6.5, 7.2, 7.8, 8.3, 8.8, 9.3].map((v) => (
                  <span key={v} className="flex-1" style={{ background: ratingColor(v) }} />
                ))}
              </span>
              <span>Higher</span>
            </div>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-3 rounded-[3px] ring-2 ring-gold" /> Best
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-3 rounded-[3px] outline-2 outline-dashed outline-white/70" /> Worst
            </span>
            <span className="ml-auto hidden sm:inline">Click any cell to open the episode</span>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({
  row,
  data,
  stats,
  hover,
  setHover,
}: {
  row: number;
  data: SeasonGrid;
  stats: { best: Cell; worst: Cell };
  hover: Cell | null;
  setHover: (c: Cell | null) => void;
}) {
  return (
    <>
      <div className="text-right font-mono text-[10px] leading-7 text-faint">{row + 1}</div>
      {data.map((s) => {
        const e = s.episodes[row];
        if (!e) return <div key={s.season} />;
        const cell = { ...e, season: s.season };
        const isBest = e.id === stats.best.id;
        const isWorst = e.id === stats.worst.id;
        const unrated = e.rating == null || !e.votes;
        return (
          <Link
            key={s.season}
            href={titleHref(e.id)}
            prefetch={false}
            onMouseEnter={() => setHover(cell)}
            onFocus={() => setHover(cell)}
            aria-label={`Season ${s.season} episode ${e.n}: ${e.title}, rated ${e.rating ?? 'n/a'}`}
            className={cx(
              'relative grid h-7 place-items-center rounded-md font-mono text-[11px] font-semibold tabular transition-all duration-150',
              unrated ? 'bg-s3 text-faint' : 'text-night/85',
              hover?.id === e.id && 'z-10 scale-[1.18] shadow-[0_6px_20px_-4px_rgb(0_0_0/0.8)]',
              isBest && 'ring-2 ring-gold ring-offset-2 ring-offset-s1',
              isWorst && 'outline-2 outline-offset-2 outline-dashed outline-white/70'
            )}
            style={unrated ? undefined : { background: ratingColor(e.rating) }}
          >
            {unrated ? '·' : e.rating!.toFixed(1)}
          </Link>
        );
      })}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Season browser                                                      */
/* ------------------------------------------------------------------ */

function SeasonBrowser({ id, seasons }: { id: string; seasons: number[] }) {
  const [season, setSeason] = useState(seasons[0]);
  const { data, isLoading, isError } = useQuery({
    queryKey: ['season', id, season],
    queryFn: () => getJSON<Episode[]>(`/api/season?id=${id}&s=${season}`),
  });

  return (
    <div>
      <Heading eyebrow={`${seasons.length} season${seasons.length > 1 ? 's' : ''}`} title="Episode guide" />
      <div className="scrollbar-none -mx-1 mb-6 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {seasons.map((s) => (
          <button
            key={s}
            onClick={() => setSeason(s)}
            className={cx(
              'relative h-9 shrink-0 rounded-full px-4 text-sm transition-colors',
              s === season ? 'text-night font-semibold' : 'text-muted hover:text-fg'
            )}
          >
            {s === season && (
              <motion.span layoutId="season-pill" className="absolute inset-0 -z-10 rounded-full bg-leaf" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />
            )}
            Season {s}
          </button>
        ))}
      </div>

      {isError && <div className="panel p-8 text-center text-sm text-faint">Couldn’t load this season.</div>}
      <div className="grid gap-4 md:grid-cols-2">
        {isLoading &&
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="panel flex gap-4 p-3">
              <div className="skeleton aspect-video w-40 shrink-0 rounded-xl sm:w-52" />
              <div className="flex-1 space-y-2 py-1">
                <div className="skeleton h-3 w-1/3 rounded" />
                <div className="skeleton h-4 w-2/3 rounded" />
                <div className="skeleton h-3 w-full rounded" />
              </div>
            </div>
          ))}
        <AnimatePresence mode="popLayout">
          {data?.map((e, i) => (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.5), duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link
                href={titleHref(e.id)}
                prefetch={false}
                className="group panel flex h-full gap-4 !rounded-2xl p-3 transition-all duration-300 hover:border-line-strong hover:bg-white/[0.035]"
              >
                <div className="sheen relative aspect-video w-36 shrink-0 overflow-hidden rounded-xl bg-s3 sm:w-52">
                  {e.img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={img(e.img, 416, 234)}
                      alt=""
                      loading="lazy"
                      className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <span className="display absolute inset-0 grid place-items-center text-3xl text-faint">E{e.n}</span>
                  )}
                  <span className="absolute left-2 top-2 rounded-md bg-night/70 px-1.5 py-0.5 font-mono text-[10px] backdrop-blur">
                    E{e.n}
                  </span>
                </div>
                <div className="min-w-0 flex-1 py-0.5">
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <div className="line-clamp-2 text-[15px] font-medium leading-snug group-hover:text-white">{e.title}</div>
                    <RatingBadge value={e.rating} className="shrink-0" />
                  </div>
                  <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-faint">
                    {date(e.date) && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar size={11} />
                        {date(e.date)}
                      </span>
                    )}
                    {e.runtime ? (
                      <span className="inline-flex items-center gap-1">
                        <Clock size={11} />
                        {runtime(e.runtime)}
                      </span>
                    ) : null}
                  </div>
                  {e.plot && <p className="line-clamp-2 text-[13px] leading-relaxed text-muted sm:line-clamp-3">{e.plot}</p>}
                </div>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      {data && data.length === 0 && (
        <div className="panel flex items-center justify-center gap-2 p-8 text-sm text-faint">
          <TrendingDown size={16} /> No episodes listed for this season yet.
        </div>
      )}
    </div>
  );
}
