import { NextResponse } from "next/server";
import { query } from "@/lib-server/db";

type GetBody =
    | { function: "defect"; }
    | { function: "problem"; }
    | { function: "view"; }
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

        if (fn === "defect") {
            const rows = await query(
                `
        SELECT *
        FROM master_defect
        `,
            );
            return NextResponse.json({ success: true, data: rows });
        }

        if (fn === "problem") {
            const rows = await query(
                `
        SELECT *
        FROM master_problem
        `,
            );
            return NextResponse.json({ success: true, data: rows });
        }

        if (fn === "view") {
            const rows = await query(
                `
        SELECT *
        FROM view_defect_problem
        `,
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
