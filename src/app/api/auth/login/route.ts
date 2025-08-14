import { NextResponse } from "next/server";
import { signJwt } from "@/lib-server/jwt";

export async function POST(req: Request) {
  const { username, password } = await req.json();

  // TODO: เปลี่ยนเป็นตรวจ DB จริง
  const ok = username === "admin" && password === "123456";
  if (!ok) return NextResponse.json({ message: "บัญชีหรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });

  const token = await signJwt({ sub: username, role: "admin" }, 60 * 60 * 8);

  const res = NextResponse.json({ ok: true });
  res.cookies.set("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return res;
}
