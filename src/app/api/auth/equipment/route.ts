import { NextResponse } from "next/server";
import { query } from "@/lib-server/db";
import { generateId } from "@/lib/fetcher";

export async function GET() {
    try {
        const rows = await query(`
      SELECT
        me.equipment_id,
        me.equipment_code,
        me.equipment_name,
        me.description,
        me.service_id,
        COALESCE(ms.service_name, '') AS service_name,   -- จาก master_services
        me.zone_id,
        COALESCE(z.zone_name, '')    AS zone_name,       -- จาก data_service_form
        me.image_limit,
        me.is_active,
        me.created_by,
        me.updated_by,
        me.created_date,
        me.updated_date
      FROM master_equipments AS me
      LEFT JOIN master_services     AS ms ON ms.service_id = me.service_id
      LEFT JOIN data_service_form   AS z  ON z.zone_id    = me.zone_id
      ORDER BY me.updated_date DESC, me.created_date DESC
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

        const {
            equipment_id,
            equipment_code,
            equipment_name,
            description = "",
            image_limit = 0,
            service_id = "",
            zone_id = "",
            is_active = 1,
            created_by = "system",
            updated_by = "system",
        } = body;

        const code = String(equipment_code ?? "").trim();      // ใช้เช็คซ้ำ
        const codeOrNull: any = code ? code : null;            // เก็บเป็น NULL ถ้าเว้นว่าง
        const imgLimit = Number.isFinite(Number(image_limit)) ? parseInt(String(image_limit), 10) : 0;

        if (!equipment_name?.trim()) {
            return NextResponse.json({ success: false, message: "กรุณาระบุชื่ออุปกรณ์" }, { status: 400 });
        }

        // ============ UPDATE ============
        if (equipment_id) {
            // ห้ามซ้ำ (exclude ตัวเอง)
            if (code) {
                const dup: any = await query(
                    `SELECT 1 FROM master_equipments WHERE equipment_code = ? AND equipment_id <> ? LIMIT 1`,
                    [code, equipment_id]
                );
                if (dup.length > 0) {
                    return NextResponse.json(
                        { success: false, message: `equipment_code นี้ถูกใช้งานแล้ว (${code})` },
                        { status: 409 }
                    );
                }
            }

            await query(
                `
        UPDATE master_equipments
        SET
          equipment_code = ?,       -- update/clear ได้ (NULL ถ้าค่าว่าง)
          equipment_name = ?,
          description    = ?,
          image_limit    = ?,
          service_id     = ?,
          zone_id        = ?,
          is_active      = ?,
          updated_by     = ?,
          updated_date   = NOW()
        WHERE equipment_id = ?
        `,
                [
                    codeOrNull,
                    equipment_name,
                    description,
                    imgLimit,
                    service_id,
                    zone_id,
                    is_active ?? 1,
                    updated_by,
                    equipment_id,
                ]
            );

            return NextResponse.json({ success: true, message: "อัปเดตข้อมูลเรียบร้อย" });
        }

        // ============ INSERT ============
        if (code) {
            const dup: any = await query(
                `SELECT 1 FROM master_equipments WHERE equipment_code = ? LIMIT 1`,
                [code]
            );
            if (dup.length > 0) {
                return NextResponse.json(
                    { success: false, message: `equipment_code นี้ถูกใช้งานแล้ว (${code})` },
                    { status: 409 }
                );
            }
        }

        const newEquipmentId = generateId("EQM");

        await query(
            `
      INSERT INTO master_equipments
        (equipment_id, equipment_code, equipment_name, description, image_limit,
         service_id, zone_id, is_active, created_by, created_date, updated_by, updated_date)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, NOW())
      `,
            [
                newEquipmentId,
                codeOrNull,
                equipment_name,
                description,
                imgLimit,
                service_id,
                zone_id,
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
    } catch (err: any) {
        // กัน race condition จาก UNIQUE KEY
        if (err?.code === "ER_DUP_ENTRY") {
            return NextResponse.json(
                { success: false, message: "equipment_code นี้ถูกใช้งานแล้ว", error: err.sqlMessage },
                { status: 409 }
            );
        }
        console.error("DB Error:", err);
        return NextResponse.json(
            { success: false, message: "Database error", error: err?.message },
            { status: 500 }
        );
    }
}
