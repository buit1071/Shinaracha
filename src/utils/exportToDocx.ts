// utils/exportToDocx.ts
"use client";

import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    ImageRun,
    Table,
    TableRow,
    TableCell,
    WidthType,
    VerticalAlign,
    BorderStyle,
    Header,
    Footer,
    HeightRule,
    AlignmentType,
    TextDirection,
    ShadingType
} from "docx";
import {
    AlignmentType as DocxAlignment,
    TextDirection as DocxTextDirection
} from "docx";
import { saveAs } from "file-saver";

import { SectionTwoForm } from "@/components/check-form/forms/form1-3/SectionTwoDetails";
import { SectionThreeForm, SectionThreeRow, FreqKey } from "@/components/check-form/forms/form1-3/SectionThreeDetails";
import { SectionFourForm } from "@/components/check-form/forms/form1-3/SectionFourDetails";
import { SectionFiveForm } from "@/components/check-form/forms/form1-3/SectionFiveDetails";

/** โหลดรูปจาก public แล้ว "บังคับแปลง" เป็น PNG -> Uint8Array ที่ Word รองรับ */
async function loadAsPngBytes(url: string): Promise<Uint8Array> {
    const img = new Image();
    img.src = url; // เช่น "/images/NewLOGOSF.webp" หรือ ".png"
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

/** สร้าง Header: โลโก้ซ้าย, ขวาเป็นชื่อบริษัท 2 บรรทัด (ไทย/อังกฤษ) */
async function buildCompanyHeader(opts: {
    companyTh: string;
    companyEn: string;
    logoUrl: string;
    logoSize?: { width: number; height: number };
}) {
    const { companyTh, companyEn, logoUrl, logoSize = { width: 48, height: 48 } } = opts;

    const pngBytes = await loadAsPngBytes(logoUrl);
    const logoRun = new ImageRun({
        data: pngBytes,
        type: "png",
        transformation: { width: logoSize.width, height: logoSize.height },
    });

    const headerTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
            top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        },
        rows: [
            // แถวเนื้อหา: โลโก้ซ้าย + ข้อความขวา
            new TableRow({
                children: [
                    new TableCell({
                        width: { size: 12, type: WidthType.PERCENTAGE },
                        verticalAlign: VerticalAlign.CENTER,
                        margins: { top: 0, bottom: 0, left: 0, right: 120 },
                        children: [new Paragraph({ children: [logoRun] })],
                    }),
                    new TableCell({
                        width: { size: 88, type: WidthType.PERCENTAGE },
                        verticalAlign: VerticalAlign.CENTER,
                        margins: { top: 0, bottom: 0, left: 0, right: 0 },
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.LEFT,
                                spacing: { before: 0, after: 0, line: 240 },
                                children: [
                                    new TextRun({ text: companyTh, bold: true, size: 26, font: FONT_TH }),
                                ],
                            }),
                            new Paragraph({
                                alignment: AlignmentType.LEFT,
                                spacing: { before: 0, after: 0, line: 240 },
                                children: [
                                    new TextRun({ text: companyEn, size: 26, font: FONT_TH }),
                                ],
                            }),
                        ],
                    }),
                ],
            }),
            // แถวเว้นว่าง: สูง ~1 บรรทัด (12pt = 240 twips)
            new TableRow({
                height: { value: 240, rule: HeightRule.EXACT },   // ← spacer 1 บรรทัด
                children: [
                    new TableCell({
                        columnSpan: 2,                                  // กินเต็ม 2 คอลัมน์
                        borders: {
                            top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                            left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                            bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                            right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                        },
                        children: [new Paragraph({})],                  // ไม่มีข้อความ
                    }),
                ],
            }),
        ],
    });

    return new Header({ children: [headerTable] });
}

function buildFooter(text: string) {
    return new Footer({
        children: [
            new Paragraph({
                alignment: AlignmentType.LEFT,        // ถ้าอยากชิดซ้ายเปลี่ยนเป็น LEFT
                spacing: { before: 120, after: 0, line: 240 },
                children: [
                    new TextRun({
                        text,
                        font: FONT_TH,
                        size: 24,                           // 12pt = 24 half-points
                    }),
                ],
            }),
        ],
    });
}

const PAGE = {
    widthTwips: 11907,   // A4 width 21cm
    heightTwips: 16840,  // A4 height 29.7cm
    margin: {
        top: 283,     // 0.5 cm
        bottom: 227,  // 0.4 cm
        left: 1134,   // 2.0 cm
        right: 567,   // 1.0 cm
    },
};

const twipsToPx = (twips: number) => Math.floor((twips / 1440) * 96); // 96dpi
const contentWidthPx =
    twipsToPx(PAGE.widthTwips - PAGE.margin.left - PAGE.margin.right);
// กันชิดขอบเกินไป เผื่อซัก 8px
const MAX_IMAGE_PX = Math.max(0, contentWidthPx - 8);

async function fileToPngBytesAndSize(file: File): Promise<{ bytes: Uint8Array; width: number; height: number }> {
    const url = URL.createObjectURL(file);
    try {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = url;
        await img.decode();

        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0);

        const dataUrl = canvas.toDataURL("image/png");
        const res = await fetch(dataUrl);
        const ab = await res.arrayBuffer();

        return { bytes: new Uint8Array(ab), width: img.naturalWidth, height: img.naturalHeight };
    } finally {
        URL.revokeObjectURL(url);
    }
}

async function loadAsPngBytesAndSize(url: string): Promise<{ bytes: Uint8Array; width: number; height: number }> {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = url;
    await img.decode();

    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0);

    const dataUrl = canvas.toDataURL("image/png");
    const res = await fetch(dataUrl);
    const ab = await res.arrayBuffer();

    return { bytes: new Uint8Array(ab), width: img.naturalWidth, height: img.naturalHeight };
}

/* ---------------- Helpers: standard paragraph styles ---------------- */
const TAB = 720; // 0.5 inch = 720 twips
const FONT_TH = "Cordia New";
const SIZE_15PT = 30; // 15pt = 30 half-points
const SIZE_18PT = 36; // 18pt = 30 half-points
const SIZE_24PT = 48;
const SIZE_TITLE = 56;
const PX_PER_INCH = 96;

function headingBoxed(
    sectionNo: number,
    title: string,
    center = true,
    padLines = 1,          // จำนวนบรรทัดว่างบน/ล่างในกรอบ (ปรับได้)
    borderSize = 10        // ความหนาเส้นกรอบ
): Paragraph {
    const pad: TextRun[] = Array.from({ length: padLines }, () => new TextRun({ text: "", break: 1 }));

    return new Paragraph({
        alignment: center ? AlignmentType.CENTER : AlignmentType.LEFT,
        spacing: { before: 120, after: 120, line: 320 },       // ระยะห่างภายนอกกรอบ
        border: {
            top: { style: BorderStyle.SINGLE, size: borderSize, color: "000000" },
            bottom: { style: BorderStyle.SINGLE, size: borderSize, color: "000000" },
            left: { style: BorderStyle.SINGLE, size: borderSize, color: "000000" },
            right: { style: BorderStyle.SINGLE, size: borderSize, color: "000000" },
        },
        children: [
            ...pad, // บรรทัดว่างด้านบนในกรอบ → ช่วยให้ดูอยู่กึ่งกลางแนวตั้ง
            new TextRun({ text: `ส่วนที่ ${sectionNo} `, bold: true, font: FONT_TH, size: SIZE_24PT }),
            new TextRun({ text: title, bold: true, font: FONT_TH, size: SIZE_24PT }),
            ...pad, // บรรทัดว่างด้านล่างในกรอบ
        ],
    });
}

function headingBoxedCompact(
    sectionNo: number,
    title: string,                     // ใส่ \n เพื่อขึ้นบรรทัดใหม่
    center = true
): Paragraph {
    const parts = title.split(/\n+/);   // แยกบรรทัด
    const runs: TextRun[] = [];

    // บรรทัดแรก: "ส่วนที่ X " + หัวข้อบรรทัดแรก
    runs.push(new TextRun({ text: `ส่วนที่ ${sectionNo} `, bold: true, font: FONT_TH, size: SIZE_24PT }));
    runs.push(new TextRun({ text: parts[0] ?? "", bold: true, font: FONT_TH, size: SIZE_24PT }));

    // บรรทัดถัด ๆ ไป (ขึ้นบรรทัดใหม่ด้วย break)
    for (let i = 1; i < parts.length; i++) {
        runs.push(new TextRun({ break: 1 }));
        runs.push(new TextRun({ text: parts[i], bold: true, font: FONT_TH, size: SIZE_24PT }));
    }

    return new Paragraph({
        alignment: center ? AlignmentType.CENTER : AlignmentType.LEFT,
        // ↓ บีบระยะให้แน่นขึ้น
        spacing: { before: 60, after: 60, line: 240 },  // line: 240 ≈ single line
        border: {
            top: { style: BorderStyle.SINGLE, size: 10, color: "000000" },
            bottom: { style: BorderStyle.SINGLE, size: 10, color: "000000" },
            left: { style: BorderStyle.SINGLE, size: 10, color: "000000" },
            right: { style: BorderStyle.SINGLE, size: 10, color: "000000" },
        },
        children: runs,
    });
}

// หัวข้อชิดซ้าย หนา
function heading(text: string, head = false) {
    return new Paragraph({
        alignment: head ? AlignmentType.CENTER : AlignmentType.LEFT,
        spacing: { before: 60, after: 120, line: 240 },
        children: [new TextRun({ text, bold: true, font: FONT_TH, size: SIZE_18PT })],
    });
}

function headingImg(text: string, center = false, bg?: string) {
    return new Paragraph({
        alignment: center ? AlignmentType.CENTER : AlignmentType.LEFT,
        spacing: { before: 80, after: 80, line: 240 },
        // ถ้ามีระบุสีพื้นหลัง ให้ลง shading
        shading: bg ? { type: ShadingType.CLEAR, color: "auto", fill: bg } : undefined,
        children: [new TextRun({ text, bold: true, font: FONT_TH, size: SIZE_15PT })],
    });
}

// ย่อหน้าทั่วไป (ย่อบรรทัดแรก)
function p(text: string) {
    return new Paragraph({
        indent: { firstLine: 720 }, // 0.5"
        spacing: { before: 0, after: 90, line: 240 }, // ~1.15x
        children: [new TextRun({ text, font: FONT_TH, size: SIZE_15PT })],
    });
}

// ใช้แทน p() เมื่ออยากผสมตัวหนา/ไม่หนาในย่อหน้าเดียว
function pSegments(
    segments: Array<{ text: string; bold?: boolean }>,
    tabs: number = 1,                   // ← ใส่ค่าเริ่มต้นตรงนี้
): Paragraph {
    return new Paragraph({
        indent: { firstLine: Math.max(0, Math.round(tabs * TAB)) },
        spacing: { before: 0, after: 90, line: 240 },
        children: segments.map(s =>
            new TextRun({ text: s.text, bold: !!s.bold, font: FONT_TH, size: SIZE_15PT })
        ),
    });
}

// ย่อหน้า “เลขลิสต์ตามต้นฉบับ” เช่น (1) ... หรือ 1.7.1.1 ...
function pn(text: string, tabs: number = 1) {
    return new Paragraph({
        indent: { left: Math.max(0, Math.round(tabs * TAB)) }, // ย่อซ้ายตามจำนวนแท็บ
        spacing: { before: 0, after: 80, line: 240 },
        children: [new TextRun({ text, font: FONT_TH, size: SIZE_15PT })],
    });
}

