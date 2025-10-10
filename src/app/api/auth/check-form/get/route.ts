// app/api/auth/inspection-form/get/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib-server/db";

type GetBody = { function: "serviceZone"; customer_id: string };

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

        if (fn === "serviceZone") {
            const customer_id = String(body.customer_id ?? "").trim();
            if (!customer_id) {
                return NextResponse.json(
                    { success: false, message: "กรุณาระบุ customer_id" },
                    { status: 400 }
                );
            }

            const rows = await query(
                `
        SELECT
          e.customer_id,
          e.service_inspec_id,
          e.service_id,
          e.zone_id,
          z.zone_name,
          e.is_active,
          e.created_by,
          e.updated_by,
          e.created_date,
          e.updated_date
        FROM data_service_equipment e
        LEFT JOIN data_service_form z ON z.zone_id = e.zone_id
        WHERE e.customer_id = ?
        ORDER BY z.zone_name ASC, e.created_date DESC
        `,
                [customer_id]
            );

            return NextResponse.json({ success: true, data: rows || [] });
        }

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
