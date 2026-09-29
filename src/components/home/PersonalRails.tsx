'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';
import type { TitleDetail } from '@/lib/types';
import { useLibrary } from '@/lib/store';
import { useMounted } from '@/lib/hooks';
import { PosterCard, PosterSkeleton } from '@/components/PosterCard';
import { Rail } from '@/components/Rail';
import { Container, SectionHeader } from '@/components/ui';

/** "Because you loved X" + "Recently viewed" — only rendered once there's history. */
export function PersonalRails() {
  const mounted = useMounted();
  const seen = useLibrary((s) => s.seen);
  const watchlist = useLibrary((s) => s.watchlist);
  const recent = useLibrary((s) => s.recent);

  // Seed: the user's highest-rated seen title, else newest watchlist entry, else most recent view.
  const seed = useMemo(() => {
    const rated = Object.values(seen).sort((a, b) => (b.myRating ?? 0) - (a.myRating ?? 0) || b.seenAt - a.seenAt)[0];
    const wl = Object.values(watchlist).sort((a, b) => b.addedAt - a.addedAt)[0];
    return rated ?? wl ?? recent[0];
  }, [seen, watchlist, recent]);

  const { data, isLoading } = useQuery({
    queryKey: ['title', seed?.id],
    enabled: mounted && !!seed,
    queryFn: async () => (await fetch(`/api/title?id=${seed!.id}`)).json() as Promise<TitleDetail>,
  });

  if (!mounted || !seed) return null;
  const known = new Set([...Object.keys(seen)]);
  const recs = (data?.similar ?? []).filter((c) => !known.has(c.id));

  return (
    <>
      <section className="mt-20">
        <Container>
          <SectionHeader
            eyebrow={<span className="inline-flex items-center gap-1.5"><Sparkles size={12} className="text-gold" /> For you</span>}
            title={<>Because you liked <em className="text-gold">{seed.title}</em></>}
          />
        </Container>
        <Rail>
          {isLoading
            ? Array.from({ length: 8 }, (_, i) => <PosterSkeleton key={i} />)
            : recs.map((c) => <PosterCard key={c.id} card={c} />)}
        </Rail>
      </section>
      {recent.length > 2 && (
        <section className="mt-14">
          <Container>
            <SectionHeader eyebrow="Pick up where you left off" title="Recently viewed" />
          </Container>
          <Rail>
            {recent.map((c) => <PosterCard key={c.id} card={c} size="sm" />)}
          </Rail>
        </section>
      )}
    </>
  );
}
