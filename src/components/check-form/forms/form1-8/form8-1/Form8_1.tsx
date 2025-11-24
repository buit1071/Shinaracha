"use client";

import * as React from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { showLoading } from "@/lib/loading";
import { showAlert } from "@/lib/fetcher";

import type { Form8_1Data } from "./types";
import { defaultForm8_1 } from "./types";
import { exportToExcelForm8_1 } from "@/utils/exportToExcelForm8_1";
import ExportPptxButton from "./ExportPptxButton";

// Main 1.x sections
import Form8_1_Report_1_0 from "./Form8_1_Report_1_0";
import Form8_1_Report_1_1 from "./Form8_1_Report_1_1";
import Form8_1_Report_1_2 from "./Form8_1_Report_1_2";
import Form8_1_Report_1_3 from "./Form8_1_Report_1_3";
import Main1_Inspect from "./Main1_Inspect";
import Form8_1_Report_1_4 from "./Form8_1_Report_1_4";

// Plan 2.x sections
import Form8_1_Plan_2_1 from "./Form8_1_Plan_2_1";
import Form8_1_Plan_2_2 from "./Form8_1_Plan_2_2";
import Form8_1_Plan_2_3 from "./Form8_1_Plan_2_3";
import Form8_1_Plan_2_4 from "./Form8_1_Plan_2_4";
import Form8_1_Plan_2_5 from "./Form8_1_Plan_2_5";
import Form8_1_Plan_2_6 from "./Form8_1_Plan_2_6";
import Form8_1_Plan_2_7 from "./Form8_1_Plan_2_7";
import { uploadIfNeeded } from "./UploadUtils";
import DefectPopup from "@/components/check-form/common/DefectPopup";
import type { DefectItem } from "./types";

type Props = {
  jobId: string;
  equipment_id: string;
  name: string;
  onBack: () => void;
};

