import * as React from "react";

import Select from "react-select";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import { PencilIcon } from "@heroicons/react/24/outline";
import { showLoading } from "@/lib/loading";

import { ProblemRow, DefectRow } from "@/interfaces/master";
/* ========================== TYPES ========================== */
export type UseStatus = "ok" | "ng" | ""; // ใช้ได้ / ใช้ไม่ได้

type PhotoItem = { src?: string; filename: string };
export type Defect = {
    problem_id?: string;
    problem_name: string;
    photos?: PhotoItem[];
    isOther?: boolean;
    note?: string;
    illegal_suggestion?: string;
    defect?: string | number | null;
    defect_name?: string;
};

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
    defect_by_visit?: Record<string, Defect[]>;
};

export type YesNo = "yes" | "no" | "";
export type OkNg = "ok" | "ng" | "";

export type Section8Row = {
    exist?: YesNo; // มี / ไม่มี
    wear?: YesNo; // การชำรุดสึกหรอ มี / ไม่มี
    wear_defects?: Defect[]; // ✨ ลูกคนที่ 3: เก็บข้อมูล Defect ของการชำรุด
    damage?: YesNo; // ความเสียหาย มี / ไม่มี
    damage_defects?: Defect[];
    stability?: OkNg; // ความมั่นคงผู้ตรวจสอบ ใช้ได้ / ใช้ไม่ได้
    note?: string; // หมายเหตุ
    labelExtra?: string; // สำหรับ "อื่น ๆ (โปรดระบุ)"
};

