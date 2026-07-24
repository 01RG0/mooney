import { cookies } from "next/headers";
import { getAdminAuth } from "./firebase-admin";

export const SESSION_COOKIE_NAME = "__session";
const SESSION_DURATION_MS = 5 * 24 * 60 * 60 * 1000; // 5 days

export async function createSession(idToken: string): Promise<void> {
  const sessionCookie = await getAdminAuth().createSessionCookie(idToken, {
    expiresIn: SESSION_DURATION_MS,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
    maxAge: SESSION_DURATION_MS / 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  });
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export interface SessionUser {
  uid: string;
  email: string | undefined;
  role: "admin" | "customer";
}

export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(SESSION_COOKIE_NAME);
    if (!cookie) return null;

    const decoded = await getAdminAuth().verifySessionCookie(cookie.value, true);
    const role = (decoded["role"] as string) === "admin" ? "admin" : "customer";
    return { uid: decoded.uid, email: decoded.email, role };
  } catch {
    return null;
  }
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    throw new Error("Unauthorized");
  }
  return user;
}
