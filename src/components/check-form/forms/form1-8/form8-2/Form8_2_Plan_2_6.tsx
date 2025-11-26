"use client";
import * as React from "react";
import type { Form8_1Plan, UsabilityStatus, PlanUsability, UsabilityRow, DefectItem } from "./types";
import CheckTick from "./ui/CheckTickLocal";
import RemarkCell from "./ui/RemarkCellLocal";

type Props = {
  value?: Partial<Form8_1Plan>;
  onChange: (patch: Partial<Form8_1Plan>) => void;
  onOpenDefect?: (args: { group: "structural" | "electrical" | "lightning" | "others"; index: number; items: DefectItem[] }) => void;
};

const STRUCTURAL_ROWS = [
  "โครงสร้างหลัก/ฐานราก/เสา/คาน แผ่นพื้น ความมั่นคงแข็งแรง",
  "จุดยึดโยง/การยึดกับโครง",
  "โครงคร่าว/วัสดุรองรับแผ่นป้าย",
  "การยึดเกาะผิว/หลังป้าย ความแน่นเรียบร้อย",
  "การจัดวาง/ร้อยสาย/ท่อร้อยสายไฟ",
  "การป้องกันสนิมของวัสดุเหล็ก",
  "ทางขึ้น/อุปกรณ์สำหรับปฏิบัติงาน (ถ้ามี)",
  "บันได/ราวบันได/ทางเดิน (ถ้ามี) ความปลอดภัย",
  "ความปลอดภัยโดยรวมของโครงสร้างตามมาตรฐานที่เกี่ยวข้อง",
];

const SYS_ELECTRICAL = [
  "ระบบไฟฟ้าแสงสว่างป้าย",
  "สายไฟ/ท่อร้อยสาย/จุดต่อ/ตู้สวิตช์",
  "การป้องกันไฟฟ้ารั่ว/กราวด์",
  "การต่อลงดิน",
  "อุปกรณ์ป้องกัน/ตัดไฟรั่ว เบรกเกอร์/กันดูด",
];

const SYS_LIGHTNING = [
  "ระบบป้องกันฟ้าผ่า (ถ้ามี)",
  "การเดินสายล่อฟ้า/แท่งดิน",
  "จุดต่อ/ค่าความต้านทาน",
];

const SYS_OTHERS = [
  "ทางเดิน/พื้นยกทำงาน",
  "ราวกันตก/ตาข่าย/แผงกั้น",
  "อุปกรณ์ยึดจับ/สลัก/โบลต์",
  "CATWALK/ทางขึ้น",
  "อื่น ๆ (ระบุ)",
];

