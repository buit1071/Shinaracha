// app/api/auth/inspection-form/get/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib-server/db";

type GetBody =
    | { function: "ProvinceOption" }
    | { function: "DistrictOption" }
    | { function: "SubDistrictOption" }
    | { function: "DistrictOptionByProvinceId", province_id: string }
    | { function: "SubDistrictOptionByDistrictId", district_id: string }
    | { function: "ViewEquipment", job_id: string, equipment_id: string }
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

        if (fn === "ProvinceOption") {
            const rows = await query(`
        SELECT *
        FROM master_provinces
        ORDER BY id
      `);
            return NextResponse.json({ success: true, data: rows });
        }

        if (fn === "DistrictOption") {
            const rows = await query(`
        SELECT *
        FROM master_districts
        ORDER BY id
      `);
            return NextResponse.json({ success: true, data: rows });
        }

        if (fn === "SubDistrictOption") {
            const rows = await query(`
        SELECT *
        FROM master_subdistricts
        ORDER BY id
      `);
            return NextResponse.json({ success: true, data: rows });
        }

        if (fn === "DistrictOptionByProvinceId") {
            const rows = await query(
                `SELECT *
     FROM master_districts
     WHERE province_id = ?
     ORDER BY id`,
                [body.province_id]
            );
            return NextResponse.json({ success: true, data: rows });
        }

        if (fn === "SubDistrictOptionByDistrictId") {
            const rows = await query(
                `SELECT *
     FROM master_subdistricts
     WHERE district_id = ?
     ORDER BY id`,
                [body.district_id]
            );
            return NextResponse.json({ success: true, data: rows });
        }

        if (fn === "ViewEquipment") {
            const rows = await query(
                `SELECT *
     FROM view_data_form
     WHERE job_id = ? AND equipment_id = ?
     LIMIT 1`,
                [body.job_id, body.equipment_id]
            );
            return NextResponse.json({ success: true, data: rows[0] ?? null });
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
