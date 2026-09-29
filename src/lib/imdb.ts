import 'server-only';
import { cache } from 'react';
import type {
  Card, DiscoverFilters, DiscoverPage, Episode, HeroExtra, Img, Person, PersonRef,
  SearchResult, SeasonGrid, Suggestion, TitleDetail, Video,
} from './types';

/*
 * IMDb data access. Runs on the server only: IMDb's GraphQL endpoint rejects
 * browser origins other than imdb.com, so every request is made from here.
 * Personal, non-commercial use — see IMDb's data usage terms.
 */

const GQL_URL = 'https://api.graphql.imdb.com/';
const SUGGEST_URL = 'https://v3.sg.media-imdb.com/suggestion/x/';
const TTL = 1000 * 60 * 30; // trailer URLs are signed; don't hold them too long
const MAX_ENTRIES = 1500;

const HEADERS = {
  'content-type': 'application/json',
  accept: 'application/json',
  'accept-language': 'en-US,en;q=0.9',
  'x-imdb-client-name': 'imdb-web-next',
  origin: 'https://www.imdb.com',
  referer: 'https://www.imdb.com/',
  'user-agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
};

// Process-wide response cache (survives across requests; React `cache` only dedupes within one).
const g = globalThis as unknown as { __imdbCache?: Map<string, { at: number; p: Promise<unknown> }> };
const store = (g.__imdbCache ??= new Map());

function remember<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = store.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.p as Promise<T>;
  if (store.size > MAX_ENTRIES) {
    const oldest = [...store.entries()].sort((a, b) => a[1].at - b[1].at).slice(0, MAX_ENTRIES / 4);
    for (const [k] of oldest) store.delete(k);
  }
  const p = load().catch((e) => {
    store.delete(key);
    throw e;
  });
  store.set(key, { at: Date.now(), p });
  return p;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any;

export async function gql<T = Json>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const body = JSON.stringify({ query, variables });
  return remember(body, async () => {
    let lastErr: unknown;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const r = await fetch(GQL_URL, { method: 'POST', headers: HEADERS, body, cache: 'no-store' });
        if (!r.ok) throw new Error(`IMDb responded ${r.status}`);
        const j = await r.json();
        if (j.errors?.length && !j.data) throw new Error(j.errors[0].message);
        return j.data as T;
      } catch (e) {
        lastErr = e;
        await new Promise((res) => setTimeout(res, 250 * (attempt + 1)));
      }
    }
    throw lastErr;
  });
}

/* ------------------------------------------------------------------ */
/* Fragments & normalisers                                             */
/* ------------------------------------------------------------------ */

const CARD = `
  id
  titleText { text }
  releaseYear { year endYear }
  ratingsSummary { aggregateRating voteCount }
  primaryImage { url width height }
  titleType { id text canHaveEpisodes }
  runtime { seconds }
  genres { genres { text } }
  certificate { rating }
`;
const CARD_PLOT = CARD + ' plot { plotText { plainText } } ';

export function normCard(t: Json): Card {
  return {
    id: t.id,
    title: t.titleText?.text ?? 'Untitled',
    year: t.releaseYear?.year ?? undefined,
    endYear: t.releaseYear?.endYear ?? undefined,
    rating: t.ratingsSummary?.aggregateRating ?? undefined,
    votes: t.ratingsSummary?.voteCount ?? undefined,
    poster: t.primaryImage?.url ?? undefined,
    posterW: t.primaryImage?.width ?? undefined,
    posterH: t.primaryImage?.height ?? undefined,
    type: t.titleType?.id ?? undefined,
    typeText: t.titleType?.text ?? undefined,
    series: !!t.titleType?.canHaveEpisodes,
    runtime: t.runtime?.seconds ?? undefined,
    genres: (t.genres?.genres || []).map((x: Json) => x.text),
    cert: t.certificate?.rating ?? undefined,
    plot: t.plot?.plotText?.plainText ?? undefined,
  };
}

const edges = (c: Json): Json[] => c?.edges || [];

