import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { ArrowRightIcon } from "@/components/ui/icons";

const ARTISTS = [
  { name: "Mayar", craft: "Baskets" },
];

export function InfoBand() {
  return (
    <section id="community" className="py-8">
      <Container>
        <div className="grid gap-px overflow-hidden rounded-4xl bg-brown-800 text-blush-100 shadow-[0_40px_100px_-50px_rgba(51,36,29,0.7)] md:grid-cols-3">
          {/* Suggestions */}
          <div id="story" className="bg-brown-900 p-8 lg:p-10">
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-blush-100/50">
              Your voice
            </span>
            <h2 className="mt-4 font-display text-2xl font-semibold leading-snug text-blush-100">
              Have a suggestion or something on your mind?
            </h2>
            <p className="mt-3 text-sm text-blush-100/60 leading-relaxed">
              We're always listening — product ideas, feedback, or anything else. Drop us a message.
            </p>
            <Link
              href="/contact"
              className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-rose-300 underline-offset-4 hover:underline"
            >
              Send a suggestion
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>

          {/* Artist Highlights */}
          <div className="bg-brown-800 p-8 lg:p-10">
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-blush-100/50">
              Artist Highlights
            </span>
            <h3 className="mt-4 font-display text-xl font-semibold text-blush-100">
              Meet our featured artisans each month.
            </h3>
            <a
              href="https://www.instagram.com/mer0made/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 flex items-center gap-3 group"
            >
              <Image src="/logo.png" alt="Meromade" width={44} height={44} className="h-11 w-11 rounded-full object-contain bg-rose-50 ring-2 ring-brown-900" />
              <div className="text-sm">
                <p className="font-medium text-blush-100 group-hover:underline">Artist of the Month</p>
                <p className="text-blush-100/60">mer0made</p>
              </div>
            </a>
          </div>

          {/* Community */}
          <div className="bg-brown-900 p-8 lg:p-10">
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-blush-100/50">
              Community
            </span>
            <h3 className="mt-4 font-display text-xl font-semibold text-blush-100">
              Meet the Artists
            </h3>
            <ul className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {ARTISTS.map((artist) => (
                <li key={artist.name} className="text-blush-100/75">
                  <span className="text-blush-100">{artist.name}</span>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-sm text-blush-100/60">
              +250 artisans featured
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
