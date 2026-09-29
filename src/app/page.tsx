import { Suspense } from 'react';
import { getChart, getHeroExtras, getHome, getTitle } from '@/lib/imdb';
import { Hero, type HeroItem } from '@/components/home/Hero';
import { ComingSoon, Decades, FilmOfTheDay, GenreWall } from '@/components/home/Sections';
import { PersonalRails } from '@/components/home/PersonalRails';
import { PosterCard } from '@/components/PosterCard';
import { Rail } from '@/components/Rail';
import { Container, SectionHeader } from '@/components/ui';
import { RouletteTeaser } from '@/components/home/RouletteTeaser';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [home, top250] = await Promise.all([getHome(), getChart('TOP_RATED_MOVIES', 250)]);

  // Hero: the most popular films that have artwork; prefer ones with widescreen stills.
  const candidates = home.popular.filter((c) => c.poster && c.plot).slice(0, 10);
  const extras = await getHeroExtras(candidates.map((c) => c.id));
  const hero: HeroItem[] = candidates
    .map((c, i) => ({ ...c, ...extras[i] }))
    .sort((a, b) => Number(b.stills.length > 0) - Number(a.stills.length > 0))
    .slice(0, 6)
    .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0));

  const trending = home.popular.slice(0, 10);
  const genrePool = [...home.popular, ...home.tv, ...top250];

  return (
    <>
      <Hero items={hero} />

      <div className="relative z-10">
        <section className="mt-12">
          <Container>
            <SectionHeader eyebrow="The world is watching" title="Top 10 Today" href="/charts/popular-movies" />
          </Container>
          <Rail gap="gap-2 sm:gap-3">
            {trending.map((c, i) => (
              <PosterCard key={c.id} card={c} rankNumeral={i + 1} priority={i < 4} />
            ))}
          </Rail>
        </section>

        <Suspense fallback={null}>
          <PersonalRails />
        </Suspense>

        <section className="mt-14">
          <Container>
            <SectionHeader eyebrow="Binge-worthy" title="Popular Series" href="/charts/popular-tv" />
          </Container>
          <Rail>
            {home.tv.filter((c) => c.poster).map((c) => <PosterCard key={c.id} card={c} />)}
          </Rail>
        </section>

        <ComingSoon items={home.soon} />

        <Suspense fallback={<div className="mt-16 h-[520px]" />}>
          <FilmOfTheDayLoader ids={top250.slice(0, 120).map((c) => c.id)} />
        </Suspense>

        <GenreWall pool={genrePool} />

        <RouletteTeaser posters={top250.filter((c) => c.poster).slice(0, 24).map((c) => c.poster!)} />

        <section className="mt-16">
          <Container>
            <SectionHeader eyebrow="The canon" title="Top 250 Movies" href="/charts/top-movies" />
          </Container>
          <Rail>
            {home.top.map((c) => (
              <PosterCard key={c.id} card={c} size="lg" meta={`#${c.rank} · ${c.year ?? ''}`} />
            ))}
          </Rail>
        </section>

        <Decades top={top250} />

      </div>
    </>
  );
}

// Deterministic "film of the day" — the same pick for everyone on a given date.
function pickForToday(ids: string[]) {
  const day = Math.floor(Date.now() / 86_400_000);
  return ids[(day * 7919) % ids.length];
}

async function FilmOfTheDayLoader({ ids }: { ids: string[] }) {
  const t = await getTitle(pickForToday(ids)).catch(() => null);
  return t ? <FilmOfTheDay t={t} /> : null;
}
