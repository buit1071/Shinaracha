// Export Excel for Form 8_1, following the visual/style pattern from Form1_3
import ExcelJS from "exceljs";
import { showLoading } from "@/lib/loading";
import type { Form8_1Plan, PlanUsability, DefectItem, UsabilityRow } from "@/components/check-form/forms/form1-8/form8-1/types";
import {
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
} from "@/utils/excelShared";

async function GetBranchName(job_id: string) {
  try {
    const res = await fetch("/api/auth/customer/get", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ function: "branchName", job_id }),
    });
    const r = await res.json();
    return r?.success && r?.data?.length ? (r.data[0]?.branch_name ?? "") : "";
  } catch { return ""; }
}

async function GetJobStartDate(job_id: string) {
  try {
    const res = await fetch("/api/auth/job/get", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ function: "jobById", job_id }),
    });
    const result = await res.json();
    const raw = result?.success ? result.data?.job_start_date : null;
    if (!raw) return "";
    const d = new Date(raw);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  } catch { return ""; }
}

type GroupKey = "structural" | "electrical" | "lightning" | "others";
function groupName(k: GroupKey): string {
  return k === "structural"
    ? "โครงสร้าง"
    : k === "electrical"
    ? "ระบบไฟฟ้า"
    : k === "lightning"
    ? "ระบบป้องกันฟ้าผ่า"
    : "ระบบอุปกรณ์ประกอบอื่น ๆ";
}

function collectRows(usability?: PlanUsability): { group: GroupKey; row: UsabilityRow }[] {
  const out: { group: GroupKey; row: UsabilityRow }[] = [];
  if (!usability) return out;
  if (Array.isArray(usability.structural)) out.push(...usability.structural.map((r) => ({ group: "structural" as GroupKey, row: r })));
  if (Array.isArray(usability.systems?.electrical)) out.push(...usability.systems!.electrical!.map((r) => ({ group: "electrical" as GroupKey, row: r })));
  if (Array.isArray(usability.systems?.lightning)) out.push(...usability.systems!.lightning!.map((r) => ({ group: "lightning" as GroupKey, row: r })));
  if (Array.isArray(usability.systems?.others)) out.push(...usability.systems!.others!.map((r) => ({ group: "others" as GroupKey, row: r })));
  return out;
}

