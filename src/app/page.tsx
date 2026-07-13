import { Hero } from "@/components/home/Hero";
import { CategoryChips } from "@/components/home/CategoryChips";
import { FeaturedStrip } from "@/components/home/FeaturedStrip";
import { InfoBand } from "@/components/home/InfoBand";

export default function HomePage() {
  return (
    <>
      <Hero />
      <CategoryChips />
      <FeaturedStrip />
      <InfoBand />
    </>
  );
}
