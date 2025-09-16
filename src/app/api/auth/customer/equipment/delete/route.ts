import { NextResponse } from "next/server";
import { query } from "@/lib-server/db";

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // รองรับหลายคีย์ (กันยิงมาเป็น entity/function)
        const fn = body.fn ?? body.function ?? body.entity;
        const row_id = String(body.row_id ?? "").trim();

        if (!row_id || !fn) {
            return NextResponse.json(
                { success: false, message: "กรุณาส่ง row_id และ function" },
                { status: 400 }
            );
        }

        if (fn === "equipment") {
            const row_id = String(body.row_id ?? "").trim();
            if (!row_id) {
                return NextResponse.json(
                    { success: false, message: "กรุณาส่ง row_id" },
                    { status: 400 }
                );
            }

            const result: any = await query(
                `DELETE FROM data_job_equipments WHERE row_id = ?`,
                [row_id]
            );

            const affected =
                result?.affectedRows ?? result?.[0]?.affectedRows ?? 0;

            if (affected === 0) {
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