/* ---------------- Section 1 content (no bullets) ---------------- */
function buildSectionOne(): Paragraph[] {
    const paras: Paragraph[] = [];

    // หัวข้อหลัก (ชิดซ้าย)
    paras.push(
        headingBoxed(1, "ขอบเขตของการตรวจสอบ และรายละเอียดที่ต้องตรวจสอบ")
    );

    // 1.1
    paras.push(
        // 1) … “ป้าย” … **การตรวจสอบป้าย** …
        pSegments([
            { text: "1.1 ในแผนการตรวจสอบและรายละเอียดการตรวจสอบป้ายประจำปีฉบับนี้ “ป้าย”", bold: true },
            { text: " หมายถึง แผ่นป้ายและสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย" },
        ]),

        pSegments([
            { text: "การตรวจสอบป้าย", bold: true },
            { text: " หมายถึง การตรวจสอบสภาพป้าย หรือสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย ในด้านความมั่นคงแข็งแรง และระบบอุปกรณ์ประกอบของป้าย ตามมาตรา 32 ทวิ แห่งพระราชบัญญัติควบคุมอาคาร พ.ศ.2522" },
        ]),

        // 2) **ผู้ตรวจสอบอาคาร** …
        pSegments([
            { text: "ผู้ตรวจสอบอาคาร", bold: true },
            { text: " หมายถึง ผู้ซึ่งได้รับใบอนุญาตประกอบวิชาชีพ วิศวกรรมควบคุม หรือผู้ซึ่งได้รับใบอนุญาตประกอบวิชาชีพสถาปัตยกรรมควบคุม ตามกฎหมายว่าด้วยการนั้น แล้วแต่กรณี ซึ่งได้ขึ้นทะเบียนเป็นผู้ตรวจสอบอาคารตามพระราชบัญญัติควบคุมอาคาร พ.ศ.2522" },
        ]),

        // 3) **เจ้าของป้าย** …
        pSegments([
            { text: "เจ้าของป้าย", bold: true },
            { text: " หมายถึง ผู้ที่มีสิทธิ์เป็นเจ้าของป้ายหรือสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย" },
        ]),

        // 4) **ผู้ดูแลป้าย** …
        pSegments([
            { text: "ผู้ดูแลป้าย", bold: true },
            { text: " หมายถึง เจ้าของป้าย หรือ ผู้ที่ที่ได้รับมอบหมายจากเจ้าของป้ายให้มีหน้าที่ตรวจสอบการบำรุงรักษาป้าย และระบบอุปกรณ์ประกอบต่าง ๆ" },
        ]),

        // 5) **เจ้าพนักงานท้องถิ่น** …
        pSegments([
            { text: "เจ้าพนักงานท้องถิ่น", bold: true },
            { text: " หมายถึง" },
        ]),

        // (รายการย่อย pn(...) คงเดิม)
        pn("(1) นายกเทศมนตรี สำหรับในเขตเทศบาล", 2),
        pn("(2) นายกองค์การบริหารส่วนจังหวัด สำหรับในเขตองค์การบริหารส่วนจังหวัด", 2),
        pn("(3) ประธานกรรมการบริหารองค์การบริหารส่วนตำบล สำหรับในเขตองค์การบริหารส่วนตำบล", 2),
        pn("(4) ผู้ว่าราชการกรุงเทพมหานคร สำหรับในเขตกรุงเทพมหานคร", 2),
        pn("(5) ปลัดเมืองพัทยา สำหรับในเขตเมืองพัทยา", 2),
        pn("(6) ผู้บริหารท้องถิ่นขององค์การปกครองท้องถิ่นอื่นที่รัฐมนตรีประกาศกำหนด สำหรับในเขตราชการส่วนท้องถิ่นนั้น", 2),

        // 6) **แผนการตรวจสอบ** …
        pSegments([
            { text: "แผนการตรวจสอบ", bold: true },
            { text: " หมายถึง แผนการตรวจสอบสภาพป้ายหรือสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย และอุปกรณ์ประกอบต่าง ๆ ที่จัดทำขึ้นสำหรับ สำหรับผู้ตรวจสอบอาคาร" },
        ]),

        // 7) **แบบแปลนป้าย** …
        pSegments([
            { text: "แบบแปลนป้าย", bold: true },
            { text: " หมายถึง แบบแปลนของป้ายหรือสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย ที่ต้องตรวจสอบ" },
        ]),
    );

    // 1.2
    paras.push(
        pSegments([
            { text: "1.2 หน้าที่ความรับผิดชอบของผู้เกี่ยวข้อง", bold: true },
        ]),

        pSegments([
            { text: "1.2.1 ผู้ตรวจสอบอาคาร", bold: true },
            { text: " มีหน้าที่ตรวจสอบ ทำรายงานทางด้านความมั่นคงแข็งแรง และระบบต่าง ๆ ที่เกี่ยวข้องเพื่อความปลอดภัย แจ้งกับเจ้าของอาคาร ผู้ตรวจสอบต้องตรวจสอบตามหลักวิชาชีพ และตามมาตรฐานการตรวจสอบสภาพอาคารของกฎหมายควบคุมอาคาร หรือมาตรฐานสากลต่าง ๆ ที่เกี่ยวข้อง ณ สถานที่ วัน และเวลาที่ทำการตรวจสอบ" },
        ]),

        p("ผู้ตรวจสอบอาคารต้องจัดให้มี"),
        pn("(1) แบบรายละเอียดการตรวจสอบป้าย สำหรับผู้ตรวจสอบอาคารใช้ในการตรวจสอบใหญ่ ทุก ๆ 5 ปี และการตรวจสอบป้ายประจำปี", 2),
        pn("(2) แผนปฏิบัติการการตรวจบำรุงรักษาป้าย และอุปกรณ์ประกอบของป้าย รวมทั้งคู่มือปฏิบัติการตามแผนให้แก่เจ้าของป้ายเพื่อเป็นแนวทางการตรวจบำรุงรักษาและ การบันทึกข้อมูลการตรวจบำรุงรักษา", 2),
        pn("(3) แผนการตรวจสอบประจำปี รวมทั้งแนวทางการตรวจสอบตามแผนดังกล่าวให้แก่เจ้าของป้าย เพื่อประโยชน์ในการตรวจสอบประจำปี", 2),

        pSegments([
            { text: "1.2.2 เจ้าของป้าย หรือผู้ดูแลป้าย", bold: true },
            { text: " ที่ได้รับมอบหมายจากเจ้าของป้ายมีหน้าที่ตรวจสอบบำรุงรักษาป้าย และอุปกรณ์ประกอบ รวมทั้ง การตรวจสอบสมรรถนะของป้าย ตามที่ผู้ตรวจสอบอาคารได้กำหนดไว้ และจัดให้มีการทดสอบการทำงานของระบบ อุปกรณ์ในระหว่างปี แล้วรายงานผลการตรวจสอบต่อเจ้าพนักงานท้องถิ่น ตามหลักเกณฑ์ วิธีการ และเงื่อนไขที่กำหนดในกฎกระทรวงเกี่ยวกับการตรวจสอบอาคาร" },
        ]),

        pSegments([
            { text: "1.2.3 เจ้าพนักงานท้องถิ่น", bold: true },
            { text: " มีหน้าที่ตามกฎหมายในการพิจารณาผลการตรวจสอบสภาพป้ายที่ เจ้าของอาคารเสนอเพื่อพิจารณาออกใบรับรองการตรวจสอบอาคาร หรือดำเนินการตามอำนาจหน้าที่ ตามกฎหมายต่อไป" },
        ]),
    );

    // 1.3
    paras.push(
        pSegments([
            { text: "1.3 ผู้ตรวจสอบอาคาร", bold: true },
            { text: " กำหนดแผนการตรวจสอบสภาพป้ายและอุปกรณ์ประกอบของป้ายไว้ตาม  แผนการตรวจสอบฉบับนี้  ให้เจ้าของป้าย และหรือผู้ดูแลป้ายใช้เป็นแนวทางการปฏิบัติ ผู้ตรวจสอบอาคารสามารถแก้ไขเปลี่ยนแปลงแผนการตรวจสอบนี้ได้ตามความเหมาะสม" },
        ]),
    );

    // 1.4
    paras.push(
        pSegments([
            { text: "1.4 การตรวจสอบบำรุงรักษาป้าย และระบบอุปกรณ์ประกอบต่าง ๆ ของป้าย", bold: true },
            { text: " ให้เป็นไปตามแผนการตรวจการตรวจสอบบำรุงรักษา และคู่มือการตรวจบำรุงรักษาป้ายที่ผู้ตรวจสอบอาคารกำหนด" },
        ]),
    );

    // 1.5
    paras.push(
        pSegments([
            { text: "1.5 ผู้ตรวจสอบอาคารต้องไม่ดำเนินการตรวจสอบป้าย", bold: true },
            { text: " ดังต่อไปนี้" },
        ]),
        pn("(1) ป้ายที่ผู้ตรวจสอบหรือคู่สมรส พนักงานหรือตัวแทนของผู้ตรวจสอบเป็นผู้จัดทำหรือรับผิดชอบในการออกแบบ รายการประกอบแบบแปลน หรือรายการคำนวณส่วนต่าง ๆ ของโครงสร้าง   การควบคุมงาน การก่อสร้าง หรือการติดตั้งอุปกรณ์ประกอบของป้าย", 2),
        pn("(2) ป้ายที่ผู้ตรวจสอบหรือคู่สมรสเป็นเจ้าของหรือมีส่วนร่วมในการบริหารจัดการ", 2)

    );

    // 1.6
    paras.push(
        pSegments([
            { text: "1.6 ขอบเขตในการตรวจสอบป้ายของผู้ตรวจสอบอาคาร", bold: true },
        ]),
        pSegments([
            { text: "การตรวจสอบสภาพป้ายและอุปกรณ์ประกอบต่าง ๆ ของป้าย อาจมีข้อจำกัดต่าง ๆ ที่ไม่สามารถตรวจสอบได้ตามที่กำหนดและตามที่ต้องการได้ ดังนั้น จึงจำเป็นต้องกำหนดขอบเขตของผู้ตรวจสอบ ดังนี้" },
        ]),
        p(
            "“ผู้ตรวจสอบมีหน้าที่ตรวจสอบ สังเกต ทำรายงาน วิเคราะห์ ทางด้านความมั่นคงแข็งแรง และระบบต่าง ๆ ที่เกี่ยวข้องเพื่อความปลอดภัยของชีวิตและทรัพย์สิน ผู้ตรวจสอบต้องตรวจสอบตามหลักวิชาชีพ และตามมาตรฐานการตรวจสอบสภาพอาคารของกฎหมายควบคุมอาคารหรือมาตรฐานสากลต่าง ๆ ที่เกี่ยวข้อง ณ สถานที่ วัน และเวลาที่ทำการตรวจสอบตามที่ระบุในรายงานและติดตามตรวจสอบระหว่างปีภายหลังการตรวจสอบใหญ่  ตามช่วงเวลา  และความถี่ตามที่กำหนดไว้ในแผนการตรวจสอบประจำปีที่ผู้ตรวจสอบกำหนด”"
        )
    );

    // 1.7
    paras.push(
        pSegments([
            { text: "1.7 รายละเอียดในการตรวจสอบ", bold: true },
        ]),
        pSegments([
            { text: "1.7.1 รายละเอียดที่ต้องตรวจสอบ", bold: true },
        ], 2),
        pSegments([
            { text: "1.7.1.1 การตรวจสอบตัวป้าย", bold: true },
            { text: " ให้ตรวจสอบความมั่นคงแข็งแรงของอาคาร ดังนี้" },
        ], 2),
        pn("(1) การต่อเติม ดัดแปลง ปรับปรุงขนาดของป้าย", 3),
        pn("(2) การเปลี่ยนแปลงน้ำหนักของแผ่นป้าย", 3),
        pn("(3) การเปลี่ยนแปลงวัสดุของป้าย", 3),
        pn("(4) การชำรุดสึกหรอของป้าย", 3),
        pn("(5) การวิบัติของสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย", 3),
        pn("(6) การทรุดตัวของฐานรากของสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย (กรณีป้ายที่ตั้งบนพื้นดิน)", 3),
        pn(
            "(7) การเชื่อมยึดระหว่างแผ่นป้ายกับสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย  การเชื่อมยึด  ระหว่างชิ้นส่วนต่าง ๆ ของสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้ายและการเชื่อมยึด  ระหว่างสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้ายกับฐานรากหรืออาคาร", 3
        ),

        pSegments([
            { text: "1.7.1.2 การตรวจสอบระบบและอุปกรณ์ประกอบต่าง ๆ ของป้าย", bold: true },
        ], 2),
        pn("(1) ระบบไฟฟ้าแสงสว่าง", 3),
        pn("(2) ระบบป้องกันฟ้าผ่า", 3),
        pn("(3) ระบบและอุปกรณ์ประกอบอื่น ๆ", 3),

        pSegments([
            { text: "1.7.2  ลักษณะบริเวณที่ไม่ต้องตรวจสอบ", bold: true },
        ]),
        pn("(1) การตรวจสอบพื้นที่ที่มีความเสี่ยงภัยสูงต่อผู้ตรวจสอบ", 2),
        pn("(2) การตรวจสอบที่อาจทำให้อาคารหรือวัสดุอุปกรณ์หรือทรัพย์สินเกิดความเสียหาย", 2),

        pSegments([
            { text: "1.7.3 การตรวจสอบระบบโครงสร้าง", bold: true },
        ]),
        pn("1.7.3.1 ผู้ตรวจสอบจะตรวจสอบด้วยสายตา ทำรายงาน และประเมินโครงสร้างตามรายละเอียดดังต่อไปนี้", 2),
        pn("(1) ส่วนของฐานราก (ถ้ามี)", 3),
        pn("(2) ระบบโครงสร้าง", 3),
        pn(
            "(3) การเสื่อมสภาพของโครงสร้างที่จะมีผลกระทบต่อความมั่นคงแข็งแรงของระบบโครงสร้างอาคาร", 3
        ),
        pn(
            "(4) ความเสียหายและอันตรายของโครงสร้าง เช่น ความเสียหายเนื่องจากอัคคีภัย ความเสียหายจากการแอ่นตัวของโครงข้อหมุน เป็นต้น", 3
        ),
        pn("1.7.3.2 สภาพการใช้งานตามที่เห็น", 2),

        pSegments([
            { text: "1.7.4 การตรวจสอบระบบและอุปกรณ์ประกอบต่าง ๆ ของป้าย", bold: true },
        ]),
        pSegments([
            { text: "1.7.4.1 ระบบไฟฟ้า", bold: true },
        ], 2),
        pn(
            "1.7.4.1.1 ผู้ตรวจสอบจะตรวจสอบด้วยสายตา  เครื่องมือหรือเครื่องวัดชนิดพกพาทำรายงานและประเมินระบบไฟฟ้าและบริภัณฑ์ไฟฟ้า ดังนี้", 3
        ),
        pn("(1) สภาพสายไฟฟ้า ขนาดกระแสของสาย จุดต่อสาย และอุณหภูมิขั้วต่อสาย", 4),
        pn("(2) ท่อร้อยสาย รางเดินสาย และรางเคเบิล", 4),
        pn("(3) ขนาดเครื่องป้องกันกระแสเกินและพิกัดตัดกระแสของบริภัณฑ์ประธาน แผงย่อย และแผงวงจรย่อย", 4),
        pn("(4) เครื่องตัดไฟรั่ว", 4),
        pn("(5) การต่อลงดินของบริภัณฑ์ ขนาดตัวนำต่อลงดิน และความต่อเนื่องลงดินของท่อร้อยสาย รางเดินสาย รางเคเบิล", 4),
        pn("(6) รายการอื่นตามตารางรายการตรวจสอบ", 4),
        pn("1.7.4.1.2 ผู้ตรวจสอบไม่ต้องตรวจสอบในลักษณะดังนี้", 3),
        pn("(1) วัดหรือทดสอบแผงสวิตช์ที่ต้องให้สายวัดสัมผัสกับบริภัณฑ์ในขณะที่แผงสวิตช์นั้นมีไฟหรือใช้งานอยู่", 4),
        pn("(2) ทดสอบการใช้งานอุปกรณ์ป้องกันกระแสเกิน", 4),
        pn("(3) ถอดออกหรือรื้อบริภัณฑ์ไฟฟ้า นอกจากเพียงเปิดฝาแผงสวิตช์ แผงควบคุม เพื่อตรวจสภาพบริภัณฑ์", 4),
        pSegments([
            { text: "1.7.4.2 ระบบป้องกันฟ้าผ่า", bold: true },
        ], 2),
        pn("(1) ตรวจสอบระบบตัวนำล่อฟ้า ตัวนำต่อลงดินครอบคลุมครบถ้วน", 3),
        pn("(2) ตรวจสอบระบบรากสายดิน", 3),
        pn("(3) ตรวจสอบจุดต่อประสานศักย์", 3),
        pn("(4) ตรวจสอบ การดูแลรักษา ซ่อมบำรุง และการทดสอบระบบในอดีตที่ผ่านมา", 3),
        pSegments([
            { text: "1.7.4.3 ระบบอุปกรณ์ประกอบอื่นๆ", bold: true },
        ], 2),
        p("ผู้ตรวจสอบจะตรวจสอบด้วยสายตา ทำรายงานและประเมินความปลอดภัยของอุปกรณ์ประกอบต่าง ๆ ดังต่อไปนี้"),
        pn("(1) สภาพบันไดขึ้นลง", 2),
        pn("(2) สภาพราวจับ และราวกันตก", 2),
        pn("(3) อุปกรณ์ประกอบอื่นตามที่เห็นสมควร", 2)
    );

    return paras;
}

