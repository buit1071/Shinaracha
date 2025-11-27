import { showLoading } from "@/lib/loading";
import { showAlert } from "@/lib/fetcher";
import { buildRemoteUrl } from "@/utils/excelShared";
import expressionParser from "angular-expressions";
import type {
  Form8_1Data,
  Form8_1Plan,
  Form8_1General,
  Form8_1Photos,
  PhotoItem,
  Section3Item,
} from "@/components/check-form/forms/form1-8/form8-1/types";

type AnyObj = Record<string, any>;

// Custom parser for Docxtemplater that handles both:
// - Simple tags like {{12p1}}, {{reportYear}}
// - Nested tags like {{report.year}}, {{general.address}}
const angularParser = (tag: string) => {
  // Handle "." which means current scope
  if (tag === ".") {
    return { get: (s: any) => s };
  }
  
  // For simple tags (no dot), just do direct property access
  if (!tag.includes(".")) {
    return {
      get: (scope: any) => {
        return scope?.[tag] ?? "";
      },
    };
  }
  
  // For nested tags, use angular-expressions
  try {
    const expr = expressionParser.compile(tag.replace(/('|"|`)/g, "'"));
    return {
      get: (scope: any, context: any) => {
        let obj = {};
        const scopeList = context.scopeList;
        const num = context.num;
        for (let i = 0, len = num + 1; i < len; i++) {
          obj = { ...obj, ...scopeList[i] };
        }
        return expr(scope, obj) ?? "";
      },
    };
  } catch (e) {
    // Fallback: treat as simple property access
    return {
      get: (scope: any) => {
        const parts = tag.split(".");
        let val: any = scope;
        for (const p of parts) {
          val = val?.[p];
          if (val === undefined) return "";
        }
        return val ?? "";
      },
    };
  }
};

// Text to show in PPTX when no image is available (since template uses text placeholders, not image shapes)
const NO_PHOTO_TEXT = "(ไม่มีรูป)";

// Check if a string looks like a real image reference (URL or filename)
const isRealImage = (value: string): boolean => {
  if (!value || !value.trim()) return false;
  // Data URLs are placeholders, not real images
  if (value.startsWith("data:")) return false;
  // Full URLs (http/https)
  if (/^https?:\/\//i.test(value)) return true;
  // Looks like a filename with image extension
  if (/\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(value)) return true;
  // Has file extension and some content
  if (value.includes(".") && value.length > 3) return true;
  return false;
};

// Extract filename from URL or path
const extractFilename = (value: string): string => {
  if (!value) return "";
  // Remove query string
  const withoutQuery = value.split("?")[0];
  // Get last part of path
  const parts = withoutQuery.split("/");
  return parts[parts.length - 1] || value;
};

// Extract filename from photo item for image module
// Returns the actual filename/URL for image loading, or empty string if no image
const toPhotoFilename = (p?: PhotoItem | string | null | unknown, fallbackText = ""): string => {
  if (!p) return fallbackText;
  
  // If it's a string directly (URL or filename)
  if (typeof p === "string") {
    if (isRealImage(p)) {
      return p; // Return the actual filename/URL
    }
    return fallbackText;
  }
  
  // If it's an object, try multiple possible keys
  const obj = p as Record<string, unknown>;
  const candidates = [obj.url, obj.src, obj.path, obj.filename, obj.name];
  
  for (const val of candidates) {
    if (typeof val === "string" && isRealImage(val)) {
      return val; // Return the actual filename/URL
    }
  }
  
  return fallbackText;
};

// For display purposes (show filename in text placeholders)
const toPhotoText = (p?: PhotoItem | string | null | unknown, fallbackText = NO_PHOTO_TEXT): string => {
  const filename = toPhotoFilename(p);
  if (filename) {
    return extractFilename(filename);
  }
  return fallbackText;
};

const mapPhotos = (photos?: Form8_1Photos) => {
  const p = photos || {};
  // Debug: log raw photos structure
  console.log("[mapPhotos] Raw photos input:", JSON.stringify(p, null, 2));
  console.log("[mapPhotos] coverPhoto:", p.coverPhoto);
  console.log("[mapPhotos] signMainPhoto:", p.signMainPhoto);
  console.log("[mapPhotos] setAPhotos:", p.setAPhotos);
  
  // For text display (when not using image module)
  const textResult = {
    header: toPhotoText((p as AnyObj).headerImage),
    cover: toPhotoText(p.coverPhoto),
    signMain: toPhotoText(p.signMainPhoto, "(รอรูปหลัก)"),
    setA1: toPhotoText(p.setAPhotos?.[0]),
    setA2: toPhotoText(p.setAPhotos?.[1]),
    setB1: toPhotoText(p.setBPhotos?.[0]),
    setB2: toPhotoText(p.setBPhotos?.[1]),
    setB3: toPhotoText(p.setBPhotos?.[2]),
    setB4: toPhotoText(p.setBPhotos?.[3]),
    setB5: toPhotoText(p.setBPhotos?.[4]),
    setB6: toPhotoText(p.setBPhotos?.[5]),
  };
  
  return textResult;
};

// Map photos to filenames for image module (used with {%image} syntax)
const mapPhotoFilenames = (photos?: Form8_1Photos) => {
  const p = photos || {};
  return {
    headerImg: toPhotoFilename((p as AnyObj).headerImage),
    coverImg: toPhotoFilename(p.coverPhoto),
    signMainImg: toPhotoFilename(p.signMainPhoto),
    setA1Img: toPhotoFilename(p.setAPhotos?.[0]),
    setA2Img: toPhotoFilename(p.setAPhotos?.[1]),
    setB1Img: toPhotoFilename(p.setBPhotos?.[0]),
    setB2Img: toPhotoFilename(p.setBPhotos?.[1]),
    setB3Img: toPhotoFilename(p.setBPhotos?.[2]),
    setB4Img: toPhotoFilename(p.setBPhotos?.[3]),
    setB5Img: toPhotoFilename(p.setBPhotos?.[4]),
    setB6Img: toPhotoFilename(p.setBPhotos?.[5]),
  };
};

const mapGeneralShort = (g?: Form8_1General) => ({
  gNo: g?.addressNo ?? "",
  gMoo: g?.moo ?? "",
  gAlley: g?.alley ?? "",
  gRoad: g?.road ?? "",
  gSub: g?.subdistrict ?? "",
  gDist: g?.district ?? "",
  gProv: g?.province ?? "",
  gPost: g?.postalCode ?? "",
  gTel: g?.phoneNo ?? "",
  gFax: g?.fax ?? "",
});

const sortInspectItems = (items: Record<string, Section3Item> = {}) => {
  const arr = Object.values(items || {});
  return arr.sort((a, b) => {
    const na = Number(String(a?.key ?? "").replace(/[^\d]/g, "")) || 0;
    const nb = Number(String(b?.key ?? "").replace(/[^\d]/g, "")) || 0;
    return na - nb;
  });
};

const mapShortCheckboxes = (inspect: Form8_1Data["inspect"]) => {
  const rows = sortInspectItems(inspect?.items).slice(0, 4); // รองรับ 4 แถวแรกตามเทมเพลต
  const out: AnyObj = {};
  rows.forEach((r, idx) => {
    const i = idx + 1;
    out[`ch${i}`] = r?.hasChange ? "?" : " ";
    out[`nc${i}`] = r?.noChange ? "?" : " ";
    out[`note${i}`] = r?.note ?? r?.changeDetailNote ?? "";
    out[`ok${i}`] = r?.inspectorOpinion === "canUse" ? "?" : " ";
    out[`ng${i}`] = r?.inspectorOpinion === "cannotUse" ? "?" : " ";
    out[`na${i}`] = !r?.inspectorOpinion ? "?" : " ";
    out[`other${i}`] = (r as AnyObj)?.otherNote ?? "";
  });
  return out;
};

const mapMatrix = (rows: AnyObj[] | Record<string, AnyObj> | undefined, prefix: string, maxRows = 6) => {
  // รองรับทั้ง Array และ Record โดยแปลงเป็น Array ก่อน
  let arr: AnyObj[];
  if (Array.isArray(rows)) {
    arr = rows.slice(0, maxRows);
  } else {
    arr = Object.entries(rows || {})
      .sort(([a], [b]) => Number(a) - Number(b))
      .slice(0, maxRows)
      .map(([_, row]) => row);
  }
  
  const out: AnyObj = {};
  arr.forEach((row, idx) => {
    const i = idx + 1;
    // ตรวจสอบทั้ง field เก่า (wear/damage/opinion) และ field ใหม่ (have/hasDamage/usable boolean)
    const hasItem = row?.wear === "have" || row?.have === true || row?.have === "have";
    const noItem = row?.wear === "none" || row?.none === true || row?.none === "none";
    const hasDmg = row?.damage === "have" || row?.hasDamage === true || row?.hasDamage === "have";
    const noDmg = row?.damage === "none" || row?.noDamage === true || row?.noDamage === "none";
    const isOk = row?.opinion === "can" || row?.usable === true || row?.usable === "can";
    const isNg = row?.opinion === "cannot" || row?.notUsable === true || row?.notUsable === "cannot";
    
    // Full prefix placeholders (เช่น 13mhave1)
    out[`${prefix}have${i}`] = hasItem ? "✓" : "";
    out[`${prefix}none${i}`] = noItem ? "✓" : "";
    out[`${prefix}dmg${i}`] = hasDmg ? "✓" : "";
    out[`${prefix}nod${i}`] = noDmg ? "✓" : "";
    out[`${prefix}ok${i}`] = isOk ? "✓" : "";
    out[`${prefix}ng${i}`] = isNg ? "✓" : "";
    out[`${prefix}note${i}`] = row?.note ?? row?.remark ?? "";
    // Short alias placeholders (เช่น m1y, m1n, m1d, m1x, m1o, m1g, m1t)
    // m=matrix8, s=sign, e=elec, l=lightning, w=walkway
    const shortPrefix = prefix.replace("13", "");
    out[`${shortPrefix}${i}y`] = hasItem ? "✓" : "";      // y = มี (yes)
    out[`${shortPrefix}${i}n`] = noItem ? "✓" : "";       // n = ไม่มี (no)
    out[`${shortPrefix}${i}d`] = hasDmg ? "✓" : "";       // d = ชำรุดมี (damage)
    out[`${shortPrefix}${i}x`] = noDmg ? "✓" : "";        // x = ชำรุดไม่มี
    out[`${shortPrefix}${i}o`] = isOk ? "✓" : "";         // o = ใช้ได้ (ok)
    out[`${shortPrefix}${i}g`] = isNg ? "✓" : "";         // g = ใช้ไม่ได้ (ng)
    out[`${shortPrefix}${i}t`] = row?.note ?? row?.remark ?? "";  // t = หมายเหตุ (text)
  });
  return out;
};

// Map usabilityPlan rows (status="usable"|"unusable") to matrix placeholders
// ใช้สำหรับข้อมูลจาก form.plan.usabilityPlan (structural, electrical, lightning, others)
const mapUsabilityRows = (rows: AnyObj[] | undefined, prefix: string, maxRows = 9) => {
  const arr = (rows || []).slice(0, maxRows);
  const out: AnyObj = {};
  const shortPrefix = prefix.replace("13", "");
  
  arr.forEach((row, idx) => {
    const i = idx + 1;
    const status1 = row?.statusRound1 ?? row?.status;
    const status2 = row?.statusRound2;
    
    // Round 1: ใช้ได้/ใช้ไม่ได้
    const isOk1 = status1 === "usable";
    const isNg1 = status1 === "unusable";
    // Round 2: ใช้ได้/ใช้ไม่ได้  
    const isOk2 = status2 === "usable";
    const isNg2 = status2 === "unusable";
    
    // Full prefix placeholders (e.g., 13mok1, 13mng1)
    out[`${prefix}ok${i}`] = isOk1 ? "✓" : "";
    out[`${prefix}ng${i}`] = isNg1 ? "✓" : "";
    out[`${prefix}ok2_${i}`] = isOk2 ? "✓" : "";
    out[`${prefix}ng2_${i}`] = isNg2 ? "✓" : "";
    out[`${prefix}note${i}`] = row?.note ?? "";
    
    // Short alias placeholders (e.g., m1o, m1g for round 1)
    out[`${shortPrefix}${i}o`] = isOk1 ? "✓" : "";         // o = ใช้ได้ (ok) round 1
    out[`${shortPrefix}${i}g`] = isNg1 ? "✓" : "";         // g = ใช้ไม่ได้ (ng) round 1
    out[`${shortPrefix}${i}o2`] = isOk2 ? "✓" : "";        // o2 = ใช้ได้ round 2
    out[`${shortPrefix}${i}g2`] = isNg2 ? "✓" : "";        // g2 = ใช้ไม่ได้ round 2
    out[`${shortPrefix}${i}t`] = row?.note ?? "";          // t = หมายเหตุ (text)
  });
  return out;
};

// Map inspect.items (ตาราง ข้อ 8 ข้อ 9) - มี 5 กลุ่ม: g1-g5
// fields: erosion (มี/ไม่มี), wear (การชำรุดสึกหรอ), damage (ความเสียหาย), inspectorOpinion (ใช้ได้/ใช้ไม่ได้), note
const mapInspectItems = (items: Record<string, AnyObj> | undefined, groupId: string, prefix: string, maxRows = 6) => {
  const out: AnyObj = {};
  const shortPrefix = prefix.replace("13", "");
  
  for (let i = 1; i <= maxRows; i++) {
    const key = `${groupId}-${i}`;
    const row = items?.[key];
    
    // มี/ไม่มี (erosion)
    const hasErosion = row?.erosion === "have";
    const noErosion = row?.erosion === "none";
    // การชำรุดสึกหรอ (wear)
    const hasWear = row?.wear === "have";
    const noWear = row?.wear === "none";
    // ความเสียหาย (damage)
    const hasDmg = row?.damage === "have";
    const noDmg = row?.damage === "none";
    // ความเห็นผู้ตรวจสอบ (inspectorOpinion)
    const isOk = row?.inspectorOpinion === "canUse";
    const isNg = row?.inspectorOpinion === "cannotUse";
    
    // Full prefix placeholders
    out[`${prefix}y${i}`] = hasErosion ? "✓" : "";    // y = มี (yes)
    out[`${prefix}n${i}`] = noErosion ? "✓" : "";     // n = ไม่มี (no)
    out[`${prefix}wy${i}`] = hasWear ? "✓" : "";      // wy = สึกหรอ มี
    out[`${prefix}wn${i}`] = noWear ? "✓" : "";       // wn = สึกหรอ ไม่มี
    out[`${prefix}dy${i}`] = hasDmg ? "✓" : "";       // dy = เสียหาย มี
    out[`${prefix}dn${i}`] = noDmg ? "✓" : "";        // dn = เสียหาย ไม่มี
    out[`${prefix}ok${i}`] = isOk ? "✓" : "";         // ok = ใช้ได้
    out[`${prefix}ng${i}`] = isNg ? "✓" : "";         // ng = ใช้ไม่ได้
    out[`${prefix}t${i}`] = row?.note ?? "";          // t = หมายเหตุ
    
    // Short alias (e.g., m1y, m1n, m1wy, m1wn, m1dy, m1dn, m1o, m1g, m1t)
    out[`${shortPrefix}${i}y`] = hasErosion ? "✓" : "";
    out[`${shortPrefix}${i}n`] = noErosion ? "✓" : "";
    out[`${shortPrefix}${i}wy`] = hasWear ? "✓" : "";
    out[`${shortPrefix}${i}wn`] = noWear ? "✓" : "";
    out[`${shortPrefix}${i}dy`] = hasDmg ? "✓" : "";
    out[`${shortPrefix}${i}dn`] = noDmg ? "✓" : "";
    out[`${shortPrefix}${i}o`] = isOk ? "✓" : "";
    out[`${shortPrefix}${i}g`] = isNg ? "✓" : "";
    out[`${shortPrefix}${i}t`] = row?.note ?? "";
  }
  return out;
};


const mapSummary = (
  rows: { id?: number; result?: string; note?: string }[] | undefined,
  prefix: string,
  maxRows = 5
) => {
  const ordered = (rows || []).sort((a, b) => (a.id ?? 0) - (b.id ?? 0)).slice(0, maxRows);
  const out: AnyObj = {};
  ordered.forEach((row, idx) => {
    const i = idx + 1;
    out[`${prefix}ok${i}`] = row.result === "ok" ? "\u2713" : " ";
    out[`${prefix}ng${i}`] = row.result === "not_ok" ? "\u2713" : " ";
    out[`${prefix}fx${i}`] = row.result === "fixed" ? "\u2713" : " ";
    out[`${prefix}note${i}`] = row.note ?? "";
  });
  return out;
};

const mapPlan25 = (plan?: Form8_1Plan) => {
  const rows: { frequency?: string; note?: string }[] = [];
  const fp = plan?.frequencyPlan;
  const add = (arr?: { frequency?: string; note?: string }[]) => { (arr || []).forEach((r) => rows.push(r || {})); };
  add(fp?.structural);
  add(fp?.systems?.electrical);
  add(fp?.systems?.lightning);
  add(fp?.systems?.others);
  const out: AnyObj = {};
  rows.forEach((r, idx) => {
    const i = idx + 1;
    out[`25m${i}`] = r.frequency === "1m" ? "?" : " ";
    out[`25q${i}`] = r.frequency === "4m" ? "?" : " ";
    out[`25s${i}`] = r.frequency === "6m" ? "?" : " ";
    out[`25y${i}`] = r.frequency === "1y" ? "?" : " ";
    out[`25t${i}`] = r.frequency === "3y" ? "?" : " ";
    out[`25note${i}`] = r.note ?? "";
  });
  return out;
};

type PlaceholderItem = { prefix: number; name: string; description: string };
export const PLACEHOLDER_REFERENCE: PlaceholderItem[] = [
  { prefix: 10, name: "{{10year}}", description: "Report year (B.E.) / ปีรายงาน (พ.ศ.)" },
  { prefix: 10, name: "{{10inst}}", description: "Install type / ประเภทติดตั้ง" },
  { prefix: 10, name: "{{10sign}}", description: "Sign title / ชื่อป้ายหรือข้อความ" },
  { prefix: 10, name: "{{10comp}}", description: "Company / place name / ชื่อบริษัทหรือสถานที่" },
  { prefix: 10, name: "{{10ownr}}", description: "Owner name / ชื่อเจ้าของ" },
  { prefix: 10, name: "{{10addr}}", description: "Owner address / ที่อยู่เจ้าของ" },
  { prefix: 10, name: "{{10pimg}}", description: "Main image / ภาพหลัก" },
  // prefix 12
  { prefix: 12, name: "{{12p1}}", description: "Cover photo / ภาพ cover" },
  { prefix: 12, name: "{{12p2}}", description: "Header photo / ภาพ header" },
  { prefix: 12, name: "{{12p3}}", description: "Main photo 1 / ภาพหลัก 1" },
  { prefix: 12, name: "{{12p4}}", description: "Main photo 2 / ภาพหลัก 2" },
  { prefix: 12, name: "{{12p5}}", description: "Set A photo 1 / ภาพชุด A1" },
  { prefix: 12, name: "{{12p6}}", description: "Set A photo 2 / ภาพชุด A2" },
  { prefix: 12, name: "{{12p7}}", description: "Set B photo 1 / ภาพชุด B1" },
  { prefix: 12, name: "{{12p8}}", description: "Set B photo 2 / ภาพชุด B2" },
  { prefix: 12, name: "{{12p9}}", description: "Set B photo 3 / ภาพชุด B3" },
  { prefix: 12, name: "{{12p10}}", description: "Set B photo 4 / ภาพชุด B4" },
  { prefix: 12, name: "{{12p11}}", description: "Set B photo 5 / ภาพชุด B5" },
  { prefix: 12, name: "{{12p12}}", description: "Set B photo 6 / ภาพชุด B6" },
  { prefix: 12, name: "{{12year}}", description: "Year (B.E.) / ปี (พ.ศ.)" },
  { prefix: 12, name: "{{12inst}}", description: "Install type / ประเภทติดตั้ง" },
  { prefix: 12, name: "{{12sign}}", description: "Sign name/text / ชื่อป้ายหรือข้อความ" },
  { prefix: 12, name: "{{12comp}}", description: "Company/organization / บริษัทหรือหน่วยงาน" },
  { prefix: 12, name: "{{12ownr}}", description: "Owner/representative name / ชื่อเจ้าของหรือผู้แทน" },
  { prefix: 12, name: "{{12addr}}", description: "Full address / ที่อยู่เต็ม" },
  { prefix: 12, name: "{{12pimg}}", description: "Main image (signMain) / ภาพหลัก (signMain)" },
  { prefix: 12, name: "{{12tx1}}", description: "Address no. / เลขที่" },
  { prefix: 12, name: "{{12tx2}}", description: "Moo / หมู่ที่" },
  { prefix: 12, name: "{{12tx3}}", description: "Soi/Alley / ซอย/ตรอก" },
  { prefix: 12, name: "{{12tx4}}", description: "Road / ถนน" },
  { prefix: 12, name: "{{12tx5}}", description: "Subdistrict / แขวง/ตำบล" },
  { prefix: 12, name: "{{12tx6}}", description: "District / เขต/อำเภอ" },
  { prefix: 12, name: "{{12tx7}}", description: "Province / จังหวัด" },
  { prefix: 12, name: "{{12tx8}}", description: "Postal code / รหัสไปรษณีย์" },
  { prefix: 12, name: "{{12tx9}}", description: "Phone / โทรศัพท์" },
  { prefix: 12, name: "{{12tx10}}", description: "Fax / โทรสาร" },
  { prefix: 12, name: "{{12rd11}}", description: "Has permit document (✓) / มีใบอนุญาตก่อสร้าง (✓)" },
  { prefix: 12, name: "{{12tx12}}", description: "Permit issued date / วันที่ออกใบอนุญาต" },
  { prefix: 12, name: "{{12rd13}}", description: "Has original plan (✓) / มีแบบแปลนเดิม (✓)" },
  { prefix: 12, name: "{{12rd14}}", description: "Missing original plan (✓) / ไม่มีแบบแปลนเดิม (✓)" },
  { prefix: 12, name: "{{12tx15}}", description: "Approx. Buddhist year / อายุป้าย (ปี พ.ศ.)" },
  { prefix: 12, name: "{{12rd16}}", description: "Permit exempt (✓) / ยกเว้นขออนุญาต (✓)" },
  { prefix: 12, name: "{{12rdPunk}}", description: "Unknown permit info (✓) / ไม่ทราบข้อมูลใบอนุญาต (✓)" },
  { prefix: 12, name: "{{12rdPlanY}}", description: "Has plan copy (✓) / มีสำเนาแบบ (✓)" },
  { prefix: 12, name: "{{12rdPlanN}}", description: "No plan copy (✓) / ไม่มีสำเนาแบบ (✓)" },
  { prefix: 12, name: "{{12rd17}}", description: "Sign type ground (✓) / ประเภทป้าย พื้นดิน (✓)" },
  { prefix: 12, name: "{{12rd18}}", description: "Sign type roof/deck (✓) / ประเภทป้าย ดาดฟ้า/หลังคา (✓)" },
  { prefix: 12, name: "{{12rd19}}", description: "Sign type facade/part (✓) / ประเภทป้าย ผนัง/ส่วนอาคาร (✓)" },
  { prefix: 12, name: "{{12rd20}}", description: "Sign type others (✓) / ประเภทป้าย อื่น ๆ (✓)" },
  { prefix: 12, name: "{{12tx21}}", description: "Sign type others text / ประเภทป้าย อื่น ๆ (ข้อความ)" },
  { prefix: 12, name: "{{12tx22}}", description: "Product/text on sign / ข้อความในป้าย" },
  { prefix: 12, name: "{{12tx23}}", description: "Owner name / ชื่อเจ้าของป้าย" },
  { prefix: 12, name: "{{12tx24}}", description: "Owner address / ที่อยู่เจ้าของป้าย" },
  { prefix: 12, name: "{{12tx25}}", description: "Owner phone / โทรเจ้าของป้าย" },
  { prefix: 12, name: "{{12tx26}}", description: "Owner email / อีเมลเจ้าของป้าย" },
  { prefix: 12, name: "{{12tx27}}", description: "Building owner name / ชื่อเจ้าของอาคาร" },
  { prefix: 12, name: "{{12tx28}}", description: "Building owner address / ที่อยู่เจ้าของอาคาร" },
  { prefix: 12, name: "{{12tx29}}", description: "Building owner phone / โทรเจ้าของอาคาร" },
  { prefix: 12, name: "{{12tx30}}", description: "Building owner email / อีเมลเจ้าของอาคาร" },
  { prefix: 12, name: "{{12tx31}}", description: "Structural designer name / ชื่อผู้ออกแบบโครงสร้าง" },
  { prefix: 12, name: "{{12tx32}}", description: "Structural designer phone / โทรผู้ออกแบบโครงสร้าง" },
  { prefix: 12, name: "{{12tx33}}", description: "Structural designer license / ใบอนุญาตผู้ออกแบบโครงสร้าง" },
  { prefix: 12, name: "{{12tx34}}", description: "Structural designer address / ที่อยู่ผู้ออกแบบโครงสร้าง" },
  { prefix: 12, name: "{{12tx35}}", description: "Building designer name / ชื่อผู้ออกแบบโครงสร้างอาคาร" },
  { prefix: 12, name: "{{12tx36}}", description: "Building designer phone / โทรผู้ออกแบบโครงสร้างอาคาร" },
  { prefix: 12, name: "{{12tx37}}", description: "Building designer license / ใบอนุญาตผู้ออกแบบโครงสร้างอาคาร" },
  { prefix: 12, name: "{{12tx38}}", description: "Building designer address / ที่อยู่ผู้ออกแบบโครงสร้างอาคาร" },
  { prefix: 12, name: "{{12rd39}}", description: "Structure material steel (✓) / วัสดุโครงสร้าง เหล็ก (✓)" },
  { prefix: 12, name: "{{12rd40}}", description: "Structure material wood (✓) / วัสดุโครงสร้าง ไม้ (✓)" },
  { prefix: 12, name: "{{12rd41}}", description: "Structure material stainless (✓) / วัสดุโครงสร้าง สแตนเลส (✓)" },
  { prefix: 12, name: "{{12rd42}}", description: "Structure material reinforced concrete (✓) / วัสดุโครงสร้าง คอนกรีตเสริมเหล็ก (✓)" },
  { prefix: 12, name: "{{12rd43}}", description: "Structure material other (✓) / วัสดุโครงสร้าง อื่น ๆ (✓)" },
  { prefix: 12, name: "{{12tx44}}", description: "Structure material other text / วัสดุโครงสร้าง อื่น ๆ (ข้อความ)" },
  { prefix: 12, name: "{{12rd45}}", description: "Surface material enabled (✓) / วัสดุผิวป้าย (เปิดใช้)" },
  { prefix: 12, name: "{{12tx45}}", description: "Surface material text / วัสดุผิวป้าย (ข้อความ)" },
  { prefix: 12, name: "{{12rd46}}", description: "Faces count enabled (✓) / จำนวนหน้าป้าย (เปิดใช้)" },
  { prefix: 12, name: "{{12tx46}}", description: "Faces count / จำนวนหน้าที่ติดตั้งป้าย" },
  { prefix: 12, name: "{{12rd47}}", description: "Has openings (✓) / มีช่อง/เจาะ (✓)" },
  { prefix: 12, name: "{{12rd48}}", description: "No openings (✓) / ไม่มีช่อง/เจาะ (✓)" },
  { prefix: 12, name: "{{12rd49}}", description: "Openings flag (✓) / เปิดใช้ช่อง/เจาะ (✓)" },
  { prefix: 12, name: "{{12rd50}}", description: "Other equipment flag (✓) / อื่น ๆ อุปกรณ์ (✓)" },
  { prefix: 12, name: "{{12tx50}}", description: "Other equipment text / อื่น ๆ อุปกรณ์ (ข้อความ)" },
  // 13 checklist and matrices
  { prefix: 13, name: "{{13nc1-7}}", description: "No change rows 1-7 (✓) / ไม่มีการเปลี่ยนแปลง แถว 1-7 (✓)" },
  { prefix: 13, name: "{{13ch1-7}}", description: "Has change rows 1-7 (✓) / มีการเปลี่ยนแปลง แถว 1-7 (✓)" },
  { prefix: 13, name: "{{13dt1-7}}", description: "Detail rows 1-7 / รายละเอียดเพิ่มเติม แถว 1-7" },
  { prefix: 13, name: "{{13ok1-7}}", description: "Usable rows 1-7 (✓) / ใช้งานได้ แถว 1-7 (✓)" },
  { prefix: 13, name: "{{13ng1-7}}", description: "Not usable rows 1-7 (✓) / ใช้งานไม่ได้ แถว 1-7 (✓)" },
  { prefix: 13, name: "{{13ot1-7}}", description: "Other rows 1-7 / ข้ออื่น ๆ แถว 1-7" },
  { prefix: 13, name: "{{13pr1-7}}", description: "Please specify rows 1-7 / โปรดระบุ แถว 1-7" },
  { prefix: 13, name: "{{13mhave1-6}}", description: "Matrix base/anchor have (✓) / ฐานราก/ยึดตรึง มี (✓)" },
  { prefix: 13, name: "{{13mnone1-6}}", description: "Matrix base/anchor none (✓) / ฐานราก/ยึดตรึง ไม่มี (✓)" },
  { prefix: 13, name: "{{13mdmg1-6}}", description: "Matrix base/anchor damage have (✓) / ฐานราก/ยึดตรึง เสียหายมี (✓)" },
  { prefix: 13, name: "{{13mnod1-6}}", description: "Matrix base/anchor damage none (✓) / ฐานราก/ยึดตรึง เสียหายไม่มี (✓)" },
  { prefix: 13, name: "{{13mok1-6}}", description: "Matrix base/anchor usable (✓) / ฐานราก/ยึดตรึง ใช้งานได้ (✓)" },
  { prefix: 13, name: "{{13mng1-6}}", description: "Matrix base/anchor not usable (✓) / ฐานราก/ยึดตรึง ใช้งานไม่ได้ (✓)" },
  { prefix: 13, name: "{{13mnote1-6}}", description: "Matrix base/anchor note / ฐานราก/ยึดตรึง หมายเหตุ" },
  { prefix: 13, name: "{{13shave1-5}}", description: "Sign/surface/letter have (✓) / ป้าย/พื้นผิว/สีตัวอักษร มี (✓)" },
  { prefix: 13, name: "{{13snone1-5}}", description: "Sign/surface/letter none (✓) / ป้าย/พื้นผิว/สีตัวอักษร ไม่มี (✓)" },
  { prefix: 13, name: "{{13sdmg1-5}}", description: "Sign/surface/letter damage have (✓) / ป้าย/พื้นผิว/สีตัวอักษร เสียหายมี (✓)" },
  { prefix: 13, name: "{{13snod1-5}}", description: "Sign/surface/letter damage none (✓) / ป้าย/พื้นผิว/สีตัวอักษร เสียหายไม่มี (✓)" },
  { prefix: 13, name: "{{13sok1-5}}", description: "Sign/surface/letter usable (✓) / ป้าย/พื้นผิว/สีตัวอักษร ใช้งานได้ (✓)" },
  { prefix: 13, name: "{{13sng1-5}}", description: "Sign/surface/letter not usable (✓) / ป้าย/พื้นผิว/สีตัวอักษร ใช้งานไม่ได้ (✓)" },
  { prefix: 13, name: "{{13snote1-5}}", description: "Sign/surface/letter note / ป้าย/พื้นผิว/สีตัวอักษร หมายเหตุ" },
  { prefix: 13, name: "{{13ehave1-5}}", description: "Electrical have (✓) / ระบบไฟฟ้า มี (✓)" },
  { prefix: 13, name: "{{13enone1-5}}", description: "Electrical none (✓) / ระบบไฟฟ้า ไม่มี (✓)" },
  { prefix: 13, name: "{{13edmg1-5}}", description: "Electrical damage have (✓) / ระบบไฟฟ้า เสียหายมี (✓)" },
  { prefix: 13, name: "{{13enod1-5}}", description: "Electrical damage none (✓) / ระบบไฟฟ้า เสียหายไม่มี (✓)" },
  { prefix: 13, name: "{{13eok1-5}}", description: "Electrical usable (✓) / ระบบไฟฟ้า ใช้งานได้ (✓)" },
  { prefix: 13, name: "{{13eng1-5}}", description: "Electrical not usable (✓) / ระบบไฟฟ้า ใช้งานไม่ได้ (✓)" },
  { prefix: 13, name: "{{13enote1-5}}", description: "Electrical note / ระบบไฟฟ้า หมายเหตุ" },
  { prefix: 13, name: "{{13lhave1-4}}", description: "Lightning have (✓) / ระบบสายล่อฟ้า มี (✓)" },
  { prefix: 13, name: "{{13lnone1-4}}", description: "Lightning none (✓) / ระบบสายล่อฟ้า ไม่มี (✓)" },
  { prefix: 13, name: "{{13ldmg1-4}}", description: "Lightning damage have (✓) / ระบบสายล่อฟ้า เสียหายมี (✓)" },
  { prefix: 13, name: "{{13lnod1-4}}", description: "Lightning damage none (✓) / ระบบสายล่อฟ้า เสียหายไม่มี (✓)" },
  { prefix: 13, name: "{{13lok1-4}}", description: "Lightning usable (✓) / ระบบสายล่อฟ้า ใช้งานได้ (✓)" },
  { prefix: 13, name: "{{13lng1-4}}", description: "Lightning not usable (✓) / ระบบสายล่อฟ้า ใช้งานไม่ได้ (✓)" },
  { prefix: 13, name: "{{13lnote1-4}}", description: "Lightning note / ระบบสายล่อฟ้า หมายเหตุ" },
  { prefix: 13, name: "{{13whave1-4}}", description: "Walkway/stair have (✓) / ทางเดิน/บันได มี (✓)" },
  { prefix: 13, name: "{{13wnone1-4}}", description: "Walkway/stair none (✓) / ทางเดิน/บันได ไม่มี (✓)" },
  { prefix: 13, name: "{{13wdmg1-4}}", description: "Walkway/stair damage have (✓) / ทางเดิน/บันได เสียหายมี (✓)" },
  { prefix: 13, name: "{{13wnod1-4}}", description: "Walkway/stair damage none (✓) / ทางเดิน/บันได เสียหายไม่มี (✓)" },
  { prefix: 13, name: "{{13wok1-4}}", description: "Walkway/stair usable (✓) / ทางเดิน/บันได ใช้งานได้ (✓)" },
  { prefix: 13, name: "{{13wng1-4}}", description: "Walkway/stair not usable (✓) / ทางเดิน/บันได ใช้งานไม่ได้ (✓)" },
  { prefix: 13, name: "{{13wnote1-4}}", description: "Walkway/stair note / ทางเดิน/บันได หมายเหตุ" },
  // prefix 14 summary
  { prefix: 14, name: "{{14ok1-5}}", description: "Summary usable (✓) / สรุป ใช้งานได้ (✓)" },
  { prefix: 14, name: "{{14ng1-5}}", description: "Summary not usable (✓) / สรุป ใช้งานไม่ได้ (✓)" },
  { prefix: 14, name: "{{14fx1-5}}", description: "Summary fixed (✓) / สรุป แก้ไขแล้ว (✓)" },
  { prefix: 14, name: "{{14note1-5}}", description: "Summary note / หมายเหตุ" },
  // prefix 25 frequency
  { prefix: 25, name: "{{25m1-25}}", description: "Frequency 1 month (✓) / ความถี่ 1 เดือน (✓)" },
  { prefix: 25, name: "{{25q1-25}}", description: "Frequency 4 months (✓) / ความถี่ 4 เดือน (✓)" },
  { prefix: 25, name: "{{25s1-25}}", description: "Frequency 6 months (✓) / ความถี่ 6 เดือน (✓)" },
  { prefix: 25, name: "{{25y1-25}}", description: "Frequency 1 year (✓) / ความถี่ 1 ปี (✓)" },
  { prefix: 25, name: "{{25t1-25}}", description: "Frequency 3 years (✓) / ความถี่ 3 ปี (✓)" },
  { prefix: 25, name: "{{25note1-25}}", description: "Frequency note / หมายเหตุ" },
  // prefix 27 maintenance summary
  { prefix: 27, name: "{{27ok1-5}}", description: "Maintenance summary usable (✓) / สรุปบำรุงรักษา ใช้งานได้ (✓)" },
  { prefix: 27, name: "{{27ng1-5}}", description: "Maintenance summary not usable (✓) / สรุปบำรุงรักษา ใช้งานไม่ได้ (✓)" },
  { prefix: 27, name: "{{27fx1-5}}", description: "Maintenance summary fixed (✓) / สรุปบำรุงรักษา แก้ไขแล้ว (✓)" },
  { prefix: 27, name: "{{27note1-5}}", description: "Maintenance summary note / สรุปบำรุงรักษา หมายเหตุ" },
  { prefix: 27, name: "{{27extra}}", description: "Maintenance extra note / หมายเหตุสรุปเพิ่มเติม" },
  { prefix: 27, name: "{{27signer}}", description: "Signer name / ชื่อผู้ลงนาม" },
  { prefix: 27, name: "{{27print}}", description: "Signer printed name / ชื่อพิมพ์ (ตัวบรรจง)" },
  { prefix: 27, name: "{{27date}}", description: "Signed date / วันเดือนปีที่ลงนาม" },
] as const;
const buildDataContext = (form: Form8_1Data): AnyObj => {
  const photos = mapPhotos(form.photos);
  const photoFilenames = mapPhotoFilenames(form.photos);
  const installTypeText = (() => {
    const i = form.report?.installType;
    switch (i) {
      case "onGround": return "ติดตั้งบนพื้น";
      case "onRoofDeck": return "ติดตั้งบนดาดฟ้า/หลังคา";
      case "onRoof": return "ติดตั้งบนหลังคา";
      case "onFacadePart": return "ติดตั้งบนผนังส่วนหนึ่งของอาคาร";
      case "others": return "อื่นๆ";
      default: return "";
    }
  })();
  const fullAddress = (() => {
    const g = form.general || {};
    const parts = [
      g.addressNo,
      g.moo ? `หมู่ ${g.moo}` : "",
      g.alley ? `ซอย/ตรอก ${g.alley}` : "",
      g.road ? `ถนน ${g.road}` : "",
      g.subdistrict ? `ตำบล/แขวง ${g.subdistrict}` : "",
      g.district ? `อำเภอ/เขต ${g.district}` : "",
      g.province ? `จังหวัด ${g.province}` : "",
      g.postalCode ? `รหัสไปรษณีย์ ${g.postalCode}` : "",
    ];
    return parts.filter(Boolean).join(" ");
  })();
  // Location images - use filename if available since template uses text placeholders
  const mapFilename = form.location?.mapImageFilename || "";
  const layoutFilename = form.location?.layoutImageFilename || "";
  const location = {
    map: isRealImage(mapFilename) ? extractFilename(mapFilename) : NO_PHOTO_TEXT,
    layout: isRealImage(layoutFilename) ? extractFilename(layoutFilename) : NO_PHOTO_TEXT,
    coordinate: form.location?.coordinate || {},
  };
  const tao = (form.typeAndOwner || {}) as AnyObj;
  const owner = (tao.owner || {}) as AnyObj;
  const bldOwner = (tao.buildingOwner || {}) as AnyObj;
  const designer = (tao.designer || {}) as AnyObj;
  const designerBld = (tao.designerBuilding || {}) as AnyObj;
  // Use checkbox symbols for display in PowerPoint: ☑ (checked) and ☐ (unchecked)
  const tick = (v?: boolean | null, yes = true) => (v === yes ? "☑" : "☐");
  const mark = (v?: boolean | null) => (v ? "☑" : "☐");
  
  return {
    // Flatten everything for Docxtemplater compatibility
    ...form,
    reportYear: form.report?.year ?? "",
    reportInstallType: installTypeText ?? "",
    reportSignTitle: form.report?.signTitle ?? form.general?.signName ?? "",
    reportCompanyName: form.report?.companyName ?? form.general?.productName ?? form.typeAndOwner?.owner?.name ?? "",
    reportCompanyAddress: form.report?.companyAddress ?? fullAddress ?? "",
    // Keep nested report for backward compat if needed
    report: {
      ...form.report,
      year: form.report?.year ?? "",
      installType: installTypeText ?? "",
      signTitle: form.report?.signTitle ?? form.general?.signName ?? "",
      companyName: form.report?.companyName ?? form.general?.productName ?? form.typeAndOwner?.owner?.name ?? "",
      companyAddress: form.report?.companyAddress ?? fullAddress ?? "",
    },
    photos,
    // Photo filenames for image module (use with {%img} syntax in template)
    ...photoFilenames,
    // Location image filenames for image module
    mapImg: mapFilename,
    layoutImg: layoutFilename,
    location,
    ...mapGeneralShort(form.general),
    ...mapShortCheckboxes(form.inspect),
    // legacy/template alias keys
    hpY: tick(form.general?.hasPermitDocument),
    hpN: tick(form.general?.hasPermitDocument, false),
    planY: tick(form.general?.hasPlan),
    planN: tick(form.general?.hasPlan, false),
    unknown: tick((form.general as AnyObj)?.permitInfoUnknown ?? null),
    permitDate: form.general?.permitIssuedDate ?? "",
    approxYear: form.general?.approxBuddhistYear ?? form.general?.ageYears ?? "",
    pMain: photos.signMain,
    pA1: photos.setA1,
    pA2: photos.setA2,
    g1: photos.setB1,
    g2: photos.setB2,
    g3: photos.setB3,
    g4: photos.setB4,
    g5: photos.setB5,
    g6: photos.setB6,
    // PPTX template placeholders (cover page / header)
    // ใช้ prefix 10 จากไฟล์ Form8_1_Report_1_0.tsx ป้องกันชนกับส่วนอื่น
    ["10year"]: form.report?.year ?? "",
    ["10inst"]: installTypeText ?? "",
    ["10sign"]: form.general?.signName ?? form.report?.signTitle ?? "",
    ["10comp"]: form.report?.companyName ?? form.general?.productName ?? form.typeAndOwner?.owner?.name ?? "",
    ["10ownr"]: form.typeAndOwner?.owner?.name ?? form.report?.companyName ?? "",
    ["10addr"]: form.report?.companyAddress ?? fullAddress ?? "",
    ["10pimg"]: photos.signMain ?? "",
    // รูปอัปโหลด (ตามหมายเลขในแบบฟอร์ม)
    ["12p1"]: photos.cover ?? "",      // ภาพหลักบน (ซ้าย)
    ["12p2"]: photos.header ?? "",     // ภาพหลักบน (ขวา)
    ["12p3"]: photos.signMain ?? "",   // รูปป้าย/รูปหลัก 1
    ["12p4"]: photos.signMain ?? "",   // รูปป้ายหลัก 2 (ใช้รูปเดียวกัน ถ้าไม่มีรูปแยก)
    ["12p5"]: photos.setA1 ?? "",      // ชุด A รูปที่ 1
    ["12p6"]: photos.setA2 ?? "",      // ชุด A รูปที่ 2
    ["12p7"]: photos.setB1 ?? "",      // ชุด B รูปที่ 1
    ["12p8"]: photos.setB2 ?? "",      // ชุด B รูปที่ 2
    ["12p9"]: photos.setB3 ?? "",      // ชุด B รูปที่ 3
    ["12p10"]: photos.setB4 ?? "",     // ชุด B รูปที่ 4
    ["12p11"]: photos.setB5 ?? "",     // ชุด B รูปที่ 5
    ["12p12"]: photos.setB6 ?? "",     // ชุด B รูปที่ 6
    // Text placeholders for address section (Tx1..Tx10) จากตัวเลขสีแดง
    ["12tx1"]: form.general?.addressNo ?? "",
    ["12tx2"]: form.general?.moo ?? "",
    ["12tx3"]: form.general?.alley ?? "",
    ["12tx4"]: form.general?.road ?? "",
    ["12tx5"]: form.general?.subdistrict ?? "",
    ["12tx6"]: form.general?.district ?? "",
    ["12tx7"]: form.general?.province ?? "",
    ["12tx8"]: form.general?.postalCode ?? "",
    ["12tx9"]: form.general?.phoneNo ?? "",
    ["12tx10"]: form.general?.fax ?? "",
    // Permit/plan section (11-16)
    ["12rd11"]: mark(form.general?.hasPermitDocument),
    ["12tx12"]: form.general?.permitIssuedDate ?? "",
    ["12rd13"]: mark(form.general?.hasOriginalPlan),
    ["12rd14"]: mark(form.general?.missingOriginalPlan),
    ["12tx15"]: form.general?.approxBuddhistYear ?? form.general?.ageYears ?? "",
    ["12rd16"]: mark(form.general?.permitExempt),
    // เพิ่มสถานะอื่น ๆ ที่เกี่ยวข้องกับใบอนุญาต/แบบแปลน (กันตกหล่น)
    ["12rdPunk"]: mark((form.general as AnyObj)?.permitInfoUnknown), // ไม่ทราบข้อมูลใบอนุญาต
    ["12rdPlanY"]: mark(form.general?.hasPlan),   // มีแบบแปลน
    ["12rdPlanN"]: mark(form.general?.hasPlan === false), // ไม่มีแบบแปลน
    // Section 2: ประเภทของป้าย (installType) + หมายเหตุ
    ["12rd17"]: tick(form.report?.installType === "onGround"),
    ["12rd18"]: tick(form.report?.installType === "onRoofDeck"),
    ["12rd19"]: tick(form.report?.installType === "onFacadePart"),
    ["12rd20"]: tick(form.report?.installType === "others"),
    ["12tx21"]: tao.otherNote ?? "",
    // Section 3: เจ้าของ/ผู้ออกแบบ
    ["12tx22"]: form.general?.productName ?? "",
    ["12tx23"]: owner.name ?? "",
    ["12tx24"]: owner.address ?? "",
    ["12tx25"]: owner.phone ?? "",
    ["12tx26"]: owner.email ?? "",
    ["12tx27"]: bldOwner.name ?? "",
    ["12tx28"]: bldOwner.address ?? "",
    ["12tx29"]: bldOwner.phone ?? "",
    ["12tx30"]: bldOwner.email ?? "",
    ["12tx31"]: designer.name ?? "",
    ["12tx32"]: designer.phone ?? "",
    ["12tx33"]: designer.licenseNo ?? "",
    ["12tx34"]: designer.address ?? "",
    ["12tx35"]: designerBld.name ?? "",
    ["12tx36"]: designerBld.phone ?? "",
    ["12tx37"]: designerBld.licenseNo ?? "",
    ["12tx38"]: designerBld.address ?? "",
    // Section 4: ประเภทวัสดุ/รายละเอียดอุปกรณ์ป้าย
    ["12rd39"]: mark(form.materials?.structureKinds?.includes("steel")),               // เหล็กโครงสร้างรูปพรรณ
    ["12rd40"]: mark(form.materials?.structureKinds?.includes("wood")),                // ไม้
    ["12rd41"]: mark(form.materials?.structureKinds?.includes("stainless")),           // สแตนเลส
    ["12rd42"]: mark(form.materials?.structureKinds?.includes("reinforcedConcrete")),  // คอนกรีตเสริมเหล็ก
    ["12rd43"]: mark(form.materials?.structureKinds?.includes("other")),               // อื่น ๆ
    ["12tx44"]: form.materials?.openingNote ?? "",                                     // ระบุอื่น ๆ
    ["12rd45"]: mark(form.materials?.flagMaterial),                                    // วัสดุผิวป้าย (เปิดใช้)
    ["12tx45"]: form.materials?.surfaceMaterial ?? "",                                 // วัสดุผิวป้าย (ข้อความ)
    ["12rd46"]: mark(form.materials?.flagFaces),                                       // เปิดใช้จำนวนหน้า
    ["12tx46"]: form.general?.size?.faces ?? "",                                       // จำนวนหน้าที่ติดตั้งป้าย
    ["12rd47"]: tick(form.materials?.flagOpening ? form.materials?.hasOpenings === true : false),  // มีช่อง/เจาะ
    ["12rd48"]: tick(form.materials?.flagOpening ? form.materials?.hasOpenings === false : false), // ไม่มีช่อง/เจาะ
    ["12rd49"]: mark(form.materials?.flagOpening),                                     // เปิดใช้ช่อง/เจาะ
    ["12rd50"]: mark(form.materials?.flagOther),                                       // อื่น ๆ (เปิดใช้)
    ["12tx50"]: form.materials?.otherNote ?? "",                                       // อื่น ๆ (ข้อความ)
    // Section 5 (ตรวจโครงสร้าง/ผิว/ตัวอักษร) -> prefix 13 สำหรับแถว checklist (เรียง key 1..7)
    ...(() => {
      const rows = sortInspectItems(form.inspect?.items).slice(0, 7);
      const out: AnyObj = {};
      rows.forEach((r, idx) => {
        const i = idx + 1;
        out[`13nc${i}`] = tick(r?.noChange);
        out[`13ch${i}`] = tick(r?.hasChange);
        out[`13dt${i}`] = r?.changeDetailNote ?? r?.note ?? "";
        out[`13ok${i}`] = tick(r?.inspectorOpinion === "canUse");
        out[`13ng${i}`] = tick(r?.inspectorOpinion === "cannotUse");
        out[`13ot${i}`] = (r as AnyObj)?.otherNote ?? "";
        out[`13pr${i}`] = (r as AnyObj)?.otherNote ?? ""; // โปรดระบุ (ช่องข้อความของ “ข้ออื่น ๆ”)
      });
      return out;
    })(),
    // DEBUG: log inspect.items data (ข้อมูลตาราง ข้อ 8 ข้อ 9)
    ...(() => {
      const items = (form.inspect?.items || {}) as Record<string, AnyObj>;
      console.log("=== DEBUG INSPECT ITEMS ===");
      console.log("form.inspect.items keys:", Object.keys(items));
      console.log("g1-1:", items["g1-1"]);
      console.log("g1-2:", items["g1-2"]);
      return {};
    })(),
    // Section 6: ตาราง ข้อ 8 ข้อ 9 - ดึงจาก form.inspect.items
    // g1 = โครงสร้าง/ฐานราก/ยึดตรึง (6 แถว) prefix 13m
    ...mapInspectItems((form.inspect?.items || {}) as Record<string, AnyObj>, "g1", "13m", 6),
    // g2 = ป้าย/พื้นผิว/สี/ตัวอักษร (5 แถว) prefix 13s
    ...mapInspectItems((form.inspect?.items || {}) as Record<string, AnyObj>, "g2", "13s", 5),
    // g3 = ระบบไฟฟ้า (4 แถว) prefix 13e
    ...mapInspectItems((form.inspect?.items || {}) as Record<string, AnyObj>, "g3", "13e", 4),
    // g4 = ระบบสายล่อฟ้า (4 แถว) prefix 13l
    ...mapInspectItems((form.inspect?.items || {}) as Record<string, AnyObj>, "g4", "13l", 4),
    // g5 = ทางเดิน/บันได/ทางขึ้น (4 แถว) prefix 13w
    ...mapInspectItems((form.inspect?.items || {}) as Record<string, AnyObj>, "g5", "13w", 4),
    // สรุปผลการตรวจ (ตารางรวม) prefix 14
    ...mapSummary((form.summary as AnyObj)?.rows, "14", 5),
    // ตารางความถี่ (2.5) prefix 25
    ...mapPlan25(form.plan),
    // ส่วน 2.7 สรุปผลบำรุงรักษา prefix 27 (ใช้ plan.summaryPlan)
    ...mapSummary((form.plan as AnyObj)?.summaryPlan?.rows, "27", 5),
    ["27extra"]: (form.plan as AnyObj)?.summaryPlan?.extraNote ?? "",
    ["27signer"]: (form.plan as AnyObj)?.summaryPlan?.signerName ?? "",
    ["27print"]: (form.plan as AnyObj)?.summaryPlan?.signerPrinted ?? "",
    ["27date"]: (form.plan as AnyObj)?.summaryPlan?.signedDate ?? "",
    
    // ===== NEW PLACEHOLDERS FOR SLIDES 8-35 =====
    
    // Slide 8: Inspection date (signoff.inspectionDate already in signoff object)
    signoff: {
      inspectionDate: form.signoff?.inspectionDate ?? "",
      inspectorName: form.signoff?.inspectorName ?? "บริษัท โปรไฟร์ อินสเปคเตอร์ จำกัด",
      ownerOrRepresentative: form.signoff?.ownerOrRepresentative ?? "",
      overallConclusion: form.signoff?.overallConclusion ?? "",
      signature: form.signoff?.signature ?? "",
    },
    
    // Slide 9-10: Sign dimensions (general.size already exists)
    general: {
      ...form.general,
      productName: form.general?.productName ?? form.general?.signName ?? "",
      size: {
        width: form.general?.size?.width ?? "",
        height: form.general?.size?.height ?? "",
        faces: form.general?.size?.faces ?? "",
        approxArea: form.general?.size?.approxArea ?? "",
      },
    },
    
    // Slide 13: Sign type checkboxes
    typeOnGround: tick(form.report?.installType === "onGround"),
    typeOnRoofDeck: tick(form.report?.installType === "onRoofDeck"),
    typeOnRoof: tick(form.report?.installType === "onRoof"),
    typeOnFacade: tick(form.report?.installType === "onFacadePart"),
    typeOther: tick(form.report?.installType === "others"),
    typeOtherText: (form.typeAndOwner as AnyObj)?.otherNote ?? "",
    
    // Slide 14: Owner info (typeAndOwner.owner already mapped above)
    typeAndOwner: {
      ...form.typeAndOwner,
      owner: {
        name: owner.name ?? "",
        addressNo: owner.address ?? owner.addressNo ?? "",
        phone: owner.phone ?? "",
        email: owner.email ?? "",
      },
    },
    
    // Slide 15: Materials checkboxes
    matSteel: mark(form.materials?.structureKinds?.includes("steel")),
    matWood: mark(form.materials?.structureKinds?.includes("wood")),
    matStainless: mark(form.materials?.structureKinds?.includes("stainless")),
    matConcrete: mark(form.materials?.structureKinds?.includes("reinforcedConcrete")),
    matOther: mark(form.materials?.structureKinds?.includes("other")),
    matOtherText: form.materials?.openingNote ?? "",
    
    // Slides 17-19: Inspection items ch2-ch4, nc2-nc4, etc.
    // (ch1, nc1, ok1, ng1, na1, other1, note1 already in slide 16)
    ch2: tick((form.inspect?.items?.[1] as AnyObj)?.hasChange),
    nc2: tick((form.inspect?.items?.[1] as AnyObj)?.noChange),
    note2: (form.inspect?.items?.[1] as AnyObj)?.note ?? "",
    ok2: tick((form.inspect?.items?.[1] as AnyObj)?.inspectorOpinion === "canUse"),
    ng2: tick((form.inspect?.items?.[1] as AnyObj)?.inspectorOpinion === "cannotUse"),
    ch3: tick((form.inspect?.items?.[2] as AnyObj)?.hasChange),
    nc3: tick((form.inspect?.items?.[2] as AnyObj)?.noChange),
    note3: (form.inspect?.items?.[2] as AnyObj)?.note ?? "",
    ok3: tick((form.inspect?.items?.[2] as AnyObj)?.inspectorOpinion === "canUse"),
    ng3: tick((form.inspect?.items?.[2] as AnyObj)?.inspectorOpinion === "cannotUse"),
    ch4: tick((form.inspect?.items?.[3] as AnyObj)?.hasChange),
    nc4: tick((form.inspect?.items?.[3] as AnyObj)?.noChange),
    note4: (form.inspect?.items?.[3] as AnyObj)?.note ?? "",
    ok4: tick((form.inspect?.items?.[3] as AnyObj)?.inspectorOpinion === "canUse"),
    ng4: tick((form.inspect?.items?.[3] as AnyObj)?.inspectorOpinion === "cannotUse"),
    
    // Slide 19: Inspection item 5 (foundation)
    nc5: tick((form.inspect?.items?.[4] as AnyObj)?.noChange),
    ch5: tick((form.inspect?.items?.[4] as AnyObj)?.hasChange),
    note5: (form.inspect?.items?.[4] as AnyObj)?.note ?? "",
    ok5: tick((form.inspect?.items?.[4] as AnyObj)?.inspectorOpinion === "canUse"),
    ng5: tick((form.inspect?.items?.[4] as AnyObj)?.inspectorOpinion === "cannotUse"),
    opinion5: (form.inspect?.items?.[4] as AnyObj)?.opinion ?? "",
    
    // Slides 20-22: Matrix rows with checkbox columns (s8r*, s9r*)
    // Matrix 8 - structure/anchor inspection (rows 1-5, columns have/none/damage etc)
    s8r1: (form.matrix8 as AnyObj)?.rows?.[0]?.note ?? "",
    s8r1c1: tick((form.matrix8 as AnyObj)?.rows?.[0]?.have),
    s8r1c2: tick((form.matrix8 as AnyObj)?.rows?.[0]?.none),
    s8r1c3: tick((form.matrix8 as AnyObj)?.rows?.[0]?.hasDamage),
    s8r1c4: tick((form.matrix8 as AnyObj)?.rows?.[0]?.noDamage),
    s8r1c5: tick((form.matrix8 as AnyObj)?.rows?.[0]?.usable),
    s8r1c6: tick((form.matrix8 as AnyObj)?.rows?.[0]?.notUsable),
    s8r2: (form.matrix8 as AnyObj)?.rows?.[1]?.note ?? "",
    s8r3: (form.matrix8 as AnyObj)?.rows?.[2]?.note ?? "",
    s8r4: (form.matrix8 as AnyObj)?.rows?.[3]?.note ?? "",
    s8r5: (form.matrix8 as AnyObj)?.rows?.[4]?.note ?? "",
    
    // Matrix 9 - equipment inspection (electrical, lightning, others)
    // Row 1: Electrical system
    s9r1: (form.matrix9 as AnyObj)?.rows?.[0]?.note ?? "",
    s9r1c1: tick((form.matrix9 as AnyObj)?.rows?.[0]?.have),
    s9r1c2: tick((form.matrix9 as AnyObj)?.rows?.[0]?.none),
    s9r1c3: tick((form.matrix9 as AnyObj)?.rows?.[0]?.hasDamage),
    s9r1c4: tick((form.matrix9 as AnyObj)?.rows?.[0]?.noDamage),
    s9r1c5: tick((form.matrix9 as AnyObj)?.rows?.[0]?.usable),
    s9r1c6: tick((form.matrix9 as AnyObj)?.rows?.[0]?.notUsable),
    // Row 2: Lightning protection
    s9r2: (form.matrix9 as AnyObj)?.rows?.[1]?.note ?? "",
    s9r2c1: tick((form.matrix9 as AnyObj)?.rows?.[1]?.have),
    s9r2c2: tick((form.matrix9 as AnyObj)?.rows?.[1]?.none),
    s9r2c3: tick((form.matrix9 as AnyObj)?.rows?.[1]?.hasDamage),
    s9r2c4: tick((form.matrix9 as AnyObj)?.rows?.[1]?.noDamage),
    s9r2c5: tick((form.matrix9 as AnyObj)?.rows?.[1]?.usable),
    s9r2c6: tick((form.matrix9 as AnyObj)?.rows?.[1]?.notUsable),
    // Row 3: Other equipment
    s9r3: (form.matrix9 as AnyObj)?.rows?.[2]?.note ?? "",
    s9r3c1: tick((form.matrix9 as AnyObj)?.rows?.[2]?.have),
    s9r3c2: tick((form.matrix9 as AnyObj)?.rows?.[2]?.none),
    s9r3c3: tick((form.matrix9 as AnyObj)?.rows?.[2]?.hasDamage),
    s9r3c4: tick((form.matrix9 as AnyObj)?.rows?.[2]?.noDamage),
    s9r3c5: tick((form.matrix9 as AnyObj)?.rows?.[2]?.usable),
    s9r3c6: tick((form.matrix9 as AnyObj)?.rows?.[2]?.notUsable),
    s9r4: (form.matrix9 as AnyObj)?.rows?.[3]?.note ?? "",
    s9r5: (form.matrix9 as AnyObj)?.rows?.[4]?.note ?? "",
    s9r6: (form.matrix9 as AnyObj)?.rows?.[5]?.note ?? "",
    s9additionalNote: (form.matrix9 as AnyObj)?.additionalNote ?? "",
    
    // Slide 23: Summary rows with checkbox columns (sum1-5)
    sumRow1: (form.summary as AnyObj)?.rows?.[0]?.note ?? "",
    sum1ok: tick((form.summary as AnyObj)?.rows?.[0]?.usable),
    sum1notOk: tick((form.summary as AnyObj)?.rows?.[0]?.notUsable),
    sum1fixed: tick((form.summary as AnyObj)?.rows?.[0]?.fixed),
    sumRow2: (form.summary as AnyObj)?.rows?.[1]?.note ?? "",
    sum2ok: tick((form.summary as AnyObj)?.rows?.[1]?.usable),
    sum2notOk: tick((form.summary as AnyObj)?.rows?.[1]?.notUsable),
    sum2fixed: tick((form.summary as AnyObj)?.rows?.[1]?.fixed),
    sumRow3: (form.summary as AnyObj)?.rows?.[2]?.note ?? "",
    sum3ok: tick((form.summary as AnyObj)?.rows?.[2]?.usable),
    sum3notOk: tick((form.summary as AnyObj)?.rows?.[2]?.notUsable),
    sum3fixed: tick((form.summary as AnyObj)?.rows?.[2]?.fixed),
    sumRow4: (form.summary as AnyObj)?.rows?.[3]?.note ?? "",
    sum4ok: tick((form.summary as AnyObj)?.rows?.[3]?.usable),
    sum4notOk: tick((form.summary as AnyObj)?.rows?.[3]?.notUsable),
    sum4fixed: tick((form.summary as AnyObj)?.rows?.[3]?.fixed),
    sum5ok: tick((form.summary as AnyObj)?.rows?.[4]?.usable),
    sum5notOk: tick((form.summary as AnyObj)?.rows?.[4]?.notUsable),
    sum5fixed: tick((form.summary as AnyObj)?.rows?.[4]?.fixed),
    
    // Slides 26-35: Plan sections
    // Note: Convert objects to strings to avoid [object Object] in PPTX
    plan: {
      signTitle: form.report?.signTitle ?? form.general?.signName ?? "",
      scopeOfWork: String((form.plan as AnyObj)?.scopeOfWork ?? ""),
      planDescription: String((form.plan as AnyObj)?.planDescription ?? ""),
      inspectionDetails: String((form.plan as AnyObj)?.inspectionDetails ?? ""),
      guidelineStandard: String((form.plan as AnyObj)?.guidelineStandard ?? ""),
      frequencyNote: String((form.plan as AnyObj)?.frequencyNote ?? ""),
      freq: {
        structural: String((form.plan as AnyObj)?.frequencyPlan?.structural ?? ""),
        electrical: String((form.plan as AnyObj)?.frequencyPlan?.electrical ?? ""),
        lightning: String((form.plan as AnyObj)?.frequencyPlan?.lightning ?? ""),
        others: String((form.plan as AnyObj)?.frequencyPlan?.others ?? ""),
      },
      usability: {
        r1: String((form.plan as AnyObj)?.usabilityPlan?.structural ?? ""),
        r1cont: String((form.plan as AnyObj)?.usabilityPlan?.structuralCont ?? ""),
        r2: String((form.plan as AnyObj)?.usabilityPlan?.electrical ?? ""),
      },
      summaryPlan: String((form.plan as AnyObj)?.summaryPlan?.note ?? ""),
      summaryNote: String((form.plan as AnyObj)?.summaryNote ?? (form.plan as AnyObj)?.summaryPlan?.note ?? ""),
      signerName: String((form.plan as AnyObj)?.summaryPlan?.signerName ?? ""),
      signedDate: String((form.plan as AnyObj)?.summaryPlan?.signedDate ?? ""),
    },
  };
};

const fetchTemplate = async () => {
  // พยายามโหลดจาก API ก่อน แล้ว fallback ไป path public/templates
  let buf: ArrayBuffer | null = null;
  try {
    const res = await fetch(`/api/export/pptx/template/get?name=${encodeURIComponent("Form1-8.1.pptx")}`);
    if (res.ok) buf = await res.arrayBuffer();
  } catch (err) {
    console.warn("load template from api failed", err);
  }
  if (!buf) {
    const res = await fetch("/templates/Form1-8.1.pptx");
    if (!res.ok) throw new Error("ไม่พบไฟล์เทมเพลต Form1-8.1.pptx");
    buf = await res.arrayBuffer();
  }
  return buf;
};

const getImageModule = async () => {
  console.log("[getImageModule] Starting to load image module...");
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const module = await import("docxtemplater-image-module-free");
    console.log("[getImageModule] Module imported:", Object.keys(module));
    const ImageModule = module.default as any;
    console.log("[getImageModule] ImageModule constructor:", typeof ImageModule);
    
    const instance = new ImageModule({
      fileType: "pptx",
      getImage: async (tagValue: string) => {
        console.log("[ImageModule] getImage called with:", tagValue);
        if (!tagValue || tagValue === NO_PHOTO_TEXT) return null;
        try {
          // Build full URL from filename
          const url = tagValue.startsWith("http") ? tagValue : buildRemoteUrl(tagValue);
          console.log("[ImageModule] Fetching image from:", url);
          const resp = await fetch(url);
          if (!resp.ok) {
            console.warn("[ImageModule] Failed to fetch image:", resp.status);
            return null;
          }
          const buffer = await resp.arrayBuffer();
          console.log("[ImageModule] Image loaded, size:", buffer.byteLength);
          return buffer;
        } catch (err) {
          console.warn("[ImageModule] Error loading image:", err);
          return null;
        }
      },
      getSize: (_img: unknown, tagValue: string, tagName: string) => {
        console.log("[ImageModule] getSize for:", tagName);
        // Different sizes based on placeholder type
        if (tagName.includes("cover") || tagName.includes("12p1")) {
          return [400, 300]; // Cover image - larger
        }
        if (tagName.includes("signMain") || tagName.includes("12p3")) {
          return [350, 260]; // Main sign photo
        }
        if (tagName.includes("map") || tagName.includes("layout")) {
          return [300, 200]; // Map/layout images
        }
        return [200, 150]; // Default size for other photos
      },
    });
    console.log("[getImageModule] Image module instance created successfully");
    return instance;
  } catch (err) {
    console.warn("[getImageModule] Failed to load image module:", err);
    return null;
  }
};

export async function exportToPptxForm8_1(form: Partial<Form8_1Data> | null | undefined) {
  if (!form) {
    void showAlert("warning", "ไม่พบข้อมูลฟอร์ม");
    return;
  }
  showLoading(true);
  try {
    console.log("[exportToPptxForm8_1] Form data received:", {
      hasGeneral: !!form.general,
      hasReport: !!form.report,
      hasPhotos: !!form.photos,
      year: form.report?.year,
      signTitle: form.report?.signTitle,
      companyName: form.report?.companyName,
      generalAddress: form.general?.addressNo,
      ownerName: form.typeAndOwner?.owner?.name,
    });
    // Debug: log raw photos data from form
    console.log("[exportToPptxForm8_1] Raw form.photos:", JSON.stringify(form.photos, null, 2));
    const templateBuf = await fetchTemplate();
    const [{ default: PizZip }, { default: Docxtemplater }] = await Promise.all([
      import("pizzip"),
      import("docxtemplater"),
    ]);
    
    // NOTE: Image module disabled - doesn't work properly with PPTX
    // Images will be shown as filenames in text placeholders
    // TODO: Implement post-processing to embed actual images
    const imageModule = null; // await getImageModule();
    console.log("[exportToPptxForm8_1] Image module disabled (PPTX not supported)");
    
    const zip = new PizZip(templateBuf);
    const modules: any[] = [];
    if (imageModule) {
      modules.push(imageModule);
      console.log("[exportToPptxForm8_1] Image module added to Docxtemplater");
    } else {
      console.log("[exportToPptxForm8_1] Using text placeholders for images (filenames will be shown)");
    }
    
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: { start: "{{", end: "}}" },
      modules,
      parser: angularParser,
      // Return empty string for undefined placeholders instead of "undefined"
      nullGetter: (part: any) => {
        const tag = part.value || part.module;
        console.log("[Docxtemplater] Missing placeholder:", tag);
        return "";
      },
    });

    const dataCtx = buildDataContext(form as Form8_1Data);
    console.log("[exportToPptxForm8_1] Data context section 10:", {
      "10year": dataCtx["10year"],
      "10inst": dataCtx["10inst"],
      "10sign": dataCtx["10sign"],
      "10comp": dataCtx["10comp"],
      "10ownr": dataCtx["10ownr"],
      "10addr": dataCtx["10addr"],
    });
    console.log("[exportToPptxForm8_1] Checkbox values:", {
      hpY: dataCtx.hpY,
      hpN: dataCtx.hpN,
      planY: dataCtx.planY,
      planN: dataCtx.planN,
      hasPermitDocument: form.general?.hasPermitDocument,
      hasPlan: form.general?.hasPlan,
    });
    console.log("[exportToPptxForm8_1] Photos object:", dataCtx.photos);
    console.log("[exportToPptxForm8_1] 12p placeholders:", {
      "12p1": dataCtx["12p1"],
      "12p2": dataCtx["12p2"],
      "12p3": dataCtx["12p3"],
      "12p4": dataCtx["12p4"],
    });
    console.log("[exportToPptxForm8_1] Report object:", dataCtx.report);
    console.log("[exportToPptxForm8_1] All keys:", Object.keys(dataCtx).slice(0, 50));
    console.log("[exportToPptxForm8_1] Image placeholders (as text):", {
      coverImg: dataCtx.coverImg,
      signMainImg: dataCtx.signMainImg,
      headerImg: dataCtx.headerImg,
      mapImg: dataCtx.mapImg,
      layoutImg: dataCtx.layoutImg,
    });
    
    // Render template with data (sync - no image module)
    console.log("[exportToPptxForm8_1] Rendering template...");
    doc.render(dataCtx);
    console.log("[exportToPptxForm8_1] Template rendered successfully");

    const blob = doc.getZip().generate({
      type: "blob",
      mimeType:
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    });
    console.log("[exportToPptxForm8_1] Blob generated, size:", blob.size, "bytes");
    
    if (!blob || blob.size === 0) {
      throw new Error("Generated PPTX blob is empty");
    }
    
    const fileName = `Form8_1_${form.report?.signTitle ?? "report"}_${Date.now()}.pptx`;
    console.log("[exportToPptxForm8_1] Downloading as:", fileName);
    
    // trigger download (anchor), fallback file-saver/msSaveOrOpenBlob
    let downloaded = false;
    try {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      console.log("[exportToPptxForm8_1] Anchor click triggered");
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      downloaded = true;
    } catch (err) {
      console.warn("anchor download failed", err);
    }

    if (!downloaded) {
      // fallback file-saver หรือ msSave
      try {
        if (typeof (window as any).navigator?.msSaveOrOpenBlob === "function") {
          (window as any).navigator.msSaveOrOpenBlob(blob, fileName);
          downloaded = true;
        } else {
          const { saveAs } = await import("file-saver");
          saveAs(blob, fileName);
          downloaded = true;
        }
      } catch (err) {
        console.error("fallback download failed", err);
        throw err;
      }
    }
  } catch (err: any) {
    console.error(err);
    void showAlert("error", err?.message || "Export PPTX ไม่สำเร็จ");
  } finally {
    showLoading(false);
  }
}

/**
 * Export เฉพาะตาราง ข้อ 8 และ ข้อ 9 (ใช้ PptxGenJS)
 */
export async function exportTablesOnlyPptx(form: Partial<Form8_1Data> | null | undefined) {
  if (!form) {
    void showAlert("warning", "ไม่พบข้อมูลฟอร์ม");
    return;
  }
  showLoading(true);
  try {
    const { generateTableSlides } = await import("./pptxEnhancer");
    const blob = await generateTableSlides(form as Form8_1Data);
    
    const fileName = `Form8_1_Tables_${form.report?.signTitle ?? "report"}_${Date.now()}.pptx`;
    downloadBlob(blob, fileName);
    
    void showAlert("success", "Export ตารางสำเร็จ");
  } catch (err: any) {
    console.error(err);
    void showAlert("error", err?.message || "Export ตารางไม่สำเร็จ");
  } finally {
    showLoading(false);
  }
}

/**
 * Export เฉพาะรูปภาพ (ใช้ PptxGenJS)
 */
export async function exportPhotosOnlyPptx(form: Partial<Form8_1Data> | null | undefined) {
  if (!form) {
    void showAlert("warning", "ไม่พบข้อมูลฟอร์ม");
    return;
  }
  showLoading(true);
  try {
    const { generatePhotoSlides } = await import("./pptxEnhancer");
    const blob = await generatePhotoSlides(form as Form8_1Data);
    
    const fileName = `Form8_1_Photos_${form.report?.signTitle ?? "report"}_${Date.now()}.pptx`;
    downloadBlob(blob, fileName);
    
    void showAlert("success", "Export รูปภาพสำเร็จ");
  } catch (err: any) {
    console.error(err);
    void showAlert("error", err?.message || "Export รูปภาพไม่สำเร็จ");
  } finally {
    showLoading(false);
  }
}

/**
 * Export ทั้งหมด: Docxtemplater (ข้อความ) + PptxGenJS (รูป+ตาราง)
 * จะได้ 2 ไฟล์: 1) ไฟล์หลักจาก template 2) ไฟล์เสริมรูป+ตาราง
 */
export async function exportFullPptx(form: Partial<Form8_1Data> | null | undefined) {
  if (!form) {
    void showAlert("warning", "ไม่พบข้อมูลฟอร์ม");
    return;
  }
  showLoading(true);
  try {
    // 1. Export main PPTX from Docxtemplater
    console.log("[exportFullPptx] Generating main PPTX...");
    await exportToPptxForm8_1(form);
    
    // 2. Export tables and photos supplement
    console.log("[exportFullPptx] Generating supplement PPTX...");
    const { generateTableSlides, generatePhotoSlides } = await import("./pptxEnhancer");
    
    // Tables
    const tablesBlob = await generateTableSlides(form as Form8_1Data);
    const tablesFileName = `Form8_1_ตาราง_${form.report?.signTitle ?? "report"}_${Date.now()}.pptx`;
    downloadBlob(tablesBlob, tablesFileName);
    
    // Photos
    const photosBlob = await generatePhotoSlides(form as Form8_1Data);
    const photosFileName = `Form8_1_รูปภาพ_${form.report?.signTitle ?? "report"}_${Date.now()}.pptx`;
    downloadBlob(photosBlob, photosFileName);
    
    void showAlert("success", "Export สำเร็จ (3 ไฟล์: หลัก + ตาราง + รูปภาพ)");
  } catch (err: any) {
    console.error(err);
    void showAlert("error", err?.message || "Export ไม่สำเร็จ");
  } finally {
    showLoading(false);
  }
}

// Helper function to download blob
function downloadBlob(blob: Blob, fileName: string) {
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  } catch (err) {
    console.warn("Download failed:", err);
  }
}

