import * as React from "react";

/* ========================== TYPES ========================== */
export type FreqKey = "1m" | "4m" | "6m" | "1y" | "3y" | "";
export type Section2_5Row = {
    freq?: FreqKey;
    note?: string;
    // สำหรับแถว "อื่น ๆ (โปรดระบุ)" ให้พิมพ์ชื่อรายการเพิ่มได้
    customLabel?: string;
};

export type Section2_5Form = {
    table1: Record<string, Section2_5Row>; // r1..r9
    table2: Record<string, Section2_5Row>; // t2-...
};

type Props = {
    value?: Partial<Section2_5Form>;
    onChange?: (patch: Partial<Section2_5Form>) => void;
};

/* ========================== UI HELPERS ========================== */
const CheckTick: React.FC<{ checked: boolean; onChange: () => void }> = ({ checked, onChange }) => (
    <button
        type="button"
        onClick={onChange}
        className={[
            "h-5 w-5 rounded-[4px] border grid place-items-center",
            checked ? "bg-black border-black" : "bg-white border-gray-400",
            "focus:outline-none",
        ].join(" ")}
        aria-pressed={checked}
    >
        <span className={["text-white text-[14px] leading-none", checked ? "opacity-100" : "opacity-0"].join(" ")}>✓</span>
    </button>
);

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

/* ========================== TABLE 1 CONFIG ========================== */
const FREQS_TABLE1: { key: Exclude<FreqKey, "">; label: string }[] = [
    { key: "1m", label: "1\nเดือน" },
    { key: "4m", label: "4\nเดือน" },
    { key: "6m", label: "6\nเดือน" },
    { key: "1y", label: "1\nปี" },
    { key: "3y", label: "3\nปี" }, // ✅ เพิ่ม
];

type Row1 = { id: string; label: React.ReactNode; defaultFreq?: Exclude<FreqKey, ""> };
const TABLE1_ROWS: Row1[] = [
    { id: "r1", label: <>การต่อเติม ดัดแปลง ปรับปรุงขนาดของป้ายหรือสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย</>, defaultFreq: "1y" },
    { id: "r2", label: <>การเปลี่ยนแปลงน้ำหนักของแผ่นป้าย</>, defaultFreq: "1y" },
    { id: "r3", label: <>การเปลี่ยนสภาพการใช้งานของป้าย</>, defaultFreq: "1y" },
    { id: "r4", label: <>การเปลี่ยนแปลงวัสดุของป้าย หรือสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย</>, defaultFreq: "1y" },
    { id: "r5", label: <>การชำรุดสึกหรอของป้าย หรือสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย</>, defaultFreq: "1y" },
    { id: "r6", label: <>การวิบัติของป้าย หรือสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย</>, defaultFreq: "1y" },
    { id: "r7", label: <>ความมั่นคงแข็งแรงของโครงสร้างและฐานรากของสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย (กรณีป้ายที่ติดตั้งบนพื้นดิน)</>, defaultFreq: "1y" },
    { id: "r8", label: <>ความมั่นคงแข็งแรงของอาคารที่ติดตั้งป้าย (กรณีป้ายบนหลังคา หรือบนดาดฟ้าอาคาร หรือบนส่วนหนึ่งส่วนใดของอาคาร)</>, defaultFreq: "1y" },
    { id: "r9", label: <>การเชื่อมยึดระหว่างแผ่นป้ายกับสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย การเชื่อมยึดระหว่างชิ้นส่วนต่าง ๆ ของสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย และการเชื่อมยึดระหว่างสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้ายกับฐานรากหรืออาคาร</>, defaultFreq: "1y" },
];

/* ========================== TABLE 2 CONFIG (ตามภาพ) ========================== */
const FREQS_TABLE2: { key: Exclude<FreqKey, "">; label: string }[] = [
    { key: "1m", label: "1\nเดือน" },
    { key: "4m", label: "4\nเดือน" },
    { key: "6m", label: "6\nเดือน" },
    { key: "1y", label: "1\nปี" },
    { key: "3y", label: "3\nปี" },
];

