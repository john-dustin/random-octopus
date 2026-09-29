export const maxDuration = 60;

const PREPARE_URL = process.env.PREPARE_URL ?? 'https://effective-octupus-production.up.railway.app/prepare';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const target = typeof body?.target === 'string' ? body.target.trim() : '';

  if (!target) {
    return Response.json({ error: 'A target title is required.' }, { status: 400 });
  }

  const payload = {
    target,
    ...(typeof body?.handle === 'string' ? { handle: body.handle } : {}),
    ...(body?.option && typeof body.option === 'object' ? { option: body.option } : {}),
  };

  try {
    const res = await fetch(PREPARE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30_000),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      return Response.json(
        { error: data?.error ?? `Prepare failed (${res.status})` },
        { status: res.status },
      );
    }

    return Response.json(data ?? {});
  } catch {
    return Response.json({ error: 'Could not reach the prepare service.' }, { status: 502 });
  }
}
