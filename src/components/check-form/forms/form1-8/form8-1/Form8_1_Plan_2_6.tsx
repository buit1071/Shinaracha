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

export default function Plan2_6_Results({ value, onChange, onOpenDefect }: Props) {
  const plan = value || {};
  const ensureRows = React.useCallback(
    (rows: UsabilityRow[] | undefined, seeds: string[]) =>
      (Array.isArray(rows) && rows.length > 0 ? rows : seeds.map((name) => ({ name })) as UsabilityRow[]),
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
    patch: Partial<Pick<UsabilityRow, "status" | "note" | "defects">>
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
    target[idx] = { ...(target[idx] || {}), ...(patch as UsabilityRow) };
    onChange({ usabilityPlan: next });
  };

  const Row = ({ group, r, i }: { group: "structural" | "electrical" | "lightning" | "others"; r: UsabilityRow; i: number }) => {
    const toggle = (st: UsabilityStatus) => setRow(group, i, { status: r.status === st ? undefined : st });
    const defectCount = (r?.defects?.length ?? 0) as number;
    const open = () => onOpenDefect?.({ group, index: i, items: (r.defects || []) as DefectItem[] });
    return (
      <tr className="odd:bg-white even:bg-gray-50">
        <td className="w-12 border px-2 py-2 text-center h-10 align-middle">{i + 1}</td>
        <td className="border px-2 py-2 h-10 align-middle">{r.name}</td>
        <td className="w-24 border px-2 py-2 text-center h-10 align-middle">
          <CheckTick checked={r.status === "usable"} onChange={() => toggle("usable")} />
        </td>
        <td className="w-24 border px-2 py-2 text-center h-10 align-middle">
          <CheckTick checked={r.status === "unusable"} onChange={() => toggle("unusable")} />
        </td>
        <td className="w-28 border px-2 py-2 text-center h-10 align-middle">
          <button
            type="button"
            aria-label="แก้ไข Defect"
            title="แก้ไข Defect"
            className="inline-flex items-center justify-center h-8 px-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            onClick={open}
            disabled={r.status !== "unusable"}
          >
            แก้
          </button>
          {defectCount > 0 && <span className="ml-1 text-xs text-gray-600">({defectCount})</span>}
        </td>
        <td className="border px-2 py-2 h-10 align-middle">
          <RemarkCell note={r.note} placeholder="หมายเหตุ (คลิก)" onSave={(text) => setRow(group, i, { note: text })} />
        </td>
      </tr>
    );
  };

  return (
    <section className="space-y-4">
      <div className="font-semibold">2.6 ผลการตรวจ</div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border tbl-strong vhead-compact table-fixed">
          <thead>
            <tr className="bg-gray-100 text-gray-700">
              <th className="w-12 border px-2 py-2 text-center" rowSpan={2}>ลำดับ</th>
              <th className="border px-2 py-2 text-left" rowSpan={2}>รายละเอียด</th>
              <th className="border px-2 py-2 text-center" colSpan={2}>รอบที่ 1</th>
              <th className="border px-2 py-2 text-center" rowSpan={2}>Defect</th>
              <th className="border px-2 py-2 text-left" rowSpan={2}>หมายเหตุ</th>
            </tr>
            <tr className="bg-gray-100 text-gray-700">
              <th className="w-24 border px-2 py-2 text-center">ใช้ได้</th>
              <th className="w-24 border px-2 py-2 text-center">ใช้ไม่ได้</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border px-2 py-2 bg-gray-100 font-medium" colSpan={6}>โครงสร้าง</td>
            </tr>
            {(results.structural || []).map((r: UsabilityRow, i: number) => (
              <Row key={`structural-${i}`} group="structural" r={r} i={i} />
            ))}

            <tr>
              <td className="border px-2 py-2 bg-gray-100 font-medium" colSpan={6}>ระบบไฟฟ้า</td>
            </tr>
            {(results.systems?.electrical || []).map((r: UsabilityRow, i: number) => (
              <Row key={`electrical-${i}`} group="electrical" r={r} i={i} />
            ))}

            <tr>
              <td className="border px-2 py-2 bg-gray-100 font-medium" colSpan={6}>ระบบป้องกันฟ้าผ่า</td>
            </tr>
            {(results.systems?.lightning || []).map((r: UsabilityRow, i: number) => (
              <Row key={`lightning-${i}`} group="lightning" r={r} i={i} />
            ))}

            <tr>
              <td className="border px-2 py-2 bg-gray-100 font-medium" colSpan={6}>ระบบอุปกรณ์ประกอบอื่น ๆ</td>
            </tr>
            {(results.systems?.others || []).map((r: UsabilityRow, i: number) => (
              <Row key={`others-${i}`} group="others" r={r} i={i} />
            ))}
          </tbody>
        </table>
      </div>

      {/* DefectPopup ถูกย้ายไปอยู่ใน Form8_1 */}
    </section>
  );
}
