import { NextResponse } from "next/server";
import { query } from "@/lib-server/db";
import { generateId } from "@/lib/fetcher";

type Body = {
  form_code_prefix?: string;
  round_no?: number;
  report_no?: number;
  form_no?: number;
  data?: any;
};

const defaultFormNo = (prefix?: string) => {
  if (!prefix) return 1;
  if (prefix.startsWith("FORM8_2")) return 2;
  if (prefix.startsWith("FORM8_3")) return 3;
  return 1;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const data = body?.data ?? {};
    const job_id = data?.job_id || "";
    const equipment_id = data?.equipment_id || null;
    const is_active = data?.is_active ?? 1;
    const created_by = data?.created_by || "unknown";
    const updated_by = data?.updated_by || created_by;

    if (!job_id) {
      return NextResponse.json(
        { success: false, message: "กรุณาระบุ job_id" },
        { status: 400 }
      );
    }

    const form_code_prefix = body.form_code_prefix || "FORM8_1";
    const round_no = body.round_no ?? 1;
    const report_no = body.report_no ?? 8;
    const form_no = body.form_no ?? defaultFormNo(form_code_prefix);

    const form_code = data?.form_code || generateId(form_code_prefix);
    const form_data = JSON.stringify(data ?? {});

    const checkSql = `SELECT id FROM formdata_sign_forms WHERE form_code = ? LIMIT 1`;
    const existing = await query(checkSql, [form_code]);

    if (existing.length > 0) {
      const updateSql = `
        UPDATE formdata_sign_forms
        SET 
          form_data = ?,
          updated_by = ?,
          updated_date = NOW(),
          form_status = ?,
          is_active = ?,
          job_id = ?,
          equipment_id = ?,
          round_no = ?
        WHERE form_code = ?
      `;
      await query(updateSql, [
        form_data,
        updated_by,
        "success",
        is_active,
        job_id,
        equipment_id,
        round_no,
        form_code,
      ]);

      return NextResponse.json({
        success: true,
        message: "บันทึกข้อมูลเรียบร้อย",
        form_code,
        mode: "update",
      });
    }

    const insertSql = `
      INSERT INTO formdata_sign_forms 
        (report_no, form_no, form_code, form_data, is_active, created_by, created_date, updated_by, updated_date, form_status, job_id, equipment_id, round_no)
      VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, NOW(), ?, ?, ?, ?)
    `;
    await query(insertSql, [
      report_no,
      form_no,
      form_code,
      form_data,
      is_active,
      created_by,
      updated_by,
      "success",
      job_id,
      equipment_id,
      round_no,
    ]);

    return NextResponse.json({
      success: true,
      message: "บันทึกข้อมูลเรียบร้อย",
      form_code,
      mode: "create",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: "Database error", error: err?.message },
      { status: 500 }
    );
  }
}
