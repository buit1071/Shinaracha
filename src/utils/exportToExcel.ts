// utils/exportToExcel.ts
import ExcelJS from "exceljs";
import { showLoading } from "@/lib/loading";
import type { SectionFourForm } from "@/components/check-form/forms/form1-3/SectionFourDetails";
import type { DefectRow } from "@/interfaces/master";

/* --------------------------- data helpers --------------------------- */
async function fetchDefects(): Promise<DefectRow[]> {
  const res = await fetch("/api/auth/legal-regulations/get", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ function: "defect" }),
  });
  const data = await res.json();
  if (!data?.success) throw new Error("fetch defects failed");
  return data.data as DefectRow[];
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

async function GetJobById(job_id: string) {
  const res = await fetch("/api/auth/job/get", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ function: "jobById", job_id }),
  });

  const result = await res.json();
  const raw = result?.success ? result.data.job_start_date : null;

  if (!raw) return "";

  const d = new Date(raw);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();

  return `${dd}/${mm}/${yyyy}`;
}

const hasNG = (row: any) => Object.values(row?.visits ?? {}).some((v) => v === "ng");
const normalize = (s?: string) => (s ?? "").toLowerCase().replace(/\s+/g, " ").trim();
const hasText = (s?: string | null) => !!(s && String(s).trim());

/** ดึงข้อความในวงเล็บ () ทั้งหมด (รองรับซ้อน) + คำที่เหลือ */
function extractParens(text: string): { clean: string; parens: string[] } {
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

/* ---------------------- rich text builders ------------------------- */
/** คอลัมน์ “รายการ” */
function buildItemsRichText(d: DefectRow): ExcelJS.RichText[] {
  const rt: ExcelJS.RichText[] = [];
  if (hasText(d.illegal_problem)) {
    // 1) กฎหมาย (แดง หนา ขีดเส้นใต้)
    rt.push({
      text: `ข้อบังคับใช้ตามพระราชบัญญัติควบคุม${d.type ?? ""}`,
      font: { bold: true, underline: true, color: { argb: "FFFF0000" } },
    });
    rt.push({ text: "\n" });
    // 2) ความมั่นคงแข็งแรง (ดำ หนา ขีดเส้นใต้)
    rt.push({
      text: `การตรวจสอบความมั่นคงแข็งแรงของ${d.type ?? ""}`,
      font: { bold: true, underline: true, color: { argb: "FF000000" } },
    });
    rt.push({ text: "\n" });
  } else {
    // 1) หัวข้อข้อเสนอแนะ (น้ำเงิน หนา ขีดเส้นใต้)
    rt.push({
      text: "ข้อเสนอแนะเพิ่มเติม",
      font: { bold: true, underline: true, color: { argb: "FF0000FF" } },
    });
    rt.push({ text: "\n" });
    // 2) ตรวจสอบระบบฯ (ดำ หนา ขีดเส้นใต้)
    rt.push({
      text: `การตรวจสอบระบบและอุปกรณ์ประกอบต่าง ๆ ของ${d.type ?? ""}`,
      font: { bold: true, underline: true, color: { argb: "FF000000" } },
    });
    rt.push({ text: "\n" });
  }

  // 3) บรรทัดรายการหลัก
  rt.push({ text: `${d.defect_no ?? ""}. ${d.inspection_item ?? ""}`.trim() });

  // 4) ถ้ามี illegal_problem ให้เติม () จาก illegal_suggestion ใน “บรรทัดสุดท้าย” (แดง ไม่หนา)
  if (hasText(d.illegal_problem) && hasText(d.illegal_suggestion)) {
    const { parens } = extractParens(d.illegal_suggestion!);
    for (const p of parens) {
      rt.push({ text: "\n" });
      rt.push({ text: p, font: { color: { argb: "FFFF0000" } } });
    }
  }
  return rt;
}

/** เวอร์ชัน plain text ของ “รายการ” (ใช้คำนวณความสูงได้ ถ้าต้องการ) */
function buildItemsPlainText(d: DefectRow): string {
  const lines: string[] = [];
  if (hasText(d.illegal_problem)) {
    lines.push(`ข้อบังคับใช้ตามพระราชบัญญัติควบคุม${d.type ?? ""}`);
    lines.push(`การตรวจสอบความมั่นคงแข็งแรงของ${d.type ?? ""}`);
  } else {
    lines.push("ข้อเสนอแนะเพิ่มเติม");
    lines.push(`การตรวจสอบระบบและอุปกรณ์ประกอบต่าง ๆ ของ${d.type ?? ""}`);
  }
  lines.push(`${d.defect_no ?? ""}. ${d.inspection_item ?? ""}`.trim());
  if (hasText(d.illegal_problem) && hasText(d.illegal_suggestion)) {
    const { parens } = extractParens(d.illegal_suggestion!);
    for (const p of parens) lines.push(p);
  }
  return lines.join("\n");
}

/** คอลัมน์ “สิ่งที่ต้องแก้ไข” (วงเล็บขึ้น “บรรทัดแรก” สีแดง ไม่หนา) */
function buildFixRichText(d: DefectRow): ExcelJS.CellValue {
  const base = hasText(d.illegal_problem) ? d.illegal_suggestion ?? "" : d.general_suggestion ?? "";
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
  else if (pushed) rt.pop(); // ลบท้าย \n ถ้าไม่มีข้อความ clean
  return { richText: rt };
}

/** เวอร์ชัน plain text ของ “สิ่งที่ต้องแก้ไข” เพื่อประมาณความสูงแถว */
function buildFixPlainText(d: DefectRow): string {
  const base = (d.illegal_problem?.trim() ? d.illegal_suggestion : d.general_suggestion) ?? "";
  const { clean, parens } = extractParens(base);
  const lines: string[] = [];
  for (const p of parens) lines.push(p);
  if (clean) lines.push(clean);
  return lines.join("\n");
}

/** ประมาณจำนวนบรรทัดจากความกว้างคอลัมน์ (หน่วยตัวอักษร) → แปลงเป็น point */
function estimateRowHeightForText(
  text: string,
  colWidthChars: number,
  lineHeightPt = 15 // Calibri 11 ประมาณ 15pt/บรรทัด
): number {
  if (!text) return lineHeightPt;
  const hardLines = text.split(/\r?\n/);
  let total = 0;
  const fit = Math.max(1, Math.floor(colWidthChars) - 2); // กัน padding
  for (const ln of hardLines) {
    const len = ln.length || 1;
    total += Math.max(1, Math.ceil(len / fit));
  }
  return total * lineHeightPt + 4; // margin เล็กน้อย
}

/* --------------------------- image helpers -------------------------- */
const pxToEMU = (px: number) => Math.round(px * 9525); // Excel EMU
const pxToPt = (px: number) => px * 0.75;             // ใช้ตั้ง row.height

async function loadImage(url: string): Promise<ArrayBuffer | null> {
  try {
    const r = await fetch(url);
    return await r.arrayBuffer();
  } catch {
    return null;
  }
}
function sniffImageExt(buf: ArrayBuffer): "png" | "jpeg" {
  const b = new Uint8Array(buf.slice(0, 8));
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47) return "png"; // PNG
  if (b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF) return "jpeg";                // JPG
  return "png";
}

