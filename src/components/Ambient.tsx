'use client';

import { useEffect } from 'react';
import { useImageColor } from '@/lib/hooks';

/**
 * Tints the whole page with the dominant colour of an image:
 * sets `--accent` on <html> and paints a slow, blurred colour wash
 * behind the content. Restores the house gold on unmount.
 */
export function Ambient({ image, intensity = 0.22 }: { image?: string | null; intensity?: number }) {
  const color = useImageColor(image);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--accent', color);
    return () => {
      root.style.setProperty('--accent', '143 212 107');
    };
  }, [color]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute -top-[30vh] left-1/2 h-[90vh] w-[120vw] -translate-x-1/2 rounded-full blur-[120px] transition-[background] duration-[1500ms]"
        style={{ background: `radial-gradient(closest-side, rgb(${color} / ${intensity}), transparent)` }}
      />
    </div>
  );
}
