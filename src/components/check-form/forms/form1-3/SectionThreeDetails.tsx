import * as React from "react";

/* ========================== SECTION THREE (Light) ========================== */
type FreqKey = "2w" | "1m" | "4m" | "6m" | "1y";
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
            // ซ่อนรูปร่างเดิม
            "appearance-none",
            // กล่องให้เหมือน checkbox
            "h-5 w-5 rounded-[4px] border border-gray-400 bg-white",
            // ทำเครื่องหมาย ✓ ด้วย pseudo-element
            "relative before:content-['✓'] before:text-white before:text-[14px]",
            "before:absolute before:inset-0 before:flex before:items-center before:justify-center",
            "before:opacity-0",
            // เมื่อเลือก → พื้นแดง ขอบแดง และโชว์ ✓ สีขาว
            "checked:bg-red-600 checked:border-red-600 checked:before:opacity-100",
            // โฮเวอร์/โฟกัส
            "cursor-pointer focus:outline-none focus:ring-0",
            disabled ? "opacity-50 cursor-not-allowed" : ""
        ].join(" ")}
    />
);

export default function SectionThreeDetails() {
    const [freq, setFreq] = React.useState<Record<string, FreqKey | undefined>>({});
    const td = "border border-gray-300 px-2 py-2 align-top text-gray-900";
    const th = "border border-gray-300 px-3 py-2 text-gray-700";
    const TOTAL_COLS = FREQUENCIES.length + 3;

    const FreqCells: React.FC<{ rowId: string }> = ({ rowId }) => (
        <>
            {FREQUENCIES.map((f) => (
                <td key={f.key} className={`${td} text-center`}>
                    <RadioTick
                        name={`freq-${rowId}`}
                        checked={freq[rowId] === f.key}
                        onChange={() => setFreq((p) => ({ ...p, [rowId]: f.key }))}
                    />
                </td>
            ))}
        </>
    );

    const section1Rows = [
        "การซ่อมแซม, ติดตั้งและปรับปรุงบำรุงรักษา",
        "การเปลี่ยนแปลงน้ำหนักรวมบนป้าย",
        "การเปลี่ยนแปลงส่วนประกอบสำคัญ",
        "การตรวจสอบรอยเชื่อม/สลักเกลียว",
        "การยึด-ค้ำยันโครงสร้าง",
        "การป้องกันสนิม/สีทนสนิม/สังกะสี (ถ้ามี)",
        "การเก็บกวาด/สิ่งกีดขวางรอบฐานป้าย",
        "การซ่อม/ดัดแปลงส่วนที่มีผลต่อความมั่นคง (ระบุข้อกำหนด/มาตรฐาน)",
    ];

    type RowItem = string | { label: string; inlineInput?: boolean };

    const section2Groups: { title: string; rows: RowItem[] }[] = [
        {
            title: "1. ระบบไฟฟ้าแสงสว่าง",
            rows: [
                "สภาพหลอดไฟ",
                "ตู้คอนโทรล/สายไฟ/อุปกรณ์",
                "สลักกุญแจ/บันทึกการเปิดตู้",
                "อุปกรณ์ป้องกัน (RCD/MCCB ฯลฯ)",
                "สายดิน/จุดต่อกราวด์",
                "งานเดินสาย/การรัดยึด",
                "ระบบตั้งเวลา/เปิด-ปิดอัตโนมัติ",
                { label: "อื่น ๆ (โปรดระบุ)", inlineInput: true }, // ✅ พิมพ์ได้
            ],
        },
        {
            title: "2. ระบบไฟฟ้าควบคุม/อาณัติสัญญาณ (ถ้ามี)",
            rows: [
                "หน่วยควบคุม/จอแสดงผล",
                "เซนเซอร์/ระบบตรวจจับ",
                "ระบบป้องกันไฟกระชาก",
            ],
        },
        {
            title: "3. ระบบอุปกรณ์ประกอบอื่น ๆ (ถ้ามี)",
            rows: [
                "อุปกรณ์ยึดกันลม",
                "อุปกรณ์กันนก/สัตว์รบกวน",
                { label: "อุปกรณ์ประกอบอื่นที่เห็นสมควร (ระบุ)", inlineInput: true }, // ✅ พิมพ์ได้
            ],
        },
    ];

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
                                    <FreqCells rowId={rowId} />
                                    <td className={td}><DottedInput className="w-full" /></td>
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
                                                            />
                                                        )}
                                                    </div>
                                                )}
                                            </td>

                                            <FreqCells rowId={rowId} />
                                            <td className={td}><DottedInput className="w-full" /></td>
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
