import * as React from "react";

import CompanyHeader from "@/components/check-form/forms/form1-3/CompanyHeader";
import SectionOneDetails from "@/components/check-form/forms/form1-3/SectionOneDetails";
import SectionTwoDetails, { SectionTwoForm } from "@/components/check-form/forms/form1-3/SectionTwoDetails";
import SectionThreeDetails, { SectionThreeForm } from "@/components/check-form/forms/form1-3/SectionThreeDetails";
import SectionFourDetails, { SectionFourForm, SectionFourRow } from "@/components/check-form/forms/form1-3/SectionFourDetails";
import SectionFiveDetails, { SectionFiveForm, SectionFiveRow } from "@/components/check-form/forms/form1-3/SectionFiveDetails";
import type { ViewDataForm } from "@/interfaces/master";
import { showLoading } from "@/lib/loading";
import { exportToDocx } from "@/utils/exportToDocx";

type Props = {
    jobId: string;
    equipment_id: string;
    name: string;
};

type FormData = {
    cover?: File;
    placeName?: string;
    sectionTwo?: Partial<SectionTwoForm>;
    sectionThree?: Partial<SectionThreeForm>
    sectionFour?: Partial<SectionFourForm>
    sectionFive?: Partial<SectionFiveForm>
};

export default function Form1_3({ jobId, equipment_id, name }: Props) {
    const [formData, setFormData] = React.useState<FormData>({});
    const [coverSrc, setCoverSrc] = React.useState<string | null>(null);
    const [openSections, setOpenSections] = React.useState<string[]>([]);
    const [viewData, setViewData] = React.useState<ViewDataForm | null>(null);

    const onSectionTwoChange = React.useCallback(
        (patch: Partial<SectionTwoForm>) => {
            setFormData(prev => ({
                ...prev,
                sectionTwo: { ...(prev.sectionTwo ?? {}), ...patch },
            }));
        },
        []
    );

    const onSectionFourChange = React.useCallback((patch: Partial<SectionFourForm>) => {
        setFormData(prev => {
            type GroupKey = keyof SectionFourForm;             // "table1" | "table2"
            type GroupRows = Record<string, SectionFourRow>;
            type GroupPatch = Partial<Record<string, Partial<SectionFourRow>>>;

            const prevS4: Partial<SectionFourForm> = prev.sectionFour ?? {};

            const mergeGroup = (group: GroupKey): GroupRows => {
                const cur: GroupRows = (prevS4[group] as GroupRows) ?? {};
                const p: GroupPatch = (patch[group] as GroupPatch) ?? {};
                const next: GroupRows = { ...cur };
                for (const rowId of Object.keys(p)) {
                    const rowPatch: Partial<SectionFourRow> = p[rowId] ?? {};
                    const prevRow: SectionFourRow = next[rowId] ?? {};
                    next[rowId] = {
                        ...prevRow,
                        ...rowPatch,
                        visits: { ...(prevRow.visits ?? {}), ...(rowPatch.visits ?? {}) },
                    };
                }
                return next;
            };

            return {
                ...prev,
                sectionFour: {
                    table1: mergeGroup("table1"),
                    table2: mergeGroup("table2"),
                },
            };
        });
    }, []);

    const onSectionFiveChange = React.useCallback((patch: Partial<SectionFiveForm>) => {
        setFormData(prev => {
            const cur = prev.sectionFive ?? { rows: {}, meta: {} };

            // ---- merge rows (ทีละแถว) ----
            const curRows = cur.rows ?? {};
            const pRows = patch.rows ?? {};
            const nextRows: Record<string, SectionFiveRow> = { ...curRows };
            Object.keys(pRows).forEach((id) => {
                const rowPatch = pRows[id] ?? {};
                const prevRow = curRows[id] ?? {};
                nextRows[id] = { ...prevRow, ...rowPatch };     // ✅ รวมคีย์เดิมกับคีย์ที่เปลี่ยน
            });

            // ---- merge meta (รวม object ซ้อนชั้นด้วย) ----
            const curMeta = cur.meta ?? {};
            const pMeta = patch.meta ?? {};
            const mergedMeta = {
                ...curMeta,
                ...pMeta,
                inspectDate: { ...(curMeta.inspectDate ?? {}), ...(pMeta.inspectDate ?? {}) },
                licIssue: { ...(curMeta.licIssue ?? {}), ...(pMeta.licIssue ?? {}) },
                licExpire: { ...(curMeta.licExpire ?? {}), ...(pMeta.licExpire ?? {}) },
            };

            return {
                ...prev,
                sectionFive: { rows: nextRows, meta: mergedMeta },
            };
        });
    }, []);

    const toggle = (id: string) => {
        setOpenSections((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const onPickCover = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;

        if (coverSrc) URL.revokeObjectURL(coverSrc);

        const url = URL.createObjectURL(f);
        setCoverSrc(url);
        setFormData(prev => ({
            ...prev,
            cover: f,
        }));
    };

    const fecthEquipmentDetail = async () => {
        showLoading(true);
        try {
            const res = await fetch("/api/auth/equipment/get", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ function: "ViewEquipment", job_id: jobId, equipment_id: equipment_id }),
            });
            const data = await res.json();
            if (data.success) {
                setViewData(data.data);
            }
        } catch (err) {
            console.error("Fetch error:", err);
        } finally {
            showLoading(false);
        }
    };

    React.useEffect(() => {
        if (!jobId) return;
        fecthEquipmentDetail();
    }, [jobId, equipment_id]);

    React.useEffect(() => {
        if (formData.cover) {
            if (coverSrc) URL.revokeObjectURL(coverSrc);
            const url = URL.createObjectURL(formData.cover);
            setCoverSrc(url);
            return () => URL.revokeObjectURL(url);
        }
    }, [formData.cover]);

    return (
        <>
            {/* ระยะขอบกระดาษ */}
            <div className="p-2 relative">
                <button
                    type="button"
                    onClick={() => exportToDocx(formData)}
                    className="absolute right-2.5 w-[100px] h-10 bg-sky-600 hover:bg-sky-700 active:bg-sky-700 text-white rounded-[5px] inline-flex items-center justify-center gap-2 shadow-md cursor-pointer"
                >
                    <img src="/images/IconWord.png" alt="Word" className="h-5 w-5 object-contain" />
                    <span className="leading-none">Export</span>
                </button>
                <div className="w-full h-[5vh] grid place-items-center">
                    <span className="text-black md:text-3xl font-bold tracking-wide">
                        หน้าปกรายงาน
                    </span>
                </div>

                {/* หัวกระดาษ: โลโก้ + ชื่อบริษัท */}
                <CompanyHeader
                    companyTh="บริษัท ชินราช โพรเทคเตอร์ จำกัด"
                    companyEn="Shinaracha Protector Co., Ltd."
                    logoUrl="/images/NewLOGOSF.webp"
                />

                {/* เส้นคั่น */}
                <hr className="my-8" />

                {/* กล่องรูปปก */}
                <div className="border rounded-md p-2 bg-gray-50 flex flex-col items-center justify-center">
                    <div
                        className="w-[800px] h-[500px] rounded-sm bg-gray-300/80 grid place-items-center overflow-hidden"
                        style={{ outline: "1px solid rgba(0,0,0,0.08)" }}
                    >
                        {coverSrc ? (
                            <img
                                src={coverSrc}
                                alt="cover"
                                className="max-h-full w-auto object-contain"
                            />
                        ) : (
                            <div className="text-gray-600 text-sm text-center px-4">
                                ยังไม่มีรูปปก
                                <br />
                                เลือกไฟล์ภาพด้านล่างเพื่ออัปโหลด
                            </div>
                        )}
                    </div>

                    {/* input อัปโหลดรูป */}
                    <div className="mt-3">
                        <label className="inline-flex items-center gap-2 rounded-md border border-blue-500 text-blue-600 px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={onPickCover}
                                className="hidden"
                            />
                            อัปโหลดรูปปก
                        </label>
                        {coverSrc && (
                            <button
                                onClick={() => {
                                    URL.revokeObjectURL(coverSrc);
                                    setCoverSrc(null);
                                    setFormData(prev => ({ ...prev, cover: undefined }));
                                }}
                                className="ml-2 inline-flex items-center rounded-md px-3 py-2 text-sm
               border border-red-500 text-red-600 hover:bg-red-50 cursor-pointer
               focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-1"
                            >
                                ล้างรูป
                            </button>
                        )}
                    </div>
                </div>

                {/* เส้นคั่น */}
                <hr className="my-8" />

                {/* ชื่อสถานที่ตรวจ (ใหญ่ กลางหน้า/ล่าง) */}
                <div className="pt-10 text-center">
                    <div className="text-xl text-gray-700 mb-2">ชื่ออุปกรณ์ที่ตรวจ</div>
                    <input
                        value={formData.placeName ?? name}
                        onChange={(e) =>
                            setFormData(prev => ({ ...prev, placeName: e.target.value }))
                        }
                        placeholder=""
                        className="w-full max-w-[640px] mx-auto text-center text-2xl md:text-3xl font-medium 
             border-b outline-none focus:border-gray-800 transition px-2 pb-2
             text-black caret-black"
                    />
                </div>

                {/* เส้นคั่น */}
                <hr className="my-8" />

                <CompanyHeader
                    companyTh="บริษัท ชินราช โพรเทคเตอร์ จำกัด"
                    companyEn="Shinaracha Protector Co., Ltd."
                    logoUrl="/images/NewLOGOSF.webp"
                />

                {/* เส้นคั่น */}
                <hr className="my-4" />

                {/* ส่วนที่ 1 */}
                <section className="w-full mb-3">
                    <button
                        type="button"
                        onClick={() => toggle("section1")}
                        aria-expanded={openSections.includes("section1")}
                        className="w-full grid h-[5vh] select-none cursor-pointer"
                    >
                        <span className="flex items-center justify-between gap-2 text-black md:text-xl font-bold tracking-wide rounded-xl bg-white px-4 py-2 border shadow-md hover:shadow-lg">
                            ส่วนที่ 1 ขอบเขตของการตรวจสอบ และรายละเอียดที่ต้องตรวจสอบ
                            <svg
                                className={`w-4 h-4 transition-transform ${openSections.includes("section1") ? "rotate-180" : ""}`}
                                viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"
                            >
                                <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" />
                            </svg>
                        </span>
                    </button>

                    {/* พื้นที่เนื้อหา: พับ/กางด้วย CSS grid trick */}
                    <div
                        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out
          ${openSections.includes("section1") ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                    >
                        <div className="overflow-hidden">
                            <div className="pt-2"> {/* เผื่อระยะห่างเล็กน้อยตอนกาง */}
                                <SectionOneDetails />
                            </div>
                        </div>
                    </div>
                </section>

                {/* ส่วนที่ 2 */}
                <section className="w-full mb-3">
                    <button
                        type="button"
                        onClick={() => toggle("section2")}
                        aria-expanded={openSections.includes("section2")}
                        className="w-full grid h-[5vh] select-none cursor-pointer"
                    >
                        <span className="flex items-center justify-between gap-2 text-black md:text-xl font-bold tracking-wide rounded-xl bg-white px-4 py-2 border shadow-md hover:shadow-lg">
                            ส่วนที่ 2 ข้อมูลทั่วไปของป้าย
                            <svg
                                className={`w-4 h-4 transition-transform ${openSections.includes("section2") ? "rotate-180" : ""}`}
                                viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"
                            >
                                <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" />
                            </svg>
                        </span>
                    </button>

                    {/* พื้นที่เนื้อหา: พับ/กางด้วย CSS grid trick */}
                    <div
                        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out
          ${openSections.includes("section2") ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                    >
                        <div className="overflow-hidden">
                            <div className="pt-2"> {/* เผื่อระยะห่างเล็กน้อยตอนกาง */}
                                <SectionTwoDetails
                                    data={viewData}
                                    value={formData.sectionTwo ?? {}}
                                    onChange={onSectionTwoChange}
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* ส่วนที่ 3 */}
                <section className="w-full mb-3">
                    <button
                        type="button"
                        onClick={() => toggle("section3")}
                        aria-expanded={openSections.includes("section3")}
                        className="w-full grid h-[5vh] select-none cursor-pointer"
                    >
                        <span className="flex items-center justify-between gap-2 text-black md:text-xl font-bold tracking-wide rounded-xl bg-white px-4 py-2 border shadow-md hover:shadow-lg">
                            ส่วนที่ 3 ช่วงเวลา ความถี่ในการตรวจสอบประจำปีของผู้ตรวจสอบอาคาร และแนวทางการตรวจสอบตามแผน
                            <svg
                                className={`w-4 h-4 transition-transform ${openSections.includes("section3") ? "rotate-180" : ""}`}
                                viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"
                            >
                                <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" />
                            </svg>
                        </span>
                    </button>

                    {/* พื้นที่เนื้อหา: พับ/กางด้วย CSS grid trick */}
                    <div
                        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out
          ${openSections.includes("section3") ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                    >
                        <div className="overflow-hidden">
                            <div className="pt-2"> {/* เผื่อระยะห่างเล็กน้อยตอนกาง */}
                                <SectionThreeDetails
                                    value={formData.sectionThree ?? { section1: {}, section2: {} }}
                                    onChange={(patch) =>
                                        setFormData(prev => ({
                                            ...prev,
                                            sectionThree: {
                                                section1: { ...(prev.sectionThree?.section1 ?? {}), ...(patch.section1 ?? {}) },
                                                section2: { ...(prev.sectionThree?.section2 ?? {}), ...(patch.section2 ?? {}) },
                                            },
                                        }))
                                    }
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* ส่วนที่ 4 */}
                <section className="w-full mb-3">
                    <button
                        type="button"
                        onClick={() => toggle("section4")}
                        aria-expanded={openSections.includes("section4")}
                        className="w-full grid h-[5vh] select-none cursor-pointer"
                    >
                        <span className="flex items-center justify-between gap-2 text-black md:text-xl font-bold tracking-wide rounded-xl bg-white px-4 py-2 border shadow-md hover:shadow-lg">
                            ส่วนที่ 4 ผลการตรวจสอบสภาพป้ายและอุปกรณ์ต่าง ๆ ของป้าย
                            <svg
                                className={`w-4 h-4 transition-transform ${openSections.includes("section4") ? "rotate-180" : ""}`}
                                viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"
                            >
                                <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" />
                            </svg>
                        </span>
                    </button>

                    {/* พื้นที่เนื้อหา: พับ/กางด้วย CSS grid trick */}
                    <div
                        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out
          ${openSections.includes("section4") ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                    >
                        <div className="overflow-hidden">
                            <div className="pt-2"> {/* เผื่อระยะห่างเล็กน้อยตอนกาง */}
                                <SectionFourDetails
                                    value={formData.sectionFour ?? { table1: {}, table2: {} }}
                                    onChange={onSectionFourChange}
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* ส่วนที่ 5 */}
                <section className="w-full mb-3">
                    <button
                        type="button"
                        onClick={() => toggle("section5")}
                        aria-expanded={openSections.includes("section5")}
                        className="w-full grid h-[5vh] select-none cursor-pointer"
                    >
                        <span className="flex items-center justify-between gap-2 text-black md:text-xl font-bold tracking-wide rounded-xl bg-white px-4 py-2 border shadow-md hover:shadow-lg">
                            ส่วนที่ 5 สรุปผลการตรวจสอบสภาพป้ายและอุปกรณ์ต่างๆ
                            <svg
                                className={`w-4 h-4 transition-transform ${openSections.includes("section5") ? "rotate-180" : ""}`}
                                viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"
                            >
                                <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" />
                            </svg>
                        </span>
                    </button>

                    {/* พื้นที่เนื้อหา: พับ/กางด้วย CSS grid trick */}
                    <div
                        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out
          ${openSections.includes("section5") ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                    >
                        <div className="overflow-hidden">
                            <div className="pt-2"> {/* เผื่อระยะห่างเล็กน้อยตอนกาง */}
                                <SectionFiveDetails
                                    name={name}
                                    value={formData.sectionFive ?? { rows: {}, meta: {} }}
                                    onChange={onSectionFiveChange}
                                />
                            </div>
                        </div>
                    </div>
                </section>
            </div>
            <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2
         font-medium text-white shadow-sm transition-colors
         hover:bg-emerald-500 active:bg-emerald-700
         focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400
         focus-visible:ring-offset-2 focus-visible:ring-offset-white
         disabled:pointer-events-none disabled:opacity-50">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
                    className="h-5 w-5" fill="currentColor" aria-hidden="true">
                    <path d="M3 4a2 2 0 0 1 2-2h7.586a2 2 0 0 1 1.414.586l2.414 2.414A2 2 0 0 1 17 6.414V17a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4Zm3 0h6v4H6V4Zm0 7a1 1 0 0 0-1 1v4h8v-4a1 1 0 0 0-1-1H6Z" />
                </svg>
                Save
            </button>
        </>
    )
}
