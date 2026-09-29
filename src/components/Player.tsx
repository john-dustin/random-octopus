'use client';

import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X, Play } from 'lucide-react';
import { useUI } from '@/lib/store';
import { cx, img } from '@/lib/format';

/** Global cinema-mode trailer player. Open with useUI().play(videos, index). */
export function Player() {
  const player = useUI((s) => s.player);
  const close = useUI((s) => s.closePlayer);
  const play = useUI((s) => s.play);
  const vref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!player) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === ' ' && vref.current) {
        e.preventDefault();
        if (vref.current.paused) vref.current.play();
        else vref.current.pause();
      }
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [player, close]);

  const v = player?.videos[player.index];

  return (
    <AnimatePresence>
      {player && v && (
        <motion.div
          className="fixed inset-0 z-[90] flex flex-col bg-night/95 backdrop-blur-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="flex items-center gap-4 px-6 py-4">
            <div className="min-w-0">
              <div className="eyebrow">{player.title ?? 'Now playing'}</div>
              <div className="truncate text-lg font-medium">{v.name}</div>
            </div>
            <button
              onClick={close}
              className="glass ml-auto grid size-11 place-items-center rounded-full transition hover:rotate-90 hover:bg-white/15"
              aria-label="Close player"
            >
              <X size={20} />
            </button>
          </div>
          <div className="flex min-h-0 flex-1 items-center justify-center px-4 sm:px-10">
            <motion.video
              key={v.id}
              ref={vref}
              src={v.hi}
              poster={img(v.thumb, 1280)}
              controls
              autoPlay
              playsInline
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 26 }}
              onEnded={() => player.index < player.videos.length - 1 && play(player.videos, player.index + 1, player.title)}
              className="max-h-full w-full max-w-6xl rounded-2xl bg-night shadow-[0_0_120px_-20px_rgb(var(--accent)/0.5)]"
            />
          </div>
          {player.videos.length > 1 && (
            <div className="scrollbar-none flex gap-3 overflow-x-auto px-6 py-5">
              {player.videos.map((x, i) => (
                <button
                  key={x.id}
                  onClick={() => play(player.videos, i, player.title)}
                  className={cx(
                    'group relative w-48 shrink-0 overflow-hidden rounded-xl text-left ring-1 transition',
                    i === player.index ? 'ring-2 ring-accent' : 'ring-white/10 opacity-60 hover:opacity-100'
                  )}
                >
                  <div className="relative aspect-video bg-s2">
                    {x.thumb && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img(x.thumb, 400)} alt="" className="size-full object-cover" />
                    )}
                    <span className="absolute inset-0 grid place-items-center bg-night/30 opacity-0 transition group-hover:opacity-100">
                      <Play size={22} fill="currentColor" />
                    </span>
                    {x.runtime && (
                      <span className="absolute bottom-1.5 right-1.5 rounded bg-night/75 px-1.5 font-mono text-[10px]">
                        {Math.floor(x.runtime / 60)}:{String(x.runtime % 60).padStart(2, '0')}
                      </span>
                    )}
                  </div>
                  <div className="truncate bg-s2 px-2.5 py-2 text-xs">{x.name}</div>
                </button>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
