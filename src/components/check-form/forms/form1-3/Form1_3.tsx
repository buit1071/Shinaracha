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
import { showAlert, showConfirm } from "@/lib/fetcher";
import { exportToDocx } from "@/utils/exportToDocx";
import { exportToExcel } from "@/utils/exportToExcel";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Checkins } from "@/interfaces/master";
import { CameraIcon, XIcon, RefreshCwIcon, CheckIcon } from "lucide-react";

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

const ZONE_IDS = {
    ROUND_1: "FORM-53242768", // 1 รอบ
    ROUND_2: "FORM-35898338", // 2 รอบ
    ROUND_3: "FORM-11057862", // 3 รอบ
};

export interface CheckinPayload {
    job_id: string;
    equipment_id: string;
    check_in_by: string; // username
    check_in_date: string; // ISO String หรือ format ที่ DB ต้องการ
    check_in_lat: string;
    check_in_long: string;
    check_in_image: string; // ชื่อไฟล์
}

const getRoundCount = (zoneId: string | number | null): number => {
    if (!zoneId) return 0;
    const idStr = String(zoneId);
    if (idStr === ZONE_IDS.ROUND_1) return 1;
    if (idStr === ZONE_IDS.ROUND_2) return 2;
    if (idStr === ZONE_IDS.ROUND_3) return 3;
    return 0;
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

    const [roundCount, setRoundCount] = React.useState<number>(0);

    const CheckFormType = async () => {
        if (!equipment_id) return;

        showLoading(true);
        try {
            const res = await fetch("/api/auth/equipment/get", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ function: "CheckFormType", equipment_id: equipment_id }),
            });

            const resData = await res.json();

            if (resData.success) {
                const zoneId = resData.data;
                const rounds = getRoundCount(zoneId);
                setRoundCount(rounds);
                // setRoundCount(1); // ไม่ต้อง fallback เป็น 1 แล้ว เพราะ getRoundCount จัดการแล้ว หรือถ้าจะ fallback ควรเช็คดีๆ
            } else {
                setRoundCount(1); // Fallback กรณี Error ให้แสดงอย่างน้อย 1 รอบ
            }
        } catch (err) {
            setRoundCount(1); // Fallback
        } finally {
            showLoading(false);
        }
    };

    const generateCheckInFileName = (text: string) => {
        const d = new Date();
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        const hh = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        const ss = String(d.getSeconds()).padStart(2, '0');
        return `${text}_${dd}${mm}${yyyy}_${hh}${min}${ss}.jpg`; // หรือ .png
    };

    React.useEffect(() => {
        CheckFormType();
    }, [equipment_id]);

    const [formData, setFormData] = React.useState<FormData>({});
    const [coverSrc, setCoverSrc] = React.useState<string | null>(null);
    const [openSections, setOpenSections] = React.useState<string[]>([]);
    const [isApprovable, setIsApprovable] = React.useState(false);
    const [isSaveable, setIsSaveable] = React.useState(false);

    const [checkInData, setCheckInData] = React.useState<Checkins | null>(null);
    const [isCameraOpen, setIsCameraOpen] = React.useState(false); // สถานะเปิดกล้อง
    const [capturedImage, setCapturedImage] = React.useState<string | null>(null); // รูปที่ถ่ายได้ (Base64/Blob URL)
    const [imageFile, setImageFile] = React.useState<File | null>(null); // ไฟล์รูปสำหรับ upload
    const [isSubmitting, setIsSubmitting] = React.useState(false); // สถานะกำลังส่งข้อมูล

    const videoRef = React.useRef<HTMLVideoElement>(null);
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const streamRef = React.useRef<MediaStream | null>(null);

    const startCamera = async () => {
        setIsCameraOpen(true);
        setCapturedImage(null); // เคลียร์รูปเก่า
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: "environment", // พยายามใช้กล้องหลัง
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Camera Error:", err);
            await showAlert("error", "ไม่สามารถเปิดกล้องได้ กรุณาอนุญาตการเข้าถึงกล้อง");
            setIsCameraOpen(false);
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsCameraOpen(false);
    };

    const takePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;

            // ตั้งขนาด canvas ตาม video
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            // วาดรูปจาก video ลง canvas
            const context = canvas.getContext('2d');
            if (context) {
                context.drawImage(video, 0, 0, canvas.width, canvas.height);

                // แปลงเป็น Blob/File เพื่อเตรียม Upload
                canvas.toBlob((blob) => {
                    if (blob) {
                        const newFileName = generateCheckInFileName("CHECKIN");
                        const file = new File([blob], newFileName, { type: "image/jpeg" });

                        setImageFile(file); // เก็บไฟล์ไว้ส่ง API
                        setCapturedImage(URL.createObjectURL(blob)); // แสดงตัวอย่าง

                        // หยุดกล้องชั่วคราวเพราะถ่ายเสร็จแล้ว
                        stopCamera();
                    }
                }, 'image/jpeg', 0.8); // quality 0.8
            }
        }
    };

    const handleConfirmCheckIn = async () => {
        if (!imageFile) return;
        setIsSubmitting(true);
        showLoading(true);

        try {
            // 4.1 หาพิกัด GPS
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                });
            });

            const lat = position.coords.latitude.toString();
            const lng = position.coords.longitude.toString();

            // 4.2 อัปโหลดรูปภาพ
            const uploadFd = new FormData();
            uploadFd.append("file", imageFile);
            uploadFd.append("filename", imageFile.name);

            const uploadRes = await fetch("/api/auth/upload-file", {
                method: "POST",
                body: uploadFd,
            });
            const uploadData = await uploadRes.json();

            if (!uploadRes.ok || !uploadData.success) {
                throw new Error(uploadData.error || "อัปโหลดรูปไม่สำเร็จ");
            }

            // 4.3 ส่งข้อมูล Check In เข้า DB
            const payload: CheckinPayload = {
                job_id: jobId,
                equipment_id: equipment_id,
                check_in_by: username,
                check_in_date: new Date().toISOString(),
                check_in_lat: lat,
                check_in_long: lng,
                check_in_image: imageFile.name,
            };

            await submitCheckIn(payload);

        } catch (err: any) {
            console.error("Submit Error:", err);
            showLoading(false);
            await showAlert("error", "เกิดข้อผิดพลาด: " + (err.message || "ไม่สามารถเช็คอินได้"));
        } finally {
            setIsSubmitting(false);
            setCapturedImage(null);
            setImageFile(null);
            showLoading(false);
        }
    };

    const submitCheckIn = async (payload: CheckinPayload) => {
        const res = await fetch("/api/auth/forms/post", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                entity: "SaveCheckIn",
                data: payload
            }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
            showLoading(false);
            await showAlert("success", "เช็คอินเรียบร้อยแล้ว");
            fetchCheckInStatus(); // Refresh ข้อมูล
        } else {
            showLoading(false);
            throw new Error(data.message || "บันทึกข้อมูลไม่สำเร็จ");
        }
    };

    React.useEffect(() => {
        return () => {
            stopCamera();
        };
    }, []);

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
            // ✅ 1. Destructure sectionThree
            const { cover, sectionTwo, sectionFour, sectionThree, ...rest } = formData;

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

            // ✅ Helper: Clean defects array (upload photos inside defects)
            const cleanDefectsList = async (defects: any[] | undefined) => {
                if (!Array.isArray(defects)) return [];

                return await Promise.all(
                    defects.map(async (def: any) => {
                        const photos = Array.isArray(def.photos) ? def.photos : [];
                        const cleanedPhotos = await Promise.all(
                            photos.map(async (p: any) => {
                                if (p?.src) {
                                    const name = await uploadImageSource(p.src, p.filename ?? null);
                                    return name ? { filename: name } : null;
                                }
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
            };

            // ✅ Helper: Process Section 3 (Items 1-7, 8, 9)
            const cleanSectionThree = async (s3: any) => {
                if (!s3) return s3;

                // 1. Clean items (1-7) -> defect_by_visit
                const cleanItems = async (items: Record<string, any> | undefined) => {
                    if (!items) return {};
                    const out: Record<string, any> = {};

                    for (const [rowId, row] of Object.entries(items)) {
                        if (!row) continue;
                        const map = row.defect_by_visit ?? {};
                        const nextMap: any = {};

                        for (const [vk, defs] of Object.entries(map)) {
                            nextMap[vk] = await cleanDefectsList(defs as any[]);
                        }

                        out[rowId] = { ...row, defect_by_visit: nextMap };
                    }
                    return out;
                };

                // 2. Clean table rows (Section 8 & 9) -> wear_defects, damage_defects
                const cleanTableRows = async (table: Record<string, any> | undefined) => {
                    if (!table) return {};
                    const out: Record<string, any> = {};

                    for (const [rowId, row] of Object.entries(table)) {
                        if (!row) continue;

                        const nextRow = { ...row };

                        if (row.wear_defects) {
                            nextRow.wear_defects = await cleanDefectsList(row.wear_defects);
                        }
                        if (row.damage_defects) {
                            nextRow.damage_defects = await cleanDefectsList(row.damage_defects);
                        }

                        out[rowId] = nextRow;
                    }
                    return out;
                };

                return {
                    ...s3,
                    items: await cleanItems(s3.items),
                    section8: await cleanTableRows(s3.section8),
                    section9: await cleanTableRows(s3.section9),
                };
            };

            // ... (Existing Clean Functions: cleanSection2_6, cleanPhotoList, processTable) ...
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
                            nextMap[vk] = await cleanDefectsList(defs as any[]); // Reused cleanDefectsList
                        }
                        out[rowId] = { ...row, defect_by_visit: nextMap };
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
            // 2) Upload SectionTwo images
            // ============================================================
            const s2 = (sectionTwo ?? {}) as any;
            const pickSrc = (preview: any, original: any) => preview ?? original;

            const [
                mapSketchName, mapSketch1Name,
                shapeSketchName, shapeSketch1Name,
                photosFrontName, photosSideName, photosBaseName,
                photosFront1Name, photosSide1Name, photosBase1Name,
                photosFront2Name, photosSide2Name, photosBase2Name,
                photosFront3Name, photosSide3Name, photosBase3Name,
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
                uploadImageSource(pickSrc(s2.photosFrontPreview2, s2.photosFront2), toPlainFilename(s2.photosFront2)),
                uploadImageSource(pickSrc(s2.photosSidePreview2, s2.photosSide2), toPlainFilename(s2.photosSide2)),
                uploadImageSource(pickSrc(s2.photosBasePreview2, s2.photosBase2), toPlainFilename(s2.photosBase2)),
                uploadImageSource(pickSrc(s2.photosFrontPreview3, s2.photosFront3), toPlainFilename(s2.photosFront3)),
                uploadImageSource(pickSrc(s2.photosSidePreview3, s2.photosSide3), toPlainFilename(s2.photosSide3)),
                uploadImageSource(pickSrc(s2.photosBasePreview3, s2.photosBase3), toPlainFilename(s2.photosBase3)),
            ]);

            const {
                mapSketchPreview, mapSketchPreview1,
                shapeSketchPreview, shapeSketchPreview1,
                photosFrontPreview, photosSidePreview, photosBasePreview,
                photosFrontPreview1, photosSidePreview1, photosBasePreview1,
                photosFrontPreview2, photosSidePreview2, photosBasePreview2,
                photosFrontPreview3, photosSidePreview3, photosBasePreview3,
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
                photosFront2: photosFront2Name ?? sectionTwoBase.photosFront2,
                photosSide2: photosSide2Name ?? sectionTwoBase.photosSide2,
                photosBase2: photosBase2Name ?? sectionTwoBase.photosBase2,
                photosFront3: photosFront3Name ?? sectionTwoBase.photosFront3,
                photosSide3: photosSide3Name ?? sectionTwoBase.photosSide3,
                photosBase3: photosBase3Name ?? sectionTwoBase.photosBase3,
            };

            // ============================================================
            // 3) Upload SectionFour photos
            // ============================================================
            // ... (Section Four Logic remains same, omitted for brevity but include in your code) ...
            let sectionFourClean = sectionFour; // Placeholder, use existing logic

            // ============================================================
            // 4) Process Section 2.6 & Section 3 (Images)
            // ============================================================
            const section2_6Clean = await cleanSection2_6((rest as any).section2_6);

            // ✅ Clean Section 3
            const sectionThreeClean = await cleanSectionThree(sectionThree);

            // ============================================================
            // 5) Prepare payload
            // ============================================================
            const payload: any = {
                entity: "form1_3",
                data: {
                    ...rest,
                    sectionTwo: sectionTwoClean,
                    sectionFour: sectionFourClean,
                    section2_6: section2_6Clean,
                    sectionThree: sectionThreeClean, // ✅ Add processed sectionThree
                    job_id: jobId,
                    equipment_id: equipment_id,
                    is_active: 1,
                    created_by: username,
                    updated_by: username,
                },
            };

            if (formData.form_code) payload.data.form_code = formData.form_code;

            // ============================================================
            // 6) Save form data
            // ============================================================
            const res = await fetch("/api/auth/forms/post", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                stopLoading();
                await showAlert("success", data.message);

                if (data.form_code && !formData.form_code) {
                    setFormData((prev) => ({ ...prev, form_code: data.form_code }));
                }
                onBack();
                return;
            }

            await alertAndStop("error", data.message || "บันทึกไม่สำเร็จ");
        } catch (err: any) {
            await alertAndStop("error", err?.message || "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
        } finally {
            stopLoading();
        }
    };

    const CheckSave = async () => {
        try {
            if (!jobId || !equipment_id) return false;

            const payload = {
                entity: "check_save",
                data: {
                    job_id: jobId,
                    equipment_id: equipment_id,
                }
            };

            const res = await fetch("/api/auth/forms/post", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const result = await res.json();
            return result.success; // ✅ API คืนค่า true/false ตาม Logic ใหม่แล้ว

        } catch (err) {
            console.error("CheckSave Error:", err);
            return false;
        }
    };

    const handleApprove = async () => {
        // 1. ตรวจสอบข้อมูลก่อน
        if (!formData.form_code) {
            showAlert("error", "ไม่พบรหัสฟอร์ม กรุณาบันทึกข้อมูลก่อนอนุมัติ");
            return;
        }

        // 2. ✅ เรียกใช้ showConfirm เพื่อยืนยัน
        const isConfirmed = await showConfirm(
            "เมื่ออนุมัติแล้วจะไม่สามารถแก้ไขข้อมูลได้อีก", // message (ข้อความเตือน)
            "ยืนยันการอนุมัติ?", // title (หัวข้อ)
            "ยืนยันอนุมัติ", // confirmText (ปุ่มยืนยัน)
            "ยกเลิก" // cancelText (ปุ่มยกเลิก)
        );

        // 3. ถ้ากด "ยกเลิก" ให้หยุดทำงานทันที
        if (!isConfirmed) return;

        // 4. เริ่มกระบวนการส่งข้อมูล
        showLoading(true);
        try {
            const payload = {
                entity: "approve",
                form_code: formData.form_code,
                updated_by: username,
            };

            // ยิง API ไปที่ endpoint สำหรับ approve
            const res = await fetch("/api/auth/forms/post", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const result = await res.json();

            showLoading(false); // ย้ายไป finally จะดีกว่าครับ

            if (result.success) {
                await showAlert("success", result.message || "อนุมัติรายการสำเร็จ");
                onBack();
                return;
            } else {
                showAlert("error", result.message || "การอนุมัติล้มเหลว");
            }
        } catch (err) {
            showAlert("error", "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
        } finally {
            // showLoading(false); // ✅ ทำงานเสมอไม่ว่าจะสำเร็จหรือล้มเหลว
        }
    };

    const CheckApprove = async () => {
        try {
            if (!jobId || !equipment_id) return false;

            const payload = {
                entity: "check_approve",
                data: {
                    job_id: jobId,
                    equipment_id: equipment_id,
                }
            };

            const res = await fetch("/api/auth/forms/post", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const result = await res.json();
            return result.success;

        } catch (err) {
            console.error("CheckApprove Error:", err);
            return false;
        }
    };

    const fetchCheckInStatus = React.useCallback(async () => {
        // ถ้าไม่มี Job ID หรือ Equipment ID ไม่ต้องยิง
        if (!jobId || !equipment_id) return;
        showLoading(true);

        try {
            // สมมติว่า endpoint คือตัวเดียวกับที่ใช้ viewEq (หรือเปลี่ยนเป็น path ที่คุณเอา logic ไปวาง)
            const res = await fetch("/api/auth/forms/get", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    function: "RCheckIn",
                    job_id: jobId,
                    equipment_id: equipment_id,
                }),
            });

            const data = await res.json();

            if (data.success && data.exists) {
                setCheckInData(data.data); // เก็บข้อมูลลง State
                showLoading(false);
            } else {
                setCheckInData(null); // เคลียร์ค่าถ้าไม่เจอ
                showLoading(false);
            }

        } catch (err) {
            console.error("Error fetching check-in status:", err);
            setCheckInData(null);
            showLoading(false);
        }
    }, [jobId, equipment_id]);

    React.useEffect(() => {
        fetchCheckInStatus();
    }, [fetchCheckInStatus]);

    React.useEffect(() => {
        if (!jobId) return;

        const initData = async () => {
            showLoading(true); // ✅ เปิด Loading
            try {
                // 1. โหลดข้อมูลฟอร์ม
                await fecthFormDetail();

                // 2. เช็คสิทธิ์ Approve และ Set State
                const canApprove = await CheckApprove();
                setIsApprovable(canApprove);

                // 3. ✅ เช็คสิทธิ์ Save และ Set State
                const canSave = await CheckSave();
                setIsSaveable(canSave);

            } catch (err) {
                console.error("Error init data:", err);
            } finally {
                showLoading(false); // ✅ ปิด Loading เมื่อเสร็จทุกอย่าง
            }
        };

        initData();
    }, [jobId, equipment_id]); // เช็คใหม่เมื่อ ID เปลี่ยน

    return (
        <>
            {checkInData ? (
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
                            onClick={() => exportToDocx(roundCount, isShinaracha, formData)}
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
                        companyTh={isShinaracha ? "บริษัท ชินรัช โฟร์เทคเตอร์ จำกัด" : "บริษัท โปรไฟร์ อินสเปคเตอร์ จำกัด"}
                        companyEn={isShinaracha ? "Shinaracha Frotector Co., Ltd." : "Profire Inspector Co., Ltd."}
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
                                        eq_id={equipment_id}
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

                    <div className="flex gap-2 justify-end">
                        {isApprovable && (
                            <button
                                type="button"
                                onClick={handleApprove}
                                // เอา ml-auto ออก เพราะเราจัดที่ div แม่แล้ว
                                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white shadow-sm transition-colors hover:bg-emerald-500 active:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    className="h-5 w-5"
                                    aria-hidden="true"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                ส่งงาน
                            </button>
                        )}

                        {isSaveable && (
                            <button
                                type="button"
                                onClick={handleSave}
                                className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 font-medium text-white shadow-sm transition-colors hover:bg-sky-500 active:bg-sky-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                                    <path d="M3 4a2 2 0 0 1 2-2h7.586a2 2 0 0 1 1.414.586l2.414 2.414A2 2 0 0 1 17 6.414V17a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4Zm3 0h6v4H6V4Zm0 7a1 1 0 0 0-1 1v4h8v-4a1 1 0 0 0-1-1H6Z" />
                                </svg>
                                บันทึก
                            </button>
                        )}
                    </div>
                    {/* <pre className="bg-gray-100 p-3 rounded-md text-sm overflow-x-auto text-black">
                    {JSON.stringify(formData.sectionTwo, null, 2)}
                </pre> */}
                </div>
            ) : (
                <div className="flex flex-col items-center gap-4">

                    {/* --- โหมดกล้อง Live View --- */}
                    {isCameraOpen && !capturedImage && (
                        <div className="relative w-full max-w-md bg-black rounded-lg overflow-hidden aspect-[3/4]">
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                className="w-full h-full object-cover"
                            />

                            {/* ปุ่มปิดกล้อง */}
                            <button
                                onClick={stopCamera}
                                className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70"
                            >
                                <XIcon className="w-6 h-6" />
                            </button>

                            {/* ปุ่มชัตเตอร์ */}
                            <div className="absolute bottom-6 w-full flex justify-center">
                                <button
                                    onClick={takePhoto}
                                    className="w-16 h-16 bg-white rounded-full border-4 border-gray-300 shadow-lg active:scale-95 transition-transform"
                                />
                            </div>
                        </div>
                    )}

                    {/* --- โหมด Preview รูปที่ถ่ายได้ --- */}
                    {capturedImage && (
                        <div className="flex flex-col items-center gap-4 w-full max-w-md">
                            <div className="relative w-full aspect-[3/4] bg-black rounded-lg overflow-hidden">
                                <img src={capturedImage} alt="Preview" className="w-full h-full object-contain" />
                            </div>

                            <div className="flex gap-4 w-full">
                                <button
                                    onClick={startCamera} // ถ่ายใหม่
                                    disabled={isSubmitting}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                                >
                                    <RefreshCwIcon className="w-5 h-5" /> ถ่ายใหม่
                                </button>
                                <button
                                    onClick={handleConfirmCheckIn} // ยืนยัน
                                    disabled={isSubmitting}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <span className="animate-spin">⏳</span>
                                    ) : (
                                        <>
                                            <CheckIcon className="w-5 h-5" /> ยืนยัน
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* --- ปุ่มเริ่มต้น (หน้าแรก) --- */}
                    {!isCameraOpen && !capturedImage && (
                        <div className="w-full p-6 border-2 border-dashed border-red-300 rounded-lg bg-red-50 flex flex-col items-center gap-4">
                            <div className="text-red-600 font-semibold text-lg text-center animate-pulse">
                                กรุณาถ่ายรูป Check In เพื่อดำเนินการต่อ
                            </div>

                            <button
                                onClick={startCamera}
                                className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 active:scale-95 transition-all"
                            >
                                <CameraIcon className="w-6 h-6" />
                                <span>เปิดกล้องถ่ายรูป</span>
                            </button>

                            <div className="text-xs text-gray-500 text-center">
                                * ระบบจะบันทึกพิกัดและเวลาอัตโนมัติ
                            </div>
                        </div>
                    )}

                    {/* Canvas ซ่อนไว้ใช้วาดรูป */}
                    <canvas ref={canvasRef} className="hidden" />
                </div>
            )}
        </>
    )
}
