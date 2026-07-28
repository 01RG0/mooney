import { Hero } from "@/components/home/Hero";
import { CategoryChips } from "@/components/home/CategoryChips";
import { FeaturedStrip } from "@/components/home/FeaturedStrip";
import { InfoBand } from "@/components/home/InfoBand";

export const revalidate = 60; // re-fetch from Firestore at most every 60 seconds

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
