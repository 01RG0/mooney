import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Logo } from "./Logo";
import { getCategories } from "@/lib/repository/products";

export async function Footer() {
  const categories = await getCategories();
  const shopLinks: { label: string; href: string }[] = [
    { label: "All products", href: "/shop" },
    ...categories.slice(0, 3).map((c) => ({
      label: c.name,
      href: `/shop?category=${c.slug}`,
    })),
  ];

  return (
    <footer id="contact" className="mt-20 bg-brown-900 text-blush-100">
      <Container className="py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="max-w-xs">
            <Logo className="[&_span]:text-blush-100 [&_img]:brightness-0 [&_img]:invert" />
            <p className="mt-4 text-sm leading-relaxed text-blush-100/70">
              A curated collection of artisan-made pieces. Handmade, one at a
              time, by makers we know by name.
            </p>
          </div>

          <FooterColumn title="Shop" links={shopLinks} />
          <FooterColumn
            title="Studio"
            links={[
              { label: "About", href: "/#story" },
              { label: "Meet the artists", href: "https://www.instagram.com/mer0made/" },
              { label: "Promotions", href: "/#community" },
            ]}
          />
          <FooterColumn
            title="Care"
            links={[
              { label: "Shipping", href: "/#contact" },
              { label: "Returns", href: "/#contact" },
              { label: "Get in touch", href: "/#contact" },
            ]}
          />
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-blush-100/15 pt-6 text-sm text-blush-100/60 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Meromade. Made by hand.</p>
          <p>The Art of Handmade in Every Piece.</p>
        </div>
      </Container>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-blush-100/80">
        {title}
      </h3>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => {
          const isExternal = link.href.startsWith("http");
          return (
            <li key={link.label}>
              <Link
                href={link.href}
                {...(isExternal && { target: "_blank", rel: "noopener noreferrer" })}
                className="text-sm text-blush-100/70 transition-colors hover:text-blush-100"
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
