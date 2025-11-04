import * as React from "react";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import IconButton from "@mui/material/IconButton";
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

export type SectionFourRow = {
    inspection_item?: string;
    visits?: Partial<Record<VisitKey, "ok" | "ng" | undefined>>; // สถานะต่อ visit
    note?: string;
    extra?: string;
    photos?: PhotoItem[];
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

    const [camOpen, setCamOpen] = React.useState(false);
    const [captured, setCaptured] = React.useState<string | null>(null);
    const [capturedName, setCapturedName] = React.useState<string | null>(null);
    const [camTarget, setCamTarget] = React.useState<{ group: "table1" | "table2"; id: string } | null>(null);
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
            <th rowSpan={2} className={`${th} w-25 text-center`}>รูปภาพ</th>
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

    const getPhotos = (group: "table1" | "table2", id: string): PhotoItem[] =>
        (group === "table1" ? v1[id]?.photos : v2[id]?.photos) ?? [];

    const setPhotos = (group: "table1" | "table2", id: string, next: PhotoItem[]) =>
        emit(group, id, { photos: next });

    const openViewer = (group: "table1" | "table2", id: string, index: number) => {
        const p = getPhotos(group, id)[index];
        if (!p) return;

        setCamTarget({ group, id });
        setOverlayMode("view");
        setViewIndex(index); // ⭐ จำ index

        const src = p.src && p.src.startsWith("data:")
            ? p.src
            : buildRemoteImgUrl(p.filename);

        setCaptured(src);
        setCapturedName(p.filename);
        setCamOpen(true);
        stopStream();
    };

    const clearPhotos = () => {
        if (!camTarget || viewIndex == null) return;
        const { group, id } = camTarget;

        const cur = getPhotos(group, id);
        if (!cur.length) { closeCamera(); return; }

        // ลบรูปตาม index ปัจจุบัน
        const next = cur.filter((_, i) => i !== viewIndex);
        setPhotos(group, id, next);

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

    const openCamera = async (group: "table1" | "table2", id: string) => {
        if (getPhotos(group, id).length >= 2) return; // จำกัด 2 ไฟล์
        setCamTarget({ group, id });
        setOverlayMode("camera");
        setCaptured(null);
        setCamOpen(true);
        try {
            await startStream();
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
        if (!captured || !camTarget) return;
        const { group, id } = camTarget;
        const cur = getPhotos(group, id);
        if (cur.length >= 2) return;
        const next: PhotoItem[] = [...cur, { src: captured, filename: capturedName ?? makeDefectName() }].slice(0, 2);
        setPhotos(group, id, next);
        closeCamera();
    };

    const retakePhoto = async () => {
        setCaptured(null);
        await startStream();
    };

    const onFilePicked: React.ChangeEventHandler<HTMLInputElement> = (e) => {
        const file = e.target.files?.[0];
        if (!file || !camTarget) return;
        const { group, id } = camTarget;
        const cur = getPhotos(group, id);
        if (cur.length >= 2) return;

        const reader = new FileReader();
        reader.onload = () => {
            const next: PhotoItem[] = [...cur, { src: reader.result as string, filename: makeDefectName() }].slice(0, 2);
            setPhotos(group, id, next);
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
                if (!row?.photos?.length) return;
                const updated = row.photos.map(p =>
                    p?.src ? p : { ...p, src: buildRemoteImgUrl(p.filename) } // ⭐ เติม src ถ้ายังไม่มี
                );
                // ถ้ามีตัวไหนไม่มี src มาก่อน แปลว่าเราเติม → ต้อง patch
                if (updated.some((u, i) => !row.photos![i].src)) {
                    (patch as any)[tableName] = { ...(patch as any)[tableName], [rid]: { photos: updated } };
                    changed = true;
                }
            });
        };

        normalize("table1", value.table1);
        normalize("table2", value.table2);

        if (changed) onChange(patch);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value?.table1, value?.table2]);

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
                                            {(v1[id]?.photos ?? []).slice(0, 2).map((p, idx) => (
                                                <img
                                                    key={idx}
                                                    src="/images/IconFile.png"
                                                    alt={`file-${idx + 1}`}
                                                    title={p.filename}                  // ⭐ ชื่อไฟล์บน tooltip
                                                    className="w-6 h-6 cursor-pointer"
                                                    onClick={() => openViewer("table1", id, idx)}
                                                />
                                            ))}

                                            {(v1[id]?.photos?.length ?? 0) < 2 && (
                                                <IconButton
                                                    size="small"
                                                    onClick={() => openCamera("table1", id)}
                                                    title="ถ่าย/แนบรูป"
                                                    sx={{
                                                        color: "gray",
                                                        "&:hover": { color: "#2563eb" }, // hover:text-blue-600
                                                    }}
                                                >
                                                    <PhotoCameraIcon fontSize="small" />
                                                </IconButton>
                                            )}
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
                                    <td colSpan={TOTAL_COLS} className="px-3 py-2 border border-gray-300 bg-gray-200 font-semibold">
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
                                            <td className={`${td} text-center`}>{i + 1}</td>
                                            <td className={td}>
                                                <span>{text}</span>
                                                {inline && (
                                                    <DottedInput
                                                        className="ml-2 min-w-[220px]"
                                                        placeholder="โปรดระบุ"
                                                        value={r.extra ?? ""}
                                                        onChange={(e) => emit("table2", id, { extra: e.target.value })}
                                                    />
                                                )}
                                            </td>
                                            <ResultCells group="table2" id={id} />
                                            <td className={`${td} text-center`}>
                                                <div className="flex items-center justify-center gap-2">
                                                    {(v2[id]?.photos ?? []).slice(0, 2).map((p, idx) => (
                                                        <img
                                                            key={idx}
                                                            src="/images/IconFile.png"
                                                            alt={`file-${idx + 1}`}
                                                            title={p.filename}                  // ⭐ ชื่อไฟล์บน tooltip
                                                            className="w-6 h-6 cursor-pointer"
                                                            onClick={() => openViewer("table2", id, idx)}
                                                        />
                                                    ))}

                                                    {(v2[id]?.photos?.length ?? 0) < 2 && (
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => openCamera("table2", id)}
                                                            title="ถ่าย/แนบรูป"
                                                            sx={{
                                                                color: "gray",
                                                                "&:hover": { color: "#2563eb" }, // hover:text-blue-600
                                                            }}
                                                        >
                                                            <PhotoCameraIcon fontSize="small" />
                                                        </IconButton>
                                                    )}
                                                </div>
                                            </td>
                                            <td className={`${td} align-middle`}>
                                                <div className="flex items-center justify-between gap-2">
                                                    <span
                                                        title={r.note ?? ""}
                                                        className="min-w-0 block max-w-[150px] truncate text-gray-800"
                                                    >
                                                        {r.note ? r.note : <span className="text-gray-400">หมายเหตุ (ถ้ามี)</span>}
                                                    </span>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => openNote("table2", id, r.note ?? "")}
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
                                <img src={captured ?? ""} alt="preview" className="w-full max-h-[75vh] object-contain bg-black" />
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
        </section>
    );
}
