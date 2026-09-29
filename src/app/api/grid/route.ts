import { getEpisodeGrid } from '@/lib/imdb';

// GET /api/grid?id=tt…&seasons=1,2,3
export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  const id = p.get('id') ?? '';
  const seasons = (p.get('seasons') ?? '').split(',').map(Number).filter((n) => Number.isFinite(n) && n > 0);
  if (!/^tt\d+$/.test(id)) return Response.json({ error: 'bad params' }, { status: 400 });
  try {
    return Response.json(await getEpisodeGrid(id, seasons));
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 502 });
  }
}
