import { NextResponse } from "next/server";
import { query } from "@/lib-server/db";
import { generateId } from "@/lib/fetcher";

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

        // ✅ FORM 1_3
        if (entity === "form1_3") {
            const report_no = 1;
            const form_no = 3;

            // ✅ รับค่า form_code จาก frontend ถ้ามี (ใช้ตอน update)
            const form_code = data.form_code || generateId("FORM1_3");
            const form_data = JSON.stringify(data);

            // ✅ ดึงค่าหลักจาก frontend
            const job_id = data.job_id || "";
            const equipment_id = data.equipment_id || "";
            const createdBy = data.created_by || "unknown";
            const updatedBy = data.updated_by || createdBy;
            const isActive = data.is_active ?? 1;

            // ✅ เช็คว่ามี form_code นี้ในฐานข้อมูลหรือยัง
            const checkSql = `SELECT id FROM formdata_sign_forms WHERE form_code = ? LIMIT 1`;
            const existing = await query(checkSql, [form_code]);

            if (existing.length > 0) {
                // 🔄 UPDATE (มีอยู่แล้ว)
                const updateSql = `
            UPDATE formdata_sign_forms
            SET 
                form_data = ?,
                updated_by = ?,
                updated_date = NOW(),
                form_status = ?,
                is_active = ?,
                job_id = ?,
                equipment_id = ?
            WHERE form_code = ?
        `;
                await query(updateSql, [
                    form_data,
                    updatedBy,
                    "success",
                    isActive,
                    job_id,
                    equipment_id,
                    form_code,
                ]);

                return NextResponse.json({
                    success: true,
                    message: "อัปเดตข้อมูลสำเร็จ",
                    form_code,
                    mode: "update",
                });
            } else {
                // 🆕 INSERT (ยังไม่มี)
                const insertSql = `
            INSERT INTO formdata_sign_forms 
                (report_no, form_no, form_code, form_data, is_active, created_by, created_date, updated_by, updated_date, form_status, job_id, equipment_id)
            VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, NOW(), ?, ?, ?)
        `;
                await query(insertSql, [
                    report_no,
                    form_no,
                    form_code,
                    form_data,
                    isActive,
                    createdBy,
                    updatedBy,
                    "success",
                    job_id,
                    equipment_id,
                ]);

                return NextResponse.json({
                    success: true,
                    message: "สร้างข้อมูลใหม่สำเร็จ",
                    form_code,
                    mode: "create",
                });
            }
        }

        if (entity === "form1_9") {
            const report_no = 1;
            const form_no = 9;

            const form_code = data.form_code || generateId("FORM1_9");
            const form_data = JSON.stringify(data);

            const job_id = data.job_id || "";
            const equipment_id = data.equipment_id || "";
            const createdBy = data.created_by || "unknown";
            const updatedBy = data.updated_by || createdBy;
            const isActive = data.is_active ?? 1;

            const checkSql = `SELECT id FROM formdata_sign_forms WHERE form_code = ? LIMIT 1`;
            const existing = await query(checkSql, [form_code]);

            if (existing.length > 0) {
                const updateSql = `
            UPDATE formdata_sign_forms
            SET 
                form_data = ?,
                updated_by = ?,
                updated_date = NOW(),
                form_status = ?,
                is_active = ?,
                job_id = ?,
                equipment_id = ?
            WHERE form_code = ?
        `;
                await query(updateSql, [
                    form_data,
                    updatedBy,
                    "success",
                    isActive,
                    job_id,
                    equipment_id,
                    form_code,
                ]);

                return NextResponse.json({
                    success: true,
                    message: "อัปเดตข้อมูลสำเร็จ",
                    form_code,
                    mode: "update",
                });
            } else {
                const insertSql = `
            INSERT INTO formdata_sign_forms 
                (report_no, form_no, form_code, form_data, is_active, created_by, created_date, updated_by, updated_date, form_status, job_id, equipment_id)
            VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, NOW(), ?, ?, ?)
        `;
                await query(insertSql, [
                    report_no,
                    form_no,
                    form_code,
                    form_data,
                    isActive,
                    createdBy,
                    updatedBy,
                    "success",
                    job_id,
                    equipment_id,
                ]);

                return NextResponse.json({
                    success: true,
                    message: "บันทึกข้อมูลสำเร็จ",
                    form_code,
                    mode: "create",
                });
            }
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
