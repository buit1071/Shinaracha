import { NextResponse } from "next/server";
import { query } from "@/lib-server/db";
import { generateHolidayId } from "@/lib/fetcher";

export async function GET() {
    try {
        const rows = await query(`
            SELECT * 
            FROM data_holidays
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
        const { holiday_id, title, description, is_active, created_by, updated_by } = body;

        if (!title) {
            return NextResponse.json(
                { success: false, message: "กรุณากรอกหัวข้อ" },
                { status: 400 }
            );
        }

        if (holiday_id) {
            // กรณีมี holiday_id → UPDATE
            await query(
                `
        UPDATE data_holidays
        SET title = ?, description = ?, is_active = ?, updated_by = ?, updated_date = NOW()
        WHERE holiday_id = ?
      `,
                [title, description, is_active ?? 1, updated_by ?? "system", holiday_id]
            );

            return NextResponse.json({ success: true, message: "บันทึกข้อมูลเรียบร้อย" });
        } else {
            // กรณีไม่มี holiday_id → INSERT พร้อม gen ใหม่
            const newHolidayId = generateHolidayId();

            if (!title || !body.start_date) {
                return NextResponse.json(
                    { success: false, message: "กรุณากรอกหัวข้อและวันที่เริ่มต้น" },
                    { status: 400 }
                );
            }

            await query(
                `
    INSERT INTO data_holidays 
    (holiday_id, title, description, start_date, end_date, is_active, created_by, created_date, updated_by, updated_date) 
    VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?, NOW())
  `,
                [
                    newHolidayId,
                    title,
                    description,
                    body.start_date,
                    body.end_date ?? body.start_date,
                    is_active ?? 1,
                    created_by ?? "system",
                    updated_by ?? "system"
                ]
            );

            return NextResponse.json({
                success: true,
                message: "บันทึกข้อมูลเรียบร้อย",
                holiday_id: newHolidayId,
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