import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/lib/constants";

// Soft route protection: redirects to /login if the auth cookie is simply
// missing. This runs on the Edge runtime, so it only checks for the
// cookie's presence — it does NOT verify the JWT signature (jsonwebtoken
// needs the Node runtime for that). Real, full verification happens in
// every API route via getAuthUser() in lib/auth.ts, which is the actual
// security boundary. This middleware only exists to avoid flashing
// dashboard UI at a signed-out visitor before the client redirects.
const PROTECTED_PREFIXES = [
  "/dashboard", "/community", "/players", "/teams", "/tournaments",
  "/venues", "/live-scores", "/trainers", "/profile", "/admin",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const token = req.cookies.get(AUTH_COOKIE)?.value;
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*", "/community/:path*", "/players/:path*", "/teams/:path*",
    "/tournaments/:path*", "/venues/:path*", "/live-scores/:path*",
    "/trainers/:path*", "/profile/:path*", "/admin/:path*",
  ],
};
