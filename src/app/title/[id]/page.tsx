import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { getTitle } from '@/lib/imdb';
import type { Card, PersonRef, TitleDetail } from '@/lib/types';
import { cx, img, runtime, years } from '@/lib/format';
import { Container, Tag } from '@/components/ui';
import { Ambient } from '@/components/Ambient';
import { Rail } from '@/components/Rail';
import { PosterCard } from '@/components/PosterCard';
import { TiltPoster } from '@/components/title/TiltPoster';
import { Actions } from '@/components/title/Actions';
import { SectionNav } from '@/components/title/SectionNav';
import { BoxOffice } from '@/components/title/BoxOffice';
import { EpisodeGuide } from '@/components/title/EpisodeGuide';
import { Gallery, Videos } from '@/components/title/Media';
import { Goofs, Reviews, Trivia } from '@/components/title/Stories';
import { CastRail, Crew, Facts, Heading, Keywords, Quotes, Scores, WhereToWatch } from '@/components/title/Sections';

type Props = { params: Promise<{ id: string }> };

// Cache rendered pages so repeat traffic doesn't re-hit IMDb; trailer URLs are
// signed and the data cache holds them 30 min, so revalidate on the same order.
export const revalidate = 1800;

// No catalog to enumerate — render each title on first request, then serve from cache.
export function generateStaticParams() {
  return [];
}

async function load(id: string) {
  if (!/^tt\d{5,10}$/.test(id)) return null;
  return getTitle(id);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const t = await load(id).catch(() => null);
  if (!t) return { title: 'Title not found' };
  const name = t.year ? `${t.title} (${years(t.year, t.endYear, t.series)})` : t.title;
  return {
    title: name,
    description: t.plot ?? t.tagline,
    openGraph: {
      title: name,
      description: t.plot ?? undefined,
      images: t.stills[0] ? [img(t.stills[0].url, 1200)!] : t.poster ? [img(t.poster, 600)!] : undefined,
    },
  };
}

