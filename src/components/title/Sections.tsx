import Link from 'next/link';
import { toneFor } from '@/components/Nature';
import { Award, ExternalLink, MonitorPlay, Tv2, ShoppingBag, Ticket, Trophy, Clapperboard } from 'lucide-react';
import type { CastMember, PersonRef, QuoteLine, TitleDetail, WatchCategory } from '@/lib/types';
import { RatingRing } from '@/components/ui';
import { Rail } from '@/components/Rail';
import { compact, cx, date, img, money, nameHref, ratingColor, runtime } from '@/lib/format';

/* ------------------------------------------------------------------ */
/* Section heading used throughout the title page                     */
/* ------------------------------------------------------------------ */

export function Heading({ eyebrow, title, aside }: { eyebrow?: string; title: string; aside?: React.ReactNode }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4" style={{ '--tone': toneFor(title) } as React.CSSProperties}>
      <div>
        {eyebrow && <div className="eyebrow mb-2">{eyebrow}</div>}
        <h2 className="display text-[clamp(1.8rem,3vw,2.6rem)]">{title}</h2>
      </div>
      {aside}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Scores strip                                                        */
/* ------------------------------------------------------------------ */

export function Scores({ t }: { t: TitleDetail }) {
  const hasOscars = !!(t.oscars && (t.oscars.wins || t.oscars.nominations));
  if (t.rating == null && t.metascore == null && !hasOscars && !t.wins && !t.noms) return null;
  return (
    <div className="glass flex flex-wrap items-center gap-x-8 gap-y-5 rounded-3xl px-6 py-5">
      {t.rating != null && (
        <RatingRing value={t.rating} size={64} label="IMDb rating" sub={t.votes ? `${compact(t.votes)} votes` : undefined} />
      )}
      {t.metascore != null && (
        <div className="flex items-center gap-3">
          <div
            className="grid size-16 place-items-center rounded-2xl font-mono text-xl font-bold tabular text-night"
            style={{ background: ratingColor(t.metascore / 10) }}
          >
            {t.metascore}
          </div>
          <div className="leading-tight">
            <div className="text-sm font-medium">Metascore</div>
            <div className="text-xs text-faint">Critics, out of 100</div>
          </div>
        </div>
      )}
      {hasOscars && t.oscars && (
        <div className="flex items-center gap-3">
          <div className="grid size-16 place-items-center rounded-2xl bg-gold-soft text-gold ring-1 ring-gold/30">
            <Trophy size={26} />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-medium text-gold">
              {t.oscars.wins
                ? `Won ${t.oscars.wins} ${t.oscars.award?.text ?? 'Oscar'}${t.oscars.wins > 1 ? 's' : ''}`
                : `${t.oscars.nominations} ${t.oscars.award?.text ?? 'Oscar'} nomination${t.oscars.nominations > 1 ? 's' : ''}`}
            </div>
            {t.oscars.wins > 0 && t.oscars.nominations > 0 && (
              <div className="text-xs text-faint">
                {/* IMDb's `nominations` excludes wins */}
                of {t.oscars.wins + t.oscars.nominations} nominations
              </div>
            )}
          </div>
        </div>
      )}
      {(t.wins > 0 || t.noms > 0) && (
        <div className="flex items-center gap-3">
          <div className="grid size-16 place-items-center rounded-2xl bg-s3 text-muted">
            <Award size={24} />
          </div>
          <div className="leading-tight">
            <div className="font-mono text-lg font-semibold tabular">
              {t.wins} <span className="text-sm font-normal text-faint">wins</span>
            </div>
            <div className="text-xs text-faint">{t.noms} nominations overall</div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Where to watch                                                      */
/* ------------------------------------------------------------------ */

const CAT_META: Record<string, { label: string; icon: typeof Tv2 }> = {
  STREAMING: { label: 'Stream', icon: MonitorPlay },
  'RENT/BUY': { label: 'Rent or buy', icon: ShoppingBag },
  RENT: { label: 'Rent', icon: ShoppingBag },
  BUY: { label: 'Buy', icon: ShoppingBag },
  'FREE WITH ADS': { label: 'Free with ads', icon: Tv2 },
  FREE: { label: 'Free', icon: Tv2 },
  THEATERS: { label: 'In theaters', icon: Ticket },
};

export function WhereToWatch({ watch, id, title }: { watch: WatchCategory[]; id: string; title: string }) {
  const cats = watch.filter((c) => c.options.length);
  return (
    <section id="watch" className="scroll-mt-32">
      <Heading eyebrow="Legal streaming & rental" title="Where to watch" />
      {cats.length ? (
        <div className="space-y-6">
          {cats.map((c) => {
            const meta = CAT_META[c.category?.toUpperCase()] ?? { label: titleCase(c.category ?? 'Other'), icon: Tv2 };
            const Icon = meta.icon;
            return (
              <div key={c.category}>
                <div className="mb-3 flex items-center gap-2 text-sm text-muted">
                  <Icon size={15} className="text-accent" />
                  {meta.label}
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {c.options.map((o, i) => (
                    <a
                      key={`${o.name}-${i}`}
                      href={o.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group panel flex items-center gap-4 !rounded-2xl p-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:border-line-strong hover:bg-white/[0.04]"
                    >
                      <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10">
                        {o.logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={img(o.logo, 96)} alt="" className="size-full object-cover" />
                        ) : (
                          <Tv2 size={18} className="text-faint" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] font-medium">{o.name}</span>
                        <span className="block truncate text-xs text-faint">{o.desc || o.label || 'Open provider'}</span>
                      </span>
                      <ExternalLink size={15} className="shrink-0 text-faint transition-all group-hover:translate-x-0.5 group-hover:text-fg" />
                    </a>
                  ))}
                </div>
              </div>
            );
          })}
          <p className="text-xs text-faint">Availability is for your current region and can change. Provider data via IMDb.</p>
        </div>
      ) : (
        <div className="panel flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-s3 text-muted">
            <Clapperboard size={20} />
          </span>
          <div className="flex-1">
            <div className="font-medium">No streaming options in your region right now</div>
            <div className="mt-1 text-sm text-muted">
              “{title}” isn’t listed on any streaming or rental service here yet. Add it to your watchlist and check back later.
            </div>
          </div>
          <a
            href={`https://www.imdb.com/title/${id}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-fg"
          >
            View on IMDb <ExternalLink size={13} />
          </a>
        </div>
      )}
    </section>
  );
}

const titleCase = (s: string) => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

/* ------------------------------------------------------------------ */
/* Cast                                                                */
/* ------------------------------------------------------------------ */

export function CastRail({ cast, total, series }: { cast: CastMember[]; total?: number; series?: boolean }) {
  if (!cast.length) return null;
  return (
    <section id="cast" className="scroll-mt-32">
      <div className="mx-auto w-full max-w-[1680px] px-4 sm:px-8 lg:px-12">
        <Heading eyebrow={total ? `${total} credited` : 'Cast'} title="Top cast" />
      </div>
      <Rail gap="gap-4">
        {cast.map((c) => (
          <Link key={c.id + c.character} href={nameHref(c.id)} className="group w-[128px] shrink-0 snap-start sm:w-[144px]" prefetch={false}>
            <div className="sheen relative aspect-[3/4] overflow-hidden rounded-2xl bg-s2 ring-1 ring-white/5 transition-all duration-500 group-hover:-translate-y-1 group-hover:ring-white/20">
              {c.img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={img(c.img, 300, 400)}
                  alt={c.name}
                  loading="lazy"
                  className="absolute inset-0 size-full object-cover grayscale-[35%] transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0"
                />
              ) : (
                <span className="display absolute inset-0 grid place-items-center text-4xl text-faint">{initials(c.name)}</span>
              )}
              {series && c.episodes ? (
                <span className="absolute bottom-2 left-2 rounded-md bg-night/70 px-1.5 py-0.5 font-mono text-[10px] text-white/85 backdrop-blur">
                  {c.episodes} ep{c.episodes > 1 ? 's' : ''}
                </span>
              ) : null}
            </div>
            <div className="mt-2.5 px-0.5">
              <div className="truncate text-[13.5px] font-medium transition-colors group-hover:text-white">{c.name}</div>
              {c.character && <div className="line-clamp-2 text-xs text-faint">{c.character}</div>}
            </div>
          </Link>
        ))}
      </Rail>
    </section>
  );
}

export const initials = (n?: string) =>
  (n ?? '?')
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();

/* ------------------------------------------------------------------ */
/* Crew                                                                */
/* ------------------------------------------------------------------ */

export function Crew({ t }: { t: TitleDetail }) {
  const groups: [string, PersonRef[]][] = (
    [
      [t.creators.length > 1 ? 'Creators' : 'Creator', t.creators],
      [t.directors.length > 1 ? 'Directors' : 'Director', t.directors],
      [t.writers.length > 1 ? 'Writers' : 'Writer', t.writers],
      ['Music', t.composers],
      ['Cinematography', t.dops],
    ] as [string, PersonRef[]][]
  ).filter(([, p]) => p.length);
  if (!groups.length) return null;
  return (
    <div className="panel p-5">
      <div className="eyebrow mb-4 text-sky">Behind the camera</div>
      <dl className="space-y-4">
        {groups.map(([label, people]) => (
          <div key={label}>
            <dt className="mb-2 text-xs text-faint">{label}</dt>
            <dd className="flex flex-col gap-2">
              {people.map((p) => (
                <Link key={p.id} href={nameHref(p.id)} className="group flex items-center gap-3" prefetch={false}>
                  <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-s3 text-[11px] text-faint ring-1 ring-white/10">
                    {p.img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img(p.img, 72, 72)} alt="" className="size-full object-cover" loading="lazy" />
                    ) : (
                      initials(p.name)
                    )}
                  </span>
                  <span className="text-sm transition-colors group-hover:text-accent">{p.name}</span>
                </Link>
              ))}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Facts sidebar                                                       */
/* ------------------------------------------------------------------ */

export function Facts({ t }: { t: TitleDetail }) {
  const rows: [string, React.ReactNode][] = [];
  const rd = date(t.releaseDate, true);
  if (rd) rows.push(['Released', <span key="released">{rd}{t.releaseDate?.country?.text && <span className="text-faint"> · {t.releaseDate.country.text}</span>}</span>]);
  if (t.originalTitle && t.originalTitle !== t.title) rows.push(['Original title', <span key="orig" className="italic">{t.originalTitle}</span>]);
  if (t.runtime) rows.push([t.series ? 'Episode runtime' : 'Runtime', runtime(t.runtime)]);
  if (t.cert) rows.push(['Certificate', t.cert]);
  if (t.series && t.seasons.length) rows.push(['Seasons', `${t.seasons.length} · ${t.episodeTotal} episodes`]);
  if (t.countries.length) rows.push([t.countries.length > 1 ? 'Countries' : 'Country', t.countries.join(', ')]);
  if (t.languages.length) rows.push([t.languages.length > 1 ? 'Languages' : 'Language', t.languages.join(', ')]);
  if (t.budget) rows.push(['Budget', money(t.budget.amount, t.budget.currency)]);
  if (t.gross) rows.push(['Worldwide gross', money(t.gross)]);
  if (t.locations.length)
    rows.push([
      'Filmed in',
      <ul key="locations" className="space-y-1">
        {t.locations.map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ul>,
    ]);
  if (!rows.length) return null;
  return (
    <div className="panel p-5">
      <div className="eyebrow mb-4 text-gold">The facts</div>
      <dl className="divide-y divide-line">
        {rows.map(([k, v]) => (
          <div key={k} className="grid grid-cols-[110px_1fr] gap-3 py-2.5 text-sm first:pt-0 last:pb-0">
            <dt className="text-faint">{k}</dt>
            <dd className="text-fg/90">{v}</dd>
          </div>
        ))}
      </dl>
      <a
        href={`https://www.imdb.com/title/${t.id}/`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-5 inline-flex items-center gap-1.5 text-xs text-faint transition-colors hover:text-fg"
      >
        Full page on IMDb <ExternalLink size={12} />
      </a>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Keywords                                                            */
/* ------------------------------------------------------------------ */

export function Keywords({ keywords }: { keywords: string[] }) {
  if (!keywords.length) return null;
  return (
    <div className="panel p-5">
      <div className="eyebrow mb-4 text-bloom">Keywords</div>
      <div className="flex flex-wrap gap-2">
        {keywords.map((k) => (
          <Link
            key={k}
            href={`/discover?keyword=${encodeURIComponent(k.toLowerCase().trim().replace(/\s+/g, '-'))}`}
            className="rounded-full border border-line px-3 py-1 text-[12.5px] text-muted transition-all hover:border-accent/60 hover:text-fg"
            prefetch={false}
          >
            {k}
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Quotes — set like a screenplay                                      */
/* ------------------------------------------------------------------ */

export function Quotes({ quotes }: { quotes: QuoteLine[][] }) {
  const qs = quotes.filter((q) => q.some((l) => l.text || l.stageDirection)).slice(0, 3);
  if (!qs.length) return null;
  return (
    <div className="panel relative overflow-hidden p-6 sm:p-8">
      <div className="eyebrow mb-6 text-lavender">Memorable lines</div>
      <div className="space-y-8">
        {qs.map((lines, i) => (
          <div key={i} className={cx('font-mono text-[13.5px] leading-relaxed', i > 0 && 'border-t border-dashed border-line pt-8')}>
            {lines.map((l, j) => {
              const who = l.characters?.map((c) => c.character).filter(Boolean).join(' & ');
              return (
                <div key={j} className="mb-4 last:mb-0">
                  {who && <div className="mx-auto w-fit text-center text-[12px] font-semibold uppercase tracking-[0.18em] text-fg/90">{who}</div>}
                  {l.stageDirection && <div className="mx-auto max-w-md text-center italic text-faint">({l.stageDirection})</div>}
                  {l.text && <p className="mx-auto max-w-md text-center text-muted">{l.text}</p>}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
