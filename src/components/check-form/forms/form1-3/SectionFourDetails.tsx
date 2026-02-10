import * as React from "react";
import Select from "react-select";

/* ========================== UI HELPERS ========================== */
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
        <span className={["text-white text-[14px] leading-none", checked ? "opacity-100" : "opacity-0"].join(" ")}>
            ✓
        </span>
    </button>
);

/* ========================== TYPES ========================== */
export type SummaryStatus = "ok" | "ng" | "none" | ""; // ok=ใช้ได้, ng=ใช้ไม่ได้, none=มีการแก้ไขแล้ว
export type MinorMajor = "minor" | "major" | "";

export type SectionFourSummaryRow = {
    status?: SummaryStatus;
    note?: string; // หมายเหตุ
};

export type SectionFourOpinion = {
    companyName?: string; // บริษัท...
    signOwner?: string; // ป้ายของ...
    signType?: string; // ป้าย...
    majorFix?: string; // (เฉพาะ Major) แก้ไขในเรื่อง...

    // ลงชื่อ/ชื่อพิมพ์ ผู้ตรวจสอบ
    inspectorSign?: string; // ช่อง “ลงชื่อ ....”
    inspectorPrintedName?: string; // ชื่อในวงเล็บใต้ลายเซ็น

    // วันที่
    day?: string;
    month?: string;
    year?: string;

    // เลขทะเบียนผู้ตรวจสอบ
    regNo?: string;
    regFrom?: string;
    regBy?: string;
    regAddress?: string;

    // เจ้าของป้าย
    ownerSign?: string; // ช่อง “ลงชื่อ ....” (เจ้าของป้าย)
    ownerName?: string; // ชื่อในวงเล็บใต้ลายเซ็นเจ้าของป้าย
};

export type SectionFourForm = {
    summary?: Record<"row1" | "row2" | "row3" | "row4" | "row5", SectionFourSummaryRow>;
    severity?: MinorMajor; // minor/major
    opinion?: SectionFourOpinion;
};

type Props = {
    value?: Partial<SectionFourForm>;
    onChange?: (patch: Partial<SectionFourForm>) => void;
};