type FormDataLite = {
    cover?: File;
    placeName?: string;
    sectionTwo?: Partial<SectionTwoForm>;
    sectionThree?: Partial<SectionThreeForm>
    sectionFour?: Partial<SectionFourForm>
    sectionFive?: Partial<SectionFiveForm>
};

type DocNode = Paragraph | Table;
type DocxAlign = (typeof DocxAlignment)[keyof typeof DocxAlignment];
type DocxText = (typeof DocxTextDirection)[keyof typeof DocxTextDirection];

const valueRun = (v?: string) =>
    new TextRun({ text: v ?? "", font: FONT_TH, size: SIZE_15PT });

const spacer = () => new TextRun({ text: "    " }); // ช่องไฟคั่นคู่/สามช่อง

// บรรทัดเดี่ยว: label + ช่องขีดเส้น
function line(
    label: string,
    value?: string,
    _padSpaces = 24,   // ไม่ใช้แล้ว แต่คงพารามิเตอร์ไว้ให้ signature เดิมไม่พัง
    indentTabs = 0
) {
    return new Paragraph({
        spacing: { before: 80, after: 0, line: 240 },
        indent: indentTabs ? { left: indentTabs * TAB } : undefined,
        children: [
            new TextRun({ text: label + "  ", font: FONT_TH, size: SIZE_15PT, bold: true }),
            valueRun(value), // ← ไม่มี underline แล้ว
        ],
    });
}

function pairLine(
    l1: string, v1: string | undefined,
    l2: string, v2: string | undefined,
    l3: string, v3: string | undefined,
    indentTabs = 0
) {
    return new Paragraph({
        spacing: { before: 80, after: 0, line: 240 },
        indent: indentTabs ? { left: indentTabs * TAB } : undefined,
        children: [
            new TextRun({ text: l1 + "  ", font: FONT_TH, size: SIZE_15PT, bold: true }),
            valueRun(v1),
            spacer(),
            new TextRun({ text: l2 + "  ", font: FONT_TH, size: SIZE_15PT, bold: true }),
            valueRun(v2),
            spacer(),
            new TextRun({ text: l3 + "  ", font: FONT_TH, size: SIZE_15PT, bold: true }),
            valueRun(v3),
        ],
    });
}

// เช็กบ็อกซ์แสดงผล (ไม่โต้ตอบ)
function pnChildren(children: (TextRun | ImageRun)[], tabs = 0) {
    return new Paragraph({
        spacing: { before: 0, after: 80, line: 240 },
        indent: tabs ? { left: tabs * TAB } : undefined,
        children,
    });
}

/** checkbox line: เพิ่มพารามิเตอร์ย่อหน้า */
function checkboxLine(checked: boolean, label: string, tabs = 0) {
    return new Paragraph({
        spacing: { before: 80, after: 0, line: 240 },
        indent: tabs ? { left: tabs * TAB } : undefined,
        children: [
            new TextRun({ text: checked ? "☑ " : "☐ ", font: FONT_TH, size: SIZE_15PT }),
            new TextRun({ text: label, font: FONT_TH, size: SIZE_15PT }),
        ],
    });
}

/** รูปถ่ายป้าย: เปิดหน้าใหม่ แล้ววางรูปบน 1 / ล่าง 2 พร้อมคำบรรยายใต้รูป */
async function buildPhotosSection(
    s2: SectionTwoForm | undefined
): Promise<DocNode[]> {
    const items: DocNode[] = [];
    if (!s2) return items;

    // เปิดหน้าใหม่เสมอ
    items.push(new Paragraph({ pageBreakBefore: true }));

    // หัวข้อ
    items.push(headingImg(
        "รูปถ่ายป้าย",
        true,
        "D1D1D1"
    ));

    // ขนาดหน้า (นิ้ว)
    const contentWidthIn = (PAGE.widthTwips - PAGE.margin.left - PAGE.margin.right) / 1440;
    const PX_PER_INCH = 96;

    // ความสูง "เท่ากันทุกภาพ"
    const TARGET_H_IN = 3.5;

    // เพดานความกว้างของรูปบน/รูปสองคอลัมน์
    const TOP_MAX_W_IN = Math.min(4.8, contentWidthIn * 0.85);
    const GAP_IN = 0.25;
    const BOT_MAX_W_IN = Math.min(3.2, (contentWidthIn - GAP_IN) / 2);

    // ตัวช่วย: ทำให้รูป "สูง 3.5 นิ้ว" แล้วคำนวณความกว้างตามอัตราส่วน
    // ถ้ากว้างเกินเพดานคอลัมน์ จะลดสเกลลงทั้งกว้าง/สูงให้พอดีคอลัมน์ (อาจเตี้ยกว่า 3.5 เล็กน้อยเพื่อไม่ล้น)
    const loadFitFixedHeight = async (src: string, maxWIn: number) => {
        const { bytes, width, height } = await loadAsPngBytesAndSize(src);
        const aspect = width / height;

        // เริ่มด้วยให้สูง 3.5"
        let wIn = TARGET_H_IN * aspect;
        let hIn = TARGET_H_IN;

        // ถ้ากว้างเกินคอลัมน์ ให้ลดลงตามสัดส่วน
        if (wIn > maxWIn) {
            const scale = maxWIn / wIn;
            wIn *= scale;
            hIn *= scale; // จะต่ำกว่า 3.5" เล็กน้อยเพื่อไม่ล้นคอลัมน์
        }

        return {
            bytes,
            wPx: Math.round(wIn * PX_PER_INCH),
            hPx: Math.round(hIn * PX_PER_INCH),
        };
    };

    // ตัวช่วยวางรูป + คำบรรยายใต้รูป: ให้ "คำใต้รูปห่างจากรูป 1 บรรทัด (≈12pt)"
    const imgWithCaption = (
        bytes: Uint8Array,
        wPx: number,
        hPx: number,
        caption: string
    ) => [
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 0 },
                children: [
                    new ImageRun({
                        data: bytes,
                        type: "png",
                        transformation: { width: wPx, height: hPx },
                    }),
                ],
            }),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 240, after: 240 },
                children: [
                    new TextRun({ text: caption, font: FONT_TH, size: SIZE_15PT, bold: true }),
                ],
            }),
        ];

    // ===== รูปบน =====
    if (s2.photosFront) {
        try {
            const f = await loadFitFixedHeight(s2.photosFront, TOP_MAX_W_IN);
            items.push(...imgWithCaption(f.bytes, f.wPx, f.hPx, "ด้านหน้าป้าย"));
        } catch { }
    }

    // ===== รูปล่าง 2 ใบ (ซ้าย/ขวา) =====
    let leftRun: Paragraph[] = [], rightRun: Paragraph[] = [];

    if (s2.photosSide) {
        try {
            const v = await loadFitFixedHeight(s2.photosSide, BOT_MAX_W_IN);
            leftRun = imgWithCaption(v.bytes, v.wPx, v.hPx, "ด้านข้างของป้าย");
        } catch { }
    }
    if (s2.photosBase) {
        try {
            const v = await loadFitFixedHeight(s2.photosBase, BOT_MAX_W_IN);
            rightRun = imgWithCaption(v.bytes, v.wPx, v.hPx, "ส่วนฐานของป้าย");
        } catch { }
    }

    if (leftRun.length || rightRun.length) {
        items.push(
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: {
                    top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                    bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                    left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                    right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                    insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                    insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                },
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({
                                margins: { top: 0, bottom: 0, left: 120, right: 120 },
                                verticalAlign: VerticalAlign.CENTER,
                                children: leftRun.length ? leftRun : [new Paragraph({})],
                            }),
                            new TableCell({
                                margins: { top: 0, bottom: 0, left: 120, right: 120 },
                                verticalAlign: VerticalAlign.CENTER,
                                children: rightRun.length ? rightRun : [new Paragraph({})],
                            }),
                        ],
                    }),
                ],
            })
        );
    }

    return items;
}

