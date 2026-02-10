// utils/exportToDocx.ts
"use client";

import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    ImageRun,
    AlignmentType,
    Header,
    Footer,
    Table,
    TableRow,
    TableCell,
    WidthType,
    VerticalAlign,
    BorderStyle,
    PageNumber,
    ShadingType,
    NumberFormat,
    TextDirection,
    TabStopPosition,
} from "docx";

import { saveAs } from "file-saver";
import { showLoading } from "@/lib/loading";

// ✅ type-only (คงไว้เหมือนเดิม)
import type { SectionTwoForm } from "@/components/check-form/forms/form1-3/SectionTwoDetails";
import type { SectionThreeForm, Section8Row, Section9Row, YesNo, OkNg } from "@/components/check-form/forms/form1-3/SectionThreeDetails";
import type { SectionFourForm } from "@/components/check-form/forms/form1-3/SectionFourDetails";
import type { Section2_5Form } from "@/components/check-form/forms/form1-3/new_form/Section2_5Details";
import type { SectionSixForm, VisitKey } from "@/components/check-form/forms/form1-3/new_form/Section2_6Details";
import type { SectionSevenForm } from "@/components/check-form/forms/form1-3/new_form/Section2_7Details";

/* ===================== PAGE (A4) ===================== */
const cmToTwip = (cm: number) => Math.round((cm / 2.54) * 1440);

export const A4 = { width: cmToTwip(21), height: cmToTwip(29.7) };

export const MARGIN = {
    top: cmToTwip(2.0),
    bottom: cmToTwip(1.5),
    left: cmToTwip(2.0),
    right: cmToTwip(1.5),
};

const twipsToPx = (twips: number) => Math.floor((twips / 1440) * 96);
const CONTENT_WIDTH_PX = twipsToPx(A4.width - MARGIN.left - MARGIN.right);
const CONTENT_HEIGHT_PX = twipsToPx(A4.height - MARGIN.top - MARGIN.bottom);

const PROFIRE_LOGO_BYTES = await loadPublicAsPngBytes("/images/Logo_Profire.png");
const SHINARACHA_LOGO_BYTES = await loadPublicAsPngBytes("/images/Logo_Shinaracha.webp");

/* ===================== FONT / SIZE ===================== */
export const FONT_TH = "Angsana New";
const PT = (pt: number) => pt * 2; // docx = half-points
const LINE_10 = 240; // ระยะห่างบรรทัด 1.0

// ของจริงตามที่คุณให้ (หน้าปก)
const SIZE_NO = PT(18);
const SIZE_TITLE = PT(36);
const SIZE_22 = PT(22);

const AFTER_0 = 0;
const AFTER_S = 80;
const AFTER_M = 160;
const AFTER_L = 260;

/* ===================== INDENT HELPERS (ไว้ใช้ต่อในหน้าเนื้อหา) ===================== */
export const TAB = 720; // 0.5"
export const INDENT_1 = { left: 720 };
export const INDENT_2 = { left: 1440 };
export const INDENT_3 = { left: 2160 };
export const INDENT_4 = { left: 2880 };

/* ===================== URL HELPERS ===================== */
const buildRemoteCoverUrl = (name: string) =>
    `${process.env.NEXT_PUBLIC_N8N_UPLOAD_FILE}?name=${encodeURIComponent(name)}`;

/* ===================== IMAGE HELPERS ===================== */
/** โหลดรูปจาก public แล้วบังคับแปลงเป็น PNG bytes (Word รองรับชัวร์) */
async function loadPublicAsPngBytes(url: string): Promise<Uint8Array> {
    const img = new Image();
    img.src = url; // เช่น "/images/Logo_Profire.png" หรือ ".webp"
    img.crossOrigin = "anonymous";
    await img.decode();

    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0);

    const dataUrl = canvas.toDataURL("image/png");
    const res = await fetch(dataUrl);
    const ab = await res.arrayBuffer();
    return new Uint8Array(ab);
}

async function getImageBuffer(imageName: string): Promise<Uint8Array | undefined> {
    if (!imageName) return undefined; // ดักไว้ก่อนถ้าไม่มีชื่อรูป
    try {
        const url = buildRemoteCoverUrl(imageName);
        const res = await fetch(url);
        if (!res.ok) return undefined; // ถ้าโหลดไม่ได้ ให้คืนค่า undefined แทนที่จะ throw error
        const arrayBuffer = await res.arrayBuffer();
        return new Uint8Array(arrayBuffer);
    } catch (e) {
        console.error("Load image failed:", imageName, e);
        return undefined;
    }
}

/** โหลดรูปจาก n8n (cover) แล้วคืน PNG bytes + ขนาดจริง */
async function remoteFilenameToPngBytesAndSize(fileName: string): Promise<{
    bytes: Uint8Array;
    width: number;
    height: number;
}> {
    const url = buildRemoteCoverUrl(fileName);
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`โหลดรูป cover ไม่สำเร็จ: ${res.status}`);

    const blob = await res.blob();
    const objUrl = URL.createObjectURL(blob);

    try {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = objUrl;
        await img.decode();

        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0);

        const dataUrl = canvas.toDataURL("image/png");
        const pngRes = await fetch(dataUrl);
        const ab = await pngRes.arrayBuffer();

        return { bytes: new Uint8Array(ab), width: img.naturalWidth, height: img.naturalHeight };
    } finally {
        URL.revokeObjectURL(objUrl);
    }
}

/** โหลดรูปจาก public แล้วแปลงเป็น PNG + คืนขนาดจริง (ไว้คำนวณ ratio) */
async function loadPngBytesAndSize(url: string): Promise<{ bytes: Uint8Array; w: number; h: number }> {
    const img = new Image();
    img.src = url;
    img.crossOrigin = "anonymous";
    await img.decode();

    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0);

    const dataUrl = canvas.toDataURL("image/png");
    const res = await fetch(dataUrl);
    const ab = await res.arrayBuffer();

    return { bytes: new Uint8Array(ab), w: img.naturalWidth, h: img.naturalHeight };
}

/** ทำให้โลโก้ "สูงเท่ากัน" แต่ไม่บีบ/ยืด (คงอัตราส่วน) */
function fitToHeight(w: number, h: number, targetH: number) {
    const ratio = w / h;
    return { width: Math.round(targetH * ratio), height: targetH };
}

async function GetBranchName(job_id: string) {
    const res = await fetch("/api/auth/customer/get", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ function: "branchName", job_id }),
    });
    const r = await res.json();
    return r?.success && r?.data?.length ? (r.data[0]?.branch_name ?? "") : "";
}

/** ✅ Header แบบ “วางรูป + ข้อความ” ไม่มีตาราง ไม่มีกรอบ */
function buildReportHeader(isShinaracha: boolean) {
    const logoBytes = isShinaracha
        ? SHINARACHA_LOGO_BYTES
        : PROFIRE_LOGO_BYTES;

    const companyName = isShinaracha
        ? "Shinaracha Frotector Co., Ltd."
        : "Profire Inspector Co., Ltd.";

    return new Header({
        children: [
            new Table({
                width: { size: 96, type: WidthType.PERCENTAGE }, // 👈 ย่อเข้ามา
                indent: { size: 300, type: WidthType.DXA },     // 👈 กันชนขอบซ้าย
                borders: {
                    top: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                    bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                    left: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                    right: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                },
                rows: [
                    new TableRow({
                        height: { value: 480, rule: "auto" },
                        children: [
                            new TableCell({
                                verticalAlign: VerticalAlign.CENTER,
                                width: { size: 10, type: WidthType.PERCENTAGE },
                                margins: {
                                    top: 100,
                                    bottom: 100,
                                    left: 100,
                                    right: 100,
                                },
                                children: [
                                    new Paragraph({
                                        alignment: AlignmentType.CENTER,
                                        children: [
                                            new ImageRun({
                                                data: logoBytes,
                                                type: "png",
                                                transformation: { width: 30, height: 30 },
                                            }),
                                        ],
                                    }),
                                ],
                            }),
                            new TableCell({
                                verticalAlign: VerticalAlign.CENTER,
                                width: { size: 90, type: WidthType.PERCENTAGE },
                                margins: {
                                    top: 100,
                                    bottom: 100,
                                    left: 100,
                                    right: 100,
                                },
                                children: [
                                    new Paragraph({
                                        alignment: AlignmentType.LEFT,
                                        children: [
                                            new TextRun({
                                                text: companyName,
                                                bold: true,
                                                size: 36, // 18pt
                                            }),
                                        ],
                                    }),
                                ],
                            }),
                        ],
                    }),
                ],
            }),
        ],
    });
}

async function buildReportFooter(job_id: string) {
    const branchName = await GetBranchName(job_id);

    return new Footer({
        children: [
            new Table({
                width: { size: 96, type: WidthType.PERCENTAGE },
                indent: { size: 300, type: WidthType.DXA },
                borders: {
                    top: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                    bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                    left: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                    right: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                },
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({
                                width: { size: 70, type: WidthType.PERCENTAGE },
                                verticalAlign: VerticalAlign.CENTER,
                                children: [
                                    new Paragraph({
                                        children: [
                                            new TextRun({
                                                text: `Client : ${branchName}`,
                                                size: 32,
                                            }),
                                        ],
                                    }),
                                ],
                            }),
                            new TableCell({
                                width: { size: 30, type: WidthType.PERCENTAGE },
                                verticalAlign: VerticalAlign.CENTER,
                                children: [
                                    new Paragraph({
                                        alignment: AlignmentType.RIGHT,
                                        children: [
                                            new TextRun({
                                                text: "หน้า ",
                                                size: 32,
                                            }),
                                            new TextRun({
                                                children: [PageNumber.CURRENT],
                                                size: 32,
                                            }),
                                        ],
                                    }),
                                ],
                            }),
                        ],
                    }),
                ],
            }),
        ],
    });
}

export function buildCoverHeader(docNo: string) {
    return new Header({
        children: [
            new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { before: 0, after: 0 },
                children: [
                    new TextRun({
                        text: `No.${docNo}`,
                        bold: true,
                        font: FONT_TH,
                        size: PT(18),
                    }),
                ],
            }),
        ],
    });
}

async function loadFooterLogoBytes(isShinaracha: boolean): Promise<Uint8Array> {
    const logoUrl = isShinaracha
        ? "/images/Logo_Shinaracha.webp"
        : "/images/Logo_Profire.png";

    const res = await fetch(logoUrl);
    if (!res.ok) {
        throw new Error(`Cannot load logo: ${logoUrl}`);
    }

    const buffer = await res.arrayBuffer();
    return new Uint8Array(buffer);
}

/** ✅ scale รูปให้ “พอดีในกรอบ” (คุมทั้ง maxW + maxH) */
function fitToBox(w: number, h: number, maxW: number, maxH: number) {
    const rw = maxW / w;
    const rh = maxH / h;
    const r = Math.min(rw, rh, 1); // ไม่ขยายเกิน 1
    return {
        w: Math.max(1, Math.round(w * r)),
        h: Math.max(1, Math.round(h * r)),
    };
}

const textCell = (text: string, bold = false) =>
    new Paragraph({
        children: [
            new TextRun({
                text,
                bold,
                size: 26,
            }),
        ],
    });

const check = (val?: string, yes?: string) =>
    new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
            new TextRun({
                text: val === yes ? "✓" : "",
                size: 26,
            }),
        ],
    });
/* ===================== PARAGRAPH HELPERS (COVER) ===================== */
function pRightBold(text: string, size: number, after = AFTER_S) {
    return new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { before: 0, after, line: LINE_10, lineRule: "auto" },
        children: [new TextRun({ text, font: FONT_TH, size, bold: true })],
    });
}

function pCenterBold(text: string, size: number, after = AFTER_S) {
    return new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after, line: LINE_10, lineRule: "auto" },
        children: [new TextRun({ text, font: FONT_TH, size, bold: true })],
    });
}

function pCenterImage(bytes: Uint8Array, w: number, h: number, after = AFTER_M) {
    return new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after, line: LINE_10, lineRule: "auto" },
        children: [
            new ImageRun({
                data: bytes,
                type: "png",
                transformation: { width: w, height: h },
            }),
        ],
    });
}

function pSpacer(after = AFTER_M) {
    return new Paragraph({
        spacing: { before: 0, after, line: LINE_10, lineRule: "auto" },
        children: [new TextRun({ text: "" })],
    });
}

const headerCell = (text: string, colSpan = 1) =>
    new TableCell({
        columnSpan: colSpan,
        verticalAlign: VerticalAlign.CENTER,
        children: [
            new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text, bold: true })],
            }),
        ],
    });

const checkCell = (isChecked: boolean) =>
    new TableCell({
        verticalAlign: VerticalAlign.CENTER,
        children: [
            new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                    new TextRun({
                        text: isChecked ? "✓" : "", // หรือใช้ "P" กับ font Wingdings 2
                        font: "Angsana New",
                        size: 32,
                        bold: true,
                    }),
                ],
            }),
        ],
    });

const dashCell = (isDash: boolean) =>
    new TableCell({
        verticalAlign: VerticalAlign.CENTER,
        children: [
            new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                    new TextRun({
                        text: isDash ? "-" : "",
                        size: 32,
                    }),
                ],
            }),
        ],
    });

const createRowS4 = (index: string, label: string, data: any, defaultNoteIfNone: string = "") => {
    const status = data?.status || "none";
    let note = data?.note || "";

    if (status === "none" && !note && defaultNoteIfNone) {
        note = defaultNoteIfNone;
    }

    return new TableRow({
        children: [
            // 1. ลำดับ
            new TableCell({
                verticalAlign: VerticalAlign.CENTER,
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: index, size: 32 })] })],
            }),
            // 2. รายการตรวจสอบ
            new TableCell({
                verticalAlign: VerticalAlign.CENTER,
                children: [new Paragraph({ children: [new TextRun({ text: label, size: 32 })] })],
            }),
            // 3. ใช้ได้
            status === 'ok' ? checkCell(true) : (status === 'none' ? dashCell(true) : checkCell(false)),
            // 4. ใช้ไม่ได้
            status === 'ng' ? checkCell(true) : (status === 'none' ? dashCell(true) : checkCell(false)),
            // 5. มีการแก้ไขแล้ว
            status === 'fixed' ? checkCell(true) : (status === 'none' ? dashCell(true) : checkCell(false)),
            // 6. หมายเหตุ
            new TableCell({
                verticalAlign: VerticalAlign.CENTER,
                children: [new Paragraph({ children: [new TextRun({ text: note, size: 28 })] })],
            }),
        ],
    });
};

/** ✅ โลโก้ 2 รูปมุมขวาล่าง ขนาดเท่ากัน คั่น ~1px */
async function pBottomRightLogos(isShinaracha: boolean) {
    const logoPath = isShinaracha
        ? "/images/Logo_Shinaracha.webp"
        : "/images/Logo_Profire.png";

    const qrPath = isShinaracha
        ? "/images/Logo_qr_snr.png"
        : "/images/Logo_qr_pfi.png";

    const [logoBytes, qrBytes] = await Promise.all([
        loadPublicAsPngBytes(logoPath),
        loadPublicAsPngBytes(qrPath),
    ]);

    // ✅ ขนาดเท่ากัน (ปรับได้)
    const ICON = { width: 58, height: 58 };

    return new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { before: 0, after: 0, line: LINE_10, lineRule: "auto" },
        children: [
            new ImageRun({ data: logoBytes, type: "png", transformation: ICON }),

            // ✅ ช่องว่างแบบบางมาก ~ 1px (hair space)
            new TextRun({ text: "\u200A", font: FONT_TH, size: 2 }),

            new ImageRun({ data: qrBytes, type: "png", transformation: ICON }),
        ],
    });
}

const imageCell = (buffer?: Uint8Array) =>
    new TableCell({
        borders: {
            top: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE },
        },
        children: [
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 120, after: 120 },
                children: buffer // เช็คว่ามี buffer ไหม
                    ? [
                        new ImageRun({
                            data: buffer, // ตรงนี้รับ Uint8Array ได้เลย
                            type: "png",
                            transformation: {
                                width: 260,
                                height: 160,
                            },
                        }),
                    ]
                    : [], // ถ้าไม่มีรูป ใส่ array ว่าง (ไม่แสดงอะไร)
            }),
        ],
    });

export async function buildCoverFooter(isShinaracha: boolean) {
    const logos = await pBottomRightLogos(isShinaracha);

    return new Footer({
        children: [logos],
    });
}

function section8GroupRow(index: string | null, title: string): TableRow {
    return new TableRow({
        children: [
            new TableCell({
                children: [textCell(index ?? "", true)],
            }),
            new TableCell({
                columnSpan: 10,
                children: [textCell(title, true)],
            }),
        ],
    });
}

const normalize = (val?: string) =>
    val?.toString().trim().toUpperCase();

const checkCellByValue = (
    value: string | undefined,
    expected: string
) =>
    new TableCell({
        verticalAlign: VerticalAlign.CENTER,
        children: [
            new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                    new TextRun({
                        text:
                            normalize(value) === normalize(expected)
                                ? "✓"
                                : "",
                        bold: true,
                        size: 26,
                    }),
                ],
            }),
        ],
    });

const yesCell = (value?: YesNo) => checkCellByValue(value, "YES");
const noCell = (value?: YesNo) => checkCellByValue(value, "NO");

const okCell = (value?: OkNg) => checkCellByValue(value, "OK");
const ngCell = (value?: OkNg) => checkCellByValue(value, "NG");

function section8ItemRow(
    index: string,
    label: string,
    data?: Section8Row,
    showIndex = false
): TableRow {
    return new TableRow({
        children: [
            // ลำดับ
            new TableCell({
                children: [textCell(showIndex ? index : "")],
            }),

            // รายการ
            new TableCell({
                children: [
                    textCell(
                        data?.labelExtra
                            ? `${label} : ${data.labelExtra}`
                            : label
                    ),
                ],
            }),

            // มี / ไม่มี (exist)
            yesCell(data?.exist),
            noCell(data?.exist),

            // การชำรุดสึกหรอ
            yesCell(data?.wear),
            noCell(data?.wear),

            // ความเสียหาย
            yesCell(data?.damage),
            noCell(data?.damage),

            // ความเห็นผู้ตรวจสอบ
            okCell(data?.stability),
            ngCell(data?.stability),

            // หมายเหตุ
            new TableCell({
                children: [textCell(data?.note || "-")],
            }),
        ],
    });
}

function section9ItemRow(
    index: string,
    label: string,
    data?: Section8Row,
    showIndex = false
): TableRow {
    return new TableRow({
        children: [
            // ลำดับ
            new TableCell({
                children: [textCell(showIndex ? index : "")],
            }),

            // รายการ
            new TableCell({
                children: [
                    textCell(
                        data?.labelExtra
                            ? `${label} : ${data.labelExtra}`
                            : label
                    ),
                ],
            }),

            // มี / ไม่มี (exist)
            yesCell(data?.exist),
            noCell(data?.exist),

            // การชำรุดสึกหรอ
            yesCell(data?.wear),
            noCell(data?.wear),

            // ความเสียหาย
            yesCell(data?.damage),
            noCell(data?.damage),

            // ความเห็นผู้ตรวจสอบ
            okCell(data?.stability),
            ngCell(data?.stability),

            // หมายเหตุ
            new TableCell({
                children: [textCell(data?.note || "-")],
            }),
        ],
    });
}

// ✅ ขึ้นหน้าใหม่ (Page Break)
export function pageBreak(after: number = 0) {
    return new Paragraph({
        spacing: { before: 0, after },
        children: [],
        pageBreakBefore: true,
    });
}
/* ===================== TYPES ===================== */
export type FormDataLite = {
    id?: number | null;
    job_id?: string;
    equipment_id?: string;
    form_code?: string;
    cover?: File;
    coverfilename?: string;

    placeName?: string;

    sectionTwo?: Partial<SectionTwoForm>;
    sectionThree?: Partial<SectionThreeForm>;
    sectionFour?: Partial<SectionFourForm>;
    section2_5?: Partial<Section2_5Form>;
    section2_6?: Partial<SectionSixForm>;
    section2_7?: Partial<SectionSevenForm>;

    // เพิ่มไว้เผื่อกำหนดเอง (ถ้าไม่ส่งมา จะใช้ default)
    docNo?: string;         // "DTT-01"
    reportYearBE?: number;  // 2568
    coverType?: string;
    coverName?: string;
    coverCompany?: string;
    coverAddress?: string;
};

