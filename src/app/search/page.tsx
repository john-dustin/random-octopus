import type { Metadata } from 'next';
import { SearchX } from 'lucide-react';
import { searchAll } from '@/lib/imdb';
import { ButtonLink, Container, Empty } from '@/components/ui';
import { SearchResults } from '@/components/search/SearchResults';
import { SearchBox } from '@/components/search/SearchBox';

type Props = { searchParams: Promise<{ q?: string | string[] }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const q = one((await searchParams).q);
  return { title: q ? `“${q}”` : 'Search' };
}

const one = (v?: string | string[]) => (Array.isArray(v) ? v[0] : v)?.trim().slice(0, 100) ?? '';

export default async function SearchPage({ searchParams }: Props) {
  const q = one((await searchParams).q);
  const res = q ? await searchAll(q).catch(() => null) : null;
  const total = (res?.titles.length ?? 0) + (res?.names.length ?? 0);

  return (
    <div className="pt-28 sm:pt-32">
      <Container>
        <div className="eyebrow mb-3 text-leaf">Search the archive</div>
        <SearchBox key={q} initial={q} />
        {q && res && (
          <p className="mt-4 text-sm text-muted">
            {total > 0 ? (
              <>
                <span className="font-mono text-fg tabular">{res.titles.length}</span> titles and{' '}
                <span className="font-mono text-fg tabular">{res.names.length}</span> people matching{' '}
                <span className="text-accent">“{q}”</span>
              </>
            ) : null}
          </p>
        )}
      </Container>

      <div className="mt-12">
        {!q ? (
          <Container>
            <Empty title="What are you looking for?">
              Search by title, actor, director or character. Tip: press <kbd className="font-mono text-fg">⌘K</kbd> anywhere for instant results.
            </Empty>
          </Container>
        ) : !res ? (
          <Container>
            <Empty title="The projector jammed" icon={<SearchX size={34} />}>
              We couldn’t reach IMDb just now. Try again in a moment.
            </Empty>
          </Container>
        ) : total === 0 ? (
          <Container>
            <Empty title="Nothing in the reels" icon={<SearchX size={34} />}>
              <p>No matches for “{q}”. Check the spelling, or go browsing instead.</p>
              <div className="mt-6 flex justify-center gap-2">
                <ButtonLink href="/discover" variant="primary">Discover</ButtonLink>
                <ButtonLink href="/roulette">Spin the roulette</ButtonLink>
              </div>
            </Empty>
          </Container>
        ) : (
          <SearchResults q={q} result={res} />
        )}
      </div>
    </div>
  );
}