type BoxHeaderOpts = {
    headerFill?: string;
    checkbox?: boolean;
    checked?: boolean;
    headerLayout?: "inline" | "split"; // inline = คอลัมน์เดียว (แนะนำ)
    checkboxGapSpaces?: number;        // ช่องไฟระหว่าง ☑ กับชื่อ
};

function boxWithHeader(
    title: string,
    body: Paragraph[],
    opts: BoxHeaderOpts = {}
): Table {
    const {
        headerFill = "D9D9D9",
        checkbox = false,
        checked = false,
        headerLayout = "inline",       // << ใช้แบบคอลัมน์เดียว (ศูนย์กลางสวยสุด)
        checkboxGapSpaces = 2,
    } = opts;

    // --- เฮดเดอร์แบบ "คอลัมน์เดียว" (ติ๊ก + ข้อความอยู่ย่อหน้าเดียว) ---
    const headerRow =
        headerLayout === "inline"
            ? new TableRow({
                cantSplit: true,
                children: [
                    new TableCell({
                        verticalAlign: VerticalAlign.CENTER,
                        shading: { fill: headerFill },
                        margins: { top: 80, bottom: 80, left: 120, right: 120 },
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                children: [
                                    ...(checkbox
                                        ? [new TextRun({ text: checked ? "☑" : "☐", font: FONT_TH, size: SIZE_15PT })]
                                        : []),
                                    ...(checkbox ? [new TextRun({ text: " ".repeat(checkboxGapSpaces) })] : []),
                                    new TextRun({ text: title, bold: true, font: FONT_TH, size: SIZE_15PT }),
                                ],
                            }),
                        ],
                    }),
                ],
            })
            // --- เฮดเดอร์แบบ "สองคอลัมน์" (ไว้เผื่ออยากใช้ภายหลัง) ---
            : new TableRow({
                cantSplit: true,
                children: [
                    new TableCell({
                        width: { size: 800, type: WidthType.DXA },
                        verticalAlign: VerticalAlign.CENTER,
                        shading: { fill: headerFill },
                        margins: { top: 80, bottom: 80, left: 80, right: 60 },
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                children: checkbox
                                    ? [new TextRun({ text: checked ? "☑" : "☐", font: FONT_TH, size: SIZE_15PT })]
                                    : [new TextRun({ text: "" })],
                            }),
                        ],
                    }),
                    new TableCell({
                        verticalAlign: VerticalAlign.CENTER,
                        shading: { fill: headerFill },
                        margins: { top: 80, bottom: 80, left: 120, right: 120 },
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                children: [new TextRun({ text: title, bold: true, font: FONT_TH, size: SIZE_15PT })],
                            }),
                        ],
                    }),
                ],
            });

    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
            top: { style: BorderStyle.SINGLE, size: 10, color: "000000" },
            bottom: { style: BorderStyle.SINGLE, size: 10, color: "000000" },
            left: { style: BorderStyle.SINGLE, size: 10, color: "000000" },
            right: { style: BorderStyle.SINGLE, size: 10, color: "000000" },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
            insideVertical: { style: BorderStyle.NONE, size: 0, color: "000000" },
        },
        rows: [
            headerRow,
            new TableRow({
                children: [
                    new TableCell({
                        verticalAlign: VerticalAlign.TOP,
                        margins: { top: 120, bottom: 120, left: 140, right: 140 },
                        children: body,
                    }),
                ],
            }),
        ],
    });
}

// ====== สร้าง “ส่วนที่ 2 ข้อมูลทั่วไปของป้าย” แบบขีดเส้น ไม่มีตาราง ======
async function buildSectionTwo(formData: FormDataLite) {
    const GAP = new Paragraph({ children: [new TextRun({ text: " " })] });
    const s2 = formData.sectionTwo ?? {};
    const s = (v?: string | null) => (v && v.trim() !== "" ? v : "");

    // หัวข้อใหญ่ + เกริ่น
    const h2 = headingBoxed(2, "ข้อมูลทั่วไปของป้าย และแนวทางการตรวจสอบตามแผน");
    const intro = p("ข้อมูลทั่วไปของป้ายที่ผู้ตรวจสอบต้องลงบันทึกในหัวข้อต่าง ๆ และอาจเพิ่มเติมได้เพื่อให้ข้อมูลสมบูรณ์ยิ่งขึ้นในบางรายการจะต้องประสานงานกับเจ้าของป้ายและผู้ดูแลป้ายเพื่อให้ได้ข้อมูลเหล่านั้น");
    const h2_51 = pSegments([
        { text: "5.1 ข้อมูลป้ายและสถานที่ตั้งป้าย", bold: true },
    ]);

    // บรรทัดข้อมูล (ไม่ใช้ตาราง)
    const L1 = line("ชื่อป้าย ( ถ้ามี )", s(s2.signName), 36, 2);
    const L2 = pairLine("ตั้งอยู่เลขที่", s(s2.addrNo), "ตรอก/ซอย", s(s2.addrAlley), "ถนน", s(s2.addrRoad), 2);
    const L3 = pairLine("ตำบล/แขวง", s(s2.subDistrict), "อำเภอ/เขต", s(s2.district), "จังหวัด", s(s2.province), 2);
    const L4 = pairLine("รหัสไปรษณีย์", s(s2.zip), "โทรศัพท์", s(s2.tel), "โทรสาร", s(s2.fax), 2);

    // ใบอนุญาต
    const permit = pnChildren([
        new TextRun({ text: "ได้รับใบอนุญาตก่อสร้างจากเจ้าพนักงานท้องถิ่น เมื่อวันที่ ", font: FONT_TH, size: SIZE_15PT }),
        new TextRun({ text: s(s2.permitDay) + " ", font: FONT_TH, size: SIZE_15PT }),
        new TextRun({ text: s(s2.permitMonth) + " ", font: FONT_TH, size: SIZE_15PT }),
        new TextRun({ text: s(s2.permitYear), font: FONT_TH, size: SIZE_15PT }),
    ], 0);

    // กล่องติ๊ก (disabled)
    const C1 = checkboxLine(!!s2.hasOriginalPlan, "มีแบบแปลนเดิม", 1);
    const C2 = checkboxLine(
        !!s2.noOriginalPlan,
        "ไม่มีแบบแปลนเดิม (กรณีที่ไม่มีแบบ/แผนรายละเอียดจากการก่อสร้าง ให้บันทึกแบบเส้นสำหรับใช้ในการตรวจสอบป้ายและอุปกรณ์ประกอบของป้ายให้กับเจ้าของป้าย)",
        1
    );
    const C3 = checkboxLine(!!s2.noPermitInfo, "ไม่มีข้อมูลการได้รับใบอนุญาตก่อสร้างจากเจ้าพนักงานท้องถิ่น", 1);
    const C4 = checkboxLine(!!s2.noOld, `อายุของป้าย ${s2.noOld && s2.signAge ? s2.signAge : ""} ปี`, 1);

    const PAGEBREAK = new Paragraph({ pageBreakBefore: true });
    // บรรทัด "วัน/เดือน/ปี ที่ตรวจสอบ ... บันทึกโดย ..."  ใช้ pn( ,1)
    const inspectDate = [s(s2.inspectDay2), s(s2.inspectMonth2), s(s2.inspectYear2)].filter(Boolean).join(" ");
    const Inspect = pn(`วัน/เดือน/ปี ที่ตรวจสอบ วันที่ ${inspectDate} บันทึกโดย ${s(s2.recorder2)}`, 1);

    // หัวข้อแผนที่ (จัดกลาง)
    const Hmap = headingImg(
        "แผนที่แสดงตำแหน่งที่ตั้งของป้ายโดยสังเขป",
        true,
        "D1D1D1" // สีพื้นหลังเทาอ่อน (ปรับเป็นสีที่ต้องการได้)
    );

    // ===== ขนาดรูปมาตรฐาน (เท่ากันทั้ง 2 รูป) =====
    const REQ_W_IN = 6.15;
    const REQ_H_IN = 3.48;
    const contentWidthIn = (PAGE.widthTwips - PAGE.margin.left - PAGE.margin.right) / 1440;
    const TARGET_W_IN = Math.min(REQ_W_IN, contentWidthIn);
    const TARGET_H_IN = REQ_H_IN * (TARGET_W_IN / REQ_W_IN);
    const W_PX = Math.round(TARGET_W_IN * (typeof PX_PER_INCH !== "undefined" ? PX_PER_INCH : 96));
    const H_PX = Math.round(TARGET_H_IN * (typeof PX_PER_INCH !== "undefined" ? PX_PER_INCH : 96));

    // รูปแผนที่ (จัดกลาง) — จาก s2.mapSketch (URL หรือ data URL)
    let MapImg: Paragraph[] = [];
    if (s2.mapSketch) {
        try {
            const bytes = await loadAsPngBytes(s2.mapSketch);
            MapImg = [
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 160, after: 0 },
                    children: [new ImageRun({ data: bytes, type: "png", transformation: { width: W_PX, height: H_PX } })],
                }),
            ];
        } catch { }
    }

    const BR1 = new Paragraph({ spacing: { before: 240, after: 0 } }); // 1 บรรทัด ~ 12pt

    const inspect3Line = pn(
        `วัน/เดือน/ปี ที่ตรวจสอบ วันที่ ${s(s2.inspectDay3)} ${s(s2.inspectMonth3)} ${s(s2.inspectYear3)} บันทึกโดย ${s(s2.recorder3)}`,
        1
    );

    // 2.4 หัวข้อ "รูปแบบและขนาดของแผ่นป้าย / สิ่งที่สร้างขึ้น (สเก็ตช์โดยสังเขป)"
    const hShape = headingImg(
        "รูปแบบและขนาดของแผ่นป้าย และสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้ายโดยสังเขป",
        true,
        "D1D1D1"
    );

    // 2.5 รูปสเก็ตช์ (shapeSketch) — จัดกึ่งกลาง, กว้างไม่เกินพื้นที่เนื้อหา, รักษาอัตราส่วน
    let ShapeImg: Paragraph[] = [];
    if (s2.shapeSketch) {
        try {
            const bytes = await loadAsPngBytes(s2.shapeSketch);
            ShapeImg = [
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 160, after: 0 },
                    children: [new ImageRun({ data: bytes, type: "png", transformation: { width: W_PX, height: H_PX } })],
                }),
            ];
        } catch { }
    }

    const photosSection = await buildPhotosSection(s2);

    const h2_52 = pSegments([
        { text: "5.2 ประเภทของป้าย", bold: true },
    ]);

    const T1 = checkboxLine(!!s2.typeGround, "ป้ายที่ติดตั้งบนพื้นดิน", 2);
    const T2 = checkboxLine(!!s2.typeRooftop, "ป้ายบนดาดฟ้าอาคาร", 2);
    const T3 = checkboxLine(!!s2.typeOnRoof, "ป้ายบนหลังคา", 2);
    const T4 = checkboxLine(!!s2.typeOnBuilding, "ป้ายบนส่วนหนึ่งส่วนใดของอาคาร", 2);
    const T5 = checkboxLine(!!s2.typeOtherChecked, `${s2.typeOtherChecked && s2.typeOther ? s2.typeOther : "อื่นๆ (โปรดระบุ)"}`, 2);

    const h2_53 = pSegments([{ text: "5.3 ชื่อเจ้าของหรือผู้ครอบครองป้าย และผู้ออกแบบด้านวิศวกรรมโครงสร้าง", bold: true }]);

    const des = pSegments([{ text: `5.3.1 ชื่อผลิตภัณฑ์โฆษณาหรือข้อความในป้าย ${s2.productText}`, bold: true }]);
    const des1 = pSegments([{ text: "5.3.2 เจ้าของหรือผู้ครอบครองป้าย", bold: true }]);

    const des1L1 = line("ชื่อ", s(s2.ownerName), 36, 3);
    const des1L2 = pairLine("สถานที่ติดต่อเลขที่", s(s2.ownerNo), "หมู่ที่", s(s2.ownerMoo), "ตรอก/ซอย", s(s2.ownerAlley), 3);
    const des1L3 = pairLine("ถนน", s(s2.ownerRoad), "ตำบล/แขวง", s(s2.ownerSub), "อำเภอ/เขต", s(s2.ownerDist), 3);
    const des1L4 = pairLine("จังหวัด", s(s2.ownerProv), "รหัสไปรษณีย์", s(s2.ownerZip), "โทรศัพท์", s(s2.ownerTel), 3);
    const des1L5 = pairLine("โทรสาร", s(s2.ownerFax), "อีเมล์", s(s2.ownerEmail), "", "", 3);

    const des2 = pSegments([{ text: "5.3.3 ผู้ออกแบบด้านวิศวกรรมโครงสร้าง", bold: true }]);
    const des2L1 = pairLine("ชื่อ", s(s2.designerName), "ใบอนุญาตทะเบียนเลขที่", s(s2.designerLicense), "", "", 3);

    const box53 = boxWithHeader(
        "ป้ายบนหลังคา",
        [des, GAP, des1, des1L1, des1L2, des1L3, des1L4, des1L5, GAP, des2, des2L1],
        {
            headerFill: "CCCCCC",
            checkbox: true,
            checked: !!s2.typeOnRoof, // ถ้าอยากให้ติ๊กตามข้อมูล; หรือใส่ false/true ตายตัวก็ได้
        }
    );

    const h2_54 = pSegments([
        { text: "5.4 ประเภทของวัสดุและรายละเอียดของแผ่นป้าย", bold: true },
        { text: " (สามารถระบุมากกว่า 1 ข้อได้)" },
    ]);
    const D1 = pSegments([{ text: "5.4.1 ประเภทวัสดุของสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย", bold: true }], 2);
    const D1T1 = checkboxLine(!!s2.matSteel, "เหล็กโครงสร้างรูปพรรณ", 3);
    const D1T2 = checkboxLine(!!s2.matWood, "ไม้", 3);
    const D1T3 = checkboxLine(!!s2.matStainless, "สเตนเลส", 3);
    const D1T4 = checkboxLine(!!s2.matRCC, "คอนกรีตเสริมเหล็ก", 3);
    const D1T5 = checkboxLine(!!s2.matOtherChecked, `${s2.matOtherChecked && s2.matOther ? s2.matOther : "อื่นๆ (โปรดระบุ)"}`, 3);

    const D2 = pSegments([
        { text: "5.4.2 รายละเอียดของแผ่นป้าย", bold: true },
    ], 2);
    const D2T1 = checkboxLine(!!s2.chkMat, `วัสดุของป้าย ${s2.chkMat && s2.panelMaterial ? s2.panelMaterial : "(โปรดระบุ)"}`, 3);
    const D2T2 = checkboxLine(!!s2.chkFaces, `จำนวนด้านที่ติดป้าย ป้าย ${s2.chkFaces && s2.panelFaces ? s2.panelFaces : "(โปรดระบุจำนวนด้าน)"} ด้าน`, 3);
    const D2T3 = checkboxLine(!!s2.chkOpen, "การเจาะช่องเปิดในป้าย", 3);
    const D2T4 = new Paragraph({
        spacing: { before: 80, after: 0, line: 240 },
        indent: { left: 4 * TAB },
        children: [
            new TextRun({ text: (s2.chkOpen && s2.panelOpenings === "มี") ? "☑ " : "☐ ", font: FONT_TH, size: SIZE_15PT }),
            new TextRun({ text: "มี", font: FONT_TH, size: SIZE_15PT }),
            new TextRun({ text: "    " }), // ช่องไฟเล็กน้อย
            new TextRun({ text: (s2.chkOpen && s2.panelOpenings === "ไม่มี") ? "☑ " : "☐ ", font: FONT_TH, size: SIZE_15PT }),
            new TextRun({ text: "ไม่มี", font: FONT_TH, size: SIZE_15PT }),
        ],
    });
    const D2T5 = checkboxLine(!!s2.chkOther, `${s2.chkOther && s2.panelOther ? s2.panelOther : "อื่นๆ (โปรดระบุ)"}`, 3);

    return [
        h2, intro, h2_51, L1, L2, L3, L4, permit, C1, C2, C3, C4,
        PAGEBREAK,
        Inspect, Hmap, ...MapImg, BR1, inspect3Line, hShape, ...ShapeImg, ...photosSection,
        PAGEBREAK,
        h2_52, T1, T2, T3, T4, T5, GAP,
        h2_53, GAP, box53,
        PAGEBREAK,
        h2_54, D1, D1T1, D1T2, D1T3, D1T4, D1T5, D2, D2T1, D2T2, D2T3, D2T4, D2T5
    ];
}

