import * as React from "react";

/* ---------- Reusable Image Upload (single) ---------- */
function ImageField({
    label,
    value,
    onChange,
    hint,
    square = false,
    width = 600,
    height = 300,
    className = "",
}: {
    label: string;
    value: string | null;
    onChange: (p: { url: string | null; file: File | null }) => void;
    hint?: string;
    square?: boolean;
    width?: number;
    height?: number;
    className?: string;
}) {
    const inputRef = React.useRef<HTMLInputElement | null>(null);

    const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;

        // revoke รูปเก่าถ้าเป็น blob
        if (value && value.startsWith("blob:")) URL.revokeObjectURL(value);

        const url = URL.createObjectURL(f);
        onChange({ url, file: f });

        // reset input เพื่อเลือกไฟล์เดิมซ้ำได้
        e.target.value = "";
    };

    const clear = () => {
        if (value && value.startsWith("blob:")) URL.revokeObjectURL(value);
        onChange({ url: null, file: null });
    };

    const boxW = width;
    const boxH = square ? Math.min(width, height) : height;

    return (
        <div className={`space-y-2 ${className}`}>
            <div className="text-sm font-medium text-gray-800">{label}</div>

            <div className="rounded-md p-3 bg-gray-50 flex flex-col items-center">
                <div
                    className="rounded-md bg-gray-200 grid place-items-center overflow-hidden w-full"
                    style={{
                        maxWidth: boxW,
                        width: "100%",
                        height: boxH,
                        outline: "1px solid rgba(0,0,0,0.08)",
                    }}
                >
                    {value ? (
                        <img
                            src={value}
                            alt={label}
                            className="h-full w-auto max-w-full object-contain"
                            style={{ display: "block" }}
                        />
                    ) : (
                        <div className="text-gray-600 text-sm text-center px-4">
                            ยังไม่มีรูปอัปโหลด
                            {hint ? <div className="text-xs text-gray-500 mt-1">{hint}</div> : null}
                        </div>
                    )}
                </div>

                <div className="mt-3 flex gap-2">
                    <label className="inline-flex items-center gap-2 rounded-md border border-blue-500 text-blue-600 px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer">
                        <input
                            ref={inputRef}
                            type="file"
                            accept="image/*"
                            onChange={pick}
                            className="hidden"
                        />
                        อัปโหลดรูป
                    </label>

                    {value && (
                        <button
                            type="button"
                            onClick={clear}
                            className="ml-2 inline-flex items-center rounded-md px-3 py-2 text-sm
                       border border-red-500 text-red-600 hover:bg-red-50
                       focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-1 cursor-pointer"
                        >
                            ล้างรูป
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ---------- Reusable Image Gallery (multi -> ใช้เป็น single ได้) ---------- */
function ImageGallery({
    label,
    values,
    onChange,
    hint,
    single = false,
}: {
    label: string;
    values: string[];
    onChange: (p: { urls: string[]; files: File[] }) => void;
    hint?: string;
    single?: boolean;
}) {
    const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        if (!files.length) return;

        // revoke รูปเก่าถ้าเป็น blob (เฉพาะตัวแรกที่โชว์)
        if (values?.[0] && values[0].startsWith("blob:")) URL.revokeObjectURL(values[0]);

        const urls = files.map((f) => URL.createObjectURL(f));
        onChange({ urls: single ? [urls[0]] : [...values, ...urls], files });

        e.target.value = "";
    };

    const removeAt = (idx: number) => {
        const next = values.slice();
        const removed = next[idx];
        if (removed && removed.startsWith("blob:")) URL.revokeObjectURL(removed);
        next.splice(idx, 1);
        onChange({ urls: next, files: [] });
    };

    return (
        <div className="space-y-2">
            <div className="text-sm font-medium text-gray-800">{label}</div>
            <div className="rounded-md p-3 bg-gray-50">
                {hint ? <div className="text-xs text-gray-500 mb-2">{hint}</div> : null}

                <div className="flex items-center gap-3 justify-center">
                    {values.slice(0, 1).map((src, i) => (
                        <div key={i} className="relative">
                            <img
                                src={src}
                                alt={`${label}-${i}`}
                                className="w-[220px] h-[160px] object-contain bg-white rounded-md border"
                            />
                            <button
                                type="button"
                                onClick={() => removeAt(i)}
                                className="absolute -top-2 -right-2 rounded-full bg-red-600 text-white w-7 h-7 text-xs cursor-pointer"
                                title="ลบรูป"
                            >
                                ✕
                            </button>
                        </div>
                    ))}

                    {!(single && values.length >= 1) && (
                        <label className="inline-flex items-center gap-2 rounded-md border border-blue-500 text-blue-600 px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer">
                            <input
                                type="file"
                                accept="image/*"
                                multiple={!single}
                                onChange={pick}
                                className="hidden"
                            />
                            เพิ่มรูป
                        </label>
                    )}
                </div>
            </div>
        </div>
    );
}

const THAI_MONTHS = [
    "มกราคม",
    "กุมภาพันธ์",
    "มีนาคม",
    "เมษายน",
    "พฤษภาคม",
    "มิถุนายน",
    "กรกฎาคม",
    "สิงหาคม",
    "กันยายน",
    "ตุลาคม",
    "พฤศจิกายน",
    "ธันวาคม",
] as const;

const currentThaiYear = new Date().getFullYear() + 543;
const YEAR_START = 2568;
const YEAR_END = currentThaiYear + 20;
const YEARS = Array.from(
    { length: YEAR_END - YEAR_START + 1 },
    (_, i) => String(YEAR_START + i)
);

export type ThaiMonth = (typeof THAI_MONTHS)[number];

function getDaysInMonthThai(
    thaiYear: string | number | null | undefined,
    thaiMonth: ThaiMonth | "" | null | undefined
): number {
    const monthIndex = thaiMonth ? THAI_MONTHS.indexOf(thaiMonth) : -1;
    const y =
        typeof thaiYear === "number" ? thaiYear : parseInt(thaiYear ?? "", 10);

    if (monthIndex < 0 || Number.isNaN(y)) return 31;
    const gregorianYear = y - 543;
    return new Date(gregorianYear, monthIndex + 1, 0).getDate();
}

export type SectionTwoForm = {
    // --- 1) ข้อมูลป้าย/ที่อยู่ ---
    signName?: string;
    addrNo?: string;
    addrAlley?: string;
    addrRoad?: string;
    subDistrict?: string;
    district?: string;
    province?: string;
    zip?: string;
    tel?: string;
    fax?: string;

    // --- 1) ใบอนุญาต/แบบแปลน/อายุ ---
    hasPermitInfo?: boolean;
    permitDay?: string;
    permitMonth?: string;
    permitYear?: string;

    hasOriginalPlan?: boolean;
    noOriginalPlan?: boolean;

    noPermitInfo?: boolean;
    noPermitInfo2?: boolean;

    noOld?: boolean; // (ตามที่คุณใช้)
    signAge?: string;
    signYear?: string;

    // --- 1) แผนที่/พิกัด ---
    latitude?: string;
    longitude?: string;
    mapSketch?: string | File | null;
    mapSketch1?: string | File | null;

    // --- วันที่ตรวจ/ผู้บันทึก + รูปแบบ ---
    inspectDay3?: string;
    inspectMonth3?: string;
    inspectYear3?: string;
    recorder3?: string;
    shapeSketch?: string | File | null;
    shapeSketch1?: string | File | null;

    // --- ขนาด/พื้นที่/โครงสร้าง + รูป 1-6 ---
    signWidthM?: string | null;
    signHeightM?: string | null;
    signSides?: string | null;
    signAreaMore?: string | null;
    structureHeightMore?: string | null;

    photosFront?: string | File | null;
    photosSide?: string | File | null;
    photosBase?: string | File | null;
    photosFront1?: string | File | null;
    photosSide1?: string | File | null;
    photosBase1?: string | File | null;

    // --- 2) ประเภทป้าย ---
    typeGround?: boolean;
    typeRooftop?: boolean;
    typeOnRoof?: boolean;
    typeOnBuilding?: boolean;
    typeOtherChecked?: boolean;
    typeOther?: string;

    // --- 3) เจ้าของ/ผู้ออกแบบ ---
    productText?: string;
    ownerName?: string;
    ownerNo?: string;
    ownerMoo?: string;
    ownerAlley?: string;
    ownerRoad?: string;
    ownerSub?: string;
    ownerDist?: string;
    ownerProv?: string;
    ownerZip?: string;
    ownerTel?: string;
    ownerFax?: string;
    ownerEmail?: string;
    designerName?: string;
    designerLicense?: string;

    // --- 4) วัสดุ/รายละเอียด ---
    matSteel?: boolean;
    matWood?: boolean;
    matStainless?: boolean;
    matRCC?: boolean;
    matOtherChecked?: boolean;
    matOther?: string;

    panelMaterial?: string;
    panelFaces?: string;
    panelOpenings?: "" | "มี" | "ไม่มี";
    panelOther?: string;

    chkMat?: boolean;
    chkFaces?: boolean;
    chkOpen?: boolean;
    chkOther?: boolean;
};

type Props = {
    eq_id: string;
    data: SectionTwoForm | null; // ใช้เป็นตัวเติมค่าเริ่มต้น (ไม่ทับค่าที่ user กรอกแล้ว)
    value?: Partial<SectionTwoForm>;
    onChange?: (patch: Partial<SectionTwoForm>) => void;
};

function makeFileName(prefix: string, ext = "jpg") {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, "0");
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const yyyy = String(now.getFullYear());
    const hh = String(now.getHours()).padStart(2, "0");
    const mi = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");
    return `${prefix}_${dd}${mm}${yyyy}_${hh}${mi}${ss}.${ext}`;
}

const isEmpty = (v: unknown) =>
    v == null || (typeof v === "string" && v.trim() === "");

export default function SectionTwoDetails({ eq_id, data, value, onChange }: Props) {
    const v = value ?? {};
    const patch = React.useCallback(
        (p: Partial<SectionTwoForm>) => onChange?.(p),
        [onChange]
    );

    const buildRemoteImgUrl = React.useCallback(
        (name: string) =>
            `${process.env.NEXT_PUBLIC_N8N_UPLOAD_FILE}?name=${encodeURIComponent(
                name
            )}`,
        []
    );

    // ====== เติมค่าเริ่มต้นจาก data เข้า formData.sectionTwo (เติมเฉพาะช่องที่ยังว่าง) ======
    React.useEffect(() => {
        if (!data) return;

        const p: Partial<SectionTwoForm> = {};

        const seed = <K extends keyof SectionTwoForm>(key: K) => {
            const cur = v[key];
            const src = data[key];
            if (isEmpty(cur) && !isEmpty(src)) (p[key] = src as any);
        };

        // 1) ที่อยู่/ป้าย
        [
            "signName",
            "addrNo",
            "addrAlley",
            "addrRoad",
            "subDistrict",
            "district",
            "province",
            "zip",
            "tel",
            "fax",
            // 3) เจ้าของ/ผู้ออกแบบ
            "productText",
            "ownerName",
            "ownerNo",
            "ownerMoo",
            "ownerAlley",
            "ownerRoad",
            "ownerSub",
            "ownerDist",
            "ownerProv",
            "ownerZip",
            "ownerTel",
            "ownerFax",
            "ownerEmail",
            "designerName",
            "designerLicense",
        ].forEach((k) => seed(k as keyof SectionTwoForm));

        if (Object.keys(p).length) patch(p);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [eq_id, data]);

    // ====== preview ภาพ (local) ======
    const [mapPrev, setMapPrev] = React.useState<string | null>(null);
    const [mapPrev1, setMapPrev1] = React.useState<string | null>(null);
    const [shapePrev, setShapePrev] = React.useState<string | null>(null);
    const [shapePrev1, setShapePrev1] = React.useState<string | null>(null);

    const [p1, setP1] = React.useState<string | null>(null);
    const [p2, setP2] = React.useState<string | null>(null);
    const [p3, setP3] = React.useState<string | null>(null);
    const [p4, setP4] = React.useState<string | null>(null);
    const [p5, setP5] = React.useState<string | null>(null);
    const [p6, setP6] = React.useState<string | null>(null);

    const isBlobUrl = (u: string | null) => !!u && u.startsWith("blob:");

    // helper: แปลงค่าที่เก็บในฟอร์ม -> url สำหรับแสดงผล
    // - ถ้าเป็น string: ถือว่าเป็น filename -> buildRemote
    // - ถ้าเป็น File: ไม่ต้องทำอะไร (เพราะเราโชว์จาก blob preview อยู่แล้ว)
    const toRemoteUrlIfString = (val: unknown) => {
        if (typeof val === "string" && val.trim() !== "") return buildRemoteImgUrl(val);
        return null;
    };

    // ถ้าไม่ได้เลือก blob ใหม่ ให้แสดงจาก filename ที่อยู่ใน formData
    React.useEffect(() => {
        // ถ้าตอนนี้ preview เป็น blob อยู่ (user เพิ่งเลือก) อย่าทับ
        if (isBlobUrl(mapPrev)) return;

        // ถ้า v.mapSketch เป็น File (user เพิ่งเลือก) ก็อย่าทับ (รอ blob ที่ set แล้ว)
        if (v.mapSketch instanceof File) return;

        // กรณีเป็น filename string (มาจาก DB)
        setMapPrev(toRemoteUrlIfString(v.mapSketch));
    }, [v.mapSketch, buildRemoteImgUrl]); // buildRemoteImgUrl เป็น callback อยู่แล้ว

    React.useEffect(() => {
        if (isBlobUrl(mapPrev1)) return;
        if (v.mapSketch1 instanceof File) return;
        setMapPrev1(toRemoteUrlIfString(v.mapSketch1));
    }, [v.mapSketch1, buildRemoteImgUrl]);

    /** ---------------- shapeSketch ---------------- */
    React.useEffect(() => {
        if (isBlobUrl(shapePrev)) return;
        if (v.shapeSketch instanceof File) return;
        setShapePrev(toRemoteUrlIfString(v.shapeSketch));
    }, [v.shapeSketch, buildRemoteImgUrl]);

    React.useEffect(() => {
        if (isBlobUrl(shapePrev1)) return;
        if (v.shapeSketch1 instanceof File) return;
        setShapePrev1(toRemoteUrlIfString(v.shapeSketch1));
    }, [v.shapeSketch1, buildRemoteImgUrl]);

    /** ---------------- photos 1-6 ---------------- */
    React.useEffect(() => {
        if (isBlobUrl(p1)) return;
        if (v.photosFront instanceof File) return;
        setP1(toRemoteUrlIfString(v.photosFront));
    }, [v.photosFront, buildRemoteImgUrl]);

    React.useEffect(() => {
        if (isBlobUrl(p2)) return;
        if (v.photosSide instanceof File) return;
        setP2(toRemoteUrlIfString(v.photosSide));
    }, [v.photosSide, buildRemoteImgUrl]);

    React.useEffect(() => {
        if (isBlobUrl(p3)) return;
        if (v.photosBase instanceof File) return;
        setP3(toRemoteUrlIfString(v.photosBase));
    }, [v.photosBase, buildRemoteImgUrl]);

    React.useEffect(() => {
        if (isBlobUrl(p4)) return;
        if (v.photosFront1 instanceof File) return;
        setP4(toRemoteUrlIfString(v.photosFront1));
    }, [v.photosFront1, buildRemoteImgUrl]);

    React.useEffect(() => {
        if (isBlobUrl(p5)) return;
        if (v.photosSide1 instanceof File) return;
        setP5(toRemoteUrlIfString(v.photosSide1));
    }, [v.photosSide1, buildRemoteImgUrl]);

    React.useEffect(() => {
        if (isBlobUrl(p6)) return;
        if (v.photosBase1 instanceof File) return;
        setP6(toRemoteUrlIfString(v.photosBase1));
    }, [v.photosBase1, buildRemoteImgUrl]);

    const extFromFile = (f: File) => {
        const byName = f.name.split(".").pop()?.toLowerCase();
        if (byName) return byName;
        const t = f.type || "";
        if (t.includes("png")) return "png";
        if (t.includes("webp")) return "webp";
        return "jpg";
    };

    // ===== handlers ภาพ: เก็บ filename ลง FormData.sectionTwo + แสดง blob preview =====
    const pickSingleImage = (
        p: { url: string | null; file: File | null },
        prefix: string,
        fieldKey: keyof SectionTwoForm,
        setPreview: (v: string | null) => void
    ) => {
        if (!p?.file || !p?.url) {
            setPreview(null);
            patch({ [fieldKey]: null } as any);
            return;
        }

        const ext = extFromFile(p.file);
        const filename = makeFileName(prefix, ext);

        // ✅ rename ไฟล์จริงให้ชื่อใหม่ แล้วเก็บ File ขึ้น parent
        const renamed = new File([p.file], filename, { type: p.file.type || "image/jpeg" });

        setPreview(p.url);
        patch({ [fieldKey]: renamed } as any);
    };

    const pickGalleryImage = (
        p: { urls: string[]; files: File[] },
        prefix: string,
        fieldKey: keyof SectionTwoForm,
        setPreview: (v: string | null) => void
    ) => {
        const url = p?.urls?.[0] ?? null;
        const file = p?.files?.[0] ?? null;

        if (!file || !url) {
            setPreview(null);
            patch({ [fieldKey]: null } as any);
            return;
        }

        const ext = extFromFile(file);
        const filename = makeFileName(prefix, ext);
        const renamed = new File([file], filename, { type: file.type || "image/jpeg" });

        setPreview(url);
        patch({ [fieldKey]: renamed } as any);
    };

    return (
        <div className="text-black leading-7 space-y-8 p-2">
            <p className="text-sm text-gray-700">
                ส่วนที่ 2 เป็นข้อมูลทั่วไปของป้ายที่ผู้ตรวจสอบต้องลงบันทึกในหัวข้อต่าง ๆ และอาจเพิ่มเติมได้เพื่อให้ข้อมูลสมบูรณ์ยิ่งขึ้น
            </p>

            {/* ===================== 1. ข้อมูลป้ายและสถานที่ตั้งป้าย ===================== */}
            <section className="space-y-4">
                <h3 className="text-lg font-semibold">1. ข้อมูลป้ายและสถานที่ตั้งป้าย</h3>

                <div className="grid md:grid-cols-4 gap-3">
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">ชื่อป้าย (ถ้ามี)</label>
                        <input
                            className="w-full border rounded-md px-3 py-2"
                            value={v.signName ?? ""}
                            onChange={(e) => patch({ signName: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">เลขที่</label>
                        <input
                            className="w-full border rounded-md px-3 py-2"
                            value={v.addrNo ?? ""}
                            onChange={(e) => patch({ addrNo: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">ตรอก/ซอย</label>
                        <input
                            className="w-full border rounded-md px-3 py-2"
                            value={v.addrAlley ?? ""}
                            onChange={(e) => patch({ addrAlley: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">ถนน</label>
                        <input
                            className="w-full border rounded-md px-3 py-2"
                            value={v.addrRoad ?? ""}
                            onChange={(e) => patch({ addrRoad: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-600 mb-1">ตำบล/แขวง</label>
                        <input
                            className="w-full border rounded-md px-3 py-2"
                            value={v.subDistrict ?? ""}
                            onChange={(e) => patch({ subDistrict: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">อำเภอ/เขต</label>
                        <input
                            className="w-full border rounded-md px-3 py-2"
                            value={v.district ?? ""}
                            onChange={(e) => patch({ district: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">จังหวัด</label>
                        <input
                            className="w-full border rounded-md px-3 py-2"
                            value={v.province ?? ""}
                            onChange={(e) => patch({ province: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">รหัสไปรษณีย์</label>
                        <input
                            className="w-full border rounded-md px-3 py-2"
                            value={v.zip ?? ""}
                            onChange={(e) => patch({ zip: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-600 mb-1">โทรศัพท์</label>
                        <input
                            className="w-full border rounded-md px-3 py-2"
                            value={v.tel ?? ""}
                            onChange={(e) => patch({ tel: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">โทรสาร</label>
                        <input
                            className="w-full border rounded-md px-3 py-2"
                            value={v.fax ?? ""}
                            onChange={(e) => patch({ fax: e.target.value })}
                        />
                    </div>
                    <div />
                    <div />
                </div>

                {/* --- ใบอนุญาต/แบบแปลน --- */}
                <div className="rounded-md border border-gray-300 p-4 text-gray-800">
                    <label className="flex items-start gap-2 text-sm leading-relaxed">
                        <input
                            type="checkbox"
                            className="h-4 w-4 mt-0.5"
                            checked={!!v.hasPermitInfo}
                            onChange={(e) => {
                                const checked = e.target.checked;
                                patch({
                                    hasPermitInfo: checked,
                                    noPermitInfo: checked ? false : v.noPermitInfo,
                                    ...(checked
                                        ? {}
                                        : { permitDay: "", permitMonth: "", permitYear: "" }),
                                });
                            }}
                        />

                        <span>
                            มีข้อมูลการได้รับใบอนุญาตก่อสร้างจากเจ้าพนักงานท้องถิ่น เมื่อวันที่
                            <select
                                className={`mx-2 w-12 bg-transparent border-0 border-b border-dashed text-center cursor-pointer
                  focus:outline-none focus:ring-0
                  ${v.hasPermitInfo ? "border-gray-400" : "border-gray-200 text-gray-400 cursor-not-allowed"}`}
                                value={v.permitDay ?? ""}
                                disabled={!v.hasPermitInfo}
                                onChange={(e) => patch({ permitDay: e.target.value })}
                            >
                                <option value="" disabled />
                                {Array.from(
                                    { length: getDaysInMonthThai(v.permitYear, v.permitMonth as any) },
                                    (_, i) => {
                                        const d = String(i + 1);
                                        return (
                                            <option key={d} value={d}>
                                                {d}
                                            </option>
                                        );
                                    }
                                )}
                            </select>

                            <span>เดือน</span>
                            <select
                                className={`mx-2 w-36 bg-transparent border-0 border-b border-dashed text-center cursor-pointer
                  focus:outline-none focus:ring-0
                  ${v.hasPermitInfo ? "border-gray-400" : "border-gray-200 text-gray-400 cursor-not-allowed"}`}
                                value={v.permitMonth ?? ""}
                                disabled={!v.hasPermitInfo}
                                onChange={(e) => {
                                    const newMonth = e.target.value as ThaiMonth | "";
                                    const maxDay = getDaysInMonthThai(v.permitYear, newMonth);
                                    const next: Partial<SectionTwoForm> = { permitMonth: newMonth };
                                    if (v.permitDay && Number(v.permitDay) > maxDay) next.permitDay = String(maxDay);
                                    patch(next);
                                }}
                            >
                                <option value="" />
                                {THAI_MONTHS.map((m) => (
                                    <option key={m} value={m}>
                                        {m}
                                    </option>
                                ))}
                            </select>

                            <span>พ.ศ.</span>
                            <select
                                className={`ml-2 w-16 bg-transparent border-0 border-b border-dashed text-center cursor-pointer
                  focus:outline-none focus:ring-0
                  ${v.hasPermitInfo ? "border-gray-400" : "border-gray-200 text-gray-400 cursor-not-allowed"}`}
                                value={v.permitYear ?? ""}
                                disabled={!v.hasPermitInfo}
                                onChange={(e) => {
                                    const newYear = e.target.value;
                                    const maxDay = getDaysInMonthThai(newYear, v.permitMonth as any);
                                    const next: Partial<SectionTwoForm> = { permitYear: newYear };
                                    if (v.permitDay && Number(v.permitDay) > maxDay) next.permitDay = String(maxDay);
                                    patch(next);
                                }}
                            >
                                <option value="" disabled />
                                {YEARS.map((y) => (
                                    <option key={y} value={y}>
                                        {y}
                                    </option>
                                ))}
                            </select>
                        </span>
                    </label>

                    <div className="mt-3 space-y-2 text-sm">
                        <label className="flex items-start gap-2">
                            <input
                                type="checkbox"
                                className="h-4 w-4"
                                checked={!!v.hasOriginalPlan}
                                onChange={(e) =>
                                    patch({
                                        hasOriginalPlan: e.target.checked,
                                        noOriginalPlan: e.target.checked ? false : v.noOriginalPlan,
                                    })
                                }
                            />
                            <span>มีแบบแปลนเดิม</span>
                        </label>

                        <label className="flex items-start gap-2 leading-relaxed">
                            <input
                                type="checkbox"
                                className="h-4 w-4"
                                checked={!!v.noOriginalPlan}
                                onChange={(e) =>
                                    patch({
                                        noOriginalPlan: e.target.checked,
                                        hasOriginalPlan: e.target.checked ? false : v.hasOriginalPlan,
                                    })
                                }
                            />
                            <span>
                                ไม่มีแบบแปลนเดิม (กรณีที่ไม่มีแบบแปลนหรือแผนผังรายการเกี่ยวกับการก่อสร้าง ให้เจ้าของป้ายจัดหา/จัดทำแบบแปลน)
                            </span>
                        </label>

                        <label className="flex items-start gap-2">
                            <input
                                type="checkbox"
                                className="h-4 w-4"
                                checked={!!v.noPermitInfo}
                                onChange={(e) =>
                                    patch({
                                        noPermitInfo: e.target.checked,
                                        hasPermitInfo: e.target.checked ? false : v.hasPermitInfo,
                                        ...(e.target.checked ? { permitDay: "", permitMonth: "", permitYear: "" } : {}),
                                    })
                                }
                            />
                            <span>ไม่มีข้อมูลการได้รับใบอนุญาตก่อสร้างจากเจ้าพนักงานท้องถิ่น</span>
                        </label>

                        {/* อายุของป้าย */}
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                className="h-4 w-4"
                                checked={!!v.noOld}
                                onChange={(e) => {
                                    const checked = e.target.checked;
                                    patch({
                                        noOld: checked,
                                        ...(checked ? {} : { signAge: "", signYear: "" }),
                                    });
                                }}
                            />

                            <span>อายุของป้าย</span>

                            <input
                                type="text"
                                inputMode="numeric"
                                className={`w-20 bg-transparent border-0 border-b border-dashed text-center
                  focus:outline-none focus:ring-0
                  ${v.noOld ? "border-gray-400" : "border-gray-200 text-gray-400"}`}
                                value={v.signAge ?? ""}
                                onChange={(e) => patch({ signAge: e.target.value.replace(/\D/g, "") })}
                                disabled={!v.noOld}
                            />

                            <span>ปี (ก่อสร้างประมาณปี พ.ศ.</span>

                            <select
                                className={`w-16 bg-transparent border-0 border-b border-dashed text-center cursor-pointer
                  focus:outline-none focus:ring-0
                  ${v.noOld ? "border-gray-400" : "border-gray-200 text-gray-400 cursor-not-allowed"}`}
                                value={v.signYear ?? ""}
                                disabled={!v.noOld}
                                onChange={(e) => patch({ signYear: e.target.value })}
                            >
                                <option value="" disabled />
                                {YEARS.map((y) => (
                                    <option key={y} value={y}>
                                        {y}
                                    </option>
                                ))}
                            </select>

                            <span>)</span>
                        </div>

                        <label className="flex items-start gap-2">
                            <input
                                type="checkbox"
                                className="h-4 w-4"
                                checked={!!v.noPermitInfo2}
                                onChange={(e) => patch({ noPermitInfo2: e.target.checked })}
                            />
                            <span>ป้ายไม่เข้าข่ายต้องขออนุญาตก่อสร้าง **</span>
                        </label>
                    </div>
                </div>

                <ImageField
                    label="แผนที่แสดงตำแหน่งที่ตั้งของป้ายโดยสังเขป"
                    value={mapPrev}
                    onChange={(blob) => pickSingleImage(blob, "map", "mapSketch", setMapPrev)}
                    hint="อัปโหลดภาพแผนที่โดยสังเขป"
                />

                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-800">
                    <div className="flex items-center gap-2">
                        <span className="min-w-[90px] font-semibold">LATITUDE</span>
                        <input
                            type="text"
                            inputMode="decimal"
                            placeholder="เช่น 13.7563"
                            className="w-full bg-transparent border-0 border-b border-dashed border-gray-400 text-center
                       focus:outline-none focus:ring-0"
                            value={v.latitude ?? ""}
                            onChange={(e) => {
                                const next = e.target.value.replace(/[^\d.\-]/g, "");
                                patch({ latitude: next });
                            }}
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="min-w-[90px] font-semibold">LONGITUDE</span>
                        <input
                            type="text"
                            inputMode="decimal"
                            placeholder="เช่น 100.5018"
                            className="w-full bg-transparent border-0 border-b border-dashed border-gray-400 text-center
                       focus:outline-none focus:ring-0"
                            value={v.longitude ?? ""}
                            onChange={(e) => {
                                const next = e.target.value.replace(/[^\d.\-]/g, "");
                                patch({ longitude: next });
                            }}
                        />
                    </div>
                </div>

                <ImageField
                    label="แผนผังตำแหน่งที่ตั้งของป้ายโดยสังเขป"
                    value={mapPrev1}
                    onChange={(blob) => pickSingleImage(blob, "map1", "mapSketch1", setMapPrev1)}
                    hint="อัปโหลดภาพแผนผังโดยสังเขป"
                />
            </section>

            {/* ===================== วันที่ตรวจ + รูปแบบ/ขนาด ===================== */}
            <section className="space-y-4">
                <div className="sm:grid-cols-2 gap-3 flex flex-col">
                    <div className="flex items-center gap-2 text-sm">
                        <span>วัน/เดือน/ปี ที่ตรวจสอบ</span>

                        <select
                            className="w-10 bg-transparent border-0 border-b border-dashed border-gray-400
                         focus:outline-none focus:ring-0 text-center cursor-pointer"
                            value={v.inspectDay3 ?? ""}
                            onChange={(e) => patch({ inspectDay3: e.target.value })}
                        >
                            <option value="" disabled />
                            {Array.from(
                                { length: getDaysInMonthThai(v.inspectYear3, v.inspectMonth3 as any) },
                                (_, i) => {
                                    const d = String(i + 1);
                                    return (
                                        <option key={d} value={d}>
                                            {d}
                                        </option>
                                    );
                                }
                            )}
                        </select>

                        <span>เดือน</span>

                        <select
                            className="w-28 bg-transparent border-0 border-b border-dashed border-gray-400
                         focus:outline-none focus:ring-0 text-center cursor-pointer"
                            value={v.inspectMonth3 ?? ""}
                            onChange={(e) => {
                                const newMonth = e.target.value as ThaiMonth | "";
                                const maxDay = getDaysInMonthThai(v.inspectYear3, newMonth);
                                const next: Partial<SectionTwoForm> = { inspectMonth3: newMonth };
                                if (v.inspectDay3 && Number(v.inspectDay3) > maxDay) next.inspectDay3 = String(maxDay);
                                patch(next);
                            }}
                        >
                            <option value="" disabled />
                            {THAI_MONTHS.map((m) => (
                                <option key={m} value={m}>
                                    {m}
                                </option>
                            ))}
                        </select>

                        <span>พ.ศ.</span>

                        <select
                            className="w-16 bg-transparent border-0 border-b border-dashed border-gray-400
                         focus:outline-none focus:ring-0 text-center cursor-pointer"
                            value={v.inspectYear3 ?? ""}
                            onChange={(e) => {
                                const newYear = e.target.value;
                                const maxDay = getDaysInMonthThai(newYear, v.inspectMonth3 as any);
                                const next: Partial<SectionTwoForm> = { inspectYear3: newYear };
                                if (v.inspectDay3 && Number(v.inspectDay3) > maxDay) next.inspectDay3 = String(maxDay);
                                patch(next);
                            }}
                        >
                            <option value="" disabled />
                            {YEARS.map((y) => (
                                <option key={y} value={y}>
                                    {y}
                                </option>
                            ))}
                        </select>

                        <span>บันทึกโดย</span>
                        <input
                            type="text"
                            className="flex-1 bg-transparent border-0 border-b border-dashed border-gray-400
                         focus:outline-none focus:ring-0 px-2"
                            value={v.recorder3 ?? ""}
                            onChange={(e) => patch({ recorder3: e.target.value })}
                        />
                    </div>

                    <ImageField
                        label="รูปถ่ายป้ายในวันเวลาที่ตรวจสอบ"
                        value={shapePrev1}
                        onChange={(blob) => pickSingleImage(blob, "shape1", "shapeSketch1", setShapePrev1)}
                        square
                    />

                    <ImageField
                        label="รูปแบบและขนาดของแผ่นป้าย และสิ่งที่สร้างขึ้นสำหรับติดตั้งป้ายโดยสังเขป"
                        value={shapePrev}
                        onChange={(blob) => pickSingleImage(blob, "shape", "shapeSketch", setShapePrev)}
                        square
                    />

                    <div className="mt-3 relative rounded-md p-4 text-gray-900">
                        <div className="text-xl font-bold mb-2">
                            ข้อมูลขนาดของป้าย และสิ่งที่สร้างขึ้นสำหรับติดหรือขึงป้าย
                        </div>

                        <div className="space-y-2 text-lg leading-relaxed">
                            <div className="flex items-end gap-2">
                                <span>ความกว้างของแผ่นป้าย</span>
                                <input
                                    className="w-24 bg-transparent border-0 border-b border-dashed border-black/70 text-center
                             focus:outline-none focus:ring-0"
                                    value={v.signWidthM ?? ""}
                                    inputMode="decimal"
                                    onChange={(e) =>
                                        patch({ signWidthM: e.target.value.replace(/[^\d.\-]/g, "") })
                                    }
                                />
                                <span>เมตร</span>
                            </div>

                            <div className="flex items-end gap-2">
                                <span>ความสูงของแผ่นป้าย</span>
                                <input
                                    className="w-24 bg-transparent border-0 border-b border-dashed border-black/70 text-center
                             focus:outline-none focus:ring-0"
                                    value={v.signHeightM ?? ""}
                                    inputMode="decimal"
                                    onChange={(e) =>
                                        patch({ signHeightM: e.target.value.replace(/[^\d.\-]/g, "") })
                                    }
                                />
                                <span>เมตร</span>
                            </div>

                            <div className="flex items-end gap-2">
                                <span>จำนวนด้านของป้าย</span>
                                <input
                                    className="w-20 bg-transparent border-0 border-b border-dashed border-black/70 text-center
                             focus:outline-none focus:ring-0"
                                    value={v.signSides ?? ""}
                                    inputMode="numeric"
                                    onChange={(e) =>
                                        patch({ signSides: e.target.value.replace(/\D/g, "") })
                                    }
                                />
                                <span>ด้าน</span>
                            </div>

                            <div className="flex items-end gap-2">
                                <span>พื้นที่ป้าย โดยประมาณ</span>
                                <select
                                    className="bg-transparent border-0 border-b-2 border-red-600 text-red-600 font-bold
                             focus:outline-none focus:ring-0 cursor-pointer"
                                    value={v.signAreaMore ?? ""}
                                    onChange={(e) => patch({ signAreaMore: e.target.value })}
                                >
                                    <option value="" />
                                    <option value="25">มากกว่า 25</option>
                                    <option value="50">มากกว่า 50</option>
                                </select>
                                <span>ตารางเมตร</span>
                            </div>

                            <div className="flex items-end gap-2">
                                <span>ความสูงของโครงสร้างสำหรับติดตั้งแผ่นป้าย</span>
                                <select
                                    className="bg-transparent border-0 border-b-2 border-red-600 text-red-600 font-bold
                             focus:outline-none focus:ring-0 cursor-pointer"
                                    value={v.structureHeightMore ?? ""}
                                    onChange={(e) => patch({ structureHeightMore: e.target.value })}
                                >
                                    <option value="" />
                                    <option value="15">มากกว่า 15</option>
                                </select>
                                <span>เมตร</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===================== รูป 1-3 ===================== */}
            <section className="space-y-4">
                <div className="grid md:grid-cols-3 gap-6">
                    <ImageGallery
                        label="รูปที่ 1"
                        values={p1 ? [p1] : []}
                        onChange={(urls) => pickGalleryImage(urls, "front", "photosFront", setP1)}
                        single
                    />
                    <ImageGallery
                        label="รูปที่ 2"
                        values={p2 ? [p2] : []}
                        onChange={(urls) => pickGalleryImage(urls, "side", "photosSide", setP2)}
                        single
                    />
                    <ImageGallery
                        label="รูปที่ 3"
                        values={p3 ? [p3] : []}
                        onChange={(urls) => pickGalleryImage(urls, "base", "photosBase", setP3)}
                        single
                    />
                </div>
            </section>

            {/* ===================== รูป 4-6 ===================== */}
            <section className="space-y-4">
                <div className="grid md:grid-cols-3 gap-6">
                    <ImageGallery
                        label="รูปที่ 4"
                        values={p4 ? [p4] : []}
                        onChange={(urls) => pickGalleryImage(urls, "front1", "photosFront1", setP4)}
                        single
                    />
                    <ImageGallery
                        label="รูปที่ 5"
                        values={p5 ? [p5] : []}
                        onChange={(urls) => pickGalleryImage(urls, "side1", "photosSide1", setP5)}
                        single
                    />
                    <ImageGallery
                        label="รูปที่ 6"
                        values={p6 ? [p6] : []}
                        onChange={(urls) => pickGalleryImage(urls, "base1", "photosBase1", setP6)}
                        single
                    />
                </div>
            </section>

            {/* ===================== 2. ประเภทของป้าย ===================== */}
            <section className="space-y-3">
                <h3 className="text-lg font-semibold">2. ประเภทของป้าย</h3>

                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2">
                    <label className="inline-flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={!!v.typeGround}
                            onChange={(e) => patch({ typeGround: e.target.checked })}
                        />
                        ป้ายที่ติดตั้งบนพื้นดิน
                    </label>

                    <label className="inline-flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={!!v.typeRooftop}
                            onChange={(e) => patch({ typeRooftop: e.target.checked })}
                        />
                        ป้ายบนดาดฟ้าอาคาร
                    </label>

                    <label className="inline-flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={!!v.typeOnRoof}
                            onChange={(e) => patch({ typeOnRoof: e.target.checked })}
                        />
                        ป้ายบนหลังคา
                    </label>

                    <label className="inline-flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={!!v.typeOnBuilding}
                            onChange={(e) => patch({ typeOnBuilding: e.target.checked })}
                        />
                        ป้ายบนส่วนหนึ่งส่วนใดของอาคาร
                    </label>

                    <div className="flex items-center gap-2">
                        <input
                            id="typeOther"
                            type="checkbox"
                            checked={!!v.typeOtherChecked}
                            onChange={(e) =>
                                patch({
                                    typeOtherChecked: e.target.checked,
                                    ...(e.target.checked ? {} : { typeOther: "" }),
                                })
                            }
                        />
                        <label htmlFor="typeOther" className="select-none">
                            อื่นๆ (โปรดระบุ)
                        </label>

                        <input
                            type="text"
                            className={`flex-1 bg-transparent border-0 border-b border-dashed
                focus:outline-none focus:ring-0 px-1
                ${v.typeOtherChecked ? "border-gray-400" : "border-gray-200 text-gray-400"}`}
                            value={v.typeOther ?? ""}
                            onChange={(e) => patch({ typeOther: e.target.value })}
                            disabled={!v.typeOtherChecked}
                        />
                    </div>
                </div>
            </section>

            {/* ===================== 3. เจ้าของ/ผู้ออกแบบ ===================== */}
            <section className="space-y-4">
                <h3 className="text-lg font-semibold">
                    3. ชื่อเจ้าของหรือผู้ครอบครองป้าย และผู้ออกแบบด้านวิศวกรรมโครงสร้าง
                </h3>

                <div>
                    <label className="block text-sm text-gray-600 mb-1">
                        5.3.1 ชื่อผลิตภัณฑ์โฆษณาหรือข้อความในป้าย
                    </label>
                    <textarea
                        rows={3}
                        className="w-full border rounded-md px-3 py-2"
                        value={v.productText ?? ""}
                        onChange={(e) => patch({ productText: e.target.value })}
                    />
                </div>

                <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-800">5.3.2 เจ้าของหรือผู้ครอบครองป้าย</div>

                    <div className="grid md:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">ชื่อ</label>
                            <input
                                className="w-full border rounded-md px-3 py-2"
                                value={v.ownerName ?? ""}
                                onChange={(e) => patch({ ownerName: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">เลขที่</label>
                                <input
                                    className="w-full border rounded-md px-3 py-2"
                                    value={v.ownerNo ?? ""}
                                    onChange={(e) => patch({ ownerNo: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">หมู่ที่</label>
                                <input
                                    className="w-full border rounded-md px-3 py-2"
                                    value={v.ownerMoo ?? ""}
                                    onChange={(e) => patch({ ownerMoo: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">ตรอก/ซอย</label>
                                <input
                                    className="w-full border rounded-md px-3 py-2"
                                    value={v.ownerAlley ?? ""}
                                    onChange={(e) => patch({ ownerAlley: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm text-gray-600 mb-1">ถนน</label>
                            <input
                                className="w-full border rounded-md px-3 py-2"
                                value={v.ownerRoad ?? ""}
                                onChange={(e) => patch({ ownerRoad: e.target.value })}
                            />
                        </div>

                        <div className="grid md:grid-cols-3 gap-2">
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">ตำบล/แขวง</label>
                                <input
                                    className="w-full border rounded-md px-3 py-2"
                                    value={v.ownerSub ?? ""}
                                    onChange={(e) => patch({ ownerSub: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">อำเภอ/เขต</label>
                                <input
                                    className="w-full border rounded-md px-3 py-2"
                                    value={v.ownerDist ?? ""}
                                    onChange={(e) => patch({ ownerDist: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">จังหวัด</label>
                                <input
                                    className="w-full border rounded-md px-3 py-2"
                                    value={v.ownerProv ?? ""}
                                    onChange={(e) => patch({ ownerProv: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-2">
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">รหัสไปรษณีย์</label>
                                <input
                                    className="w-full border rounded-md px-3 py-2"
                                    value={v.ownerZip ?? ""}
                                    onChange={(e) => patch({ ownerZip: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">โทรศัพท์</label>
                                <input
                                    className="w-full border rounded-md px-3 py-2"
                                    value={v.ownerTel ?? ""}
                                    onChange={(e) => patch({ ownerTel: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">โทรสาร</label>
                                <input
                                    className="w-full border rounded-md px-3 py-2"
                                    value={v.ownerFax ?? ""}
                                    onChange={(e) => patch({ ownerFax: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm text-gray-600 mb-1">อีเมล</label>
                            <input
                                className="w-full border rounded-md px-3 py-2"
                                value={v.ownerEmail ?? ""}
                                onChange={(e) => patch({ ownerEmail: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">
                            5.3.3 ผู้ออกแบบด้านวิศวกรรมโครงสร้าง (ชื่อ)
                        </label>
                        <input
                            className="w-full border rounded-md px-3 py-2"
                            value={v.designerName ?? ""}
                            onChange={(e) => patch({ designerName: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">ใบอนุญาตทะเบียนเลขที่</label>
                        <input
                            className="w-full border rounded-md px-3 py-2"
                            value={v.designerLicense ?? ""}
                            onChange={(e) => patch({ designerLicense: e.target.value })}
                        />
                    </div>
                </div>
            </section>

            {/* ===================== 4. วัสดุ/รายละเอียด ===================== */}
            <section className="space-y-4">
                <h3 className="text-lg font-semibold">
                    4. ประเภทของวัสดุและรายละเอียดของแผ่นป้าย (สามารถระบุมากกว่า 1 ข้อได้)
                </h3>

                <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-800">
                        4.1 ประเภทวัสดุของสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย
                    </div>

                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2">
                        <label className="inline-flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={!!v.matSteel}
                                onChange={(e) => patch({ matSteel: e.target.checked })}
                            />
                            เหล็กโครงสร้างรูปพรรณ
                        </label>

                        <label className="inline-flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={!!v.matWood}
                                onChange={(e) => patch({ matWood: e.target.checked })}
                            />
                            ไม้
                        </label>

                        <label className="inline-flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={!!v.matStainless}
                                onChange={(e) => patch({ matStainless: e.target.checked })}
                            />
                            สเตนเลส
                        </label>

                        <label className="inline-flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={!!v.matRCC}
                                onChange={(e) => patch({ matRCC: e.target.checked })}
                            />
                            คอนกรีตเสริมเหล็ก
                        </label>

                        <div className="flex items-center gap-2 sm:col-span-2">
                            <input
                                id="matOther"
                                type="checkbox"
                                checked={!!v.matOtherChecked}
                                onChange={(e) =>
                                    patch({
                                        matOtherChecked: e.target.checked,
                                        ...(e.target.checked ? {} : { matOther: "" }),
                                    })
                                }
                            />
                            <label htmlFor="matOther" className="select-none">
                                อื่น ๆ
                            </label>

                            <input
                                type="text"
                                placeholder="โปรดระบุ"
                                className={`flex-1 bg-transparent border-0 border-b border-dashed px-1
                  focus:outline-none focus:ring-0
                  ${v.matOtherChecked ? "border-gray-400" : "border-gray-200 text-gray-400"}`}
                                value={v.matOther ?? ""}
                                onChange={(e) => patch({ matOther: e.target.value })}
                                disabled={!v.matOtherChecked}
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="text-sm font-medium text-gray-800">4.2 รายละเอียดของแผ่นป้าย</div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={!!v.chkMat}
                                onChange={(e) =>
                                    patch({
                                        chkMat: e.target.checked,
                                        ...(e.target.checked ? {} : { panelMaterial: "" }),
                                    })
                                }
                            />
                            <span>วัสดุของป้าย (โปรดระบุ)</span>
                            <input
                                type="text"
                                className={`flex-1 bg-transparent border-0 border-b border-dashed px-1
                  focus:outline-none focus:ring-0
                  ${v.chkMat ? "border-gray-400" : "border-gray-200 text-gray-400"}`}
                                value={v.panelMaterial ?? ""}
                                onChange={(e) => patch({ panelMaterial: e.target.value })}
                                disabled={!v.chkMat}
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={!!v.chkFaces}
                                onChange={(e) =>
                                    patch({
                                        chkFaces: e.target.checked,
                                        ...(e.target.checked ? {} : { panelFaces: "" }),
                                    })
                                }
                            />
                            <span>จำนวนด้านที่ติดป้าย (โปรดระบุจำนวนด้าน)</span>
                            <input
                                type="text"
                                inputMode="numeric"
                                maxLength={2}
                                className={`w-16 text-center bg-transparent border-0 border-b border-dashed
                  focus:outline-none focus:ring-0
                  ${v.chkFaces ? "border-gray-400" : "border-gray-200 text-gray-400"}`}
                                value={v.panelFaces ?? ""}
                                onChange={(e) => patch({ panelFaces: e.target.value.replace(/\D/g, "") })}
                                disabled={!v.chkFaces}
                            />
                            <span>ด้าน</span>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={!!v.chkOpen}
                                    onChange={(e) =>
                                        patch({
                                            chkOpen: e.target.checked,
                                            ...(e.target.checked ? {} : { panelOpenings: "" }),
                                        })
                                    }
                                />
                                <span>การเจาะช่องเปิดในป้าย</span>
                            </div>

                            <label className="inline-flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    disabled={!v.chkOpen}
                                    checked={!!v.chkOpen && v.panelOpenings === "มี"}
                                    onChange={(e) => patch({ panelOpenings: e.target.checked ? "มี" : "" })}
                                />
                                มี
                            </label>

                            <label className="inline-flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    disabled={!v.chkOpen}
                                    checked={!!v.chkOpen && v.panelOpenings === "ไม่มี"}
                                    onChange={(e) => patch({ panelOpenings: e.target.checked ? "ไม่มี" : "" })}
                                />
                                ไม่มี
                            </label>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={!!v.chkOther}
                                onChange={(e) =>
                                    patch({
                                        chkOther: e.target.checked,
                                        ...(e.target.checked ? {} : { panelOther: "" }),
                                    })
                                }
                            />
                            <span>อื่น ๆ (โปรดระบุ)</span>
                            <input
                                type="text"
                                className={`flex-1 bg-transparent border-0 border-b border-dashed px-1
                  focus:outline-none focus:ring-0
                  ${v.chkOther ? "border-gray-400" : "border-gray-200 text-gray-400"}`}
                                value={v.panelOther ?? ""}
                                onChange={(e) => patch({ panelOther: e.target.value })}
                                disabled={!v.chkOther}
                            />
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
