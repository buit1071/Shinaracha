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

        // =========== Equipment ===========
        if (entity === "equipment") {
            const {
                equipment_id,
                branch_id,
                equipment_name,
                is_active,
                created_by,
                updated_by,
            } = data;

            // validate
            if (!equipment_id?.trim()) {
                return NextResponse.json(
                    { success: false, message: "กรุณาระบุ equipment_id (มาจากฝั่งหน้าเว็บ)" },
                    { status: 400 }
                );
            }
            if (!branch_id?.trim()) {
                return NextResponse.json(
                    { success: false, message: "กรุณาระบุสาขา (branch_id)" },
                    { status: 400 }
                );
            }

            // 1) UPDATE ก่อน
            const upd: any = await query(
                `
        UPDATE data_branch_equipments
        SET
          branch_id    = ?,
          equipment_name    = ?,
          is_active    = ?,
          updated_by   = ?,
          updated_date = NOW()
        WHERE equipment_id = ?
      `,
                [
                    branch_id,
                    is_active ?? 1,
                    updated_by ?? "system",
                    equipment_id,
                    equipment_name,
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
                    equipment_id,
                });
            }

            // 2) ไม่พบ row ให้ INSERT โดยใช้ equipment_id จากหน้าเว็บ
            try {
                await query(
                    `
          INSERT INTO data_branch_equipments
            (equipment_id, equipment_name, branch_id, is_active, created_by, created_date, updated_by, updated_date)
          VALUES
            (?,?,?,?,?,NOW(),?,NOW())
        `,
                    [
                        equipment_id,
                        equipment_name,
                        branch_id,
                        is_active ?? 1,
                        created_by ?? "system",
                        updated_by ?? "system",
                    ]
                );

                return NextResponse.json(
                    {
                        success: true,
                        message: "เพิ่มข้อมูลเรียบร้อย",
                        equipment_id,
                    },
                    { status: 201 }
                );
            } catch (e: any) {
                if (e?.code === "ER_DUP_ENTRY") {
                    return NextResponse.json(
                        { success: false, message: "มี equipment_id นี้อยู่แล้ว" },
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
