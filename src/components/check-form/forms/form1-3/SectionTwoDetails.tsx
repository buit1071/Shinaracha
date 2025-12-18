import * as React from "react";
import { showLoading } from "@/lib/loading";
// import type { ViewDataForm } from "@/interfaces/master";

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
    onChange: (v: string | null) => void;
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
        const url = URL.createObjectURL(f);
        onChange(url);
    };

    const clear = () => onChange(null);

    // คำนวณขนาดกล่องแสดงรูป
    const boxW = width;
    const boxH = square ? Math.min(width, height) : height;

    return (
        <div className={`space-y-2 ${className}`}>
            <div className="text-sm font-medium text-gray-800">{label}</div>

            <div className="rounded-md p-3 bg-gray-50 flex flex-col items-center">
                <div
                    className="rounded-md bg-gray-200 grid place-items-center overflow-hidden w-full"
                    style={{
                        maxWidth: boxW,   // ความกว้างสูงสุดของกรอบ
                        width: "100%",
                        height: boxH,     // ความสูงกรอบ (เช่น 400)
                        outline: "1px solid rgba(0,0,0,0.08)",
                    }}
                >
                    {value ? (
                        <img
                            src={value}
                            alt={label}
                            className="h-full w-auto max-w-full object-contain"
                            style={{ display: "block" }} // กัน inline-gap เล็กๆ
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

/* ---------- Reusable Image Gallery (multi) ---------- */
function ImageGallery({
    label,
    values,
    onChange,
    hint,
    single = false,                 // ✅ เพิ่มโหมด single
}: {
    label: string;
    values: string[];
    onChange: (urls: string[]) => void;
    hint?: string;
    single?: boolean;
}) {
    const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        if (!files.length) return;
        const urls = files.map((f) => URL.createObjectURL(f));
        onChange(single ? [urls[0]] : [...values, ...urls]);  // ✅ โหมด single เก็บรูปเดียว
    };

    const removeAt = (idx: number) => {
        const next = values.slice();
        // URL.revokeObjectURL(next[idx]); // ถ้าต้องการเคลียร์ URL เก่า
        next.splice(idx, 1);
        onChange(next);
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

                    {/* ปุ่มเพิ่ม/เปลี่ยนรูป: ซ่อนเมื่อมีรูปแล้วในโหมด single */}
                    {!(single && values.length >= 1) && (
                        <label className="inline-flex items-center gap-2 rounded-md border border-blue-500 text-blue-600 px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer">
                            <input
                                type="file"
                                accept="image/*"
                                multiple={!single}               // ✅ single = ไม่ multiple
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
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

const currentThaiYear = new Date().getFullYear() + 543;
const YEAR_START = 2568;                       // ย้อนหลังได้นานพอสมควร
const YEAR_END = currentThaiYear + 20;       // เผื่ออนาคต
const YEARS = Array.from({ length: YEAR_END - YEAR_START + 1 }, (_, i) => String(YEAR_START + i));

export type ThaiMonth = typeof THAI_MONTHS[number];

function getDaysInMonthThai(
    thaiYear: string | number | null | undefined,
    thaiMonth: ThaiMonth | "" | null | undefined
): number {
    const monthIndex = thaiMonth ? THAI_MONTHS.indexOf(thaiMonth) : -1; // 0..11 หรือ -1 ถ้าไม่ถูกต้อง
    const y = typeof thaiYear === "number" ? thaiYear : parseInt(thaiYear ?? "", 10);

    if (monthIndex < 0 || Number.isNaN(y)) return 31;

    const gregorianYear = y - 543;
    // วันสุดท้ายของเดือนนั้น
    return new Date(gregorianYear, monthIndex + 1, 0).getDate();
}

export type SectionTwoForm = {
    // ===== เดิม (ฟิลด์ที่ผู้ใช้กรอกเอง) =====
    permitDay?: string; permitMonth?: string; permitYear?: string; signYear?: string;
    inspectDay2?: string; inspectMonth2?: string; inspectYear2?: string;
    inspectDay3?: string; inspectMonth3?: string; inspectYear3?: string;
    hasOriginalPlan?: boolean; noOriginalPlan?: boolean; noPermitInfo?: boolean; noPermitInfo2?: boolean; hasPermitInfo?: boolean; noOld?: boolean;
    signAge?: string;
    longitude?: string;
    latitude?: string;
    mapSketch?: string | null; mapSketch1?: string | null; shapeSketch?: string | null; shapeSketch1?: string | null;
    photosFront?: string | null; photosSide?: string | null; photosBase?: string | null;
    photosFront1?: string | null; photosSide1?: string | null; photosBase1?: string | null;
    mapSketchPreview?: string | null;
    mapSketchPreview1?: string | null;
    shapeSketchPreview?: string | null;
    shapeSketchPreview1?: string | null;
    photosFrontPreview?: string | null;
    photosSidePreview?: string | null;
    photosBasePreview?: string | null;
    signWidthM?: string | null;
    signHeightM?: string | null;
    signSides?: string | null;
    signAreaMore?: string | null;
    structureHeightMore?: string | null;
    recorder2?: string; recorder3?: string;
    // 5.2
    typeGround?: boolean; typeRooftop?: boolean; typeOnRoof?: boolean; typeOnBuilding?: boolean;
    typeOtherChecked?: boolean; typeOther?: string;
    // 5.4
    matSteel?: boolean; matWood?: boolean; matStainless?: boolean; matRCC?: boolean;
    matOtherChecked?: boolean; matOther?: string;
    panelMaterial?: string; panelFaces?: string; panelOpenings?: "" | "มี" | "ไม่มี"; panelOther?: string;
    chkMat?: boolean; chkFaces?: boolean; chkOpen?: boolean; chkOther?: boolean;

    // ===== ใหม่: ฟิลด์จาก viewData (read-only ฝั่ง UI แต่เก็บไว้ใน formData) =====
    signName?: string;        // equipment_name
    addrNo?: string;          // address_no
    addrAlley?: string;       // alley
    addrRoad?: string;        // road
    subDistrict?: string;     // sub_district_name_th
    district?: string;        // district_name_th
    province?: string;        // province_name_th
    zip?: string;             // zipcode
    tel?: string;             // phone
    fax?: string;             // fax

    productText?: string;     // description
    ownerName?: string;       // owner_name
    ownerNo?: string;         // owner_address_no
    ownerMoo?: string;        // owner_moo
    ownerAlley?: string;      // owner_alley
    ownerRoad?: string;       // owner_road
    ownerSub?: string;        // owner_sub_district_name_th
    ownerDist?: string;       // owner_district_name_th
    ownerProv?: string;       // owner_province_name_th
    ownerZip?: string;        // owner_zipcode
    ownerTel?: string;        // owner_phone
    ownerFax?: string;        // owner_fax
    ownerEmail?: string;      // owner_email
    designerName?: string;    // designer_name
    designerLicense?: string; // designer_license_no
};

type Props = {
    data: SectionTwoForm | null;
    value?: Partial<SectionTwoForm>;
    onChange?: (patch: Partial<SectionTwoForm>) => void;
};

/* ========================== SECTION TWO ========================== */
export default function SectionTwoDetails({ data, value, onChange }: Props) {
    const buildRemoteImgUrl = (name: string) =>
        `${process.env.NEXT_PUBLIC_N8N_UPLOAD_FILE}?name=${encodeURIComponent(name)}`;
    const onChangeRef = React.useRef(onChange);
    React.useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

    // 5.1 ข้อมูลป้ายและสถานที่ตั้ง (จาก viewData เท่านั้น — ไม่ส่งกลับ)
    const [signName, setSignName] = React.useState(""); // equipment_name
    const [addrNo, setAddrNo] = React.useState("");     // address_no
    const [addrAlley, setAddrAlley] = React.useState(""); // alley
    const [addrRoad, setAddrRoad] = React.useState("");   // road
    const [subDistrict, setSubDistrict] = React.useState(""); // sub_district_id
    const [district, setDistrict] = React.useState("");       // district_id
    const [province, setProvince] = React.useState("");       // province_id
    const [zip, setZip] = React.useState("");                 // zipcode
    const [tel, setTel] = React.useState("");                 // phone
    const [fax, setFax] = React.useState("");                 // fax

    // ===== ฟิลด์ที่ “จะส่งกลับ” =====
    // 5.1 (ส่วนของการอนุญาต + อายุป้าย + แผน/แบบ ฯลฯ) — ผู้ใช้กรอก/ติ๊กเอง
    const [permitDay, setPermitDay] = React.useState(value?.permitDay ?? "");
    const [permitMonth, setPermitMonth] = React.useState(value?.permitMonth ?? "");
    const [permitYear, setPermitYear] = React.useState(value?.permitYear ?? "");
    const [signYear, setSignYear] = React.useState<string>(value?.signYear ?? "");
    const [hasPermitInfo, setHasPermitInfo] = React.useState<boolean>(value?.hasPermitInfo ?? false);
    const [latitude, setLatitude] = React.useState<string>(value?.latitude ?? "");
    const [longitude, setLongitude] = React.useState<string>(value?.longitude ?? "");

    const [inspectDay2, setInspectDay2] = React.useState(value?.inspectDay2 ?? "");
    const [inspectMonth2, setInspectMonth2] = React.useState(value?.inspectMonth2 ?? "");
    const [inspectYear2, setInspectYear2] = React.useState(value?.inspectYear2 ?? "");

    const [inspectDay3, setInspectDay3] = React.useState(value?.inspectDay3 ?? "");
    const [inspectMonth3, setInspectMonth3] = React.useState(value?.inspectMonth3 ?? "");
    const [inspectYear3, setInspectYear3] = React.useState(value?.inspectYear3 ?? "");

    const [hasOriginalPlan, setHasOriginalPlan] = React.useState<boolean>(value?.hasOriginalPlan ?? false);
    const [noOriginalPlan, setNoOriginalPlan] = React.useState<boolean>(value?.noOriginalPlan ?? false);
    const [noPermitInfo, setNoPermitInfo] = React.useState<boolean>(value?.noPermitInfo ?? false);
    const [noPermitInfo2, setNoPermitInfo2] = React.useState<boolean>(value?.noPermitInfo2 ?? false);
    const [noOld, setNoOld] = React.useState<boolean>(value?.noOld ?? false);
    const [signAge, setSignAge] = React.useState<string>(value?.signAge ?? "");

    const [mapSketch, setMapSketch] = React.useState<string | null>(value?.mapSketch ?? null);
    const [mapSketch1, setMapSketch1] = React.useState<string | null>(value?.mapSketch ?? null);
    const [mapSketchPreview, setMapSketchPreview] = React.useState<string | null>(null);
    const [mapSketchPreview1, setMapSketchPreview1] = React.useState<string | null>(null);

    const [shapeSketch, setShapeSketch] = React.useState<string | null>(value?.shapeSketch ?? null);
    const [shapeSketch1, setShapeSketch1] = React.useState<string | null>(value?.shapeSketch1 ?? null);
    const [shapeSketchPreview, setShapeSketchPreview] = React.useState<string | null>(null);
    const [shapeSketchPreview1, setShapeSketchPreview1] = React.useState<string | null>(null);
    const [signWidthM, setSignWidthM] = React.useState(value?.signWidthM ?? "");
    const [signHeightM, setSignHeightM] = React.useState(value?.signHeightM ?? "");
    const [signSides, setSignSides] = React.useState(value?.signSides ?? "");

    const [signAreaMore, setSignAreaMore] = React.useState(value?.signAreaMore ?? ""); // เช่น "25" หรือ "50"
    const [structureHeightMore, setStructureHeightMore] = React.useState(value?.structureHeightMore ?? ""); // เช่น "15"

    const [photosFront, setPhotosFront] = React.useState<string | null>(value?.photosFront ?? null);
    const [photosFrontPreview, setPhotosFrontPreview] = React.useState<string | null>(null);
    const [photosSide, setPhotosSide] = React.useState<string | null>(value?.photosSide ?? null);
    const [photosSidePreview, setPhotosSidePreview] = React.useState<string | null>(null);
    const [photosBase, setPhotosBase] = React.useState<string | null>(value?.photosBase ?? null);
    const [photosBasePreview, setPhotosBasePreview] = React.useState<string | null>(null);
    const [photosFront1, setPhotosFront1] = React.useState<string | null>(value?.photosFront1 ?? null);
    const [photosFrontPreview1, setPhotosFrontPreview1] = React.useState<string | null>(null);
    const [photosSide1, setPhotosSide1] = React.useState<string | null>(value?.photosSide1 ?? null);
    const [photosSidePreview1, setPhotosSidePreview1] = React.useState<string | null>(null);
    const [photosBase1, setPhotosBase1] = React.useState<string | null>(value?.photosBase1 ?? null);
    const [photosBasePreview1, setPhotosBasePreview1] = React.useState<string | null>(null);
    const [recorder2, setRecorder2] = React.useState<string>(value?.recorder2 ?? "");
    const [recorder3, setRecorder3] = React.useState<string>(value?.recorder3 ?? "");

    // 5.2 ประเภทของป้าย
    const [typeGround, setTypeGround] = React.useState<boolean>(value?.typeGround ?? false);
    const [typeRooftop, setTypeRooftop] = React.useState<boolean>(value?.typeRooftop ?? false);
    const [typeOnRoof, setTypeOnRoof] = React.useState<boolean>(value?.typeOnRoof ?? false);
    const [typeOnBuilding, setTypeOnBuilding] = React.useState<boolean>(value?.typeOnBuilding ?? false);
    const [typeOtherChecked, setTypeOtherChecked] = React.useState<boolean>(value?.typeOtherChecked ?? false);
    const [typeOther, setTypeOther] = React.useState<string>(value?.typeOther ?? "");

    // 5.3 (จาก viewData — ไม่ส่งกลับ)
    const [productText, setProductText] = React.useState("");  // description
    const [ownerName, setOwnerName] = React.useState("");      // owner_name
    const [ownerNo, setOwnerNo] = React.useState("");          // owner_address_no
    const [ownerMoo, setOwnerMoo] = React.useState("");        // owner_moo
    const [ownerAlley, setOwnerAlley] = React.useState("");    // owner_alley
    const [ownerRoad, setOwnerRoad] = React.useState("");      // owner_road
    const [ownerSub, setOwnerSub] = React.useState("");        // owner_province_id
    const [ownerDist, setOwnerDist] = React.useState("");      // owner_district_id
    const [ownerProv, setOwnerProv] = React.useState("");      // owner_sub_district_id
    const [ownerZip, setOwnerZip] = React.useState("");        // owner_zipcode
    const [ownerTel, setOwnerTel] = React.useState("");        // owner_phone
    const [ownerFax, setOwnerFax] = React.useState("");        // owner_fax
    const [ownerEmail, setOwnerEmail] = React.useState("");    // owner_email
    const [designerName, setDesignerName] = React.useState(""); // designer_name
    const [designerLicense, setDesignerLicense] = React.useState(""); // designer_license_no

    // 5.4 วัสดุ/รายละเอียด
    const [matSteel, setMatSteel] = React.useState<boolean>(value?.matSteel ?? false);
    const [matWood, setMatWood] = React.useState<boolean>(value?.matWood ?? false);
    const [matStainless, setMatStainless] = React.useState<boolean>(value?.matStainless ?? false);
    const [matRCC, setMatRCC] = React.useState<boolean>(value?.matRCC ?? false);
    const [matOtherChecked, setMatOtherChecked] = React.useState<boolean>(value?.matOtherChecked ?? false);
    const [matOther, setMatOther] = React.useState<string>(value?.matOther ?? "");
    const [panelMaterial, setPanelMaterial] = React.useState<string>(value?.panelMaterial ?? "");
    const [panelFaces, setPanelFaces] = React.useState<string>(value?.panelFaces ?? "");
    const [panelOpenings, setPanelOpenings] = React.useState<"" | "มี" | "ไม่มี">(value?.panelOpenings ?? "");
    const [panelOther, setPanelOther] = React.useState<string>(value?.panelOther ?? "");
    const [chkMat, setChkMat] = React.useState<boolean>(value?.chkMat ?? false);
    const [chkFaces, setChkFaces] = React.useState<boolean>(value?.chkFaces ?? false);
    const [chkOpen, setChkOpen] = React.useState<boolean>(value?.chkOpen ?? false);
    const [chkOther, setChkOther] = React.useState<boolean>(value?.chkOther ?? false);

    const s = (v?: string | null) => (v && v.trim() !== "" ? v : "");
    const prevDataRef = React.useRef<string>("");

    React.useEffect(() => {
        if (!data) return;

        const dataStr = JSON.stringify(data);
        if (dataStr === prevDataRef.current) return;
        prevDataRef.current = dataStr;

        // ===== 5.1 ข้อมูลสถานที่ =====
        setSignName(s(data.signName));
        setAddrNo(s(data.addrNo));
        setAddrAlley(s(data.addrAlley));
        setAddrRoad(s(data.addrRoad));
        setSubDistrict(s(data.subDistrict));
        setDistrict(s(data.district));
        setProvince(s(data.province));
        setZip(s(data.zip));
        setTel(s(data.tel));
        setFax(s(data.fax));

        // ===== 5.1 ส่วนผู้ใช้กรอก =====
        setPermitDay(s(data.permitDay));
        setPermitMonth(s(data.permitMonth));
        setPermitYear(s(data.permitYear));

        setInspectDay2(s(data.inspectDay2));
        setInspectMonth2(s(data.inspectMonth2));
        setInspectYear2(s(data.inspectYear2));

        setInspectDay3(s(data.inspectDay3));
        setInspectMonth3(s(data.inspectMonth3));
        setInspectYear3(s(data.inspectYear3));

        setHasOriginalPlan(!!data.hasOriginalPlan);
        setNoOriginalPlan(!!data.noOriginalPlan);
        setNoPermitInfo(!!data.noPermitInfo);
        setNoOld(!!data.noOld);
        setSignAge(s(data.signAge));

        setMapSketch(s(data.mapSketch));
        setShapeSketch(s(data.shapeSketch));
        setPhotosFront(s(data.photosFront));
        setPhotosSide(s(data.photosSide));
        setPhotosBase(s(data.photosBase));
        setRecorder2(s(data.recorder2));
        setRecorder3(s(data.recorder3));

        // ===== 5.2 ประเภทของป้าย =====
        setTypeGround(!!data.typeGround);
        setTypeRooftop(!!data.typeRooftop);
        setTypeOnRoof(!!data.typeOnRoof);
        setTypeOnBuilding(!!data.typeOnBuilding);
        setTypeOtherChecked(!!data.typeOtherChecked);
        setTypeOther(s(data.typeOther));

        // ===== 5.3 เจ้าของป้าย / ผู้ออกแบบ =====
        setProductText(s(data.productText));
        setOwnerName(s(data.ownerName));
        setOwnerNo(s(data.ownerNo));
        setOwnerMoo(s(data.ownerMoo));
        setOwnerAlley(s(data.ownerAlley));
        setOwnerRoad(s(data.ownerRoad));
        setOwnerSub(s(data.ownerSub));
        setOwnerDist(s(data.ownerDist));
        setOwnerProv(s(data.ownerProv));
        setOwnerZip(s(data.ownerZip));
        setOwnerTel(s(data.ownerTel));
        setOwnerFax(s(data.ownerFax));
        setOwnerEmail(s(data.ownerEmail));
        setDesignerName(s(data.designerName));
        setDesignerLicense(s(data.designerLicense));

        // ===== 5.4 วัสดุ/รายละเอียด =====
        setMatSteel(!!data.matSteel);
        setMatWood(!!data.matWood);
        setMatStainless(!!data.matStainless);
        setMatRCC(!!data.matRCC);
        setMatOtherChecked(!!data.matOtherChecked);
        setMatOther(s(data.matOther));
        setPanelMaterial(s(data.panelMaterial));
        setPanelFaces(s(data.panelFaces));
        setPanelOpenings(data.panelOpenings ?? "");
        setPanelOther(s(data.panelOther));
        setChkMat(!!data.chkMat);
        setChkFaces(!!data.chkFaces);
        setChkOpen(!!data.chkOpen);
        setChkOther(!!data.chkOther);

        onChangeRef.current?.({
            ...data,
        });
    }, [data]);

    React.useEffect(() => {
        const patch: Partial<SectionTwoForm> = {
            permitDay, permitMonth, permitYear,
            inspectDay2, inspectMonth2, inspectYear2,
            inspectDay3, inspectMonth3, inspectYear3,
            hasOriginalPlan, noOriginalPlan, noPermitInfo, noOld,
            signAge,
            mapSketch, shapeSketch,
            photosFront, photosSide, photosBase,
            mapSketchPreview, shapeSketchPreview,
            photosFrontPreview, photosSidePreview, photosBasePreview,
            recorder2, recorder3,

            typeGround, typeRooftop, typeOnRoof, typeOnBuilding,
            typeOtherChecked, typeOther,

            matSteel, matWood, matStainless, matRCC,
            matOtherChecked, matOther,
            panelMaterial, panelFaces, panelOpenings, panelOther,
            chkMat, chkFaces, chkOpen, chkOther,
        };
        onChange?.(patch);
    }, [
        permitDay, permitMonth, permitYear,
        inspectDay2, inspectMonth2, inspectYear2,
        inspectDay3, inspectMonth3, inspectYear3,
        hasOriginalPlan, noOriginalPlan, noPermitInfo, noOld,
        signAge,
        mapSketch, shapeSketch,
        photosFront, photosSide, photosBase,
        mapSketchPreview, shapeSketchPreview,
        photosFrontPreview, photosSidePreview, photosBasePreview,
        recorder2, recorder3,
        typeGround, typeRooftop, typeOnRoof, typeOnBuilding,
        typeOtherChecked, typeOther,
        matSteel, matWood, matStainless, matRCC,
        matOtherChecked, matOther,
        panelMaterial, panelFaces, panelOpenings, panelOther,
        chkMat, chkFaces, chkOpen, chkOther,
        onChange,
    ]);

    React.useEffect(() => {
        let canceled = false;

        // helper: preload ให้แน่ใจว่าไฟล์มีอยู่จริงก่อนเซ็ต src
        const preload = (url: string) =>
            new Promise<boolean>((resolve) => {
                const img = new Image();
                img.onload = () => resolve(true);
                img.onerror = () => resolve(false);
                img.src = url;
            });

        // helper: ถ้าย้ายจาก blob → remote ให้ revoke blob เดิม
        const setPreviewSafely = (
            currentPreview: string | null,
            nextSrc: string | null,
            setter: (v: string | null) => void
        ) => {
            if (currentPreview && currentPreview.startsWith("blob:") && currentPreview !== nextSrc) {
                URL.revokeObjectURL(currentPreview);
            }
            setter(nextSrc);
        };

        // อัปเดตรูปทีละฟิลด์
        const updateOne = async (
            filename: string | null | undefined,
            currentPreview: string | null,
            setter: (v: string | null) => void
        ) => {
            // ถ้ากำลังแสดง blob ของไฟล์ที่ผู้ใช้เพิ่งเลือก → อย่าทับ
            if (currentPreview && currentPreview.startsWith("blob:")) return;

            if (!filename) {
                setPreviewSafely(currentPreview, null, setter);
                return;
            }

            const remoteUrl = buildRemoteImgUrl(filename);
            const ok = await preload(remoteUrl);
            if (!canceled) {
                setPreviewSafely(currentPreview, ok ? remoteUrl : null, setter);
            }
        };

        // ถ้าทั้ง 5 ฟิลด์ว่างหมด = ไม่ต้องโหลด
        const allEmpty =
            !mapSketch && !shapeSketch && !photosFront && !photosSide && !photosBase;

        if (allEmpty) {
            // เคลียร์เฉพาะพรีวิวที่ไม่ใช่ blob
            if (!mapSketchPreview?.startsWith("blob:")) setMapSketchPreview(null);
            if (!shapeSketchPreview?.startsWith("blob:")) setShapeSketchPreview(null);
            if (!photosFrontPreview?.startsWith("blob:")) setPhotosFrontPreview(null);
            if (!photosSidePreview?.startsWith("blob:")) setPhotosSidePreview(null);
            if (!photosBasePreview?.startsWith("blob:")) setPhotosBasePreview(null);
            return;
        }

        Promise.all([
            updateOne(mapSketch, mapSketchPreview, setMapSketchPreview),
            updateOne(shapeSketch, shapeSketchPreview, setShapeSketchPreview),
            updateOne(photosFront, photosFrontPreview, setPhotosFrontPreview),
            updateOne(photosSide, photosSidePreview, setPhotosSidePreview),
            updateOne(photosBase, photosBasePreview, setPhotosBasePreview),
        ])
            .catch(() => { }) // ไม่ให้ล้ม useEffect
            .finally(() => {
                if (!canceled) showLoading(false);
            });

        return () => {
            canceled = true;
        };
        // ให้ effect ทำงานเมื่อชื่อไฟล์เปลี่ยน หรือพรีวิว (กรณีเป็น blob) เปลี่ยน
    }, [
        mapSketch, shapeSketch, photosFront, photosSide, photosBase,
        mapSketchPreview, shapeSketchPreview, photosFrontPreview, photosSidePreview, photosBasePreview,
    ]);

    const handlePickImage = (
        fileOrUrl: File | string | null,
        prefix: string,
        setPreview: (v: string | null) => void,
        setFileName: (v: string | null) => void,
        fieldKey: keyof SectionTwoForm
    ) => {
        if (!fileOrUrl) {
            setPreview(null);
            setFileName(null);
            onChange?.({ ...value, [fieldKey]: null });
            return;
        }

        // ✅ ถ้าเป็น string ให้แยก 2 กรณี
        if (typeof fileOrUrl === "string") {
            // 👉 กรณี blob URL จาก input (string เริ่มด้วย blob:)
            if (fileOrUrl.startsWith("blob:")) {
                setPreview(fileOrUrl);

                const now = new Date();
                const dd = String(now.getDate()).padStart(2, "0");
                const mm = String(now.getMonth() + 1).padStart(2, "0");
                const yyyy = String(now.getFullYear());
                const hh = String(now.getHours()).padStart(2, "0");
                const mi = String(now.getMinutes()).padStart(2, "0");
                const ss = String(now.getSeconds()).padStart(2, "0");
                const newFileName = `${prefix}_${dd}${mm}${yyyy}_${hh}${mi}${ss}.jpg`;

                setFileName(newFileName);
                onChange?.({ ...value, [fieldKey]: newFileName });
                return;
            }

            // 👉 ถ้าไม่ใช่ blob แปลว่าเป็นไฟล์เดิมในระบบ
            setPreview(`/uploads/${fileOrUrl}`);
            setFileName(fileOrUrl);
            onChange?.({ ...value, [fieldKey]: fileOrUrl });
            return;
        }

        // ✅ ถ้าเป็น File ใหม่ (upload จริง ๆ)
        const file = fileOrUrl;
        const blobUrl = URL.createObjectURL(file);
        setPreview(blobUrl);

        const now = new Date();
        const dd = String(now.getDate()).padStart(2, "0");
        const mm = String(now.getMonth() + 1).padStart(2, "0");
        const yyyy = String(now.getFullYear());
        const hh = String(now.getHours()).padStart(2, "0");
        const mi = String(now.getMinutes()).padStart(2, "0");
        const ss = String(now.getSeconds()).padStart(2, "0");
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";

        const newFileName = `${prefix}_${dd}${mm}${yyyy}_${hh}${mi}${ss}.${ext}`;
        setFileName(newFileName);

        onChange?.({
            ...value,
            [fieldKey]: newFileName,
        });
    };

    const handlePickGallery = (
        v: string[] | string | null | undefined,
        prefix: string,
        setPreview: (url: string | null) => void,
        setFileName: (name: string | null) => void,
        fieldKey: keyof SectionTwoForm
    ) => {
        const picked = Array.isArray(v) ? v[0] ?? null : v ?? null;

        // ถ้าไม่เลือกภาพ
        if (!picked) {
            setPreview(null);
            setFileName(null);
            onChange?.({ ...value, [fieldKey]: null });
            return;
        }

        // ถ้าเป็น blob URL จากการอัปโหลดใหม่
        if (picked.startsWith("blob:")) {
            setPreview(picked); // เอาไว้แสดงในหน้า

            // สร้างชื่อไฟล์จริง
            const now = new Date();
            const dd = String(now.getDate()).padStart(2, "0");
            const mm = String(now.getMonth() + 1).padStart(2, "0");
            const yyyy = String(now.getFullYear());
            const hh = String(now.getHours()).padStart(2, "0");
            const mi = String(now.getMinutes()).padStart(2, "0");
            const ss = String(now.getSeconds()).padStart(2, "0");
            const newFileName = `${prefix}_${dd}${mm}${yyyy}_${hh}${mi}${ss}.jpg`;

            setFileName(newFileName);
            onChange?.({ ...value, [fieldKey]: newFileName });
        } else {
            // ถ้าเป็นชื่อไฟล์หรือ path เดิมจาก DB
            setPreview(`/uploads/${picked}`);
            setFileName(picked);
            onChange?.({ ...value, [fieldKey]: picked });
        }
    };

    return (
        <div className="text-black leading-7 space-y-8 p-2">
            <p className="text-sm text-gray-700">
                ส่วนที่ 2 เป็นข้อมูลทั่วไปของป้ายที่ผู้ตรวจสอบต้องลงบันทึกในหัวข้อต่าง ๆ และอาจเพิ่มเติมได้เพื่อให้ข้อมูลสมบูรณ์ยิ่งขึ้น ในบางรายการจะต้องประสานงานกับเจ้าของและผู้ดูแลป้ายเพื่อให้ได้ข้อมูลเหล่านั้น รายการใดที่ไม่สามารถหาข้อมูลได้ให้เว้นว่าง หรือแจ้งหมายเหตุไว้
            </p>

            {/* 5.1 ข้อมูลป้ายและสถานที่ตั้งป้าย */}
            <section className="space-y-4">
                <h3 className="text-lg font-semibold">1. ข้อมูลป้ายและสถานที่ตั้งป้าย</h3>

                <div className="grid md:grid-cols-4 gap-3">
                    {/* แถว 1 */}
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">ชื่อป้าย (ถ้ามี)</label>
                        <input
                            className="w-full border rounded-md px-3 py-2"
                            value={signName}
                            onChange={(e) => setSignName(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">เลขที่</label>
                        <input
                            className="w-full border rounded-md px-3 py-2"
                            value={addrNo}
                            onChange={(e) => setAddrNo(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">ตรอก/ซอย</label>
                        <input
                            className="w-full border rounded-md px-3 py-2"
                            value={addrAlley}
                            onChange={(e) => setAddrAlley(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">ถนน</label>
                        <input
                            className="w-full border rounded-md px-3 py-2"
                            value={addrRoad}
                            onChange={(e) => setAddrRoad(e.target.value)}
                        />
                    </div>

                    {/* แถว 2 */}
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">ตำบล/แขวง</label>
                        <input
                            className="w-full border rounded-md px-3 py-2"
                            value={subDistrict}
                            onChange={(e) => setSubDistrict(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">อำเภอ/เขต</label>
                        <input
                            className="w-full border rounded-md px-3 py-2"
                            value={district}
                            onChange={(e) => setDistrict(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">จังหวัด</label>
                        <input
                            className="w-full border rounded-md px-3 py-2"
                            value={province}
                            onChange={(e) => setProvince(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">รหัสไปรษณีย์</label>
                        <input
                            className="w-full border rounded-md px-3 py-2"
                            value={zip}
                            onChange={(e) => setZip(e.target.value)}
                        />
                    </div>

                    {/* แถว 3 (2 ช่อง + เว้นว่าง 2 ช่อง) */}
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">โทรศัพท์</label>
                        <input
                            className="w-full border rounded-md px-3 py-2"
                            value={tel}
                            onChange={(e) => setTel(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">โทรสาร</label>
                        <input
                            className="w-full border rounded-md px-3 py-2"
                            value={fax}
                            onChange={(e) => setFax(e.target.value)}
                        />
                    </div>
                    <div></div> {/* ช่องว่าง */}
                    <div></div> {/* ช่องว่าง */}
                </div>

                {/* === กล่องข้อมูลใบอนุญาต + เงื่อนไข === */}
                <div className="rounded-md border border-gray-300 p-4 text-gray-800">
                    {/* บรรทัดหัวข้อความยาว */}
                    <label className="flex items-start gap-2 text-sm leading-relaxed">
                        <input
                            type="checkbox"
                            className="h-4 w-4 mt-0.5"
                            checked={hasPermitInfo}
                            onChange={(e) => {
                                const checked = e.target.checked;
                                setHasPermitInfo(checked);

                                // กันข้อมูลชนกัน (มีข้อมูล vs ไม่มีข้อมูล)
                                if (checked) setNoPermitInfo(false);

                                // ถ้าเอาติ๊กออก ให้ล้างวันที่
                                if (!checked) {
                                    setPermitDay("");
                                    setPermitMonth("");
                                    setPermitYear("");
                                }
                            }}
                        />

                        <span>
                            มีข้อมูลการได้รับใบอนุญาตก่อสร้างจากเจ้าพนักงานท้องถิ่น ได้รับใบอนุญาตก่อสร้างจากเจ้าพนักงานท้องถิ่น
                            <span className="ml-1">เมื่อวันที่</span>

                            <select
                                className={`mx-2 w-12 bg-transparent border-0 border-b border-dashed text-center cursor-pointer
        focus:outline-none focus:ring-0
        ${hasPermitInfo ? "border-gray-400" : "border-gray-200 text-gray-400 cursor-not-allowed"}`}
                                value={permitDay || ""}
                                disabled={!hasPermitInfo}
                                onChange={(e) => setPermitDay(e.target.value)}
                            >
                                <option value="" disabled></option>
                                {Array.from({ length: getDaysInMonthThai(permitYear, permitMonth) }, (_, i) => {
                                    const d = String(i + 1);
                                    return (
                                        <option key={d} value={d}>
                                            {d}
                                        </option>
                                    );
                                })}
                            </select>

                            <span>เดือน</span>

                            <select
                                className={`mx-2 w-36 bg-transparent border-0 border-b border-dashed text-center cursor-pointer
        focus:outline-none focus:ring-0
        ${hasPermitInfo ? "border-gray-400" : "border-gray-200 text-gray-400 cursor-not-allowed"}`}
                                value={permitMonth || ""}
                                disabled={!hasPermitInfo}
                                onChange={(e) => {
                                    const newMonth = e.target.value;
                                    const maxDay = getDaysInMonthThai(permitYear, newMonth);
                                    if (permitDay && Number(permitDay) > maxDay) setPermitDay(String(maxDay));
                                    setPermitMonth(newMonth);
                                }}
                            >
                                <option value=""></option>
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
        ${hasPermitInfo ? "border-gray-400" : "border-gray-200 text-gray-400 cursor-not-allowed"}`}
                                value={permitYear || ""}
                                disabled={!hasPermitInfo}
                                onChange={(e) => {
                                    const newYear = e.target.value;
                                    const maxDay = getDaysInMonthThai(newYear, permitMonth);
                                    if (permitDay && Number(permitDay) > maxDay) setPermitDay(String(maxDay));
                                    setPermitYear(newYear);
                                }}
                            >
                                <option value="" disabled></option>
                                {YEARS.map((y) => (
                                    <option key={y} value={y}>
                                        {y}
                                    </option>
                                ))}
                            </select>
                        </span>
                    </label>

                    {/* เช็กบ็อกซ์เรียงลงมา */}
                    <div className="mt-3 space-y-2 text-sm">
                        <label className="flex items-start gap-2">
                            <input
                                type="checkbox"
                                className="h-4 w-4"
                                checked={hasOriginalPlan}
                                onChange={(e) => setHasOriginalPlan(e.target.checked)}
                            />
                            <span>มีแบบแปลนเดิม</span>
                        </label>

                        <label className="flex items-start gap-2 leading-relaxed">
                            <input
                                type="checkbox"
                                className="h-4 w-4"
                                checked={noOriginalPlan}
                                onChange={(e) => setNoOriginalPlan(e.target.checked)}
                            />
                            <span>
                                ไม่มีแบบแปลนเดิม (กรณีที่ไม่มีแบบแปลนหรือแผนผังรายการเกี่ยวกับการก่อสร้าง ให้เจ้าของป้ายจัดหา
                                หรือจัดทำแบบแปลนสำหรับใช้ในการตรวจสอบป้ายและอุปกรณ์ประกอบของป้ายให้กับผู้ตรวจสอบอาคาร)
                            </span>
                        </label>

                        <label className="flex items-start gap-2">
                            <input
                                type="checkbox"
                                className="h-4 w-4"
                                checked={noPermitInfo}
                                onChange={(e) => setNoPermitInfo(e.target.checked)}
                            />
                            <span>ไม่มีข้อมูลการได้รับใบอนุญาตก่อสร้างจากเจ้าพนักงานท้องถิ่น</span>
                        </label>

                        {/* อายุของป้าย (เส้นปะ) */}
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                className="h-4 w-4"
                                checked={noOld}
                                onChange={(e) => {
                                    const v = e.target.checked;
                                    setNoOld(v);
                                    if (!v) {
                                        setSignAge("");
                                        setSignYear("");
                                    }
                                }}
                            />

                            <span>ไม่มีข้อมูลการได้รับใบอนุญาตก่อสร้างจากเจ้าพนักงานท้องถิ่น อายุของป้าย</span>

                            <input
                                type="text"
                                inputMode="numeric"
                                className={`w-20 bg-transparent border-0 border-b border-dashed text-center
      focus:outline-none focus:ring-0
      ${noOld ? "border-gray-400" : "border-gray-200 text-gray-400"}`}
                                value={signAge}
                                onChange={(e) => setSignAge(e.target.value.replace(/\D/g, ""))}
                                disabled={!noOld}
                            />

                            <span>ปี (ก่อสร้างประมาณปี พ.ศ.</span>

                            <select
                                className={`w-16 bg-transparent border-0 border-b border-dashed text-center cursor-pointer
      focus:outline-none focus:ring-0
      ${noOld ? "border-gray-400" : "border-gray-200 text-gray-400 cursor-not-allowed"}`}
                                value={signYear || ""}
                                disabled={!noOld}
                                onChange={(e) => setSignYear(e.target.value)}
                            >
                                <option value="" disabled></option>
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
                                checked={noPermitInfo2}
                                onChange={(e) => setNoPermitInfo2(e.target.checked)}
                            />
                            <span>ป้ายไม่เข้าข่ายต้องขออนุญาตก่อสร้าง **</span>
                        </label>
                    </div>
                </div>

                <ImageField
                    label="แผนที่แสดงตำแหน่งที่ตั้งของป้ายโดยสังเขป"
                    value={mapSketchPreview} // ← ใช้ preview blob หรือ URL จริง
                    onChange={(f) =>
                        handlePickImage(f, "map", setMapSketchPreview, setMapSketch, "mapSketch")
                    }
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
                            value={latitude}
                            onChange={(e) => {
                                // อนุญาตเฉพาะตัวเลข, จุด, ลบ
                                const v = e.target.value.replace(/[^\d.\-]/g, "");
                                setLatitude(v);
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
                            value={longitude}
                            onChange={(e) => {
                                const v = e.target.value.replace(/[^\d.\-]/g, "");
                                setLongitude(v);
                            }}
                        />
                    </div>
                </div>

                <ImageField
                    label="แผนผังตำแหน่งที่ตั้งของป้ายโดยสังเขป"
                    value={mapSketchPreview1} // ← ใช้ preview blob หรือ URL จริง
                    onChange={(f) =>
                        handlePickImage(f, "map1", setMapSketchPreview1, setMapSketch1, "mapSketch1")
                    }
                    hint="อัปโหลดภาพแผนที่โดยสังเขป"
                />
            </section>

            <section className="space-y-4">
                <div className="sm:grid-cols-2 gap-3 flex flex-col">
                    <div className="flex items-center gap-2 text-sm">
                        <span>วัน/เดือน/ปี ที่ตรวจสอบ</span>

                        {/* วัน */}
                        <select
                            className="w-10 bg-transparent border-0 border-b border-dashed border-gray-400
               focus:outline-none focus:ring-0 text-center cursor-pointer"
                            value={inspectDay3 || ""}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setInspectDay3(e.target.value)}
                        >
                            <option value="" disabled></option>
                            {Array.from({ length: getDaysInMonthThai(inspectYear3, inspectMonth3) }, (_, i) => {
                                const d = String(i + 1);
                                return <option key={d} value={d}>{d}</option>;
                            })}
                        </select>

                        <span>เดือน</span>

                        {/* เดือน */}
                        <select
                            className="w-28 bg-transparent border-0 border-b border-dashed border-gray-400
               focus:outline-none focus:ring-0 text-center cursor-pointer"
                            value={inspectMonth3 || ""}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                const newMonth = e.target.value as typeof THAI_MONTHS[number] | "";
                                const maxDay = getDaysInMonthThai(inspectYear3, newMonth);
                                if (inspectDay3 && Number(inspectDay3) > maxDay) setInspectDay3(String(maxDay));
                                setInspectMonth3(newMonth);
                            }}
                        >
                            <option value="" disabled></option>
                            {THAI_MONTHS.map((m) => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>

                        <span>พ.ศ.</span>

                        {/* ปี */}
                        <select
                            className="w-16 bg-transparent border-0 border-b border-dashed border-gray-400
               focus:outline-none focus:ring-0 text-center cursor-pointer"
                            value={inspectYear3 || ""}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                const newYear = e.target.value;
                                const maxDay = getDaysInMonthThai(newYear, inspectMonth3);
                                if (inspectDay3 && Number(inspectDay3) > maxDay) setInspectDay3(String(maxDay));
                                setInspectYear3(newYear);
                            }}
                        >
                            <option value="" disabled></option>
                            {YEARS.map((y) => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>

                        <span>บันทึกโดย</span>
                        <input
                            type="text"
                            className="flex-1 bg-transparent border-0 border-b border-dashed border-gray-400
               focus:outline-none focus:ring-0 px-2"
                            value={recorder3}
                            onChange={(e) => setRecorder3(e.target.value)}
                        />
                    </div>

                    <ImageField
                        label="รูปถ่ายป้ายในวันเวลาที่ตรวจสอบ"
                        value={shapeSketchPreview1}
                        onChange={(f) =>
                            handlePickImage(f, "shape1", setShapeSketchPreview1, setShapeSketch1, "shapeSketch1")
                        }
                        square
                    />

                    <ImageField
                        label="รูปแบบและขนาดของแผ่นป้าย และสิ่งที่สร้างขึ้นสำหรับติดตั้งป้ายโดยสังเขป"
                        value={shapeSketchPreview}
                        onChange={(f) =>
                            handlePickImage(f, "shape", setShapeSketchPreview, setShapeSketch, "shapeSketch")
                        }
                        square
                    />

                    <div className="mt-3 relative rounded-md p-4 text-gray-900">
                        <div className="text-xl font-bold mb-2">
                            ข้อมูลขนาดของป้าย และสิ่งที่สร้างขึ้นสำหรับติดหรือขึงป้าย
                        </div>

                        {/* เนื้อหาฝั่งซ้าย */}
                        <div className="space-y-2 text-lg leading-relaxed">
                            <div className="flex items-end gap-2">
                                <span>ความกว้างของแผ่นป้าย</span>
                                <input
                                    className="w-24 bg-transparent border-0 border-b border-dashed border-black/70 text-center
                   focus:outline-none focus:ring-0"
                                    value={signWidthM}
                                    inputMode="decimal"
                                    onChange={(e) => setSignWidthM(e.target.value.replace(/[^\d.\-]/g, ""))}
                                />
                                <span>เมตร</span>
                            </div>

                            <div className="flex items-end gap-2">
                                <span>ความสูงของแผ่นป้าย</span>
                                <input
                                    className="w-24 bg-transparent border-0 border-b border-dashed border-black/70 text-center
                   focus:outline-none focus:ring-0"
                                    value={signHeightM}
                                    inputMode="decimal"
                                    onChange={(e) => setSignHeightM(e.target.value.replace(/[^\d.\-]/g, ""))}
                                />
                                <span>เมตร</span>
                            </div>

                            <div className="flex items-end gap-2">
                                <span>จำนวนด้านของป้าย</span>
                                <input
                                    className="w-20 bg-transparent border-0 border-b border-dashed border-black/70 text-center
                   focus:outline-none focus:ring-0"
                                    value={signSides}
                                    inputMode="numeric"
                                    onChange={(e) => setSignSides(e.target.value.replace(/\D/g, ""))}
                                />
                                <span>ด้าน</span>
                            </div>

                            {/* แถวที่มีเส้นใต้สีแดง (ตามภาพ) */}
                            <div id="anchor-area" className="flex items-end gap-2">
                                <span>พื้นที่ป้าย โดยประมาณ</span>

                                <select
                                    className="bg-transparent border-0 border-b-2 border-red-600 text-red-600 font-bold
                   focus:outline-none focus:ring-0 cursor-pointer"
                                    value={signAreaMore}
                                    onChange={(e) => setSignAreaMore(e.target.value)}
                                >
                                    <option value=""></option>
                                    <option value="25">มากกว่า 25</option>
                                    <option value="50">มากกว่า 50</option>
                                </select>

                                <span>ตารางเมตร</span>
                            </div>

                            <div id="anchor-height" className="flex items-end gap-2">
                                <span>ความสูงของโครงสร้างสำหรับติดตั้งแผ่นป้าย</span>

                                <select
                                    className="bg-transparent border-0 border-b-2 border-red-600 text-red-600 font-bold
                   focus:outline-none focus:ring-0 cursor-pointer"
                                    value={structureHeightMore}
                                    onChange={(e) => setStructureHeightMore(e.target.value)}
                                >
                                    <option value=""></option>
                                    <option value="15">มากกว่า 15</option>
                                </select>

                                <span>เมตร</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="space-y-4">
                <div className="grid md:grid-cols-3 gap-6">
                    <ImageGallery
                        label="รูปที่ 1"
                        values={photosFrontPreview ? [photosFrontPreview] : []}
                        onChange={(v) =>
                            handlePickGallery(v, "front", setPhotosFrontPreview, setPhotosFront, "photosFront")
                        }
                        single
                    />

                    <ImageGallery
                        label="รูปที่ 2"
                        values={photosSidePreview ? [photosSidePreview] : []}
                        onChange={(v) =>
                            handlePickGallery(v, "side", setPhotosSidePreview, setPhotosSide, "photosSide")
                        }
                        single
                    />

                    <ImageGallery
                        label="รูปที่ 3"
                        values={photosBasePreview ? [photosBasePreview] : []}
                        onChange={(v) =>
                            handlePickGallery(v, "base", setPhotosBasePreview, setPhotosBase, "photosBase")
                        }
                        single
                    />
                </div>
            </section>

            <section className="space-y-4">
                <div className="grid md:grid-cols-3 gap-6">
                    <ImageGallery
                        label="รูปที่ 4"
                        values={photosFrontPreview1 ? [photosFrontPreview1] : []}
                        onChange={(v) =>
                            handlePickGallery(v, "front1", setPhotosFrontPreview1, setPhotosFront1, "photosFront1")
                        }
                        single
                    />

                    <ImageGallery
                        label="รูปที่ 5"
                        values={photosSidePreview1 ? [photosSidePreview1] : []}
                        onChange={(v) =>
                            handlePickGallery(v, "side1", setPhotosSidePreview1, setPhotosSide1, "photosSide1")
                        }
                        single
                    />

                    <ImageGallery
                        label="รูปที่ 6"
                        values={photosBasePreview1 ? [photosBasePreview1] : []}
                        onChange={(v) =>
                            handlePickGallery(v, "base1", setPhotosBasePreview1, setPhotosBase1, "photosBase1")
                        }
                        single
                    />
                </div>
            </section>

            {/* 5.2 ประเภทของป้าย */}
            <section className="space-y-3">
                <h3 className="text-lg font-semibold">2. ประเภทของป้าย</h3>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2">
                    <label className="inline-flex items-center gap-2">
                        <input type="checkbox" checked={typeGround} onChange={(e) => setTypeGround(e.target.checked)} />
                        ป้ายที่ติดตั้งบนพื้นดิน
                    </label>
                    <label className="inline-flex items-center gap-2">
                        <input type="checkbox" checked={typeRooftop} onChange={(e) => setTypeRooftop(e.target.checked)} />
                        ป้ายบนดาดฟ้าอาคาร
                    </label>
                    <label className="inline-flex items-center gap-2">
                        <input type="checkbox" checked={typeOnRoof} onChange={(e) => setTypeOnRoof(e.target.checked)} />
                        ป้ายบนหลังคา
                    </label>
                    <label className="inline-flex items-center gap-2">
                        <input type="checkbox" checked={typeOnBuilding} onChange={(e) => setTypeOnBuilding(e.target.checked)} />
                        ป้ายบนส่วนหนึ่งส่วนใดของอาคาร
                    </label>
                    <div className="flex items-center gap-2">
                        <input
                            id="typeOther"
                            type="checkbox"
                            checked={typeOtherChecked}
                            onChange={(e) => {
                                const v = e.target.checked;
                                setTypeOtherChecked(v);
                                if (!v) setTypeOther(""); // เอาติ๊กออก → เคลียร์ค่า
                            }}
                        />
                        <label htmlFor="typeOther" className="select-none">อื่นๆ (โปรดระบุ)</label>

                        <input
                            type="text"
                            className={`flex-1 bg-transparent border-0 border-b border-dashed
                focus:outline-none focus:ring-0 px-1
                ${typeOtherChecked ? 'border-gray-400' : 'border-gray-200 text-gray-400'}`}
                            value={typeOther}
                            onChange={(e) => setTypeOther(e.target.value)}
                            disabled={!typeOtherChecked}
                        />
                    </div>
                </div>
            </section>

            {/* 5.3 เจ้าของป้าย / ผู้ออกแบบ */}
            <section className="space-y-4">
                <h3 className="text-lg font-semibold">3. ชื่อเจ้าของหรือผู้ครอบครองป้าย และผู้ออกแบบด้านวิศวกรรมโครงสร้าง</h3>

                <div>
                    <label className="block text-sm text-gray-600 mb-1">5.3.1 ชื่อผลิตภัณฑ์โฆษณาหรือข้อความในป้าย</label>
                    <textarea
                        rows={3}
                        className="w-full border rounded-md px-3 py-2"
                        value={productText}
                        onChange={(e) => setProductText(e.target.value)}
                    />
                </div>

                <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-800">5.3.2 เจ้าของหรือผู้ครอบครองป้าย</div>
                    <div className="grid md:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">ชื่อ</label>
                            <input className="w-full border rounded-md px-3 py-2" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">เลขที่</label>
                                <input className="w-full border rounded-md px-3 py-2" value={ownerNo} onChange={(e) => setOwnerNo(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">หมู่ที่</label>
                                <input className="w-full border rounded-md px-3 py-2" value={ownerMoo} onChange={(e) => setOwnerMoo(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">ตรอก/ซอย</label>
                                <input className="w-full border rounded-md px-3 py-2" value={ownerAlley} onChange={(e) => setOwnerAlley(e.target.value)} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">ถนน</label>
                            <input className="w-full border rounded-md px-3 py-2" value={ownerRoad} onChange={(e) => setOwnerRoad(e.target.value)} />
                        </div>
                        <div className="grid md:grid-cols-3 gap-2">
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">ตำบล/แขวง</label>
                                <input className="w-full border rounded-md px-3 py-2" value={ownerSub} onChange={(e) => setOwnerSub(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">อำเภอ/เขต</label>
                                <input className="w-full border rounded-md px-3 py-2" value={ownerDist} onChange={(e) => setOwnerDist(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">จังหวัด</label>
                                <input className="w-full border rounded-md px-3 py-2" value={ownerProv} onChange={(e) => setOwnerProv(e.target.value)} />
                            </div>
                        </div>
                        <div className="grid md:grid-cols-3 gap-2">
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">รหัสไปรษณีย์</label>
                                <input className="w-full border rounded-md px-3 py-2" value={ownerZip} onChange={(e) => setOwnerZip(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">โทรศัพท์</label>
                                <input className="w-full border rounded-md px-3 py-2" value={ownerTel} onChange={(e) => setOwnerTel(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">โทรสาร</label>
                                <input className="w-full border rounded-md px-3 py-2" value={ownerFax} onChange={(e) => setOwnerFax(e.target.value)} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">อีเมล</label>
                            <input className="w-full border rounded-md px-3 py-2" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} />
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">5.3.3 ผู้ออกแบบด้านวิศวกรรมโครงสร้าง (ชื่อ)</label>
                        <input className="w-full border rounded-md px-3 py-2" value={designerName} onChange={(e) => setDesignerName(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">ใบอนุญาตทะเบียนเลขที่</label>
                        <input className="w-full border rounded-md px-3 py-2" value={designerLicense} onChange={(e) => setDesignerLicense(e.target.value)} />
                    </div>
                </div>
            </section>

            {/* 5.4 ประเภทวัสดุ/รายละเอียดแผ่นป้าย */}
            <section className="space-y-4">
                <h3 className="text-lg font-semibold">4. ประเภทของวัสดุและรายละเอียดของแผ่นป้าย (สามารถระบุมากกว่า 1 ข้อได้)</h3>

                <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-800">4.1 ประเภทวัสดุของสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย</div>
                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2">
                        <label className="inline-flex items-center gap-2">
                            <input type="checkbox" checked={matSteel} onChange={(e) => setMatSteel(e.target.checked)} />
                            เหล็กโครงสร้างรูปพรรณ
                        </label>
                        <label className="inline-flex items-center gap-2">
                            <input type="checkbox" checked={matWood} onChange={(e) => setMatWood(e.target.checked)} />
                            ไม้
                        </label>
                        <label className="inline-flex items-center gap-2">
                            <input type="checkbox" checked={matStainless} onChange={(e) => setMatStainless(e.target.checked)} />
                            สเตนเลส
                        </label>
                        <label className="inline-flex items-center gap-2">
                            <input type="checkbox" checked={matRCC} onChange={(e) => setMatRCC(e.target.checked)} />
                            คอนกรีตเสริมเหล็ก
                        </label>
                        <div className="flex items-center gap-2 sm:col-span-2">
                            <input
                                id="matOther"
                                type="checkbox"
                                checked={matOtherChecked}
                                onChange={(e) => {
                                    const v = e.target.checked;
                                    setMatOtherChecked(v);
                                    if (!v) setMatOther(""); // เอาติ๊กออก → เคลียร์ค่า
                                }}
                            />
                            <label htmlFor="matOther" className="select-none">อื่น ๆ</label>

                            <input
                                type="text"
                                placeholder="โปรดระบุ"
                                className={`flex-1 bg-transparent border-0 border-b border-dashed px-1
                focus:outline-none focus:ring-0
                ${matOtherChecked ? 'border-gray-400'
                                        : 'border-gray-200 text-gray-400'}`}
                                value={matOther}
                                onChange={(e) => setMatOther(e.target.value)}
                                disabled={!matOtherChecked}
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="text-sm font-medium text-gray-800">4.2 รายละเอียดของแผ่นป้าย</div>
                    <div className="space-y-2">
                        {/* วัสดุของป้าย */}
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={chkMat}
                                onChange={(e) => {
                                    const v = e.target.checked;
                                    setChkMat(v);
                                    if (!v) setPanelMaterial("");
                                }}
                            />
                            <span>วัสดุของป้าย (โปรดระบุ)</span>
                            <input
                                type="text"
                                placeholder=""
                                className={`flex-1 bg-transparent border-0 border-b border-dashed px-1
                  focus:outline-none focus:ring-0
                  ${chkMat ? "border-gray-400" : "border-gray-200 text-gray-400"}`}
                                value={panelMaterial}
                                onChange={(e) => setPanelMaterial(e.target.value)}
                                disabled={!chkMat}
                            />
                        </div>

                        {/* จำนวนด้านที่ติดป้าย */}
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={chkFaces}
                                onChange={(e) => {
                                    const v = e.target.checked;
                                    setChkFaces(v);
                                    if (!v) setPanelFaces("");
                                }}
                            />
                            <span>จำนวนด้านที่ติดป้าย ป้าย (โปรดระบุจำนวนด้าน)</span>
                            <input
                                type="text"
                                inputMode="numeric"
                                maxLength={2}
                                className={`w-16 text-center bg-transparent border-0 border-b border-dashed
                  focus:outline-none focus:ring-0
                  ${chkFaces ? "border-gray-400" : "border-gray-200 text-gray-400"}`}
                                value={panelFaces}
                                onChange={(e) => setPanelFaces(e.target.value.replace(/\D/g, ""))}
                                disabled={!chkFaces}
                            />
                            <span>ด้าน</span>
                        </div>

                        {/* การเจาะช่องเปิดในป้าย */}
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={chkOpen}
                                    onChange={(e) => {
                                        const v = e.target.checked;
                                        setChkOpen(v);
                                        if (!v) setPanelOpenings("");
                                    }}
                                />
                                <span>การเจาะช่องเปิดในป้าย</span>
                            </div>

                            {/* ทำเป็น checkbox คู่ (เลือกได้ทีละตัว โดยสลับกันเอง) */}
                            <label className="inline-flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    disabled={!chkOpen}
                                    checked={chkOpen && panelOpenings === "มี"}
                                    onChange={(e) =>
                                        setPanelOpenings(e.target.checked ? "มี" : "")
                                    }
                                />
                                มี
                            </label>
                            <label className="inline-flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    disabled={!chkOpen}
                                    checked={chkOpen && panelOpenings === "ไม่มี"}
                                    onChange={(e) =>
                                        setPanelOpenings(e.target.checked ? "ไม่มี" : "")
                                    }
                                />
                                ไม่มี
                            </label>
                        </div>

                        {/* อื่น ๆ */}
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={chkOther}
                                onChange={(e) => {
                                    const v = e.target.checked;
                                    setChkOther(v);
                                    if (!v) setPanelOther("");
                                }}
                            />
                            <span>อื่น ๆ (โปรดระบุ)</span>
                            <input
                                type="text"
                                className={`flex-1 bg-transparent border-0 border-b border-dashed px-1
                  focus:outline-none focus:ring-0
                  ${chkOther ? "border-gray-400" : "border-gray-200 text-gray-400"}`}
                                value={panelOther}
                                onChange={(e) => setPanelOther(e.target.value)}
                                disabled={!chkOther}
                            />
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
