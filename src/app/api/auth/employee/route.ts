import { NextResponse } from "next/server";
import { query } from "@/lib-server/db";

const t = (v?: string | null) =>
    typeof v === "string" ? v.trim() : v ?? null;

type Body = {
    id?: number | null;
    emp_id?: string | null;
    company_id?: string | null;
    first_name_th?: string | null;
    first_name_en?: string | null;
    last_name_th?: string | null;
    last_name_en?: string | null;
    email?: string | null;        // ✅ อนุญาต null
    password?: string | null;     // ✅ อนุญาต null
    permission_id?: string | null;
    image_url?: string | null;    // ✅ เก็บชื่อไฟล์ หรือ null
    is_active?: number | null;
    created_by?: string | null;
    updated_by?: string | null;
};

export async function GET(req: Request) {
    try {
        // อ่าน query param
        const { searchParams } = new URL(req.url);
        const active = searchParams.get("active"); // จะเป็น string หรือ null

        let sql = `
      SELECT * 
      FROM data_employees
    `;

        // ถ้ามี param active และค่าคือ true → กรองเฉพาะ is_active = 1
        if (active === "true" || active === "1") {
            sql += " WHERE is_active = 1";
        }

        sql += " ORDER BY updated_date DESC";

        const rows = await query(sql);

        return NextResponse.json({ success: true, data: rows });
    } catch (err: any) {
        
        return NextResponse.json(
            { success: false, message: "Database error", error: err.message },
            { status: 500 }
        );
    }
}

