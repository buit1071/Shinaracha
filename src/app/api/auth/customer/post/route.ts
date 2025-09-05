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

        // =========== Branch Detail ===========
        if (entity === "branchDetail") {
            const {
                branch_id,
                customer_id,
                cus_cost_centre,
                store_no,
                customer_format,
                customer_area,
                customer_hub,
                branch_name,
                branch_tel,
                address,
                customer_regional,
                customer_province,
                group_id,
                latitude,
                longitude,
                is_active,
                created_by,
                updated_by,
            } = data;

            // helper
            const trim = (v: any) => (v === null || v === undefined ? null : String(v).trim());
            const nullIfEmpty = (v: any) => {
                if (v === null || v === undefined) return null;
                const s = String(v).trim();
                return s === "" ? null : s;
            };
            const toFixed6 = (n: number) => Math.round(n * 1e6) / 1e6;
            const toLatOrNull = (v: any) => {
                const n = Number(v);
                if (!Number.isFinite(n)) return null;
                if (n < -90 || n > 90) return null;
                return toFixed6(n);
            };
            const toLngOrNull = (v: any) => {
                const n = Number(v);
                if (!Number.isFinite(n)) return null;
                if (n < -180 || n > 180) return null;
                return toFixed6(n);
            };

            const lat = toLatOrNull(latitude);
            const lng = toLngOrNull(longitude);

            // ----- UPDATE -----
            if (branch_id) {
                const sql = `
                    UPDATE data_customer_branchs
                    SET
                        customer_id       = ?,
                        cus_cost_centre   = ?,
                        store_no          = ?,
                        customer_format   = ?,
                        customer_area     = ?,
                        customer_hub      = ?,
                        branch_name       = ?,
                        branch_tel        = ?,
                        address           = ?,
                        customer_regional = ?,
                        customer_province = ?,
                        group_id          = ?,
                        latitude          = ?,
                        longitude         = ?,
                        is_active         = ?,
                        updated_by        = ?,
                        updated_date      = NOW()
                    WHERE branch_id = ?
                    `;
                const params = [
                    customer_id,
                    trim(cus_cost_centre),
                    trim(store_no),
                    trim(customer_format),
                    trim(customer_area),
                    trim(customer_hub),
                    trim(branch_name),
                    trim(branch_tel),
                    trim(address),
                    trim(customer_regional),
                    trim(customer_province),
                    nullIfEmpty(group_id),
                    lat,
                    lng,
                    is_active ?? 1,
                    updated_by || "system",
                    branch_id,
                ];
                await query(sql, params);
                return NextResponse.json({
                    success: true,
                    message: "อัปเดตสาขาเรียบร้อย",
                    branch_id,
                });
            }

            // ----- INSERT -----
            const newBranchId = generateId("CTMB");
            const insertSql = `
                    INSERT INTO data_customer_branchs
                    (
                    branch_id,
                    customer_id,
                    cus_cost_centre,
                    store_no,
                    customer_format,
                    customer_area,
                    customer_hub,
                    branch_name,
                    branch_tel,
                    address,
                    customer_regional,
                    customer_province,
                    group_id,
                    latitude,
                    longitude,
                    is_active,
                    created_by,
                    created_date,
                    updated_by,
                    updated_date
                    )
                    VALUES
                    (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),?,NOW())
                `;
            const insertParams = [
                newBranchId,
                customer_id,
                trim(cus_cost_centre),
                trim(store_no),
                trim(customer_format),
                trim(customer_area),
                trim(customer_hub),
                trim(branch_name),
                trim(branch_tel),
                trim(address),
                trim(customer_regional),
                trim(customer_province),
                nullIfEmpty(group_id),
                lat,
                lng,
                is_active ?? 1,
                created_by || "system",
                updated_by || "system",
            ];
            await query(insertSql, insertParams);

            return NextResponse.json({
                success: true,
                message: "เพิ่มข้อมูลเรียบร้อย",
                branch_id: newBranchId,
            });
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