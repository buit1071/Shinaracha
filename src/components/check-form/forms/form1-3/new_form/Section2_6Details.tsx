import * as React from "react";
import Select from "react-select";
import { showLoading } from "@/lib/loading";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import { PencilIcon } from "@heroicons/react/24/outline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import IconButton from "@mui/material/IconButton";
import { ProblemRow, DefectRow } from "@/interfaces/master";

/* ========= CONFIG ========= */
export type VisitKey = "v1" | "v2" | "v3";

const FORM_TO_VISIT: Record<string, VisitKey> = {
    "FORM-53242768": "v1",
    "FORM-35898338": "v2",
    "FORM-11057862": "v3",
};

const VISIT_LABEL: Record<VisitKey, string> = {
    v1: "รอบ 1",
    v2: "รอบ 2",
    v3: "รอบ 3",
};

const VISIT_ORDER: VisitKey[] = ["v1", "v2", "v3"];

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

const CheckTick: React.FC<{
    checked: boolean;
    onChange: () => void;
    disabled?: boolean;
}> = ({ checked, onChange, disabled }) => (
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
        <span
            className={[
                "text-white text-[14px] leading-none",
                checked ? "opacity-100" : "opacity-0",
            ].join(" ")}
        >
            ✓
        </span>
    </button>
);

/* ========= DATA ========= */
type RowItem = string | { label: string; inlineInput?: boolean };

const section1Title =
    "การตรวจสอบความมั่นคงแข็งแรงของป้าย หรือสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย";

const table1Rows: RowItem[] = [
    "การต่อเติมดัดแปลงปรับปรุงขนาดของป้ายหรือสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย",
    "การเปลี่ยนแปลงน้ำหนักของแผ่นป้าย",
    "การเปลี่ยนสภาพการใช้งานของป้ายหรือสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย",
    "การเปลี่ยนแปลงวัสดุของป้ายหรือสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย",
    "การชำรุดสึกหรอของป้ายหรือสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย",
    "การวิบัติของป้ายหรือสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย",
    "ความมั่นคงแข็งแรงของโครงสร้างและฐานรากของสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย (กรณีป้ายที่ติดตั้งบนพื้นดิน)",
    "ความมั่นคงแข็งแรงของอาคารที่ติดตั้งป้าย (กรณีป้ายบนหลังคา หรือบนดาดฟ้าอาคาร หรือบนส่วนหนึ่งส่วนใดของอาคาร)",
    "การเชื่อมยึดระหว่างแผ่นป้ายกับสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย การเชื่อมยึดระหว่างชิ้นส่วนต่าง ๆ ของสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้ายและการเชื่อมยึดระหว่างสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้ายกับฐานรากหรืออาคาร",
];

const section2Title = "การตรวจสอบบำรุงรักษาระบบและอุปกรณ์ประกอบต่าง ๆ ของป้าย";

