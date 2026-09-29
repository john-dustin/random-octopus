'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Lightbulb, Bug, ThumbsUp, ChevronDown } from 'lucide-react';
import type { Review } from '@/lib/types';
import { cx, ratingColor } from '@/lib/format';
import { Heading } from './Sections';

/* ------------------------------------------------------------------ */
/* Trivia carousel                                                     */
/* ------------------------------------------------------------------ */

export function Trivia({ trivia }: { trivia: string[] }) {
  const [i, setI] = useState(0);
  const [dir, setDir] = useState(1);
  const [paused, setPaused] = useState(false);
  const n = trivia.length;

  useEffect(() => {
    if (n < 2 || paused) return;
    const t = setTimeout(() => {
      setDir(1);
      setI((x) => (x + 1) % n);
    }, 9000);
    return () => clearTimeout(t);
  }, [i, n, paused]);

  if (!n) return null;
  const go = (d: number) => {
    setDir(d);
    setI((x) => (x + d + n) % n);
  };

  return (
    <div
      className="panel relative flex min-h-[300px] flex-col overflow-hidden p-6 sm:p-8"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full blur-3xl"
        style={{ background: 'rgb(var(--accent) / 0.18)' }}
      />
      <div className="mb-5 flex items-center gap-2">
        <Lightbulb size={16} className="text-accent" />
        <span className="eyebrow text-gold">Did you know</span>
        <span className="ml-auto font-mono text-xs text-faint tabular">
          {String(i + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}
        </span>
      </div>
      <div className="relative flex-1">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.p
            key={i}
            custom={dir}
            initial={{ opacity: 0, x: dir * 24, filter: 'blur(4px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, x: dir * -24, filter: 'blur(4px)' }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className={cx('display text-fg/95', trivia[i].length > 320 ? 'text-xl leading-snug' : 'text-2xl leading-snug sm:text-[1.7rem]')}
          >
            {trivia[i]}
          </motion.p>
        </AnimatePresence>
      </div>
      {n > 1 && (
        <div className="mt-6 flex items-center gap-3">
          <div className="flex flex-1 gap-1">
            {trivia.map((_, k) => (
              <button
                key={k}
                onClick={() => {
                  setDir(k > i ? 1 : -1);
                  setI(k);
                }}
                aria-label={`Trivia ${k + 1}`}
                className="h-1 flex-1 overflow-hidden rounded-full bg-white/10"
              >
                <span
                  className={cx('block h-full rounded-full bg-leaf transition-all', k === i ? 'w-full' : k < i ? 'w-full opacity-40' : 'w-0')}
                />
              </button>
            ))}
          </div>
          <button onClick={() => go(-1)} className="glass grid size-9 place-items-center rounded-full hover:bg-white/10" aria-label="Previous">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => go(1)} className="glass grid size-9 place-items-center rounded-full hover:bg-white/10" aria-label="Next">
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Goofs                                                               */
/* ------------------------------------------------------------------ */

export function Goofs({ goofs }: { goofs: string[] }) {
  const [open, setOpen] = useState(false);
  if (!goofs.length) return null;
  return (
    <div className="panel overflow-hidden">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-3 px-6 py-4 text-left" aria-expanded={open}>
        <Bug size={16} className="text-muted" />
        <span className="text-sm font-medium">Goofs & continuity errors</span>
        <span className="text-xs text-faint">({goofs.length})</span>
        <ChevronDown size={16} className={cx('ml-auto text-faint transition-transform', open && 'rotate-180')} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="divide-y divide-line overflow-hidden border-t border-line"
          >
            {goofs.map((g, i) => (
              <li key={i} className="px-6 py-4 text-sm leading-relaxed text-muted">
                {g}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Featured reviews                                                    */
/* ------------------------------------------------------------------ */

export function Reviews({ reviews }: { reviews: Review[] }) {
  const list = reviews.filter((r) => r.text || r.summary);
  if (!list.length) return null;
  return (
    <section id="reviews" className="scroll-mt-32">
      <Heading eyebrow="From the audience" title="Featured reviews" />
      <div className="columns-1 gap-4 md:columns-2 [&>*]:mb-4">
        {list.map((r, i) => (
          <ReviewCard key={i} r={r} />
        ))}
      </div>
    </section>
  );
}

function ReviewCard({ r }: { r: Review }) {
  const [open, setOpen] = useState(false);
  const long = (r.text?.length ?? 0) > 420;
  const when = r.date ? new Date(r.date).toLocaleDateString('en', { year: 'numeric', month: 'short', day: 'numeric' }) : undefined;
  return (
    <article className="panel break-inside-avoid p-6">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid size-9 place-items-center rounded-full bg-s3 font-mono text-xs uppercase text-muted">
          {(r.author ?? '?').slice(0, 2)}
        </span>
        <div className="min-w-0 flex-1 leading-tight">
          <div className="truncate text-sm font-medium">{r.author ?? 'Anonymous'}</div>
          {when && <div className="text-xs text-faint">{when}</div>}
        </div>
        {r.rating != null && (
          <span
            className="rounded-lg px-2 py-1 font-mono text-xs font-bold tabular text-night"
            style={{ background: ratingColor(r.rating) }}
            aria-label={`Rated ${r.rating} out of 10`}
          >
            {r.rating}/10
          </span>
        )}
      </div>
      {r.summary && <h3 className="display mb-3 text-2xl leading-tight">“{r.summary}”</h3>}
      {r.text && (
        <div className="relative">
          <p className={cx('whitespace-pre-line text-sm leading-relaxed text-muted', !open && long && 'line-clamp-6')}>{r.text}</p>
          {long && (
            <button onClick={() => setOpen((o) => !o)} className="mt-2 text-xs font-medium text-accent hover:underline">
              {open ? 'Show less' : 'Read full review'}
            </button>
          )}
        </div>
      )}
      {r.up ? (
        <div className="mt-4 flex items-center gap-1.5 text-xs text-faint">
          <ThumbsUp size={12} /> {r.up.toLocaleString()} found this helpful
        </div>
      ) : null}
    </article>
  );
}
