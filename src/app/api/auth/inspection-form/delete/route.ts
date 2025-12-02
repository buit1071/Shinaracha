import { NextResponse } from "next/server";
import { query } from "@/lib-server/db";

export async function POST(req: Request) {
    try {
        const { id, function: fn } = await req.json();

        if (!id || !fn) {
            return NextResponse.json(
                { success: false, message: "กรุณาส่ง id และ function" },
                { status: 400 }
            );
        }

        if (fn === "service") {
            await query(`DELETE FROM master_services WHERE service_id=?`, [id]);
            return NextResponse.json({ success: true, message: "ลบข้อมูลเรียบร้อย" });
        }

        if (fn === "zone") {
            await query(`DELETE FROM data_service_form WHERE zone_id=?`, [id]);
            return NextResponse.json({ success: true, message: "ลบข้อมูลเรียบร้อย" });
        }

        // if (fn === "inspect") {
        //     await query(`DELETE FROM data_inspect_groups WHERE inspect_id=?`, [id]);
        //     return NextResponse.json({ success: true, message: "ลบข้อมูลเรียบร้อย" });
        // }

        // if (fn === "inspectitems") {
        //     await query(`DELETE FROM data_inspect_items WHERE inspect_item_id=?`, [id]);
        //     return NextResponse.json({ success: true, message: "ลบข้อมูลเรียบร้อย" });
        // }

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
