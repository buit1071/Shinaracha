import { NextResponse } from "next/server";
import { query } from "@/lib-server/db";
import { generateId, toSqlDate } from "@/lib/fetcher";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const active = searchParams.get("active");
        const company_id = searchParams.get("company_id"); // ✅ รับค่า (อาจจะเป็น null ถ้าหน้าอื่นไม่ได้ส่งมา)

        let sql = `SELECT * FROM data_projects`;

        // ตัวแปรสำหรับเก็บเงื่อนไข และ ค่าที่จะ bind (เพื่อความปลอดภัย)
        const conditions: string[] = [];
        const values: any[] = [];

        // 1. เงื่อนไข Active (Logic เดิม)
        if (active === "true" || active === "1") {
            conditions.push("is_active = 1");
        }

        // 2. เงื่อนไข Company ID (Logic ใหม่: ถ้ามีค่าส่งมา ค่อยเพิ่มเงื่อนไข)
        if (company_id) {
            conditions.push("company_id = ?");
            values.push(company_id);
        }

        // 3. ประกอบร่าง SQL
        if (conditions.length > 0) {
            // ถ้ามีเงื่อนไข (ตัวใดตัวหนึ่ง หรือทั้งคู่) ให้เติม WHERE และเชื่อมด้วย AND
            sql += " WHERE " + conditions.join(" AND ");
        }

        sql += " ORDER BY updated_date DESC";

        // ✅ ส่ง values ไป query (รองรับทั้ง active และ company_id)
        const rows = await query(sql, values);

        return NextResponse.json({ success: true, data: rows });
    } catch (err: any) {
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
            project_id,
            project_name,
            project_description,
            start_date,
            end_date,
            is_active,
            created_by,
            updated_by,
            skipDate, // 👈 param ใหม่
            company_id,
        } = body as {
            project_id?: string;
            project_name?: string;
            project_description?: string;
            start_date?: string;
            end_date?: string;
            is_active?: number;
            created_by?: string;
            updated_by?: string;
            skipDate?: boolean; // 👈 param ใหม่
            company_id?: string;
        };

        project_id = project_id?.trim();
        if (!project_id) project_id = undefined;

        if (!project_name?.trim()) {
            return NextResponse.json(
                { success: false, message: "กรุณากรอกชื่อโครงการ" },
                { status: 400 }
            );
        }

        const startDateSql = toSqlDate(start_date || null);
        const endDateSql = toSqlDate(end_date || null);

        if (project_id) {
            if (skipDate) {
                // 👇 update แบบไม่ยุ่งกับ start_date / end_date
                await query(
                    `
          UPDATE data_projects
          SET 
            project_name = ?, 
            project_description = ?, 
            company_id = ?,
            is_active = ?, 
            updated_by = ?, 
            updated_date = NOW()
          WHERE project_id = ?
        `,
                    [
                        project_name,
                        project_description ?? null,
                        company_id ?? null,
                        is_active ?? 1,
                        updated_by ?? "system",
                        project_id,
                    ]
                );
            } else {
                // 👇 update ปกติ
                await query(
                    `
          UPDATE data_projects
          SET 
            project_name = ?, 
            project_description = ?, 
            start_date = ?, 
            end_date = ?, 
            company_id = ?,
            is_active = ?, 
            updated_by = ?, 
            updated_date = NOW()
          WHERE project_id = ?
        `,
                    [
                        project_name,
                        project_description ?? null,
                        startDateSql,
                        endDateSql,
                        company_id ?? null,
                        is_active ?? 1,
                        updated_by ?? "system",
                        project_id,
                    ]
                );
            }

            return NextResponse.json({
                success: true,
                message: "อัปเดตข้อมูลเรียบร้อย",
                project_id,
            });
        } else {
            // INSERT เหมือนเดิม
            const newProjectId = generateId("PJ");

            await query(
                `
          INSERT INTO data_projects 
            (project_id, project_name, project_description, start_date, end_date, company_id, is_active, created_by, created_date, updated_by, updated_date) 
          VALUES 
            (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, NOW())
        `,
                [
                    newProjectId,
                    project_name,
                    project_description ?? null,
                    startDateSql,
                    endDateSql,
                    company_id ?? null,
                    is_active ?? 1,
                    created_by ?? "admin",
                    updated_by ?? "admin",
                ]
            );

            return NextResponse.json({
                success: true,
                message: "เพิ่มข้อมูลเรียบร้อย",
                project_id: newProjectId,
            });
        }
    } catch (err: any) {

        return NextResponse.json(
            { success: false, message: "Database error", error: err.message },
            { status: 500 }
        );
    }
}
