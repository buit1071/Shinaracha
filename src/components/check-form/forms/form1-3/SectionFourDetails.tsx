import * as React from "react";
import Select from "react-select";
import { showLoading } from "@/lib/loading";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import { PencilIcon } from "@heroicons/react/24/outline";
import { PencilIcon } from "@heroicons/react/24/outline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import IconButton from "@mui/material/IconButton";
import { ProblemRow, DefectRow } from "@/interfaces/master";
/* ========= CONFIG ========= */
export type VisitKey = "v1";
const VISITS: { key: VisitKey; label: string }[] = [{ key: "v1", label: "ครั้งที่ 1" }];

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
        <span className={["text-white text-[14px] leading-none", checked ? "opacity-100" : "opacity-0"].join(" ")}>✓</span>
    </button>
);

/* ========= DATA ========= */
type RowItem = string | { label: string; inlineInput?: boolean };

const table1Rows: RowItem[] = [
    "การต่อเติม ดัดแปลง ปรับปรุงขนาดของป้าย",
    "การเปลี่ยนแปลงน้ำหนักของแผ่นป้าย",
    "การเปลี่ยนสภาพการใช้งานของป้าย",
    "การเปลี่ยนแปลงวัสดุของป้าย",
    "การชำรุดสึกหรอของป้าย",
    "การวิบัติของของสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย",
    "การทรุดตัวของฐานรากของสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย (กรณีป้ายที่ตั้งบนพื้นดิน)",
    "การเชื่อมยึดระหว่างแผ่นป้ายกับสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย  การเชื่อมยึดระหว่างชิ้นส่วนต่าง ๆ ของสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้ายและการเชื่อมยึด",
];

const table2Groups: { title: string; rows: RowItem[] }[] = [
    {
        title: "1 ระบบไฟฟ้าแสงสว่าง",
        rows: [
            "สภาพสายไฟฟ้า",
            "สภาพท่อร้อยสาย รางเดินสาย และรางเคเบิล",
            "สภาพเครื่องป้องกันกระแสเกิน",
            "สภาพเครื่องตัดไฟรั่ว",
            "การต่อลงดินของบริภัณฑ์ ตัวนำต่อลงดิน และความต่อเนื่องลงดินของท่อร้อยสาย รางเดินสาย รางเคเบิล",
        ],
    },
    {
        title: "2 ระบบป้องกันอันตรายจากฟ้าผ่า(ถ้ามี )",
        rows: ["ตรวจสอบระบบตัวนำล่อฟ้า ตัวนำต่อลงดิน", "ตรวจสอบระบบรากสายดิน", "ตรวจสอบจุดต่อประสานศักย์"],
    },
    {
        title: "3 ระบบอุปกรณ์ประกอบอื่น ๆ (ถ้ามี)",
        rows: ["สภาพบันไดขึ้นลง", "สภาพราวจับ และราวกันตก", { label: "อุปกรณ์ประกอบอื่นตามที่เห็นสมควร (ระบุ)", inlineInput: true }],
    },
];

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

export type SectionFourRow = {
    inspection_item?: string;
    visits?: Partial<Record<VisitKey, "ok" | "ng" | undefined>>; // สถานะต่อ visit
    note?: string;
    extra?: string;
    defect?: Defect[];
};

export type SectionFourForm = {
    table1: Record<string, SectionFourRow>; // key: t1-1, t1-2, ...
    table2: Record<string, SectionFourRow>; // key: t2-<groupIndex>-<rowIndex>
};

type Props = {
    value?: Partial<SectionFourForm>;
    onChange?: (patch: Partial<SectionFourForm>) => void;
};

