// utils/exportToExcel.ts
import ExcelJS from "exceljs";
import { showLoading } from "@/lib/loading";
import type { ViewDefectProblem } from "@/interfaces/master";

/* --------------------------- helpers --------------------------- */
async function fetchViewDefectProblems(): Promise<ViewDefectProblem[]> {
  const res = await fetch("/api/auth/legal-regulations/get", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ function: "view" }),
  });
  const data = await res.json();
  if (!data?.success) throw new Error("fetch view_defect_problem failed");
  return data.data as ViewDefectProblem[];
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

async function GetStoreNo(job_id: string) {
  const res = await fetch("/api/auth/customer/get", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ function: "StoreNo", job_id }),
  });
  const r = await res.json();
  return r?.success && r?.data?.length ? (r.data[0]?.store_no ?? "") : "";
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

/* --------------------------- text helpers --------------------------- */
const hasText = (s?: string | null) => !!(s && String(s).trim());

function extractParens(text: string): { clean: string; parens: string[] } {
  const parens: string[] = [];
  let stack = 0;
  let buf = "";
  let clean = "";

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === "(") {
      if (stack === 0 && buf) {
        clean += buf;
        buf = "";
      }
      stack++;
      buf += c;
    } else if (c === ")") {
      buf += c;
      stack--;
      if (stack === 0) {
        parens.push(buf);
        buf = "";
      }
    } else {
      buf += c;
    }
  }
  if (buf && stack === 0) clean += buf;
  return { clean: clean.trim(), parens };
}

/* --------------------------- image helpers --------------------------- */
const pxToEMU = (px: number) => Math.round(px * 9525);
const pxToPt = (px: number) => px * 0.75;

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
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47) return "png";
  if (b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF) return "jpeg";
  return "png";
}

