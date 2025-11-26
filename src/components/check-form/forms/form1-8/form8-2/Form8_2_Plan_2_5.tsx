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
  "โครงสร้างหลัก/ฐานราก/เสา/คาน แผ่นพื้น ความมั่นคงแข็งแรง",
  "จุดยึดโยง/การยึดกับโครง",
  "โครงคร่าว/วัสดุรองรับแผ่นป้าย",
  "การยึดกับอาคาร/ผนัง/หลังคา ความแข็งแรง",
  "การกัดกร่อน/สนิมของชิ้นส่วนโลหะ",
  "การเสื่อมสภาพของวัสดุหลัก",
  "ทางเดิน/จุดบริการสำหรับซ่อมบำรุง (ถ้ามี)",
  "บันได/นั่งร้าน/ราวกันตก (ถ้ามี) ความปลอดภัย",
  "ความปลอดภัยโดยรวมของโครงสร้างตามมาตรฐานที่เกี่ยวข้อง",
];

const SYS_ELECTRICAL = [
  "ระบบไฟฟ้าแสงสว่างป้าย",
  "สายไฟ/ท่อร้อยสาย/รางสาย/อุปกรณ์ยึด",
  "อุปกรณ์ป้องกันไฟฟ้าเกิน/ตัดตอน",
  "การต่อสายดิน",
  "การเดินสาย/การป้องกันความชื้น ความเรียบร้อย",
];

const SYS_LIGHTNING = [
  "ระบบป้องกันฟ้าผ่าบนป้าย",
  "การต่อเชื่อมลงดิน",
  "ระยะห่างความปลอดภัย",
];

const SYS_OTHERS = [
  "ป้าย/วัสดุกราฟิก",
  "โครง/เหล็กประกอบ",
  "ระบบกั้นเขต/ป้องกันการเข้าถึง",
  "CATWALK/ทางเดิน",
  "อื่น ๆ (ระบุ)",
];

export default function Plan2_5_Frequency({ value, onChange }: Props) {
  const plan = value || {};
  const freq = React.useMemo<PlanFrequency>(() => ({
    structural: plan.frequencyPlan?.structural || STRUCTURAL_ROWS.map((name) => ({ name })),
    systems: {
      electrical: plan.frequencyPlan?.systems?.electrical || SYS_ELECTRICAL.map((name) => ({ name })),
      lightning: plan.frequencyPlan?.systems?.lightning || SYS_LIGHTNING.map((name) => ({ name })),
      others: plan.frequencyPlan?.systems?.others || SYS_OTHERS.map((name) => ({ name })),
    },
  }), [plan.frequencyPlan]);

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
    const keepY = typeof window !== 'undefined' ? window.scrollY : 0;
    onChange({ frequencyPlan: next });
    if (typeof window !== 'undefined') { requestAnimationFrame(() => window.scrollTo(0, keepY)); }
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
              <span>อื่น ๆ (ระบุ)</span>
              <input
                className="flex-1 rounded border border-gray-300 px-2 py-1 h-9 focus:outline-none"
                value={getDraftName(draftKey, (r.name === "อื่น ๆ" || r.name === "อื่น ๆ (ระบุ)") ? "" : r.name)}
                onChange={(e) => setNameDrafts((p) => ({ ...p, [draftKey]: e.target.value }))}
                onBlur={(e) => setRow(group, i, { name: e.target.value || "อื่น ๆ (ระบุ)" })}
                placeholder="กรอกคำอธิบาย"
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
              <td className="border px-2 py-2 bg-gray-100 font-medium" colSpan={7}>ระบบป้องกันฟ้าผ่า</td>
            </tr>
            {(freq.systems?.lightning || []).map((r, i) => (
              <Plan25Row key={`lightning-${i}`} group="lightning" r={r as any} i={i} />
            ))}

            <tr>
              <td className="border px-2 py-2 bg-gray-100 font-medium" colSpan={7}>ระบบอุปกรณ์ประกอบอื่น ๆ</td>
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

