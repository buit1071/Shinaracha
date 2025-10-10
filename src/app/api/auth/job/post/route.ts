import { NextResponse } from "next/server";
import { query } from "@/lib-server/db";
import { generateId, toNull, toMysqlDate, toMysqlTime } from "@/lib/fetcher";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const entity = body?.entity as undefined;
        const data = body?.data ?? {};

        if (!entity) {
            return NextResponse.json(
                { success: false, message: "กรุณาระบุ entity" },
                { status: 400 }
            );
        }

        // =========== Job ===========
        if (entity === "job") {
            const {
                job_id,
                job_name,
                project_id,
                shift_next_jobs,
                job_start_date,
                job_end_date,
                job_start_time,
                job_end_time,
                team_id,
                status_id,
                customer_id,
                is_active,
                created_by,
                updated_by,
            } = data;

            if (!job_name) {
                return NextResponse.json(
                    { success: false, message: "กรุณาระบุ job_name" },
                    { status: 400 }
                );
            }
            if (!project_id) {
                return NextResponse.json(
                    { success: false, message: "กรุณาระบุ project_id" },
                    { status: 400 }
                );
            }

            const newJobId = job_id || generateId("JOB");

            await query(
                `
  INSERT INTO data_jobs (
    job_id, job_name, project_id, shift_next_jobs,
    job_start_date, job_end_date, job_start_time, job_end_time,
    team_id, status_id, customer_id, 
    is_active, created_by, updated_by, created_date, updated_date
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
  ON DUPLICATE KEY UPDATE
    job_name = VALUES(job_name),
    project_id = VALUES(project_id),
    shift_next_jobs = VALUES(shift_next_jobs),
    job_start_date = VALUES(job_start_date),
    job_end_date = VALUES(job_end_date),
    job_start_time = VALUES(job_start_time),
    job_end_time = VALUES(job_end_time),
    team_id = VALUES(team_id),
    status_id = VALUES(status_id),
    customer_id = VALUES(customer_id),
    is_active = VALUES(is_active),
    updated_by = VALUES(updated_by),
    updated_date = NOW()
  `,
                [
                    newJobId,
                    job_name,
                    project_id,
                    toNull(shift_next_jobs),
                    toMysqlDate(job_start_date), // <-- แปลงเป็น YYYY-MM-DD
                    toMysqlDate(job_end_date),   // <--
                    toMysqlTime(job_start_time), // <-- แปลงเป็น HH:MM:SS
                    toMysqlTime(job_end_time),   // <--
                    toNull(team_id),
                    toNull(status_id),
                    toNull(customer_id),
                    Number(is_active ?? 1),
                    toNull(created_by ?? "system"),
                    toNull(updated_by ?? "system"),
                ]
            );

            return NextResponse.json({
                success: true,
                message: job_id ? "อัปเดตงานสำเร็จ" : "สร้างงานสำเร็จ",
                job_id: newJobId,
            });
        }

        // entity ไม่ตรง
        return NextResponse.json(
            { success: false, message: "entity ไม่ถูกต้อง" },
            { status: 400 }
        );
    } catch (err: any) {
        
        return NextResponse.json(
            { success: false, message: "Database error", error: err.message },
            { status: 500 }
        );
    }
}