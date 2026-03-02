// utils/exportToExcel.ts
import ExcelJS from "exceljs";
import { showLoading } from "@/lib/loading";
import { showAlert } from "@/lib/fetcher";

/* --------------------------- export main --------------------------- */
const loadImage = async (url: string): Promise<ArrayBuffer | null> => {
  try {
    const response = await fetch(url, { method: "GET" });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    // ตรวจสอบชัวร์ๆ ว่าสิ่งที่ตอบกลับมาคือ "รูปภาพ" ไม่ใช่หน้าเว็บ 404
    const contentType = response.headers.get("content-type");
    if (contentType && !contentType.includes("image")) {
      console.error("❌ ไฟล์ที่โหลดมาไม่ใช่รูปภาพ! Content-Type:", contentType);
      return null;
    }
    return await response.arrayBuffer();
  } catch (error) {
    console.error(`❌ โหลดรูปล้มเหลว (อาจจะติด CORS หรือ URL ผิด): ${url}`, error);
    return null;
  }
};

const getImageExtension = (filename: string): "png" | "jpeg" | "gif" => {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".png")) return "png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "jpeg";
  if (lower.endsWith(".gif")) return "gif";
  return "png"; // default 
};

const borders = {
  thin: { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } } as Partial<ExcelJS.Borders>,
  dotted: { top: { style: "dotted" }, left: { style: "dotted" }, bottom: { style: "dotted" }, right: { style: "dotted" } } as Partial<ExcelJS.Borders>,
  outer: { top: { style: "medium" }, left: { style: "medium" }, bottom: { style: "medium" }, right: { style: "medium" } } as Partial<ExcelJS.Borders>,
  bottomThin: { bottom: { style: "thin" } } as Partial<ExcelJS.Borders>,
};

const colors = {
  red: "FFFF0000",
  yellow: "FFFFC000",
  green: "FF92D050",
  gray: "FFD9D9D9",
  orangeLight: "FFFCE4D6",
  textRed: "FFFF0000",
};

const fonts = {
  header: { name: "Cordia New", size: 24, bold: true },
  subHeader: { name: "Cordia New", size: 20, bold: true, color: { argb: colors.textRed } },
  label: { name: "Cordia New", size: 14, bold: true },
  value: { name: "Cordia New", size: 14 },
  small: { name: "Cordia New", size: 12 },
  smallBold: { name: "Cordia New", size: 12, bold: true },
};

