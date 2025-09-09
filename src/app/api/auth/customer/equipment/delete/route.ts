import { NextResponse } from "next/server";
import { query } from "@/lib-server/db";

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // รองรับหลายคีย์ (กันยิงมาเป็น entity/function)
        const fn = body.fn ?? body.function ?? body.entity;
        const id = String(body.id ?? "").trim();
        const branch_id = String(body.branch_id ?? "").trim();
        const service_id = String(body.service_id ?? "").trim();

        if (!id || !branch_id || !fn) {
            return NextResponse.json(
                { success: false, message: "กรุณาส่ง id, branch_id และ function" },
                { status: 400 }
            );
        }

        if (fn === "equipment") {
            const result: any = await query(
                `DELETE FROM data_branch_equipments WHERE equipment_id = ? AND branch_id = ? AND service_id = ?`,
                [id, branch_id, service_id]
            );
            const affected = result?.affectedRows ?? result?.[0]?.affectedRows ?? 0;

            if (affected === 0) {
                // ไม่พบข้อมูลให้ลบ -> แจ้ง 400 ตามโปรโตคอลฝั่ง FE
                return NextResponse.json(
                    { success: false, message: "ไม่พบข้อมูลที่จะลบ" },
                    { status: 400 }
                );
            }

            return NextResponse.json({
                success: true,
                message: "ลบข้อมูลเรียบร้อย",
            });
        }

        return NextResponse.json(
            { success: false, message: "ไม่รู้จัก function ที่ส่งมา" },
            { status: 400 }
        );
    } catch (err: any) {
        console.error("DB Error:", err);
        return NextResponse.json(
            { success: false, message: "Database error", error: err.message },
            { status: 500 }
        );
    }
}
