import { cookies } from "next/headers";
import { getAdminAuth } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const { idToken } = await request.json();
    if (!idToken) {
      return Response.json({ error: "idToken required" }, { status: 400 });
    }

    const sessionCookie = await getAdminAuth().createSessionCookie(idToken, {
      expiresIn: 5 * 24 * 60 * 60 * 1000,
    });

    const cookieStore = await cookies();
    cookieStore.set("__session", sessionCookie, {
      maxAge: 432000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("__session");
  return Response.json({ ok: true });
}
