import { NextResponse } from "next/server";
import { query } from "@/lib-server/db";
import { generateId } from "@/lib/fetcher";

export async function GET() {
    try {
        // ดึงข้อมูลทั้งหมดจาก master_services
        const rows = await query(`
            SELECT * 
            FROM master_services 
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
        const { service_id, service_name, is_active, created_by, updated_by } = body;

        if (!service_name) {
            return NextResponse.json(
                { success: false, message: "กรุณากรอกชื่อ Service" },
                { status: 400 }
            );
        }

        if (service_id) {
            // กรณีมี service_id → UPDATE
            await query(
                `
        UPDATE master_services
        SET service_name = ?, is_active = ?, updated_by = ?, updated_date = NOW()
        WHERE service_id = ?
      `,
                [service_name, is_active ?? 1, updated_by ?? "system", service_id]
            );

            return NextResponse.json({ success: true, message: "อัปเดตข้อมูลเรียบร้อย" });
        } else {
            // กรณีไม่มี service_id → INSERT พร้อม gen ใหม่
            const newServiceId = generateId("SER");

            await query(
                `
        INSERT INTO master_services 
        (service_id, service_name, is_active, created_by, created_date, updated_by, updated_date) 
        VALUES (?, ?, ?, ?, NOW(), ?, NOW())
      `,
                [newServiceId, service_name, is_active ?? 1, created_by ?? "system", updated_by ?? "system"]
            );

            return NextResponse.json({
                success: true,
                message: "เพิ่มเรียบร้อย",
                service_id: newServiceId,
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