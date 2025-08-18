import { Readable } from "stream";
import FormData from "form-data";
import fetch from "node-fetch";
import { config } from "dotenv";

config(); // โหลด .env

export async function POST(req: Request) {
    try {
        const formDataReq = await req.formData();
        const file = formDataReq.get("file") as File | null;

        if (!file) {
            return new Response(
                JSON.stringify({ success: false, error: "No file uploaded" }),
                { status: 400 }
            );
        }

        console.log("File name:", file.name);
        console.log("File type:", file.type);
        console.log("File size:", file.size);

        // แปลงเป็น Buffer
        const buffer = Buffer.from(await file.arrayBuffer());

        // ใช้ FormData ของ Node.js runtime
        const fd = new FormData();
        fd.append("file", Readable.from(buffer) as any, {
            filename: file.name,
            contentType: file.type,
        });

        console.log("Sending file to n8n webhook...");

        const response = await fetch(process.env.N8N_UPLOAD_FILE as string, {
            method: "POST",
            body: fd as any,
        });

        const n8nResult = await response.json();

        return new Response(
            JSON.stringify({ success: true, data: n8nResult }),
            { status: 200 }
        );

    } catch (error) {
        console.error("=== UPLOAD ERROR ===");
        console.error(error);
        return new Response(
            JSON.stringify({ success: false, error: (error as Error).message }),
            { status: 500 }
        );
    }
}