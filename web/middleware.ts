import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Edge middleware cannot verify the opaque refreshToken, so it only guards protected
  // routes by cookie presence. It must NOT redirect users away from /login or /register:
  // a stale/invalid cookie would otherwise trap them out of signing in.
  const refreshToken = request.cookies.get("refreshToken");
  const { pathname } = request.nextUrl;

  const isProtectedRoute =
    pathname.startsWith("/student") ||
    pathname.startsWith("/company") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/counselor");

  // Unauthenticated access to a protected dashboard → send to login.
  if (isProtectedRoute && !refreshToken) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/student/:path*",
    "/company/:path*",
    "/admin/:path*",
    "/counselor/:path*",
  ],
};
