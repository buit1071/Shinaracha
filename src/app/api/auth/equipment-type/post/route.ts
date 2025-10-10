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

        // =========== Branch Detail ===========
        if (entity === "system_type") {
            const {
                system_type_id,
                system_type_name,
                is_active,
                created_by,
                updated_by,
            } = data;

            // helper
            const trim = (v: any) => (v === null || v === undefined ? null : String(v).trim());

            // ----- UPDATE -----
            if (system_type_id) {
                const sql = `
                    UPDATE master_system_type
                    SET
                        system_type_name       = ?,
                        is_active         = ?,
                        updated_by        = ?,
                        updated_date      = NOW()
                    WHERE system_type_id = ?
                    `;
                const params = [
                    trim(system_type_name),
                    is_active ?? 1,
                    updated_by || "system",
                    system_type_id,
                ];
                await query(sql, params);
                return NextResponse.json({
                    success: true,
                    message: "อัปเดตข้อมูลเรียบร้อย",
                    system_type_id,
                });
            }

            // ----- INSERT -----
            const newSystemTypeId = generateId("STT");
            const insertSql = `
                INSERT INTO master_system_type (
                    system_type_id,
                    system_type_name,
                    is_active,
                    created_by,
                    created_date,
                    updated_by,
                    updated_date
                )
                VALUES
                (?,?,?,?,NOW(),?,NOW())
                `;

            const insertParams = [
                newSystemTypeId,
                trim(system_type_name),
                is_active ?? 1,
                created_by || "system",
                updated_by || "system",
            ];

            await query(insertSql, insertParams);

            return NextResponse.json({
                success: true,
                message: "เพิ่มข้อมูลเรียบร้อย",
                system_type_id: newSystemTypeId,
            });
        }

        if (entity === "equipment_type") {
            const {
                equipment_type_id,
                equipment_type_name,
                is_active,
                created_by,
                updated_by,
            } = data;

            // helper
            const trim = (v: any) => (v === null || v === undefined ? null : String(v).trim());

            // ----- UPDATE -----
            if (equipment_type_id) {
                const sql = `
                    UPDATE master_equipment_type
                    SET
                        equipment_type_name       = ?,
                        is_active         = ?,
                        updated_by        = ?,
                        updated_date      = NOW()
                    WHERE equipment_type_id = ?
                    `;
                const params = [
                    trim(equipment_type_name),
                    is_active ?? 1,
                    updated_by || "system",
                    equipment_type_id,
                ];
                await query(sql, params);
                return NextResponse.json({
                    success: true,
                    message: "อัปเดตข้อมูลเรียบร้อย",
                    equipment_type_id,
                });
            }

            // ----- INSERT -----
            const newEquipmentTypeId = generateId("EQMT");
            const insertSql = `
                INSERT INTO master_equipment_type (
                    equipment_type_id,
                    equipment_type_name,
                    is_active,
                    created_by,
                    created_date,
                    updated_by,
                    updated_date
                )
                VALUES
                (?,?,?,?,NOW(),?,NOW())
                `;

            const insertParams = [
                newEquipmentTypeId,
                trim(equipment_type_name),
                is_active ?? 1,
                created_by || "system",
                updated_by || "system",
            ];

            await query(insertSql, insertParams);

            return NextResponse.json({
                success: true,
                message: "เพิ่มข้อมูลเรียบร้อย",
                equipment_type_id: newEquipmentTypeId,
            });
        }

        // entity ไม่ตรง
        return NextResponse.json(
            { success: false, message: "entity ไม่ถูกต้อง" },
            { status: 400 }
        );
    } catch (err: any) {
        
        return NextResponse.json(
            { success: false, message: "Database error", error: err.message },
            { status: 500 }
        );
    }
}