const table2Groups: { title: string; rows: RowItem[] }[] = [
    {
        title: "ระบบไฟฟ้าแสงสว่างและระบบไฟฟ้ากำลัง",
        rows: [
            "สภาพสายไฟฟ้า",
            "สภาพท่อร้อยสายรางเดินสาย และรางเคเบิล",
            "สภาพเครื่องป้องกันกระแสเกิน",
            "สภาพเครื่องตัดไฟรั่ว",
            "การต่อลงดินของบริภัณฑ์ตัวนำต่อลงดินและความต่อเนื่องลงดินของท่อร้อยสายรางเดินสายรางเคเบิล",
        ],
    },
    {
        title: "ระบบป้องกันฟ้าผ่า (ถ้ามี)",
        rows: ["ตรวจสอบระบบตัวนำล่อฟ้าตัวนำต่อลงดิน", "ตรวจสอบระบบรากสายดิน", "ตรวจสอบจุดต่อประสานศักย์"],
    },
    {
        title: "ระบบอุปกรณ์ประกอบอื่น ๆ (ถ้ามี)",
        rows: [
            "สภาพสลิง หรือสายยึด",
            "สภาพบันไดขึ้นลง",
            "สภาพราวจับ หรือราวกันตก",
            "สภาพ CATWALK",
            { label: "อื่นๆ(โปรดระบุ)", inlineInput: true },
        ],
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

export type SectionSixRow = {
    inspection_item?: string;
    visits?: Partial<Record<VisitKey, "ok" | "ng" | undefined>>;
    note?: string;
    extra?: string;
    defect_by_visit?: Partial<Record<VisitKey, Defect[]>>;
};

export type SectionSixForm = {
    table1: Record<string, SectionSixRow>;
    table2: Record<string, SectionSixRow>;
};

type Props = {
    form_code?: string; // ✅ กัน undefined
    value?: Partial<SectionSixForm>;
    onChange?: (patch: Partial<SectionSixForm>) => void;
};

export default function Section2_6Details({ form_code, value, onChange }: Props) {
    const safeFormCode = form_code ?? "FORM-53242768";
    const currentVisit: VisitKey = FORM_TO_VISIT[safeFormCode] ?? "v1";
    const currentIndex = Math.max(0, VISIT_ORDER.indexOf(currentVisit));

    const visitsToShow = React.useMemo(
        () => VISIT_ORDER.slice(0, currentIndex + 1).map((k) => ({ key: k, label: VISIT_LABEL[k] })),
        [currentIndex]
    );

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
    const otherProblem = selectedProblems.find((p) => p.isOther);
    const otherHasError = error && !!otherProblem && !otherProblem.problem_name?.trim();

    const [photoPopup, setPhotoPopup] = React.useState<{
        group: "table1" | "table2";
        id: string;
        visit: VisitKey;
    } | null>(null);

    const [camOpen, setCamOpen] = React.useState(false);
    const [overlayMode, setOverlayMode] = React.useState<"camera" | "view">("camera");
    const [captured, setCaptured] = React.useState<string | null>(null);
    const [capturedName, setCapturedName] = React.useState<string | null>(null);
    const [viewTarget, setViewTarget] = React.useState<{ defectIndex: number; photoIndex: number } | null>(null);
    const [camTarget, setCamTarget] = React.useState<{ defectIndex: number } | null>(null);

    const [noteOpen, setNoteOpen] = React.useState(false);
    const [noteTarget, setNoteTarget] = React.useState<{ group: "table1" | "table2"; id: string } | null>(null);
    const [noteDraft, setNoteDraft] = React.useState("");

    const td = "border border-gray-300 px-2 py-2 text-gray-900";
    const th = "border border-gray-300 px-3 py-2 text-gray-700";

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
        (group: "table1" | "table2", rowId: string, delta: Partial<SectionSixRow>) => {
            if (!onChange) return;

            const prevRow = (group === "table1" ? v1[rowId] : v2[rowId]) ?? {};
            const inspection_item = group === "table1" ? resolveTable1Text(rowId) : resolveTable2Text(rowId);

            const merged: SectionSixRow = {
                ...prevRow,
                ...delta,
                inspection_item,
                visits: { ...(prevRow.visits ?? {}), ...(delta.visits ?? {}) },
                defect_by_visit: { ...(prevRow.defect_by_visit ?? {}), ...(delta.defect_by_visit ?? {}) },
            };

            onChange({ [group]: { [rowId]: merged } } as Partial<SectionSixForm>);
        },
        [onChange, v1, v2]
    );

    const toggle = (group: "table1" | "table2", rowId: string, visit: VisitKey, next: "ok" | "ng") => {
        const row = group === "table1" ? v1[rowId] : v2[rowId];
        const cur = row?.visits?.[visit];
        const nextVal: "ok" | "ng" | undefined = cur === next ? undefined : next;
        emit(group, rowId, { visits: { ...(row?.visits ?? {}), [visit]: nextVal } });
    };

    const getDefects = (group: "table1" | "table2", id: string, visit: VisitKey) => {
        const row = group === "table1" ? v1[id] : v2[id];
        return row?.defect_by_visit?.[visit] ?? [];
    };

    const openDefectPopup = (group: "table1" | "table2", id: string, visit: VisitKey) => {
        setError(false);
        setSelectedProblems(getDefects(group, id, visit).map((d) => ({ ...d })));
        setPhotoPopup({ group, id, visit });
    };

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

    const VisitHeader = () => (
        <>
            <th rowSpan={2} className={`${th} w-28 text-center`}>ลำดับที่</th>
            <th rowSpan={2} className={`${th} text-left`}>รายการตรวจสอบ</th>

            {visitsToShow.map((v) => (
                <th key={v.key} colSpan={3} className={`${th} text-center`}>{v.label}</th>
            ))}

            <th rowSpan={2} className={`${th} w-56 text-center`}>หมายเหตุ</th>
        </>
    );

    const SubHeader = () => (
        <>
            {visitsToShow.map((v) => (
                <React.Fragment key={`sub-${v.key}`}>
                    <th className={`${th} text-center w-24`}>ใช้ได้</th>
                    <th className={`${th} text-center w-24`}>ใช้ไม่ได้</th>
                    <th className={`${th} text-center w-24`}>Defect</th>
                </React.Fragment>
            ))}
        </>
    );

    const RoundCells: React.FC<{ group: "table1" | "table2"; id: string; visit: VisitKey }> = ({
        group, id, visit,
    }) => {
        const row = group === "table1" ? v1[id] : v2[id];
        const cur = row?.visits?.[visit];
        const hasNG = cur === "ng";

        return (
            <>
                <td className={`${td} text-center align-middle`}>
                    <div className="flex items-center justify-center">
                        <CheckTick checked={cur === "ok"} onChange={() => toggle(group, id, visit, "ok")} />
                    </div>
                </td>

                <td className={`${td} text-center align-middle`}>
                    <div className="flex items-center justify-center">
                        <CheckTick checked={cur === "ng"} onChange={() => toggle(group, id, visit, "ng")} />
                    </div>
                </td>

                <td className={`${td} text-center align-middle`}>
                    {hasNG ? (
                        <button
                            onClick={() => openDefectPopup(group, id, visit)}
                            title="แนบรูป / Defect"
                            className="inline-flex items-center justify-center w-8 h-8 text-gray-500 hover:text-blue-600"
                        >
                            <PencilIcon className="w-5 h-5" />
                        </button>
                    ) : (
                        <span className="text-gray-300">-</span>
                    )}
                </td>
            </>
        );
    };

    const NoteCell: React.FC<{ group: "table1" | "table2"; id: string }> = ({ group, id }) => {
        const row = group === "table1" ? v1[id] : v2[id];
        const note = row?.note ?? "";

        return (
            <td className={`${td} align-middle`}>
                <div className="flex items-center justify-between gap-2">
                    <span title={note} className="min-w-0 block max-w-[150px] truncate text-gray-800">
                        {note ? note : <span className="text-gray-400">หมายเหตุ (ถ้ามี)</span>}
                    </span>
                    <IconButton
                        size="small"
                        onClick={() => openNote(group, id, note)}
                        title="แก้ไขหมายเหตุ"
                        sx={{ color: "#6b7280", "&:hover": { color: "#111827" } }}
                    >
                        <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                </div>
            </td>
        );
    };

    // ===== RowSpan ตามข้อใหญ่ (เอาเลข 1/2 อย่างเดียว) =====
    const section1RowSpan = 1 + table1Rows.length;
    const section2RowSpan = 1 + table2Groups.reduce((sum, g) => sum + 1 + g.rows.length, 0);

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
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
    };

    const pad = (n: number) => String(n).padStart(2, "0");
    const makeDefectName = () => {
        const d = new Date();
        return `defect_${pad(d.getDate())}${pad(d.getMonth() + 1)}${d.getFullYear()}${pad(d.getHours())}${pad(
            d.getMinutes()
        )}${pad(d.getSeconds())}`;
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

    const openCamera = async (defectIndex: number) => {
        const curPhotos = selectedProblems?.[defectIndex]?.photos ?? [];
        if (curPhotos.length >= 2) return;

        setOverlayMode("camera");
        setCamTarget({ defectIndex });
        setCaptured(null);
        setCapturedName(null);
        setCamOpen(true);

        try {
            await startStream();
        } catch {
            fileRef.current?.click();
        }
    };

    const openViewer = (defectIndex: number, photoIndex: number) => {
        const p = selectedProblems?.[defectIndex]?.photos?.[photoIndex];
        if (!p) return;

        setOverlayMode("view");
        setViewTarget({ defectIndex, photoIndex });

        const src = p.src && p.src.startsWith("data:") ? p.src : p.src ?? buildRemoteImgUrl(p.filename);
        setCaptured(src);
        setCapturedName(p.filename);
        setCamOpen(true);
        stopStream();
    };

    const deleteViewedPhoto = () => {
        if (!viewTarget) return;
        const { defectIndex, photoIndex } = viewTarget;

        setSelectedProblems((prev) =>
            prev.map((d, idx) => {
                if (idx !== defectIndex) return d;
                const nextPhotos = (d.photos ?? []).filter((_, i) => i !== photoIndex);
                return { ...d, photos: nextPhotos };
            })
        );

        closeCamera();
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

        setCaptured(c.toDataURL("image/png"));
        setCapturedName(makeDefectName());
        stopStream();
    };

    const confirmPhoto = () => {
        if (!camTarget || !captured) return;
        const { defectIndex } = camTarget;

        setSelectedProblems((prev) =>
            prev.map((d, idx) => {
                if (idx !== defectIndex) return d;
                const next = [...(d.photos ?? []), { src: captured, filename: capturedName ?? makeDefectName() }].slice(0, 2);
                return { ...d, photos: next };
            })
        );

        closeCamera();
    };

    const retakePhoto = async () => {
        setCaptured(null);
        setCapturedName(null);
        await startStream();
    };

    const onFilePicked: React.ChangeEventHandler<HTMLInputElement> = (e) => {
        const file = e.target.files?.[0];
        if (!file || !camTarget) return;

        const { defectIndex } = camTarget;
        const cur = selectedProblems?.[defectIndex]?.photos ?? [];
        if (cur.length >= 2) return;

        const reader = new FileReader();
        reader.onload = () => {
            setSelectedProblems((prev) =>
                prev.map((d, idx) => {
                    if (idx !== defectIndex) return d;
                    const next = [...(d.photos ?? []), { src: reader.result as string, filename: makeDefectName() }].slice(0, 2);
                    return { ...d, photos: next };
                })
            );

            if (fileRef.current) fileRef.current.value = "";
            closeCamera();
        };
        reader.readAsDataURL(file);
    };

    React.useEffect(() => () => stopStream(), []);

    // เติม src ให้รูปที่มาจาก backend
    React.useEffect(() => {
        if (!value || !onChange) return;

        let changed = false;
        const patch: Partial<SectionSixForm> = { table1: {}, table2: {} };

        const normalizeTable = (tableName: "table1" | "table2", table?: Record<string, SectionSixRow>) => {
            if (!table) return;

            Object.entries(table).forEach(([rid, row]) => {
                const map = row?.defect_by_visit;
                if (!map) return;

                let rowChanged = false;
                const nextMap: Partial<Record<VisitKey, Defect[]>> = { ...(map as any) };

                (Object.keys(map) as VisitKey[]).forEach((vk) => {
                    const defs = map[vk] ?? [];
                    const updatedDefs = defs.map((def) => {
                        if (!def.photos?.length) return def;

                        let any = false;
                        const photos = def.photos.map((p) => {
                            if (p?.src) return p;
                            any = true;
                            return { ...p, src: buildRemoteImgUrl(p.filename) };
                        });

                        if (any) rowChanged = true;
                        return { ...def, photos };
                    });

                    nextMap[vk] = updatedDefs;
                });

                if (rowChanged) {
                    changed = true;
                    (patch as any)[tableName] = {
                        ...(patch as any)[tableName],
                        [rid]: { ...row, defect_by_visit: nextMap },
                    };
                }
            });
        };

        normalizeTable("table1", value.table1 as any);
        normalizeTable("table2", value.table2 as any);

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

    const roundCols = visitsToShow.length * 3;

    return (
        <section className="space-y-6 text-gray-900 p-2">
            <table className="w-full text-sm border border-gray-300 bg-white">
                <thead className="bg-gray-100">
                    <tr><VisitHeader /></tr>
                    <tr><SubHeader /></tr>
                </thead>

                <tbody>
                    {/* =================== ข้อ 1 (ลำดับที่ = 1 แค่ครั้งเดียว) =================== */}
                    <tr className="bg-gray-200">
                        <td rowSpan={section1RowSpan} className={`${td} text-center align-top font-semibold`}>1</td>
                        <td className={`${td} font-semibold`}>{section1Title}</td>
                        <td className={`${td} bg-gray-200`} colSpan={roundCols} />
                        <td className={`${td} bg-gray-200`} />
                    </tr>

                    {table1Rows.map((row, idx) => {
                        const id = `t1-${idx + 1}`;
                        const text = typeof row === "string" ? row : row.label;
                        const r = v1[id] ?? {};
                        return (
                            <tr key={id} className="odd:bg-white even:bg-gray-50">
                                {/* ✅ ไม่มีคอลัมน์ลำดับที่แล้ว (ใช้ rowSpan ไปแล้ว) */}
                                <td className={td}>
                                    <div className="flex items-start gap-3">
                                        <span className="inline-block w-12 text-right font-medium">{`1.${idx + 1}`}</span>
                                        <div className="flex-1">
                                            <span>{text}</span>
                                            {typeof row !== "string" && row.inlineInput && (
                                                <DottedInput
                                                    className="ml-2 min-w-[220px]"
                                                    placeholder="โปรดระบุ"
                                                    value={r.extra ?? ""}
                                                    onChange={(e) => emit("table1", id, { extra: e.target.value })}
                                                />
                                            )}
                                        </div>
                                    </div>
                                </td>

                                {visitsToShow.map((v) => (
                                    <RoundCells key={`${id}-${v.key}`} group="table1" id={id} visit={v.key} />
                                ))}

                                <NoteCell group="table1" id={id} />
                            </tr>
                        );
                    })}

                    {/* =================== ข้อ 2 (ลำดับที่ = 2 แค่ครั้งเดียว) =================== */}
                    <tr className="bg-gray-200">
                        <td rowSpan={section2RowSpan} className={`${td} text-center align-top font-semibold`}>2</td>
                        <td className={`${td} font-semibold`}>{section2Title}</td>
                        <td className={`${td} bg-gray-200`} colSpan={roundCols} />
                        <td className={`${td} bg-gray-200`} />
                    </tr>

                    {table2Groups.map((g, gi) => (
                        <React.Fragment key={g.title}>
                            {/* ✅ 2.1 / 2.2 / 2.3 อยู่ใน "รายการตรวจสอบ" */}
                            <tr className="bg-gray-100">
                                <td className={`${td} font-semibold`}>
                                    <div className="flex items-start gap-3">
                                        <span className="inline-block w-12 text-right font-semibold">{`2.${gi + 1}`}</span>
                                        <span className="font-semibold">{g.title}</span>
                                    </div>
                                </td>
                                <td className={`${td} bg-gray-100`} colSpan={roundCols} />
                                <td className={`${td} bg-gray-100`} />
                            </tr>

                            {/* ✅ (1)(2)(3) ย่อหน้าเข้ามาอีกชั้น */}
                            {g.rows.map((row, ri) => {
                                const id = `t2-${gi + 1}-${ri + 1}`;
                                const text = typeof row === "string" ? row : row.label;
                                const inline = typeof row !== "string" && row.inlineInput;
                                const r = v2[id] ?? {};

                                return (
                                    <tr key={id} className="odd:bg-white even:bg-gray-50">
                                        <td className={td}>
                                            <div className="flex items-start gap-3 pl-8">
                                                <span className="inline-block w-12 text-right font-medium">{`(${ri + 1})`}</span>
                                                <div className="flex-1">
                                                    <span>{text}</span>
                                                    {inline && (
                                                        <DottedInput
                                                            className="ml-2 min-w-[220px]"
                                                            placeholder="โปรดระบุ"
                                                            value={r.extra ?? ""}
                                                            onChange={(e) => emit("table2", id, { extra: e.target.value })}
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        {visitsToShow.map((v) => (
                                            <RoundCells key={`${id}-${v.key}`} group="table2" id={id} visit={v.key} />
                                        ))}

                                        <NoteCell group="table2" id={id} />
                                    </tr>
                                );
                            })}
                        </React.Fragment>
                    ))}
                </tbody>
            </table>

            <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={onFilePicked}
            />

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

            {/* ===== Note Popup ===== */}
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

            {/* ===== Defect Popup ===== */}
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
                                        const existing = selectedProblems.find((p) => p.problem_id === s.value && !p.isOther);
                                        if (existing) return existing;

                                        const fromMaster = problems.find((p) => p.problem_id === s.value);
                                        return {
                                            problem_id: s.value,
                                            problem_name: s.label,
                                            photos: [],
                                            illegal_suggestion: fromMaster?.illegal_suggestion ?? "",
                                        };
                                    });

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
                                        "&:hover": { borderColor: state.isFocused ? "#3b82f6" : "#9ca3af" },
                                    }),
                                    menu: (base) => ({
                                        ...base,
                                        backgroundColor: "#fff",
                                        boxShadow: "0 8px 24px rgba(0,0,0,.2)",
                                        border: "1px solid #e5e7eb",
                                    }),
                                    menuPortal: (base) => ({ ...base, zIndex: 2100 }),
                                }}
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
                                    className={"mt-2 block w-full rounded p-2 border " + (otherHasError ? "border-red-500" : "border-gray-300")}
                                    placeholder="กรอกชื่อปัญหาอื่น"
                                    value={otherProblem?.problem_name || ""}
                                    onChange={(e) => {
                                        const vv = e.target.value;
                                        setSelectedProblems(selectedProblems.map((p) => (p.isOther ? { ...p, problem_name: vv } : p)));
                                    }}
                                />
                            )}
                        </div>

                        {selectedProblems.map((d, defectIndex) => (
                            <div key={(d.problem_id ?? "other") + defectIndex} className="mb-4">
                                <div className="text-sm font-medium mb-1">
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
                                                    ? defects.map((p) => ({ value: p.id, label: p.defect })).find((opt) => opt.value === d.defect) ||
                                                    null
                                                    : null
                                            }
                                            onChange={(selected) =>
                                                setSelectedProblems((prev) =>
                                                    prev.map((p, idx) =>
                                                        idx === defectIndex
                                                            ? { ...p, defect: selected?.value ?? null, defect_name: selected?.label ?? undefined }
                                                            : p
                                                    )
                                                )
                                            }
                                            placeholder="-- เลือกข้อกฎหมาย --"
                                            isClearable
                                            menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                                            styles={{ menuPortal: (base) => ({ ...base, zIndex: 2100 }) }}
                                        />
                                    </div>
                                )}

                                <textarea
                                    className={"w-full border rounded p-2 mb-1 " + (error && !d.illegal_suggestion ? "border-red-500" : "border-gray-300")}
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
                                            src="/images/IconFile.png"
                                            alt={p.filename}
                                            title={p.filename}
                                            className="w-16 h-16 object-cover border rounded cursor-pointer"
                                            onClick={() => openViewer(defectIndex, idx)}
                                        />
                                    ))}

                                    {(d.photos?.length ?? 0) < 2 && (
                                        <button
                                            className="w-16 h-16 flex items-center justify-center border rounded text-gray-500 hover:text-blue-600 hover:border-blue-500"
                                            onClick={() => openCamera(defectIndex)}
                                            title="ถ่าย/แนบรูป"
                                        >
                                            <PhotoCameraIcon className="w-6 h-6" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}

                        <div className="flex justify-end gap-2">
                            <button className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300" onClick={() => setPhotoPopup(null)}>
                                ปิด
                            </button>

                            <button
                                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                                onClick={() => {
                                    if (!photoPopup) return;

                                    const other = selectedProblems.find((p) => p.isOther);
                                    if (other) {
                                        const isMissing = !other.problem_name?.trim() || !other.illegal_suggestion?.trim();
                                        if (isMissing) {
                                            setError(true);
                                            return;
                                        }
                                    }

                                    const { group, id, visit } = photoPopup;
                                    const row = group === "table1" ? v1[id] : v2[id];
                                    const nextMap: Partial<Record<VisitKey, Defect[]>> = {
                                        ...(row?.defect_by_visit ?? {}),
                                        [visit]: [...selectedProblems],
                                    };

                                    emit(group, id, { defect_by_visit: nextMap });
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
