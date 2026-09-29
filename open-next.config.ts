import { defineCloudflareConfig } from '@opennextjs/cloudflare';

export default {
  ...defineCloudflareConfig(),
  // `npm run build` calls the OpenNext CLI; this keeps the inner Next.js build
  // a direct call so it doesn't recurse back into `npm run build`.
  buildCommand: 'next build',
};
