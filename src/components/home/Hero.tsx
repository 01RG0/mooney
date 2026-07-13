import Image from "next/image";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { ArrowUpRightIcon } from "@/components/ui/icons";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Signature: rippling woven thread-lines drifting off the right edge. */}
      <div
        aria-hidden
        className="thread-lines pointer-events-none absolute inset-0 opacity-70"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 top-10 h-[520px] w-[520px] rounded-full bg-rose-300/40 blur-3xl"
      />

      <Container className="relative grid items-center gap-10 py-14 lg:grid-cols-[1.05fr_1fr] lg:py-20">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-brown-900/15 bg-cream/50 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-brown-700">
            Handmade · Small batch
          </span>

          <h1 className="mt-6 font-display text-[clamp(2.9rem,7vw,5.4rem)] font-semibold leading-[0.95] text-brown-900">
            The Art of
            <br />
            Handmade in
            <br />
            <span className="italic text-rose-500">Every Piece</span>
          </h1>

          <p className="mt-6 max-w-md text-[15px] leading-relaxed text-brown-700">
            Discover our curated collection of artisan-made baskets, chiffon
            florals, stone art and gifts for your home — shaped slowly, by hand,
            by makers we know by name.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <ButtonLink href="/shop" size="lg">
              Explore Now
              <ArrowUpRightIcon />
            </ButtonLink>
            <span className="text-sm text-brown-700">
              +250 pieces from independent makers
            </span>
          </div>
        </div>

        {/* Signature studio arrangement — a single composed piece. */}
        <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
          <Image
            src="/products/hero-collection.png"
            alt="A curated arrangement of handmade pieces — a rose-glazed ceramic bowl, woven wall textile, rose-quartz necklace and driftwood"
            width={1376}
            height={768}
            priority
            className="h-auto w-full object-contain drop-shadow-[0_30px_50px_rgba(51,36,29,0.22)]"
          />
        </div>
      </Container>
    </section>
  );
}
