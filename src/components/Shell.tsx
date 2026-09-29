'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Bookmark, Check, X, Sparkles } from 'lucide-react';
import { useUI } from '@/lib/store';

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 5 * 60_000, refetchOnWindowFocus: false, retry: 1 } } })
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

const ICONS = { bookmark: Bookmark, check: Check, x: X, sparkles: Sparkles } as const;

export function Toasts() {
  const toasts = useUI((s) => s.toasts);
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[95] flex flex-col items-center gap-2 px-4">
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = ICONS[(t.icon as keyof typeof ICONS) ?? 'check'] ?? Check;
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="glass flex items-center gap-2.5 rounded-full px-4 py-2.5 text-sm shadow-2xl"
            >
              <span className="grid size-6 place-items-center rounded-full bg-gold text-night">
                <Icon size={13} strokeWidth={2.5} />
              </span>
              {t.text}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
