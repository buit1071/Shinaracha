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
                { success: false, message: "ไม่พบ Team ID" },
                { status: 400 }
            );
        }

        await query(`DELETE FROM data_teams WHERE team_id = ?`, [id]);

        return NextResponse.json({
            success: true,
            message: "ลบข้อมูลเรียบร้อย",
        });
    } catch (err: any) {
        
        return NextResponse.json(
            { success: false, message: "Database error", error: err.message },
            { status: 500 }
        );
    }
}
