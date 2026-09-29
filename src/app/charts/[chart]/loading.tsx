import { Container } from '@/components/ui';

export default function Loading() {
  return (
    <Container className="pb-12 pt-28">
      <div className="eyebrow mb-4">IMDb Charts</div>
      <div className="skeleton h-24 w-3/4 max-w-2xl rounded-2xl" />
      <div className="skeleton mt-6 h-5 w-1/2 max-w-md rounded" />
      <div className="mt-14 grid gap-4 md:grid-cols-[1.35fr_1fr]">
        <div className="skeleton h-52 rounded-[20px]" />
        <div className="skeleton h-52 rounded-[20px]" />
      </div>
      <div className="mt-10 space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-5 px-3 py-2">
            <div className="skeleton h-10 w-14 rounded" />
            <div className="skeleton aspect-[2/3] w-16 rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-4 w-1/3 rounded" />
              <div className="skeleton h-3 w-1/5 rounded" />
            </div>
          </div>
        ))}
      </div>
    </Container>
  );
}
