import { getTitle } from '@/lib/imdb';

// GET /api/title?id=tt… → full TitleDetail (used by Compare & Roulette on the client)
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get('id') ?? '';
  if (!/^tt\d+$/.test(id)) return Response.json({ error: 'bad id' }, { status: 400 });
  try {
    const t = await getTitle(id);
    return t ? Response.json(t) : Response.json({ error: 'not found' }, { status: 404 });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 502 });
  }
}
