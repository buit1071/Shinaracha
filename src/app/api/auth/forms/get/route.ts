import { NextResponse } from "next/server";
import { query } from "@/lib-server/db";

type GetBody =
    | { function: "form1_3"; job_id: string; equipment_id: string }
    ;

export async function POST(req: Request) {
    try {
        const body = (await req.json()) as Partial<GetBody>;
        const fn = body.function;

        if (!fn) {
            return NextResponse.json(
                { success: false, message: "กรุณาระบุ function" },
                { status: 400 }
            );
        }

        if (fn === "form1_3") {
            const rows = await query(`
                SELECT *
                FROM formdata_sign_forms
                WHERE job_id = ? AND equipment_id = ?
            `, [body.job_id, body.equipment_id]);

            return NextResponse.json({ success: true, data: rows[0] || null });
        }

        return NextResponse.json({ success: false, message: "ไม่รู้จัก function ที่ส่งมา" }, { status: 400 });
    } catch (err: any) {
        
        return NextResponse.json(
            { success: false, message: "Database error", error: err.message },
            { status: 500 }
        );
    }
}
