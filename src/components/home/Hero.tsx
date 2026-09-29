'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Play, Plus, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Card, HeroExtra } from '@/lib/types';
import { cx, img, runtime, titleHref } from '@/lib/format';
import { useLibrary, useUI } from '@/lib/store';
import { useMounted } from '@/lib/hooks';
import { Tag } from '@/components/ui';

export type HeroItem = Card & HeroExtra;

const SLIDE_MS = 9000;

/**
 * Featured carousel in the Apple TV app idiom: a large rounded card inset
 * from the edges, each film's real stills cross-fading inside it, content
 * bottom-left, and an iOS page control beneath.
 */
export function Hero({ items }: { items: HeroItem[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const play = useUI((s) => s.play);
  const toggle = useLibrary((s) => s.toggleWatchlist);
  const toast = useUI((s) => s.toast);
  const mounted = useMounted();
  const item = items[i];
  const inList = useLibrary((s) => !!(item && s.watchlist[item.id]));

  const go = useCallback(
    (n: number) => {
      setProgress(0);
      setI((n + items.length) % items.length);
    },
    [items.length]
  );

  // Slide timer (pauses on hover/focus)
  useEffect(() => {
    if (paused) return;
    const start = performance.now() - progress * SLIDE_MS;
    let raf = 0;
    const tick = (t: number) => {
      const p = (t - start) / SLIDE_MS;
      if (p >= 1) go(i + 1);
      else {
        setProgress(p);
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, paused, go]);

  // Pre-warm this slide's montage and the next slide's first still.
  useEffect(() => {
    const next = items[(i + 1) % items.length];
    const urls = [...(items[i]?.stills.slice(1, 4) ?? []).map((x) => x.url), next?.stills[0]?.url ?? next?.poster];
    for (const u of urls) if (u) new Image().src = img(u, 1920)!;
  }, [i, items]);

  if (!item) return null;
  const stills = item.stills.slice(0, 4).map((x) => img(x.url, 1920)!);

  return (
    <section className="mx-auto w-full max-w-[1680px] px-4 pt-[76px] sm:px-8 md:pt-24 lg:px-12">
      <div
        className="group/hero relative h-[clamp(460px,72svh,760px)] overflow-hidden rounded-[28px] bg-white/[0.04] shadow-[0_30px_80px_-30px_rgb(0_0_0/0.9)] ring-[0.5px] ring-white/10 max-md:h-auto max-md:aspect-[4/5]"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
      >
        {/* Imagery */}
        <AnimatePresence initial={false}>
          <motion.div
            key={item.id}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: [0.32, 0.72, 0, 1] }}
          >
            {stills.length ? (
              <Montage stills={stills} progress={progress} />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={img(item.poster, 1280)} alt="" className="absolute inset-0 size-full scale-125 object-cover opacity-70 blur-2xl" />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Legibility scrims — deep at the bottom-left where the text lives */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(0deg,rgb(0_0_0/0.85)_0%,rgb(0_0_0/0.35)_45%,transparent_70%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgb(0_0_0/0.6)_0%,transparent_60%)] max-md:hidden" />

        {/* Copy */}
        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10 lg:p-14">
          <AnimatePresence mode="wait">
            <motion.div
              key={item.id}
              initial="hidden"
              animate="show"
              exit="exit"
              variants={{ show: { transition: { staggerChildren: 0.06, delayChildren: 0.12 } }, exit: { opacity: 0, transition: { duration: 0.2 } } }}
              className="max-w-2xl"
            >
              <motion.div variants={rise} className="mb-3 flex items-center gap-2">
                <span className="glass inline-flex h-7 items-center rounded-full px-3 text-[12px] font-semibold tracking-[-0.01em]">
                  #{item.rank ?? i + 1} in Movies Today
                </span>
              </motion.div>
              <motion.h1 variants={rise} className="display text-balance text-[clamp(2.3rem,min(5.4vw,9svh),4.8rem)]">
                {item.title}
              </motion.h1>
              <motion.div variants={rise} className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[14px] text-white/75 sm:text-[15px]">
                {item.rating != null && (
                  <span className="font-semibold text-white">
                    <span className="text-gold">★</span> {item.rating.toFixed(1)}
                  </span>
                )}
                {item.year && <Dot>{item.year}</Dot>}
                {item.cert && <Tag>{item.cert}</Tag>}
                {item.runtime && <Dot>{runtime(item.runtime)}</Dot>}
                {item.genres.length > 0 && <span className="max-sm:hidden"><Dot>{item.genres.slice(0, 3).join(', ')}</Dot></span>}
              </motion.div>
              {item.plot && (
                <motion.p variants={rise} className="mt-3 line-clamp-2 max-w-xl text-[15px] leading-relaxed text-white/70 sm:text-[16px] [@media(max-height:700px)]:hidden">
                  {item.plot}
                </motion.p>
              )}
              <motion.div variants={rise} className="mt-6 flex flex-wrap items-center gap-2.5">
                {item.trailer && (
                  <button
                    onClick={() => play([item.trailer!], 0, item.title)}
                    className="inline-flex h-11 items-center gap-2 rounded-full bg-white pl-4 pr-5 text-[15px] font-semibold sm:h-[50px] sm:pl-5 sm:pr-6 sm:text-[17px] tracking-[-0.01em] text-black transition active:scale-[0.96] hover:bg-white/90"
                  >
                    <Play size={17} fill="currentColor" /> Play Trailer
                  </button>
                )}
                <Link
                  href={titleHref(item.id)}
                  className="glass inline-flex h-11 items-center rounded-full px-5 text-[15px] font-semibold sm:h-[50px] sm:px-6 sm:text-[17px] tracking-[-0.01em] transition active:scale-[0.96] hover:bg-white/[0.16]"
                >
                  Details
                </Link>
                <button
                  onClick={() => {
                    const on = toggle(item);
                    toast(on ? `Added “${item.title}” to your watchlist` : 'Removed from watchlist', on ? 'bookmark' : 'x');
                  }}
                  aria-label={mounted && inList ? 'Remove from watchlist' : 'Add to watchlist'}
                  className={cx(
                    'grid size-11 place-items-center rounded-full transition active:scale-[0.94] sm:size-[50px]',
                    mounted && inList ? 'bg-white text-black' : 'glass hover:bg-white/[0.16]'
                  )}
                >
                  {mounted && inList ? <Check size={20} strokeWidth={2.6} /> : <Plus size={21} strokeWidth={2.4} />}
                </button>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Paging chevrons (pointer devices) */}
        <button
          onClick={() => go(i - 1)}
          aria-label="Previous"
          className="glass absolute left-4 top-1/2 hidden size-11 -translate-y-1/2 place-items-center rounded-full opacity-0 transition group-hover/hero:opacity-100 md:grid"
        >
          <ChevronLeft size={20} strokeWidth={2.4} />
        </button>
        <button
          onClick={() => go(i + 1)}
          aria-label="Next"
          className="glass absolute right-4 top-1/2 hidden size-11 -translate-y-1/2 place-items-center rounded-full opacity-0 transition group-hover/hero:opacity-100 md:grid"
        >
          <ChevronRight size={20} strokeWidth={2.4} />
        </button>
      </div>

      {/* iOS page control */}
      <div className="mt-4 flex justify-center gap-2" role="tablist" aria-label="Featured titles">
        {items.map((it, n) => (
          <button
            key={it.id}
            role="tab"
            aria-selected={n === i}
            aria-label={`Show ${it.title}`}
            onClick={() => go(n)}
            className={cx('relative h-2 overflow-hidden rounded-full bg-white/25 transition-[width] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]', n === i ? 'w-8' : 'w-2 hover:bg-white/40')}
          >
            {n === i && <span className="absolute inset-y-0 left-0 bg-white" style={{ width: `${progress * 100}%` }} />}
          </button>
        ))}
      </div>
    </section>
  );
}

function Dot({ children }: { children: React.ReactNode }) {
  return <span className="before:mr-2 before:text-white/35 before:content-['·']">{children}</span>;
}

const rise = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.32, 0.72, 0, 1] as const } },
};

