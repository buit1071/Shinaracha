// Shared helpers for Excel export (used by Form1_3 and Form8_1 style)
import ExcelJS from "exceljs";

export const hasText = (s?: string | null) => !!(s && String(s).trim());

export function extractParens(text: string): { clean: string; parens: string[] } {
  const parens: string[] = [];
  let stack = 0, buf = "", clean = "";
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === "(") {
      if (stack === 0 && buf) { clean += buf; buf = ""; }
      stack++; buf += c;
    } else if (c === ")") {
      buf += c; stack--;
      if (stack === 0) { parens.push(buf); buf = ""; }
    } else {
      buf += c;
    }
  }
  if (buf && stack === 0) clean += buf;
  return { clean: clean.trim(), parens };
}

export function buildItemsRichTextFromName(name: string, defectNo?: number): ExcelJS.RichText[] {
  const rt: ExcelJS.RichText[] = [];
  // Header lines (match style from 1_3 when no illegal_problem)
  rt.push({ text: "ข้อเสนอแนะเพิ่มเติม", font: { bold: true, underline: true, color: { argb: "FF0000FF" } } });
  rt.push({ text: "\n" });
  rt.push({ text: "การตรวจสอบระบบและอุปกรณ์ประกอบต่าง ๆ", font: { bold: true, underline: true, color: { argb: "FF000000" } } });
  rt.push({ text: "\n" });
  const main = `${defectNo ? `${defectNo}. ` : ""}${name ?? ""}`.trim();
  if (main) rt.push({ text: main });
  return rt;
}

export function buildItemsPlainTextFromName(name: string, defectNo?: number): string {
  const lines: string[] = [
    "ข้อเสนอแนะเพิ่มเติม",
    "การตรวจสอบระบบและอุปกรณ์ประกอบต่าง ๆ",
  ];
  const main = `${defectNo ? `${defectNo}. ` : ""}${name ?? ""}`.trim();
  if (main) lines.push(main);
  return lines.join("\n");
}

export function buildFixRichTextFromSuggestion(text?: string): ExcelJS.CellValue {
  const base = text ?? "";
  if (!base) return "";
  const { clean, parens } = extractParens(base);
  const rt: ExcelJS.RichText[] = [];
  let pushed = false;
  for (const p of parens) {
    rt.push({ text: p, font: { color: { argb: "FFFF0000" } } });
    rt.push({ text: "\n" });
    pushed = true;
  }
  if (clean) rt.push({ text: pushed ? clean : clean });
  else if (pushed) rt.pop();
  return { richText: rt };
}

export function buildFixPlainText(text?: string): string {
  const base = text ?? "";
  const { clean, parens } = extractParens(base);
  const lines: string[] = [];
  for (const p of parens) lines.push(p);
  if (clean) lines.push(clean);
  return lines.join("\n");
}

// sizing helpers
export const pxToEMU = (px: number) => Math.round(px * 9525);
export const pxToPt = (px: number) => px * 0.75;

export async function loadImage(url: string): Promise<ArrayBuffer | null> {
  try {
    const r = await fetch(url);
    return await r.arrayBuffer();
  } catch {
    return null;
  }
}

export function sniffImageExt(buf: ArrayBuffer): "png" | "jpeg" {
  const b = new Uint8Array(buf.slice(0, 8));
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47) return "png";
  if (b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF) return "jpeg";
  return "png";
}

export function estimateRowHeightForText(text: string, colWidthChars: number, lineHeightPt = 15): number {
  if (!text) return lineHeightPt;
  const hardLines = text.split(/\r?\n/);
  let total = 0;
  const fit = Math.max(1, Math.floor(colWidthChars) - 2);
  for (const ln of hardLines) {
    const len = ln.length || 1;
    total += Math.max(1, Math.ceil(len / fit));
  }
  return total * lineHeightPt + 4;
}

export function buildRemoteUrl(name?: string): string {
  const base = process.env.NEXT_PUBLIC_N8N_UPLOAD_FILE || "";
  return name ? `${base}?name=${encodeURIComponent(name)}` : "";
}

export function buildLocalProxyUrl(name?: string): string {
  return name ? `/api/auth/upload-file/get?name=${encodeURIComponent(name)}` : "";
}
