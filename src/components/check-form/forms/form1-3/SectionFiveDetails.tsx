import * as React from "react";

/* =========== UI Helpers =========== */
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

// ปุ่มเช็กหน้าตา ✓ ขาวพื้นแดง (exclusive ต่อแถวเมื่อใช้คู่กัน)
const CheckTick: React.FC<{ checked: boolean; onChange: () => void }> = ({
    checked,
    onChange,
}) => (
    <button
        type="button"
        onClick={onChange}
        className={[
            "h-5 w-5 rounded-[4px] border grid place-items-center",
            checked ? "bg-red-600 border-red-600" : "bg-white border-gray-400",
            "cursor-pointer focus:outline-none",
        ].join(" ")}
        aria-pressed={checked}
    >
        <span className={["text-white text-[14px] leading-none", checked ? "opacity-100" : "opacity-0"].join(" ")}>✓</span>
    </button>
);

/* =========== DATA =========== */
type SumRow = {
    id: string;
    label: string;
    allowExtra?: boolean; // สำหรับ "อื่น ๆ" ที่ต้องพิมพ์เพิ่ม
};
const SUMMARY_ROWS: SumRow[] = [
    { id: "r1", label: "สิ่งที่สร้างขึ้นส่วนหนึ่งติดหรือสัมผัสป้าย" },
    { id: "r2", label: "แผ่นป้าย" },
    { id: "r3", label: "ระบบไฟฟ้าแสงสว่าง" },
    { id: "r4", label: "ระบบไฟฟ้าควบคุม" },
    { id: "r5", label: "อุปกรณ์ประกอบอื่น ๆ" },
    { id: "r6", label: "อื่น ๆ", allowExtra: true },
];

type RowState = {
    status?: "ok" | "ng";
    fixed?: boolean;
    note?: string;
    extra?: string; // สำหรับ "อื่น ๆ"
};

