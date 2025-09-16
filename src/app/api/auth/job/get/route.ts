import { NextResponse } from "next/server";
import { query } from "@/lib-server/db";

type GetBody =
    | { function: "job"; }
    | { function: "jobById", project_id: string; }
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
      s.status_name,
      c.customer_name,
      b.branch_name,
      TIMESTAMP(j.job_start_date, j.job_start_time) AS start_date, -- ✅ ใหม่
      TIMESTAMP(j.job_end_date,   j.job_end_time)   AS end_date    -- ✅ ใหม่
    FROM data_jobs j
    LEFT JOIN data_projects        p ON p.project_id   = j.project_id
    LEFT JOIN data_teams           t ON t.team_id      = j.team_id
    LEFT JOIN master_job_status    s ON s.status_id    = j.status_id
    LEFT JOIN master_customers     c ON c.customer_id  = j.customer_id
    LEFT JOIN data_customer_branchs b ON b.branch_id   = j.branch_id
    ORDER BY j.created_date DESC
  `);

            return NextResponse.json({ success: true, data: rows || [] });
        }

        if (fn === "jobById") {
            const rows = await query(`
                SELECT
                j.*,
                p.project_name,
                t.team_name,
                s.status_name,
                c.customer_name,
                b.branch_name
                FROM data_jobs j
                LEFT JOIN data_projects p ON p.project_id = j.project_id
                LEFT JOIN data_teams t       ON t.team_id = j.team_id
                LEFT JOIN master_job_status s    ON s.status_id = j.status_id
                LEFT JOIN master_customers c   ON c.customer_id = j.customer_id
                LEFT JOIN data_customer_branchs b ON b.branch_id = j.branch_id
                WHERE j.project_id = ?
                ORDER BY j.created_date DESC
            `, [body.project_id]);

            return NextResponse.json({ success: true, data: rows || [] });
        }

        return NextResponse.json({ success: false, message: "ไม่รู้จัก function ที่ส่งมา" }, { status: 400 });
    } catch (err: any) {
        console.error("DB Error:", err);
        return NextResponse.json(
            { success: false, message: "Database error", error: err.message },
            { status: 500 }
        );
    }
}
