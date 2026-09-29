'use client';

import Link from 'next/link';
import { useCallback, useState } from 'react';
import { Bookmark, BookmarkCheck, Check } from 'lucide-react';
import type { Card } from '@/lib/types';
import { cx, poster, runtime, titleHref, years } from '@/lib/format';
import { useLibrary, useUI } from '@/lib/store';
import { useMounted } from '@/lib/hooks';

type Props = {
  card: Card;
  size?: 'sm' | 'md' | 'lg';
  /** Big editorial numeral behind the poster (Top-10 style rails) */
  rankNumeral?: number;
  /** Line under the title; defaults to year · runtime */
  meta?: string;
  priority?: boolean;
  className?: string;
};

const WIDTHS = { sm: 'w-[132px] sm:w-[148px]', md: 'w-[156px] sm:w-[184px]', lg: 'w-[200px] sm:w-[236px]' };

export function PosterCard({ card, size = 'md', rankNumeral, meta, priority, className }: Props) {
  const mounted = useMounted();
  const inWatchlist = useLibrary((s) => !!s.watchlist[card.id]);
  const seen = useLibrary((s) => !!s.seen[card.id]);
  const toggle = useLibrary((s) => s.toggleWatchlist);
  const toast = useUI((s) => s.toast);
  const [loaded, setLoaded] = useState(false);
  // SSR'd images can finish loading before hydration attaches onLoad — check on mount too.
  const imgRef = useCallback((el: HTMLImageElement | null) => {
    if (el?.complete && el.naturalWidth > 0) setLoaded(true);
  }, []);

  const line = meta ?? [years(card.year, card.endYear, card.series), runtime(card.runtime)].filter(Boolean).join(' · ');

  return (
    <div className={cx('group relative shrink-0 snap-start', rankNumeral ? 'pl-[52px] sm:pl-[64px]' : '', className)}>
      {rankNumeral != null && (
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-12 left-0 z-0 select-none text-[128px] font-bold leading-none tracking-[-0.08em] text-white/[0.92] [text-shadow:0_4px_24px_rgb(0_0_0/0.5)] sm:text-[156px]"
        >
          {rankNumeral}
        </span>
      )}
      <Link href={titleHref(card.id)} className={cx('relative z-10 block', WIDTHS[size])} prefetch={false}>
        <div
          className={cx(
            'relative aspect-[2/3] overflow-hidden rounded-[14px] bg-white/[0.06] shadow-[0_8px_24px_-10px_rgb(0_0_0/0.7)] ring-[0.5px] ring-white/10 transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]',
            'group-hover:-translate-y-1 group-hover:scale-[1.025] group-hover:shadow-[0_22px_44px_-14px_rgb(0_0_0/0.85)]'
          )}
        >
          {card.poster ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              ref={imgRef}
              src={poster(card.poster, size === 'lg' ? 480 : 360)}
              alt={card.title}
              loading={priority ? 'eager' : 'lazy'}
              decoding="async"
              onLoad={() => setLoaded(true)}
              onError={() => setLoaded(true)}
              className={cx(
                'absolute inset-0 size-full object-cover transition-opacity duration-500',
                loaded ? 'opacity-100' : 'opacity-0'
              )}
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center p-4 text-center">
              <span className="display text-2xl text-faint">{card.title}</span>
            </div>
          )}
          {!loaded && card.poster && <div className="skeleton absolute inset-0" />}

          {/* hover scrim with genres */}
          <div className="absolute inset-x-0 bottom-0 flex translate-y-2 flex-wrap gap-1 bg-gradient-to-t from-night/90 via-night/50 to-transparent p-2.5 pt-10 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            {card.genres.slice(0, 3).map((g) => (
              <span key={g} className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-md">
                {g}
              </span>
            ))}
          </div>

          {card.rating != null && (
            <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[11.5px] font-semibold tabular text-white backdrop-blur-md">
              <span className="text-gold">★</span>
              {card.rating.toFixed(1)}
            </span>
          )}
          {mounted && seen && (
            <span className="absolute bottom-2 right-2 grid size-6 place-items-center rounded-full bg-ok text-black shadow-lg">
              <Check size={14} strokeWidth={3} />
            </span>
          )}
        </div>
        <div className="mt-2.5 px-0.5">
          <div className="truncate text-[14px] font-medium tracking-[-0.01em] text-white">{card.title}</div>
          {line && <div className="truncate text-[12.5px] text-muted tabular">{line}</div>}
        </div>
      </Link>
      <button
        onClick={(e) => {
          e.preventDefault();
          const on = toggle(card);
          toast(on ? `Added “${card.title}” to your watchlist` : `Removed “${card.title}”`, on ? 'bookmark' : 'x');
        }}
        aria-label={inWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
        className={cx(
          'absolute right-2 top-2 z-20 grid size-8 place-items-center rounded-full backdrop-blur-md transition-all duration-300',
          mounted && inWatchlist
            ? 'bg-white text-black opacity-100'
            : 'bg-black/45 text-white opacity-0 hover:bg-black/70 group-hover:opacity-100 focus-visible:opacity-100'
        )}
      >
        {mounted && inWatchlist ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
      </button>
    </div>
  );
}

export function PosterSkeleton({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  return (
    <div className={cx('shrink-0', WIDTHS[size])}>
      <div className="skeleton aspect-[2/3] rounded-[14px]" />
      <div className="skeleton mt-3 h-3 w-3/4 rounded" />
      <div className="skeleton mt-2 h-2.5 w-1/3 rounded" />
    </div>
  );
}
