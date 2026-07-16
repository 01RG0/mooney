import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/AuthCard";

export const metadata: Metadata = {
  title: "Sign In — Meromade",
  description: "Log in or create an account to join the Meromade makers community.",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100dvh-4rem)] items-start justify-center px-5 py-12 sm:items-center sm:py-16">
      <AuthCard />
    </div>
  );
}