export async function exportToExcel(
  sectionThree: any,
  section2_6: any,
  job_id: string,
  isShinaracha: boolean
) {
  showLoading(true);
  try {
    const logoUrl = isShinaracha ? "/images/Logo_Shinaracha.webp" : "/images/Logo_Profire.png";
    const logoBuffer = await loadImage(logoUrl);
    const logoExt = getImageExtension(logoUrl);

    const wb = new ExcelJS.Workbook();
    let defectData: any = {};
    let masterDefects: any[] = [];
    let masterProblems: any[] = [];

    try {
      // 1. ดึงข้อมูล Project
      const response = await fetch("/api/auth/forms/get", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ function: "export_defect", job_id: job_id }),
      });
      if (response.ok) {
        const resJson = await response.json();
        if (resJson.success) defectData = resJson.data || {};
      }

      // 2. ดึงข้อมูล master_defect
      const resMasterDefect = await fetch("/api/auth/legal-regulations/get", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ function: "defect" }),
      });
      if (resMasterDefect.ok) {
        const masterDefectJson = await resMasterDefect.json();
        if (masterDefectJson.success) masterDefects = masterDefectJson.data || [];
      }

      // 3. ดึงข้อมูล master_problem
      const resMasterProb = await fetch("/api/auth/legal-regulations/get", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ function: "problem" }),
      });
      if (resMasterProb.ok) {
        const masterProbJson = await resMasterProb.json();
        if (masterProbJson.success) masterProblems = masterProbJson.data || [];
      }
    } catch (error) {
      console.error("❌ เกิดข้อผิดพลาดในการเรียก API:", error);
    }

    const info = defectData || {};
    const projectName = info.project_name || "-";
    const inspectionDate = info.inspection_date || "-";
    const engineerName = info.engineer_name || "-";
    const address = info.address || "-";
    const phone = info.phone || "-";
    const fax = info.fax || "-";

    // =========================================================
    // 1. รวบรวมข้อมูล Defect จาก Section 3, 8, 9 มาไว้ใน Array เดียว (ต้องทำก่อน Map)
    // =========================================================
    const allDefects: any[] = [];

    // --- 1.1 ดึงจาก Section 3 ---
    const s3Items = sectionThree?.items || {};
    Object.values(s3Items).forEach((itemData: any) => {
      if (itemData.defect_by_visit) {
        Object.values(itemData.defect_by_visit).forEach((defects: any) => {
          if (Array.isArray(defects)) allDefects.push(...defects);
        });
      } else if (Array.isArray(itemData.items)) {
        allDefects.push(...itemData.items);
      }
    });

    // --- Map ชื่อหัวข้อภาษาไทยสำหรับ Section 8 และ 9 ---
    const S8_LABELS: Record<string, string> = {
      "s8-1-foundation": "8. ฐานราก", "s8-1-anchor": "8. การเชื่อมยึดกับฐานราก/อาคาร", "s8-1-part": "8. ชิ้นส่วน", "s8-1-bolt": "8. รอยต่อ - สลักเกลียว", "s8-1-weld": "8. รอยต่อ - การเชื่อม", "s8-1-joint-other": "8. รอยต่อ - อื่น ๆ", "s8-1-sling": "8. สลิง หรือสายยึด", "s8-1-ladder": "8. บันไดขึ้นลง", "s8-1-rail": "8. ราวจับ หรือราวกันตก", "s8-1-catwalk": "8. CATWALK", "s8-1-other": "8. สิ่งที่สร้างขึ้น - อื่น ๆ", "s8-2-panel": "8. สภาพของแผ่นป้าย", "s8-2-fix": "8. สภาพการยึดติดกับโครงสร้าง", "s8-2-other": "8. แผ่นป้าย - อื่น ๆ",
    };
    const S9_LABELS: Record<string, string> = {
      "s9-1-lamp": "9. โคมไฟฟ้า หรือหลอดไฟ", "s9-1-conduit": "9. ท่อร้อยสาย", "s9-1-control": "9. อุปกรณ์ควบคุม", "s9-1-ground": "9. การต่อลงดิน", "s9-1-maint": "9. ตรวจบันทึกการบำรุงรักษาระบบไฟฟ้า", "s9-1-other": "9. ระบบไฟฟ้า - อื่น ๆ", "s9-2-air": "9. ตัวนำล่อฟ้า", "s9-2-down": "9. ตัวนำต่อลงดิน", "s9-2-earth": "9. รากสายดิน", "s9-2-bond": "9. จุดต่อประสานศักย์", "s9-2-maint": "9. ตรวจบันทึกการบำรุงรักษา (ฟ้าผ่า)", "s9-2-other": "9. ระบบป้องกันฟ้าผ่า - อื่น ๆ", "s9-3-sling": "9. สลิง หรือสายยึด", "s9-3-ladder": "9. บันไดขึ้นลง", "s9-3-rail": "9. ราวจับ หรือราวกันตก", "s9-3-catwalk": "9. CATWALK", "s9-3-other": "9. อุปกรณ์ประกอบ - อื่น ๆ",
    };

    // --- 1.2 ดึงจาก Section 8 ---
    const s8Data = sectionThree?.section8 || {};
    Object.entries(s8Data).forEach(([key, row]: [string, any]) => {
      let baseLabel = S8_LABELS[key] || `8. ${key}`;
      if (baseLabel.includes("อื่น ๆ") && row.labelExtra) baseLabel += ` (${row.labelExtra})`;
      if (Array.isArray(row.wear_defects)) row.wear_defects.forEach((d: any) => allDefects.push({ ...d, main_topic: `[ชำรุดสึกหรอ] ${baseLabel}` }));
      if (Array.isArray(row.damage_defects)) row.damage_defects.forEach((d: any) => allDefects.push({ ...d, main_topic: `[ความเสียหาย] ${baseLabel}` }));
    });

    // --- 1.3 ดึงจาก Section 9 ---
    const s9Data = sectionThree?.section9 || {};
    Object.entries(s9Data).forEach(([key, row]: [string, any]) => {
      let baseLabel = S9_LABELS[key] || `9. ${key}`;
      if (baseLabel.includes("อื่น ๆ") && row.labelExtra) baseLabel += ` (${row.labelExtra})`;
      if (Array.isArray(row.wear_defects)) row.wear_defects.forEach((d: any) => allDefects.push({ ...d, main_topic: `[ชำรุดสึกหรอ] ${baseLabel}` }));
      if (Array.isArray(row.damage_defects)) row.damage_defects.forEach((d: any) => allDefects.push({ ...d, main_topic: `[ความเสียหาย] ${baseLabel}` }));
    });

    // =========================================================
    // ✅ เพิ่มใหม่: 1.4 ดึงจาก Section 2.6 (Table 1 และ Table 2)
    // =========================================================
    const s26Table1 = section2_6?.table1 || {};
    Object.values(s26Table1).forEach((itemData: any) => {
      if (itemData.defect_by_visit) {
        Object.values(itemData.defect_by_visit).forEach((defects: any) => {
          if (Array.isArray(defects)) {
            defects.forEach((d: any) => {
              allDefects.push({
                ...d,
                // ใช้ main_topic ที่ส่งมา หรือดึงจาก inspection_item ถ้าไม่มี
                main_topic: d.main_topic || itemData.inspection_item || "ไม่มีชื่อหัวข้อ"
              });
            });
          }
        });
      }
    });

    const s26Table2 = section2_6?.table2 || {};
    Object.values(s26Table2).forEach((itemData: any) => {
      if (itemData.defect_by_visit) {
        Object.values(itemData.defect_by_visit).forEach((defects: any) => {
          if (Array.isArray(defects)) {
            defects.forEach((d: any) => {
              allDefects.push({
                ...d,
                main_topic: d.main_topic || itemData.inspection_item || "ไม่มีชื่อหัวข้อ"
              });
            });
          }
        });
      }
    });

    // =========================================================
    // 2. นำข้อมูลไป Map กับ master_problem -> master_defect
    // =========================================================
    const enrichedDefects = allDefects.map((d: any) => {
      // 1. นำ problem_id ไปหาใน master_problem เพื่อเอา defect (ID ของ master_defect) ออกมา
      // (หมายเหตุ: problem_id อาจจะเป็นคำว่า "other" ได้)
      const probData = masterProblems.find((p: any) => String(p.problem_id) === String(d.problem_id));

      // 2. เตรียมตะกร้าเก็บ ID ของ master_defect ที่เจอ
      const linkedDefectIds = new Set<string>();
      if (probData && probData.defect) linkedDefectIds.add(String(probData.defect));
      if (d.law_id) linkedDefectIds.add(String(d.law_id));
      if (d.standard_id) linkedDefectIds.add(String(d.standard_id));
      if (d.defect_id) linkedDefectIds.add(String(d.defect_id));

      // 3. ค้นหาข้อมูลเต็มๆ จาก master_defect
      const linkedMasters = masterDefects.filter((m: any) => linkedDefectIds.has(String(m.id)));

      // 4. แยกข้อมูล กฎกระทรวง และ วสท.
      const lawData = linkedMasters.find((m: any) => m.type === "กฎกระทรวง");
      const stdData = linkedMasters.find((m: any) => m.type === "วสท.");

      // --- เตรียมข้อมูลช่อง อ้างอิง (Laws / Standard) ---
      const displayLaw = lawData ? lawData.defect : (d.defect_name && d.defect_name !== "-" ? d.defect_name : "-");
      const displayStd = stdData ? stdData.defect : (d.standard_name && d.standard_name !== "-" ? d.standard_name : "-");

      // --- เตรียมข้อมูลช่อง ข้อเสนอแนะ ---
      let displaySuggestion = "-";
      if (lawData && lawData.suggestion) {
        displaySuggestion = lawData.suggestion; // อันดับ 1: กฎกระทรวง (จาก Master)
      } else if (d.illegal_suggestion && d.illegal_suggestion.trim() !== "" && d.illegal_suggestion !== "-") {
        displaySuggestion = d.illegal_suggestion; // อันดับ 2: กฎกระทรวง (ที่กรอกมาในฟอร์ม)
      } else if (stdData && stdData.suggestion) {
        displaySuggestion = stdData.suggestion; // อันดับ 3: วสท. (จาก Master)
      } else if (d.standard_suggestion && d.standard_suggestion.trim() !== "" && d.standard_suggestion !== "-") {
        displaySuggestion = d.standard_suggestion; // อันดับ 4: วสท. (ที่กรอกมาในฟอร์ม)
      } else if (d.note) {
        displaySuggestion = d.note;
      }

      // --- เงื่อนไขแยก Tab (Major / Minor) ---
      // 🚨 หัวใจสำคัญ: จะเป็น Major ก็ต่อเมื่อช่อง "Laws" ไม่เป็นขีด "-" เท่านั้น!
      const isMajor = displayLaw !== "-";

      return {
        ...d,
        display_law: displayLaw,
        display_std: displayStd,
        display_suggestion: displaySuggestion,
        is_major: isMajor
      };
    });

    // =========================================================
    // 3. กรองแยกตู้ (Major / Minor)
    // =========================================================
    const majorDefects = enrichedDefects.filter(d => d.is_major);
    const minorDefects = enrichedDefects.filter(d => !d.is_major);

    const buildRemoteCoverUrl = (name: string) => {
      const baseUrl = process.env.NEXT_PUBLIC_N8N_UPLOAD_FILE || "";
      return `${baseUrl}?name=${encodeURIComponent(name)}`;
    };

    // =========================================================
    // 4. --- ฟังก์ชันสร้าง Layout --- (รับ defectsArray มาวาดด้วย)
    // =========================================================
    const createSheetLayout = async (sheetName: string, titleText: string, defectsArray: any[]) => {
      const ws = wb.addWorksheet(sheetName, {
        views: [{ showGridLines: false }]
      });

      ws.getColumn("A").width = 5;
      ws.getColumn("B").width = 15;
      ws.getColumn("C").width = 18;
      ws.getColumn("D").width = 12;
      ws.getColumn("E").width = 12;
      ws.getColumn("F").width = 12;
      ws.getColumn("G").width = 12;
      ws.getColumn("H").width = 12;
      ws.getColumn("I").width = 12;
      ws.getColumn("J").width = 15;
      ws.getColumn("K").width = 10;

      // ================= HEADER SECTION =================
      ws.mergeCells("B2:K2");
      const title = ws.getCell("B2");
      title.value = "Defect - List Report";
      title.font = fonts.header;
      title.alignment = { horizontal: "center", vertical: "middle" };

      ws.mergeCells("B3:K3");
      const subTitle = ws.getCell("B3");
      subTitle.value = titleText;
      subTitle.font = fonts.subHeader;
      subTitle.alignment = { horizontal: "center", vertical: "middle" };

      if (logoBuffer) {
        const imageId = wb.addImage({ buffer: logoBuffer, extension: logoExt });
        ws.addImage(imageId, {
          tl: { col: 10, row: 0.5 },
          ext: { width: 70, height: 70 },
          editAs: "oneCell"
        });
      }

      // ================= PROJECT INFO =================
      ws.getCell("B4").value = "ชื่อโครงการ :"; ws.getCell("B4").font = fonts.label; ws.getCell("B4").alignment = { horizontal: "right", vertical: "middle" };
      ws.mergeCells("C4:F4"); ws.getCell("C4").value = projectName; ws.getCell("C4").font = fonts.value; ws.getCell("C4").border = { bottom: { style: "dotted" } };

      ws.mergeCells("G4:H4"); ws.getCell("G4").value = "วันที่เข้าตรวจสอบ :"; ws.getCell("G4").font = fonts.label; ws.getCell("G4").alignment = { horizontal: "right", vertical: "middle" };
      ws.mergeCells("I4:K4"); ws.getCell("I4").value = inspectionDate; ws.getCell("I4").font = fonts.value; ws.getCell("I4").border = { bottom: { style: "dotted" } };

      ws.getRow(6).height = 30;
      ws.getCell("B5").value = "ที่ตั้ง :"; ws.getCell("B5").font = fonts.label; ws.getCell("B5").alignment = { horizontal: "right", vertical: "top" };
      ws.mergeCells("C5:F6"); ws.getCell("C5").value = address; ws.getCell("C5").font = fonts.value; ws.getCell("C5").alignment = { vertical: "top", wrapText: true }; ws.getCell("C5").border = { bottom: { style: "dotted" } };

      ws.mergeCells("G5:H5"); ws.getCell("G5").value = "วิศวกรผู้รับผิดชอบโครงการ :"; ws.getCell("G5").font = fonts.label; ws.getCell("G5").alignment = { horizontal: "right", vertical: "middle" };
      ws.mergeCells("I5:J5"); ws.getCell("I5").value = `${engineerName} 📞`; ws.getCell("I5").font = fonts.value; ws.getCell("I5").alignment = { horizontal: "left", vertical: "middle" }; ws.getCell("I5").border = { bottom: { style: "dotted" } };
      ws.getCell("K5").value = "-"; ws.getCell("K5").font = fonts.value; ws.getCell("K5").alignment = { horizontal: "center", vertical: "middle" }; ws.getCell("K5").border = { bottom: { style: "dotted" } };

      ws.getCell("B7").value = "โทร :"; ws.getCell("B7").font = fonts.label; ws.getCell("B7").alignment = { horizontal: "right", vertical: "middle" };
      ws.mergeCells("C7:D7"); ws.getCell("C7").value = phone; ws.getCell("C7").font = fonts.value; ws.getCell("C7").alignment = { horizontal: "left", vertical: "middle" }; ws.getCell("C7").border = { bottom: { style: "dotted" } };

      ws.mergeCells("E7:F7");
      ws.getCell("E7").value = { richText: [{ text: "แฟกซ์ : ", font: { ...fonts.label, bold: true } }, { text: fax, font: fonts.value }] };
      ws.getCell("E7").alignment = { horizontal: "left", vertical: "middle" };
      ws.getCell("E7").border = { bottom: { style: "dotted" } };

      ws.mergeCells("G7:H7"); ws.getCell("G7").value = "วิศวกรผู้ตรวจสอบโครงการ :"; ws.getCell("G7").font = fonts.label; ws.getCell("G7").alignment = { horizontal: "right", vertical: "middle" };
      ws.mergeCells("I7:J7"); ws.getCell("I7").value = `${engineerName} 📞`; ws.getCell("I7").font = fonts.value; ws.getCell("I7").alignment = { horizontal: "left", vertical: "middle" }; ws.getCell("I7").border = { bottom: { style: "dotted" } };
      ws.getCell("K7").value = "-"; ws.getCell("K7").font = fonts.value; ws.getCell("K7").alignment = { horizontal: "center", vertical: "middle" }; ws.getCell("K7").border = { bottom: { style: "dotted" } };

      ws.getCell("B8").value = "อีเมล์ :"; ws.getCell("B8").font = fonts.label; ws.getCell("B8").alignment = { horizontal: "right", vertical: "middle" };
      ws.mergeCells("C8:F8"); ws.getCell("C8").value = "-"; ws.getCell("C8").font = fonts.value; ws.getCell("C8").border = { bottom: { style: "dotted" } };

      // ================= BUILDING INFO & LEGEND =================
      ws.getCell("B9").value = "พื้นที่อาคาร :"; ws.getCell("B9").font = fonts.label; ws.getCell("B9").alignment = { horizontal: "right" };
      ws.getCell("C9").value = "-"; ws.getCell("C9").font = fonts.value; ws.getCell("C9").alignment = { horizontal: "center" }; ws.getCell("C9").border = { bottom: { style: "dotted" } };
      ws.mergeCells("D9:E9"); ws.getCell("D9").value = "ความสูงอาคาร :"; ws.getCell("D9").font = fonts.label; ws.getCell("D9").alignment = { horizontal: "right" };
      ws.getCell("F9").value = "-"; ws.getCell("F9").font = fonts.value; ws.getCell("F9").alignment = { horizontal: "center" }; ws.getCell("F9").border = { bottom: { style: "dotted" } };

      ws.getCell("B10").value = "ชั้นเหนือพื้นดิน :"; ws.getCell("B10").font = fonts.label; ws.getCell("B10").alignment = { horizontal: "right" };
      ws.getCell("C10").value = "-"; ws.getCell("C10").border = { bottom: { style: "dotted" } };
      ws.mergeCells("D10:E10"); ws.getCell("D10").value = "มีชั้นดาดฟ้า"; ws.getCell("D10").font = fonts.value;
      ws.getCell("F10").value = "ชั้นใต้ดิน : -"; ws.getCell("F10").font = fonts.value;

      ws.getCell("B11").value = "ประเภทอาคาร :"; ws.getCell("B11").font = fonts.label; ws.getCell("B11").alignment = { horizontal: "right" };
      ws.mergeCells("C11:F11"); ws.getCell("C11").value = "-"; ws.getCell("C11").border = { bottom: { style: "dotted" } };

      ws.getCell("B12").value = "การตรวจสอบ :"; ws.getCell("B12").font = fonts.label; ws.getCell("B12").alignment = { horizontal: "right" };
      ws.mergeCells("C12:F12"); ws.getCell("C12").value = "การตรวจสอบติดตามการแก้ไขปัญหา   รอบที่ : -"; ws.getCell("C12").border = { bottom: { style: "dotted" } };

      // --- Legend ---
      ws.getCell("G9").value = "ลำดับความเสี่ยง :"; ws.getCell("G9").font = fonts.label;
      ws.mergeCells("J9:K9"); ws.getCell("J9").value = "อ้างอิง :"; ws.getCell("J9").font = fonts.label;

      const setLegendCell = (row: number, col: string, text: string, color: string, desc: string) => {
        const cell = ws.getCell(`${col}${row}`);
        cell.value = text; cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: color } };
        cell.font = { name: "Cordia New", size: 14, bold: true }; cell.alignment = { horizontal: "center", vertical: "middle" }; cell.border = borders.thin;
        const descCell = ws.getCell(`${String.fromCharCode(col.charCodeAt(0) + 1)}${row}`);
        descCell.value = desc; descCell.font = fonts.small; descCell.alignment = { vertical: "middle" }; descCell.border = borders.thin;
      };

      setLegendCell(10, "G", "A", colors.red, "ปัญหาเร่งด่วนต้องรีบแก้ไข"); ws.mergeCells("H10:I10"); ws.getCell("H10").border = borders.thin;
      setLegendCell(11, "G", "B", colors.yellow, "ปัญหาต้องอยู่ในแผนดำเนินการ"); ws.mergeCells("H11:I11"); ws.getCell("H11").border = borders.thin;
      setLegendCell(12, "G", "C", colors.green, "ปัญหาต้องติดตามเฝ้าระวัง"); ws.mergeCells("H12:I12"); ws.getCell("H12").border = borders.thin;

      ws.getCell("J10").value = "Laws"; ws.getCell("J10").fill = { type: "pattern", pattern: "solid", fgColor: { argb: colors.red } }; ws.getCell("J10").font = fonts.smallBold; ws.getCell("J10").alignment = { horizontal: "center", vertical: "middle" }; ws.getCell("J10").border = borders.thin;
      ws.getCell("K10").value = "ปัญหากฎหมาย"; ws.getCell("K10").font = fonts.small; ws.getCell("K10").border = borders.thin;

      ws.getCell("J11").value = "Standard"; ws.getCell("J11").fill = { type: "pattern", pattern: "solid", fgColor: { argb: colors.yellow } }; ws.getCell("J11").font = fonts.smallBold; ws.getCell("J11").alignment = { horizontal: "center", vertical: "middle" }; ws.getCell("J11").border = borders.thin;
      ws.getCell("K11").value = "ปัญหามาตรฐาน"; ws.getCell("K11").font = fonts.small; ws.getCell("K11").border = borders.thin;

      ws.getCell("J12").value = "Comment"; ws.getCell("J12").fill = { type: "pattern", pattern: "solid", fgColor: { argb: colors.green } }; ws.getCell("J12").font = fonts.smallBold; ws.getCell("J12").alignment = { horizontal: "center", vertical: "middle" }; ws.getCell("J12").border = borders.thin;
      ws.getCell("K12").value = "ปัญหาเพิ่มเติม"; ws.getCell("K12").font = fonts.small; ws.getCell("K12").border = borders.thin;

      // ================= DEFECT TABLE =================
      let r = 14;

      ws.getCell(`B${r}`).value = "ลำดับ";
      ws.getCell(`B${r}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: colors.gray } };
      ws.getCell(`B${r}`).font = fonts.label;
      ws.getCell(`B${r}`).alignment = { horizontal: "center", vertical: "middle" };
      ws.getCell(`B${r}`).border = borders.thin;

      ws.mergeCells(`C${r}:K${r}`);
      ws.getCell(`C${r}`).value = "รายละเอียดปัญหาที่พบ";
      ws.getCell(`C${r}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: colors.gray } };
      ws.getCell(`C${r}`).font = fonts.label;
      ws.getCell(`C${r}`).alignment = { horizontal: "center", vertical: "middle" };
      ws.getCell(`C${r}`).border = borders.thin;

      r++;
      let defectIndex = 1;

      // ✅ เปลี่ยนเป็น for...of เพื่อใช้ await ได้
      for (const d of defectsArray) {
        const startRow = r;

        ws.getCell(`B${r}`).value = defectIndex++;
        ws.getCell(`B${r}`).font = fonts.label;
        ws.getCell(`B${r}`).alignment = { vertical: "top", horizontal: "center" };

        ws.getCell(`C${r}`).value = "หัวข้อการตรวจสอบ :";
        ws.getCell(`C${r}`).font = fonts.label;
        ws.getCell(`C${r}`).border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "dotted" } };

        ws.mergeCells(`D${r}:I${r}`);
        ws.getCell(`D${r}`).value = d.main_topic || "ไม่มีชื่อหัวข้อ";
        ws.getCell(`D${r}`).font = fonts.value;
        ws.getCell(`D${r}`).border = { top: { style: "thin" }, bottom: { style: "dotted" } };

        let riskColor = colors.green;
        if (d.risk_level === "A") riskColor = colors.red;
        else if (d.risk_level === "B") riskColor = colors.yellow;

        ws.getCell(`J${r}`).value = "ลำดับความเสี่ยง :";
        ws.getCell(`J${r}`).font = fonts.label;
        ws.getCell(`J${r}`).alignment = { horizontal: "right" };
        ws.getCell(`J${r}`).border = { top: { style: "thin" }, bottom: { style: "dotted" } };

        ws.getCell(`K${r}`).value = d.risk_level || "-";
        ws.getCell(`K${r}`).font = fonts.label;
        ws.getCell(`K${r}`).alignment = { horizontal: "center" };
        if (d.risk_level) ws.getCell(`K${r}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: riskColor } };
        ws.getCell(`K${r}`).border = { top: { style: "thin" }, right: { style: "thin" }, bottom: { style: "dotted" } };

        r++;

        ws.getCell(`C${r}`).value = "บริเวณที่พบปัญหา :";
        ws.getCell(`C${r}`).font = fonts.label;
        ws.getCell(`C${r}`).border = { left: { style: "thin" }, bottom: { style: "dotted" } };

        ws.mergeCells(`D${r}:K${r}`);
        ws.getCell(`D${r}`).value = d.problem_location || "-";
        ws.getCell(`D${r}`).font = fonts.value;
        ws.getCell(`D${r}`).border = { right: { style: "thin" }, bottom: { style: "dotted" } };

        r++;

        ws.getCell(`C${r}`).value = "ปัญหาที่พบ :";
        ws.getCell(`C${r}`).font = fonts.label;
        ws.getCell(`C${r}`).border = { left: { style: "thin" }, bottom: { style: "dotted" } };

        ws.mergeCells(`D${r}:K${r}`);
        const problemName = d.isOther ? `อื่นๆ: ${d.problem_name}` : (d.problem_name || "-");
        ws.getCell(`D${r}`).value = problemName;
        ws.getCell(`D${r}`).font = fonts.value;
        ws.getCell(`D${r}`).border = { right: { style: "thin" }, bottom: { style: "dotted" } };

        r++;

        ws.getCell(`C${r}`).value = "ข้อเสนอแนะ /\nสิ่งที่ต้องแก้ไข";
        ws.getCell(`C${r}`).font = fonts.label;
        ws.getCell(`C${r}`).alignment = { vertical: "top", wrapText: true };
        ws.getCell(`C${r}`).border = { left: { style: "thin" }, bottom: { style: "dotted" } };

        ws.mergeCells(`D${r}:K${r}`);
        ws.getCell(`D${r}`).value = d.display_suggestion;
        ws.getCell(`D${r}`).font = fonts.value;
        ws.getCell(`D${r}`).alignment = { vertical: "top", wrapText: true };
        ws.getCell(`D${r}`).border = { right: { style: "thin" }, bottom: { style: "dotted" } };
        ws.getRow(r).height = 40;

        r++;

        ws.mergeCells(`C${r}:C${r + 2}`);
        ws.getCell(`C${r}`).value = "อ้างอิง :";
        ws.getCell(`C${r}`).font = fonts.label;
        ws.getCell(`C${r}`).alignment = { vertical: "top" };
        ws.getCell(`C${r}`).border = { left: { style: "thin" }, bottom: { style: "dotted" } };

        ws.getCell(`D${r}`).value = "Laws";
        ws.getCell(`D${r}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: colors.red } };
        ws.getCell(`D${r}`).font = fonts.smallBold;
        ws.getCell(`D${r}`).alignment = { horizontal: "center" };
        ws.getCell(`D${r}`).border = borders.dotted;

        ws.mergeCells(`E${r}:K${r}`);
        ws.getCell(`E${r}`).value = d.display_law;
        ws.getCell(`E${r}`).font = fonts.value;
        ws.getCell(`E${r}`).border = { right: { style: "thin" }, bottom: { style: "dotted" } };
        r++;

        ws.getCell(`D${r}`).value = "Standard";
        ws.getCell(`D${r}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: colors.yellow } };
        ws.getCell(`D${r}`).font = fonts.smallBold;
        ws.getCell(`D${r}`).alignment = { horizontal: "center" };
        ws.getCell(`D${r}`).border = borders.dotted;

        ws.mergeCells(`E${r}:K${r}`);
        ws.getCell(`E${r}`).value = d.display_std;
        ws.getCell(`E${r}`).font = fonts.value;
        ws.getCell(`E${r}`).border = { right: { style: "thin" }, bottom: { style: "dotted" } };
        r++;

        ws.getCell(`D${r}`).value = "Comment";
        ws.getCell(`D${r}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: colors.green } };
        ws.getCell(`D${r}`).font = fonts.smallBold;
        ws.getCell(`D${r}`).alignment = { horizontal: "center" };
        ws.getCell(`D${r}`).border = borders.dotted;

        ws.mergeCells(`E${r}:K${r}`);
        ws.getCell(`E${r}`).value = "ข้อเสนอแนะ";
        ws.getCell(`E${r}`).font = fonts.value;
        ws.getCell(`E${r}`).border = { right: { style: "thin" }, bottom: { style: "dotted" } };
        r++;

        // =====================================
        // 8. รูปภาพ : ก่อนปรับปรุง (Before Images)
        // =====================================
        ws.mergeCells(`C${r}:C${r + 3}`);
        ws.getCell(`C${r}`).value = "รูปภาพ :";
        ws.getCell(`C${r}`).font = fonts.label;
        ws.getCell(`C${r}`).alignment = { vertical: "top" };
        ws.getCell(`C${r}`).border = { left: { style: "thin" }, bottom: { style: "thin" } };

        ws.mergeCells(`D${r}:K${r}`);
        ws.getCell(`D${r}`).value = "ก่อนปรับปรุง";
        ws.getCell(`D${r}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: colors.orangeLight } };
        ws.getCell(`D${r}`).font = fonts.label;
        ws.getCell(`D${r}`).alignment = { horizontal: "center" };
        ws.getCell(`D${r}`).border = { right: { style: "thin" }, bottom: { style: "dotted" } };

        r++;

        // 🖼️ แถวสำหรับวางรูปก่อนปรับปรุง
        ws.mergeCells(`D${r}:K${r}`);
        ws.getCell(`D${r}`).border = { right: { style: "thin" }, bottom: { style: "dotted" } };
        ws.getRow(r).height = 110;

        // ลูปดึงรูปภาพ (โหลดสูงสุด 2 รูป)
        if (Array.isArray(d.photos) && d.photos.length > 0) {
          ws.getCell(`D${r}`).value = ""; // เคลียร์ข้อความให้ว่างถ้ามีรูป

          for (let i = 0; i < Math.min(d.photos.length, 2); i++) {
            const photo = d.photos[i];
            if (photo && photo.filename) {
              const imgUrl = buildRemoteCoverUrl(photo.filename);

              const imgBuffer = await loadImage(imgUrl);

              if (imgBuffer) {
                const ext = getImageExtension(photo.filename);
                const imageId = wb.addImage({ buffer: imgBuffer, extension: ext });

                // ตำแหน่งของรูป: รูป 1 ไว้คอลัมน์ E (index 4.5), รูป 2 ไว้คอลัมน์ H (index 7.5)
                const colIndex = i === 0 ? 4.5 : 7.5;

                ws.addImage(imageId, {
                  tl: { col: colIndex, row: r - 1 + 0.1 }, // r-1 คือพิกัดแถว 0-based
                  ext: { width: 130, height: 130 }
                });
              } else {
                // กรณีโหลดไม่สำเร็จ ให้พิมพ์แจ้งบอกไว้ในช่อง
                ws.getCell(`D${r}`).value = `[ โหลดรูปไม่สำเร็จ: ${photo.filename} ]`;
                ws.getCell(`D${r}`).font = { name: "Cordia New", size: 12, color: { argb: colors.red } };
              }
            }
          }
        } else {
          // กรณีไม่มีข้อมูลรูปภาพ
          ws.getCell(`D${r}`).value = "[ ไม่มีรูปภาพประกอบ ]";
          ws.getCell(`D${r}`).alignment = { horizontal: "center", vertical: "middle" };
          ws.getCell(`D${r}`).font = { name: "Cordia New", size: 14, color: { argb: colors.gray } };
        }

        r++;

        // 9. รูปภาพ : หลังปรับปรุง (After Images) - ปล่อยว่างไว้
        ws.mergeCells(`D${r}:K${r}`);
        ws.getCell(`D${r}`).value = "หลังปรับปรุง";
        ws.getCell(`D${r}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: colors.orangeLight } };
        ws.getCell(`D${r}`).font = fonts.label;
        ws.getCell(`D${r}`).alignment = { horizontal: "center" };
        ws.getCell(`D${r}`).border = { right: { style: "thin" }, bottom: { style: "dotted" } };

        r++;

        ws.mergeCells(`D${r}:K${r}`);
        ws.getCell(`D${r}`).value = "[ Image 3 ]           [ Image 4 ]";
        ws.getCell(`D${r}`).alignment = { horizontal: "center", vertical: "middle" };
        ws.getCell(`D${r}`).font = { name: "Cordia New", size: 14, color: { argb: colors.gray } }; // ✅ แยกบรรทัด font ออกมา
        ws.getCell(`D${r}`).border = { right: { style: "thin" }, bottom: { style: "thin" } };
        ws.getRow(r).height = 110;

        r++;

        // 10. Fix Table (Footer of Block)
        ws.getCell(`C${r}`).value = "การแก้ไขข้อบกพร่อง :";
        ws.getCell(`C${r}`).font = fonts.label;
        ws.getCell(`C${r}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: colors.gray } };
        ws.getCell(`C${r}`).border = borders.thin;

        ws.mergeCells(`D${r}:E${r}`);
        ws.getCell(`D${r}`).value = "แผนดำเนินการปรับปรุง";
        ws.getCell(`D${r}`).font = fonts.label;
        ws.getCell(`D${r}`).alignment = { horizontal: "center" };
        ws.getCell(`D${r}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: colors.gray } };
        ws.getCell(`D${r}`).border = borders.thin;

        ws.mergeCells(`F${r}:I${r}`);
        ws.getCell(`F${r}`).value = "สถานะ";
        ws.getCell(`F${r}`).font = fonts.label;
        ws.getCell(`F${r}`).alignment = { horizontal: "center" };
        ws.getCell(`F${r}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: colors.gray } };
        ws.getCell(`F${r}`).border = borders.thin;

        ws.mergeCells(`J${r}:K${r}`);
        ws.getCell(`J${r}`).value = "ผู้รับผิดชอบ";
        ws.getCell(`J${r}`).font = fonts.label;
        ws.getCell(`J${r}`).alignment = { horizontal: "center" };
        ws.getCell(`J${r}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: colors.gray } };
        ws.getCell(`J${r}`).border = borders.thin;

        r++;

        ws.getCell(`C${r}`).value = "";
        ws.getCell(`C${r}`).border = { left: { style: "thin" }, right: { style: "thin" }, bottom: { style: "thin" } };

        ws.getCell(`D${r}`).value = "เริ่มต้น";
        ws.getCell(`D${r}`).alignment = { horizontal: "center" };
        ws.getCell(`D${r}`).border = borders.thin;

        ws.getCell(`E${r}`).value = "สิ้นสุด";
        ws.getCell(`E${r}`).alignment = { horizontal: "center" };
        ws.getCell(`E${r}`).border = borders.thin;

        ws.mergeCells(`F${r}:I${r}`);
        ws.getCell(`F${r}`).value = "เรียบร้อย";
        ws.getCell(`F${r}`).font = fonts.label;
        ws.getCell(`F${r}`).alignment = { horizontal: "center" };
        ws.getCell(`F${r}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: colors.green } };
        ws.getCell(`F${r}`).border = borders.thin;

        ws.mergeCells(`J${r}:K${r}`);
        ws.getCell(`J${r}`).value = "";
        ws.getCell(`J${r}`).border = borders.thin;

        ws.mergeCells(`B${startRow}:B${r}`);
        ws.getCell(`B${startRow}`).border = borders.thin;

        r += 2; // Spacer
      } // End of for...of loop

      // ================= SIGNATURES =================
      ws.mergeCells(`B${r}:K${r}`);
      ws.getCell(`B${r}`).value = "หมายเหตุ :";
      ws.getCell(`B${r}`).font = fonts.label;
      ws.getCell(`B${r}`).border = { bottom: { style: "thin" } };

      ws.mergeCells(`B${r + 1}:K${r + 1}`);
      ws.getCell(`B${r + 1}`).border = { bottom: { style: "thin" } };

      r += 3;

      const signBox = (colStart: string, colEnd: string, title1: string, title2: string, title3: string) => {
        const c1 = colStart.charCodeAt(0);
        const c2 = colEnd.charCodeAt(0);
        for (let i = c1; i <= c2; i++) ws.getCell(`${String.fromCharCode(i)}${r - 1}`).border = { bottom: { style: "thin" } };

        ws.mergeCells(`${colStart}${r}:${colEnd}${r}`);
        ws.getCell(`${colStart}${r}`).value = title1;
        ws.getCell(`${colStart}${r}`).font = { ...fonts.label, bold: true };
        ws.getCell(`${colStart}${r}`).alignment = { horizontal: "center", vertical: "bottom" };
        ws.getCell(`${colEnd}${r}`).border = { right: { style: "thin" } };

        ws.mergeCells(`${colStart}${r + 1}:${colEnd}${r + 1}`);
        ws.getCell(`${colStart}${r + 1}`).value = title2;
        ws.getCell(`${colStart}${r + 1}`).font = fonts.value;
        ws.getCell(`${colStart}${r + 1}`).alignment = { horizontal: "center", vertical: "top" };
        ws.getCell(`${colEnd}${r + 1}`).border = { right: { style: "thin" } };

        ws.mergeCells(`${colStart}${r + 2}:${colEnd}${r + 2}`);
        ws.getCell(`${colStart}${r + 2}`).value = title3;
        ws.getCell(`${colStart}${r + 2}`).font = fonts.value;
        ws.getCell(`${colStart}${r + 2}`).alignment = { horizontal: "center" };
        ws.getCell(`${colEnd}${r + 2}`).border = { right: { style: "thin" } };

        ws.getCell(`${colEnd}${r + 3}`).border = { right: { style: "thin" } };

        ws.mergeCells(`${colStart}${r + 4}:${colEnd}${r + 4}`);
        ws.getCell(`${colStart}${r + 4}`).value = "วันที่          /          /          ";
        ws.getCell(`${colStart}${r + 4}`).font = fonts.value;
        ws.getCell(`${colStart}${r + 4}`).alignment = { horizontal: "center" };
        ws.getCell(`${colEnd}${r + 4}`).border = { right: { style: "thin" } };
      };

      signBox("B", "D", "FN/A", "ผู้ตรวจสอบ", "บริษัท โปรไฟร์ อินสเปคเตอร์ จำกัด");
      signBox("E", "H", "( ชื่อผู้บริหารยอดฮิต )", "กรรมการผู้จัดการ", "บริษัท โปรไฟร์ อินสเปคเตอร์ จำกัด");
      signBox("I", "K", "(                                )", "เจ้าของอาคาร", "");

      return ws;
    };

    // ✅ 5. สั่งสร้างชีท (ใส่ await เพื่อให้รอรูปโหลดเสร็จก่อนเซฟไฟล์)
    await createSheetLayout("Major", "Major", majorDefects);
    await createSheetLayout("Minor", "Minor", minorDefects);

    // Download
    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const now = new Date();
    const dd = String(now.getDate()).padStart(2, "0");
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const yyyy = String(now.getFullYear() + 543);
    const hh = String(now.getHours()).padStart(2, "0");
    const min = String(now.getMinutes()).padStart(2, "0");

    const safeProjectName = projectName && projectName !== "-" ? projectName : "Defect_Report";
    const cleanProjectName = safeProjectName.replace(/[\\/:*?"<>|]/g, "");
    const filename = `${cleanProjectName}_${dd}${mm}${yyyy}_${hh}${min}.xlsx`;

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);

    a.click(); // 👈 สั่งดาวน์โหลดไฟล์

    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);

    // ✅ 1. ปิด Loading เมื่อทุกอย่างเสร็จสมบูรณ์ และไฟล์ถูกโหลดแล้ว
    showLoading(false);

  } catch (error) {
    console.error("❌ เกิดข้อผิดพลาดในการ Export Excel:", error);
    // แจ้งเตือนผู้ใช้ (ถ้ามีฟังก์ชัน showAlert)
    if (typeof showAlert === 'function') {
      showAlert("error", "เกิดข้อผิดพลาดในการดาวน์โหลดไฟล์");
    }

    // ✅ 2. ปิด Loading ทิ้งถ้าเกิด Error (กันหน้าจอค้าง)
    showLoading(false);
  }
}