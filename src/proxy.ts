import { NextResponse, type NextRequest } from "next/server";

// NOTE: This proxy is a UX convenience only — it is NOT a security boundary.
//
// Firebase's client SDK persists auth in localStorage, which is inaccessible
// in edge/proxy context. A proper server-side auth gate requires:
//   1. Firebase Admin SDK to mint a `__session` HttpOnly cookie on sign-in.
//   2. JWT verification here using `jose` against Google's public JWKS.
//
// Until that is wired up, every protected route must independently verify
// auth client-side via `useAuth()`, and sensitive data must be protected
// by Firebase Security Rules on the backend — not this file.

const PROTECTED_ROUTES = ["/checkout", "/account"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Best-effort check: look for a non-empty __session cookie. This cookie is
  // only present if you explicitly set it server-side (Firebase Admin SDK).
  // Without that setup this block never fires — harmless but inert.
  const sessionCookie = request.cookies.get("__session");
  const hasSession = !!sessionCookie?.value;

  if (PROTECTED_ROUTES.some((p) => pathname.startsWith(p)) && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/checkout/:path*", "/account/:path*"],
};