function buildS3_Table1(section1: Record<string, SectionThreeRow> | undefined) {
    const rows: TableRow[] = [];

    // ===== สัดส่วนคอลัมน์ (เปอร์เซ็นต์) =====
    const PCT = { IDX: 5, ITEM: 40, FREQ_TOTAL: 25, NOTE: 30 } as const;
    const FREQ_SUB_PCT = PCT.FREQ_TOTAL / FREQ_DEF.length; // = 5%

    // ===== Header แถวบน =====
    rows.push(
        new TableRow({
            // เดิม: height: { value: 520, rule: HeightRule.ATLEAST },
            height: { value: 400, rule: HeightRule.ATLEAST }, // ← ขยับเส้นลง (ลอง 700–900 ตามชอบ)
            cantSplit: true,
            children: [
                thCell("ลำดับ", 5, { rowSpan: 2 }, TextDirection.BOTTOM_TO_TOP_LEFT_TO_RIGHT),
                thCell("รายการตรวจบำรุงรักษา", 40, { rowSpan: 2 }),
                thCell("ความถี่ในการตรวจสอบ", 25, { columnSpan: FREQ_DEF.length }),
                thCell("หมายเหตุ", 30, { rowSpan: 2 }),
            ],
        })
    );

    // ===== Header แถวล่าง (ชื่อคอลัมน์ความถี่ - แนวตั้ง) =====
    rows.push(
        new TableRow({
            height: { value: 1000, rule: HeightRule.ATLEAST },
            cantSplit: true,
            children: FREQ_DEF.map((f) =>
                thCell(
                    f.label.replace(/\s+/g, "\u00A0"),
                    25 / FREQ_DEF.length,
                    undefined,
                    TextDirection.BOTTOM_TO_TOP_LEFT_TO_RIGHT
                )
            ),
        })
    );

    // ===== แถวข้อมูล =====
    S1_ROWS.forEach((label, idx) => {
        const id = `s1-${idx + 1}`;
        const data = section1?.[id] || {};
        const freqKey = data.freq as FreqKey | undefined;

        rows.push(
            new TableRow({
                height: { value: 160, rule: HeightRule.ATLEAST }, // กระชับลง
                cantSplit: true,
                children: [
                    tdCellCompact(cellPCompact(String(idx + 1), { align: AlignmentType.CENTER }), PCT.IDX),
                    tdCellCompact(cellPCompact(label), PCT.ITEM),
                    ...FREQ_DEF.map((f) => tickCellCompact(freqKey === f.key, FREQ_SUB_PCT)),
                    tdCellCompact(
                        data.note && data.note.trim() !== "" ? cellPCompact(data.note) : blankNote(),
                        PCT.NOTE
                    ),
                ],
            })
        );
    });

    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE }, // ตาราง 100%
        layout: "fixed",
        borders: {
            top: { style: BorderStyle.SINGLE, size: 10, color: "000000" },
            bottom: { style: BorderStyle.SINGLE, size: 10, color: "000000" },
            left: { style: BorderStyle.SINGLE, size: 10, color: "000000" },
            right: { style: BorderStyle.SINGLE, size: 10, color: "000000" },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
            insideVertical: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
        },
        rows,
    });
}

type RowItem = string | { label: string; inlineInput?: boolean };

const S2_GROUPS: { title: string; rows: RowItem[] }[] = [
    {
        title: "1. ระบบไฟฟ้าแสงสว่าง",
        rows: [
            "สภาพสายไฟฟ้า",
            "สภาพท่อร้อยสาย รางเดินสาย และรางเคเบิล",
            "สภาพเครื่องป้องกันกระแสเกิน",
            "สภาพเครื่องตัดไฟรั่ว",
            "การต่อลงดินของบริภัณฑ์ ตัวนำต่อลงดิน และความต่อเนื่องลงดินของท่อร้อยสาย รางเดินสาย รางเคเบิล",
        ],
    },
    {
        title: "2. ระบบไฟฟ้าควบคุม/อาณัติสัญญาณ (ถ้ามี)",
        rows: [
            "ตรวจสอบระบบตัวนำล่อฟ้า ตัวนำต่อลงดิน",
            "ตรวจสอบระบบรากสายดิน",
            "ตรวจสอบจุดต่อประสานศักย์",
        ],
    },
    {
        title: "3. ระบบอุปกรณ์ประกอบอื่น ๆ (ถ้ามี)",
        rows: [
            "สภาพบันไดขึ้นลง",
            "สภาพราวจับ และราวกันตก",
            { label: "อุปกรณ์ประกอบอื่นตามที่เห็นสมควร (ระบุ)", inlineInput: true },
        ],
    },
];

// paragraph แบบกระชับ
const cellPCompact = (
    text: string,
    opts?: { bold?: boolean; align?: DocxAlign }
) =>
    new Paragraph({
        alignment: opts?.align,
        spacing: { before: 10, after: 10, line: 200 }, // << บีบระยะ
        children: [new TextRun({ text, font: FONT_TH, size: SIZE_15PT, bold: !!opts?.bold })],
    });

// td แบบกระชับ (ลด margin บน/ล่าง)
const tdCellCompact = (children: Paragraph[] | Paragraph, wPct?: number) =>
    new TableCell({
        width: wPct ? { size: wPct, type: WidthType.PERCENTAGE } : undefined,
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 20, bottom: 20, left: 100, right: 100 }, // << ลดจากเดิมเยอะ
        children: Array.isArray(children) ? children : [children],
    });

// ช่อง ✓ แบบกระชับ
const tickCellCompact = (checked: boolean, wPct: number) =>
    tdCellCompact(
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 0 }, // << ไม่มีช่องไฟเกิน
            children: [new TextRun({ text: checked ? "✓" : "", font: FONT_TH, size: SIZE_15PT, bold: true })],
        }),
        wPct
    );

// เส้นปะกระชับ
const blankNote = () =>
    new Paragraph({
        spacing: { before: 60, after: 60 },
        children: [new TextRun({ text: " ", font: FONT_TH, size: SIZE_15PT })],
    });

