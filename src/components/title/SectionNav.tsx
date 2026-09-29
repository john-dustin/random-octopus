'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { cx } from '@/lib/format';

/** Sticky in-page jump bar that highlights the section currently in view. */
export function SectionNav({ sections }: { sections: { id: string; label: string }[] }) {
  const [active, setActive] = useState(sections[0]?.id);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const els = sections.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (vis[0]) setActive(vis[0].target.id);
      },
      { rootMargin: '-140px 0px -55% 0px' }
    );
    els.forEach((el) => io.observe(el));
    const onScroll = () => setStuck(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, [sections]);

  if (sections.length < 3) return null;

  return (
    <div
      className={cx(
        'sticky top-[var(--nav-offset,4rem)] z-40 border-b transition-all duration-500',
        stuck ? 'border-line bg-bg/75 backdrop-blur-xl' : 'border-transparent'
      )}
    >
      <nav className="scrollbar-none mx-auto flex w-full max-w-[1680px] gap-1 overflow-x-auto px-4 py-2.5 sm:px-8 lg:px-12" aria-label="Sections">
        {sections.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            onClick={(e) => {
              e.preventDefault();
              document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              history.replaceState(null, '', `#${s.id}`);
            }}
            className={cx(
              'relative shrink-0 rounded-full px-3.5 py-1.5 text-[13px] transition-colors',
              active === s.id ? 'text-fg' : 'text-faint hover:text-muted'
            )}
          >
            {active === s.id && (
              <motion.span
                layoutId="title-section-pill"
                className="absolute inset-0 -z-10 rounded-full bg-white/[0.08] ring-1 ring-white/10"
                transition={{ type: 'spring', stiffness: 400, damping: 34 }}
              />
            )}
            {s.label}
          </a>
        ))}
      </nav>
    </div>
  );
}
