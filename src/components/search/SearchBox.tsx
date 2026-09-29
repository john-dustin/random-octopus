'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Search, ArrowRight, Loader2 } from 'lucide-react';

/** Big editorial search field. Submits to /search?q=… */
export function SearchBox({ initial }: { initial: string }) {
  const router = useRouter();
  const [q, setQ] = useState(initial);
  const [pending, start] = useTransition();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const t = q.trim();
        if (t) start(() => router.push(`/search?q=${encodeURIComponent(t)}`));
      }}
      className="group relative flex max-w-4xl items-center border-b border-line-strong transition-colors focus-within:border-accent"
    >
      <Search className="mr-3 shrink-0 text-faint transition-colors group-focus-within:text-accent sm:mr-5" size={28} />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Films, series, people…"
        autoFocus={!initial}
        spellCheck={false}
        className="display h-20 w-full min-w-0 bg-transparent text-[clamp(2.2rem,6vw,4.5rem)] outline-none placeholder:text-faint/60 sm:h-28"
      />
      <button
        type="submit"
        aria-label="Search"
        className="grid size-12 shrink-0 place-items-center rounded-full bg-leaf text-night transition hover:scale-105 active:scale-95"
      >
        {pending ? <Loader2 size={20} className="animate-spin" /> : <ArrowRight size={20} />}
      </button>
    </form>
  );
}
