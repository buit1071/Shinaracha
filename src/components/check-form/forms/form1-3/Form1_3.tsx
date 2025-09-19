import * as React from "react";

import CompanyHeader from "@/components/check-form/forms/form1-3/CompanyHeader";
import SectionOneDetails from "@/components/check-form/forms/form1-3/SectionOneDetails";
import SectionTwoDetails from "@/components/check-form/forms/form1-3/SectionTwoDetails";
import SectionThreeDetails from "@/components/check-form/forms/form1-3/SectionThreeDetails";
import SectionFourDetails from "@/components/check-form/forms/form1-3/SectionFourDetails";
import SectionFiveDetails from "@/components/check-form/forms/form1-3/SectionFiveDetails";
import type { ViewDataForm } from "@/interfaces/master";
import { showLoading } from "@/lib/loading";

type Props = {
    jobId: string;
    equipment_id: string;
};

export default function Form1_3({ jobId, equipment_id }: Props) {
    const [coverSrc, setCoverSrc] = React.useState<string | null>(null);
    const [placeName, setPlaceName] = React.useState<string>("");
    const [openSections, setOpenSections] = React.useState<string[]>([]);
    const [viewData, setViewData] = React.useState<ViewDataForm | null>(null);

    const toggle = (id: string) => {
        setOpenSections((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const onPickCover = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        const url = URL.createObjectURL(f);
        setCoverSrc(url);
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

    return (
        <>
            {/* ระยะขอบกระดาษ */}
            <div className="p-2">
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
                                onClick={() => setCoverSrc(null)}
                                className="ml-2 inline-flex items-center rounded-md px-3 py-2 text-sm
             border border-red-500 text-red-600
             hover:bg-red-50 cursor-pointer
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
                    <div className="text-xl text-gray-700 mb-2">ชื่อสถานที่ตรวจ</div>
                    <input
                        value={placeName}
                        onChange={(e) => setPlaceName(e.target.value)}
                        placeholder="เช่น อาคาร เทสโก้ โลตัส สาขา ชุมแพ"
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
                                <SectionTwoDetails data={viewData} />
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
                            ส่วนที่ 3 ช่วงเวลา และความถี่ในการตรวจสอบประจำปีของผู้ตรวจสอบอาคาร
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
                                <SectionThreeDetails />
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
                                <SectionFourDetails />
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
                                <SectionFiveDetails />
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </>
    )
}