// POST เพิ่ม/แก้ไข
export async function POST(req: Request) {
    try {
        const body = (await req.json()) as Body;
        const {
            id,
            emp_id,
            company_id,
            first_name_th,
            first_name_en,
            last_name_th,
            last_name_en,
            email,
            password,
            permission_id,
            image_url,
            is_active,
            created_by,
            updated_by,
        } = body;

        // -------- validate (ตามที่คุณต้องการ; ไม่เช็ค email) --------
        if (!t(company_id)) {
            return NextResponse.json({ success: false, message: "กรุณาเลือกบริษัท" }, { status: 400 });
        }
        if (!t(first_name_th)) {
            return NextResponse.json({ success: false, message: "กรุณากรอกชื่อ (ไทย)" }, { status: 400 });
        }
        if (!t(last_name_th)) {
            return NextResponse.json({ success: false, message: "กรุณากรอกนามสกุล (ไทย)" }, { status: 400 });
        }
        if (!t(first_name_en)) {
            return NextResponse.json({ success: false, message: "กรุณากรอกชื่อ (อังกฤษ)" }, { status: 400 });
        }
        if (!t(last_name_en)) {
            return NextResponse.json({ success: false, message: "กรุณากรอกนามสกุล (อังกฤษ)" }, { status: 400 });
        }
        if (!t(permission_id)) {
            return NextResponse.json({ success: false, message: "กรุณาเลือกหน้าที่" }, { status: 400 });
        }

        // -------- normalize (สร้างตัวแปรใหม่ ไม่ทับ destructured) --------
        const companyId = t(company_id)!;     // ผ่าน validate แล้ว => non-null
        const firstNameTh = t(first_name_th)!;
        const firstNameEn = t(first_name_en)!;
        const lastNameTh = t(last_name_th)!;
        const lastNameEn = t(last_name_en)!;
        const emailVal = t(email) && t(email) !== "" ? t(email) : "-";        // string | null
        const passwordVal = t(password);        // string | null
        const permissionId = t(permission_id)!;
        const imageUrl = t(image_url);       // string | null
        const empId = t(emp_id) || undefined; // ''/null => undefined (เพื่อ flow insert)
        const isActive = typeof is_active === "number" ? is_active! : 1;
        const createdBy = t(created_by) ?? "admin";
        const updatedBy = t(updated_by) ?? "admin";

        // ===================== UPDATE ด้วย id (PK) =====================
        if (id && Number.isFinite(id)) {
            const existById = await query(`SELECT id FROM data_employees WHERE id = ? LIMIT 1`, [id]);
            if (!Array.isArray(existById) || existById.length === 0) {
                return NextResponse.json({ success: false, message: "ไม่พบข้อมูลพนักงาน" }, { status: 404 });
            }

            if (passwordVal) {
                await query(
                    `
    UPDATE data_employees
    SET emp_id=?, company_id=?, first_name_th=?, first_name_en=?, last_name_th=?, last_name_en=?,
        email=?, password=?, permission_id=?, image_url=?, is_active=?,
        updated_by=?, updated_date=NOW()
    WHERE id=?
    `,
                    [empId, companyId, firstNameTh, firstNameEn, lastNameTh, lastNameEn,
                        emailVal, passwordVal, permissionId, imageUrl, isActive,
                        updatedBy, id]
                );
            } else {
                await query(
                    `
    UPDATE data_employees
    SET emp_id=?, company_id=?, first_name_th=?, first_name_en=?, last_name_th=?, last_name_en=?,
        email=?, permission_id=?, image_url=?, is_active=?,
        updated_by=?, updated_date=NOW()
    WHERE id=?
    `,
                    [empId, companyId, firstNameTh, firstNameEn, lastNameTh, lastNameEn,
                        emailVal, permissionId, imageUrl, isActive,
                        updatedBy, id]
                );
            }

            return NextResponse.json({ success: true, message: "อัปเดตข้อมูลเรียบร้อย", id });
        }

        // ============ ไม่มี id → เช็ค emp_id ถ้ามีอยู่ = UPDATE, ไม่มีก็ INSERT ============
        if (empId) {
            const exist = await query(`SELECT id FROM data_employees WHERE emp_id = ? LIMIT 1`, [empId]);
            if (Array.isArray(exist) && exist.length > 0) {
                const targetId = exist[0].id;

                if (passwordVal) {
                    await query(
                        `
              UPDATE data_employees
              SET company_id=?, first_name_th=?, first_name_en=?, last_name_th=?, last_name_en=?,
                  email=?, password=?, permission_id=?, image_url=?, is_active=?,
                  updated_by=?, updated_date=NOW()
              WHERE id=?
            `,
                        [companyId, firstNameTh, firstNameEn, lastNameTh, lastNameEn,
                            emailVal, passwordVal, permissionId, imageUrl, isActive,
                            updatedBy, targetId]
                    );
                } else {
                    await query(
                        `
              UPDATE data_employees
              SET company_id=?, first_name_th=?, first_name_en=?, last_name_th=?, last_name_en=?,
                  email=?, permission_id=?, image_url=?, is_active=?,
                  updated_by=?, updated_date=NOW()
              WHERE id=?
            `,
                        [companyId, firstNameTh, firstNameEn, lastNameTh, lastNameEn,
                            emailVal, permissionId, imageUrl, isActive,
                            updatedBy, targetId]
                    );
                }

                return NextResponse.json({ success: true, message: "อัปเดตข้อมูลเรียบร้อย", emp_id: empId, id: targetId });
            }
            // ถ้าไม่เจอ -> ตกไป INSERT ด้านล่าง
        }

        // ===================== INSERT ใหม่ =====================
        const newEmpId = empId;
        // กันชน emp_id
        const dup = await query(`SELECT id FROM data_employees WHERE emp_id = ? LIMIT 1`, [newEmpId]);
        if (Array.isArray(dup) && dup.length > 0) {
            return NextResponse.json({ success: false, message: "รหัสพนักงานนี้ถูกใช้งานแล้ว" }, { status: 409 });
        }

        await query(
            `
        INSERT INTO data_employees
          (emp_id, company_id, first_name_th, first_name_en, last_name_th, last_name_en,
           email, password, permission_id, image_url, is_active, created_by, created_date, updated_by, updated_date)
        VALUES
          (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, NOW())
      `,
            [newEmpId, companyId, firstNameTh, firstNameEn, lastNameTh, lastNameEn,
                emailVal, passwordVal, permissionId, imageUrl, isActive, createdBy, updatedBy]
        );

        return NextResponse.json({ success: true, message: "เพิ่มข้อมูลเรียบร้อย", emp_id: newEmpId });
    } catch (err: any) {
        
        return NextResponse.json({ success: false, message: "Database error", error: err.message }, { status: 500 });
    }
}