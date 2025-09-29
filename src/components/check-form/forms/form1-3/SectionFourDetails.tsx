import * as React from "react";

/* ========= CONFIG ========= */
export type VisitKey = "v1";
const VISITS: { key: VisitKey; label: string }[] = [{ key: "v1", label: "ครั้งที่ 1" }];

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

// ปุ่มผลลัพธ์: ✓ สีขาวพื้นแดง (exclusive ต่อแถว)
const CheckTick: React.FC<{ checked: boolean; onChange: () => void; disabled?: boolean }> = ({
    checked,
    onChange,
    disabled,
}) => (
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

/* ========= DATA ========= */
type RowItem = string | { label: string; inlineInput?: boolean };

const table1Rows: RowItem[] = [
    "การต่อเติม ตัดแปลง ปรับปรุงบำรุงรักษา",
    "การเปลี่ยนแปลงน้ำหนักรวมบนป้าย",
    "การเปลี่ยนสภาพการใช้งานของป้าย",
    "การเปลี่ยนแปลงวัสดุของป้าย",
    "การตรวจรอยสึกหรอของป้าย",
    "การบังคับยึดของสิ่งที่ส่วนที่ยื่นติดหรือสัมผัสป้ายและจุดยึดเหนี่ยว",
    { label: "การซ่อม/ดัดแปลงส่วนที่มีผลต่อความมั่นคง (ระบุข้อกำหนด/มาตรฐาน)", inlineInput: true },
];

const table2Groups: { title: string; rows: RowItem[] }[] = [
    {
        title: "1 ระบบไฟฟ้าแสงสว่าง",
        rows: [
            "สภาพหลอดไฟฟ้า",
            "ตู้คอนโทรล/สายไฟ/อุปกรณ์",
            "สลักกุญแจ/บันทึกการเปิดตู้",
            "อุปกรณ์ป้องกัน (RCD/MCCB ฯลฯ)",
            "สายดิน/จุดต่อกราวด์",
            "งานเดินสาย/การรัดยึด",
            "ระบบตั้งเวลา/เปิด–ปิดอัตโนมัติ",
            { label: "อื่น ๆ (โปรดระบุ)", inlineInput: true },
        ],
    },
    {
        title: "2 ระบบไฟฟ้าควบคุม/อาณัติสัญญาณ (ถ้ามี)",
        rows: ["หน่วยควบคุม/จอแสดงผล", "เซนเซอร์/ระบบตรวจจับ", "ระบบป้องกันไฟกระชาก)"],
    },
    {
        title: "3 ระบบอุปกรณ์ประกอบอื่น ๆ (ถ้ามี)",
        rows: ["อุปกรณ์ยึดกันลม", "อุปกรณ์กันนก/สัตว์รบกวน", { label: "อุปกรณ์ประกอบอื่นที่เห็นสมควร (ระบุ)", inlineInput: true }],
    },
];

export type SectionFourRow = {
    visits?: Partial<Record<VisitKey, "ok" | "ng" | undefined>>; // สถานะต่อ visit
    note?: string;
    extra?: string;
};

export type SectionFourForm = {
    table1: Record<string, SectionFourRow>; // key: t1-1, t1-2, ...
    table2: Record<string, SectionFourRow>; // key: t2-<groupIndex>-<rowIndex>
};

type Props = {
    value?: Partial<SectionFourForm>;
    onChange?: (patch: Partial<SectionFourForm>) => void;
};

/* ========= COMPONENT ========= */
export default function SectionFourDetails({ value, onChange }: Props) {
    type RowState = { status?: "ok" | "ng"; note?: string; extra?: string };
    const [state, setState] = React.useState<Record<string, RowState>>({});

    const td = "border border-gray-300 px-2 py-2 align-top text-gray-900";
    const th = "border border-gray-300 px-3 py-2 text-gray-700";
    const TOTAL_COLS = 2 + VISITS.length * 2 + 1;

    const v1 = value?.table1 ?? {};
    const v2 = value?.table2 ?? {};

    const emit = React.useCallback(
        (group: "table1" | "table2", rowId: string, delta: Partial<SectionFourRow>) => {
            if (!onChange) return;
            onChange({ [group]: { [rowId]: delta } } as Partial<SectionFourForm>);
        },
        [onChange]
    );

    const toggle = (group: "table1" | "table2", rowId: string, visit: VisitKey, next: "ok" | "ng") => {
        const row = group === "table1" ? v1[rowId] : v2[rowId];
        const cur = row?.visits?.[visit];
        const nextVal: "ok" | "ng" | undefined = cur === next ? undefined : next;
        emit(group, rowId, { visits: { ...(row?.visits ?? {}), [visit]: nextVal } });
    };

    const VisitHeader = () => (
        <>
            <th rowSpan={2} className={`${th} w-14 text-center`}>ลำดับ</th>
            <th rowSpan={2} className={`${th} text-left`}>รายการตรวจสอบ</th>
            {VISITS.map((v) => (
                <th key={v.key} colSpan={2} className={`${th} text-center w-40`}>{v.label}</th>
            ))}
            <th rowSpan={2} className={`${th} w-56 text-center`}>หมายเหตุ</th>
        </>
    );

    const SubHeader = () => (
        <>
            {VISITS.map((v) => (
                <React.Fragment key={`sub-${v.key}`}>
                    <th className={`${th} text-center w-20`}>ใช้ได้</th>
                    <th className={`${th} text-center w-20`}>ใช้ไม่ได้</th>
                </React.Fragment>
            ))}
        </>
    );

    const ResultCells: React.FC<{ group: "table1" | "table2"; id: string }> = ({ group, id }) => {
        const row = group === "table1" ? v1[id] : v2[id];
        return (
            <>
                {VISITS.map((v) => (
                    <React.Fragment key={`${id}-${v.key}`}>
                        <td className={`${td} text-center`}>
                            <CheckTick checked={row?.visits?.[v.key] === "ok"} onChange={() => toggle(group, id, v.key, "ok")} />
                        </td>
                        <td className={`${td} text-center`}>
                            <CheckTick checked={row?.visits?.[v.key] === "ng"} onChange={() => toggle(group, id, v.key, "ng")} />
                        </td>
                    </React.Fragment>
                ))}
            </>
        );
    };

    return (
        <section className="space-y-8 text-gray-900 p-2">
            {/* ========= ตารางที่ 1 ========= */}
            <div>
                <div className="font-semibold mb-2">1. การตรวจสอบความมั่นคงแข็งแรงของป้าย</div>
                <table className="w-full text-sm border border-gray-300 bg-white">
                    <thead className="bg-gray-100">
                        <tr><VisitHeader /></tr>
                        <tr><SubHeader /></tr>
                    </thead>
                    <tbody>
                        {table1Rows.map((row, i) => {
                            const id = `t1-${i + 1}`;
                            const text = typeof row === "string" ? row : row.label;
                            const inline = typeof row !== "string" && row.inlineInput;
                            const r = v1[id] ?? {};
                            return (
                                <tr key={id} className="odd:bg-white even:bg-gray-50">
                                    <td className={`${td} text-center`}>{i + 1}</td>
                                    <td className={td}>
                                        <span>{text}</span>
                                        {inline && (
                                            <DottedInput
                                                className="ml-2 min-w-[220px]"
                                                placeholder="โปรดระบุ"
                                                value={r.extra ?? ""}
                                                onChange={(e) => emit("table1", id, { extra: e.target.value })}
                                            />
                                        )}
                                    </td>
                                    <ResultCells group="table1" id={id} />
                                    <td className={td}>
                                        <DottedInput
                                            className="w-full"
                                            placeholder="ระบุหมายเหตุ (ถ้ามี)"
                                            value={r.note ?? ""}
                                            onChange={(e) => emit("table1", id, { note: e.target.value })}
                                        />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* ========= ตารางที่ 2 ========= */}
            <div>
                <div className="font-semibold mb-2">2. การตรวจสอบบำรุงรักษาระบบและอุปกรณ์ประกอบต่าง ๆ ของป้าย</div>
                <table className="w-full text-sm border border-gray-300 bg-white">
                    <thead className="bg-gray-100">
                        <tr><VisitHeader /></tr>
                        <tr><SubHeader /></tr>
                    </thead>
                    <tbody>
                        {table2Groups.map((g, gi) => (
                            <React.Fragment key={g.title}>
                                {/* แถวหัวข้อย่อย */}
                                <tr>
                                    <td colSpan={TOTAL_COLS} className="px-3 py-2 border border-gray-300 bg-gray-200 font-semibold">
                                        {`${gi + 1}. ${g.title}`}
                                    </td>
                                </tr>

                                {g.rows.map((row, i) => {
                                    const id = `t2-${gi + 1}-${i + 1}`;
                                    const text = typeof row === "string" ? row : row.label;
                                    const inline = typeof row !== "string" && row.inlineInput;
                                    const r = v2[id] ?? {};
                                    return (
                                        <tr key={id} className="odd:bg-white even:bg-gray-50">
                                            <td className={`${td} text-center`}>{i + 1}</td>
                                            <td className={td}>
                                                <span>{text}</span>
                                                {inline && (
                                                    <DottedInput
                                                        className="ml-2 min-w-[220px]"
                                                        placeholder="โปรดระบุ"
                                                        value={r.extra ?? ""}
                                                        onChange={(e) => emit("table2", id, { extra: e.target.value })}
                                                    />
                                                )}
                                            </td>
                                            <ResultCells group="table2" id={id} />
                                            <td className={td}>
                                                <DottedInput
                                                    className="w-full"
                                                    placeholder="ระบุหมายเหตุ (ถ้ามี)"
                                                    value={r.note ?? ""}
                                                    onChange={(e) => emit("table2", id, { note: e.target.value })}
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
