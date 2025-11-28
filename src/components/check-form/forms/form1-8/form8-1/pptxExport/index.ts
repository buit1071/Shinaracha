import { Form8_1Data } from "../types";
import { loadTemplate } from "./templateLoader";
import { replacePlaceholders } from "./placeholderReplacer";
import JSZip from "jszip";
import { buildRemoteUrl } from "../UploadUtils";
import type { PhotoItem } from "../types";

/**
 * Main export function: Clone template PPTX + replace placeholders with form data
 * @param templatePath Path to template PPTX file
 * @param formData Form 8.1 data to insert into placeholders
 * @returns ArrayBuffer of generated PPTX
 */
export async function generateForm8_1PPTX(
  templatePath: string,
  formData: Form8_1Data
): Promise<ArrayBuffer> {
  const startTime = performance.now();
  console.log("[generateForm8_1PPTX] Starting PPTX generation...");

  try {
    // 1. Load template PPTX into memory
    console.log(`[generateForm8_1PPTX] Loading template from ${templatePath}...`);
    const templateZip = await loadTemplate(templatePath);
    console.log(
      `[generateForm8_1PPTX] Template loaded, contains ${Object.keys(templateZip.files).length} files`
    );

    // 2. Create output ZIP (clone of template)
    console.log("[generateForm8_1PPTX] Cloning template...");
    const outputZip = new JSZip();

    // Copy all files from template to output
    for (const [path, file] of Object.entries(templateZip.files)) {
      if (!path.endsWith("/")) {
        const content = await file.async("arraybuffer");
        outputZip.file(path, content);
      } else {
        outputZip.folder(path);
      }
    }
    console.log("[generateForm8_1PPTX] Template cloned successfully");

    // 3. Replace placeholders in slide XMLs
    console.log("[generateForm8_1PPTX] Replacing placeholders...");
    await replacePlaceholders(outputZip, formData);
    console.log("[generateForm8_1PPTX] Placeholders replaced");

    // 4. Inject images via docxtemplater image module using alt placeholders (e.g., coverImg, mapImg, layoutImg, setA1Img…)
    console.log("[generateForm8_1PPTX] Injecting images with docxtemplater image module...");
    const baseBuffer = await outputZip.generateAsync({ type: "arraybuffer" });
    const outputBuffer = await injectImages(baseBuffer, buildImageContext(formData));
    console.log(
      `[generateForm8_1PPTX] Output buffer generated, size: ${(outputBuffer.byteLength / 1024 / 1024).toFixed(2)} MB`
    );

    const endTime = performance.now();
    console.log(
      `[generateForm8_1PPTX] Completed in ${(endTime - startTime).toFixed(2)}ms`
    );

    return outputBuffer;
  } catch (error) {
    console.error("[generateForm8_1PPTX] Error:", error);
    throw error;
  }
}

export { loadTemplate } from "./templateLoader";
export { replacePlaceholders } from "./placeholderReplacer";

// ---------------- Image helpers ----------------

// Extract URL from photo item (filename -> remote URL, http(s) -> passthrough)
function toPhotoUrl(photo?: PhotoItem | string | null): string {
  if (!photo) return "";
  if (typeof photo === "string") {
    return photo.startsWith("http") ? photo : buildRemoteUrl(photo);
  }
  const obj = photo as Record<string, any>;
  const candidates = [obj.url, obj.src, obj.path, obj.filename, obj.name];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) {
      return c.startsWith("http") ? c : buildRemoteUrl(c);
    }
  }
  return "";
}

// Build context for image placeholders (use alt names in template)
function buildImageContext(form: Form8_1Data): Record<string, string> {
  const photos = form.photos || {};
  const ctx: Record<string, string> = {
    coverImg: toPhotoUrl(photos.coverPhoto),
    mapImg: toPhotoUrl(form.location?.mapImageFilename || (form.location as any)?.mapImageLocal?.preview),
    layoutImg: toPhotoUrl(form.location?.layoutImageFilename || (form.location as any)?.layoutImageLocal?.preview),
    signMainImg: toPhotoUrl(photos.signMainPhoto),
    setA1Img: toPhotoUrl(photos.setAPhotos?.[0]),
    setA2Img: toPhotoUrl(photos.setAPhotos?.[1]),
    setB1Img: toPhotoUrl(photos.setBPhotos?.[0]),
    setB2Img: toPhotoUrl(photos.setBPhotos?.[1]),
    setB3Img: toPhotoUrl(photos.setBPhotos?.[2]),
    setB4Img: toPhotoUrl(photos.setBPhotos?.[3]),
    setB5Img: toPhotoUrl(photos.setBPhotos?.[4]),
    setB6Img: toPhotoUrl(photos.setBPhotos?.[5]),
  };

  // Duplicate mapping for legacy placeholders (12p1-12p12) if templateยังใช้ชื่อเดิม
  ctx["12p1"] = ctx.coverImg || "";
  ctx["12p2"] = ctx.signMainImg || "";
  ctx["12p3"] = ctx.setA1Img || "";
  ctx["12p4"] = ctx.setA2Img || "";
  ctx["12p5"] = ctx.setB1Img || "";
  ctx["12p6"] = ctx.setB2Img || "";
  ctx["12p7"] = ctx.setB3Img || "";
  ctx["12p8"] = ctx.setB4Img || "";
  ctx["12p9"] = ctx.setB5Img || "";
  ctx["12p10"] = ctx.setB6Img || "";
  ctx["12p11"] = "";
  ctx["12p12"] = "";

  return ctx;
}

// Run docxtemplater with image module to inject images
async function injectImages(buffer: ArrayBuffer, data: Record<string, string>): Promise<ArrayBuffer> {
  const [{ default: PizZip }, { default: Docxtemplater }, { default: ImageModule }] = await Promise.all([
    import("pizzip"),
    import("docxtemplater"),
    import("docxtemplater-image-module-free"),
  ]);

  const imageModule = new (ImageModule as any)({
    fileType: "pptx",
    centered: false,
    getImage: async (tagValue: any) => {
      const url = String(tagValue || "").trim();
      if (!url) return null;
      try {
        if (url.startsWith("data:")) {
          const res = await fetch(url);
          return await res.arrayBuffer();
        }
        const resp = await fetch(url);
        if (!resp.ok) return null;
        return await resp.arrayBuffer();
      } catch {
        return null;
      }
    },
    getSize: () => [600, 400], // default px size; template scaling will apply
  });

  const zip = new PizZip(buffer);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    nullGetter: () => "",
  });
  doc.attachModule(imageModule);
  doc.setData(data);
  doc.render();

  return doc.getZip().generateAsync({ type: "arraybuffer" });
}
