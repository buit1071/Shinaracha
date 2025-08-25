import { NextResponse } from "next/server";
import { query } from "@/lib-server/db";
import { generateInTypeId } from "@/lib/fetcher";

export async function GET() {
    try {
        // ดึงข้อมูลทั้งหมดจาก data_inspection_type
        const rows = await query(`
            SELECT * 
            FROM data_inspection_type 
            ORDER BY updated_date DESC
        `);

        return NextResponse.json({ success: true, data: rows });
    } catch (err: any) {
        console.error("DB Error:", err);
        return NextResponse.json(
            { success: false, message: "Database error", error: err.message },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // destructuring + normalize
        const in_type_id = String(body.in_type_id ?? "").trim();
        const service_id = String(body.service_id ?? "").trim();
        const name = String(body.name ?? "").trim();

        const inspection_duration = Number(body.inspection_duration ?? 0) || 0;
        const inspections_per_year = Number(body.inspections_per_year ?? 0) || 0;

        // is_active -> 0/1 เท่านั้น
        const is_active =
            body.is_active === 0 || body.is_active === 1
                ? body.is_active
                : 1;

        const created_by = String(body.created_by ?? "system").trim() || "system";
        const updated_by = String(body.updated_by ?? "system").trim() || "system";

        if (!name) {
            return NextResponse.json(
                { success: false, message: "กรุณากรอกชื่อ" },
                { status: 400 }
            );
        }

        // --- UPDATE ---
        if (in_type_id) {
            const sql = `
        UPDATE data_inspection_type
        SET
          service_id = ?,                  -- เผื่อแก้ service ย้ายกลุ่ม
          name = ?,
          inspection_duration = ?,
          inspections_per_year = ?,
          is_active = ?,
          updated_by = ?,
          updated_date = NOW()
        WHERE in_type_id = ?
      `;
            const params = [
                service_id,
                name,
                inspection_duration,
                inspections_per_year,
                is_active,
                updated_by,
                in_type_id, // ✅ ต้องส่ง in_type_id มาตรงนี้
            ];

            const result: any = await query(sql, params);

            return NextResponse.json({
                success: true,
                message: result?.affectedRows ? "อัปเดตข้อมูลเรียบร้อย" : "ไม่พบข้อมูลสำหรับอัปเดต",
            });
        }

        // --- INSERT ---
        // ต้องมี service_id ตอนเพิ่ม
        if (!service_id) {
            return NextResponse.json(
                { success: false, message: "กรุณาระบุ service_id" },
                { status: 400 }
            );
        }

        const newInTypeId = generateInTypeId();

        const insertSql = `
      INSERT INTO data_inspection_type
        (in_type_id, service_id, name, inspection_duration, inspections_per_year, is_active, created_by, created_date, updated_by, updated_date)
      VALUES
        (?,?,?,?,?,?,?,NOW(),?,NOW())
    `;
        const insertParams = [
            newInTypeId,
            service_id,
            name,
            inspection_duration,
            inspections_per_year,
            is_active,
            created_by,
            updated_by,
        ];

        await query(insertSql, insertParams);

        return NextResponse.json({
            success: true,
            message: "เพิ่มเรียบร้อย",
            in_type_id: newInTypeId,
        });
    } catch (err: any) {
        console.error("DB Error:", err);
        return NextResponse.json(
            { success: false, message: "Database error", error: err.message },
            { status: 500 }
        );
    }
}