import { NextResponse } from "next/server";
import { query } from "@/lib-server/db";
import { generateId } from "@/lib/fetcher";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const entity = body?.entity as "service" | "zone" | "inspect" | undefined;
        const data = body?.data ?? {};

        if (!entity) {
            return NextResponse.json(
                { success: false, message: "กรุณาระบุ entity: service | zone | inspect" },
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
                    message: "เพิ่ม Service เรียบร้อย",
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
                    `UPDATE data_service_zone
           SET service_id=?, zone_name=?, is_active=?, updated_by=?, updated_date=NOW()
           WHERE zone_id=?`,
                    [service_id, zone_name, is_active ?? 1, updated_by ?? "system", zone_id]
                );
                return NextResponse.json({ success: true, message: "อัปเดต Zone เรียบร้อย" });
            } else {
                // INSERT
                const newZoneId = generateId("SERZ");
                await query(
                    `INSERT INTO data_service_zone
           (zone_id, service_id, zone_name, is_active, created_by, created_date, updated_by, updated_date)
           VALUES (?,?,?,?,?,NOW(),?,NOW())`,
                    [newZoneId, service_id, zone_name, is_active ?? 1, created_by ?? "system", updated_by ?? "system"]
                );
                return NextResponse.json({
                    success: true,
                    message: "เพิ่ม Zone เรียบร้อย",
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
                    message: "เพิ่ม Inspect เรียบร้อย",
                    inspect_id: newInspectId,
                });
            }
        }

        // entity ไม่ตรง
        return NextResponse.json(
            { success: false, message: "entity ไม่ถูกต้อง (service | zone | inspect)" },
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