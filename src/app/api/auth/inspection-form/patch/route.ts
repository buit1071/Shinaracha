import { NextResponse } from "next/server";
import { query } from "@/lib-server/db";

type PatchBody = {
  entity: "service";
  data: {
    service_id: string;
    service_name?: string;
    inspection_duration?: number | null;
    inspections_per_year?: number | null;
    updated_by?: string;
  };
};

export async function PATCH(req: Request) {
  try {
    const body = (await req.json()) as Partial<PatchBody>;

    if (body?.entity !== "service") {
      return NextResponse.json(
        { success: false, message: "entity ไม่ถูกต้อง (รองรับเฉพาะ 'service')" },
        { status: 400 }
      );
    }

    const {
      service_id,
      service_name,
      inspection_duration,
      inspections_per_year,
      updated_by,
    } = body.data || ({} as PatchBody["data"]);

    if (!service_id) {
      return NextResponse.json(
        { success: false, message: "กรุณาระบุ service_id" },
        { status: 400 }
      );
    }

    // เตรียมเฉพาะฟิลด์ที่อนุญาตให้แก้
    const sets: string[] = [];
    const params: any[] = [];

    if (service_name !== undefined) {
      sets.push("service_name = ?");
      params.push(service_name.trim());
    }
    if (inspection_duration !== undefined) {
      // ถ้าอยากให้ null = 0 ที่ฝั่ง API ด้วย
      const n = inspection_duration == null ? 0 : Number(inspection_duration) || 0;
      sets.push("inspection_duration = ?");
      params.push(n);
    }
    if (inspections_per_year !== undefined) {
      const n = inspections_per_year == null ? 0 : Number(inspections_per_year) || 0;
      sets.push("inspections_per_year = ?");
      params.push(n);
    }

    if (sets.length === 0) {
      return NextResponse.json(
        { success: false, message: "ไม่มีฟิลด์ที่อนุญาตให้แก้ไขในคำขอนี้" },
        { status: 400 }
      );
    }

    // เติม updated_by / updated_date
    sets.push("updated_by = ?");
    params.push(updated_by ?? "system");
    sets.push("updated_date = NOW()");

    const sql = `UPDATE master_services SET ${sets.join(", ")} WHERE service_id = ?`;
    params.push(service_id);

    await query(sql, params);

    return NextResponse.json({
      success: true,
      message: "บันทึกข้อมูลเรียบร้อย",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: "Database error", error: err?.message },
      { status: 500 }
    );
  }
}
