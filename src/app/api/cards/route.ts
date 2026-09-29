import { getCards } from '@/lib/imdb';

// GET /api/cards?ids=tt1,tt2
export async function GET(req: Request) {
  const ids = (new URL(req.url).searchParams.get('ids') ?? '').split(',');
  try {
    return Response.json(await getCards(ids));
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 502 });
  }
}
