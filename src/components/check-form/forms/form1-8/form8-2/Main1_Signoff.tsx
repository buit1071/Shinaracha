"use client";
import * as React from "react";
import type { Form8_1Signoff } from "./types";

type Props = {
  value?: Partial<Form8_1Signoff>;
  onChange: (patch: Partial<Form8_1Signoff>) => void;
};

export default function Main1_Signoff({ value, onChange }: Props) {
  const v = value || {};
  const set = (patch: Partial<Form8_1Signoff>) => onChange(patch);
  return (
    <section className="space-y-4">
      <div className="text-base font-semibold">สรุปผล/ลงนาม (Signoff)</div>

      <div className="flex flex-wrap items-center gap-4">
        <span className="text-sm text-gray-700">สรุปผล:</span>
        <label className="inline-flex items-center gap-2">
          <input type="radio" name="conclusion" checked={v.overallConclusion === "none"} onChange={() => set({ overallConclusion: "none" })} />
          ไม่มีข้อสรุป
        </label>
        <label className="inline-flex items-center gap-2">
          <input type="radio" name="conclusion" checked={v.overallConclusion === "minor"} onChange={() => set({ overallConclusion: "minor" })} />
          Minor
        </label>
        <label className="inline-flex items-center gap-2">
          <input type="radio" name="conclusion" checked={v.overallConclusion === "major"} onChange={() => set({ overallConclusion: "major" })} />
          Major
        </label>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm">ผู้ตรวจ</label>
          <input className="rounded border px-3 py-2" value={v.inspectorName || ""} onChange={(e) => set({ inspectorName: e.target.value })} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm">วันที่ตรวจ</label>
          <input type="date" className="rounded border px-3 py-2" value={v.inspectionDate || ""} onChange={(e) => set({ inspectionDate: e.target.value })} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm">เจ้าของ/ผู้ครอบครอง</label>
          <input className="rounded border px-3 py-2" value={v.ownerOrRepresentative || ""} onChange={(e) => set({ ownerOrRepresentative: e.target.value })} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm">ผู้ลงนาม (ตัวหนังสือ)</label>
          <input className="rounded border px-3 py-2" value={v.signature || ""} onChange={(e) => set({ signature: e.target.value })} />
        </div>
      </div>

      {v.overallConclusion === "minor" && (
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-blue-800">หมายเหตุ (Minor)</label>
          <textarea className="rounded border px-3 py-2 min-h-20" value={v.minorRemark || ""} onChange={(e) => set({ minorRemark: e.target.value })} />
        </div>
      )}
      {v.overallConclusion === "major" && (
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-red-700">สิ่งที่ต้องแก้ไข (Major)</label>
          <textarea className="rounded border px-3 py-2 min-h-20" value={v.fixIssueSubject || ""} onChange={(e) => set({ fixIssueSubject: e.target.value })} />
        </div>
      )}
    </section>
  );
}


