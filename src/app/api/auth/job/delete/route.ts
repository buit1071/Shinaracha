import { NextResponse } from "next/server";
import { query } from "@/lib-server/db";

export async function POST(req: Request) {
    try {
        const { id, function: fn } = await req.json();

        if (!id || !fn) {
            return NextResponse.json(
                { success: false, message: "กรุณาส่ง id และ function" },
                { status: 400 }
            );
        }

        if (fn === "job") {
            await query(`DELETE FROM data_jobs WHERE job_id=?`, [id]);
            return NextResponse.json({ success: true, message: "ลบข้อมูลเรียบร้อย" });
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