// โครงสร้างตามภาพ: มีหัวข้อใหญ่ 1/2/3 แล้วมีรายการย่อย (1)(2)...
type T2Row =
    | { type: "section"; no: string; title: string } // แถวหัวข้อ (เลข 1/2/3 ด้านซ้าย)
    | { type: "item"; id: string; label: React.ReactNode; defaultFreq?: Exclude<FreqKey, "">; indent?: "none" | "sub" }
    | { type: "other"; id: string; prefix?: string; defaultFreq?: Exclude<FreqKey, ""> };

const TABLE2_ROWS: T2Row[] = [
    { type: "section", no: "1", title: "ระบบไฟฟ้าแสงสว่างและระบบไฟฟ้ากำลัง" },
    { type: "item", id: "t2-1-1", label: <>(1) สภาพสายไฟฟ้า</>, defaultFreq: "1y" },
    { type: "item", id: "t2-1-2", label: <>(2) สภาพท่อร้อยสาย รางเดินสาย และรางเคเบิล</>, defaultFreq: "1y" },
    { type: "item", id: "t2-1-3", label: <>(3) สภาพเครื่องป้องกันกระแสเกิน</>, defaultFreq: "1y" },
    { type: "item", id: "t2-1-4", label: <>(4) สภาพเครื่องตัดไฟรั่ว</>, defaultFreq: "1y" },
    {
        type: "item",
        id: "t2-1-5",
        label: (
            <>
                (5) การต่อลงดินของบริภัณฑ์ ตัวนำต่อลงดิน และความต่อเนื่องลงดินของท่อร้อยสาย รางเดินสาย รางเคเบิล
            </>
        ),
        defaultFreq: "1y",
    },

    { type: "section", no: "2", title: "ระบบป้องกันฟ้าผ่า (ถ้ามี)" },
    { type: "item", id: "t2-2-1", label: <>(1) ตรวจสอบระบบตัวนำล่อฟ้า ตัวนำต่อลงดิน</>, defaultFreq: "1y" },
    { type: "item", id: "t2-2-2", label: <>(2) ตรวจสอบระบบรากสายดิน</>, defaultFreq: "1y" },
    { type: "item", id: "t2-2-3", label: <>(3) ตรวจสอบจุดต่อประสานศักย์</>, defaultFreq: "1y" },

    { type: "section", no: "3", title: "ระบบอุปกรณ์ประกอบอื่น ๆ (ถ้ามี)" },
    { type: "item", id: "t2-3-1", label: <>(1) สลิง หรือสายยึด</>, defaultFreq: "1y" },
    { type: "item", id: "t2-3-2", label: <>(2) บันไดขึ้นลง</>, defaultFreq: "1y" },
    { type: "item", id: "t2-3-3", label: <>(3) สภาพราวจับ หรือราวกันตก</>, defaultFreq: "1y" },
    { type: "item", id: "t2-3-4", label: <>(4) สภาพ CATWALK</>, defaultFreq: "1y" },
    // อื่น ๆ (โปรดระบุ) ต้องพิมพ์เพิ่มได้
    { type: "other", id: "t2-3-5", prefix: "- อื่น ๆ (โปรดระบุ)", defaultFreq: "1y" },
];

