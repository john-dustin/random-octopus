// Shared data shapes — safe to import from both server and client code.

export type Card = {
  id: string;
  title: string;
  year?: number;
  endYear?: number;
  rating?: number;
  votes?: number;
  poster?: string;
  posterW?: number;
  posterH?: number;
  type?: string;
  typeText?: string;
  series?: boolean;
  runtime?: number; // seconds
  genres: string[];
  cert?: string;
  plot?: string;
  rank?: number;
  release?: { day?: number; month?: number; year?: number };
  character?: string;
};

export type Img = { url: string; width: number; height: number; caption?: string };

export type Video = {
  id: string;
  name?: string;
  hi: string; // best mp4
  lo: string; // light mp4 for ambient hero playback
  thumb?: string;
  runtime?: number;
  kind?: string;
};

export type PersonRef = { id: string; name: string; img?: string };

export type CastMember = PersonRef & { character: string; episodes?: number };

export type WatchCategory = {
  category: string;
  options: { name: string; logo?: string; link?: string; label?: string; desc?: string }[];
};

export type Review = {
  summary?: string;
  text?: string;
  rating?: number;
  author?: string;
  date?: string;
  up?: number;
  down?: number;
};

export type QuoteLine = { characters?: { character: string }[]; text?: string | null; stageDirection?: string | null };

export type TitleDetail = Card & {
  originalTitle?: string;
  releaseDate?: { day?: number; month?: number; year?: number; country?: { text: string } };
  tagline?: string;
  metascore?: number;
  budget?: { amount: number; currency: string };
  gross?: number;
  domestic?: number;
  opening?: number;
  keywords: string[];
  trivia: string[];
  goofs: string[];
  quotes: QuoteLine[][];
  oscars?: { wins: number; nominations: number; award?: { text: string } } | null;
  wins: number;
  noms: number;
  watch: WatchCategory[];
  reviews: Review[];
  countries: string[];
  languages: string[];
  locations: string[];
  images: Img[];
  imageTotal: number;
  stills: Img[];
  videos: Video[];
  directors: PersonRef[];
  writers: PersonRef[];
  composers: PersonRef[];
  dops: PersonRef[];
  creators: PersonRef[];
  cast: CastMember[];
  castTotal?: number;
  similar: Card[];
  parent: { id: string; title: string; season?: number; episode?: number } | null;
  seasons: number[];
  episodeTotal: number;
};

export type Episode = {
  id: string;
  title: string;
  n?: string;
  rating?: number;
  votes?: number;
  plot?: string;
  img?: string;
  date?: { year?: number; month?: number; day?: number };
  runtime?: number;
};

export type SeasonGrid = { season: number; episodes: Episode[] }[];

export type Person = {
  id: string;
  name: string;
  bio?: string;
  born?: { year?: number; month?: number; day?: number };
  died?: { year?: number; month?: number; day?: number };
  birthplace?: string;
  height?: string;
  img?: string;
  images: Img[];
  professions: string[];
  knownFor: Card[];
  oscars?: { wins: number; nominations: number; award?: { text: string } } | null;
  wins: number;
  noms: number;
  trivia: string[];
  quotes: string[];
  credits: Record<'Acting' | 'Directing' | 'Writing' | 'Producing', Card[]>;
};

export type HeroExtra = {
  id: string;
  tagline?: string;
  stills: Img[];
  trailer: Video | null;
  director?: string;
};

export type DiscoverFilters = {
  types?: string[];
  genres?: string[];
  keywords?: string[];
  minRating?: number;
  minVotes?: number;
  maxVotes?: number;
  from?: number;
  to?: number;
  minRuntime?: number;
  maxRuntime?: number;
  sort?: SortBy;
  order?: 'ASC' | 'DESC';
};

export type SortBy =
  | 'POPULARITY'
  | 'USER_RATING'
  | 'USER_RATING_COUNT'
  | 'RELEASE_DATE'
  | 'BOX_OFFICE_GROSS_DOMESTIC'
  | 'RUNTIME'
  | 'METACRITIC_SCORE'
  | 'TITLE_REGIONAL';

export type DiscoverPage = { total: number; cursor: string | null; items: Card[] };

export type SearchResult = {
  titles: Card[];
  names: { id: string; name: string; img?: string; role?: string; known?: string }[];
};

export type Suggestion = {
  id: string;
  label: string;
  sub?: string;
  year?: number;
  img?: string;
  kind: 'title' | 'name';
  qid?: string;
};

export const GENRES = [
  'Action', 'Adventure', 'Animation', 'Biography', 'Comedy', 'Crime', 'Documentary', 'Drama',
  'Family', 'Fantasy', 'Film-Noir', 'History', 'Horror', 'Music', 'Musical', 'Mystery',
  'Romance', 'Sci-Fi', 'Sport', 'Thriller', 'War', 'Western',
] as const;

export const CHARTS = {
  'top-movies': { type: 'TOP_RATED_MOVIES', label: 'Top 250 Movies', blurb: 'The canon, as voted by millions.' },
  'top-tv': { type: 'TOP_RATED_TV_SHOWS', label: 'Top 250 Series', blurb: 'The greatest television ever made.' },
  'popular-movies': { type: 'MOST_POPULAR_MOVIES', label: 'Most Popular Movies', blurb: 'What the world is watching right now.' },
  'popular-tv': { type: 'MOST_POPULAR_TV_SHOWS', label: 'Most Popular Series', blurb: 'The shows everyone is talking about.' },
  'hall-of-shame': { type: 'LOWEST_RATED_MOVIES', label: 'Hall of Shame', blurb: 'So bad they became legend. Proceed with caution.' },
} as const;

export type ChartSlug = keyof typeof CHARTS;
