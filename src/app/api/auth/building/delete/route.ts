import { NextResponse } from "next/server";
import { query } from "@/lib-server/db";

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // รองรับหลายคีย์จาก FE
        const fn = body.fn ?? body.function ?? body.entity;
        const idRaw = body.id ?? body.building_id;

        const id = typeof idRaw === "string" ? idRaw.trim() : String(idRaw ?? "").trim();

        if (!id || !fn) {
            return NextResponse.json(
                { success: false, message: "กรุณาส่ง id และ function" },
                { status: 400 }
            );
        }

        if (fn === "building") {
            const result: any = await query(
                `DELETE FROM data_building WHERE building_id = ?`,
                [id]
            );

            // mysql2 จะคืน OkPacket เป็น "rows" จาก helper query()
            const affected = result?.affectedRows ?? result?.[0]?.affectedRows ?? 0;

            if (affected === 0) {
                // ไม่พบข้อมูลให้ลบ -> แจ้ง 400 เพื่อง่ายต่อ FE
                return NextResponse.json(
                    { success: false, message: "ไม่พบข้อมูลที่จะลบ" },
                    { status: 400 }
                );
            }

            return NextResponse.json({ success: true, message: "ลบข้อมูลเรียบร้อย" });
        }

        if (fn === "floor") {
            const result: any = await query(
                `DELETE FROM data_floor_room WHERE floor_id = ?`,
                [id]
            );

            // mysql2 จะคืน OkPacket เป็น "rows" จาก helper query()
            const affected = result?.affectedRows ?? result?.[0]?.affectedRows ?? 0;

            if (affected === 0) {
                // ไม่พบข้อมูลให้ลบ -> แจ้ง 400 เพื่อง่ายต่อ FE
                return NextResponse.json(
                    { success: false, message: "ไม่พบข้อมูลที่จะลบ" },
                    { status: 400 }
                );
            }

            return NextResponse.json({ success: true, message: "ลบข้อมูลเรียบร้อย" });
        }

        return NextResponse.json(
            { success: false, message: "ไม่รู้จัก function ที่ส่งมา" },
            { status: 400 }
        );
    } catch (err: any) {
        
        return NextResponse.json(
            { success: false, message: "Database error", error: err.message },
            { status: 500 }
        );
    }
}
