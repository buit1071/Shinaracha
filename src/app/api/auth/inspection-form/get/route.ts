// app/api/auth/inspection-form/get/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib-server/db";

type GetBody =
    | { function: "services" }
    | { function: "zonesAll" }
    | { function: "zonesByService"; service_id: string }
    | { function: "zoneById"; zone_id: string }
    | { function: "inspectsByZone"; zone_id: string }
    | { function: "groupById"; inspect_id: string }
    | { function: "inspectItems"; inspect_id: string }
    | { function: "serviceById"; service_id: string }
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

        if (fn === "services") {
            const rows = await query(`
        SELECT *
        FROM master_services
        ORDER BY updated_date DESC
      `);
            return NextResponse.json({ success: true, data: rows });
        }

        if (fn === "serviceById") {
            if (!body.service_id) {
                return NextResponse.json(
                    { success: false, message: "กรุณาระบุ service_id" },
                    { status: 400 }
                );
            }

            const rows = await query(
                `SELECT service_id, service_name 
     FROM master_services
     WHERE service_id = ?`,
                [body.service_id]
            );

            return NextResponse.json({
                success: true,
                data: rows[0] || null,
            });
        }

        if (fn === "zonesByService") {
            if (!body.service_id) {
                return NextResponse.json(
                    { success: false, message: "กรุณาระบุ service_id" },
                    { status: 400 }
                );
            }
            const rows = await query(
                `
        SELECT zone_id, service_id, zone_name, is_active,
               created_by, created_date, updated_by, updated_date
        FROM data_service_form
        WHERE service_id = ?
        ORDER BY created_date DESC
        `,
                [body.service_id]
            );
            return NextResponse.json({ success: true, data: rows });
        }

        if (fn === "zonesAll") {
            const rows = await query(
                `
        SELECT *
        FROM data_service_form
        ORDER BY created_date DESC
        `,
            );
            return NextResponse.json({ success: true, data: rows });
        }

        if (fn === "zoneById") {
            if (!body.zone_id) {
                return NextResponse.json(
                    { success: false, message: "กรุณาระบุ service_id" },
                    { status: 400 }
                );
            }

            const rows = await query(
                `SELECT zone_id, zone_name 
     FROM data_service_form
     WHERE zone_id = ?`,
                [body.zone_id]
            );

            return NextResponse.json({
                success: true,
                data: rows[0] || null,
            });
        }

        if (fn === "inspectsByZone") {
            if (!body.zone_id) {
                return NextResponse.json(
                    { success: false, message: "กรุณาระบุ zone_id" },
                    { status: 400 }
                );
            }
            const rows = await query(
                `
        SELECT inspect_id, zone_id, inspect_name, is_active,
               created_by, created_date, updated_by, updated_date
        FROM data_inspect_groups
        WHERE zone_id = ?
        ORDER BY created_date DESC
        `,
                [body.zone_id]
            );
            return NextResponse.json({ success: true, data: rows });
        }

        if (fn === "groupById") {
            if (!body.inspect_id) {
                return NextResponse.json(
                    { success: false, message: "กรุณาระบุ inspect_id" },
                    { status: 400 }
                );
            }

            const rows = await query(
                `SELECT inspect_id, inspect_name 
     FROM data_inspect_groups
     WHERE inspect_id = ?`,
                [body.inspect_id]
            );

            return NextResponse.json({
                success: true,
                data: rows[0] || null,
            });
        }

        if (fn === "inspectItems") {
            if (!body.inspect_id) {
                return NextResponse.json(
                    { success: false, message: "กรุณาระบุ inspect_id" },
                    { status: 400 }
                );
            }
            const rows = await query(
                `
        SELECT inspect_item_id, inspect_id, inspect_item_name, is_active,
               created_by, created_date, updated_by, updated_date
        FROM data_inspect_items
        WHERE inspect_id = ?
        ORDER BY created_date DESC
        `,
                [body.inspect_id]
            );
            return NextResponse.json({ success: true, data: rows });
        }

        // ไม่รู้จัก function
        return NextResponse.json(
            { success: false, message: "ไม่รู้จัก function ที่ส่งมา" },
            { status: 400 }
        );
    } catch (err: any) {
        console.error("DB Error:", err);
        return NextResponse.json(
            { success: false, message: "Database error", error: err.message },
            { status: 500 }
        );
    }
}
