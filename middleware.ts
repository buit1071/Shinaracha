import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC = [
  "/login",
  "/api",           // อนุญาตเรียก API
  "/_next",         // asset ของ Next
  "/favicon.ico",
  "/images",
  "/icons",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // อนุญาต public paths
  const isPublic = PUBLIC.some((p) => pathname === p || pathname.startsWith(p));
  if (isPublic) return NextResponse.next();

  // เช็ค token จากคุกกี้
  const token = req.cookies.get("token")?.value;
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname); // กลับมาหน้าเดิมหลังล็อกอิน
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}
