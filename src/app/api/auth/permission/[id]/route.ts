import { NextResponse } from "next/server";
import { query } from "@/lib-server/db";

type Params = { id: string };

export async function GET(
    _req: Request,
    ctx: { params: Promise<Params> } // 👈 params เป็น Promise
) {
    try {
        const { id } = await ctx.params; // 👈 ต้อง await ก่อนใช้
        const permission_id = String(id);

        // ดึงตัว permission
        const permRows = (await query(
            `SELECT permission_id, permission_name, is_active, created_by, updated_by, created_date, updated_date
         FROM master_permissions
        WHERE permission_id = ?`,
            [permission_id]
        )) as any[];

        const perm = permRows?.[0] ?? null;

        // ดึง mapping menu_ids
        const mapRows = (await query(
            `SELECT menu_id
         FROM data_permission_menu
        WHERE permission_id = ?`,
            [permission_id]
        )) as any[];

        const menu_ids: string[] = mapRows.map((r) => String(r.menu_id));

        return NextResponse.json({
            success: true,
            data: perm
                ? { ...perm, menu_ids }
                : { permission_id, menu_ids }, // เผื่อกรณีไม่พบ perm ก็ยังส่ง menu_ids ได้
        });
    } catch (err: any) {
        return NextResponse.json(
            { success: false, message: "Database error", error: err.message },
            { status: 500 }
        );
    }
}

export async function DELETE(
    _req: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const permission_id = String(id).trim();

        if (!permission_id) {
            return NextResponse.json(
                { success: false, message: "ไม่พบ ID" },
                { status: 400 }
            );
        }

        const result: any = await query(
            `
      DELETE dpm, mp
      FROM master_permissions AS mp
      LEFT JOIN data_permission_menu AS dpm
             ON dpm.permission_id = mp.permission_id
      WHERE mp.permission_id = ?
      `,
            [permission_id]
        );

        if (!result || (typeof result.affectedRows === "number" && result.affectedRows === 0)) {
            return NextResponse.json(
                { success: false, message: "ไม่พบข้อมูลที่จะลบ หรือถูกลบไปแล้ว" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "ลบข้อมูลเรียบร้อย",
        });
    } catch (err: any) {
        return NextResponse.json(
            { success: false, message: "Database error", error: err?.message ?? String(err) },
            { status: 500 }
        );
    }
}