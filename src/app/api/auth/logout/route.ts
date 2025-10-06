import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { clearCurrentUser } from "@/lib-server/currentUser";

export async function POST() {
  // เคลียร์ user ที่จำไว้ในหน่วยความจำของเซิร์ฟเวอร์
  clearCurrentUser();

  // ตอบกลับเป็น JSON
  const res = NextResponse.json({ ok: true });

  // (ก) ลบคุกกี้ token ที่เราใช้ auth
  res.cookies.set("token", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),   // หมดอายุในอดีต = ลบ
  });

  // (ข) ถ้าอยาก “ล้างทุกคุกกี้” ที่มีอยู่จริง ๆ ด้วย (ไม่ใช่แค่ token)
  const store = await cookies();
  for (const c of store.getAll()) {
    res.cookies.set(c.name, "", {
      path: "/",
      expires: new Date(0),
    });
  }

  return res;
}
