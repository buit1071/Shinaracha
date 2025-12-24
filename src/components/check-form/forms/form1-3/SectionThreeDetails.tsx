import * as React from "react";

/* ========================== TYPES ========================== */
export type UseStatus = "ok" | "ng" | ""; // ใช้ได้ / ใช้ไม่ได้

export type SectionThreeRow = {
    // 2 checkbox ด้านบน (เลือกได้อย่างเดียว)
    noChecked?: boolean; // ไม่พบ...
    hasChecked?: boolean; // มี...

    // รายละเอียดด้านล่าง (เมื่อเลือก hasChecked)
    detail1?: string;
    detail2?: string;

    // ความเห็นของผู้ตรวจสอบ
    status?: UseStatus; // ok/ng
    inspector1?: string;
    inspector2?: string;

    // อื่น ๆ
    otherChecked?: boolean;
    other1?: string;
    other2?: string;
};

export type YesNo = "yes" | "no" | "";
export type OkNg = "ok" | "ng" | "";

export type Section8Row = {
    exist?: YesNo; // มี / ไม่มี
    wear?: YesNo; // การชำรุดสึกหรอ มี / ไม่มี
    damage?: YesNo; // ความเสียหาย มี / ไม่มี
    stability?: OkNg; // ความมั่นคงผู้ตรวจสอบ ใช้ได้ / ใช้ไม่ได้
    note?: string; // หมายเหตุ
    labelExtra?: string; // สำหรับ "อื่น ๆ (โปรดระบุ)"
};

export type Section9Row = {
    exist?: YesNo;
    wear?: YesNo;
    damage?: YesNo;
    stability?: OkNg;
    note?: string;
    labelExtra?: string;
};

/** ✅ ใช้ชื่อเดิมเพื่อให้หน้าอื่นไม่แตก */
export type SectionThreeForm = {
    items: Record<string, SectionThreeRow>; // key: "s3-1".."s3-7"
    section8?: Record<string, Section8Row>;
    section9?: Record<string, Section9Row>;
    section9Extra1?: string; // รายละเอียดเพิ่มเติม บรรทัด 1
    section9Extra2?: string; // รายละเอียดเพิ่มเติม บรรทัด 2
};

type Props = {
    value?: Partial<SectionThreeForm>;
    onChange?: (patch: Partial<SectionThreeForm>) => void;
};

