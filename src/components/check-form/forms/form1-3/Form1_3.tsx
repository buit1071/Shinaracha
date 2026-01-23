import * as React from "react";

import CompanyHeader from "@/components/check-form/forms/form1-3/CompanyHeader";
import SectionOneDetails from "@/components/check-form/forms/form1-3/SectionOneDetails";
import SectionTwoDetails, { SectionTwoForm } from "@/components/check-form/forms/form1-3/SectionTwoDetails";
import SectionThreeDetails, { SectionThreeForm } from "@/components/check-form/forms/form1-3/SectionThreeDetails";
import SectionFourDetails, { SectionFourForm } from "@/components/check-form/forms/form1-3/SectionFourDetails";

import Section2_1Details from "@/components/check-form/forms/form1-3/new_form/Section2_1Details";
import Section2_2Details from "@/components/check-form/forms/form1-3/new_form/Section2_2Details";
import Section2_3Details from "@/components/check-form/forms/form1-3/new_form/Section2_3Details";
import Section2_4Details from "@/components/check-form/forms/form1-3/new_form/Section2_4Details";
import Section2_5Details, {
    Section2_5Form,
    Section2_5Row,
} from "@/components/check-form/forms/form1-3/new_form/Section2_5Details";
import Section2_6Details, { SectionSixForm, SectionSixRow } from "@/components/check-form/forms/form1-3/new_form/Section2_6Details";
import Section2_7Details, { SectionSevenForm, SectionSevenRow } from "@/components/check-form/forms/form1-3/new_form/Section2_7Details";
import { showLoading } from "@/lib/loading";
import { showAlert } from "@/lib/fetcher";
import { exportToDocx } from "@/utils/exportToDocx";
import { exportToExcel } from "@/utils/exportToExcel";
import { useCurrentUser } from "@/hooks/useCurrentUser";

type Props = {
    jobId: string;
    equipment_id: string;
    name: string;
    onBack: () => void;
};

type FormData = {
    id?: number | null;
    form_code?: string;
    cover?: File;
    coverfilename?: string;
    placeName?: string;
    sectionTwo?: Partial<SectionTwoForm>;
    sectionThree?: Partial<SectionThreeForm>
    sectionFour?: Partial<SectionFourForm>
    section2_5?: Partial<Section2_5Form>
    section2_6?: Partial<SectionSixForm>
    section2_7?: Partial<SectionSevenForm>
};

