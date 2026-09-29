import { suggest } from '@/lib/imdb';

export const revalidate = 300;

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get('q') ?? '';
  try {
    return Response.json(await suggest(q.slice(0, 80)));
  } catch {
    return Response.json([], { status: 502 });
  }
}
