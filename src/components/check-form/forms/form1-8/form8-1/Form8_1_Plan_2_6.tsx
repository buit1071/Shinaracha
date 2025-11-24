"use client";
import * as React from "react";
import type { Form8_1Plan, UsabilityStatus, PlanUsability, UsabilityRow, DefectItem } from "./types";
import CheckTick from "./ui/CheckTickLocal";
import RemarkCell from "./ui/RemarkCellLocal";
import DefectPopup from "@/components/check-form/common/DefectPopup";

type Props = {
  value?: Partial<Form8_1Plan>;
  onChange: (patch: Partial<Form8_1Plan>) => void;
  onOpenDefect?: (args: { group: 'structural'|'electrical'|'lightning'|'others'; index: number; items: DefectItem[] }) => void;
};

export default function Plan2_6_Results({ value, onChange, onOpenDefect }: Props) {
  const plan = value || {};
  const results = React.useMemo<PlanUsability>(() => ({
    structural: plan.usabilityPlan?.structural || [],
    systems: {
      electrical: plan.usabilityPlan?.systems?.electrical || [],
      lightning: plan.usabilityPlan?.systems?.lightning || [],
      others: plan.usabilityPlan?.systems?.others || [],
    },
  }), [plan.usabilityPlan]);

  // ย้าย state popup ไปที่ parent (Form8_1) แล้วใช้ callback เปิด

  const setRow = (
    group: "structural" | "electrical" | "lightning" | "others",
    idx: number,
    patch: Partial<{ status?: UsabilityStatus; note?: string; defects?: any[] }>
  ) => {
    const next: PlanUsability = {
      structural: results.structural,
      systems: {
        electrical: results.systems?.electrical,
        lightning: results.systems?.lightning,
        others: results.systems?.others,
      },
    };
    const assign = (arr?: any[]) => {
      const rows = arr ? [...arr] : [];
      rows[idx] = { ...(rows[idx] || {}), ...(patch as any) } as any;
      return rows;
    };
    if (group === "structural") next.structural = assign(results.structural);
    else if (group === "electrical") next.systems!.electrical = assign(results.systems?.electrical);
    else if (group === "lightning") next.systems!.lightning = assign(results.systems?.lightning);
    else next.systems!.others = assign(results.systems?.others);
    onChange({ usabilityPlan: next });
  };

  const Row = ({ group, r, i }: { group: 'structural'|'electrical'|'lightning'|'others'; r: UsabilityRow; i: number }) => {
    const toggle = (st: UsabilityStatus) => setRow(group, i, { status: r.status === st ? undefined : st });
    const defectCount = (r?.defects?.length ?? 0) as number;
    const open = () => onOpenDefect?.({ group, index: i, items: (r.defects || []) as DefectItem[] });
    return (
      <tr className="odd:bg-white even:bg-gray-50">
        <td className="w-12 border px-2 py-2 text-center h-10 align-middle">{i + 1}</td>
        <td className="border px-2 py-2 h-10 align-middle">{r.name}</td>
        <td className="w-24 border px-2 py-2 text-center h-10 align-middle">
          <CheckTick checked={r.status === 'usable'} onChange={() => toggle('usable')} />
        </td>
        <td className="w-24 border px-2 py-2 text-center h-10 align-middle">
          <CheckTick checked={r.status === 'unusable'} onChange={() => toggle('unusable')} />
        </td>
        <td className="w-28 border px-2 py-2 text-center h-10 align-middle">
          <button
            type="button"
            aria-label="แก้ไข Defect"
            title="แก้ไข Defect"
            className="inline-flex items-center justify-center h-8 px-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            onClick={open}
            disabled={r.status !== 'unusable'}
          >
            แก้ไข
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
              <th className="border px-2 py-2 text-left" rowSpan={2}>รายการตรวจ</th>
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
            {(results.structural || []).map((r: any, i: number) => (
              <Row key={`structural-${i}`} group="structural" r={r} i={i} />
            ))}

            <tr>
              <td className="border px-2 py-2 bg-gray-100 font-medium" colSpan={6}>ระบบไฟฟ้า</td>
            </tr>
            {(results.systems?.electrical || []).map((r: any, i: number) => (
              <Row key={`electrical-${i}`} group="electrical" r={r} i={i} />
            ))}

            <tr>
              <td className="border px-2 py-2 bg-gray-100 font-medium" colSpan={6}>ระบบป้องกันฟ้าผ่า</td>
            </tr>
            {(results.systems?.lightning || []).map((r: any, i: number) => (
              <Row key={`lightning-${i}`} group="lightning" r={r} i={i} />
            ))}

            <tr>
              <td className="border px-2 py-2 bg-gray-100 font-medium" colSpan={6}>ระบบอุปกรณ์ประกอบอื่น ๆ</td>
            </tr>
            {(results.systems?.others || []).map((r: any, i: number) => (
              <Row key={`others-${i}`} group="others" r={r} i={i} />
            ))}
          </tbody>
        </table>
      </div>

      {/* DefectPopup ถูกย้ายไปเรนเดอร์ใน Form8_1 */}
    </section>
  );
}
