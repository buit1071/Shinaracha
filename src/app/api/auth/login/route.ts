import { NextResponse } from "next/server";
import { query } from "@/lib-server/db";
import { signJwt } from "@/lib-server/jwt";
import { setCurrentUser } from "@/lib-server/currentUser";
import { CurrentUser } from "@/interfaces/master";

type EmployeeDbRow = {
  emp_id: string;
  company_id: string;
  first_name_th: string;
  first_name_en: string;
  last_name_th: string;
  last_name_en: string;
  email: string | null;
  password: string | null;
  permission_id: string;
  permission_name: string | null;
  image_url: string | null;
};

export async function POST(req: Request) {
  const { username, password } = await req.json();

  const uname = String(username ?? "").trim().toLowerCase();
  if (!uname) {
    return NextResponse.json({ message: "กรุณากรอกชื่อผู้ใช้" }, { status: 400 });
  }

  // ✅ JOIN เอา permission_name มาด้วย
  const rows = await query<EmployeeDbRow>(
    `
    SELECT e.emp_id,
           e.company_id,
           e.first_name_th,
           e.first_name_en,
           e.last_name_th,
           e.last_name_en,
           e.email,
           e.password,
           e.permission_id,
           p.permission_name,
           e.image_url
    FROM data_employees e
    LEFT JOIN master_permissions p
      ON e.permission_id = p.permission_id
    WHERE e.first_name_en = ? AND e.is_active = 1
    LIMIT 1
    `,
    [uname]
  );

  if (!rows || rows.length === 0) {
    return NextResponse.json({ message: "ไม่พบบัญชีนี้" }, { status: 401 });
  }

  const emp = rows[0];

  // ตรวจรหัสผ่าน (ยัง plain-text อยู่)
  if ((emp.password ?? "") !== (password ?? "")) {
    return NextResponse.json({ message: "รหัสผ่านไม่ถูกต้อง" }, { status: 401 });
  }

  // แปลงเป็น CurrentUser
  const user: CurrentUser = {
    emp_id: emp.emp_id,
    company_id: emp.company_id,
    first_name_th: emp.first_name_th,
    first_name_en: emp.first_name_en,
    last_name_th: emp.last_name_th,
    last_name_en: emp.last_name_en,
    email: emp.email ?? "-",
    permission_id: emp.permission_id,
    permission_name: emp.permission_name ?? "-", // ✅ ได้จาก master_permissions
    image_url: emp.image_url ?? undefined,
    role: emp.permission_id,
  };

  setCurrentUser(user);

  const token = await signJwt(
    { sub: emp.emp_id, role: emp.permission_id },
    60 * 60 * 8
  );

  const res = NextResponse.json({ ok: true, user });
  res.cookies.set("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return res;
}