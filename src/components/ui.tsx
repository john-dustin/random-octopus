import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';
import { cx, ratingColor } from '@/lib/format';
import { ChevronRight } from 'lucide-react';

/* ------------------------------------------------------------------ */
/* Buttons                                                             */
/* ------------------------------------------------------------------ */

type Variant = 'primary' | 'glass' | 'ghost' | 'outline';

// iOS button roles: a white filled capsule for the primary action (as in the TV app's Play),
// Liquid Glass for secondary, plain text for tertiary.
const VARIANTS: Record<Variant, string> = {
  primary: 'bg-white text-black font-semibold shadow-[0_6px_20px_-6px_rgb(0_0_0/0.5)] hover:bg-white/90',
  glass: 'glass text-fg hover:bg-white/[0.16]',
  ghost: 'text-pine hover:bg-white/[0.06]',
  outline: 'bg-white/[0.08] text-fg hover:bg-white/[0.14]',
};

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-[-0.01em] transition-[background-color,transform,opacity,filter] duration-200 active:scale-[0.96] disabled:opacity-40 disabled:pointer-events-none select-none whitespace-nowrap';

const SIZES = { sm: 'h-8 px-3.5 text-[13px]', md: 'h-11 px-5 text-[15px]', lg: 'h-[50px] px-7 text-[17px]' };

export function Button({
  variant = 'glass',
  size = 'md',
  className,
  ...p
}: ComponentProps<'button'> & { variant?: Variant; size?: keyof typeof SIZES }) {
  return <button {...p} className={cx(base, VARIANTS[variant], SIZES[size], className)} />;
}

export function ButtonLink({
  variant = 'glass',
  size = 'md',
  className,
  ...p
}: ComponentProps<typeof Link> & { variant?: Variant; size?: keyof typeof SIZES }) {
  return <Link {...p} className={cx(base, VARIANTS[variant], SIZES[size], className)} />;
}

export function IconButton({ className, label, ...p }: ComponentProps<'button'> & { label: string }) {
  return (
    <button
      aria-label={label}
      title={label}
      {...p}
      className={cx(
        'grid size-11 place-items-center rounded-full glass text-fg transition-[background-color,transform] duration-200 hover:bg-white/[0.16] active:scale-95 disabled:opacity-30 disabled:pointer-events-none',
        className
      )}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Chips & badges                                                      */
/* ------------------------------------------------------------------ */

export function Chip({
  active,
  className,
  ...p
}: ComponentProps<'button'> & { active?: boolean }) {
  return (
    <button
      {...p}
      aria-pressed={active}
      className={cx(
        'h-9 rounded-full px-4 text-[14px] font-medium transition-colors duration-200 select-none',
        active ? 'bg-white text-black' : 'bg-white/[0.08] text-white/80 hover:bg-white/[0.14] hover:text-white',
        className
      )}
    />
  );
}

export function Tag({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cx('inline-flex h-[22px] items-center rounded-[6px] border border-white/25 px-1.5 text-[11px] font-semibold tracking-wide text-white/75', className)}>
      {children}
    </span>
  );
}

export function RatingBadge({ value, className }: { value?: number; className?: string }) {
  if (value == null) return null;
  return (
    <span
      className={cx('inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[12px] font-semibold tabular text-white backdrop-blur-md', className)}
    >
      <span style={{ color: 'var(--gold)' }}>★</span> {value.toFixed(1)}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Rating ring — a circular gauge                                      */
/* ------------------------------------------------------------------ */

export function RatingRing({
  value,
  max = 10,
  size = 64,
  stroke = 4,
  label,
  sub,
}: {
  value?: number;
  max?: number;
  size?: number;
  stroke?: number;
  label?: string;
  sub?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = value != null ? Math.max(0, Math.min(1, value / max)) : 0;
  const color = ratingColor(value != null ? (value / max) * 10 : undefined);
  return (
    <div className="flex items-center gap-3">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(120 120 128 / 0.32)" strokeWidth={stroke} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - pct)}
            style={{ transition: 'stroke-dashoffset 1.2s var(--ease-out)' }}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <span className="text-[15px] font-bold tabular tracking-[-0.02em]" style={{ fontSize: size * 0.28 }}>
            {value != null ? (max === 100 ? Math.round(value) : value.toFixed(1)) : '–'}
          </span>
        </div>
      </div>
      {(label || sub) && (
        <div className="leading-tight">
          {label && <div className="text-sm font-medium text-fg">{label}</div>}
          {sub && <div className="text-xs text-faint">{sub}</div>}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Section scaffolding                                                 */
/* ------------------------------------------------------------------ */

export function SectionHeader({
  eyebrow,
  title,
  href,
  hrefLabel = 'See All',
  children,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  href?: string;
  hrefLabel?: string;
  children?: ReactNode;
  className?: string;
}) {
  // iOS shelf header: optional caption, bold title, tinted "See All ›" aligned to the baseline.
  return (
    <div className={cx('mb-4 flex items-end justify-between gap-6', className)}>
      <div className="min-w-0">
        {eyebrow && <div className="eyebrow mb-1.5">{eyebrow}</div>}
        <h2 className="display text-[clamp(1.5rem,2.4vw,2.1rem)]">{title}</h2>
      </div>
      <div className="flex shrink-0 items-center gap-2 pb-1">
        {children}
        {href && (
          <Link href={href} className="inline-flex items-center gap-0.5 text-[15px] font-medium text-pine transition-opacity hover:opacity-75">
            {hrefLabel}
            <ChevronRight size={18} strokeWidth={2.4} className="-mr-1" />
          </Link>
        )}
      </div>
    </div>
  );
}

export function Container({ className, ...p }: ComponentProps<'div'>) {
  return <div {...p} className={cx('mx-auto w-full max-w-[1680px] px-4 sm:px-8 lg:px-12', className)} />;
}

export function Empty({ title, children, icon }: { title: string; children?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="panel flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
      {icon && <div className="text-faint">{icon}</div>}
      <div className="display text-3xl">{title}</div>
      {children && <div className="max-w-md text-sm text-muted">{children}</div>}
    </div>
  );
}
