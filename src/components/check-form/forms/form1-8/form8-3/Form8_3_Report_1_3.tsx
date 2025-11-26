"use client";
import * as React from "react";
import type { Form8_1Inspect, Section3Item } from "./types";
import CheckTick from "./ui/CheckTickLocal";
import { labels, groundItems, roofItems, section3Intro } from "./section3Content";

type Props = {
  installType?: string; // from report.installType
  value?: Partial<Form8_1Inspect>;
  onChange: (patch: Partial<Form8_1Inspect>) => void;
};

// Default export name aligned with import usage in Form8_1.tsx
export default function Form8_3_Report_1_3({ installType, value, onChange }: Props) {
  const items = value?.items || {};
  const ground = installType === "onGround";

  const base = (groundItems as any).filter((i: any) => ["1", "2", "3", "4", "5"].includes(i.key));
  const item6Default = (groundItems as any).find((i: any) => i.key === "6") || { key: "6", title: "item 6" };
  const item7Default = (roofItems as any).find((i: any) => i.key === "7") || { key: "7", title: "item 7" };
  const list = [...base, item6Default, item7Default];
  // ตามเงื่อนไขเดิมใน .bak: ถ้า onGround → ล็อคข้อ 7, ถ้าไม่ใช่ onGround → ล็อคข้อ 6
  const disabledKey: string | undefined = ground ? "7" : "6";

  const setItem = (key: string, patch: Partial<Section3Item>) => {
    if (key === disabledKey) return;
    const keepY = typeof window !== 'undefined' ? window.scrollY : 0;
    const cur = (items as any)[key] as Section3Item | undefined;
    const title = list.find((i) => i.key === key)?.title || "";
    const next: Section3Item = { key, title, ...(cur || {}), ...(patch as any) };
    onChange({ items: { ...(items as any), [key]: next } });
    if (typeof window !== 'undefined') {
      requestAnimationFrame(() => window.scrollTo(0, keepY));
    }
  };

  const radioPrefix = React.useId();

  // local drafts to avoid committing each keystroke
  const [drafts, setDrafts] = React.useState<Record<string, { change?: string; other?: string }>>({});
  const getChange = (k: string, v?: Section3Item) =>
    (drafts[k]?.change ?? v?.changeDetailNote ?? "");
  const setChange = (k: string, text: string) =>
    setDrafts((p) => ({ ...p, [k]: { ...(p[k] || {}), change: text } }));
  const commitChange = (k: string, text: string) => setItem(k, { changeDetailNote: text });
  const getOther = (k: string, v?: Section3Item) =>
    (drafts[k]?.other ?? v?.otherNote ?? "");
  const setOther = (k: string, text: string) =>
    setDrafts((p) => ({ ...p, [k]: { ...(p[k] || {}), other: text } }));
  const commitOther = (k: string, text: string) => setItem(k, { otherNote: text });

  return (
    <section className="space-y-6">
      <div className="text-sm text-gray-800 whitespace-pre-line">{section3Intro}</div>

      {list.map((it) => {
        const v = (items as any)[it.key] as Section3Item | undefined;
        const locked = it.key === disabledKey;
        const danger = Boolean(v?.hasChange || v?.otherChecked);
        return (
          <div key={it.key} className={`border rounded-lg p-4 bg-white shadow-sm ${locked ? "opacity-60" : ""}`}>
            <div className="font-semibold text-gray-800 mb-2">{`${it.key}. ${it.title}`}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2">
                  <CheckTick
                    checked={!!v?.noChange}
                    onChange={() => setItem(it.key, { noChange: !v?.noChange, hasChange: !v?.noChange ? false : v?.hasChange })}
                    disabled={locked}
                    label={String(labels.noChange)}
                  />
                  <span>{labels.noChange}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2">
                  <CheckTick
                    checked={!!v?.hasChange}
                    onChange={() => setItem(it.key, { hasChange: !v?.hasChange, noChange: !v?.hasChange ? false : v?.noChange })}
                    disabled={locked}
                    label={String(labels.hasChange)}
                  />
                  <span>{labels.hasChange}</span>
                </div>
                <textarea
                  className={`w-full rounded border px-3 py-2 min-h-20 ${danger ? "border-red-400" : "border-gray-300"}`}
                  placeholder={labels.detailsPlaceholder}
                  value={getChange(it.key, v)}
                  onChange={(e) => setChange(it.key, e.target.value)}
                  onBlur={(e) => commitChange(it.key, e.target.value)}
                />
                <div className="text-sm text-gray-700">{labels.opinion}</div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <CheckTick
                      checked={v?.inspectorOpinion === "canUse"}
                      onChange={() => setItem(it.key, { inspectorOpinion: v?.inspectorOpinion === "canUse" ? ("" as any) : ("canUse" as any) })}
                      disabled={locked}
                      label={String(labels.canUse)}
                    />
                    <span>{labels.canUse}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckTick
                      checked={v?.inspectorOpinion === "cannotUse"}
                      onChange={() => setItem(it.key, { inspectorOpinion: v?.inspectorOpinion === "cannotUse" ? ("" as any) : ("cannotUse" as any) })}
                      disabled={locked}
                      label={String(labels.cannotUse)}
                    />
                    <span>{labels.cannotUse}</span>
                  </div>
                </div>
                <div className="inline-flex items-center gap-2">
                  <CheckTick checked={!!v?.otherChecked} disabled={locked} onChange={() => setItem(it.key, { otherChecked: !v?.otherChecked })} label={String(labels.other)} />
                  <span>{labels.other}</span>
                </div>
                  {v?.otherChecked ? (
                    <input
                      className={`w-full rounded border px-3 py-2 h-10 focus:outline-none ${danger ? "border-red-400" : "border-gray-300"}`}
                      placeholder={labels.otherPlaceholder}
                      value={getOther(it.key, v)}
                      onChange={(e) => setOther(it.key, e.target.value)}
                      onBlur={(e) => commitOther(it.key, e.target.value)}
                    />
                  ) : null}
                </div>
                {/* กัน layout jump: จองความสูงไว้ให้ badge เสมอ */}
                <div className="mt-4 text-center" style={{ minHeight: 48 }}>
                  {danger && !locked ? (
                    <span className="inline-block bg-rose-600 text-white px-4 py-2 rounded-lg shadow">{labels.majorBadge}</span>
                  ) : null}
                </div>
              </div>
            </div>
        );
      })}
    </section>
  );
}


