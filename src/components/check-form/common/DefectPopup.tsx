"use client";
import * as React from "react";
import Select from "react-select";
import { createPortal } from "react-dom";
import type { DefectItem } from "@/components/check-form/forms/form1-8/form8-1/types";
import NoteModal from "./NoteModal";
import { renameWithDateTime, uploadIfNeeded, buildRemoteUrl } from "@/components/check-form/forms/form1-8/form8-1/UploadUtils";

type Props = {
  open: boolean;
  title?: string;
  value?: DefectItem[];
  onChange: (next: DefectItem[]) => void;
  onAutoChange?: (next: DefectItem[]) => void;
  onClose: () => void;
};

export default function DefectPopup({ open, title = "บันทึก Defect", value = [], onChange, onAutoChange, onClose }: Props) {
  const [items, setItems] = React.useState<DefectItem[]>([]);
  const [noteIndex, setNoteIndex] = React.useState<number | null>(null);
  const [noteDraft, setNoteDraft] = React.useState("");
  const [options, setOptions] = React.useState<{ value: string; label: string; suggestion?: string }[]>([]);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const overlayRef = React.useRef<HTMLDivElement | null>(null);
  const closeBtnRef = React.useRef<HTMLButtonElement | null>(null);
  const [menuPortalEl, setMenuPortalEl] = React.useState<HTMLElement | null>(null);

  React.useEffect(() => {
    if (open) setItems(value.map((v) => ({ ...v })));
  }, [open, value]);

  React.useEffect(() => {
    if (!open) return;
    setMenuPortalEl(containerRef.current);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  React.useEffect(() => {
    if (!open) return;
    let ignore = false;
    const load = async () => {
      try {
        const res = await fetch('/api/auth/legal-regulations/get', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ function: 'defect' }) });
        const data = await res.json();
        if (!ignore && data?.success) {
          const opts = (data.data || []).map((d: any) => ({ value: String(d.id), label: d.defect as string, suggestion: d.illegal_suggestion as (string|undefined) }));
          setOptions(opts);
        }
      } catch { /* ignore */ }
    };
    void load();
    return () => {
      ignore = true;
    };
  }, [open]);

  const addItem = () => setItems((prev) => { const n = [...prev, { defectName: "", note: "" } as DefectItem]; onAutoChange?.(n); return n; });
  const removeItem = (idx: number) => setItems((prev) => { const n = prev.filter((_, i) => i !== idx); onAutoChange?.(n); return n; });
  const setField = (idx: number, patch: Partial<DefectItem>) =>
    setItems((prev) => {
      const n = [...prev];
      while (n.length <= idx) n.push({ defectName: "", note: "" } as DefectItem);
      n[idx] = { ...(n[idx] || {}), ...(patch as any) } as any;
      onAutoChange?.(n);
      return n;
    });

  const openNote = (idx: number) => { setNoteIndex(idx); setNoteDraft(items[idx]?.note || ""); };
  const saveNote = () => { if (noteIndex == null) return; setField(noteIndex, { note: noteDraft }); setNoteIndex(null); };

  if (!open) return null;
  const expanded = Boolean((items[0] as any)?.isOther || (items[0]?.defectId && String(items[0]?.defectId).length > 0) || items.length > 0);
  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 grid place-items-center bg-black/30"
      onMouseDown={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden" ref={containerRef}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
          <h3 className="font-semibold text-gray-900">{title}</h3>
        </div>
        <div className="p-4 space-y-3">
          {/* Minimal first: select problems */}
          <div className="mb-4 rounded-lg border p-4 bg-white">
            <div className="text-base font-semibold mb-2">Defect</div>
            {/* เลือกหลายปัญหา */}
            <div className="mb-3">
              <label className="block text-sm text-gray-700 mb-1">เลือกหลายปัญหา</label>
              <Select
                isMulti
                classNamePrefix="sel"
                placeholder="พิมพ์เพื่อค้นหาปัญหา..."
                options={options}
                value={(items[0]?.defectId ? options.filter(o => String(items[0]?.defectId).split(',').includes(o.value)) : []) as any}
                onChange={(sel: readonly any[], _meta: any) => {
                  const arr = Array.isArray(sel) ? sel : ([] as any[]);
                  const ids = arr.map((s:any)=>s.value).join(',');
                  const name = arr.map((s:any)=>s.label).join(', ');
                  setField(0,{ defectId: ids as any, defectName: name });
                }}
                closeMenuOnSelect={false}
                menuPortalTarget={menuPortalEl ?? (typeof window !== 'undefined' ? document.body : null)}
                menuShouldBlockScroll
                menuPosition="fixed" closeMenuOnScroll={false} styles={{ menuPortal: (base: any) => ({ ...base, zIndex: 22000 }) }}
              />
            </div>
            {/* ปัญหาอื่น */}
            <div className="mb-3">
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={!!(items[0] as any)?.isOther} onChange={(e)=> setField(0,{ isOther: e.target.checked } as any)} />
                ปัญหาอื่น
              </label>
              {(items[0] as any)?.isOther && (
                <input className="mt-2 w-full rounded border border-gray-300 px-2 py-1" placeholder="โปรดระบุรายละเอียด" value={items[0]?.defectName || ''} onChange={(e)=> setField(0, { defectName: e.target.value })} />
              )}
            </div>

            {expanded && (
              <>
                <div className="mt-4 mb-3">
                  <label className="block text-sm text-gray-700 mb-1">หมายเหตุเพิ่มเติม</label>
                  <textarea className="w-full h-28 rounded border border-gray-300 p-3" value={items[0]?.note || ''} onChange={(e)=> setField(0,{ note: e.target.value })} />
                </div>
                {/* รูปภาพ */}
                <div className="mb-1">
                  <div className="text-sm text-gray-700 mb-2">รูปภาพ (≤2)</div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {(items[0]?.photos || []).map((p,pi)=> (
                      <img key={pi} src={p.src && p.src.startsWith('http') ? p.src : (p.filename ? buildRemoteUrl(p.filename) : '')} alt="ph" className="h-16 w-16 object-cover rounded border" />
                    ))}
                    {((items[0]?.photos?.length||0) < 2) && (
                      <label className="px-3 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer inline-flex items-center gap-1">
                        + เพิ่ม
                        <input type="file" accept="image/*" className="hidden" onChange={async (e)=>{
                          const file = e.target.files?.[0]; if(!file) return;
                          const { filename } = renameWithDateTime(file);
                          const url = URL.createObjectURL(file);
                          try { await uploadIfNeeded(url, filename); } catch {}
                          const arr = [...(items[0]?.photos || [])]; if (arr.length>=2) return; arr.push({ filename });
                          setField(0,{ photos: arr });
                          e.currentTarget.value='';
                        }} />
                      </label>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {expanded && (items.length === 0 ? (
            <div className="text-gray-500">ยังไม่ได้เลือก defect</div>
          ) : (
            <table className="w-full text-sm table-fixed">
              <thead>
                <tr className="bg-gray-100 text-gray-700">
                  <th className="w-10 px-2 py-2 text-center">#</th>
                  <th className="px-2 py-2 text-left">ชื่อปัญหา</th>
                  <th className="w-28 px-2 py-2 text-center">รูป (≤2)</th>
                  <th className="w-24 px-2 py-2 text-center">หมายเหตุ</th>
                  <th className="w-16 px-2 py-2 text-center">ลบ</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => (
                  <tr key={idx} className={idx % 2 ? "bg-gray-50" : "bg-white"}>
                    <td className="px-2 py-2 text-center align-middle">{idx + 1}</td>
                    <td className="px-2 py-2 align-middle">
                      <Select
                        classNamePrefix="sel"
                        placeholder="เลือก defect..."
                        options={[...options, { value: 'other', label: 'อื่น ๆ (ระบุ)' }]}
                        value={(it.defectId ? options.find(o => o.value === String(it.defectId)) : undefined) || (it.defectName && it.defectId==='other' ? { value:'other', label:'อื่น ๆ (ระบุ)' } as any : null)}
                        onChange={(opt: any) => {
                          if (!opt) return setField(idx, { defectId: null, defectName: undefined, suggestion: undefined });
                          if (opt.value === 'other') {
                            setField(idx, { defectId: 'other', defectName: it.defectName ?? '' });
                            return;
                          }
                          setField(idx, { defectId: opt.value, defectName: opt.label, suggestion: opt.suggestion });
                        }}
                        isClearable
                        menuPortalTarget={menuPortalEl ?? (typeof window !== 'undefined' ? document.body : null)}
                        menuPosition="fixed"
                        closeMenuOnScroll={false}
                        menuShouldBlockScroll
                      />
                      {it.defectId === 'other' && (
                        <input className="mt-2 w-full rounded border border-gray-300 px-2 py-1" placeholder="โปรดระบุรายละเอียด" value={it.defectName || ''} onChange={(e)=> setField(idx, { defectName: e.target.value })} />
                      )}
                      {it.suggestion && <div className="mt-1 text-xs text-gray-500">ข้อเสนอแนะ: {it.suggestion}</div>}
                    </td>
                    <td className="px-2 py-2 align-middle">
                      <div className="flex items-center gap-2 flex-wrap">
                        {(it.photos || []).map((p, pi) => (
                          <img key={pi} src={p.src && p.src.startsWith('http') ? p.src : (p.filename ? buildRemoteUrl(p.filename) : '')} alt="ph" className="h-10 w-10 object-cover rounded border" />
                        ))}
                        <label className="px-2 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer inline-flex items-center gap-1">
                          + เพิ่ม
                          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={async (e) => {
                            const file = e.target.files?.[0]; if (!file) return;
                            const { filename } = renameWithDateTime(file);
                            const url = URL.createObjectURL(file);
                            try { await uploadIfNeeded(url, filename); } catch { /* ignore here */ }
                            const next = [...(it.photos || [])];
                            if (next.length >= 2) return;
                            next.push({ filename, src: url } as any);
                            setField(idx, { photos: next });
                            e.currentTarget.value = '';
                          }} />
                        </label>
                      </div>
                    </td>
                    <td className="px-2 py-2 text-center align-middle">
                      <button
                        type="button"
                        className="px-2 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
                        onClick={() => openNote(idx)}
                      >หมายเหตุ</button>
                    </td>
                    <td className="px-2 py-2 text-center align-middle">
                      <button
                        type="button"
                        className="px-2 py-1 rounded bg-rose-600 text-white hover:bg-rose-700"
                        onClick={() => removeItem(idx)}
                      >ลบ</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ))}

          {expanded && (
            <div>
              <button type="button" onClick={addItem} className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100">
                + เพิ่มรายการ
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t bg-gray-50">
          {items.length === 0 && <div className="mr-auto pl-1 text-sm text-rose-600">กรุณาเลือกปัญหาอย่างน้อย 1 รายการ</div>}
          <button type="button" onClick={() => onChange(items)} disabled={items.length === 0} className="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">บันทึก</button>
        </div>
      </div>

      <NoteModal open={noteIndex != null} value={noteDraft} onChange={setNoteDraft} onCancel={() => setNoteIndex(null)} onSave={saveNote} />
    </div>
  , document.body);
}









