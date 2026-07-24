"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Container } from "@/components/ui/Container";
import { AccountTabs } from "@/components/account/AccountTabs";

export default function AccountPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login?from=/account");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <Container className="py-12">
        <div className="max-w-2xl mx-auto">
          <div className="h-10 w-48 animate-pulse rounded-2xl bg-white/30 mb-8" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-3xl bg-white/30" />
            ))}
          </div>
        </div>
      </Container>
    );
  }

  if (!user) return null;

  return (
    <Container className="py-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-display text-4xl text-brown-900 mb-8">My Account</h1>
        <AccountTabs />
      </div>
    </Container>
  );
}
