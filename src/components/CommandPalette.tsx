'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Search, Film, User, Tv, Compass, Dices, Trophy, Bookmark, Swords, CornerDownLeft, Clock } from 'lucide-react';
import type { Suggestion } from '@/lib/types';
import { cx, img } from '@/lib/format';
import { useLibrary, useUI } from '@/lib/store';
import { useHotkey } from '@/lib/hooks';

const SHORTCUTS = [
  { label: 'Discover', hint: 'Filter the whole IMDb catalogue', href: '/discover', icon: Compass },
  { label: 'Movie Roulette', hint: 'Can’t decide? Spin the reel', href: '/roulette', icon: Dices },
  { label: 'Top 250 Movies', hint: 'The all-time canon', href: '/charts/top-movies', icon: Trophy },
  { label: 'Versus', hint: 'Put two titles head-to-head', href: '/compare', icon: Swords },
  { label: 'Your Library', hint: 'Watchlist, diary & stats', href: '/library', icon: Bookmark },
];

type Item =
  | { kind: 'suggestion'; s: Suggestion }
  | { kind: 'shortcut'; label: string; hint: string; href: string; icon: typeof Film }
  | { kind: 'all'; q: string };

export function CommandPalette() {
  const open = useUI((s) => s.paletteOpen);
  const setOpen = useUI((s) => s.setPalette);

  useHotkey('k', (e) => { e.preventDefault(); setOpen(!useUI.getState().paletteOpen); }, { meta: true });
  useHotkey('/', (e) => { e.preventDefault(); setOpen(true); });

  // The dialog mounts fresh each time, so its query/results state resets on close.
  return <AnimatePresence>{open && <PaletteDialog onClose={() => setOpen(false)} />}</AnimatePresence>;
}

