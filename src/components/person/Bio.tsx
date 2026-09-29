'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cx } from '@/lib/format';

export function Bio({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const paras = text.split(/\n+/).map((p) => p.trim()).filter(Boolean);
  const long = text.length > 420;
  return (
    <div className="mt-7 max-w-3xl">
      <div className={cx('relative overflow-hidden transition-[max-height] duration-700 ease-out-expo', open || !long ? 'max-h-[4000px]' : 'max-h-[7.6rem]')}>
        <div className="space-y-4 text-[15.5px] leading-relaxed text-fg/80">
          {paras.map((p, i) => (
            <p key={i} className={i === 0 ? 'first-letter:font-display first-letter:float-left first-letter:mr-2 first-letter:text-[3.4rem] first-letter:leading-[0.85] first-letter:text-accent' : ''}>
              {p}
            </p>
          ))}
        </div>
        {long && !open && <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-bg to-transparent" />}
      </div>
      {long && (
        <button
          onClick={() => setOpen((o) => !o)}
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-accent transition-opacity hover:opacity-80"
        >
          {open ? 'Show less' : 'Read full biography'}
          <ChevronDown size={15} className={cx('transition-transform duration-300', open && 'rotate-180')} />
        </button>
      )}
    </div>
  );
}
