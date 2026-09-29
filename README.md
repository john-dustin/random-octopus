# Lumière

A cinematic movie & TV discovery site built on IMDb metadata — trailers, cast & crew,
episode-rating heatmaps, career charts, box-office breakdowns, legal "where to watch"
links, a movie roulette, head-to-head comparisons and a personal library.

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
# or, for the fast production build:
npm run build && npm start
```

No API keys needed. All IMDb requests are made server-side (IMDb's GraphQL endpoint
rejects browser origins), with an in-memory cache in `src/lib/imdb.ts`.

## Download service (optional)

The title page "Download" button talks to a small companion service that turns a title
into quality options and resolves a direct link. It is proxied server-side by
`/api/prepare` and `/api/resolve` (so the browser never hits it directly, avoiding CORS).
Both proxy routes read their upstream from env vars, falling back to the hosted instance:

| Var | Default |
| --- | --- |
| `PREPARE_URL` | `https://effective-octupus-production.up.railway.app/prepare` |
| `RESOLVE_URL` | `https://effective-octupus-production.up.railway.app/resolve` |

Copy `.env.example` to `.env.local` and point these at your own instance. The service
keeps handles in memory with a ~5 min TTL, so it should run as a single persistent
process (e.g. Render free web service) rather than serverless instances.

## Deploy (Vercel)

Import the repo on Vercel — the Next.js framework preset is detected automatically, no
build settings required. Optionally set `PREPARE_URL` / `RESOLVE_URL` in the project's
environment variables to override the built-in defaults; otherwise the deployed site
talks to the hosted Railway service. `/api/prepare` and `/api/resolve` declare
`maxDuration = 60` so a cold upstream can finish before the function is killed.

```bash
npx vercel          # preview deploy
npx vercel --prod   # production
```

## Map

| Route | What it is |
| --- | --- |
| `/` | Hero carousel with ambient trailers, Top 10, series, premieres, film of the day, genres, decades |
| `/title/[id]` | Film / series / episode page — scores, where to watch, box office, cast, trailers, gallery, trivia, quotes, reviews, episode heatmap |
| `/name/[id]` | Person page — bio, stats, interactive career chart, filmography |
| `/discover` | Filter the whole catalogue (genres, years, rating, votes, runtime, moods, keywords) |
| `/charts/[chart]` | Top 250 movies/series, most popular, Hall of Shame |
| `/roulette` | Spin a film reel to pick tonight's movie |
| `/compare` | Versus — two titles head to head |
| `/library` | Watchlist, diary, personal ratings & stats (stored in your browser) |
| `/search` | Full search results |

Press **⌘K** (or **/**) anywhere to search.

## Stack

Next.js 16 (App Router, Server Components) · React 19 · TypeScript · Tailwind CSS v4 ·
Motion · TanStack Query · Zustand · Lucide.

Data © IMDb — for personal, non-commercial use. Creek footage: [Pexels #6754975](https://www.pexels.com/video/6754975/)
(Pexels License), trimmed into a seamless 12s loop and colour-graded; encodes live in `public/media/`.
