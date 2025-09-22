import * as React from "react";

/* =========== TYPES =========== */
export type SectionFiveRow = {
    status?: "ok" | "ng";
    fixed?: boolean;
    note?: string;
    extra?: string;
};

export type SectionFiveMeta = {
    siteName?: string;
    roundNo?: string;
    inspectDate?: { d?: string; m?: string; y?: string };

    ownerName?: string;
    ownerDate?: { d?: string; m?: string; y?: string };

    inspectorName?: string;
    inspectorDate?: { d?: string; m?: string; y?: string };

    insType?: "juristic" | "individual";
    licenseNo?: string;
    issuer?: string;
    company?: string;
    address?: string;

    licIssue?: { d?: string; m?: string; y?: string };
    licExpire?: { d?: string; m?: string; y?: string };
};

export type SectionFiveForm = {
    rows: Record<string, SectionFiveRow>;
    meta: SectionFiveMeta;
};

type Props = {
    value?: Partial<SectionFiveForm>;
    onChange?: (patch: Partial<SectionFiveForm>) => void;
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

// ปุ่มเช็ก ✓ ขาวพื้นแดง (exclusive/ toggle)
const CheckTick: React.FC<{ checked: boolean; onChange: () => void }> = ({ checked, onChange }) => (
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
type SumRow = { id: string; label: string; allowExtra?: boolean };
const SUMMARY_ROWS: SumRow[] = [
    { id: "r1", label: "สิ่งที่สร้างขึ้นส่วนหนึ่งติดหรือสัมผัสป้าย" },
    { id: "r2", label: "แผ่นป้าย" },
    { id: "r3", label: "ระบบไฟฟ้าแสงสว่าง" },
    { id: "r4", label: "ระบบไฟฟ้าควบคุม" },
    { id: "r5", label: "อุปกรณ์ประกอบอื่น ๆ" },
    { id: "r6", label: "อื่น ๆ", allowExtra: true },
];

/* =========== COMPONENT =========== */
export default function SectionFiveDetails({ value, onChange }: Props) {
    const vRows = value?.rows ?? {};
    const vMeta = value?.meta ?? {};

    const td = "border border-gray-300 px-2 py-2 align-top text-gray-900";
    const th = "border border-gray-300 px-3 py-2 text-gray-700";

    // ---- emit helpers (event-based, ไม่ลูป) ----
    const setRow = React.useCallback((id: string, patch: Partial<SectionFiveRow>) => {
        onChange?.({ rows: { [id]: patch } });
    }, [onChange]);

    const setMeta = React.useCallback((patch: Partial<SectionFiveMeta>) => {
        onChange?.({ meta: patch });
    }, [onChange]);

    const setMetaDate = React.useCallback(<K extends keyof SectionFiveMeta>(key: K, patch: any) => {
        onChange?.({ meta: { [key]: patch } as any });
    }, [onChange]);

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
                            const s = vRows[r.id]?.status;
                            const fixed = !!vRows[r.id]?.fixed;
                            return (
                                <tr key={r.id} className="odd:bg-white even:bg-gray-50">
                                    <td className={`${td} text-center`}>{idx + 1}</td>
                                    <td className={td}>
                                        <span>{r.label}</span>
                                        {r.allowExtra && (
                                            <DottedInput
                                                className="ml-2 min-w-[220px]"
                                                placeholder="โปรดระบุ"
                                                value={vRows[r.id]?.extra ?? ""}
                                                onChange={(e) => setRow(r.id, { extra: e.target.value })}
                                            />
                                        )}
                                    </td>
                                    <td className={`${td} text-center`}>
                                        <CheckTick
                                            checked={s === "ok"}
                                            onChange={() => setRow(r.id, { status: s === "ok" ? undefined : "ok" })}
                                        />
                                    </td>
                                    <td className={`${td} text-center`}>
                                        <CheckTick
                                            checked={s === "ng"}
                                            onChange={() => setRow(r.id, { status: s === "ng" ? undefined : "ng" })}
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
                                            value={vRows[r.id]?.note ?? ""}
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
                        value={vMeta.siteName ?? ""}
                        onChange={(e) => setMeta({ siteName: e.target.value })}
                    />
                    <span className="mx-2">ณ วันที่</span>
                    <DottedInput
                        className="w-12 text-center"
                        value={vMeta.inspectDate?.d ?? ""}
                        onChange={(e) => setMetaDate("inspectDate", { ...(vMeta.inspectDate ?? {}), d: e.target.value.replace(/\D/g, "") })}
                    />
                    <span className="mx-2">เดือน</span>
                    <DottedInput
                        className="w-24 text-center"
                        value={vMeta.inspectDate?.m ?? ""}
                        onChange={(e) => setMetaDate("inspectDate", { ...(vMeta.inspectDate ?? {}), m: e.target.value })}
                    />
                    <span className="mx-2">พ.ศ.</span>
                    <DottedInput
                        className="w-16 text-center"
                        value={vMeta.inspectDate?.y ?? ""}
                        onChange={(e) => setMetaDate("inspectDate", { ...(vMeta.inspectDate ?? {}), y: e.target.value.replace(/\D/g, "") })}
                    />
                    <span className="mx-2">รอบที่</span>
                    <DottedInput
                        className="w-12 text-center"
                        value={vMeta.roundNo ?? ""}
                        onChange={(e) => setMeta({ roundNo: e.target.value.replace(/\D/g, "") })}
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
                            ลงชื่อ
                            <DottedInput
                                className="min-w-[180px]"
                                value={vMeta.ownerName ?? ""}
                                onChange={(e) => setMeta({ ownerName: e.target.value })}
                            />
                            เจ้าของอาคาร/ผู้จัดการนิติบุคคลอาคารชุด
                        </div>
                        <div className="text-center mt-2">
                            วันที่
                            <DottedInput
                                className="w-10 text-center"
                                value={vMeta.ownerDate?.d ?? ""}
                                onChange={(e) => setMetaDate("ownerDate", { ...(vMeta.ownerDate ?? {}), d: e.target.value.replace(/\D/g, "") })}
                            />
                            เดือน
                            <DottedInput
                                className="w-20 text-center"
                                value={vMeta.ownerDate?.m ?? ""}
                                onChange={(e) => setMetaDate("ownerDate", { ...(vMeta.ownerDate ?? {}), m: e.target.value })}
                            />
                            พ.ศ.
                            <DottedInput
                                className="w-16 text-center"
                                value={vMeta.ownerDate?.y ?? ""}
                                onChange={(e) => setMetaDate("ownerDate", { ...(vMeta.ownerDate ?? {}), y: e.target.value.replace(/\D/g, "") })}
                            />
                        </div>
                    </div>

                    <div className="text-sm">
                        <div className="text-center mt-4">
                            ลงชื่อ
                            <DottedInput
                                className="min-w-[180px]"
                                value={vMeta.inspectorName ?? ""}
                                onChange={(e) => setMeta({ inspectorName: e.target.value })}
                            />
                            ผู้ตรวจสอบอาคาร
                        </div>
                        <div className="text-center mt-2">
                            วันที่
                            <DottedInput
                                className="w-10 text-center"
                                value={vMeta.inspectorDate?.d ?? ""}
                                onChange={(e) => setMetaDate("inspectorDate", { ...(vMeta.inspectorDate ?? {}), d: e.target.value.replace(/\D/g, "") })}
                            />
                            เดือน
                            <DottedInput
                                className="w-20 text-center"
                                value={vMeta.inspectorDate?.m ?? ""}
                                onChange={(e) => setMetaDate("inspectorDate", { ...(vMeta.inspectorDate ?? {}), m: e.target.value })}
                            />
                            พ.ศ.
                            <DottedInput
                                className="w-16 text-center"
                                value={vMeta.inspectorDate?.y ?? ""}
                                onChange={(e) => setMetaDate("inspectorDate", { ...(vMeta.inspectorDate ?? {}), y: e.target.value.replace(/\D/g, "") })}
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
                            checked={(vMeta.insType ?? "juristic") === "juristic"}
                            onChange={() => setMeta({ insType: "juristic" })}
                        />
                        ผู้ตรวจสอบอาคารประเภทนิติบุคคล
                    </label>
                    <label className="inline-flex items-center gap-2">
                        <input
                            type="radio"
                            className="accent-black"
                            checked={vMeta.insType === "individual"}
                            onChange={() => setMeta({ insType: "individual" })}
                        />
                        ผู้ตรวจสอบอาคารประเภทบุคคลธรรมดา
                    </label>
                </div>

                <div className="text-sm leading-7">
                    ใบอนุญาตเลขที่
                    <DottedInput className="w-40" value={vMeta.licenseNo ?? ""} onChange={(e) => setMeta({ licenseNo: e.target.value })} />
                    ออกโดย
                    <DottedInput className="min-w-[260px]" value={vMeta.issuer ?? ""} onChange={(e) => setMeta({ issuer: e.target.value })} />
                    <div className="mt-2">
                        โดยนาม
                        <DottedInput className="min-w-[220px]" value={vMeta.company ?? ""} onChange={(e) => setMeta({ company: e.target.value })} />
                        ที่อยู่
                        <DottedInput className="min-w-[360px]" value={vMeta.address ?? ""} onChange={(e) => setMeta({ address: e.target.value })} />
                    </div>

                    <div className="mt-2">
                        ออกให้ ณ วันที่
                        <DottedInput
                            className="w-10 text-center"
                            value={vMeta.licIssue?.d ?? ""}
                            onChange={(e) => setMetaDate("licIssue", { ...(vMeta.licIssue ?? {}), d: e.target.value.replace(/\D/g, "") })}
                        />
                        เดือน
                        <DottedInput
                            className="w-20 text-center"
                            value={vMeta.licIssue?.m ?? ""}
                            onChange={(e) => setMetaDate("licIssue", { ...(vMeta.licIssue ?? {}), m: e.target.value })}
                        />
                        พ.ศ.
                        <DottedInput
                            className="w-16 text-center"
                            value={vMeta.licIssue?.y ?? ""}
                            onChange={(e) => setMetaDate("licIssue", { ...(vMeta.licIssue ?? {}), y: e.target.value.replace(/\D/g, "") })}
                        />
                        และใช้ได้ถึงวันที่
                        <DottedInput
                            className="w-10 text-center"
                            value={vMeta.licExpire?.d ?? ""}
                            onChange={(e) => setMetaDate("licExpire", { ...(vMeta.licExpire ?? {}), d: e.target.value.replace(/\D/g, "") })}
                        />
                        เดือน
                        <DottedInput
                            className="w-20 text-center"
                            value={vMeta.licExpire?.m ?? ""}
                            onChange={(e) => setMetaDate("licExpire", { ...(vMeta.licExpire ?? {}), m: e.target.value })}
                        />
                        พ.ศ.
                        <DottedInput
                            className="w-16 text-center"
                            value={vMeta.licExpire?.y ?? ""}
                            onChange={(e) => setMetaDate("licExpire", { ...(vMeta.licExpire ?? {}), y: e.target.value.replace(/\D/g, "") })}
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}