export function pickMp4(video: Json): Video | null {
  if (!video) return null;
  const rank: Record<string, number> = { DEF_1080p: 5, DEF_720p: 4, DEF_480p: 3, DEF_SD: 2 };
  const mp4 = (video.playbackURLs || [])
    .filter((u: Json) => u.mimeType === 'video/mp4')
    .sort((a: Json, b: Json) => (rank[b.videoDefinition] || 0) - (rank[a.videoDefinition] || 0));
  if (!mp4.length) return null;
  const lo = [...mp4].reverse().find((u: Json) => (rank[u.videoDefinition] || 0) >= 3) || mp4[mp4.length - 1];
  return { id: video.id, name: video.name?.value, hi: mp4[0].url, lo: lo.url };
}

const names = (c: Json): PersonRef[] =>
  edges(c).map((e) => ({ id: e.node.name.id, name: e.node.name.nameText?.text, img: e.node.name.primaryImage?.url }));

/* ------------------------------------------------------------------ */
/* Home                                                                */
/* ------------------------------------------------------------------ */

export const getHome = cache(async () => {
  const today = new Date().toISOString().slice(0, 10);
  const d = await gql(
    `query Home($today: Date!) {
      popular: chartTitles(first: 40, chart: { chartType: MOST_POPULAR_MOVIES }) { edges { currentRank node { ${CARD_PLOT} } } }
      tv: chartTitles(first: 30, chart: { chartType: MOST_POPULAR_TV_SHOWS }) { edges { currentRank node { ${CARD_PLOT} } } }
      top: chartTitles(first: 30, chart: { chartType: TOP_RATED_MOVIES }) { edges { currentRank node { ${CARD} } } }
      soon: comingSoon(first: 30, comingSoonType: MOVIE, releasingOnOrAfter: $today) { edges { node { ${CARD_PLOT} releaseDate { day month year } } } }
    }`,
    { today }
  );
  const ranked = (c: Json): Card[] => edges(c).map((e) => ({ ...normCard(e.node), rank: e.currentRank }));
  return {
    popular: ranked(d.popular),
    tv: ranked(d.tv),
    top: ranked(d.top),
    soon: (edges(d.soon).map((e) => ({ ...normCard(e.node), release: e.node.releaseDate })) as Card[]).sort(
      (a, b) => relKey(a) - relKey(b)
    ),
  };
});

const relKey = (c: Card) => (c.release?.year ?? 9999) * 10000 + (c.release?.month ?? 12) * 100 + (c.release?.day ?? 31);

export const getHeroExtras = cache(async (ids: string[]): Promise<HeroExtra[]> => {
  const parts = ids.map(
    (id, i) => `t${i}: title(id: "${id}") {
      id
      taglines(first: 1) { edges { node { text } } }
      images(first: 8, filter: { types: ["still_frame"] }) { edges { node { url width height } } }
      primaryVideos(first: 1) { edges { node { id name { value } playbackURLs { url mimeType videoDefinition } } } }
      directors: credits(first: 1, filter: { categories: ["director"] }) { edges { node { name { nameText { text } } } } }
    }`
  );
  const d = await gql(`query Hero { ${parts.join('\n')} }`);
  return ids.map((id, i) => {
    const t = d[`t${i}`] || {};
    return {
      id,
      tagline: t.taglines?.edges?.[0]?.node?.text,
      stills: edges(t.images).map((e) => e.node).filter((n: Img) => n.width > n.height * 1.3),
      trailer: pickMp4(t.primaryVideos?.edges?.[0]?.node),
      director: t.directors?.edges?.[0]?.node?.name?.nameText?.text,
    };
  });
});

/* ------------------------------------------------------------------ */
/* Charts                                                              */
/* ------------------------------------------------------------------ */

export const getChart = cache(async (chartType: string, first = 250): Promise<Card[]> => {
  const d = await gql(
    `query Chart($first: Int!) { chartTitles(first: $first, chart: { chartType: ${chartType} }) { edges { currentRank node { ${CARD_PLOT} } } } }`,
    { first }
  );
  return edges(d.chartTitles).map((e) => ({ ...normCard(e.node), rank: e.currentRank }));
});

/* ------------------------------------------------------------------ */
/* Title                                                               */
/* ------------------------------------------------------------------ */

