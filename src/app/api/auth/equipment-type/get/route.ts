import { NextResponse } from "next/server";
import { query } from "@/lib-server/db";

type GetBody =
    | { function: "system_type"; }
    | { function: "equipment_type"; }
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

        if (fn === "system_type") {
            const rows = await query(
                `SELECT *
                FROM master_system_type
                `,
            );

            return NextResponse.json({
                success: true,
                data: rows || [],
            });
        }

        if (fn === "equipment_type") {
            const rows = await query(
                `SELECT *
                FROM master_equipment_type
                `,
            );

            return NextResponse.json({
                success: true,
                data: rows || [],
            });
        }

        // ไม่รู้จัก function
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