export type Section9Row = {
    exist?: YesNo;
    wear?: YesNo;
    wear_defects?: Defect[];
    damage?: YesNo;
    damage_defects?: Defect[];
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

const VISIT_KEY = "v1"; // สมมติว่าเป็น visit 1
const VISIT_LABEL: Record<string, string> = { v1: "รอบที่ 1" };

const selectStyles = {
    control: (base: any, state: any) => ({
        ...base,
        backgroundColor: "#fff",
        borderColor: state.isFocused ? "#3b82f6" : "#d1d5db",
        boxShadow: "none",
        color: "#111827",
        "&:hover": { borderColor: state.isFocused ? "#3b82f6" : "#9ca3af" },
    }),

    menuPortal: (base: any) => ({ ...base, zIndex: 2100 }),

    menu: (base: any) => ({
        ...base,
        backgroundColor: "#fff",
        color: "#111827",
        boxShadow: "0 8px 24px rgba(0,0,0,.2)",
        border: "1px solid #e5e7eb",
    }),

    menuList: (base: any) => ({
        ...base,
        backgroundColor: "#fff",
        color: "#111827",
    }),

    option: (base: any, state: any) => ({
        ...base,
        color: "#111827",               // ✅ ตัวหนังสือใน option เป็นสีดำ
        backgroundColor: state.isSelected
            ? "#2563eb"                    // selected
            : state.isFocused
                ? "#eff6ff"                    // hover
                : "#ffffff",
        cursor: "pointer",
    }),

    placeholder: (base: any) => ({ ...base, color: "#111827", opacity: 0.7 }),
    singleValue: (base: any) => ({ ...base, color: "#111827" }),
    input: (base: any) => ({ ...base, color: "#111827" }),

    // ✅ กรณี isMulti
    multiValue: (base: any) => ({ ...base, backgroundColor: "#e5e7eb" }),
    multiValueLabel: (base: any) => ({ ...base, color: "#111827" }),
    multiValueRemove: (base: any) => ({ ...base, color: "#111827", ":hover": { backgroundColor: "#d1d5db" } }),
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

export default function SectionThreeDetails({ value,
    onChange,
}: Props) {
    const buildRemoteCoverUrl = (name: string) =>
        `${process.env.NEXT_PUBLIC_N8N_UPLOAD_FILE}?name=${encodeURIComponent(name)}`;
    const [viewTarget, setViewTarget] = React.useState<{ defectIndex: number; photoIndex: number } | null>(null);
    const [camTarget, setCamTarget] = React.useState<{ defectIndex: number } | null>(null);
    const [problems, setProblems] = React.useState<ProblemRow[]>([]);
    const [defects, setDefects] = React.useState<DefectRow[]>([]);

    // Popup State
    const [photoPopup, setPhotoPopup] = React.useState<{
        id: string;
        visit: string;
        section: "items" | "section8" | "section9"; // บอกว่ามาจากส่วนไหน
        defectType?: "wear" | "damage"; // เฉพาะ 8-9 บอกว่าเป็น defect ของช่องไหน
    } | null>(null);
    const [selectedProblems, setSelectedProblems] = React.useState<Defect[]>([]);
    const [error, setError] = React.useState(false);

    // Camera/Overlay State
    const [camOpen, setCamOpen] = React.useState(false);
    const [overlayMode, setOverlayMode] = React.useState<"camera" | "viewer">("camera");
    const [captured, setCaptured] = React.useState<string | null>(null); // base64
    const [capturedName, setCapturedName] = React.useState<string | null>(null);
    const [activeDefectIndex, setActiveDefectIndex] = React.useState<number | null>(null); // index ของ defect ที่กำลังจัดการรูป
    const [viewingPhotoIndex, setViewingPhotoIndex] = React.useState<number | null>(null); // index ของรูปที่กำลังดู

    const videoRef = React.useRef<HTMLVideoElement>(null);
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const streamRef = React.useRef<MediaStream | null>(null);

    const openViewer = (defectIndex: number, photoIndex: number) => {
        const photo = selectedProblems[defectIndex]?.photos?.[photoIndex];
        if (!photo) return;
        setViewTarget({ defectIndex, photoIndex });

        // ✅ แก้ไข: เช็ค src ก่อน ถ้าไม่มีให้สร้าง URL จาก filename
        const imgUrl = photo.src || (photo.filename ? buildRemoteCoverUrl(photo.filename) : null);

        setCaptured(imgUrl);
        setCapturedName(photo.filename);
        setOverlayMode("viewer");
        setCamOpen(true);
    };

    const deleteViewedPhoto = () => {
        if (!viewTarget) return;
        const { defectIndex, photoIndex } = viewTarget;

        setSelectedProblems(prev => prev.map((p, idx) => {
            if (idx !== defectIndex) return p;
            const newPhotos = [...(p.photos ?? [])];
            newPhotos.splice(photoIndex, 1);
            return { ...p, photos: newPhotos };
        }));

        closeCamera();
    };

    /* -------------------- Popup Logic -------------------- */
    const openDefectPopup = (
        id: string,
        section: "items" | "section8" | "section9",
        defectType?: "wear" | "damage"
    ) => {
        let currentDefects: Defect[] = [];

        // 1. ดึงข้อมูลเก่ามาแสดง (ถ้ามี)
        if (section === "items") {
            // Logic เดิมของข้อ 1-7
            const row = items[id] ?? {};
            currentDefects = row.defect_by_visit?.[VISIT_KEY] ?? [];
        } else if (section === "section8") {
            // Logic ของข้อ 8
            const row = section8State[id] ?? {};
            if (defectType === "wear") currentDefects = row.wear_defects ?? [];
            else if (defectType === "damage") currentDefects = row.damage_defects ?? [];
        } else if (section === "section9") {
            // Logic ของข้อ 9
            const row = section9State[id] ?? {};
            if (defectType === "wear") currentDefects = row.wear_defects ?? [];
            else if (defectType === "damage") currentDefects = row.damage_defects ?? [];
        }

        setSelectedProblems(currentDefects);
        setPhotoPopup({ id, visit: VISIT_KEY, section, defectType });
        setError(false);
    };

    const saveDefectPopup = () => {
        if (!photoPopup) return;

        // Validation (เหมือนเดิม)
        const other = selectedProblems.find((p) => p.isOther);
        if (other) {
            const isMissing = !other.problem_name?.trim() || !other.illegal_suggestion?.trim();
            if (isMissing) { setError(true); return; }
        }

        const { id, visit, section, defectType } = photoPopup;

        // บันทึกตาม Section
        if (section === "items") {
            // Save 1-7
            const row = items[id] ?? {};
            const nextMap = { ...(row.defect_by_visit ?? {}), [visit]: [...selectedProblems] };
            emit(id, { defect_by_visit: nextMap });

        } else if (section === "section8" && defectType) {
            // Save 8
            if (defectType === "wear") emit8(id, { wear_defects: [...selectedProblems] });
            else if (defectType === "damage") emit8(id, { damage_defects: [...selectedProblems] });

        } else if (section === "section9" && defectType) {
            // Save 9
            if (defectType === "wear") emit9(id, { wear_defects: [...selectedProblems] });
            else if (defectType === "damage") emit9(id, { damage_defects: [...selectedProblems] });
        }

        setPhotoPopup(null);
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: false,
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                try { await videoRef.current.play(); } catch { }
            }
        } catch (err) {
            console.error("Camera error:", err);
            alert("ไม่สามารถเปิดกล้องได้");
        }
    };

    const stopStream = () => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
    };

    const openCamera = (defectIndex: number) => {
        setActiveDefectIndex(defectIndex);
        setOverlayMode("camera");
        setCaptured(null);
        setCamOpen(true);
        startCamera();
    };

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;
        const v = videoRef.current;
        const c = canvasRef.current;
        const ctx = c.getContext("2d");
        if (!ctx) return;

        c.width = v.videoWidth;
        c.height = v.videoHeight;
        ctx.drawImage(v, 0, 0, c.width, c.height);

        setCaptured(c.toDataURL("image/jpeg", 0.8));
        setCapturedName(makeDefectName());
        stopStream();
    };

    const confirmPhoto = () => {
        if (activeDefectIndex === null || !captured) return;

        const newPhoto: PhotoItem = {
            filename: capturedName ?? makeDefectName(),
            src: captured
        };

        setSelectedProblems(prev => prev.map((p, idx) => {
            if (idx !== activeDefectIndex) return p;
            // Limit 2 photos per defect? (Logic เดิมมี slice(0,2))
            const nextPhotos = [...(p.photos ?? []), newPhoto].slice(0, 2);
            return { ...p, photos: nextPhotos };
        }));

        closeCamera();
    };

    const retakePhoto = async () => {
        setCaptured(null);
        setCapturedName(null);
        await startCamera();
    };

    const makeDefectName = (ext: string = "png") => {
        const d = new Date();
        const pad = (n: number) => String(n).padStart(2, "0");
        return `defect_${pad(d.getDate())}${pad(d.getMonth() + 1)}${d.getFullYear()}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}.${ext}`;
    };

    const closeCamera = () => {
        stopStream();
        setCamOpen(false);
        setCaptured(null);
        setCapturedName(null);
        setViewTarget(null);
        setCamTarget(null);
        setOverlayMode("camera");
    };

    /* -------------------- 1-7 -------------------- */
    const [items, setItems] = React.useState<Record<string, SectionThreeRow>>({});

    React.useEffect(() => {
        setItems(value?.items ?? {});
    }, [value?.items]);

    const fecthProblem = async () => {
        showLoading(true);
        try {
            const res = await fetch("/api/auth/legal-regulations/get", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ function: "problem" }),
            });
            const data = await res.json();
            if (data.success) setProblems(data.data);
        } finally {
            showLoading(false);
        }
    };

    const fecthDefect = async () => {
        showLoading(true);
        try {
            const res = await fetch("/api/auth/legal-regulations/get", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ function: "defect" }),
            });
            const data = await res.json();
            if (data.success) setDefects(data.data);
        } finally {
            showLoading(false);
        }
    };

    React.useEffect(() => {
        fecthProblem();
        fecthDefect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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

    // ✅ แก้ไข useEffect: ให้เติมค่า Default ลงไปใน State (items) อัตโนมัติ
    React.useEffect(() => {
        // วนลูปเช็ค ITEMS_1_7 ทุกตัว
        ITEMS_1_7.forEach((cfg, idx) => {
            const no = idx + 1;
            const id = `s3-${no}`;
            const existingRow = items[id];

            // ข้อความ Default
            const defaultTextPart1 = "หากมีการต่อเติม ดัดแปลง ปรับปรุงขนาด ให้แจ้งผู้ตรวจสอบป้าย";
            const defaultTextPart2 = "และต้องจัดหาวิศวกรที่รับรองความมั่นคงแข็งแรงโครงป้าย เพื่อตรวจสอบความปลอดภัยในการรับน้ำหนักของโครงป้าย";

            // เช็คสถานะปัจจุบัน (ถ้าไม่มีให้ถือว่าเป็น True ตาม Default UI)
            const isChecked = existingRow?.otherChecked ?? true;

            // เช็คว่าต้องเติมข้อมูลไหม? 
            // 1. ยังไม่มี row นี้ใน state เลย
            // 2. หรือ มีแล้ว และต้องติ๊กถูก แต่ข้อความยังว่างเปล่า
            const needUpdate = !existingRow || (isChecked && !existingRow.other1);

            if (needUpdate) {
                // สั่งบันทึกค่า Default ลงไปใน State จริงๆ
                emit(id, {
                    ...(existingRow || {}), // คงค่าเดิมอื่นๆ ไว้ (ถ้ามี)
                    otherChecked: isChecked,
                    other1: existingRow?.other1 || defaultTextPart1,
                    other2: existingRow?.other2 || defaultTextPart2,
                });
            }
        });
    }, [items]); // 👈 สำคัญ: ใส่ items ใน dependency เพื่อให้ทำงานซ้ำเมื่อโหลดข้อมูลเสร็จ

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

                // Logic: Set defaults if row data is missing/empty
                const existingRow = items[id];

                // Default warning text
                const defaultTextPart1 = "หากมีการต่อเติม ดัดแปลง ปรับปรุงขนาด ให้แจ้งผู้ตรวจสอบป้าย";
                const defaultTextPart2 = "และต้องจัดหาวิศวกรที่รับรองความมั่นคงแข็งแรงโครงป้าย เพื่อตรวจสอบความปลอดภัยในการรับน้ำหนักของโครงป้าย";

                // Merge defaults with existing state
                const row: SectionThreeRow = {
                    ...existingRow,
                    otherChecked: existingRow?.otherChecked ?? true, // Default checked
                    other1: existingRow?.other1 ?? defaultTextPart1, // Default text line 1
                    other2: existingRow?.other2 ?? defaultTextPart2, // Default text line 2
                };

                const isNG = row.status === "ng";

                return (
                    <div key={id} className="border border-gray-400 bg-white">
                        {/* ... Header and other inputs remain the same ... */}
                        <div className="border-b border-gray-400 bg-gray-200 px-3 py-2">
                            <div className="text-sm font-semibold leading-snug">
                                {no}. {cfg.title}
                            </div>
                        </div>

                        <div className="bg-gray-50 px-3 py-3 space-y-3">
                            {/* ... Checkboxes ... */}
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
                                    {/* ... Status Selection ... */}
                                    <div className="flex items-center gap-10">
                                        <label className="flex items-center gap-2 text-sm select-none">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4"
                                                checked={row.status === "ok"}
                                                onChange={(e) => setStatus(id, "ok", e.target.checked)}
                                            />
                                            <span>ใช้ได้</span>
                                        </label>

                                        <div className="flex items-center gap-2">
                                            <label className="flex items-center gap-2 text-sm select-none">
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4"
                                                    checked={row.status === "ng"}
                                                    onChange={(e) => setStatus(id, "ng", e.target.checked)}
                                                />
                                                <span>ใช้ไม่ได้</span>
                                            </label>

                                            {isNG && (
                                                <button
                                                    onClick={() => openDefectPopup(id, "items")}
                                                    className="ml-4 p-1 text-gray-500 hover:text-blue-600 transition-colors border border-transparent hover:border-gray-300 rounded cursor-pointer"
                                                    title="ระบุปัญหา (Defect)"
                                                    type="button"
                                                >
                                                    <PencilIcon className="w-5 h-5" />
                                                </button>
                                            )}
                                        </div>
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
                                            // ✅ แก้ไข onChange: บังคับยัด Text Default ลงไปทันทีที่กดติ๊ก
                                            emit(id, {
                                                otherChecked: v,
                                                other1: v ? defaultTextPart1 : "", // ถ้าติ๊ก -> ใส่ค่า Default เลย
                                                other2: v ? defaultTextPart2 : "",
                                            });
                                        }}
                                    />
                                    <span>อื่น ๆ (โปรดระบุ)</span>
                                </label>

                                <TwoLines
                                    disabled={!row.otherChecked}
                                    v1={existingRow?.other1 ?? defaultTextPart1}
                                    v2={existingRow?.other2 ?? defaultTextPart2}
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

            {/* ========================== ข้อ 8 (ปรับขนาดให้กระชับ) ========================== */}
            {(() => {
                // ลด padding ของ cell ลงเพื่อให้ตารางแน่นขึ้น
                const td = "border border-gray-400 px-1 py-1 align-middle text-center";
                const thBase = "border border-gray-400 px-1 py-2 font-semibold text-center text-xs"; // หัวข้อตัวเล็กหน่อย
                const thNoBottom = `${thBase} border-b-0`;
                const thNoTop = `${thBase} border-t-0`;

                // ฟังก์ชัน render input สำหรับ "อื่นๆ"
                const renderItemLabel = (rowId: string, text: string) => {
                    const isOther = text.includes("อื่น ๆ (โปรดระบุ)");
                    if (!isOther) return <span className="text-sm pl-1 text-left block">{text}</span>;

                    const v = section8State[rowId] ?? {};
                    return (
                        <div className="flex items-center gap-1 min-w-[120px] text-sm pl-1">
                            <span>- อื่น ๆ (โปรดระบุ)</span>
                            <input
                                className="flex-1 bg-transparent border-0 border-b border-dashed border-gray-400 focus:outline-none focus:border-blue-600 px-1 w-full text-xs"
                                value={v.labelExtra ?? ""}
                                onChange={(e) => emit8(rowId, { labelExtra: e.currentTarget.value })}
                            />
                        </div>
                    );
                };

                // Type & Data ROWS (เหมือนเดิม)
                type RowCfg = | { type: "group"; groupNo: string; label: string } | { type: "subgroup"; label: string } | { type: "item"; id: string; label: string };
                const ROWS: RowCfg[] = [
                    { type: "group", groupNo: "(1)", label: "สิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย" },
                    { type: "item", id: "s8-1-foundation", label: "- ฐานราก" },
                    { type: "item", id: "s8-1-anchor", label: "- การเชื่อมยึดของสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้ายกับฐานรากหรืออาคาร" },
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
                    <div className="mt-4 border border-gray-400 bg-white shadow-sm rounded-lg overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white font-semibold px-4 py-2 text-sm shadow-md">
                            8. การตรวจสอบการเชื่อมยึดระหว่างแผ่นป้ายกับสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย  การเชื่อมยึดระหว่างชิ้นส่วนต่าง ๆ ของสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย และการเชื่อมยึดระหว่างสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้ายกับฐานรากหรืออาคาร
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm border-collapse table-fixed min-w-[900px]">
                                <colgroup>
                                    <col className="w-[40px]" /> {/* ลำดับ */}
                                    <col className="w-[200px]" /> {/* รายการ (กว้างหน่อย) */}
                                    <col className="w-[35px]" /> {/* มี */}
                                    <col className="w-[35px]" /> {/* ไม่มี */}

                                    <col className="w-[35px]" /> {/* Wear: มี */}
                                    <col className="w-[35px]" /> {/* Wear: ไม่มี */}
                                    <col className="w-[35px]" /> {/* Wear: Defect */}

                                    <col className="w-[35px]" /> {/* Damage: มี */}
                                    <col className="w-[35px]" /> {/* Damage: ไม่มี */}
                                    <col className="w-[35px]" /> {/* Damage: Defect */}

                                    <col className="w-[40px]" /> {/* Stable: ใช้ได้ */}
                                    <col className="w-[40px]" /> {/* Stable: ไม่ได้ */}

                                    <col className="w-[100px]" /> {/* หมายเหตุ */}
                                </colgroup>

                                <thead>
                                    <tr className="bg-gray-200 text-gray-700">
                                        <th rowSpan={2} className={thBase}>ลำดับ</th>
                                        <th rowSpan={2} className={`${thBase} text-left pl-2`}>รายการ</th>

                                        <th className={thNoBottom}></th>
                                        <th className={thNoBottom}></th>

                                        <th colSpan={3} className={`${thBase} bg-orange-100/50`}>การชำรุดสึกหรอ</th>
                                        <th colSpan={3} className={`${thBase} bg-red-100/50`}>ความเสียหาย</th>
                                        <th colSpan={2} className={thBase}>ความมั่นคงผู้ตรวจสอบ</th>
                                        <th rowSpan={2} className={thBase}>หมายเหตุ</th>
                                    </tr>

                                    <tr className="bg-gray-200 text-gray-700">
                                        <th className={`${thNoTop}`}>มี</th>
                                        <th className={`${thNoTop}`}>ไม่มี</th>

                                        <th className={`${thBase} bg-orange-100/50`}>มี</th>
                                        <th className={`${thBase} bg-orange-100/50`}>ไม่มี</th>
                                        <th className={`${thBase} text-[10px] bg-orange-200 text-orange-900 px-0`}>Defect</th>

                                        <th className={`${thBase} bg-red-100/50`}>มี</th>
                                        <th className={`${thBase} bg-red-100/50`}>ไม่มี</th>
                                        <th className={`${thBase} text-[10px] bg-red-200 text-red-900 px-0`}>Defect</th>

                                        <th className={thBase}>ใช้ได้</th>
                                        <th className={thBase}>ไม่ได้</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {ROWS.map((r, idx) => {
                                        if (r.type === "group" || r.type === "subgroup") {
                                            return (
                                                <tr key={idx} className={r.type === "group" ? "bg-blue-50/80" : "bg-gray-50"}>
                                                    <td className={`${td} font-bold text-gray-700`}>{r.type === "group" ? r.groupNo : ""}</td>
                                                    <td className={`${td} font-semibold text-gray-800 text-left pl-2`} colSpan={12}>{r.label}</td>
                                                </tr>
                                            );
                                        }

                                        const v = section8State[r.id] ?? {};

                                        return (
                                            <tr key={r.id} className="odd:bg-white even:bg-gray-50 hover:bg-blue-50 transition-colors">
                                                <td className={td}></td>
                                                <td className={`${td} text-left pl-2`}>{renderItemLabel(r.id, r.label)}</td>

                                                {/* Exist */}
                                                <td className={td}><input type="checkbox" className="h-3.5 w-3.5" checked={v.exist === "yes"} onChange={(e) => setYesNo8(r.id, "exist", "yes", e.target.checked)} /></td>
                                                <td className={td}><input type="checkbox" className="h-3.5 w-3.5" checked={v.exist === "no"} onChange={(e) => setYesNo8(r.id, "exist", "no", e.target.checked)} /></td>

                                                {/* Wear */}
                                                <td className={`${td} bg-orange-50/30`}><input type="checkbox" className="h-3.5 w-3.5 accent-orange-600" checked={v.wear === "yes"} onChange={(e) => setYesNo8(r.id, "wear", "yes", e.target.checked)} /></td>
                                                <td className={`${td} bg-orange-50/30`}><input type="checkbox" className="h-3.5 w-3.5 accent-orange-600" checked={v.wear === "no"} onChange={(e) => setYesNo8(r.id, "wear", "no", e.target.checked)} /></td>
                                                <td className={`${td} bg-orange-50/30 px-0`}>
                                                    {v.wear === "yes" && (
                                                        <button className="p-0.5 bg-orange-100 text-orange-600 rounded hover:bg-orange-500 hover:text-white transition-all shadow-sm mx-auto flex items-center justify-center w-6 h-6" title="Defect การชำรุด"
                                                            onClick={() => openDefectPopup(r.id, "section8", "wear")}>
                                                            <PencilIcon className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </td>

                                                {/* Damage */}
                                                <td className={`${td} bg-red-50/30`}><input type="checkbox" className="h-3.5 w-3.5 accent-red-600" checked={v.damage === "yes"} onChange={(e) => setYesNo8(r.id, "damage", "yes", e.target.checked)} /></td>
                                                <td className={`${td} bg-red-50/30`}><input type="checkbox" className="h-3.5 w-3.5 accent-red-600" checked={v.damage === "no"} onChange={(e) => setYesNo8(r.id, "damage", "no", e.target.checked)} /></td>
                                                <td className={`${td} bg-red-50/30 px-0`}>
                                                    {v.damage === "yes" && (
                                                        <button className="p-0.5 bg-red-100 text-red-600 rounded hover:bg-red-500 hover:text-white transition-all shadow-sm mx-auto flex items-center justify-center w-6 h-6" title="Defect ความเสียหาย"
                                                            onClick={() => openDefectPopup(r.id, "section8", "damage")}
                                                        >
                                                            <PencilIcon className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </td>

                                                {/* Stability */}
                                                <td className={td}><input type="checkbox" className="h-3.5 w-3.5 accent-emerald-600" checked={v.stability === "ok"} onChange={(e) => setOkNg8(r.id, "ok", e.target.checked)} /></td>
                                                <td className={td}><input type="checkbox" className="h-3.5 w-3.5 accent-rose-600" checked={v.stability === "ng"} onChange={(e) => setOkNg8(r.id, "ng", e.target.checked)} /></td>

                                                {/* Note */}
                                                <td className={`${td} px-1`}>
                                                    <input className="w-full bg-transparent border-b border-dashed border-gray-300 focus:border-blue-500 outline-none text-[10px] py-0.5" value={v.note ?? ""} onChange={(e) => emit8(r.id, { note: e.currentTarget.value })} />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            })()}

            {/* ========================== ข้อ 9 (ปรับปรุง: 3 ช่อง + Theme สีใหม่) ========================== */}
            {(() => {
                const td = "border border-gray-400 px-1 py-1 align-middle text-center";
                const thBase = "border border-gray-400 px-1 py-2 font-semibold text-center text-xs";
                const thNoBottom = `${thBase} border-b-0`;
                const thNoTop = `${thBase} border-t-0`;

                // ฟังก์ชัน render input สำหรับ "อื่นๆ"
                const renderItemLabel9 = (rowId: string, text: string) => {
                    const isOther = text.includes("อื่น ๆ (โปรดระบุ)");
                    if (!isOther) return <span className="text-sm pl-1 text-left block">{text}</span>;

                    const v = section9State[rowId] ?? {};
                    return (
                        <div className="flex items-center gap-1 min-w-[120px] text-sm pl-1">
                            <span>- อื่น ๆ (โปรดระบุ)</span>
                            <input
                                className="flex-1 bg-transparent border-0 border-b border-dashed border-gray-400 focus:outline-none focus:border-blue-600 px-1 w-full text-xs"
                                value={v.labelExtra ?? ""}
                                onChange={(e) => emit9(rowId, { labelExtra: e.currentTarget.value })}
                            />
                        </div>
                    );
                };

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

                return (
                    <div className="mt-4 border border-gray-400 bg-white shadow-sm rounded-lg overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white font-semibold px-4 py-2 text-sm shadow-md">
                            9. การตรวจสอบอุปกรณ์ประกอบต่าง ๆ ของป้าย
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm border-collapse table-fixed min-w-[900px]">
                                <colgroup>
                                    <col className="w-[40px]" />
                                    <col className="w-[200px]" />
                                    <col className="w-[35px]" /> <col className="w-[35px]" />
                                    <col className="w-[35px]" /> <col className="w-[35px]" /> <col className="w-[35px]" />
                                    <col className="w-[35px]" /> <col className="w-[35px]" /> <col className="w-[35px]" />
                                    <col className="w-[40px]" /> <col className="w-[40px]" />
                                    <col className="w-[100px]" />
                                </colgroup>

                                <thead>
                                    <tr className="bg-gray-200 text-gray-700">
                                        <th rowSpan={2} className={thBase}>ลำดับ</th>
                                        <th rowSpan={2} className={`${thBase} text-left pl-2`}>รายการ</th>

                                        <th className={thNoBottom}></th>
                                        <th className={thNoBottom}></th>

                                        <th colSpan={3} className={`${thBase} bg-orange-100/50`}>การชำรุดสึกหรอ</th>
                                        <th colSpan={3} className={`${thBase} bg-red-100/50`}>ความเสียหาย</th>
                                        <th colSpan={2} className={thBase}>ความมั่นคงผู้ตรวจสอบ</th>
                                        <th rowSpan={2} className={thBase}>หมายเหตุ</th>
                                    </tr>

                                    <tr className="bg-gray-200 text-gray-700">
                                        <th className={`${thNoTop}`}>มี</th>
                                        <th className={`${thNoTop}`}>ไม่มี</th>

                                        <th className={`${thBase} bg-orange-100/50`}>มี</th>
                                        <th className={`${thBase} bg-orange-100/50`}>ไม่มี</th>
                                        <th className={`${thBase} text-[10px] bg-orange-200 text-orange-900 px-0`}>Defect</th>

                                        <th className={`${thBase} bg-red-100/50`}>มี</th>
                                        <th className={`${thBase} bg-red-100/50`}>ไม่มี</th>
                                        <th className={`${thBase} text-[10px] bg-red-200 text-red-900 px-0`}>Defect</th>

                                        <th className={thBase}>ใช้ได้</th>
                                        <th className={thBase}>ไม่ได้</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {ROWS9.map((r, idx) => {
                                        if (r.type === "group") {
                                            return (
                                                <tr key={idx} className="bg-blue-50/80">
                                                    <td className={`${td} font-bold text-gray-700`}>{r.groupNo}</td>
                                                    <td className={`${td} font-semibold text-gray-800 text-left pl-2`} colSpan={12}>{r.label}</td>
                                                </tr>
                                            );
                                        }

                                        const v = section9State[r.id] ?? {};

                                        return (
                                            <tr key={r.id} className="odd:bg-white even:bg-gray-50 hover:bg-blue-50 transition-colors">
                                                <td className={td}></td>
                                                <td className={`${td} text-left pl-2`}>{renderItemLabel9(r.id, r.label)}</td>

                                                {/* Exist */}
                                                <td className={td}><input type="checkbox" className="h-3.5 w-3.5" checked={v.exist === "yes"} onChange={(e) => setYesNo9(r.id, "exist", "yes", e.target.checked)} /></td>
                                                <td className={td}><input type="checkbox" className="h-3.5 w-3.5" checked={v.exist === "no"} onChange={(e) => setYesNo9(r.id, "exist", "no", e.target.checked)} /></td>

                                                {/* Wear (3 ช่อง) */}
                                                <td className={`${td} bg-orange-50/30`}><input type="checkbox" className="h-3.5 w-3.5 accent-orange-600" checked={v.wear === "yes"} onChange={(e) => setYesNo9(r.id, "wear", "yes", e.target.checked)} /></td>
                                                <td className={`${td} bg-orange-50/30`}><input type="checkbox" className="h-3.5 w-3.5 accent-orange-600" checked={v.wear === "no"} onChange={(e) => setYesNo9(r.id, "wear", "no", e.target.checked)} /></td>
                                                <td className={`${td} bg-orange-50/30 px-0`}>
                                                    {v.wear === "yes" && (
                                                        <button
                                                            className="p-0.5 bg-orange-100 text-orange-600 rounded hover:bg-orange-500 hover:text-white transition-all shadow-sm mx-auto flex items-center justify-center w-6 h-6"
                                                            title="Defect"
                                                            onClick={() => openDefectPopup(r.id, "section9", "wear")}
                                                        >
                                                            <PencilIcon className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </td>

                                                {/* Damage (3 ช่อง) */}
                                                <td className={`${td} bg-red-50/30`}><input type="checkbox" className="h-3.5 w-3.5 accent-red-600" checked={v.damage === "yes"} onChange={(e) => setYesNo9(r.id, "damage", "yes", e.target.checked)} /></td>
                                                <td className={`${td} bg-red-50/30`}><input type="checkbox" className="h-3.5 w-3.5 accent-red-600" checked={v.damage === "no"} onChange={(e) => setYesNo9(r.id, "damage", "no", e.target.checked)} /></td>
                                                <td className={`${td} bg-red-50/30 px-0`}>
                                                    {v.damage === "yes" && (
                                                        <button
                                                            className="p-0.5 bg-red-100 text-red-600 rounded hover:bg-red-500 hover:text-white transition-all shadow-sm mx-auto flex items-center justify-center w-6 h-6"
                                                            title="Defect"
                                                            onClick={() => openDefectPopup(r.id, "section9", "damage")}
                                                        >
                                                            <PencilIcon className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </td>

                                                {/* Stability */}
                                                <td className={td}><input type="checkbox" className="h-3.5 w-3.5 accent-emerald-600" checked={v.stability === "ok"} onChange={(e) => setOkNg9(r.id, "ok", e.target.checked)} /></td>
                                                <td className={td}><input type="checkbox" className="h-3.5 w-3.5 accent-rose-600" checked={v.stability === "ng"} onChange={(e) => setOkNg9(r.id, "ng", e.target.checked)} /></td>

                                                {/* Note */}
                                                <td className={`${td} px-1`}>
                                                    <input className="w-full bg-transparent border-b border-dashed border-gray-300 focus:border-blue-500 outline-none text-[10px] py-0.5" value={v.note ?? ""} onChange={(e) => emit9(r.id, { note: e.currentTarget.value })} />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* รายละเอียดเพิ่มเติม */}
                        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                            <div className="text-sm font-bold text-gray-700 mb-2">📝 รายละเอียดเพิ่มเติม</div>
                            <div className="space-y-2">
                                <DottedInput
                                    className="w-full text-sm"
                                    value={section9Extra1}
                                    onChange={(e) => {
                                        const v = e.currentTarget.value;
                                        setSection9Extra1(v);
                                        onChange?.({ section9Extra1: v } as Partial<SectionThreeForm>);
                                    }}
                                />
                                <DottedInput
                                    className="w-full text-sm"
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

            {photoPopup && (
                <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-[1000px] shadow-lg max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-bold mb-4">Defect ({VISIT_LABEL[photoPopup.visit]})</h3>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">เลือกปัญหา</label>
                            <Select
                                isMulti
                                options={problems.map((p) => ({ value: p.problem_id, label: p.problem_name }))}
                                value={selectedProblems
                                    .filter((p) => !p.isOther)
                                    .map((p) => ({ value: p.problem_id, label: p.problem_name }))}
                                onChange={(selected) => {
                                    const newDefects: Defect[] = (selected ?? []).map((s) => {
                                        const existing = selectedProblems.find(
                                            (p) => p.problem_id === s.value && !p.isOther
                                        );
                                        if (existing) return existing;

                                        const fromMaster = problems.find((p) => p.problem_id === s.value);
                                        return {
                                            problem_id: s.value,
                                            problem_name: s.label,
                                            photos: [],
                                            illegal_suggestion: fromMaster?.illegal_suggestion ?? "",
                                        };
                                    });

                                    // คง "Other" ที่ user เพิ่มเองไว้
                                    const otherDefect = selectedProblems.find((p) => p.isOther);
                                    if (otherDefect) newDefects.push(otherDefect);

                                    setSelectedProblems(newDefects);
                                }}
                                placeholder="-- เลือกหลายปัญหา --"
                                menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                                styles={selectStyles}
                            />
                        </div>

                        <div className="mb-4">
                            <label className="inline-flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={selectedProblems.some((p) => p.isOther)}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setSelectedProblems([
                                                ...selectedProblems,
                                                {
                                                    problem_id: "other",
                                                    problem_name: "",
                                                    isOther: true,
                                                    photos: [],
                                                    defect: null,
                                                    defect_name: undefined,
                                                    illegal_suggestion: "",
                                                },
                                            ]);
                                        } else {
                                            setSelectedProblems(selectedProblems.filter((p) => !p.isOther));
                                        }
                                    }}
                                />
                                ปัญหาอื่น
                            </label>

                            {selectedProblems.some((p) => p.isOther) && (
                                <input
                                    type="text"
                                    className={"mt-2 block w-full rounded p-2 border " + (error && !selectedProblems.find(p => p.isOther)?.problem_name ? "border-red-500" : "border-gray-300")}
                                    placeholder="กรอกชื่อปัญหาอื่น"
                                    value={selectedProblems.find((p) => p.isOther)?.problem_name || ""}
                                    onChange={(e) => {
                                        const vv = e.target.value;
                                        setSelectedProblems(selectedProblems.map((p) => (p.isOther ? { ...p, problem_name: vv } : p)));
                                    }}
                                />
                            )}
                        </div>

                        {selectedProblems.map((d, defectIndex) => (
                            <div key={(d.problem_id ?? "other") + defectIndex} className="mb-4 bg-gray-50 p-4 rounded border">
                                <div className="text-sm font-medium mb-2">
                                    {defectIndex + 1}. {d.isOther ? `อื่นๆ (ระบุ) ${d.problem_name || ""}` : d.problem_name}
                                </div>

                                {d.isOther && (
                                    <div className="mb-2">
                                        <label className="block text-xs font-medium mb-1">ข้อกฎหมายที่เกี่ยวข้อง</label>
                                        <Select
                                            menuPlacement="auto"
                                            options={defects.map((p) => ({ value: p.id, label: p.defect }))}
                                            value={
                                                d.defect
                                                    ? defects.map((p) => ({ value: p.id, label: p.defect })).find((opt) => opt.value === d.defect) || null
                                                    : null
                                            }
                                            onChange={(selected) =>
                                                setSelectedProblems((prev) =>
                                                    prev.map((p, idx) =>
                                                        idx === defectIndex
                                                            ? {
                                                                ...p,
                                                                defect: selected?.value ?? null,
                                                                defect_name: selected?.label ?? undefined,
                                                            }
                                                            : p
                                                    )
                                                )
                                            }
                                            placeholder="-- เลือกข้อกฎหมาย --"
                                            isClearable
                                            menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                                            styles={selectStyles as any}
                                        />
                                    </div>
                                )}

                                <textarea
                                    className={"w-full border rounded p-2 mb-2 " + (error && !d.illegal_suggestion ? "border-red-500" : "border-gray-300")}
                                    rows={3}
                                    placeholder="กรอกข้อเสนอแนะเพิ่มเติม"
                                    value={d.illegal_suggestion || ""}
                                    onChange={(e) =>
                                        setSelectedProblems((prev) =>
                                            prev.map((p, idx) => (idx === defectIndex ? { ...p, illegal_suggestion: e.target.value } : p))
                                        )
                                    }
                                />

                                <div className="flex flex-wrap gap-2">
                                    {(d.photos ?? []).map((p, idx) => (
                                        <img
                                            key={idx}
                                            src={p.src || (p.filename ? buildRemoteCoverUrl(p.filename) : "")}
                                            alt={p.filename}
                                            title={p.filename}
                                            className="w-16 h-16 object-cover border rounded cursor-pointer"
                                            onClick={() => openViewer(defectIndex, idx)}
                                        />
                                    ))}

                                    {(d.photos?.length ?? 0) < 2 && (
                                        <button
                                            className="w-16 h-16 flex items-center justify-center border rounded text-gray-500 hover:text-blue-600 hover:border-blue-500 bg-white"
                                            onClick={() => openCamera(defectIndex)}
                                            title="ถ่าย/แนบรูป"
                                        >
                                            <PhotoCameraIcon className="w-6 h-6" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}

                        <div className="flex justify-end gap-2 mt-6">
                            <button className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300" onClick={() => setPhotoPopup(null)}>
                                ปิด
                            </button>

                            <button
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                onClick={saveDefectPopup}
                            >
                                บันทึก
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== Camera / Viewer Overlay ===== */}
            {camOpen && (
                <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4">
                    <div className="relative w-full max-w-4xl">
                        <button
                            onClick={closeCamera}
                            className="absolute -top-4 -right-4 bg-white text-rose-600 border border-rose-300 rounded-full w-9 h-9 shadow flex items-center justify-center hover:bg-rose-50 cursor-pointer"
                            aria-label="ปิด"
                            title="ปิด"
                        >
                            ✕
                        </button>

                        <div className="rounded-xl overflow-hidden border-2 border-white shadow-xl bg-black">
                            {overlayMode === "camera" && !captured ? (
                                <video ref={videoRef} autoPlay playsInline muted className="w-full max-h-[75vh] object-contain" />
                            ) : (
                                <img src={captured ?? ""} alt={capturedName ?? "preview"} className="w-full max-h-[75vh] object-contain bg-black" />
                            )}
                        </div>

                        <div className="mt-4 flex items-center justify-center gap-3">
                            {overlayMode === "camera" ? (
                                !captured ? (
                                    <button
                                        onClick={capturePhoto}
                                        className="inline-flex items-center gap-2 rounded-full bg-emerald-600 text-white px-6 py-3 font-medium shadow hover:bg-emerald-700 cursor-pointer"
                                    >
                                        📸 ถ่ายภาพ
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            onClick={confirmPhoto}
                                            className="inline-flex items-center gap-2 rounded-full bg-emerald-600 text-white px-6 py-3 font-medium shadow hover:bg-emerald-700 cursor-pointer"
                                        >
                                            ✅ ยืนยัน
                                        </button>
                                        <button
                                            onClick={retakePhoto}
                                            className="inline-flex items-center gap-2 rounded-full bg-gray-200 text-gray-800 px-6 py-3 font-medium shadow hover:bg-gray-300 cursor-pointer"
                                        >
                                            🔄 ถ่ายใหม่
                                        </button>
                                    </>
                                )
                            ) : (
                                <button
                                    onClick={deleteViewedPhoto}
                                    className="inline-flex items-center gap-2 rounded-full bg-rose-600 text-white px-6 py-3 font-medium shadow hover:bg-rose-700 cursor-pointer"
                                >
                                    🗑️ ลบรูป
                                </button>
                            )}
                        </div>
                    </div>
                    <canvas ref={canvasRef} className="hidden" />
                </div>
            )}
        </section>
    );
}
