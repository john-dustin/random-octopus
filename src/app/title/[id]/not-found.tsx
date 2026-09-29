import { Film } from 'lucide-react';
import { ButtonLink, Container } from '@/components/ui';

export default function TitleNotFound() {
  return (
    <Container className="flex min-h-[80svh] flex-col items-center justify-center pt-24 text-center">
      <div className="relative mb-8 grid size-24 place-items-center rounded-full border border-line-strong">
        <Film size={34} className="text-faint" />
        <span aria-hidden className="absolute inset-0 animate-ping rounded-full border border-gold/20" />
      </div>
      <div className="eyebrow mb-3 text-poppy">Reel missing</div>
      <h1 className="display text-[clamp(2.8rem,7vw,5.5rem)]">This one got lost in the edit.</h1>
      <p className="mt-4 max-w-md text-muted">
        We couldn’t find that title in the archive. It may have been removed, or the link is mistyped.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <ButtonLink href="/" variant="primary">
          Back to the lobby
        </ButtonLink>
        <ButtonLink href="/discover">Discover something</ButtonLink>
      </div>
    </Container>
  );
}
