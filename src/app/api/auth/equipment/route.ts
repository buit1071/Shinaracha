import { NextResponse } from "next/server";
import { query } from "@/lib-server/db";
import { generateId } from "@/lib/fetcher";

export async function GET() {
    try {
        // ดึงข้อมูลทั้งหมดจาก data_equipments
        const rows = await query(`
            SELECT * 
            FROM data_equipments 
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

// POST เพิ่ม/แก้ไข 
export async function POST(req: Request) {
    try {
        const body = await req.json();

        // ✅ ดึงเฉพาะฟิลด์ที่ต้องใช้จริง (ตัด service_name, system_zone_name ทิ้ง)
        const {
            equipment_id,
            equipment_name,
            description = "",
            service_id,
            system_zone_id,
            image_limit = 0,
            is_active = 1,
            created_by = "system",
            updated_by = "system",
        } = body;

        const imageLimitInt = Number.isFinite(Number(image_limit))
            ? parseInt(String(image_limit), 10)
            : 0;

        if (equipment_id) {
            // ✅ UPDATE อัปเดตเฉพาะฟิลด์ของ equipment (ไม่แตะ service_name/system_zone_name)
            await query(
                `
          UPDATE data_equipments
          SET
            equipment_name = ?,
            description = ?,
            service_id = ?,
            system_zone_id = ?,
            image_limit = ?,
            is_active = ?,
            updated_by = ?,
            updated_date = NOW()
          WHERE equipment_id = ?
        `,
                [
                    equipment_name,
                    description,
                    service_id,
                    system_zone_id,
                    imageLimitInt,
                    is_active ?? 1,
                    updated_by,
                    equipment_id,
                ]
            );

            return NextResponse.json({ success: true, message: "อัปเดตข้อมูลเรียบร้อย" });
        } else {
            // ✅ INSERT อุปกรณ์ใหม่ + gen equipment_id (ไม่บันทึก service_name/system_zone_name)
            const newEquipmentId = generateId("EQM");

            await query(
                `
          INSERT INTO data_equipments
            (equipment_id, equipment_name, description, service_id, system_zone_id, image_limit,
             is_active, created_by, created_date, updated_by, updated_date)
          VALUES
            (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, NOW())
        `,
                [
                    newEquipmentId,
                    equipment_name,
                    description,
                    service_id,
                    system_zone_id,
                    imageLimitInt,
                    is_active ?? 1,
                    created_by,
                    updated_by,
                ]
            );

            return NextResponse.json({
                success: true,
                message: "บันทึกข้อมูลเรียบร้อย",
                equipment_id: newEquipmentId,
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
