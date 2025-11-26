import { Form8_1Data } from "../types";
import { loadTemplate } from "./templateLoader";
import { replacePlaceholders } from "./placeholderReplacer";
import JSZip from "jszip";

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

    // 4. Generate output buffer
    console.log("[generateForm8_1PPTX] Generating output buffer...");
    const outputBuffer = await outputZip.generateAsync({ type: "arraybuffer" });
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

