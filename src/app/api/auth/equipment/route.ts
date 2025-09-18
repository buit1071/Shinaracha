import { NextResponse } from "next/server";
import { query } from "@/lib-server/db";
import { generateId, toNull, toInt } from "@/lib/fetcher";

export async function GET() {
    try {
        const rows = await query(`
      SELECT
        me.*,
        COALESCE(ms.service_name, '') AS service_name,   -- จาก master_services
        COALESCE(z.zone_name, '')    AS zone_name        -- จาก data_service_form
      FROM master_equipments AS me
      LEFT JOIN master_services   AS ms ON ms.service_id = me.service_id
      LEFT JOIN data_service_form AS z  ON z.zone_id     = me.zone_id
      ORDER BY me.updated_date DESC, me.created_date DESC
    `);

        return NextResponse.json({ success: true, data: rows });
    } catch (err: any) {
        console.error("DB Error:", err);
        return NextResponse.json(
            { success: false, message: "Database error", error: err.message },
            { status: 500 }
        );
    }
}

// POST เพิ่ม/แก้ไข 
export async function POST(req: Request) {
    try {
        const body = await req.json();

        // ---------- รับค่าเดิม ----------
        const {
            equipment_id,
            equipment_code,
            equipment_name,
            description = "",
            image_limit = 0,
            service_id = "",
            zone_id = "",
            is_active = 1,
            created_by = "system",
            updated_by = "system",

            // ---------- ที่อยู่ป้าย ----------
            address_no = "",
            moo = "",
            alley = "",
            road = "",
            sub_district_id = "",
            district_id = "",
            province_id = "",
            zipcode = "",
            phone = "",
            fax = "",

            // ---------- เจ้าของป้าย ----------
            owner_name = "",
            owner_address_no = "",
            owner_moo = "",
            owner_alley = "",
            owner_road = "",
            owner_province_id = "",
            owner_district_id = "",
            owner_sub_district_id = "",
            owner_zipcode = "",
            owner_phone = "",
            owner_fax = "",
            owner_email = "",

            // ---------- ผู้ออกแบบ ----------
            designer_name = "",
            designer_license_no = "",
        } = body;

        const code = String(equipment_code ?? "").trim();
        const codeOrNull: any = code ? code : null;
        const imgLimit = toInt(image_limit, 0);

        if (!equipment_name?.trim()) {
            return NextResponse.json(
                { success: false, message: "กรุณาระบุชื่ออุปกรณ์" },
                { status: 400 }
            );
        }

        // ============ UPDATE ============
        if (equipment_id) {
            if (code) {
                const dup: any = await query(
                    `SELECT 1 FROM master_equipments WHERE equipment_code = ? AND equipment_id <> ? LIMIT 1`,
                    [code, equipment_id]
                );
                if (dup.length > 0) {
                    return NextResponse.json(
                        { success: false, message: `equipment_code นี้ถูกใช้งานแล้ว (${code})` },
                        { status: 409 }
                    );
                }
            }

            await query(
                `
        UPDATE master_equipments
        SET
          equipment_code = ?,
          equipment_name = ?,
          description    = ?,
          image_limit    = ?,
          service_id     = ?,
          zone_id        = ?,
          is_active      = ?,

          -- ที่อยู่ป้าย
          address_no     = ?,
          moo            = ?,
          alley          = ?,
          road           = ?,
          sub_district_id= ?,
          district_id    = ?,
          province_id    = ?,
          zipcode        = ?,
          phone          = ?,
          fax            = ?,

          -- เจ้าของป้าย
          owner_name             = ?,
          owner_address_no       = ?,
          owner_moo              = ?,
          owner_alley            = ?,
          owner_road             = ?,
          owner_province_id      = ?,
          owner_district_id      = ?,
          owner_sub_district_id   = ?,   -- รองรับคีย์นี้ในตาราง
          owner_zipcode          = ?,
          owner_phone            = ?,
          owner_fax              = ?,
          owner_email            = ?,

          -- ผู้ออกแบบ
          designer_name       = ?,
          designer_license_no = ?,

          updated_by     = ?,
          updated_date   = NOW()
        WHERE equipment_id = ?
        `,
                [
                    codeOrNull,
                    equipment_name,
                    description,
                    imgLimit,
                    service_id,
                    zone_id,
                    is_active ?? 1,

                    // ที่อยู่ป้าย
                    toNull(address_no),
                    toNull(moo),
                    toNull(alley),
                    toNull(road),
                    toNull(sub_district_id),
                    toNull(district_id),
                    toNull(province_id),
                    toNull(zipcode),
                    toNull(phone),
                    toNull(fax),

                    // เจ้าของป้าย
                    toNull(owner_name),
                    toNull(owner_address_no),
                    toNull(owner_moo),
                    toNull(owner_alley),
                    toNull(owner_road),
                    toNull(owner_province_id),
                    toNull(owner_district_id),
                    toNull(owner_sub_district_id),
                    toNull(owner_zipcode),
                    toNull(owner_phone),
                    toNull(owner_fax),
                    toNull(owner_email),

                    // ผู้ออกแบบ
                    toNull(designer_name),
                    toNull(designer_license_no),

                    updated_by,
                    equipment_id,
                ]
            );

            return NextResponse.json({ success: true, message: "อัปเดตข้อมูลเรียบร้อย" });
        }

        // ============ INSERT ============
        if (code) {
            const dup: any = await query(
                `SELECT 1 FROM master_equipments WHERE equipment_code = ? LIMIT 1`,
                [code]
            );
            if (dup.length > 0) {
                return NextResponse.json(
                    { success: false, message: `equipment_code นี้ถูกใช้งานแล้ว (${code})` },
                    { status: 409 }
                );
            }
        }

        const newEquipmentId = generateId("EQM");

        await query(
            `
      INSERT INTO master_equipments
        (
          equipment_id, equipment_code, equipment_name, description, image_limit,
          service_id, zone_id, is_active,

          -- ที่อยู่ป้าย
          address_no, moo, alley, road, sub_district_id, district_id, province_id, zipcode, phone, fax,

          -- เจ้าของป้าย
          owner_name, owner_address_no, owner_moo, owner_alley, owner_road,
          owner_province_id, owner_district_id, owner_sub_district_id, owner_zipcode,
          owner_phone, owner_fax, owner_email,

          -- ผู้ออกแบบ
          designer_name, designer_license_no,

          created_by, created_date, updated_by, updated_date
        )
      VALUES
        (
          ?, ?, ?, ?, ?,
          ?, ?, ?,

          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,

          ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?,

          ?, ?,

          ?, NOW(), ?, NOW()
        )
      `,
            [
                newEquipmentId,
                codeOrNull,
                equipment_name,
                description,
                imgLimit,
                service_id,
                zone_id,
                is_active ?? 1,

                // ที่อยู่ป้าย
                toNull(address_no),
                toNull(moo),
                toNull(alley),
                toNull(road),
                toNull(sub_district_id),
                toNull(district_id),
                toNull(province_id),
                toNull(zipcode),
                toNull(phone),
                toNull(fax),

                // เจ้าของป้าย
                toNull(owner_name),
                toNull(owner_address_no),
                toNull(owner_moo),
                toNull(owner_alley),
                toNull(owner_road),
                toNull(owner_province_id),
                toNull(owner_district_id),
                toNull(owner_sub_district_id),
                toNull(owner_zipcode),
                toNull(owner_phone),
                toNull(owner_fax),
                toNull(owner_email),

                // ผู้ออกแบบ
                toNull(designer_name),
                toNull(designer_license_no),

                created_by,
                updated_by,
            ]
        );

        return NextResponse.json({
            success: true,
            message: "บันทึกข้อมูลเรียบร้อย",
            equipment_id: newEquipmentId,
        });
    } catch (err: any) {
        // กัน race condition จาก UNIQUE KEY
        if (err?.code === "ER_DUP_ENTRY") {
            return NextResponse.json(
                { success: false, message: "equipment_code นี้ถูกใช้งานแล้ว", error: err.sqlMessage },
                { status: 409 }
            );
        }
        console.error("DB Error:", err);
        return NextResponse.json(
            { success: false, message: "Database error", error: err?.message },
            { status: 500 }
        );
    }
}
