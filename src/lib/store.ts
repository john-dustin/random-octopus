'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Card, Video } from './types';

/* ------------------------------------------------------------------ */
/* Personal library — persisted to localStorage                        */
/* ------------------------------------------------------------------ */

export type LibEntry = Card & { addedAt: number };
export type SeenEntry = Card & { seenAt: number; myRating?: number };

type Library = {
  watchlist: Record<string, LibEntry>;
  seen: Record<string, SeenEntry>;
  recent: Card[]; // recently viewed titles, newest first
  toggleWatchlist: (c: Card) => boolean; // returns new state
  toggleSeen: (c: Card) => boolean;
  rate: (c: Card, rating: number | undefined) => void;
  pushRecent: (c: Card) => void;
  importData: (d: { watchlist?: Record<string, LibEntry>; seen?: Record<string, SeenEntry> }) => void;
  clear: () => void;
};

// Keep only what the library pages need so localStorage stays small.
const slim = (c: Card): Card => ({
  id: c.id,
  title: c.title,
  year: c.year,
  endYear: c.endYear,
  rating: c.rating,
  votes: c.votes,
  poster: c.poster,
  type: c.type,
  typeText: c.typeText,
  series: c.series,
  runtime: c.runtime,
  genres: c.genres ?? [],
  cert: c.cert,
});

export const useLibrary = create<Library>()(
  persist(
    (set, get) => ({
      watchlist: {},
      seen: {},
      recent: [],
      toggleWatchlist: (c) => {
        const has = !!get().watchlist[c.id];
        set((s) => {
          const w = { ...s.watchlist };
          if (has) delete w[c.id];
          else w[c.id] = { ...slim(c), addedAt: Date.now() };
          return { watchlist: w };
        });
        return !has;
      },
      toggleSeen: (c) => {
        const has = !!get().seen[c.id];
        set((s) => {
          const seen = { ...s.seen };
          const w = { ...s.watchlist };
          if (has) delete seen[c.id];
          else {
            seen[c.id] = { ...slim(c), seenAt: Date.now() };
            delete w[c.id]; // watched → off the watchlist
          }
          return { seen, watchlist: w };
        });
        return !has;
      },
      rate: (c, rating) =>
        set((s) => {
          const prev = s.seen[c.id];
          const w = { ...s.watchlist };
          delete w[c.id];
          return {
            watchlist: w,
            seen: { ...s.seen, [c.id]: { ...(prev ?? { ...slim(c), seenAt: Date.now() }), myRating: rating } },
          };
        }),
      pushRecent: (c) =>
        set((s) => ({ recent: [slim(c), ...s.recent.filter((r) => r.id !== c.id)].slice(0, 24) })),
      importData: (d) =>
        set((s) => ({ watchlist: { ...s.watchlist, ...(d.watchlist || {}) }, seen: { ...s.seen, ...(d.seen || {}) } })),
      clear: () => set({ watchlist: {}, seen: {}, recent: [] }),
    }),
    { name: 'lumiere-library', version: 1 }
  )
);

/* ------------------------------------------------------------------ */
/* Ephemeral UI state                                                  */
/* ------------------------------------------------------------------ */

type UI = {
  paletteOpen: boolean;
  setPalette: (open: boolean) => void;
  player: { videos: Video[]; index: number; title?: string } | null;
  play: (videos: Video[], index?: number, title?: string) => void;
  closePlayer: () => void;
  toasts: { id: number; text: string; icon?: string }[];
  toast: (text: string, icon?: string) => void;
};

export const useUI = create<UI>()((set) => ({
  paletteOpen: false,
  setPalette: (paletteOpen) => set({ paletteOpen }),
  player: null,
  play: (videos, index = 0, title) => videos.length && set({ player: { videos, index, title } }),
  closePlayer: () => set({ player: null }),
  toasts: [],
  toast: (text, icon) => {
    const id = Date.now() + Math.random();
    set((s) => ({ toasts: [...s.toasts, { id, text, icon }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 2600);
  },
}));
