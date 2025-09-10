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

        // =========== Equipment ===========
        if (entity === "equipment") {
            const {
                service_inspec_id,
                equipment_id,
                equipment_name,
                is_active,
                created_by,
                updated_by,
            } = data;

            if (!equipment_id?.trim()) {
                return NextResponse.json({ success: false, message: "กรุณาระบุ equipment_id" }, { status: 400 });
            }
            if (!equipment_name?.trim()) {
                return NextResponse.json({ success: false, message: "กรุณาระบุ equipment_name" }, { status: 400 });
            }

            const activeVal =
                typeof is_active === "string" ? parseInt(is_active, 10) || 1 : (is_active ?? 1);

            // ✅ UPSERT: แทรกใหม่ ถ้าชนคีย์ให้อัปเดตแทน
            await query(
                `
    INSERT INTO data_branch_equipments
      (equipment_id, service_inspec_id, equipment_name, is_active, created_by, created_date, updated_by, updated_date)
    VALUES
      (?,?,?,?,?,NOW(),?,NOW())
    ON DUPLICATE KEY UPDATE
      equipment_name = VALUES(equipment_name),
      is_active      = VALUES(is_active),
      updated_by     = VALUES(updated_by),
      updated_date   = NOW()
    `,
                [
                    equipment_id,          // ✅ ตรงกับคอลัมน์ลำดับที่ 1
                    service_inspec_id,     // ✅ ลำดับที่ 2
                    equipment_name,
                    activeVal,
                    created_by ?? "system",
                    updated_by ?? "system",
                ]
            );

            return NextResponse.json({ success: true, message: "บันทึกอุปกรณ์เรียบร้อย", equipment_id });
        }

        // ======= Service Item (เวอร์ชันลด lock) =======
        if (entity === "serviceItem") {
            const {
                branch_id,
                service_inspec_id,
                service_id,
                zone_id,
                is_active,
                created_by,
                updated_by,
                inspection = [],
            } = data ?? {};

            const trim = (v: any) => (v == null ? null : String(v).trim());
            const _branch_id = trim(branch_id);
            const _service_id = trim(service_id);
            const _zone_id = trim(zone_id);
            const _is_active = Number.isFinite(+is_active) ? +is_active : 1;
            const _created_by = trim(created_by) || "system";
            const _updated_by = trim(updated_by) || "system";

            if (!_branch_id || !_service_id || !_zone_id) {
                return NextResponse.json(
                    { success: false, message: "กรุณาระบุ branch_id, service_id และ zone_id" },
                    { status: 400 }
                );
            }

            const serviceInspecId = trim(service_inspec_id) || generateId("SI");

            // build groups/items ใหม่
            const groups: Array<{ inspection_id: string; inspection_name: string }> =
                Array.isArray(inspection)
                    ? inspection.map((g: any) => ({
                        inspection_id: trim(g?.inspection_id) || "",
                        inspection_name: trim(g?.inspection_name) || "",
                    }))
                    : [];

            type FlatItem = { inspection_id: string; inspection_item_id: string; inspection_item_name: string };
            const items: FlatItem[] = Array.isArray(inspection)
                ? inspection.flatMap((g: any) => {
                    const gid = trim(g?.inspection_id) || "";
                    const arr = Array.isArray(g?.items) ? g.items : [];
                    return arr.map((it: any) => ({
                        inspection_id: gid,
                        inspection_item_id: trim(it?.inspection_item_id) || "",
                        inspection_item_name: trim(it?.inspection_item_name) || "",
                    }));
                })
                : [];

            const conn = await (query as any).getConnection();

            try {
                // ลดโอกาส gap lock
                await conn.query(`SET TRANSACTION ISOLATION LEVEL READ COMMITTED`);
                await conn.beginTransaction();

                // 1) Upsert main
                await conn.query(
                    `
      INSERT INTO data_service_equipment
        (branch_id, service_inspec_id, service_id, zone_id, is_active, created_by, created_date, updated_by, updated_date)
      VALUES
        (?,?,?,?,?, ?, NOW(), ?, NOW())
      ON DUPLICATE KEY UPDATE
        branch_id    = VALUES(branch_id),
        service_id   = VALUES(service_id),
        zone_id      = VALUES(zone_id),
        is_active    = VALUES(is_active),
        updated_by   = VALUES(updated_by),
        updated_date = NOW()
      `,
                    [_branch_id, serviceInspecId, _service_id, _zone_id, _is_active, _created_by, _updated_by]
                );

                // ===== ทำ diff เพื่อลบเฉพาะที่ไม่มีในชุดใหม่ =====
                // 2) ดึงรายการ group เดิมแบบเร็ว (ไม่ lock แถว)
                const [oldGroupRows] = await conn.query(
                    `SELECT inspection_id FROM data_service_equipment_group WHERE service_inspec_id = ?`,
                    [serviceInspecId]
                ) as any[];
                const oldGroupIds: string[] = oldGroupRows.map((r: any) => r.inspection_id);

                const newGroupIds = groups.map(g => g.inspection_id).filter(Boolean);
                const toDeleteGroupIds = oldGroupIds.filter(id => !newGroupIds.includes(id));

                // 3) ลบ items ที่อยู่ใต้ group ที่จะถูกลบ (ถ้ามี)
                if (toDeleteGroupIds.length > 0) {
                    const ph = toDeleteGroupIds.map(() => "?").join(",");
                    await conn.query(
                        `DELETE FROM data_service_equipment_item WHERE inspection_id IN (${ph})`,
                        toDeleteGroupIds
                    );
                    await conn.query(
                        `DELETE FROM data_service_equipment_group WHERE service_inspec_id = ? AND inspection_id IN (${ph})`,
                        [serviceInspecId, ...toDeleteGroupIds]
                    );
                }

                // 4) Upsert groups ใหม่ (ไม่ลบทั้งหมด)
                if (groups.length > 0) {
                    const vals: any[] = [];
                    const placeholders = groups
                        .filter(g => g.inspection_id)
                        .map(g => {
                            // ต้องมี unique key บน inspection_id (หรือ (service_inspec_id, inspection_id))
                            vals.push(serviceInspecId, g.inspection_id, g.inspection_name, _created_by, _updated_by);
                            return "(?,?,?, ?, NOW(), ?, NOW())";
                        })
                        .join(",");

                    await conn.query(
                        `
        INSERT INTO data_service_equipment_group
          (service_inspec_id, inspection_id, inspection_name, created_by, created_date, updated_by, updated_date)
        VALUES ${placeholders}
        ON DUPLICATE KEY UPDATE
          inspection_name = VALUES(inspection_name),
          updated_by      = VALUES(updated_by),
          updated_date    = NOW()
        `,
                        vals
                    );
                }

                // 5) Upsert items ใหม่ (ไม่ลบทั้งหมด)
                if (items.length > 0) {
                    const vals: any[] = [];
                    const placeholders = items
                        .filter(it => it.inspection_id && it.inspection_item_id)
                        .map(it => {
                            // ต้องมี unique key บน inspection_item_id (หรือ (inspection_id, inspection_item_id))
                            vals.push(it.inspection_id, it.inspection_item_id, it.inspection_item_name, _created_by, _updated_by);
                            return "(?,?,?, ?, NOW(), ?, NOW())";
                        })
                        .join(",");

                    await conn.query(
                        `
        INSERT INTO data_service_equipment_item
          (inspection_id, inspection_item_id, inspection_item_name, created_by, created_date, updated_by, updated_date)
        VALUES ${placeholders}
        ON DUPLICATE KEY UPDATE
          inspection_item_name = VALUES(inspection_item_name),
          updated_by           = VALUES(updated_by),
          updated_date         = NOW()
        `,
                        vals
                    );
                }

                await conn.commit();
                return NextResponse.json({
                    success: true,
                    message: "บันทึกข้อมูลเรียบร้อย",
                    service_inspec_id: serviceInspecId,
                });
            } catch (err: any) {
                try { await conn.rollback(); } catch { }
                if (err?.code === "ER_DUP_ENTRY") {
                    return NextResponse.json(
                        { success: false, message: "โซนนี้ถูกเลือกแล้วสำหรับบริการนี้ในสาขานี้" },
                        { status: 409 }
                    );
                }
                console.error("DB Error:", err);
                return NextResponse.json(
                    { success: false, message: "Database error", error: err?.message },
                    { status: 500 }
                );
            } finally {
                conn.release();
            }
        }
    } catch (err: any) {
        console.error("DB Error:", err);
        return NextResponse.json(
            { success: false, message: "Database error", error: err?.message },
            { status: 500 }
        );
    }
}