function buildS3_Table2(section2: Record<string, SectionThreeRow> | undefined) {
    const rows: TableRow[] = [];

    // สัดส่วนคอลัมน์ (%)
    const PCT = { IDX: 5, ITEM: 40, FREQ_TOTAL: 25, NOTE: 30 } as const;
    const FREQ_SUB_PCT = PCT.FREQ_TOTAL / FREQ_DEF.length; // = 5%
    const TOTAL_SPAN = 1 /*IDX*/ + 1 /*ITEM*/ + FREQ_DEF.length /*FREQ*/ + 1 /*NOTE*/; // = 8 คอลัมน์

    // ===== Header แถวบน (ลดความสูง) =====
    rows.push(
        new TableRow({
            height: { value: 300, rule: HeightRule.ATLEAST },
            cantSplit: true,
            children: [
                thCell("ลำดับ", PCT.IDX, { rowSpan: 2 }, TextDirection.BOTTOM_TO_TOP_LEFT_TO_RIGHT),
                thCell("รายการตรวจบำรุงรักษา", PCT.ITEM, { rowSpan: 2 }),
                thCell("ความถี่ในการตรวจสอบ", PCT.FREQ_TOTAL, { columnSpan: FREQ_DEF.length }),
                thCell("หมายเหตุ", PCT.NOTE, { rowSpan: 2 }),
            ],
        })
    );

    // ===== Header แถวล่าง (ความถี่แนวตั้ง, ไม่ตัดบรรทัด) =====
    rows.push(
        new TableRow({
            height: { value: 1000, rule: HeightRule.ATLEAST },
            cantSplit: true,
            children: FREQ_DEF.map((f) =>
                thCell(
                    f.label.replace(/\s+/g, "\u00A0"),          // keep space but no wrap
                    FREQ_SUB_PCT,
                    undefined,
                    TextDirection.BOTTOM_TO_TOP_LEFT_TO_RIGHT   // หมุน 90°
                )
            ),
        })
    );

    // ===== เนื้อหา =====
    S2_GROUPS.forEach((group, gi) => {
        const displayTitle = group.title.replace(/^\d+\.\s*/, "");

        // --- แถวหัวกลุ่ม (merge cell ยาว + พื้นหลังอ่อน) ---
        rows.push(
            new TableRow({
                height: { value: 200, rule: HeightRule.ATLEAST },  // กระชับ
                cantSplit: true,
                children: [
                    new TableCell({
                        columnSpan: TOTAL_SPAN,                         // << รวมทั้งแถว (ไม่มีเส้นคั่นตรงที่ขีดสีแดง)
                        verticalAlign: VerticalAlign.CENTER,
                        shading: { fill: "F3F3F3" },                   // << พื้นหลังอ่อน
                        margins: { top: 60, bottom: 60, left: 120, right: 120 },
                        children: [cellP(`${gi + 1}. ${displayTitle}`, { bold: true })],
                    }),
                ],
            })
        );

        // --- แถวรายการย่อย ---
        group.rows.forEach((r, ri) => {
            const label = typeof r === "string" ? r : r.label;
            const id = `s2-${group.title}-${ri + 1}`;
            const data = section2?.[id] || {};
            const freqKey = data.freq as FreqKey | undefined;

            const itemParas: Paragraph[] = [cellP(label)];
            if (typeof r !== "string" && r.inlineInput) {
                const extra = (data as any).extra?.toString().trim() || "";
                itemParas.push(
                    extra
                        ? cellP(extra)
                        : new Paragraph({
                            children: [new TextRun({ text: " ", font: FONT_TH, size: SIZE_15PT })],
                            border: { bottom: { style: BorderStyle.DASHED, size: 8, color: "000000" } },
                            spacing: { before: 30 },
                        })
                );
            }

            rows.push(
                new TableRow({
                    height: { value: 200, rule: HeightRule.ATLEAST },  // << เดิม 200 ลดลงอีก
                    children: [
                        tdCellCompact(cellPCompact(""), PCT.IDX),         // คอลัมน์ลำดับ (แถวลูก) เว้นว่าง
                        tdCellCompact([cellPCompact(label), ...(typeof r !== "string" && r.inlineInput
                            ? (() => {
                                const extra = (data as any).extra?.toString().trim() || "";
                                return extra
                                    ? [cellPCompact(extra)]
                                    : [new Paragraph({
                                        spacing: { before: 6, after: 0 },
                                        children: [new TextRun({ text: " ", font: FONT_TH, size: SIZE_15PT })],
                                        border: { bottom: { style: BorderStyle.DASHED, size: 8, color: "000000" } },
                                    })];
                            })()
                            : [])], PCT.ITEM),
                        ...FREQ_DEF.map((f) => tickCellCompact(freqKey === f.key, FREQ_SUB_PCT)),
                        tdCellCompact(
                            data.note && String(data.note).trim() !== "" ? cellPCompact(String(data.note)) : blankNote(),
                            PCT.NOTE
                        ),
                    ],
                })
            );
        });
    });

    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        layout: "fixed",
        borders: {
            top: { style: BorderStyle.SINGLE, size: 10, color: "000000" },
            bottom: { style: BorderStyle.SINGLE, size: 10, color: "000000" },
            left: { style: BorderStyle.SINGLE, size: 10, color: "000000" },
            right: { style: BorderStyle.SINGLE, size: 10, color: "000000" },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
            insideVertical: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
        },
        rows,
    });
}

// ย่อหน้าข้อความทั่วไป
const cellP = (text: string, opts?: { bold?: boolean; align?: DocxAlign }) =>
    new Paragraph({
        alignment: opts?.align,
        spacing: { before: 60, after: 60, line: 260 },
        children: [new TextRun({ text, font: FONT_TH, size: SIZE_15PT, bold: !!opts?.bold })],
    });

// เซลล์หัวตาราง (รองรับกำหนดความกว้างเป็นเปอร์เซ็นต์)
const thCell = (
    text: string,
    wPct?: number,
    extra?: Partial<ConstructorParameters<typeof TableCell>[0]>,
    textDirection?: DocxText
) =>
    new TableCell({
        width: wPct ? { size: wPct, type: WidthType.PERCENTAGE } : undefined,
        verticalAlign: VerticalAlign.CENTER,
        textDirection,
        shading: { fill: "ECECEC" },
        margins: { top: 60, bottom: 60, left: 60, right: 60 },
        children: [
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 40, after: 40, line: 220 },
                keepLines: true,
                children: [new TextRun({ text, font: FONT_TH, size: SIZE_15PT, bold: true })],
            }),
        ],
        ...extra,
    });

// ความถี่
const FREQ_DEF: { key: FreqKey; label: string }[] = [
    { key: "2w", label: "2 สัปดาห์" },
    { key: "1m", label: "1 เดือน" },
    { key: "4m", label: "4 เดือน" },
    { key: "6m", label: "6 เดือน" },
    { key: "1y", label: "1 ปี" },
];

// รายการตรวจ (ตามเดิม)
const S1_ROWS = [
    "การต่อเติม ดัดแปลง ปรับปรุงขนาดของป้าย",
    "การเปลี่ยนแปลงน้ำหนักของแผ่นป้าย",
    "การเปลี่ยนแปลงสภาพการใช้งานของป้าย",
    "การเปลี่ยนแปลงวัสดุของป้าย",
    "การชำรุดสึกหรอของป้าย",
    "การวิบัติของสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย",
    "การทรุดตัวของฐานรากของสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย (กรณีป้ายที่ตั้งบนพื้นดิน)",
    "การเชื่อมยึดระหว่างแผ่นป้ายกับสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย  การเชื่อมยึดระหว่างชิ้นส่วนต่าง ๆ ของสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้ายและการเชื่อมยึดระหว่าง  สิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้ายกับฐานรากหรืออาคาร",
];

async function buildSectionThree(formData: FormDataLite) {
    const s3 = formData.sectionThree ?? {};
    const PAGEBREAK = new Paragraph({ pageBreakBefore: true });
    const h3 = headingBoxedCompact(
        3,
        "ช่วงเวลาความถี่ในการตรวจสอบประจำปี\nของผู้ตรวจสอบอาคาร และแนวทางการตรวจสอบตามแผน"
    );
    const h3_1 = pn("1. ความถี่ในการตรวจบำรุงรักษาป้ายด้านความมั่นคงแข็งแรงของป้าย", 1);
    const h3_2 = pn("2. ความถี่ในการตรวจบำรุงรักษาระบบอุปกรณ์ประกอบต่าง ๆ ของป้าย", 1);

    const table1 = buildS3_Table1(s3.section1);
    const table2 = buildS3_Table2(s3.section2);

    return [h3, h3_1, table1, PAGEBREAK, h3_2, table2];
}
type VisitVal = "ok" | "ng";
type T1Row = string | { label: string; inlineInput?: boolean };

const S4_T1_ROWS: T1Row[] = [
    "การต่อเติม ดัดแปลง ปรับปรุงบำรุงรักษา",
    "การเปลี่ยนแปลงน้ำหนักของแผ่นป้าย",
    "การเปลี่ยนแปลงสภาพการใช้งานของป้าย",
    "การเปลี่ยนแปลงวัสดุของป้าย",
    "การชำรุดสึกหรอของป้าย",
    "การบัง/ยึดของสิ่งที่สร้างขึ้นหรือติดตั้งป้ายและจุดยึดเหนี่ยว",
    { label: "การซ่อม/ดัดแปลงที่มีผลต่อความมั่นคง (ระบุ)", inlineInput: true },
];

const ROUNDS = [{ key: "v1", label: "ครั้งที่ 1" }] as const;
const PCT4 = { IDX: 5, ITEM: 55, ROUND_TOTAL: 20, NOTE: 20 } as const;
const SUB_PCT = PCT4.ROUND_TOTAL / 2;

function buildS4_Table1(
    table1: Record<string, { visits?: Record<string, VisitVal>; note?: string; extra?: string }> | undefined
) {
    const rows: TableRow[] = [];

    // Header แถวบน
    rows.push(
        new TableRow({
            height: { value: 260, rule: HeightRule.ATLEAST },
            cantSplit: true,
            children: [
                thCell("ลำดับ", PCT4.IDX, { rowSpan: 2 }, TextDirection.BOTTOM_TO_TOP_LEFT_TO_RIGHT),
                thCell("รายการตรวจสอบ", PCT4.ITEM, { rowSpan: 2 }),
                ...ROUNDS.map((r) => thCell(r.label, PCT4.ROUND_TOTAL, { columnSpan: 2 })), // 2 ช่องย่อย
                thCell("หมายเหตุ", PCT4.NOTE, { rowSpan: 2 }),
            ],
        })
    );

    // Header แถวล่าง — ใช้ได้ / ใช้ไม่ได้
    rows.push(
        new TableRow({
            height: { value: 220, rule: HeightRule.ATLEAST },
            cantSplit: true,
            children: ROUNDS.flatMap(() => [
                thCell("ใช้ได้", SUB_PCT),
                thCell("ใช้ไม่ได้", SUB_PCT),
            ]),
        })
    );

    // เนื้อหา
    S4_T1_ROWS.forEach((row, idx) => {
        const id = `t1-${idx + 1}`;
        const data = table1?.[id] || {};
        const v1 = (data.visits?.["v1"] as VisitVal | undefined) ?? undefined;

        // รายการ (รองรับ inlineInput บรรทัดถัดไป)
        const label = typeof row === "string" ? row : row.label;
        const paras: Paragraph[] = [cellPCompact(label)];
        if (typeof row !== "string" && row.inlineInput) {
            const extra = (data.extra ?? "").toString().trim();
            paras.push(extra ? cellPCompact(extra) : blankNote());
        }

        rows.push(
            new TableRow({
                height: { value: 160, rule: HeightRule.ATLEAST },
                cantSplit: true,
                children: [
                    tdCellCompact(cellPCompact(String(idx + 1), { align: AlignmentType.CENTER }), PCT4.IDX),
                    tdCellCompact(paras, PCT4.ITEM),
                    // ครั้งที่ 1: ✓ เฉพาะช่องที่ตรงกับค่า
                    tdCellCompact(
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [new TextRun({ text: v1 === "ok" ? "✓" : "", font: FONT_TH, size: SIZE_15PT, bold: true })],
                        }),
                        SUB_PCT
                    ),
                    tdCellCompact(
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [new TextRun({ text: v1 === "ng" ? "✓" : "", font: FONT_TH, size: SIZE_15PT, bold: true })],
                        }),
                        SUB_PCT
                    ),
                    tdCellCompact(
                        data.note && String(data.note).trim() !== "" ? cellPCompact(String(data.note)) : blankNote(),
                        PCT4.NOTE
                    ),
                ],
            })
        );
    });

    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        layout: "fixed",
        borders: {
            top: { style: BorderStyle.SINGLE, size: 10, color: "000000" },
            bottom: { style: BorderStyle.SINGLE, size: 10, color: "000000" },
            left: { style: BorderStyle.SINGLE, size: 10, color: "000000" },
            right: { style: BorderStyle.SINGLE, size: 10, color: "000000" },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
            insideVertical: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
        },
        rows,
    });
}

