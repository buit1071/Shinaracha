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

        if (entity === "defect") {
            const {
                id,
                defect_no,
                type,
                inspection_item,
                illegal_problem,
                illegal_suggestion,
                general_problem,
                general_suggestion,
                is_active,
                created_by,
                updated_by,
            } = data;

            // 1) UPDATE ก่อน
            const upd: any = await query(
                `
        UPDATE master_defect
        SET
          defect_no         = ?,
          type         = ?,
          inspection_item         = ?,
          illegal_problem         = ?,
          illegal_suggestion         = ?,
          general_problem         = ?,
          general_suggestion         = ?,
          is_active    = ?,
          updated_by   = ?,
          updated_date = NOW()
        WHERE id = ?
      `,
                [
                    defect_no.trim(),
                    type.trim(),
                    inspection_item.trim(),
                    illegal_problem.trim(),
                    illegal_suggestion.trim(),
                    general_problem.trim(),
                    general_suggestion.trim(),
                    is_active ?? 1,
                    updated_by ?? "system",
                    id,
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
                    message: "อัปเดตข้อมูลเรียบร้อย",
                    id,
                });
            }

            try {
                const ins: any = await query(
                    `
    INSERT INTO master_defect
      (defect_no, \`type\`, inspection_item, illegal_problem, illegal_suggestion,
       general_problem, general_suggestion, is_active, created_by, created_date, updated_by, updated_date)
    VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, NOW())
    `,
                    [
                        defect_no.trim(),
                        type.trim(),
                        inspection_item?.trim() ?? null,
                        illegal_problem?.trim() ?? null,
                        illegal_suggestion?.trim() ?? null,
                        general_problem?.trim() ?? null,
                        general_suggestion?.trim() ?? null,
                        is_active ?? 1,
                        created_by ?? "system",
                        updated_by ?? "system",
                    ]
                );

                // ดึง insertId ได้ทั้ง 2 รูปแบบ (mysql2 เดี่ยวๆ หรือ [OkPacket, fields])
                const insertId =
                    (ins && typeof ins === "object" && "insertId" in ins && ins.insertId) ||
                    (Array.isArray(ins) && ins[0]?.insertId) ||
                    null;

                return NextResponse.json(
                    {
                        success: true,
                        message: "เพิ่มข้อมูลเรียบร้อย",
                        id: insertId, // ✅ ส่ง id ที่ DB gen ให้
                    },
                    { status: 201 }
                );
            } catch (e: any) {
                if (e?.code === "ER_DUP_ENTRY") {
                    // ปรับข้อความให้สอดคล้องกับตารางนี้
                    return NextResponse.json(
                        { success: false, message: "ข้อมูลซ้ำ (เช่น defect_no ซ้ำ)" },
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

        return NextResponse.json(
            { success: false, message: "Database error", error: err?.message },
            { status: 500 }
        );
    }
}