export const getTitle = cache(async (id: string): Promise<TitleDetail | null> => {
  const d = await gql(
    `query Title($id: ID!) {
      title(id: $id) {
        ${CARD_PLOT}
        originalTitleText { text }
        releaseDate { day month year country { text } }
        taglines(first: 1) { edges { node { text } } }
        metacritic { metascore { score } }
        productionBudget { budget { amount currency } }
        lifetimeGross(boxOfficeArea: WORLDWIDE) { total { amount } }
        domestic: lifetimeGross(boxOfficeArea: DOMESTIC) { total { amount } }
        openingWeekendGross(boxOfficeArea: DOMESTIC) { gross { total { amount } } }
        keywords(first: 16) { edges { node { text } } }
        trivia(first: 8) { edges { node { text { plainText } } } }
        goofs(first: 4) { edges { node { text { plainText } } } }
        quotes(first: 5) { edges { node { lines { characters { character } text stageDirection } } } }
        prestigiousAwardSummary { wins nominations award { text } }
        wins: awardNominations(first: 1, filter: { wins: WINS_ONLY }) { total }
        noms: awardNominations(first: 1) { total }
        watchOptionsByCategory {
          categorizedWatchOptionsList {
            categoryName { value }
            watchOptions { provider { name { value } logos { icon { url } } } link(platform: WEB) title { value } shortDescription { value } }
          }
        }
        featuredReviews(first: 5) {
          edges { node { summary { originalText } text { originalText { plainText } } authorRating author { nickName } submissionDate helpfulness { upVotes downVotes } } }
        }
        countriesOfOrigin { countries { text } }
        spokenLanguages { spokenLanguages { text } }
        filmingLocations(first: 5) { edges { node { text } } }
        images(first: 30) { total edges { node { url width height caption { plainText } } } }
        stills: images(first: 10, filter: { types: ["still_frame"] }) { edges { node { url width height } } }
        primaryVideos(first: 10) {
          edges { node { id name { value } runtime { value } contentType { displayName { value } } thumbnail { url } playbackURLs { url mimeType videoDefinition } } }
        }
        directors: credits(first: 4, filter: { categories: ["director"] }) { edges { node { name { id nameText { text } primaryImage { url } } } } }
        writers: credits(first: 4, filter: { categories: ["writer"] }) { edges { node { name { id nameText { text } primaryImage { url } } } } }
        composer: credits(first: 2, filter: { categories: ["composer"] }) { edges { node { name { id nameText { text } primaryImage { url } } } } }
        dop: credits(first: 2, filter: { categories: ["cinematographer"] }) { edges { node { name { id nameText { text } primaryImage { url } } } } }
        creators: credits(first: 3, filter: { categories: ["creator"] }) { edges { node { name { id nameText { text } primaryImage { url } } } } }
        cast: credits(first: 36, filter: { categories: ["cast"] }) {
          total
          edges { node { name { id nameText { text } primaryImage { url } } ... on Cast { characters { name } episodeCredits(first: 0) { total } } } }
        }
        moreLikeThisTitles(first: 20) { edges { node { ${CARD} } } }
        series { series { id titleText { text } } episodeNumber { episodeNumber seasonNumber } }
        episodes { seasons { number } episodes(first: 1) { total } }
      }
    }`,
    { id }
  );
  const t = d.title;
  if (!t?.titleText?.text) return null; // IMDb returns an empty shell for unknown ids
  return {
    ...normCard(t),
    originalTitle: t.originalTitleText?.text,
    releaseDate: t.releaseDate ?? undefined,
    tagline: t.taglines?.edges?.[0]?.node?.text,
    metascore: t.metacritic?.metascore?.score ?? undefined,
    budget: t.productionBudget?.budget ?? undefined,
    gross: t.lifetimeGross?.total?.amount ?? undefined,
    domestic: t.domestic?.total?.amount ?? undefined,
    opening: t.openingWeekendGross?.gross?.total?.amount ?? undefined,
    keywords: edges(t.keywords).map((e) => e.node.text),
    trivia: edges(t.trivia).map((e) => e.node.text?.plainText).filter(Boolean),
    goofs: edges(t.goofs).map((e) => e.node.text?.plainText).filter(Boolean),
    quotes: edges(t.quotes).map((e) => e.node.lines || []),
    oscars: t.prestigiousAwardSummary ?? null,
    wins: t.wins?.total || 0,
    noms: t.noms?.total || 0,
    watch: (t.watchOptionsByCategory?.categorizedWatchOptionsList || []).map((c: Json) => ({
      category: c.categoryName?.value,
      options: (c.watchOptions || []).map((o: Json) => ({
        name: o.provider?.name?.value,
        logo: o.provider?.logos?.icon?.url,
        link: o.link,
        label: o.title?.value,
        desc: o.shortDescription?.value,
      })),
    })),
    reviews: edges(t.featuredReviews).map((e) => ({
      summary: e.node.summary?.originalText,
      text: e.node.text?.originalText?.plainText,
      rating: e.node.authorRating ?? undefined,
      author: e.node.author?.nickName,
      date: e.node.submissionDate,
      up: e.node.helpfulness?.upVotes,
      down: e.node.helpfulness?.downVotes,
    })),
    countries: (t.countriesOfOrigin?.countries || []).map((c: Json) => c.text),
    languages: (t.spokenLanguages?.spokenLanguages || []).map((c: Json) => c.text),
    locations: edges(t.filmingLocations).map((e) => e.node.text),
    images: edges(t.images).map((e) => ({ url: e.node.url, width: e.node.width, height: e.node.height, caption: e.node.caption?.plainText })),
    imageTotal: t.images?.total || 0,
    stills: edges(t.stills).map((e) => e.node).filter((n: Img) => n.width > n.height * 1.25),
    videos: edges(t.primaryVideos)
      .map((e) => {
        const v = pickMp4(e.node);
        return v && { ...v, thumb: e.node.thumbnail?.url, runtime: e.node.runtime?.value, kind: e.node.contentType?.displayName?.value };
      })
      .filter(Boolean) as Video[],
    directors: names(t.directors),
    writers: names(t.writers),
    composers: names(t.composer),
    dops: names(t.dop),
    creators: names(t.creators),
    cast: edges(t.cast).map((e) => ({
      id: e.node.name.id,
      name: e.node.name.nameText?.text,
      img: e.node.name.primaryImage?.url,
      character: (e.node.characters || []).map((c: Json) => c.name).join(' / '),
      episodes: e.node.episodeCredits?.total ?? undefined,
    })),
    castTotal: t.cast?.total,
    similar: edges(t.moreLikeThisTitles).map((e) => normCard(e.node)),
    parent: t.series?.series
      ? { id: t.series.series.id, title: t.series.series.titleText?.text, season: t.series.episodeNumber?.seasonNumber, episode: t.series.episodeNumber?.episodeNumber }
      : null,
    seasons: (t.episodes?.seasons || []).map((s: Json) => s.number).filter((n: number | null) => n != null),
    episodeTotal: t.episodes?.episodes?.total || 0,
  };
});

