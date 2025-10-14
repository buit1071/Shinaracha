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

        if (entity === "company") {
            const { company_id, company_name_th, company_name_en, description, is_active, created_by, updated_by } = data;

            if (company_id) {
                // UPDATE
                await query(
                    `UPDATE master_company
           SET company_name_th=?, company_name_en=?, description=?, is_active=?, updated_by=?, updated_date=NOW()
           WHERE company_id=?`,
                    [company_name_th, company_name_en, description, is_active ?? 1, updated_by ?? "system", company_id]
                );
                return NextResponse.json({ success: true, message: "อัปเดตข้อมูลเรียบร้อย" });
            } else {
                // INSERT
                const newComId = generateId("COM");
                await query(
                    `INSERT INTO master_company
           (company_id, company_name_th, company_name_en, description, is_active, created_by, created_date, updated_by, updated_date)
           VALUES (?,?,?,?,?,?,NOW(),?,NOW())`,
                    [newComId, company_name_th, company_name_en, description, is_active ?? 1, created_by ?? "system", updated_by ?? "system"]
                );
                return NextResponse.json({
                    success: true,
                    message: "เพิ่มข้อมูลเรียบร้อย",
                    company_id: newComId,
                });
            }
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