import { discover } from '@/lib/imdb';
import type { DiscoverFilters } from '@/lib/types';

// POST { filters, after?, first? } → DiscoverPage
export async function POST(req: Request) {
  try {
    const { filters = {}, after = null, first = 48 } = (await req.json()) as {
      filters?: DiscoverFilters;
      after?: string | null;
      first?: number;
    };
    return Response.json(await discover(filters, after, first));
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 502 });
  }
}
