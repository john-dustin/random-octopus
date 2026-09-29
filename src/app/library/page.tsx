import type { Metadata } from 'next';
import { Library } from '@/components/library/Library';

export const metadata: Metadata = {
  title: 'Your Library',
  description: 'Your watchlist, film diary and viewing statistics.',
};

export default function LibraryPage() {
  return <Library />;
}