type T2Row = string | { label: string; inlineInput?: boolean };
const S4_T2_GROUPS: { title: string; rows: T2Row[] }[] = [
    {
        title: "1. ระบบไฟฟ้าแสงสว่าง",
        rows: [
            "สภาพหลอดไฟฟ้า",
            "ตู้คอนโทรล/สายไฟ/อุปกรณ์",
            "สลักกุญแจ/บันทึกการเปิดตู้",
            "อุปกรณ์ป้องกัน (RCD/MCCB ฯๆ)",
            "สายดิน/จุดต่อกราวด์",
            "งานเดินสาย/การจัดยึด",
            "ระบบตั้งเวลา/เปิด–ปิดอัตโนมัติ",
            { label: "อื่น ๆ (โปรดระบุ)", inlineInput: true },
        ],
    },
    {
        title: "2. ระบบไฟฟ้าควบคุม/อาณัติสัญญาณ (ถ้ามี)",
        rows: ["หน่วยควบคุม/จอแสดงผล", "เซนเซอร์/ระบบตรวจจับ", "ระบบป้องกันไฟกระชาก"],
    },
    {
        title: "3. ระบบอุปกรณ์ประกอบอื่น ๆ (ถ้ามี)",
        rows: ["อุปกรณ์ที่สมบูรณ์", "อุปกรณ์กันตก/ราวจับ", { label: "อุปกรณ์ประกอบอื่นที่เห็นสมควร (ระบุ)", inlineInput: true }],
    },
];

const S4_ROUNDS = [{ key: "v1", label: "ครั้งที่ 1" }] as const;

// ค่าคอลัมน์ (%)
const ROUND_SUB_PCT = PCT4.ROUND_TOTAL / 2;
const TOTAL_SPAN_S4T2 = 1 + 1 + S4_ROUNDS.length * 2 + 1;

function buildS4_Table2(
    table2: Record<string, { visits?: Record<string, VisitVal>; note?: string; extra?: string }> | undefined
) {
    const rows: TableRow[] = [];

    // ===== Header แถวบน =====
    rows.push(
        new TableRow({
            height: { value: 260, rule: HeightRule.ATLEAST },
            cantSplit: true,
            children: [
                thCell("ลำดับ", PCT4.IDX, { rowSpan: 2 }, TextDirection.BOTTOM_TO_TOP_LEFT_TO_RIGHT),
                thCell("รายการตรวจสอบ", PCT4.ITEM, { rowSpan: 2 }),
                ...S4_ROUNDS.map((r) => thCell(r.label, PCT4.ROUND_TOTAL, { columnSpan: 2 })),
                thCell("หมายเหตุ", PCT4.NOTE, { rowSpan: 2 }),
            ],
        })
    );

    // ===== Header แถวล่าง (ใช้ได้/ใช้ไม่ได้) =====
    rows.push(
        new TableRow({
            height: { value: 220, rule: HeightRule.ATLEAST },
            cantSplit: true,
            children: S4_ROUNDS.flatMap(() => [thCell("ใช้ได้", ROUND_SUB_PCT), thCell("ใช้ไม่ได้", ROUND_SUB_PCT)]),
        })
    );

    // ===== เนื้อหาเป็นกลุ่ม =====
    S4_T2_GROUPS.forEach((group, gi) => {
        // หัวกลุ่ม: รวมทั้งแถว + พื้นหลังอ่อน
        rows.push(
            new TableRow({
                height: { value: 240, rule: HeightRule.ATLEAST },
                cantSplit: true,
                children: [
                    new TableCell({
                        columnSpan: TOTAL_SPAN_S4T2,
                        verticalAlign: VerticalAlign.CENTER,
                        shading: { fill: "F3F3F3" },
                        margins: { top: 60, bottom: 60, left: 120, right: 120 },
                        children: [cellPCompact(`${group.title}`, { bold: true })],
                    }),
                ],
            })
        );

        // แถวรายการย่อย (เลขลำดับรีเซ็ตภายในกลุ่ม)
        group.rows.forEach((r, ri) => {
            const label = typeof r === "string" ? r : r.label;
            const id = `t2-${gi + 1}-${ri + 1}`; // t2-{group}-{row}
            const data = table2?.[id] || {};
            const v1 = (data.visits?.["v1"] as VisitVal | undefined) ?? undefined;

            const paras: Paragraph[] = [cellPCompact(label)];
            if (typeof r !== "string" && r.inlineInput) {
                const extra = (data.extra ?? "").toString().trim();
                paras.push(extra ? cellPCompact(extra) : blankNote());
            }

            rows.push(
                new TableRow({
                    height: { value: 160, rule: HeightRule.ATLEAST },
                    cantSplit: true,
                    children: [
                        tdCellCompact(cellPCompact(String(ri + 1), { align: AlignmentType.CENTER }), PCT4.IDX),
                        tdCellCompact(paras, PCT4.ITEM),
                        // ครั้งที่ 1: ✓ ตำแหน่งเดียว
                        tdCellCompact(
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                children: [new TextRun({ text: v1 === "ok" ? "✓" : "", font: FONT_TH, size: SIZE_15PT, bold: true })],
                            }),
                            ROUND_SUB_PCT
                        ),
                        tdCellCompact(
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                children: [new TextRun({ text: v1 === "ng" ? "✓" : "", font: FONT_TH, size: SIZE_15PT, bold: true })],
                            }),
                            ROUND_SUB_PCT
                        ),
                        tdCellCompact(
                            data.note && String(data.note).trim() !== "" ? cellPCompact(String(data.note)) : blankNote(),
                            PCT4.NOTE
                        ),
                    ],
                })
            );
        });
    });

    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        layout: "fixed",
        borders: {
            top: { style: BorderStyle.SINGLE, size: 10, color: "000000" },
            bottom: { style: BorderStyle.SINGLE, size: 10, color: "000000" },
            left: { style: BorderStyle.SINGLE, size: 10, color: "000000" },
            right: { style: BorderStyle.SINGLE, size: 10, color: "000000" },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
            insideVertical: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
        },
        rows,
    });
}

async function buildSectionFour(formData: FormDataLite) {
    const PAGEBREAK = new Paragraph({ pageBreakBefore: true });
    const h4 = headingBoxed(4, "ผลการตรวจสอบสภาพป้ายและอุปกรณ์ต่าง ๆ ของป้าย");
    const h4_1 = pn("ส่วนที่ 4 เป็นผลการตรวจสอบสภาพป้าย และอุปกรณ์ต่าง ๆ ของป้ายตามที่ตรวจสอบได้ด้วยสายตา", 2);
    const h4_1_1 = pn("หรือตรวจพร้อมกับใช้เครื่องมือวัดพื้นฐาน เช่นตลับเมตร เป็นต้น หรือเครื่องมือชนิดพกพาเท่านั้น จะไม่รวมถึง", 1);
    const h4_1_2 = pn("การทดสอบที่ใช่เครื่องมือพิเศษเฉพาะ", 1);
    const h4_2 = pn("การตรวจสอบป้ายและอุปกรณ์ประกอบต่าง ๆ ของป้าย ผู้ตรวจสอบจะต้องพิจารณาตามหลักเกณฑ์", 2);
    const h4_2_1 = pn("หรือมาตรฐานที่ได้กำหนดไว้ในกฎหมายว่าด้วยการควบคุมอาคาร หรือกฎหมายอื่นที่เกี่ยวข้อง ที่ใช้บังคับอยู่", 1);
    const h4_2_2 = pn("ในขณะที่มีการก่อสร้างป้ายนั้น และคำนึงถึงหลักเกณฑ์ หรือมาตรฐานความปลอดภัยของสถาบันทางราชการ", 1);
    const h4_2_3 = pn("สภาวิศวกร หรือสภาสถาปนิก โดยจะตรวจตามรายการที่กำหนดในส่วนนี้ประกอบกับรายละเอียดการตรวจสอบ", 1);
    const h4_2_4 = pn("บำรุงรักษาป้ายที่เจ้าของป้ายหรือผู้ดูแลป้ายได้ดำเนินการตรวจสอบไว้แล้วตามที่ผู้ตรวจสอบกำหนด", 1);
    const h4_3 = pn("ผู้ตรวจสอบป้ายประจำปีจะต้องตรวจสอบสภาพป้ายและระบบอุปกรณ์ประกอบต่าง ๆ ของป้าย", 2);
    const h4_3_1 = pn("แต่ละรายการตามความถี่ที่ผู้ตรวจสอบกำหนด จำนวนครั้งที่ตรวจสอบในแต่ละปีตามความถี่ในการตรวจสอบ", 1);
    const h4_3_2 = pn("คือ ตรวจสอบทุก ๆ 6 เดือน จำนวนครั้งที่ต้องตรวจสอบในแต่ละปีเท่ากับ 2 ครั้ง (รอบ 6 เดือน และ 12 เดือน)", 1);

    const h4_4 = pn("1. การตรวจสอบความมั่นคงแข็งแรงของป้าย", 1);
    const h4_5 = pn("2. การตรวจสอบบำรุงรักษาระบบและอุปกรณ์ประกอบต่าง ๆ ของป้าย", 1);
    const table1 = buildS4_Table1(formData.sectionFour?.table1);
    const table2 = buildS4_Table2(formData.sectionFour?.table2);

    const GAP = new Paragraph({ children: [new TextRun({ text: " " })] });

    return [
        h4, h4_1, h4_1_1, h4_1_2, h4_2, h4_2_1, h4_2_2, h4_2_3, h4_2_4, h4_3, h4_3_1, h4_3_2,
        GAP,
        h4_4, table1,
        PAGEBREAK,
        h4_5, table2
    ];
}

type S5Status = "ok" | "ng";
type S5Row = { status?: S5Status; fixed?: boolean; note?: string; extra?: string };
const S5_ITEMS: { key: keyof Record<string, S5Row>; label: string; inlineInput?: boolean }[] = [
    { key: "r1", label: "สิ่งที่สร้างขึ้นส่วนหนึ่งยึดหรือสัมผัสป้าย" },
    { key: "r2", label: "แผ่นป้าย" },
    { key: "r3", label: "ระบบไฟฟ้าแสงสว่าง" },
    { key: "r4", label: "ระบบไฟฟ้าควบคุม" },
    { key: "r5", label: "อุปกรณ์ประกอบอื่น ๆ" },
    { key: "r6", label: "อื่น ๆ", inlineInput: true },   // ระบุ
];
const PCT5 = { IDX: 5, ITEM: 50, OK: 5, NG: 5, FIXED: 5, NOTE: 30 } as const;
function buildS5_Table(rowsData: Record<string, S5Row>) {
    const rows: TableRow[] = [];

    // แถวหัวเรื่องรวมทั้งแถว
    rows.push(
        new TableRow({
            height: { value: 900, rule: HeightRule.ATLEAST }, // ↑ สูงขึ้น (ปรับเลขได้ 700–1200 ตามต้องการ)
            cantSplit: true,
            children: [
                new TableCell({
                    columnSpan: 6,
                    verticalAlign: VerticalAlign.CENTER,
                    shading: { fill: "D1D1D1" },                     // พื้นหลังเทา CCCCC C
                    margins: { top: 120, bottom: 120, left: 120, right: 120 },
                    children: [
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            spacing: { before: 40, after: 40 },
                            children: [
                                new TextRun({
                                    text: "สรุปผลการตรวจสอบป้ายและอุปกรณ์ประกอบต่าง ๆ ของป้าย",
                                    font: FONT_TH,
                                    size: SIZE_15PT,
                                    bold: true,
                                }),
                            ],
                        }),
                    ],
                }),
            ],
        })
    );

    // ===== Header (แนวตั้งทุกคอลัมน์ ยกเว้น รายการตรวจสอบ/หมายเหตุ) =====
    rows.push(
        new TableRow({
            height: { value: 1000, rule: HeightRule.ATLEAST },
            cantSplit: true,
            children: [
                thCell("ลำดับที่", PCT5.IDX, undefined, TextDirection.BOTTOM_TO_TOP_LEFT_TO_RIGHT),
                thCell("รายการตรวจสอบ", PCT5.ITEM),
                thCell("ใช้ได้", PCT5.OK, undefined, TextDirection.BOTTOM_TO_TOP_LEFT_TO_RIGHT),
                thCell("ใช้ไม่ได้", PCT5.NG, undefined, TextDirection.BOTTOM_TO_TOP_LEFT_TO_RIGHT),
                thCell("แก้ไขแล้ว", PCT5.FIXED, undefined, TextDirection.BOTTOM_TO_TOP_LEFT_TO_RIGHT),
                thCell("หมายเหตุ", PCT5.NOTE),
            ],
        })
    );

    // ===== เนื้อหา =====
    S5_ITEMS.forEach((it, i) => {
        const d = rowsData?.[it.key as string] || {};
        const ok = d.status === "ok";
        const ng = d.status === "ng";
        const fx = !!d.fixed;

        // inline “ระบุ” (มีค่าจะต่อท้ายบรรทัดเดียว, ไม่มีค่าใส่เส้นปะ)
        const extraText = it.inlineInput ? (d.extra ?? "").toString().trim() : "";
        const itemParas: Paragraph[] = [
            new Paragraph({
                spacing: { before: 10, after: 10, line: 200 },
                children: [
                    new TextRun({ text: it.label, font: FONT_TH, size: SIZE_15PT }),
                    ...(extraText ? [new TextRun({ text: "  " + extraText, font: FONT_TH, size: SIZE_15PT })] : []),
                ],
            }),
        ];
        if (it.inlineInput && !extraText) itemParas.push(blankNote());

        rows.push(
            new TableRow({
                height: { value: 160, rule: HeightRule.ATLEAST },
                cantSplit: true,
                children: [
                    tdCellCompact(cellPCompact(String(i + 1), { align: AlignmentType.CENTER }), PCT5.IDX),
                    tdCellCompact(itemParas, PCT5.ITEM),
                    tdCellCompact(
                        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: ok ? "✓" : "", font: FONT_TH, size: SIZE_15PT, bold: true })] }),
                        PCT5.OK
                    ),
                    tdCellCompact(
                        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: ng ? "✓" : "", font: FONT_TH, size: SIZE_15PT, bold: true })] }),
                        PCT5.NG
                    ),
                    tdCellCompact(
                        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: fx ? "✓" : "", font: FONT_TH, size: SIZE_15PT, bold: true })] }),
                        PCT5.FIXED
                    ),
                    tdCellCompact(
                        d.note && String(d.note).trim() !== "" ? cellPCompact(String(d.note)) : blankNote(),
                        PCT5.NOTE
                    ),
                ],
            })
        );
    });

    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        layout: "fixed",
        borders: {
            top: { style: BorderStyle.SINGLE, size: 10, color: "000000" },
            bottom: { style: BorderStyle.SINGLE, size: 10, color: "000000" },
            left: { style: BorderStyle.SINGLE, size: 10, color: "000000" },
            right: { style: BorderStyle.SINGLE, size: 10, color: "000000" },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
            insideVertical: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
        },
        rows,
    });
}

