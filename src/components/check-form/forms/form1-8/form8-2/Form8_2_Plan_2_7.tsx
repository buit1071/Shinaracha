"use client";
import * as React from "react";
import type { Form8_1Plan, UsabilityStatus, SummaryRow, PlanUsability } from "./types";
import CheckTick from "./ui/CheckTickLocal";
import RemarkCell from "./ui/RemarkCellLocal";

type Props = {
  value?: Partial<Form8_1Plan>;
  onChange: (patch: Partial<Form8_1Plan>) => void;
};

const SUMMARY_GROUPS = [
  { key: "structural", name: "โครงสร้าง" },
  { key: "electrical", name: "ระบบไฟฟ้า" },
  { key: "lightning", name: "ระบบป้องกันฟ้าผ่า" },
  { key: "others", name: "ระบบ/อุปกรณ์อื่น ๆ" },
  { key: "advice", name: "สรุป/ข้อเสนอแนะ" },
] as const;

export default function Plan2_7_Summary({ value, onChange }: Props) {
  const plan = value || {};
  const v = plan.summaryPlan || {};

  const [draft, setDraft] = React.useState({
    extraNote: v.extraNote || "",
    signerName: v.signerName || "",
    signerPrinted: v.signerPrinted || "",
    signedDate: v.signedDate || "",
  });
  React.useEffect(() => {
    setDraft({
      extraNote: v.extraNote || "",
      signerName: v.signerName || "",
      signerPrinted: v.signerPrinted || "",
      signedDate: v.signedDate || "",
    });
  }, [v.extraNote, v.signerName, v.signerPrinted, v.signedDate]);

  const summarizeRound = React.useCallback((res: PlanUsability | undefined, key: string, round: 1 | 2): UsabilityStatus | undefined => {
    if (!res || !key) return undefined;
    const pick = (k: string) =>
      k === "structural" ? res.structural :
      k === "electrical" ? res.systems?.electrical :
      k === "lightning" ? res.systems?.lightning :
      k === "others" ? res.systems?.others : undefined;
    const rows = pick(key) || [];
    if (!Array.isArray(rows) || rows.length === 0) return undefined;
    let hasStatus = false;
    for (const r of rows) {
      const status = (round === 1 ? r.statusRound1 ?? r.status : r.statusRound2) as UsabilityStatus | undefined;
      if (!status) continue;
      hasStatus = true;
      if (status === "unusable") return "unusable";
    }
    return hasStatus ? "usable" : undefined;
  }, []);

  const rows: SummaryRow[] = React.useMemo(() => {
    const persisted = new Map<string, SummaryRow>();
    for (const r of (v.rows || []) as SummaryRow[]) {
      if ((r as any)?.name) persisted.set((r as any).name, r);
    }
    const out: SummaryRow[] = [];
    for (const g of SUMMARY_GROUPS) {
      if (g.key === "advice") {
        out.push(persisted.get(g.name) || ({ name: g.name } as SummaryRow));
        continue;
      }
      const statusRound1 = summarizeRound(plan.usabilityPlan as any, g.key as string, 1);
      const statusRound2 = summarizeRound(plan.usabilityPlan as any, g.key as string, 2);
      const base = persisted.get(g.name) || ({ name: g.name } as SummaryRow);
      out.push({
        ...base,
        statusRound1: base.statusRound1 ?? (base as any).status ?? statusRound1,
        statusRound2: base.statusRound2 ?? statusRound2,
      } as SummaryRow);
    }
    return out;
  }, [plan.usabilityPlan, summarizeRound, v.rows]);

  React.useEffect(() => {
    const curr = JSON.stringify(v.rows || []);
    const next = JSON.stringify(rows);
    if (curr !== next) onChange({ summaryPlan: { ...(v || {}), rows } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  const setRow = (idx: number, patch: Partial<SummaryRow>) => {
    const next = rows.map((r, i) => (i === idx ? ({ ...(r as any), ...(patch as any) } as any) : r));
    onChange({ summaryPlan: { ...(v || {}), rows: next } });
  };

  const renderRow = (r: SummaryRow, i: number) => {
    const toggle = (round: 1 | 2, st: UsabilityStatus) => {
      const key = round === 1 ? "statusRound1" : "statusRound2";
      const curr = (round === 1 ? r.statusRound1 ?? (r as any).status : r.statusRound2) as UsabilityStatus | undefined;
      const next = curr === st ? undefined : st;
      setRow(i, { [key]: next } as any);
    };
    return (
      <tr key={`row-${i}`} className="odd:bg-white even:bg-gray-50">
        <td className="border px-2 py-2 align-top">{(r as any).name}</td>
        <td className="border px-2 py-2 text-center">
          <CheckTick size="sm" className="m-0" checked={r.statusRound1 === "usable"} onChange={() => toggle(1, "usable")} />
        </td>
        <td className="border px-2 py-2 text-center">
          <CheckTick size="sm" className="m-0" checked={r.statusRound1 === "unusable"} onChange={() => toggle(1, "unusable")} />
        </td>
        <td className="border px-2 py-2 text-center">
          <CheckTick size="sm" className="m-0" checked={r.statusRound2 === "usable"} onChange={() => toggle(2, "usable")} />
        </td>
        <td className="border px-2 py-2 text-center">
          <CheckTick size="sm" className="m-0" checked={r.statusRound2 === "unusable"} onChange={() => toggle(2, "unusable")} />
        </td>
        <td className="border px-2 py-2 text-center">
          <CheckTick size="sm" className="m-0" checked={!!(r as any).fixed} onChange={() => setRow(i, { fixed: !((r as any).fixed) } as any)} label="แก้ไขแล้ว" />
        </td>
        <td className="border px-2 py-2">
          <RemarkCell note={(r as any).note} placeholder="หมายเหตุ (ถ้ามี)" onSave={(text) => setRow(i, { note: text } as any)} />
        </td>
      </tr>
    );
  };

  return (
    <section className="space-y-3">
      <div className="font-semibold">2.7 สรุป/ลงนาม</div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border tbl-strong vhead-compact table-fixed">
          <thead>
            <tr className="bg-gray-100 text-gray-700">
              <th className="border px-2 py-2" rowSpan={2}>หมวด</th>
              <th className="border px-2 py-2 text-center" colSpan={2}>รอบที่ 1</th>
              <th className="border px-2 py-2 text-center" colSpan={2}>รอบที่ 2</th>
              <th className="border px-2 py-2 text-center" rowSpan={2}>แก้ไขแล้ว</th>
              <th className="border px-2 py-2" rowSpan={2}>หมายเหตุ</th>
            </tr>
            <tr className="bg-gray-100 text-gray-700">
              <th className="border px-2 py-2 text-center">ใช้ได้</th>
              <th className="border px-2 py-2 text-center">ใช้ไม่ได้</th>
              <th className="border px-2 py-2 text-center">ใช้ได้</th>
              <th className="border px-2 py-2 text-center">ใช้ไม่ได้</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => renderRow(r as any, i))}
          </tbody>
        </table>
      </div>

      {/* หมายเหตุสรุป */}
      <div className="rounded border bg-white p-3 space-y-2">
        <div className="text-sm text-gray-700">หมายเหตุสรุป</div>
        <textarea
          className="w-full rounded border px-3 py-2 min-h-20"
          value={draft.extraNote}
          onChange={(e) => setDraft((p) => ({ ...p, extraNote: e.target.value }))}
          onBlur={(e) => onChange({ summaryPlan: { ...(v || {}), extraNote: e.target.value } })}
        />
      </div>

      {/* ลงนาม */}
      <div className="grid md:grid-cols-3 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm">ผู้ลงนาม</label>
          <input
            className="rounded border px-3 py-2"
            value={draft.signerName}
            onChange={(e) => setDraft((p) => ({ ...p, signerName: e.target.value }))}
            onBlur={(e) => onChange({ summaryPlan: { ...(v || {}), signerName: e.target.value } })}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm">(ตำแหน่ง)</label>
          <input
            className="rounded border px-3 py-2"
            value={draft.signerPrinted}
            onChange={(e) => setDraft((p) => ({ ...p, signerPrinted: e.target.value }))}
            onBlur={(e) => onChange({ summaryPlan: { ...(v || {}), signerPrinted: e.target.value } })}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm">วันที่ลงนาม</label>
          <input
            type="date"
            className="rounded border px-3 py-2"
            value={draft.signedDate}
            onChange={(e) => setDraft((p) => ({ ...p, signedDate: e.target.value }))}
            onBlur={(e) => onChange({ summaryPlan: { ...(v || {}), signedDate: e.target.value } })}
          />
        </div>
      </div>
    </section>
  );
}
