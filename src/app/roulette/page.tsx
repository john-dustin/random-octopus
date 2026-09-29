import type { Metadata } from 'next';
import { Roulette } from '@/components/roulette/Roulette';

export const metadata: Metadata = {
  title: 'Movie Roulette',
  description: 'Can’t decide what to watch? Set the mood, spin the reel and let fate pick tonight’s film.',
};

export default function RoulettePage() {
  return <Roulette />;
}
