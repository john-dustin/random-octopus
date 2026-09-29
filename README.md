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

## Deploy

Cloudflare Workers is wired up via OpenNext (`wrangler.jsonc`, `open-next.config.ts`):

`npm run build` runs the OpenNext build (which calls `next build` internally, see
`buildCommand` in `open-next.config.ts`), producing the `.open-next` bundle the deploy
step needs.

```bash
npm run preview   # build + run in the Workers runtime locally
npm run deploy    # build + deploy to Cloudflare
```

For CI, connect the repo in Cloudflare Workers Builds — it builds and deploys on push.
Keep the `name` in `wrangler.jsonc` (and the `WORKER_SELF_REFERENCE` service) equal to
the Worker name, or the deploy fails with a service-binding error.

Caching: rendered pages are ISR (`revalidate` on `/`, `/title/[id]`, `/name/[id]`,
`/charts/[chart]`) and stored in R2 via `incrementalCache`, with a Durable Object queue
for time-based revalidation. **Create the bucket once before deploying** (or change
`bucket_name` in `wrangler.jsonc`):

```bash
npx wrangler r2 bucket create random-octopus-cache
```

The `DOQueueHandler` Durable Object is created by the `migrations` entry on first deploy.
This is what keeps dynamic routes off the CPU hot path — without it, every hit re-renders
and the free plan's 10 ms CPU cap kills requests.

Vercel and Netlify also work out of the box (Next.js preset auto-detected, no build
settings). On any host, optionally set `PREPARE_URL` / `RESOLVE_URL` to override the
built-in Railway defaults. `/api/prepare` and `/api/resolve` declare `maxDuration = 60`
(honored by Vercel) so a cold upstream can finish before the function is killed.

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
