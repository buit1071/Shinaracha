"use client";

import * as React from "react";
import CompanyHeader from "@/components/check-form/forms/form1-3/CompanyHeader";
import { F1_9_GROUPS } from "./f1_9.config";
import F1_9_TEXT from "./f1_9.text";
import { exportToDocxF1_9 } from "@/utils/exportToDocxF1_9";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { showLoading } from "@/lib/loading";
import { showAlert } from "@/lib/fetcher";

type Props = {
  jobId: string;
  equipment_id: string;
  name: string;
  onBack: () => void;
};

type FreqKey = "1m" | "4m" | "6m" | "1y" | "3y";
type FreqRowState = { freq?: FreqKey; note?: string };

type FormData = {
  id?: number | null;
  form_code?: string;
  placeName?: string;
  general?: { scope?: string };
  frequency?: Record<string, FreqRowState>;
  meta?: {
    inspectorName?: string;
    licenseNo?: string;
    issuer?: string;
    company?: string;
    address?: string;
    licIssue?: { d?: string; m?: string; y?: string };
    licExpire?: { d?: string; m?: string; y?: string };
  };
};

const DottedInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className = "", ...props }) => (
  <input
    {...props}
    className={[
      "bg-transparent text-gray-900 placeholder-gray-400",
      "border-0 border-b border-dashed border-black/40",
      "focus:outline-none focus:ring-0 px-1",
      className,
    ].join(" ")}
  />
);

const RadioTick: React.FC<{ name: string; checked: boolean; onChange: () => void }> = ({ name, checked, onChange }) => (
  <button
    type="button"
    onClick={onChange}
    className={[
      "h-5 w-5 rounded-[4px] border grid place-items-center",
      checked ? "bg-red-600 border-red-600" : "bg-white border-gray-400",
      "cursor-pointer focus:outline-none",
    ].join(" ")}
    aria-pressed={checked}
  >
    <span className={["text-white text-[14px] leading-none", checked ? "opacity-100" : "opacity-0"].join(" ")}>✓</span>
  </button>
);