function PaletteDialog({ onClose }: { onClose: () => void }) {
  const recent = useLibrary((s) => s.recent);
  const router = useRouter();
  const [q, setQ] = useState('');
  const [found, setFound] = useState<{ term: string; items: Suggestion[] }>({ term: '', items: [] });
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const term = q.trim();
  const results = useMemo(() => (term ? found.items : []), [term, found.items]);
  const loading = !!term && found.term !== term;

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 30);
    document.body.style.overflow = 'hidden';
    return () => {
      clearTimeout(t);
      document.body.style.overflow = '';
    };
  }, []);

  // Debounced suggest
  useEffect(() => {
    if (!term) return;
    const ctl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/suggest?q=${encodeURIComponent(term)}`, { signal: ctl.signal });
        setFound({ term, items: await r.json() });
        setActive(0);
      } catch {
        /* aborted */
      }
    }, 110);
    return () => {
      clearTimeout(t);
      ctl.abort();
    };
  }, [term]);

  const items: Item[] = useMemo(() => {
    if (term) return [...results.map((s) => ({ kind: 'suggestion' as const, s })), { kind: 'all' as const, q: term }];
    const rec: Item[] = recent.slice(0, 5).map((c) => ({
      kind: 'suggestion',
      s: { id: c.id, label: c.title, year: c.year, img: c.poster, kind: 'title', sub: c.typeText, qid: 'recent' },
    }));
    return [...rec, ...SHORTCUTS.map((s) => ({ kind: 'shortcut' as const, ...s }))];
  }, [term, results, recent]);

  const go = useCallback(
    (it: Item) => {
      onClose();
      if (it.kind === 'suggestion') router.push(it.s.kind === 'title' ? `/title/${it.s.id}` : `/name/${it.s.id}`);
      else if (it.kind === 'shortcut') router.push(it.href);
      else router.push(`/search?q=${encodeURIComponent(it.q)}`);
    },
    [router, onClose]
  );

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(items.length - 1, a + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); const it = items[active]; if (it) go(it); }
    else if (e.key === 'Escape') onClose();
  };

  useEffect(() => {
    listRef.current?.querySelector(`[data-idx="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const recentCount = Math.min(recent.length, 5);

  return (
    <motion.div
      className="fixed inset-0 z-[80] flex items-start justify-center px-4 pt-[12vh]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
    >
      <div className="absolute inset-0 bg-night/70 backdrop-blur-md" onClick={onClose} />
      <motion.div
        role="dialog"
        aria-label="Search"
        initial={{ opacity: 0, y: -16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 420, damping: 34 }}
        className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-line-strong bg-s1/95 shadow-[0_40px_120px_-20px_rgb(0_0_0/0.9)]"
      >
        <div className="flex items-center gap-3 border-b border-line px-5">
          <Search size={20} className={cx('shrink-0 transition-colors', loading ? 'animate-pulse text-gold' : 'text-faint')} />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKey}
            placeholder="Search for a film, series, or person…"
            className="h-16 w-full bg-transparent text-lg outline-none placeholder:text-faint focus-visible:outline-none"
            spellCheck={false}
            autoComplete="off"
          />
          <kbd className="rounded-md border border-line-strong px-1.5 py-0.5 font-mono text-[10px] text-faint">ESC</kbd>
        </div>
        <div ref={listRef} className="max-h-[56vh] overflow-y-auto p-2">
          {!term && recentCount > 0 && <div className="eyebrow px-3 pb-1 pt-2">Recently viewed</div>}
          {items.map((it, i) => (
            <div key={i}>
              {!term && i === recentCount && <div className="eyebrow px-3 pb-1 pt-3">Jump to</div>}
              <Row it={it} i={i} active={active} setActive={setActive} go={go} />
            </div>
          ))}
          {term && !loading && results.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-faint">Nothing in the archive for “{term}”. Try another spelling.</div>
          )}
        </div>
        <div className="flex items-center gap-4 border-t border-line px-5 py-2.5 text-[11px] text-faint">
          <span><kbd className="font-mono">↑↓</kbd> navigate</span>
          <span><kbd className="font-mono">↵</kbd> open</span>
          <span className="ml-auto">Data from IMDb</span>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Row({ it, i, active, setActive, go }: { it: Item; i: number; active: number; setActive: (i: number) => void; go: (it: Item) => void }) {
  const isActive = i === active;
  const common = cx(
    'flex w-full items-center gap-3.5 rounded-2xl px-3 py-2.5 text-left transition-colors',
    isActive ? 'bg-white/[0.07]' : 'hover:bg-white/[0.04]'
  );
  if (it.kind === 'all')
    return (
      <button data-idx={i} className={common} onMouseEnter={() => setActive(i)} onClick={() => go(it)}>
        <span className="grid size-10 place-items-center rounded-xl bg-s3 text-muted"><Search size={16} /></span>
        <span className="text-sm">See all results for <span className="text-gold">“{it.q}”</span></span>
        {isActive && <CornerDownLeft size={14} className="ml-auto text-faint" />}
      </button>
    );
  if (it.kind === 'shortcut') {
    const Icon = it.icon;
    return (
      <button data-idx={i} className={common} onMouseEnter={() => setActive(i)} onClick={() => go(it)}>
        <span className="grid size-10 place-items-center rounded-xl bg-s3 text-gold"><Icon size={17} /></span>
        <span>
          <span className="block text-sm font-medium">{it.label}</span>
          <span className="block text-xs text-faint">{it.hint}</span>
        </span>
        {isActive && <CornerDownLeft size={14} className="ml-auto text-faint" />}
      </button>
    );
  }
  const s = it.s;
  const isPerson = s.kind === 'name';
  const TypeIcon = s.qid === 'recent' ? Clock : isPerson ? User : s.qid === 'tvSeries' || s.qid === 'tvMiniSeries' ? Tv : Film;
  return (
    <button data-idx={i} className={common} onMouseEnter={() => setActive(i)} onClick={() => go(it)}>
      <span className={cx('relative shrink-0 overflow-hidden bg-s3', isPerson ? 'size-11 rounded-full' : 'h-14 w-10 rounded-lg')}>
        {s.img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img(s.img, 80, isPerson ? 80 : 120)} alt="" className="size-full object-cover" />
        ) : (
          <span className="grid size-full place-items-center text-faint"><TypeIcon size={16} /></span>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-medium">{s.label}</span>
        <span className="flex items-center gap-1.5 truncate text-xs text-faint">
          <TypeIcon size={11} />
          {[s.year, s.sub].filter(Boolean).join(' · ')}
        </span>
      </span>
      {isActive && <CornerDownLeft size={14} className="text-faint" />}
    </button>
  );
}
