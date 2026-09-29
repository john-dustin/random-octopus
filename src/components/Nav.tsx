'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useId, useState } from 'react';
import { motion, useMotionValueEvent, useScroll } from 'motion/react';
import { Search, Bookmark, House, Compass, Trophy, Dices, Swords } from 'lucide-react';
import { cx } from '@/lib/format';
import { useLibrary, useUI } from '@/lib/store';
import { useMounted } from '@/lib/hooks';

const LINKS = [
  { href: '/', label: 'Home', icon: House },
  { href: '/discover', label: 'Discover', icon: Compass },
  { href: '/charts/top-movies', label: 'Charts', match: '/charts', icon: Trophy },
  { href: '/roulette', label: 'Roulette', icon: Dices },
  { href: '/compare', label: 'Versus', icon: Swords },
];

/** App-icon style mark: a layered spruce on a pine-green squircle. */
export function AppIcon({ size = 30 }: { size?: number }) {
  // Unique gradient ids: several icons render at once (desktop + phone headers, footer).
  const uid = useId().replace(/:/g, '');
  const bg = `ai-bg-${uid}`;
  const tree = `ai-tree-${uid}`;
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden className="shrink-0 drop-shadow-[0_2px_6px_rgb(0_0_0/0.4)]">
      <defs>
        <linearGradient id={bg} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2f9a63" />
          <stop offset="1" stopColor="#0f3d27" />
        </linearGradient>
        <linearGradient id={tree} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#d8f3e3" />
        </linearGradient>
      </defs>
      {/* superellipse-ish squircle */}
      <path d="M32 0C8 0 0 8 0 32s8 32 32 32 32-8 32-32S56 0 32 0Z" fill={`url(#${bg})`} />
      <path d="M32 0C8 0 0 8 0 32s8 32 32 32 32-8 32-32S56 0 32 0Z" fill="none" stroke="rgb(255 255 255 / 0.18)" strokeWidth="1" />
      <g fill={`url(#${tree})`}>
        <path d="M32 11 L41 24 H36 L44 35 H38 L47 47 H17 L26 35 H20 L28 24 H23 Z" />
        <rect x="29.5" y="47" width="5" height="7" rx="1.5" />
      </g>
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cx('flex items-center gap-2.5', className)} aria-label="Lumière home">
      <AppIcon />
      <span className="text-[17px] font-semibold tracking-[-0.02em]">Lumière</span>
    </Link>
  );
}