export async function exportToExcelForm8_1(plan: Partial<Form8_1Plan> | null | undefined, id: number | null = null, job_id?: string) {
  showLoading(true);
  try {
    if (!plan) return;

    const branch_name = await GetBranchName(job_id ?? "");
    const job_start_date = await GetJobStartDate(job_id ?? "");

    // 1) เก็บเฉพาะแถวที่สถานะ "ใช้ไม่ได้"
    const rows = collectRows(plan.usabilityPlan);
    const unusable = rows.filter((x) => x.row?.status === "unusable");

    // 2) สร้างรายการสำหรับ export (แยกเป็น 1 row ต่อ defect item; ถ้าไม่มี defect จะข้าม)
type ExportItem = { idx: number; type: string; itemName: string; suggestion?: string; photoNames: string[] };
    const items: ExportItem[] = [];
    let run = 1;
    for (const { group, row } of unusable) {
      const type = groupName(group);
      const dlist = Array.isArray(row.defects) ? row.defects : [];
      for (const d of dlist) {
        const itemName = d.defectName || row.name || "";
        const suggestion = d.suggestion || d.note || row.note || "";
        const photoNames: string[] = [];
        for (const p of d.photos || []) {
          if (p?.filename) photoNames.push(p.filename);
          if (photoNames.length >= 2) break;
        }
        items.push({ idx: run++, type, itemName, suggestion, photoNames });
      }
    }

    if (items.length === 0) {
      // ไม่มีรายการต้องแก้ไข
      showLoading(false);
      return;
    }

    // 3) workbook / worksheet
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Defect NG");
    ws.columns = [
      { header: "No.", width: 6 },
      { header: "ชื่อสโตร์", width: 18 },
      { header: "ประเภท", width: 12 },
      { header: "รายการ", width: 80 },
      { header: "รูปก่อนปรับปรุง", width: 40 },
      { header: "สิ่งที่ต้องแก้ไข", width: 50 },
      { header: "วันที่เข้างาน", width: 16 },
    ];

    // Override to 8 columns with Thai headers (add "รูปหลังแก้ไข")
    ws.columns = [
      { header: "No.", width: 6 },
      { header: "ชื่อสโตร์", width: 18 },
      { header: "ประเภท", width: 12 },
      { header: "รายการ", width: 80 },
      { header: "รูปก่อนปรับปรุง", width: 24 },
      { header: "รูปหลังแก้ไข", width: 24 },
      { header: "สิ่งที่ต้องแก้ไข", width: 50 },
      { header: "วันที่เข้าทำงาน", width: 16 },
    ];

    const header = ws.getRow(1);
    header.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFC000" } };
      cell.font = { bold: true };
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
    });
    header.height = 20;

    let firstDataRow = true;
    for (const it of items) {
      const showOnce = firstDataRow;
      const row = ws.addRow([showOnce ? (id ?? "") : "", showOnce ? (branch_name || "") : "", showOnce ? ("ป้าย") : "", "", "", "", showOnce ? (job_start_date || "") : ""]);
      // Ensure date goes to column H and type text in C
      row.getCell(8).value = showOnce ? (job_start_date || "") : row.getCell(8).value;
      if (showOnce) { try { row.getCell(3).value = "ป้าย"; } catch { /* ignore */ } }
      if (showOnce) { row.getCell(7).value = ""; }
      firstDataRow = false;

      // Column 4: รายการ (rich text style with type like Form1_3)
      const c4 = row.getCell(4);
      const richItems: any[] = [];
      richItems.push({ text: "คำอธิบายเพิ่มเติม", font: { bold: true, underline: true, color: { argb: "FF0000FF" } } });
      richItems.push({ text: "\n" });
      const header2 = it.type ? `แนวทางการตรวจ/ปัญหา ของ ${it.type}` : "แนวทางการตรวจ/ปัญหา ของ ";
      richItems.push({ text: header2, font: { bold: true, underline: true, color: { argb: "FF000000" } } });
      richItems.push({ text: "\n" });
      const main = `${it.idx ? `${it.idx}. ` : ""}${it.itemName ?? ""}`.trim();
      if (main) richItems.push({ text: main });
      (c4 as any).value = { richText: buildItemsRichTextFromName(it.itemName || "", it.idx) } as any;
      (c4 as any).alignment = { wrapText: true, vertical: "top" } as any;

      // Column 6: สิ่งที่ต้องแก้ไข
      const c7 = row.getCell(7);
      c7.value = buildFixRichTextFromSuggestion(it.suggestion) as any;
      c7.alignment = { wrapText: true, vertical: "top" } as any;

      // Column 5: รูปก่อนปรับปรุง (≤2)
            const IMG_W = 120, IMG_H = 100;
      row.height = Math.max(row.height ?? 0, pxToPt(IMG_H + 4));
      const buffers = await Promise.all(it.photoNames.map(async (name) => {
        const viaProxy = await loadImage(buildLocalProxyUrl(name));
        if (viaProxy) return viaProxy;
        return await loadImage(buildRemoteUrl(name));
      }));
      const valid = buffers.filter(Boolean) as ArrayBuffer[];
      const centerOffset = (colIndex: number) => {
        const widthChars = (ws.getColumn(colIndex).width as number) || 24;
        const px = widthChars * 8;
        return Math.max(0, px / 2 - IMG_W / 2);
      };
      if (valid[0]) {
        const ext0 = sniffImageExt(valid[0]);
        const imgId0 = wb.addImage({ buffer: valid[0], extension: ext0 });
        (ws as any).addImage(imgId0, { tl: { col: 4, row: row.number - 1, colOff: pxToEMU(centerOffset(5)), rowOff: 0 }, ext: { width: IMG_W, height: IMG_H }, editAs: "oneCell" } as any);
      }
            if (valid[1]) {
        const ext1 = sniffImageExt(valid[1]);
        const imgId1 = wb.addImage({ buffer: valid[1], extension: ext1 });
        (ws as any).addImage(imgId1, { tl: { col: 5, row: row.number - 1, colOff: pxToEMU(centerOffset(6)), rowOff: 0 }, ext: { width: IMG_W, height: IMG_H }, editAs: "oneCell" } as any);
      }
      // Row height based on text
      const col6Width = (ws.getColumn(7).width as number) || 50;
      const col4Width = (ws.getColumn(4).width as number) || 80;
      const fixPlain = buildFixPlainText(it.suggestion);
      const itemPlain = [
        "คำอธิบายเพิ่มเติม",
        it.type ? `แนวทางการตรวจ/ปัญหา ของ ${it.type}` : "แนวทางการตรวจ/ปัญหา ของ ",
        `${it.idx ? `${it.idx}. ` : ""}${it.itemName ?? ""}`.trim(),
      ].join("\n");
      const hFixPt = estimateRowHeightForText(fixPlain, col6Width);
      const hItemPt = estimateRowHeightForText(itemPlain, col4Width);
      row.height = Math.max(row.height ?? 0, hFixPt, hItemPt);

      // Borders and align
      row.eachCell((cell, colNumber) => {
        const align: Partial<ExcelJS.Alignment> = { vertical: "top", wrapText: true };
        if ([1, 2, 3, 5, 6, 8].includes(colNumber)) (align as any).horizontal = "center";
        (cell as any).alignment = align as any;
        (cell as any).border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
      });
    }

    // 4) ดาวน์โหลดไฟล์
    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const idPart = id ? `${id}_` : "";
    const branch = branch_name ? `${branch_name}_` : "";
    const filename = `Defect_${idPart}${branch}${pad(now.getDate())}${pad(now.getMonth() + 1)}${now.getFullYear()}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.xlsx`;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  } catch (err) {
    // silent
  } finally {
    showLoading(false);
  }
}

















