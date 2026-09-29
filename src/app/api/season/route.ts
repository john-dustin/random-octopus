import { getSeason } from '@/lib/imdb';

// GET /api/season?id=tt…&s=1
export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  const id = p.get('id') ?? '';
  const s = Number(p.get('s'));
  if (!/^tt\d+$/.test(id) || !Number.isFinite(s)) return Response.json({ error: 'bad params' }, { status: 400 });
  try {
    return Response.json(await getSeason(id, s));
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 502 });
  }
}
