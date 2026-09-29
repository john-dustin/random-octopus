import { Brain, Sun, Gem, Skull, Mountain, Cigarette, Palette, Flame, Vault, Heart, Rocket, type LucideProps } from 'lucide-react';
import type { Mood } from './moods';

const MAP = {
  brain: Brain,
  sun: Sun,
  gem: Gem,
  skull: Skull,
  mountain: Mountain,
  cigarette: Cigarette,
  palette: Palette,
  flame: Flame,
  vault: Vault,
  heart: Heart,
  rocket: Rocket,
} as const;

export function MoodIcon({ icon, ...p }: { icon: Mood['icon'] } & LucideProps) {
  const Icon = MAP[icon];
  return <Icon {...p} />;
}