/**
 * Export PPTX with preprocessor (2-step approach)
 * 
 * Step 1: Pre-process template - inject images using JSZip
 * Step 2: Use Docxtemplater to replace text placeholders
 * 
 * This approach allows images to be embedded properly in the PPTX
 */
export async function exportWithPreprocessor(form: Partial<Form8_1Data> | null | undefined) {
  if (!form) {
    void showAlert("warning", "ไม่พบข้อมูลฟอร์ม");
    return;
  }
  showLoading(true);
  const logs: string[] = [];
  
  try {
    logs.push(`[${new Date().toISOString()}] Starting 2-step export...`);
    
    // Step 1: Fetch original template
    logs.push("Fetching template...");
    const templateBuf = await fetchTemplate();
    logs.push(`Template loaded: ${templateBuf.byteLength} bytes`);
    
    // Step 2: Prepare photos for injection
    const photosToInject = preparePhotosForInjection(form);
    logs.push(`Photos to inject: ${photosToInject.length}`);
    
    // Step 3: Pre-process template (inject images)
    let processedBuf = templateBuf;
    if (photosToInject.length > 0) {
      logs.push("Pre-processing template with images...");
      const { preprocessForm8_1Photos } = await import("./pptxPreprocessor");
      const result = await preprocessForm8_1Photos(templateBuf, photosToInject);
      
      logs.push(...result.log);
      
      if (result.success) {
        processedBuf = result.buffer;
        logs.push("Pre-processing successful");
      } else {
        logs.push(`Pre-processing failed: ${result.error}`);
        logs.push("Continuing with original template...");
      }
    } else {
      logs.push("No photos to inject, using original template");
    }
    
    // Step 4: Use Docxtemplater to replace text placeholders
    logs.push("Loading Docxtemplater...");
    const [{ default: PizZip }, { default: Docxtemplater }] = await Promise.all([
      import("pizzip"),
      import("docxtemplater"),
    ]);
    
    const zip = new PizZip(processedBuf);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: { start: "{{", end: "}}" },
      parser: angularParser,
      nullGetter: (part: any) => {
        const tag = part.value || part.module;
        logs.push(`Missing placeholder: ${tag}`);
        return "";
      },
    });
    
    // Build data context
    const dataCtx = buildDataContext(form as Form8_1Data);
    logs.push(`Data context built with ${Object.keys(dataCtx).length} keys`);
    
    // Render
    logs.push("Rendering template...");
    doc.render(dataCtx);
    logs.push("Template rendered successfully");
    
    // Generate output
    const blob = doc.getZip().generate({
      type: "blob",
      mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    });
    logs.push(`Output generated: ${blob.size} bytes`);
    
    // Download
    const fileName = `Form8_1_${form.report?.signTitle ?? "report"}_${Date.now()}.pptx`;
    downloadBlob(blob, fileName);
    logs.push(`Downloaded as: ${fileName}`);
    
    // Log summary to console
    console.log("=== Export with Preprocessor Log ===");
    logs.forEach(l => console.log(l));
    
    void showAlert("success", "Export สำเร็จ (พร้อมรูปภาพ)");
    
  } catch (err: any) {
    console.error("Export failed:", err);
    console.log("=== Export Log (Error) ===");
    logs.forEach(l => console.log(l));
    void showAlert("error", err?.message || "Export PPTX ไม่สำเร็จ");
  } finally {
    showLoading(false);
  }
}