export function Nav() {
  const path = usePathname();
  const setPalette = useUI((s) => s.setPalette);
  const count = useLibrary((s) => Object.keys(s.watchlist).length);
  const mounted = useMounted();

  // iOS 26 behaviour: chrome minimises while you read downward, returns on any upward scroll.
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [overContent, setOverContent] = useState(false);
  useMotionValueEvent(scrollY, 'change', (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setOverContent(y > 60);
    if (y < 120) setHidden(false);
    else if (y - prev > 4) setHidden(true);
    else if (prev - y > 4) setHidden(false);
  });

  // Sticky sub-bars (title section nav, chart toolbar) dock beneath the capsule, or to the top when it's tucked.
  useEffect(() => {
    document.documentElement.style.setProperty('--nav-offset', hidden ? '0px' : '4.75rem');
  }, [hidden]);

  const isActive = (l: (typeof LINKS)[number]) => (l.href === '/' ? path === '/' : path.startsWith(l.match ?? l.href));

  return (
    <>
      {/* ---------- Desktop / tablet: a floating glass capsule ---------- */}
      <motion.header
        initial={false}
        animate={{ y: hidden ? -96 : 0, opacity: hidden ? 0 : 1 }}
        transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
        className="fixed inset-x-0 top-3 z-50 hidden px-4 md:block"
      >
        <div className="mx-auto flex max-w-[1180px] items-center gap-3">
          <div className={cx('glass flex h-14 items-center rounded-full pl-2.5 pr-5 transition-[background-color]', overContent && 'glass-strong')}>
            <Logo />
          </div>

          <nav className={cx('glass mx-auto flex h-14 items-center gap-1 rounded-full px-1.5 transition-[background-color]', overContent && 'glass-strong')} aria-label="Primary">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cx(
                  'relative flex h-11 items-center rounded-full px-4 text-[15px] font-medium transition-colors',
                  isActive(l) ? 'text-white' : 'text-white/65 hover:text-white'
                )}
              >
                {isActive(l) && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 -z-10 rounded-full bg-white/[0.14] shadow-[inset_0_1px_0_rgb(255_255_255/0.16)]"
                    transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                  />
                )}
                {l.label}
              </Link>
            ))}
          </nav>

          <div className={cx('glass flex h-14 items-center gap-1 rounded-full px-1.5 transition-[background-color]', overContent && 'glass-strong')}>
            <button
              onClick={() => setPalette(true)}
              className="flex h-11 items-center gap-2 rounded-full px-3.5 text-[15px] text-white/65 transition hover:bg-white/10 hover:text-white"
              aria-label="Search"
            >
              <Search size={18} strokeWidth={2.2} />
              <span className="hidden lg:inline">Search</span>
              <kbd className="ml-1 hidden rounded-md bg-white/10 px-1.5 py-0.5 text-[11px] font-medium text-white/55 lg:inline">⌘K</kbd>
            </button>
            <Link
              href="/library"
              className={cx(
                'relative grid size-11 place-items-center rounded-full transition hover:bg-white/10',
                path.startsWith('/library') ? 'bg-white/[0.14] text-white' : 'text-white/65 hover:text-white'
              )}
              aria-label="Your library"
            >
              <Bookmark size={18} strokeWidth={2.2} />
              {mounted && count > 0 && (
                <span className="absolute right-0.5 top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-danger px-1 text-[11px] font-semibold text-white">
                  {count}
                </span>
              )}
            </Link>
          </div>
        </div>
      </motion.header>

      {/* ---------- Phone: compact top bar + iOS tab bar ---------- */}
      <motion.header
        initial={false}
        animate={{ y: hidden ? -80 : 0 }}
        transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
        className="fixed inset-x-0 top-0 z-50 px-4 pt-[max(env(safe-area-inset-top),10px)] md:hidden"
      >
        <div className="flex h-12 items-center justify-between">
          <div className={cx('glass flex h-11 items-center rounded-full pl-1.5 pr-4', overContent && 'glass-strong')}>
            <Logo />
          </div>
          <Link href="/library" className={cx('glass relative grid size-11 place-items-center rounded-full', overContent && 'glass-strong')} aria-label="Your library">
            <Bookmark size={18} strokeWidth={2.2} />
            {mounted && count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-danger px-1 text-[11px] font-semibold">
                {count}
              </span>
            )}
          </Link>
        </div>
      </motion.header>

      <nav
        aria-label="Tabs"
        className="fixed inset-x-0 bottom-0 z-50 flex items-end gap-2.5 px-3 pb-[max(env(safe-area-inset-bottom),12px)] md:hidden"
      >
        <div className="glass glass-strong flex h-[62px] flex-1 items-center justify-around rounded-full px-1">
          {LINKS.map((l) => {
            const Icon = l.icon;
            const on = isActive(l);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cx('relative flex h-[54px] flex-1 flex-col items-center justify-center gap-0.5 rounded-full text-[10px] font-medium', on ? 'text-pine' : 'text-white/70')}
              >
                {on && (
                  <motion.span
                    layoutId="tab-pill"
                    className="absolute inset-0 -z-10 rounded-full bg-white/[0.12]"
                    transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                  />
                )}
                <Icon size={21} strokeWidth={on ? 2.4 : 2} />
                {l.label}
              </Link>
            );
          })}
        </div>
        <button onClick={() => setPalette(true)} className="glass glass-strong grid size-[62px] shrink-0 place-items-center rounded-full" aria-label="Search">
          <Search size={22} strokeWidth={2.2} />
        </button>
      </nav>
    </>
  );
}