export default function Form1_3({ jobId, equipment_id, name, onBack }: Props) {
    const user = useCurrentUser();
    const username = React.useMemo(
        () => (user ? `${user.first_name_th} ${user.last_name_th}` : ""),
        [user]
    );
    const isShinaracha = user?.company_id === "COM-27162740";
    const buildRemoteCoverUrl = (name: string) =>
        `${process.env.NEXT_PUBLIC_N8N_UPLOAD_FILE}?name=${encodeURIComponent(name)}`;

    const [formData, setFormData] = React.useState<FormData>({});
    const [coverSrc, setCoverSrc] = React.useState<string | null>(null);
    const [openSections, setOpenSections] = React.useState<string[]>([]);

    const onSectionTwoChange = React.useCallback((patch: Partial<SectionTwoForm>) => {
        setFormData((prev) => ({
            ...prev,
            sectionTwo: {
                ...(prev.sectionTwo ?? {}),
                ...(patch ?? {}),
            },
        }));
    }, []);

    const onSectionFourChange = React.useCallback((patch: Partial<SectionFourForm>) => {
        setFormData((prev) => {
            const prevS4: Partial<SectionFourForm> = prev.sectionFour ?? {};

            // ===== merge summary (merge รายแถว) =====
            const mergeSummary = () => {
                const cur = prevS4.summary ?? {};
                const p = patch.summary ?? {};
                // ถ้าไม่มี patch ของ summary มา ให้ใช้ของเดิม
                if (!p || Object.keys(p).length === 0) return cur;

                const next: any = { ...cur };
                for (const k of Object.keys(p)) {
                    // merge ทีละ row (row1, row2, ...)
                    next[k] = { ...(cur as any)[k], ...(p as any)[k] };
                }
                return next;
            };

            // ===== merge opinion & severity =====
            const nextOpinion = { ...(prevS4.opinion ?? {}), ...(patch.opinion ?? {}) };
            const nextSeverity = (patch.severity ?? prevS4.severity ?? "") as any;

            return {
                ...prev,
                sectionFour: {
                    ...prevS4, // กันฟิลด์อื่นหาย (ถ้ามี)
                    summary: mergeSummary(),
                    severity: nextSeverity,
                    opinion: nextOpinion,
                },
            };
        });
    }, []);

    const onSection2_5Change = React.useCallback((patch: Partial<Section2_5Form>) => {
        setFormData((prev) => {
            type TableKey = "table1" | "table2";
            type Rows = Record<string, Section2_5Row>;
            type RowsPatch = Partial<Record<string, Partial<Section2_5Row>>>;

            const prevS25: Partial<Section2_5Form> = prev.section2_5 ?? {};

            const mergeTable = (key: TableKey): Rows => {
                const cur: Rows = (prevS25[key] as Rows) ?? {};
                const p: RowsPatch = (patch[key] as RowsPatch) ?? {};
                if (!p || Object.keys(p).length === 0) return cur;

                const next: Rows = { ...cur };
                for (const rowId of Object.keys(p)) {
                    const rowPatch = p[rowId] ?? {};
                    const prevRow = next[rowId] ?? {};
                    next[rowId] = { ...prevRow, ...rowPatch };
                }
                return next;
            };

            return {
                ...prev,
                section2_5: {
                    ...prevS25,              // กัน field อื่น (ถ้ามีในอนาคต) หาย
                    table1: mergeTable("table1"),
                    table2: mergeTable("table2"),
                },
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

        // ลบ URL เก่าออกก่อน (ถ้ามี)
        if (coverSrc) URL.revokeObjectURL(coverSrc);

        // === ✅ สร้างชื่อไฟล์ใหม่: ววดดปปปป_ชมมนวว.ext ===
        const now = new Date();
        const day = String(now.getDate()).padStart(2, "0");
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const year = String(now.getFullYear());
        const hour = String(now.getHours()).padStart(2, "0");
        const minute = String(now.getMinutes()).padStart(2, "0");
        const second = String(now.getSeconds()).padStart(2, "0");

        // ดึงนามสกุลไฟล์จริงจากชื่อไฟล์ที่เลือก
        const ext = f.name.split(".").pop()?.toLowerCase() || "jpg";

        // 🔥 ตัวอย่างชื่อไฟล์: 01102025_143512.jpg
        const newFileName = `${day}${month}${year}_${hour}${minute}${second}.${ext}`;

        // === สร้าง URL สำหรับ preview ===
        const url = URL.createObjectURL(f);
        setCoverSrc(url);

        // === เซ็ตข้อมูลลง formData ===
        setFormData(prev => ({
            ...prev,
            cover: f,
            coverfilename: newFileName,
        }));
    };

    const fecthFormDetail = async () => {
        showLoading(true);
        try {
            const res = await fetch("/api/auth/forms/get", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    function: "form1_3",
                    job_id: jobId,
                    equipment_id: equipment_id,
                }),
            });

            const data = await res.json();

            if (data.success && data.data?.form_data) {
                // ✅ ตรวจ type ก่อน parse
                const form =
                    typeof data.data.form_data === "string"
                        ? JSON.parse(data.data.form_data)
                        : data.data.form_data;

                // ✅ เซ็ตค่าเข้า state ให้ครบ
                setFormData((prev) => ({
                    ...prev,
                    id: data.data.id ?? null,
                    form_code: data.data.form_code ?? "",
                    ...form,
                    sectionTwo: form.sectionTwo ?? {},
                    sectionThree: form.sectionThree ?? {},
                    sectionFour: form.sectionFour ?? {},
                    sectionSeven: form.sectionSeven ?? {},
                }));
            } else {
            }
        } catch (err) {
        } finally {
            showLoading(false);
        }
    };

    React.useEffect(() => {
        if (!jobId) return;
        fecthFormDetail();
    }, [jobId, equipment_id]);

    React.useEffect(() => {
        let revokeUrl: string | null = null;

        if (formData.cover instanceof File) {
            const url = URL.createObjectURL(formData.cover);
            setCoverSrc(url);
            revokeUrl = url;
            return () => {
                if (revokeUrl) URL.revokeObjectURL(revokeUrl);
            };
        }

        if (formData.coverfilename) {
            const remoteUrl = buildRemoteCoverUrl(formData.coverfilename);
            showLoading(true);

            const img = new Image();
            img.onload = () => {
                setCoverSrc(remoteUrl);
                showLoading(false);
            };
            img.onerror = () => {
                setCoverSrc(null);
                showLoading(false);
            };
            img.src = remoteUrl;
        } else {
            setCoverSrc(null);
        }

        return () => {
            if (revokeUrl) URL.revokeObjectURL(revokeUrl);
        };
    }, [formData.cover, formData.coverfilename]);

    type SectionTwoWithPreview = Partial<SectionTwoForm> & {
        mapSketchPreview?: string | null;
        mapSketchPreview1?: string | null;

        shapeSketchPreview?: string | null;
        shapeSketchPreview1?: string | null;

        photosFrontPreview?: string | null;
        photosSidePreview?: string | null;
        photosBasePreview?: string | null;

        photosFrontPreview1?: string | null;
        photosSidePreview1?: string | null;
        photosBasePreview1?: string | null;
    };

    const handleSave = async () => {
        showLoading(true);

        const stopLoading = () => {
            try {
                showLoading(false);
            } catch { }
        };

        const alertAndStop = async (type: "success" | "error", msg: string) => {
            stopLoading();
            await showAlert(type, msg);
        };

        try {
            const { cover, sectionTwo, sectionFour, ...rest } = formData;

            // ===== helper: extract filename from n8n url (?name=xxx) =====
            const extractNameFromUrl = (u: string): string | null => {
                try {
                    const url = new URL(u);
                    return url.searchParams.get("name");
                } catch {
                    return null;
                }
            };

            // ===== helper: generate fallback filename =====
            const makeName = (mime?: string) => {
                const ext =
                    mime?.includes("png") ? "png" :
                        mime?.includes("jpeg") ? "jpg" :
                            mime?.includes("webp") ? "webp" : "png";
                return `IMG-${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`;
            };

            // ===== helper: if value is plain filename (not url/blob/data) =====
            const toPlainFilename = (v: any): string | null => {
                if (typeof v !== "string") return null;
                if (v.startsWith("blob:")) return null;
                if (v.startsWith("data:")) return null;
                if (/^https?:\/\//i.test(v)) return null;
                return v; // plain filename
            };

            // ===== upload any image source (blob:, data:image, File/Blob, http(s) pass-through) =====
            const uploadImageSource = async (
                src: string | File | Blob | null | undefined,
                filename?: string | null
            ): Promise<string | null> => {
                if (!src) return null;

                // URL เดิมบน server → ไม่ต้อง upload, แค่คืนชื่อไฟล์
                if (typeof src === "string" && /^https?:\/\//i.test(src)) {
                    return filename ?? extractNameFromUrl(src) ?? null;
                }

                let blob: Blob | null = null;
                let mime = "";

                if (src instanceof File) {
                    blob = src;
                    mime = src.type || "";
                    filename = filename ?? src.name;
                } else if (src instanceof Blob) {
                    blob = src;
                    mime = src.type || "";
                } else if (typeof src === "string") {
                    // รองรับ blob: และ data:image
                    if (src.startsWith("blob:") || src.startsWith("data:image")) {
                        const res = await fetch(src);
                        blob = await res.blob();
                        mime = blob.type || "";
                    } else {
                        // ถ้าเป็น string แปลกๆ ให้ถือเป็นชื่อไฟล์
                        return filename ?? src;
                    }
                }

                if (!blob) return null;

                const finalName = filename ?? makeName(mime);

                const fd = new FormData();
                fd.append("file", blob, finalName);
                fd.append("filename", finalName);

                const uploadRes = await fetch("/api/auth/upload-file", {
                    method: "POST",
                    body: fd,
                });

                const result = await uploadRes.json();
                if (!uploadRes.ok || !result.success) {
                    throw new Error(result.error || "อัปโหลดรูปไม่สำเร็จ");
                }

                return finalName;
            };

            const cleanSection2_6 = async (s26: any) => {
                if (!s26) return s26;

                const cleanTable = async (table: Record<string, any> | undefined) => {
                    if (!table) return {};

                    const out: Record<string, any> = {};

                    for (const [rowId, row] of Object.entries(table)) {
                        if (!row) continue;

                        const map = row.defect_by_visit ?? {};
                        const nextMap: any = {};

                        for (const [vk, defs] of Object.entries(map)) {
                            const arr = Array.isArray(defs) ? defs : [];
                            nextMap[vk] = await Promise.all(
                                arr.map(async (def: any) => {
                                    const photos = Array.isArray(def.photos) ? def.photos : [];

                                    const cleanedPhotos = await Promise.all(
                                        photos.map(async (p: any) => {
                                            // p.src อาจเป็น data/blob/http หรือไม่มีเลย
                                            if (p?.src) {
                                                const name = await uploadImageSource(p.src, p.filename ?? null);
                                                return name ? { filename: name } : null;
                                            }
                                            // ถ้ามีแต่ filename (รูปเดิมจาก backend)
                                            if (p?.filename) return { filename: p.filename };
                                            return null;
                                        })
                                    );

                                    return {
                                        ...def,
                                        photos: cleanedPhotos.filter(Boolean),
                                    };
                                })
                            );
                        }

                        out[rowId] = {
                            ...row,
                            defect_by_visit: nextMap,
                        };
                    }

                    return out;
                };

                return {
                    ...s26,
                    table1: await cleanTable(s26.table1),
                    table2: await cleanTable(s26.table2),
                };
            };

            // ============================================================
            // 1) Upload cover
            // ============================================================
            if (cover instanceof File) {
                const fd = new FormData();
                fd.append("file", cover);
                fd.append("filename", String(formData.coverfilename || cover.name));

                const uploadRes = await fetch("/api/auth/upload-file", {
                    method: "POST",
                    body: fd,
                });

                const uploadData = await uploadRes.json();
                if (!uploadRes.ok || !uploadData.success) {
                    await alertAndStop("error", uploadData.error || "อัปโหลดไฟล์ไม่สำเร็จ");
                    return;
                }
            }

            // ============================================================
            // 2) Upload SectionTwo images (สำคัญ: ต้องเอาชื่อไฟล์กลับไปใส่ payload)
            // ============================================================
            const s2 = (sectionTwo ?? {}) as any;

            // เลือก src ที่จะอัปโหลด: ใช้ preview ก่อน ถ้าไม่มีค่อยใช้ field จริง
            const pickSrc = (preview: any, original: any) => preview ?? original;

            const [
                mapSketchName,
                mapSketch1Name,
                shapeSketchName,
                shapeSketch1Name,
                photosFrontName,
                photosSideName,
                photosBaseName,
                photosFront1Name,
                photosSide1Name,
                photosBase1Name,
            ] = await Promise.all([
                uploadImageSource(pickSrc(s2.mapSketchPreview, s2.mapSketch), toPlainFilename(s2.mapSketch)),
                uploadImageSource(pickSrc(s2.mapSketchPreview1, s2.mapSketch1), toPlainFilename(s2.mapSketch1)),

                uploadImageSource(pickSrc(s2.shapeSketchPreview, s2.shapeSketch), toPlainFilename(s2.shapeSketch)),
                uploadImageSource(pickSrc(s2.shapeSketchPreview1, s2.shapeSketch1), toPlainFilename(s2.shapeSketch1)),

                uploadImageSource(pickSrc(s2.photosFrontPreview, s2.photosFront), toPlainFilename(s2.photosFront)),
                uploadImageSource(pickSrc(s2.photosSidePreview, s2.photosSide), toPlainFilename(s2.photosSide)),
                uploadImageSource(pickSrc(s2.photosBasePreview, s2.photosBase), toPlainFilename(s2.photosBase)),

                uploadImageSource(pickSrc(s2.photosFrontPreview1, s2.photosFront1), toPlainFilename(s2.photosFront1)),
                uploadImageSource(pickSrc(s2.photosSidePreview1, s2.photosSide1), toPlainFilename(s2.photosSide1)),
                uploadImageSource(pickSrc(s2.photosBasePreview1, s2.photosBase1), toPlainFilename(s2.photosBase1)),
            ]);

            // ลบ preview fields ทิ้ง + ใส่ชื่อไฟล์ที่อัปโหลดกลับเข้าไป
            const {
                mapSketchPreview,
                mapSketchPreview1,
                shapeSketchPreview,
                shapeSketchPreview1,
                photosFrontPreview,
                photosSidePreview,
                photosBasePreview,
                photosFrontPreview1,
                photosSidePreview1,
                photosBasePreview1,
                ...sectionTwoBase
            } = s2;

            const sectionTwoClean = {
                ...sectionTwoBase,
                mapSketch: mapSketchName ?? sectionTwoBase.mapSketch,
                mapSketch1: mapSketch1Name ?? sectionTwoBase.mapSketch1,

                shapeSketch: shapeSketchName ?? sectionTwoBase.shapeSketch,
                shapeSketch1: shapeSketch1Name ?? sectionTwoBase.shapeSketch1,

                photosFront: photosFrontName ?? sectionTwoBase.photosFront,
                photosSide: photosSideName ?? sectionTwoBase.photosSide,
                photosBase: photosBaseName ?? sectionTwoBase.photosBase,

                photosFront1: photosFront1Name ?? sectionTwoBase.photosFront1,
                photosSide1: photosSide1Name ?? sectionTwoBase.photosSide1,
                photosBase1: photosBase1Name ?? sectionTwoBase.photosBase1,
            };

            // ============================================================
            // 3) Upload SectionFour photos (รองรับ blob: + data:image + http)
            // ============================================================
            let sectionFourClean = sectionFour;

            const cleanPhotoList = async (photos: any[] | undefined) => {
                if (!Array.isArray(photos)) return [];

                const names = await Promise.all(
                    photos.map(async (p) => {
                        if (!p) return null;
                        const fallbackName =
                            p.filename ??
                            (typeof p.src === "string" ? extractNameFromUrl(p.src) : null) ??
                            null;

                        return await uploadImageSource(p.src ?? null, fallbackName);
                    })
                );

                return names
                    .filter((n): n is string => !!n)
                    .map((n) => ({ filename: n }));
            };

            const processTable = async (table: Record<string, any> | undefined): Promise<Record<string, any>> => {
                if (!table) return {};
                const clean: Record<string, any> = {};

                for (const [key, row] of Object.entries(table)) {
                    if (!row) continue;

                    const cleanedRowPhotos = await cleanPhotoList(row.photos);

                    let cleanedDefect = row.defect;
                    if (Array.isArray(row.defect)) {
                        cleanedDefect = await Promise.all(
                            row.defect.map(async (def: any) => {
                                const { photos: defectPhotos, ...restDef } = def || {};
                                const cleanedDefectPhotos = await cleanPhotoList(defectPhotos);
                                return { ...restDef, photos: cleanedDefectPhotos };
                            })
                        );
                    }

                    clean[key] = {
                        ...row,
                        photos: cleanedRowPhotos,
                        defect: cleanedDefect,
                    };
                }

                return clean;
            };

            if (sectionFour) {
                sectionFourClean = {
                    ...sectionFour,
                };
            }

            const section2_6Clean = await cleanSection2_6((rest as any).section2_6);
            // ============================================================
            // 4) Prepare payload (รวม section2_5/2_6/2_7 อยู่ใน rest แล้ว)
            // ============================================================
            const payload: any = {
                entity: "form1_3",
                data: {
                    ...rest,
                    sectionTwo: sectionTwoClean,
                    sectionFour: sectionFourClean,
                    section2_6: section2_6Clean,
                    job_id: jobId,
                    equipment_id: equipment_id,
                    is_active: 1,
                    created_by: username,
                    updated_by: username,
                },
            };

            if (formData.form_code) payload.data.form_code = formData.form_code;

            // ============================================================
            // 5) Save form data
            // ============================================================
            const res = await fetch("/api/auth/forms/post", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                stopLoading(); // ✅ ปิดก่อนกันค้าง
                await showAlert("success", data.message);

                if (data.form_code && !formData.form_code) {
                    setFormData((prev) => ({ ...prev, form_code: data.form_code }));
                }

                onBack(); // ✅ ค่อยย้อนกลับหลัง user กดตกลง
                return;
            }

            await alertAndStop("error", data.message || "บันทึกไม่สำเร็จ");
        } catch (err: any) {
            await alertAndStop("error", err?.message || "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
        } finally {
            stopLoading(); // กันหลุดทุกกรณี
        }
    };

    return (
        <>
            {/* ระยะขอบกระดาษ */}
            <div className="p-2 relative">
                <div className="absolute right-2.5">
                    {/* <button
                        type="button"
                        onClick={() => exportToExcel(formData.sectionFour ?? null, jobId ?? "")}
                        className="mr-2 w-[100px] h-10 bg-green-600 hover:bg-green-700 active:bg-green-700 text-white rounded-[5px] inline-flex items-center justify-center gap-2 shadow-md cursor-pointer"
                    >
                        <img src="/images/IconExcel.webp" alt="Excel" className="h-5 w-5 object-contain" />
                        <span className="leading-none">Defect</span>
                    </button> */}
                    <button
                        type="button"
                        onClick={() => exportToDocx(isShinaracha, formData)}
                        className="w-[100px] h-10 bg-sky-600 hover:bg-sky-700 active:bg-sky-700 text-white rounded-[5px] inline-flex items-center justify-center gap-2 shadow-md cursor-pointer"
                    >
                        <img src="/images/IconWord.png" alt="Word" className="h-5 w-5 object-contain" />
                        <span className="leading-none">Export</span>
                    </button>
                </div>
                <div className="w-full h-[5vh] grid place-items-center">
                    <span className="text-black md:text-3xl font-bold tracking-wide">
                        หน้าปกรายงาน
                    </span>
                </div>

                {/* หัวกระดาษ: โลโก้ + ชื่อบริษัท */}
                <CompanyHeader
                    companyTh={isShinaracha ? "บริษัท ชินรัช โพรเทคเตอร์ จำกัด" : "บริษัท โปรไฟร์ อินสเปคเตอร์ จำกัด"}
                    companyEn={isShinaracha ? "Shinaracha Protector Co., Ltd." : "Profire Inspector Co., Ltd."}
                    logoUrl={isShinaracha ? "/images/Logo_Shinaracha.webp" : "/images/Logo_Profire.png"}
                />;

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
                                className="max-w-full max-h-full object-contain rounded-sm"
                                style={{
                                    display: "block",
                                }}
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
                                    // ถ้ามี objectURL จากไฟล์ที่เพิ่งเลือก ให้ revoke ก่อน
                                    if (coverSrc.startsWith("blob:")) URL.revokeObjectURL(coverSrc);

                                    setFormData(prev => ({ ...prev, cover: undefined }));
                                    if (formData.coverfilename) {
                                        setCoverSrc(buildRemoteCoverUrl(formData.coverfilename));
                                    } else {
                                        setCoverSrc(null);
                                    }
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
                <hr className="my-2" />

                <span className="text-[30px] font-black text-black">รายงานการตรวจสอบป้าย</span>

                {/* เส้นคั่น */}
                <hr className="my-2" />

                {/* ส่วนที่ 1 */}
                <section className="w-full mb-3">
                    <button
                        type="button"
                        onClick={() => toggle("section1")}
                        aria-expanded={openSections.includes("section1")}
                        className="w-full grid h-[5vh] select-none cursor-pointer"
                    >
                        <span className="flex items-center justify-between gap-2 text-black md:text-xl font-bold tracking-wide rounded-xl bg-white px-4 py-2 border shadow-md hover:shadow-lg">
                            ส่วนที่ 1 ขอบเขตของการตรวจสอบป้าย
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
                                    eq_id={equipment_id}
                                    data={formData.sectionTwo ?? {}}
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
                            ส่วนที่ 3 ผลการตรวจสอบสภาพป้ายและอุปกรณ์ประกอบของป้าย
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
                                    value={formData.sectionThree ?? { items: {}, section8: {}, section9: {} }}
                                    onChange={(patch) =>
                                        setFormData((prev) => {
                                            const prevS3 = prev.sectionThree ?? { items: {}, section8: {}, section9: {} };

                                            return {
                                                ...prev,
                                                sectionThree: {
                                                    ...prevS3,

                                                    // ✅ items (ข้อ 1-7) เป็น record แบบ patch รายตัว
                                                    items: {
                                                        ...(prevS3.items ?? {}),
                                                        ...(patch.items ?? {}),
                                                    },

                                                    // ✅ ข้อ 8
                                                    section8: {
                                                        ...(prevS3.section8 ?? {}),
                                                        ...(patch.section8 ?? {}),
                                                    },

                                                    // ✅ ข้อ 9
                                                    section9: {
                                                        ...(prevS3.section9 ?? {}),
                                                        ...(patch.section9 ?? {}),
                                                    },

                                                    // ✅ รายละเอียดเพิ่มเติมท้ายข้อ 9 (เป็น field ตรงๆ)
                                                    section9Extra1:
                                                        patch.section9Extra1 !== undefined ? patch.section9Extra1 : prevS3.section9Extra1,
                                                    section9Extra2:
                                                        patch.section9Extra2 !== undefined ? patch.section9Extra2 : prevS3.section9Extra2,
                                                },
                                            };
                                        })
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
                            ส่วนที่ 4 สรุปผลการตรวจสอบป้าย
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
                                    value={formData.sectionFour ?? {}}
                                    onChange={onSectionFourChange}
                                />
                            </div>
                        </div>
                    </div>
                </section>

                <hr className="my-2" />

                <span className="text-[30px] font-black text-black">แผนปฏิบัติการการตรวจบำรุงรักษาป้าย</span>

                <hr className="my-2" />

                {/* ส่วนที่ 1 */}
                <section className="w-full mb-3">
                    <button
                        type="button"
                        onClick={() => toggle("section2_1")}
                        aria-expanded={openSections.includes("section2_1")}
                        className="w-full grid h-[5vh] select-none cursor-pointer"
                    >
                        <span className="flex items-center justify-between gap-2 text-black md:text-xl font-bold tracking-wide rounded-xl bg-white px-4 py-2 border shadow-md hover:shadow-lg">
                            ส่วนที่ 1 ขอบเขตของการตรวจบำรุงรักษาป้าย และอุปกรณ์ประกอบของป้าย
                            <svg
                                className={`w-4 h-4 transition-transform ${openSections.includes("section2_1") ? "rotate-180" : ""}`}
                                viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"
                            >
                                <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" />
                            </svg>
                        </span>
                    </button>

                    {/* พื้นที่เนื้อหา: พับ/กางด้วย CSS grid trick */}
                    <div
                        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out
          ${openSections.includes("section2_1") ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                    >
                        <div className="overflow-hidden">
                            <div className="pt-2"> {/* เผื่อระยะห่างเล็กน้อยตอนกาง */}
                                <Section2_1Details />
                            </div>
                        </div>
                    </div>
                </section>

                {/* ส่วนที่ 2 */}
                <section className="w-full mb-3">
                    <button
                        type="button"
                        onClick={() => toggle("section2_2")}
                        aria-expanded={openSections.includes("section2_2")}
                        className="w-full grid h-[5vh] select-none cursor-pointer"
                    >
                        <span className="flex items-center justify-between gap-2 text-black md:text-xl font-bold tracking-wide rounded-xl bg-white px-4 py-2 border shadow-md hover:shadow-lg">
                            ส่วนที่ 2 แผนปฏิบัติการการตรวจบำรุงรักษาป้ายและอุปกรณ์ประกอบของป้าย
                            <svg
                                className={`w-4 h-4 transition-transform ${openSections.includes("section2_2") ? "rotate-180" : ""}`}
                                viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"
                            >
                                <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" />
                            </svg>
                        </span>
                    </button>

                    {/* พื้นที่เนื้อหา: พับ/กางด้วย CSS grid trick */}
                    <div
                        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out
          ${openSections.includes("section2_2") ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                    >
                        <div className="overflow-hidden">
                            <div className="pt-2"> {/* เผื่อระยะห่างเล็กน้อยตอนกาง */}
                                <Section2_2Details />
                            </div>
                        </div>
                    </div>
                </section>

                {/* ส่วนที่ 3 */}
                <section className="w-full mb-3">
                    <button
                        type="button"
                        onClick={() => toggle("section2_3")}
                        aria-expanded={openSections.includes("section2_3")}
                        className="w-full grid h-[5vh] select-none cursor-pointer"
                    >
                        <span className="flex items-center justify-between gap-2 text-black md:text-xl font-bold tracking-wide rounded-xl bg-white px-4 py-2 border shadow-md hover:shadow-lg">
                            ส่วนที่ 3 รายละเอียดที่ต้องตรวจบำรุงรักษาป้าย และอุปกรณ์ประกอบของป้าย
                            <svg
                                className={`w-4 h-4 transition-transform ${openSections.includes("section2_3") ? "rotate-180" : ""}`}
                                viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"
                            >
                                <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" />
                            </svg>
                        </span>
                    </button>

                    {/* พื้นที่เนื้อหา: พับ/กางด้วย CSS grid trick */}
                    <div
                        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out
          ${openSections.includes("section2_3") ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                    >
                        <div className="overflow-hidden">
                            <div className="pt-2"> {/* เผื่อระยะห่างเล็กน้อยตอนกาง */}
                                <Section2_3Details />
                            </div>
                        </div>
                    </div>
                </section>

                {/* ส่วนที่ 4 */}
                <section className="w-full mb-3">
                    <button
                        type="button"
                        onClick={() => toggle("section2_4")}
                        aria-expanded={openSections.includes("section2_4")}
                        className="w-full grid h-[5vh] select-none cursor-pointer"
                    >
                        <span className="flex items-center justify-between gap-2 text-black md:text-xl font-bold tracking-wide rounded-xl bg-white px-4 py-2 border shadow-md hover:shadow-lg">
                            ส่วนที่ 4 แนวทางการตรวจบำรุงรักษาป้าย และอุปกรณ์ประกอบของป้ายประจำปี
                            <svg
                                className={`w-4 h-4 transition-transform ${openSections.includes("section2_4") ? "rotate-180" : ""}`}
                                viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"
                            >
                                <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" />
                            </svg>
                        </span>
                    </button>

                    {/* พื้นที่เนื้อหา: พับ/กางด้วย CSS grid trick */}
                    <div
                        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out
          ${openSections.includes("section2_4") ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                    >
                        <div className="overflow-hidden">
                            <div className="pt-2"> {/* เผื่อระยะห่างเล็กน้อยตอนกาง */}
                                <Section2_4Details />
                            </div>
                        </div>
                    </div>
                </section>

                {/* ส่วนที่ 5 */}
                <section className="w-full mb-3">
                    <button
                        type="button"
                        onClick={() => toggle("section2_5")}
                        aria-expanded={openSections.includes("section2_5")}
                        className="w-full grid h-[5vh] select-none cursor-pointer"
                    >
                        <span className="flex items-center justify-between gap-2 text-black md:text-xl font-bold tracking-wide rounded-xl bg-white px-4 py-2 border shadow-md hover:shadow-lg">
                            ส่วนที่ 5 ช่วงเวลา และความถี่ในการตรวจบำรุงรักษาป้าย และอุปกรณ์ประกอบของป้าย
                            <svg
                                className={`w-4 h-4 transition-transform ${openSections.includes("section2_5") ? "rotate-180" : ""}`}
                                viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"
                            >
                                <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" />
                            </svg>
                        </span>
                    </button>

                    {/* พื้นที่เนื้อหา: พับ/กางด้วย CSS grid trick */}
                    <div
                        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out
          ${openSections.includes("section2_5") ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                    >
                        <div className="overflow-hidden">
                            <div className="pt-2"> {/* เผื่อระยะห่างเล็กน้อยตอนกาง */}
                                <Section2_5Details
                                    value={formData.section2_5}
                                    onChange={onSection2_5Change}
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* ส่วนที่ 6 */}
                <section className="w-full mb-3">
                    <button
                        type="button"
                        onClick={() => toggle("section2_6")}
                        aria-expanded={openSections.includes("section2_6")}
                        className="w-full grid h-[5vh] select-none cursor-pointer"
                    >
                        <span className="flex items-center justify-between gap-2 text-black md:text-xl font-bold tracking-wide rounded-xl bg-white px-4 py-2 border shadow-md hover:shadow-lg">
                            ส่วนที่ 6 ผลการตรวจสภาพป้าย และอุปกรณ์ประกอบของป้าย
                            <svg
                                className={`w-4 h-4 transition-transform ${openSections.includes("section2_6") ? "rotate-180" : ""}`}
                                viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"
                            >
                                <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" />
                            </svg>
                        </span>
                    </button>

                    {/* พื้นที่เนื้อหา: พับ/กางด้วย CSS grid trick */}
                    <div
                        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out
          ${openSections.includes("section2_6") ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                    >
                        <div className="overflow-hidden">
                            <div className="pt-2"> {/* เผื่อระยะห่างเล็กน้อยตอนกาง */}
                                <Section2_6Details
                                    form_code={formData.form_code}
                                    value={formData.section2_6}
                                    onChange={(patch) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            section2_6: {
                                                table1: {
                                                    ...(prev.section2_6?.table1 ?? {}),
                                                    ...(patch.table1 ?? {}),
                                                },
                                                table2: {
                                                    ...(prev.section2_6?.table2 ?? {}),
                                                    ...(patch.table2 ?? {}),
                                                },
                                            },
                                        }))
                                    }
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* ส่วนที่ 7 */}
                <section className="w-full mb-3">
                    <button
                        type="button"
                        onClick={() => toggle("section2_7")}
                        aria-expanded={openSections.includes("section2_7")}
                        className="w-full grid h-[5vh] select-none cursor-pointer"
                    >
                        <span className="flex items-center justify-between gap-2 text-black md:text-xl font-bold tracking-wide rounded-xl bg-white px-4 py-2 border shadow-md hover:shadow-lg">
                            ส่วนที่ 7 สรุปผลการตรวจบำรุงรักษาป้ายและอุปกรณ์ประกอบของป้าย
                            <svg
                                className={`w-4 h-4 transition-transform ${openSections.includes("section2_7") ? "rotate-180" : ""}`}
                                viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"
                            >
                                <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" />
                            </svg>
                        </span>
                    </button>

                    {/* พื้นที่เนื้อหา: พับ/กางด้วย CSS grid trick */}
                    <div
                        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out
          ${openSections.includes("section2_7") ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                    >
                        <div className="overflow-hidden">
                            <div className="pt-2"> {/* เผื่อระยะห่างเล็กน้อยตอนกาง */}
                                <Section2_7Details
                                    name={name}
                                    value={formData.section2_7}
                                    onChange={(patch) =>
                                        setFormData((prev: any) => ({
                                            ...prev,
                                            section2_7: {
                                                rows: {
                                                    ...(prev.section2_7?.rows ?? {}),
                                                    ...(patch.rows ?? {}), // merge rows ราย id
                                                },
                                                meta: {
                                                    ...(prev.section2_7?.meta ?? {}),
                                                    ...(patch.meta ?? {}), // merge meta
                                                },
                                            },
                                        }))
                                    }
                                />
                            </div>
                        </div>
                    </div>
                </section>

                <div className="flex">
                    <button
                        type="button"
                        onClick={handleSave}
                        className="ml-auto inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 font-medium text-white shadow-sm transition-colors hover:bg-sky-500 active:bg-sky-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            className="h-5 w-5"
                            fill="currentColor"
                            aria-hidden="true"
                        >
                            <path d="M3 4a2 2 0 0 1 2-2h7.586a2 2 0 0 1 1.414.586l2.414 2.414A2 2 0 0 1 17 6.414V17a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4Zm3 0h6v4H6V4Zm0 7a1 1 0 0 0-1 1v4h8v-4a1 1 0 0 0-1-1H6Z" />
                        </svg>
                        Save
                    </button>
                </div>
                <pre className="bg-gray-100 p-3 rounded-md text-sm overflow-x-auto text-black">
                    {JSON.stringify(formData.sectionThree, null, 2)}
                </pre>
            </div>
        </>
    )
}
