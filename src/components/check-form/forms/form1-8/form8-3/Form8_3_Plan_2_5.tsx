"use client";
import * as React from "react";
import type { Form8_1Plan, FrequencyValue, PlanFrequency } from "./types";
import RemarkCell from "./ui/RemarkCellLocal";
import CheckTick from "./ui/CheckTickLocal";

type Props = {
  value?: Partial<Form8_1Plan>;
  onChange: (patch: Partial<Form8_1Plan>) => void;
};

const FREQ: FrequencyValue[] = ["1m", "4m", "6m", "1y", "3y"];
const FREQ_LABEL: Record<FrequencyValue, string> = {
  "1m": "1 เดือน",
  "4m": "4 เดือน",
  "6m": "6 เดือน",
  "1y": "1 ปี",
  "3y": "3 ปี",
};

const STRUCTURAL_ROWS = [
  "การต่อเติม ดัดแปลง ปรับปรุงขนาดของ ป้ายหรือสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย",
  "การเปลี่ยนแปลงน้ำหนักของแผ่นป้าย",
  "การเปลี่ยนแปลงสภาพการใช้งานของป้าย",
  "การเปลี่ยนแปลงวัสดุของป้าย หรือสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย",
  "การชำรุดสึกหรอของป้าย หรือสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย",
  "การวิบัติของป้าย หรือสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย",
  "ความมั่นคงแข็งแรงของโครงสร้างและฐานรากของสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย (กรณีป้ายที่ติดตั้งบนพื้นดิน)",
  "ความมั่นคงแข็งแรงของอาคารที่ติดตั้งป้าย (กรณีป้ายบนหลังคา หรือบนดาดฟ้าอาคาร หรือบนส่วนหนึ่งส่วนใดของอาคาร)",
  "การเชื่อมยึดระหว่างแผ่นป้ายกับสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย การเชื่อมยึดระหว่างชิ้นส่วนต่าง ๆ ของสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย และการเชื่อมยึดระหว่างสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้ายกับฐานรากหรืออาคาร",
];

const SYS_ELECTRICAL = [
  "สภาพสายไฟฟ้า",
  "สภาพท่อร้อยสาย รางเดินสายและรางเคเบิล",
  "สภาพเครื่องป้องกันกระแสเกิน",
  "สภาพเครื่องตัดไฟรั่ว",
  "การต่อลงดินของบริภัณฑ์ ตัวนำต่อลงดินและความต่อเนื่องลงดินของท่อร้อยสาย รางเดินสาย รางเคเบิล",
];

const SYS_LIGHTNING = [
  "ตรวจสอบระบบตัวนำล่อฟ้าตัวนำต่อลงดิน",
  "ตรวจสอบระบบรากสายดิน",
  "ตรวจสอบจุดต่อประสานศักย์",
];

const SYS_OTHERS = [
  "สลิง และสายยึด",
  "สภาพบันไดขึ้นลง",
  "สภาพราวตับ หรือราวกันตก",
  "สภาพ CATWALK",
  "อื่นๆโปรดระบุ",
];

