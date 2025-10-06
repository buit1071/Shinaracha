// import { NextResponse } from "next/server";
// import { query } from "@/lib-server/db";
// import { generateId } from "@/lib/fetcher";

// export async function GET(req: Request) {
//     try {
//         // อ่าน query param
//         const { searchParams } = new URL(req.url);
//         const active = searchParams.get("active"); // จะเป็น string หรือ null

//         let sql = `
//       SELECT * 
//       FROM master_customers
//     `;

//         // ถ้ามี param active และค่าคือ true → กรองเฉพาะ is_active = 1
//         if (active === "true" || active === "1") {
//             sql += " WHERE is_active = 1";
//         }

//         sql += " ORDER BY updated_date DESC";

//         const rows = await query(sql);

//         return NextResponse.json({ success: true, data: rows });
//     } catch (err: any) {
//         console.error("DB Error:", err);
//         return NextResponse.json(
//             { success: false, message: "Database error", error: err.message },
//             { status: 500 }
//         );
//     }
// }

// // POST เพิ่ม/แก้ไข ลูกค้า
// export async function POST(req: Request) {
//     try {
//         const body = await req.json();
//         const { customer_id, customer_name, is_active, created_by, updated_by } = body;

//         if (!customer_name) {
//             return NextResponse.json(
//                 { success: false, message: "กรุณากรอกชื่อลูกค้า" },
//                 { status: 400 }
//             );
//         }

//         if (customer_id) {
//             // กรณีมี customer_id → UPDATE
//             await query(
//                 `
//         UPDATE master_customers
//         SET customer_name = ?, is_active = ?, updated_by = ?, updated_date = NOW()
//         WHERE customer_id = ?
//       `,
//                 [customer_name, is_active ?? 1, updated_by ?? "system", customer_id]
//             );

//             return NextResponse.json({ success: true, message: "อัปเดตข้อมูลลูกค้าเรียบร้อย" });
//         } else {
//             // กรณีไม่มี customer_id → INSERT พร้อม gen ใหม่
//             const newCustomerId = generateId("CUST");

//             await query(
//                 `
//         INSERT INTO master_customers 
//         (customer_id, customer_name, is_active, created_by, created_date, updated_by, updated_date) 
//         VALUES (?, ?, ?, ?, NOW(), ?, NOW())
//       `,
//                 [newCustomerId, customer_name, is_active ?? 1, created_by ?? "system", updated_by ?? "system"]
//             );

//             return NextResponse.json({
//                 success: true,
//                 message: "เพิ่มข้อมูลเรียบร้อย",
//                 customer_id: newCustomerId,
//             });
//         }
//     } catch (err: any) {
//         console.error("DB Error:", err);
//         return NextResponse.json(
//             { success: false, message: "Database error", error: err.message },
//             { status: 500 }
//         );
//     }
// }