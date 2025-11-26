export type YesNoNa = "yes" | "no" | "na";

export type Form8_1Cover = {
  placeName?: string;
  checkDate?: string; // YYYY-MM-DD
  inspectorName?: string;
  remarks?: string;
};

export type Form8_1General = {
  signName?: string;
  productName?: string; // ���ͼ�Ե�ѳ���ɳҷ���ҡ�������
  hasPermit?: boolean | null;
  permitNote?: string;
  hasPlan?: boolean | null;
  ageYears?: number | null;
  // section 1.2 extras
  hasPermitDocument?: boolean | null;  // เดิม permitDocAvailable
  permitIssuedDate?: string;           // YYYY-MM-DD
  hasOriginalPlan?: boolean | null;    // มีแบบแปลนเดิม
  missingOriginalPlan?: boolean | null; // เดิม missingPlan
  permitInfoUnknown?: boolean | null;  // เดิม noPermitInfo
  permitExempt?: boolean | null;       // เดิม exemptPermit
  approxBuddhistYear?: string;         // เดิม ageApproxBuddhistYear
  // address details for "ข้อมูลป้ายและสถานที่ตั้งป้าย"
  addressNo?: string;                  // เลขที่
  moo?: string;                        // หมู่ที่
  alley?: string;                      // ตรอก/ซอย
  road?: string;                       // ถนน
  subdistrict?: string;                // ตำบล/แขวง
  district?: string;                   // อำเภอ/เขต
  province?: string;                   // จังหวัด
  postalCode?: string;                 // รหัสไปรษณีย์
  phoneNo?: string;                    // เดิม phone
  fax?: string;                        // โทรสาร
  // sign size info
  size?: {
    width?: string;          // ความกว้างของแผ่นป้าย (เมตร)
    height?: string;         // ความสูงของแผ่นป้าย (เมตร)
    faces?: number | null;   // จำนวนด้านของป้าย (ด้าน)
    approxArea?: string;     // พื้นที่ป้ายโดยประมาณ (ตร.ม.)
    signStructureHeight?: string;// เดิม structureHeight
    note?: string;
  };
};

export type GeoPoint = { lat?: string; lng?: string };

export type Form8_1Location = {
  coordinate?: GeoPoint;
  mapImageFilename?: string; // เดิม mapImage
  layoutImageFilename?: string; // เดิม layoutImage
  mapImageLocal?: { file?: File | Blob; preview?: string; filename?: string };
  layoutImageLocal?: { file?: File | Blob; preview?: string; filename?: string };
};

export type PhotoItem = {
  url?: string;
  caption?: string;
  // local-only helpers for pending uploads
  localFile?: File | Blob;
  localPreview?: string;
  uploaded?: boolean;
};

export type Form8_1Photos = {
  coverPhoto?: PhotoItem; // เดิม hero
  gallery?: PhotoItem[]; // additional photos (unused generic)
  signMainPhoto?: PhotoItem;  // เดิม signMain
  setAPhotos?: PhotoItem[];    // เดิม setA
  setBPhotos?: PhotoItem[];    // เดิม setB
};

export type SignCategory =
  | "onGround"
  | "onRoof"
  | "onFacade"
  | "others";

// Installation type for the main header section
type InstallType =
  | "onGround"
  | "onRoofDeck"
  | "onRoof"
  | "onFacadePart"
  | "others";   // บนส่วนหนึ่งส่วนใดของอาคาร

export type PartyInfo = {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  taxId?: string;
  licenseNo?: string;
};

export type Form8_1TypeAndOwner = {
  categories: SignCategory[];
  owner?: PartyInfo;
  buildingOwner?: PartyInfo; // เจ้าของ/ผู้ครอบครองอาคารที่ติดตั้งป้ายอยู่ (กรณีติดตั้งบนอาคาร)
  designer?: PartyInfo;
  designerBuilding?: PartyInfo;
  otherNote?: string;
};

export type MaterialKind = "steel" | "wood" | "stainless" | "reinforcedConcrete" | "other";

export type Form8_1Materials = {
  structureKinds: MaterialKind[];
  surfaceMaterial?: string; // e.g. vinyl
  hasOpenings?: boolean | null; // existence of openings
  openingNote?: string;
  otherNote?: string;
  flagMaterial?: boolean;
  flagFaces?: boolean;
  flagOpening?: boolean;
  flagOther?: boolean;
};

