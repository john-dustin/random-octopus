'use client';

import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';

/*
 * The pine forest, used the way iOS uses a wallpaper: a fixed photograph
 * behind every page. It starts crisp; as you scroll into content it frosts
 * and dims (like the iOS wallpaper when an app opens), so glass surfaces
 * and text always sit on a calm, legible field.
 *
 * Photo: Julian Steenbergen / Unsplash (yIWXizbj7dM) — Unsplash License.
 */
export function Wallpaper() {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const frost = useTransform(scrollY, [0, 800], [0, 0.85]);
  const dim = useTransform(scrollY, [0, 900], [0, 0.18]);
  const drift = useTransform(scrollY, [0, 3000], ['0%', reduce ? '0%' : '-4%']);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-20 overflow-hidden bg-black">
      <motion.div className="absolute inset-[-6%]" style={{ y: drift }}>
        <picture>
          <source media="(max-width: 767px) and (orientation: portrait)" srcSet="/wallpaper/pines-portrait.webp" type="image/webp" />
          <source
            srcSet="/wallpaper/pines-1280.webp 1280w, /wallpaper/pines-1920.webp 1920w, /wallpaper/pines-2880.webp 2880w"
            sizes="100vw"
            type="image/webp"
          />
          { }
          <img
            src="/wallpaper/pines-1920.jpg"
            srcSet="/wallpaper/pines-1280.jpg 1280w, /wallpaper/pines-1920.jpg 1920w, /wallpaper/pines-2880.jpg 2880w"
            sizes="100vw"
            alt=""
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 size-full object-cover"
          />
        </picture>
        {/* Pre-blurred twin, cross-faded in on scroll (cheaper than animating a blur filter) */}
        <motion.div className="absolute inset-0" style={{ opacity: frost }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/wallpaper/pines-1280.webp" alt="" decoding="async" className="absolute inset-0 size-full scale-110 object-cover blur-2xl" />
        </motion.div>
      </motion.div>

      {/* Legibility: a base dim that deepens toward the bottom, plus a scroll-linked dim */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(0_0_0/0.22)_0%,rgb(0_0_0/0.38)_45%,rgb(0_0_0/0.6)_100%)]" />
      <motion.div className="absolute inset-0 bg-black" style={{ opacity: dim }} />
    </div>
  );
}
