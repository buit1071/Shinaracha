import { NextResponse } from "next/server";
import { query } from "@/lib-server/db";
import { generateCustomerId } from "@/lib/fetcher";

export async function GET() {
    try {
        // ดึงข้อมูลทั้งหมดจาก master_customers
        const rows = await query(`
            SELECT * 
            FROM master_customers 
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

// POST เพิ่ม/แก้ไข ลูกค้า
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { customer_id, customer_name, is_active, created_by, updated_by } = body;

        if (!customer_name) {
            return NextResponse.json(
                { success: false, message: "กรุณากรอกชื่อลูกค้า" },
                { status: 400 }
            );
        }

        if (customer_id) {
            // กรณีมี customer_id → UPDATE
            await query(
                `
        UPDATE master_customers
        SET customer_name = ?, is_active = ?, updated_by = ?, updated_date = NOW()
        WHERE customer_id = ?
      `,
                [customer_name, is_active ?? 1, updated_by ?? "system", customer_id]
            );

            return NextResponse.json({ success: true, message: "อัปเดตข้อมูลลูกค้าเรียบร้อย" });
        } else {
            // กรณีไม่มี customer_id → INSERT พร้อม gen ใหม่
            const newCustomerId = generateCustomerId();

            await query(
                `
        INSERT INTO master_customers 
        (customer_id, customer_name, is_active, created_by, created_date, updated_by, updated_date) 
        VALUES (?, ?, ?, ?, NOW(), ?, NOW())
      `,
                [newCustomerId, customer_name, is_active ?? 1, created_by ?? "system", updated_by ?? "system"]
            );

            return NextResponse.json({
                success: true,
                message: "เพิ่มลูกค้าเรียบร้อย",
                customer_id: newCustomerId,
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