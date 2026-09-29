import { UserX } from 'lucide-react';
import { ButtonLink, Container, Empty } from '@/components/ui';

export default function NotFound() {
  return (
    <Container className="pt-40">
      <Empty title="No one by that name" icon={<UserX size={34} />}>
        <p>We couldn’t find this person in the archive. The link may be broken, or they may have left the credits.</p>
        <div className="mt-6 flex justify-center gap-2">
          <ButtonLink href="/" variant="primary">Back to the lobby</ButtonLink>
          <ButtonLink href="/discover">Discover films</ButtonLink>
        </div>
      </Empty>
    </Container>
  );
}
