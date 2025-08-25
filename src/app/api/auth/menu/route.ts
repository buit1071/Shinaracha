import { NextResponse } from "next/server";
import { query } from "@/lib-server/db";

export async function GET(req: Request) {
    try {
        // อ่าน query param
        const { searchParams } = new URL(req.url);
        const active = searchParams.get("active"); // จะเป็น string หรือ null

        let sql = `
      SELECT * 
      FROM master_menu
    `;

        // ถ้ามี param active และค่าคือ true → กรองเฉพาะ is_active = 1
        if (active === "true" || active === "1") {
            sql += " WHERE is_active = 1";
        }

        sql += " ORDER BY group_id ASC, seq ASC";

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