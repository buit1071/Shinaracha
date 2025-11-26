"use client";
import * as React from "react";

type Props = {
  open: boolean;
  title?: string;
  value: string;
  onChange: (text: string) => void;
  onCancel: () => void;
  onSave: () => void;
};

// Modal สำหรับแก้ไขหมายเหตุ — Local สำหรับ Form8_1
export default function NoteModalLocal({ open, title = "แก้ไขหมายเหตุ", value, onChange, onCancel, onSave }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40">
      <div className="w-full max-w-xl sm:max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <button aria-label="ปิด" onClick={onCancel} className="rounded-md p-1 text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300">×</button>
        </div>
        <div className="p-4 sm:p-6">
          <textarea
            placeholder="พิมพ์หมายเหตุ..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full min-h-56 border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <div className="flex items-center justify-end gap-2 px-4 sm:px-6 py-3 border-t bg-gray-50">
          <button onClick={onCancel} className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100">ยกเลิก</button>
          <button onClick={onSave} className="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">บันทึก</button>
        </div>
      </div>
    </div>
  );
}