/** ดึง src รูป (สูงสุด 2) จาก section ที่ inspection_item ตรงกับ defect */
function collectPhotosFor(section: Partial<SectionFourForm>, defect: DefectRow): string[] {
  const out: string[] = [];
  const pushFrom = (tbl?: Record<string, any>) => {
    if (!tbl) return;
    for (const k of Object.keys(tbl)) {
      const row = tbl[k];
      const a = (row?.inspection_item ?? "").trim().toLowerCase();
      const b = (defect.inspection_item ?? "").trim().toLowerCase();
      if (!a || !b) continue;
      if (a.includes(b) || b.includes(a)) {
        for (const p of row?.photos ?? []) {
          if (p?.src) out.push(p.src);
          if (out.length >= 2) return;
        }
      }
    }
  };
  pushFrom((section as any).table1);
  if (out.length < 2) pushFrom((section as any).table2);
  return out.slice(0, 2);
}

/* ------------------------------- main ------------------------------- */
export async function exportToExcel(section: Partial<SectionFourForm> | null | undefined, id: number | null = null, job_id?: string) {
  showLoading(true);
  try {
    if (!section) return;

    const branch_name = await GetBranchName(job_id ?? "");
    const job_start_date = await GetJobById(job_id ?? "");

    // 1) เก็บรายการที่เป็น NG จาก section
    type NgRow = { id: string; inspection_item: string };
    const ng: NgRow[] = [];
    (["table1", "table2"] as const).forEach((tbl) => {
      const t = (section as any)?.[tbl] ?? {};
      for (const [id, row] of Object.entries<any>(t)) {
        if (hasNG(row) && row?.inspection_item) ng.push({ id, inspection_item: row.inspection_item });
      }
    });

    // 2) master_defect
    const defects = await fetchDefects();

    // 3) match โดย contains สองทาง ด้วย inspection_item
    const matched: DefectRow[] = [];
    for (const r of ng) {
      const q = normalize(r.inspection_item);
      matched.push(
        ...defects.filter((d) => {
          const s = normalize(d.inspection_item);
          return s.includes(q) || q.includes(s);
        })
      );
    }

    // 4) workbook / worksheet
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Defect NG");

    ws.columns = [
      { header: "No.", width: 6 },
      { header: "ชื่อสโตร์", width: 18 },
      { header: "ประเภท", width: 12 },
      { header: "รายการ", width: 80 },
      { header: "รูปก่อนปรับปรุง", width: 40 }, // กว้างพอสำหรับรูป 2 ใบ
      { header: "สิ่งที่ต้องแก้ไข", width: 50 },
      { header: "วันที่เข้างาน", width: 16 },
    ];

    // header: เหลือง หนา กลาง
    const header = ws.getRow(1);
    header.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFC000" } };
      cell.font = { bold: true };
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      cell.border = {
        top: { style: "thin" }, left: { style: "thin" },
        bottom: { style: "thin" }, right: { style: "thin" },
      };
    });
    header.height = 20;

    let firstDataRow = true;
    // 5) เติมข้อมูล
    for (const m of matched) {
      const showOnce = firstDataRow;
      const row = ws.addRow([showOnce ? (id ?? "") : "", showOnce ? (branch_name ?? "") : "", showOnce ? (m.type ?? "") : "", "", "", "", showOnce ? (job_start_date ?? "") : ""]);
      firstDataRow = false;

      // ------- คอลัมน์ 4: รายการ -------
      const c4 = row.getCell(4);
      c4.value = { richText: buildItemsRichText(m) };
      c4.alignment = { wrapText: true, vertical: "top" };

      // ------- คอลัมน์ 6: สิ่งที่ต้องแก้ไข -------
      const c6 = row.getCell(6);
      c6.value = buildFixRichText(m);
      c6.alignment = { wrapText: true, vertical: "top" };

      // ------- คอลัมน์ 5: รูปก่อนปรับปรุง (สูงสุด 2 รูป) -------
      const IMG_W = 120; // px
      const IMG_H = 100; // px
      const GAP = 12;  // px

      // ความสูงขั้นต่ำจากรูป
      row.height = Math.max(row.height ?? 0, pxToPt(IMG_H + 4));

      const sources = collectPhotosFor(section, m);
      const buffers = await Promise.all(sources.map((u) => loadImage(u)));
      const valid = buffers.filter(Boolean) as ArrayBuffer[];

      // คำนวณตำแหน่งรูป (1 รูปกึ่งกลาง, 2 รูปซ้าย-ขวา)
      const col5WidthChars = (ws.getColumn(5).width as number) || 40;
      const col5Px = col5WidthChars * 8; // ประมาณ px ต่อ char
      let offsets: number[] = [];
      if (valid.length === 1) {
        offsets = [Math.max(0, col5Px / 2 - IMG_W / 2)];
      } else if (valid.length >= 2) {
        offsets = [0, IMG_W + GAP];
      }

      valid.forEach((buf, idx) => {
        const ext = sniffImageExt(buf);
        const imgId = wb.addImage({ buffer: buf, extension: ext });
        // ใช้ as any เพื่อใส่ colOff/rowOff ได้ (runtime ExcelJS รองรับ)
        (ws as any).addImage(imgId, {
          tl: { col: 4, row: row.number - 1, colOff: pxToEMU(offsets[idx] || 0), rowOff: 0 },
          ext: { width: IMG_W, height: IMG_H },
          editAs: "oneCell",
        } as any);
      });

      // ------- ยืดแถวให้พอดีข้อความใน “สิ่งที่ต้องแก้ไข” (และเผื่อ “รายการ”) -------
      const col6Width = (ws.getColumn(6).width as number) || 50;
      const col4Width = (ws.getColumn(4).width as number) || 80;
      const fixPlain = buildFixPlainText(m);
      const itemPlain = buildItemsPlainText(m);
      const hFixPt = estimateRowHeightForText(fixPlain, col6Width);
      const hItemPt = estimateRowHeightForText(itemPlain, col4Width);
      row.height = Math.max(row.height ?? 0, hFixPt, hItemPt);

      // ------- กรอบ/ชิดบน ทั้งแถว -------
      row.eachCell((cell, colNumber) => {
        // default: ชิดบน
        let align: Partial<ExcelJS.Alignment> = { vertical: "top", wrapText: true };

        // จัดกึ่งกลางเฉพาะคอลัมน์ No., ชื่อสโตร์, ประเภท, วันที่เข้างาน
        if ([1, 2, 3, 5, 7].includes(colNumber)) {
          align.horizontal = "center";
        }

        cell.alignment = align;

        cell.border = {
          top: { style: "thin" }, left: { style: "thin" },
          bottom: { style: "thin" }, right: { style: "thin" },
        };
      });
    }

    // 6) ดาวน์โหลดไฟล์: Defect_dd-mm-yyyy-hhmmss.xlsx
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
    console.error("[exportToExcel] error:", err);
  } finally {
    showLoading(false);
  }
}
