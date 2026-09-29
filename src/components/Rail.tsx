'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cx } from '@/lib/format';

/**
 * Horizontal, snap-scrolling shelf with edge-fade and paging arrows.
 * Children are laid out in a single row; bleeds to the viewport edge.
 */
export function Rail({ children, className, gap = 'gap-4 sm:gap-5' }: { children: ReactNode; className?: string; gap?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8 });
  }, []);

  useEffect(() => {
    update();
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [update]);

  const page = (dir: 1 | -1) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: 'smooth' });
  };

  return (
    <div className={cx('group/rail relative', className)}>
      <div
        ref={ref}
        onScroll={update}
        className={cx(
          'scrollbar-none flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain scroll-px-4 px-4 pb-4 pt-2 sm:scroll-px-8 sm:px-8 lg:scroll-px-12 lg:px-12',
          gap
        )}
      >
        {children}
        <div aria-hidden className="w-1 shrink-0" />
      </div>
      <Arrow side="left" hidden={edges.start} onClick={() => page(-1)} />
      <Arrow side="right" hidden={edges.end} onClick={() => page(1)} />
    </div>
  );
}

function Arrow({ side, hidden, onClick }: { side: 'left' | 'right'; hidden: boolean; onClick: () => void }) {
  return (
    <button
      aria-label={side === 'left' ? 'Scroll left' : 'Scroll right'}
      onClick={onClick}
      className={cx(
        'absolute top-0 bottom-6 z-30 hidden w-16 items-center transition-opacity duration-300 md:flex',
        side === 'left' ? 'left-0 justify-start pl-3' : 'right-0 justify-end pr-3',
        hidden ? 'pointer-events-none opacity-0' : 'opacity-0 group-hover/rail:opacity-100'
      )}
    >
      <span className="glass grid size-11 place-items-center rounded-full transition-transform active:scale-95">
        {side === 'left' ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
      </span>
    </button>
  );
}