// ใช้งานใน Section 5
async function buildSectionFive(formData: FormDataLite) {
    const DOTS = "..................................................."; // ปรับความยาวตามที่ชอบ
    const NBSP = "\u00A0";
    const h5 = headingBoxed(5, "สรุปผลการตรวจสอบสภาพป้ายและอุปกรณ์ต่างๆ");
    const s5 = (formData.sectionFive ?? formData) as { rows?: Record<string, S5Row>; meta?: any };
    const table = buildS5_Table(s5.rows ?? {});
    const GAP = new Paragraph({ children: [new TextRun({ text: " " })] });

    // ---------- helpers เฉพาะส่วนนี้ ----------
    const t = (v?: string, dot = "……") => (v && String(v).trim() ? String(v) : dot);

    const signLine = (roleRight: string) => pn(`ลงชื่อ${DOTS}${roleRight}`, 4);

    // --- วงเล็บ: กว้างเท่ากับ DOTS (indent level 3) ---
    const signParenLine = (rightText?: string) => new Paragraph({
        spacing: { before: 0, after: 14, line: 200 },
        children: [
            // prefix กินพื้นที่เท่าบรรทัดจุด แต่ไม่แสดงผล
            new TextRun({ text: "ลงชื่อ", font: FONT_TH, size: SIZE_15PT, color: "FFFFFF" }),
            new TextRun({ text: DOTS, font: FONT_TH, size: SIZE_15PT, color: "FFFFFF" }),
            // วงเล็บกว้างเท่า DOTS
            new TextRun({ text: `(${NBSP.repeat(DOTS.length)} )`, font: FONT_TH, size: SIZE_15PT }),
            ...(rightText ? [new TextRun({ text: "  / " + rightText, font: FONT_TH, size: SIZE_15PT })] : []),
        ],
    });

    // ---------- meta ----------
    const m = s5.meta || {};
    const siteName = t(m.siteName);
    const roundNo = t(m.roundNo);
    const d = t(m.inspectDate?.d);
    const mm = t(m.inspectDate?.m);
    const y = t(m.inspectDate?.y);

    // สรุปความเห็น
    const h5_1 = heading("สรุปความเห็นของผู้ตรวจสอบอาคาร", false);
    const l1 = pn(`สรุปผลการตรวจสอบป้ายโฆษณา ${siteName} ซึ่งป้ายติดตั้งบนพื้นดินพบว่า ณ วันที่เข้า`, 1);
    const l2 = pn(`ตรวจสอบ รอบที่ ${roundNo} เมื่อวันที่ ${d} ${mm} ${y} ในส่วนของโครงสร้าง ความมั่นคงแข็งแรงของป้าย พร้อมอุปกรณ์`, 0);
    const l3 = pn("ประกอบป้ายอยู่ในสภาพมั่นคงแข็งแรงพร้อมใช้งานต่อไป และปลอดภัยต่อทรัพย์สิน", 0);

    // ------- เลขทะเบียนผู้ตรวจสอบ  -------
    const hInspector = pn("เลขทะเบียนผู้ตรวจสอบ", 1);

    const licNo = t(m.licenseNo, "…………/……");
    const issuer = t(m.issuer);
    const company = t(m.company);
    const address = t(m.address);
    const id = m.licIssue || {};
    const ex = m.licExpire || {};

    const line1 = pn(`ผู้ตรวจสอบประเภทนิติบุคคล ทะเบียนเลขที่ ${licNo} จาก ${issuer}`, 2);
    const line2 = pn(`โดยนาม ${company}`, 2);
    const line3 = pn(address, 2);
    const line4 = pn(`ออกให้ ณ วันที่  ${t(id.d)}  เดือน  ${t(id.m)}  พ.ศ.  ${t(id.y)}`, 2);
    const line5 = pn(`ใช้ได้ถึง วันที่  ${t(ex.d)}  เดือน  ${t(ex.m)}  พ.ศ.  ${t(ex.y)}`, 2);

    // return ทั้งหมด
    return [
        h5, GAP, table, GAP,
        h5_1, l1, l2, l3, GAP,

        // ลงชื่อเรียงลงมา
        signLine("เจ้าของอาคาร/ผู้จัดการนิติบุคคลอาคารชุด"),
        signParenLine("ผู้ครอบครองอาคาร/ผู้รับมอบหมาย"),
        signLine("ผู้ตรวจสอบอาคาร"),
        signParenLine(),
        hInspector, line1, line2, line3, line4, line5,
    ];
}

/* ---------------- Export main ---------------- */
export async function exportToDocx(formData: FormDataLite) {
    const header = await buildCompanyHeader({
        companyTh: "บริษัท ชินรัช โพรเทคเตอร์ จำกัด",
        companyEn: "Shinaracha Protector Co., Ltd.",
        logoUrl: "/images/NewLOGOSF.webp",
        logoSize: { width: 48, height: 48 },
    });

    // หน้าถัดไปค่อยมี footer — หน้าปกไม่ใส่
    const footer = buildFooter(formData.placeName ?? "");
    const PT = 20;                           // 1pt = 20 twips
    const GAP_HEADER_TO_IMG = 60 * PT;       // 60pt
    const GAP_IMG_TO_TITLE = 30 * PT;        // 30pt

    /* ---------- สร้างหน้า “หน้าปก” ---------- */
    const coverChildren: Paragraph[] = [];

    coverChildren.push(new Paragraph({ spacing: { before: GAP_HEADER_TO_IMG } }));

    // 1) รูปปก (มาก่อน)
    if (formData.cover) {
        const { bytes, width, height } = await fileToPngBytesAndSize(formData.cover);

        // ใช้ MAX_IMAGE_PX ที่คำนวณจากความกว้างเนื้อหา (ตามที่ตั้งไว้ก่อนหน้า)
        const ratio = Math.min(1, MAX_IMAGE_PX / width);
        const w = Math.round(width * ratio);
        const h = Math.round(height * ratio);

        coverChildren.push(
            new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                    new ImageRun({ data: bytes, type: "png", transformation: { width: w, height: h } }),
                ],
            })
        );
    }

    // 2) ชื่อรายงาน (ตามใต้รูป)
    coverChildren.push(
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: GAP_IMG_TO_TITLE },
            children: [
                new TextRun({
                    text: formData.placeName?.trim() || "..............",
                    bold: true,
                    font: FONT_TH,
                    size: SIZE_TITLE,
                }),
            ],
        })
    );

    // ✅ หน้าปก: มี header แต่ “ไม่มี footer” และจัดแนวตั้งให้อยู่กลางหน้า
    const coverSection = {
        headers: { default: header },
        properties: {
            page: {
                size: { width: PAGE.widthTwips, height: PAGE.heightTwips },
                margin: PAGE.margin,
            },
        },
        children: coverChildren,
    } as const;

    //ส่วนที่ 1
    const contentSectionOne = {
        headers: { default: header },
        footers: { default: footer },
        properties: {
            page: {
                size: { width: PAGE.widthTwips, height: PAGE.heightTwips },
                margin: PAGE.margin,
            },
        },
        children: [new Paragraph({ spacing: { after: 240 } }), ...buildSectionOne()],
    } as const;


    //ส่วนที่ 2
    const sec2Children = await buildSectionTwo(formData);
    const contentsectionTwo = {
        headers: { default: header },
        footers: { default: footer },
        properties: {
            page: { size: { width: PAGE.widthTwips, height: PAGE.heightTwips }, margin: PAGE.margin },
        },
        children: sec2Children,
    } as const;

    //ส่วนที่ 3
    const sec3Children = await buildSectionThree(formData);
    const contentsectionThree = {
        headers: { default: header },
        footers: { default: footer },
        properties: {
            page: { size: { width: PAGE.widthTwips, height: PAGE.heightTwips }, margin: PAGE.margin },
        },
        children: sec3Children,
    } as const;

    //ส่วนที่ 4
    const sec4Children = await buildSectionFour(formData);
    const contentsectionFour = {
        headers: { default: header },
        footers: { default: footer },
        properties: {
            page: { size: { width: PAGE.widthTwips, height: PAGE.heightTwips }, margin: PAGE.margin },
        },
        children: sec4Children,
    } as const;

    //ส่วนที่ 4
    const sec5Children = await buildSectionFive(formData);
    const contentsectionFive = {
        headers: { default: header },
        footers: { default: footer },
        properties: {
            page: { size: { width: PAGE.widthTwips, height: PAGE.heightTwips }, margin: PAGE.margin },
        },
        children: sec5Children,
    } as const;

    const doc = new Document({ sections: [coverSection, contentSectionOne, contentsectionTwo, contentsectionThree, contentsectionFour, contentsectionFive] });
    const blob = await Packer.toBlob(doc);

    const safe = (s: string) =>
        s.trim()
            .replace(/[\\/:*?"<>|\r\n]+/g, "_")  // อักขระต้องห้ามของไฟล์เนม
            .replace(/\s+/g, "_")                // เว้นวรรค -> _
            .slice(0, 120);                      // กันยาวเกินไป

    const place = formData.placeName ? safe(formData.placeName) : "ไม่มีชื่อสถานที่";

    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const HH = String(now.getHours()).padStart(2, "0");
    const MM = String(now.getMinutes()).padStart(2, "0");

    const dateTime = `${dd}${mm}${yyyy}_${HH}${MM}`; // หรือ `${yyyy}${mm}${dd}_${HH}${MM}${SS}`

    const filename = `รายงาน${place}_${dateTime}.docx`;
    saveAs(blob, filename);
}