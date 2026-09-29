'use client';

import { useState } from 'react';
import { cx, money } from '@/lib/format';
import { Heading } from './Sections';

type Props = {
  budget?: { amount: number; currency: string };
  domestic?: number;
  gross?: number;
  opening?: number;
};

/**
 * Magnitude comparison of budget vs domestic vs worldwide gross.
 * One measure (money) → one axis, horizontal bars, single accent hue with the
 * budget in neutral ink, direct labels, hover readout with exact figures.
 */
export function BoxOffice({ budget, domestic, gross, opening }: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const usdBudget = budget && budget.currency === 'USD' ? budget.amount : undefined;
  const rows = [
    { key: 'budget', label: 'Production budget', value: usdBudget, tone: 'neutral' as const },
    { key: 'domestic', label: 'Domestic gross', sub: 'US & Canada', value: domestic, tone: 'soft' as const },
    { key: 'worldwide', label: 'Worldwide gross', value: gross, tone: 'strong' as const },
  ].filter((r) => r.value);

  if (!rows.length && !budget) return null;
  const max = Math.max(...rows.map((r) => r.value ?? 0), 1);
  const roi = usdBudget && gross ? gross / usdBudget : undefined;
  const exact = (n: number) => new Intl.NumberFormat('en', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

  return (
    <section id="box-office" className="scroll-mt-32">
      <Heading eyebrow="The business" title="Box office" />
      <div className="panel grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_220px]">
        <div>
          {rows.length > 0 ? (
            <div className="space-y-5" onMouseLeave={() => setHover(null)}>
              {rows.map((r, i) => {
                const pct = ((r.value ?? 0) / max) * 100;
                return (
                  <div
                    key={r.key}
                    className="group cursor-default"
                    onMouseEnter={() => setHover(i)}
                    onFocus={() => setHover(i)}
                    tabIndex={0}
                    aria-label={`${r.label}: ${exact(r.value!)}`}
                  >
                    <div className="mb-2 flex items-baseline justify-between gap-3 text-sm">
                      <span className="text-muted">
                        {r.label}
                        {r.sub && <span className="ml-1.5 text-xs text-faint">{r.sub}</span>}
                      </span>
                      <span className="font-mono tabular text-fg">
                        {hover === i ? exact(r.value!) : money(r.value)}
                      </span>
                    </div>
                    <div className="relative h-3 rounded-[4px] bg-white/[0.04]">
                      <div
                        className={cx(
                          'absolute inset-y-0 left-0 rounded-[4px] transition-[width,opacity] duration-1000 ease-out-expo',
                          hover != null && hover !== i && 'opacity-40'
                        )}
                        style={{
                          width: `${Math.max(pct, 1.2)}%`,
                          background:
                            r.tone === 'neutral'
                              ? 'var(--fg-faint)'
                              : r.tone === 'soft'
                                ? 'rgb(var(--accent) / 0.55)'
                                : 'rgb(var(--accent))',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted">
              Budget reported as {money(budget!.amount, budget!.currency)}. No gross figures published yet.
            </p>
          )}
          {budget && budget.currency !== 'USD' && rows.length > 0 && (
            <p className="mt-5 text-xs text-faint">
              Budget reported in {budget.currency} ({money(budget.amount, budget.currency)}) — not comparable on this scale.
            </p>
          )}
        </div>

        <div className="flex flex-row gap-6 border-line lg:flex-col lg:border-l lg:pl-8">
          {roi != null && (
            <div>
              <div className="display text-6xl tabular">
                {roi >= 10 ? roi.toFixed(0) : roi.toFixed(1)}
                <span className="text-3xl text-faint">×</span>
              </div>
              <div className="mt-1 text-xs text-faint">worldwide gross vs budget</div>
            </div>
          )}
          {opening != null && (
            <div>
              <div className="font-mono text-2xl font-semibold tabular">{money(opening)}</div>
              <div className="mt-1 text-xs text-faint">domestic opening weekend</div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