/* ========= COMPONENT ========= */
export default function SectionFourDetails({ value, onChange }: Props) {
    const buildRemoteImgUrl = (name: string) =>
        `${process.env.NEXT_PUBLIC_N8N_UPLOAD_FILE}?name=${encodeURIComponent(name)}`;
    const videoRef = React.useRef<HTMLVideoElement>(null);
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const fileRef = React.useRef<HTMLInputElement>(null);
    const streamRef = React.useRef<MediaStream | null>(null);
    const [error, setError] = React.useState(false);

    const [problems, setProblems] = React.useState<ProblemRow[]>([]);
    const [defects, setDefects] = React.useState<DefectRow[]>([]);
    const [selectedProblems, setSelectedProblems] = React.useState<Defect[]>([]);
    const otherProblem = selectedProblems.find(p => p.isOther);
    const otherHasError = error && !!otherProblem && !otherProblem.problem_name?.trim();
    const [camOpen, setCamOpen] = React.useState(false);
    const [captured, setCaptured] = React.useState<string | null>(null);
    const [capturedName, setCapturedName] = React.useState<string | null>(null);
    const [camTarget, setCamTarget] = React.useState<{
        group: "table1" | "table2";
        id: string;
        defectIndex: number;
    } | null>(null);

    const [photoPopup, setPhotoPopup] = React.useState<{
        group: "table1" | "table2";
        id: string;
        defectIndex: number | null;
    } | null>(null);

    const [overlayMode, setOverlayMode] = React.useState<"camera" | "view">("camera");
    const [viewIndex, setViewIndex] = React.useState<number | null>(null);

    const [noteOpen, setNoteOpen] = React.useState(false);
    const [noteTarget, setNoteTarget] = React.useState<{ group: "table1" | "table2"; id: string } | null>(null);
    const [noteDraft, setNoteDraft] = React.useState("");

    const td = "border border-gray-300 px-2 py-2 text-gray-900";
    const th = "border border-gray-300 px-3 py-2 text-gray-700";
    const TOTAL_COLS = 3 + VISITS.length * 2 + 1;

    const v1 = value?.table1 ?? {};
    const v2 = value?.table2 ?? {};

    const resolveTable1Text = (id: string) => {
        const m = id.match(/^t1-(\d+)$/);
        if (!m) return "";
        const idx = Number(m[1]) - 1;
        const row = table1Rows[idx];
        return typeof row === "string" ? row : row?.label ?? "";
    };

    const resolveTable2Text = (id: string) => {
        const m = id.match(/^t2-(\d+)-(\d+)$/);
        if (!m) return "";
        const gi = Number(m[1]) - 1;
        const ri = Number(m[2]) - 1;
        const row = table2Groups[gi]?.rows?.[ri];
        return typeof row === "string" ? row : row?.label ?? "";
    };

    const emit = React.useCallback(
        (group: "table1" | "table2", rowId: string, delta: Partial<SectionFourRow>) => {
            if (!onChange) return;

            const inspection_item =
                group === "table1" ? resolveTable1Text(rowId) : resolveTable2Text(rowId);

            onChange({
                [group]: {
                    [rowId]: { ...delta, inspection_item }, // ✅ แนบรายการตรวจสอบทุกครั้ง
                },
            } as Partial<SectionFourForm>);
        },
        [onChange] // ถ้า table1Rows/table2Groups มาจาก props/state ให้ใส่ไว้ใน deps ด้วย
    );

    const toggle = (group: "table1" | "table2", rowId: string, visit: VisitKey, next: "ok" | "ng") => {
        const row = group === "table1" ? v1[rowId] : v2[rowId];
        const cur = row?.visits?.[visit];
        const nextVal: "ok" | "ng" | undefined = cur === next ? undefined : next;
        emit(group, rowId, { visits: { ...(row?.visits ?? {}), [visit]: nextVal } });
    };

    const VisitHeader = () => (
        <>
            <th rowSpan={2} className={`${th} w-14 text-center`}>ลำดับ</th>
            <th rowSpan={2} className={`${th} text-left`}>รายการตรวจสอบ</th>
            {VISITS.map((v) => (
                <th key={v.key} colSpan={2} className={`${th} text-center w-40`}>{v.label}</th>
            ))}
            <th rowSpan={2} className={`${th} w-20 text-center`}>Defect</th>
            <th rowSpan={2} className={`${th} w-56 text-center`}>หมายเหตุ</th>
        </>
    );

    const SubHeader = () => (
        <>
            {VISITS.map((v) => (
                <React.Fragment key={`sub-${v.key}`}>
                    <th className={`${th} text-center w-20`}>ใช้ได้</th>
                    <th className={`${th} text-center w-20`}>ใช้ไม่ได้</th>
                </React.Fragment>
            ))}
        </>
    );

    const openNote = (group: "table1" | "table2", id: string, current: string) => {
        setNoteTarget({ group, id });
        setNoteDraft(current ?? "");
        setNoteOpen(true);
    };

    const closeNote = () => {
        setNoteOpen(false);
        setNoteTarget(null);
        setNoteDraft("");
    };

    const saveNote = () => {
        if (!noteTarget) return;
        emit(noteTarget.group, noteTarget.id, { note: noteDraft });
        closeNote();
    };

    const ResultCells: React.FC<{ group: "table1" | "table2"; id: string }> = ({ group, id }) => {
        const row = group === "table1" ? v1[id] : v2[id];
        return (
            <>
                {VISITS.map((v) => (
                    <React.Fragment key={`${id}-${v.key}`}>
                        <td className={`${td} text-center align-middle`}>
                            <div className="flex items-center justify-center">
                                <CheckTick checked={row?.visits?.[v.key] === "ok"} onChange={() => toggle(group, id, v.key, "ok")} />
                            </div>
                        </td>
                        <td className={`${td} text-center align-middle`}>
                            <div className="flex items-center justify-center">
                                <CheckTick checked={row?.visits?.[v.key] === "ng"} onChange={() => toggle(group, id, v.key, "ng")} />
                            </div>
                        </td>
                    </React.Fragment>
                ))}
            </>
        );
    };

    const getPhotos = (group: "table1" | "table2", id: string, defectIndex: number) =>
        ((group === "table1" ? v1[id]?.defect : v2[id]?.defect)?.[defectIndex]?.photos) ?? [];

    const setPhotos = (group: "table1" | "table2", id: string, defectIndex: number, next: PhotoItem[]) => {
        const targetDefects = group === "table1" ? [...v1[id]?.defect ?? []] : [...v2[id]?.defect ?? []];
        if (!targetDefects[defectIndex]) return;
        targetDefects[defectIndex] = { ...targetDefects[defectIndex], photos: next };

        emit(group, id, { defect: targetDefects });
    };

    const openViewer = (
        group: "table1" | "table2",
        id: string,
        photoIndex: number,
        defectIndex: number | null
    ) => {
        if (defectIndex === null) return; // ✅ ป้องกันก่อนใช้งาน

        const photos = getPhotos(group, id, defectIndex);
        const p = photos[photoIndex];
        if (!p) return;

        // ✅ เก็บตำแหน่ง defectIndex ด้วย เพื่อใช้ตอนบันทึก
        setCamTarget({ group, id, defectIndex });
        setOverlayMode("view");
        setViewIndex(photoIndex);

        const src =
            p.src && p.src.startsWith("data:")
                ? p.src
                : buildRemoteImgUrl(p.filename);

        setCaptured(src);
        setCapturedName(p.filename);
        setCamOpen(true);
        stopStream();
    };

    const clearPhotos = () => {
        if (!camTarget || viewIndex == null) return;

        const { group, id, defectIndex } = camTarget;
        if (defectIndex === null || defectIndex === undefined) return; // ป้องกัน null

        // ดึง photos ของ defect นั้น ๆ
        const cur = getPhotos(group, id, defectIndex);
        if (!cur.length) {
            closeCamera();
            return;
        }

        // ลบรูปตาม index ปัจจุบัน
        const next = cur.filter((_, i) => i !== viewIndex);
        setPhotos(group, id, defectIndex, next); // ส่ง defectIndex เข้าไปด้วย

        closeCamera();
    };

    const startStream = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
            try { await videoRef.current.play(); } catch { }
        }
    };

    const stopStream = () => {
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;
    };
    const [currentPhoto, setCurrentPhoto] = React.useState<PhotoItem | null>(null);
    const openCamera = async (
        group: "table1" | "table2",
        id: string,
        defectIndex: number | null,
        photo?: PhotoItem
    ) => {
        if (defectIndex === null) return;

        // ตรวจจำนวนรูปใน defect นั้น ๆ
        if (!photo && getPhotos(group, id, defectIndex).length >= 2) return;

        setCamTarget({ group, id, defectIndex });
        setOverlayMode("camera");
        setCurrentPhoto(photo ?? null); // ถ้ามี photo ให้ preview
        setCaptured(photo?.src ?? null); // preview ของรูปเก่า
        setCamOpen(true);

        try {
            // ถ้าไม่มี photo ให้เปิดกล้อง
            if (!photo) await startStream();
        } catch {
            fileRef.current?.click();
        }
    };

    const closeCamera = () => {
        stopStream();
        setCamOpen(false);
        setCaptured(null);
        setCapturedName(null);
        setViewIndex(null);
    };

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;
        const v = videoRef.current, c = canvasRef.current;
        const ctx = c.getContext("2d"); if (!ctx) return;
        c.width = v.videoWidth; c.height = v.videoHeight;
        ctx.drawImage(v, 0, 0, c.width, c.height);
        setCaptured(c.toDataURL("image/png"));
        setCapturedName(makeDefectName());     // ⭐ ตั้งชื่อไฟล์ทันที
        stopStream();
    };

    const confirmPhoto = () => {
        if (!captured || camTarget === null) return;

        const { defectIndex } = camTarget;

        setSelectedProblems(prev => {
            return prev.map((d, idx) => {
                if (idx !== defectIndex) return d;

                const nextPhotos = [...(d.photos ?? []), {
                    src: captured,
                    filename: capturedName ?? makeDefectName(),
                }].slice(0, 2); // จำกัด 2 รูป

                return { ...d, photos: nextPhotos };
            });
        });

        closeCamera();
    };

    const retakePhoto = async () => {
        setCaptured(null);
        await startStream();
    };

    const onFilePicked: React.ChangeEventHandler<HTMLInputElement> = (e) => {
        const file = e.target.files?.[0];
        if (!file || !camTarget) return;

        const { group, id, defectIndex } = camTarget;
        if (defectIndex === null || defectIndex === undefined) return; // ป้องกัน null

        const cur = getPhotos(group, id, defectIndex);
        if (cur.length >= 2) return; // จำกัด 2 รูปต่อ defect

        const reader = new FileReader();
        reader.onload = () => {
            const next: PhotoItem[] = [
                ...cur,
                { src: reader.result as string, filename: makeDefectName() }
            ].slice(0, 2);

            setPhotos(group, id, defectIndex, next); // ส่ง defectIndex เข้าไปด้วย

            if (fileRef.current) fileRef.current.value = "";
        };
        reader.readAsDataURL(file);
    };


    const pad = (n: number) => String(n).padStart(2, "0");
    const makeDefectName = () => {
        const d = new Date();
        const dd = pad(d.getDate());
        const MM = pad(d.getMonth() + 1);
        const yyyy = d.getFullYear();
        const hh = pad(d.getHours());
        const mm = pad(d.getMinutes());
        const ss = pad(d.getSeconds());
        return `defect_${dd}${MM}${yyyy}${hh}${mm}${ss}`;
    };

    React.useEffect(() => () => stopStream(), []);

    React.useEffect(() => {
        if (!value || !onChange) return;

        let changed = false;
        const patch: Partial<SectionFourForm> = { table1: {}, table2: {} };

        const normalize = (tableName: "table1" | "table2", table?: Record<string, SectionFourRow>) => {
            if (!table) return;

            Object.entries(table).forEach(([rid, row]) => {
                if (!row?.defect?.length) return;

                // อัปเดตรูปในแต่ละ defect
                const updatedDefects = row.defect.map(def => {
                    if (!def.photos?.length) return def;

                    const updatedPhotos = def.photos.map(p =>
                        p?.src ? p : { ...p, src: buildRemoteImgUrl(p.filename) } // เติม src ถ้ายังไม่มี
                    );

                    // ถ้ามีรูปไหนที่เราเติม src → patch
                    if (updatedPhotos.some((u, i) => !def.photos![i].src)) {
                        changed = true;
                    }

                    return { ...def, photos: updatedPhotos };
                });

                if (changed) {
                    (patch as any)[tableName] = {
                        ...(patch as any)[tableName],
                        [rid]: { ...row, defect: updatedDefects }
                    };
                }
            });
        };

        normalize("table1", value.table1);
        normalize("table2", value.table2);

        if (changed) onChange(patch);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value?.table1, value?.table2]);

    const fecthProblem = async () => {
        showLoading(true);
        try {
            const res = await fetch("/api/auth/legal-regulations/get", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ function: "problem" }),
            });
            const data = await res.json();
            if (data.success) {
                setProblems(data.data);
            }
        } catch (err) {
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
            if (data.success) {
                setDefects(data.data);
            }
        } catch (err) {
        } finally {
            showLoading(false);
        }
    };

    React.useEffect(() => {
        fecthProblem();
        fecthDefect();
    }, []);

    return (
        <section className="space-y-8 text-gray-900 p-2">
            {/* ========= ตารางที่ 1 ========= */}
            <div>
                <div className="font-semibold mb-2">1. การตรวจสอบความมั่นคงแข็งแรงของป้าย</div>
                <table className="w-full text-sm border border-gray-300 bg-white">
                    <thead className="bg-gray-100">
                        <tr><VisitHeader /></tr>
                        <tr><SubHeader /></tr>
                    </thead>
                    <tbody>
                        {table1Rows.map((row, i) => {
                            const id = `t1-${i + 1}`;
                            const text = typeof row === "string" ? row : row.label;
                            const inline = typeof row !== "string" && row.inlineInput;
                            const r = v1[id] ?? {};
                            return (
                                <tr key={id} className="odd:bg-white even:bg-gray-50">
                                    <td className={`${td} text-center`}>{i + 1}</td>
                                    <td className={td}>
                                        <span>{text}</span>
                                        {inline && (
                                            <DottedInput
                                                className="ml-2 min-w-[220px]"
                                                placeholder="โปรดระบุ"
                                                value={r.extra ?? ""}
                                                onChange={(e) => emit("table1", id, { extra: e.target.value })}
                                            />
                                        )}
                                    </td>
                                    <ResultCells group="table1" id={id} />
                                    <td className={`${td} text-center`}>
                                        <div className="flex items-center justify-center gap-2">

                                            {(() => {
                                                const visits = value?.table1?.[id]?.visits ?? {};
                                                const hasNG = Object.values(visits).includes("ng");

                                                return hasNG && (
                                                    <button
                                                        onClick={() => {
                                                            const defects = value?.table1?.[id]?.defect ?? [];
                                                            setSelectedProblems(defects.map(d => ({ ...d })));
                                                            setPhotoPopup({ group: "table1", id, defectIndex: null });
                                                        }}
                                                        title="แนบรูป / ออกแบบ"
                                                        className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-blue-600"
                                                    >
                                                        <PencilIcon className="w-5 h-5" />
                                                    </button>
                                                );
                                            })()}
                                        </div>
                                    </td>
                                    <td className={`${td} align-middle`}>
                                        <div className="flex items-center justify-between gap-2">
                                            <span
                                                title={r.note ?? ""}                               // โชว์เต็มเมื่อ hover
                                                className="min-w-0 block max-w-[150px] truncate text-gray-800"
                                            >
                                                {r.note ? r.note : <span className="text-gray-400">หมายเหตุ (ถ้ามี)</span>}
                                            </span>
                                            <IconButton
                                                size="small"
                                                onClick={() => openNote("table1", id, r.note ?? "")}
                                                title="แก้ไขหมายเหตุ"
                                                sx={{ color: "#6b7280", "&:hover": { color: "#111827" } }}
                                            >
                                                <EditOutlinedIcon fontSize="small" />
                                            </IconButton>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* ========= ตารางที่ 2 ========= */}
            <div>
                <div className="font-semibold mb-2">2. การตรวจสอบบำรุงรักษาระบบและอุปกรณ์ประกอบต่าง ๆ ของป้าย</div>
                <table className="w-full text-sm border border-gray-300 bg-white">
                    <thead className="bg-gray-100">
                        <tr><VisitHeader /></tr>
                        <tr><SubHeader /></tr>
                    </thead>
                    <tbody>
                        {table2Groups.map((g, gi) => (
                            <React.Fragment key={g.title}>

                                {/* แถวหัวข้อย่อย */}
                                <tr>
                                    <td
                                        colSpan={TOTAL_COLS}
                                        className="px-3 py-2 border border-gray-300 bg-gray-200 font-semibold"
                                    >
                                        {`${gi + 1}. ${g.title}`}
                                    </td>
                                </tr>

                                {g.rows.map((row, i) => {
                                    const id = `t2-${gi + 1}-${i + 1}`;
                                    const text = typeof row === "string" ? row : row.label;
                                    const inline = typeof row !== "string" && row.inlineInput;
                                    const r = v2[id] ?? {};

                                    return (
                                        <tr key={id} className="odd:bg-white even:bg-gray-50">
                                            {/* ลำดับ */}
                                            <td className={`${td} text-center`}>{i + 1}</td>

                                            {/* รายการตรวจ */}
                                            <td className={td}>
                                                <span>{text}</span>

                                                {inline && (
                                                    <DottedInput
                                                        className="ml-2 min-w-[220px]"
                                                        placeholder="โปรดระบุ"
                                                        value={r.extra ?? ""}
                                                        onChange={(e) =>
                                                            emit("table2", id, { extra: e.target.value })
                                                        }
                                                    />
                                                )}
                                            </td>

                                            {/* ช่อง OK / NG */}
                                            <ResultCells group="table2" id={id} />

                                            {/* ปุ่มแนบรูป / Defect Popup */}
                                            <td className={`${td} text-center`}>
                                                <div className="flex items-center justify-center gap-2">

                                                    {(() => {
                                                        const visits = value?.table2?.[id]?.visits ?? {};
                                                        const hasNG = Object.values(visits).includes("ng");

                                                        return (
                                                            hasNG && (
                                                                <button
                                                                    onClick={() => {
                                                                        const defects = value?.table2?.[id]?.defect ?? [];
                                                                        setSelectedProblems(defects.map((d) => ({ ...d })));
                                                                        setPhotoPopup({
                                                                            group: "table2",
                                                                            id,
                                                                            defectIndex: null,
                                                                        });
                                                                    }}
                                                                    title="แนบรูป / ออกแบบ"
                                                                    className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-blue-600"
                                                                >
                                                                    <PencilIcon className="w-5 h-5" />
                                                                </button>
                                                            )
                                                        );
                                                    })()}
                                                </div>
                                            </td>

                                            {/* หมายเหตุ */}
                                            <td className={`${td} align-middle`}>
                                                <div className="flex items-center justify-between gap-2">
                                                    <span
                                                        title={r.note ?? ""}
                                                        className="min-w-0 block max-w-[150px] truncate text-gray-800"
                                                    >
                                                        {r.note ? (
                                                            r.note
                                                        ) : (
                                                            <span className="text-gray-400">
                                                                หมายเหตุ (ถ้ามี)
                                                            </span>
                                                        )}
                                                    </span>

                                                    <IconButton
                                                        size="small"
                                                        onClick={() =>
                                                            openNote("table2", id, r.note ?? "")
                                                        }
                                                        title="แก้ไขหมายเหตุ"
                                                        sx={{
                                                            color: "#6b7280",
                                                            "&:hover": { color: "#111827" },
                                                        }}
                                                    >
                                                        <EditOutlinedIcon fontSize="small" />
                                                    </IconButton>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>

            <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={onFilePicked}
            />

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
                                <img
                                    src={captured ?? currentPhoto?.src ?? ""}
                                    alt={currentPhoto?.filename ?? "preview"}
                                    className="w-full max-h-[75vh] object-contain bg-black"
                                />
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
                                <>
                                    <button
                                        onClick={clearPhotos}
                                        className="inline-flex items-center gap-2 rounded-full bg-rose-600 text-white px-6 py-3 font-medium shadow hover:bg-rose-700 cursor-pointer"
                                    >
                                        🗑️ ลบรูป
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                    <canvas ref={canvasRef} className="hidden" />
                </div>
            )}

            {noteOpen && (
                <div className="fixed inset-0 z-[9998] bg-black/50 flex items-center justify-center p-4">
                    <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3 border-b">
                            <h3 className="font-semibold text-gray-900">แก้ไขหมายเหตุ</h3>
                            <button
                                onClick={closeNote}
                                className="rounded-full w-9 h-9 bg-gray-100 hover:bg-gray-200 text-gray-600"
                                aria-label="ปิด"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-4">
                            <textarea
                                value={noteDraft}
                                onChange={(e) => setNoteDraft(e.target.value)}
                                placeholder="พิมพ์หมายเหตุ..."
                                className="w-full h-48 border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-200"
                            />
                        </div>
                        <div className="flex justify-end gap-2 px-4 pb-4">
                            <button onClick={closeNote} className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700">
                                ยกเลิก
                            </button>
                            <button onClick={saveNote} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white">
                                บันทึก
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {photoPopup && (
                <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-[1000px] shadow-lg max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-bold mb-4">Defect</h3>

                        {/* ===== เลือกปัญหาแบบหลายรายการ ===== */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                เลือกปัญหา
                            </label>
                            <Select
                                isMulti
                                options={problems.map((p) => ({
                                    value: p.problem_id,
                                    label: p.problem_name,
                                }))}
                                value={selectedProblems
                                    .filter((p) => !p.isOther)
                                    .map((p) => ({ value: p.problem_id, label: p.problem_name }))}
                                onChange={(selected) => {
                                    const newDefects: Defect[] = (selected ?? []).map((s) => {
                                        // 1) ถ้าเคยเลือกอยู่แล้ว → ใช้ของเดิม (รวม illegal_suggestion เดิมด้วย)
                                        const existing = selectedProblems.find((p) => p.problem_id === s.value);
                                        if (existing) return existing;

                                        // 2) ถ้าเพิ่งเลือกใหม่ → ไปดึง illegal_suggestion จาก problems
                                        const fromMaster = problems.find(p => p.problem_id === s.value);

                                        return {
                                            problem_id: s.value,
                                            problem_name: s.label,
                                            photos: [],
                                            illegal_suggestion: fromMaster?.illegal_suggestion ?? "", // 👈 ดึงจาก master
                                        };
                                    });

                                    // เก็บปัญหาอื่นไว้ด้วย
                                    const otherDefect = selectedProblems.find((p) => p.isOther);
                                    if (otherDefect) newDefects.push(otherDefect);

                                    setSelectedProblems(newDefects);
                                }}
                                placeholder="-- เลือกหลายปัญหา --"
                                menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                                styles={{
                                    control: (base, state) => ({
                                        ...base,
                                        backgroundColor: "#fff",
                                        borderColor: state.isFocused ? "#3b82f6" : "#d1d5db",
                                        boxShadow: "none",
                                        "&:hover": {
                                            borderColor: state.isFocused ? "#3b82f6" : "#9ca3af",
                                        },
                                    }),
                                    menu: (base) => ({
                                        ...base,
                                        backgroundColor: "#fff",
                                        boxShadow: "0 8px 24px rgba(0,0,0,.2)",
                                        border: "1px solid #e5e7eb",
                                    }),
                                    menuPortal: (base) => ({ ...base, zIndex: 2100 }),
                                    option: (base, state) => ({
                                        ...base,
                                        backgroundColor: state.isSelected
                                            ? "#e5f2ff"
                                            : state.isFocused
                                                ? "#f3f4f6"
                                                : "#fff",
                                        color: "#111827",
                                    }),
                                }}
                            />
                        </div>

                        {/* ===== ปัญหาอื่น ===== */}
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
                                <>
                                    <input
                                        type="text"
                                        className={
                                            "mt-2 block w-full rounded p-2 border " +
                                            (otherHasError ? "border-red-500" : "border-gray-300")
                                        }
                                        placeholder="กรอกชื่อปัญหาอื่น"
                                        value={otherProblem?.problem_name || ""}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setSelectedProblems(
                                                selectedProblems.map((p) =>
                                                    p.isOther ? { ...p, problem_name: value } : p
                                                )
                                            );
                                        }}
                                    />
                                </>
                            )}
                        </div>

                        {/* ===== แสดงภาพปัญหา ===== */}
                        {selectedProblems.map((d, defectIndex) => (
                            <div key={(d.problem_id ?? "other") + defectIndex} className="mb-4">
                                <div className="text-sm font-medium mb-1">
                                    {defectIndex + 1}.{" "}
                                    {d.isOther
                                        ? `อื่นๆ (ระบุ) ${d.problem_name || ""}`
                                        : d.problem_name}
                                </div>

                                {/* ถ้าเป็นปัญหาอื่น → ให้เลือกข้อกฎหมายได้ */}
                                {d.isOther && (
                                    <div className="mb-2">
                                        <label className="block text-xs font-medium mb-1">
                                            ข้อกฎหมายที่เกี่ยวข้อง
                                        </label>
                                        <Select
                                            menuPlacement="auto"
                                            options={defects.map((p) => ({
                                                value: p.id,
                                                label: p.defect,
                                            }))}
                                            value={
                                                d.defect
                                                    ? defects
                                                        .map((p) => ({
                                                            value: p.id,
                                                            label: p.defect,
                                                        }))
                                                        .find((opt) => opt.value === d.defect) || null
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
                                            menuPortalTarget={
                                                typeof window !== "undefined" ? document.body : null
                                            }
                                            styles={{
                                                control: (base, state) => ({
                                                    ...base,
                                                    backgroundColor: "#fff",
                                                    borderColor: state.isFocused ? "#3b82f6" : "#d1d5db",
                                                    boxShadow: "none",
                                                    "&:hover": {
                                                        borderColor: state.isFocused ? "#3b82f6" : "#9ca3af",
                                                    },
                                                }),
                                                menu: (base) => ({
                                                    ...base,
                                                    backgroundColor: "#fff",
                                                    boxShadow: "0 8px 24px rgba(0,0,0,.2)",
                                                    border: "1px solid #e5e7eb",
                                                }),
                                                menuPortal: (base) => ({
                                                    ...base,
                                                    zIndex: 2100,
                                                }),
                                                option: (base, state) => ({
                                                    ...base,
                                                    backgroundColor: state.isSelected
                                                        ? "#e5f2ff"
                                                        : state.isFocused
                                                            ? "#f3f4f6"
                                                            : "#fff",
                                                    color: "#111827",
                                                }),
                                                menuList: (base) => ({
                                                    ...base,
                                                    backgroundColor: "#fff",
                                                    paddingTop: 0,
                                                    paddingBottom: 0,
                                                }),
                                                singleValue: (base) => ({
                                                    ...base,
                                                    color: "#111827",
                                                }),
                                            }}
                                        />
                                    </div>
                                )}

                                {/* textarea ของแต่ละ defect */}
                                <textarea
                                    className={
                                        "w-full border rounded p-2 mb-1 " +
                                        (error && !d.illegal_suggestion
                                            ? "border-red-500"
                                            : "border-gray-300")
                                    }
                                    rows={3}
                                    placeholder="กรอกข้อเสนอแนะเพิ่มเติม"
                                    value={d.illegal_suggestion || ""}
                                    onChange={(e) =>
                                        setSelectedProblems((prev) =>
                                            prev.map((p, idx) =>
                                                idx === defectIndex
                                                    ? { ...p, illegal_suggestion: e.target.value }
                                                    : p
                                            )
                                        )
                                    }
                                />

                                {error && !d.illegal_suggestion && (
                                    <p className="text-red-500 text-xs">
                                    </p>
                                )}

                                {/* แสดงรูป */}
                                <div className="flex flex-wrap gap-2">
                                    {(d.photos ?? []).map((p, idx) => (
                                        <img
                                            key={idx}
                                            src="/images/IconFile.png"
                                            alt={p.filename}
                                            title={p.filename}
                                            className="w-16 h-16 object-cover border rounded cursor-pointer"
                                            onClick={() =>
                                                openCamera(photoPopup.group, photoPopup.id, defectIndex, p)
                                            }
                                        />
                                    ))}

                                    {(d.photos?.length ?? 0) < 2 && (
                                        <button
                                            className="w-16 h-16 flex items-center justify-center border rounded text-gray-500 hover:text-blue-600 hover:border-blue-500"
                                            onClick={() =>
                                                openCamera(photoPopup.group, photoPopup.id, defectIndex)
                                            }
                                            title="ถ่าย/แนบรูป"
                                        >
                                            <PhotoCameraIcon className="w-6 h-6" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* ===== ปุ่มยืนยัน / ปิด ===== */}
                        <div className="flex justify-end gap-2">
                            <button
                                className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                                onClick={() => setPhotoPopup(null)}
                            >
                                ปิด
                            </button>
                            <button
                                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                                onClick={() => {
                                    if (!photoPopup || !value) return;

                                    // ===== Validate ปัญหาอื่น ๆ =====
                                    const other = selectedProblems.find(p => p.isOther);

                                    if (other) {
                                        const isMissing =
                                            !other.problem_name?.trim() ||
                                            // !other.defect ||
                                            !other.illegal_suggestion?.trim();

                                        if (isMissing) {
                                            setError(true);
                                            return; // ❌ หยุด ไม่บันทึก
                                        }
                                    }

                                    const { group, id } = photoPopup;

                                    const updatedValue: Partial<SectionFourForm> = {
                                        ...value,
                                        [group]: {
                                            ...(value[group] ?? {}),
                                            [id]: {
                                                ...value[group]?.[id],
                                                defect: [...selectedProblems],
                                            },
                                        },
                                    };

                                    emit(group, id, { defect: selectedProblems });
                                    onChange?.(updatedValue);
                                    setPhotoPopup(null);
                                }}
                            >
                                บันทึก
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
