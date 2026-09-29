'use client';

import { useEffect } from 'react';
import { Button, ButtonLink } from '@/components/ui';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => console.error(error), [error]);
  return (
    <div className="grid min-h-[90vh] place-items-center px-6 text-center">
      <div>
        <div className="eyebrow text-danger">Projector jam</div>
        <h1 className="display mt-4 text-[clamp(3rem,9vw,7rem)]">The film snapped.</h1>
        <p className="mx-auto mt-4 max-w-md text-muted">
          We couldn’t reach the archive just now. It’s usually a hiccup — give it another go.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button variant="primary" onClick={reset}>Splice & retry</Button>
          <ButtonLink href="/">Back to the lobby</ButtonLink>
        </div>
      </div>
    </div>
  );
}
