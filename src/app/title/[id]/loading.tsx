import { Container } from '@/components/ui';

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading title">
      <section className="relative flex min-h-[92svh] items-end overflow-hidden">
        <div aria-hidden className="absolute inset-0">
          <div className="skeleton absolute inset-0 opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-bg/95 via-bg/40 to-transparent" />
        </div>
        <Container className="relative z-10 pb-16 pt-28">
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:gap-12">
            <div className="skeleton aspect-[2/3] w-[200px] shrink-0 rounded-2xl sm:w-[240px] lg:w-[290px]" />
            <div className="flex-1 space-y-5">
              <div className="skeleton h-3 w-40 rounded" />
              <div className="skeleton h-20 w-full max-w-2xl rounded-xl" />
              <div className="flex gap-2">
                {[64, 40, 56, 72, 64].map((w, i) => (
                  <div key={i} className="skeleton h-6 rounded-full" style={{ width: w }} />
                ))}
              </div>
              <div className="skeleton h-7 w-3/5 rounded-lg" />
              <div className="space-y-2">
                <div className="skeleton h-3.5 w-full max-w-2xl rounded" />
                <div className="skeleton h-3.5 w-11/12 max-w-2xl rounded" />
                <div className="skeleton h-3.5 w-2/3 max-w-2xl rounded" />
              </div>
              <div className="flex gap-2.5 pt-3">
                <div className="skeleton h-13 w-40 rounded-full" />
                <div className="skeleton h-13 w-36 rounded-full" />
                <div className="skeleton h-13 w-40 rounded-full" />
              </div>
            </div>
          </div>
        </Container>
      </section>
      <Container className="pt-8">
        <div className="skeleton h-[104px] rounded-3xl" />
        <div className="mt-16 grid gap-12 lg:grid-cols-[1fr_340px]">
          <div className="space-y-4">
            <div className="skeleton h-9 w-64 rounded-lg" />
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton h-20 rounded-2xl" />
              ))}
            </div>
          </div>
          <div className="skeleton h-80 rounded-[20px]" />
        </div>
      </Container>
    </div>
  );
}
