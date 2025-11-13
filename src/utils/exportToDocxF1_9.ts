"use client";
import { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, AlignmentType, TextRun } from "docx";
import { saveAs } from "file-saver";
import type { F1_9Group } from "@/components/check-form/forms/form1-9/f1_9.config";

type FreqKey = "1m" | "4m" | "6m" | "1y" | "3y";

export type F9Data = {
  placeName?: string;
  frequency?: Record<string, { freq?: FreqKey; note?: string }>;
};

export async function exportToDocxF1_9(groups: F1_9Group[], data: F9Data, texts?: { s1?: string[]; s2?: string[]; s3?: string[] }) {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "แบบฟอร์ม F1_9", bold: true, size: 28 })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: data.placeName || "", size: 24 })] }),
          // ส่วนที่ 1
          new Paragraph({ spacing: { before: 300, after: 120 }, children: [new TextRun({ text: "ส่วนที่ 1 ขอบเขตของการตรวจสอบ", bold: true, size: 26 })] }),
          ...(texts?.s1 || []).map((t) => para(t)),
          // ส่วนที่ 2
          new Paragraph({ spacing: { before: 300, after: 120 }, children: [new TextRun({ text: "ส่วนที่ 2 แผนการตรวจสอบป้ายและอุปกรณ์ประกอบของป้าย", bold: true, size: 26 })] }),
          ...(texts?.s2 || []).map((t) => para(t)),
          // ส่วนที่ 3
          new Paragraph({ spacing: { before: 300, after: 120 }, children: [new TextRun({ text: "ส่วนที่ 3 แนวทางการตรวจสอบป้ายและอุปกรณ์ประกอบของป้ายประจำปี", bold: true, size: 26 })] }),
          ...(texts?.s3 || []).map((t) => para(t)),
          // ส่วนที่ 4
          new Paragraph({ spacing: { before: 300, after: 150 }, children: [new TextRun({ text: "ส่วนที่ 4 ตารางความถี่การตรวจบำรุงรักษา", bold: true, size: 26 })] }),
          ...groups.flatMap((g) => {
            const header = new Paragraph({ spacing: { before: 300, after: 150 }, children: [new TextRun({ text: g.title, bold: true, size: 24 })] });

            const rows: TableRow[] = [];
            rows.push(
              new TableRow({
                children: [
                  cell("ลำดับ", true),
                  cell("รายการตรวจบำรุงรักษา", true),
                  cell("1 เดือน", true, 1400),
                  cell("4 เดือน", true, 1400),
                  cell("6 เดือน", true, 1400),
                  cell("1 ปี", true, 1400),
                  cell("3 ปี", true, 1400),
                  cell("หมายเหตุ", true, 2200),
                ],
              })
            );

            g.rows.forEach((r, i) => {
              const sel = data.frequency?.[r.id]?.freq;
              const note = data.frequency?.[r.id]?.note || "";
              rows.push(
                new TableRow({
                  children: [
                    cell(String(i + 1)),
                    cell(r.label),
                    cell(sel === "1m" ? "✓" : ""),
                    cell(sel === "4m" ? "✓" : ""),
                    cell(sel === "6m" ? "✓" : ""),
                    cell(sel === "1y" ? "✓" : ""),
                    cell(sel === "3y" ? "✓" : ""),
                    cell(note),
                  ],
                })
              );
            });

            const table = new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows });
            return [header, table];
          }),
          // ส่วนที่ 5 หมายเหตุ/ลายเซ็น และรายละเอียดอื่น ๆ เติมตาม UI ภายหลัง
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const filename = `F1_9_${(data.placeName || "").replace(/[^\wก-๙\s]+/g, "_").slice(0, 60) || "export"}.docx`;
  saveAs(blob, filename);
}

function para(text: string) {
  return new Paragraph({ alignment: AlignmentType.LEFT, children: [new TextRun({ text, size: 22 })] });
}

function cell(text: string, bold = false, width?: number) {
  return new TableCell({
    width: width ? { size: width, type: WidthType.DXA } : undefined,
    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text, bold, size: 20 })] })],
  });
}
