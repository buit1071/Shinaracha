import { NextResponse } from "next/server";
import { query } from "@/lib-server/db";

type GetBody =
    | { function: "job"; }
    | { function: "jobsById", project_id: string; }
    | { function: "jobById", job_id: string; }
    | { function: "equipmentByJobId", job_id: string; }
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

        if (fn === "job") {
            const rows = await query(`
                SELECT
                j.*,
                p.project_name,
                t.team_name,
                b.branch_name
                FROM data_jobs j
                LEFT JOIN data_projects p ON p.project_id = j.project_id
                LEFT JOIN data_teams t       ON t.team_id = j.team_id
                LEFT JOIN data_customer b ON b.customer_id = j.customer_id
                ORDER BY j.created_date DESC
            `);

            return NextResponse.json({ success: true, data: rows || [] });
        }

        if (fn === "jobsById") {
            const rows = await query(`
                SELECT
                j.*,
                p.project_name,
                t.team_name,
                b.branch_name,
                (SELECT COUNT(*) FROM data_job_equipments WHERE job_id = j.job_id) AS equipment_count
                FROM data_jobs j
                LEFT JOIN data_projects p ON p.project_id = j.project_id
                LEFT JOIN data_teams t       ON t.team_id = j.team_id
                LEFT JOIN data_customer b ON b.customer_id = j.customer_id
                WHERE j.project_id = ?
                ORDER BY j.created_date DESC
            `, [body.project_id]);

            return NextResponse.json({ success: true, data: rows || [] });
        }

        if (fn === "equipmentByJobId") {
            const rows = await query(
                `
    SELECT
      dje.row_id,
      dje.job_id,
      dje.equipment_id,
      COALESCE(dje.equipment_name, me.equipment_name) AS equipment_name,
      dje.is_active,
      dje.created_by,
      dje.updated_by,
      dje.created_date,
      dje.updated_date,
      me.zone_id,
      COALESCE(z.zone_name, '') AS zone_name,
      
      -- ✅ เพิ่ม field นี้เพื่อให้แสดงใน DataGrid
      fsf.form_status

    FROM data_job_equipments AS dje
    LEFT JOIN master_equipments  AS me ON me.equipment_id = dje.equipment_id
    LEFT JOIN data_service_form  AS z  ON z.zone_id       = me.zone_id
    
    -- ✅ Join ตาราง formdata_sign_forms เพื่อดึงสถานะ
    LEFT JOIN formdata_sign_forms AS fsf 
        ON fsf.job_id = dje.job_id 
        AND fsf.equipment_id = dje.equipment_id

    WHERE dje.job_id = ?
    ORDER BY dje.created_date DESC
    `,
                [body.job_id]
            );

            return NextResponse.json({ success: true, data: rows || [] });
        }

        if (fn === "jobById") {
            const rows = await query(`
                SELECT *
                FROM data_jobs
                WHERE job_id = ?
            `, [body.job_id]);

            return NextResponse.json({ success: true, data: rows[0] || null });
        }

        return NextResponse.json({ success: false, message: "ไม่รู้จัก function ที่ส่งมา" }, { status: 400 });
    } catch (err: any) {

        return NextResponse.json(
            { success: false, message: "Database error", error: err.message },
            { status: 500 }
        );
    }
}
