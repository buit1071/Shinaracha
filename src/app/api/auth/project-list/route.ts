import { NextResponse } from "next/server";
import { query } from "@/lib-server/db";
import { generateProjectId, toSqlDate } from "@/lib/fetcher";

export async function GET(req: Request) {
    try {
        // อ่าน query param
        const { searchParams } = new URL(req.url);
        const active = searchParams.get("active"); // จะเป็น string หรือ null

        let sql = `
      SELECT * 
      FROM data_projects
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
            project_id,
            project_name,
            project_description,
            customer_id,
            start_date,
            end_date,
            is_active,
            created_by,
            updated_by,
            skipDate, // 👈 param ใหม่
        } = body as {
            project_id?: string;
            project_name?: string;
            project_description?: string;
            customer_id?: string;
            start_date?: string;
            end_date?: string;
            is_active?: number;
            created_by?: string;
            updated_by?: string;
            skipDate?: boolean; // 👈 param ใหม่
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
            customer_id = ?, 
            is_active = ?, 
            updated_by = ?, 
            updated_date = NOW()
          WHERE project_id = ?
        `,
                    [
                        project_name,
                        project_description ?? null,
                        customer_id ?? null,
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
            customer_id = ?, 
            start_date = ?, 
            end_date = ?, 
            is_active = ?, 
            updated_by = ?, 
            updated_date = NOW()
          WHERE project_id = ?
        `,
                    [
                        project_name,
                        project_description ?? null,
                        customer_id ?? null,
                        startDateSql,
                        endDateSql,
                        is_active ?? 1,
                        updated_by ?? "system",
                        project_id,
                    ]
                );
            }

            return NextResponse.json({
                success: true,
                message: "อัปเดตข้อมูลโครงการเรียบร้อย",
                project_id,
            });
        } else {
            // INSERT เหมือนเดิม
            const newProjectId = generateProjectId();

            await query(
                `
          INSERT INTO data_projects 
            (project_id, project_name, project_description, customer_id, start_date, end_date, is_active, created_by, created_date, updated_by, updated_date) 
          VALUES 
            (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, NOW())
        `,
                [
                    newProjectId,
                    project_name,
                    project_description ?? null,
                    customer_id ?? null,
                    startDateSql,
                    endDateSql,
                    is_active ?? 1,
                    created_by ?? "admin",
                    updated_by ?? "admin",
                ]
            );

            return NextResponse.json({
                success: true,
                message: "เพิ่มข้อมูลโครงการเรียบร้อย",
                project_id: newProjectId,
            });
        }
    } catch (err: any) {
        console.error("DB Error:", err);
        return NextResponse.json(
            { success: false, message: "Database error", error: err.message },
            { status: 500 }
        );
    }
}
