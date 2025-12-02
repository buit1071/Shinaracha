import { NextResponse } from "next/server";
import { query } from "@/lib-server/db";

type GetBody =
    | { function: "equipment"; job_id: string }
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

        if (fn === "equipment") {
            if (!body.job_id) {
                return NextResponse.json(
                    { success: false, message: "กรุณาระบุ job_id" },
                    { status: 400 }
                );
            }
            const rows = await query(
                `
        SELECT *
        FROM data_job_equipments
        WHERE job_id = ?
        ORDER BY created_date DESC
        `,
                [body.job_id]
            );
            return NextResponse.json({ success: true, data: rows });
        }

        // ไม่รู้จัก function
        return NextResponse.json(
            { success: false, message: "ไม่รู้จัก function ที่ส่งมา" },
            { status: 400 }
        );
    } catch (err: any) {
        
        return NextResponse.json(
            { success: false, message: "Database error", error: err.message },
            { status: 500 }
        );
    }
}