export default async function TitlePage({ params }: Props) {
  const { id } = await params;
  const t = await load(id);
  if (!t) notFound();

  const card: Card = {
    id: t.id, title: t.title, year: t.year, endYear: t.endYear, rating: t.rating, votes: t.votes, poster: t.poster,
    type: t.type, typeText: t.typeText, series: t.series, runtime: t.runtime, genres: t.genres, cert: t.cert,
  };
  const isSeries = !!t.series && t.seasons.length > 0;
  const hasBox = !!(t.budget || t.gross || t.domestic);
  const hasStories = t.trivia.length > 0 || t.quotes.length > 0 || t.goofs.length > 0;

  const sections = [
    { id: 'overview', label: 'Overview' },
    { id: 'watch', label: 'Where to watch' },
    isSeries && { id: 'episodes', label: 'Episodes' },
    hasBox && { id: 'box-office', label: 'Box office' },
    t.cast.length > 0 && { id: 'cast', label: 'Cast' },
    t.videos.length > 0 && { id: 'videos', label: 'Videos' },
    t.images.length > 0 && { id: 'gallery', label: 'Gallery' },
    hasStories && { id: 'trivia', label: 'Trivia' },
    t.reviews.length > 0 && { id: 'reviews', label: 'Reviews' },
    t.similar.length > 0 && { id: 'similar', label: 'More like this' },
  ].filter(Boolean) as { id: string; label: string }[];

  return (
    <>
      <Ambient image={t.poster} />
      <Hero t={t} card={card} />

      <div className="relative">
        <SectionNav sections={sections} />

        <Container id="overview" className="scroll-mt-32 pt-8">
          <Scores t={t} />
        </Container>

        <Container className="mt-16 grid gap-12 lg:grid-cols-[minmax(0,1fr)_340px] xl:gap-16">
          <div className="min-w-0 space-y-20">
            <WhereToWatch watch={t.watch} id={t.id} title={t.title} />
            {isSeries && <EpisodeGuide id={t.id} seasons={t.seasons} title={t.title} />}
            {hasBox && <BoxOffice budget={t.budget} domestic={t.domestic} gross={t.gross} opening={t.opening} />}
            <Keywords keywords={t.keywords} />
          </div>
          <aside className="space-y-5 lg:self-start">
            <Crew t={t} />
            <Facts t={t} />
          </aside>
        </Container>

        <div className="mt-24 space-y-20">
          <CastRail cast={t.cast} total={t.castTotal} series={t.series} />
          <Videos videos={t.videos} title={t.title} />
        </div>

        {t.images.length > 0 && (
          <Container className="mt-20">
            <Gallery images={t.images} total={t.imageTotal} title={t.title} />
          </Container>
        )}

        {hasStories && (
          <Container id="trivia" className="mt-24 scroll-mt-32">
            <Heading eyebrow="Behind the scenes" title="Trivia & lines" />
            <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
              {t.trivia.length > 0 && <Trivia trivia={t.trivia} />}
              <Quotes quotes={t.quotes} />
            </div>
            {t.goofs.length > 0 && (
              <div className="mt-5">
                <Goofs goofs={t.goofs} />
              </div>
            )}
          </Container>
        )}

        {t.reviews.length > 0 && (
          <Container className="mt-24">
            <Reviews reviews={t.reviews} />
          </Container>
        )}

        {t.similar.length > 0 && (
          <section id="similar" className="mt-24 scroll-mt-32">
            <Container>
              <Heading eyebrow="If you liked this" title="More like this" />
            </Container>
            <Rail>
              {t.similar.map((c) => (
                <PosterCard key={c.id} card={c} />
              ))}
            </Rail>
          </section>
        )}
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

function Hero({ t, card }: { t: TitleDetail; card: Card }) {
  const backdrop = t.stills[0]?.url;
  const long = t.title.length > 28;
  // Series rarely have a single director; prefer creators, then writers.
  const people: [string, PersonRef[]] | null = t.creators.length
    ? ['Created by', t.creators]
    : t.series && t.writers.length
      ? ['Written by', t.writers]
      : t.directors.length
      ? ['Directed by', t.directors]
      : t.writers.length
        ? ['Written by', t.writers]
        : null;
  const writers = !t.series && t.directors.length && t.writers.length && !t.creators.length ? t.writers.filter((w) => !t.directors.some((d) => d.id === w.id)) : [];

  return (
    <section className="relative flex min-h-[92svh] items-end overflow-hidden [mask-image:linear-gradient(to_bottom,#000_88%,transparent)]">
      {/* Backdrop */}
      <div aria-hidden className="absolute inset-0">
        {backdrop ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img(backdrop, 1920)} alt="" className="animate-kenburns absolute inset-0 size-full object-cover opacity-80" />
        ) : t.poster ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img(t.poster, 800)} alt="" className="absolute inset-0 size-full scale-125 object-cover opacity-50 blur-3xl" />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/70 to-bg/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-bg/95 via-bg/50 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-night/70 to-transparent" />
        <div className="absolute inset-0 [background:radial-gradient(ellipse_at_70%_20%,transparent_40%,rgb(0_0_0/0.5))]" />
      </div>

      <Container className="relative z-10 pb-12 pt-28 sm:pb-16">
        {t.parent && (
          <Link
            href={`/title/${t.parent.id}`}
            className="animate-fade-up glass mb-8 inline-flex items-center gap-2 rounded-full py-1.5 pl-2 pr-4 text-sm text-muted transition-colors hover:text-fg"
          >
            <ChevronLeft size={16} />
            <span className="font-medium text-fg">{t.parent.title}</span>
            {t.parent.season != null && (
              <span className="font-mono text-xs text-faint">
                S{t.parent.season} · E{t.parent.episode}
              </span>
            )}
          </Link>
        )}

        <div className="flex flex-col gap-8 md:flex-row md:items-end md:gap-12">
          <TiltPoster src={t.poster} alt={t.title} videos={t.videos} title={t.title} />

          <div className="min-w-0 flex-1">
            <div className="animate-fade-up eyebrow mb-4 flex flex-wrap items-center gap-x-3 gap-y-1" style={{ animationDelay: '80ms' }}>
              <span className="text-accent">{t.typeText ?? 'Title'}</span>
              {t.rank && <span>#{t.rank} popular</span>}
              {t.countries[0] && <span>{t.countries.slice(0, 2).join(' · ')}</span>}
            </div>

            <h1
              className={cx(
                'animate-fade-up display text-balance drop-shadow-[0_4px_30px_rgb(0_0_0/0.6)]',
                long ? 'text-[clamp(2.6rem,6vw,5.5rem)]' : 'text-[clamp(3.2rem,8.5vw,8rem)]'
              )}
              style={{ animationDelay: '140ms' }}
            >
              {t.title}
            </h1>
            {t.originalTitle && t.originalTitle !== t.title && (
              <div className="animate-fade-up display mt-2 text-2xl text-muted" style={{ animationDelay: '180ms' }}>
                {t.originalTitle}
              </div>
            )}

            <div className="animate-fade-up mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted" style={{ animationDelay: '220ms' }}>
              {t.year && <span className="font-mono tabular text-fg">{years(t.year, t.endYear, t.series)}</span>}
              {t.cert && <Tag>{t.cert}</Tag>}
              {t.runtime && <span className="tabular">{runtime(t.runtime)}</span>}
              {isSeriesLabel(t) && <span>{isSeriesLabel(t)}</span>}
              {t.genres.length > 0 && <span className="text-faint">·</span>}
              {t.genres.map((g) => (
                <Link
                  key={g}
                  href={`/discover?genre=${encodeURIComponent(g)}`}
                  className="rounded-full border border-white/15 px-2.5 py-0.5 text-[12.5px] text-fg/85 backdrop-blur transition-colors hover:border-white/40 hover:text-white"
                >
                  {g}
                </Link>
              ))}
            </div>

            {t.tagline && (
              <p className="animate-fade-up display mt-6 max-w-3xl text-[1.6rem] leading-snug text-fg/80" style={{ animationDelay: '280ms' }}>
                {t.tagline}
              </p>
            )}
            {t.plot && (
              <p className="animate-fade-up mt-4 max-w-2xl text-[15.5px] leading-relaxed text-muted" style={{ animationDelay: '320ms' }}>
                {t.plot}
              </p>
            )}

            {people && (
              <div className="animate-fade-up mt-5 flex flex-wrap gap-x-6 gap-y-1 text-sm" style={{ animationDelay: '360ms' }}>
                <span>
                  <span className="text-faint">{people[0]} </span>
                  <PeopleLinks people={people[1]} />
                </span>
                {writers.length > 0 && (
                  <span>
                    <span className="text-faint">Written by </span>
                    <PeopleLinks people={writers.slice(0, 3)} />
                  </span>
                )}
              </div>
            )}

            <div className="animate-fade-up mt-8" style={{ animationDelay: '420ms' }}>
              <Actions card={card} videos={t.videos} />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

function isSeriesLabel(t: TitleDetail) {
  if (t.series && t.seasons.length) return `${t.seasons.length} season${t.seasons.length > 1 ? 's' : ''}`;
  if (t.parent) return 'Episode';
  return undefined;
}

function PeopleLinks({ people }: { people: PersonRef[] }) {
  return (
    <>
      {people.map((p, i) => (
        <span key={p.id}>
          {i > 0 && <span className="text-faint">, </span>}
          <Link href={`/name/${p.id}`} className="font-medium text-fg underline-offset-4 transition-colors hover:text-accent hover:underline">
            {p.name}
          </Link>
        </span>
      ))}
    </>
  );
}
