import { NextResponse } from "next/server";
import { query } from "@/lib-server/db";

export async function DELETE(
    req: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params; // ✅ ต้อง await

        if (!id) {
            return NextResponse.json(
                { success: false, message: "ไม่พบรหัสลูกค้า" },
                { status: 400 }
            );
        }

        await query(`DELETE FROM master_customers WHERE customer_id = ?`, [id]);

        return NextResponse.json({
            success: true,
            message: "ลบลูกค้าเรียบร้อย",
        });
    } catch (err: any) {
        console.error("DB Error:", err);
        return NextResponse.json(
            { success: false, message: "Database error", error: err.message },
            { status: 500 }
        );
    }
}
