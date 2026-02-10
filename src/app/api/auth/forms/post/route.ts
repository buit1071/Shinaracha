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
            const form_data = JSON.stringify(data); // เก็บข้อมูลทั้งหมดลง JSON

            // ✅ ดึงค่าหลักจาก frontend
            const job_id = data.job_id || "";
            const equipment_id = data.equipment_id || "";
            const form_status = data.form_status || "IN_PROGRESS";
            const updatedBy = data.updated_by || data.created_by || "unknown"; // ใช้คนแก้ไข หรือคนสร้าง ถ้าไม่มี use unknown
            const isActive = data.is_active ?? 1;

            // ตรวจสอบข้อมูลจำเป็น
            if (!job_id || !equipment_id) {
                return NextResponse.json(
                    { success: false, message: "job_id หรือ equipment_id หายไป" },
                    { status: 400 }
                );
            }

            try {
                // ✅ 🔄 UPDATE (หาจาก job_id และ equipment_id)
                const updateSql = `
                    UPDATE formdata_sign_forms
                    SET 
                        form_data = ?,
                        updated_by = ?,
                        updated_date = NOW(),
                        form_status = ?,
                        is_active = ?
                    WHERE job_id = ? AND equipment_id = ?
                `;

                const result = await query(updateSql, [
                    form_data,
                    updatedBy,
                    form_status,
                    isActive,
                    job_id,
                    equipment_id
                ]);

                // ตรวจสอบว่ามีแถวถูกอัปเดตไหม (ถ้า 0 แปลว่าไม่พบข้อมูล)
                if ((result as any).affectedRows === 0) {
                    return NextResponse.json({
                        success: false,
                        message: "ไม่พบข้อมูลฟอร์มที่ต้องการอัปเดต (อาจยังไม่ได้ Check In)",
                    });
                }

                return NextResponse.json({
                    success: true,
                    message: "อัปเดตข้อมูลสำเร็จ",
                    mode: "update",
                });

            } catch (error: any) {
                console.error("Database Error (form1_3):", error);
                return NextResponse.json(
                    { success: false, message: "เกิดข้อผิดพลาดในการอัปเดต", error: error.message },
                    { status: 500 }
                );
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

        if (entity === "SaveCheckIn") {
            const {
                job_id,
                equipment_id,
                check_in_by,
                check_in_lat,
                check_in_long,
                check_in_image
            } = body.data;

            // ตรวจสอบข้อมูลจำเป็น
            if (!job_id || !equipment_id) {
                return NextResponse.json(
                    { success: false, message: "ข้อมูลไม่ครบถ้วน (job_id หรือ equipment_id หายไป)" },
                    { status: 400 }
                );
            }

            try {
                // 1. บันทึกข้อมูล Check In ลง data_job_checkins
                await query(
                    `INSERT INTO data_job_checkins 
                    (
                        job_id, equipment_id, check_in_by, check_in_date, 
                        check_in_lat, check_in_long, check_in_image, 
                        created_at, updated_at
                    )
                    VALUES (?, ?, ?, NOW(), ?, ?, ?, NOW(), NOW())`,
                    [
                        job_id, equipment_id, check_in_by,
                        check_in_lat, check_in_long, check_in_image
                    ]
                );

                // 2. ✅ เพิ่มข้อมูลลงตาราง formdata_sign_forms (สร้าง Form ใหม่)
                // เช็คก่อนว่ามี Form นี้อยู่แล้วหรือยัง (กัน Duplicate)
                const existingForm = await query(
                    `SELECT id FROM formdata_sign_forms WHERE job_id = ? AND equipment_id = ? LIMIT 1`,
                    [job_id, equipment_id]
                );

                if (existingForm.length === 0) {
                    const newFormCode = generateId("FORM"); // สร้าง ID ใหม่

                    await query(
                        `INSERT INTO formdata_sign_forms 
                        (
                            form_code, 
                            form_data, 
                            is_active, 
                            created_by, 
                            created_date, 
                            updated_by, 
                            updated_date, 
                            form_status, 
                            job_id, 
                            equipment_id
                        )
                        VALUES (?, ?, ?, ?, NOW(), ?, NOW(), ?, ?, ?)`,
                        [
                            newFormCode,
                            JSON.stringify({}), // form_data เป็น JSON ว่าง
                            1, // is_active
                            check_in_by, // created_by
                            check_in_by, // updated_by
                            "ACCEPTED", // form_status
                            job_id,
                            equipment_id
                        ]
                    );
                } else {
                    // (Optional) ถ้ามีอยู่แล้ว อาจจะ Update สถานะเป็น ACCEPTED ก็ได้ ถ้าต้องการ
                    await query(
                        `UPDATE formdata_sign_forms SET form_status = 'ACCEPTED', updated_by = ?, updated_date = NOW() 
                         WHERE job_id = ? AND equipment_id = ?`,
                        [check_in_by, job_id, equipment_id]
                    );
                }

                return NextResponse.json({
                    success: true,
                    message: "บันทึกเวลาเข้างานและสร้างเอกสารเรียบร้อยแล้ว",
                });

            } catch (error: any) {
                console.error("Database Error (SaveCheckIn):", error);
                return NextResponse.json(
                    { success: false, message: "เกิดข้อผิดพลาดในการบันทึกข้อมูล", error: error.message },
                    { status: 500 }
                );
            }
        }

        if (entity === "SaveCheckOut") {
            const {
                job_id,
                equipment_id,
                check_out_by,
                check_out_lat,
                check_out_long,
                check_out_image
            } = body.data;

            // ตรวจสอบข้อมูลจำเป็น
            if (!job_id || !equipment_id) {
                return NextResponse.json(
                    { success: false, message: "ข้อมูลไม่ครบถ้วน (job_id หรือ equipment_id หายไป)" },
                    { status: 400 }
                );
            }

            try {
                // อัปเดตข้อมูล Check Out ลง data_job_checkins
                // โดยหาแถวที่ตรงกับ job_id + equipment_id และยังไม่มีการ Check Out (check_out_date IS NULL)
                const result = await query(
                    `UPDATE data_job_checkins 
                     SET 
                        check_out_by = ?, 
                        check_out_date = NOW(), 
                        check_out_lat = ?, 
                        check_out_long = ?, 
                        check_out_image = ?, 
                        updated_at = NOW()
                     WHERE job_id = ? 
                       AND equipment_id = ? 
                       AND check_out_date IS NULL`,
                    [
                        check_out_by,
                        check_out_lat,
                        check_out_long,
                        check_out_image,
                        job_id,
                        equipment_id
                    ]
                );

                // ตรวจสอบว่ามีการอัปเดตจริงไหม (ถ้า result.affectedRows = 0 แสดงว่าอาจจะ Check Out ไปแล้ว หรือไม่พบข้อมูล Check In)
                if ((result as any).affectedRows === 0) {
                    return NextResponse.json({
                        success: false,
                        message: "ไม่พบข้อมูล Check In หรืออาจมีการ Check Out ไปแล้ว",
                    });
                }

                return NextResponse.json({
                    success: true,
                    message: "บันทึกเวลาออกงานเรียบร้อยแล้ว",
                    data: result
                });

            } catch (error: any) {
                console.error("Database Error (SaveCheckOut):", error);
                return NextResponse.json(
                    { success: false, message: "เกิดข้อผิดพลาดในการบันทึกข้อมูล", error: error.message },
                    { status: 500 }
                );
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