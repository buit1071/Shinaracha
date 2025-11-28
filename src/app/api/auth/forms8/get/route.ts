import { NextResponse } from "next/server";
import { query } from "@/lib-server/db";

type Body = {
  job_id?: string;
  equipment_id?: string;
  form_code_prefix?: string;
  round_no?: number;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const job_id = body.job_id || "";
    const equipment_id = body.equipment_id;
    const prefix = body.form_code_prefix || "FORM8_1";
    const round_no = body.round_no ?? 1;

    if (!job_id) {
      return NextResponse.json(
        { success: false, message: "กรุณาระบุ job_id" },
        { status: 400 }
      );
    }

    const params: any[] = [job_id, round_no];
    const equipFilter = equipment_id ? "AND equipment_id = ?" : "";
    if (equipment_id) params.push(equipment_id);

    const rows = await query(
      `
        SELECT *
        FROM formdata_sign_forms
        WHERE job_id = ?
          AND round_no = ?
          ${equipFilter}
          AND form_code LIKE ?
        ORDER BY updated_date DESC, id DESC
        LIMIT 1
      `,
      [...params, `${prefix}%`]
    );

    return NextResponse.json({ success: true, data: rows[0] || null });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: "Database error", error: err?.message },
      { status: 500 }
    );
  }
}
