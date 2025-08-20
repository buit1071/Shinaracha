import { NextResponse } from "next/server";
import { query } from "@/lib-server/db";
import { generateTeamId } from "@/lib/fetcher";

export async function GET(req: Request) {
    try {
        // อ่าน query param
        const { searchParams } = new URL(req.url);
        const active = searchParams.get("active"); // จะเป็น string หรือ null

        let sql = `
      SELECT * 
      FROM data_teams
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

// POST เพิ่ม/แก้ไข
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            team_id = "",
            team_name = "",
            uuid = "",
            zone_id = "",
            is_active = 1,
            created_by = "",
            updated_by = "",
            username = "",
            password = "",
        } = body || {};

        if (!team_name) {
            return NextResponse.json(
                { success: false, message: "กรุณาระบุชื่อ" },
                { status: 400 }
            );
        }

        if (!team_id) {
            // ===== CREATE =====
            const newTeamId = await generateTeamId();

            const insertSql = `
        INSERT INTO data_teams
          (team_id, team_name, uuid, zone_id, is_active, created_by, updated_by, username, password, created_date, updated_date)
        VALUES
          (?,       ?,         ?,    ?,       ?,         ?,          ?,         ?,        ?,        NOW(),       NOW())
      `;
            const insertParams = [
                newTeamId,
                team_name,
                uuid || null,
                zone_id || null,
                Number(is_active) ? 1 : 0,
                created_by || updated_by || null,
                updated_by || created_by || null,
                username || null,
                password || null, // ❗ ควรเข้ารหัสก่อน
            ];

            await query(insertSql, insertParams);

            const [row] = await query(`SELECT * FROM data_teams WHERE team_id = ?`, [newTeamId]);
            return NextResponse.json({ success: true, message: "บันทึกข้อมูลเรียบร้อย", mode: "create", data: row });
        } else {
            // ===== UPDATE =====
            const updateSql = `
        UPDATE data_teams
          SET team_name   = ?,
              uuid        = ?,
              zone_id     = ?,
              is_active   = ?,
              updated_by  = ?,
              username    = ?,
              password    = ?,
              updated_date= NOW()
        WHERE team_id = ?
      `;
            const updateParams = [
                team_name,
                uuid || null,
                zone_id || null,
                Number(is_active) ? 1 : 0,
                updated_by || created_by || null,
                username || null,
                password || null,
                team_id,
            ];

            const result: any = await query(updateSql, updateParams);
            if (!result?.affectedRows) {
                return NextResponse.json(
                    { success: false, message: `ไม่พบ team_id: ${team_id}` },
                    { status: 404 }
                );
            }

            const [row] = await query(`SELECT * FROM data_teams WHERE team_id = ?`, [team_id]);
            return NextResponse.json({ success: true, message: "อัปเดทข้อมูลเรียบร้อย", mode: "update", data: row });
        }
    } catch (err: any) {
        console.error("POST /teams Error:", err);
        return NextResponse.json(
            { success: false, message: "Database error", error: err.message },
            { status: 500 }
        );
    }
}