export type Section3Opinion = "canUse" | "cannotUse" | "";
export type Section3Item = {
  key: string;            // "1".."7"
  title: string;          // ชื่อหัวข้อ
  noChange?: boolean;     // ไม่พบการเปลี่ยนแปลง/ต่อเติม เป็นต้น
  hasChange?: boolean;    // มีการเปลี่ยนแปลง (ให้กรอกรายละเอียด)
  changeDetailNote?: string; // เดิม details
  inspectorOpinion?: Section3Opinion; // เดิม opinion
  otherChecked?: boolean; // อื่น ๆ (โปรดระบุ)
  otherNote?: string;     // รายละเอียดอื่น ๆ
  // ฟิลด์สำหรับรูปแบบตารางตาม .bak (มี/ไม่มี + ใช้ได้/ใช้ไม่ได้ + หมายเหตุ + อื่น ๆ)
  wear?: "have" | "none";    // การชำรุดสึกหรอ (มี/ไม่มี)
  erosion?: "have" | "none"; // การขูดสลักกร่อน (มี/ไม่มี)
  damage?: "have" | "none";  // ความเสียหาย (มี/ไม่มี)
  note?: string;              // เดิม remark
  customName?: string;        // ชื่อสำหรับแถว "อื่น ๆ (โปรดระบุ)"
};

export type Form8_1Inspect = {
  items: Record<string, Section3Item>;
};

export type MatrixRow = {
  name: string;
  wear?: boolean;
  damage?: boolean;
  inspectorOpinion?: boolean; // pass/fail
  remark?: string;
};

export type Form8_1Matrix8 = { rows: MatrixRow[] };
export type Form8_1Matrix9 = { rows: MatrixRow[] };

// New structured matrices for ข้อ 8–9 (รุ่นมี checkbox มี/ไม่มี + radio + หมายเหตุ)
export type HaveNone = "have" | "none";
export type CanCannot = "can" | "cannot";
export type SMatrixRow = {
  active?: boolean;
  wear?: HaveNone;    // การชำรุดสึกหรอ (มี/ไม่มี)
  erosion?: HaveNone; // มี/ไม่มี (การชำรุดสึกหรอ)
  damage?: HaveNone;  // พบ/ไม่พบ (ความเสียหาย)
  opinion?: CanCannot; // ใช้ได้/ใช้ไม่ได้
  note?: string;       // หมายเหตุ
  customName?: string; // ชื่อรายละเอียดสำหรับรายการ "อื่น ๆ (โปรดระบุ)"
};
export type SMatrix = { rows: Record<string, SMatrixRow> };

export type Form8_1Summary = {
  structuralOk?: YesNoNa;
  electricalOk?: YesNoNa;
  lightningOk?: YesNoNa;
  othersOk?: YesNoNa;
  note?: string;
  // ตารางสรุปผลการตรวจ (ส่วนที่ 4)
  rows?: {
    id: number;
    title: string;
    result?: "ok" | "not_ok" | "fixed" | "";
    note?: string;
  }[];
};

export type Form8_1Signoff = {
  overallConclusion?: "minor" | "major" | "none";
  inspectorName?: string;
  inspectionDate?: string; // YYYY-MM-DD
  ownerOrRepresentative?: string;
  // หมายเหตุสำหรับหน้า 23–24
  signature?: string; // เดิม signatureName
  fixIssueSubject?: string; // เดิม fixIssue
  minorRemark?: string; // เดิม minorNote
};

// Main section 1: report header
export type Form8_1Report = {
  year?: string;
  inspectionScopeNote?: string; // เดิม scopeNote
  headerImageUrl?: string; // เดิม mainImageUrl
  headerNote?: string; // เดิม mainDetail
  headerImageLocal?: { file?: File | Blob; preview?: string; filename?: string };
  legalBasisLine1?: string;  // เดิม headerLine2
  legalBasisLine2?: string;  // เดิม headerLine3
  installType?: InstallType; // location type of sign installation
  signTitle?: string;        // e.g., ป้าย คูโบต้า (KUBOTA)
  companyName?: string;      // company or place name
  companyAddress?: string;   // เดิม address
};

