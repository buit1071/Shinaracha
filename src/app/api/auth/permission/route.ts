import { NextResponse } from "next/server";
import { query } from "@/lib-server/db";
import { generateId } from "@/lib/fetcher";

export async function GET(req: Request) {
    try {
        // อ่าน query param
        const { searchParams } = new URL(req.url);
        const active = searchParams.get("active"); // จะเป็น string หรือ null

        let sql = `
      SELECT * 
      FROM master_permissions
    `;

        // ถ้ามี param active และค่าคือ true → กรองเฉพาะ is_active = 1
        if (active === "true" || active === "1") {
            sql += " WHERE is_active = 1";
        }

        sql += " ORDER BY updated_date DESC";

        const rows = await query(sql);

        return NextResponse.json({ success: true, data: rows });
    } catch (err: any) {
        console.error("DB Error:", err);
        return NextResponse.json(
            { success: false, message: "Database error", error: err.message },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    let inTx = false;
    try {
        const body = await req.json();

        // ===== validate ขั้นต่ำ =====
        const name = String(body.permission_name ?? "").trim();
        const is_active = body.is_active === 0 ? 0 : 1;
        const created_by = String(body.created_by ?? "system");
        const updated_by = String(body.updated_by ?? "system");
        const menu_ids_raw: string[] = Array.isArray(body.menu_ids) ? body.menu_ids : [];

        // unique + กรองค่าว่าง
        const menu_ids = Array.from(
            new Set(menu_ids_raw.map((x) => String(x).trim()).filter(Boolean))
        );

        if (!name) {
            return NextResponse.json(
                { success: false, message: "กรุณากรอกชื่อสิทธิ์" },
                { status: 400 }
            );
        }

        // ===== เริ่มทรานแซคชัน =====
        await query("START TRANSACTION");
        inTx = true;

        let permission_id = String(body.permission_id ?? "").trim();
        const isUpdate = !!permission_id;

        if (!isUpdate) {
            // ----- CREATE -----
            const newPermissionId = generateId("PER");
            permission_id = newPermissionId;

            await query(
                `
        INSERT INTO master_permissions
          (permission_id, permission_name, is_active, created_by, created_date, updated_by, updated_date)
        VALUES
          (?, ?, ?, ?, NOW(), ?, NOW())
      `,
                [permission_id, name, is_active, created_by, updated_by]
            );
        } else {
            // ----- UPDATE -----
            await query(
                `
        UPDATE master_permissions
           SET permission_name = ?,
               is_active = ?,
               updated_by = ?,
               updated_date = NOW()
         WHERE permission_id = ?
      `,
                [name, is_active, updated_by, permission_id]
            );

            // ลบ mapping เดิมทั้งหมดก่อน
            await query(
                `DELETE FROM data_permission_menu WHERE permission_id = ?`,
                [permission_id]
            );
        }

        // ----- แทรก mapping menu_ids ใหม่ -----
        if (menu_ids.length > 0) {
            const valuesSql = menu_ids.map(() => "(?, ?)").join(", ");
            const params = menu_ids.flatMap((mid) => [permission_id, mid]);
            await query(
                `
        INSERT INTO data_permission_menu (permission_id, menu_id)
        VALUES ${valuesSql}
      `,
                params
            );
        }

        await query("COMMIT");
        inTx = false;

        return NextResponse.json({
            success: true,
            message: isUpdate ? "อัปเดตสิทธิ์สำเร็จ" : "เพิ่มสิทธิ์สำเร็จ",
            data: { permission_id },
        });
    } catch (err: any) {
        if (inTx) {
            try {
                await query("ROLLBACK");
            } catch { }
        }
        console.error("POST /permission error:", err);
        return NextResponse.json(
            { success: false, message: "Database error", error: err?.message ?? String(err) },
            { status: 500 }
        );
    }
}