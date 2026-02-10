import { NextResponse } from "next/server";
import { query } from "@/lib-server/db";

type GetBody =
    | { function: "form1_3"; job_id: string; equipment_id: string }
    | { function: "viewEq"; equipment_id: string }
    | { function: "RCheckIn"; job_id: string; equipment_id: string }
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

        if (fn === "viewEq") {
            const sql = `
                SELECT 
                    me.*,
                    
                    -- แปลง ID เป็นชื่อไทย (ที่อยู่ป้าย)
                    sd.name_th AS sub_district_name,
                    d.name_th AS district_name,
                    p.name_th AS province_name,

                    -- แปลง ID เป็นชื่อไทย (ที่อยู่เจ้าของป้าย)
                    osd.name_th AS owner_sub_district_name,
                    od.name_th AS owner_district_name,
                    op.name_th AS owner_province_name,

                    -- แปลง ID เป็นชื่อไทย (ที่อยู่เจ้าของอาคาร)
                    bsd.name_th AS building_owner_sub_district_name,
                    bd.name_th AS building_owner_district_name,
                    bp.name_th AS building_owner_province_name

                FROM master_equipments me
                
                -- JOIN ที่อยู่ป้าย (แก้ตรง ON ...)
                LEFT JOIN master_subdistricts sd ON sd.sub_district_id = me.sub_district_id
                LEFT JOIN master_districts d     ON d.district_id      = me.district_id
                LEFT JOIN master_provinces p     ON p.province_id      = me.province_id

                -- JOIN ที่อยู่เจ้าของป้าย (แก้ตรง ON ...)
                LEFT JOIN master_subdistricts osd ON osd.sub_district_id = me.owner_sub_district_id
                LEFT JOIN master_districts od     ON od.district_id      = me.owner_district_id
                LEFT JOIN master_provinces op     ON op.province_id      = me.owner_province_id

                -- JOIN ที่อยู่เจ้าของอาคาร (แก้ตรง ON ...)
                LEFT JOIN master_subdistricts bsd ON bsd.sub_district_id = me.building_owner_sub_district_id
                LEFT JOIN master_districts bd     ON bd.district_id      = me.building_owner_district_id
                LEFT JOIN master_provinces bp     ON bp.province_id      = me.building_owner_province_id

                WHERE me.equipment_id = ?
            `;

            const rows = await query(sql, [body.equipment_id]);

            return NextResponse.json({ success: true, data: rows[0] || null });
        }

        if (fn === "RCheckIn") {

            const rows = await query(
                `SELECT * FROM data_job_checkins WHERE job_id = ? AND equipment_id = ? LIMIT 1`,
                [body.job_id, body.equipment_id]
            );

            if (rows.length > 0) {
                // ถ้ามีข้อมูล -> return true พร้อม data
                return NextResponse.json({
                    success: true,
                    exists: true,
                    data: rows[0]
                });
            } else {
                // ถ้าไม่มีข้อมูล -> return false
                return NextResponse.json({
                    success: true,
                    exists: false,
                    data: null
                });
            }
        }

        return NextResponse.json({ success: false, message: "ไม่รู้จัก function ที่ส่งมา" }, { status: 400 });
    } catch (err: any) {

        return NextResponse.json(
            { success: false, message: "Database error", error: err.message },
            { status: 500 }
        );
    }
}
