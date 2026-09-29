import Link from 'next/link';
import {
  Rocket, Zap, Drama, Laugh, Ghost, Palette, Heart, Fingerprint, Mountain, Camera, Sparkles, Shield,
} from 'lucide-react';
import type { Card, TitleDetail } from '@/lib/types';
import { cx, daysUntil, img, poster, runtime, titleHref } from '@/lib/format';
import { PosterCard } from '@/components/PosterCard';
import { Rail } from '@/components/Rail';
import { Container, SectionHeader, Tag } from '@/components/ui';
import { FilmOfTheDayActions } from './FilmOfTheDayActions';

/* ------------------------------------------------------------------ */
/* Coming soon — iOS calendar badge above each poster                  */
/* ------------------------------------------------------------------ */

export function ComingSoon({ items }: { items: Card[] }) {
  const withPosters = items.filter((c) => c.poster);
  if (!withPosters.length) return null;
  return (
    <section className="mt-14">
      <Container>
        <SectionHeader eyebrow="Premieres" title="Coming Soon" />
      </Container>
      <Rail>
        {withPosters.map((c) => {
          const d = daysUntil(c.release);
          const month = c.release?.month ? new Date(2000, c.release.month - 1, 1).toLocaleString('en', { month: 'short' }) : '';
          return (
            <div key={c.id} className="shrink-0 snap-start">
              <div className="mb-3 flex items-center gap-3">
                {/* Calendar-app style date badge */}
                <div className="flex h-[52px] w-[46px] flex-col overflow-hidden rounded-[11px] bg-white text-center text-black shadow-[0_4px_14px_-6px_rgb(0_0_0/0.6)]">
                  <span className="bg-danger py-[3px] text-[9.5px] font-bold uppercase tracking-wide text-white">{month}</span>
                  <span className="grid flex-1 place-items-center text-[21px] font-semibold leading-none tracking-[-0.03em]">{c.release?.day ?? '–'}</span>
                </div>
                <div className="leading-tight">
                  <div className="text-[13px] font-semibold text-white">
                    {d == null ? 'Date TBA' : d <= 0 ? 'Out now' : d === 1 ? 'Tomorrow' : `In ${d} days`}
                  </div>
                  <div className="mt-0.5 text-[12px] text-muted">{c.genres.slice(0, 2).join(', ')}</div>
                </div>
              </div>
              <PosterCard card={c} meta={c.genres[0]} />
            </div>
          );
        })}
      </Rail>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Genres — App Store category tiles, one system colour each           */
/* ------------------------------------------------------------------ */

const GENRE_TILES = [
  { genre: 'Sci-Fi', color: '#0a84ff', icon: Rocket },
  { genre: 'Thriller', color: '#ff453a', icon: Zap },
  { genre: 'Drama', color: '#bf5af2', icon: Drama },
  { genre: 'Comedy', color: '#ffd60a', icon: Laugh },
  { genre: 'Horror', color: '#8e8e93', icon: Ghost },
  { genre: 'Animation', color: '#ff9f0a', icon: Palette },
  { genre: 'Romance', color: '#ff375f', icon: Heart },
  { genre: 'Crime', color: '#5e5ce6', icon: Fingerprint },
  { genre: 'Adventure', color: '#30d158', icon: Mountain },
  { genre: 'Documentary', color: '#40c8e0', icon: Camera },
  { genre: 'Fantasy', color: '#63e6e2', icon: Sparkles },
  { genre: 'War', color: '#ac8e68', icon: Shield },
];

export function GenreWall({ pool }: { pool: Card[] }) {
  const used = new Set<string>();
  const tiles = GENRE_TILES.map((t) => {
    const pick = pool.find((c) => c.poster && c.genres.includes(t.genre) && !used.has(c.id));
    if (pick) used.add(pick.id);
    return { ...t, pick };
  });
  return (
    <section className="mt-16">
      <Container>
        <SectionHeader eyebrow="Browse" title="Categories" href="/discover" hrefLabel="All Filters" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {tiles.map((t) => {
            const Icon = t.icon;
            return (
              <Link
                key={t.genre}
                href={`/discover?genre=${encodeURIComponent(t.genre)}`}
                className="group relative isolate flex h-[120px] flex-col justify-between overflow-hidden rounded-[20px] p-4 ring-[0.5px] ring-white/10 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97] sm:h-[132px]"
                style={{ background: `linear-gradient(145deg, ${t.color}, color-mix(in oklab, ${t.color} 45%, black))` }}
              >
                {t.pick && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={poster(t.pick.poster, 200)}
                    alt=""
                    loading="lazy"
                    className="absolute -bottom-4 -right-3 -z-10 aspect-[2/3] w-[76px] rotate-[10deg] rounded-[10px] object-cover shadow-[0_10px_24px_rgb(0_0_0/0.45)] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:rotate-[4deg] group-hover:scale-105"
                  />
                )}
                <span className="grid size-9 place-items-center rounded-full bg-white/25 backdrop-blur-md">
                  <Icon size={18} strokeWidth={2.3} className="text-white" />
                </span>
                <span className="text-[17px] font-semibold tracking-[-0.02em] text-white [text-shadow:0_1px_8px_rgb(0_0_0/0.35)]">{t.genre}</span>
              </Link>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Decades                                                             */
/* ------------------------------------------------------------------ */

export function Decades({ top }: { top: Card[] }) {
  const decades = [1920, 1930, 1940, 1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020]
    .map((d) => ({ d, best: top.filter((c) => c.year && c.year >= d && c.year < d + 10 && c.poster).slice(0, 3) }))
    .filter((x) => x.best.length);
  return (
    <section className="mt-16">
      <Container>
        <SectionHeader eyebrow="A century of cinema" title="By Decade" />
      </Container>
      <Rail gap="gap-3">
        {decades.map(({ d, best }) => (
          <Link
            key={d}
            href={`/discover?from=${d}&to=${d + 9}&sort=USER_RATING&votes=25000`}
            className="panel group relative w-[220px] shrink-0 snap-start overflow-hidden p-4 transition-transform duration-300 active:scale-[0.97] sm:w-[240px]"
          >
            <div className="flex items-baseline justify-between">
              <span className="text-[28px] font-bold tracking-[-0.04em]">{d}s</span>
              <span className="text-[12px] text-muted">{best.length} classics</span>
            </div>
            <div className="relative mt-4 h-[124px]">
              {best.map((c, k) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={c.id}
                  src={poster(c.poster, 180)}
                  alt={c.title}
                  loading="lazy"
                  className="absolute top-0 aspect-[2/3] w-[82px] rounded-[10px] object-cover shadow-[0_8px_20px_-8px_rgb(0_0_0/0.8)] ring-[0.5px] ring-white/10 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:-translate-y-1"
                  style={{ left: k * 60, zIndex: 3 - k, transitionDelay: `${k * 40}ms`, filter: k ? 'brightness(.75)' : undefined }}
                />
              ))}
            </div>
            <div className="mt-3 truncate text-[13px] text-muted">
              Best: <span className="text-white">{best[0].title}</span>
            </div>
          </Link>
        ))}
      </Rail>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Film of the day — a large iOS widget card                           */
/* ------------------------------------------------------------------ */

export function FilmOfTheDay({ t }: { t: TitleDetail }) {
  const still = t.stills[1] ?? t.stills[0];
  const quote = t.quotes.find((q) => q.length <= 3 && q.every((l) => l.text) && q.some((l) => l.text!.length > 30) && q.every((l) => l.text!.length < 240));
  const trivia = t.trivia.find((x) => x.length < 320);
  return (
    <section className="mt-16">
      <Container>
        <SectionHeader eyebrow="From the Top 250" title="Film of the Day" href={titleHref(t.id)} hrefLabel="Open" />
        <div className="relative isolate overflow-hidden rounded-[28px] ring-[0.5px] ring-white/10">
          {still && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img(still.url, 1920)} alt="" loading="lazy" className="absolute inset-0 -z-10 size-full object-cover" />
          )}
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgb(0_0_0/0.85)_0%,rgb(0_0_0/0.55)_50%,rgb(0_0_0/0.25)_100%)]" />
          <div className="grid gap-8 p-6 sm:p-10 lg:grid-cols-[auto_1fr_minmax(0,360px)] lg:items-center lg:gap-12 lg:p-12">
            <Link href={titleHref(t.id)} className="mx-auto w-44 shrink-0 sm:w-52 lg:mx-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={poster(t.poster, 480)}
                alt={t.title}
                loading="lazy"
                className="aspect-[2/3] w-full rounded-[16px] object-cover shadow-[0_24px_60px_-20px_rgb(0_0_0/0.9)] ring-[0.5px] ring-white/15 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-[1.02]"
              />
            </Link>
            <div>
              <h3 className="display text-[clamp(2rem,4vw,3.4rem)]">{t.title}</h3>
              <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[15px] text-white/75">
                {t.rating != null && (
                  <span className="font-semibold text-white">
                    <span className="text-gold">★</span> {t.rating.toFixed(1)}
                  </span>
                )}
                <span>· {t.year}</span>
                {t.cert && <Tag>{t.cert}</Tag>}
                {t.runtime && <span>· {runtime(t.runtime)}</span>}
                {t.directors[0] && <span>· {t.directors[0].name}</span>}
              </div>
              {t.plot && <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-white/75">{t.plot}</p>}
              <FilmOfTheDayActions t={t} />
            </div>
            <div className="flex flex-col gap-4">
              {quote && (
                <figure className="glass rounded-[20px] p-5">
                  {quote.map((l, k) => (
                    <blockquote key={k} className={cx(k > 0 && 'mt-3')}>
                      {l.characters?.[0]?.character && <div className="eyebrow mb-1 text-[11px]">{l.characters[0].character}</div>}
                      <p className="text-[17px] font-medium leading-snug tracking-[-0.015em]">“{l.text}”</p>
                    </blockquote>
                  ))}
                </figure>
              )}
              {trivia && (
                <div className="glass rounded-[20px] p-5 text-[14px] leading-relaxed text-white/80">
                  <div className="eyebrow mb-2 text-[11px]">Did you know</div>
                  {trivia}
                </div>
              )}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
