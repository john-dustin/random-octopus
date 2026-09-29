import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Award, Cake, MapPin, Ruler, Star, Trophy, Clapperboard, Flower2 } from 'lucide-react';
import { getPerson } from '@/lib/imdb';
import type { Card } from '@/lib/types';
import { age, compact, date, img, ratingColor, titleHref } from '@/lib/format';
import { Ambient } from '@/components/Ambient';
import { PosterCard } from '@/components/PosterCard';
import { Rail } from '@/components/Rail';
import { Container, SectionHeader, Tag } from '@/components/ui';
import { Bio } from '@/components/person/Bio';
import { CareerChart } from '@/components/person/CareerChart';
import { Filmography } from '@/components/person/Filmography';
import { PhotoStrip } from '@/components/person/PhotoStrip';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const p = await getPerson(id).catch(() => null);
  if (!p) return { title: 'Person not found' };
  return {
    title: p.name,
    description: p.bio?.slice(0, 160) ?? `${p.name} — filmography, career chart and more.`,
    openGraph: p.img ? { images: [img(p.img, 800)!] } : undefined,
  };
}

// Feature-ish credits only: skip shorts, podcasts, video games, music videos, etc.
const MAIN_TYPES = new Set(['movie', 'tvSeries', 'tvMiniSeries', 'tvMovie', 'tvSpecial']);

