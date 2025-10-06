// app/api/upload/profile/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";

export async function POST(req: Request) {
    try {
        const form = await req.formData();
        const file = form.get("file") as File | null;
        if (!file) {
            return NextResponse.json({ success: false, message: "ไม่พบไฟล์" }, { status: 400 });
        }

        const origName = (form.get("filename") as string) || file.name || "avatar.png";

        const ext = path.extname(origName) || ".png";
        const safeName = `${Date.now()}${ext}`.replace(/[^a-zA-Z0-9._-]/g, "_");

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const uploadDir = path.join(process.cwd(), "public", "images", "profile");
        await fs.mkdir(uploadDir, { recursive: true });

        const fullPath = path.join(uploadDir, safeName);
        await fs.writeFile(fullPath, buffer);

        return NextResponse.json({
            success: true,
            filename: safeName,                // ✅ ส่งแค่ชื่อไฟล์กลับไป
            url: `/images/profile/${safeName}` // เผื่ออยากใช้แสดงผลทันที
        });
    } catch (e: any) {
        console.error("Upload error:", e);
        return NextResponse.json({ success: false, message: "อัปโหลดล้มเหลว" }, { status: 500 });
    }
}