export const getSeason = cache(async (id: string, number: number): Promise<Episode[]> => {
  const d = await gql(
    `query Season($id: ID!, $s: String!) {
      title(id: $id) { episodes { episodes(first: 250, filter: { includeSeasons: [$s] }) { edges { node {
        id titleText { text }
        series { displayableEpisodeNumber { episodeNumber { text } } }
        ratingsSummary { aggregateRating voteCount }
        plot { plotText { plainText } }
        primaryImage { url }
        releaseDate { year month day }
        runtime { seconds }
      } } } } }
    }`,
    { id, s: String(number) }
  );
  return edges(d.title?.episodes?.episodes).map((e) => ({
    id: e.node.id,
    title: e.node.titleText?.text,
    n: e.node.series?.displayableEpisodeNumber?.episodeNumber?.text,
    rating: e.node.ratingsSummary?.aggregateRating ?? undefined,
    votes: e.node.ratingsSummary?.voteCount ?? undefined,
    plot: e.node.plot?.plotText?.plainText,
    img: e.node.primaryImage?.url,
    date: e.node.releaseDate ?? undefined,
    runtime: e.node.runtime?.seconds ?? undefined,
  }));
});

export const getEpisodeGrid = cache(async (id: string, seasons: number[]): Promise<SeasonGrid> => {
  const list = seasons.slice(0, 40);
  if (!list.length) return [];
  const parts = list.map(
    (s, i) => `s${i}: episodes(first: 250, filter: { includeSeasons: ["${s}"] }) {
      edges { node { id titleText { text } series { displayableEpisodeNumber { episodeNumber { text } } } ratingsSummary { aggregateRating voteCount } } }
    }`
  );
  const d = await gql(`query Grid($id: ID!) { title(id: $id) { episodes { ${parts.join('\n')} } } }`, { id });
  const eps = d.title?.episodes || {};
  return list.map((s, i) => ({
    season: s,
    episodes: edges(eps[`s${i}`]).map((e) => ({
      id: e.node.id,
      title: e.node.titleText?.text,
      n: e.node.series?.displayableEpisodeNumber?.episodeNumber?.text,
      rating: e.node.ratingsSummary?.aggregateRating ?? undefined,
      votes: e.node.ratingsSummary?.voteCount ?? undefined,
    })),
  }));
});

