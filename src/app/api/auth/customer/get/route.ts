import { NextResponse } from "next/server";
import { query } from "@/lib-server/db";

type GetBody =
    | { function: "customerById"; customer_id: string }
    | { function: "groupByCustomerId"; customer_id: string }
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

        if (fn === "customerById") {
            if (!body.customer_id) {
                return NextResponse.json(
                    { success: false, message: "กรุณาระบุ customer_id" },
                    { status: 400 }
                );
            }

            const rows = await query(
                `SELECT customer_id, customer_name 
     FROM master_customers
     WHERE customer_id = ?`,
                [body.customer_id]
            );

            return NextResponse.json({
                success: true,
                data: rows[0] || null,
            });
        }

        if (fn === "groupByCustomerId") {
            if (!body.customer_id) {
                return NextResponse.json(
                    { success: false, message: "กรุณาระบุ customer_id" },
                    { status: 400 }
                );
            }
            const rows = await query(
                `
        SELECT group_id, customer_id, group_name, is_active,
               created_by, created_date, updated_by, updated_date
        FROM data_group_customers
        WHERE customer_id = ?
        ORDER BY created_date DESC
        `,
                [body.customer_id]
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
