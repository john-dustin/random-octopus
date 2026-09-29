'use client';

import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { Img } from '@/lib/types';
import { img } from '@/lib/format';
import { Rail } from '@/components/Rail';

/** Horizontal strip of photos with a full-screen, keyboard-navigable lightbox. */
export function PhotoStrip({ images, name }: { images: Img[]; name: string }) {
  const [open, setOpen] = useState<number | null>(null);

  const step = useCallback(
    (d: number) => setOpen((i) => (i == null ? i : (i + d + images.length) % images.length)),
    [images.length]
  );

  useEffect(() => {
    if (open == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null);
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, step]);

  const cur = open != null ? images[open] : null;

  return (
    <>
      <Rail gap="gap-3">
        {images.map((im, i) => {
          const wide = im.width > im.height;
          return (
            <button
              key={im.url}
              onClick={() => setOpen(i)}
              className="group sheen relative h-[200px] shrink-0 snap-start overflow-hidden rounded-2xl bg-s2 ring-1 ring-white/5 transition-all duration-500 hover:ring-white/20 sm:h-[260px]"
              style={{ aspectRatio: wide ? '3 / 2' : '2 / 3' }}
              aria-label={`Open photo ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img(im.url, wide ? 520 : 300)}
                alt=""
                loading="lazy"
                className="size-full object-cover transition-transform duration-700 ease-out-expo group-hover:scale-105"
              />
            </button>
          );
        })}
      </Rail>

      <AnimatePresence>
        {cur && open != null && (
          <motion.div
            className="fixed inset-0 z-[90] flex items-center justify-center bg-night/95 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(null)}
          >
            <motion.img
              key={cur.url}
              src={img(cur.url, 1800)}
              alt={`${name} — photo ${open + 1}`}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 240, damping: 28 }}
              className="max-h-[86vh] max-w-[92vw] rounded-xl object-contain shadow-[0_0_120px_-20px_rgb(var(--accent)/0.5)]"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute left-1/2 top-5 -translate-x-1/2 font-mono text-xs text-muted tabular">
              {open + 1} / {images.length}
            </div>
            <button onClick={() => setOpen(null)} className="glass absolute right-5 top-5 grid size-11 place-items-center rounded-full transition hover:rotate-90" aria-label="Close">
              <X size={20} />
            </button>
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); step(-1); }}
                  className="glass absolute left-4 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full transition hover:scale-110"
                  aria-label="Previous"
                >
                  <ChevronLeft size={22} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); step(1); }}
                  className="glass absolute right-4 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full transition hover:scale-110"
                  aria-label="Next"
                >
                  <ChevronRight size={22} />
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
