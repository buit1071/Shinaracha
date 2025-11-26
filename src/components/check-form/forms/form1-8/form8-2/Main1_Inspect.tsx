"use client";
import * as React from "react";
import type { Form8_1Inspect, Section3Item, Section3Opinion } from "./types";
import { inspectGroupTables } from "./section3Content";
import CheckTick from "./ui/CheckTickLocal";
import RemarkCell from "./ui/RemarkCellLocal";

type Props = {
  value?: Partial<Form8_1Inspect>;
  onChange: (patch: Partial<Form8_1Inspect>) => void;
  installType?: string;
};

export default function Main1_Inspect({ value, onChange }: Props) {
  const items = (value?.items ?? {}) as Record<string, Section3Item>;

  const getRow = (key: string, title: string): Section3Item => {
    const base = (items as any)[key] || {};
    const { key: _k, title: _t, ...rest } = base as Partial<Section3Item>;
    return { key, title, ...(rest as any) } as Section3Item;
  };

  const setRow = (key: string, title: string, patch: Partial<Section3Item>) => {
    const keepY = typeof window !== "undefined" ? window.scrollY : 0;
    const next: Record<string, Section3Item> = { ...(items as any) };
    next[key] = { ...getRow(key, title), ...patch } as Section3Item;
    onChange({ items: next });
    if (typeof window !== "undefined") requestAnimationFrame(() => window.scrollTo(0, keepY));
  };

  const [nameDrafts, setNameDrafts] = React.useState<Record<string, string>>({});
  const getName = (k: string, def?: string) => nameDrafts[k] ?? def ?? "";

  const OpinionCells = ({ k, title }: { k: string; title: string }) => {
    const v = items[k]?.inspectorOpinion || "";
    const toggle = (o: Section3Opinion) => setRow(k, title, { inspectorOpinion: v === o ? ("" as any) : o });
    return (
      <>
        <td className="border px-2 py-2 text-center h-10 align-middle">
          <CheckTick checked={v === "canUse"} onChange={() => toggle("canUse")} />
        </td>
        <td className="border px-2 py-2 text-center h-10 align-middle">
          <CheckTick checked={v === "cannotUse"} onChange={() => toggle("cannotUse")} />
        </td>
      </>
    );
  };

  return (
    <section className="space-y-6 no-anchor">
      {inspectGroupTables.map((g) => (
        <div key={g.id} className="rounded border bg-white overflow-x-auto">
          <div className="px-3 py-2 font-semibold text-gray-800">{g.title}</div>
          <table className="w-full text-sm tbl-strong vhead-compact table-fixed">
            <thead>
              <tr className="bg-gray-100 text-gray-700">
                <th className="w-12 border px-2 py-2 text-center" rowSpan={2}>ลำดับ</th>
                <th className="border px-3 py-2 text-left" rowSpan={2}>รายการ</th>
                <th className="border px-2 py-2 text-center" colSpan={2}>มี/ไม่มี</th>
                <th className="border px-2 py-2 text-center" colSpan={2}>การชำรุดสึกหรอ</th>
                <th className="border px-2 py-2 text-center" colSpan={2}>ความเสียหาย</th>
                <th className="border px-2 py-2 text-center" colSpan={2}>ความเห็นผู้ตรวจสอบ</th>
                <th className="w-56 border px-2 py-2 text-left" rowSpan={2}>หมายเหตุ</th>
              </tr>
              <tr className="bg-gray-100 text-gray-700">
                <th className="w-16 border px-2 py-2 text-center">มี</th>
                <th className="w-16 border px-2 py-2 text-center">ไม่มี</th>
                <th className="w-16 border px-2 py-2 text-center">มี</th>
                <th className="w-16 border px-2 py-2 text-center">ไม่มี</th>
                <th className="w-16 border px-2 py-2 text-center">มี</th>
                <th className="w-16 border px-2 py-2 text-center">ไม่มี</th>
                <th className="w-20 border px-2 py-2 text-center">ใช้ได้</th>
                <th className="w-20 border px-2 py-2 text-center">ใช้ไม่ได้</th>
              </tr>
            </thead>
            <tbody>
              {g.rows.map((name, i) => {
                const key = `${g.id}-${i + 1}`;
                const v = items[key];
                return (
                  <tr key={key} className="odd:bg-white even:bg-gray-50">
                    <td className="border px-3 py-2 text-center h-10 align-middle">{i + 1}</td>
                    <td className="border px-3 py-2 h-10 align-middle">
                      {name}
                      {(String(name).includes("อื่น") || String(name).includes("อื่น ๆ")) ? (
                        <input
                          className="w-full rounded border border-gray-300 px-2 py-1 mt-1 h-9 focus:outline-none"
                          value={getName(key, v?.customName || "")}
                          onChange={(e) => setNameDrafts((p) => ({ ...p, [key]: e.target.value }))}
                          onBlur={(e) => setRow(key, name, { customName: e.target.value })}
                        />
                      ) : null}
                    </td>
                    <td className="border px-2 py-2 text-center h-10 align-middle">
                      <CheckTick checked={v?.erosion === "have"} onChange={() => setRow(key, name, { erosion: v?.erosion === "have" ? ("" as any) : ("have" as any) })} />
                    </td>
                    <td className="border px-2 py-2 text-center h-10 align-middle">
                      <CheckTick checked={v?.erosion === "none"} onChange={() => setRow(key, name, { erosion: v?.erosion === "none" ? ("" as any) : ("none" as any) })} />
                    </td>
                    <td className="border px-2 py-2 text-center h-10 align-middle">
                      <CheckTick checked={v?.wear === "have"} onChange={() => setRow(key, name, { wear: v?.wear === "have" ? ("" as any) : ("have" as any) })} />
                    </td>
                    <td className="border px-2 py-2 text-center h-10 align-middle">
                      <CheckTick checked={v?.wear === "none"} onChange={() => setRow(key, name, { wear: v?.wear === "none" ? ("" as any) : ("none" as any) })} />
                    </td>
                    <td className="border px-2 py-2 text-center h-10 align-middle">
                      <CheckTick checked={v?.damage === "have"} onChange={() => setRow(key, name, { damage: v?.damage === "have" ? ("" as any) : ("have" as any) })} />
                    </td>
                    <td className="border px-2 py-2 text-center h-10 align-middle">
                      <CheckTick checked={v?.damage === "none"} onChange={() => setRow(key, name, { damage: v?.damage === "none" ? ("" as any) : ("none" as any) })} />
                    </td>
                    <OpinionCells k={key} title={name} />
                    <td className="border px-2 py-2 h-10 align-middle">
                      <RemarkCell note={v?.note ?? v?.changeDetailNote ?? ""} onSave={(text) => setRow(key, name, { note: text })} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
    </section>
  );
}

<style jsx>{`
  .no-anchor { overflow-anchor: none; }
`}</style>