import { Readable } from "stream";
import FormData from "form-data";
import fetch from "node-fetch";
import { config } from "dotenv";
import https from "https";

config();
const agent = new https.Agent({ rejectUnauthorized: false });

export async function POST(req: Request) {
    try {
        const formDataReq = await req.formData();
        const file = formDataReq.get("file") as File | null;
        const customName = formDataReq.get("filename") as string | null;

        if (!file) {
            return new Response(
                JSON.stringify({ success: false, error: "No file uploaded" }),
                { status: 400 }
            );
        }

        // ✅ แปลงไฟล์เป็น Buffer
        const buffer = Buffer.from(await file.arrayBuffer());

        // ✅ ใช้ FormData ของ Node.js เพื่อส่งไปยัง n8n
        const fd = new FormData();
        fd.append("file", Readable.from(buffer) as any, {
            filename: customName || file.name,
            contentType: file.type,
        });

        // ✅ ส่งต่อไปที่ n8n webhook (ซึ่งรอรับ multipart/form-data)
        const response = await fetch(process.env.N8N_UPLOAD_FILE as string, {
            method: "POST",
            body: fd as any,
            agent,
        });

        const n8nResult = await response.json();

        return new Response(
            JSON.stringify({ success: true, data: n8nResult }),
            { status: 200 }
        );
    } catch (error) {
        return new Response(
            JSON.stringify({ success: false, error: (error as Error).message }),
            { status: 500 }
        );
    }
}
