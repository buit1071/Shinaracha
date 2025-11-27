import JSZip from "jszip";

/**
 * Load template PPTX file into JSZip via fetch
 * @param templatePath Path to template PPTX file (relative to public folder or absolute URL)
 * @returns JSZip instance of template
 */
export async function loadTemplate(templatePath: string): Promise<JSZip> {
  try {
    // Construct fetch URL - if templatePath doesn't start with http, assume it's relative to public folder
    const fetchUrl = templatePath.startsWith("http")
      ? templatePath
      : `/${templatePath.startsWith("/") ? templatePath.slice(1) : templatePath}`;

    const response = await fetch(fetchUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    const zip = await JSZip.loadAsync(buffer);
    console.log(`[loadTemplate] Loaded template from ${fetchUrl}`);
    return zip;
  } catch (error) {
    console.error(`[loadTemplate] Error loading template from ${templatePath}:`, error);
    throw new Error(
      `Failed to load PPTX template: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}