/**
 * Prepare photos from form data for injection
 */
function preparePhotosForInjection(form: Partial<Form8_1Data>): { 
  url: string; 
  slideNumber: number; 
  position?: { x: number; y: number; cx: number; cy: number } 
}[] {
  const photos: { url: string; slideNumber: number }[] = [];
  const p = form.photos;
  
  if (!p) return photos;
  
  // Define slide numbers for each photo type
  // These should match the actual template structure
  const EMU = 914400; // EMUs per inch
  
  // Cover photo - typically on first or second slide
  if (p.coverPhoto) {
    const url = extractPhotoUrl(p.coverPhoto);
    if (url) {
      photos.push({ 
        url, 
        slideNumber: 1,
        position: { x: 1 * EMU, y: 2 * EMU, cx: 4 * EMU, cy: 3 * EMU }
      } as any);
    }
  }
  
  // Main sign photo
  if (p.signMainPhoto) {
    const url = extractPhotoUrl(p.signMainPhoto);
    if (url) {
      photos.push({ 
        url, 
        slideNumber: 2,
        position: { x: 1 * EMU, y: 2 * EMU, cx: 5 * EMU, cy: 4 * EMU }
      } as any);
    }
  }
  
  // Set A photos (usually on specific photo slides)
  if (p.setAPhotos) {
    p.setAPhotos.forEach((photo, idx) => {
      const url = extractPhotoUrl(photo);
      if (url) {
        photos.push({ 
          url, 
          slideNumber: 27 + idx, // Adjust based on actual template
          position: { x: 1 * EMU, y: 1 * EMU, cx: 4 * EMU, cy: 3 * EMU }
        } as any);
      }
    });
  }
  
  // Set B photos
  if (p.setBPhotos) {
    p.setBPhotos.forEach((photo, idx) => {
      const url = extractPhotoUrl(photo);
      if (url) {
        photos.push({ 
          url, 
          slideNumber: 29 + idx, // Adjust based on actual template
          position: { x: 1 * EMU, y: 1 * EMU, cx: 4 * EMU, cy: 3 * EMU }
        } as any);
      }
    });
  }
  
  console.log("[preparePhotosForInjection] Photos prepared:", photos.length);
  return photos;
}

/**
 * Extract URL from photo item (handles various formats)
 */
function extractPhotoUrl(photo: PhotoItem | string | null | undefined): string | null {
  if (!photo) return null;
  
  if (typeof photo === "string") {
    return isRealImage(photo) ? buildRemoteUrl(photo) : null;
  }
  
  const obj = photo as Record<string, unknown>;
  const candidates = [obj.url, obj.src, obj.path, obj.filename];
  
  for (const val of candidates) {
    if (typeof val === "string" && isRealImage(val)) {
      return buildRemoteUrl(val);
    }
  }
  
  return null;
}