/* ========================== COMPONENT ========================== */
export default function SectionFourDetails({ value, onChange }: Props) {
    /* ---------- style tokens (ตามรูป) ---------- */
    const th = "border border-gray-800 px-2 py-2 text-center font-semibold";
    const td = "border border-gray-800 px-2 py-2 align-middle";
    const tdCenter = "border border-gray-800 px-2 py-2 align-middle text-center";
    const headBlue = "bg-[#7fa1d9]"; // ฟ้าอ่อนหัวตารางสรุป
    const stripe = "bg-[#d8e0f2]"; // แถวสลับ
    const opinionHead = "bg-[#4f79c8]"; // หัวข้อ “สรุปความเห็นผู้ตรวจสอบ”

    /* ---------- summary rows ---------- */
    const SUMMARY_ROWS: { key: "row1" | "row2" | "row3" | "row4" | "row5"; no: number; label: string }[] = [
        { key: "row1", no: 1, label: "สิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย" },
        { key: "row2", no: 2, label: "แผ่นป้าย" },
        { key: "row3", no: 3, label: "ระบบไฟฟ้าแสงสว่างและระบบไฟฟ้ากำลัง" },
        { key: "row4", no: 4, label: "ระบบป้องกันฟ้าผ่า (ถ้ามี)" },
        { key: "row5", no: 5, label: "ระบบอุปกรณ์ประกอบอื่น (ถ้ามี)" },
    ];

    /* ---------- local state + sync ---------- */
    const [summary, setSummary] = React.useState<Record<string, SectionFourSummaryRow>>(value?.summary ?? {});
    const [severity, setSeverity] = React.useState<MinorMajor>(value?.severity ?? "");
    const [opinion, setOpinion] = React.useState<SectionFourOpinion>({
        inspectorPrintedName: "ร้อยโท วโรดม สุจริตกุล", // default ตามรูป (แก้ได้)
        ...(value?.opinion ?? {}),
    });

    React.useEffect(() => setSummary(value?.summary ?? {}), [value?.summary]);
    React.useEffect(() => setSeverity(value?.severity ?? ""), [value?.severity]);
    React.useEffect(() => {
        setOpinion((prev) => ({
            inspectorPrintedName: prev.inspectorPrintedName ?? "ร้อยโท วโรดม สุจริตกุล",
            ...(value?.opinion ?? {}),
        }));
    }, [value?.opinion]);

    /* ---------- emit helpers (ส่ง patch ให้ parent merge) ---------- */
    const emitSummary = React.useCallback(
        (rowKey: "row1" | "row2" | "row3" | "row4" | "row5", delta: Partial<SectionFourSummaryRow>) => {
            const next = { ...(summary[rowKey] ?? {}), ...delta };
            setSummary((p) => ({ ...p, [rowKey]: next }));
            onChange?.({ summary: { [rowKey]: next } } as Partial<SectionFourForm>);
        },
        [summary, onChange]
    );

    const setExclusive = (rowKey: "row1" | "row2" | "row3" | "row4" | "row5", status: SummaryStatus) => {
        const cur = summary[rowKey]?.status ?? "";
        emitSummary(rowKey, { status: cur === status ? "" : status });
    };

    const emitOpinion = (delta: Partial<SectionFourOpinion>) => {
        const next = { ...(opinion ?? {}), ...delta };
        setOpinion(next);
        onChange?.({ opinion: next } as Partial<SectionFourForm>);
    };

    const SEVERITY_OPTIONS = [
        { value: "minor", label: "Minor" },
        { value: "major", label: "Major" },
    ] as const;

    const selectedSeverity = SEVERITY_OPTIONS.find((o) => o.value === severity) ?? null;

    const THAI_MONTHS = [
        "มกราคม",
        "กุมภาพันธ์",
        "มีนาคม",
        "เมษายน",
        "พฤษภาคม",
        "มิถุนายน",
        "กรกฎาคม",
        "สิงหาคม",
        "กันยายน",
        "ตุลาคม",
        "พฤศจิกายน",
        "ธันวาคม",
    ];

    const currentThaiYear = new Date().getFullYear() + 543;
    const YEAR_START = 2400;
    const YEAR_END = currentThaiYear + 20;
    const YEARS = Array.from(
        { length: YEAR_END - YEAR_START + 1 },
        (_, i) => String(YEAR_START + i)
    );

    return (
        <section className="p-2 text-gray-900">
            {/* ===================== ตารางสรุปผลการตรวจสอบ ===================== */}
            <div className="w-full">
                <table className="w-full border-collapse text-sm">
                    <thead>
                        <tr className={headBlue}>
                            <th colSpan={6} className="border border-gray-800 px-3 py-2 text-left font-semibold">
                                สรุปผลการตรวจสอบป้ายหรือสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย และอุปกรณ์ประกอบของป้าย
                            </th>
                        </tr>

                        <tr className="bg-gray-100">
                            <th className={`${th} w-[60px]`}>ลำดับ</th>
                            <th className={`${th} text-left`}>รายการตรวจสอบ</th>
                            <th className={`${th} w-[70px]`}>ใช้ได้</th>
                            <th className={`${th} w-[80px]`}>ใช้ไม่ได้</th>
                            <th className={`${th} w-[110px]`}>มีการแก้ไขแล้ว</th>
                            <th className={`${th} w-[220px]`}>หมายเหตุ</th>
                        </tr>
                    </thead>

                    <tbody>
                        {SUMMARY_ROWS.map((r, idx) => {
                            const v = summary[r.key] ?? {};
                            const isStripe = idx % 2 === 1;

                            return (
                                <tr key={r.key} className={isStripe ? stripe : "bg-white"}>
                                    <td className={`${td} text-center`}>{r.no}</td>

                                    <td className={td}>
                                        <span className="font-medium">{r.label}</span>
                                    </td>

                                    <td className={tdCenter}>
                                        <div className="flex justify-center items-center">
                                            <CheckTick checked={(v.status ?? "") === "ok"} onChange={() => setExclusive(r.key, "ok")} />
                                        </div>
                                    </td>

                                    <td className={tdCenter}>
                                        <div className="flex justify-center items-center">
                                            <CheckTick checked={(v.status ?? "") === "ng"} onChange={() => setExclusive(r.key, "ng")} />
                                        </div>
                                    </td>

                                    <td className={tdCenter}>
                                        <div className="flex justify-center items-center">
                                            <CheckTick checked={(v.status ?? "") === "none"} onChange={() => setExclusive(r.key, "none")} />
                                        </div>
                                    </td>

                                    <td className={td}>
                                        <DottedInput
                                            className="w-full"
                                            value={v.note ?? ""}
                                            onChange={(e) => emitSummary(r.key, { note: e.currentTarget.value })}
                                        />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* ===================== Select Minor/Major ===================== */}
            <div className="mt-4 flex items-center gap-3">
                <div className="text-sm font-semibold">ประเภท:</div>

                <div className="w-[240px]">
                    <Select
                        instanceId="section4-severity"
                        isClearable
                        placeholder="เลือก Minor / Major"
                        options={SEVERITY_OPTIONS as any}
                        value={selectedSeverity as any}
                        onChange={(opt: any) => {
                            const v: MinorMajor = opt?.value ?? "";
                            setSeverity(v);
                            onChange?.({ severity: v } as Partial<SectionFourForm>);
                        }}
                        menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                        menuPosition="fixed"
                        styles={{
                            control: (base) => ({ ...base, minHeight: 34, color: "#111827" }),
                            singleValue: (base) => ({ ...base, color: "#111827" }),
                            placeholder: (base) => ({ ...base, color: "#111827", opacity: 0.9 }),
                            input: (base) => ({ ...base, color: "#111827" }),
                            option: (base, state) => ({
                                ...base,
                                color: "#111827",
                                backgroundColor: state.isSelected ? "#E5E7EB" : state.isFocused ? "#F3F4F6" : "#FFFFFF",
                                cursor: "pointer",
                            }),
                            menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                            menu: (base) => ({ ...base, zIndex: 9999 }),
                            dropdownIndicator: (base) => ({ ...base, paddingTop: 0, paddingBottom: 0, color: "#111827" }),
                            clearIndicator: (base) => ({ ...base, paddingTop: 0, paddingBottom: 0, color: "#111827" }),
                            indicatorSeparator: (base) => ({ ...base, backgroundColor: "#D1D5DB" }),
                        }}
                    />
                </div>
            </div>

            {/* ===================== สรุปความเห็นผู้ตรวจสอบ ===================== */}
            <div className="mt-5 border border-gray-800 w-full">
                <div className={`${opinionHead} text-black font-semibold px-3 py-2 text-sm`}>สรุปความเห็นผู้ตรวจสอบ</div>

                <div className={stripe + " h-6"} />

                {/* ย่อหน้าแรก */}
                <div className="px-3 py-3 text-sm leading-relaxed">
                    ตามที่บริษัท{" "}
                    <DottedInput
                        className="w-[260px] font-semibold text-gray-900"
                        value={opinion.companyName ?? ""}
                        onChange={(e) => emitOpinion({ companyName: e.currentTarget.value })}
                    />{" "}
                    ได้ทำการตรวจสอบป้ายของ{" "}
                    <DottedInput
                        className="w-[240px] font-semibold text-gray-900"
                        value={opinion.signOwner ?? ""}
                        onChange={(e) => emitOpinion({ signOwner: e.currentTarget.value })}
                    />{" "}
                    ป้าย{" "}
                    <DottedInput
                        className="w-[200px] font-semibold text-gray-900"
                        value={opinion.signType ?? ""}
                        onChange={(e) => emitOpinion({ signType: e.currentTarget.value })}
                    />{" "}
                    ตามหลักเกณฑ์การตรวจสอบแล้วเห็นว่า{" "}
                    {severity === "major" ? (
                        <>
                            ควรดำเนินการแก้ไขในเรื่อง{" "}
                            <DottedInput
                                className="w-[320px] font-semibold text-gray-900"
                                value={opinion.majorFix ?? ""}
                                onChange={(e) => emitOpinion({ majorFix: e.currentTarget.value })}
                            />
                            .
                        </>
                    ) : (
                        <>โครงสร้างป้ายมีความแข็งแรง อยู่ในสภาพปลอดภัยในการใช้งาน</>
                    )}
                </div>

                {/* ย่อหน้าที่ 2 */}
                <div className="px-3 pb-3 text-sm leading-relaxed">
                    ข้าพเจ้าในฐานะผู้ตรวจสอบป้ายขอรับรองว่าได้ทำการตรวจสอบสภาพป้ายดังกล่าว โดยผลการตรวจสอบป้ายและอุปกรณ์ประกอบของป้ายถูกต้อง
                    และเป็นจริงตามที่ได้ระบุไว้ในรายงานฉบับนี้ รวมทั้งยังได้ให้เจ้าของป้าย ผู้ครอบครอง หรือผู้ดูแลป้าย ได้รับทราบผลการตรวจสอบสภาพป้าย
                    และอุปกรณ์ประกอบของป้ายตามรายงานข้างต้นอย่างครบถ้วนแล้ว
                    {severity === "major" && (
                        <>
                            {" "}
                            และในการนี้บุคคลผู้รับผิดชอบป้ายดังกล่าวได้ทำแผนงานประกอบการปรับปรุงแก้ไขป้ายและอุปกรณ์ประกอบของป้ายตามคำแนะนำของผู้ตรวจสอบป้าย
                            แนบมาพร้อมกับรายงานฉบับนี้ด้วย
                        </>
                    )}
                </div>

                <div className={stripe + " h-6"} />

                {/* ลงชื่อผู้ตรวจสอบ + วันที่ */}
                <div className="px-3 py-3 text-sm">
                    <div className="grid grid-cols-[1fr_1fr] gap-6 items-end">
                        <div className="flex items-end gap-2">
                            <span className="w-12">ลงชื่อ</span>
                            <DottedInput
                                className="flex-1"
                                value={opinion.inspectorSign ?? ""}
                                onChange={(e) => emitOpinion({ inspectorSign: e.currentTarget.value })}
                            />
                        </div>
                        <div className="text-center">ผู้ตรวจสอบ</div>
                    </div>

                    <div className="mt-1 text-center text-xs text-gray-800">
                        ({" "}
                        <DottedInput
                            className="w-[260px] text-center"
                            value={opinion.inspectorPrintedName ?? ""}
                            onChange={(e) => emitOpinion({ inspectorPrintedName: e.currentTarget.value })}
                        />{" "}
                        )
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                        <span className="w-12">วันที่</span>

                        <select
                            className="w-16 bg-transparent border-0 border-b border-dashed border-black/40 text-center focus:outline-none"
                            value={opinion.day ?? ""}
                            onChange={(e) => emitOpinion({ day: e.target.value })}
                        >
                            <option value=""></option>
                            {Array.from({ length: 31 }, (_, i) => String(i + 1)).map((d) => (
                                <option key={d} value={d}>
                                    {d}
                                </option>
                            ))}
                        </select>

                        <span>เดือน</span>

                        <select
                            className="w-44 bg-transparent border-0 border-b border-dashed border-black/40 text-center focus:outline-none"
                            value={opinion.month ?? ""}
                            onChange={(e) => emitOpinion({ month: e.target.value })}
                        >
                            <option value=""></option>
                            {THAI_MONTHS.map((m) => (
                                <option key={m} value={m}>
                                    {m}
                                </option>
                            ))}
                        </select>

                        <span>พ.ศ.</span>

                        <select
                            className="w-24 bg-transparent border-0 border-b border-dashed border-black/40 text-center focus:outline-none"
                            value={opinion.year ?? ""}
                            onChange={(e) => emitOpinion({ year: e.target.value })}
                        >
                            <option value=""></option>
                            {YEARS.map((y) => (
                                <option key={y} value={y}>
                                    {y}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className={stripe + " h-6"} />

                {/* เลขทะเบียนผู้ตรวจสอบ */}
                <div className="px-3 py-3 text-sm leading-relaxed">
                    <div className="font-semibold mb-1">เลขทะเบียนผู้ตรวจสอบ</div>
                    ผู้ตรวจสอบประเภทนิติบุคคล ทะเบียนเลขที่{" "}
                    <DottedInput className="w-[180px]" value={opinion.regNo ?? ""} onChange={(e) => emitOpinion({ regNo: e.currentTarget.value })} />{" "}
                    จาก{" "}
                    <DottedInput
                        className="w-[260px]"
                        value={opinion.regFrom ?? ""}
                        onChange={(e) => emitOpinion({ regFrom: e.currentTarget.value })}
                    />{" "}
                    โดยนาม{" "}
                    <DottedInput className="w-[260px]" value={opinion.regBy ?? ""} onChange={(e) => emitOpinion({ regBy: e.currentTarget.value })} />
                    <div className="mt-1">
                        เลขที่{" "}
                        <DottedInput
                            className="w-full"
                            value={opinion.regAddress ?? ""}
                            onChange={(e) => emitOpinion({ regAddress: e.currentTarget.value })}
                        />
                    </div>
                </div>

                <div className={stripe + " h-6"} />

                {/* ย่อหน้ารับรองของเจ้าของป้าย */}
                <div className="px-3 py-3 text-sm leading-relaxed">
                    ข้าพเจ้าในฐานะเจ้าของป้าย ผู้ครอบครองป้าย หรือผู้ดูแลป้าย ขอรับรองว่าได้มีการตรวจสอบป้ายตามรายงานดังกล่าวข้างต้นจริง
                    โดยการตรวจสอบป้ายนั้นกระทำโดยผู้ตรวจสอบป้ายซึ่งได้รับใบอนุญาตจากกรมโยธาธิการและผังเมือง
                    {severity === "major" ? (
                        <>
                            {" "}
                            รวมทั้งข้าพเจ้ายังได้รับทราบข้อเสนอแนะและแนวทางในการปรับปรุงแก้ไขตามคำแนะนำของผู้ตรวจสอบป้ายอีกด้วย
                            พร้อมกันนี้ยังได้จัดทำแผนในการปรับปรุงแก้ไขมาพร้อมกับรายงานการตรวจสอบป้ายในครั้งนี้ด้วย และข้าพเจ้าได้อ่านและเข้าใจในรายงานดังกล่าวครบถ้วนแล้ว
                            จึงลงลายมือชื่อไว้เป็นสำคัญ
                        </>
                    ) : (
                        <> ข้าพเจ้าได้อ่านและเข้าใจในรายงานดังกล่าวครบถ้วนแล้ว จึงลงลายมือชื่อไว้เป็นสำคัญ</>
                    )}
                </div>

                {/* ลงชื่อเจ้าของป้าย */}
                <div className="px-3 pb-4 text-sm">
                    <div className="grid grid-cols-[1fr_1fr] gap-6 items-end">
                        <div className="flex items-end gap-2">
                            <span className="w-12">ลงชื่อ</span>
                            <DottedInput
                                className="flex-1"
                                value={opinion.ownerSign ?? ""}
                                onChange={(e) => emitOpinion({ ownerSign: e.currentTarget.value })}
                            />
                        </div>
                        <div className="text-center">
                            เจ้าของป้ายหรือสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย/ผู้ครอบครองป้าย หรือผู้รับมอบอำนาจ
                        </div>
                    </div>

                    <div className="mt-1 text-center text-xs text-gray-800">
                        (
                        <DottedInput
                            className="w-[220px] text-center"
                            value={opinion.ownerName ?? ""}
                            onChange={(e) => emitOpinion({ ownerName: e.currentTarget.value })}
                        />
                        )
                    </div>
                </div>

                {/* ป้าย Minor/Major */}
                {(severity === "minor" || severity === "major") && (
                    <div className="py-6 flex justify-center">
                        <div
                            className={[
                                "w-[210px] h-[70px] rounded-xl flex items-center justify-center",
                                "text-3xl font-extrabold border-2",
                                severity === "minor" ? "bg-green-500 border-green-700 text-black" : "bg-red-600 border-red-800 text-black",
                            ].join(" ")}
                        >
                            {severity === "minor" ? "Minor" : "Major"}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