export const fetchEquipmentData = async (equipmentId: string) => {
    if (!equipmentId) return null;
    try {
        const res = await fetch("/api/auth/forms/get", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                function: "viewEq",
                equipment_id: equipmentId,
            }),
        });

        const data = await res.json();
        if (data.success && data.data) {
            return data.data; // ส่งค่ากลับไป
        }
    } catch (err) {
        console.error("Error fetching equipment data:", err);
        return null;
    }
    return null;
};
/* ===================== EXPORT ===================== */
export async function exportToDocx(roundCount: number, isShinaracha: boolean, formData: FormDataLite) {
    showLoading(true);

    try {
        const apiData = await fetchEquipmentData(formData.equipment_id!);
        const api = apiData ?? {};
        const s2 = formData.sectionTwo ?? {};
        const s3 = formData.sectionThree ?? { items: {} };
        const section8: Record<string, Section8Row> = s3.section8 ?? {};
        const section9: Record<string, Section9Row> = s3.section9 ?? {};
        const s4 = formData.sectionFour || {};
        const s2_5 = formData.section2_5 || {};
        const s2_6 = formData.section2_6 || {};

        let selectedType = "-";
        if (s2.typeGround) selectedType = "ป้ายที่ติดตั้งบนพื้นดิน";
        else if (s2.typeRooftop) selectedType = "ป้ายบนดาดฟ้าอาคาร";
        else if (s2.typeOnRoof) selectedType = "ป้ายบนหลังคา";
        else if (s2.typeOnBuilding) selectedType = "ป้ายบนส่วนหนึ่งส่วนใดของอาคาร";
        else if (s2.typeOtherChecked) selectedType = s2.typeOther || "อื่นๆ";

        const docNo = formData.docNo ?? "XXX-XX";
        const reportYearBE = formData.reportYearBE ?? (new Date().getFullYear() + 543);

        const lawLine1 =
            "ตามกฎกระทรวงว่าด้วยการควบคุมป้ายหรือสิ่งที่สร้างขึ้น สำหรับติดหรือตั้งป้าย";
        const lawLine2 = "ตามกฎหมายว่าด้วยการควบคุมอาคาร พ.ศ. 2558";

        const coverType = formData.coverType ?? selectedType;
        const coverName = formData.coverName ?? s2.productText ?? "-";

        const getVal = (s2Val: string | undefined | null, apiVal: string | undefined | null) => {
            const v = s2Val || apiVal; // ถ้า s2 มีค่าใช้ s2, ถ้าไม่มีใช้ api
            if (!v || v.trim() === "" || v === "-") return ""; // ถ้าเป็นค่าว่างหรือ "-" ให้ส่งกลับเป็น empty string
            return v;
        };

        const addrNo = getVal(s2.ownerNo, api.owner_address_no);
        const addrMoo = getVal(s2.ownerMoo, api.owner_moo);
        const addrAlley = getVal(s2.ownerAlley, api.owner_alley); // ระวัง: api field ชื่อ owner_alley (เช็คจาก json)
        const addrRoad = getVal(s2.ownerRoad, api.owner_road);
        const addrSub = getVal(s2.ownerSub, api.owner_sub_district_name);
        const addrDist = getVal(s2.ownerDist, api.owner_district_name);
        const addrProv = getVal(s2.ownerProv, api.owner_province_name);
        const addrZip = getVal(s2.ownerZip, api.owner_zipcode);

        const joinAddr = (...parts: (string | undefined | null)[]) => {
            return parts.filter(p => p && p.trim() !== "" && p !== "-").join(" ");
        };

        const generatedAddress = joinAddr(
            addrNo,
            addrMoo ? `หมู่ ${addrMoo}` : "",
            addrAlley ? `ซอย ${addrAlley}` : "",
            addrRoad ? `ถนน ${addrRoad}` : "",
            addrSub ? `ตำบล/แขวง ${addrSub}` : "",
            addrDist ? `อำเภอ/เขต ${addrDist}` : "",
            addrProv ? `จังหวัด ${addrProv}` : "",
            addrZip
        );
        const coverAddress = formData.coverAddress ?? (generatedAddress || "-");

        // --- cover image ---
        let coverImage: { bytes: Uint8Array; width: number; height: number } | null = null;
        if (formData.coverfilename) {
            coverImage = await remoteFilenameToPngBytesAndSize(formData.coverfilename);
        }

        // ✅ ลดรูปกลางลงอีก + กันพื้นที่เผื่อโลโก้มุมขวาล่าง
        // (ยิ่งเลข reserved มาก รูปยิ่งเล็กลง และเหลือที่ด้านล่างมากขึ้น)
        const reservedPxForTextAndBottom = 560;

        const maxImgW = Math.min(CONTENT_WIDTH_PX, 460); // ✅ เล็กลงจากเดิม
        const maxImgH = Math.max(160, CONTENT_HEIGHT_PX - reservedPxForTextAndBottom);

        const fitted = coverImage
            ? fitToBox(coverImage.width, coverImage.height, maxImgW, maxImgH)
            : null;

        const coverChildren: Paragraph[] = [
            pCenterBold(`รายงานผลการตรวจสอบป้าย ปี ${reportYearBE}`, SIZE_TITLE, AFTER_M),

            pCenterBold(lawLine1, SIZE_22, AFTER_0),
            pCenterBold(lawLine2, SIZE_22, AFTER_M),

            pSpacer(AFTER_S),

            ...(coverImage && fitted
                ? [pCenterImage(coverImage.bytes, fitted.w, fitted.h, AFTER_M)]
                : [pSpacer(AFTER_L)]),

            new Paragraph({
                spacing: {
                    after: LINE_10, // 👈 Enter 1 ครั้ง
                },
            }),

            // ข้อความใต้รูป
            pCenterBold(coverType, SIZE_22, AFTER_0),
            pCenterBold(coverName, SIZE_22, AFTER_0),
            // pCenterBold(coverCompany, SIZE_22, AFTER_0),
            pCenterBold(coverAddress, SIZE_22, AFTER_0),
        ];

        const DOTS = "..............................";

        const valueOrDots = (value?: string | null, dots = DOTS) =>
            value && value.trim() !== "" ? value : dots;

        const valueOrDash = (v?: string) => v && v.trim() ? v : "-";

        const CHECK = (v?: boolean) => (v ? "☑" : "☐");
        const V = (v?: string) => (v && v.trim() !== "" ? v : "-");
        const v = (x?: string) => x?.trim() || "-";
        const vs = (x?: string | null) => x?.trim() || "-";
        const vr = (val?: string | null) =>
            val && val.trim() !== ""
                ? val
                : ".................................................................";

        const summary: any = s4.summary || {};
        const opinion = s4.opinion || {};
        const dayStr = opinion.day && opinion.day !== "-" ? opinion.day : "....";
        const monthStr = opinion.month && opinion.month !== "-" ? opinion.month : "....................";
        const yearStr = opinion.year && opinion.year !== "-" ? opinion.year : ".........";
        const dateString = `${dayStr} ${monthStr} ${yearStr}`;

        const compName = s2?.ownerName || opinion.companyName || "..................................................................";
        const sName = s2?.signName || "..................................................................";

        const inspectorName = opinion.inspectorPrintedName && opinion.inspectorPrintedName !== "-"
            ? opinion.inspectorPrintedName
            : "..................................................................";

        const ownerNamePrint = opinion.ownerName && opinion.ownerName !== "-"
            ? opinion.ownerName
            : "..................................................................";

        const tableS4 = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
                top: { style: BorderStyle.SINGLE, size: 1 },
                bottom: { style: BorderStyle.SINGLE, size: 1 },
                left: { style: BorderStyle.SINGLE, size: 1 },
                right: { style: BorderStyle.SINGLE, size: 1 },
                insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
                insideVertical: { style: BorderStyle.SINGLE, size: 1 },
            },
            rows: [
                // --- Header Row 1 (Merge) ---
                new TableRow({
                    children: [
                        new TableCell({
                            columnSpan: 6,
                            verticalAlign: VerticalAlign.CENTER,
                            children: [
                                new Paragraph({
                                    children: [
                                        new TextRun({
                                            text: "สรุปผลการตรวจสอบป้ายหรือสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย และอุปกรณ์ประกอบของป้าย",
                                            bold: true,
                                            size: 32,
                                        }),
                                    ],
                                }),
                            ],
                        }),
                    ],
                }),
                // --- Header Row 2 ---
                new TableRow({
                    children: [
                        new TableCell({ width: { size: 5, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "ลำดับ", bold: true, size: 32 })] })] }),
                        new TableCell({ width: { size: 45, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "รายการตรวจสอบ", bold: true, size: 32 })] })] }),
                        new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "ใช้ได้", bold: true, size: 32 })] })] }),
                        new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "ใช้ไม่ได้", bold: true, size: 32 })] })] }),
                        new TableCell({ width: { size: 15, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "มีการแก้ไขแล้ว", bold: true, size: 32 })] })] }),
                        new TableCell({ width: { size: 15, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "หมายเหตุ", bold: true, size: 32 })] })] }),
                    ],
                }),
                // --- Data Rows ---
                createRowS4("1", "สิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย", summary.row1),
                createRowS4("2", "แผ่นป้าย", summary.row2),
                createRowS4("3", "ระบบไฟฟ้าแสงสว่างและระบบไฟฟ้ากำลัง", summary.row3),
                createRowS4("4", "ระบบป้องกันฟ้าผ่า (ถ้ามี)", summary.row4, "- ไม่มี"),
                createRowS4("5", "ระบบอุปกรณ์ประกอบอื่นๆ (ถ้ามี)", summary.row5, "- ไม่มี"),
            ],
        });

        const HEADER_FROM_TOP = Math.round(MARGIN.top * 0.55);
        // ✅ เพิ่ม = header ลงมา / ลด = header ขึ้นไป
        const coverHeader = buildCoverHeader(docNo);
        const coverFooter = await buildCoverFooter(isShinaracha);

        const reportHeader = await buildReportHeader(isShinaracha);
        const reportFooter = await buildReportFooter(formData.job_id || "");
        const footerLogoBytes = await loadFooterLogoBytes(isShinaracha);
        const spacer = (cm: number) =>
            new Paragraph({ spacing: { before: cmToTwip(cm) } });

        const [
            imageBuffer,
            imageBuffer1,
            imageBuffer2,
            imageBuffer3,
            imageBuffer4,
            imageBuffer5,
            imageBuffer6,
            imageBuffer7,
            imageBuffer8,
            imageBuffer9,
            imageBuffer10,
            imageBuffer11,
            imageBuffer12,
            imageBuffer13,
            imageBuffer14
        ] = await Promise.all([
            getImageBuffer(s2?.mapSketch as string),
            getImageBuffer(s2?.shapeSketch1 as string),
            getImageBuffer(s2?.shapeSketch as string),
            getImageBuffer(s2?.photosFront as string),
            getImageBuffer(s2?.photosSide as string),
            getImageBuffer(s2?.photosBase as string),
            getImageBuffer(s2?.photosFront1 as string),
            getImageBuffer(s2?.photosSide1 as string),
            getImageBuffer(s2?.photosBase1 as string),
            getImageBuffer(s2?.photosFront2 as string),
            getImageBuffer(s2?.photosSide2 as string),
            getImageBuffer(s2?.photosBase2 as string),
            getImageBuffer(s2?.photosFront3 as string),
            getImageBuffer(s2?.photosSide3 as string),
            getImageBuffer(s2?.photosBase3 as string),
        ]);

        const CHECK_ITEMS = [
            {
                title: "การตรวจสอบการต่อเติมดัดแปลงปรับปรุงขนาดของป้ายหรือสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย",
                noText: "ไม่พบการต่อเติม ดัดแปลง ปรับปรุงขนาด",
                hasText: "มีการต่อเติม ดัดแปลง ปรับปรุงขนาดของป้าย",
            },
            {
                title: "การตรวจสอบการเปลี่ยนแปลงน้ำหนักของแผ่นป้าย",
                noText: "ไม่พบการเปลี่ยนแปลงน้ำหนัก",
                hasText: "มีการเปลี่ยนแปลงน้ำหนัก",
            },
            {
                title: "การตรวจสอบการเปลี่ยนแปลงวัสดุของป้ายหรือสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย",
                noText: "ไม่พบการเปลี่ยนแปลงวัสดุ",
                hasText: "มีการเปลี่ยนแปลงวัสดุ",
            },
            {
                title: "การตรวจสอบการชำรุดสึกหรอของป้ายหรือสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย",
                noText: "ไม่พบการชำรุดสึกหรอ",
                hasText: "มีการชำรุดสึกหรอ",
            },
            {
                title: "การตรวจสอบการวิบัติของสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย",
                noText: "ไม่พบการวิบัติ **",
                hasText: "มีการวิบัติ",
                note: "** การวิบัติ หมายถึง การสูญเสียสภาพการรับน้ำหนักหรือการใช้งานตามวัตถุประสงค์",
            },
            {
                title: "การตรวจสอบความมั่นคงแข็งแรงของโครงสร้างและฐานรากของสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย (กรณีป้ายที่ติดตั้งบนพื้นดิน)",
                noText: "ไม่พบการทรุดตัว **",
                hasText: "มีการทรุดตัว",
                note: "** การทรุดตัว หมายถึง การเคลื่อนตัวลงของโครงสร้างหรือฐานราก",
            },
            {
                title: "การตรวจสอบความมั่นคงแข็งแรงของอาคารที่ติดตั้งป้าย (กรณีป้ายบนหลังคา หรือส่วนใดของอาคาร)",
                noText: "ไม่พบการทรุดตัว **",
                hasText: "มีการทรุดตัว",
                note: "** การทรุดตัว หมายถึง การเคลื่อนตัวลงของอาคาร",
            },
        ];

        const SECTION8_CONFIG = [
            {
                index: "(1)",
                title: "สิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย",
                rows: [
                    { type: "item", label: "ฐานราก", key: "s8-1-foundation" },
                    { type: "item", label: "การเชื่อมยึดกับฐานรากหรืออาคาร", key: "s8-1-anchor" },
                    { type: "item", label: "ชิ้นส่วน", key: "s8-1-part" },

                    { type: "group", label: "รอยต่อ" },
                    { type: "item", label: "สลักเกลียว", key: "s8-1-bolt" },
                    { type: "item", label: "การเชื่อม", key: "s8-1-weld" },
                    { type: "item", label: "อื่น ๆ (โปรดระบุ)", key: "s8-1-joint-other" },

                    { type: "item", label: "สลิง หรือสายยึด", key: "s8-1-sling" },
                    { type: "item", label: "บันไดขึ้นลง", key: "s8-1-ladder" },
                    { type: "item", label: "ราวจับ หรือราวกันตก", key: "s8-1-rail" },
                    { type: "item", label: "CATWALK", key: "s8-1-catwalk" },
                    { type: "item", label: "อื่น ๆ (โปรดระบุ)", key: "s8-1-other" },
                ],
            },
            {
                index: "(2)",
                title: "แผ่นป้าย",
                rows: [
                    { type: "item", label: "สภาพของแผ่นป้าย", key: "s8-2-panel" },
                    { type: "item", label: "สภาพการยึดติดกับโครงสร้างรับป้าย", key: "s8-2-fix" },
                    { type: "item", label: "อื่น ๆ (โปรดระบุ)", key: "s8-2-other" },
                ],
            },
        ] as const;

        const SECTION9_CONFIG = [
            {
                index: "(1)",
                title: "ระบบไฟฟ้าแสงสว่าง และระบบไฟฟ้ากำลัง",
                rows: [
                    { type: "item", label: "โคมไฟฟ้า หรือหลอดไฟ", key: "s9-1-lamp" },
                    { type: "item", label: "ท่อสาย", key: "s9-1-conduit" },
                    { type: "item", label: "อุปกรณ์ควบคุม", key: "s9-1-control" },
                    { type: "item", label: "การต่อลงดิน", key: "s9-1-ground" },
                    {
                        type: "item",
                        label: "ตรวจบันทึกการบำรุงรักษา พบการบำรุงรักษาตามคาบเวลากำหนด",
                        key: "s9-1-maint",
                    },
                    { type: "item", label: "อื่น ๆ (โปรดระบุ)", key: "s9-1-other" },
                ],
            },
            {
                index: "(2)",
                title: "ระบบป้องกันฟ้าผ่า (ถ้ามี)",
                rows: [
                    { type: "item", label: "ตัวนำล่อฟ้า", key: "s9-2-air" },
                    { type: "item", label: "ตัวนำต่อลงดิน", key: "s9-2-earth" },
                    { type: "item", label: "รากสายดิน", key: "s9-2-down" },
                    { type: "item", label: "จุดต่อประสานศักย์", key: "s9-2-bond" },
                    {
                        type: "item",
                        label: "ตรวจบันทึกการบำรุงรักษา พบการบำรุงรักษาตามคาบเวลากำหนด",
                        key: "s9-2-maint",
                    },
                    { type: "item", label: "อื่น ๆ (โปรดระบุ)", key: "s9-2-other" },
                ],
            },
            {
                index: "(3)",
                title: "ระบบอุปกรณ์ประกอบอื่น ๆ (ถ้ามี)",
                rows: [
                    { type: "item", label: "สลิง หรือสายยึด", key: "s9-3-sling" },
                    { type: "item", label: "บันไดขึ้นลง", key: "s9-3-ladder" },
                    { type: "item", label: "ราวจับ หรือราวกันตก", key: "s9-3-rail" },
                    { type: "item", label: "CATWALK", key: "s9-3-catwalk" },
                    { type: "item", label: "อื่น ๆ (โปรดระบุ)", key: "s9-3-other" },
                ],
            },
        ] as const;

        const section8Rows: TableRow[] = [];
        SECTION8_CONFIG.forEach(group => {
            // หัวกลุ่ม (1) / (2)
            section8Rows.push(section8GroupRow(group.index, group.title));

            group.rows.forEach(row => {
                if (row.type === "group") {
                    section8Rows.push(section8GroupRow(null, row.label));
                } else {
                    section8Rows.push(
                        section8ItemRow(
                            group.index,
                            `- ${row.label}`,
                            section8[row.key],
                            false
                        )
                    );
                }
            });
        });

        const section9Rows: TableRow[] = [];
        SECTION9_CONFIG.forEach(group => {
            // หัวกลุ่ม (1) / (2) / (3)
            section9Rows.push(section8GroupRow(group.index, group.title));

            group.rows.forEach(row => {
                // ✅ item ต้องใช้ section9ItemRow
                section9Rows.push(
                    section9ItemRow(
                        "",                 // ไม่โชว์ index ซ้ำ
                        `- ${row.label}`,
                        section9[row.key],
                        false
                    )
                );
            });
        });

        const noteParagraph = new Paragraph({
            spacing: {
                before: 300,
            },
            children: [
                new TextRun({
                    text: "หมายเหตุ ",
                    bold: true,
                    underline: {},
                    size: 24, // 12 pt
                }),
                new TextRun({
                    text: " N/A หมายถึง มีระบบแต่ไม่สามารถตรวจสอบ / ทดสอบได้",
                    size: 24, // 12 pt
                }),
            ],
        });

        const dotLine = () =>
            new Paragraph({
                children: [
                    new TextRun({
                        text: ".................................................................................................................................................................",
                        size: 26,
                    }),
                ],
            });

        const isBuildingSign = s2?.typeRooftop ||
            s2?.typeOnRoof ||
            s2?.typeOnBuilding ||
            s2?.typeOtherChecked ||
            (s2?.typeOther && s2.typeOther.trim() !== "");

        /* ---------- Section 1 ---------- */
        const section1 = [

            // ส่วนที่ 1
            new Paragraph({
                children: [
                    new TextRun({
                        text: "ส่วนที่ 1 ขอบเขตของการตรวจสอบป้าย",
                        bold: true,
                        size: 48, // 24pt
                    }),
                ],
            }),

            // 1. ขอบเขตของผู้ตรวจสอบอาคาร
            new Paragraph({
                children: [
                    new TextRun({
                        text: "1. ขอบเขตของผู้ตรวจสอบอาคาร",
                        bold: true,
                        underline: {},
                        size: 32, // 16pt
                    }),
                ],
            }),

            // ย่อหน้าอธิบาย
            new Paragraph({
                indent: { firstLine: 720 },
                children: [
                    new TextRun({
                        text:
                            "การตรวจสอบสภาพป้ายและอุปกรณ์ประกอบต่าง ๆ ของป้าย อาจมีข้อจำกัดต่าง ๆ ที่ไม่สามารถตรวจสอบได้ตามที่กำหนดและตามที่ต้องการได้ ดังนั้น จึงจำเป็นต้องกำหนดขอบเขตของ ผู้ตรวจสอบ ดังนี้",
                        size: 32,
                    }),
                ],
            }),

            // ข้อความอ้างอิง
            new Paragraph({
                indent: { firstLine: 720 },
                children: [
                    new TextRun({
                        text:
                            "“ผู้ตรวจสอบมีหน้าที่ตรวจสอบ สังเกตด้วยสายตาพร้อมด้วยเครื่องมือพื้นฐานเท่านั้น จะไม่รวมถึงการทดสอบที่อาศัยเครื่องมือพิเศษเฉพาะ ทำรายงาน รวบรวมและสรุปผลการ วิเคราะห์ ทางด้านความมั่นคงแข็งแรง และระบบต่าง ๆ ที่เกี่ยวข้องเพื่อความปลอดภัยของชีวิตและทรัพย์สิน แล้วจัดทำรายงานผลการตรวจสอบสภาพป้ายและอุปกรณ์ประกอบของป้ายที่ทำการตรวจสอบนั้นให้แก่เจ้าของป้าย เพื่อให้เจ้าของป้ายเสนอรายงานผลการตรวจสอบป้ายและอุปกรณ์ประกอบของป้ายต่อเจ้าพนักงานท้องถิ่นเป็นประจำทุกสามปี",
                        size: 32,
                    }),
                ],
            }),

            // เกริ่นก่อนข้อย่อย
            new Paragraph({
                indent: { firstLine: 720 },
                children: [
                    new TextRun({
                        text:
                            "ผู้ตรวจสอบต้องตรวจสอบป้ายและอุปกรณ์ประกอบของป้ายโดยพิจารณาตามหลักเกณฑ์หรือมาตรฐานดังต่อไปนี้",
                        size: 32,
                    }),
                ],
            }),

            // ข้อ 1
            new Paragraph({
                indent: { firstLine: 720 },
                children: [
                    new TextRun({
                        text:
                            "1. หลักเกณฑ์ตามที่ได้กำหนดไว้ในกฎหมายว่าด้วยการควบคุมอาคาร หรือตามกฎหมายอื่นที่เกี่ยวข้องที่ใช้บังคับอยู่ในขณะที่มีการก่อสร้างป้ายนั้น หรือ",
                        size: 32,
                    }),
                ],
            }),

            // ข้อ 2 + ข้อความขีดเส้นใต้ บรรทัดเดียวกัน
            new Paragraph({
                indent: { firstLine: 720 },
                children: [
                    new TextRun({
                        text:
                            "2. มาตรฐานความปลอดภัยของสถาบันของทางราชการ สภาวิศวกร หรือสภาสถาปนิก ทั้งนี้ ",
                        size: 32,
                    }),
                    new TextRun({
                        text:
                            "ณ สถานที่ วัน และเวลาที่ทำการตรวจสอบตามที่ระบุในรายงานเท่านั้น”",
                        underline: {},
                        size: 32,
                    }),
                ],
            }),

            // 2. รายละเอียดในการตรวจสอบ (หนา + ขีดเส้นใต้)
            new Paragraph({
                children: [
                    new TextRun({
                        text: "2. รายละเอียดในการตรวจสอบ",
                        bold: true,
                        underline: {},
                        size: 32,
                    }),
                ],
            }),

            // ผู้ตรวจสอบต้องตรวจสอบ...
            new Paragraph({
                indent: INDENT_1,
                children: [
                    new TextRun({
                        text: "ผู้ตรวจสอบต้องตรวจสอบ และทำรายงานการตรวจสอบสภาพป้ายและอุปกรณ์ต่าง ๆ ของป้าย ดังต่อไปนี้",
                        size: 32,
                    }),
                ],
            }),

            // 2.1 การตรวจสอบความมั่นคงแข็งแรง...
            new Paragraph({
                indent: INDENT_1,
                children: [
                    new TextRun({
                        text: "2.1 การตรวจสอบความมั่นคงแข็งแรงของป้ายหรือสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย อย่างน้อยต้องทำการตรวจสอบ ดังต่อไปนี้",
                        size: 32,
                    }),
                ],
            }),

            // (1)
            new Paragraph({
                indent: INDENT_2,
                children: [
                    new TextRun({
                        text: "(1) การต่อเติมดัดแปลงปรับปรุงขนาดของป้ายหรือสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย",
                        size: 32,
                    }),
                ],
            }),

            // (2)
            new Paragraph({
                indent: INDENT_2,
                children: [
                    new TextRun({
                        text: "(2) การเปลี่ยนแปลงน้ำหนักของแผ่นป้าย",
                        size: 32,
                    }),
                ],
            }),

            // (3)
            new Paragraph({
                indent: INDENT_2,
                children: [
                    new TextRun({
                        text: "(3) การเปลี่ยนแปลงวัสดุของป้ายหรือสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย",
                        size: 32,
                    }),
                ],
            }),

            // (4)
            new Paragraph({
                indent: INDENT_2,
                children: [
                    new TextRun({
                        text: "(4) การชำรุดสึกหรอของป้ายหรือสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย",
                        size: 32,
                    }),
                ],
            }),

            // (5)
            new Paragraph({
                indent: INDENT_2,
                children: [
                    new TextRun({
                        text: "(5) การวิบัติของป้ายหรือสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย",
                        size: 32,
                    }),
                ],
            }),

            // (6)
            new Paragraph({
                indent: INDENT_2,
                children: [
                    new TextRun({
                        text: "(6) ความมั่นคงแข็งแรงของโครงสร้างและฐานรากของสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย (กรณีป้ายที่ตั้งบนพื้นดิน)",
                        size: 32,
                    }),
                ],
            }),

            // (7)
            new Paragraph({
                indent: INDENT_2,
                children: [
                    new TextRun({
                        text: "(7) ความมั่นคงแข็งแรงของอาคารที่ติดตั้งป้าย (กรณีป้ายที่ติดหรือตั้งบนหลังคา หรือดาดฟ้าของอาคาร หรือบนส่วนหนึ่งส่วนใดของอาคาร)",
                        size: 32,
                    }),
                ],
            }),

            // (8)
            new Paragraph({
                indent: INDENT_2,
                children: [
                    new TextRun({
                        text: "(8) การเชื่อมยึดระหว่างแผ่นป้ายกับสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย การเชื่อมยึดระหว่างชิ้นส่วนต่าง ๆ ของสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย และการเชื่อมยึดระหว่างสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้ายกับฐานรากหรืออาคาร",
                        size: 32,
                    }),
                ],
            }),

            /* ---------- 2.2 ---------- */
            new Paragraph({
                indent: INDENT_1,
                children: [
                    new TextRun({
                        text: "2.2 การตรวจสอบระบบและอุปกรณ์ประกอบของป้ายอย่างน้อยต้องทำการตรวจสอบ ดังต่อไปนี้",
                        size: 32,
                    }),
                ],
            }),

            new Paragraph({
                indent: INDENT_2,
                children: [new TextRun({ text: "(1) ระบบไฟฟ้าแสงสว่างและระบบไฟฟ้ากำลัง", size: 32 })],
            }),
            new Paragraph({
                indent: INDENT_2,
                children: [new TextRun({ text: "(2) ระบบป้องกันฟ้าผ่า (ถ้ามี)", size: 32 })],
            }),
            new Paragraph({
                indent: INDENT_2,
                children: [new TextRun({ text: "(3) ระบบอุปกรณ์ประกอบอื่น ๆ (ถ้ามี)", size: 32 })],
            }),

            /* ---------- 2.3 ---------- */
            new Paragraph({
                indent: INDENT_1,
                children: [
                    new TextRun({
                        text: "2.3 การตรวจสอบระบบโครงสร้าง",
                        size: 32,
                    }),
                ],
            }),
            new Paragraph({
                indent: INDENT_1,
                children: [
                    new TextRun({
                        text: "ผู้ตรวจสอบจะตรวจสอบด้วยสายตา ทำรายงาน และประเมินโครงสร้างตามรายละเอียด ดังต่อไปนี้",
                        size: 32,
                    }),
                ],
            }),
            new Paragraph({
                indent: INDENT_2,
                children: [new TextRun({ text: "(1) ส่วนของฐานราก (ถ้ามี)", size: 32 })],
            }),
            new Paragraph({
                indent: INDENT_2,
                children: [new TextRun({ text: "(2) ระบบโครงสร้าง", size: 32 })],
            }),
            new Paragraph({
                indent: INDENT_2,
                children: [
                    new TextRun({
                        text: "(3) การเสื่อมสภาพของโครงสร้างที่จะมีผลกระทบต่อความมั่นคงแข็งแรงของระบบโครงสร้างอาคาร",
                        size: 32,
                    }),
                ],
            }),
            new Paragraph({
                indent: INDENT_2,
                children: [
                    new TextRun({
                        text: "(4) ความเสียหายและอันตรายของโครงสร้าง เช่น ความเสียหายเนื่องจากอัคคีภัย ความเสียหายจากการแอ่นตัวของโครงข้อหมุน เป็นต้น",
                        size: 32,
                    }),
                ],
            }),
            new Paragraph({
                indent: INDENT_2,
                children: [new TextRun({ text: "(5) สภาพการใช้งานตามที่เห็น", size: 32 })],
            }),

            /* ---------- 2.4 ---------- */
            new Paragraph({
                indent: INDENT_1,
                children: [
                    new TextRun({
                        text: "2.4 การตรวจสอบระบบและอุปกรณ์ประกอบของป้าย",
                        size: 32,
                    }),
                ],
            }),

            /* ---------- 2.4.1 ---------- */
            new Paragraph({
                indent: INDENT_2,
                children: [
                    new TextRun({
                        text: "2.4.1 ระบบไฟฟ้าแสงสว่างและระบบไฟฟ้ากำลัง",
                        size: 32,
                    }),
                ],
            }),
            new Paragraph({
                indent: INDENT_3,
                children: [
                    new TextRun({
                        text: "2.4.1.1 ผู้ตรวจสอบจะตรวจสอบด้วยสายตา เครื่องมือหรือเครื่องวัดชนิดพกพา ทำรายงานและประเมินระบบไฟฟ้าและบริภัณฑ์ไฟฟ้า ดังนี้",
                        size: 32,
                    }),
                ],
            }),
            new Paragraph({
                indent: INDENT_4,
                children: [
                    new TextRun({
                        text: "(1) สภาพสายไฟฟ้า ขนาดกระแสของสาย จุดต่อสาย และอุณหภูมิขั้วต่อสาย",
                        size: 32,
                    }),
                ],
            }),
            new Paragraph({
                indent: INDENT_4,
                children: [new TextRun({ text: "(2) ท่อร้อยสาย รางเดินสาย และรางเคเบิล", size: 32 })],
            }),
            new Paragraph({
                indent: INDENT_4,
                children: [
                    new TextRun({
                        text: "(3) ขนาดเครื่องป้องกันกระแสเกินและพิกัดตัดกระแสของบริภัณฑ์ประธาน แผงย่อย และแผงวงจรย่อย",
                        size: 32,
                    }),
                ],
            }),
            new Paragraph({
                indent: INDENT_4,
                children: [new TextRun({ text: "(4) เครื่องตัดไฟรั่ว", size: 32 })],
            }),
            new Paragraph({
                indent: INDENT_4,
                children: [
                    new TextRun({
                        text: "(5) การต่อลงดินของบริภัณฑ์ ขนาดตัวนำต่อลงดิน และความต่อเนื่องลงดินของท่อร้อยสาย รางเดินสาย รางเคเบิล",
                        size: 32,
                    }),
                ],
            }),
            new Paragraph({
                indent: INDENT_4,
                children: [new TextRun({ text: "(6) รายการอื่นตามตารางรายการตรวจสอบ", size: 32 })],
            }),
            // 2.4.1.2 ผู้ตรวจสอบไม่ต้องตรวจสอบในลักษณะดังนี้
            new Paragraph({
                indent: INDENT_3,
                children: [
                    new TextRun({
                        text: "2.4.1.2 ผู้ตรวจสอบไม่ต้องตรวจสอบในลักษณะดังนี้",
                        size: 32,
                    }),
                ],
            }),

            new Paragraph({
                indent: INDENT_4,
                children: [
                    new TextRun({
                        text: "(1) วัดหรือทดสอบแผงสวิตช์ ที่ต้องให้สายวัดสัมผัสกับบริภัณฑ์ในขณะที่แผงสวิตช์นั้นมีไฟหรือใช้งานอยู่",
                        size: 32,
                    }),
                ],
            }),

            new Paragraph({
                indent: INDENT_4,
                children: [
                    new TextRun({
                        text: "(2) ทดสอบการใช้งานอุปกรณ์ป้องกันกระแสเกิน",
                        size: 32,
                    }),
                ],
            }),

            new Paragraph({
                indent: INDENT_4,
                children: [
                    new TextRun({
                        text: "(3) ถอดออกหรือรื้อบริภัณฑ์ไฟฟ้า นอกจากเพียงเปิดฝาแผงสวิตช์ แผงควบคุม เพื่อตรวจสภาพบริภัณฑ์",
                        size: 32,
                    }),
                ],
            }),

            // 2.4.2 ระบบป้องกันฟ้าผ่า (ถ้ามี)
            new Paragraph({
                pageBreakBefore: true,
                indent: INDENT_2,
                children: [
                    new TextRun({
                        text: "2.4.2 ระบบป้องกันฟ้าผ่า (ถ้ามี)",
                        size: 32,
                    }),
                ],
            }),

            new Paragraph({
                indent: INDENT_3,
                children: [
                    new TextRun({
                        text: "(1) ตรวจสอบระบบตัวนำล่อฟ้า ตัวนำต่อลงดินครอบคลุมครบถ้วน",
                        size: 32,
                    }),
                ],
            }),

            new Paragraph({
                indent: INDENT_3,
                children: [
                    new TextRun({
                        text: "(2) ตรวจสอบระบบรากสายดิน",
                        size: 32,
                    }),
                ],
            }),

            new Paragraph({
                indent: INDENT_3,
                children: [
                    new TextRun({
                        text: "(3) ตรวจสอบจุดต่อประสานศักย์",
                        size: 32,
                    }),
                ],
            }),

            new Paragraph({
                indent: INDENT_3,
                children: [
                    new TextRun({
                        text: "(4) ตรวจสอบการดูแลรักษา ซ่อมบำรุง และการทดสอบระบบในอดีตที่ผ่านมา",
                        size: 32,
                    }),
                ],
            }),

            // 2.4.3 ระบบอุปกรณ์ประกอบอื่น ๆ (ถ้ามี)
            new Paragraph({
                indent: INDENT_2,
                children: [
                    new TextRun({
                        text: "2.4.3 ระบบอุปกรณ์ประกอบอื่น ๆ (ถ้ามี)",
                        size: 32,
                    }),
                ],
            }),

            new Paragraph({
                indent: INDENT_2,
                children: [
                    new TextRun({
                        text: "ผู้ตรวจสอบจะตรวจสอบด้วยสายตา ทำรายงานและประเมินความปลอดภัยของอุปกรณ์ประกอบต่าง ๆ ดังต่อไปนี้",
                        size: 32,
                    }),
                ],
            }),

            new Paragraph({
                indent: INDENT_3,
                children: [
                    new TextRun({
                        text: "(1) สภาพบันไดขึ้นลง",
                        size: 32,
                    }),
                ],
            }),

            new Paragraph({
                indent: INDENT_3,
                children: [
                    new TextRun({
                        text: "(2) สภาพราวจับ และราวกันตก",
                        size: 32,
                    }),
                ],
            }),

            new Paragraph({
                indent: INDENT_3,
                children: [
                    new TextRun({
                        text: "(3) อุปกรณ์ประกอบอื่นตามที่เห็นสมควร",
                        size: 32,
                    }),
                ],
            }),
        ];
        /* ---------- Section 2 ---------- */
        const section2 = [
            new Paragraph({
                pageBreakBefore: true,
                children: [
                    new TextRun({
                        text: "ส่วนที่ 2 ข้อมูลทั่วไปของป้าย",
                        bold: true,
                        size: 48,
                    }),
                ],
            }),

            new Paragraph({
                indent: INDENT_1,
                children: [
                    new TextRun({
                        text: "ส่วนที่ 2 เป็นข้อมูลทั่วไปของป้ายที่ผู้ตรวจสอบต้องลงบันทึกในหัวข้อต่าง ๆ และอาจเพิ่มเติมได้เพื่อให้ข้อมูลสมบูรณ์ยิ่งขึ้น ในบางรายการจะต้องประสานงานกับเจ้าของและผู้ดูแลป้ายเพื่อให้ได้ข้อมูลเหล่านั้น รายการใดที่ไม่สามารถหาข้อมูลได้ให้เว้นว่าง หรือแจ้งหมายเหตุไว้",
                        size: 32,
                    }),
                ],
            }),

            new Paragraph({
                children: [
                    new TextRun({
                        text: "1. ข้อมูลป้ายและสถานที่ตั้งป้าย",
                        bold: true,
                        size: 32,
                    }),
                ],
            }),

            new Paragraph({
                indent: INDENT_1,
                children: [
                    new TextRun({
                        text: `ชื่อป้าย ${valueOrDots(s2?.signName)}`,
                        size: 32,
                    }),
                ],
            }),

            new Paragraph({
                indent: INDENT_1,
                children: [
                    new TextRun({
                        text: `ตั้งอยู่เลขที่ ${valueOrDots(s2?.addrNo, "..........")} หมู่ที่ ${valueOrDots(
                            s2?.addrAlley,
                            ".........."
                        )} ตรอก/ซอย ${valueOrDots(s2?.addrAlley, "..........")}`,
                        size: 32,
                    }),
                ],
            }),

            new Paragraph({
                indent: INDENT_1,
                children: [
                    new TextRun({
                        text: `ถนน ${valueOrDots(s2?.addrRoad, "..........")} ตำบล/แขวง ${valueOrDots(
                            s2?.subDistrict,
                            ".........."
                        )} อำเภอ/เขต ${valueOrDots(s2?.district, "..........")}`,
                        size: 32,
                    }),
                ],
            }),

            new Paragraph({
                indent: INDENT_1,
                children: [
                    new TextRun({
                        text: `จังหวัด ${valueOrDots(s2?.province, "..........")} รหัสไปรษณีย์ ${valueOrDots(
                            s2?.zip,
                            ".........."
                        )}`,
                        size: 32,
                    }),
                ],
            }),

            // บรรทัดสุดท้ายของข้อมูลที่อยู่
            new Paragraph({
                indent: INDENT_1,
                spacing: { after: 200 },
                children: [
                    new TextRun({
                        text: `โทรศัพท์ ${valueOrDots(s2?.tel, "..........")} โทรสาร ${valueOrDots(
                            s2?.fax,
                            ".........."
                        )}`,
                        size: 32,
                    }),
                ],
            }),

            // checklist บรรทัดแรก
            new Paragraph({
                indent: INDENT_1,
                spacing: { before: 200 },
                children: [
                    new TextRun({
                        text: `${CHECK(s2?.hasPermitInfo)} มีข้อมูลการได้รับใบอนุญาตก่อสร้างจากเจ้าพนักงานท้องถิ่น`,
                        size: 32,
                    }),
                ],
            }),

            new Paragraph({
                indent: INDENT_1,
                children: [
                    new TextRun({
                        text: `ได้รับใบอนุญาตก่อสร้างจากเจ้าพนักงานท้องถิ่น เมื่อวันที่ ${V(
                            s2?.permitDay
                        )} เดือน ${V(s2?.permitMonth)} พ.ศ. ${V(
                            s2?.permitYear
                        )} (ไม่มีเอกสารจากเจ้าของป้าย)`,
                        size: 32,
                    }),
                ],
            }),

            new Paragraph({
                indent: INDENT_1,
                children: [
                    new TextRun({
                        text: `${CHECK(s2?.hasOriginalPlan)} มีแบบแปลนเดิม`,
                        size: 32,
                    }),
                ],
            }),

            new Paragraph({
                indent: INDENT_1,
                children: [
                    new TextRun({
                        text: `${CHECK(
                            s2?.noOriginalPlan
                        )} ไม่มีแบบแปลนเดิม (กรณีที่ไม่มีแบบแปลนหรือแผนผังรายการเกี่ยวกับการก่อสร้าง ให้เจ้าของป้ายจัดหาหรือจัดทำแบบแปลนสำหรับใช้ในการตรวจสอบป้ายและอุปกรณ์ประกอบของป้ายให้กับผู้ตรวจสอบอาคาร)`,
                        size: 32,
                    }),
                ],
            }),

            new Paragraph({
                indent: INDENT_1,
                children: [
                    new TextRun({
                        text: `${CHECK(
                            s2?.noPermitInfo
                        )} ไม่มีข้อมูลการได้รับใบอนุญาตก่อสร้างจากเจ้าพนักงานท้องถิ่น`,
                        size: 32,
                    }),
                ],
            }),

            new Paragraph({
                indent: INDENT_1,
                children: [
                    new TextRun({
                        text: `อายุของป้าย ${V(s2?.signAge)} ปี (ก่อสร้างประมาณปี พ.ศ. ${V(
                            s2?.signYear
                        )})`,
                        size: 32,
                    }),
                ],
            }),

            new Paragraph({
                indent: INDENT_1,
                children: [
                    new TextRun({
                        text: `${CHECK(
                            s2?.noPermitInfo2
                        )} ป้ายไม่เข้าข่ายต้องขออนุญาตก่อสร้าง **`,
                        size: 32,
                    }),
                ],
            }),

            new Paragraph({
                spacing: {
                    before: 3500, // ดันลงล่าง (ประมาณ 3 บรรทัด)
                },
                indent: INDENT_1,
                children: [
                    new TextRun({
                        text: "** กฎกระทรวง ว่าด้วยการควบคุมป้ายหรือสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย ตามกฎหมายว่าด้วยการควบคุมอาคาร",
                        size: 20, // font 10
                    }),
                ],
            }),

            new Paragraph({
                indent: INDENT_1,
                children: [
                    new TextRun({
                        text: "ข้อ ๓ กฎกระทรวงนี้ให้ใช้บังคับกับป้ายหรือสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้ายที่มีลักษณะอย่างใดอย่างหนึ่งดังต่อไปนี้",
                        size: 20,
                    }),
                ],
            }),

            new Paragraph({
                indent: INDENT_1,
                children: [
                    new TextRun({
                        text: "(๑) ที่สร้างขึ้นโดยมีความสูงจากระดับฐานหรือระดับพื้นดินที่ก่อสร้างตั้งแต่ ๑๐ เมตร ขึ้นไป",
                        size: 20,
                    }),
                ],
            }),

            new Paragraph({
                indent: INDENT_1,
                children: [
                    new TextRun({
                        text: "(๒) ที่ติดหรือตั้งไว้เหนือที่สาธารณะสูงจากระดับพื้นดินเกิน ๒.๕๐ เมตร และมีพื้นที่ของป้ายเกิน ๑ ตารางเมตร หรือมีน้ำหนักรวมทั้งโครงสร้างเกิน ๑๐ กิโลกรัม",
                        size: 20,
                    }),
                ],
            }),

            new Paragraph({
                indent: INDENT_1,
                children: [
                    new TextRun({
                        text: "(๓) ที่ติดหรือตั้งไว้ในระยะห่างจากที่สาธารณะซึ่งเมื่อวัดในทางราบแล้ว ระยะห่างจากที่สาธารณะมีน้อยกว่าความสูงของป้ายนั้นเมื่อวัดจากพื้นดิน และมีความกว้างของป้ายเกิน ๕๐ เซนติเมตร หรือมีความยาวเกิน ๑ เมตร หรือมีพื้นที่ของป้ายเกิน ๕,๐๐๐ ตารางเซนติเมตร หรือมีน้ำหนักของป้ายหรือสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้ายอย่างใดอย่างหนึ่งหรือรวมกันเกิน ๑๐ กิโลกรัม",
                        size: 20,
                    }),
                ],
            }),

            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: {
                    after: 240, // เว้นบรรทัดหลังหัวข้อ
                },
                children: [
                    new TextRun({
                        text: "แผนที่แสดงตำแหน่งที่ตั้งของป้ายโดยสังเขป",
                        bold: true,
                        size: 32, // 16pt = 32
                    }),
                ],
            }),

            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: {
                    before: 200,
                    after: 200,
                },
                children: [
                    ...(imageBuffer ? [
                        new ImageRun({
                            data: imageBuffer,
                            type: "png",
                            transformation: {
                                width: 520,
                                height: 300,
                            },
                        }),
                    ] : []), // ถ้าไม่มี imageBuffer ให้ส่ง array ว่างกลับไป
                ],
            }),

            new Table({
                width: {
                    size: 40,
                    type: WidthType.PERCENTAGE,
                },
                alignment: AlignmentType.LEFT,
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({
                                shading: {
                                    type: ShadingType.CLEAR,
                                    // fill: "4F81BD",
                                },
                                children: [
                                    new Paragraph({
                                        children: [
                                            new TextRun({
                                                text: "LATITUDE",
                                                bold: true,
                                                size: 32, // 16 pt
                                                // color: "FFFFFF",
                                            }),
                                        ],
                                    }),
                                ],
                            }),
                            new TableCell({
                                children: [
                                    new Paragraph({
                                        children: [
                                            new TextRun({
                                                text: valueOrDash(s2?.latitude),
                                                bold: true,
                                                size: 32,
                                            }),
                                        ],
                                    }),
                                ],
                            }),
                        ],
                    }),
                    new TableRow({
                        children: [
                            new TableCell({
                                shading: {
                                    type: ShadingType.CLEAR,
                                    // fill: "4F81BD",
                                },
                                children: [
                                    new Paragraph({
                                        children: [
                                            new TextRun({
                                                text: "LONGITUDE",
                                                bold: true,
                                                size: 32,
                                                // color: "FFFFFF",
                                            }),
                                        ],
                                    }),
                                ],
                            }),
                            new TableCell({
                                children: [
                                    new Paragraph({
                                        children: [
                                            new TextRun({
                                                text: valueOrDash(s2?.longitude),
                                                bold: true,
                                                size: 32,
                                            }),
                                        ],
                                    }),
                                ],
                            }),
                        ],
                    }),
                ],
            }),

            new Paragraph({
                pageBreakBefore: true,
            }),

            (() => {
                // Helper ดึงวันที่ (ลดโค้ดซ้ำ)
                const getDateStr = (d?: string, m?: string, y?: string) => {
                    if (!d && !m && !y) return "-";
                    return `${v(d)} ${v(m)} ${v(y)}`;
                };

                // 🟢 กรณี 1 รอบ (แบบเดิม)
                if (roundCount <= 1) {
                    return new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 100, after: 100 },
                        children: [
                            new TextRun({
                                text: `วัน/เดือน/ปี ที่ตรวจสอบ ${getDateStr(s2?.inspectDay3, s2?.inspectMonth3, s2?.inspectYear3)}`,
                                font: FONT_TH,
                                size: 28, // 14pt
                            }),
                            new TextRun({
                                text: `   ตรวจสอบโดย ${v(s2?.recorder3)}`,
                                font: FONT_TH,
                                size: 28,
                            }),
                        ],
                    });
                }

                // 🔵 กรณี 2-3 รอบ (สร้างตารางตามรูปภาพ)
                const tableRows: TableRow[] = [];

                // --- Row รอบที่ 1 (พื้นหลังสีน้ำเงินเข้ม) ---
                tableRows.push(
                    new TableRow({
                        children: [
                            new TableCell({
                                shading: { fill: "4472C4", type: ShadingType.CLEAR, color: "auto" }, // สีน้ำเงิน
                                verticalAlign: VerticalAlign.CENTER,
                                borders: {
                                    top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                                    bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                                    left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                                    right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                                },
                                children: [
                                    new Paragraph({
                                        alignment: AlignmentType.CENTER,
                                        spacing: { before: 120, after: 120 }, // เพิ่ม spacing ให้ดูหนาขึ้นเหมือนในรูป
                                        children: [
                                            new TextRun({
                                                text: `วัน/เดือน/ปี ที่ตรวจสอบ รอบที่ 1      ${getDateStr(s2?.inspectDay3, s2?.inspectMonth3, s2?.inspectYear3)}`,
                                                font: FONT_TH,
                                                size: 28,
                                                bold: true, // ตัวหนาตามรูป
                                            }),
                                        ],
                                    }),
                                ],
                            }),
                        ],
                    })
                );

                // --- Row รอบที่ 2 (พื้นหลังสีฟ้าอ่อน/เทา) ---
                if (roundCount >= 2) {
                    tableRows.push(
                        new TableRow({
                            children: [
                                new TableCell({
                                    shading: { fill: "D9E2F3", type: ShadingType.CLEAR, color: "auto" }, // สีฟ้าอ่อน
                                    verticalAlign: VerticalAlign.CENTER,
                                    borders: {
                                        top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                                        bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                                        left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                                        right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                                    },
                                    children: [
                                        new Paragraph({
                                            alignment: AlignmentType.CENTER,
                                            spacing: { before: 120, after: 120 },
                                            children: [
                                                new TextRun({
                                                    text: `วัน/เดือน/ปี ที่ตรวจสอบ รอบที่ 2      ${getDateStr(s2?.inspectDay4, s2?.inspectMonth4, s2?.inspectYear4)}`,
                                                    font: FONT_TH,
                                                    size: 28,
                                                    bold: true,
                                                }),
                                            ],
                                        }),
                                    ],
                                }),
                            ],
                        })
                    );
                }

                // --- Row รอบที่ 3 (พื้นหลังสีเทาจางๆ หรือสลับสี) ---
                if (roundCount >= 3) {
                    tableRows.push(
                        new TableRow({
                            children: [
                                new TableCell({
                                    shading: { fill: "EDEDED", type: ShadingType.CLEAR, color: "auto" }, // สีเทาอ่อน
                                    verticalAlign: VerticalAlign.CENTER,
                                    borders: {
                                        top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                                        bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                                        left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                                        right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                                    },
                                    children: [
                                        new Paragraph({
                                            alignment: AlignmentType.CENTER,
                                            spacing: { before: 120, after: 120 },
                                            children: [
                                                new TextRun({
                                                    text: `วัน/เดือน/ปี ที่ตรวจสอบ รอบที่ 3      ${getDateStr(s2?.inspectDay5, s2?.inspectMonth5, s2?.inspectYear5)}`,
                                                    font: FONT_TH,
                                                    size: 28,
                                                    bold: true,
                                                }),
                                            ],
                                        }),
                                    ],
                                }),
                            ],
                        })
                    );
                }

                // --- Footer: ตรวจสอบโดย (พื้นหลังสีอ่อนสุด) ---
                tableRows.push(
                    new TableRow({
                        children: [
                            new TableCell({
                                shading: { fill: "F2F2F2", type: ShadingType.CLEAR, color: "auto" }, // สีพื้นหลังจางๆ
                                verticalAlign: VerticalAlign.CENTER,
                                borders: {
                                    top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                                    bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                                    left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                                    right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                                },
                                children: [
                                    new Paragraph({
                                        alignment: AlignmentType.CENTER,
                                        spacing: { before: 150, after: 150 },
                                        children: [
                                            new TextRun({
                                                text: `ตรวจสอบโดย ${v(s2?.recorder3)}`, // ใช้ recorder3 เป็นหลัก (ตามที่คุยกันก่อนหน้า)
                                                font: FONT_TH,
                                                size: 28,
                                            }),
                                        ],
                                    }),
                                ],
                            }),
                        ],
                    })
                );

                // Return Table Object
                return new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: tableRows,
                });
            })(),

            new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                    new TextRun("รูปถ่ายป้ายในวันเวลาที่ตรวจสอบ"),
                ],
            }),

            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: {
                    before: 200,
                    after: 200,
                },
                children: [
                    // เช็คว่ามีข้อมูลรูปภาพไหม?
                    imageBuffer1
                        ? new ImageRun({
                            data: imageBuffer1, // ✅ ต้องแน่ใจว่าเป็น Uint8Array (ตามที่แก้ไปข้อก่อนหน้า)
                            type: "png",
                            transformation: {
                                width: 520,
                                height: 300,
                            },
                        })
                        : new TextRun(""), // ❌ ถ้าไม่มีรูป ให้ใส่ข้อความว่างๆ แทน กัน Error
                ],
            }),

            new Paragraph({
                pageBreakBefore: true,
            }),

            new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                    new TextRun("รูปแบบและขนาดของแผ่นป้าย และสิ่งที่สร้างขึ้นสำหรับติดตั้งป้ายโดยสังเขป"),
                ],
            }),

            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: {
                    before: 200,
                    after: 200,
                },
                children: [
                    ...(imageBuffer2 ? [
                        new ImageRun({
                            data: imageBuffer2,
                            type: "png",
                            transformation: {
                                width: 520,
                                height: 300,
                            },
                        }),
                    ] : []), // ถ้าไม่มี imageBuffer2 ให้ส่ง array ว่างกลับไป
                ],
            }),

            new Paragraph({
                indent: INDENT_1,
                spacing: {
                    before: 200,
                    after: 120,
                },
                children: [
                    new TextRun({
                        text: "ข้อมูลขนาดของป้าย และสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย",
                        bold: true,
                        size: 32, // 16 pt
                    }),
                ],
            }),

            new Paragraph({
                indent: INDENT_2, // ย่อ 2
                children: [
                    new TextRun({ text: "ความกว้างของแผ่นป้าย " }),
                    new TextRun({ text: `${vs(s2?.signWidthM)} เมตร`, bold: true }),
                ],
            }),

            new Paragraph({
                indent: INDENT_2,
                children: [
                    new TextRun({ text: "ความสูงของแผ่นป้าย " }),
                    new TextRun({ text: `${vs(s2?.signHeightM)} เมตร`, bold: true }),
                ],
            }),

            new Paragraph({
                indent: INDENT_2,
                children: [
                    new TextRun({ text: "จำนวนด้านของป้าย " }),
                    new TextRun({ text: `${vs(s2?.signSides)} ด้าน`, bold: true }),
                ],
            }),

            new Paragraph({
                indent: INDENT_2,
                children: [
                    new TextRun({ text: "พื้นที่ป้าย โดยประมาณ " }),
                    new TextRun({ text: `${vs(s2?.signAreaMore)} ตารางเมตร`, bold: true }),
                ],
            }),

            new Paragraph({
                indent: INDENT_2,
                children: [
                    new TextRun({ text: "ความสูงของโครงสร้างสำหรับติดตั้งแผ่นป้าย " }),
                    new TextRun({ text: `${vs(s2?.structureHeightMore)} เมตร`, bold: true }),
                ],
            }),

            new Paragraph({
                pageBreakBefore: true,
            }),

            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 },
                children: [
                    new TextRun({
                        text: "รูปแบบของแผ่นป้าย โครงสร้างสำหรับติดหรือตั้งป้าย และอุปกรณ์ประกอบป้าย",
                        bold: true,
                    }),
                ],
            }),

            new Table({
                width: {
                    size: 100,
                    type: WidthType.PERCENTAGE,
                },
                borders: {
                    top: { style: BorderStyle.NONE },
                    bottom: { style: BorderStyle.NONE },
                    left: { style: BorderStyle.NONE },
                    right: { style: BorderStyle.NONE },
                    insideHorizontal: { style: BorderStyle.NONE },
                    insideVertical: { style: BorderStyle.NONE },
                },
                rows: [
                    // ===== แถวที่ 1 =====
                    new TableRow({
                        children: [
                            imageCell(imageBuffer3),
                            imageCell(imageBuffer4),
                        ],
                    }),

                    // ===== แถวที่ 2 =====
                    new TableRow({
                        children: [
                            imageCell(imageBuffer5),
                            imageCell(imageBuffer6),
                        ],
                    }),

                    // ===== แถวที่ 3 =====
                    new TableRow({
                        children: [
                            imageCell(imageBuffer7),
                            imageCell(imageBuffer8),
                        ],
                    }),
                ],
            }),

            new Paragraph({
                pageBreakBefore: true,
            }),

            new Table({
                width: {
                    size: 100,
                    type: WidthType.PERCENTAGE,
                },
                borders: {
                    top: { style: BorderStyle.NONE },
                    bottom: { style: BorderStyle.NONE },
                    left: { style: BorderStyle.NONE },
                    right: { style: BorderStyle.NONE },
                    insideHorizontal: { style: BorderStyle.NONE },
                    insideVertical: { style: BorderStyle.NONE },
                },
                rows: [
                    // ===== แถวที่ 1 =====
                    new TableRow({
                        children: [
                            imageCell(imageBuffer9),
                            imageCell(imageBuffer10),
                        ],
                    }),

                    // ===== แถวที่ 2 =====
                    new TableRow({
                        children: [
                            imageCell(imageBuffer11),
                            imageCell(imageBuffer12),
                        ],
                    }),

                    // ===== แถวที่ 3 =====
                    new TableRow({
                        children: [
                            imageCell(imageBuffer13),
                            imageCell(imageBuffer14),
                        ],
                    }),
                ],
            }),

            new Paragraph({
                pageBreakBefore: true,
            }),

            new Paragraph({
                children: [
                    new TextRun({
                        text: "2. ประเภทของป้าย",
                        bold: true,
                        size: 32,
                    }),
                ],
            }),

            new Paragraph({
                indent: { left: 720 },
                spacing: { after: 80 },
                children: [
                    new TextRun({ text: `${CHECK(s2?.typeGround)}  ป้ายที่ติดตั้งบนพื้นดิน` }),
                ],
            }),

            new Paragraph({
                indent: { left: 720 },
                spacing: { after: 80 },
                children: [
                    new TextRun({ text: `${CHECK(s2?.typeRooftop)}  ป้ายบนดาดฟ้าอาคาร` }),
                ],
            }),

            new Paragraph({
                indent: { left: 720 },
                spacing: { after: 80 },
                children: [
                    new TextRun({ text: `${CHECK(s2?.typeOnRoof)}  ป้ายบนหลังคา` }),
                ],
            }),

            new Paragraph({
                indent: { left: 720 },
                spacing: { after: 80 },
                children: [
                    new TextRun({
                        text: `${CHECK(s2?.typeOnBuilding)}  ป้ายบนส่วนหนึ่งส่วนใดของอาคาร`,
                    }),
                ],
            }),

            new Paragraph({
                indent: { left: 720 },
                spacing: { after: 120 },
                children: [
                    new TextRun({
                        text:
                            `${CHECK(s2?.typeOtherChecked)}  อื่น ๆ (โปรดระบุ) ` +
                            (s2?.typeOther?.trim()
                                ? s2.typeOther
                                : "................................................"),
                    }),
                ],
            }),

            new Paragraph({
                children: [
                    new TextRun({
                        text: "3. ชื่อเจ้าของหรือผู้ครอบครองป้าย และผู้ออกแบบด้านวิศวกรรมโครงสร้าง",
                        bold: true,
                        size: 32,
                    }),
                ],
            }),

            new Table({
                width: {
                    size: 100,
                    type: WidthType.PERCENTAGE,
                },
                borders: {
                    top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                },
                rows: [

                    /* ===== แถว Checkbox ด้านบน ===== */
                    new TableRow({
                        children: [
                            new TableCell({
                                borders: {
                                    bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                                },
                                margins: {
                                    top: 160,
                                    bottom: 160,
                                    left: 200,
                                    right: 200,
                                },
                                children: [
                                    new Paragraph({
                                        alignment: AlignmentType.CENTER,
                                        children: [
                                            new TextRun({
                                                text: `${s2?.typeGround ? "☑" : "☐"} ป้ายที่ติดตั้งบนพื้นดิน`,
                                            }),
                                        ],
                                    }),
                                ],
                            }),
                        ],
                    }),

                    /* ===== เนื้อหาด้านใน ===== */
                    new TableRow({
                        children: [
                            new TableCell({
                                margins: {
                                    top: 200,
                                    bottom: 200,
                                    left: 200,
                                    right: 200,
                                },
                                children: [

                                    /* ===== 3.1 ===== */
                                    new Paragraph({
                                        spacing: { after: 80 },
                                        children: [
                                            new TextRun({
                                                text: "3.1  ชื่อผลิตภัณฑ์โฆษณาหรือข้อความในป้าย",
                                            }),
                                        ],
                                    }),
                                    new Paragraph({
                                        indent: INDENT_1,
                                        children: [
                                            new TextRun({
                                                // ✅ แก้ไข: เช็ค typeGround ก่อน ถ้าจริงค่อยดึงข้อมูล ถ้าไม่จริงให้เป็นค่าว่าง
                                                text: (s2?.typeGround ? vr(s2?.productText) : "") || "....................................................................................................................",
                                            }),
                                        ],
                                    }),

                                    /* ===== 3.2 ===== */
                                    new Paragraph({
                                        spacing: { before: 120, after: 80 },
                                        children: [
                                            new TextRun({ text: "3.2  เจ้าของหรือผู้ครอบครองป้าย" }),
                                        ],
                                    }),

                                    new Paragraph({
                                        indent: INDENT_1,
                                        children: [
                                            new TextRun({ text: "ชื่อ  " }),
                                            new TextRun({
                                                // ✅ แก้ไข
                                                text: (s2?.typeGround ? vr(s2?.ownerName) : "") || "................................................................................................",
                                            }),
                                        ],
                                    }),

                                    new Paragraph({
                                        indent: INDENT_1,
                                        children: [
                                            new TextRun({ text: "สถานที่ติดต่อ  " }),
                                            new TextRun({ text: (s2?.typeGround ? vr(s2?.ownerNo) : "") || "........................." }), // ✅ แก้ไข
                                            new TextRun({ text: "  หมู่ที่  " }),
                                            new TextRun({ text: (s2?.typeGround ? vr(s2?.ownerMoo) : "") || "........" }), // ✅ แก้ไข
                                            new TextRun({ text: "  ตรอก/ซอย  " }),
                                            new TextRun({ text: (s2?.typeGround ? vr(s2?.ownerAlley) : "") || "........................." }), // ✅ แก้ไข
                                        ],
                                    }),

                                    new Paragraph({
                                        indent: INDENT_1,
                                        children: [
                                            new TextRun({ text: "ถนน  " }),
                                            new TextRun({ text: (s2?.typeGround ? vr(s2?.ownerRoad) : "") || "........................." }), // ✅ แก้ไข
                                            new TextRun({ text: "  ตำบล/แขวง  " }),
                                            new TextRun({ text: (s2?.typeGround ? vr(s2?.ownerSub) : "") || "........................." }), // ✅ แก้ไข
                                        ],
                                    }),

                                    new Paragraph({
                                        indent: INDENT_1,
                                        children: [
                                            new TextRun({ text: "อำเภอ/เขต  " }),
                                            new TextRun({ text: (s2?.typeGround ? vr(s2?.ownerDist) : "") || "........................." }), // ✅ แก้ไข
                                            new TextRun({ text: "  จังหวัด  " }),
                                            new TextRun({ text: (s2?.typeGround ? vr(s2?.ownerProv) : "") || "........................." }), // ✅ แก้ไข
                                        ],
                                    }),

                                    new Paragraph({
                                        indent: INDENT_1,
                                        children: [
                                            new TextRun({ text: "รหัสไปรษณีย์  " }),
                                            new TextRun({ text: (s2?.typeGround ? vr(s2?.ownerZip) : "") || "........................." }), // ✅ แก้ไข
                                        ],
                                    }),

                                    new Paragraph({
                                        indent: INDENT_1,
                                        children: [
                                            new TextRun({ text: "โทรศัพท์  " }),
                                            new TextRun({ text: (s2?.typeGround ? vr(s2?.ownerTel) : "") || "........................." }), // ✅ แก้ไข
                                            new TextRun({ text: "  โทรสาร  " }),
                                            new TextRun({ text: (s2?.typeGround ? vr(s2?.ownerFax) : "") || "........................." }), // ✅ แก้ไข
                                        ],
                                    }),

                                    new Paragraph({
                                        indent: INDENT_1,
                                        spacing: { after: 120 },
                                        children: [
                                            new TextRun({ text: "อีเมล  " }),
                                            new TextRun({ text: (s2?.typeGround ? vr(s2?.ownerEmail) : "") || ".........................................................." }), // ✅ แก้ไข
                                        ],
                                    }),

                                    /* ===== 3.3 ===== */
                                    new Paragraph({
                                        spacing: { after: 80 },
                                        children: [
                                            new TextRun({ text: "3.3  ผู้ออกแบบด้านวิศวกรรมโครงสร้าง" }),
                                        ],
                                    }),

                                    new Paragraph({
                                        indent: INDENT_1,
                                        children: [
                                            new TextRun({ text: "ชื่อ  " }),
                                            new TextRun({ text: (s2?.typeGround ? vr(s2?.designerName) : "") || ".........................................................." }), // ✅ แก้ไข
                                            new TextRun({ text: "  ใบอนุญาตทะเบียนเลขที่  " }),
                                            new TextRun({ text: (s2?.typeGround ? vr(s2?.designerLicense) : "") || ".............................." }), // ✅ แก้ไข
                                        ],
                                    }),

                                ],
                            }),
                        ],
                    }),
                ],
            }),

            new Paragraph({
                pageBreakBefore: true,
            }),

            new Table({
                width: {
                    size: 100,
                    type: WidthType.PERCENTAGE,
                },
                borders: {
                    top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                },
                rows: [

                    /* ===== แถว Checkbox ด้านบน ===== */
                    new TableRow({
                        children: [
                            new TableCell({
                                borders: {
                                    bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                                },
                                margins: {
                                    top: 160,
                                    bottom: 160,
                                    left: 200,
                                    right: 200,
                                },
                                children: [
                                    new Paragraph({
                                        alignment: AlignmentType.CENTER,
                                        children: [
                                            new TextRun({
                                                text: `${s2?.typeRooftop ||
                                                    s2?.typeOnRoof ||
                                                    s2?.typeOnBuilding ||
                                                    s2?.typeOtherChecked ||
                                                    (s2?.typeOther && s2.typeOther.trim() !== "")
                                                    ? "☑"
                                                    : "☐"
                                                    } ป้ายบนดาดฟ้า บนหลังคา บนส่วนหนึ่งส่วนใดของอาคาร หรืออื่น ๆ`,
                                            }),
                                        ],
                                    }),
                                ],
                            }),
                        ],
                    }),

                    /* ===== เนื้อหาด้านใน ===== */
                    new TableRow({
                        children: [
                            new TableCell({
                                margins: {
                                    top: 200,
                                    bottom: 200,
                                    left: 200,
                                    right: 200,
                                },
                                children: [

                                    /* ===== 3.1 ===== */
                                    new Paragraph({
                                        spacing: { after: 80 },
                                        children: [
                                            new TextRun({
                                                text: "3.1  ชื่อผลิตภัณฑ์โฆษณาหรือข้อความในป้าย",
                                            }),
                                        ],
                                    }),
                                    new Paragraph({
                                        indent: INDENT_1,
                                        children: [
                                            new TextRun({
                                                // ✅ แก้ไข: เช็ค isBuildingSign
                                                text: (isBuildingSign ? vr(s2?.productText) : "") || "....................................................................................................................",
                                            }),
                                        ],
                                    }),

                                    /* ===== 3.2 ===== */
                                    new Paragraph({
                                        spacing: { before: 120, after: 80 },
                                        children: [
                                            new TextRun({ text: "3.2  เจ้าของหรือผู้ครอบครองป้าย" }),
                                        ],
                                    }),

                                    new Paragraph({
                                        indent: INDENT_1,
                                        children: [
                                            new TextRun({ text: "ชื่อ  " }),
                                            new TextRun({
                                                // ✅ แก้ไข
                                                text: (isBuildingSign ? vr(s2?.ownerName) : "") || "................................................................................................",
                                            }),
                                        ],
                                    }),

                                    new Paragraph({
                                        indent: INDENT_1,
                                        children: [
                                            new TextRun({ text: "สถานที่ติดต่อ  " }),
                                            new TextRun({ text: (isBuildingSign ? vr(s2?.ownerNo) : "") || "........................." }), // ✅ แก้ไข
                                            new TextRun({ text: "  หมู่ที่  " }),
                                            new TextRun({ text: (isBuildingSign ? vr(s2?.ownerMoo) : "") || "........" }), // ✅ แก้ไข
                                            new TextRun({ text: "  ตรอก/ซอย  " }),
                                            new TextRun({ text: (isBuildingSign ? vr(s2?.ownerAlley) : "") || "........................." }), // ✅ แก้ไข
                                        ],
                                    }),

                                    new Paragraph({
                                        indent: INDENT_1,
                                        children: [
                                            new TextRun({ text: "ถนน  " }),
                                            new TextRun({ text: (isBuildingSign ? vr(s2?.ownerRoad) : "") || "........................." }), // ✅ แก้ไข
                                            new TextRun({ text: "  ตำบล/แขวง  " }),
                                            new TextRun({ text: (isBuildingSign ? vr(s2?.ownerSub) : "") || "........................." }), // ✅ แก้ไข
                                        ],
                                    }),

                                    new Paragraph({
                                        indent: INDENT_1,
                                        children: [
                                            new TextRun({ text: "อำเภอ/เขต  " }),
                                            new TextRun({ text: (isBuildingSign ? vr(s2?.ownerDist) : "") || "........................." }), // ✅ แก้ไข
                                            new TextRun({ text: "  จังหวัด  " }),
                                            new TextRun({ text: (isBuildingSign ? vr(s2?.ownerProv) : "") || "........................." }), // ✅ แก้ไข
                                        ],
                                    }),

                                    new Paragraph({
                                        indent: INDENT_1,
                                        children: [
                                            new TextRun({ text: "รหัสไปรษณีย์  " }),
                                            new TextRun({ text: (isBuildingSign ? vr(s2?.ownerZip) : "") || "........................." }), // ✅ แก้ไข
                                        ],
                                    }),

                                    new Paragraph({
                                        indent: INDENT_1,
                                        children: [
                                            new TextRun({ text: "โทรศัพท์  " }),
                                            new TextRun({ text: (isBuildingSign ? vr(s2?.ownerTel) : "") || "........................." }), // ✅ แก้ไข
                                            new TextRun({ text: "  โทรสาร  " }),
                                            new TextRun({ text: (isBuildingSign ? vr(s2?.ownerFax) : "") || "........................." }), // ✅ แก้ไข
                                        ],
                                    }),

                                    new Paragraph({
                                        indent: INDENT_1,
                                        spacing: { after: 120 },
                                        children: [
                                            new TextRun({ text: "อีเมล  " }),
                                            new TextRun({ text: (isBuildingSign ? vr(s2?.ownerEmail) : "") || ".........................................................." }), // ✅ แก้ไข
                                        ],
                                    }),

                                    /* ===== 3.3 ===== */
                                    new Paragraph({
                                        spacing: { after: 80 },
                                        children: [
                                            new TextRun({ text: "3.3  เจ้าของหรือผู้ครอบครองอาคารที่ป้ายตั้งอยู่" }),
                                        ],
                                    }),

                                    new Paragraph({
                                        indent: INDENT_1,
                                        children: [
                                            new TextRun({ text: "ชื่อ  " }),
                                            new TextRun({
                                                // ✅ แก้ไข
                                                text: (isBuildingSign ? vr(s2?.buildingOwnerName) : "") || "................................................................................................",
                                            }),
                                        ],
                                    }),

                                    new Paragraph({
                                        indent: INDENT_1,
                                        children: [
                                            new TextRun({ text: "สถานที่ติดต่อ  " }),
                                            new TextRun({ text: (isBuildingSign ? vr(s2?.buildingOwnerNo) : "") || "........................." }), // ✅ แก้ไข
                                            new TextRun({ text: "  หมู่ที่  " }),
                                            new TextRun({ text: (isBuildingSign ? vr(s2?.buildingOwnerMoo) : "") || "........" }), // ✅ แก้ไข
                                            new TextRun({ text: "  ตรอก/ซอย  " }),
                                            new TextRun({ text: (isBuildingSign ? vr(s2?.buildingOwnerAlley) : "") || "........................." }), // ✅ แก้ไข
                                        ],
                                    }),

                                    new Paragraph({
                                        indent: INDENT_1,
                                        children: [
                                            new TextRun({ text: "ถนน  " }),
                                            new TextRun({ text: (isBuildingSign ? vr(s2?.buildingOwnerRoad) : "") || "........................." }), // ✅ แก้ไข
                                            new TextRun({ text: "  ตำบล/แขวง  " }),
                                            new TextRun({ text: (isBuildingSign ? vr(s2?.buildingOwnerSub) : "") || "........................." }), // ✅ แก้ไข
                                        ],
                                    }),

                                    new Paragraph({
                                        indent: INDENT_1,
                                        children: [
                                            new TextRun({ text: "อำเภอ/เขต  " }),
                                            new TextRun({ text: (isBuildingSign ? vr(s2?.buildingOwnerDist) : "") || "........................." }), // ✅ แก้ไข
                                            new TextRun({ text: "  จังหวัด  " }),
                                            new TextRun({ text: (isBuildingSign ? vr(s2?.buildingOwnerProv) : "") || "........................." }), // ✅ แก้ไข
                                        ],
                                    }),

                                    new Paragraph({
                                        indent: INDENT_1,
                                        children: [
                                            new TextRun({ text: "รหัสไปรษณีย์  " }),
                                            new TextRun({ text: (isBuildingSign ? vr(s2?.buildingOwnerZip) : "") || "........................." }), // ✅ แก้ไข
                                        ],
                                    }),

                                    new Paragraph({
                                        indent: INDENT_1,
                                        children: [
                                            new TextRun({ text: "โทรศัพท์  " }),
                                            new TextRun({ text: (isBuildingSign ? vr(s2?.buildingOwnerTel) : "") || "........................." }), // ✅ แก้ไข
                                            new TextRun({ text: "  โทรสาร  " }),
                                            new TextRun({ text: (isBuildingSign ? vr(s2?.buildingOwnerFax) : "") || "........................." }), // ✅ แก้ไข
                                        ],
                                    }),

                                    new Paragraph({
                                        indent: INDENT_1,
                                        spacing: { after: 120 },
                                        children: [
                                            new TextRun({ text: "อีเมล  " }),
                                            new TextRun({ text: (isBuildingSign ? vr(s2?.buildingOwnerEmail) : "") || ".........................................................." }), // ✅ แก้ไข
                                        ],
                                    }),

                                    /* ===== 3.4 ===== */
                                    new Paragraph({
                                        spacing: { after: 80 },
                                        children: [
                                            new TextRun({ text: "3.4  ผู้ออกแบบด้านวิศวกรรมโครงสร้าง" }),
                                        ],
                                    }),

                                    new Paragraph({
                                        indent: INDENT_1,
                                        children: [
                                            new TextRun({ text: "ชื่อ  " }),
                                            new TextRun({ text: (isBuildingSign ? vr(s2?.designerName) : "") || ".........................................................." }), // ✅ แก้ไข
                                            new TextRun({ text: "  ใบอนุญาตทะเบียนเลขที่  " }),
                                            new TextRun({ text: (isBuildingSign ? vr(s2?.designerLicense) : "") || ".............................." }), // ✅ แก้ไข
                                        ],
                                    }),

                                ],
                            }),
                        ],
                    }),
                ],
            }),

            new Paragraph({
                pageBreakBefore: true,
            }),

            new Paragraph({
                children: [
                    new TextRun({
                        text: "4. ประเภทของวัสดุและรายละเอียดของแผ่นป้าย (สามารถระบุมากกว่า 1 ข้อได้)",
                        bold: true,
                        size: 32,
                    }),
                ],
            }),

            // ===== 4.1 =====
            new Paragraph({
                indent: INDENT_1,
                spacing: { after: 120 },
                children: [
                    new TextRun({
                        text: "4.1  ประเภทวัสดุของสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย",
                        bold: true,
                        size: 32,
                    }),
                ],
            }),

            new Paragraph({
                indent: INDENT_2,
                children: [
                    new TextRun({
                        text: `${s2?.matSteel ? "☑" : "☐"} เหล็กโครงสร้างรูปพรรณ`,
                    }),
                ],
            }),

            new Paragraph({
                indent: INDENT_2,
                children: [
                    new TextRun({
                        text: `${s2?.matWood ? "☑" : "☐"} ไม้`,
                    }),
                ],
            }),

            new Paragraph({
                indent: INDENT_2,
                children: [
                    new TextRun({
                        text: `${s2?.matStainless ? "☑" : "☐"} สแตนเลส`,
                    }),
                ],
            }),

            new Paragraph({
                indent: INDENT_2,
                children: [
                    new TextRun({
                        text: `${s2?.matRCC ? "☑" : "☐"} คอนกรีตเสริมเหล็ก`,
                    }),
                ],
            }),

            new Paragraph({
                indent: INDENT_2,
                spacing: { after: 120 },
                children: [
                    new TextRun({
                        text: `${s2?.matOtherChecked || (s2?.matOther && s2.matOther.trim() !== "")
                            ? "☑"
                            : "☐"
                            } อื่น ๆ (ระบุ)  ${s2?.matOther || ".................................................."}`,
                    }),
                ],
            }),

            // ===== 4.2 =====
            new Paragraph({
                indent: INDENT_1,
                spacing: { after: 120 },
                children: [
                    new TextRun({
                        text: "4.2  รายละเอียดของแผ่นป้าย",
                        bold: true,
                        size: 32,
                    }),
                ],
            }),

            // วัสดุของป้าย
            new Paragraph({
                indent: INDENT_2,
                children: [
                    new TextRun({
                        text: `${s2?.chkMat ? "☑" : "☐"} วัสดุของป้าย (โปรดระบุ)  ${s2?.panelMaterial || ".................................................."
                            }`,
                    }),
                ],
            }),

            // จำนวนด้านของป้าย
            new Paragraph({
                indent: INDENT_2,
                children: [
                    new TextRun({
                        text: `${s2?.chkFaces ? "☑" : "☐"} จำนวนด้านที่ติดตั้งป้าย (โปรดระบุจำนวนด้าน)  ${s2?.panelFaces || "........"
                            }  ด้าน`,
                    }),
                ],
            }),

            // การเจาะช่องเปิดในป้าย
            new Paragraph({
                indent: INDENT_2,
                children: [
                    new TextRun({
                        text: `${s2?.chkOpen ? "☑" : "☐"} การเจาะช่องเปิดในป้าย`,
                    }),
                ],
            }),

            new Paragraph({
                indent: INDENT_3,
                children: [
                    new TextRun({
                        text: `${s2?.panelOpenings === "มี" ? "☑" : "☐"} มี`,
                    }),
                    new TextRun({ text: "     " }),
                    new TextRun({
                        text: `${s2?.panelOpenings === "ไม่มี" ? "☑" : "☐"} ไม่มี`,
                    }),
                ],
            }),

            // อื่น ๆ
            new Paragraph({
                indent: INDENT_2,
                spacing: { after: 120 },
                children: [
                    new TextRun({
                        text: `${s2?.chkOther ? "☑" : "☐"} อื่น ๆ (โปรดระบุ)  ${s2?.panelOther || ".................................................."
                            }`,
                    }),
                ],
            }),

        ];
        /* ---------- Section 3 ---------- */
        const section3: (Paragraph | Table)[] = [];

        /* ===== หัวข้อส่วนที่ 3 ===== */
        section3.push(
            new Paragraph({
                pageBreakBefore: true,
                spacing: { after: 240 },
                children: [
                    new TextRun({
                        text: "ส่วนที่ 3 ผลการตรวจสอบสภาพป้ายและอุปกรณ์ประกอบของป้าย",
                        bold: true,
                        size: 48,
                    }),
                ],
            })
        );

        /* ===== คำอธิบาย ===== */
        section3.push(
            new Paragraph({
                indent: INDENT_1,
                spacing: { after: 160 },
                children: [
                    new TextRun({
                        text:
                            "ส่วนที่ 3 เป็นผลการตรวจสอบสภาพป้าย สิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย และอุปกรณ์ต่าง ๆ ของป้าย...",
                        size: 32,
                    }),
                ],
            })
        );

        section3.push(
            new Paragraph({
                indent: INDENT_1,
                spacing: { after: 240 },
                children: [
                    new TextRun({
                        text:
                            "การตรวจสอบป้าย สิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย และอุปกรณ์ประกอบต่าง ๆ ของป้าย...",
                        size: 32,
                    }),
                ],
            })
        );

        /* ===== ตารางข้อ 1–7 ===== */
        CHECK_ITEMS.forEach((cfg, index) => {
            const key = `s3-${index + 1}`;
            const items = s3?.items ?? {};
            const row = items[key];

            // แบ่งหน้า: 1/2 – 3/4 – 5/6 – 7
            if (index === 1 || index === 3 || index === 5) {
                section3.push(new Paragraph({ pageBreakBefore: true }));
            }

            section3.push(
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    borders: {
                        top: { style: BorderStyle.SINGLE, size: 1 },
                        bottom: { style: BorderStyle.SINGLE, size: 1 },
                        left: { style: BorderStyle.SINGLE, size: 1 },
                        right: { style: BorderStyle.SINGLE, size: 1 },
                        insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
                        insideVertical: { style: BorderStyle.SINGLE, size: 1 },
                    },
                    rows: [
                        ...(index === 0
                            ? [
                                new TableRow({
                                    children: [
                                        new TableCell({
                                            columnSpan: 2,
                                            children: [
                                                new Paragraph({
                                                    alignment: AlignmentType.CENTER,
                                                    children: [
                                                        new TextRun({
                                                            text: "รายการตรวจสอบ",
                                                            bold: true,
                                                            size: 30,
                                                        }),
                                                    ],
                                                }),
                                            ],
                                        }),
                                    ],
                                }),
                            ]
                            : []),

                        /* ===== หัวข้อ ===== */
                        new TableRow({
                            children: [
                                new TableCell({
                                    columnSpan: 2,
                                    children: [
                                        new Paragraph({
                                            children: [
                                                new TextRun({
                                                    text: `${index + 1}. ${cfg.title}`,
                                                    bold: true,
                                                    size: 28,
                                                }),
                                            ],
                                        }),
                                    ],
                                }),
                            ],
                        }),

                        /* ===== checkbox + detail ===== */
                        new TableRow({
                            children: [
                                new TableCell({
                                    width: { size: 30, type: WidthType.PERCENTAGE },
                                    children: [
                                        new Paragraph({
                                            children: [
                                                new TextRun({
                                                    text: `${row?.noChecked ? "☑" : "☐"} ${cfg.noText}`,
                                                    size: 26,
                                                }),
                                            ],
                                        }),
                                    ],
                                }),
                                new TableCell({
                                    width: { size: 70, type: WidthType.PERCENTAGE },
                                    children: [
                                        new Paragraph({
                                            children: [
                                                new TextRun({
                                                    text: `${row?.hasChecked ? "☑" : "☐"} ${cfg.hasText}`,
                                                    size: 26,
                                                }),
                                            ],
                                        }),
                                        new Paragraph({
                                            children: [
                                                new TextRun({
                                                    text: "(หากระบุว่า ‘มี’ ให้บันทึกรายละเอียดด้านล่าง)",
                                                    size: 24,
                                                }),
                                            ],
                                        }),
                                        dotLine(),
                                        dotLine(),
                                        dotLine(),
                                    ],
                                }),
                            ],
                        }),

                        /* ===== ความเห็นผู้ตรวจสอบ ===== */
                        new TableRow({
                            children: [
                                new TableCell({
                                    width: { size: 30, type: WidthType.PERCENTAGE },
                                    children: [new Paragraph({ text: "" })],
                                }),
                                new TableCell({
                                    width: { size: 70, type: WidthType.PERCENTAGE },
                                    children: [
                                        new Paragraph({
                                            children: [
                                                new TextRun({ text: "ความเห็นของผู้ตรวจสอบ  ", size: 26 }),
                                                new TextRun({
                                                    text: `${row?.status === "ok" ? "☑" : "☐"} ใช้ได้   `,
                                                    size: 26,
                                                }),
                                                new TextRun({
                                                    text: `${row?.status === "ng" ? "☑" : "☐"} ใช้ไม่ได้`,
                                                    size: 26,
                                                }),
                                            ],
                                        }),
                                        dotLine(),
                                        dotLine(),
                                        dotLine(),
                                    ],
                                }),
                            ],
                        }),

                        /* ===== อื่น ๆ ===== */
                        new TableRow({
                            children: [
                                new TableCell({
                                    width: { size: 30, type: WidthType.PERCENTAGE },
                                    children: [new Paragraph({ text: "" })],
                                }),
                                new TableCell({
                                    width: { size: 70, type: WidthType.PERCENTAGE },
                                    children: [
                                        new Paragraph({
                                            children: [
                                                new TextRun({
                                                    text: `${row?.otherChecked ? "☑" : "☐"} อื่น ๆ (โปรดระบุ)`,
                                                    size: 26,
                                                }),
                                            ],
                                        }),
                                        dotLine(),
                                        dotLine(),
                                        dotLine(),
                                    ],
                                }),
                            ],
                        }),
                    ],
                })
            );
        });

        /* ===== ตารางข้อ 8 ===== */
        section3.push(new Paragraph({ pageBreakBefore: true }));
        section3.push(
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: {
                    top: { style: BorderStyle.SINGLE, size: 1 },
                    bottom: { style: BorderStyle.SINGLE, size: 1 },
                    left: { style: BorderStyle.SINGLE, size: 1 },
                    right: { style: BorderStyle.SINGLE, size: 1 },
                    insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
                    insideVertical: { style: BorderStyle.SINGLE, size: 1 },
                },
                rows: [
                    /* ===== title ===== */
                    new TableRow({
                        children: [
                            new TableCell({
                                columnSpan: 11,
                                children: [
                                    new Paragraph({
                                        children: [
                                            new TextRun({
                                                text:
                                                    "8. การตรวจสอบการเชื่อมยึดระหว่างแผ่นป้ายกับสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย การเชื่อมยึดระหว่างชิ้นส่วนต่าง ๆ ของสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย และการเชื่อมยึดระหว่างสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้ายกับฐานรากหรืออาคาร",
                                                bold: true,
                                            }),
                                        ],
                                    }),
                                ],
                            }),
                        ],
                    }),

                    /* ===== header (แถวบน) ===== */
                    new TableRow({
                        children: [
                            headerCell("ลำดับที่"),
                            headerCell("รายการ"),
                            headerCell("มี"),
                            headerCell("ไม่มี"),
                            headerCell("การชำรุดสึกหรอ", 2),
                            headerCell("ความเสียหาย", 2),
                            headerCell("ความเห็นผู้ตรวจสอบ", 2),
                            headerCell("หมายเหตุ"),
                        ],
                    }),

                    /* ===== header (แถวล่าง หมุน 90°) ===== */
                    new TableRow({
                        children: [
                            new TableCell({ children: [new Paragraph({ text: "" })] }), // ลำดับที่
                            new TableCell({ children: [new Paragraph({ text: "" })] }), // รายการ
                            new TableCell({ children: [new Paragraph({ text: "" })] }), // มี
                            new TableCell({ children: [new Paragraph({ text: "" })] }), // ไม่มี

                            ...[
                                "มี",
                                "ไม่มี",
                                "มี",
                                "ไม่มี",
                                "ใช้ได้",
                                "ใช้ไม่ได้",
                            ].map(text =>
                                new TableCell({
                                    verticalAlign: VerticalAlign.CENTER,
                                    textDirection:
                                        TextDirection.BOTTOM_TO_TOP_LEFT_TO_RIGHT,
                                    children: [
                                        new Paragraph({
                                            alignment: AlignmentType.CENTER,
                                            children: [
                                                new TextRun({ text, bold: true }),
                                            ],
                                        }),
                                    ],
                                })
                            ),

                            new TableCell({ children: [new Paragraph({ text: "" })] }), // หมายเหตุ
                        ],
                    }),

                    /* ===== rows จริง ===== */
                    ...section8Rows,
                ],
            })
        );

        section3.push(noteParagraph);

        section3.push(new Paragraph({ pageBreakBefore: true }));

        section3.push(
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: {
                    top: { style: BorderStyle.SINGLE, size: 1 },
                    bottom: { style: BorderStyle.SINGLE, size: 1 },
                    left: { style: BorderStyle.SINGLE, size: 1 },
                    right: { style: BorderStyle.SINGLE, size: 1 },
                    insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
                    insideVertical: { style: BorderStyle.SINGLE, size: 1 },
                },
                rows: [
                    /* ===== title ===== */
                    new TableRow({
                        children: [
                            new TableCell({
                                columnSpan: 11,
                                children: [
                                    new Paragraph({
                                        children: [
                                            new TextRun({
                                                text:
                                                    "9. การตรวจสอบอุปกรณ์ประกอบต่าง ๆ ของป้าย (ต่อ)",
                                                bold: true,
                                            }),
                                        ],
                                    }),
                                ],
                            }),
                        ],
                    }),

                    /* ===== header (แถวบน) ===== */
                    new TableRow({
                        children: [
                            headerCell("ลำดับที่"),
                            headerCell("รายการ"),
                            headerCell("มี"),
                            headerCell("ไม่มี"),
                            headerCell("การชำรุดสึกหรอ", 2),
                            headerCell("ความเสียหาย", 2),
                            headerCell("ความเห็นผู้ตรวจสอบ", 2),
                            headerCell("หมายเหตุ"),
                        ],
                    }),

                    /* ===== header (แถวล่าง หมุน 90°) ===== */
                    new TableRow({
                        children: [
                            new TableCell({ children: [new Paragraph({ text: "" })] }), // ลำดับที่
                            new TableCell({ children: [new Paragraph({ text: "" })] }), // รายการ
                            new TableCell({ children: [new Paragraph({ text: "" })] }), // มี
                            new TableCell({ children: [new Paragraph({ text: "" })] }), // ไม่มี

                            ...[
                                "มี",
                                "ไม่มี",
                                "มี",
                                "ไม่มี",
                                "ใช้ได้",
                                "ใช้ไม่ได้",
                            ].map(text =>
                                new TableCell({
                                    verticalAlign: VerticalAlign.CENTER,
                                    textDirection:
                                        TextDirection.BOTTOM_TO_TOP_LEFT_TO_RIGHT,
                                    children: [
                                        new Paragraph({
                                            alignment: AlignmentType.CENTER,
                                            children: [
                                                new TextRun({ text, bold: true }),
                                            ],
                                        }),
                                    ],
                                })
                            ),

                            new TableCell({ children: [new Paragraph({ text: "" })] }), // หมายเหตุ
                        ],
                    }),

                    /* ===== rows จริง ===== */
                    ...section9Rows,
                ],
            })
        );

        section3.push(noteParagraph);

        // ===== หัวข้อ =====
        section3.push(
            new Paragraph({
                spacing: {
                    before: 300, // ขยับลงจากตาราง
                    after: 200,
                },
                children: [
                    new TextRun({
                        text: "รายละเอียดเพิ่มเติม",
                        size: 32, // 16 pt
                    }),
                ],
            })
        );

        // ===== ข้อมูลบรรทัดที่ 1 =====
        if (s3?.section9Extra1) {
            section3.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: s3?.section9Extra1,
                            size: 32,
                        }),
                    ],
                })
            );
        }

        // ===== ข้อมูลบรรทัดที่ 2 =====
        if (s3?.section9Extra2) {
            section3.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: s3?.section9Extra2,
                            size: 32,
                        }),
                    ],
                })
            );
        }

        const section4 = [
            new Paragraph({
                pageBreakBefore: true,
                children: [
                    new TextRun({
                        text: "ส่วนที่ 4 สรุปผลการตรวจสอบป้าย",
                        bold: true,
                        size: 48, // 24pt
                    }),
                ],
            }),
            // ตาราง
            tableS4,
            // หมายเหตุท้ายตาราง
            new Paragraph({
                spacing: { before: 100 },
                children: [
                    new TextRun({ text: "หมายเหตุ", bold: true, underline: {}, size: 24 }),
                    new TextRun({ text: "   N/A  หมายถึง  มีระบบ แต่ไม่สามารถตรวจสอบ / ทดสอบได้", size: 24 }),
                ],
            }),

            // --- ขึ้นหน้าใหม่ + หัวข้อ ---
            new Paragraph({
                pageBreakBefore: true,
                spacing: { after: 300 },
                children: [
                    new TextRun({
                        text: "สรุปความเห็นผู้ตรวจสอบ",
                        bold: true,
                        underline: {},
                        size: 32,
                    }),
                ],
            }),

            // --- ย่อหน้า 1 ---
            new Paragraph({
                indent: { firstLine: 720 },
                spacing: { line: 360, lineRule: "auto", after: 200 },
                children: [
                    new TextRun({
                        text: `ตามที่บริษัท โปรไฟร์ อินสเปคเตอร์ จำกัด ได้ทำการตรวจสอบป้ายของ ${compName} ชื่อ ${sName} ตามหลักเกณฑ์การตรวจสอบแล้วเห็นว่า โครงสร้างป้ายมีความแข็งแรง อยู่ในสภาพปลอดภัยในการใช้งาน`,
                        size: 32,
                    }),
                ],
            }),

            // --- ย่อหน้า 2 ---
            new Paragraph({
                indent: { firstLine: 720 },
                spacing: { line: 360, lineRule: "auto", after: 400 },
                children: [
                    new TextRun({
                        text: "ข้าพเจ้าในฐานะผู้ตรวจสอบป้ายขอรับรองว่าได้ทำการตรวจสอบสภาพป้ายดังกล่าว โดยผลการตรวจสอบป้ายและอุปกรณ์ประกอบของป้ายถูกต้อง และเป็นจริงตามที่ได้ระบุไว้ในรายงานฉบับนี้ รวมทั้งยังได้ให้เจ้าของป้าย ผู้ครอบครอง หรือผู้ดูแลป้าย ได้รับทราบผลการตรวจสอบสภาพป้ายและอุปกรณ์ประกอบของป้ายตามรายงานข้างต้นอย่างครบถ้วนแล้ว",
                        size: 32,
                    }),
                ],
            }),

            // ===============================================
            // 1. ลงชื่อผู้ตรวจสอบ (ชิดซ้าย)
            // ===============================================
            new Paragraph({
                spacing: { before: 200 },
                children: [
                    new TextRun({ text: "ลงชื่อ .............................................................. ผู้ตรวจสอบ", size: 32 }),
                ],
            }),
            new Paragraph({
                indent: { left: 720 }, // ย่อหน้าเข้ามานิดหน่อยให้ชื่อตรงกับเส้นประ
                spacing: { before: 100 },
                children: [
                    new TextRun({ text: `( ${inspectorName} )`, size: 32 }),
                ],
            }),
            new Paragraph({
                indent: { left: 720 },
                spacing: { before: 100 },
                children: [
                    new TextRun({ text: `วันที่ ${dateString}`, size: 32 }),
                ],
            }),

            // --- ข้อมูลเลขทะเบียนผู้ตรวจสอบ (ชิดซ้ายปกติ) ---
            new Paragraph({
                spacing: { before: 400, after: 100 },
                children: [
                    new TextRun({ text: "เลขทะเบียนผู้ตรวจสอบ", bold: true, underline: {}, size: 32 }),
                ],
            }),
            new Paragraph({
                children: [
                    new TextRun({
                        text: "ผู้ตรวจสอบประเภทนิติบุคคล ทะเบียนเลขที่ น.0022/2550 จาก กรมโยธาธิการและผังเมืองกระทรวงมหาดไทย",
                        size: 32
                    }),
                ],
            }),
            new Paragraph({
                children: [
                    new TextRun({ text: "โดยนาม บริษัท โปรไฟร์ อินสเปคเตอร์ จำกัด", size: 32 }),
                ],
            }),
            new Paragraph({
                spacing: { after: 400 },
                children: [
                    new TextRun({ text: "เลขที่ 112 ซอยรามคำแหง 112 แขวงสะพานสูง เขตสะพานสูง กรุงเทพมหานคร 10240", size: 32 }),
                ],
            }),

            // --- ย่อหน้าการรับรองของเจ้าของป้าย ---
            new Paragraph({
                indent: { firstLine: 720 },
                spacing: { line: 360, lineRule: "auto", after: 400 },
                children: [
                    new TextRun({
                        text: "ข้าพเจ้าในฐานะเจ้าของป้าย ผู้ครอบครองป้าย หรือผู้ดูแลป้าย ขอรับรองว่าได้มีการตรวจสอบป้ายตามรายงานดังกล่าวข้างต้นจริง โดยการตรวจสอบป้ายนั้นกระทำโดยผู้ตรวจสอบป้ายซึ่งได้รับใบอนุญาตจากกรมโยธาธิการและผังเมือง ข้าพเจ้าได้อ่านและเข้าใจในรายงานดังกล่าวครบถ้วนแล้ว จึงลงลายมือชื่อไว้เป็นสำคัญ",
                        size: 32,
                    }),
                ],
            }),

            // ===============================================
            // 2. ลงชื่อเจ้าของป้าย (ชิดซ้าย + ข้อความต่อกัน)
            // ===============================================
            new Paragraph({
                spacing: { before: 200 },
                children: [
                    new TextRun({
                        text: "ลงชื่อ ........................................................................เจ้าของป้ายหรือสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย /",
                        size: 32
                    }),
                ],
            }),
            new Paragraph({
                indent: { left: 4320 }, // ย่อหน้าให้ข้อความ "ผู้ครอบครอง..." ไปต่อท้าย slash หรือขึ้นบรรทัดใหม่แบบสวยงาม
                children: [
                    new TextRun({
                        text: "ผู้ครอบครองป้าย หรือผู้รับมอบอำนาจ",
                        size: 32
                    }),
                ],
            }),
            new Paragraph({
                indent: { left: 720 }, // ย่อหน้าชื่อในวงเล็บ
                spacing: { before: 100 },
                children: [
                    new TextRun({ text: `( ${ownerNamePrint} )`, size: 32 }),
                ],
            }),
        ];

        const txtType = coverType || "-";
        const txtName = coverName || "-";
        // const txtCompany = coverCompany || "-";
        const txtAddress = coverAddress || "-";

        const table1Data: any = s2_5.table1 || {};
        const table2Data: any = s2_5.table2 || {};
        const m6Table1Data: any = s2_6.table1 || {};
        const m6Table2Data: any = s2_6.table2 || {};

        const s7Data: any = formData.section2_7 || {}; // ดึงชั้นเดียวพอ
        const s7Rows = s7Data.rows || {};
        const meta = s7Data.meta || {};

        const checkFreqCell = (targetFreq: string, actualFreq: string) => {
            const isChecked = targetFreq === actualFreq;
            return new TableCell({
                verticalAlign: VerticalAlign.CENTER,
                children: [
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 120, after: 120 }, // เพิ่ม spacing เพื่อยืดตาราง
                        children: [
                            new TextRun({
                                text: isChecked ? "✓" : "",
                                font: "Angsana New", // หรือ Wingdings 2 ถ้ามี
                                size: 32,
                                bold: true,
                            }),
                        ],
                    }),
                ],
            });
        };

        const checkFreqCellV2 = (targetFreq: string, actualFreq: string) => {
            const isChecked = targetFreq === actualFreq;
            return new TableCell({
                verticalAlign: VerticalAlign.CENTER,
                children: [
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 120, after: 120 }, // ✅ เพิ่มระยะห่างให้เหมือนตาราง 2
                        children: [
                            new TextRun({
                                text: isChecked ? "✓" : "",
                                font: "Angsana New",
                                size: 32,
                                bold: true,
                            }),
                        ],
                    }),
                ],
            });
        };

        // Helper: สร้างแถวข้อมูลสำหรับตาราง 1 (ปรับปรุง spacing และ alignment)
        const createFreqRowV2 = (index: string, text: string, rowKey: string) => {
            const rowData = table1Data[rowKey] || {};
            const freq = rowData.freq || "6m";
            const note = rowData.note || "";

            return new TableRow({
                children: [
                    // ... (rest of the code remains the same)
                    // 1. ลำดับ
                    new TableCell({
                        verticalAlign: VerticalAlign.CENTER,
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                spacing: { before: 120, after: 120 },
                                children: [new TextRun({ text: index, size: 32, font: FONT_TH })]
                            })
                        ],
                    }),
                    // 2. รายการ
                    new TableCell({
                        verticalAlign: VerticalAlign.CENTER,
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.LEFT,
                                spacing: { before: 120, after: 120 },
                                children: [new TextRun({ text: text, size: 32, font: FONT_TH })]
                            })
                        ],
                    }),
                    // 3. ความถี่
                    checkFreqCellV2("1m", freq),
                    checkFreqCellV2("4m", freq),
                    checkFreqCellV2("6m", freq),
                    checkFreqCellV2("1y", freq),
                    checkFreqCellV2("3y", freq),
                    // 4. หมายเหตุ
                    new TableCell({
                        verticalAlign: VerticalAlign.CENTER,
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                spacing: { before: 120, after: 120 },
                                children: [new TextRun({ text: note, size: 32, font: FONT_TH })]
                            })
                        ],
                    }),
                ],
            });
        };

        const createGroupRow = (index: string, text: string) => {
            return new TableRow({
                children: [
                    // ลำดับ
                    new TableCell({
                        verticalAlign: VerticalAlign.CENTER,
                        children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 120 }, children: [new TextRun({ text: index, size: 32, font: FONT_TH, bold: true })] })],
                    }),
                    // รายการ (ตัวหนา)
                    new TableCell({
                        verticalAlign: VerticalAlign.CENTER,
                        children: [new Paragraph({ spacing: { before: 120, after: 120 }, children: [new TextRun({ text: text, size: 32, font: FONT_TH, bold: true })] })],
                    }),
                    // ช่องความถี่ว่างๆ (5 ช่อง)
                    ...Array(5).fill(0).map(() => new TableCell({ children: [new Paragraph({})] })),
                    // ช่องหมายเหตุว่างๆ
                    new TableCell({ children: [new Paragraph({})] }),
                ],
            });
        };

        // Helper: สร้างแถวข้อย่อย (เช่น (1) สภาพสายไฟฟ้า)
        const createSubRow = (text: string, rowKey: string, isOther: boolean = false) => {
            const rowData = table2Data[rowKey] || {};
            const freq = rowData.freq || "6m";
            const note = rowData.note || "";

            // กรณีเป็นช่อง "อื่นๆ" ให้เอา text จาก customLabel มาต่อท้าย หรือใช้จุดไข่ปลา
            let displayText = text;
            if (isOther) {
                const customText = rowData.customLabel ? rowData.customLabel : "........................................";
                displayText = `${text} ${customText}`;
            }

            return new TableRow({
                children: [
                    // ลำดับ (ว่าง)
                    new TableCell({ children: [new Paragraph({})] }),
                    // รายการ (ย่อหน้าเล็กน้อย)
                    new TableCell({
                        verticalAlign: VerticalAlign.CENTER,
                        children: [
                            new Paragraph({
                                indent: { left: 360 }, // ย่อหน้าข้อย่อย
                                spacing: { before: 120, after: 120 },
                                children: [new TextRun({ text: displayText, size: 32, font: FONT_TH })]
                            })
                        ],
                    }),
                    // ความถี่
                    checkFreqCell("1m", freq),
                    checkFreqCell("4m", freq),
                    checkFreqCell("6m", freq),
                    checkFreqCell("1y", freq),
                    checkFreqCell("3y", freq),
                    // หมายเหตุ
                    new TableCell({
                        verticalAlign: VerticalAlign.CENTER,
                        children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 120 }, children: [new TextRun({ text: note, size: 32, font: FONT_TH })] })],
                    }),
                ],
            });
        };

        // Helper 1: Cell เช็คเครื่องหมาย (ตัด Spacing ออกให้เรียบเนียน)
        const checkResultCellFinal = (isCheck: boolean) => new TableCell({
            verticalAlign: VerticalAlign.CENTER,
            width: { size: 5, type: WidthType.PERCENTAGE },
            children: [
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({
                            text: isCheck ? "✓" : "-", // ใช้ ✓ หรือ -
                            font: isCheck ? "Angsana New" : FONT_TH,
                            size: 32,
                            bold: isCheck,
                        }),
                    ],
                }),
            ],
        });

        // Helper 2: Row แบบแยก Column ชัดเจน (Index | Text | Check | Check | Note)
        const createM6RowFinal = (index: string, text: string, rowId: string) => {
            const rowData = s2_6?.table1?.[rowId] || {};
            const note = rowData.note ?? "";
            const label = rowData.extra ? `${text} ${rowData.extra}` : text;

            // 🟢 สร้าง Cells สำหรับ Checkbox ตามจำนวนรอบ
            const roundCells: TableCell[] = [];
            const count = Math.max(1, roundCount);

            for (let i = 1; i <= count; i++) {
                // ✅ แก้ไขตรงนี้: cast type เป็น VisitKey เพื่อแก้ error ts(7053)
                const visitKey = `v${i}` as VisitKey;

                const status = rowData?.visits?.[visitKey]; // "ok" | "ng"

                roundCells.push(
                    checkResultCellFinal(status === 'ok'), // ช่อง "ใช้ได้"
                    checkResultCellFinal(status === 'ng')  // ช่อง "ไม่ได้"
                );
            }

            return new TableRow({
                children: [
                    // 1. ลำดับ
                    new TableCell({
                        verticalAlign: VerticalAlign.TOP,
                        children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 40, after: 40 }, children: [new TextRun({ text: index, size: 32, font: FONT_TH })] })],
                    }),
                    // 2. รายการ
                    new TableCell({
                        verticalAlign: VerticalAlign.TOP,
                        children: [new Paragraph({ spacing: { before: 40, after: 40 }, children: [new TextRun({ text: label, size: 32, font: FONT_TH })] })],
                    }),
                    // 3. Dynamic Checkboxes (Round 1..N) -> Spread เข้าไป
                    ...roundCells,
                    // 4. หมายเหตุ
                    new TableCell({
                        verticalAlign: VerticalAlign.TOP,
                        children: [new Paragraph({ alignment: AlignmentType.LEFT, spacing: { before: 40, after: 40 }, children: [new TextRun({ text: note, size: 32, font: FONT_TH })] })],
                    }),
                ],
            });
        };

        // Helper: สร้าง Row ข้อย่อย (เหมือนตาราง 1 แต่มี Indent ชื่อรายการ)
        const createM6SubRow = (index: string, text: string, rowId: string, isCustom = false) => {
            if (!rowId) {
                // หัวข้อกลุ่ม: สร้างช่องว่างให้ครบตามจำนวนคอลัมน์
                const count = Math.max(1, roundCount);
                const totalEmpty = (count * 2) + 1; // (รอบ * 2) + หมายเหตุ
                const emptyCells = Array(totalEmpty).fill(new TableCell({ children: [new Paragraph("")] }));

                return new TableRow({
                    children: [
                        new TableCell({ verticalAlign: VerticalAlign.TOP, children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 40, after: 40 }, children: [new TextRun({ text: index, size: 32, font: FONT_TH })] })] }),
                        new TableCell({ verticalAlign: VerticalAlign.TOP, children: [new Paragraph({ spacing: { before: 40, after: 40 }, children: [new TextRun({ text: text, bold: true, size: 32, font: FONT_TH })] })] }),
                        ...emptyCells
                    ]
                });
            }

            const rowData = s2_6?.table2?.[rowId] || {};
            const note = rowData.note ?? "";

            let displayText = text;
            if (isCustom && rowData.extra) displayText = `- อื่น ๆ (${rowData.extra})`;
            else if (rowData.extra) displayText = `${text} ${rowData.extra}`;

            // 🟢 สร้าง Cells สำหรับ Checkbox ตามจำนวนรอบ
            const roundCells: TableCell[] = [];
            const count = Math.max(1, roundCount);

            for (let i = 1; i <= count; i++) {
                // ✅ แก้ไขตรงนี้: cast type เป็น VisitKey
                const visitKey = `v${i}` as VisitKey;

                const status = rowData?.visits?.[visitKey];

                roundCells.push(
                    checkResultCellFinal(status === 'ok'),
                    checkResultCellFinal(status === 'ng')
                );
            }

            return new TableRow({
                children: [
                    new TableCell({
                        verticalAlign: VerticalAlign.TOP,
                        children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 40, after: 40 }, children: [new TextRun({ text: "", size: 32, font: FONT_TH })] })],
                    }),
                    new TableCell({
                        verticalAlign: VerticalAlign.TOP,
                        children: [
                            new Paragraph({
                                indent: { left: 360 },
                                spacing: { before: 40, after: 40 },
                                children: [new TextRun({ text: displayText, size: 32, font: FONT_TH })]
                            })
                        ],
                    }),
                    // ✅ Spread Cells
                    ...roundCells,
                    new TableCell({
                        verticalAlign: VerticalAlign.TOP,
                        children: [new Paragraph({ alignment: AlignmentType.LEFT, spacing: { before: 40, after: 40 }, children: [new TextRun({ text: note, size: 32, font: FONT_TH })] })],
                    }),
                ],
            });
        };

        const createRoundHeaderCells = () => {
            const cells: TableCell[] = [];
            const count = Math.max(1, roundCount); // อย่างน้อย 1 รอบ

            for (let i = 1; i <= count; i++) {
                cells.push(
                    new TableCell({
                        columnSpan: 2, // (ใช้ได้, ไม่ได้)
                        width: { size: 10, type: WidthType.PERCENTAGE }, // ปรับ % ตามความเหมาะสม
                        verticalAlign: VerticalAlign.CENTER,
                        textDirection: TextDirection.BOTTOM_TO_TOP_LEFT_TO_RIGHT, // แนวตั้งเหมือนต้นฉบับ
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                children: [new TextRun({ text: `รอบที่ ${i}`, bold: true, size: 32, font: FONT_TH })]
                            })
                        ],
                    })
                );
            }
            return cells;
        };

        const createSubHeaderCells = () => {
            const cells: TableCell[] = [];
            const count = Math.max(1, roundCount); // อย่างน้อย 1 รอบ

            for (let i = 1; i <= count; i++) {
                cells.push(
                    // ช่อง "ใช้ได้"
                    new TableCell({
                        verticalAlign: VerticalAlign.CENTER,
                        textDirection: TextDirection.BOTTOM_TO_TOP_LEFT_TO_RIGHT, // แนวตั้ง
                        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "ใช้ได้", bold: true, size: 32, font: FONT_TH })] })],
                    }),
                    // ช่อง "ใช้ไม่ได้"
                    new TableCell({
                        verticalAlign: VerticalAlign.CENTER,
                        textDirection: TextDirection.BOTTOM_TO_TOP_LEFT_TO_RIGHT, // แนวตั้ง
                        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "ใช้ไม่ได้", bold: true, size: 32, font: FONT_TH })] })],
                    })
                );
            }
            return cells;
        };

        const createEmptyFillers = () => {
            const cells: TableCell[] = [];
            const count = Math.max(1, roundCount);
            const totalEmpty = (count * 2) + 1;

            for (let i = 0; i < totalEmpty; i++) {
                cells.push(new TableCell({ children: [new Paragraph("")] }));
            }
            return cells;
        };

        const checkS7Cell = (isCheck: boolean) => new TableCell({
            verticalAlign: VerticalAlign.CENTER,
            width: { size: 5, type: WidthType.PERCENTAGE },
            children: [
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({
                            text: isCheck ? "✓" : "",
                            font: isCheck ? "Angsana New" : FONT_TH,
                            size: 32,
                            bold: isCheck,
                        }),
                    ],
                }),
            ],
        });

        const createS7Row = (index: string, text: string, rowKey: string) => {
            const r = s7Rows[rowKey] || {};
            const status = r.status || "";
            const note = r.note && r.note !== "-" ? r.note : "";

            return new TableRow({
                children: [
                    new TableCell({
                        verticalAlign: VerticalAlign.TOP,
                        children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 40, after: 40 }, children: [new TextRun({ text: index, size: 32, font: FONT_TH })] })],
                    }),
                    new TableCell({
                        verticalAlign: VerticalAlign.TOP,
                        children: [new Paragraph({ spacing: { before: 40, after: 40 }, children: [new TextRun({ text: text, size: 32, font: FONT_TH })] })],
                    }),
                    checkS7Cell(status === 'ok'),
                    checkS7Cell(status === 'ng'),
                    checkS7Cell(status === 'fixed'),
                    new TableCell({
                        verticalAlign: VerticalAlign.TOP,
                        children: [new Paragraph({ spacing: { before: 40, after: 40 }, children: [new TextRun({ text: note, size: 32, font: FONT_TH })] })],
                    }),
                ],
            });
        };

        const planCover = [
            // 1. ดันลงมาจากด้านบน
            new Paragraph({ spacing: { before: 400 } }),

            // 2. กรอบหัวข้อ
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: {
                    top: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                    bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                    left: { style: BorderStyle.NONE },
                    right: { style: BorderStyle.NONE },
                    insideHorizontal: { style: BorderStyle.NONE },
                    insideVertical: { style: BorderStyle.NONE },
                },
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({
                                margins: { top: 400, bottom: 400 },
                                children: [
                                    new Paragraph({
                                        alignment: AlignmentType.CENTER,
                                        children: [
                                            new TextRun({
                                                text: "แผนปฏิบัติการการตรวจบำรุงรักษาป้าย",
                                                font: FONT_TH,
                                                bold: true,
                                                size: 72,
                                            }),
                                        ],
                                    }),
                                    new Paragraph({
                                        alignment: AlignmentType.CENTER,
                                        spacing: { before: 100 },
                                        children: [
                                            new TextRun({
                                                text: "และอุปกรณ์ประกอบของป้าย",
                                                font: FONT_TH,
                                                bold: true,
                                                size: 72,
                                            }),
                                        ],
                                    }),
                                    new Paragraph({
                                        alignment: AlignmentType.CENTER,
                                        spacing: { before: 100 },
                                        children: [
                                            new TextRun({
                                                text: "และคู่มือปฏิบัติการตามแผน",
                                                font: FONT_TH,
                                                bold: true,
                                                size: 72,
                                            }),
                                        ],
                                    }),
                                ],
                            }),
                        ],
                    }),
                ],
            }),

            // 3. สำหรับเจ้าของป้าย...
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 1440 },
                children: [
                    new TextRun({
                        text: "สำหรับเจ้าของป้าย หรือผู้ดูแลป้าย",
                        font: FONT_TH,
                        bold: true,
                        size: 60,
                    }),
                ],
            }),

            // 4. รายละเอียดป้าย
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 1440 },
                children: [
                    new TextRun({
                        text: txtType,
                        font: FONT_TH,
                        bold: true,
                        size: 60,
                    }),
                ],
            }),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 120 },
                children: [
                    new TextRun({
                        text: txtName,
                        font: FONT_TH,
                        bold: true,
                        size: 60,
                    }),
                ],
            }),
            // new Paragraph({
            //     alignment: AlignmentType.CENTER,
            //     spacing: { before: 120 },
            //     children: [
            //         new TextRun({
            //             text: txtCompany,
            //             font: FONT_TH,
            //             bold: true,
            //             size: 60,
            //         }),
            //     ],
            // }),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 120 },
                children: [
                    new TextRun({
                        text: txtAddress,
                        font: FONT_TH,
                        bold: true,
                        size: 60,
                    }),
                ],
            }),
        ];

        const maintenancePart1Section = [
            // 1. หัวข้อใส่กรอบ (ใช้ Table)
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: {
                    top: { style: BorderStyle.SINGLE, size: 6 },
                    bottom: { style: BorderStyle.SINGLE, size: 6 },
                    left: { style: BorderStyle.SINGLE, size: 6 },
                    right: { style: BorderStyle.SINGLE, size: 6 },
                    insideHorizontal: { style: BorderStyle.NONE },
                    insideVertical: { style: BorderStyle.NONE },
                },
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({
                                margins: { left: 200, right: 200 },
                                children: [
                                    new Paragraph({
                                        pageBreakBefore: true,
                                        alignment: AlignmentType.LEFT,
                                        children: [
                                            new TextRun({
                                                text: "ส่วนที่ 1 ขอบเขตของการตรวจบำรุงรักษาป้าย และอุปกรณ์ประกอบของป้าย",
                                                font: FONT_TH,
                                                bold: true,
                                                size: 40, // 20pt
                                            }),
                                        ],
                                    }),
                                ],
                            }),
                        ],
                    }),
                ],
            }),

            // เว้นวรรคหลังหัวข้อ
            new Paragraph({ spacing: { before: 50 } }),

            // 1.1
            new Paragraph({
                indent: { firstLine: 720 }, // ย่อหน้า
                children: [
                    new TextRun({
                        text: "1.1 ",
                        font: FONT_TH,
                        size: 32, // 16pt
                    }),
                    new TextRun({
                        text: "ในแผนปฏิบัติการการตรวจบำรุงรักษาป้ายและอุปกรณ์ประกอบของป้าย",
                        font: FONT_TH,
                        bold: true,
                        size: 32,
                    }),
                    new TextRun({
                        text: " และคู่มือปฏิบัติการตามแผนนี้",
                        font: FONT_TH,
                        size: 32,
                    }),
                ],
            }),

            // นิยาม: ป้าย
            new Paragraph({
                indent: { firstLine: 720 },
                children: [
                    new TextRun({ text: "“ป้าย”", font: FONT_TH, bold: true, size: 32 }),
                    new TextRun({
                        text: " ในที่นี้ให้หมายความรวมถึง แผ่นป้ายและสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย",
                        font: FONT_TH,
                        size: 32,
                    }),
                ],
            }),

            // นิยาม: การตรวจสอบป้าย
            new Paragraph({
                indent: { firstLine: 720 },
                children: [
                    new TextRun({ text: "การตรวจสอบป้าย", font: FONT_TH, bold: true, size: 32 }),
                    new TextRun({
                        text: " หมายถึง การตรวจสอบสภาพของป้ายด้านความมั่นคงแข็งแรง และตรวจสอบระบบอุปกรณ์ประกอบต่าง ๆ ของป้ายโดยผู้ตรวจสอบอาคาร ตามมาตรา 32 ทวิ แห่งพระราชบัญญัติควบคุมอาคาร พ.ศ. 2522",
                        font: FONT_TH,
                        size: 32,
                    }),
                ],
            }),

            // นิยาม: การตรวจบำรุงรักษาป้าย...
            new Paragraph({
                indent: { firstLine: 720 },
                children: [
                    new TextRun({ text: "การตรวจบำรุงรักษาป้ายและอุปกรณ์ประกอบของป้าย", font: FONT_TH, bold: true, size: 32 }),
                    new TextRun({
                        text: " หมายถึง การบำรุงรักษาป้าย และระบบอุปกรณ์ประกอบต่าง ๆ ของป้าย โดยเจ้าของป้าย หรือผู้ดูแลป้าย",
                        font: FONT_TH,
                        size: 32,
                    }),
                ],
            }),

            // นิยาม: ผู้ตรวจสอบอาคาร
            new Paragraph({
                indent: { firstLine: 720 },
                children: [
                    new TextRun({ text: "ผู้ตรวจสอบอาคาร", font: FONT_TH, bold: true, size: 32 }),
                    new TextRun({
                        text: " หมายถึง ผู้ซึ่งได้รับใบอนุญาตประกอบวิชาชีพ วิศวกรรมควบคุม หรือผู้ซึ่งได้รับใบอนุญาตประกอบวิชาชีพสถาปัตยกรรมควบคุม ตามกฎหมายว่าด้วยการนั้น แล้วแต่กรณี ซึ่งได้ขึ้นทะเบียนเป็นผู้ตรวจสอบอาคารตามพระราชบัญญัติควบคุมอาคาร พ.ศ.2522",
                        font: FONT_TH,
                        size: 32,
                    }),
                ],
            }),

            // นิยาม: เจ้าของป้าย
            new Paragraph({
                indent: { firstLine: 720 },
                children: [
                    new TextRun({ text: "เจ้าของป้าย", font: FONT_TH, bold: true, size: 32 }),
                    new TextRun({
                        text: " หมายถึง ผู้ที่มีสิทธิ์เป็นเจ้าของป้าย",
                        font: FONT_TH,
                        size: 32,
                    }),
                ],
            }),

            // นิยาม: ผู้ดูแลป้าย
            new Paragraph({
                indent: { firstLine: 720 },
                children: [
                    new TextRun({ text: "ผู้ดูแลป้าย", font: FONT_TH, bold: true, size: 32 }),
                    new TextRun({
                        text: " หมายถึง เจ้าของป้ายหรือ ผู้ที่ที่ได้รับมอบหมายจากเจ้าของป้ายให้มีหน้าที่ตรวจสอบการบำรุงรักษาป้าย และระบบอุปกรณ์ประกอบต่าง ๆ ของป้าย",
                        font: FONT_TH,
                        size: 32,
                    }),
                ],
            }),

            // นิยาม: แผนการตรวจสอบป้าย
            new Paragraph({
                indent: { firstLine: 720 },
                children: [
                    new TextRun({ text: "แผนการตรวจสอบป้าย", font: FONT_TH, bold: true, size: 32 }),
                    new TextRun({
                        text: " หมายถึง แผนการตรวจสอบสภาพป้าย และอุปกรณ์ประกอบต่าง ๆ ของป้ายสำหรับผู้ตรวจสอบอาคาร",
                        font: FONT_TH,
                        size: 32,
                    }),
                ],
            }),

            // นิยาม: แผนปฏิบัติการการตรวจบำรุงรักษาป้าย...
            new Paragraph({
                indent: { firstLine: 720 },
                children: [
                    new TextRun({ text: "แผนปฏิบัติการการตรวจบำรุงรักษาป้ายและอุปกรณ์ประกอบของป้าย", font: FONT_TH, bold: true, size: 32 }),
                    new TextRun({
                        text: " หมายถึง แผนปฏิบัติการการตรวจ บำรุงรักษาป้ายและอุปกรณ์ประกอบต่าง ๆ ของป้ายที่ผู้ตรวจสอบอาคารกำหนดให้กับเจ้าของป้ายหรือผู้ดูแลป้าย",
                        font: FONT_TH,
                        size: 32,
                    }),
                ],
            }),

            // นิยาม: แบบแปลนป้าย
            new Paragraph({
                indent: { firstLine: 720 },
                children: [
                    new TextRun({ text: "แบบแปลนป้าย", font: FONT_TH, bold: true, size: 32 }),
                    new TextRun({
                        text: " หมายถึง แบบแปลนของป้ายที่ต้องตรวจสอบ",
                        font: FONT_TH,
                        size: 32,
                    }),
                ],
            }),

            // 1.2
            new Paragraph({
                indent: { firstLine: 720 },
                children: [
                    new TextRun({ text: "1.2 ", font: FONT_TH, size: 32 }),
                    new TextRun({ text: "เจ้าของป้าย หรือผู้ดูแลป้าย", font: FONT_TH, bold: true, size: 32 }),
                    new TextRun({
                        text: " มีหน้าที่ตรวจสอบการบำรุงรักษาป้าย และระบบอุปกรณ์ประกอบต่าง ๆ ของป้าย ตามที่ผู้ตรวจสอบอาคารได้กำหนดไว้ และจัดให้มีการทดสอบการทำงานของระบบ และ ในระหว่างปี แล้วรายงานผลการตรวจสอบต่อเจ้าพนักงานท้องถิ่น ตามหลักเกณฑ์ วิธีการ และเงื่อนไข ที่กำหนดในกฎกระทรวงเกี่ยวกับการตรวจสอบอาคาร",
                        font: FONT_TH,
                        size: 32,
                    }),
                ],
            }),

            // 1.3
            new Paragraph({
                indent: { firstLine: 720 },
                children: [
                    new TextRun({ text: "1.3 ", font: FONT_TH, size: 32 }),
                    new TextRun({ text: "ผู้ตรวจสอบอาคาร", font: FONT_TH, size: 32 }), // ในโจทย์ไม่ได้สั่งให้หนา แต่ถ้าต้องการหนา ให้ใส่ bold: true
                    new TextRun({
                        text: " กำหนดแผนการตรวจสอบสภาพป้ายและอุปกรณ์ประกอบต่าง ๆ ของป้ายไว้ ตามแผนการตรวจสอบป้ายประจำปี ให้เจ้าของป้ายและหรือผู้ดูแลป้ายใช้เป็นแนวทางการปฏิบัติ ผู้ตรวจสอบอาคารสามารถแก้ไขเปลี่ยนแปลงแผนการตรวจสอบนี้ได้ตามความเหมาะสม",
                        font: FONT_TH,
                        size: 32,
                    }),
                ],
            }),

            // 1.4
            new Paragraph({
                indent: { firstLine: 720 },
                children: [
                    new TextRun({ text: "1.4 ", font: FONT_TH, size: 32 }),
                    new TextRun({ text: "เจ้าของป้าย หรือผู้ดูแลป้าย", font: FONT_TH, size: 32 }), // โจทย์ไม่ได้สั่งหนา
                    new TextRun({
                        text: "จะต้องดำเนินการตรวจสอบบำรุงรักษาป้ายและระบบอุปกรณ์ประกอบ ต่าง ๆ ของป้ายให้เป็นไปตามแผนปฏิบัติการการตรวจบำรุงรักษาป้ายและอุปกรณ์ประกอบของป้าย และคู่มือปฏิบัติการตามแผนฉบับนี้ รวมทั้ง ตามคู่มือปฏิบัติของผู้ผลิตหรือผู้ติดตั้งระบบและ อุปกรณ์ของป้ายและต้องจัดให้มีการบันทึกข้อมูลการตรวจบำรุงรักษาป้ายตามช่วงระยะเวลาที่ได้กำหนดไว้",
                        font: FONT_TH,
                        size: 32,
                    }),
                ],
            }),
        ];

        const maintenancePart2Section = [
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: {
                    top: { style: BorderStyle.SINGLE, size: 6 },
                    bottom: { style: BorderStyle.SINGLE, size: 6 },
                    left: { style: BorderStyle.SINGLE, size: 6 },
                    right: { style: BorderStyle.SINGLE, size: 6 },
                    insideHorizontal: { style: BorderStyle.NONE },
                    insideVertical: { style: BorderStyle.NONE },
                },
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({
                                margins: { left: 200, right: 200 },
                                children: [
                                    new Paragraph({
                                        pageBreakBefore: true,
                                        alignment: AlignmentType.LEFT,
                                        children: [
                                            new TextRun({
                                                text: "ส่วนที่ 2 แผนปฏิบัติการการตรวจบำรุงรักษาป้ายและอุปกรณ์ประกอบของป้าย",
                                                font: FONT_TH,
                                                bold: true,
                                                size: 40, // 20pt
                                            }),
                                        ],
                                    }),
                                ],
                            }),
                        ],
                    }),
                ],
            }),
            // เว้นวรรคหลังหัวข้อ
            new Paragraph({ spacing: { before: 50 } }),

            // เกริ่นนำ
            new Paragraph({
                indent: { firstLine: 720 }, // Indent 1.27cm
                children: [
                    new TextRun({
                        text: "ผู้ตรวจสอบอาคาร",
                        font: FONT_TH,
                        bold: true, // 16 หนา
                        size: 32,
                    }),
                    new TextRun({
                        text: " กำหนดแผนปฏิบัติการการตรวจบำรุงรักษาป้ายและอุปกรณ์ประกอบของป้ายดังนี้",
                        font: FONT_TH,
                        size: 32,
                    }),
                ],
            }),

            // 2.1
            new Paragraph({
                indent: { firstLine: 720 },
                children: [
                    new TextRun({ text: "2.1 ", font: FONT_TH, size: 32 }),
                    new TextRun({
                        text: "ให้เจ้าของป้าย หรือผู้ดูแลป้ายที่ได้รับมอบหมายจากเจ้าของป้ายมีหน้าที่ตรวจสอบการบำรุงรักษาป้ายและอุปกรณ์ประกอบต่าง ๆ ของป้าย จัดให้มีการทดสอบการทำงานของระบบและอุปกรณ์ในระหว่างปีตามที่ผู้ตรวจสอบอาคารกำหนด หรือตามคู่มือของผู้ผลิตหรือผู้ติดตั้งระบบอุปกรณ์ประกอบของป้าย",
                        font: FONT_TH,
                        size: 32,
                    }),
                ],
            }),

            // 2.2
            new Paragraph({
                indent: { firstLine: 720 },
                children: [
                    new TextRun({ text: "2.2 ", font: FONT_TH, size: 32 }),
                    new TextRun({
                        text: "เจ้าของหรือผู้ดูแลป้ายต้องตรวจบำรุงรักษาป้ายอย่างสม่ำเสมอตาม",
                        font: FONT_TH,
                        size: 32,
                    }),
                    new TextRun({
                        text: "แผนปฏิบัติการการตรวจบำรุงรักษาป้ายและอุปกรณ์ประกอบของป้าย และคู่มือปฏิบัติการตามแผน",
                        font: FONT_TH,
                        bold: true, // 16 หนา
                        size: 32,
                    }),
                    new TextRun({
                        text: "ที่ผู้ตรวจสอบอาคาร ได้จัดทำไว้ และบันทึกข้อมูลการตรวจบำรุงรักษาตามระยะเวลาที่ผู้ตรวจสอบอาคารกำหนด",
                        font: FONT_TH,
                        size: 32,
                    }),
                ],
            }),

            // 2.3
            new Paragraph({
                indent: { firstLine: 720 },
                children: [
                    new TextRun({ text: "2.3 ", font: FONT_TH, size: 32 }),
                    new TextRun({
                        text: "ในการดำเนินการตรวจสอบบำรุงรักษาให้ตรวจตามรายการต่าง ๆ ตามแบบรายละเอียดการตรวจที่ผู้ตรวจสอบอาคารจัดทำไว้",
                        font: FONT_TH,
                        size: 32,
                    }),
                ],
            }),

            // 2.4
            new Paragraph({
                indent: { firstLine: 720 },
                children: [
                    new TextRun({ text: "2.4 ", font: FONT_TH, size: 32 }),
                    new TextRun({
                        text: "ช่วงเวลา และความถี่ของการตรวจบำรุงรักษา ฯ การทดสอบการทำงานของระบบและอุปกรณ์ให้เป็นไปตามแผนการตรวจสอบที่ผู้ตรวจสอบอาคารกำหนด",
                        font: FONT_TH,
                        size: 32,
                    }),
                ],
            }),

            // 2.5
            new Paragraph({
                indent: { firstLine: 720 },
                children: [
                    new TextRun({ text: "2.5 ", font: FONT_TH, size: 32 }),
                    new TextRun({
                        text: "ให้เจ้าของป้าย หรือผู้ดูแลป้ายจะต้องจัดเตรียมแบบแปลนป้ายเพื่อการตรวจสอบ และมีผลการตรวจบำรุงรักษาป้ายและอุปกรณ์ประกอบต่าง ๆ ของป้ายไว้ให้ผู้ตรวจสอบป้ายสามารถใช้ประกอบ การตรวจสอบป้าย ได้ตลอดเวลาตามที่ผู้ตรวจสอบได้กำหนดไว้ตามแผน การตรวจสอบป้าย",
                        font: FONT_TH,
                        size: 32,
                    }),
                ],
            }),
        ];

        const maintenancePart3Section = [
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: {
                    top: { style: BorderStyle.SINGLE, size: 6 },
                    bottom: { style: BorderStyle.SINGLE, size: 6 },
                    left: { style: BorderStyle.SINGLE, size: 6 },
                    right: { style: BorderStyle.SINGLE, size: 6 },
                    insideHorizontal: { style: BorderStyle.NONE },
                    insideVertical: { style: BorderStyle.NONE },
                },
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({
                                margins: { left: 200, right: 200 },
                                children: [
                                    new Paragraph({
                                        pageBreakBefore: true,
                                        alignment: AlignmentType.LEFT,
                                        children: [
                                            new TextRun({
                                                text: "ส่วนที่ 3 รายละเอียดที่ต้องตรวจบำรุงรักษาป้าย และอุปกรณ์ประกอบของป้าย",
                                                font: FONT_TH,
                                                bold: true,
                                                size: 40, // 20pt
                                            }),
                                        ],
                                    }),
                                ],
                            }),
                        ],
                    }),
                ],
            }),
            // เว้นวรรคหลังหัวข้อ
            new Paragraph({ spacing: { before: 50 } }),

            new Paragraph({
                indent: { firstLine: 720 },
                children: [
                    new TextRun({
                        text: "เจ้าของป้าย หรือผู้ดูแลป้าย",
                        font: FONT_TH,
                        bold: true, // ตัวหนา
                        size: 32,
                    }),
                    new TextRun({
                        text: " ต้องทำการตรวจบำรุงรักษาป้าย หรืออุปกรณ์ประกอบต่าง ๆ ของป้าย ในเรื่องดังต่อไปนี้",
                        font: FONT_TH,
                        size: 32,
                    }),
                ],
            }),

            // (1)
            new Paragraph({
                indent: { left: 720, hanging: 720 }, // Indent for list item
                children: [
                    new TextRun({
                        text: "(1)\t", // ใช้ Tab เพื่อจัดระยะ
                        font: FONT_TH,
                        bold: true,
                        size: 32,
                    }),
                    new TextRun({
                        text: "การตรวจสอบบำรุงรักษาตัวป้ายด้านความมั่นคงแข็งแรงของป้าย หรือสิ่งที่สร้างขึ้นสำหรับติดตั้งป้ายอย่างน้อยต้องทำการตรวจสอบ ดังต่อไปนี้",
                        font: FONT_TH,
                        size: 32,
                    }),
                ],
            }),

            // รายการย่อย (ก) - (ฌ) ของข้อ (1)
            ...[
                "การต่อเติม ดัดแปลง ปรับปรุงขนาดของป้ายหรือสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย",
                "การเปลี่ยนแปลงน้ำหนักของแผ่นป้าย",
                "การเปลี่ยนสภาพการใช้งานของป้ายหรือสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย",
                "การเปลี่ยนแปลงวัสดุของป้ายหรือสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย",
                "การชำรุดสึกหรอของป้ายหรือสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย",
                "การวิบัติของป้ายหรือสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย",
                "ความมั่นคงแข็งแรงของโครงสร้างและฐานรากของสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย (กรณีป้ายที่ติดตั้งบนพื้นดิน)",
                "ความมั่นคงแข็งแรงของอาคารที่ติดตั้งป้าย (กรณีป้ายบนหลังคา หรือบนดาดฟ้าอาคาร หรือบนส่วนหนึ่งส่วนใดของอาคาร)",
                "การเชื่อมยึดระหว่างแผ่นป้ายกับสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย การเชื่อมยึดระหว่างชิ้นส่วนต่าง ๆ ของสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย และการเชื่อมยึดระหว่างสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้ายกับฐานรากหรืออาคาร"
            ].map((text, index) => {
                const label = ["(ก)", "(ข)", "(ค)", "(ง)", "(จ)", "(ฉ)", "(ช)", "(ซ)", "(ฌ)"][index];
                return new Paragraph({
                    indent: { left: 1440, hanging: 720 }, // ย่อหน้าเข้าไปอีกระดับ (Double indent)
                    children: [
                        new TextRun({
                            text: `${label}\t`,
                            font: FONT_TH,
                            bold: true, // ตัวหนา
                            size: 32,
                        }),
                        new TextRun({
                            text: text,
                            font: FONT_TH,
                            size: 32,
                        }),
                    ],
                });
            }),

            // (2)
            new Paragraph({
                indent: { left: 720, hanging: 720 },
                children: [
                    new TextRun({
                        text: "(2)\t",
                        font: FONT_TH,
                        bold: true,
                        size: 32,
                    }),
                    new TextRun({
                        text: "การตรวจบำรุงรักษาระบบและอุปกรณ์ประกอบของป้ายอย่างน้อยต้องตรวจสอบ ดังต่อไปนี้",
                        font: FONT_TH,
                        size: 32,
                    }),
                ],
            }),

            // รายการย่อย (ก) - (ค) ของข้อ (2)
            ...[
                "ระบบไฟฟ้าแสงสว่างและระบบไฟฟ้ากำลัง",
                "ระบบป้องกันฟ้าผ่า (ถ้ามี)",
                "ระบบและอุปกรณ์ประกอบอื่น ๆ (ถ้ามี)"
            ].map((text, index) => {
                const label = ["(ก)", "(ข)", "(ค)"][index];
                return new Paragraph({
                    indent: { left: 1440, hanging: 720 },
                    children: [
                        new TextRun({
                            text: `${label}\t`,
                            font: FONT_TH,
                            bold: true,
                            size: 32,
                        }),
                        new TextRun({
                            text: text,
                            font: FONT_TH,
                            size: 32,
                        }),
                    ],
                });
            }),
        ];

        const maintenancePart4Section = [
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: {
                    top: { style: BorderStyle.SINGLE, size: 6 },
                    bottom: { style: BorderStyle.SINGLE, size: 6 },
                    left: { style: BorderStyle.SINGLE, size: 6 },
                    right: { style: BorderStyle.SINGLE, size: 6 },
                    insideHorizontal: { style: BorderStyle.NONE },
                    insideVertical: { style: BorderStyle.NONE },
                },
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({
                                margins: { left: 200, right: 200 },
                                children: [
                                    new Paragraph({
                                        pageBreakBefore: true,
                                        alignment: AlignmentType.LEFT,
                                        children: [
                                            new TextRun({
                                                text: "ส่วนที่ 4 แนวทางการตรวจบำรุงรักษาป้าย และอุปกรณ์ประกอบของป้ายประจำปี",
                                                font: FONT_TH,
                                                bold: true,
                                                size: 40, // 20pt
                                            }),
                                        ],
                                    }),
                                ],
                            }),
                        ],
                    }),
                ],
            }),
            // เว้นวรรคหลังหัวข้อ
            new Paragraph({ spacing: { before: 50 } }),

            new Paragraph({
                indent: { firstLine: 720 },
                children: [
                    new TextRun({
                        text: "ตรวจสอบอาคาร", // ✅ ตัวหนา
                        font: FONT_TH,
                        bold: true,
                        size: 32,
                    }),
                    new TextRun({
                        text: " กำหนดแนวทางการตรวจบำรุงรักษาป้าย และอุปกรณ์ประกอบของป้ายประจำปีให้ แก่เจ้าของป้าย เพื่อเป็นแนวทางการตรวจบำรุงรักษาและการบันทึกข้อมูลการตรวจบำรุงรักษาป้าย ดังนี้",
                        font: FONT_TH,
                        size: 32,
                    }),
                ],
            }),

            // ข้อ 1
            new Paragraph({
                indent: { left: 720, hanging: 360 }, // จัดย่อหน้าแบบแขวน (ให้เลขลอย)
                children: [
                    new TextRun({ text: "1  ", font: FONT_TH, bold: true, size: 32 }), // ตัวหนาแค่เลข
                    new TextRun({
                        text: "เจ้าของป้ายต้องจัดหา หรือจัดทำแบบแปลนป้ายเพื่อใช้สำหรับการตรวจสอบจัดเก็บไว้ เพื่อให้ผู้ตรวจสอบ สามารถใช้ประกอบการตรวจสอบได้",
                        font: FONT_TH,
                        size: 32,
                    }),
                ],
            }),

            // ข้อ 2
            new Paragraph({
                indent: { left: 720, hanging: 360 },
                children: [
                    new TextRun({ text: "2  ", font: FONT_TH, bold: true, size: 32 }),
                    new TextRun({
                        text: "เจ้าของป้ายต้องจัดให้มีการตรวจบำรุงรักษาป้าย และอุปกรณ์ประกอบของป้ายตามคู่มือปฏิบัติของผู้ผลิต หรือผู้ติดตั้งระบบและอุปกรณ์ของป้าย และตามแผนปฏิบัติการการตรวจบำรุงรักษาฉบับนี้และจัดให้มี การบันทึกข้อมูลการตรวจบำรุงรักษาป้ายตามช่วงระยะเวลาที่ผู้ตรวจสอบกำหนดให้ผู้ตรวจสอบใช้ประกอบ ในการตรวจสอบป้าย",
                        font: FONT_TH,
                        size: 32,
                    }),
                ],
            }),

            // ข้อ 3
            new Paragraph({
                indent: { left: 720, hanging: 360 },
                children: [
                    new TextRun({ text: "3  ", font: FONT_TH, bold: true, size: 32 }),
                    new TextRun({
                        text: "เจ้าของป้ายต้องนำรายงานผลการตรวจสอบสภาพป้ายหรือสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้ายและ อุปกรณ์ประกอบของป้าย ที่ผู้ตรวจสอบจัดทำแจ้งต่อเจ้าพนักงานท้องถิ่นเพื่อให้ออกหนังสือรับรอง การตรวจสอบป้ายเป็นประจำทุกสามปี โดยจะต้องเสนอภายในสามสิบวันก่อนวันที่ใบรับรอง การตรวจอาคารฉบับเดิมจะมีอายุครบสามปี",
                        font: FONT_TH,
                        size: 32,
                    }),
                ],
            }),

            // ข้อ 4
            new Paragraph({
                indent: { left: 720, hanging: 360 },
                children: [
                    new TextRun({ text: "4  ", font: FONT_TH, bold: true, size: 32 }),
                    new TextRun({
                        text: "กรณีที่เจ้าของป้าย หรือผู้ดูแลป้ายพบว่าสภาพของป้ายหรืออุปกรณ์ประกอบต่าง ๆ ของป้าย มีการชำรุดเสียหาย ต้องแก้ไข มีสิ่งที่ผิดปกติ หรือใช้งานไม่ได้ เจ้าของป้าย หรือผู้ดูแลป้ายจะต้องบันทึก รายละเอียดแต่ละรายการให้ชัดเจน และแจ้งผลให้ผู้ตรวจสอบทราบโดยเร็ว",
                        font: FONT_TH,
                        size: 32,
                    }),
                ],
            }),

            // ข้อ 5
            new Paragraph({
                indent: { left: 720, hanging: 360 },
                children: [
                    new TextRun({ text: "5  ", font: FONT_TH, bold: true, size: 32 }),
                    new TextRun({
                        text: "กรณีที่ป้ายมีการชำรุดเสียหาย ต้องแก้ไข มีสิ่งที่ผิดปกติ หรือ ใช้งานไม่ได้ เจ้าของป้ายจะต้องดำเนินการแก้ไขให้มีสภาพปลอดภัยโดยเร็ว พร้อมทั้งแจ้งให้ผู้ตรวจสอบทราบด้วย",
                        font: FONT_TH,
                        size: 32,
                    }),
                ],
            }),

            // ข้อ 6
            new Paragraph({
                indent: { left: 720, hanging: 360 },
                children: [
                    new TextRun({ text: "6  ", font: FONT_TH, bold: true, size: 32 }),
                    new TextRun({
                        text: "เมื่อเจ้าของป้ายได้แก้ไขให้ป้ายมีสภาพปลอดภัยแล้ว หรือเป็นกรณีที่เจ้าของป้ายไม่สามารถที่จะดำเนินการแก้ไขได้เองให้เจ้าของป้ายแจ้งให้ผู้ตรวจสอบทราบโดยเร็ว",
                        font: FONT_TH,
                        size: 32,
                    }),
                ],
            }),
        ];

        const maintenancePart5Section = [
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: {
                    top: { style: BorderStyle.SINGLE, size: 6 },
                    bottom: { style: BorderStyle.SINGLE, size: 6 },
                    left: { style: BorderStyle.SINGLE, size: 6 },
                    right: { style: BorderStyle.SINGLE, size: 6 },
                    insideHorizontal: { style: BorderStyle.NONE },
                    insideVertical: { style: BorderStyle.NONE },
                },
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({
                                margins: { left: 200, right: 200 },
                                children: [
                                    new Paragraph({
                                        pageBreakBefore: true,
                                        alignment: AlignmentType.LEFT,
                                        children: [
                                            new TextRun({
                                                text: "ส่วนที่ 5 ช่วงเวลา และความถี่ในการตรวจบำรุงรักษาป้าย และอุปกรณ์ประกอบของป้าย",
                                                font: FONT_TH,
                                                bold: true,
                                                size: 40, // 20pt
                                            }),
                                        ],
                                    }),
                                ],
                            }),
                        ],
                    }),
                ],
            }),

            new Paragraph({
                indent: { firstLine: 720 },
                children: [
                    new TextRun({
                        text: "1. ความถี่ในการตรวจบำรุงรักษาป้ายด้านความมั่นคงแข็งแรงของป้ายหรือสิ่งที่สร้างขึ้นสำหรับติด หรือตั้งป้าย",
                        font: FONT_TH,
                        bold: true,
                        size: 32,
                    }),
                ],
            }),

            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: {
                    top: { style: BorderStyle.SINGLE, size: 1 },
                    bottom: { style: BorderStyle.SINGLE, size: 1 },
                    left: { style: BorderStyle.SINGLE, size: 1 },
                    right: { style: BorderStyle.SINGLE, size: 1 },
                    insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
                    insideVertical: { style: BorderStyle.SINGLE, size: 1 },
                },
                rows: [
                    // Header Row 1 (ตั้งค่าความกว้างตรงนี้เหมือนตาราง 2)
                    new TableRow({
                        children: [
                            new TableCell({
                                rowSpan: 2,
                                width: { size: 10, type: WidthType.PERCENTAGE }, // ✅ 10%
                                verticalAlign: VerticalAlign.CENTER,
                                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "ลำดับ", bold: true, size: 32, font: FONT_TH })] })],
                            }),
                            new TableCell({
                                rowSpan: 2,
                                width: { size: 40, type: WidthType.PERCENTAGE }, // ✅ 40%
                                verticalAlign: VerticalAlign.CENTER,
                                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "รายการตรวจบำรุงรักษา", bold: true, size: 32, font: FONT_TH })] })],
                            }),
                            new TableCell({
                                columnSpan: 5,
                                width: { size: 35, type: WidthType.PERCENTAGE }, // ✅ 35%
                                verticalAlign: VerticalAlign.CENTER,
                                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "ความถี่ในการตรวจสอบ", bold: true, size: 32, font: FONT_TH })] })],
                            }),
                            new TableCell({
                                rowSpan: 2,
                                width: { size: 15, type: WidthType.PERCENTAGE }, // ✅ 15%
                                verticalAlign: VerticalAlign.CENTER,
                                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "หมายเหตุ", bold: true, size: 32, font: FONT_TH })] })],
                            }),
                        ],
                    }),

                    // Header Row 2 (หน่วยความถี่)
                    new TableRow({
                        children: [
                            ...["1", "4", "6", "1", "3"].map((num, i) =>
                                new TableCell({
                                    verticalAlign: VerticalAlign.CENTER,
                                    width: { size: 7, type: WidthType.PERCENTAGE },
                                    children: [
                                        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: num, bold: true, size: 32, font: FONT_TH })] }),
                                        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: i < 3 ? "เดือน" : "ปี", bold: true, size: 28, font: FONT_TH })] }),
                                    ],
                                })
                            ),
                        ],
                    }),

                    // Data Rows (ใช้ Helper ตัวใหม่ V2)
                    createFreqRowV2("1", "การต่อเติม ดัดแปลง ปรับปรุงขนาดของ ป้ายหรือสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย", "r1"),
                    createFreqRowV2("2", "การเปลี่ยนแปลงน้ำหนักของแผ่นป้าย", "r2"),
                    createFreqRowV2("3", "การเปลี่ยนแปลงสภาพการใช้งานของป้าย", "r3"),
                    createFreqRowV2("4", "การเปลี่ยนแปลงวัสดุของป้าย หรือสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย", "r4"),
                    createFreqRowV2("5", "การชำรุดสึกหรอของป้าย หรือสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย", "r5"),
                    createFreqRowV2("6", "การวิบัติของป้าย หรือสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย", "r6"),
                    createFreqRowV2("7", "ความมั่นคงแข็งแรงของโครงสร้างและฐานรากของสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย (กรณีป้ายที่ติดตั้งบนพื้นดิน)", "r7"),
                    createFreqRowV2("8", "ความมั่นคงแข็งแรงของอาคารที่ติดตั้งป้าย (กรณีป้ายบนหลังคา หรือบนดาดฟ้าอาคาร หรือบนส่วนหนึ่งส่วนใดของอาคาร)", "r8"),
                    createFreqRowV2("9", "การเชื่อมยึดระหว่างแผ่นป้ายกับสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย การเชื่อมยึดระหว่างชิ้นส่วนต่าง ๆ ของสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย และการเชื่อมยึดระหว่างสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้ายกับฐานรากหรืออาคาร", "r9"),
                ],
            }),

            new Paragraph({
                pageBreakBefore: true,
                indent: { firstLine: 720 },
                children: [
                    new TextRun({
                        text: "2. ความถี่ในการตรวจบำรุงรักษาระบบและอุปกรณ์ประกอบของป้าย",
                        font: FONT_TH,
                        bold: true,
                        size: 32,
                    }),
                ],
            }),

            // --- ตารางที่ 2 ---
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: {
                    top: { style: BorderStyle.SINGLE, size: 1 },
                    bottom: { style: BorderStyle.SINGLE, size: 1 },
                    left: { style: BorderStyle.SINGLE, size: 1 },
                    right: { style: BorderStyle.SINGLE, size: 1 },
                    insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
                    insideVertical: { style: BorderStyle.SINGLE, size: 1 },
                },
                rows: [
                    // Header Row 1
                    new TableRow({
                        children: [
                            new TableCell({
                                rowSpan: 2,
                                width: { size: 10, type: WidthType.PERCENTAGE },
                                verticalAlign: VerticalAlign.CENTER,
                                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "ลำดับ", bold: true, size: 32, font: FONT_TH })] })],
                            }),
                            new TableCell({
                                rowSpan: 2,
                                width: { size: 40, type: WidthType.PERCENTAGE },
                                verticalAlign: VerticalAlign.CENTER,
                                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "รายการตรวจบำรุงรักษา", bold: true, size: 32, font: FONT_TH })] })],
                            }),
                            new TableCell({
                                columnSpan: 5,
                                width: { size: 35, type: WidthType.PERCENTAGE },
                                verticalAlign: VerticalAlign.CENTER,
                                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "ความถี่ในการตรวจสอบ", bold: true, size: 32, font: FONT_TH })] })],
                            }),
                            new TableCell({
                                rowSpan: 2,
                                width: { size: 15, type: WidthType.PERCENTAGE },
                                verticalAlign: VerticalAlign.CENTER,
                                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "หมายเหตุ", bold: true, size: 32, font: FONT_TH })] })],
                            }),
                        ],
                    }),

                    // Header Row 2
                    new TableRow({
                        children: [
                            ...["1", "4", "6", "1", "3"].map((num, i) =>
                                new TableCell({
                                    verticalAlign: VerticalAlign.CENTER,
                                    width: { size: 7, type: WidthType.PERCENTAGE },
                                    children: [
                                        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: num, bold: true, size: 32, font: FONT_TH })] }),
                                        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: i < 3 ? "เดือน" : "ปี", bold: true, size: 28, font: FONT_TH })] }),
                                    ],
                                })
                            ),
                        ],
                    }),

                    // === กลุ่ม 1: ระบบไฟฟ้า ===
                    createGroupRow("1", "ระบบไฟฟ้าแสงสว่างและระบบไฟฟ้ากำลัง"),
                    createSubRow("(1) สภาพสายไฟฟ้า", "t2-1-1"),
                    createSubRow("(2) สภาพท่อร้อยสาย รางเดินสายและรางเคเบิล", "t2-1-2"),
                    createSubRow("(3) สภาพเครื่องป้องกันกระแสเกิน", "t2-1-3"),
                    createSubRow("(4) สภาพเครื่องตัดไฟรั่ว", "t2-1-4"),
                    createSubRow("(5) การต่อลงดินของบริภัณฑ์ ตัวนำต่อลงดินและความต่อเนื่องลงดินของท่อร้อยสาย รางเดินสาย รางเคเบิล", "t2-1-5"),

                    // === กลุ่ม 2: ระบบป้องกันฟ้าผ่า ===
                    createGroupRow("2", "ระบบป้องกันฟ้าผ่า (ถ้ามี)"),
                    createSubRow("(1) ตรวจสอบระบบตัวนำล่อฟ้าตัวนำต่อลงดิน", "t2-2-1"),
                    createSubRow("(2) ตรวจสอบระบบรากสายดิน", "t2-2-2"),
                    createSubRow("(3) ตรวจสอบจุดต่อประสานศักย์", "t2-2-3"),

                    // === กลุ่ม 3: อุปกรณ์ประกอบอื่นๆ ===
                    createGroupRow("3", "ระบบอุปกรณ์ประกอบอื่น ๆ (ถ้ามี)"),
                    createSubRow("(1) สลิง หรือสายยึด", "t2-3-1"),
                    createSubRow("(2) สภาพบันไดขึ้นลง", "t2-3-2"),
                    createSubRow("(3) สภาพราวจับ หรือราวกันตก", "t2-3-3"),
                    createSubRow("(4) สภาพ CATWALK", "t2-3-4"),
                    createSubRow("- อื่น ๆ (โปรดระบุ)", "t2-3-5", true), // true = เป็นช่อง custom
                ],
            }),
        ];

        const maintenancePart6Section = [
            new Paragraph({ pageBreakBefore: true }),
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: {
                    top: { style: BorderStyle.SINGLE, size: 6 },
                    bottom: { style: BorderStyle.SINGLE, size: 6 },
                    left: { style: BorderStyle.SINGLE, size: 6 },
                    right: { style: BorderStyle.SINGLE, size: 6 },
                    insideHorizontal: { style: BorderStyle.NONE },
                    insideVertical: { style: BorderStyle.NONE },
                },
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({
                                margins: { left: 200, right: 200 },
                                children: [
                                    new Paragraph({
                                        alignment: AlignmentType.LEFT,
                                        children: [
                                            new TextRun({
                                                text: "ส่วนที่ 6 ผลการตรวจสภาพป้าย และอุปกรณ์ประกอบของป้าย",
                                                font: FONT_TH,
                                                bold: true,
                                                size: 40, // 20pt
                                            }),
                                        ],
                                    }),
                                ],
                            }),
                        ],
                    }),
                ],
            }),

            // --- เนื้อหาบรรยาย ---
            new Paragraph({
                indent: { firstLine: 720 },
                children: [new TextRun({ text: "ส่วนที่ 6 เป็นผลการตรวจสอบการบำรุงรักษาป้าย และอุปกรณ์ประกอบต่าง ๆ ของป้ายตามที่เจ้าของป้าย หรือผู้ดูแลป้ายสามารถสังเกตได้ด้วยสายตา ไม่รวมถึงการทดสอบที่ใช้เครื่องมือพิเศษเฉพาะ", font: FONT_TH, size: 32 })],
            }),
            new Paragraph({
                indent: { firstLine: 720 },
                children: [new TextRun({ text: "การตรวจสอบการบำรุงรักษาป้าย และอุปกรณ์ประกอบต่าง ๆ ของป้าย เจ้าของ หรือ ผู้ดูแลป้ายจะต้องพิจารณาตามรายละเอียดในการตรวจบำรุงรักษาป้ายและอุปกรณ์ประกอบของป้าย และคู่มือปฏิบัติการตามแผน ที่ผู้ตรวจสอบอาคารได้กำหนดไว้ และความถี่ในการตรวจไม่น้อยกว่า ที่ผู้ตรวจสอบอาคารได้กำหนดไว้", font: FONT_TH, size: 32 })],
            }),
            new Paragraph({
                indent: { firstLine: 720 },
                spacing: { after: 200 }, // เว้นก่อนเข้าตารางนิดหน่อย
                children: [new TextRun({ text: "กรณีที่พบว่าสภาพของป้าย หรืออุปกรณ์ประกอบต่าง ๆ ของป้ายมีการชำรุด เสียหาย ต้องแก้ไขผิดปกติ หรือใช้งานไม่ได้เจ้าของป้าย หรือผู้ดูแลป้ายจะต้องบันทึกรายละเอียดแต่ละรายการให้ชัดเจนและแจ้งผลให้ ผู้ตรวจสอบทราบโดยเร็ว", font: FONT_TH, size: 32 })],
            }),

            new Paragraph({ pageBreakBefore: true }),

            // --- ตารางที่ 1 ---
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: {
                    top: { style: BorderStyle.SINGLE, size: 1 },
                    bottom: { style: BorderStyle.SINGLE, size: 1 },
                    left: { style: BorderStyle.SINGLE, size: 1 },
                    right: { style: BorderStyle.SINGLE, size: 1 },
                    insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
                    insideVertical: { style: BorderStyle.SINGLE, size: 1 },
                },
                rows: [
                    // Header Row
                    new TableRow({
                        children: [
                            // 1. ลำดับที่
                            new TableCell({
                                rowSpan: 2,
                                width: { size: 8, type: WidthType.PERCENTAGE },
                                verticalAlign: VerticalAlign.CENTER,
                                textDirection: TextDirection.BOTTOM_TO_TOP_LEFT_TO_RIGHT,
                                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "ลำดับที่", bold: true, size: 32, font: FONT_TH })] })],
                            }),
                            // 2. รายการตรวจสอบ
                            new TableCell({
                                rowSpan: 2,
                                width: { size: 45, type: WidthType.PERCENTAGE }, // ลด Width ลงนิดนึงเผื่อที่ให้รอบอื่นๆ
                                verticalAlign: VerticalAlign.CENTER,
                                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "รายการตรวจสอบ", bold: true, size: 32, font: FONT_TH })] })],
                            }),

                            // ✅ 3. Dynamic Round Headers (รอบที่ 1, 2, 3)
                            ...createRoundHeaderCells(),

                            // 4. หมายเหตุ
                            new TableCell({
                                rowSpan: 2,
                                width: { size: 15, type: WidthType.PERCENTAGE },
                                verticalAlign: VerticalAlign.CENTER,
                                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "หมายเหตุ", bold: true, size: 32, font: FONT_TH })] })],
                            }),
                        ],
                    }),

                    // Sub-Header Row
                    new TableRow({
                        children: [
                            ...createSubHeaderCells(),
                        ],
                    }),

                    // Data Row 1 (หัวข้อใหญ่)
                    new TableRow({
                        children: [
                            // 1. ลำดับ
                            new TableCell({
                                verticalAlign: VerticalAlign.TOP,
                                children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100 }, children: [new TextRun({ text: "1", size: 32, font: FONT_TH })] })]
                            }),
                            // 2. ชื่อรายการ (ใส่ข้อความยาวๆ ที่นี่)
                            new TableCell({
                                verticalAlign: VerticalAlign.CENTER,
                                children: [new Paragraph({ spacing: { before: 100, after: 100 }, children: [new TextRun({ text: "การตรวจสอบความมั่นคงแข็งแรงของป้าย หรือสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย", bold: true, underline: {}, size: 32, font: FONT_TH })] })],
                            }),
                            // 3. ✅ เติมช่องว่างให้ครบตามจำนวนคอลัมน์ (รอบ + หมายเหตุ)
                            ...createEmptyFillers()
                        ],
                    }),

                    // Data Rows (ข้อย่อย - ใช้ Helper ใหม่)
                    createM6RowFinal("", " 1.1 การต่อเติมดัดแปลงปรับปรุงขนาดของป้ายหรือสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย", "t1-1"),
                    createM6RowFinal("", " 1.2 การเปลี่ยนแปลงน้ำหนักของแผ่นป้าย", "t1-2"),
                    createM6RowFinal("", " 1.3การเปลี่ยนสภาพการใช้งานของป้ายหรือสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย", "t1-3"),
                    createM6RowFinal("", " 1.4 การเปลี่ยนแปลงวัสดุของป้ายหรือสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย", "t1-4"),
                    createM6RowFinal("", " 1.5 การชำรุดสึกหรอของป้ายหรือสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย", "t1-5"),
                    createM6RowFinal("", " 1.6 การวิบัติของป้ายหรือสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย", "t1-6"),
                    createM6RowFinal("", " 1.7 ความมั่นคงแข็งแรงของโครงสร้างและฐานรากของสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย (กรณีป้ายที่ติดตั้งบนพื้นดิน)", "t1-7"),
                    createM6RowFinal("", " 1.8 ความมั่นคงแข็งแรงของอาคารที่ติดตั้งป้าย (กรณีป้ายบนหลังคา หรือบนดาดฟ้าอาคาร หรือบนส่วนหนึ่งส่วนใดของอาคาร)", "t1-8"),
                    createM6RowFinal("", " 1.9 การเชื่อมยึดระหว่างแผ่นป้ายกับสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย การเชื่อมยึดระหว่างชิ้นส่วนต่าง ๆ ของสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้ายและการเชื่อมยึดระหว่างสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้ายกับฐานรากหรืออาคาร", "t1-9"),
                ],
            }),
            noteParagraph,

            new Paragraph({ pageBreakBefore: true }),

            // --- ตารางที่ 2 ---
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: {
                    top: { style: BorderStyle.SINGLE, size: 1 },
                    bottom: { style: BorderStyle.SINGLE, size: 1 },
                    left: { style: BorderStyle.SINGLE, size: 1 },
                    right: { style: BorderStyle.SINGLE, size: 1 },
                    insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
                    insideVertical: { style: BorderStyle.SINGLE, size: 1 },
                },
                rows: [
                    // (ถ้าต้องการ Header ซ้ำให้ก๊อปจากตาราง 1 มาใส่ตรงนี้ แต่ถ้าให้ต่อกันเลยก็ไม่ต้องใส่ Header)
                    new TableRow({
                        children: [
                            new TableCell({
                                rowSpan: 2,
                                width: { size: 8, type: WidthType.PERCENTAGE },
                                verticalAlign: VerticalAlign.CENTER,
                                textDirection: TextDirection.BOTTOM_TO_TOP_LEFT_TO_RIGHT,
                                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "ลำดับที่", bold: true, size: 32, font: FONT_TH })] })],
                            }),
                            new TableCell({
                                rowSpan: 2,
                                width: { size: 45, type: WidthType.PERCENTAGE }, // ใช้ความกว้างเท่าตาราง 1
                                verticalAlign: VerticalAlign.CENTER,
                                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "รายการตรวจสอบ", bold: true, size: 32, font: FONT_TH })] })],
                            }),

                            // ✅ Dynamic Round Headers (รอบที่ 1..N)
                            ...createRoundHeaderCells(),

                            new TableCell({
                                rowSpan: 2,
                                width: { size: 15, type: WidthType.PERCENTAGE },
                                verticalAlign: VerticalAlign.CENTER,
                                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "หมายเหตุ", bold: true, size: 32, font: FONT_TH })] })],
                            }),
                        ],
                    }),

                    // Sub-Header Row
                    new TableRow({
                        children: [
                            ...createSubHeaderCells(),
                        ],
                    }),

                    // Data Row 2 (หัวข้อใหญ่ - 2)
                    new TableRow({
                        children: [
                            new TableCell({
                                verticalAlign: VerticalAlign.TOP,
                                children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 40 }, children: [new TextRun({ text: "2", size: 32, font: FONT_TH })] })]
                            }),
                            new TableCell({
                                verticalAlign: VerticalAlign.CENTER,
                                children: [new Paragraph({ spacing: { before: 40, after: 40 }, children: [new TextRun({ text: "การตรวจสอบบำรุงรักษาระบบและอุปกรณ์ประกอบต่าง ๆ ของป้าย", bold: true, underline: {}, size: 32, font: FONT_TH })] })],
                            }),
                            // ✅ เติมช่องว่างให้ครบตามจำนวนคอลัมน์
                            ...createEmptyFillers()
                        ],
                    }),

                    // Group 2.1
                    createM6SubRow("", " 2.1 ระบบไฟฟ้าแสงสว่างและระบบไฟฟ้ากำลัง", ""),
                    createM6SubRow("", "    (1) สภาพสายไฟฟ้า", "t2-1-1"),
                    createM6SubRow("", "    (2) สภาพท่อร้อยสายรางเดินสาย และรางเคเบิล", "t2-1-2"),
                    createM6SubRow("", "    (3) สภาพเครื่องป้องกันกระแสเกิน", "t2-1-3"),
                    createM6SubRow("", "    (4) สภาพเครื่องตัดไฟรั่ว", "t2-1-4"),
                    createM6SubRow("", "    (5) การต่อลงดินของบริภัณฑ์ตัวนำต่อลงดินและความต่อเนื่องลงดินของท่อร้อยสายรางเดินสายรางเคเบิล", "t2-1-5"),

                    // Group 2.2
                    createM6SubRow("", " 2.2 ระบบป้องกันฟ้าผ่า (ถ้ามี)", ""),
                    createM6SubRow("", "    (1) ตรวจสอบระบบตัวนำล่อฟ้าตัวนำต่อลงดิน", "t2-2-1"),
                    createM6SubRow("", "    (2) ตรวจสอบระบบรากสายดิน", "t2-2-2"),
                    createM6SubRow("", "    (3) ตรวจสอบจุดต่อประสานศักย์", "t2-2-3"),

                    // Group 2.3
                    createM6SubRow("", " 2.3 ระบบอุปกรณ์ประกอบอื่น ๆ (ถ้ามี)", ""),
                    createM6SubRow("", "    (1) สภาพสลิง หรือสายยึด", "t2-3-1"),
                    createM6SubRow("", "    (2) สภาพบันไดขึ้นลง", "t2-3-2"),
                    createM6SubRow("", "    (3) สภาพราวจับ หรือราวกันตก", "t2-3-3"),
                    createM6SubRow("", "    (4) สภาพ CATWALK", "t2-3-4"),
                    createM6SubRow("", "    - อื่น ๆ (โปรดระบุ)", "t2-3-5", true), // isCustom = true
                ],
            }),
            noteParagraph,
        ];

        const maintenancePart7Section = [
            new Paragraph({ pageBreakBefore: true }),
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: {
                    top: { style: BorderStyle.SINGLE, size: 6 },
                    bottom: { style: BorderStyle.SINGLE, size: 6 },
                    left: { style: BorderStyle.SINGLE, size: 6 },
                    right: { style: BorderStyle.SINGLE, size: 6 },
                    insideHorizontal: { style: BorderStyle.NONE },
                    insideVertical: { style: BorderStyle.NONE },
                },
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({
                                margins: { left: 200, right: 200 },
                                children: [
                                    new Paragraph({
                                        alignment: AlignmentType.LEFT,
                                        children: [
                                            new TextRun({
                                                text: "ส่วนที่ 7 สรุปผลการตรวจบำรุงรักษาป้ายและอุปกรณ์ประกอบของป้าย",
                                                font: FONT_TH,
                                                bold: true,
                                                size: 40, // 20pt
                                            }),
                                        ],
                                    }),
                                ],
                            }),
                        ],
                    }),
                ],
            }),

            new Paragraph({
                indent: { firstLine: 720 }, // ย่อหน้า 1.27cm
                spacing: { after: 200 },
                children: [
                    new TextRun({
                        text: "ส่วนที่ 7 เป็นสรุปผลการตรวจสอบบำรุงรักษาป้าย ระบบและอุปกรณ์ประกอบต่าง ๆ ของป้าย รวมทั้งการตรวจสอบสมรรถนะของระบบและอุปกรณ์ต่าง ๆ ที่เกี่ยวข้องกับความปลอดภัยของป้ายอาคารตามที่ผู้ตรวจสอบอาคารได้กำหนดไว้",
                        font: FONT_TH,
                        size: 32, // 16pt
                    }),
                ],
            }),

            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: {
                    top: { style: BorderStyle.SINGLE, size: 1 },
                    bottom: { style: BorderStyle.SINGLE, size: 1 },
                    left: { style: BorderStyle.SINGLE, size: 1 },
                    right: { style: BorderStyle.SINGLE, size: 1 },
                    insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
                    insideVertical: { style: BorderStyle.SINGLE, size: 1 },
                },
                rows: [
                    // Header Row
                    new TableRow({
                        children: [
                            new TableCell({
                                verticalAlign: VerticalAlign.CENTER,
                                width: { size: 8, type: WidthType.PERCENTAGE },
                                textDirection: TextDirection.BOTTOM_TO_TOP_LEFT_TO_RIGHT,
                                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "ลำดับที่", bold: true, size: 32, font: FONT_TH })] })],
                            }),
                            new TableCell({
                                verticalAlign: VerticalAlign.CENTER,
                                width: { size: 47, type: WidthType.PERCENTAGE },
                                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "รายการตรวจสอบ", bold: true, size: 32, font: FONT_TH })] })],
                            }),
                            new TableCell({
                                verticalAlign: VerticalAlign.CENTER,
                                width: { size: 5, type: WidthType.PERCENTAGE },
                                textDirection: TextDirection.BOTTOM_TO_TOP_LEFT_TO_RIGHT,
                                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "ใช้ได้", bold: true, size: 32, font: FONT_TH })] })],
                            }),
                            new TableCell({
                                verticalAlign: VerticalAlign.CENTER,
                                width: { size: 5, type: WidthType.PERCENTAGE },
                                textDirection: TextDirection.BOTTOM_TO_TOP_LEFT_TO_RIGHT,
                                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "ใช้ไม่ได้", bold: true, size: 32, font: FONT_TH })] })],
                            }),
                            new TableCell({
                                verticalAlign: VerticalAlign.CENTER,
                                width: { size: 5, type: WidthType.PERCENTAGE },
                                textDirection: TextDirection.BOTTOM_TO_TOP_LEFT_TO_RIGHT,
                                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "มีการแก้ไขแล้ว", bold: true, size: 32, font: FONT_TH })] })],
                            }),
                            new TableCell({
                                verticalAlign: VerticalAlign.CENTER,
                                width: { size: 30, type: WidthType.PERCENTAGE },
                                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "หมายเหตุ", bold: true, size: 32, font: FONT_TH })] })],
                            }),
                        ],
                    }),

                    // Data Rows
                    createS7Row("1", "การตรวจบำรุงรักษาป้ายด้านความมั่นคงแข็งแรงของป้าย หรือสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย", "r1"),
                    createS7Row("2", "การตรวจสอบบำรุงรักษาระบบและอุปกรณ์ประกอบของป้าย", "r2"),
                    createS7Row("", "2.1 ระบบไฟฟ้าแสงสว่างและระบบไฟฟ้ากำลัง", "r21"),
                    createS7Row("", "2.2 ระบบป้องกันฟ้าผ่า (ถ้ามี)", "r22"),
                    createS7Row("", "2.3 ระบบอุปกรณ์ประกอบอื่น ๆ (ถ้ามี)", "r23"),
                ],
            }),

            noteParagraph,

            new Paragraph({
                spacing: { before: 200, after: 200 },
                children: [
                    new TextRun({ text: "รายละเอียดเพิ่มเติม : ", font: FONT_TH, size: 32 }),
                    new TextRun({ text: s7Rows.extra?.extra || "-", font: FONT_TH, size: 32 }),
                ],
            }),
            new Paragraph({ spacing: { before: 400 } }),

            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: {
                    top: { style: BorderStyle.NONE },
                    bottom: { style: BorderStyle.NONE },
                    left: { style: BorderStyle.NONE },
                    right: { style: BorderStyle.NONE },
                    insideHorizontal: { style: BorderStyle.NONE },
                    insideVertical: { style: BorderStyle.NONE },
                },
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({ width: { size: 40, type: WidthType.PERCENTAGE }, children: [] }),

                            new TableCell({
                                width: { size: 60, type: WidthType.PERCENTAGE },
                                children: [
                                    new Paragraph({
                                        alignment: AlignmentType.CENTER,
                                        children: [
                                            new TextRun({ text: "ลายมือชื่อ ..................................................................... เจ้าของป้าย หรือผู้ดูแลป้าย", font: FONT_TH, size: 32 }),
                                        ],
                                    }),
                                    new Paragraph({
                                        alignment: AlignmentType.CENTER,
                                        spacing: { before: 100 },
                                        children: [
                                            new TextRun({ text: `( ${meta.inspectorName || ".................................................."} )`, font: FONT_TH, size: 32, bold: true }),
                                        ],
                                    }),
                                ],
                            }),
                        ],
                    }),

                    new TableRow({
                        children: [
                            // Cell ซ้าย: ว่างไว้ (40%)
                            new TableCell({
                                width: { size: 40, type: WidthType.PERCENTAGE },
                                children: []
                            }),

                            // Cell ขวา: ใส่วันที่ (60%) จัดกึ่งกลาง (จะตรงกับชื่อพอดี)
                            new TableCell({
                                width: { size: 60, type: WidthType.PERCENTAGE },
                                children: [
                                    new Paragraph({
                                        alignment: AlignmentType.CENTER,
                                        spacing: { before: 100 }, // เว้นห่างจากชื่อนิดหน่อย
                                        children: [
                                            new TextRun({
                                                text: `วัน เดือน ปี ที่ตรวจ          ${meta.inspectDate?.d || "..."} ${meta.inspectDate?.m || "..."} ${meta.inspectDate?.y || "..."}`,
                                                font: FONT_TH,
                                                size: 32,
                                                bold: true
                                            }),
                                        ],
                                    }),
                                ],
                            }),
                        ],
                    }),
                ],
            })
        ];

        const doc = new Document({
            styles: {
                default: {
                    document: {
                        run: { font: FONT_TH, size: PT(16) },
                        paragraph: { spacing: { line: LINE_10, lineRule: "auto" } },
                    },
                },
            },
            sections: [
                // ✅หน้าปก
                {
                    properties: {
                        page: {
                            size: { width: A4.width, height: A4.height },
                            margin: {
                                ...MARGIN,
                                header: cmToTwip(1.2), // ระยะ header หน้าปก (ปรับได้)
                                footer: cmToTwip(1.2), // ระยะ footer หน้าปก (ปรับได้)
                            },
                        },
                    },
                    headers: {
                        default: coverHeader, // ✅ No.DTT-01
                    },
                    footers: {
                        default: coverFooter, // ✅ โลโก้ 2 อันด้านล่าง
                    },
                    children: coverChildren,
                },
                // ✅รองปก
                {
                    properties: {
                        page: {
                            size: { width: A4.width, height: A4.height },
                            margin: {
                                top: cmToTwip(2),
                                bottom: cmToTwip(2),
                                left: cmToTwip(2.5),
                                right: cmToTwip(2.5),
                                header: 0,
                                footer: 0,
                            },
                        },
                    },

                    headers: { default: new Header({ children: [] }) },
                    footers: { default: new Footer({ children: [] }) },

                    children: [
                        /* 🔝 บนสุด */
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                                new TextRun({
                                    text: "รายละเอียดการตรวจสอบป้าย",
                                    size: PT(36),
                                    bold: true,
                                }),
                            ],
                        }),

                        spacer(5),

                        /* 🎯 กลางหน้า */
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                                new TextRun({
                                    text: "สำหรับผู้ตรวจสอบอาคาร",
                                    size: PT(30),
                                    bold: true,
                                }),
                            ],
                        }),

                        spacer(6),

                        /* 🔻 โลโก้ */
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            spacing: { after: cmToTwip(1) },
                            children: [
                                new ImageRun({
                                    type: "png",
                                    data: footerLogoBytes,
                                    transformation: { width: 85, height: 85 },
                                }),
                            ],
                        }),

                        /* 🔻 ข้อความล่าง */
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                                new TextRun({
                                    text: "Professional ",
                                    size: PT(28),
                                    bold: true,
                                }),
                                new TextRun({
                                    text: "Partner",
                                    size: PT(28),
                                    bold: true,
                                    color: "FF0000",
                                }),
                                new TextRun({
                                    text: " For Safe Buildings",
                                    size: PT(28),
                                    bold: true,
                                }),
                            ],
                        }),
                    ],
                },
                // ✅เนื้อหารายงาน
                {
                    properties: {
                        page: {
                            size: { width: A4.width, height: A4.height },
                            margin: {
                                ...MARGIN,
                                header: cmToTwip(0.5),
                                footer: cmToTwip(0.5),
                            },
                            pageNumbers: {
                                start: 2, // ✅ เริ่มนับจากหน้า 2
                            },
                        },
                    },
                    headers: {
                        default: reportHeader,
                    },
                    footers: {
                        default: reportFooter,
                    },
                    children: [...section1, ...section2, ...section3, ...section4],
                },
                // ✅แผน
                {
                    properties: {
                        page: {
                            size: { width: A4.width, height: A4.height },
                            margin: {
                                ...MARGIN,
                                header: cmToTwip(0.5),
                                footer: cmToTwip(0.5),
                            },
                            pageNumbers: {
                                start: 1, // ✅ เริ่มนับจากหน้า 1
                            },
                        },
                    },
                    headers: {
                        default: reportHeader,
                    },
                    footers: {
                        default: reportFooter,
                    },
                    children: [
                        ...planCover,
                        ...maintenancePart1Section,
                        ...maintenancePart2Section,
                        ...maintenancePart3Section,
                        ...maintenancePart4Section,
                        ...maintenancePart5Section,
                        ...maintenancePart6Section,
                        ...maintenancePart7Section,
                    ],
                },

            ],
        });

        const blob = await Packer.toBlob(doc);

        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, "0");
        const dd = String(now.getDate()).padStart(2, "0");
        const HH = String(now.getHours()).padStart(2, "0");
        const MM = String(now.getMinutes()).padStart(2, "0");

        saveAs(blob, `รายงาน_${dd}${mm}${yyyy}_${HH}${MM}.docx`);
    } finally {
        showLoading(false);
    }
}
