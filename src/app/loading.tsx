export default function Loading() {
  return (
    <div className="grid min-h-[80vh] place-items-center">
      <div className="flex flex-col items-center gap-5">
        <div className="relative size-16">
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-line border-t-gold" />
          <div className="absolute inset-3 animate-[spin_1.6s_linear_infinite_reverse] rounded-full border border-line border-b-fg/60" />
        </div>
        <div className="eyebrow animate-pulse-soft">Threading the projector…</div>
      </div>
    </div>
  );
}
