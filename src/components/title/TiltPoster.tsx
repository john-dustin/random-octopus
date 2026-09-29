'use client';

import { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useMotionTemplate } from 'motion/react';
import { Play } from 'lucide-react';
import type { Video } from '@/lib/types';
import { poster as posterUrl } from '@/lib/format';
import { useUI } from '@/lib/store';

/** Pointer-driven 3D poster with a moving glare; click plays the trailer when there is one. */
export function TiltPoster({ src, alt, videos, title }: { src?: string; alt: string; videos: Video[]; title: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const play = useUI((s) => s.play);
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const spring = { stiffness: 180, damping: 18, mass: 0.6 };
  const rx = useSpring(useTransform(py, [0, 1], [9, -9]), spring);
  const ry = useSpring(useTransform(px, [0, 1], [-11, 11]), spring);
  const gx = useTransform(px, [0, 1], [0, 100]);
  const gy = useTransform(py, [0, 1], [0, 100]);
  const glare = useMotionTemplate`radial-gradient(circle at ${gx}% ${gy}%, rgb(255 255 255 / 0.28), transparent 55%)`;

  const onMove = (e: React.PointerEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
  };
  const reset = () => {
    px.set(0.5);
    py.set(0.5);
  };

  const canPlay = videos.length > 0;

  return (
    <div style={{ perspective: 1100 }} className="w-[200px] shrink-0 sm:w-[240px] lg:w-[290px]">
      <motion.div
        ref={ref}
        onPointerMove={onMove}
        onPointerLeave={reset}
        initial={{ opacity: 0, y: 30, rotateX: 12 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        style={{ rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d' }}
        className="group relative aspect-[2/3] overflow-hidden rounded-2xl bg-s2 shadow-[0_40px_80px_-20px_rgb(0_0_0/0.9),0_0_0_1px_rgb(255_255_255/0.08)]"
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={posterUrl(src, 600)} alt={alt} className="absolute inset-0 size-full object-cover" />
        ) : (
          <div className="absolute inset-0 grid place-items-center p-6 text-center">
            <span className="display text-3xl text-faint">{alt}</span>
          </div>
        )}
        <motion.div aria-hidden className="pointer-events-none absolute inset-0 mix-blend-overlay" style={{ background: glare }} />
        {canPlay && (
          <button
            onClick={() => play(videos, 0, title)}
            aria-label="Play trailer"
            className="absolute inset-0 grid place-items-center bg-night/0 opacity-0 transition-all duration-500 group-hover:bg-night/35 group-hover:opacity-100 focus-visible:opacity-100"
          >
            <span className="grid size-16 place-items-center rounded-full bg-white/90 text-night shadow-2xl transition-transform duration-500 group-hover:scale-110">
              <Play size={26} fill="currentColor" className="translate-x-0.5" />
            </span>
          </button>
        )}
      </motion.div>
      {/* soft reflection */}
      <div
        aria-hidden
        className="mx-auto mt-3 h-6 w-4/5 rounded-[50%] opacity-60 blur-xl"
        style={{ background: 'rgb(var(--accent) / 0.45)' }}
      />
    </div>
  );
}
