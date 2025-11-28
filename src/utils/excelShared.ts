import type ExcelJS from "exceljs";

const pxToEMU = (px: number) => Math.round(px * 9525); // Excel EMU unit
const pxToPt = (px: number) => px * 0.75; // Pixel -> point for row/column sizing

async function loadImage(url: string): Promise<ArrayBuffer | null> {
  if (!url) return null;
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    return await r.arrayBuffer();
  } catch {
    return null;
  }
}

function sniffImageExt(buf: ArrayBuffer): "png" | "jpeg" {
  const b = new Uint8Array(buf.slice(0, 8));
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "png";
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpeg";
  return "png";
}

function estimateRowHeightForText(text: string, colWidthChars: number, lineHeightPt = 15): number {
  if (!text) return lineHeightPt;
  const lines = text.split(/\r?\n/);
  const fit = Math.max(1, Math.floor(colWidthChars) - 2);
  let total = 0;
  for (const ln of lines) {
    const len = ln.length || 1;
    total += Math.max(1, Math.ceil(len / fit));
  }
  return total * lineHeightPt + 4;
}

function extractParens(text: string): { clean: string; parens: string[] } {
  const parens: string[] = [];
  let stack = 0;
  let buf = "";
  let clean = "";
  for (const c of text) {
    if (c === "(") {
      if (stack === 0 && buf) {
        clean += buf;
        buf = "";
      }
      stack++;
    }
    buf += c;
    if (c === ")") {
      stack--;
      if (stack === 0) {
        parens.push(buf);
        buf = "";
      }
    }
  }
  if (stack === 0 && buf) clean += buf;
  return { clean: clean.trim(), parens };
}

function buildItemsRichTextFromName(name: string, idx?: number): ExcelJS.RichText[] {
  const label = `${idx ? `${idx}. ` : ""}${name ?? ""}`.trim();
  return label ? [{ text: label }] : [];
}

function buildItemsPlainTextFromName(name: string, idx?: number): string {
  const label = `${idx ? `${idx}. ` : ""}${name ?? ""}`.trim();
  return label;
}

function buildFixRichTextFromSuggestion(text?: string | null): ExcelJS.CellValue {
  const base = text?.trim() ?? "";
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

function buildFixPlainText(text?: string | null): string {
  const base = text?.trim() ?? "";
  if (!base) return "";
  const { clean, parens } = extractParens(base);
  const lines: string[] = [];
  for (const p of parens) lines.push(p);
  if (clean) lines.push(clean);
  return lines.join("\n");
}

function buildRemoteUrl(name: string): string {
  const base = process.env.NEXT_PUBLIC_N8N_UPLOAD_FILE || "";
  return name ? `${base}?name=${encodeURIComponent(name)}` : "";
}

// Currently no dedicated proxy endpoint; fall back to remote URL to keep image loading working.
const buildLocalProxyUrl = (name: string): string => buildRemoteUrl(name);

export {
  pxToEMU,
  pxToPt,
  loadImage,
  sniffImageExt,
  estimateRowHeightForText,
  buildItemsRichTextFromName,
  buildItemsPlainTextFromName,
  buildFixRichTextFromSuggestion,
  buildFixPlainText,
  buildLocalProxyUrl,
  buildRemoteUrl,
};
