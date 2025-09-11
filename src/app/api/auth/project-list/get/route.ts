// app/api/auth/inspection-form/get/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib-server/db";

type GetBody =
    | { function: "projectById"; project_id: string }
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

        if (fn === "projectById") {
            if (!body.project_id) {
                return NextResponse.json(
                    { success: false, message: "กรุณาระบุ project_id" },
                    { status: 400 }
                );
            }

            const rows = await query(
                `SELECT project_id, project_name 
     FROM data_projects
     WHERE project_id = ?`,
                [body.project_id]
            );

            return NextResponse.json({
                success: true,
                data: rows[0] || null,
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