/* --------------------------- export main --------------------------- */
export async function exportToExcel(
  sectionFour: any,
  job_id?: string
) {
  showLoading(true);
  try {
    if (!sectionFour) return;

    const viewList = await fetchViewDefectProblems();
    const branch_name = await GetBranchName(job_id ?? "");
    const store_no = await GetStoreNo(job_id ?? "");
    const job_date = await GetJobById(job_id ?? "");

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Defect Report");

    ws.columns = [
      { header: "No.", width: 10 },
      { header: "ชื่อสโตร์", width: 20 },
      { header: "ประเภท", width: 20 },
      { header: "รายการ", width: 80 },
      { header: "รูปก่อนปรับปรุง 1", width: 18 },
      { header: "รูปก่อนปรับปรุง 2", width: 18 },
      { header: "สิ่งที่ต้องแก้ไข", width: 80 },
      { header: "วันที่เข้างาน", width: 16 },
    ];

    // header style
    const header = ws.getRow(1);
    header.eachCell((c) => {
      c.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFC000" },
      };
      c.font = { bold: true };
      c.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      c.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
    header.height = 22;

    let problemNo = 1;
    let firstRow = true;

    const TABLE_KEYS = ["table1", "table2"] as const;

    for (const tbl of TABLE_KEYS) {
      const table = sectionFour?.[tbl] ?? {};
      for (const row of Object.values<any>(table)) {
        if (!row?.visits || row.visits.v1 !== "ng") continue;

        const defects: any[] = Array.isArray(row.defect) ? row.defect : [];
        if (!defects.length) continue;

        for (const defect of defects) {
          const problem_id: string = defect.problem_id ?? "";
          const problem_name: string = defect.problem_name ?? "";
          const illegal_suggestion: string = defect.illegal_suggestion ?? "";
          const defectName: string = (defect.defect_name ?? "").toString().trim();
          const isOther = problem_id === "other";
          const hasDefectName = hasText(defectName);

          let kind: "law" | "suggestion";
          let typeFromView = "";
          let regulationLine = "";
          let fixText = illegal_suggestion;

          if (!isOther) {
            kind = "law";
            const viewRow = viewList.find((v) => v.problem_id === problem_id);
            typeFromView = viewRow?.equipment_type_name ?? "";

            const base = illegal_suggestion || viewRow?.illegal_suggestion || "";
            if (hasText(base)) {
              const { clean, parens } = extractParens(base);
              if (parens.length) {
                regulationLine = parens[0];
                if (hasText(clean)) fixText = clean;
              }
            }
            if (!hasText(regulationLine) && hasText(viewRow?.defect_name)) {
              regulationLine = viewRow!.defect_name!;
            }
          } else {
            if (hasDefectName) {
              kind = "law";
              regulationLine = defectName;
            } else {
              kind = "suggestion";
            }
          }

          /* -------------------- รายการ -------------------- */
          const rt: ExcelJS.RichText[] = [];

          if (kind === "law") {
            rt.push({
              text: "ข้อบังคับใช้ตามพระราชบัญญัติควบคุมป้าย",
              font: { bold: true, underline: true, color: { argb: "FFFF0000" } },
            });
          } else {
            rt.push({
              text: "ข้อเสนอแนะเพิ่มเติม",
              font: { bold: true, underline: true, color: { argb: "FF0000FF" } },
            });
          }

          // เพิ่มบรรทัด "การตรวจสอบระบบและอุปกรณ์ประกอบต่าง ๆ"
          rt.push({ text: "\n" });
          rt.push({
            text: "การตรวจสอบระบบและอุปกรณ์ประกอบต่าง ๆ",
            font: { underline: true, color: { argb: "FF000000" } },
          });

          // เพิ่มหมายเลขปัญหา
          rt.push({ text: `\n${problemNo}. ${problem_name}` });

          // บรรทัด (กฎกระทรวง...) ด้านล่างสุด
          if (hasText(regulationLine)) {
            rt.push({
              text: `\n${regulationLine}`,
              font: { color: { argb: "FFFF0000" } },
            });
          }

          const excelRow = ws.addRow([
            firstRow ? store_no ?? "" : "",
            firstRow ? branch_name : "",
            firstRow ? typeFromView : "",
            "",
            "",
            "",
            "",
            firstRow ? job_date : "",
          ]);
          firstRow = false;

          const cellItems = excelRow.getCell(4);
          cellItems.value = { richText: rt };
          cellItems.alignment = { wrapText: true, vertical: "top" };

          /* -------------------- สิ่งที่ต้องแก้ไข -------------------- */
          const cellFix = excelRow.getCell(7);
          if (kind === "law") {
            const fixRt: ExcelJS.RichText[] = [];
            if (hasText(regulationLine)) {
              fixRt.push({
                text: regulationLine,
                font: { color: { argb: "FFFF0000" } },
              });
              if (hasText(fixText)) fixRt.push({ text: "\n" });
            }
            if (hasText(fixText)) fixRt.push({ text: fixText });
            cellFix.value = fixRt.length ? { richText: fixRt } : "";
          } else {
            cellFix.value = illegal_suggestion ?? "";
          }
          cellFix.alignment = { wrapText: true, vertical: "top" };

          /* -------------------- รูป -------------------- */
          const photos: any[] = Array.isArray(defect.photos) ? defect.photos.slice(0, 2) : [];
          const IMG_W = 120;
          const IMG_H = 100;
          for (let i = 0; i < photos.length; i++) {
            const p = photos[i];
            if (!p?.src) continue;
            const buf = await loadImage(p.src);
            if (!buf) continue;
            const ext = sniffImageExt(buf);
            const imgId = wb.addImage({ buffer: buf, extension: ext });
            (ws as any).addImage(imgId, {
              tl: { col: 4 + i, row: excelRow.number - 1, colOff: pxToEMU(2), rowOff: pxToEMU(2) },
              ext: { width: IMG_W, height: IMG_H },
              editAs: "oneCell",
            } as any);
          }
          excelRow.height = pxToPt(IMG_H + 10);

          excelRow.eachCell((cell, col) => {
            const align: Partial<ExcelJS.Alignment> = {
              vertical: "top",
              wrapText: true,
              horizontal: [1, 2, 3, 5, 6, 8].includes(col) ? "center" : "left",
            };
            cell.alignment = align;
            cell.border = {
              top: { style: "thin" },
              left: { style: "thin" },
              bottom: { style: "thin" },
              right: { style: "thin" },
            };
          });

          problemNo++;
        }
      }
    }

    // download file
    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const filename = `Defect_${store_no}_${branch_name}_${pad(now.getDate())}${pad(
      now.getMonth() + 1
    )}${now.getFullYear()}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(
      now.getSeconds()
    )}.xlsx`;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  } catch (err) {
    console.error("Export Error:", err);
  } finally {
    showLoading(false);
  }
}
