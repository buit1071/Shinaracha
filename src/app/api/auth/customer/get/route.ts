import { NextResponse } from "next/server";
import { query } from "@/lib-server/db";

type GetBody =
    | { function: "customerBranch"; }
    | { function: "customerBranchDetail"; customer_id: string }
    | { function: "groupByCustomerId"; }
    | { function: "customerBranchAll"; }
    | { function: "branchName"; job_id: string }
    | { function: "StoreNo"; job_id: string }
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

        if (fn === "customerBranch") {
            const rows = await query(
                `SELECT *
                FROM data_customer
                `,
            );

            return NextResponse.json({
                success: true,
                data: rows || [],
            });
        }

        if (fn === "customerBranchAll") {
            const rows = await query(
                `SELECT *
                FROM data_customer`,
            );

            return NextResponse.json({
                success: true,
                data: rows || [],
            });
        }

        if (fn === "customerBranchDetail") {
            if (!body.customer_id) {
                return NextResponse.json(
                    { success: false, message: "กรุณาระบุ customer_id" },
                    { status: 400 }
                );
            }

            const rows = await query(
                `SELECT customer_id,
                    cus_cost_centre,
                    store_no,
                    customer_area,
                    customer_hub,
                    branch_name,
                    branch_tel,
                    address,
                    group_id,
                    latitude,
                    longitude,
                    is_active,
                    created_by,
                    created_date,
                    updated_by,
                    updated_date
                FROM data_customer
                WHERE customer_id = ?`,
                [body.customer_id]
            );

            return NextResponse.json({
                success: true,
                data: rows[0] || null,
            });
        }

        if (fn === "groupByCustomerId") {
            const rows = await query(
                `
        SELECT *
        FROM master_group
        ORDER BY created_date DESC
        `,
            );
            return NextResponse.json({ success: true, data: rows });
        }

        if (fn === "branchName") {
            // ✅ ขั้นตอนที่ 1: เอา job_id ไปหา customer_id จาก data_jobs
            const jobRows = await query(
                `SELECT customer_id FROM data_jobs WHERE job_id = ? LIMIT 1`,
                [body.job_id]
            );

            if (!jobRows.length || !jobRows[0].customer_id) {
                return NextResponse.json(
                    { success: false, message: "ไม่พบ customer_id จาก job_id นี้" },
                    { status: 404 }
                );
            }

            const customer_id = jobRows[0].customer_id;

            // ✅ ขั้นตอนที่ 2: เอา customer_id ไปหา branch_name จาก data_customer
            const branchRows = await query(
                `SELECT branch_name FROM data_customer WHERE customer_id = ?`,
                [customer_id]
            );

            if (!branchRows.length) {
                return NextResponse.json(
                    { success: false, message: "ไม่พบ branch_name ของ customer_id นี้" },
                    { status: 404 }
                );
            }

            return NextResponse.json({
                success: true,
                data: branchRows,
            });
        }
        
        if (fn === "StoreNo") {
            // ✅ ขั้นตอนที่ 1: เอา job_id ไปหา customer_id จาก data_jobs
            const jobRows = await query(
                `SELECT customer_id FROM data_jobs WHERE job_id = ? LIMIT 1`,
                [body.job_id]
            );

            if (!jobRows.length || !jobRows[0].customer_id) {
                return NextResponse.json(
                    { success: false, message: "ไม่พบ customer_id จาก job_id นี้" },
                    { status: 404 }
                );
            }

            const customer_id = jobRows[0].customer_id;

            // ✅ ขั้นตอนที่ 2: เอา customer_id ไปหา store_no จาก data_customer
            const branchRows = await query(
                `SELECT store_no FROM data_customer WHERE customer_id = ?`,
                [customer_id]
            );

            if (!branchRows.length) {
                return NextResponse.json(
                    { success: false, message: "ไม่พบ store_no ของ customer_id นี้" },
                    { status: 404 }
                );
            }

            return NextResponse.json({
                success: true,
                data: branchRows,
            });
        }

        // ไม่รู้จัก function
        return NextResponse.json(
            { success: false, message: "ไม่รู้จัก function ที่ส่งมา" },
            { status: 400 }
        );
    } catch (err: any) {

        return NextResponse.json(
            { success: false, message: "Database error", error: err.message },
            { status: 500 }
        );
    }
}
