"use client";
import * as React from "react";
import type { Form8_1Report } from "./types";
import { buildRemoteUrl, renameWithDateTime } from "./UploadUtils";

type Props = {
  value?: Partial<Form8_1Report>;
  onChange: (patch: Partial<Form8_1Report>) => void;
  jobId?: string;
  name?: string;
  inspectorName?: string;
};

export default function Main1_Report({ value, onChange, jobId, name, inspectorName }: Props) {
  const v = value || {};

  const [mainPreviewUrl, setMainPreviewUrl] = React.useState<string | undefined>(undefined);
  React.useEffect(() => () => {
    if (mainPreviewUrl?.startsWith("blob:")) URL.revokeObjectURL(mainPreviewUrl);
  }, [mainPreviewUrl]);

  const pickMainImage = (file: File | null) => {
    if (!file) return;
    if (mainPreviewUrl?.startsWith("blob:")) URL.revokeObjectURL(mainPreviewUrl);
    const { filename } = renameWithDateTime(file);
    const url = URL.createObjectURL(file);
    setMainPreviewUrl(url);
    onChange({
      headerImageUrl: filename,
      headerImageLocal: { file, preview: url, filename },
    });
  };

  const removeMainImage = () => {
    if (mainPreviewUrl?.startsWith("blob:")) URL.revokeObjectURL(mainPreviewUrl);
    setMainPreviewUrl(undefined);
    onChange({ headerImageUrl: "" });
  };

  // Draft fields to avoid updating parent on every keystroke
  const [draft, setDraft] = React.useState({
    year: v.year || "",
    signTitle: v.signTitle || "",
    companyName: v.companyName || "",
    companyAddress: v.companyAddress || "",
    legalBasisLine1: v.legalBasisLine1 || "",
    legalBasisLine2: v.legalBasisLine2 || "",
    headerNote: v.headerNote || "",
  });
  React.useEffect(() => {
    setDraft({
      year: v.year || "",
      signTitle: v.signTitle || "",
      companyName: v.companyName || "",
      companyAddress: v.companyAddress || "",
      legalBasisLine1: v.legalBasisLine1 || "",
      legalBasisLine2: v.legalBasisLine2 || "",
      headerNote: v.headerNote || "",
    });
  }, [v.year, v.signTitle, v.companyName, v.companyAddress, v.legalBasisLine1, v.legalBasisLine2, v.headerNote]);

  return (
    <section className="space-y-4">
      {/* ส่วนหัว/ชื่อรายงาน */}
      <div className="p-3 border rounded-lg bg-gray-50">
        <div className="text-center font-bold text-lg sm:text-xl">
          รายงานผลการตรวจสอบป้าย ปี <span className="text-red-600">{v.year || "..."}</span>
        </div>
        <div className="text-center text-sm text-gray-700 mt-1">{v.legalBasisLine1 || "รายงานผลการตรวจสอบป้ายประจำปี (บรรทัดที่ 1)"}</div>
        <div className="text-center text-sm text-gray-700">{v.legalBasisLine2 || "ตามระเบียบ/มาตรฐานที่เกี่ยวข้อง (บรรทัดที่ 2)"}</div>
        <div className="mt-2 text-center text-xs text-gray-500">
          งาน: {jobId || "-"} • อุปกรณ์: {name || "-"} • ผู้ตรวจ: {inspectorName || "-"}
        </div>
      </div>

      {/* ฟิลด์ส่วนหัว */}
      {/* ภาพหลัก (ย้ายขึ้นแสดงเหนือ ปี พ.ศ.) */}
      <div className="space-y-2">
        <div className="text-sm font-medium text-gray-700">ภาพหลัก</div>
        {(mainPreviewUrl || (v.headerImageUrl ? buildRemoteUrl(v.headerImageUrl) : undefined)) ? (
          <img src={(mainPreviewUrl || (v.headerImageUrl ? buildRemoteUrl(v.headerImageUrl) : "")) as string} alt="cover" className="w-full h-auto object-contain max-h-96 border rounded-lg" />
        ) : (
          <div className="w-full h-48 border rounded-lg flex items-center justify-center text-gray-400">ยังไม่มีภาพ</div>
        )}
        <div className="flex items-center gap-2">
          <label className="inline-block px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer">
            เลือกรูปภาพ
            <input type="file" accept="image/*" className="hidden" onChange={(e) => pickMainImage(e.target.files?.[0] || null)} />
          </label>
          {(mainPreviewUrl || v.headerImageUrl) ? (
            <button type="button" onClick={removeMainImage} className="px-3 py-2 rounded-lg border border-red-500 text-red-600 hover:bg-red-50">ลบรูป</button>
          ) : null}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">ปี พ.ศ.</label>
          <input className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none" placeholder="เช่น 2568" value={draft.year} onChange={(e) => setDraft((p) => ({ ...p, year: e.target.value }))} onBlur={(e) => onChange({ year: e.target.value })} />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">ชนิดการติดตั้ง (Installation)</label>
          <select className="w-full rounded-lg border border-gray-300 px-3 py-2" value={v.installType || ""} onChange={(e) => onChange({ installType: e.target.value as any })}>
            <option value="">- เลือกชนิดการติดตั้ง -</option>
            <option value="onGround">ติดตั้งบนพื้น</option>
            <option value="onRoofDeck">บนดาดฟ้า</option>
            <option value="onRoof">บนหลังคา</option>
            <option value="onFacadePart">บนส่วนหนึ่งของผนัง/อาคาร</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">ชื่อป้าย (ข้อความหลัก)</label>
          <input className="w-full rounded-lg border border-gray-300 px-3 py-2" placeholder="เช่น ป้ายบริษัท (KUBOTA)" value={draft.signTitle} onChange={(e) => setDraft((p) => ({ ...p, signTitle: e.target.value }))} onBlur={(e) => onChange({ signTitle: e.target.value })} />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">หน่วยงาน/บริษัท/เจ้าของ</label>
          <input className="w-full rounded-lg border border-gray-300 px-3 py-2" placeholder="เช่น บริษัท โปรไฟร์ อินสเปคเตอร์ จำกัด" value={draft.companyName} onChange={(e) => setDraft((p) => ({ ...p, companyName: e.target.value }))} onBlur={(e) => onChange({ companyName: e.target.value })} />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">ที่อยู่</label>
          <textarea className="w-full rounded-lg border border-gray-300 px-3 py-2 min-h-20" placeholder="เลขที่ หมู่ ตรอก/ซอย ถนน ตำบล/แขวง อำเภอ/เขต จังหวัด รหัสไปรษณีย์" value={draft.companyAddress} onChange={(e) => setDraft((p) => ({ ...p, companyAddress: e.target.value }))} onBlur={(e) => onChange({ companyAddress: e.target.value })} />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">บรรทัดใต้หัวเรื่อง 1</label>
          <textarea className="w-full rounded-lg border border-gray-300 px-3 py-2 min-h-14" placeholder="คำอธิบายบรรทัดที่ 1" value={draft.legalBasisLine1} onChange={(e) => setDraft((p) => ({ ...p, legalBasisLine1: e.target.value }))} onBlur={(e) => onChange({ legalBasisLine1: e.target.value })} />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">บรรทัดใต้หัวเรื่อง 2</label>
          <textarea className="w-full rounded-lg border border-gray-300 px-3 py-2 min-h-14" placeholder="คำอธิบายบรรทัดที่ 2" value={draft.legalBasisLine2} onChange={(e) => setDraft((p) => ({ ...p, legalBasisLine2: e.target.value }))} onBlur={(e) => onChange({ legalBasisLine2: e.target.value })} />
        </div>
      </div>

      {/* ภาพหลักและรายละเอียด */}
      <div className="space-y-3 hidden">
        <div className="space-y-3">
          {mainPreviewUrl || v.headerImageUrl ? (
            <img src={mainPreviewUrl || v.headerImageUrl} alt="ภาพหลัก" className="w-full h-auto object-contain max-h-96 border rounded-lg" />
          ) : (
            <div className="w-full h-48 border rounded-lg flex items-center justify-center text-gray-400">ยังไม่มีภาพ</div>
          )}
          <div className="flex items-center gap-2">
            <label className="inline-block px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer">
              เลือกรูปภาพ
              <input type="file" accept="image/*" className="hidden" onChange={(e) => pickMainImage(e.target.files?.[0] || null)} />
            </label>
            {(mainPreviewUrl || v.headerImageUrl) ? (
              <button type="button" onClick={removeMainImage} className="px-3 py-2 rounded-lg border border-red-500 text-red-600 hover:bg-red-50">ลบรูป</button>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">คำอธิบายประกอบภาพ/รายละเอียดส่วนหัว</label>
          <textarea className="w-full rounded-lg border border-gray-300 px-3 py-2 min-h-32" placeholder="รายละเอียดประกอบ เช่น โครงสร้าง/จุดติดตั้ง/บริบท ฯลฯ" value={draft.headerNote} onChange={(e) => setDraft((p) => ({ ...p, headerNote: e.target.value }))} onBlur={(e) => onChange({ headerNote: e.target.value })} />
        </div>
      </div>
    </section>
  );
}