/* ========================== COMPONENT ========================== */
export default function Section2_5Details({ value, onChange }: Props) {
    const th = "border border-gray-800 px-2 py-2 text-center font-semibold";
    const td = "border border-gray-800 px-2 py-2 align-middle";
    const headBlue = "bg-[#4f79c8] text-white";
    const leftBlue = "bg-[#4f79c8] text-white font-semibold";
    const stripe = "bg-[#d8e0f2]";

    const [table1, setTable1] = React.useState<Record<string, Section2_5Row>>({});
    const [table2, setTable2] = React.useState<Record<string, Section2_5Row>>({});

    // sync จาก value (พร้อม default)
    React.useEffect(() => {
        const init1: Record<string, Section2_5Row> = {};
        TABLE1_ROWS.forEach((r) => {
            const v = value?.table1?.[r.id];
            init1[r.id] = { freq: (v?.freq ?? r.defaultFreq ?? "") as FreqKey, note: v?.note ?? "" };
        });
        Object.entries(value?.table1 ?? {}).forEach(([k, v]) => (init1[k] = { ...(init1[k] ?? {}), ...(v ?? {}) }));
        setTable1(init1);

        const init2: Record<string, Section2_5Row> = {};
        TABLE2_ROWS.forEach((r) => {
            if (r.type === "section") return;
            const v = value?.table2?.[r.id];
            init2[r.id] = {
                freq: (v?.freq ?? r.defaultFreq ?? "") as FreqKey,
                note: v?.note ?? "",
                customLabel: v?.customLabel ?? "",
            };
        });
        Object.entries(value?.table2 ?? {}).forEach(([k, v]) => (init2[k] = { ...(init2[k] ?? {}), ...(v ?? {}) }));
        setTable2(init2);
    }, [value?.table1, value?.table2]);

    const emit = React.useCallback(
        (which: "table1" | "table2", rowId: string, delta: Partial<Section2_5Row>) => {
            if (which === "table1") {
                const next = { ...(table1[rowId] ?? {}), ...delta };
                setTable1((p) => ({ ...p, [rowId]: next }));
                onChange?.({ table1: { [rowId]: next } } as Partial<Section2_5Form>);
            } else {
                const next = { ...(table2[rowId] ?? {}), ...delta };
                setTable2((p) => ({ ...p, [rowId]: next }));
                onChange?.({ table2: { [rowId]: next } } as Partial<Section2_5Form>);
            }
        },
        [table1, table2, onChange]
    );

    const setExclusive = (which: "table1" | "table2", rowId: string, k: Exclude<FreqKey, "">) => {
        const cur = (which === "table1" ? table1[rowId]?.freq : table2[rowId]?.freq) ?? "";
        emit(which, rowId, { freq: cur === k ? "" : k });
    };

    return (
        <section className="p-2 text-gray-900 space-y-6">
            {/* ====================== TABLE 1 ====================== */}
            <div>
                <div className="text-sm font-semibold mb-2">
                    1. ความถี่ในการตรวจบำรุงรักษาป้ายด้านความมั่นคงแข็งแรงของป้ายหรือสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย
                </div>

                <div className="w-full">
                    <table className="w-full border-collapse text-sm table-fixed">
                        <thead>
                            <tr className={headBlue}>
                                <th rowSpan={2} className={`${th} w-[60px]`}>ลำดับ</th>
                                <th rowSpan={2} className={`${th} w-[55%]`}>รายการตรวจบำรุงรักษา</th>
                                <th colSpan={5} className={`${th} w-[25%]`}>ความถี่ในการตรวจสอบ</th>
                                <th rowSpan={2} className={`${th} w-[20%]`}>หมายเหตุ</th>
                            </tr>
                            <tr className={headBlue}>
                                {FREQS_TABLE1.map((f) => (
                                    <th key={f.key} className={`${th} w-[70px]`}>
                                        <div className="leading-tight whitespace-pre-line">{f.label}</div>
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody>
                            {TABLE1_ROWS.map((r, idx) => {
                                const isStripe = idx % 2 === 0;
                                const no = idx + 1;
                                const v = table1[r.id] ?? {};
                                return (
                                    <tr key={r.id} className={isStripe ? stripe : "bg-white"}>
                                        <td className={`${td} text-center ${leftBlue}`}>{no}</td>
                                        <td className={td}><div className="leading-snug">{r.label}</div></td>

                                        {FREQS_TABLE1.map((f) => (
                                            <td key={f.key} className={td}>
                                                <div className="flex items-center justify-center">
                                                    <CheckTick checked={(v.freq ?? "") === f.key} onChange={() => setExclusive("table1", r.id, f.key)} />
                                                </div>
                                            </td>
                                        ))}

                                        <td className={td}>
                                            <DottedInput className="w-full" value={v.note ?? ""} onChange={(e) => emit("table1", r.id, { note: e.currentTarget.value })} />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ====================== TABLE 2 ====================== */}
            <div>
                <div className="text-sm font-semibold mb-2">
                    2. ความถี่ในการตรวจบำรุงรักษาระบบและอุปกรณ์ประกอบของป้าย
                </div>

                <div className="w-full">
                    <table className="w-full border-collapse text-sm table-fixed">
                        <thead>
                            <tr className={headBlue}>
                                <th rowSpan={2} className={`${th} w-[60px]`}>ลำดับ</th>
                                <th rowSpan={2} className={`${th} w-[55%]`}>รายการตรวจบำรุงรักษา</th>
                                <th colSpan={5} className={`${th} w-[25%]`}>ความถี่ในการตรวจสอบ</th>
                                <th rowSpan={2} className={`${th} w-[20%]`}>หมายเหตุ</th>
                            </tr>
                            <tr className={headBlue}>
                                {FREQS_TABLE2.map((f) => (
                                    <th key={f.key} className={`${th} w-[60px]`}>
                                        <div className="leading-tight whitespace-pre-line">{f.label}</div>
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody>
                            {TABLE2_ROWS.map((r, idx) => {
                                const isStripe = idx % 2 === 0;

                                // แถวหัวข้อ section (เลข 1/2/3 ทางซ้าย + merge cell)
                                if (r.type === "section") {
                                    return (
                                        <tr key={`sec-${r.no}`} className={isStripe ? stripe : "bg-white"}>
                                            <td className={`${td} text-center ${leftBlue}`}>{r.no}</td>
                                            <td className={`${td} font-semibold`} colSpan={1 + FREQS_TABLE2.length + 1 /* รายการ + freq(5) + หมายเหตุ */}>
                                                {r.title}
                                            </td>
                                        </tr>
                                    );
                                }

                                const v = table2[r.id] ?? {};
                                const labelIndent = r.type === "item" ? "" : ""; // ยังไม่ต้องย่อพิเศษ (ตามภาพคือบรรทัดเดียว)

                                return (
                                    <tr key={r.id} className={isStripe ? stripe : "bg-white"}>
                                        {/* ลำดับ: แถวลูกให้เว้นว่าง */}
                                        <td className={`${td} text-center ${leftBlue}`}></td>

                                        <td className={td}>
                                            {r.type === "other" ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="whitespace-nowrap">{r.prefix}</span>
                                                    <DottedInput
                                                        className="flex-1 min-w-[240px]"
                                                        placeholder="ระบุ..."
                                                        value={v.customLabel ?? ""}
                                                        onChange={(e) => emit("table2", r.id, { customLabel: e.currentTarget.value })}
                                                    />
                                                </div>
                                            ) : (
                                                <div className={["leading-snug", labelIndent].join(" ")}>{r.label}</div>
                                            )}
                                        </td>

                                        {FREQS_TABLE2.map((f) => (
                                            <td key={f.key} className={td}>
                                                <div className="flex items-center justify-center">
                                                    <CheckTick checked={(v.freq ?? "") === f.key} onChange={() => setExclusive("table2", r.id, f.key)} />
                                                </div>
                                            </td>
                                        ))}

                                        <td className={td}>
                                            <DottedInput
                                                className="w-full"
                                                value={v.note ?? ""}
                                                onChange={(e) => emit("table2", r.id, { note: e.currentTarget.value })}
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
}
