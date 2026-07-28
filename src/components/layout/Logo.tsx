import Link from "next/link";
import Image from "next/image";

/**
 * The Meromade wordmark: the hand-drawn mermaid-tail mark paired with the
 * brand name set in a bouncy cursive (Pacifico).
 */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`group inline-flex items-center gap-2.5 ${className}`}
      aria-label="Meromade — home"
    >
      <Image
        src="/logo.png"
        alt=""
        width={512}
        height={487}
        priority
        sizes="36px"
        className="h-9 w-auto"
      />
      <span className="font-script text-[22px] leading-none text-brown-900">
        Meromade
      </span>
    </Link>
  );
}
