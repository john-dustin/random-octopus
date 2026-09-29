import { defineCloudflareConfig } from '@opennextjs/cloudflare';
import kvIncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/kv-incremental-cache';
import doQueue from '@opennextjs/cloudflare/overrides/queue/do-queue';

const config = {
  ...defineCloudflareConfig({
    // Store ISR/SSG output in Workers KV so rendered pages survive across isolates.
    incrementalCache: kvIncrementalCache,
    // Durable Object queue dedupes time-based revalidations.
    queue: doQueue,
  }),
  // `npm run build` calls the OpenNext CLI; this keeps the inner Next.js build
  // a direct call so it doesn't recurse back into `npm run build`.
  buildCommand: 'next build',
};

export default config;
