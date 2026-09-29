import { Container } from '@/components/ui';
import { PosterSkeleton } from '@/components/PosterCard';

export default function Loading() {
  return (
    <div className="pt-16">
      <Container className="grid items-end gap-8 pb-10 pt-10 sm:pt-16 md:grid-cols-[minmax(220px,340px)_1fr] md:gap-14">
        <div className="skeleton mx-auto aspect-[3/4] w-[min(72vw,300px)] rounded-[28px] md:mx-0 md:w-full" />
        <div>
          <div className="skeleton mb-5 h-3 w-48 rounded" />
          <div className="skeleton h-20 w-4/5 max-w-2xl rounded-2xl sm:h-28" />
          <div className="skeleton mt-8 h-4 w-72 rounded" />
          <div className="mt-8 space-y-3">
            <div className="skeleton h-3.5 w-full max-w-3xl rounded" />
            <div className="skeleton h-3.5 w-11/12 max-w-3xl rounded" />
            <div className="skeleton h-3.5 w-3/4 max-w-3xl rounded" />
          </div>
        </div>
      </Container>
      <Container className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton h-[124px] rounded-[20px]" />
        ))}
      </Container>
      <Container className="mt-20 flex gap-5 overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <PosterSkeleton key={i} size="lg" />
        ))}
      </Container>
    </div>
  );
}
