import { NextResponse } from "next/server";
import { query } from "@/lib-server/db";

type GetBody =
    | { function: "equipment"; job_id: string }
    | { function: "serviceItem"; customer_id: string }
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

        if (fn === "serviceItem") {
            const customer_id = (body.customer_id ?? "").trim();
            if (!customer_id) {
                return NextResponse.json(
                    { success: false, message: "กรุณาระบุ customer_id" },
                    { status: 400 }
                );
            }

            const rowsOf = (r: any): any[] => {
                if (Array.isArray(r)) {
                    if (Array.isArray(r[0]) && r.length === 2) return r[0]; // mysql2/promise [rows, fields]
                    return r;
                }
                return [];
            };

            // 1) ดึงเอกสารทั้งหมดของ branch
            const eqRes = await query(
                `
    SELECT *
    FROM data_service_equipment
    WHERE customer_id = ?
    ORDER BY updated_date DESC, created_date DESC
    `,
                [customer_id]
            );
            const equipments = rowsOf(eqRes);

            if (!equipments.length) {
                return NextResponse.json({ success: true, data: [] });
            }

            const ids = equipments.map((e: any) => e.service_inspec_id);

            // 2) ดึง groups+items ของทุกเอกสาร
            const giRes = await query(
                `
    SELECT
      g.service_inspec_id,
      g.inspection_id,
      g.inspection_name,
      i.inspection_item_id,
      i.inspection_item_name
    FROM data_service_equipment_group g
    LEFT JOIN data_service_equipment_item i
           ON i.inspection_id = g.inspection_id
    WHERE g.service_inspec_id IN (?)
    ORDER BY g.service_inspec_id, g.inspection_id, i.inspection_item_id
    `,
                [ids]
            );
            const gi = rowsOf(giRes);

            // 3) จัดกลุ่ม inspection ตาม service_inspec_id
            const groupsByDoc: Record<string, any> = {};
            for (const r of gi) {
                if (!groupsByDoc[r.service_inspec_id]) {
                    groupsByDoc[r.service_inspec_id] = {};
                }
                if (!groupsByDoc[r.service_inspec_id][r.inspection_id]) {
                    groupsByDoc[r.service_inspec_id][r.inspection_id] = {
                        service_inspec_id: r.service_inspec_id,
                        inspection_id: r.inspection_id,
                        inspection_name: r.inspection_name,
                        items: []
                    };
                }
                if (r.inspection_item_id) {
                    groupsByDoc[r.service_inspec_id][r.inspection_id].items.push({
                        inspection_id: r.inspection_id,
                        inspection_item_id: r.inspection_item_id,
                        inspection_item_name: r.inspection_item_name
                    });
                }
            }

            // 4) pack เป็น array ของแต่ละ equipment
            const data = equipments.map((e: any) => {
                const inspections = groupsByDoc[e.service_inspec_id]
                    ? Object.values(groupsByDoc[e.service_inspec_id])
                    : [];
                return {
                    customer_id: e.customer_id,
                    service_inspec_id: e.service_inspec_id,
                    service_id: e.service_id,
                    zone_id: e.zone_id,
                    is_active: e.is_active,
                    created_by: e.created_by,
                    updated_by: e.updated_by,
                    inspection: inspections
                };
            });

            return NextResponse.json({ success: true, data });
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