export default function Plan2_5_Frequency({ value, onChange }: Props) {
  const plan = value || {};
  const mergeRows = React.useCallback(
    (seeds: string[], existing?: { name?: string; frequency?: FrequencyValue; note?: string }[]) =>
      seeds.map((name, idx) => {
        const prev = Array.isArray(existing) ? existing[idx] || {} : {};
        return { name, frequency: prev.frequency, note: prev.note };
      }),
    []
  );
  const freq = React.useMemo<PlanFrequency>(() => ({
    structural: mergeRows(STRUCTURAL_ROWS, plan.frequencyPlan?.structural),
    systems: {
      electrical: mergeRows(SYS_ELECTRICAL, plan.frequencyPlan?.systems?.electrical),
      lightning: mergeRows(SYS_LIGHTNING, plan.frequencyPlan?.systems?.lightning),
      others: mergeRows(SYS_OTHERS, plan.frequencyPlan?.systems?.others),
    },
  }), [mergeRows, plan.frequencyPlan]);

  const groupId = React.useId();
  const [nameDrafts, setNameDrafts] = React.useState<Record<string, string>>({});
  const getDraftName = (key: string, fallback?: string) => nameDrafts[key] ?? fallback ?? "";

  const setRow = (
    group: "structural" | "electrical" | "lightning" | "others",
    idx: number,
    patch: Partial<{ name: string; frequency?: FrequencyValue; note?: string }>
  ) => {
    const next: PlanFrequency = {
      structural: freq.structural,
      systems: {
        electrical: freq.systems?.electrical,
        lightning: freq.systems?.lightning,
        others: freq.systems?.others,
      },
    };
    const pick = (g: string) =>
      g === "structural"
        ? (next.structural = [...(freq.structural || [])])
        : g === "electrical"
        ? (next.systems!.electrical = [...(freq.systems?.electrical || [])])
        : g === "lightning"
        ? (next.systems!.lightning = [...(freq.systems?.lightning || [])])
        : (next.systems!.others = [...(freq.systems?.others || [])]);
    const rows = pick(group)! as any[];
    rows[idx] = { ...rows[idx], ...(patch as any) } as any;
    const keepY = typeof window !== "undefined" ? window.scrollY : 0;
    onChange({ frequencyPlan: next });
    if (typeof window !== "undefined") { requestAnimationFrame(() => window.scrollTo(0, keepY)); }
  };

  const Plan25Row = React.memo(function Plan25Row({ group, r, i }: { group: "structural" | "electrical" | "lightning" | "others"; r: { name: string; frequency?: FrequencyValue; note?: string }; i: number }) {
    const nameIsOther = group === "others" && i === ((freq.systems?.others || []).length - 1);
    const rowName = `${groupId}-${group}-${i}`;
    const draftKey = `${group}-${i}`;
    return (
      <tr className="odd:bg-white even:bg-gray-50">
        <td className="border px-2 py-2 align-top h-10 align-middle">
          {nameIsOther ? (
            <div className="flex items-center gap-2">
              <span>อื่นๆโปรดระบุ</span>
              <input
                className="flex-1 rounded border border-gray-300 px-2 py-1 h-9 focus:outline-none"
                value={getDraftName(draftKey, (r.name === "อื่นๆ" || r.name === "อื่นๆโปรดระบุ") ? "" : r.name)}
                onChange={(e) => setNameDrafts((p) => ({ ...p, [draftKey]: e.target.value }))}
                onBlur={(e) => setRow(group, i, { name: e.target.value || "อื่นๆโปรดระบุ" })}
                placeholder="ระบุรายการ"
              />
            </div>
          ) : (
            r.name
          )}
        </td>
        {FREQ.map((f) => (
          <td key={f} className="border px-3 py-2 text-center h-10 align-middle">
            <CheckTick
              size="sm"
              checked={r.frequency === f}
              onChange={() => setRow(group, i, { frequency: r.frequency === f ? (undefined as any) : f })}
              label={FREQ_LABEL[f]}
            />
          </td>
        ))}
        <td className="border px-2 py-2 h-10 align-middle">
          <RemarkCell note={r.note} onSave={(text) => setRow(group, i, { note: text })} />
        </td>
      </tr>
    );
  }, (a, b) => a.r.name === b.r.name && a.r.frequency === b.r.frequency && a.r.note === b.r.note);

  return (
    <section className="space-y-4">
      <div className="font-semibold">2.5 ความถี่</div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border tbl-strong vhead-compact table-fixed">
          <thead>
            <tr className="bg-gray-100 text-gray-700">
              <th className="border px-2 py-2" rowSpan={2}>รายการ</th>
              <th className="border px-3 py-2 text-center" colSpan={5}>ความถี่</th>
              <th className="border px-2 py-2" rowSpan={2}>หมายเหตุ</th>
            </tr>
            <tr className="bg-gray-100 text-gray-700">
              {FREQ.map((f) => (
                <th key={f} className="border px-3 py-2 text-center">{FREQ_LABEL[f]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border px-2 py-2 bg-gray-100 font-medium" colSpan={7}>โครงสร้าง</td>
            </tr>
            {(freq.structural || []).map((r, i) => (
              <Plan25Row key={`structural-${i}`} group="structural" r={r as any} i={i} />
            ))}

            <tr>
              <td className="border px-2 py-2 bg-gray-100 font-medium" colSpan={7}>ระบบไฟฟ้า</td>
            </tr>
            {(freq.systems?.electrical || []).map((r, i) => (
              <Plan25Row key={`electrical-${i}`} group="electrical" r={r as any} i={i} />
            ))}

            <tr>
              <td className="border px-2 py-2 bg-gray-100 font-medium" colSpan={7}>ระบบกันฟ้าผ่า (ถ้ามี)</td>
            </tr>
            {(freq.systems?.lightning || []).map((r, i) => (
              <Plan25Row key={`lightning-${i}`} group="lightning" r={r as any} i={i} />
            ))}

            <tr>
              <td className="border px-2 py-2 bg-gray-100 font-medium" colSpan={7}>ระบบอุปกรณ์ประกอบอื่น ๆ (ถ้ามี)</td>
            </tr>
            {(freq.systems?.others || []).map((r, i) => (
              <Plan25Row key={`others-${i}`} group="others" r={r as any} i={i} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
