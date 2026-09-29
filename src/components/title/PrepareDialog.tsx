'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { X, Download, ExternalLink, Loader2, Film, Check } from 'lucide-react';
import type { Card } from '@/lib/types';
import { Button } from '@/components/ui';
import { useUI } from '@/lib/store';
import { cx } from '@/lib/format';

export type PrepareOption = {
  quality?: string;
  codec?: string | null;
  size?: string;
  [key: string]: unknown;
};

export type PrepareResult = {
  ok?: boolean;
  handle?: string;
  target?: string;
  kind?: string;
  title?: string;
  season?: number | null;
  imdb_id?: string;
  imdb_url?: string;
  poster?: string;
  option_kind?: string;
  options?: PrepareOption[];
  expires_hint?: string;
  error?: string;
  [key: string]: unknown;
};

/** Sort qualities high→low (1080, 720, 480…); unknown values sink to the end. */
const rank = (o: PrepareOption) => parseInt(String(o.quality ?? '').replace(/\D/g, ''), 10) || 0;
const ordered = (options: PrepareOption[]) => [...options].sort((a, b) => rank(b) - rank(a));

const label = (quality?: string) => (quality ? (/\d/.test(quality) ? `${parseInt(quality, 10)}p` : quality) : '—');

export function PrepareDialog({
  result,
  card,
  onClose,
}: {
  result: PrepareResult | null;
  card: Card;
  onClose: () => void;
}) {
  const toast = useUI((s) => s.toast);
  const [data, setData] = useState<PrepareResult | null>(result);
  const [busy, setBusy] = useState<string | null>(null);
  const [grabbed, setGrabbed] = useState<string | null>(null);
  const [imgFailed, setImgFailed] = useState(false);
  const [seen, setSeen] = useState<PrepareResult | null>(result);

  // Reset the local view whenever a fresh prepare result arrives (state-adjust during render).
  if (seen !== result) {
    setSeen(result);
    setData(result);
    setGrabbed(null);
    setImgFailed(false);
  }

  useEffect(() => {
    if (!result) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [result, onClose]);

  const options = ordered(data?.options ?? []);
  const poster = data?.poster && !imgFailed ? data.poster : card.poster;

  const grab = async (option: PrepareOption) => {
    const key = `${option.quality}`;
    setBusy(key);
    try {
      const res = await fetch('/api/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle: data?.handle, quality: label(option.quality) }),
      });
      const body: { direct_url?: string; error?: string; detail?: string } | null = await res.json().catch(() => null);
      if (!res.ok || !body?.direct_url) {
        toast(body?.error ?? 'Could not resolve this quality', 'x');
        return;
      }
      window.open(body.direct_url, '_blank', 'noopener,noreferrer');
      setGrabbed(key);
      toast(`Opening ${label(option.quality)}`, 'check');
    } catch {
      toast('Could not reach the resolve service', 'x');
    } finally {
      setBusy(null);
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {result && (
        <motion.div
          className="fixed inset-0 z-[88] flex justify-center overflow-y-auto bg-night/80 p-4 backdrop-blur-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Available downloads"
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className="panel my-auto max-h-[88vh] w-full max-w-lg overflow-y-auto p-6"
          >
            <div className="flex items-start gap-4">
              {poster && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={poster}
                  alt=""
                  onError={() => setImgFailed(true)}
                  className="h-28 w-20 shrink-0 rounded-xl object-cover ring-1 ring-white/10"
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="eyebrow mb-1 flex items-center gap-1.5 text-gold">
                  <Film size={12} strokeWidth={2.6} />
                  {data?.kind === 'series' ? 'Series' : 'Movie'}
                  {data?.option_kind ? ` · ${data.option_kind}` : ''}
                </div>
                <h2 className="display text-xl leading-tight">{data?.title ?? card.title}</h2>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                  {data?.season != null && <span>Season {data.season}</span>}
                  {data?.imdb_url && (
                    <a
                      href={data.imdb_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-pine hover:underline"
                    >
                      IMDb {data.imdb_id} <ExternalLink size={11} />
                    </a>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="glass grid size-9 shrink-0 place-items-center rounded-full transition hover:rotate-90 hover:bg-white/15"
              >
                <X size={17} />
              </button>
            </div>

            <div className="mt-5 space-y-2">
              {options.length === 0 && <div className="py-6 text-center text-sm text-faint">No options returned.</div>}
              {options.map((o, i) => {
                const key = `${o.quality}`;
                const isBusy = busy === key;
                const isGrabbed = grabbed === key;
                return (
                  <motion.div
                    key={`${key}-${i}`}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className={cx(
                      'flex items-center gap-3 rounded-2xl border px-4 py-3 transition-colors',
                      isGrabbed ? 'border-ok/40 bg-ok/[0.08]' : 'border-white/10 bg-white/[0.04]'
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold tabular">{label(o.quality)}</span>
                        {o.codec && (
                          <span className="rounded-md border border-white/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/70">
                            {o.codec}
                          </span>
                        )}
                      </div>
                      {o.size && <div className="mt-0.5 font-mono text-xs text-muted">{String(o.size)}</div>}
                    </div>
                    <Button
                      size="sm"
                      variant={isGrabbed ? 'outline' : 'primary'}
                      disabled={isBusy}
                      onClick={() => grab(o)}
                      aria-label={`Grab ${label(o.quality)}`}
                    >
                      {isBusy ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : isGrabbed ? (
                        <Check size={15} />
                      ) : (
                        <Download size={15} />
                      )}
                      {isGrabbed ? 'Grabbed' : 'Grab'}
                    </Button>
                  </motion.div>
                );
              })}
            </div>

            {data?.expires_hint && (
              <p className="mt-4 text-center text-[11px] text-faint">Links {data.expires_hint}</p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
