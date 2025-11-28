/**
 * PPTX Enhancer - Generate supplementary slides for Form 8.1
 * Uses PptxGenJS for tables and photos that can't be handled by Docxtemplater
 */

import type { Form8_1Data } from "@/components/check-form/forms/form1-8/form8-1/types";
import { buildRemoteUrl } from "@/utils/excelShared";

// Helper to get image URL from photo item
const getPhotoUrl = (item: any): string | null => {
  if (!item) return null;
  if (typeof item === "string") {
    if (item.startsWith("http") || item.includes(".")) return item;
    return null;
  }
  const url = item.url || item.src || item.path || item.filename || item.name;
  if (url && (url.startsWith("http") || url.includes("."))) return url;
  return null;
};

// Build full URL for image
const getFullImageUrl = (url: string | null): string | null => {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return buildRemoteUrl(url);
};

/**
 * Generate table slides for Form 8.1 (ข้อ 8, ข้อ 9)
 */
export async function generateTableSlides(form: Form8_1Data): Promise<Blob> {
  console.log("[generateTableSlides] Starting...");
  
  const PptxGenJS = (await import("pptxgenjs")).default;
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "A4", width: 7.5, height: 10 });
  pptx.layout = "A4";
  
  // Get inspection items
  const items = Object.values(form.inspect?.items || {});
  
  // Group items for different tables
  const g1g2Items = items.filter(i => ["g1", "g2"].includes(i.group || ""));
  const g3g4Items = items.filter(i => ["g3", "g4"].includes(i.group || ""));
  const g5Items = items.filter(i => i.group === "g5");
  
  // Slide 1: ข้อ 8 - โครงสร้าง (g1+g2)
  if (g1g2Items.length > 0) {
    const slide1 = pptx.addSlide();
    slide1.addText("ข้อ 8. การตรวจสอบโครงสร้างป้าย", { 
      x: 0.5, y: 0.3, fontSize: 16, bold: true 
    });
    
    const tableData: any[][] = [
      [
        { text: "ลำดับ", options: { bold: true, fill: "E0E0E0" } },
        { text: "รายการ", options: { bold: true, fill: "E0E0E0" } },
        { text: "มี", options: { bold: true, fill: "E0E0E0" } },
        { text: "ไม่มี", options: { bold: true, fill: "E0E0E0" } },
        { text: "ชำรุด", options: { bold: true, fill: "E0E0E0" } },
        { text: "ไม่ชำรุด", options: { bold: true, fill: "E0E0E0" } },
        { text: "ใช้ได้", options: { bold: true, fill: "E0E0E0" } },
        { text: "ใช้ไม่ได้", options: { bold: true, fill: "E0E0E0" } },
        { text: "หมายเหตุ", options: { bold: true, fill: "E0E0E0" } },
      ]
    ];
    
    g1g2Items.forEach((item, idx) => {
      tableData.push([
        { text: String(idx + 1) },
        { text: item.name || item.key || "" },
        { text: item.hasItem ? "☑" : "☐" },
        { text: item.hasItem === false ? "☑" : "☐" },
        { text: item.hasDamage ? "☑" : "☐" },
        { text: item.hasDamage === false ? "☑" : "☐" },
        { text: item.inspectorOpinion === "canUse" ? "☑" : "☐" },
        { text: item.inspectorOpinion === "cannotUse" ? "☑" : "☐" },
        { text: item.note || "" },
      ]);
    });
    
    slide1.addTable(tableData, {
      x: 0.3, y: 0.8, w: 6.9,
      fontSize: 9,
      border: { pt: 0.5, color: "000000" },
      align: "center",
      valign: "middle",
    });
  }
  
  // Slide 2: ข้อ 9 - ระบบ (g3+g4)
  if (g3g4Items.length > 0) {
    const slide2 = pptx.addSlide();
    slide2.addText("ข้อ 9. การตรวจสอบระบบป้าย", { 
      x: 0.5, y: 0.3, fontSize: 16, bold: true 
    });
    
    const tableData: any[][] = [
      [
        { text: "ลำดับ", options: { bold: true, fill: "E0E0E0" } },
        { text: "รายการ", options: { bold: true, fill: "E0E0E0" } },
        { text: "มี", options: { bold: true, fill: "E0E0E0" } },
        { text: "ไม่มี", options: { bold: true, fill: "E0E0E0" } },
        { text: "ชำรุด", options: { bold: true, fill: "E0E0E0" } },
        { text: "ไม่ชำรุด", options: { bold: true, fill: "E0E0E0" } },
        { text: "ใช้ได้", options: { bold: true, fill: "E0E0E0" } },
        { text: "ใช้ไม่ได้", options: { bold: true, fill: "E0E0E0" } },
        { text: "หมายเหตุ", options: { bold: true, fill: "E0E0E0" } },
      ]
    ];
    
    g3g4Items.forEach((item, idx) => {
      tableData.push([
        { text: String(idx + 1) },
        { text: item.name || item.key || "" },
        { text: item.hasItem ? "☑" : "☐" },
        { text: item.hasItem === false ? "☑" : "☐" },
        { text: item.hasDamage ? "☑" : "☐" },
        { text: item.hasDamage === false ? "☑" : "☐" },
        { text: item.inspectorOpinion === "canUse" ? "☑" : "☐" },
        { text: item.inspectorOpinion === "cannotUse" ? "☑" : "☐" },
        { text: item.note || "" },
      ]);
    });
    
    slide2.addTable(tableData, {
      x: 0.3, y: 0.8, w: 6.9,
      fontSize: 9,
      border: { pt: 0.5, color: "000000" },
      align: "center",
      valign: "middle",
    });
  }
  
  const blob = await pptx.write({ outputType: "blob" }) as Blob;
  return blob;
}

