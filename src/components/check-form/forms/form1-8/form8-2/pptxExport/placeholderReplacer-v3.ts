import JSZip from "jszip";
import { Form8_1Data } from "../types";

/**
 * Escape XML special characters
 */
function escapeXml(str: string): string {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Build flat object of all placeholders from Form8_1Data
 * **IMPORTANT**: This MUST match buildDataContext in src/utils/exportToPptxForm8_1.ts exactly
 * to ensure correct placeholder replacement.
 */
function buildPlaceholderMap(formData: Form8_1Data): Record<string, string> {
  const map: Record<string, string> = {};

  // Helper functions (same as exportToPptxForm8_1.ts)
  const tick = (v?: boolean | null, yes = true) => (v === yes ? "?" : "");
  const mark = (v?: boolean | null) => (v ? "✓" : "");

  // Extract nested objects
  const gen = formData.general || {};
  const report = formData.report || {};
  const signoff = formData.signoff || {};
  const plan = formData.plan || {};
  const tao = (formData.typeAndOwner || {}) as Record<string, any>;
  const owner = (tao.owner || {}) as Record<string, any>;
  const bldOwner = (tao.buildingOwner || {}) as Record<string, any>;
  const designer = (tao.designer || {}) as Record<string, any>;
  const designerBld = (tao.designerBuilding || {}) as Record<string, any>;
  const materials = (formData.materials || {}) as Record<string, any>;

  // Basic info
  map["no"] = formData.form_code || "";

  // Section 10: Header/Report Info (from PPTX cover page)
  map["10year"] = escapeXml(report.year || "");
  map["10inst"] = escapeXml(report.installType || "");
  map["10sign"] = escapeXml(gen.signName || report.signTitle || "");
  map["10comp"] = escapeXml(report.companyName || (gen as any).productName || owner.name || "");
  map["10ownr"] = escapeXml(owner.name || report.companyName || "");
  map["10addr"] = escapeXml(report.companyAddress || "");
  map["10pimg"] = "";

  // Section 12: Main Form Fields - Years and Type (duplicate from 10)
  map["12year"] = escapeXml(report.year || "");
  map["12inst"] = escapeXml(report.installType || "");
  map["12sign"] = escapeXml(gen.signName || report.signTitle || "");
  map["12comp"] = escapeXml(report.companyName || "");
  map["12ownr"] = escapeXml(owner.name || "");
  map["12addr"] = escapeXml(report.companyAddress || "");
  map["12pimg"] = "";

  // Section 12: Photos (URLs for images)
  map["12p1"] = "";
  map["12p2"] = "";
  map["12p3"] = "";
  map["12p4"] = "";
  map["12p5"] = "";
  map["12p6"] = "";
  map["12p7"] = "";
  map["12p8"] = "";
  map["12p9"] = "";
  map["12p10"] = "";
  map["12p11"] = "";
  map["12p12"] = "";

  // Address fields (Tx1-Tx10)
  map["12tx1"] = escapeXml(gen.addressNo || "");
  map["12tx2"] = escapeXml(gen.moo || "");
  map["12tx3"] = escapeXml(gen.alley || "");
  map["12tx4"] = escapeXml(gen.road || "");
  map["12tx5"] = escapeXml(gen.subdistrict || "");
  map["12tx6"] = escapeXml(gen.district || "");
  map["12tx7"] = escapeXml(gen.province || "");
  map["12tx8"] = escapeXml(gen.postalCode || "");
  map["12tx9"] = escapeXml(gen.phoneNo || "");
  map["12tx10"] = escapeXml(gen.fax || "");

  // Permit/Plan section (12rd11-16)
  map["12rd11"] = mark(gen.hasPermitDocument);
  map["12tx12"] = escapeXml(gen.permitIssuedDate || "");
  map["12rd13"] = mark((gen as any).hasOriginalPlan);
  map["12rd14"] = mark((gen as any).missingOriginalPlan);
  map["12tx15"] = escapeXml((gen as any).approxBuddhistYear || (gen as any).ageYears || "");
  map["12rd16"] = mark((gen as any).permitExempt);

  // Additional permit flags
  map["12rdPunk"] = mark((gen as any).permitInfoUnknown);
  map["12rdPlanY"] = mark(gen.hasPlan);
  map["12rdPlanN"] = mark(gen.hasPlan === false);

  // Sign type section (12rd17-20)
  map["12rd17"] = tick(report.installType === "onGround");
  map["12rd18"] = tick(report.installType === "onRoofDeck");
  map["12rd19"] = tick(report.installType === "onFacadePart");
  map["12rd20"] = tick(report.installType === "others");
  map["12tx21"] = escapeXml(tao.otherNote || "");

  // Section 3: Owner/Designer info (12tx22-38)
  map["12tx22"] = escapeXml((gen as any).productName || "");
  map["12tx23"] = escapeXml(owner.name || "");
  map["12tx24"] = escapeXml(owner.address || "");
  map["12tx25"] = escapeXml(owner.phone || "");
  map["12tx26"] = escapeXml(owner.email || "");
  map["12tx27"] = escapeXml(bldOwner.name || "");
  map["12tx28"] = escapeXml(bldOwner.address || "");
  map["12tx29"] = escapeXml(bldOwner.phone || "");
  map["12tx30"] = escapeXml(bldOwner.email || "");
  map["12tx31"] = escapeXml(designer.name || "");
  map["12tx32"] = escapeXml(designer.phone || "");
  map["12tx33"] = escapeXml(designer.licenseNo || "");
  map["12tx34"] = escapeXml(designer.address || "");
  map["12tx35"] = escapeXml(designerBld.name || "");
  map["12tx36"] = escapeXml(designerBld.phone || "");
  map["12tx37"] = escapeXml(designerBld.licenseNo || "");
  map["12tx38"] = escapeXml(designerBld.address || "");

  // Section 4: Materials (12rd39-50, 12tx44, 12tx45, 12tx50)
  map["12rd39"] = mark((materials.structureKinds as any)?.includes("steel"));
  map["12rd40"] = mark((materials.structureKinds as any)?.includes("wood"));
  map["12rd41"] = mark((materials.structureKinds as any)?.includes("stainless"));
  map["12rd42"] = mark((materials.structureKinds as any)?.includes("reinforcedConcrete"));
  map["12rd43"] = mark((materials.structureKinds as any)?.includes("other"));
  map["12tx44"] = escapeXml(materials.openingNote || "");
  map["12rd45"] = mark(materials.flagMaterial);
  map["12tx45"] = escapeXml(materials.surfaceMaterial || "");
  map["12rd46"] = mark(materials.flagFaces);
  map["12tx46"] = escapeXml((gen as any)?.size?.faces || "");
  map["12rd47"] = tick(materials.flagOpening ? materials.hasOpenings === true : false);
  map["12rd48"] = tick(materials.flagOpening ? materials.hasOpenings === false : false);
  map["12rd49"] = mark(materials.flagOpening);
  map["12rd50"] = mark(materials.flagOther);
  map["12tx50"] = escapeXml(materials.otherNote || "");

  // Section 13: Inspection checklist rows 1-7 (13nc1-7, 13ch1-7, 13dt1-7, etc.)
  for (let i = 1; i <= 7; i++) {
    map[`13nc${i}`] = "";
    map[`13ch${i}`] = "";
    map[`13dt${i}`] = "";
    map[`13ok${i}`] = "";
    map[`13ng${i}`] = "";
    map[`13ot${i}`] = "";
    map[`13pr${i}`] = "";
  }

  // Section 13: Matrix - Structural/Base/Anchors rows 1-6 (13mhave1-6, etc.)
  for (let i = 1; i <= 6; i++) {
    map[`13mhave${i}`] = "";
    map[`13mnone${i}`] = "";
    map[`13mdmg${i}`] = "";
    map[`13mnod${i}`] = "";
    map[`13mok${i}`] = "";
    map[`13mng${i}`] = "";
    map[`13mnote${i}`] = "";
  }

  // Section 13: Matrix - Sign/Surface rows 1-5 (13shave1-5, etc.)
  for (let i = 1; i <= 5; i++) {
    map[`13shave${i}`] = "";
    map[`13snone${i}`] = "";
    map[`13sdmg${i}`] = "";
    map[`13snod${i}`] = "";
    map[`13sok${i}`] = "";
    map[`13sng${i}`] = "";
    map[`13snote${i}`] = "";
  }

  // Section 13: Matrix - Electrical rows 1-5 (13ehave1-5, etc.)
  for (let i = 1; i <= 5; i++) {
    map[`13ehave${i}`] = "";
    map[`13enone${i}`] = "";
    map[`13edmg${i}`] = "";
    map[`13enod${i}`] = "";
    map[`13eok${i}`] = "";
    map[`13eng${i}`] = "";
    map[`13enote${i}`] = "";
  }

  // Section 13: Matrix - Lightning rows 1-4 (13lhave1-4, etc.)
  for (let i = 1; i <= 4; i++) {
    map[`13lhave${i}`] = "";
    map[`13lnone${i}`] = "";
    map[`13ldmg${i}`] = "";
    map[`13lnod${i}`] = "";
    map[`13lok${i}`] = "";
    map[`13lng${i}`] = "";
    map[`13lnote${i}`] = "";
  }

  // Section 13: Matrix - Walkway rows 1-4 (13whave1-4, etc.)
  for (let i = 1; i <= 4; i++) {
    map[`13whave${i}`] = "";
    map[`13wnone${i}`] = "";
    map[`13wdmg${i}`] = "";
    map[`13wnod${i}`] = "";
    map[`13wok${i}`] = "";
    map[`13wng${i}`] = "";
    map[`13wnote${i}`] = "";
  }

  // Section 14: Summary results rows 1-5 (14ok1-5, 14ng1-5, 14fx1-5, 14note1-5)
  for (let i = 1; i <= 5; i++) {
    map[`14ok${i}`] = "";
    map[`14ng${i}`] = "";
    map[`14fx${i}`] = "";
    map[`14note${i}`] = "";
  }

  // Section 25: Maintenance frequency rows 1-25 (25m1-25, 25q1-25, etc.)
  for (let i = 1; i <= 25; i++) {
    map[`25m${i}`] = "";
    map[`25q${i}`] = "";
    map[`25s${i}`] = "";
    map[`25y${i}`] = "";
    map[`25t${i}`] = "";
    map[`25note${i}`] = "";
  }

  // Section 27: Maintenance summary rows 1-5 (27ok1-5, 27ng1-5, 27fx1-5, 27note1-5)
  for (let i = 1; i <= 5; i++) {
    map[`27ok${i}`] = "";
    map[`27ng${i}`] = "";
    map[`27fx${i}`] = "";
    map[`27note${i}`] = "";
  }

  // Section 27: Extra fields
  map["27extra"] = escapeXml(signoff.overallConclusion || "");
  map["27signer"] = escapeXml(signoff.inspectorName || "");
  map["27print"] = escapeXml(signoff.inspectorName || "");
  map["27date"] = escapeXml(signoff.inspectionDate || "");

  return map;
}

/**
 * Replace placeholders in PPTX slide XMLs
 * @param zip JSZip instance of PPTX
 * @param formData Form 8.1 data
 */
export async function replacePlaceholders(zip: JSZip, formData: Form8_1Data): Promise<void> {
  console.log("[replacePlaceholders] Starting replacement process...");
  const startTime = performance.now();

  const placeholderMap = buildPlaceholderMap(formData);
  console.log(
    `[replacePlaceholders] Built placeholder map with ${Object.keys(placeholderMap).length} keys:`,
    Object.keys(placeholderMap)
  );

  // Find and update all slide XMLs
  const slideRegex = /^ppt\/slides\/slide\d+\.xml$/;
  let slideCount = 0;
  let totalReplacements = 0;

  for (const [path, file] of Object.entries(zip.files)) {
    if (slideRegex.test(path)) {
      try {
        slideCount++;
        console.log(`[replacePlaceholders] Processing slide ${slideCount}: ${path}`);
        let xmlContent = await file.async("string");
        const originalLength = xmlContent.length;

        // Find all placeholders in this slide
        const allPlaceholdersInXml = xmlContent.match(/\{\{[^}]+\}\}/g) || [];
        console.log(`[replacePlaceholders] Found {{key}} placeholders: ${allPlaceholdersInXml.length}`);

        // Replace all placeholders
        let replacementCount = 0;
        for (const [key, value] of Object.entries(placeholderMap)) {
          const placeholder = `{{${key}}}`;
          const regex = new RegExp(placeholder, "g");
          const matches = xmlContent.match(regex);
          if (matches) {
            replacementCount += matches.length;
            console.log(
              `[replacePlaceholders] Replacing {{${key}}} → "${escapeXml(String(value)).substring(0, 50)}..." (${matches.length} times)`
            );
            xmlContent = xmlContent.replace(regex, escapeXml(String(value)));
          }
        }

        // Update file in ZIP
        zip.file(path, xmlContent);
        totalReplacements += replacementCount;
        console.log(
          `[replacePlaceholders] Updated ${path} - ${replacementCount} replacements, size: ${originalLength} → ${xmlContent.length}`
        );
      } catch (error) {
        console.error(`[replacePlaceholders] Error processing ${path}:`, error);
        throw error;
      }
    }
  }

  const endTime = performance.now();
  console.log(
    `[replacePlaceholders] Completed in ${(endTime - startTime).toFixed(2)}ms, processed ${slideCount} slides, total replacements: ${totalReplacements}`
  );
}