export default function Form1_9({ jobId, equipment_id, name, onBack }: Props) {
  const user = useCurrentUser();
  const username = React.useMemo(() => (user ? `${user.first_name_th} ${user.last_name_th}` : ""), [user]);

  const [formData, setFormData] = React.useState<FormData>({});
  const [openSections, setOpenSections] = React.useState<string[]>(["section1", "section2", "section3", "section4", "section5"]);

  const toggle = (id: string) => {
    setOpenSections((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const setFreqRow = (rowId: string, patch: FreqRowState) => {
    setFormData((prev) => ({
      ...prev,
      frequency: { ...(prev.frequency ?? {}), [rowId]: { ...(prev.frequency?.[rowId] ?? {}), ...patch } },
    }));
  };

  const fecthFormDetail = async () => {
    showLoading(true);
    try {
      const res = await fetch("/api/auth/forms/get", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ function: "form1_9", job_id: jobId, equipment_id }),
      });
      const data = await res.json();
      if (data.success && data.data?.form_data) {
        const form = typeof data.data.form_data === "string" ? JSON.parse(data.data.form_data) : data.data.form_data;
        setFormData((prev) => ({
          ...prev,
          id: data.data.id ?? null,
          form_code: data.data.form_code ?? "",
          ...form,
          general: form.general ?? {},
          frequency: form.frequency ?? {},
          meta: form.meta ?? {},
        }));
      }
    } catch (err) {
    } finally {
      showLoading(false);
    }
  };

  React.useEffect(() => {
    if (!jobId) return;
    fecthFormDetail();
  }, [jobId, equipment_id]);

  const handleSave = async () => {
    showLoading(true);
    try {
      const payload = {
        entity: "form1_9",
        data: {
          ...formData,
          job_id: jobId,
          equipment_id,
          is_active: 1,
          created_by: username,
          updated_by: username,
        },
      } as any;

      const res = await fetch("/api/auth/forms/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      showLoading(false);
      if (res.ok && data.success) {
        await showAlert("success", data.message ?? "บันทึกสำเร็จ");
        if (data.form_code && !formData.form_code) {
          setFormData((prev) => ({ ...prev, form_code: data.form_code }));
        }
        onBack();
      } else {
        showAlert("error", data.message ?? "บันทึกล้มเหลว");
      }
    } catch (err: any) {
      showLoading(false);
      showAlert("error", err?.message ?? "เกิดข้อผิดพลาดระหว่างบันทึก");
    }
  };

  const td = "border border-gray-300 px-2 py-2 text-gray-900";
  const th = "border border-gray-300 px-3 py-2 text-gray-700";

  return (
    <div className="p-2">
      <div className="w-full h-[5vh] grid place-items-center relative">
        <span className="text-black md:text-3xl font-bold tracking-wide">แบบฟอร์ม F9</span>
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <button
            type="button"
            onClick={() => exportToDocxF1_9(F1_9_GROUPS, { placeName: formData.placeName ?? name, frequency: formData.frequency }, { s1: F1_9_TEXT.s1, s2: F1_9_TEXT.s2, s3: F1_9_TEXT.s3 })}
            className="px-3 py-1 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-sm shadow cursor-pointer"
            title="Export เป็น Word"
          >
            Export
          </button>
        </div>
      </div>

      {/* Company Header */}
      <CompanyHeader companyTh="บริษัท ชินาราชา โปรเทคเตอร์ จำกัด" companyEn="Shinaracha Protector Co., Ltd." logoUrl="/images/NewLOGOSF.webp" />

      <hr className="my-6" />

      {/* สถานที่/อาคาร */}
      <div className="pt-2 text-center">
        <div className="text-xl text-gray-700 mb-2">ชื่อสถานที่/อาคาร</div>
        <input
          value={formData.placeName ?? name}
          onChange={(e) => setFormData((prev) => ({ ...prev, placeName: e.target.value }))}
          placeholder="ใส่ชื่อสถานที่/อาคาร"
          className="w-full max-w-[640px] mx-auto text-center text-2xl md:text-3xl font-medium border-b outline-none focus:border-gray-800 transition px-2 pb-2 text-black caret-black"
        />
      </div>

      <hr className="my-6" />

      {/* ส่วนที่ 1: ขอบเขตของการตรวจสอบ */}
      <section className="w-full mb-3">
        <button type="button" onClick={() => toggle("section1")} aria-expanded={openSections.includes("section1")} className="w-full grid h-[5vh] select-none cursor-pointer">
          <span className="flex items-center justify-between gap-2 text-black md:text-xl font-bold tracking-wide rounded-xl bg-white px-4 py-2 border shadow-md hover:shadow-lg">
            ส่วนที่ 1 ขอบเขตของการตรวจสอบ
            <svg className={`w-4 h-4 transition-transform ${openSections.includes("section1") ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" />
            </svg>
          </span>
        </button>
        <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${openSections.includes("section1") ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
          <div className="overflow-hidden">
            <div className="pt-2">
              <div className="text-sm leading-7 space-y-2">
                {F1_9_TEXT.s1.map((t, i) => (
                  <p key={`s1-${i}`}>{t}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ส่วนที่ 2: แผนการตรวจสอบป้ายและอุปกรณ์ประกอบของป้าย */}
      <section className="w-full mb-3">
        <button type="button" onClick={() => toggle("section2")} aria-expanded={openSections.includes("section2")} className="w-full grid h-[5vh] select-none cursor-pointer">
          <span className="flex items-center justify-between gap-2 text-black md:text-xl font-bold tracking-wide rounded-xl bg-white px-4 py-2 border shadow-md hover:shadow-lg">
            ส่วนที่ 2 แผนการตรวจสอบป้ายและอุปกรณ์ประกอบของป้าย
            <svg className={`w-4 h-4 transition-transform ${openSections.includes("section2") ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" />
            </svg>
          </span>
        </button>
        <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${openSections.includes("section2") ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
          <div className="overflow-hidden">
            <div className="pt-2 text-gray-800 leading-7 space-y-2 px-2">
              {F1_9_TEXT.s2.map((t, i) => (
                <p key={`s2-${i}`}>{t}</p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ส่วนที่ 3: แนวทางการตรวจสอบป้ายและอุปกรณ์ประกอบของป้ายประจำปี */}
      <section className="w-full mb-3">
        <button type="button" onClick={() => toggle("section3")} aria-expanded={openSections.includes("section3")} className="w-full grid h-[5vh] select-none cursor-pointer">
          <span className="flex items-center justify-between gap-2 text-black md:text-xl font-bold tracking-wide rounded-xl bg-white px-4 py-2 border shadow-md hover:shadow-lg">
            ส่วนที่ 3 แนวทางการตรวจสอบป้ายและอุปกรณ์ประกอบของป้ายประจำปี
            <svg className={`w-4 h-4 transition-transform ${openSections.includes("section3") ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" />
            </svg>
          </span>
        </button>
        <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${openSections.includes("section3") ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
          <div className="overflow-hidden">
            <div className="pt-2 text-gray-800 leading-7 space-y-2 px-2">
              {F1_9_TEXT.s3.map((t, i) => (
                <p key={`s3-${i}`}>{t}</p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ส่วนที่ 4: ตารางความถี่การตรวจบำรุงรักษา */}
      <section className="w-full mb-3">
        <button type="button" onClick={() => toggle("section4")} aria-expanded={openSections.includes("section4")} className="w-full grid h-[5vh] select-none cursor-pointer">
          <span className="flex items-center justify-between gap-2 text-black md:text-xl font-bold tracking-wide rounded-xl bg-white px-4 py-2 border shadow-md hover:shadow-lg">
            ส่วนที่ 4 ตารางความถี่การตรวจบำรุงรักษา
            <svg className={`w-4 h-4 transition-transform ${openSections.includes("section4") ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" />
            </svg>
          </span>
        </button>
        <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${openSections.includes("section4") ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
          <div className="overflow-hidden">
            <div className="pt-2 space-y-6">
              {F1_9_GROUPS.map((g) => (
                <div key={g.id} className="border border-gray-300 rounded-md overflow-hidden">
                  <div className="bg-gray-100 font-semibold text-center py-2">{g.title}</div>
                  <table className="w-full text-sm bg-white">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className={`${th} w-16 text-center`}>ลำดับ</th>
                        <th className={`${th} text-left`}>รายการตรวจบำรุงรักษา</th>
                        <th className={`${th} w-20 text-center`}>1 เดือน</th>
                        <th className={`${th} w-20 text-center`}>4 เดือน</th>
                        <th className={`${th} w-20 text-center`}>6 เดือน</th>
                        <th className={`${th} w-20 text-center`}>1 ปี</th>
                        <th className={`${th} w-20 text-center`}>3 ปี</th>
                        <th className={`${th} w-64 text-center`}>หมายเหตุ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {g.rows.map((r, idx) => {
                        const id = r.id;
                        const st = formData.frequency?.[id] ?? {};
                        const name = `freq-${id}`;
                        const set = (fk: FreqKey) => setFreqRow(id, { freq: st.freq === fk ? undefined : fk });
                        return (
                          <tr key={id} className="odd:bg-white even:bg-gray-50">
                            <td className={`${td} text-center`}>{idx + 1}</td>
                            <td className={td}>{r.label}</td>
                            <td className={`${td} text-center`}><RadioTick name={name} checked={st.freq === "1m"} onChange={() => set("1m")} /></td>
                            <td className={`${td} text-center`}><RadioTick name={name} checked={st.freq === "4m"} onChange={() => set("4m")} /></td>
                            <td className={`${td} text-center`}><RadioTick name={name} checked={st.freq === "6m"} onChange={() => set("6m")} /></td>
                            <td className={`${td} text-center`}><RadioTick name={name} checked={st.freq === "1y"} onChange={() => set("1y")} /></td>
                            <td className={`${td} text-center`}><RadioTick name={name} checked={st.freq === "3y"} onChange={() => set("3y")} /></td>
                            <td className={td}>
                              <DottedInput className="w-full" placeholder="หมายเหตุ (ถ้ามี)" value={st.note ?? ""} onChange={(e) => setFreqRow(id, { note: e.target.value })} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
            {/* หมายเหตุใต้ส่วนที่ 4 */}
            <div className="text-xs text-gray-600 mt-3 px-2">
              <div>หมายเหตุ: ความถี่การตรวจบำรุงรักษาควรกำหนดให้เหมาะสมตามสภาพการใช้งานจริง</div>
              <div>ตัวอย่าง: ทุก 4 เดือน = 3 ครั้ง/ปี (เดือน 4, 8, 12), ทุก 6 เดือน = 2 ครั้ง/ปี (เดือน 6, 12), ทุก 12 เดือน = 1 ครั้ง/ปี (เดือน 12)</div>
            </div>
          </div>
        </div>
      </section>

      {/* ส่วนที่ 5: ผู้ตรวจ/ใบอนุญาต/หน่วยงาน */}
      <section className="w-full mb-6">
        <button type="button" onClick={() => toggle("section5")} aria-expanded={openSections.includes("section5")} className="w-full grid h-[5vh] select-none cursor-pointer">
          <span className="flex items-center justify-between gap-2 text-black md:text-xl font-bold tracking-wide rounded-xl bg-white px-4 py-2 border shadow-md hover:shadow-lg">
            ส่วนที่ 5 หมายเหตุและข้อมูลผู้ตรวจ
            <svg className={`w-4 h-4 transition-transform ${openSections.includes("section5") ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" />
            </svg>
          </span>
        </button>
        <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${openSections.includes("section5") ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
          <div className="overflow-hidden">
            <div className="pt-2 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="flex items-center gap-2">
                  <span className="w-40 text-gray-700">ผู้ตรวจ</span>
                  <DottedInput className="flex-1" value={formData.meta?.inspectorName ?? ""} onChange={(e) => setFormData((p) => ({ ...p, meta: { ...(p.meta ?? {}), inspectorName: e.target.value } }))} />
                </label>
                <label className="flex items-center gap-2">
                  <span className="w-40 text-gray-700">เลขที่ใบอนุญาต</span>
                  <DottedInput className="flex-1" value={formData.meta?.licenseNo ?? ""} onChange={(e) => setFormData((p) => ({ ...p, meta: { ...(p.meta ?? {}), licenseNo: e.target.value } }))} />
                </label>
                <label className="flex items-center gap-2">
                  <span className="w-40 text-gray-700">ผู้ออก</span>
                  <DottedInput className="flex-1" value={formData.meta?.issuer ?? ""} onChange={(e) => setFormData((p) => ({ ...p, meta: { ...(p.meta ?? {}), issuer: e.target.value } }))} />
                </label>
                <label className="flex items-center gap-2">
                  <span className="w-40 text-gray-700">บริษัท</span>
                  <DottedInput className="flex-1" value={formData.meta?.company ?? ""} onChange={(e) => setFormData((p) => ({ ...p, meta: { ...(p.meta ?? {}), company: e.target.value } }))} />
                </label>
                <label className="flex items-center gap-2 md:col-span-2">
                  <span className="w-40 text-gray-700">ที่อยู่</span>
                  <DottedInput className="flex-1" value={formData.meta?.address ?? ""} onChange={(e) => setFormData((p) => ({ ...p, meta: { ...(p.meta ?? {}), address: e.target.value } }))} />
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-40 text-gray-700">วันออกใบอนุญาต</span>
                  <DottedInput className="w-14 text-center" placeholder="วัน" value={formData.meta?.licIssue?.d ?? ""} onChange={(e) => setFormData((p) => ({ ...p, meta: { ...(p.meta ?? {}), licIssue: { ...(p.meta?.licIssue ?? {}), d: e.target.value } } }))} />
                  <DottedInput className="w-24 text-center" placeholder="เดือน" value={formData.meta?.licIssue?.m ?? ""} onChange={(e) => setFormData((p) => ({ ...p, meta: { ...(p.meta ?? {}), licIssue: { ...(p.meta?.licIssue ?? {}), m: e.target.value } } }))} />
                  <DottedInput className="w-20 text-center" placeholder="ปี" value={formData.meta?.licIssue?.y ?? ""} onChange={(e) => setFormData((p) => ({ ...p, meta: { ...(p.meta ?? {}), licIssue: { ...(p.meta?.licIssue ?? {}), y: e.target.value } } }))} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-40 text-gray-700">วันหมดอายุ</span>
                  <DottedInput className="w-14 text-center" placeholder="วัน" value={formData.meta?.licExpire?.d ?? ""} onChange={(e) => setFormData((p) => ({ ...p, meta: { ...(p.meta ?? {}), licExpire: { ...(p.meta?.licExpire ?? {}), d: e.target.value } } }))} />
                  <DottedInput className="w-24 text-center" placeholder="เดือน" value={formData.meta?.licExpire?.m ?? ""} onChange={(e) => setFormData((p) => ({ ...p, meta: { ...(p.meta ?? {}), licExpire: { ...(p.meta?.licExpire ?? {}), m: e.target.value } } }))} />
                  <DottedInput className="w-20 text-center" placeholder="ปี" value={formData.meta?.licExpire?.y ?? ""} onChange={(e) => setFormData((p) => ({ ...p, meta: { ...(p.meta ?? {}), licExpire: { ...(p.meta?.licExpire ?? {}), y: e.target.value } } }))} />
                </div>
              </div>

              <div className="flex">
                <button
                  type="button"
                  onClick={handleSave}
                  className="ml-auto inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 font-medium text-white shadow-sm transition-colors hover:bg-sky-500 active:bg-sky-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
                >
                  บันทึก
                </button>
              </div>
              <pre className="bg-gray-100 p-3 rounded-md text-sm overflow-x-auto text-black">{JSON.stringify(formData, null, 2)}</pre>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
