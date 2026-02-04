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

            // ✅ รับค่า form_code จาก frontend ถ้ามี (ใช้ตอน update)
            const form_code = data.form_code || generateId("FORM");
            const form_data = JSON.stringify(data);

            // ✅ ดึงค่าหลักจาก frontend
            const job_id = data.job_id || "";
            const form_status = data.form_status || "";
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
                    form_status,
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
                (form_code, form_data, is_active, created_by, created_date, updated_by, updated_date, form_status, job_id, equipment_id)
            VALUES (?, ?, ?, ?, NOW(), ?, NOW(), ?, ?, ?)
        `;
                await query(insertSql, [
                    form_code,
                    form_data,
                    isActive,
                    createdBy,
                    updatedBy,
                    "ASSIGNED",
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

        // ✅ APPROVE FORM
        if (entity === "approve") {
            const form_code = body.form_code || data.form_code;
            const updatedBy = body.updated_by || data.updated_by || "system";

            // 1. สร้างตัวแปรวันที่ปัจจุบัน
            const updatedDate = new Date();

            if (!form_code) {
                return NextResponse.json(
                    { success: false, message: "กรุณาระบุ form_code" },
                    { status: 400 }
                );
            }

            // 2. เปลี่ยน NOW() เป็น ? เพื่อรับค่าจากตัวแปร
            const updateSql = `
                UPDATE formdata_sign_forms
                SET 
                    form_status = ?,
                    updated_by = ?,
                    updated_date = ? 
                WHERE form_code = ?
            `;

            // 3. เพิ่ม updatedDate เข้าไปใน parameters
            const result = await query(updateSql, [
                "APPROVED",
                updatedBy,
                updatedDate, // ✅ ส่งวันที่เข้าไป
                form_code
            ]);

            if ((result as any).affectedRows === 0) {
                return NextResponse.json(
                    { success: false, message: "ไม่พบรหัสฟอร์มนี้ในระบบ" },
                    { status: 404 }
                );
            }

            // 4. ส่ง updated_date กลับไปให้ Frontend อัปเดต State
            return NextResponse.json({
                success: true,
                message: "อนุมัติรายการสำเร็จ",
                form_code,
                status: "APPROVED",
                updated_date: updatedDate, // ✅ ส่งกลับไปให้หน้าบ้านใช้ต่อ
                updated_by: updatedBy      // ✅ ส่งชื่อคนอนุมัติกลับไปด้วย (เผื่อใช้)
            });
        }

        // ✅ CHECK APPROVE (ตรวจสอบก่อนอนุมัติ)
        if (entity === "check_approve") {
            const { job_id, equipment_id } = data;

            if (!job_id || !equipment_id) {
                return NextResponse.json(
                    { success: false, message: "กรุณาระบุ job_id และ equipment_id" },
                    { status: 400 }
                );
            }

            // ค้นหา record ที่ตรงกัน (เพิ่ม form_status ใน SELECT)
            const sql = `
                SELECT form_data, form_status 
                FROM formdata_sign_forms 
                WHERE job_id = ? AND equipment_id = ? 
                LIMIT 1
            `;

            const rows = await query(sql, [job_id, equipment_id]);

            // เงื่อนไขที่ 1: ไม่มี Record เลย -> ส่งกลับ false
            if (rows.length === 0) {
                return NextResponse.json({
                    success: false,
                    message: "ไม่พบข้อมูลฟอร์มสำหรับงานนี้"
                });
            }

            const row = rows[0];

            // เงื่อนไขที่ 2: มี Record แต่ form_data เป็น null, ว่าง, หรือ JSON ว่าง -> ส่งกลับ false
            if (!row.form_data || row.form_data === "" || row.form_data === "{}" || row.form_data === "[]") {
                return NextResponse.json({
                    success: false,
                    message: "พบฟอร์มแต่ยังไม่ได้บันทึกข้อมูล (No Form Data)"
                });
            }

            // ✅ เงื่อนไขที่ 3 (ใหม่): เช็คสถานะต้องห้าม
            // ถ้าสถานะเป็น ASSIGNED, ACCEPTED, APPROVED, COMPLETED -> ส่งกลับ false
            const invalidStatuses = ["ASSIGNED", "ACCEPTED", "APPROVED", "COMPLETED"];

            if (invalidStatuses.includes(row.form_status)) {
                return NextResponse.json({
                    success: false,
                    message: `ไม่สามารถอนุมัติได้เนื่องจากสถานะเป็น ${row.form_status}`
                });
            }

            // เงื่อนไขที่ 4: ข้อมูลครบ และสถานะถูกต้อง -> ส่งกลับ true
            return NextResponse.json({
                success: true,
                message: "ข้อมูลครบถ้วน พร้อมอนุมัติ"
            });
        }

        // ✅ CHECK SAVE (ตรวจสอบสิทธิ์การบันทึก - Logic ใหม่)
        if (entity === "check_save") {
            const { job_id, equipment_id } = data;

            if (!job_id || !equipment_id) {
                return NextResponse.json(
                    { success: false, message: "กรุณาระบุ job_id และ equipment_id" },
                    { status: 400 }
                );
            }

            // ค้นหา record
            const sql = `
                SELECT form_status 
                FROM formdata_sign_forms 
                WHERE job_id = ? AND equipment_id = ? 
                LIMIT 1
            `;

            const rows = await query(sql, [job_id, equipment_id]);

            // เงื่อนไขที่ 1: ไม่พบข้อมูลเลย -> ให้เป็น True (อนุญาตให้สร้าง/บันทึกใหม่ได้)
            if (rows.length === 0) {
                return NextResponse.json({
                    success: true,
                    message: "สามารถบันทึกได้ (สร้างข้อมูลใหม่)"
                });
            }

            const row = rows[0];
            const status = row.form_status;

            // เงื่อนไขที่ 2: พบข้อมูล ต้องเป็นสถานะที่กำหนดเท่านั้นถึงจะเป็น True
            const allowedStatuses = ["ACCEPTED", "IN_PROGRESS", "REVISE"];

            if (allowedStatuses.includes(status)) {
                return NextResponse.json({
                    success: true,
                    message: "สามารถบันทึกได้"
                });
            } else {
                // เงื่อนไขที่ 3: นอกเหนือจากนั้น (เช่น APPROVED, COMPLETED, ASSIGNED) -> เป็น False
                return NextResponse.json({
                    success: false,
                    message: `ไม่สามารถบันทึกได้เนื่องจากสถานะเป็น ${status}`
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