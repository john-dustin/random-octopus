import Link from 'next/link';
import { Dices } from 'lucide-react';
import { poster } from '@/lib/format';
import { Container } from '@/components/ui';

/** A promo card (App Store "Today" style) inviting the user to spin the roulette. */
export function RouletteTeaser({ posters }: { posters: string[] }) {
  const cols = [0, 1, 2, 3, 4].map((c) => posters.filter((_, i) => i % 5 === c));
  return (
    <section className="mt-16">
      <Container>
        <div className="relative isolate grid overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,#0f3d27,#07170f)] ring-[0.5px] ring-white/10 lg:grid-cols-2">
          <div className="relative z-10 flex flex-col justify-center gap-5 p-8 sm:p-12 lg:p-14">
            <div className="eyebrow text-pine">Movie Roulette</div>
            <h2 className="display text-[clamp(2.2rem,4.4vw,3.8rem)]">
              Can’t decide? <br />
              Let the reel pick.
            </h2>
            <p className="max-w-md text-[17px] leading-relaxed text-white/70">
              Choose a mood, a decade and how long you’ve got. We’ll spin the reel and put tonight’s film in the spotlight.
            </p>
            <div>
              <Link
                href="/roulette"
                className="inline-flex h-[50px] items-center gap-2.5 rounded-full bg-white pl-5 pr-6 text-[17px] font-semibold tracking-[-0.01em] text-black transition active:scale-[0.96] hover:bg-white/90"
              >
                <Dices size={19} /> Spin the Reel
              </Link>
            </div>
          </div>
          <div aria-hidden className="relative h-[340px] overflow-hidden lg:h-[480px]">
            <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#0c3322] via-transparent to-transparent max-lg:bg-gradient-to-b" />
            <div className="flex h-full -rotate-6 scale-110 gap-3 px-3">
              {cols.map((col, c) => (
                <div
                  key={c}
                  className="flex w-1/5 flex-col gap-3"
                  style={{ animation: `reel ${40 + c * 6}s linear infinite`, animationDirection: c % 2 ? 'reverse' : 'normal' }}
                >
                  {[...col, ...col].map((p, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={i} src={poster(p, 200)} alt="" loading="lazy" className="aspect-[2/3] w-full rounded-[10px] object-cover opacity-90" />
                  ))}
                </div>
              ))}
            </div>
            <style>{`@keyframes reel { from { transform: translateY(0) } to { transform: translateY(-50%) } }`}</style>
          </div>
        </div>
      </Container>
    </section>
  );
}
