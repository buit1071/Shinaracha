import { NextResponse } from "next/server";
import { query } from "@/lib-server/db";

type GetBody =
    | { function: "building"; }
    | { function: "floor"; building_id: string }
    | { function: "floorAll"; }
    ;

export async function POST(req: Request) {
    try {
        const body = (await req.json()) as Partial<GetBody>;
        const fn = body.function;

        if (!fn) {
            return NextResponse.json(
                { success: false, message: "กรุณาระบุ function" },
                { status: 400 }
            );
        }

        if (fn === "building") {
            const rows = await query(
                `
        SELECT *
        FROM data_building
        ORDER BY created_date DESC
        `,
            );
            return NextResponse.json({ success: true, data: rows });
        }

        if (fn === "floor") {
            const rows = await query(
                `
        SELECT *
        FROM data_floor_room
        WHERE building_id = ?
        ORDER BY created_date DESC
        `, [body.building_id]
            );
            return NextResponse.json({ success: true, data: rows });
        }

        if (fn === "floorAll") {
            const rows = await query(
                `
        SELECT *
        FROM data_floor_room
        ORDER BY created_date DESC
        `,
            );
            return NextResponse.json({ success: true, data: rows });
        }

        // ไม่รู้จัก function
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
