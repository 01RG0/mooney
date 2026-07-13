import Link from "next/link";
import Image from "next/image";

/**
 * The Mermaid Crafted wordmark: the hand-drawn mermaid-tail mark paired with the
 * brand name set in a bouncy cursive (Pacifico).
 */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`group inline-flex items-center gap-2.5 ${className}`}
      aria-label="Mermaid Crafted — home"
    >
      <Image
        src="/logo.png"
        alt=""
        width={681}
        height={710}
        priority
        sizes="36px"
        className="h-9 w-auto"
      />
      <span className="font-script text-[22px] leading-none text-brown-900">
        Mermaid Crafted
      </span>
    </Link>
  );
}
