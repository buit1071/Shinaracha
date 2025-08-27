import { NextResponse } from "next/server";
import { query } from "@/lib-server/db";
import { generateId  } from "@/lib/fetcher";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET(req: Request) {
    try {
        // อ่าน query param
        const { searchParams } = new URL(req.url);
        const active = searchParams.get("active"); // จะเป็น string หรือ null

        let sql = `
      SELECT * 
      FROM data_employees
    `;

        // ถ้ามี param active และค่าคือ true → กรองเฉพาะ is_active = 1
        if (active === "true" || active === "1") {
            sql += " WHERE is_active = 1";
        }

        sql += " ORDER BY updated_date DESC";

        const rows = await query(sql);

        return NextResponse.json({ success: true, data: rows });
    } catch (err: any) {
        console.error("DB Error:", err);
        return NextResponse.json(
            { success: false, message: "Database error", error: err.message },
            { status: 500 }
        );
    }
}

// POST เพิ่ม/แก้ไข
export async function POST(req: Request) {
    try {
        const body = await req.json();
        let {
            emp_id,
            first_name,
            last_name,
            username,
            password,
            permission_id,
            is_active,
            created_by,
            updated_by,
        } = body as {
            emp_id?: string;
            first_name?: string;
            last_name?: string;
            username?: string;
            password?: string;
            permission_id?: string;
            is_active?: number;
            created_by?: string;
            updated_by?: string;
        };

        emp_id = emp_id?.trim();
        if (!emp_id) emp_id = undefined;

        // -------- validations --------
        if (!first_name?.trim()) {
            return NextResponse.json(
                { success: false, message: "กรุณากรอกชื่อ" },
                { status: 400 }
            );
        }
        if (!last_name?.trim()) {
            return NextResponse.json(
                { success: false, message: "กรุณากรอกนามสกุล" },
                { status: 400 }
            );
        }
        if (!username?.trim()) {
            return NextResponse.json(
                { success: false, message: "กรุณากรอก email" },
                { status: 400 }
            );
        }
        if (!EMAIL_RE.test(username)) {
            return NextResponse.json(
                { success: false, message: "รูปแบบ email ไม่ถูกต้อง" },
                { status: 400 }
            );
        }
        if (!permission_id?.trim()) {
            return NextResponse.json(
                { success: false, message: "กรุณาเลือกหน้าที่" },
                { status: 400 }
            );
        }

        // ตรวจ email ซ้ำ
        {
            const dup = await query(
                `SELECT emp_id FROM data_employees WHERE username = ? LIMIT 1`,
                [username]
            );
            if (Array.isArray(dup) && dup.length > 0) {
                if (!emp_id || dup[0].emp_id !== emp_id) {
                    return NextResponse.json(
                        { success: false, message: "อีเมลนี้ถูกใช้งานแล้ว" },
                        { status: 409 }
                    );
                }
            }
        }

        // -------- UPDATE --------
        if (emp_id) {
            if (password && password.trim() !== "") {
                // update พร้อมรหัสผ่าน
                await query(
                    `
          UPDATE data_employees
          SET 
            first_name = ?, 
            last_name = ?, 
            username = ?, 
            password = ?, 
            permission_id = ?, 
            is_active = ?, 
            updated_by = ?, 
            updated_date = NOW()
          WHERE emp_id = ?
        `,
                    [
                        first_name.trim(),
                        last_name?.trim() ?? null,
                        username.trim(),
                        password.trim(), // เก็บตรงๆ
                        permission_id.trim(),
                        is_active ?? 1,
                        updated_by ?? "system",
                        emp_id,
                    ]
                );
            } else {
                // ไม่เปลี่ยน password
                await query(
                    `
          UPDATE data_employees
          SET 
            first_name = ?, 
            last_name = ?, 
            username = ?, 
            permission_id = ?, 
            is_active = ?, 
            updated_by = ?, 
            updated_date = NOW()
          WHERE emp_id = ?
        `,
                    [
                        first_name.trim(),
                        last_name?.trim() ?? null,
                        username.trim(),
                        permission_id.trim(),
                        is_active ?? 1,
                        updated_by ?? "system",
                        emp_id,
                    ]
                );
            }

            return NextResponse.json({
                success: true,
                message: "อัปเดตข้อมูลเรียบร้อย",
                emp_id,
            });
        }

        // -------- INSERT --------
        const newEmpId = generateId("EMP");

        await query(
            `
      INSERT INTO data_employees 
        (emp_id, first_name, last_name, username, password, permission_id, is_active, created_by, created_date, updated_by, updated_date)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, NOW())
    `,
            [
                newEmpId,
                first_name.trim(),
                last_name?.trim() ?? null,
                username.trim(),
                password?.trim() ?? null, // เก็บตรงๆ
                permission_id.trim(),
                is_active ?? 1,
                created_by ?? "admin",
                updated_by ?? "admin",
            ]
        );

        return NextResponse.json({
            success: true,
            message: "เพิ่มข้อมูลเรียบร้อย",
            emp_id: newEmpId,
        });
    } catch (err: any) {
        console.error("DB Error:", err);
        return NextResponse.json(
            { success: false, message: "Database error", error: err.message },
            { status: 500 }
        );
    }
}