/* ------------------------------------------------------------------ */
/* People                                                              */
/* ------------------------------------------------------------------ */

export const getPerson = cache(async (id: string): Promise<Person | null> => {
  const credit = (cat: string, n: number) => `
    ${cat}: credits(first: ${n}, filter: { categories: ["${cat}"] }) {
      total
      edges { node { title { ${CARD} } ... on Cast { characters { name } } } }
    }`;
  const d = await gql(
    `query Person($id: ID!) {
      name(id: $id) {
        id
        nameText { text }
        bio { text { plainText } }
        birthDate { dateComponents { year month day } }
        deathDate { dateComponents { year month day } }
        birthLocation { text }
        height { displayableProperty { value { plainText } } }
        primaryImage { url width height }
        images(first: 18) { total edges { node { url width height } } }
        professions { profession { text } }
        knownFor(first: 8) { edges { node { title { ${CARD} } } } }
        prestigiousAwardSummary { wins nominations award { text } }
        wins: awardNominations(first: 1, filter: { wins: WINS_ONLY }) { total }
        noms: awardNominations(first: 1) { total }
        trivia(first: 6) { edges { node { text { plainText } } } }
        quotes(first: 4) { edges { node { text { plainText } } } }
        ${credit('actor', 250)}
        ${credit('actress', 250)}
        ${credit('director', 100)}
        ${credit('writer', 100)}
        ${credit('producer', 80)}
      }
    }`,
    { id }
  );
  const n = d.name;
  if (!n?.nameText?.text) return null; // IMDb returns an empty shell for unknown ids
  const credits = (c: Json): Card[] =>
    edges(c).map((e) => ({ ...normCard(e.node.title), character: (e.node.characters || []).map((x: Json) => x.name).join(' / ') }));
  return {
    id: n.id,
    name: n.nameText?.text,
    bio: n.bio?.text?.plainText,
    born: n.birthDate?.dateComponents ?? undefined,
    died: n.deathDate?.dateComponents ?? undefined,
    birthplace: n.birthLocation?.text,
    height: n.height?.displayableProperty?.value?.plainText,
    img: n.primaryImage?.url,
    images: edges(n.images).map((e) => e.node),
    professions: (n.professions || []).map((p: Json) => p.profession?.text).filter(Boolean),
    knownFor: edges(n.knownFor).map((e) => normCard(e.node.title)),
    oscars: n.prestigiousAwardSummary ?? null,
    wins: n.wins?.total || 0,
    noms: n.noms?.total || 0,
    trivia: edges(n.trivia).map((e) => e.node.text?.plainText).filter(Boolean),
    quotes: edges(n.quotes).map((e) => e.node.text?.plainText).filter(Boolean),
    credits: {
      Acting: [...credits(n.actor), ...credits(n.actress)],
      Directing: credits(n.director),
      Writing: credits(n.writer),
      Producing: credits(n.producer),
    },
  };
});

/* ------------------------------------------------------------------ */
/* Discover / search / batch                                           */
/* ------------------------------------------------------------------ */

