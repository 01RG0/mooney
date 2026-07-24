import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_ROUTES = ["/checkout", "/account"];
const ADMIN_PAGE_PREFIX = "/admin";
const ADMIN_API_PREFIX = "/api/admin";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get("__session");
  const hasSession = !!sessionCookie?.value;

  // Admin API routes: return 401 JSON
  if (pathname.startsWith(ADMIN_API_PREFIX) && !hasSession) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Admin pages: redirect to login
  if (pathname.startsWith(ADMIN_PAGE_PREFIX) && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  // Storefront protected routes
  if (PROTECTED_ROUTES.some((p) => pathname.startsWith(p)) && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/checkout/:path*",
    "/account/:path*",
    "/admin/:path*",
    "/api/admin/:path*",
  ],
};
