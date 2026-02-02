import * as React from "react";

/* =========== TYPES =========== */
export type SectionSevenRow = {
    status?: "ok" | "ng";
    fixed?: boolean;
    note?: string;
    extra?: string;
};

export type SectionSevenMeta = {
    siteName?: string;
    roundNo?: string;
    inspectDate?: { d?: string; m?: string; y?: string };

    ownerName?: string;
    inspectorName?: string;

    licenseNo?: string;
    issuer?: string;
    company?: string;
    address?: string;

    licIssue?: { d?: string; m?: string; y?: string };
    licExpire?: { d?: string; m?: string; y?: string };
};

export type SectionSevenForm = {
    rows: Record<string, SectionSevenRow>;
    meta: SectionSevenMeta;
};

type Props = {
    name: string;
    value?: Partial<SectionSevenForm>;
    onChange?: (patch: Partial<SectionSevenForm>) => void;
};

/* =========== UI Helpers =========== */
const DottedInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className = "", ...props }) => (
    <input
        {...props}
        className={[
            "bg-transparent text-gray-900 placeholder-gray-400",
            "border-0 border-b border-dashed border-black/40",
            "focus:outline-none focus:ring-0 px-1",
            className,
        ].join(" ")}
    />
);

const CheckTick: React.FC<{ checked: boolean; onChange: () => void; disabled?: boolean }> = ({ checked, onChange, disabled }) => (
    <button
        type="button"
        onClick={onChange}
        disabled={disabled}
        className={[
            "h-5 w-5 rounded-[4px] border grid place-items-center",
            checked ? "bg-red-600 border-red-600" : "bg-white border-gray-400",
            disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
            "focus:outline-none",
        ].join(" ")}
        aria-pressed={checked}
    >
        <span className={["text-white text-[14px] leading-none", checked ? "opacity-100" : "opacity-0"].join(" ")}>✓</span>
    </button>
);

/* =========== DATA =========== */
type SumRow = { id: string; no: number; label: string; indent?: boolean };
const SUMMARY_ROWS: SumRow[] = [
    { id: "r1", no: 1, label: "การตรวจสอบบำรุงรักษาป้ายด้านความมั่นคงแข็งแรงของป้ายหรือสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย" },
    { id: "r2", no: 2, label: "การตรวจสอบบำรุงรักษาระบบและอุปกรณ์ประกอบของป้าย" },
    { id: "r21", no: 0, label: "2.1 ระบบไฟฟ้าแสงสว่างและระบบไฟฟ้ากำลัง", indent: true },
    { id: "r22", no: 0, label: "2.2 ระบบป้องกันฟ้าผ่า (ถ้ามี)", indent: true },
    { id: "r23", no: 0, label: "2.3 ระบบอุปกรณ์ประกอบอื่น ๆ (ถ้ามี)", indent: true },
];

export const THAI_MONTHS = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
] as const;
export type ThaiMonth = (typeof THAI_MONTHS)[number];

const currentThaiYear = new Date().getFullYear() + 543;
const YEAR_START = 2500;
const YEAR_END = currentThaiYear + 20;
export const YEARS = Array.from({ length: YEAR_END - YEAR_START + 1 }, (_, i) => String(YEAR_START + i));

export function getDaysInMonthThai(thaiYear: string | number | null | undefined, thaiMonth: ThaiMonth | "" | null | undefined): number {
    const idx = thaiMonth ? THAI_MONTHS.indexOf(thaiMonth) : -1;
    const y = typeof thaiYear === "number" ? thaiYear : parseInt(thaiYear ?? "", 10);
    if (idx < 0 || Number.isNaN(y)) return 31;
    return new Date(y - 543, idx + 1, 0).getDate();
}

