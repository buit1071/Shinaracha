"use client";

import * as React from "react";
import { 
  exportToPptxForm8_1, 
  exportTablesOnlyPptx, 
  exportPhotosOnlyPptx,
  exportFullPptx,
  exportWithPreprocessor
} from "@/utils/exportToPptxForm8_1";
import { fetchForm8_1FromDb } from "./pptxExport/dbFetcher";
import type { Form8_1Data } from "./types";
import { showAlert } from "@/lib/fetcher";
import { showLoading } from "@/lib/loading";

type ExportType = "main" | "tables" | "photos" | "full" | "withImages";

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
  const [showMenu, setShowMenu] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleExport = async (exportType: ExportType = "main") => {
    console.log("[ExportPptxButton] Export button clicked, type:", exportType);
    setDownloading(true);
    setShowMenu(false);
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
      
      // Choose export function based on type
      switch (exportType) {
        case "tables":
          await exportTablesOnlyPptx(dbFormData);
          break;
        case "photos":
          await exportPhotosOnlyPptx(dbFormData);
          break;
        case "full":
          await exportFullPptx(dbFormData);
          break;
        case "withImages":
          await exportWithPreprocessor(dbFormData);
          break;
        case "main":
        default:
          await exportToPptxForm8_1(dbFormData);
          break;
      }

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
    <div className="relative inline-block" ref={menuRef}>
      {/* Main button with dropdown */}
      <div className="flex">
        <button
          type="button"
          onClick={() => handleExport("main")}
          disabled={downloading}
          className={`px-4 py-2 rounded-l bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed ${
            className || ""
          }`}
        >
          {downloading ? "กำลังส่งออก..." : label || "Export PPTX"}
        </button>
        <button
          type="button"
          onClick={() => setShowMenu(!showMenu)}
          disabled={downloading}
          className="px-2 py-2 rounded-r bg-blue-700 text-white hover:bg-blue-800 disabled:opacity-60 border-l border-blue-500"
          aria-label="More export options"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Dropdown menu */}
      {showMenu && (
        <div className="absolute right-0 mt-1 w-56 bg-white rounded-md shadow-lg border border-gray-200 z-50">
          <div className="py-1">
            <button
              type="button"
              onClick={() => handleExport("main")}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              📄 Export ไฟล์หลัก (Template)
            </button>
            <button
              type="button"
              onClick={() => handleExport("withImages")}
              className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 font-medium"
            >
              🖼️ Export พร้อมรูปภาพ (ใหม่!)
            </button>
            <hr className="my-1" />
            <button
              type="button"
              onClick={() => handleExport("tables")}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              📊 Export เฉพาะตาราง (ข้อ 8, 9)
            </button>
            <button
              type="button"
              onClick={() => handleExport("photos")}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              🖼️ Export เฉพาะรูปภาพ (PptxGenJS)
            </button>
            <hr className="my-1" />
            <button
              type="button"
              onClick={() => handleExport("full")}
              className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 font-medium"
            >
              📦 Export ทั้งหมด (3 ไฟล์)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