// Main section 2: maintenance plan
export type FrequencyValue = "1m" | "4m" | "6m" | "1y" | "3y";
export type FrequencyRow = { name: string; frequency?: FrequencyValue; note?: string };
export type PlanFrequency = {
  structural?: FrequencyRow[]; // หัวข้อที่ 1 (9 รายการ)
  systems?: {
    electrical?: FrequencyRow[]; // 1) ไฟฟ้าแสงสว่างและไฟฟ้ากำลัง (5)
    lightning?: FrequencyRow[];  // 2) ป้องกันฟ้าผ่า (3)
    others?: FrequencyRow[];     // 3) อุปกรณ์อื่น (5)
  };
};
// ปรับตาม UI: ใช้ได้/ใช้ไม่ได้
export type UsabilityStatus = "usable" | "unusable";
export type DefectItem = {
  problemId?: string;
  problemName?: string;
  defectId?: string | number | null;
  defectName?: string;
  suggestion?: string;
  note?: string;
  photos?: { filename?: string; src?: string }[];
};
export type UsabilityRow = {
  name: string;
  status?: UsabilityStatus; // legacy (round 1)
  statusRound1?: UsabilityStatus;
  statusRound2?: UsabilityStatus;
  note?: string;
  defects?: DefectItem[];
};
export type PlanUsability = {
  structural?: UsabilityRow[];
  systems?: {
    electrical?: UsabilityRow[];
    lightning?: UsabilityRow[];
    others?: UsabilityRow[];
  };
};
// รักษาความเข้ากันได้เดิม
export type ResultStatus = UsabilityStatus;
export type ResultsRow = UsabilityRow;
export type PlanResults = PlanUsability;
// Main section 2.7: สรุปผลการตรวจบำรุงรักษา (สรุประดับผลรวม)
export type SummaryRow = ResultsRow & {
  statusRound1?: UsabilityStatus;
  statusRound2?: UsabilityStatus;
  fixed?: boolean;
}; // ช่อง "แก้ไขแล้ว" แบบอิสระ
export type PlanSummary = {
  rows?: SummaryRow[];
  extraNote?: string;
  signerName?: string;      // ลายชื่อ
  signerPrinted?: string;   // (พิมพ์ชื่อ)
  signedDate?: string;      // วันเดือนปีที่ตรวจ (YYYY-MM-DD หรือข้อความ)
};
export type Form8_1Plan = {
  // 2.1–2.4: เปลี่ยนชื่อคีย์ให้ตรง UI
  scopeOfWork?: string;        // เดิม scopeNote
  planDescription?: string;    // เดิม planOutline
  inspectionDetails?: string;  // เดิม details
  guidelineStandard?: string;  // เดิม guideline
  // 2.5
  frequencyText?: string;
  frequencyPlan?: PlanFrequency;
  // 2.6
  usabilityText?: string;
  usabilityPlan?: PlanUsability;
  // 2.7
  summaryText?: string;
  summaryPlan?: PlanSummary;
};

export type Form8_1Data = {
  dbId?: number;
  form_code?: string;
  report?: Form8_1Report;
  cover?: Form8_1Cover;
  general?: Form8_1General;
  location?: Form8_1Location;
  photos?: Form8_1Photos;
  typeAndOwner?: Form8_1TypeAndOwner;
  materials?: Form8_1Materials;
  inspect?: Form8_1Inspect;
  matrix8?: Form8_1Matrix8;
  matrix9?: Form8_1Matrix9;
  // ใหม่: เก็บข้อมูลตาราง ข้อ 8–9 แบบมีแถวเป็น record
  s8?: SMatrix;
  s9?: SMatrix;
  summary?: Form8_1Summary;
  signoff?: Form8_1Signoff;
  plan?: Form8_1Plan;
};

