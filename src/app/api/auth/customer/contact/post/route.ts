import { NextResponse } from "next/server";
import { query } from "@/lib-server/db";

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

        // =========== Contact ===========
        if (entity === "contact") {
            const {
                contact_id,
                customer_id,
                name,
                email,
                tel,
                is_active,
                created_by,
                updated_by,
            } = data;

            // validate
            if (!contact_id?.trim()) {
                return NextResponse.json(
                    { success: false, message: "กรุณาระบุ contact_id (มาจากฝั่งหน้าเว็บ)" },
                    { status: 400 }
                );
            }
            if (!customer_id?.trim()) {
                return NextResponse.json(
                    { success: false, message: "กรุณาระบุสาขา (customer_id)" },
                    { status: 400 }
                );
            }
            if (!name?.trim()) {
                return NextResponse.json(
                    { success: false, message: "กรุณาระบุชื่อผู้ติดต่อ" },
                    { status: 400 }
                );
            }

            // 1) UPDATE ก่อน
            const upd: any = await query(
                `
        UPDATE data_contact_customers
        SET
          customer_id    = ?,
          name         = ?,
          email        = ?,
          tel          = ?,
          is_active    = ?,
          updated_by   = ?,
          updated_date = NOW()
        WHERE contact_id = ?
      `,
                [
                    customer_id,
                    name.trim(),
                    email ?? null,
                    tel ?? null,
                    is_active ?? 1,
                    updated_by ?? "system",
                    contact_id,
                ]
            );

            // รองรับทั้งรูปแบบ object และ [OkPacket, fields]
            const affected =
                (upd && typeof upd === "object" && "affectedRows" in upd && upd.affectedRows) ||
                (Array.isArray(upd) && upd[0]?.affectedRows) ||
                0;

            if (affected > 0) {
                return NextResponse.json({
                    success: true,
                    message: "อัปเดตผู้ติดต่อเรียบร้อย",
                    contact_id,
                });
            }

            // 2) ไม่พบ row ให้ INSERT โดยใช้ contact_id จากหน้าเว็บ
            try {
                await query(
                    `
          INSERT INTO data_contact_customers
            (contact_id, customer_id, name, email, tel, is_active, created_by, created_date, updated_by, updated_date)
          VALUES
            (?,?,?,?,?,?,?,NOW(),?,NOW())
        `,
                    [
                        contact_id,
                        customer_id,
                        name.trim(),
                        email ?? null,
                        tel ?? null,
                        is_active ?? 1,
                        created_by ?? "system",
                        updated_by ?? "system",
                    ]
                );

                return NextResponse.json(
                    {
                        success: true,
                        message: "เพิ่มข้อมูลเรียบร้อย",
                        contact_id,
                    },
                    { status: 201 }
                );
            } catch (e: any) {
                if (e?.code === "ER_DUP_ENTRY") {
                    return NextResponse.json(
                        { success: false, message: "มี contact_id นี้อยู่แล้ว" },
                        { status: 409 }
                    );
                }
                throw e;
            }
        }

        // entity ไม่ตรง
        return NextResponse.json(
            { success: false, message: "entity ไม่ถูกต้อง" },
            { status: 400 }
        );
    } catch (err: any) {
        console.error("DB Error:", err);
        return NextResponse.json(
            { success: false, message: "Database error", error: err?.message },
            { status: 500 }
        );
    }
}
