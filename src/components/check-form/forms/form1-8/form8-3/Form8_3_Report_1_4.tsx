"use client";
import * as React from "react";
import type { Form8_1Summary, Form8_1Signoff, Form8_1General } from "./types";
import CheckTick from "./ui/CheckTickLocal";
import RemarkCell from "./ui/RemarkCellLocal";
import { LETTER_NONE, LETTER_MINOR, LETTER_MAJOR, fillTokens } from "./summaryLetterContent";

type Props = {
  summary?: Partial<Form8_1Summary>;
  signoff?: Partial<Form8_1Signoff>;
  general?: Partial<Form8_1General>;
  onChangeSummary: (patch: Partial<Form8_1Summary>) => void;
  onChangeSignoff: (patch: Partial<Form8_1Signoff>) => void;
};

const SEED = [
  { id: 1, title: "โครงสร้าง/ฐานราก/ยึดตรึง" },
  { id: 2, title: "ป้าย/พื้นผิว/สี/ตัวอักษร" },
  { id: 3, title: "ระบบไฟฟ้าแสงสว่างและระบบไฟฟ้ากำลัง" },
  { id: 4, title: "ระบบสายล่อฟ้า (ถ้ามี)" },
  { id: 5, title: "ทางเดิน/บันได/ทางขึ้น" },
] as const;

