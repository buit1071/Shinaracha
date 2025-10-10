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

        if (entity === "building") {
            const {
                building_id,
                building_name,
                is_active,
                created_by,
                updated_by,
            } = data;

            // 1) UPDATE ก่อน
            const upd: any = await query(
                `
        UPDATE data_building
        SET
          building_name         = ?,
          is_active    = ?,
          updated_by   = ?,
          updated_date = NOW()
        WHERE building_id = ?
      `,
                [
                    building_name.trim(),
                    is_active ?? 1,
                    updated_by ?? "system",
                    building_id,
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
                    building_id,
                });
            }

            try {
                const newBuildingId = generateId("BD");
                await query(
                    `
          INSERT INTO data_building
            (building_id, building_name, is_active, created_by, created_date, updated_by, updated_date)
          VALUES
            (?,?,?,?,NOW(),?,NOW())
        `,
                    [
                        newBuildingId,
                        building_name.trim(),
                        is_active ?? 1,
                        created_by ?? "system",
                        updated_by ?? "system",
                    ]
                );

                return NextResponse.json(
                    {
                        success: true,
                        message: "เพิ่มข้อมูลเรียบร้อย",
                        newBuildingId,
                    },
                    { status: 201 }
                );
            } catch (e: any) {
                if (e?.code === "ER_DUP_ENTRY") {
                    return NextResponse.json(
                        { success: false, message: "มี building_id นี้อยู่แล้ว" },
                        { status: 409 }
                    );
                }
                throw e;
            }
        }

        if (entity === "floor") {
            const {
                building_id,
                floor_id,
                floor_name,
                room_name,
                is_active,
                created_by,
                updated_by,
            } = data;

            // 1) UPDATE ก่อน
            const upd: any = await query(
                `
                UPDATE data_floor_room
                SET
                floor_id      = ?,
                floor_name    = ?,
                room_name     = ?,
                is_active     = ?,
                updated_by    = ?,
                updated_date  = NOW()
                WHERE floor_id = ?
            `,
                [
                    floor_id,
                    floor_name.trim(),
                    room_name.trim(),
                    is_active ?? 1,
                    updated_by ?? "system",
                    floor_id, // ✅ ต้องใช้ floor_id ตรงนี้ ไม่ใช่ building_id
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
                    building_id,
                });
            }

            try {
                const newFloorId = generateId("FL");
                await query(
                    `
          INSERT INTO data_floor_room
            (building_id, floor_id, floor_name, room_name, is_active, created_by, created_date, updated_by, updated_date)
          VALUES
            (?,?,?,?,?,?,NOW(),?,NOW())
        `,
                    [
                        building_id,
                        newFloorId,
                        floor_name.trim(),
                        room_name.trim(),
                        is_active ?? 1,
                        created_by ?? "system",
                        updated_by ?? "system",
                    ]
                );

                return NextResponse.json(
                    {
                        success: true,
                        message: "เพิ่มข้อมูลเรียบร้อย",
                        newFloorId,
                    },
                    { status: 201 }
                );
            } catch (e: any) {
                if (e?.code === "ER_DUP_ENTRY") {
                    return NextResponse.json(
                        { success: false, message: "มี building_id นี้อยู่แล้ว" },
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
