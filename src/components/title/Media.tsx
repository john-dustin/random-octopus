'use client';

import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Play, X, Images } from 'lucide-react';
import type { Img, Video } from '@/lib/types';
import { Rail } from '@/components/Rail';
import { Button } from '@/components/ui';
import { cx, img } from '@/lib/format';
import { useUI } from '@/lib/store';
import { Heading } from './Sections';

/* ------------------------------------------------------------------ */
/* Videos strip                                                        */
/* ------------------------------------------------------------------ */

export function Videos({ videos, title }: { videos: Video[]; title: string }) {
  const play = useUI((s) => s.play);
  if (!videos.length) return null;
  return (
    <section id="videos" className="scroll-mt-32">
      <div className="mx-auto w-full max-w-[1680px] px-4 sm:px-8 lg:px-12">
        <Heading eyebrow={`${videos.length} video${videos.length > 1 ? 's' : ''}`} title="Trailers & clips" />
      </div>
      <Rail>
        {videos.map((v, i) => (
          <button
            key={v.id}
            onClick={() => play(videos, i, title)}
            className="group w-[280px] shrink-0 snap-start text-left sm:w-[340px]"
          >
            <div className="sheen relative aspect-video overflow-hidden rounded-2xl bg-s2 ring-1 ring-white/5 transition-all duration-500 group-hover:-translate-y-1 group-hover:ring-white/20">
              {v.thumb && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={img(v.thumb, 680)}
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-night/70 via-transparent to-transparent" />
              <span className="absolute left-1/2 top-1/2 grid size-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/15 backdrop-blur-md ring-1 ring-white/30 transition-all duration-500 group-hover:scale-110 group-hover:bg-white group-hover:text-night">
                <Play size={20} fill="currentColor" className="translate-x-0.5" />
              </span>
              {v.kind && (
                <span className="absolute left-3 top-3 rounded-md bg-night/60 px-2 py-0.5 text-[10.5px] font-medium uppercase tracking-wider backdrop-blur">
                  {v.kind}
                </span>
              )}
              {v.runtime ? (
                <span className="absolute bottom-3 right-3 rounded bg-night/70 px-1.5 font-mono text-[11px]">
                  {Math.floor(v.runtime / 60)}:{String(v.runtime % 60).padStart(2, '0')}
                </span>
              ) : null}
            </div>
            <div className="mt-2.5 line-clamp-1 px-0.5 text-[13.5px] text-fg/90 group-hover:text-white">{v.name}</div>
          </button>
        ))}
      </Rail>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Justified gallery + lightbox                                        */
/* ------------------------------------------------------------------ */

export function Gallery({ images, total, title }: { images: Img[]; total: number; title: string }) {
  const [expanded, setExpanded] = useState(false);
  const [open, setOpen] = useState<number | null>(null);
  const list = images.filter((i) => i.url && i.width && i.height);
  if (!list.length) return null;
  const shown = expanded ? list : list.slice(0, 10);

  return (
    <section id="gallery" className="scroll-mt-32">
      <Heading
        eyebrow={`${total || list.length} photos`}
        title="Gallery"
        aside={
          list.length > 10 ? (
            <Button size="sm" variant="outline" onClick={() => setExpanded((e) => !e)}>
              <Images size={14} />
              {expanded ? 'Show less' : `Show ${list.length - 10} more`}
            </Button>
          ) : null
        }
      />
      <div className="flex flex-wrap gap-2 after:block after:grow-[10]">
        {shown.map((im, i) => {
          const ratio = im.width / im.height;
          return (
            <button
              key={im.url}
              onClick={() => setOpen(i)}
              className="group relative overflow-hidden rounded-xl bg-s2"
              style={{ flexGrow: ratio * 100, flexBasis: `${ratio * 190}px` }}
              aria-label={im.caption ?? `Image ${i + 1}`}
            >
              <span className="block" style={{ paddingBottom: `${100 / ratio}%` }} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img(im.url, ratio > 1 ? 640 : 360)}
                alt={im.caption ?? ''}
                loading="lazy"
                className="absolute inset-0 size-full object-cover transition-all duration-700 group-hover:scale-105 group-hover:brightness-110"
              />
            </button>
          );
        })}
      </div>
      <Lightbox images={list} index={open} setIndex={setOpen} title={title} />
    </section>
  );
}

function Lightbox({ images, index, setIndex, title }: { images: Img[]; index: number | null; setIndex: (i: number | null) => void; title: string }) {
  const step = useCallback(
    (d: number) => index != null && setIndex((index + d + images.length) % images.length),
    [index, images.length, setIndex]
  );

  useEffect(() => {
    if (index == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIndex(null);
      else if (e.key === 'ArrowRight') step(1);
      else if (e.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [index, step, setIndex]);

  const im = index != null ? images[index] : null;

  return (
    <AnimatePresence>
      {im && (
        <motion.div
          className="fixed inset-0 z-[90] flex flex-col bg-night/95 backdrop-blur-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-label="Image viewer"
        >
          <div className="flex items-center gap-4 px-6 py-4">
            <div className="eyebrow text-lagoon">{title}</div>
            <div className="font-mono text-xs text-faint tabular">
              {index! + 1} / {images.length}
            </div>
            <button
              onClick={() => setIndex(null)}
              className="glass ml-auto grid size-11 place-items-center rounded-full transition hover:rotate-90 hover:bg-white/15"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 sm:px-20" onClick={() => setIndex(null)}>
            <AnimatePresence mode="wait">
              <motion.img
                key={im.url}
                src={img(im.url, 1800)}
                alt={im.caption ?? ''}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.25 }}
                onClick={(e) => e.stopPropagation()}
                className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
              />
            </AnimatePresence>
            {images.length > 1 && (
              <>
                <NavBtn side="left" onClick={() => step(-1)} />
                <NavBtn side="right" onClick={() => step(1)} />
              </>
            )}
          </div>
          <div className="min-h-14 px-6 py-4 text-center text-sm text-muted">{im.caption}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function NavBtn({ side, onClick }: { side: 'left' | 'right'; onClick: () => void }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label={side === 'left' ? 'Previous image' : 'Next image'}
      className={cx(
        'glass absolute top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full transition hover:scale-110 hover:bg-white/15',
        side === 'left' ? 'left-3 sm:left-6' : 'right-3 sm:right-6'
      )}
    >
      {side === 'left' ? <ChevronLeft size={22} /> : <ChevronRight size={22} />}
    </button>
  );
}
