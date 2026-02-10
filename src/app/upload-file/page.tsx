"use client";
import { useState } from "react";

export default function UploadPage() {
    const [file, setFile] = useState<File | null>(null);
    const [message, setMessage] = useState("");

    const handleUpload = async () => {
        if (!file) return alert("เลือกไฟล์ก่อน");

        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/auth/upload-file", {
            method: "POST",
            body: formData,
        });

        const data = await res.json();
        const firstFile = data.data?.files?.[0];
        if (data.success) {
            setMessage(
                `อัปโหลดสำเร็จ:${firstFile?.name}`
            );
        } else {
            setMessage(`ผิดพลาด: ${data.error}`);
        }
    };

    return (
        <div style={{
            padding: 20,
            background: "#f4f6f8",
            borderRadius: 10,
            maxWidth: 400,
            margin: "40px auto",
            boxShadow: "0 4px 10px rgba(0,0,0,0.1)"
        }}>
            <h1 style={{ color: "#333", textAlign: "center" }}>อัปโหลดไฟล์ไป Google Drive</h1>

            <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                style={{
                    display: "block",
                    margin: "20px auto",
                    padding: "10px",
                    border: "1px solid #ccc",
                    borderRadius: "6px",
                    background: "#fff",
                    cursor: "pointer"
                }}
            />

            <button
                onClick={handleUpload}
                style={{
                    display: "block",
                    width: "100%",
                    padding: "10px",
                    background: "#4CAF50",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "16px",
                    cursor: "pointer",
                    marginTop: "10px"
                }}
            >
                อัปโหลด
            </button>

            {message && (
                <p style={{
                    marginTop: "15px",
                    padding: "10px",
                    background: message.startsWith("ผิดพลาด") ? "#ffebee" : "#e8f5e9",
                    color: message.startsWith("ผิดพลาด") ? "#c62828" : "#2e7d32",
                    borderRadius: "6px"
                }}>
                    {message}
                </p>
            )}
        </div>

    );
}
