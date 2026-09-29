import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Skull, Trophy, TrendingUp } from 'lucide-react';
import { CHARTS, type ChartSlug } from '@/lib/types';
import { getChart } from '@/lib/imdb';
import { cx, poster, titleHref } from '@/lib/format';
import { Ambient } from '@/components/Ambient';
import { Container } from '@/components/ui';
import { ChartList } from '@/components/charts/ChartList';

const isSlug = (s: string): s is ChartSlug => s in CHARTS;

export async function generateMetadata({ params }: { params: Promise<{ chart: string }> }): Promise<Metadata> {
  const { chart } = await params;
  if (!isSlug(chart)) return { title: 'Charts' };
  return { title: CHARTS[chart].label, description: CHARTS[chart].blurb };
}

export default async function ChartPage({ params }: { params: Promise<{ chart: string }> }) {
  const { chart } = await params;
  if (!isSlug(chart)) notFound();
  const meta = CHARTS[chart];
  const items = await getChart(meta.type);
  const shame = chart === 'hall-of-shame';
  const top = items.slice(0, 3);
  const rated = items.filter((c) => c.rating != null);
  const avg = rated.length ? rated.reduce((a, c) => a + (c.rating ?? 0), 0) / rated.length : undefined;
  const yrs = items.map((c) => c.year).filter(Boolean) as number[];

  return (
    <div style={shame ? ({ '--accent': '239 91 76' } as React.CSSProperties) : undefined}>
      {shame ? (
        <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-[30vh] left-1/2 h-[90vh] w-[120vw] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(239_91_76/0.22),transparent)] blur-[120px]" />
        </div>
      ) : (
        <Ambient image={items[0]?.poster} />
      )}

      <section className="relative overflow-hidden pb-12 pt-28">
        <Container className="relative grid items-center gap-10 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <div className="eyebrow mb-4 flex items-center gap-2 text-gold">
              {shame ? <Skull size={13} /> : chart.startsWith('top') ? <Trophy size={13} /> : <TrendingUp size={13} />}
              IMDb Charts
            </div>
            <h1 className="display text-[clamp(3.2rem,8vw,7.5rem)]">
              {shame ? (
                <>
                  Hall of <span className="text-danger">Shame</span>
                </>
              ) : (
                meta.label
              )}
            </h1>
            <p className="mt-5 max-w-lg text-lg text-muted">{meta.blurb}</p>
            {shame && (
              <p className="mt-3 max-w-lg text-sm text-faint">
                The lowest-rated films with a real audience. Some are fascinating disasters, some are a rite of passage. Watch
                responsibly — preferably with friends.
              </p>
            )}
            <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-4">
              <Stat label="Titles" value={items.length.toString()} />
              {avg != null && <Stat label="Average rating" value={`★ ${avg.toFixed(2)}`} />}
              {yrs.length > 0 && <Stat label="Spanning" value={`${Math.min(...yrs)}–${Math.max(...yrs)}`} />}
            </dl>
          </div>

          {/* Fanned podium */}
          <div className="relative mx-auto hidden h-[380px] w-full max-w-[460px] sm:block">
            {top
              .slice()
              .reverse()
              .map((c, ri) => {
                const i = top.length - 1 - ri; // 0 = #1
                const pos = [
                  'left-1/2 -translate-x-1/2 z-30 rotate-0 top-0',
                  'left-[4%] z-20 -rotate-[9deg] top-10',
                  'right-[4%] z-10 rotate-[9deg] top-10',
                ][i];
                return (
                  <Link
                    key={c.id}
                    href={titleHref(c.id)}
                    className={cx(
                      'group absolute w-[200px] transition-all duration-700 ease-out-expo hover:z-40 hover:-translate-y-3 hover:rotate-0',
                      pos
                    )}
                  >
                    <div className="sheen relative aspect-[2/3] overflow-hidden rounded-2xl bg-s2 shadow-[0_40px_80px_-20px_rgb(0_0_0/0.95)] ring-1 ring-white/10">
                      {c.poster && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={poster(c.poster, 400)} alt={c.title} className={cx('size-full object-cover', shame && 'grayscale-[0.3]')} />
                      )}
                      <span
                        className="display absolute bottom-2 left-3 text-6xl text-white drop-shadow-[0_4px_20px_rgb(0_0_0/0.9)]"
                        style={{ WebkitTextStroke: i ? undefined : '0' }}
                      >
                        {c.rank}
                      </span>
                    </div>
                  </Link>
                );
              })}
          </div>
        </Container>
      </section>

      {/* Tabs */}
      <Container>
        <nav className="scrollbar-none -mx-1 mb-8 flex gap-1 overflow-x-auto border-b border-line px-1">
          {(Object.keys(CHARTS) as ChartSlug[]).map((s) => (
            <Link
              key={s}
              href={`/charts/${s}`}
              className={cx(
                'relative shrink-0 px-4 pb-3 pt-1 text-sm transition-colors',
                s === chart ? 'text-fg' : 'text-muted hover:text-fg'
              )}
            >
              {CHARTS[s].label}
              {s === chart && <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-accent" />}
            </Link>
          ))}
        </nav>
        <ChartList items={items} shame={shame} />
      </Container>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="eyebrow">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold tabular">{value}</dd>
    </div>
  );
}