/* ========================== HELPERS ========================== */
const DottedInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({
    className = "",
    ...props
}) => (
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

const TwoLines: React.FC<{
    v1: string;
    v2: string;
    on1: (v: string) => void;
    on2: (v: string) => void;
    disabled?: boolean;
}> = ({ v1, v2, on1, on2, disabled }) => (
    <div className="space-y-2">
        <DottedInput
            className="w-full"
            value={v1}
            disabled={disabled}
            onChange={(e) => on1(e.currentTarget.value)}
        />
        <DottedInput
            className="w-full"
            value={v2}
            disabled={disabled}
            onChange={(e) => on2(e.currentTarget.value)}
        />
    </div>
);

/* ========================== CONFIG TEXT (1-7) ========================== */
type TopChoiceText = {
    title: string;
    noText: React.ReactNode;
    hasText: React.ReactNode;
    note?: string;
};

const ITEMS_1_7: TopChoiceText[] = [
    {
        title:
            "การตรวจสอบการต่อเติมดัดแปลงปรับปรุงขนาดของป้ายหรือสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย",
        noText: <>ไม่พบการต่อเติม ดัดแปลงปรับปรุงขนาด</>,
        hasText: (
            <>
                มีการต่อเติม ดัดแปลง ปรับปรุงขนาดของป้าย (หากระบุว่า ‘มี’ ให้บันทึกรายละเอียดด้านล่าง)
            </>
        ),
    },
    {
        title: "การตรวจสอบการเปลี่ยนแปลงน้ำหนักของแผ่นป้าย",
        noText: <>ไม่พบการเปลี่ยนแปลงน้ำหนัก</>,
        hasText: <>มีการเปลี่ยนแปลงน้ำหนัก (หากระบุว่า ‘มี’ ให้บันทึกรายละเอียดด้านล่าง)</>,
    },
    {
        title: "การตรวจสอบการเปลี่ยนแปลงวัสดุของป้ายหรือสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย",
        noText: <>ไม่พบการเปลี่ยนแปลงวัสดุ</>,
        hasText: <>มีการเปลี่ยนแปลงวัสดุ (หากระบุว่า ‘มี’ ให้บันทึกรายละเอียดด้านล่าง)</>,
    },
    {
        title: "การตรวจสอบการชำรุดสึกหรอของป้ายหรือสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย",
        noText: <>ไม่พบการชำรุดสึกหรอ</>,
        hasText: <>มีการชำรุดสึกหรอ (หากระบุว่า ‘มี’ ให้บันทึกรายละเอียดด้านล่าง)</>,
    },
    {
        title: "การตรวจสอบการวิบัติของสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย",
        noText: <>ไม่พบการวิบัติ **</>,
        hasText: <>มีการวิบัติ (หากระบุว่า ‘มี’ ให้บันทึกรายละเอียดด้านล่าง)</>,
        note:
            "การวิบัติ หมายถึง การชำรุดของสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย ซึ่งมากจนป้ายนั้นไม่สามารถจะใช้งานตามวัตถุประสงค์ได้โดยปลอดภัย",
    },
    {
        title:
            "การตรวจสอบความมั่นคงแข็งแรงของโครงสร้างและฐานรากของสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย (กรณีป้ายที่ติดตั้งบนพื้นดิน)",
        noText: <>ไม่พบการทรุดตัว **</>,
        hasText: <>มีการทรุดตัว (หากระบุว่า ‘มี’ ให้บันทึกรายละเอียดด้านล่าง)</>,
        note: "การทรุดตัว หมายถึง การยุบตัวลงของโครงสร้างและฐานรากของสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย",
    },
    {
        title:
            "การตรวจสอบความมั่นคงแข็งแรงของอาคารที่ติดตั้งป้าย (กรณีป้ายบนหลังคา หรือบนดาดฟ้าอาคาร หรือบนส่วนหนึ่งส่วนใดของอาคาร)",
        noText: <>ไม่พบการทรุดตัว **</>,
        hasText: <>มีการทรุดตัว (หากระบุว่า ‘มี’ ให้บันทึกรายละเอียดด้านล่าง)</>,
        note: "การทรุดตัว หมายถึง การยุบตัวลงของอาคารที่ติดตั้งป้าย",
    },
];

export default function SectionThreeDetails({ value, onChange }: Props) {
    /* -------------------- 1-7 -------------------- */
    const [items, setItems] = React.useState<Record<string, SectionThreeRow>>({});

    React.useEffect(() => {
        setItems(value?.items ?? {});
    }, [value?.items]);

    const emit = React.useCallback(
        (id: string, delta: Partial<SectionThreeRow>) => {
            const next = { ...(items[id] ?? {}), ...delta };
            setItems((p) => ({ ...p, [id]: next }));
            onChange?.({ items: { [id]: next } } as Partial<SectionThreeForm>);
        },
        [items, onChange]
    );

    const setTopChoice = (id: string, which: "no" | "has", checked: boolean) => {
        const row = items[id] ?? {};
        if (which === "no") {
            emit(id, {
                noChecked: checked,
                hasChecked: checked ? false : row.hasChecked,
                detail1: checked ? "" : row.detail1,
                detail2: checked ? "" : row.detail2,
            });
        } else {
            emit(id, {
                hasChecked: checked,
                noChecked: checked ? false : row.noChecked,
                detail1: checked ? row.detail1 ?? "" : "",
                detail2: checked ? row.detail2 ?? "" : "",
            });
        }
    };

    const setStatus = (id: string, status: UseStatus, checked: boolean) => {
        emit(id, { status: checked ? status : "" });
    };

    /* -------------------- 8 -------------------- */
    const [section8State, setSection8State] = React.useState<Record<string, Section8Row>>({});

    const emit8 = React.useCallback(
        (rowId: string, delta: Partial<Section8Row>) => {
            const next = { ...(section8State[rowId] ?? {}), ...delta };
            setSection8State((p) => ({ ...p, [rowId]: next }));
            onChange?.({ section8: { [rowId]: next } } as Partial<SectionThreeForm>);
        },
        [section8State, onChange]
    );

    const setYesNo8 = React.useCallback(
        (rowId: string, key: "exist" | "wear" | "damage", val: YesNo, checked: boolean) => {
            emit8(rowId, { [key]: checked ? val : "" } as Pick<Section8Row, typeof key>);
        },
        [emit8]
    );

    const setOkNg8 = React.useCallback(
        (rowId: string, val: OkNg, checked: boolean) => {
            emit8(rowId, { stability: checked ? val : "" });
        },
        [emit8]
    );

    /* -------------------- 9 -------------------- */
    const [section9State, setSection9State] = React.useState<Record<string, Section9Row>>({});
    const [section9Extra1, setSection9Extra1] = React.useState(value?.section9Extra1 ?? "");
    const [section9Extra2, setSection9Extra2] = React.useState(value?.section9Extra2 ?? "");

    React.useEffect(() => {
        setSection8State(value?.section8 ?? {});
        setSection9State(value?.section9 ?? {});
        setSection9Extra1(value?.section9Extra1 ?? "");
        setSection9Extra2(value?.section9Extra2 ?? "");
    }, [value?.section8, value?.section9, value?.section9Extra1, value?.section9Extra2]);

    const emit9 = React.useCallback(
        (rowId: string, delta: Partial<Section9Row>) => {
            const next = { ...(section9State[rowId] ?? {}), ...delta };
            setSection9State((p) => ({ ...p, [rowId]: next }));
            onChange?.({ section9: { [rowId]: next } } as Partial<SectionThreeForm>);
        },
        [section9State, onChange]
    );

    const setYesNo9 = React.useCallback(
        (rowId: string, key: "exist" | "wear" | "damage", val: YesNo, checked: boolean) => {
            emit9(rowId, { [key]: checked ? val : "" } as Pick<Section9Row, typeof key>);
        },
        [emit9]
    );

    const setOkNg9 = React.useCallback(
        (rowId: string, val: OkNg, checked: boolean) => {
            emit9(rowId, { stability: checked ? val : "" });
        },
        [emit9]
    );

    return (
        <section className="space-y-4 p-2 text-gray-900">
            {/* ข้อความด้านบน */}
            <div className="space-y-2 text-sm leading-relaxed">
                <div>
                    ส่วนที่ 3 เป็นผลการตรวจสอบสภาพป้าย สิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย และอุปกรณ์ต่าง ๆ ของป้ายตามที่ตรวจสอบได้ด้วยสายตา
                    หรือตรวจพร้อมกับใช้เครื่องมือวัดพื้นฐาน เช่น ตลับเมตร เป็นต้น หรือเครื่องมือชนิดพกพาเท่านั้น จะไม่รวมถึงการทดสอบที่ใช้เครื่องมือพิเศษเฉพาะ
                </div>
                <div>
                    การตรวจสอบป้าย สิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย และอุปกรณ์ประกอบต่าง ๆ ของป้าย ผู้ตรวจสอบจะต้องพิจารณาตามหลักเกณฑ์
                    หรือมาตรฐานที่ได้กำหนดไว้ในกฎหมายว่าด้วยการควบคุมอาคาร หรือกฎหมายอื่นที่เกี่ยวข้องที่ใช้บังคับอยู่ในขณะที่มีการก่อสร้างป้ายนั้น
                    และคำนึงถึงหลักเกณฑ์ หรือมาตรฐานความปลอดภัยของสถาบันทางราชการ สภาวิศวกร หรือสภาสถาปนิก
                </div>
                <div className="pt-1 text-base font-semibold">รายการที่ตรวจสอบ</div>
            </div>

            {/* 1-7 */}
            {ITEMS_1_7.map((cfg, idx) => {
                const no = idx + 1;
                const id = `s3-${no}`;
                const row = items[id] ?? {};

                return (
                    <div key={id} className="border border-gray-400 bg-white">
                        <div className="border-b border-gray-400 bg-gray-200 px-3 py-2">
                            <div className="text-sm font-semibold leading-snug">
                                {no}. {cfg.title}
                            </div>
                        </div>

                        <div className="bg-gray-50 px-3 py-3 space-y-3">
                            <label className="flex items-start gap-2 text-sm leading-snug">
                                <input
                                    type="checkbox"
                                    className="h-4 w-4 mt-0.5"
                                    checked={!!row.noChecked}
                                    onChange={(e) => setTopChoice(id, "no", e.target.checked)}
                                />
                                <span>{cfg.noText}</span>
                            </label>

                            <div className="space-y-2">
                                <label className="flex items-start gap-2 text-sm leading-snug">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 mt-0.5"
                                        checked={!!row.hasChecked}
                                        onChange={(e) => setTopChoice(id, "has", e.target.checked)}
                                    />
                                    <span>{cfg.hasText}</span>
                                </label>

                                <TwoLines
                                    disabled={!row.hasChecked}
                                    v1={row.detail1 ?? ""}
                                    v2={row.detail2 ?? ""}
                                    on1={(v) => emit(id, { detail1: v })}
                                    on2={(v) => emit(id, { detail2: v })}
                                />
                            </div>

                            <div className="border-t border-gray-300" />

                            <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-2 items-start">
                                <div className="text-sm font-medium">ความเห็นของผู้ตรวจสอบ</div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-10">
                                        <label className="flex items-center gap-2 text-sm select-none">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4"
                                                checked={(row.status ?? "") === "ok"}
                                                onChange={(e) => setStatus(id, "ok", e.target.checked)}
                                            />
                                            <span>ใช้ได้</span>
                                        </label>

                                        <label className="flex items-center gap-2 text-sm select-none">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4"
                                                checked={(row.status ?? "") === "ng"}
                                                onChange={(e) => setStatus(id, "ng", e.target.checked)}
                                            />
                                            <span>ใช้ไม่ได้</span>
                                        </label>
                                    </div>

                                    <TwoLines
                                        v1={row.inspector1 ?? ""}
                                        v2={row.inspector2 ?? ""}
                                        on1={(v) => emit(id, { inspector1: v })}
                                        on2={(v) => emit(id, { inspector2: v })}
                                    />
                                </div>
                            </div>

                            <div className="border-t border-gray-300" />

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm select-none">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4"
                                        checked={!!row.otherChecked}
                                        onChange={(e) => {
                                            const v = e.target.checked;
                                            emit(id, {
                                                otherChecked: v,
                                                other1: v ? row.other1 ?? "" : "",
                                                other2: v ? row.other2 ?? "" : "",
                                            });
                                        }}
                                    />
                                    <span>อื่น ๆ (โปรดระบุ)</span>
                                </label>

                                <TwoLines
                                    disabled={!row.otherChecked}
                                    v1={row.other1 ?? ""}
                                    v2={row.other2 ?? ""}
                                    on1={(v) => emit(id, { other1: v })}
                                    on2={(v) => emit(id, { other2: v })}
                                />
                            </div>

                            {cfg.note && (
                                <div className="pt-1 text-xs text-gray-700 leading-relaxed">
                                    <span className="font-semibold">หมายเหตุ: </span>
                                    {cfg.note}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}

            {/* ========================== ข้อ 8 ========================== */}
            {(() => {
                const td = "border border-gray-400 px-2 py-2 align-middle";
                const thBase = "border border-gray-400 px-2 py-2 font-semibold text-center";
                const thNoBottom = `${thBase} border-b-0`;
                const thNoTop = `${thBase} border-t-0`;

                const renderItemLabel = (rowId: string, text: string) => {
                    const isOther = text.includes("อื่น ๆ (โปรดระบุ)");
                    if (!isOther) return <span>{text}</span>;

                    const v = section8State[rowId] ?? {};
                    return (
                        <div className="flex items-center gap-2">
                            <span>- อื่น ๆ (โปรดระบุ)</span>
                            <input
                                className="flex-1 bg-transparent border-0 border-b border-dashed border-black/40 focus:outline-none focus:ring-0 px-1"
                                value={v.labelExtra ?? ""}
                                onChange={(e) => emit8(rowId, { labelExtra: e.currentTarget.value })}
                            />
                        </div>
                    );
                };

                type RowCfg =
                    | { type: "group"; groupNo: "(1)" | "(2)"; label: string }
                    | { type: "subgroup"; label: string }
                    | { type: "item"; id: string; label: string };

                const ROWS: RowCfg[] = [
                    { type: "group", groupNo: "(1)", label: "สิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย" },
                    { type: "item", id: "s8-1-foundation", label: "- ฐานราก" },
                    {
                        type: "item",
                        id: "s8-1-anchor",
                        label: "- การเชื่อมยึดของสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้ายกับฐานรากหรืออาคาร",
                    },
                    { type: "item", id: "s8-1-part", label: "- ชิ้นส่วน" },

                    { type: "subgroup", label: "- รอยต่อ" },
                    { type: "item", id: "s8-1-bolt", label: "- สลักเกลียว" },
                    { type: "item", id: "s8-1-weld", label: "- การเชื่อม" },
                    { type: "item", id: "s8-1-joint-other", label: "- อื่น ๆ (โปรดระบุ)" },

                    { type: "item", id: "s8-1-sling", label: "- สลิง หรือสายยึด" },
                    { type: "item", id: "s8-1-ladder", label: "- บันไดขึ้นลง" },
                    { type: "item", id: "s8-1-rail", label: "- ราวจับ หรือราวกันตก" },
                    { type: "item", id: "s8-1-catwalk", label: "- CATWALK" },
                    { type: "item", id: "s8-1-other", label: "- อื่น ๆ (โปรดระบุ)" },

                    { type: "group", groupNo: "(2)", label: "แผ่นป้าย" },
                    { type: "item", id: "s8-2-panel", label: "- สภาพของแผ่นป้าย" },
                    { type: "item", id: "s8-2-fix", label: "- สภาพการยึดติดกับโครงสร้างป้าย" },
                    { type: "item", id: "s8-2-other", label: "- อื่น ๆ (โปรดระบุ)" },
                ];

                return (
                    <div className="mt-4 border border-gray-400">
                        <div className="bg-blue-700 text-white font-semibold px-3 py-2 text-sm">
                            8. การตรวจสอบการเชื่อมยึดระหว่างแผ่นป้ายกับสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย การเชื่อมยึดระหว่างชิ้นส่วนต่าง ๆ ของสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย
                            และการเชื่อมยึดระหว่างสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้ายกับฐานรากหรืออาคาร
                        </div>

                        <table className="w-full text-sm border-collapse">
                            <thead>
                                {/* ✅ แถวบน: ไม่มีหัวข้อ "มี" อันแรก + ปิดเส้น row เฉพาะคู่ มี/ไม่มี (exist) */}
                                <tr className="bg-gray-200">
                                    <th rowSpan={2} className={`${thBase} w-[70px]`}>
                                        ลำดับที่
                                    </th>
                                    <th rowSpan={2} className={`${thBase} text-left`}>
                                        รายการ
                                    </th>

                                    {/* ✅ ช่องบนของ "มี/ไม่มี" (exist) แยก 2 ช่อง เพื่อให้เส้นตั้ง (col) ต่อเนื่อง แต่ปิดเส้นล่าง */}
                                    <th className={`${thNoBottom} w-[55px]`}></th>
                                    <th className={`${thNoBottom} w-[65px]`}></th>

                                    <th colSpan={2} className={thBase}>
                                        การชำรุดสึกหรอ
                                    </th>
                                    <th colSpan={2} className={thBase}>
                                        ความเสียหาย
                                    </th>
                                    <th colSpan={2} className={thBase}>
                                        ความมั่นคงผู้ตรวจสอบ
                                    </th>

                                    <th rowSpan={2} className={`${thBase} w-[180px]`}>
                                        หมายเหตุ
                                    </th>
                                </tr>

                                {/* ✅ แถวล่าง: "มี/ไม่มี" exist ไม่มีเส้นบน (border-t-0) ตามรูปที่ 2 */}
                                <tr className="bg-gray-200">
                                    <th className={`${thNoTop} w-[55px]`}>มี</th>
                                    <th className={`${thNoTop} w-[65px]`}>ไม่มี</th>

                                    <th className={`${thBase} w-[55px]`}>มี</th>
                                    <th className={`${thBase} w-[65px]`}>ไม่มี</th>

                                    <th className={`${thBase} w-[55px]`}>มี</th>
                                    <th className={`${thBase} w-[65px]`}>ไม่มี</th>

                                    <th className={`${thBase} w-[70px]`}>ใช้ได้</th>
                                    <th className={`${thBase} w-[80px]`}>ใช้ไม่ได้</th>
                                </tr>
                            </thead>

                            <tbody>
                                {ROWS.map((r, idx) => {
                                    if (r.type === "group") {
                                        return (
                                            <tr key={`g8-${idx}`} className="bg-gray-100">
                                                <td className={`${td} text-center font-semibold`}>{r.groupNo}</td>
                                                <td className={`${td} font-semibold`} colSpan={9}>
                                                    {r.label}
                                                </td>
                                                <td className={td}></td>
                                            </tr>
                                        );
                                    }

                                    if (r.type === "subgroup") {
                                        return (
                                            <tr key={`sg8-${idx}`} className="bg-gray-50">
                                                <td className={td}></td>
                                                <td className={`${td} font-semibold`} colSpan={9}>
                                                    {r.label}
                                                </td>
                                                <td className={td}></td>
                                            </tr>
                                        );
                                    }

                                    const v = section8State[r.id] ?? {};

                                    return (
                                        <tr key={r.id} className="odd:bg-white even:bg-gray-50">
                                            <td className={`${td} text-center`}></td>
                                            <td className={td}>{renderItemLabel(r.id, r.label)}</td>

                                            {/* exist */}
                                            <td className={`${td} text-center`}>
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4"
                                                    checked={(v.exist ?? "") === "yes"}
                                                    onChange={(e) => setYesNo8(r.id, "exist", "yes", e.target.checked)}
                                                />
                                            </td>
                                            <td className={`${td} text-center`}>
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4"
                                                    checked={(v.exist ?? "") === "no"}
                                                    onChange={(e) => setYesNo8(r.id, "exist", "no", e.target.checked)}
                                                />
                                            </td>

                                            {/* wear */}
                                            <td className={`${td} text-center`}>
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4"
                                                    checked={(v.wear ?? "") === "yes"}
                                                    onChange={(e) => setYesNo8(r.id, "wear", "yes", e.target.checked)}
                                                />
                                            </td>
                                            <td className={`${td} text-center`}>
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4"
                                                    checked={(v.wear ?? "") === "no"}
                                                    onChange={(e) => setYesNo8(r.id, "wear", "no", e.target.checked)}
                                                />
                                            </td>

                                            {/* damage */}
                                            <td className={`${td} text-center`}>
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4"
                                                    checked={(v.damage ?? "") === "yes"}
                                                    onChange={(e) => setYesNo8(r.id, "damage", "yes", e.target.checked)}
                                                />
                                            </td>
                                            <td className={`${td} text-center`}>
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4"
                                                    checked={(v.damage ?? "") === "no"}
                                                    onChange={(e) => setYesNo8(r.id, "damage", "no", e.target.checked)}
                                                />
                                            </td>

                                            {/* stability */}
                                            <td className={`${td} text-center`}>
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4"
                                                    checked={(v.stability ?? "") === "ok"}
                                                    onChange={(e) => setOkNg8(r.id, "ok", e.target.checked)}
                                                />
                                            </td>
                                            <td className={`${td} text-center`}>
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4"
                                                    checked={(v.stability ?? "") === "ng"}
                                                    onChange={(e) => setOkNg8(r.id, "ng", e.target.checked)}
                                                />
                                            </td>

                                            {/* note */}
                                            <td className={td}>
                                                <input
                                                    className="w-full bg-transparent border-0 border-b border-dashed border-black/40 focus:outline-none focus:ring-0"
                                                    value={v.note ?? ""}
                                                    onChange={(e) => emit8(r.id, { note: e.currentTarget.value })}
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                );
            })()}

            {/* ========================== ข้อ 9 ========================== */}
            {(() => {
                const td = "border border-gray-400 px-2 py-2 align-middle";
                const thBase = "border border-gray-400 px-2 py-2 font-semibold text-center";
                const thNoBottom = `${thBase} border-b-0`;
                const thNoTop = `${thBase} border-t-0`;

                type RowCfg9 =
                    | { type: "group"; groupNo: "(1)" | "(2)" | "(3)"; label: string }
                    | { type: "item"; id: string; label: string };

                const ROWS9: RowCfg9[] = [
                    { type: "group", groupNo: "(1)", label: "ระบบไฟฟ้าแสงสว่าง และระบบไฟฟ้ากำลัง" },
                    { type: "item", id: "s9-1-lamp", label: "- โคมไฟฟ้า หรือหลอดไฟ" },
                    { type: "item", id: "s9-1-conduit", label: "- ท่อร้อยสาย" },
                    { type: "item", id: "s9-1-control", label: "- อุปกรณ์ควบคุม" },
                    { type: "item", id: "s9-1-ground", label: "- การต่อลงดิน" },
                    { type: "item", id: "s9-1-maint", label: "- ตรวจบันทึกการบำรุงรักษา พาหนะบำรุงรักษาตามเวลาที่กำหนด" },
                    { type: "item", id: "s9-1-other", label: "- อื่น ๆ (โปรดระบุ)" },

                    { type: "group", groupNo: "(2)", label: "ระบบป้องกันฟ้าผ่า (ถ้ามี)" },
                    { type: "item", id: "s9-2-air", label: "- ตัวนำล่อฟ้า" },
                    { type: "item", id: "s9-2-down", label: "- ตัวนำต่อลงดิน" },
                    { type: "item", id: "s9-2-earth", label: "- รากสายดิน" },
                    { type: "item", id: "s9-2-bond", label: "- จุดต่อประสานศักย์" },
                    { type: "item", id: "s9-2-maint", label: "- ตรวจบันทึกการบำรุงรักษา พาหนะบำรุงรักษาตามเวลาที่กำหนด" },
                    { type: "item", id: "s9-2-other", label: "- อื่น ๆ (โปรดระบุ)" },

                    { type: "group", groupNo: "(3)", label: "ระบบอุปกรณ์ประกอบอื่น ๆ (ถ้ามี)" },
                    { type: "item", id: "s9-3-sling", label: "- สลิง หรือสายยึด" },
                    { type: "item", id: "s9-3-ladder", label: "- บันไดขึ้นลง" },
                    { type: "item", id: "s9-3-rail", label: "- ราวจับ หรือราวกันตก" },
                    { type: "item", id: "s9-3-catwalk", label: "- CATWALK" },
                    { type: "item", id: "s9-3-other", label: "- อื่น ๆ (โปรดระบุ)" },
                ];

                const renderItemLabel9 = (rowId: string, text: string) => {
                    const isOther = text.includes("อื่น ๆ (โปรดระบุ)");
                    if (!isOther) return <span>{text}</span>;

                    const v = section9State[rowId] ?? {};
                    return (
                        <div className="flex items-center gap-2">
                            <span>- อื่น ๆ (โปรดระบุ)</span>
                            <input
                                className="flex-1 bg-transparent border-0 border-b border-dashed border-black/40 focus:outline-none focus:ring-0 px-1"
                                value={v.labelExtra ?? ""}
                                onChange={(e) => emit9(rowId, { labelExtra: e.currentTarget.value })}
                            />
                        </div>
                    );
                };

                return (
                    <div className="mt-4 border border-gray-400">
                        <div className="bg-blue-700 text-white font-semibold px-3 py-2 text-sm">
                            9. การตรวจสอบอุปกรณ์ประกอบต่าง ๆ ของป้าย
                        </div>

                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="bg-gray-200">
                                    <th rowSpan={2} className={`${thBase} w-[70px]`}>
                                        ลำดับที่
                                    </th>
                                    <th rowSpan={2} className={`${thBase} text-left`}>
                                        รายการ
                                    </th>

                                    {/* ✅ ปิดเส้น row เฉพาะคู่ "มี/ไม่มี" แรก (exist) เหมือนข้อ 8 */}
                                    <th className={`${thNoBottom} w-[55px]`}></th>
                                    <th className={`${thNoBottom} w-[65px]`}></th>

                                    <th colSpan={2} className={thBase}>
                                        การชำรุดสึกหรอ
                                    </th>
                                    <th colSpan={2} className={thBase}>
                                        ความเสียหาย
                                    </th>
                                    <th colSpan={2} className={thBase}>
                                        ความมั่นคงผู้ตรวจสอบ
                                    </th>

                                    <th rowSpan={2} className={`${thBase} w-[180px]`}>
                                        หมายเหตุ
                                    </th>
                                </tr>

                                <tr className="bg-gray-200">
                                    <th className={`${thNoTop} w-[55px]`}>มี</th>
                                    <th className={`${thNoTop} w-[65px]`}>ไม่มี</th>

                                    <th className={`${thBase} w-[55px]`}>มี</th>
                                    <th className={`${thBase} w-[65px]`}>ไม่มี</th>

                                    <th className={`${thBase} w-[55px]`}>มี</th>
                                    <th className={`${thBase} w-[65px]`}>ไม่มี</th>

                                    <th className={`${thBase} w-[70px]`}>ใช้ได้</th>
                                    <th className={`${thBase} w-[80px]`}>ใช้ไม่ได้</th>
                                </tr>
                            </thead>

                            <tbody>
                                {ROWS9.map((r, idx) => {
                                    if (r.type === "group") {
                                        return (
                                            <tr key={`g9-${idx}`} className="bg-gray-100">
                                                <td className={`${td} text-center font-semibold`}>{r.groupNo}</td>
                                                <td className={`${td} font-semibold`} colSpan={9}>
                                                    {r.label}
                                                </td>
                                                <td className={td}></td>
                                            </tr>
                                        );
                                    }

                                    const v = section9State[r.id] ?? {};

                                    return (
                                        <tr key={r.id} className="odd:bg-white even:bg-gray-50">
                                            <td className={`${td} text-center`}></td>
                                            <td className={td}>{renderItemLabel9(r.id, r.label)}</td>

                                            {/* exist */}
                                            <td className={`${td} text-center`}>
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4"
                                                    checked={(v.exist ?? "") === "yes"}
                                                    onChange={(e) => setYesNo9(r.id, "exist", "yes", e.target.checked)}
                                                />
                                            </td>
                                            <td className={`${td} text-center`}>
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4"
                                                    checked={(v.exist ?? "") === "no"}
                                                    onChange={(e) => setYesNo9(r.id, "exist", "no", e.target.checked)}
                                                />
                                            </td>

                                            {/* wear */}
                                            <td className={`${td} text-center`}>
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4"
                                                    checked={(v.wear ?? "") === "yes"}
                                                    onChange={(e) => setYesNo9(r.id, "wear", "yes", e.target.checked)}
                                                />
                                            </td>
                                            <td className={`${td} text-center`}>
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4"
                                                    checked={(v.wear ?? "") === "no"}
                                                    onChange={(e) => setYesNo9(r.id, "wear", "no", e.target.checked)}
                                                />
                                            </td>

                                            {/* damage */}
                                            <td className={`${td} text-center`}>
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4"
                                                    checked={(v.damage ?? "") === "yes"}
                                                    onChange={(e) => setYesNo9(r.id, "damage", "yes", e.target.checked)}
                                                />
                                            </td>
                                            <td className={`${td} text-center`}>
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4"
                                                    checked={(v.damage ?? "") === "no"}
                                                    onChange={(e) => setYesNo9(r.id, "damage", "no", e.target.checked)}
                                                />
                                            </td>

                                            {/* stability */}
                                            <td className={`${td} text-center`}>
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4"
                                                    checked={(v.stability ?? "") === "ok"}
                                                    onChange={(e) => setOkNg9(r.id, "ok", e.target.checked)}
                                                />
                                            </td>
                                            <td className={`${td} text-center`}>
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4"
                                                    checked={(v.stability ?? "") === "ng"}
                                                    onChange={(e) => setOkNg9(r.id, "ng", e.target.checked)}
                                                />
                                            </td>

                                            {/* note */}
                                            <td className={td}>
                                                <input
                                                    className="w-full bg-transparent border-0 border-b border-dashed border-black/40 focus:outline-none focus:ring-0"
                                                    value={v.note ?? ""}
                                                    onChange={(e) => emit9(r.id, { note: e.currentTarget.value })}
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        {/* รายละเอียดเพิ่มเติม */}
                        <div className="px-3 py-3 bg-white border-t border-gray-300">
                            <div className="text-sm font-semibold mb-2">รายละเอียดเพิ่มเติม</div>
                            <div className="space-y-2">
                                <DottedInput
                                    className="w-full"
                                    value={section9Extra1}
                                    onChange={(e) => {
                                        const v = e.currentTarget.value;
                                        setSection9Extra1(v);
                                        onChange?.({ section9Extra1: v } as Partial<SectionThreeForm>);
                                    }}
                                />
                                <DottedInput
                                    className="w-full"
                                    value={section9Extra2}
                                    onChange={(e) => {
                                        const v = e.currentTarget.value;
                                        setSection9Extra2(v);
                                        onChange?.({ section9Extra2: v } as Partial<SectionThreeForm>);
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                );
            })()}
        </section>
    );
}
