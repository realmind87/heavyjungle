import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, isSessionTokenFormatValid } from "@/lib/auth/session-token";

const PROTECTED_PATHS = ["/settings", "/write"];
const AUTH_PATHS = ["/login", "/signup"];

function matchesPath(pathname: string, paths: string[]): boolean {
  return paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const hasValidCookie = isSessionTokenFormatValid(token);

  if (matchesPath(pathname, PROTECTED_PATHS) && !hasValidCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const editMatch = pathname.match(/^\/posts\/[^/]+\/edit\/?$/);
  if (editMatch && !hasValidCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (matchesPath(pathname, AUTH_PATHS) && hasValidCookie) {
    const next = request.nextUrl.searchParams.get("next");
    const dest = next?.startsWith("/") && !next.startsWith("//") ? next : "/";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/settings/:path*", "/write", "/login", "/signup", "/posts/:id/edit"],
};
