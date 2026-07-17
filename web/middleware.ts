import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Edge middleware cannot easily verify a JWT without extra libraries (like jose),
  // but we can check for the presence of the httpOnly refreshToken cookie.
  // The actual API will reject requests if the token is invalid anyway.
  const refreshToken = request.cookies.get("refreshToken");
  const { pathname } = request.nextUrl;

  const isAuthRoute = pathname === "/login" || pathname === "/register";
  
  const isProtectedRoute = 
    pathname.startsWith("/student") || 
    pathname.startsWith("/company") || 
    pathname.startsWith("/admin") || 
    pathname.startsWith("/counselor");

  // If user is authenticated and trying to access auth pages (login/register)
  if (isAuthRoute && refreshToken) {
    // Redirect to home (from there, page components can redirect to specific dashboards based on role)
    return NextResponse.redirect(new URL("/", request.url));
  }

  // If user is not authenticated and trying to access protected dashboards
  if (isProtectedRoute && !refreshToken) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/register",
    "/student/:path*",
    "/company/:path*",
    "/admin/:path*",
    "/counselor/:path*",
  ],
};
