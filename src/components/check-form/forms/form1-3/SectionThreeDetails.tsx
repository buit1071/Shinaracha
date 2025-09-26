import * as React from "react";

/* ========================== SECTION THREE (Light) ========================== */
export type FreqKey = "2w" | "1m" | "4m" | "6m" | "1y";
const FREQUENCIES: { key: FreqKey; label: string }[] = [
    { key: "2w", label: "2 สัปดาห์" },
    { key: "1m", label: "1 เดือน" },
    { key: "4m", label: "4 เดือน" },
    { key: "6m", label: "6 เดือน" },
    { key: "1y", label: "1 ปี" },
];

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

const RadioTick: React.FC<{
    name: string;
    checked: boolean;
    onChange: () => void;
    disabled?: boolean;
}> = ({ name, checked, onChange, disabled }) => (
    <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        aria-checked={checked}
        className={[
            "appearance-none",
            "h-5 w-5 rounded-[4px] border border-gray-400 bg-white",
            "relative before:content-['✓'] before:text-white before:text-[14px]",
            "before:absolute before:inset-0 before:flex before:items-center before:justify-center",
            "before:opacity-0",
            "checked:bg-red-600 checked:border-red-600 checked:before:opacity-100",
            "cursor-pointer focus:outline-none focus:ring-0",
            disabled ? "opacity-50 cursor-not-allowed" : "",
        ].join(" ")}
    />
);

export type SectionThreeRow = {
    freq?: FreqKey;   // ความถี่ที่เลือก
    note?: string;    // หมายเหตุ (คอลัมน์ขวาสุด)
    extra?: string;   // ช่อง "โปรดระบุ" (เฉพาะบางแถว)
};

export type SectionThreeForm = {
    section1: Record<string, SectionThreeRow>; // key = "s1-1", "s1-2", ...
    section2: Record<string, SectionThreeRow>; // key = "s2-<title>-<index>" (ของคุณเดิม)
};

type Props = {
    value?: Partial<SectionThreeForm>;
    onChange?: (patch: Partial<SectionThreeForm>) => void;
};

