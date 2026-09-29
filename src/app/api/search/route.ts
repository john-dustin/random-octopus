import { searchAll } from '@/lib/imdb';

export const revalidate = 300;

// GET /api/search?q=…
export async function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get('q') ?? '').trim().slice(0, 100);
  if (!q) return Response.json({ titles: [], names: [] });
  try {
    return Response.json(await searchAll(q));
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 502 });
  }
}