/* =========== COMPONENT =========== */
export default function Section2_7Details({ name, value, onChange }: Props) {
    // ✅ ใช้ state ภายในเพื่อให้ติ๊ก/พิมพ์ได้ทันที
    const [rows, setRows] = React.useState<Record<string, SectionSevenRow>>({});
    const [meta, setMetaState] = React.useState<SectionSevenMeta>({});

    React.useEffect(() => {
        setRows(value?.rows ?? {});
    }, [value?.rows]);

    React.useEffect(() => {
        setMetaState(value?.meta ?? {});
    }, [value?.meta]);

    const emitRow = React.useCallback(
        (id: string, patch: Partial<SectionSevenRow>) => {
            setRows((prev) => {
                const next = { ...(prev[id] ?? {}), ...patch };
                const all = { ...prev, [id]: next };
                onChange?.({ rows: { [id]: next } } as Partial<SectionSevenForm>);
                return all;
            });
        },
        [onChange]
    );

    const emitMeta = React.useCallback(
        (patch: Partial<SectionSevenMeta>) => {
            setMetaState((prev) => {
                const next = { ...prev, ...patch };
                onChange?.({ meta: next } as Partial<SectionSevenForm>);
                return next;
            });
        },
        [onChange]
    );

    const emitMetaDate = React.useCallback(
        (key: keyof SectionSevenMeta, patch: any) => {
            setMetaState((prev) => {
                const next = { ...prev, [key]: patch };
                onChange?.({ meta: next } as Partial<SectionSevenForm>);
                return next;
            });
        },
        [onChange]
    );

    const toggleStatus = (id: string, s: "ok" | "ng") => {
        const cur = rows[id]?.status;
        emitRow(id, { status: cur === s ? undefined : s });
    };

    const toggleFixed = (id: string) => {
        emitRow(id, { fixed: !rows[id]?.fixed });
    };

    // โทนสี/เส้นตามรูป
    const headBlue = "bg-[#4f79c8] text-white";
    const stripe = "bg-[#d8e0f2]";
    const td = "border border-black px-2 py-2 align-middle text-gray-900";
    const th = "border border-black px-2 py-2 font-semibold";
    const leftNoBlue = "bg-[#4f79c8] text-white font-semibold";

    return (
        <section className="space-y-6 text-gray-900 p-2">
            {/* ======= ตารางสรุปผล ======= */}
            <div className="border border-black overflow-hidden">
                <table className="w-full border-collapse text-sm">
                    <thead>
                        <tr className={headBlue}>
                            <th className={`${th} w-[70px] text-center`}>ลำดับที่</th>
                            <th className={`${th} text-center`}>รายการตรวจสอบ</th>
                            <th className={`${th} w-[70px] text-center`}>ใช้ได้</th>
                            <th className={`${th} w-[80px] text-center`}>ใช้ไม่ได้</th>
                            <th className={`${th} w-[110px] text-center`}>มีการแก้ไขแล้ว</th>
                            <th className={`${th} w-[260px] text-center`}>หมายเหตุ</th>
                        </tr>
                    </thead>

                    <tbody>
                        {SUMMARY_ROWS.map((r, idx) => {
                            const row = rows[r.id] ?? {};
                            const isStripe = idx % 2 === 0;

                            return (
                                <tr key={r.id} className={isStripe ? stripe : "bg-white"}>
                                    <td className={`${td} ${leftNoBlue} text-center`}>{r.no ? r.no : ""}</td>

                                    <td className={td}>
                                        <div className={["leading-snug", r.indent ? "pl-6" : ""].join(" ")}>{r.label}</div>
                                    </td>

                                    <td className={`${td} text-center`}>
                                        <div className="flex justify-center">
                                            <CheckTick checked={row.status === "ok"} onChange={() => toggleStatus(r.id, "ok")} />
                                        </div>
                                    </td>

                                    <td className={`${td} text-center`}>
                                        <div className="flex justify-center">
                                            <CheckTick checked={row.status === "ng"} onChange={() => toggleStatus(r.id, "ng")} />
                                        </div>
                                    </td>

                                    <td className={`${td} text-center`}>
                                        <div className="flex justify-center">
                                            <CheckTick checked={!!row.fixed} onChange={() => toggleFixed(r.id)} />
                                        </div>
                                    </td>

                                    <td className={td}>
                                        <DottedInput
                                            className="w-full"
                                            value={row.note ?? ""}
                                            onChange={(e) => emitRow(r.id, { note: e.target.value })}
                                        />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* ======= รายละเอียดเพิ่มเติม ======= */}
            <div className="text-sm">
                <div className="flex items-center gap-2">
                    <span className="font-semibold">รายละเอียดเพิ่มเติม :</span>
                    <div className="flex-1">
                        <DottedInput
                            className="w-full"
                            value={rows["extra"]?.extra ?? ""}
                            onChange={(e) => emitRow("extra", { extra: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            {/* ======= กล่องลายเซ็น (ฟ้า) ======= */}
            <div className="border border-black overflow-hidden">
                <table className="w-full border-collapse text-sm">
                    <tbody>
                        <tr className={headBlue}>
                            <td className="border border-black px-3 py-2 font-semibold" colSpan={4}></td>
                        </tr>

                        <tr className={stripe}>
                            <td className="border border-black px-3 py-3 text-right w-[240px] font-semibold">ลงลายมือชื่อ</td>
                            <td className="border border-black px-3 py-3 w-[260px]">
                                <DottedInput
                                    className="w-full text-center"
                                    value={meta.inspectorName ?? ""}
                                    onChange={(e) => emitMeta({ inspectorName: e.target.value })}
                                />
                            </td>
                            <td className="border border-black px-3 py-3 text-left font-semibold">เจ้าของป้าย หรือผู้ดูแลป้าย</td>
                            <td className="border border-black px-3 py-3 w-[240px]">
                                <DottedInput
                                    className="w-full text-center"
                                    value={meta.ownerName ?? ""}
                                    onChange={(e) => emitMeta({ ownerName: e.target.value })}
                                />
                            </td>
                        </tr>

                        <tr className={stripe}>
                            <td className="border border-black px-3 py-3 text-right w-[240px] font-semibold">วัน เดือน ปี ที่ตรวจ</td>
                            <td className="border border-black px-3 py-3 w-[260px] text-center">
                                <div className="flex items-center justify-center gap-2">
                                    <select
                                        className="w-12 text-center bg-transparent border-0 border-b border-dashed border-gray-700 focus:outline-none focus:ring-0 cursor-pointer"
                                        value={meta.inspectDate?.d ?? ""}
                                        onChange={(e) => emitMetaDate("inspectDate", { ...(meta.inspectDate ?? {}), d: e.target.value })}
                                    >
                                        <option value="" disabled></option>
                                        {Array.from({ length: getDaysInMonthThai(meta.inspectDate?.y, meta.inspectDate?.m as any) }, (_, i) => {
                                            const d = String(i + 1);
                                            return <option key={d} value={d}>{d}</option>;
                                        })}
                                    </select>

                                    <select
                                        className="w-28 text-center bg-transparent border-0 border-b border-dashed border-gray-700 focus:outline-none focus:ring-0 cursor-pointer"
                                        value={meta.inspectDate?.m ?? ""}
                                        onChange={(e) => {
                                            const m = e.target.value as ThaiMonth | "";
                                            const maxDay = getDaysInMonthThai(meta.inspectDate?.y, m);
                                            const d = meta.inspectDate?.d ? Math.min(Number(meta.inspectDate.d), maxDay) : "";
                                            emitMetaDate("inspectDate", { ...(meta.inspectDate ?? {}), m, d: d ? String(d) : "" });
                                        }}
                                    >
                                        <option value="" disabled></option>
                                        {THAI_MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
                                    </select>

                                    <select
                                        className="w-20 text-center bg-transparent border-0 border-b border-dashed border-gray-700 focus:outline-none focus:ring-0 cursor-pointer"
                                        value={meta.inspectDate?.y ?? ""}
                                        onChange={(e) => {
                                            const y = e.target.value;
                                            const maxDay = getDaysInMonthThai(y, meta.inspectDate?.m as any);
                                            const d = meta.inspectDate?.d ? Math.min(Number(meta.inspectDate.d), maxDay) : "";
                                            emitMetaDate("inspectDate", { ...(meta.inspectDate ?? {}), y, d: d ? String(d) : "" });
                                        }}
                                    >
                                        <option value="" disabled></option>
                                        {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                </div>
                            </td>
                            <td className="border border-black px-3 py-3" />
                            <td className="border border-black px-3 py-3" />
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>
    );
}