export default function SectionThreeDetails({ value, onChange }: Props) {
    const td = "border border-gray-300 px-2 py-2 align-top text-gray-900";
    const th = "border border-gray-300 px-3 py-2 text-gray-700";
    const TOTAL_COLS = FREQUENCIES.length + 3;

    const section1Rows = [
        "การต่อเติม ดัดแปลง ปรับปรุงขนาดของป้าย",
        "การเปลี่ยนแปลงน้ำหนักของแผ่นป้าย",
        "การเปลี่ยนแปลงสภาพการใช้งานของป้าย",
        "การเปลี่ยนแปลงวัสดุของป้าย",
        "การชำรุดสึกหรอของป้า",
        "การวิบัติของสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย",
        "การทรุดตัวของฐานรากของสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย (กรณีป้ายที่ตั้งบนพื้นดิน)",
        "การเชื่อมยึดระหว่างแผ่นป้ายกับสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย  การเชื่อมยึดระหว่างชิ้นส่วนต่าง ๆ ของสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้ายและการเชื่อมยึดระหว่าง  สิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้ายกับฐานรากหรืออาคาร",
    ];

    type RowItem = string | { label: string; inlineInput?: boolean };

    const section2Groups: { title: string; rows: RowItem[] }[] = [
        {
            title: "1. ระบบไฟฟ้าแสงสว่าง",
            rows: [
                "สภาพสายไฟฟ้า",
                "สภาพท่อร้อยสาย รางเดินสาย และรางเคเบิล",
                "สภาพเครื่องป้องกันกระแสเกิน",
                "สภาพเครื่องตัดไฟรั่ว",
                "การต่อลงดินของบริภัณฑ์ ตัวนำต่อลงดิน และความต่อเนื่องลงดินของท่อร้อยสาย รางเดินสาย รางเคเบิล",
            ],
        },
        {
            title: "2. ระบบไฟฟ้าควบคุม/อาณัติสัญญาณ (ถ้ามี)",
            rows: ["ตรวจสอบระบบตัวนำล่อฟ้า ตัวนำต่อลงดิน", "ตรวจสอบระบบรากสายดิน", "ตรวจสอบจุดต่อประสานศักย์"],
        },
        {
            title: "3. ระบบอุปกรณ์ประกอบอื่น ๆ (ถ้ามี)",
            rows: ["สภาพบันไดขึ้นลง", "สภาพราวจับ และราวกันตก", { label: "อุปกรณ์ประกอบอื่นตามที่เห็นสมควร (ระบุ)", inlineInput: true }],
        },
    ];

    const [freq, setFreq] = React.useState<Record<string, FreqKey | undefined>>({});
    const [note, setNote] = React.useState<Record<string, string>>({});
    const [extra, setExtra] = React.useState<Record<string, string>>({});

    React.useEffect(() => {
        const f: Record<string, FreqKey | undefined> = {};
        const n: Record<string, string> = {};
        const e: Record<string, string> = {};
        Object.entries(value?.section1 ?? {}).forEach(([id, row]) => {
            if (row.freq) f[id] = row.freq;
            if (row.note) n[id] = row.note;
            if (row.extra) e[id] = row.extra;
        });
        Object.entries(value?.section2 ?? {}).forEach(([id, row]) => {
            if (row.freq) f[id] = row.freq;
            if (row.note) n[id] = row.note;
            if (row.extra) e[id] = row.extra;
        });
        setFreq(f);
        setNote(n);
        setExtra(e);
    }, [value?.section1, value?.section2]);

    const emit = React.useCallback(
        (group: "section1" | "section2", rowId: string, delta: Partial<SectionThreeRow>) => {
            if (!onChange) return;

            // รวมค่าปัจจุบันของแถวนี้จาก local state ทั้ง 3 ฟิลด์
            const current: SectionThreeRow = {
                freq: freq[rowId],
                note: note[rowId] ?? "",
                extra: extra[rowId] ?? "",
            };

            // merge แล้วส่งออก (กันพาเรนต์เขียนทับค่าเดิมหาย)
            onChange({
                [group]: {
                    [rowId]: { ...current, ...delta },
                },
            } as Partial<SectionThreeForm>);
        },
        [onChange, freq, note, extra] // <-- ต้องใส่ใน deps ด้วย
    );

    const FreqCells: React.FC<{ group: "section1" | "section2"; rowId: string }> = ({ group, rowId }) => (
        <>
            {FREQUENCIES.map((f) => (
                <td key={f.key} className={`${td} text-center`}>
                    <RadioTick
                        name={`freq-${rowId}`}
                        checked={freq[rowId] === f.key}
                        onChange={() => {
                            setFreq((p) => ({ ...p, [rowId]: f.key }));
                            emit(group, rowId, { freq: f.key });
                        }}
                    />
                </td>
            ))}
        </>
    );
    return (
        <section className="space-y-8 text-gray-900 p-2">
            {/* ตารางที่ 1 */}
            <div>
                <div className="text-base font-semibold mb-2">
                    1. ความถี่ในการตรวจสภาพโครงสร้างป้ายกับความมั่นคงแข็งแรงของป้าย
                </div>
                <table className="w-full text-sm border border-gray-300 bg-white">
                    <thead className="bg-gray-100">
                        <tr>
                            <th rowSpan={2} className={`${th} w-14 text-center`}>ลำดับ</th>
                            <th rowSpan={2} className={`${th} text-left`}>รายการตรวจสอบ/วิธีทำ</th>
                            <th colSpan={FREQUENCIES.length} className={`${th} text-center`}>ความถี่ในการตรวจสอบ</th>
                            <th rowSpan={2} className={`${th} w-48 text-center`}>หมายเหตุ</th>
                        </tr>
                        <tr>
                            {FREQUENCIES.map((f) => (
                                <th key={f.key} className={`${th} w-24 text-center`}>{f.label}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {section1Rows.map((txt, i) => {
                            const rowId = `s1-${i + 1}`;
                            return (
                                <tr key={rowId} className="odd:bg-white even:bg-gray-50">
                                    <td className={`${td} text-center`}>{i + 1}</td>
                                    <td className={td}>{txt}</td>
                                    <FreqCells group="section1" rowId={rowId} />
                                    <td className={td}>
                                        <DottedInput
                                            className="w-full"
                                            value={note[rowId] ?? ""}
                                            onChange={(e) => {
                                                const v = e.currentTarget.value;
                                                setNote((p) => ({ ...p, [rowId]: v }));
                                                emit("section1", rowId, { note: v });
                                            }}
                                        />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* ตารางที่ 2 */}
            <div>
                <div className="text-base font-semibold mb-2">
                    2. ความถี่ในการตรวจสภาพระบบอุปกรณ์ประกอบต่าง ๆ ของป้าย
                </div>
                <table className="w-full text-sm border border-gray-300 bg-white">
                    <thead className="bg-gray-100">
                        <tr>
                            <th rowSpan={2} className={`${th} w-14 text-center`}>ลำดับ</th>
                            <th rowSpan={2} className={`${th} text-left`}>รายการตรวจสอบ/วิธีทำ</th>
                            <th colSpan={FREQUENCIES.length} className={`${th} text-center`}>ความถี่ในการตรวจสอบ</th>
                            <th rowSpan={2} className={`${th} w-48 text-center`}>หมายเหตุ</th>
                        </tr>
                        <tr>
                            {FREQUENCIES.map((f) => (
                                <th key={f.key} className={`${th} w-24 text-center`}>{f.label}</th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>
                        {section2Groups.map((g) => (
                            <React.Fragment key={g.title}>
                                {/* ✅ แถวหัวข้อ: ไม่มีคอลัมน์ลำดับ, merge cell ทั้งแถว และใส่พื้นหลังเข้มขึ้น */}
                                <tr>
                                    <td colSpan={TOTAL_COLS}
                                        className="px-3 py-2 border border-gray-300 bg-gray-200 font-semibold text-gray-900">
                                        {g.title}
                                    </td>
                                </tr>

                                {/* แถวรายการภายใต้หัวข้อ */}
                                {g.rows.map((row, i) => {
                                    const rowId = `s2-${g.title}-${i + 1}`;
                                    return (
                                        <tr key={rowId} className="odd:bg-white even:bg-gray-50">
                                            <td className={`${td} text-center`}>{i + 1}</td>

                                            {/* ✅ ถ้าเป็น inlineInput ให้โชว์ช่องเส้นปะต่อท้ายข้อความ */}
                                            <td className={td}>
                                                {typeof row === "string" ? (
                                                    row
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <span>{row.label}</span>
                                                        {row.inlineInput && (
                                                            <DottedInput
                                                                className="flex-1 min-w-[220px]"
                                                                placeholder="โปรดระบุ"
                                                                value={extra[rowId] ?? ""}
                                                                onChange={(e) => {
                                                                    const v = e.currentTarget.value;
                                                                    setExtra((p) => ({ ...p, [rowId]: v }));
                                                                    emit("section2", rowId, { extra: v });
                                                                }}
                                                            />
                                                        )}
                                                    </div>
                                                )}
                                            </td>

                                            <FreqCells group="section2" rowId={rowId} />
                                            <td className={td}>
                                                <DottedInput
                                                    className="w-full"
                                                    value={note[rowId] ?? ""}
                                                    onChange={(e) => {
                                                        const v = e.currentTarget.value;
                                                        setNote((p) => ({ ...p, [rowId]: v }));
                                                        emit("section2", rowId, { note: v });
                                                    }}
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
