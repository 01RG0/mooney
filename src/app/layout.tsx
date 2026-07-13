import type { Metadata } from "next";
import { Fraunces, Inter, Pacifico } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { AuroraBackground } from "@/components/layout/AuroraBackground";
import { AuroraEditor } from "@/components/layout/AuroraEditor";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "900"],
  style: ["normal", "italic"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Bouncy cursive used for the brand wordmark.
const pacifico = Pacifico({
  variable: "--font-pacifico",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Mermaid Crafted — The Art of Handmade in Every Piece",
  description:
    "A curated collection of artisan-made baskets, florals, stone art, and home décor. Handmade, one piece at a time.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} ${pacifico.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-blush-200 text-brown-900">
        <AuroraBackground />
        <CartProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </CartProvider>
        {process.env.NODE_ENV === "development" && <AuroraEditor />}
      </body>
    </html>
  );
}