export default function Main1_Summary({ summary, signoff, general, onChangeSummary, onChangeSignoff }: Props) {
  const s = summary || {};

  const [signDraft, setSignDraft] = React.useState({
    inspectorName: signoff?.inspectorName || "",
    inspectionDate: signoff?.inspectionDate || "",
    ownerOrRepresentative: signoff?.ownerOrRepresentative || "",
    minorRemark: signoff?.minorRemark || "",
    fixIssueSubject: signoff?.fixIssueSubject || "",
  });
  React.useEffect(() => {
    setSignDraft({
      inspectorName: signoff?.inspectorName || "",
      inspectionDate: signoff?.inspectionDate || "",
      ownerOrRepresentative: signoff?.ownerOrRepresentative || "",
      minorRemark: signoff?.minorRemark || "",
      fixIssueSubject: signoff?.fixIssueSubject || "",
    });
  }, [signoff?.inspectorName, signoff?.inspectionDate, signoff?.ownerOrRepresentative, signoff?.minorRemark, signoff?.fixIssueSubject]);

  const rows = React.useMemo(() => {
    const map = new Map<number, any>((s.rows || []).map((r) => [r.id, r]));
    return SEED.map((seed) => ({ id: seed.id, title: seed.title, ...(map.get(seed.id) || {}) }));
  }, [s.rows]);

  const updateRow = React.useCallback((idx: number, patch: Partial<NonNullable<Form8_1Summary["rows"]>[number]>) => {
    const keepY = typeof window !== "undefined" ? window.scrollY : 0;
    const next = [...rows];
    next[idx] = { ...(next[idx] || { id: idx + 1, title: "" }), ...(patch as any) } as any;
    onChangeSummary({ rows: next });
    if (typeof window !== "undefined") requestAnimationFrame(() => window.scrollTo(0, keepY));
  }, [rows, onChangeSummary]);

  return (
    <section className="space-y-6">
      {/* ตารางสรุปผล: หัวตาราง 2 แถว */}
      <div className="overflow-x-auto">
        <table className="min-w-full border text-sm tbl-strong vhead-compact table-fixed">
          <thead>
            <tr className="bg-gray-100 text-gray-700">
              <th className="w-14 border px-2 py-2 text-center" rowSpan={2}>#</th>
              <th className="border px-2 py-2 text-left" rowSpan={2}>หัวข้อ</th>
              <th className="border px-2 py-2 text-center" colSpan={3}>ผลการตรวจ</th>
              <th className="w-56 border px-2 py-2 text-left" rowSpan={2}>หมายเหตุ</th>
            </tr>
            <tr className="bg-gray-100 text-gray-700">
              <th className="w-20 border px-2 py-2 text-center">ใช้งานได้</th>
              <th className="w-24 border px-2 py-2 text-center">ใช้งานไม่ได้</th>
              <th className="w-24 border px-2 py-2 text-center">แก้ไขแล้ว</th>
            </tr>
          </thead>
          <SummaryContext.Provider value={{ updateRow }}>
            <tbody>
              {rows.map((r, idx) => (
                <SummaryRowItem key={r.id} idx={idx} r={r as any} />
              ))}
            </tbody>
          </SummaryContext.Provider>
        </table>
      </div>

      {/* แถบแจ้งตามผลสรุป */}
      {signoff?.overallConclusion === "major" ? (
        <div className="p-3 rounded border border-red-300 bg-red-50 text-red-700" aria-live="polite">
          พบข้อบกพร่องระดับ Major กรุณาดำเนินการแก้ไขและแจ้งผล
        </div>
      ) : signoff?.overallConclusion === "minor" ? (
        <div className="p-3 rounded border border-amber-300 bg-amber-50 text-amber-800" aria-live="polite">
          มีข้อสังเกตระดับ Minor โปรดพิจารณาปรับปรุงตามความเหมาะสม
        </div>
      ) : null}

      {/* จดหมายสรุปผล (แสดงตามสรุป) */}
      {signoff?.overallConclusion ? (
        <div className="relative border-2 border-gray-400 rounded-2xl p-5 bg-white space-y-3 letterBox">
          {/* หัวเรื่อง */}
          <div className="text-base font-semibold underline underline-offset-4 decoration-gray-400">สรุปความคิดเห็นผู้ตรวจสอบ</div>

          {/* แถบมุมขวาบน: ไม่มีข้อบกพร่อง */}
          {signoff?.overallConclusion === "none" ? (
            <div className="absolute right-4 -top-3">
              <div className="relative inline-block bg-rose-600 text-white font-semibold px-3 py-1 rounded shadow">
                ไม่มีข้อบกพร่อง
                <span className="absolute -left-2 top-1/2 -translate-y-1/2 w-0 h-0 border-y-8 border-y-transparent border-r-8 border-r-rose-600" />
              </div>
            </div>
          ) : null}

          {/* เนื้อความจดหมาย */}
          {(() => {
            const tokens = {
              owner: signoff?.ownerOrRepresentative || "",
              signTitle: general?.signName || "",
              signature: signoff?.signature || "",
              inspector: signoff?.inspectorName || "",
              date: signoff?.inspectionDate || "",
              fixIssue: signoff?.fixIssueSubject || "",
            };
            const c = signoff?.overallConclusion;
            const paras = c === "none" ? LETTER_NONE : c === "minor" ? LETTER_MINOR : LETTER_MAJOR;
            return paras.map((p, idx) => (
              <p key={idx} className="text-sm text-gray-800 whitespace-pre-wrap">
                {fillTokens(p, tokens)}
              </p>
            ));
          })()}

          {/* บรรทัดลงนามแบบมีเส้นประ */}
          <div className="mt-3 space-y-1 text-sm text-gray-800">
            <div>
              ลงชื่อ <span className="inline-block min-w-[200px] border-b border-dotted border-gray-400 text-center">{signoff?.signature || ""}</span> ผู้ตรวจสอบ
            </div>
            <div>
              ชื่อ <span className="inline-block min-w-[200px] border-b border-dotted border-gray-400 text-center">{signoff?.inspectorName || ""}</span>
            </div>
            <div>
              วันที่ <span className="inline-block min-w-[180px] border-b border-dotted border-gray-400 text-center">{signoff?.inspectionDate || ""}</span>
            </div>
          </div>

          {/* ป้ายใหญ่ด้านล่างกลางหน้า */}
          {signoff?.overallConclusion === "minor" ? (
            <div className="pt-4 text-center">
              <span className="inline-block bg-emerald-600 text-white px-10 py-4 rounded-xl text-xl font-semibold shadow">Minor</span>
            </div>
          ) : signoff?.overallConclusion === "major" ? (
            <div className="pt-4 text-center">
              <span className="inline-block bg-rose-600 text-white px-10 py-4 rounded-xl text-xl font-semibold shadow">Major</span>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* ลงนาม */}
      <div className="border rounded-xl p-4 bg-white space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">ผลสรุป</label>
            <select className="w-full rounded-lg border border-gray-300 px-3 py-2" value={signoff?.overallConclusion || ""} onChange={(e) => onChangeSignoff({ overallConclusion: e.target.value as any })}>
              <option value="">- เลือก -</option>
              <option value="none">ไม่มี</option>
              <option value="minor">Minor</option>
              <option value="major">Major</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">ผู้ตรวจ</label>
            <input className="w-full rounded-lg border border-gray-300 px-3 py-2" value={signDraft.inspectorName} onChange={(e) => setSignDraft((p) => ({ ...p, inspectorName: e.target.value }))} onBlur={(e) => onChangeSignoff({ inspectorName: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">วันที่ตรวจ</label>
            <input type="date" className="w-full rounded-lg border border-gray-300 px-3 py-2" value={signDraft.inspectionDate} onChange={(e) => setSignDraft((p) => ({ ...p, inspectionDate: e.target.value }))} onBlur={(e) => onChangeSignoff({ inspectionDate: e.target.value })} />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">เจ้าของ/ผู้แทน</label>
          <input className="w-full rounded-lg border border-gray-300 px-3 py-2" value={signDraft.ownerOrRepresentative} onChange={(e) => setSignDraft((p) => ({ ...p, ownerOrRepresentative: e.target.value }))} onBlur={(e) => onChangeSignoff({ ownerOrRepresentative: e.target.value })} />
        </div>

        {signoff?.overallConclusion === "minor" ? (
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">หมายเหตุ (Minor)</label>
            <textarea className="w-full rounded-lg border border-gray-300 px-3 py-2 min-h-24" value={signDraft.minorRemark} onChange={(e) => setSignDraft((p) => ({ ...p, minorRemark: e.target.value }))} onBlur={(e) => onChangeSignoff({ minorRemark: e.target.value })} />
          </div>
        ) : null}

        {signoff?.overallConclusion === "major" ? (
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">ข้อแก้ไข (Major)</label>
            <textarea className="w-full rounded-lg border border-red-300 px-3 py-2 min-h-24" value={signDraft.fixIssueSubject} onChange={(e) => setSignDraft((p) => ({ ...p, fixIssueSubject: e.target.value }))} onBlur={(e) => onChangeSignoff({ fixIssueSubject: e.target.value })} />
          </div>
        ) : null}
      </div>
    </section>
  );
}

const SummaryRowItem = React.memo(function SummaryRowItem({ r, idx }: { r: NonNullable<Form8_1Summary["rows"]>[number]; idx: number }) {
  const ctx = React.useContext(SummaryContext);
  if (!ctx) return null as any;
  const { updateRow } = ctx;
  return (
    <tr className={idx % 2 ? "bg-gray-50" : "bg-white"}>
      <td className="border px-2 py-2 text-center align-top">{r.id}</td>
      <td className="border px-2 py-2 align-top">{r.title}</td>
      <td className="border px-2 py-2 text-center align-top h-10 align-middle">
        <CheckTick size="sm" className="m-0" checked={r.result === "ok"} onChange={() => updateRow(idx, { result: r.result === "ok" ? ("" as any) : ("ok" as any) })} />
      </td>
      <td className="border px-2 py-2 text-center align-top h-10 align-middle">
        <CheckTick size="sm" className="m-0" checked={r.result === "not_ok"} onChange={() => updateRow(idx, { result: r.result === "not_ok" ? ("" as any) : ("not_ok" as any) })} />
      </td>
      <td className="border px-2 py-2 text-center align-top h-10 align-middle">
        <CheckTick
          size="sm"
          className="m-0"
          checked={!!(r as any).fixed}
          onChange={() => updateRow(idx, { fixed: !((r as any).fixed) } as any)}
          label="แก้ไขแล้ว"
        />
      </td>
      <td className="border px-2 py-2 align-top h-10 align-middle">
        <RemarkCell note={r.note || ""} onSave={(text) => updateRow(idx, { note: text })} />
      </td>
    </tr>
  );
}, (a, b) => a.r.id === b.r.id && a.r.title === b.r.title && a.r.result === b.r.result && a.r.note === b.r.note);

type Ctx = { updateRow: (idx: number, patch: Partial<NonNullable<Form8_1Summary["rows"]>[number]>) => void };
const SummaryContext = React.createContext<Ctx | null>(null);

<style jsx>{`
  .letterBox { min-height: 560px; contain: layout; overflow-anchor: none; }
`}</style>



