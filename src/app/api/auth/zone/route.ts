import { NextResponse } from "next/server";
import { query } from "@/lib-server/db";
import { generateZoneId } from "@/lib/fetcher";

export async function GET() {
    try {
        const rows = await query(`
            SELECT * 
            FROM master_zones 
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
        const { zone_id, zone_name, is_active, created_by, updated_by } = body;

        if (!zone_name) {
            return NextResponse.json(
                { success: false, message: "กรุณากรอกชื่อพื้นที่" },
                { status: 400 }
            );
        }

        if (zone_id) {
            // กรณีมี zone_id → UPDATE
            await query(
                `
        UPDATE master_zones
        SET zone_name = ?, is_active = ?, updated_by = ?, updated_date = NOW()
        WHERE zone_id = ?
      `,
                [zone_name, is_active ?? 1, updated_by ?? "system", zone_id]
            );

            return NextResponse.json({ success: true, message: "อัปเดตข้อมูลเรียบร้อย" });
        } else {
            // กรณีไม่มี zone_id → INSERT พร้อม gen ใหม่
            const newZoneId = generateZoneId();

            await query(
                `
        INSERT INTO master_zones 
        (zone_id, zone_name, is_active, created_by, created_date, updated_by, updated_date) 
        VALUES (?, ?, ?, ?, NOW(), ?, NOW())
      `,
                [newZoneId, zone_name, is_active ?? 1, created_by ?? "system", updated_by ?? "system"]
            );

            return NextResponse.json({
                success: true,
                message: "เพิ่มเรียบร้อย",
                zone_id: newZoneId,
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