"use client";

import * as React from "react";
import { generateForm8_1PPTX } from "./pptxExport";
import { fetchForm8_1FromDb } from "./pptxExport/dbFetcher";
import type { Form8_1Data } from "./types";
import { showAlert } from "@/lib/fetcher";
import { showLoading } from "@/lib/loading";

type Props = {
  data: Form8_1Data | null | undefined;
  jobId: string;
  equipmentId: string;
  className?: string;
  label?: React.ReactNode;
};

export default function ExportPptxButton({
  data,
  jobId,
  equipmentId,
  className,
  label,
}: Props) {
  const [downloading, setDownloading] = React.useState(false);

  const handleExport = async () => {
    console.log("[ExportPptxButton] Export button clicked");
    setDownloading(true);
    showLoading(true);
    try {
      // Fetch saved form data from database (ensures data is saved + latest)
      console.log("[ExportPptxButton] Fetching latest form data from DB...");
      const dbFormData = await fetchForm8_1FromDb(jobId, equipmentId);

      if (!dbFormData) {
        console.warn("[ExportPptxButton] No saved form data found in DB");
        void showAlert(
          "warning",
          "ยังไม่มีข้อมูลฟอร์ม 8.1 ในฐานข้อมูล กรุณากด บันทึก ก่อน"
        );
        return;
      }

      console.log("[ExportPptxButton] Starting PPTX generation with DB data...");
      // Generate PPTX buffer from template using DB data
      const templatePath = "templates/Form1-8.1.pptx";
      const pptxBuffer = await generateForm8_1PPTX(templatePath, dbFormData);

      console.log("[ExportPptxButton] PPTX generated, creating download...");
      // Create blob and trigger download
      const blob = new Blob([pptxBuffer], {
        type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Form8_2_${new Date().getTime()}.pptx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log("[ExportPptxButton] Download triggered successfully");
      void showAlert("success", "ส่งออกไฟล์ PPTX เรียบร้อย");
    } catch (err: any) {
      console.error("[ExportPptxButton] Export failed:", err);
      const msg =
        err?.message ||
        String(err) ||
        "ส่งออกไฟล์ PPTX ไม่สำเร็จ กรุณาลองอีกครั้ง";
      void showAlert("error", msg);
    } finally {
      setDownloading(false);
      showLoading(false);
      console.log("[ExportPptxButton] Export process completed");
    }
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={downloading}
      className={`px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed ${
        className || ""
      }`}
    >
      {downloading ? "กำลังส่งออก..." : label || "Export PPTX"}
    </button>
  );
}

