import { Container } from '@/components/ui';
import { PosterSkeleton } from '@/components/PosterCard';

export default function Loading() {
  return (
    <div className="pt-28 sm:pt-32">
      <Container>
        <div className="skeleton mb-4 h-3 w-36 rounded" />
        <div className="skeleton h-16 w-full max-w-3xl rounded-2xl sm:h-20" />
        <div className="mt-14 flex gap-6 overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex shrink-0 flex-col items-center gap-3">
              <div className="skeleton size-24 rounded-full sm:size-28" />
              <div className="skeleton h-3 w-20 rounded" />
            </div>
          ))}
        </div>
        <div className="mt-14 grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-5">
          {Array.from({ length: 12 }).map((_, i) => (
            <PosterSkeleton key={i} />
          ))}
        </div>
      </Container>
    </div>
  );
}