/* =========== COMPONENT =========== */
export default function SectionFiveDetails() {
    const [rows, setRows] = React.useState<Record<string, RowState>>({});
    const [siteName, setSiteName] = React.useState("");
    const [roundNo, setRoundNo] = React.useState("");
    const [inspectDay, setInspectDay] = React.useState("");
    const [inspectMonth, setInspectMonth] = React.useState("");
    const [inspectYear, setInspectYear] = React.useState("");

    // ลายเซ็น/ข้อความใต้ตาราง
    const [ownerName, setOwnerName] = React.useState("");
    const [ownerDate, setOwnerDate] = React.useState({ d: "", m: "", y: "" });

    const [inspectorName, setInspectorName] = React.useState("");
    const [inspectorDate, setInspectorDate] = React.useState({ d: "", m: "", y: "" });

    // รายละเอียดผู้ตรวจสอบ
    const [insType, setInsType] = React.useState<"juristic" | "individual">("juristic");
    const [licenseNo, setLicenseNo] = React.useState("");
    const [issuer, setIssuer] = React.useState("กรมโยธาธิการและผังเมือง กระทรวงมหาดไทย");
    const [company, setCompany] = React.useState("");
    const [address, setAddress] = React.useState("");

    const [licIssue, setLicIssue] = React.useState({ d: "", m: "", y: "" });
    const [licExpire, setLicExpire] = React.useState({ d: "", m: "", y: "" });

    const td = "border border-gray-300 px-2 py-2 align-top text-gray-900";
    const th = "border border-gray-300 px-3 py-2 text-gray-700";

    const setRow = (id: string, patch: Partial<RowState>) =>
        setRows((p) => ({ ...p, [id]: { ...p[id], ...patch } }));

    return (
        <section className="space-y-8 text-gray-900 p-2">
            {/* ========== ตารางสรุปผล ========== */}
            <div className="border border-gray-300 rounded-md overflow-hidden">
                <div className="bg-gray-100 font-semibold text-center py-2">
                    สรุปผลการตรวจสอบป้ายและอุปกรณ์ประกอบต่าง ๆ ของป้าย
                </div>

                <table className="w-full text-sm bg-white">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className={`${th} w-16 text-center`}>ลำดับที่</th>
                            <th className={`${th} text-left`}>รายการตรวจสอบ</th>
                            <th className={`${th} w-24 text-center`}>ใช้ได้</th>
                            <th className={`${th} w-24 text-center`}>ใช้ไม่ได้</th>
                            <th className={`${th} w-32 text-center`}>มีการแก้ไขแล้ว</th>
                            <th className={`${th} w-64 text-center`}>หมายเหตุ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {SUMMARY_ROWS.map((r, idx) => {
                            const s = rows[r.id]?.status;
                            const fixed = !!rows[r.id]?.fixed;
                            return (
                                <tr key={r.id} className="odd:bg-white even:bg-gray-50">
                                    <td className={`${td} text-center`}>{idx + 1}</td>
                                    <td className={td}>
                                        <span>{r.label}</span>
                                        {r.allowExtra && (
                                            <DottedInput
                                                className="ml-2 min-w-[220px]"
                                                placeholder="โปรดระบุ"
                                                value={rows[r.id]?.extra ?? ""}
                                                onChange={(e) => setRow(r.id, { extra: e.target.value })}
                                            />
                                        )}
                                    </td>
                                    <td className={`${td} text-center`}>
                                        <CheckTick
                                            checked={s === "ok"}
                                            onChange={() =>
                                                setRow(r.id, { status: s === "ok" ? undefined : "ok" })
                                            }
                                        />
                                    </td>
                                    <td className={`${td} text-center`}>
                                        <CheckTick
                                            checked={s === "ng"}
                                            onChange={() =>
                                                setRow(r.id, { status: s === "ng" ? undefined : "ng" })
                                            }
                                        />
                                    </td>
                                    <td className={`${td} text-center`}>
                                        <CheckTick
                                            checked={fixed}
                                            onChange={() => setRow(r.id, { fixed: !fixed })}
                                        />
                                    </td>
                                    <td className={td}>
                                        <DottedInput
                                            className="w-full"
                                            placeholder="ระบุหมายเหตุ (ถ้ามี)"
                                            value={rows[r.id]?.note ?? ""}
                                            onChange={(e) => setRow(r.id, { note: e.target.value })}
                                        />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* ========== สรุปความเห็นของผู้ตรวจสอบอาคาร ========== */}
            <div className="space-y-3">
                <div className="font-semibold">สรุปความเห็นของผู้ตรวจสอบอาคาร</div>

                <div className="text-sm leading-7">
                    สรุปผลการตรวจสอบป้ายโฆษณา
                    <span className="mx-2">ของ</span>
                    <DottedInput
                        className="min-w-[280px]"
                        placeholder="ชื่อสถานประกอบการ/สถานที่"
                        value={siteName}
                        onChange={(e) => setSiteName(e.target.value)}
                    />
                    <span className="mx-2">ณ วันที่</span>
                    <DottedInput
                        className="w-12 text-center"
                        placeholder="วัน"
                        value={inspectDay}
                        onChange={(e) => setInspectDay(e.target.value.replace(/\D/g, ""))}
                    />
                    <span className="mx-2">เดือน</span>
                    <DottedInput
                        className="w-24 text-center"
                        placeholder="เดือน"
                        value={inspectMonth}
                        onChange={(e) => setInspectMonth(e.target.value)}
                    />
                    <span className="mx-2">พ.ศ.</span>
                    <DottedInput
                        className="w-16 text-center"
                        placeholder="ปี"
                        value={inspectYear}
                        onChange={(e) => setInspectYear(e.target.value.replace(/\D/g, ""))}
                    />
                    <span className="mx-2">รอบที่</span>
                    <DottedInput
                        className="w-12 text-center"
                        placeholder="รอบ"
                        value={roundNo}
                        onChange={(e) => setRoundNo(e.target.value.replace(/\D/g, ""))}
                    />
                    <div className="mt-2">
                        ในส่วนของโครงสร้าง ความมั่นคงแข็งแรงของป้าย พร้อมอุปกรณ์ประกอบป้าย
                        มีสภาพมั่นคงแข็งแรงเพียงพอใช้งานต่อไป และปลอดภัยต่อทรัพย์สิน
                    </div>
                </div>

                {/* ลายเซ็นคู่ */}
                <div className="grid sm:grid-cols-2 gap-6 mt-2">
                    <div className="text-sm">
                        <div className="text-center mt-4">
                            ลงชื่อ{" "}
                            <DottedInput
                                className="min-w-[180px]"
                                placeholder="(ลงชื่อ)"
                                value={ownerName}
                                onChange={(e) => setOwnerName(e.target.value)}
                            />{" "}
                            เจ้าของอาคาร/ผู้จัดการนิติบุคคลอาคารชุด
                        </div>
                        <div className="text-center mt-2">
                            วันที่{" "}
                            <DottedInput
                                className="w-10 text-center"
                                placeholder="วัน"
                                value={ownerDate.d}
                                onChange={(e) =>
                                    setOwnerDate((p) => ({ ...p, d: e.target.value.replace(/\D/g, "") }))
                                }
                            />{" "}
                            เดือน{" "}
                            <DottedInput
                                className="w-20 text-center"
                                placeholder="เดือน"
                                value={ownerDate.m}
                                onChange={(e) => setOwnerDate((p) => ({ ...p, m: e.target.value }))}
                            />{" "}
                            พ.ศ.{" "}
                            <DottedInput
                                className="w-16 text-center"
                                placeholder="ปี"
                                value={ownerDate.y}
                                onChange={(e) =>
                                    setOwnerDate((p) => ({ ...p, y: e.target.value.replace(/\D/g, "") }))
                                }
                            />
                        </div>
                    </div>

                    <div className="text-sm">
                        <div className="text-center mt-4">
                            ลงชื่อ{" "}
                            <DottedInput
                                className="min-w-[180px]"
                                placeholder="(ลงชื่อ)"
                                value={inspectorName}
                                onChange={(e) => setInspectorName(e.target.value)}
                            />{" "}
                            ผู้ตรวจสอบอาคาร
                        </div>
                        <div className="text-center mt-2">
                            วันที่{" "}
                            <DottedInput
                                className="w-10 text-center"
                                placeholder="วัน"
                                value={inspectorDate.d}
                                onChange={(e) =>
                                    setInspectorDate((p) => ({ ...p, d: e.target.value.replace(/\D/g, "") }))
                                }
                            />{" "}
                            เดือน{" "}
                            <DottedInput
                                className="w-20 text-center"
                                placeholder="เดือน"
                                value={inspectorDate.m}
                                onChange={(e) => setInspectorDate((p) => ({ ...p, m: e.target.value }))}
                            />{" "}
                            พ.ศ.{" "}
                            <DottedInput
                                className="w-16 text-center"
                                placeholder="ปี"
                                value={inspectorDate.y}
                                onChange={(e) =>
                                    setInspectorDate((p) => ({ ...p, y: e.target.value.replace(/\D/g, "") }))
                                }
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ========== รายละเอียดผู้ตรวจสอบ ========== */}
            <div className="space-y-3">
                <div className="font-semibold">รายละเอียดผู้ตรวจสอบ</div>

                <div className="flex items-center gap-6 text-sm">
                    <label className="inline-flex items-center gap-2">
                        <input
                            type="radio"
                            className="accent-black"
                            checked={insType === "juristic"}
                            onChange={() => setInsType("juristic")}
                        />
                        ผู้ตรวจสอบอาคารประเภทนิติบุคคล
                    </label>
                    <label className="inline-flex items-center gap-2">
                        <input
                            type="radio"
                            className="accent-black"
                            checked={insType === "individual"}
                            onChange={() => setInsType("individual")}
                        />
                        ผู้ตรวจสอบอาคารประเภทบุคคลธรรมดา
                    </label>
                </div>

                <div className="text-sm leading-7">
                    ใบอนุญาตเลขที่{" "}
                    <DottedInput
                        className="w-40"
                        value={licenseNo}
                        onChange={(e) => setLicenseNo(e.target.value)}
                    />{" "}
                    ออกโดย{" "}
                    <DottedInput className="min-w-[260px]" value={issuer} onChange={(e) => setIssuer(e.target.value)} />
                    <div className="mt-2">
                        โดยนาม{" "}
                        <DottedInput
                            className="min-w-[220px]"
                            placeholder={insType === "juristic" ? "ชื่อบริษัท" : "ชื่อ–สกุล"}
                            value={company}
                            onChange={(e) => setCompany(e.target.value)}
                        />{" "}
                        ที่อยู่{" "}
                        <DottedInput
                            className="min-w-[360px]"
                            placeholder="รายละเอียดที่อยู่"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                        />
                    </div>

                    <div className="mt-2">
                        ออกให้ ณ วันที่{" "}
                        <DottedInput
                            className="w-10 text-center"
                            placeholder="วัน"
                            value={licIssue.d}
                            onChange={(e) => setLicIssue((p) => ({ ...p, d: e.target.value.replace(/\D/g, "") }))}
                        />{" "}
                        เดือน{" "}
                        <DottedInput
                            className="w-20 text-center"
                            placeholder="เดือน"
                            value={licIssue.m}
                            onChange={(e) => setLicIssue((p) => ({ ...p, m: e.target.value }))}
                        />{" "}
                        พ.ศ.{" "}
                        <DottedInput
                            className="w-16 text-center"
                            placeholder="ปี"
                            value={licIssue.y}
                            onChange={(e) => setLicIssue((p) => ({ ...p, y: e.target.value.replace(/\D/g, "") }))}
                        />{" "}
                        และใช้ได้ถึงวันที่{" "}
                        <DottedInput
                            className="w-10 text-center"
                            placeholder="วัน"
                            value={licExpire.d}
                            onChange={(e) => setLicExpire((p) => ({ ...p, d: e.target.value.replace(/\D/g, "") }))}
                        />{" "}
                        เดือน{" "}
                        <DottedInput
                            className="w-20 text-center"
                            placeholder="เดือน"
                            value={licExpire.m}
                            onChange={(e) => setLicExpire((p) => ({ ...p, m: e.target.value }))}
                        />{" "}
                        พ.ศ.{" "}
                        <DottedInput
                            className="w-16 text-center"
                            placeholder="ปี"
                            value={licExpire.y}
                            onChange={(e) => setLicExpire((p) => ({ ...p, y: e.target.value.replace(/\D/g, "") }))}
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}