export const defaultForm8_1: Form8_1Data = {
  report: {
    legalBasisLine1: "ตามกฎกระทรวงว่าด้วยการควบคุมป้ายหรือสิ่งที่สร้างขึ้น สำหรับติดหรือตั้งป้าย",
    legalBasisLine2: "ตามกฎหมายว่าด้วยการควบคุมอาคาร พ.ศ. 2558",
  },
  cover: {},
  general: {},
  location: {},
  photos: { gallery: [] },
  typeAndOwner: { categories: [] },
  materials: { structureKinds: [] },
  inspect: { items: {} },
  matrix8: { rows: [] },
  matrix9: { rows: [] },
  s8: { rows: {} },
  s9: { rows: {} },
  summary: {},
  signoff: { overallConclusion: "none" },
  plan: {
    scopeOfWork:
      "ผู้รับผิดชอบดูแลป้ายต้องดำเนินการตรวจสอบและบำรุงรักษาป้ายและอุปกรณ์ประกอบของป้ายตามแผนที่ผู้ตรวจสอบอาคารกำหนด รวมถึงบันทึกผลการตรวจ/การซ่อมแซม/การทดสอบการทำงานลงในแบบฟอร์มที่กำหนด โดยยึดแนวทางตามคู่มือผู้ผลิต/ผู้ออกแบบ และข้อกำหนดทางกฎหมายที่เกี่ยวข้อง",
    planDescription:
      "กำหนดรอบการตรวจทั้งแบบตามระยะเวลาและแบบตามสภาพ เช่น รายเดือน/รายไตรมาส/รายปี พร้อมรายการตรวจหลัก (โครงสร้าง ระบบไฟฟ้า ระบบป้องกันฟ้าผ่า และอุปกรณ์ประกอบอื่น ๆ) ระบุผู้รับผิดชอบ/วิธีปฏิบัติ/เอกสารหลักฐาน และช่องทางรายงานผลให้ชัดเจน",
    inspectionDetails:
      "รายละเอียดการตรวจประกอบด้วย: 1) โครงสร้างหลักและฐานราก (สภาพทั่วไป รอยแตกร้าว การผุกร่อน จุดยึดโยง/ตัวยึด ฯลฯ) 2) ป้าย/ตัวอักษร/แผ่นป้าย (ความแข็งแรง ความเรียบร้อย) 3) ระบบไฟฟ้าแสงสว่างและกำลัง (การเดินสาย การป้องกัน กระแสไฟ รอยเชื่อมต่อ ฯลฯ) 4) ระบบป้องกันฟ้าผ่า (ถ้ามี) 5) ทางขึ้นลง/นั่งร้าน/ราวกันตก 6) ความสะอาดและความปลอดภัยโดยรอบ",
    guidelineStandard:
      "การตรวจและบำรุงรักษาต้องอ้างอิงมาตรฐานและข้อกำหนดที่เกี่ยวข้อง เช่น แนวทางผู้ตรวจสอบอาคาร คู่มือผู้ผลิต/ผู้ติดตั้ง มาตรฐานงานไฟฟ้า และข้อบัญญัติท้องถิ่น รวมถึงบันทึกหลักฐานการตรวจให้ครบถ้วน และต้องมีการทบทวนแผน/ผลการตรวจเป็นระยะเพื่อปรับปรุงความปลอดภัยของป้าย",
  },
};

// Preset rows for matrices (UI seeds)
export const presetMatrix8Rows: MatrixRow[] = [
  { name: "ฐานราก" },
  { name: "เสา/โครงสร้างหลัก" },
  { name: "คาน" },
  { name: "พื้น/ระเบียง" },
  { name: "ผนัง" },
  { name: "ราว กันตก" },
  { name: "บันได - ความแข็งแรง" },
  { name: "บันได - การยึดติดกับโครงสร้างและป้าย" },
  { name: "บันได - ราว กันตก" },
];

export const presetMatrix9Rows: MatrixRow[] = [
  { name: "ระบบไฟฟ้า - สาย/ตู้" },
  { name: "ระบบไฟฟ้า - อุปกรณ์" },
  { name: "ระบบไฟฟ้า - สายดิน" },
  { name: "ระบบไฟฟ้า - การป้องกัน" },
  { name: "ระบบไฟฟ้า - การบำรุงรักษา" },
  { name: "ระบบไฟฟ้า - ราว กันตก" },
  { name: "ทางเดินตรวจสอบ - ทางเดิน" },
  { name: "ทางเดินตรวจสอบ - พื้น/โครง" },
  { name: "ทางเดินตรวจสอบ - การบำรุงรักษา" },
  { name: "ทางเดินตรวจสอบ - ราว กันตก" },
  { name: "อุปกรณ์ประกอบ - บันได/นั่งร้าน" },
  { name: "อุปกรณ์ประกอบ - ชั้นวาง/ทางเดิน/CATWALK" },
  { name: "อุปกรณ์ประกอบ - ราว กันตก" },
];











