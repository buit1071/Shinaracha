import { google } from "googleapis";
import { Readable } from "stream";

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return new Response(JSON.stringify({ success: false, error: "No file uploaded" }), { status: 400 });
        }

        console.log("=== DEBUG START ===");
        console.log("GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID);
        console.log("GOOGLE_CLIENT_SECRET:", process.env.GOOGLE_CLIENT_SECRET ? "✅ exists" : "❌ missing");
        console.log("GOOGLE_REDIRECT_URI:", process.env.GOOGLE_REDIRECT_URI);
        console.log("GOOGLE_REFRESH_TOKEN:", process.env.GOOGLE_REFRESH_TOKEN ? "✅ exists" : "❌ missing");
        console.log("File name:", file.name);
        console.log("File type:", file.type);
        console.log("File size:", file.size);

        // Auth
        const auth = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        );
        auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

        console.log("Auth credentials set:", auth.credentials);

        const drive = google.drive({ version: "v3", auth });

        // แปลงเป็น stream
        const buffer = Buffer.from(await file.arrayBuffer());
        const stream = Readable.from(buffer);

        console.log("Uploading to Google Drive...");

        // อัปโหลดไฟล์
        const res = await drive.files.create({
            requestBody: { name: file.name },
            media: { mimeType: file.type, body: stream },
            fields: "id, webViewLink, webContentLink",
        });

        console.log("Upload result:", res.data);
        console.log("=== DEBUG END ===");

        return new Response(JSON.stringify({ success: true, data: res.data }), { status: 200 });
    } catch (error) {
        console.error("=== UPLOAD ERROR ===");
        console.error(error);
        console.error("=== ERROR DETAILS ===", JSON.stringify(error, null, 2));
        return new Response(JSON.stringify({ success: false, error: (error as Error).message }), { status: 500 });
    }
}
