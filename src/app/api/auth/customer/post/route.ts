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

        // =========== Groups ===========
        if (entity === "groupCustomer") {
            const { group_id, customer_id, group_name, is_active, created_by, updated_by } = data;

            if (!customer_id || !group_name) {
                return NextResponse.json(
                    { success: false, message: "กรุณาระบุ Customer และ Group Name" },
                    { status: 400 }
                );
            }

            if (group_id) {
                // UPDATE
                await query(
                    `UPDATE data_group_customers
           SET customer_id=?, group_name=?, is_active=?, updated_by=?, updated_date=NOW()
           WHERE group_id=?`,
                    [customer_id, group_name, is_active ?? 1, updated_by ?? "system", group_id]
                );
                return NextResponse.json({ success: true, message: "อัปเดต Group เรียบร้อย" });
            } else {
                // INSERT
                const newGroupId = generateId("CTMG");
                await query(
                    `INSERT INTO data_group_customers
           (group_id, customer_id, group_name, is_active, created_by, created_date, updated_by, updated_date)
           VALUES (?,?,?,?,?,NOW(),?,NOW())`,
                    [newGroupId, customer_id, group_name, is_active ?? 1, created_by ?? "system", updated_by ?? "system"]
                );
                return NextResponse.json({
                    success: true,
                    message: "เพิ่มข้อมูลเรียบร้อย",
                    group_id: newGroupId,
                });
            }
        }

        // entity ไม่ตรง
        return NextResponse.json(
            { success: false, message: "entity ไม่ถูกต้อง" },
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