export const maxDuration = 60;

const RESOLVE_URL = process.env.RESOLVE_URL ?? 'https://effective-octupus-production.up.railway.app/resolve';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const handle = typeof body?.handle === 'string' ? body.handle.trim() : '';
  const quality = typeof body?.quality === 'string' ? body.quality.trim() : '';

  if (!handle || !quality) {
    return Response.json(
      { ok: false, error: 'handle and quality are required', code: 'bad_input' },
      { status: 400 },
    );
  }

  try {
    const res = await fetch(RESOLVE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ handle, quality }),
      signal: AbortSignal.timeout(30_000),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      return Response.json(
        { ok: false, error: data?.error ?? `Resolve failed (${res.status})`, code: data?.code, detail: data?.detail },
        { status: res.status },
      );
    }

    return Response.json(data ?? {});
  } catch {
    return Response.json({ ok: false, error: 'Could not reach the resolve service.' }, { status: 502 });
  }
}
