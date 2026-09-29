'use client';

import { Play, Plus, Check, ArrowRight } from 'lucide-react';
import type { TitleDetail } from '@/lib/types';
import { useLibrary, useUI } from '@/lib/store';
import { useMounted } from '@/lib/hooks';
import { Button, ButtonLink } from '@/components/ui';

export function FilmOfTheDayActions({ t }: { t: TitleDetail }) {
  const play = useUI((s) => s.play);
  const toast = useUI((s) => s.toast);
  const toggle = useLibrary((s) => s.toggleWatchlist);
  const inList = useLibrary((s) => !!s.watchlist[t.id]);
  const mounted = useMounted();
  return (
    <div className="mt-7 flex flex-wrap gap-3">
      {t.videos.length > 0 && (
        <Button variant="primary" onClick={() => play(t.videos, 0, t.title)}>
          <Play size={15} fill="currentColor" /> Trailer
        </Button>
      )}
      <Button
        onClick={() => {
          const on = toggle(t);
          toast(on ? `Added “${t.title}” to your watchlist` : 'Removed from watchlist', on ? 'bookmark' : 'x');
        }}
      >
        {mounted && inList ? <Check size={16} /> : <Plus size={16} />} {mounted && inList ? 'On your list' : 'Watchlist'}
      </Button>
      <ButtonLink href={`/title/${t.id}`} variant="ghost">
        Full story <ArrowRight size={15} />
      </ButtonLink>
    </div>
  );
}
