import { ButtonLink } from '@/components/ui';

export default function NotFound() {
  return (
    <div className="grid min-h-[90vh] place-items-center px-6 text-center">
      <div>
        <div className="eyebrow text-gold">Reel 404</div>
        <h1 className="display mt-4 text-[clamp(4rem,12vw,10rem)]">Scene missing.</h1>
        <p className="mx-auto mt-4 max-w-md text-muted">
          This frame ended up on the cutting-room floor. Let’s get you back to the feature presentation.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <ButtonLink href="/" variant="primary">Back to the lobby</ButtonLink>
          <ButtonLink href="/roulette">Spin the roulette</ButtonLink>
        </div>
      </div>
    </div>
  );
}
