import { redirect } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { getSessionUser } from "@/lib/session";
import { getAdminDb } from "@/lib/firebase-admin";

export default async function AccountPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?from=/account");

  const docSnap = await getAdminDb().collection("users").doc(user.uid).get();
  const profile = docSnap.exists ? (docSnap.data() as Record<string, string>) : {};

  function fmt(val: string | undefined) {
    return val?.trim() || "—";
  }

  return (
    <Container className="py-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-display text-4xl text-brown-900 mb-8">My Account</h1>

        <div className="bg-cream/80 rounded-3xl p-8 mb-6">
          <h2 className="font-display text-xl text-brown-900 mb-5">Profile</h2>
          <dl className="space-y-3">
            {[
              ["Full Name", fmt(profile.name)],
              ["Username", fmt(profile.username)],
              ["Email", fmt(user.email ?? profile.email)],
              ["Member Since", profile.createdAt
                ? new Date(profile.createdAt).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })
                : "—"],
            ].map(([label, value]) => (
              <div key={label} className="flex gap-4">
                <dt className="w-36 shrink-0 text-sm text-brown-700 font-sans">{label}</dt>
                <dd className="text-sm text-brown-900 font-sans">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="bg-cream/80 rounded-3xl p-6">
          <ButtonLink href="/shop" size="lg">
            Browse the shop
          </ButtonLink>
        </div>
      </div>
    </Container>
  );
}
