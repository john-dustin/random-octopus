import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Versus } from '@/components/compare/Versus';

export const metadata: Metadata = {
  title: 'Versus',
  description: 'Put two films or series head-to-head: ratings, box office, awards and more.',
};

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh]" />}>
      <Versus />
    </Suspense>
  );
}
