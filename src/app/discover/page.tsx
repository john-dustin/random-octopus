import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Discover } from '@/components/discover/Discover';
import { Container } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Discover',
  description: 'Filter every film and series on IMDb by mood, genre, era, rating and runtime.',
};

export default function DiscoverPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <Discover />
    </Suspense>
  );
}

function Fallback() {
  return (
    <Container className="pb-10 pt-28">
      <div className="eyebrow mb-3">Discover</div>
      <div className="skeleton h-20 w-2/3 max-w-2xl rounded-2xl" />
      <div className="mt-10 flex gap-3 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-36 w-60 shrink-0 rounded-2xl" />
        ))}
      </div>
    </Container>
  );
}
