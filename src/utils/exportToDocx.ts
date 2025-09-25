// utils/exportToDocx.ts
"use client";

import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    AlignmentType,
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
    UnderlineType,
} from "docx";
import { saveAs } from "file-saver";

import { SectionTwoForm } from "@/components/check-form/forms/form1-3/SectionTwoDetails";
import { SectionThreeForm } from "@/components/check-form/forms/form1-3/SectionThreeDetails";
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
const SIZE_18PT = 36; // 15pt = 30 half-points
const SIZE_TITLE = 56;
const PX_PER_INCH = 96;

// หัวข้อชิดซ้าย หนา
function heading(text: string, head = false) {
    return new Paragraph({
        alignment: head ? AlignmentType.CENTER : AlignmentType.LEFT,
        spacing: { before: 60, after: 120, line: 240 },
        children: [new TextRun({ text, bold: true, font: FONT_TH, size: SIZE_18PT })],
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
    paras.push(heading("ส่วนที่ 1 ขอบเขตของการตรวจสอบ และรายละเอียดที่ต้องตรวจสอบ", true));

    // 1.1
    paras.push(
        p(
            "1.1 ในแผนการตรวจสอบและรายละเอียดการตรวจสอบป้ายประจำปีฉบับนี้ “ป้าย” หมายถึง แผ่นป้ายและสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย การตรวจสอบป้าย หมายถึง การตรวจสอบสภาพป้าย หรือสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย ในด้านความมั่นคงแข็งแรง และระบบอุปกรณ์ประกอบของป้าย ตามมาตรา 32 ทวิ แห่งพระราชบัญญัติควบคุมอาคาร พ.ศ.2522"
        ),
        p(
            "ผู้ตรวจสอบอาคาร หมายถึง ผู้ซึ่งได้รับใบอนุญาตประกอบวิชาชีพ วิศวกรรมควบคุม หรือผู้ซึ่งได้รับใบอนุญาตประกอบวิชาชีพสถาปัตยกรรมควบคุม ตามกฎหมายว่าด้วยการนั้น แล้วแต่กรณี ซึ่งได้ขึ้นทะเบียนเป็นผู้ตรวจสอบอาคารตามพระราชบัญญัติควบคุมอาคาร พ.ศ.2522"
        ),
        p("เจ้าของป้าย หมายถึง ผู้ที่มีสิทธิ์เป็นเจ้าของป้ายหรือสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย"),
        p(
            "ผู้ดูแลป้าย หมายถึง เจ้าของป้าย หรือ ผู้ที่ที่ได้รับมอบหมายจากเจ้าของป้ายให้มีหน้าที่ตรวจสอบการบำรุงรักษาป้าย และระบบอุปกรณ์ประกอบต่าง ๆ"
        ),
        p("เจ้าพนักงานท้องถิ่น หมายถึง"),
        pn("(1) นายกเทศมนตรี สำหรับในเขตเทศบาล", 2),
        pn("(2) นายกองค์การบริหารส่วนจังหวัด สำหรับในเขตองค์การบริหารส่วนจังหวัด", 2),
        pn("(3) ประธานกรรมการบริหารองค์การบริหารส่วนตำบล สำหรับในเขตองค์การบริหารส่วนตำบล", 2),
        pn("(4) ผู้ว่าราชการกรุงเทพมหานคร สำหรับในเขตกรุงเทพมหานคร", 2),
        pn("(5) ปลัดเมืองพัทยา สำหรับในเขตเมืองพัทยา", 2),
        pn("(6) ผู้บริหารท้องถิ่นขององค์การปกครองท้องถิ่นอื่นที่รัฐมนตรีประกาศกำหนด สำหรับในเขตราชการส่วนท้องถิ่นนั้น", 2),
        p(
            "แผนการตรวจสอบ หมายถึง แผนการตรวจสอบสภาพป้ายหรือสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย และอุปกรณ์ประกอบต่าง ๆ ที่จัดทำขึ้นสำหรับ สำหรับผู้ตรวจสอบอาคาร"
        ),
        p("แบบแปลนป้าย หมายถึง แบบแปลนของป้ายหรือสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย ที่ต้องตรวจสอบ")
    );

    // 1.2
    paras.push(heading("1.2 หน้าที่ความรับผิดชอบของผู้เกี่ยวข้อง"));

    paras.push(
        p(
            "1.2.1 ผู้ตรวจสอบอาคาร มีหน้าที่ตรวจสอบ ทำรายงานทางด้านความมั่นคงแข็งแรง และระบบต่าง ๆ ที่เกี่ยวข้องเพื่อความปลอดภัย แจ้งกับเจ้าของอาคาร ผู้ตรวจสอบต้องตรวจสอบตามหลักวิชาชีพ และตามมาตรฐานการตรวจสอบสภาพอาคารของกฎหมายควบคุมอาคาร หรือมาตรฐานสากลต่าง ๆ ที่เกี่ยวข้อง ณ สถานที่ วัน และเวลาที่ทำการตรวจสอบ"
        ),
        p("ผู้ตรวจสอบอาคารต้องจัดให้มี"),
        pn("(1) แบบรายละเอียดการตรวจสอบป้าย สำหรับผู้ตรวจสอบอาคารใช้ในการตรวจสอบใหญ่ ทุก ๆ 5 ปี และการตรวจสอบป้ายประจำปี", 2),
        pn("(2) แผนปฏิบัติการการตรวจบำรุงรักษาป้าย และอุปกรณ์ประกอบของป้าย รวมทั้งคู่มือปฏิบัติการตามแผนให้แก่เจ้าของป้ายเพื่อเป็นแนวทางการตรวจบำรุงรักษาและ การบันทึกข้อมูลการตรวจบำรุงรักษา", 2),
        pn("(3) แผนการตรวจสอบประจำปี รวมทั้งแนวทางการตรวจสอบตามแผนดังกล่าวให้แก่เจ้าของป้าย เพื่อประโยชน์ในการตรวจสอบประจำปี", 2),
        p(
            "1.2.2 เจ้าของป้าย หรือผู้ดูแลป้าย ที่ได้รับมอบหมายจากเจ้าของป้ายมีหน้าที่ตรวจสอบบำรุงรักษาป้าย และอุปกรณ์ประกอบ รวมทั้ง การตรวจสอบสมรรถนะของป้าย ตามที่ผู้ตรวจสอบอาคารได้กำหนดไว้ และจัดให้มีการทดสอบการทำงานของระบบ อุปกรณ์ในระหว่างปี แล้วรายงานผลการตรวจสอบต่อเจ้าพนักงานท้องถิ่น ตามหลักเกณฑ์ วิธีการ และเงื่อนไขที่กำหนดในกฎกระทรวงเกี่ยวกับการตรวจสอบอาคาร"
        ),
        p(
            "1.2.3 เจ้าพนักงานท้องถิ่น มีหน้าที่ตามกฎหมายในการพิจารณาผลการตรวจสอบสภาพป้ายที่ เจ้าของอาคารเสนอเพื่อพิจารณาออกใบรับรองการตรวจสอบอาคาร หรือดำเนินการตามอำนาจหน้าที่ ตามกฎหมายต่อไป"
        )
    );

    // 1.3
    paras.push(
        heading("1.3 แผนการตรวจสอบ"),
        p(
            "ผู้ตรวจสอบอาคาร กำหนดแผนการตรวจสอบสภาพป้ายและอุปกรณ์ประกอบของป้ายไว้ตาม  แผนการตรวจสอบฉบับนี้  ให้เจ้าของป้าย และหรือผู้ดูแลป้ายใช้เป็นแนวทางการปฏิบัติ ผู้ตรวจสอบอาคารสามารถแก้ไขเปลี่ยนแปลงแผนการตรวจสอบนี้ได้ตามความเหมาะสม"
        )
    );

    // 1.4
    paras.push(
        heading("1.4 การตรวจสอบบำรุงรักษา"),
        p(
            "การตรวจสอบบำรุงรักษาป้าย และระบบอุปกรณ์ประกอบต่าง ๆ ของป้ายให้เป็นไปตามแผนการ  ตรวจการตรวจสอบบำรุงรักษา และคู่มือการตรวจบำรุงรักษาป้ายที่ผู้ตรวจสอบอาคารกำหนด"
        )
    );

    // 1.5
    paras.push(
        heading("1.5 ผู้ตรวจสอบอาคารต้องไม่ดำเนินการตรวจสอบป้าย ดังต่อไปนี้"),
        pn("(1) ป้ายที่ผู้ตรวจสอบหรือคู่สมรส พนักงานหรือตัวแทนของผู้ตรวจสอบเป็นผู้จัดทำหรือรับผิดชอบในการออกแบบ รายการประกอบแบบแปลน หรือรายการคำนวณส่วนต่าง ๆ ของโครงสร้าง   การควบคุมงาน การก่อสร้าง หรือการติดตั้งอุปกรณ์ประกอบของป้าย", 1),
        pn("(2) ป้ายที่ผู้ตรวจสอบหรือคู่สมรสเป็นเจ้าของหรือมีส่วนร่วมในการบริหารจัดการ", 1)
    );

    // 1.6
    paras.push(
        heading("1.6 ขอบเขตในการตรวจสอบป้ายของผู้ตรวจสอบอาคาร"),
        p(
            "การตรวจสอบสภาพป้ายและอุปกรณ์ประกอบต่าง ๆ ของป้าย อาจมีข้อจำกัดต่าง ๆ ที่ไม่สามารถตรวจสอบได้ตามที่กำหนดและตามที่ต้องการได้ ดังนั้น จึงจำเป็นต้องกำหนดขอบเขตของผู้ตรวจสอบ ดังนี้"
        ),
        p(
            "“ผู้ตรวจสอบมีหน้าที่ตรวจสอบ สังเกต ทำรายงาน วิเคราะห์ ทางด้านความมั่นคงแข็งแรง และระบบต่าง ๆ ที่เกี่ยวข้องเพื่อความปลอดภัยของชีวิตและทรัพย์สิน ผู้ตรวจสอบต้องตรวจสอบตามหลักวิชาชีพ และตามมาตรฐานการตรวจสอบสภาพอาคารของกฎหมายควบคุมอาคารหรือมาตรฐานสากลต่าง ๆ ที่เกี่ยวข้อง ณ สถานที่ วัน และเวลาที่ทำการตรวจสอบตามที่ระบุในรายงานและติดตามตรวจสอบระหว่างปีภายหลังการตรวจสอบใหญ่  ตามช่วงเวลา  และความถี่ตามที่กำหนดไว้ในแผนการตรวจสอบประจำปีที่ผู้ตรวจสอบกำหนด”"
        )
    );

    // 1.7
    paras.push(heading("1.7 รายละเอียดในการตรวจสอบ"));

    paras.push(
        p(
            "1.7.1 รายละเอียดที่ต้องตรวจสอบ  ผู้ตรวจสอบต้องตรวจสอบ และทำรายงานการตรวจสอบสภาพป้ายและอุปกรณ์ต่าง ๆ ของป้าย ดังต่อไปนี้"
        ),
        pn("1.7.1.1 การตรวจสอบตัวป้าย ให้ตรวจสอบความมั่นคงแข็งแรงของอาคาร ดังนี้", 2),
        pn("(1) การต่อเติม ดัดแปลง ปรับปรุงขนาดของป้าย", 3),
        pn("(2) การเปลี่ยนแปลงน้ำหนักของแผ่นป้าย", 3),
        pn("(3) การเปลี่ยนแปลงวัสดุของป้าย", 3),
        pn("(4) การชำรุดสึกหรอของป้าย", 3),
        pn("(5) การวิบัติของสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย", 3),
        pn("(6) การทรุดตัวของฐานรากของสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย (กรณีป้ายที่ตั้งบนพื้นดิน)", 3),
        pn(
            "(7) การเชื่อมยึดระหว่างแผ่นป้ายกับสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย  การเชื่อมยึด  ระหว่างชิ้นส่วนต่าง ๆ ของสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้ายและการเชื่อมยึด  ระหว่างสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้ายกับฐานรากหรืออาคาร", 3
        ),
        pn("1.7.1.2 การตรวจสอบระบบและอุปกรณ์ประกอบต่าง ๆ ของป้าย", 2),
        pn("(1) ระบบไฟฟ้าแสงสว่าง", 3),
        pn("(2) ระบบป้องกันฟ้าผ่า", 3),
        pn("(3) ระบบและอุปกรณ์ประกอบอื่น ๆ", 3),
        p("1.7.2  ลักษณะบริเวณที่ไม่ต้องตรวจสอบ"),
        pn("(1) การตรวจสอบพื้นที่ที่มีความเสี่ยงภัยสูงต่อผู้ตรวจสอบ", 2),
        pn("(2) การตรวจสอบที่อาจทำให้อาคารหรือวัสดุอุปกรณ์หรือทรัพย์สินเกิดความเสียหาย", 2),
        p("1.7.3 การตรวจสอบระบบโครงสร้าง"),
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
        p("1.7.4 การตรวจสอบระบบและอุปกรณ์ประกอบต่าง ๆ ของป้าย"),
        pn("1.7.4.1 ระบบไฟฟ้า", 2),
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
        pn("1.7.4.2 ระบบป้องกันฟ้าผ่า", 2),
        pn("(1) ตรวจสอบระบบตัวนำล่อฟ้า ตัวนำต่อลงดินครอบคลุมครบถ้วน", 3),
        pn("(2) ตรวจสอบระบบรากสายดิน", 3),
        pn("(3) ตรวจสอบจุดต่อประสานศักย์", 3),
        pn("(4) ตรวจสอบ การดูแลรักษา ซ่อมบำรุง และการทดสอบระบบในอดีตที่ผ่านมา", 3),
        pn("1.7.4.3 ระบบอุปกรณ์ประกอบอื่น ๆ", 2),
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
    items.push(heading("รูปถ่ายป้าย", true));

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

// ====== สร้าง “ส่วนที่ 2 ข้อมูลทั่วไปของป้าย” แบบขีดเส้น ไม่มีตาราง ======
async function buildSectionTwo(formData: FormDataLite) {
    const s2 = formData.sectionTwo ?? {};
    const s = (v?: string | null) => (v && v.trim() !== "" ? v : "");

    // หัวข้อใหญ่ + เกริ่น
    const h2 = heading("ส่วนที่ 2 ข้อมูลทั่วไปของป้าย", true);
    const intro = p("ข้อมูลทั่วไปของป้ายที่ผู้ตรวจสอบต้องลงบันทึกในหัวข้อต่าง ๆ และอาจเพิ่มเติมได้เพื่อให้ข้อมูลสมบูรณ์ยิ่งขึ้นในบางรายการจะต้องประสานงานกับเจ้าของป้ายและผู้ดูแลป้ายเพื่อให้ได้ข้อมูลเหล่านั้น");
    const h2_51 = pn("5.1 ข้อมูลป้ายและสถานที่ตั้งป้าย", 1);

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
    const Hmap = heading("แผนที่แสดงตำแหน่งที่ตั้งของป้ายโดยสังเขป", true);

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
    const hShape = heading("รูปแบบและขนาดของแผ่นป้าย / สิ่งที่สร้างขึ้น (สเก็ตช์โดยสังเขป)", true);

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

    const h2_52 = pn("5.2 ประเภทของป้าย", 1);

    const T1 = checkboxLine(!!s2.typeGround, "ป้ายที่ติดตั้งบนพื้นดิน", 2);
    const T2 = checkboxLine(!!s2.typeRooftop, "ป้ายบนดาดฟ้าอาคาร", 2);
    const T3 = checkboxLine(!!s2.typeOnRoof, "ป้ายบนหลังคา", 2);
    const T4 = checkboxLine(!!s2.typeOnBuilding, "ป้ายบนส่วนหนึ่งส่วนใดของอาคาร", 2);
    const T5 = checkboxLine(!!s2.typeOtherChecked, `${s2.typeOtherChecked && s2.typeOther ? s2.typeOther : ""}`, 2);

    const h2_53 = pn("5.3 ชื่อเจ้าของหรือผู้ครอบครองป้าย และผู้ออกแบบด้านวิศวกรรมโครงสร้าง", 1);

    return [
        h2, intro, h2_51, L1, L2, L3, L4, permit, C1, C2, C3, C4,
        PAGEBREAK,
        Inspect, Hmap, ...MapImg, BR1, inspect3Line, hShape, ...ShapeImg, ...photosSection,
        PAGEBREAK,
        h2_52, T1, T2, T3, T4, T5,
        h2_53
    ];
}

/* ---------------- Export main ---------------- */
export async function exportToDocx(formData: FormDataLite) {
    const header = await buildCompanyHeader({
        companyTh: "บริษัท ชินราช โพรเทคเตอร์ จำกัด",
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

    const sec2Children = await buildSectionTwo(formData);

    //ส่วนที่ 2
    const contentsectionTwo = {
        headers: { default: header },
        footers: { default: footer },
        properties: {
            page: { size: { width: PAGE.widthTwips, height: PAGE.heightTwips }, margin: PAGE.margin },
        },
        children: sec2Children,
    } as const;

    const doc = new Document({ sections: [coverSection, contentSectionOne, contentsectionTwo] });
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