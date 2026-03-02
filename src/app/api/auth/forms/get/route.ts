import { NextResponse } from "next/server";
import { query } from "@/lib-server/db";

type GetBody =
    | { function: "form1_3"; job_id: string; equipment_id: string }
    | { function: "viewEq"; equipment_id: string }
    | { function: "RCheckIn"; job_id: string; equipment_id: string }
    | { function: "RCheckOut"; job_id: string; equipment_id: string }
    | { function: "export_defect"; job_id: string; }
    ;

export async function POST(req: Request) {
    try {
        const body = (await req.json()) as Partial<GetBody>;
        const fn = body.function;

        if (!fn) {
            return NextResponse.json(
                { success: false, message: "กรุณาระบุ function" },
                { status: 400 }
            );
        }

        if (fn === "form1_3") {
            const rows = await query(`
                SELECT *
                FROM formdata_sign_forms
                WHERE job_id = ? AND equipment_id = ?
            `, [body.job_id, body.equipment_id]);

            return NextResponse.json({ success: true, data: rows[0] || null });
        }

        if (fn === "viewEq") {
            const sql = `
                SELECT 
                    me.*,
                    
                    -- แปลง ID เป็นชื่อไทย (ที่อยู่ป้าย)
                    sd.name_th AS sub_district_name,
                    d.name_th AS district_name,
                    p.name_th AS province_name,

                    -- แปลง ID เป็นชื่อไทย (ที่อยู่เจ้าของป้าย)
                    osd.name_th AS owner_sub_district_name,
                    od.name_th AS owner_district_name,
                    op.name_th AS owner_province_name,

                    -- แปลง ID เป็นชื่อไทย (ที่อยู่เจ้าของอาคาร)
                    bsd.name_th AS building_owner_sub_district_name,
                    bd.name_th AS building_owner_district_name,
                    bp.name_th AS building_owner_province_name

                FROM master_equipments me
                
                -- JOIN ที่อยู่ป้าย (แก้ตรง ON ...)
                LEFT JOIN master_subdistricts sd ON sd.sub_district_id = me.sub_district_id
                LEFT JOIN master_districts d     ON d.district_id      = me.district_id
                LEFT JOIN master_provinces p     ON p.province_id      = me.province_id

                -- JOIN ที่อยู่เจ้าของป้าย (แก้ตรง ON ...)
                LEFT JOIN master_subdistricts osd ON osd.sub_district_id = me.owner_sub_district_id
                LEFT JOIN master_districts od     ON od.district_id      = me.owner_district_id
                LEFT JOIN master_provinces op     ON op.province_id      = me.owner_province_id

                -- JOIN ที่อยู่เจ้าของอาคาร (แก้ตรง ON ...)
                LEFT JOIN master_subdistricts bsd ON bsd.sub_district_id = me.building_owner_sub_district_id
                LEFT JOIN master_districts bd     ON bd.district_id      = me.building_owner_district_id
                LEFT JOIN master_provinces bp     ON bp.province_id      = me.building_owner_province_id

                WHERE me.equipment_id = ?
            `;

            const rows = await query(sql, [body.equipment_id]);

            return NextResponse.json({ success: true, data: rows[0] || null });
        }

        if (fn === "RCheckIn") {

            const rows = await query(
                `SELECT * FROM data_job_checkins WHERE job_id = ? AND equipment_id = ? LIMIT 1`,
                [body.job_id, body.equipment_id]
            );

            if (rows.length > 0) {
                // ถ้ามีข้อมูล -> return true พร้อม data
                return NextResponse.json({
                    success: true,
                    exists: true,
                    data: rows[0]
                });
            } else {
                // ถ้าไม่มีข้อมูล -> return false
                return NextResponse.json({
                    success: true,
                    exists: false,
                    data: null
                });
            }
        }

        if (fn === "RCheckOut") {
            const rows = await query(
                `SELECT * FROM data_job_checkins 
                 WHERE job_id = ? 
                 AND equipment_id = ? 
                 AND check_out_date IS NOT NULL 
                 LIMIT 1`,
                [body.job_id, body.equipment_id]
            );

            if (rows.length > 0) {
                // ถ้าเจอข้อมูล แปลว่า Check Out แล้ว
                return NextResponse.json({
                    success: true,
                    checked_out: true,
                    data: rows[0]
                });
            } else {
                // ถ้าไม่เจอ (อาจจะยังไม่ Check Out หรือยังไม่ Check In)
                return NextResponse.json({
                    success: true,
                    checked_out: false,
                    data: null
                });
            }
        }

        if (fn === "export_defect") {
            const { job_id } = body;

            if (!job_id) {
                return NextResponse.json({ success: false, message: "Missing job_id" }, { status: 400 });
            }

            // ==========================================
            // 1. Query JOIN ข้อมูลตามที่ต้องการ
            // ==========================================
            const rows = await query(
                `SELECT 
                    dp.project_name,
                    dj.job_start_date,
                    de.first_name_th,
                    de.last_name_th,
                    me.address_no, me.moo, me.alley, me.road, me.zipcode, me.phone, me.fax,
                    ms.name_th AS sub_district_name,
                    md.name_th AS district_name,
                    mp.name_th AS province_name
                FROM data_jobs dj
                -- 1. หาชื่อโครงการ
                LEFT JOIN data_projects dp ON dj.project_id = dp.project_id
                -- 3, 5. หาวิศวกรผู้รับผิดชอบ/ตรวจสอบ (STA-001)
                LEFT JOIN data_team_employee dte ON dj.team_id = dte.team_id AND dte.status_id = 'STA-001'
                LEFT JOIN data_employees de ON dte.emp_id = de.emp_id
                -- 4. หาที่ตั้ง (อุปกรณ์)
                LEFT JOIN data_job_equipments dje ON dj.job_id = dje.job_id
                LEFT JOIN master_equipments me ON dje.equipment_id = me.equipment_id
                -- 4. หาที่ตั้ง (ตำบล, อำเภอ, จังหวัด)
                LEFT JOIN master_subdistricts ms ON me.sub_district_id = ms.sub_district_id
                LEFT JOIN master_districts md ON me.district_id = md.district_id
                LEFT JOIN master_provinces mp ON me.province_id = mp.province_id
                WHERE dj.job_id = ?
                LIMIT 1`,
                [job_id]
            );

            if (rows.length === 0) {
                return NextResponse.json({ success: false, message: "ไม่พบข้อมูล job_id นี้" }, { status: 404 });
            }

            const data = rows[0];

            // ==========================================
            // 2. Format ข้อมูลให้ออกมาพร้อมใช้งาน
            // ==========================================

            // 2.1 แปลงวันที่ (1 กุมภาพันธ์ 2569)
            let formattedDate = "-";
            if (data.job_start_date) {
                const thaiMonths = [
                    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
                    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
                ];
                const d = new Date(data.job_start_date);
                if (!isNaN(d.getTime())) {
                    formattedDate = `${d.getDate()} ${thaiMonths[d.getMonth()]} ${d.getFullYear() + 543}`;
                }
            }

            // 2.2 ชื่อวิศวกร
            const engineerName = (data.first_name_th || data.last_name_th)
                ? `${data.first_name_th || ""} ${data.last_name_th || ""}`.trim()
                : "-";

            // 2.3 ประกอบร่างที่ตั้ง (Address)
            let addressParts = [];
            if (data.address_no) addressParts.push(`เลขที่ ${data.address_no}`);
            if (data.moo) addressParts.push(`หมู่ ${data.moo}`);
            if (data.alley) addressParts.push(`ซอย ${data.alley}`);
            if (data.road) addressParts.push(`ถนน ${data.road}`);
            if (data.sub_district_name) addressParts.push(`ตำบล/แขวง ${data.sub_district_name}`);
            if (data.district_name) addressParts.push(`อำเภอ/เขต ${data.district_name}`);
            if (data.province_name) addressParts.push(`จังหวัด${data.province_name}`);
            if (data.zipcode) addressParts.push(`${data.zipcode}`);

            const fullAddress = addressParts.length > 0 ? addressParts.join(" ") : "-";

            // ==========================================
            // 3. ส่งข้อมูลกลับไปให้ Postman / Frontend
            // ==========================================
            return NextResponse.json({
                success: true,
                data: {
                    project_name: data.project_name || "-",
                    inspection_date: formattedDate,
                    engineer_name: engineerName,
                    address: fullAddress,
                    phone: data.phone || "-",
                    fax: data.fax || "-"
                }
            });
        }

        return NextResponse.json({ success: false, message: "ไม่รู้จัก function ที่ส่งมา" }, { status: 400 });
    } catch (err: any) {

        return NextResponse.json(
            { success: false, message: "Database error", error: err.message },
            { status: 500 }
        );
    }
}