/** Cross-fades through a film's widescreen stills, each drifting in its own direction. */
const DRIFTS = [
  { from: 'scale(1.03) translate3d(0,0,0)', to: 'scale(1.1) translate3d(-1.5%,-1%,0)' },
  { from: 'scale(1.1) translate3d(1.5%,0,0)', to: 'scale(1.03) translate3d(-0.5%,0.5%,0)' },
  { from: 'scale(1.04) translate3d(0,1.5%,0)', to: 'scale(1.11) translate3d(1%,-0.5%,0)' },
  { from: 'scale(1.1) translate3d(-1.5%,0.5%,0)', to: 'scale(1.03) translate3d(0.5%,0,0)' },
];

function Montage({ stills, progress }: { stills: string[]; progress: number }) {
  const k = Math.min(stills.length - 1, Math.floor(progress * stills.length));
  const per = SLIDE_MS / stills.length;
  return (
    <AnimatePresence initial={false}>
      <motion.div
        key={k}
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1.4, ease: 'easeInOut' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={stills[k]}
          alt=""
          className="absolute inset-0 size-full object-cover"
          style={{ animation: `montage-${k % 4} ${per + 1400}ms linear both` }}
        />
        <style>{DRIFTS.map((d, n) => `@keyframes montage-${n}{from{transform:${d.from}}to{transform:${d.to}}}`).join('')}</style>
      </motion.div>
    </AnimatePresence>
  );
}
