import { NextResponse } from "next/server";
import { query } from "@/lib-server/db";
import { generateId } from "@/lib/fetcher";

export async function POST(req: Request) {
    try {
        const { entity, data = {} } = (await req.json()) as {
            entity?: string;
            data?: any;
        };

        if (!entity) {
            return NextResponse.json(
                { success: false, message: "กรุณาระบุ entity" },
                { status: 400 }
            );
        }

        // =========== Equipment ===========
        if (entity === "equipment") {
            try {
                let {
                    row_id,
                    job_id,
                    equipment_id,
                    equipment_name,
                    is_active,
                    created_by,
                    updated_by,
                } = data ?? {};

                // ---- Normalize / Validate ----
                const rowId = String(row_id ?? "").trim();
                const jobId = String(job_id ?? "").trim();
                const equipId = String(equipment_id ?? "").trim();
                const equipName = String(equipment_name ?? "").trim();
                const createdBy = (String(created_by ?? "system").trim() || "system");
                const updatedBy = (String(updated_by ?? "system").trim() || "system");

                if (!jobId) return NextResponse.json({ success: false, message: "กรุณาระบุ job_id" }, { status: 400 });
                if (!equipId) return NextResponse.json({ success: false, message: "กรุณาระบุ equipment_id" }, { status: 400 });
                if (!equipName) return NextResponse.json({ success: false, message: "กรุณาระบุ equipment_name" }, { status: 400 });

                const activeVal = typeof is_active === "string" ? (parseInt(is_active, 10) || 1) : (is_active ?? 1);
                const isTempId = rowId.startsWith("TMP-");

                // ---- UPDATE path (มี row_id จริง และไม่ใช่ TMP-) ----
                if (rowId && !isTempId) {
                    // กันซ้ำใน job เดียวกัน (ยกเว้นแถวตัวเอง)
                    const dup: any = await query(
                        `SELECT 1 FROM data_job_equipments
         WHERE job_id = ? AND equipment_id = ? AND row_id <> ?
         LIMIT 1`,
                        [jobId, equipId, rowId]
                    );
                    if (dup.length > 0) {
                        return NextResponse.json(
                            { success: false, message: `มีอุปกรณ์ ${equipName} ในงานนี้แล้ว` },
                            { status: 400 }
                        );
                    }

                    const upd: any = await query(
                        `UPDATE data_job_equipments
           SET equipment_id = ?,
               job_id = ?,
               equipment_name = ?,
               is_active = ?,
               updated_by = ?,
               updated_date = NOW()
         WHERE row_id = ?`,
                        [equipId, jobId, equipName, activeVal, updatedBy, rowId]
                    );
                    const affected = upd?.affectedRows ?? upd?.[0]?.affectedRows ?? 0;

                    // ถ้าอัปเดตไม่โดนแถวใด (row_id ไม่พบ) → ไหลไป INSERT ด้านล่าง
                    if (affected > 0) {
                        return NextResponse.json({
                            success: true,
                            message: "แก้ไขข้อมูลเรียบร้อย",
                            row_id: rowId,
                            equipment_id: equipId,
                        });
                    }
                }

                // ---- INSERT path (ไม่มี row_id หรือเป็น TMP- หรือ UPDATE ไม่พบแถว) ----
                const dup2: any = await query(
                    `SELECT 1 FROM data_job_equipments
       WHERE job_id = ? AND equipment_id = ?
       LIMIT 1`,
                    [jobId, equipId]
                );
                if (dup2.length > 0) {
                    return NextResponse.json(
                        { success: false, message: `มีอุปกรณ์ ${equipName} (${equipId}) ในงานนี้แล้ว` },
                        { status: 400 }
                    );
                }

                const newRowId = await generateId("ROW");
                await query(
                    `INSERT INTO data_job_equipments
         (row_id, equipment_id, job_id, equipment_name, is_active, created_by, created_date, updated_by, updated_date)
       VALUES
         (?, ?, ?, ?, ?, ?, NOW(), ?, NOW())`,
                    [newRowId, equipId, jobId, equipName, activeVal, createdBy, updatedBy]
                );

                return NextResponse.json({
                    success: true,
                    message: "บันทึกข้อมูลเรียบร้อย",
                    row_id: newRowId,
                    equipment_id: equipId,
                });
            } catch (err) {
                return NextResponse.json(
                    { success: false, message: "เกิดข้อผิดพลาดฝั่งเซิร์ฟเวอร์" },
                    { status: 500 }
                );
            }
        }

    } catch (err: any) {
        
        return NextResponse.json(
            { success: false, message: "Database error", error: err?.message },
            { status: 500 }
        );
    }
}