/**
 * Generate photo slides for Form 8.1
 */
export async function generatePhotoSlides(form: Form8_1Data): Promise<Blob> {
  console.log("[generatePhotoSlides] Starting...");
  
  const PptxGenJS = (await import("pptxgenjs")).default;
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "A4", width: 7.5, height: 10 });
  pptx.layout = "A4";
  
  const photos = form.photos;
  if (!photos) {
    const slide = pptx.addSlide();
    slide.addText("ไม่มีรูปภาพ", { x: 2, y: 4, fontSize: 24 });
    return await pptx.write({ outputType: "blob" }) as Blob;
  }
  
  // Collect all photos
  const photoList: { label: string; url: string | null }[] = [
    { label: "รูปหน้าปก", url: getFullImageUrl(getPhotoUrl(photos.coverPhoto)) },
    { label: "รูปป้ายหลัก", url: getFullImageUrl(getPhotoUrl(photos.signMainPhoto)) },
  ];
  
  // Set A photos
  (photos.setAPhotos || []).forEach((p, i) => {
    photoList.push({ label: `ชุด A รูปที่ ${i + 1}`, url: getFullImageUrl(getPhotoUrl(p)) });
  });
  
  // Set B photos
  (photos.setBPhotos || []).forEach((p, i) => {
    photoList.push({ label: `ชุด B รูปที่ ${i + 1}`, url: getFullImageUrl(getPhotoUrl(p)) });
  });
  
  // Filter out null URLs
  const validPhotos = photoList.filter(p => p.url);
  
  if (validPhotos.length === 0) {
    const slide = pptx.addSlide();
    slide.addText("ไม่มีรูปภาพ", { x: 2, y: 4, fontSize: 24 });
    return await pptx.write({ outputType: "blob" }) as Blob;
  }
  
  // Create slides with 2 photos per slide
  for (let i = 0; i < validPhotos.length; i += 2) {
    const slide = pptx.addSlide();
    
    // First photo
    const photo1 = validPhotos[i];
    slide.addText(photo1.label, { x: 0.5, y: 0.3, fontSize: 12, bold: true });
    try {
      slide.addImage({
        path: photo1.url!,
        x: 0.5,
        y: 0.6,
        w: 6.5,
        h: 4,
        sizing: { type: "contain", w: 6.5, h: 4 },
      });
    } catch (err) {
      console.warn(`Failed to add image ${photo1.url}:`, err);
      slide.addText(`(ไม่สามารถโหลดรูป: ${photo1.url})`, { x: 0.5, y: 2.5, fontSize: 10, color: "FF0000" });
    }
    
    // Second photo (if exists)
    if (i + 1 < validPhotos.length) {
      const photo2 = validPhotos[i + 1];
      slide.addText(photo2.label, { x: 0.5, y: 5.0, fontSize: 12, bold: true });
      try {
        slide.addImage({
          path: photo2.url!,
          x: 0.5,
          y: 5.3,
          w: 6.5,
          h: 4,
          sizing: { type: "contain", w: 6.5, h: 4 },
        });
      } catch (err) {
        console.warn(`Failed to add image ${photo2.url}:`, err);
        slide.addText(`(ไม่สามารถโหลดรูป: ${photo2.url})`, { x: 0.5, y: 7.0, fontSize: 10, color: "FF0000" });
      }
    }
  }
  
  const blob = await pptx.write({ outputType: "blob" }) as Blob;
  return blob;
}
