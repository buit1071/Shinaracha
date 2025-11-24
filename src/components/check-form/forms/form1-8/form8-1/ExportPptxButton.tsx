"use client";

import * as React from "react";
import { exportToPptxForm8_1 } from "@/utils/exportToPptxForm8_1";
import type { Form8_1Data } from "./types";
import { showAlert } from "@/lib/fetcher";

type Props = {
  data: Form8_1Data | null | undefined;
  className?: string;
  label?: React.ReactNode;
};

export default function ExportPptxButton({ data, className, label }: Props) {
  const [downloading, setDownloading] = React.useState(false);

  const handleExport = async () => {
    if (!data) {
      // แจ้งเตือนถ้ายังไม่มีข้อมูลฟอร์ม
      void showAlert("warning", "ยังไม่มีข้อมูลฟอร์ม 8.1 สำหรับส่งออก PPTX");
      return;
    }
    setDownloading(true);
    try {
      await exportToPptxForm8_1(data);
      void showAlert("success", "ส่งออกไฟล์ PPTX เรียบร้อย");
    } catch (err: any) {
      console.error("exportToPptxForm8_1 failed", err);
      const msg = err?.message || String(err) || "ส่งออกไฟล์ PPTX ไม่สำเร็จ กรุณาลองอีกครั้ง";
      void showAlert("error", msg);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={downloading}
      className={`px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed ${className || ""}`}
    >
      {downloading ? "กำลังส่งออก..." : label || "Export PPTX"}
    </button>
  );
}
