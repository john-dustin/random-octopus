import type { DiscoverFilters } from '@/lib/types';

/**
 * Curated moods — each maps to a set of IMDb advanced-search constraints.
 * Shared by Discover (preset cards) and Roulette (mood picker).
 */
export type Mood = {
  slug: string;
  label: string;
  line: string;
  icon: 'brain' | 'sun' | 'gem' | 'skull' | 'mountain' | 'cigarette' | 'palette' | 'flame' | 'vault' | 'heart' | 'rocket';
  gradient: string; // CSS background
  filters: DiscoverFilters;
};

export const MOODS: Mood[] = [
  {
    slug: 'mindbender',
    label: 'Mind-benders',
    line: 'Twists you won’t see coming.',
    icon: 'brain',
    gradient: 'radial-gradient(120% 90% at 0% 0%, #6d4cff 0%, transparent 60%), radial-gradient(90% 90% at 100% 100%, #0fb5c9 0%, transparent 55%), #120f25',
    filters: { keywords: ['mindbender', 'twist-ending', 'psychological-thriller'], minVotes: 20000 },
  },
  {
    slug: 'feelgood',
    label: 'Feel-good',
    line: 'Warm, funny, restorative.',
    icon: 'sun',
    gradient: 'radial-gradient(120% 90% at 0% 0%, #ffb547 0%, transparent 60%), radial-gradient(90% 90% at 100% 100%, #ff6f91 0%, transparent 55%), #26140f',
    filters: { genres: ['Comedy'], keywords: ['feel-good', 'heartwarming', 'friendship', 'feel-good-romance'], minRating: 6.8, minVotes: 20000 },
  },
  {
    slug: 'gems',
    label: 'Hidden gems',
    line: 'Loved by few, adored by all.',
    icon: 'gem',
    gradient: 'radial-gradient(120% 90% at 0% 0%, #2fe0a7 0%, transparent 60%), radial-gradient(90% 90% at 100% 100%, #2f7bff 0%, transparent 55%), #0b1a1a',
    filters: { minRating: 7.6, minVotes: 3000, maxVotes: 40000, to: new Date().getFullYear() - 1 },
  },
  {
    slug: 'midnight',
    label: 'Midnight horror',
    line: 'Lights off. Volume up.',
    icon: 'skull',
    gradient: 'radial-gradient(120% 90% at 0% 0%, #d8202f 0%, transparent 60%), radial-gradient(90% 90% at 100% 100%, #3a0b0b 0%, transparent 55%), #0e0506',
    filters: { genres: ['Horror'], minRating: 6.5, minVotes: 20000 },
  },
  {
    slug: 'epic',
    label: 'Grand epics',
    line: 'Clear the evening. Worth it.',
    icon: 'mountain',
    gradient: 'radial-gradient(120% 90% at 0% 0%, #e9b454 0%, transparent 60%), radial-gradient(90% 90% at 100% 100%, #8a4b1f 0%, transparent 55%), #1a1208',
    filters: { minRuntime: 150, minRating: 7.5, minVotes: 25000 },
  },
  {
    slug: 'noir',
    label: 'Film noir',
    line: 'Shadows, smoke, femmes fatales.',
    icon: 'cigarette',
    gradient: 'radial-gradient(120% 90% at 0% 0%, #b9b3a8 0%, transparent 55%), radial-gradient(90% 90% at 100% 100%, #2a2a2a 0%, transparent 55%), #0c0c0c',
    filters: { genres: ['Film-Noir'], minVotes: 3000 },
  },
  {
    slug: 'animated',
    label: 'Animated wonders',
    line: 'Hand-drawn, stop-motion, pixel.',
    icon: 'palette',
    gradient: 'radial-gradient(120% 90% at 0% 0%, #ff7ad9 0%, transparent 60%), radial-gradient(90% 90% at 100% 100%, #58c2ff 0%, transparent 55%), #150d1f',
    filters: { genres: ['Animation'], minRating: 7.5, minVotes: 20000 },
  },
  {
    slug: 'cult',
    label: 'Cult classics',
    line: 'Midnight-screening royalty.',
    icon: 'flame',
    gradient: 'radial-gradient(120% 90% at 0% 0%, #ff5a1f 0%, transparent 60%), radial-gradient(90% 90% at 100% 100%, #7a1fff 0%, transparent 55%), #170a12',
    filters: { keywords: ['cult-film'], minVotes: 20000 },
  },
  {
    slug: 'heist',
    label: 'The perfect heist',
    line: 'Crews, capers and vaults.',
    icon: 'vault',
    gradient: 'radial-gradient(120% 90% at 0% 0%, #3ee07a 0%, transparent 60%), radial-gradient(90% 90% at 100% 100%, #0d5a3a 0%, transparent 55%), #07140d',
    filters: { keywords: ['heist'], minVotes: 20000 },
  },
  {
    slug: 'romance',
    label: 'Swoon-worthy',
    line: 'Hearts on sleeves.',
    icon: 'heart',
    gradient: 'radial-gradient(120% 90% at 0% 0%, #ff4d6d 0%, transparent 60%), radial-gradient(90% 90% at 100% 100%, #ffb3c1 0%, transparent 55%), #1f0a10',
    filters: { genres: ['Romance'], minRating: 7.2, minVotes: 25000 },
  },
  {
    slug: 'space',
    label: 'Deep space',
    line: 'Starships, silence, the void.',
    icon: 'rocket',
    gradient: 'radial-gradient(120% 90% at 0% 0%, #4d7cff 0%, transparent 60%), radial-gradient(90% 90% at 100% 100%, #b14dff 0%, transparent 55%), #070a1a',
    filters: { genres: ['Sci-Fi'], keywords: ['space', 'outer-space', 'spaceship'], minVotes: 15000 },
  },
];

export const MOOD_BY_SLUG: Record<string, Mood> = Object.fromEntries(MOODS.map((m) => [m.slug, m]));