export default function Form8_1({ jobId, equipment_id, name, onBack }: Props) {
  const user = useCurrentUser();
  const username = React.useMemo(
    () => (user ? `${user.first_name_th} ${user.last_name_th}` : ""),
    [user]
  );

  const [formData, setFormData] = React.useState<Form8_1Data>(defaultForm8_1);
  const [openSections, setOpenSections] = React.useState<string[]>([]);
  // main group toggles (1.x and 2.x)
  const [openMain, setOpenMain] = React.useState<string[]>([]);

  // Seed summary rows (match .bak intentions)
  const SUMMARY_ROWS_SEED = React.useMemo(
    () => [
      { id: 1, title: "โครงสร้าง/ฐานราก/ยึดตรึง" },
      { id: 2, title: "ป้าย/พื้นผิว/สี/ตัวอักษร" },
      { id: 3, title: "ระบบไฟฟ้าแสงสว่างและระบบไฟฟ้ากำลัง" },
      { id: 4, title: "ระบบสายล่อฟ้า (ถ้ามี)" },
      { id: 5, title: "ทางเดิน/บันได/ทางขึ้น" },
    ],
    []
  );

  const ensureSummaryRows = React.useCallback(
    (f: Form8_1Data): Form8_1Data => {
      const current = f.summary?.rows || [];
      const map = new Map<number, any>();
      for (const r of current) map.set(r.id, r);
      const rows = SUMMARY_ROWS_SEED.map((s) => {
        const existed = map.get(s.id) || {};
        return { id: s.id, title: s.title, result: existed.result || "", note: existed.note || "" } as any;
      });
      return { ...f, summary: { ...(f.summary || {}), rows } };
    },
    [SUMMARY_ROWS_SEED]
  );
  const toggle = (id: string) => {
    setOpenSections((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleMain = (key: string) => {
    setOpenMain((prev) =>
      prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]
    );
  };

  // Helper: normalize plan keys/values (old -> new)
  const normalizePlan = (plan: any) => {
    if (!plan || typeof plan !== "object") return plan;
    const out: any = { ...plan };
    // rename text fields 2.1–2.4
    if (out.scopeNote && !out.scopeOfWork) out.scopeOfWork = out.scopeNote;
    if (out.planOutline && !out.planDescription) out.planDescription = out.planOutline;
    if (out.details && !out.inspectionDetails) out.inspectionDetails = out.details;
    if (out.guideline && !out.guidelineStandard) out.guidelineStandard = out.guideline;
    // 2.5 row field freq -> frequency
    const fixFreqRows = (rows?: any[]) => Array.isArray(rows) ? rows.map((r) => ({ ...r, frequency: r?.frequency ?? r?.freq })) : rows;
    if (out.frequencyPlan) {
      out.frequencyPlan = {
        structural: fixFreqRows(out.frequencyPlan.structural),
        systems: out.frequencyPlan.systems ? {
          electrical: fixFreqRows(out.frequencyPlan.systems.electrical),
          lightning: fixFreqRows(out.frequencyPlan.systems.lightning),
          others: fixFreqRows(out.frequencyPlan.systems.others),
        } : undefined,
      };
    }
    // 2.6 resultsPlan -> usabilityPlan, status map
    const mapStatus = (st?: string) => st === "found" ? "unusable" : st === "not_found" ? "usable" : st;
    const fixUsabilityRows = (rows?: any[]) => Array.isArray(rows) ? rows.map((r) => ({ ...r, status: mapStatus(r?.status) })) : rows;
    const srcRes = out.usabilityPlan || out.resultsPlan;
    if (srcRes) {
      out.usabilityPlan = {
        structural: fixUsabilityRows(srcRes.structural),
        systems: srcRes.systems ? {
          electrical: fixUsabilityRows(srcRes.systems.electrical),
          lightning: fixUsabilityRows(srcRes.systems.lightning),
          others: fixUsabilityRows(srcRes.systems.others),
        } : undefined,
      };
    }
    // 2.7 summaryPlan status map
    if (out.summaryPlan?.rows) {
      out.summaryPlan = {
        ...out.summaryPlan,
        rows: out.summaryPlan.rows.map((r: any) => ({ ...r, status: mapStatus(r?.status) })),
      };
    }
    return out;
  };

  const normalizeData = (data: any) => {
    if (!data) return data;
    const out: any = { ...data };
    if (out.plan) out.plan = normalizePlan(out.plan);
    return out;
  };

  // Load existing data
  React.useEffect(() => {
    let ignore = false;
    const load = async () => {
      showLoading(true);
      try {
        const res = await fetch("/api/auth/forms/get", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ function: "form8_1", job_id: jobId, equipment_id }),
        });
        const data = await res.json();
        if (!ignore && data?.success) {
          const raw = data.data?.form_data;
          const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
          const normalized = normalizeData(parsed);
          const fc = data.data?.form_code as string | undefined;
          const dbId = data.data?.id as number | undefined;
          setFormData((prev) => ensureSummaryRows({ ...prev, ...(normalized || {}), ...(fc ? { form_code: fc } : {}), ...(dbId ? { dbId } : {}) }));
        }
      } catch {
      } finally {
        showLoading(false);
      }
    };
    load();
    return () => {
      ignore = true;
    };
  }, [jobId, equipment_id, ensureSummaryRows]);

  React.useEffect(() => { setFormData((p) => ensureSummaryRows(p)); }, [ensureSummaryRows]);

  // Patch helpers
  const setReport = React.useCallback((patch: Partial<Form8_1Data["report"]>) =>
    setFormData((p) => ({ ...p, report: { ...(p.report || {}), ...patch } })), []);

  const setGeneral = React.useCallback((patch: Partial<Form8_1Data["general"]>) =>
    setFormData((p) => ({ ...p, general: { ...(p.general || {}), ...patch } })), []);

  const setLocation = React.useCallback((patch: Partial<Form8_1Data["location"]> = {}) =>
    setFormData((p) => ({
      ...p,
      location: {
        ...(p.location || {}),
        ...patch,
        coordinate: (patch as any).coordinate
          ? { ...(p.location?.coordinate || {}), ...(patch as any).coordinate }
          : p.location?.coordinate,
      },
    })), []);

  const setPhotos = React.useCallback((patch: Partial<Form8_1Data["photos"]>) =>
    setFormData((p) => ({
      ...p,
      photos: { ...(p.photos || { gallery: [] }), ...patch },
    })), []);

  const setTypeAndOwner = React.useCallback((patch: Partial<Form8_1Data["typeAndOwner"]> = {}) =>
    setFormData((p) => ({
      ...p,
      typeAndOwner: {
        ...(p.typeAndOwner || {}),
        categories: patch.categories ?? p.typeAndOwner?.categories ?? [],
        ...patch,
      },
    })), []);

  const setMaterials = React.useCallback((patch: Partial<Form8_1Data["materials"]> = {}) =>
    setFormData((p) => ({
      ...p,
      materials: {
        ...(p.materials || {}),
        structureKinds: patch.structureKinds ?? p.materials?.structureKinds ?? [],
        ...patch,
      },
    })), []);

  const setInspect = React.useCallback((patch: Partial<Form8_1Data["inspect"]> = {}) =>
    setFormData((p) => ({
      ...p,
      inspect: {
        ...(p.inspect || { items: {} }),
        ...patch,
        items: (patch as any).items
          ? { ...(p.inspect?.items || {}), ...(patch as any).items }
          : (p.inspect?.items || {}),
      },
    })), []);

  const setSummary = React.useCallback((patch: Partial<Form8_1Data["summary"]>) =>
    setFormData((p) => ({ ...p, summary: { ...(p.summary || {}), ...patch } })), []);

  const setSignoff = React.useCallback((patch: Partial<Form8_1Data["signoff"]>) =>
    setFormData((p) => ({ ...p, signoff: { ...(p.signoff || {}), ...patch } })), []);

  const setPlan = React.useCallback((patch: Partial<Form8_1Data["plan"]> = {}) =>
    setFormData((p) => ({
      ...p,
      plan: {
        ...(p.plan || {}),
        ...patch,
        frequencyPlan: (patch as any).frequencyPlan || (p.plan as any)?.frequencyPlan,
        usabilityPlan: (patch as any).usabilityPlan || (patch as any).resultsPlan || (p.plan as any)?.usabilityPlan || (p.plan as any)?.resultsPlan,
        summaryPlan: (patch as any).summaryPlan || (p.plan as any)?.summaryPlan,
      },
    })), []);

  // Lifted popup state for 2.6 Defects
  const [defectDialog, setDefectDialog] = React.useState<{
    group: 'structural'|'electrical'|'lightning'|'others';
    index: number;
    items: DefectItem[];
  } | null>(null);

  const openDefectDialog = React.useCallback((args: { group: 'structural'|'electrical'|'lightning'|'others'; index: number; items: DefectItem[] }) => {
    setDefectDialog({ ...args });
  }, []);

  const applyDefectsToPlan = React.useCallback((group: 'structural'|'electrical'|'lightning'|'others', index: number, next: DefectItem[]) => {
    setFormData((prev) => {
      const planAny: any = prev.plan || {};
      const up = planAny.usabilityPlan || {};
      const clone: any = {
        structural: Array.isArray(up.structural) ? [...up.structural] : [],
        systems: {
          electrical: Array.isArray(up.systems?.electrical) ? [...up.systems.electrical] : [],
          lightning: Array.isArray(up.systems?.lightning) ? [...up.systems.lightning] : [],
          others: Array.isArray(up.systems?.others) ? [...up.systems.others] : [],
        },
      };
      const pick = (g: 'structural'|'electrical'|'lightning'|'others') => g === 'structural' ? clone.structural : clone.systems[g];
      const arr = pick(group);
      arr[index] = { ...(arr[index] || {}), defects: next } as any;
      return { ...prev, plan: { ...planAny, usabilityPlan: clone } } as Form8_1Data;
    });
  }, []);

  const handleSave = async () => {
    showLoading(true);
    try {
      // Pre-save pass: อัปโหลดรูป defect (ถ้ายังเป็น blob:/data:) และ clean ให้เหลือเฉพาะ filename
      try {
        const planAny: any = formData.plan || {};
        const up = planAny.usabilityPlan || {};
        const groups = [up.structural, up.systems?.electrical, up.systems?.lightning, up.systems?.others].filter(Boolean) as any[];
        for (const arr of groups) {
          for (const r of arr) {
            if (!Array.isArray(r?.defects)) continue;
            const newDefs: any[] = [];
            for (const d of r.defects) {
              const photos = Array.isArray(d?.photos) ? d.photos : [];
              const newPhotos: any[] = [];
              for (const p of photos) {
                if (p?.src && (typeof p.src === 'string') && (p.src.startsWith('blob:') || p.src.startsWith('data:image'))) {
                  try { await uploadIfNeeded(p.src, p.filename); } catch { /* ignore */ }
                }
                if (p?.filename) newPhotos.push({ filename: p.filename });
              }
              newDefs.push({ ...d, photos: newPhotos });
            }
            r.defects = newDefs;
          }
        }
      } catch { /* ignore pre-upload errors here; UI จะเก็บเป็น filename หากสำเร็จ */ }

      // Pre-save pass: อัปโหลดรูป 1.2 (แผนที่/ผัง + รูปประกอบ) หากยังเป็น blob:/data:
      try {
        const photosAny: any = formData.photos || {};
        const locAny: any = formData.location || {};
        // ไม่มี preview ใน state รวม จึงพยายามอัปโหลดจากชื่อไฟล์ที่เพิ่งเลือกใน UI (Main1_Photos/Pick จะอัปโหลดทันทีแล้ว)
        // ส่วนนี้ทำหน้าที่ clean ให้เหลือ filename เฉย ๆ เพื่อความสม่ำเสมอ
        if (locAny.mapImageFilename) {
          // nothing to do: Pick ฝั่ง 1.2 จะอัปโหลดทันทีแล้ว
        }
        if (locAny.layoutImageFilename) {
          // nothing to do
        }
        const cleanPhoto = (p?: any) => (p?.url ? { url: p.url } : undefined);
        const cover = cleanPhoto(photosAny.coverPhoto);
        const sign = cleanPhoto(photosAny.signMainPhoto);
        const setA = Array.isArray(photosAny.setAPhotos) ? photosAny.setAPhotos.map((x: any) => cleanPhoto(x)).filter(Boolean) : undefined;
        const setB = Array.isArray(photosAny.setBPhotos) ? photosAny.setBPhotos.map((x: any) => cleanPhoto(x)).filter(Boolean) : undefined;
        setFormData((p) => ({
          ...p,
          location: { ...(p.location || {}), mapImageFilename: locAny.mapImageFilename, layoutImageFilename: locAny.layoutImageFilename },
          photos: { ...(p.photos || {}), coverPhoto: cover, signMainPhoto: sign, setAPhotos: setA, setBPhotos: setB },
        }));
      } catch { /* ignore */ }
      // Validate: ถ้า 2.6 มีแถวที่สถานะ 'unusable' ต้องมี defects ≥ 1
      const up = (formData.plan as any)?.usabilityPlan as any;
      const groups = [up?.structural, up?.systems?.electrical, up?.systems?.lightning, up?.systems?.others].filter(Boolean) as any[];
      for (const arr of groups) {
        for (const r of arr) {
          if (r?.status === 'unusable' && (!Array.isArray(r?.defects) || r.defects.length === 0)) {
            showLoading(false);
            await showAlert('error', 'กรุณาระบุ Defect อย่างน้อย 1 รายการสำหรับแถวที่ "ใช้ไม่ได้" ในส่วนที่ 2.6');
            return;
          }
        }
      }
      const payload: any = {
        entity: "form8_1",
        data: {
          ...formData,
          job_id: jobId,
          equipment_id,
          is_active: 1,
          created_by: username || "unknown",
          updated_by: username || "unknown",
        },
      };
      if (formData.form_code) payload.data.form_code = formData.form_code;

      const res = await fetch("/api/auth/forms/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      showLoading(false);
      if (res.ok && data?.success) {
        if (data.form_code && !formData.form_code) {
          setFormData((prev) => ({ ...prev, form_code: data.form_code }));
        }
        await showAlert("success", data.message || "บันทึกสำเร็จ");
        onBack();
      } else {
        await showAlert("error", data?.message || "บันทึกล้มเหลว");
      }
    } catch (e: any) {
      showLoading(false);
      await showAlert("error", e?.message || "เกิดข้อผิดพลาดระหว่างบันทึก");
    }
  };

        const Section = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => {
    const SECTION_TITLES_TH: Record<string, string> = {
      report: `รายงานผลการตรวจสอบป้าย ปี ${formData.report?.year ?? ""}`,
      general: "ส่วนที่ 1 ขอบเขตของการตรวจสอบป้าย",
      info: "ส่วนที่ 2 ข้อมูลทั่วไปของป้าย",
      inspect: "ส่วนที่ 3 ผลการตรวจสอบสภาพป้ายและอุปกรณ์ประกอบของป้าย",
      summary: "ส่วนที่ 4 สรุปผลการตรวจสอบป้าย",
      "plan-2-1": "ส่วนที่ 1 ขอบเขตของการตรวจบำรุงรักษาป้าย และอุปกรณ์ประกอบของป้าย",
      "plan-2-2": "ส่วนที่ 2 แผนปฏิบัติการการตรวจบำรุงรักษาป้ายและอุปกรณ์ประกอบของป้าย",
      "plan-2-3": "ส่วนที่ 3 รายละเอียดที่ต้องตรวจบำรุงรักษาป้าย และอุปกรณ์ประกอบของป้าย",
      "plan-2-4": "ส่วนที่ 4 แนวทางการตรวจบำรุงรักษาป้าย และอุปกรณ์ประกอบของป้ายประจำปี",
      "plan-2-5": "ส่วนที่ 5 ช่วงเวลา และความถี่ในการตรวจบำรุงรักษาป้าย และอุปกรณ์ประกอบของป้าย",
      "plan-2-6": "ส่วนที่ 6 ผลการตรวจสภาพป้าย และอุปกรณ์ประกอบของป้าย",
      "plan-2-7": "ส่วนที่ 7 สรุปผลการตรวจบำรุงรักษาป้ายและอุปกรณ์ประกอบของป้าย",
    };
    const displayTitle = SECTION_TITLES_TH[id] ?? title;
    return (
      <section className="w-full mb-3">
        <button
          type="button"
          onClick={() => toggle(id)}
          aria-expanded={openSections.includes(id)}
          className="w-full grid h-[5vh] select-none cursor-pointer"
        >
          <span className="flex items-center justify-between gap-2 text-black md:text-xl font-bold tracking-wide rounded-xl bg-white px-4 py-2 border shadow-md hover:shadow-lg">
            {displayTitle}
            <svg className={`w-4 h-4 transition-transform ${openSections.includes(id) ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" />
            </svg>
          </span>
        </button>
        <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${openSections.includes(id) ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
          <div className="overflow-hidden no-anchor"><div className="pt-2">{children}</div></div>
        </div>
      </section>
    );
  };

  return (
    <div className="p-2 no-anchor">
      {/* Action bar: Export Defect (Excel) */}
      <div className="w-full flex justify-end mb-2">
        <button
          type="button"
          onClick={() => exportToExcelForm8_1(formData.plan ?? null, formData.dbId ?? null, jobId ?? "")}
          className="mr-2 w-[120px] h-10 bg-green-600 hover:bg-green-700 active:bg-green-700 text-white rounded-[5px] inline-flex items-center justify-center gap-2 shadow-md cursor-pointer"
        >
          <img src="/images/IconExcel.webp" alt="Excel" className="h-5 w-5 object-contain" />
          <span className="leading-none">Defect</span>
        </button>
        <ExportPptxButton
          data={formData}
          className="w-[120px] h-10 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-700 text-white rounded-[5px] inline-flex items-center justify-center gap-2 shadow-md cursor-pointer"
          label={(
            <span className="inline-flex items-center gap-2">
              <img src="/images/IconPowerPoint.png" alt="PPTX" className="h-5 w-5 object-contain" />
              <span className="leading-none">PPTX</span>
            </span>
          ) as any}
        />
      </div>
      <style jsx>{`
        .no-anchor { overflow-anchor: none; }
        table.tbl-strong { border-collapse: collapse; border: 2px solid #374151; }
        table.tbl-strong th, table.tbl-strong td { border: 1px solid #9CA3AF; }
        table.tbl-strong thead th { background: #F3F4F6; }
        .vhead { writing-mode: vertical-rl; text-orientation: mixed; transform: rotate(180deg); white-space: nowrap; }
        table.tbl-strong.vhead-compact thead tr:nth-child(2) th { writing-mode: vertical-rl; text-orientation: mixed; transform: rotate(180deg); white-space: nowrap; }
      `}</style>
      {/* Header (move Save to bottom like form3.1) */}
      <div className="h-[6vh] flex items-center px-4 py-2 bg-white shadow-md mb-2 rounded-lg">
        <h2 className="text-xl font-bold text-blue-900">{name}</h2>
      </div>

      {/* Sections: Main 1.x */}
      <div className="w-full shadow-sm border bg-white text-black p-2">
        {/* กลุ่มใหญ่: 1) รายงานผลการตรวจสอบป้าย */}
        <section className="border-2 border-gray-200 rounded-2xl overflow-hidden bg-white mb-5">
          <button type="button" className="w-full flex items-center justify-between px-4 py-3 bg-gray-100 hover:bg-gray-200" onClick={() => toggleMain("main-1")}>
            <span className="font-semibold text-gray-800">1) รายงานผลการตรวจสอบป้าย ปี {formData.report?.year ?? ""}</span>
            <span className="text-sm text-gray-500" />
          </button>
          <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${openMain.includes("main-1") ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
            <div className="overflow-hidden"><div className="p-2">
              <Section id="report" title={`รายงานผลการตรวจสอบป้าย ปี ${formData.report?.year ?? ""}`}>
                <Form8_1_Report_1_0 value={formData.report} onChange={setReport} jobId={jobId} name={name} inspectorName={username} />
              </Section>
              <Section id="general" title="ส่วนที่ 1 ขอบเขตของการตรวจสอบป้าย">
                <Form8_1_Report_1_1 value={formData.report} onChange={setReport} />
              </Section>
              <Section id="info" title="ส่วนที่ 2 ข้อมูลทั่วไปของป้าย">
                <Form8_1_Report_1_2
                  general={formData.general}
                  location={formData.location}
                  photos={formData.photos}
                  typeAndOwner={formData.typeAndOwner}
                  materials={formData.materials}
                  installType={formData.report?.installType}
                  onChangeGeneral={setGeneral}
                  onChangeLocation={setLocation}
                  onChangePhotos={setPhotos}
                  onChangeTypeAndOwner={setTypeAndOwner}
                  onChangeMaterials={setMaterials}
                  onChangeInstallType={(installType) => setReport({ installType })}
                />
              </Section>
              <Section id="inspect" title="ส่วนที่ 3 ผลการตรวจสอบสภาพป้ายและอุปกรณ์ประกอบของป้าย">
                <Form8_1_Report_1_3 installType={formData.report?.installType} value={formData.inspect} onChange={setInspect} />
                <div className="mt-4" />
                <Main1_Inspect installType={formData.report?.installType} value={formData.inspect} onChange={setInspect} />
              </Section>
              <Section id="summary" title="ส่วนที่ 4 สรุปผลการตรวจสอบป้าย">
                <Form8_1_Report_1_4 general={formData.general} summary={formData.summary} signoff={formData.signoff} onChangeSummary={setSummary} onChangeSignoff={setSignoff} />
              </Section>
            </div></div>
          </div>
        </section>

        {/* กลุ่มใหญ่: 2) แผนปฏิบัติการการตรวจบำรุงรักษาป้าย */}
        <section className="border-2 border-gray-200 rounded-2xl overflow-hidden bg-white">
          <button type="button" className="w-full flex items-center justify-between px-4 py-3 bg-gray-100 hover:bg-gray-200" onClick={() => toggleMain("main-2")}>
            <span className="font-semibold text-gray-800">2) แผนปฏิบัติการการตรวจบำรุงรักษาป้าย และอุปกรณ์ประกอบของป้าย และคู่มือปฏิบัติการตามแผน</span>
            <span className="text-sm text-gray-500" />
          </button>
          <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${openMain.includes("main-2") ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
            <div className="overflow-hidden"><div className="p-2">
              <Section id="plan-2-1" title="ส่วนที่ 1 ขอบเขตของการตรวจบำรุงรักษาป้าย และอุปกรณ์ประกอบของป้าย">
                <Form8_1_Plan_2_1 value={formData.plan} />
              </Section>
              <Section id="plan-2-2" title="ส่วนที่ 2 แผนปฏิบัติการการตรวจบำรุงรักษาป้ายและอุปกรณ์ประกอบของป้าย">
                <Form8_1_Plan_2_2 value={formData.plan} />
              </Section>
              <Section id="plan-2-3" title="ส่วนที่ 3 รายละเอียดที่ต้องตรวจบำรุงรักษาป้าย และอุปกรณ์ประกอบของป้าย">
                <Form8_1_Plan_2_3 value={formData.plan} />
              </Section>
              <Section id="plan-2-4" title="ส่วนที่ 4 แนวทางการตรวจบำรุงรักษาป้าย และอุปกรณ์ประกอบของป้ายประจำปี">
                <Form8_1_Plan_2_4 value={formData.plan} />
              </Section>
              <Section id="plan-2-5" title="ส่วนที่ 5 ช่วงเวลา และความถี่ในการตรวจบำรุงรักษาป้าย และอุปกรณ์ประกอบของป้าย">
                <Form8_1_Plan_2_5 value={formData.plan} onChange={setPlan} />
              </Section>
              <Section id="plan-2-6" title="ส่วนที่ 6 ผลการตรวจสภาพป้าย และอุปกรณ์ประกอบของป้าย">
                <Form8_1_Plan_2_6 value={formData.plan} onChange={setPlan} onOpenDefect={openDefectDialog} />
              </Section>
              <Section id="plan-2-7" title="ส่วนที่ 7 สรุปผลการตรวจบำรุงรักษาป้ายและอุปกรณ์ประกอบของป้าย">
                <Form8_1_Plan_2_7 value={formData.plan} onChange={setPlan} />
              </Section>
            </div></div>
          </div>
        </section>
      </div>

      {/* Bottom sticky Save bar */}
      <div className="sticky bottom-0 z-10 bg-white border-t px-3 py-2 flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 font-medium text-white shadow-sm transition-colors hover:bg-sky-500 active:bg-sky-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2"
        >
          บันทึก
        </button>
      </div>

      {/* Debug preview (disabled to prevent layout shift while interacting) */}
      {false && (
        <pre className="bg-gray-100 p-3 rounded-md text-sm overflow-x-auto text-black mt-3">
          {JSON.stringify(formData, null, 2)}
        </pre>
      )}
      {defectDialog && (
        <DefectPopup
          open={true}
          value={defectDialog.items}
          onClose={() => setDefectDialog(null)}
          onAutoChange={(next) => applyDefectsToPlan(defectDialog.group, defectDialog.index, next)}
          onChange={(next) => { applyDefectsToPlan(defectDialog.group, defectDialog.index, next); setDefectDialog(null); }}
        />
      )}
    </div>
  );
}

