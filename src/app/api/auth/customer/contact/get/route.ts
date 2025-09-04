import { NextResponse } from "next/server";
import { query } from "@/lib-server/db";

type GetBody =
    | { function: "contact"; branch_id: string }
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

        if (fn === "contact") {
            if (!body.branch_id) {
                return NextResponse.json(
                    { success: false, message: "กรุณาระบุ branch_id" },
                    { status: 400 }
                );
            }
            const rows = await query(
                `
        SELECT contact_id, branch_id, name, email, tel, is_active,
               created_by, created_date, updated_by, updated_date
        FROM data_contact_customers
        WHERE branch_id = ?
        ORDER BY created_date DESC
        `,
                [body.branch_id]
            );
            return NextResponse.json({ success: true, data: rows });
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