export async function discover(f: DiscoverFilters = {}, after: string | null = null, first = 48): Promise<DiscoverPage> {
  const c: Json = {};
  c.titleTypeConstraint = { anyTitleTypeIds: f.types?.length ? f.types : ['movie'] };
  if (f.genres?.length) c.genreConstraint = { allGenreIds: f.genres };
  if (f.keywords?.length) c.keywordConstraint = { anyKeywords: f.keywords };
  if (f.minRating || f.minVotes || f.maxVotes) {
    c.userRatingsConstraint = {};
    if (f.minRating) c.userRatingsConstraint.aggregateRatingRange = { min: +f.minRating };
    if (f.minVotes || f.maxVotes)
      c.userRatingsConstraint.ratingsCountRange = { ...(f.minVotes ? { min: +f.minVotes } : {}), ...(f.maxVotes ? { max: +f.maxVotes } : {}) };
  }
  if (f.from || f.to) {
    c.releaseDateConstraint = { releaseDateRange: {} };
    if (f.from) c.releaseDateConstraint.releaseDateRange.start = `${f.from}-01-01`;
    if (f.to) c.releaseDateConstraint.releaseDateRange.end = `${f.to}-12-31`;
  }
  if (f.minRuntime || f.maxRuntime) {
    c.runtimeConstraint = { runtimeRangeMinutes: {} };
    if (f.minRuntime) c.runtimeConstraint.runtimeRangeMinutes.min = +f.minRuntime;
    if (f.maxRuntime) c.runtimeConstraint.runtimeRangeMinutes.max = +f.maxRuntime;
  }
  const sortBy = f.sort || 'POPULARITY';
  const sortOrder = f.order || (sortBy === 'POPULARITY' || sortBy === 'TITLE_REGIONAL' ? 'ASC' : 'DESC');
  const d = await gql(
    `query Discover($c: AdvancedTitleSearchConstraints, $after: String, $first: Int!, $sort: AdvancedTitleSearchSort) {
      advancedTitleSearch(first: $first, after: $after, constraints: $c, sort: $sort) {
        total
        pageInfo { endCursor hasNextPage }
        edges { node { title { ${CARD_PLOT} } } }
      }
    }`,
    { c, after, first: Math.min(first, 250), sort: { sortBy, sortOrder } }
  );
  const r = d.advancedTitleSearch;
  return {
    total: r?.total || 0,
    cursor: r?.pageInfo?.hasNextPage ? r.pageInfo.endCursor : null,
    items: edges(r).map((e) => normCard(e.node.title)),
  };
}

export const searchAll = cache(async (q: string): Promise<SearchResult> => {
  const d = await gql(
    `query Search($q: String!) {
      titles: mainSearch(first: 40, options: { searchTerm: $q, type: [TITLE] }) {
        edges { node { entity { ... on Title { ${CARD_PLOT} } } } }
      }
      names: mainSearch(first: 18, options: { searchTerm: $q, type: [NAME] }) {
        edges { node { entity { ... on Name { id nameText { text } primaryImage { url } professions { profession { text } } knownFor(first: 1) { edges { node { title { titleText { text } releaseYear { year } } } } } } } } }
      }
    }`,
    { q }
  );
  return {
    titles: edges(d.titles).map((e) => e.node.entity).filter((t: Json) => t?.id).map(normCard),
    names: edges(d.names)
      .map((e) => e.node.entity)
      .filter((n: Json) => n?.id)
      .map((n: Json) => {
        const k = n.knownFor?.edges?.[0]?.node?.title;
        return {
          id: n.id,
          name: n.nameText?.text,
          img: n.primaryImage?.url,
          role: n.professions?.[0]?.profession?.text,
          known: k ? `${k.titleText?.text}${k.releaseYear?.year ? ` (${k.releaseYear.year})` : ''}` : undefined,
        };
      }),
  };
});

export async function getCards(ids: string[]): Promise<Card[]> {
  const clean = ids.filter((i) => /^tt\d+$/.test(i)).slice(0, 250);
  if (!clean.length) return [];
  const d = await gql(`query Cards($ids: [ID!]!) { titles(ids: $ids) { ${CARD_PLOT} } }`, { ids: clean });
  return (d.titles || []).filter(Boolean).map(normCard);
}

export async function suggest(q: string): Promise<Suggestion[]> {
  const key = q.trim().toLowerCase();
  if (!key) return [];
  return remember(`suggest:${key}`, async () => {
    const r = await fetch(`${SUGGEST_URL}${encodeURIComponent(key)}.json`, { headers: HEADERS, cache: 'no-store' });
    if (!r.ok) return [];
    const j = await r.json();
    return (j.d || [])
      .filter((x: Json) => /^(tt|nm)\d+$/.test(x.id))
      .map((x: Json) => ({
        id: x.id,
        label: x.l,
        sub: x.s,
        year: x.y,
        img: x.i?.imageUrl,
        kind: x.id.startsWith('tt') ? 'title' : 'name',
        qid: x.qid,
      }));
  });
}
