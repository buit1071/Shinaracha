import { NextResponse } from "next/server";
import { query } from "@/lib-server/db";
import { generateId } from "@/lib/fetcher";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const entity = body?.entity as undefined;
        const data = body?.data ?? {};

        if (!entity) {
            return NextResponse.json(
                { success: false, message: "กรุณาระบุ entity" },
                { status: 400 }
            );
        }

        // =========== SERVICE ===========
        if (entity === "service") {
            const { service_id, service_name, is_active, created_by, updated_by } = data;

            if (!service_name) {
                return NextResponse.json(
                    { success: false, message: "กรุณากรอกชื่อ Service" },
                    { status: 400 }
                );
            }

            if (service_id) {
                // UPDATE
                await query(
                    `UPDATE master_services
           SET service_name=?, is_active=?, updated_by=?, updated_date=NOW()
           WHERE service_id=?`,
                    [service_name, is_active ?? 1, updated_by ?? "system", service_id]
                );
                return NextResponse.json({ success: true, message: "อัปเดต Service เรียบร้อย" });
            } else {
                // INSERT
                const newServiceId = generateId("SER");
                await query(
                    `INSERT INTO master_services
           (service_id, service_name, is_active, created_by, created_date, updated_by, updated_date)
           VALUES (?,?,?,?,NOW(),?,NOW())`,
                    [newServiceId, service_name, is_active ?? 1, created_by ?? "system", updated_by ?? "system"]
                );
                return NextResponse.json({
                    success: true,
                    message: "เพิ่มข้อมูลเรียบร้อย",
                    service_id: newServiceId,
                });
            }
        }

        // =========== ZONE ===========
        if (entity === "zone") {
            const { zone_id, service_id, zone_name, is_active, created_by, updated_by } = data;

            if (!service_id || !zone_name) {
                return NextResponse.json(
                    { success: false, message: "กรุณาระบุ Service และ Zone Name" },
                    { status: 400 }
                );
            }

            if (zone_id) {
                // UPDATE
                await query(
                    `UPDATE data_service_form
           SET service_id=?, zone_name=?, is_active=?, updated_by=?, updated_date=NOW()
           WHERE zone_id=?`,
                    [service_id, zone_name, is_active ?? 1, updated_by ?? "system", zone_id]
                );
                return NextResponse.json({ success: true, message: "อัปเดต Zone เรียบร้อย" });
            } else {
                // INSERT
                const newZoneId = generateId("FORM");
                await query(
                    `INSERT INTO data_service_form
           (zone_id, service_id, zone_name, is_active, created_by, created_date, updated_by, updated_date)
           VALUES (?,?,?,?,?,NOW(),?,NOW())`,
                    [newZoneId, service_id, zone_name, is_active ?? 1, created_by ?? "system", updated_by ?? "system"]
                );
                return NextResponse.json({
                    success: true,
                    message: "เพิ่มข้อมูลเรียบร้อย",
                    zone_id: newZoneId,
                });
            }
        }

        // =========== INSPECT ===========
        if (entity === "inspect") {
            const { inspect_id, zone_id, inspect_name, is_active, created_by, updated_by } = data;

            if (!zone_id || !inspect_name) {
                return NextResponse.json(
                    { success: false, message: "กรุณาระบุ Zone และ Inspect Name" },
                    { status: 400 }
                );
            }

            if (inspect_id) {
                // UPDATE
                await query(
                    `UPDATE data_inspect_groups
           SET zone_id=?, inspect_name=?, is_active=?, updated_by=?, updated_date=NOW()
           WHERE inspect_id=?`,
                    [zone_id, inspect_name, is_active ?? 1, updated_by ?? "system", inspect_id]
                );
                return NextResponse.json({ success: true, message: "อัปเดต Inspect เรียบร้อย" });
            } else {
                // INSERT
                const newInspectId = generateId("ISPG");
                await query(
                    `INSERT INTO data_inspect_groups
           (inspect_id, zone_id, inspect_name, is_active, created_by, created_date, updated_by, updated_date)
           VALUES (?,?,?,?,?,NOW(),?,NOW())`,
                    [newInspectId, zone_id, inspect_name, is_active ?? 1, created_by ?? "system", updated_by ?? "system"]
                );
                return NextResponse.json({
                    success: true,
                    message: "เพิ่มข้อมูลเรียบร้อย",
                    inspect_id: newInspectId,
                });
            }
        }

        // =========== INSPECT ITEMS ===========
        if (entity === "inspectitems") {
            const {
                inspect_item_id,   // ไอดีของ "item" (ใช้ตอน UPDATE)
                inspect_id,        // ไอดีของ "group" (ใช้ตอน INSERT หรือย้ายกลุ่ม)
                inspect_item_name,
                is_active,
                created_by,
                updated_by,
            } = data;

            // UPDATE (ถ้ามี inspect_item_id)
            if (inspect_item_id) {
                await query(
                    `UPDATE data_inspect_items
       SET inspect_item_name = ?,
           inspect_id        = ?,          -- ถ้าอนุญาตให้เปลี่ยนกลุ่ม; ไม่งั้นเอาออก
           is_active         = ?,
           updated_by        = ?,
           updated_date      = NOW()
       WHERE inspect_item_id = ?`,
                    [inspect_item_name, inspect_id ?? null, is_active ?? 1, updated_by ?? "system", inspect_item_id]
                );
                return NextResponse.json({ success: true, message: "อัปเดต Inspect Item เรียบร้อย" });
            }

            // INSERT (ไม่มี inspect_item_id => ต้องมี inspect_id)
            if (!inspect_id || !inspect_item_name) {
                return NextResponse.json(
                    { success: false, message: "กรุณาระบุ Inspection (กลุ่ม) และ Inspection Item Name" },
                    { status: 400 }
                );
            }

            const newInspectItemId = generateId("ISPI");
            await query(
                `INSERT INTO data_inspect_items
     (inspect_item_id, inspect_id, inspect_item_name, is_active, created_by, created_date, updated_by, updated_date)
     VALUES (?,?,?,?,?,NOW(),?,NOW())`,
                [newInspectItemId, inspect_id, inspect_item_name, is_active ?? 1, created_by ?? "system", updated_by ?? "system"]
            );

            return NextResponse.json({
                success: true,
                message: "เพิ่มข้อมูลเรียบร้อย",
                inspect_item_id: newInspectItemId,
            });
        }

        if (entity === "serviceActive") {
            const { service_id, is_active, updated_by } = data;

            if (!service_id) {
                return NextResponse.json(
                    { success: false, message: "กรุณาระบุ service_id" },
                    { status: 400 }
                );
            }

            const activeVal =
                typeof is_active === "string" ? parseInt(is_active, 10) || 0 : Number(is_active ?? 0);

            await query(
                `UPDATE master_services
       SET is_active = ?, updated_by = ?, updated_date = NOW()
     WHERE service_id = ?`,
                [activeVal, updated_by ?? "system", service_id]
            );

            return NextResponse.json({ success: true, message: "อัปเดตสถานะเรียบร้อย" });
        }

        // entity ไม่ตรง
        return NextResponse.json(
            { success: false, message: "entity ไม่ถูกต้อง (service | zone | inspect)" },
            { status: 400 }
        );
    } catch (err: any) {
        
        return NextResponse.json(
            { success: false, message: "Database error", error: err.message },
            { status: 500 }
        );
    }
}