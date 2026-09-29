import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Logo } from './Nav';
import { Container } from './ui';

const COLS = [
  { title: 'Explore', links: [['Discover', '/discover'], ['Movie Roulette', '/roulette'], ['Versus', '/compare'], ['Your Library', '/library']] },
  { title: 'Charts', links: [['Top 250 Movies', '/charts/top-movies'], ['Top 250 Series', '/charts/top-tv'], ['Most Popular', '/charts/popular-movies'], ['Hall of Shame', '/charts/hall-of-shame']] },
  { title: 'Moods', links: [['Mind-benders', '/discover?mood=mindbender'], ['Feel-good', '/discover?mood=feelgood'], ['Hidden Gems', '/discover?mood=gems'], ['Midnight Horror', '/discover?mood=midnight']] },
];

/** iOS Settings-style grouped lists on glass, over the forest. */
export function Footer() {
  return (
    <footer className="relative mt-24 pb-10">
      <Container>
        <div className="grid gap-6 md:grid-cols-[1.2fr_repeat(3,1fr)]">
          <div className="max-w-sm pt-1">
            <Logo />
            <p className="mt-4 text-[15px] leading-relaxed text-white/70">
              Every film and series, beautifully organised — with trailers, cast, charts and where to stream legally.
            </p>
          </div>
          {COLS.map((c) => (
            <div key={c.title}>
              <div className="eyebrow mb-2 px-4">{c.title}</div>
              <ul className="panel overflow-hidden !rounded-[16px]">
                {c.links.map(([label, href], i) => (
                  <li key={href} className={i > 0 ? 'border-t-[0.5px] border-white/10' : ''}>
                    <Link href={href} className="flex h-11 items-center justify-between px-4 text-[15px] text-white transition-colors hover:bg-white/[0.06]">
                      {label}
                      <ChevronRight size={16} strokeWidth={2.4} className="text-white/30" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col gap-2 border-t-[0.5px] border-white/10 pt-6 text-[12px] text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <span>
            © {new Date().getFullYear()} Lumière · Metadata, images &amp; trailers courtesy of IMDb, for personal non-commercial use · Forest photograph by Julian
            Steenbergen on Unsplash
          </span>
          <span className="hidden md:inline">Press ⌘K anywhere to search</span>
        </div>
      </Container>
    </footer>
  );
}