export default function Plan2_6_Results({ value, onChange, onOpenDefect }: Props) {
  const plan = value || {};
  const ensureRows = React.useCallback(
    (rows: UsabilityRow[] | undefined, seeds: string[]) =>
      Array.isArray(rows) && rows.length > 0
        ? rows.map((r) => ({ ...r, statusRound1: r.statusRound1 ?? r.status }))
        : (seeds.map((name) => ({ name })) as UsabilityRow[]),
    []
  );
  const results = React.useMemo<PlanUsability>(() => {
    const up = plan.usabilityPlan || {};
    return {
      structural: ensureRows(up.structural, STRUCTURAL_ROWS),
      systems: {
        electrical: ensureRows(up.systems?.electrical, SYS_ELECTRICAL),
        lightning: ensureRows(up.systems?.lightning, SYS_LIGHTNING),
        others: ensureRows(up.systems?.others, SYS_OTHERS),
      },
    };
  }, [ensureRows, plan.usabilityPlan]);

  const setRow = (
    group: "structural" | "electrical" | "lightning" | "others",
    idx: number,
    patch: Partial<Pick<UsabilityRow, "status" | "statusRound1" | "statusRound2" | "note" | "defects">>
  ) => {
    const next: PlanUsability = {
      structural: Array.isArray(results.structural) ? [...results.structural] : [],
      systems: {
        electrical: Array.isArray(results.systems?.electrical) ? [...results.systems.electrical] : [],
        lightning: Array.isArray(results.systems?.lightning) ? [...results.systems.lightning] : [],
        others: Array.isArray(results.systems?.others) ? [...results.systems.others] : [],
      },
    };
    let target: UsabilityRow[];
    if (group === "structural") {
      target = next.structural || [];
      next.structural = target;
    } else if (group === "electrical") {
      target = next.systems!.electrical || [];
      next.systems!.electrical = target;
    } else if (group === "lightning") {
      target = next.systems!.lightning || [];
      next.systems!.lightning = target;
    } else {
      target = next.systems!.others || [];
      next.systems!.others = target;
    }
    target[idx] = {
      ...(target[idx] || {}),
      ...(patch as UsabilityRow),
      status: (patch as any).status ?? (patch as any).statusRound1 ?? target[idx]?.status,
    };
    onChange({ usabilityPlan: next });
  };

  const Row = ({ group, r, i }: { group: "structural" | "electrical" | "lightning" | "others"; r: UsabilityRow; i: number }) => {
    const toggle = (round: 1 | 2, st: UsabilityStatus) => {
      const key = round === 1 ? "statusRound1" : "statusRound2";
      const curr = (round === 1 ? r.statusRound1 ?? r.status : r.statusRound2) as UsabilityStatus | undefined;
      const next = curr === st ? undefined : st;
      setRow(group, i, { [key]: next } as any);
    };
    const defectCount = (r?.defects?.length ?? 0) as number;
    const open = () => onOpenDefect?.({ group, index: i, items: (r.defects || []) as DefectItem[] });
    const round1 = r.statusRound1 ?? r.status;
    const round2 = r.statusRound2;
    const defectDisabled = round1 !== "unusable" && round2 !== "unusable";
    return (
      <tr className="odd:bg-white even:bg-gray-50">
        <td className="w-12 border px-2 py-2 text-center h-10 align-middle">{i + 1}</td>
        <td className="border px-2 py-2 h-10 align-middle">{r.name}</td>
        <td className="w-24 border px-2 py-2 text-center h-10 align-middle">
          <CheckTick checked={round1 === "usable"} onChange={() => toggle(1, "usable")} />
        </td>
        <td className="w-24 border px-2 py-2 text-center h-10 align-middle">
          <CheckTick checked={round1 === "unusable"} onChange={() => toggle(1, "unusable")} />
        </td>
        <td className="w-24 border px-2 py-2 text-center h-10 align-middle">
          <CheckTick checked={round2 === "usable"} onChange={() => toggle(2, "usable")} />
        </td>
        <td className="w-24 border px-2 py-2 text-center h-10 align-middle">
          <CheckTick checked={round2 === "unusable"} onChange={() => toggle(2, "unusable")} />
        </td>
        <td className="w-28 border px-2 py-2 text-center h-10 align-middle">
          <button
            type="button"
            aria-label="แก้ไข Defect"
            title="แก้ไข Defect"
            className="inline-flex items-center justify-center h-8 px-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            onClick={open}
            disabled={defectDisabled}
          >
            แก้
          </button>
          {defectCount > 0 && <span className="ml-1 text-xs text-gray-600">({defectCount})</span>}
        </td>
        <td className="border px-2 py-2 h-10 align-middle">
          <RemarkCell note={r.note} placeholder="หมายเหตุ (ถ้ามี)" onSave={(text) => setRow(group, i, { note: text })} />
        </td>
      </tr>
    );
  };

  return (
    <section className="space-y-4">
      <div className="font-semibold">2.6 ผลการตรวจสภาพป้าย และอุปกรณ์ประกอบป้าย</div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border tbl-strong vhead-compact table-fixed">
          <thead>
            <tr className="bg-gray-100 text-gray-700">
              <th className="w-12 border px-2 py-2 text-center" rowSpan={2}>ลำดับ</th>
              <th className="border px-2 py-2 text-left" rowSpan={2}>รายการตรวจสอบ</th>
              <th className="border px-2 py-2 text-center" colSpan={2}>รอบที่ 1</th>
              <th className="border px-2 py-2 text-center" colSpan={2}>รอบที่ 2</th>
              <th className="border px-2 py-2 text-center" rowSpan={2}>Defect</th>
              <th className="border px-2 py-2 text-left" rowSpan={2}>หมายเหตุ</th>
            </tr>
            <tr className="bg-gray-100 text-gray-700">
              <th className="w-24 border px-2 py-2 text-center">ใช้ได้</th>
              <th className="w-24 border px-2 py-2 text-center">ใช้ไม่ได้</th>
              <th className="w-24 border px-2 py-2 text-center">ใช้ได้</th>
              <th className="w-24 border px-2 py-2 text-center">ใช้ไม่ได้</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border px-2 py-2 bg-gray-100 font-medium" colSpan={8}>โครงสร้าง</td>
            </tr>
            {(results.structural || []).map((r: UsabilityRow, i: number) => (
              <Row key={`structural-${i}`} group="structural" r={r} i={i} />
            ))}

            <tr>
              <td className="border px-2 py-2 bg-gray-100 font-medium" colSpan={8}>ระบบไฟฟ้า</td>
            </tr>
            {(results.systems?.electrical || []).map((r: UsabilityRow, i: number) => (
              <Row key={`electrical-${i}`} group="electrical" r={r} i={i} />
            ))}

            <tr>
              <td className="border px-2 py-2 bg-gray-100 font-medium" colSpan={8}>ระบบป้องกันฟ้าผ่า</td>
            </tr>
            {(results.systems?.lightning || []).map((r: UsabilityRow, i: number) => (
              <Row key={`lightning-${i}`} group="lightning" r={r} i={i} />
            ))}

            <tr>
              <td className="border px-2 py-2 bg-gray-100 font-medium" colSpan={8}>ระบบ/อุปกรณ์อื่น ๆ</td>
            </tr>
            {(results.systems?.others || []).map((r: UsabilityRow, i: number) => (
              <Row key={`others-${i}`} group="others" r={r} i={i} />
            ))}
          </tbody>
        </table>
      </div>

      {/* DefectPopup �١���������� Form8_1 */}
    </section>
  );
}
