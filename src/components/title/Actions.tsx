'use client';

import { useEffect, useState } from 'react';
import { Play, Bookmark, BookmarkCheck, Eye, EyeOff, Share2, Swords, Star, Download, Loader2 } from 'lucide-react';
import type { Card, Video } from '@/lib/types';
import { Button, ButtonLink } from '@/components/ui';
import { useLibrary, useUI } from '@/lib/store';
import { useMounted } from '@/lib/hooks';
import { cx } from '@/lib/format';
import { PrepareDialog, type PrepareResult } from './PrepareDialog';

/**
 * Fired on `window` whenever a title's metadata is prepared, so other code can hook in:
 *   window.addEventListener('lumiere:prepare', (e) => console.log(e.detail.result))
 */
export type PrepareEventDetail = { id: string; title: string; result: PrepareResult };

export function Actions({ card, videos }: { card: Card; videos: Video[] }) {
  const mounted = useMounted();
  const [prepare, setPrepare] = useState<PrepareResult | null>(null);
  const [preparing, setPreparing] = useState(false);
  const inList = useLibrary((s) => !!s.watchlist[card.id]);
  const seen = useLibrary((s) => !!s.seen[card.id]);
  const toggleWatchlist = useLibrary((s) => s.toggleWatchlist);
  const toggleSeen = useLibrary((s) => s.toggleSeen);
  const pushRecent = useLibrary((s) => s.pushRecent);
  const play = useUI((s) => s.play);
  const toast = useUI((s) => s.toast);

  useEffect(() => {
    pushRecent(card);
    // only when the title changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card.id]);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share && window.matchMedia('(pointer: coarse)').matches) {
        await navigator.share({ title: card.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast('Link copied to clipboard', 'check');
    } catch {
      /* dismissed */
    }
  };

  const download = async () => {
    setPreparing(true);
    try {
      const res = await fetch('/api/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: card.title }),
      });
      const data: PrepareResult | null = await res.json().catch(() => null);
      if (!res.ok) {
        toast(data?.error ?? 'Could not fetch metadata', 'x');
        return;
      }
      const result = data ?? {};
      window.dispatchEvent(new CustomEvent<PrepareEventDetail>('lumiere:prepare', { detail: { id: card.id, title: card.title, result } }));
      setPrepare(result);
    } catch {
      toast('Could not reach the prepare service', 'x');
    } finally {
      setPreparing(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-2.5">
        <Button
          variant="primary"
          size="lg"
          disabled={!videos.length}
          onClick={() => play(videos, 0, card.title)}
        >
          <Play size={18} fill="currentColor" />
          {videos.length ? 'Play trailer' : 'No trailer'}
        </Button>
        <Button
          size="lg"
          onClick={() => {
            const on = toggleWatchlist(card);
            toast(on ? 'Added to your watchlist' : 'Removed from watchlist', on ? 'bookmark' : 'x');
          }}
          className={cx(mounted && inList && 'ring-1 ring-gold/70 text-gold')}
        >
          {mounted && inList ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
          {mounted && inList ? 'On watchlist' : 'Watchlist'}
        </Button>
        <Button
          size="lg"
          onClick={() => {
            const on = toggleSeen(card);
            toast(on ? 'Marked as watched' : 'Unmarked as watched', on ? 'check' : 'x');
          }}
          className={cx(mounted && seen && 'ring-1 ring-ok/60 text-ok')}
        >
          {mounted && seen ? <Eye size={18} /> : <EyeOff size={18} />}
          {mounted && seen ? 'Watched' : 'Mark watched'}
        </Button>
        <ButtonLink href={`/compare?a=${card.id}`} variant="ghost" size="lg" aria-label="Compare with another title">
          <Swords size={17} />
          <span className="hidden sm:inline">Compare</span>
        </ButtonLink>
        <Button variant="ghost" size="lg" onClick={download} disabled={preparing} aria-label="Download metadata">
          {preparing ? <Loader2 size={17} className="animate-spin" /> : <Download size={17} />}
          <span className="hidden sm:inline">Download</span>
        </Button>
        <Button variant="ghost" size="lg" onClick={share} aria-label="Share">
          <Share2 size={17} />
          <span className="hidden sm:inline">Share</span>
        </Button>
        </div>
        <StarRating card={card} />
      </div>
      <PrepareDialog result={prepare} card={card} onClose={() => setPrepare(null)} />
    </>
  );
}

function StarRating({ card }: { card: Card }) {
  const mounted = useMounted();
  const mine = useLibrary((s) => s.seen[card.id]?.myRating);
  const rate = useLibrary((s) => s.rate);
  const toast = useUI((s) => s.toast);
  const [hover, setHover] = useState<number | null>(null);
  const value = mounted ? mine : undefined;
  const shown = hover ?? value ?? 0;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="eyebrow text-gold">Your rating</span>
      <div className="flex items-center" onMouseLeave={() => setHover(null)} role="radiogroup" aria-label="Your rating">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} of 10`}
            onMouseEnter={() => setHover(n)}
            onFocus={() => setHover(n)}
            onBlur={() => setHover(null)}
            onClick={() => {
              const next = value === n ? undefined : n;
              rate(card, next);
              toast(next ? `You rated “${card.title}” ${next}/10` : 'Rating cleared', next ? 'sparkles' : 'x');
            }}
            className="p-0.5 transition-transform duration-150 hover:scale-125"
          >
            <Star
              size={18}
              className={cx('transition-colors duration-150', n <= shown ? 'text-gold' : 'text-white/15')}
              fill={n <= shown ? 'currentColor' : 'none'}
            />
          </button>
        ))}
      </div>
      <span className="min-w-12 font-mono text-sm tabular text-muted">{shown ? `${shown}/10` : '—'}</span>
    </div>
  );
}
