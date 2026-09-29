import type { DiscoverFilters, SortBy } from '@/lib/types';
import { MOOD_BY_SLUG } from './moods';

/** URL-level filter state for /discover. Mirrors the query string 1:1. */
export type DiscoverState = {
  mood?: string;
  genres: string[];
  keywords: string[];
  types: string[];
  from?: number;
  to?: number;
  rating?: number;
  votes?: number;
  runtime?: number; // max runtime (minutes)
  sort?: SortBy;
  order?: 'ASC' | 'DESC';
};

export const EMPTY: DiscoverState = { genres: [], keywords: [], types: [] };

export const TYPES = [
  { id: 'movie', label: 'Movies' },
  { id: 'tvSeries', label: 'Series' },
  { id: 'tvMiniSeries', label: 'Mini-series' },
  { id: 'short', label: 'Shorts' },
];

export const SORTS: { id: SortBy; label: string }[] = [
  { id: 'POPULARITY', label: 'Popularity' },
  { id: 'USER_RATING', label: 'Rating' },
  { id: 'USER_RATING_COUNT', label: 'Most voted' },
  { id: 'RELEASE_DATE', label: 'Newest' },
  { id: 'BOX_OFFICE_GROSS_DOMESTIC', label: 'Box office' },
  { id: 'METACRITIC_SCORE', label: 'Metascore' },
  { id: 'TITLE_REGIONAL', label: 'A–Z' },
];

export const VOTES = [
  { v: 0, label: 'Any' },
  { v: 1000, label: '1k+' },
  { v: 10000, label: '10k+' },
  { v: 50000, label: '50k+' },
  { v: 100000, label: '100k+' },
  { v: 500000, label: '500k+' },
];

export const RUNTIMES = [
  { v: 0, label: 'Any' },
  { v: 90, label: '≤ 90m' },
  { v: 120, label: '≤ 2h' },
  { v: 150, label: '≤ 2½h' },
  { v: 180, label: '≤ 3h' },
];

export const MIN_YEAR = 1900;
export const MAX_YEAR = new Date().getFullYear() + 1;

export const DECADES = [1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020];

const SORT_IDS = new Set(SORTS.map((s) => s.id));
const list = (v: string | null) => (v ? v.split(',').map((x) => x.trim()).filter(Boolean) : []);
const num = (v: string | null) => {
  if (v == null || v === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

export function parse(sp: URLSearchParams): DiscoverState {
  const sort = sp.get('sort') as SortBy | null;
  const order = sp.get('order');
  return {
    mood: sp.get('mood') && MOOD_BY_SLUG[sp.get('mood')!] ? sp.get('mood')! : undefined,
    genres: list(sp.get('genre')),
    keywords: list(sp.get('keyword')),
    types: list(sp.get('type')),
    from: num(sp.get('from')),
    to: num(sp.get('to')),
    rating: num(sp.get('rating')),
    votes: num(sp.get('votes')),
    runtime: num(sp.get('runtime')),
    sort: sort && SORT_IDS.has(sort) ? sort : undefined,
    order: order === 'ASC' || order === 'DESC' ? order : undefined,
  };
}

export function serialize(s: DiscoverState): string {
  const p = new URLSearchParams();
  if (s.mood) p.set('mood', s.mood);
  if (s.genres.length) p.set('genre', s.genres.join(','));
  if (s.keywords.length) p.set('keyword', s.keywords.join(','));
  if (s.types.length) p.set('type', s.types.join(','));
  if (s.from) p.set('from', String(s.from));
  if (s.to) p.set('to', String(s.to));
  if (s.rating) p.set('rating', String(s.rating));
  if (s.votes) p.set('votes', String(s.votes));
  if (s.runtime) p.set('runtime', String(s.runtime));
  if (s.sort) p.set('sort', s.sort);
  if (s.order) p.set('order', s.order);
  return p.toString();
}

const union = (a: string[] = [], b: string[] = []) => [...new Set([...a, ...b])];

/** Merge the mood preset with explicit filters into IMDb search constraints. */
export function toFilters(s: DiscoverState): DiscoverFilters {
  const m = s.mood ? MOOD_BY_SLUG[s.mood]?.filters ?? {} : {};
  const f: DiscoverFilters = {
    ...m,
    genres: union(m.genres, s.genres),
    keywords: union(m.keywords, s.keywords),
    types: s.types.length ? s.types : m.types,
    from: s.from ?? m.from,
    to: s.to ?? m.to,
    minRating: s.rating ?? m.minRating,
    minVotes: s.votes ?? m.minVotes,
    maxRuntime: s.runtime ?? m.maxRuntime,
    sort: s.sort ?? m.sort,
    order: s.order ?? m.order,
  };
  // Rating-style sorts drown in 10/10 titles with five votes — add a sensible floor.
  if ((f.sort === 'USER_RATING' || f.sort === 'METACRITIC_SCORE') && !f.minVotes) f.minVotes = 25000;
  for (const k of Object.keys(f) as (keyof DiscoverFilters)[]) {
    const v = f[k];
    if (v == null || (Array.isArray(v) && !v.length)) delete f[k];
  }
  return f;
}

export const isEmpty = (s: DiscoverState) => serialize({ ...s, sort: undefined, order: undefined }) === '';
