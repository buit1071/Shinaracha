
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC = ["/login", "/api", "/_next", "/favicon.ico", "/images", "/icons"];

const matchPath = (pathname: string, base: string) =>
  pathname === base || pathname.startsWith(base + "/");

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const isPublic = PUBLIC.some((p) => matchPath(pathname, p));
  const token = req.cookies.get("token")?.value;

  // public page → allow
  if (isPublic) {
    // prevent logged-in user from going back to login
    if (matchPath(pathname, "/login") && token) {
      const url = req.nextUrl.clone();
      const next = req.nextUrl.searchParams.get("next");
      url.pathname = next || "/dashboard";
      url.search = "";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // protected page but no token → redirect to login
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname + (search || ""));
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// make sure middleware runs on ALL pages except assets
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images|icons|api).*)",
  ],
};
