// app/api/teams/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib-server/db";

type Body = {
    id?: number | string;
    team_id?: string;
    emp_id?: string;
    status_id?: string;
    is_active?: number;
    created_by?: string;
    updated_by?: string;
};

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const active = searchParams.get("active");   // "true" | "1" | null
        const teamId = searchParams.get("team_id");  // string | null

        let sql = `
      SELECT *
      FROM data_team_employee
    `;

        const where: string[] = [];
        const params: any[] = [];

        if (active === "true" || active === "1") {
            where.push("is_active = 1");
        }
        if (teamId) {
            where.push("team_id = ?");
            params.push(teamId);
        }

        if (where.length) {
            sql += ` WHERE ${where.join(" AND ")}`;
        }

        sql += " ORDER BY id ASC";

        const rows = await query(sql, params);

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
    try {
        const body = (await req.json()) as Body;

        // destructuring + ค่าเริ่มต้น
        const idRaw = body.id ?? 0;
        const id = Number(idRaw) || 0;
        const team_id = String(body.team_id ?? "").trim();
        const emp_id = String(body.emp_id ?? "").trim();
        const status_id = String(body.status_id ?? "").trim();
        const is_active = Number(
            body.is_active === 0 || body.is_active === 1 ? body.is_active : 1
        );
        const created_by = String(body.created_by ?? "").trim();
        const updated_by = String(body.updated_by ?? "").trim();

        if (!emp_id) {
            return NextResponse.json(
                { success: false, message: "ไม่พบ Employee ID" },
                { status: 400 }
            );
        }
        if (!status_id) {
            return NextResponse.json(
                { success: false, message: "ไม่พบ Status ID" },
                { status: 400 }
            );
        }

        // โหมดแก้ไข
        if (id > 0) {
            const sqlUpdate = `
        UPDATE data_team_employee
        SET team_id = ?, emp_id = ?, status_id = ?, is_active = ?,
            updated_by = ?, updated_date = NOW()
        WHERE id = ?
      `;
            const paramsUpdate = [
                team_id,
                emp_id,
                status_id,
                is_active,
                updated_by,
                id,
            ];

            const result: any = await query(sqlUpdate, paramsUpdate);

            // ตรวจว่ามีแถวที่ถูกแก้ไขหรือไม่
            if (!result?.affectedRows) {
                return NextResponse.json(
                    { success: false, message: "ไม่พบข้อมูลที่ต้องการแก้ไข" },
                    { status: 404 }
                );
            }

            // ดึงแถวล่าสุดส่งกลับ
            const rows: any = await query(
                `SELECT * FROM data_team_employee WHERE id = ?`,
                [id]
            );
            const row = Array.isArray(rows) ? rows[0] : rows?.[0];

            return NextResponse.json({
                success: true,
                mode: "update",
                data: row ?? null,
            });
        }

        // โหมดเพิ่มใหม่
        const sqlInsert = `
      INSERT INTO data_team_employee
        (team_id, emp_id, status_id, is_active, created_by, created_date, updated_by, updated_date)
      VALUES
        (?, ?, ?, ?, ?, NOW(), ?, NOW())
    `;
        const paramsInsert = [
            team_id,
            emp_id,
            status_id,
            is_active,
            created_by,
            updated_by,
        ];

        const insertRes: any = await query(sqlInsert, paramsInsert);
        const newId = insertRes?.insertId;

        // ดึงแถวที่เพิ่งเพิ่มส่งกลับ
        const rows: any = await query(
            `SELECT * FROM data_team_employee WHERE id = ?`,
            [newId]
        );
        const row = Array.isArray(rows) ? rows[0] : rows?.[0];

        return NextResponse.json({
            success: true,
            mode: "create",
            data: row ?? null,
        });
    } catch (err: any) {
        console.error("POST /teams Error:", err);
        return NextResponse.json(
            { success: false, message: "Database error", error: err?.message ?? String(err) },
            { status: 500 }
        );
    }
}
