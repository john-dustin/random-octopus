'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import type { SearchResult } from '@/lib/types';
import { img, nameHref } from '@/lib/format';
import { Chip, Container, SectionHeader } from '@/components/ui';
import { PosterCard } from '@/components/PosterCard';
import { Rail } from '@/components/Rail';

type Kind = 'all' | 'movies' | 'series' | 'other';
const SERIES = new Set(['tvSeries', 'tvMiniSeries']);
const MOVIES = new Set(['movie', 'tvMovie']);

const kindOf = (type?: string): Exclude<Kind, 'all'> => (MOVIES.has(type ?? '') ? 'movies' : SERIES.has(type ?? '') ? 'series' : 'other');

export function SearchResults({ q, result }: { q: string; result: SearchResult }) {
  const [kind, setKind] = useState<Kind>('all');
  const counts = useMemo(() => {
    const c = { all: result.titles.length, movies: 0, series: 0, other: 0 };
    for (const t of result.titles) c[kindOf(t.type)]++;
    return c;
  }, [result.titles]);
  const titles = kind === 'all' ? result.titles : result.titles.filter((t) => kindOf(t.type) === kind);

  return (
    <div className="space-y-16">
      {result.names.length > 0 && (
        <section>
          <Container>
            <SectionHeader eyebrow={`${result.names.length} people`} title={<>Cast &amp; <em>crew</em></>} />
          </Container>
          <Rail gap="gap-5 sm:gap-7">
            {result.names.map((n, i) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.035, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="shrink-0 snap-start"
              >
                <Link href={nameHref(n.id)} className="group flex w-[112px] flex-col items-center text-center sm:w-[132px]">
                  <span className="relative size-[104px] overflow-hidden rounded-full bg-s3 ring-1 ring-white/10 transition-all duration-500 group-hover:ring-2 group-hover:ring-accent/70 group-hover:shadow-[0_0_40px_-6px_rgb(var(--accent)/0.6)] sm:size-[124px]">
                    {n.img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img(n.img, 260, 260)} alt={n.name} loading="lazy" className="size-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    ) : (
                      <span className="display grid size-full place-items-center text-3xl text-faint">
                        {n.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
                      </span>
                    )}
                  </span>
                  <span className="mt-3 line-clamp-2 text-[13.5px] font-medium leading-tight">{n.name}</span>
                  {(n.role || n.known) && <span className="mt-1 line-clamp-2 text-[11px] leading-snug text-faint">{[n.role, n.known].filter(Boolean).join(' · ')}</span>}
                </Link>
              </motion.div>
            ))}
          </Rail>
        </section>
      )}

      {result.titles.length > 0 && (
        <section>
          <Container>
            <SectionHeader eyebrow={`Results for “${q}”`} title="Titles">
              <div className="flex flex-wrap justify-end gap-1.5">
                {(['all', 'movies', 'series', 'other'] as Kind[])
                  .filter((k) => k === 'all' || counts[k] > 0)
                  .map((k) => (
                    <Chip key={k} active={kind === k} onClick={() => setKind(k)}>
                      {k === 'all' ? 'All' : k === 'movies' ? 'Movies' : k === 'series' ? 'Series' : 'Other'}
                      <span className="ml-1.5 font-mono text-[10px] opacity-60">{counts[k]}</span>
                    </Chip>
                  ))}
              </div>
            </SectionHeader>
            <motion.div layout className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-x-4 gap-y-8 sm:grid-cols-[repeat(auto-fill,minmax(172px,1fr))] sm:gap-x-5">
              {titles.map((t, i) => (
                <motion.div
                  key={t.id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.025, 0.5), duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                  <PosterCard
                    card={t}
                    className="[&>a]:w-full"
                    meta={[t.year, t.typeText && t.typeText !== 'Movie' ? t.typeText : null].filter(Boolean).join(' · ')}
                    priority={i < 6}
                  />
                </motion.div>
              ))}
            </motion.div>
          </Container>
        </section>
      )}
    </div>
  );
}