export default async function PersonPage({ params }: Props) {
  const { id } = await params;
  if (!/^nm\d+$/.test(id)) notFound();
  const p = await getPerson(id);
  if (!p?.name) notFound();

  // Unique credits across every department.
  const all = new Map<string, Card>();
  for (const list of Object.values(p.credits)) for (const c of list) if (!all.has(c.id)) all.set(c.id, c);
  const unique = [...all.values()];
  const rated = unique.filter((c) => c.rating != null && (c.votes ?? 0) >= 50);
  const avg = rated.length ? rated.reduce((s, c) => s + c.rating!, 0) / rated.length : undefined;
  const best = unique
    .filter((c) => c.rating != null && (c.votes ?? 0) >= 5000 && MAIN_TYPES.has(c.type ?? ''))
    .sort((a, b) => b.rating! - a.rating!)[0];
  // Ignore archive-footage credits dated before they were born.
  const released = unique.filter((c) => c.year && c.year <= new Date().getFullYear() && (!p.born?.year || c.year >= p.born.year));
  const firstYear = released.length ? Math.min(...released.map((c) => c.year!)) : undefined;

  const ageNow = age(p.born, p.died);
  const lead = p.images.find((i) => i.width > i.height * 1.3);

  const stats: { label: string; value: string; sub?: string; icon: typeof Star; href?: string; color?: string }[] = [
    { label: 'Credits', value: String(unique.length), sub: firstYear ? `since ${firstYear}` : undefined, icon: Clapperboard },
    { label: 'Avg. IMDb rating', value: avg ? avg.toFixed(2) : '–', sub: rated.length ? `across ${rated.length} rated titles` : undefined, icon: Star, color: avg ? ratingColor(avg) : undefined },
    ...(best ? [{ label: 'Highest rated', value: best.rating!.toFixed(1), sub: best.title, icon: Trophy, href: titleHref(best.id), color: ratingColor(best.rating) }] : []),
    {
      label: p.oscars?.award?.text ? `${p.oscars.award.text}s` : 'Oscars',
      value: p.oscars ? `${p.oscars.wins}` : '0',
      // IMDb's `nominations` excludes the wins
      sub: p.oscars ? `${p.oscars.wins + p.oscars.nominations} nomination${p.oscars.wins + p.oscars.nominations === 1 ? '' : 's'}` : 'no nominations',
      icon: Award,
      color: p.oscars?.wins ? 'var(--gold)' : undefined,
    },
    { label: 'Award wins', value: compact(p.wins) ?? '0', sub: `${compact(p.noms) ?? 0} nominations`, icon: Flower2 },
  ];

  return (
    <div className="relative">
      <Ambient image={p.img} intensity={0.28} />

      {/* ---------- Header ---------- */}
      <section className="relative overflow-hidden pt-16">
        {lead && (
          <div aria-hidden className="absolute inset-0 -z-10 [mask-image:linear-gradient(to_bottom,#000_60%,transparent)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img(lead.url, 1600)} alt="" className="size-full animate-kenburns object-cover opacity-[0.22] blur-[2px]" />
            <div className="absolute inset-0 bg-gradient-to-b from-bg/40 via-bg/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/60 to-transparent" />
          </div>
        )}
        <Container className="grid items-end gap-8 pb-10 pt-10 sm:pt-16 md:grid-cols-[minmax(220px,340px)_1fr] md:gap-14">
          <div className="animate-fade-up relative mx-auto w-[min(72vw,300px)] md:mx-0 md:w-full">
            <div className="absolute -inset-6 -z-10 rounded-[40px] bg-accent/25 blur-3xl" />
            <div className="sheen relative aspect-[3/4] overflow-hidden rounded-[28px] bg-s2 ring-1 ring-white/10 shadow-[0_40px_80px_-24px_rgb(0_0_0/0.9)]">
              {p.img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={img(p.img, 680, 906)} alt={p.name} className="size-full object-cover" />
              ) : (
                <div className="grid size-full place-items-center display text-7xl text-faint">{p.name.split(' ').map((w) => w[0]).join('')}</div>
              )}
            </div>
          </div>

          <div className="animate-fade-up min-w-0 [animation-delay:120ms]">
            <div className="eyebrow mb-4 flex flex-wrap gap-x-3 gap-y-1 text-leaf">
              {p.professions.slice(0, 4).map((pr, i) => (
                <span key={pr} className="flex items-center gap-3">
                  {i > 0 && <span className="text-faint/50">•</span>}
                  {pr}
                </span>
              ))}
            </div>
            <h1 className="display text-[clamp(3.2rem,9vw,8.5rem)] leading-[0.86] tracking-[-0.035em]">{p.name}</h1>

            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted">
              {p.born?.year && (
                <span className="flex items-center gap-2">
                  <Cake size={15} className="text-accent" />
                  Born {date(p.born, true)}
                  {!p.died && ageNow != null && <span className="text-faint">· age {ageNow}</span>}
                </span>
              )}
              {p.died?.year && (
                <span className="flex items-center gap-2">
                  <span className="text-accent">✝</span>
                  Died {date(p.died, true)}
                  {ageNow != null && <span className="text-faint">· aged {ageNow}</span>}
                </span>
              )}
              {p.birthplace && (
                <span className="flex items-center gap-2">
                  <MapPin size={15} className="text-accent" />
                  {p.birthplace}
                </span>
              )}
              {p.height && (
                <span className="flex items-center gap-2">
                  <Ruler size={15} className="text-accent" />
                  {p.height}
                </span>
              )}
            </div>

            {p.bio && <Bio text={p.bio} />}

            {p.knownFor[0] && (
              <div className="mt-6 flex flex-wrap items-center gap-2 text-xs text-faint">
                Best known for
                {p.knownFor.slice(0, 3).map((k) => (
                  <Link key={k.id} href={titleHref(k.id)}>
                    <Tag className="hover:border-fg/40 hover:text-fg transition-colors">{k.title}</Tag>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </Container>

        {/* stat tiles */}
        <Container>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {stats.map((s, i) => {
              const Icon = s.icon;
              const inner = (
                <div
                  className="panel animate-fade-up group relative h-full overflow-hidden p-5 transition-colors hover:border-line-strong"
                  style={{ animationDelay: `${200 + i * 70}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <span className="eyebrow">{s.label}</span>
                    <Icon size={15} className="text-faint transition-colors group-hover:text-accent" />
                  </div>
                  <div className="display mt-3 text-5xl tabular" style={s.color ? { color: s.color } : undefined}>
                    {s.value}
                  </div>
                  {s.sub && <div className="mt-1.5 truncate text-xs text-muted">{s.sub}</div>}
                </div>
              );
              return s.href ? (
                <Link key={s.label} href={s.href} className={i === stats.length - 1 && stats.length % 2 ? 'col-span-2 sm:col-span-1' : ''}>
                  {inner}
                </Link>
              ) : (
                <div key={s.label} className={i === stats.length - 1 && stats.length % 2 ? 'col-span-2 sm:col-span-1' : ''}>
                  {inner}
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* ---------- Known for ---------- */}
      {p.knownFor.length > 0 && (
        <section className="mt-20">
          <Container>
            <SectionHeader eyebrow="The essentials" title={<>Known <em>for</em></>} />
          </Container>
          <Rail>
            {p.knownFor.map((c) => (
              <PosterCard key={c.id} card={c} size="lg" />
            ))}
          </Rail>
        </section>
      )}

      {/* ---------- Career chart ---------- */}
      <section className="mt-16">
        <Container>
          <CareerChart credits={p.credits} name={p.name} bornYear={p.born?.year} />
        </Container>
      </section>

      {/* ---------- Filmography ---------- */}
      <section className="mt-20">
        <Container>
          <Filmography credits={p.credits} />
        </Container>
      </section>

      {/* ---------- Photos ---------- */}
      {p.images.length > 1 && (
        <section className="mt-20">
          <Container>
            <SectionHeader eyebrow={`${p.images.length} stills & portraits`} title="Photos" />
          </Container>
          <PhotoStrip images={p.images} name={p.name} />
        </section>
      )}

      {/* ---------- Trivia & quotes ---------- */}
      {(p.trivia.length > 0 || p.quotes.length > 0) && (
        <section className="mt-20">
          <Container className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
            {p.trivia.length > 0 && (
              <div>
                <SectionHeader eyebrow="Did you know" title="Trivia" />
                <ol className="space-y-3">
                  {p.trivia.map((t, i) => (
                    <li key={i} className="panel flex gap-5 p-5">
                      <span className="display text-3xl leading-none text-accent/80 tabular">{String(i + 1).padStart(2, '0')}</span>
                      <p className="text-[15px] leading-relaxed text-fg/85">{t}</p>
                    </li>
                  ))}
                </ol>
              </div>
            )}
            {p.quotes.length > 0 && (
              <div>
                <SectionHeader eyebrow="In their words" title="Quotes" />
                <div className="space-y-4">
                  {p.quotes.map((q, i) => (
                    <figure key={i} className="relative overflow-hidden rounded-[20px] border border-line bg-gradient-to-br from-accent/[0.08] to-transparent p-6">
                      <span aria-hidden className="display absolute -left-1 -top-6 text-[120px] leading-none text-accent/20">“</span>
                      <blockquote className="display relative text-[1.45rem] leading-snug text-fg/90">{q}</blockquote>
                      <figcaption className="mt-3 text-xs text-faint">— {p.name}</figcaption>
                    </figure>
                  ))}
                </div>
              </div>
            )}
          </Container>
        </section>
      )}
    </div>
  );
}
