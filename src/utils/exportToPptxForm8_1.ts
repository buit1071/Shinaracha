import { showLoading } from "@/lib/loading";
import { showAlert } from "@/lib/fetcher";
import { buildRemoteUrl } from "@/components/check-form/forms/form1-8/form8-1/UploadUtils";
import type {
  Form8_1Data,
  Form8_1Plan,
  Form8_1General,
  PhotoItem,
  Form8_1Photos,
  Section3Item,
} from "@/components/check-form/forms/form1-8/form8-1/types";

type AnyObj = Record<string, any>;

const toUrl = (p?: PhotoItem | null) => {
  if (!p?.url) return "";
  return /^https?:\/\//i.test(p.url) ? p.url : buildRemoteUrl(p.url);
};

const mapPhotos = (photos?: Form8_1Photos) => {
  const p = photos || {};
  return {
    header: toUrl((p as AnyObj).headerImage),
    cover: toUrl(p.coverPhoto),
    signMain: toUrl(p.signMainPhoto),
    setA1: toUrl(p.setAPhotos?.[0]),
    setA2: toUrl(p.setAPhotos?.[1]),
    setB1: toUrl(p.setBPhotos?.[0]),
    setB2: toUrl(p.setBPhotos?.[1]),
    setB3: toUrl(p.setBPhotos?.[2]),
    setB4: toUrl(p.setBPhotos?.[3]),
    setB5: toUrl(p.setBPhotos?.[4]),
    setB6: toUrl(p.setBPhotos?.[5]),
  };
};

const mapGeneralShort = (g?: Form8_1General) => ({
  gNo: g?.addressNo ?? "",
  gMoo: g?.moo ?? "",
  gAlley: g?.alley ?? "",
  gRoad: g?.road ?? "",
  gSub: g?.subdistrict ?? "",
  gDist: g?.district ?? "",
  gProv: g?.province ?? "",
  gPost: g?.postalCode ?? "",
  gTel: g?.phoneNo ?? "",
  gFax: g?.fax ?? "",
});

const sortInspectItems = (items: Record<string, Section3Item> = {}) => {
  const arr = Object.values(items || {});
  return arr.sort((a, b) => {
    const na = Number(String(a?.key ?? "").replace(/[^\d]/g, "")) || 0;
    const nb = Number(String(b?.key ?? "").replace(/[^\d]/g, "")) || 0;
    return na - nb;
  });
};

const mapShortCheckboxes = (inspect: Form8_1Data["inspect"]) => {
  const rows = sortInspectItems(inspect?.items).slice(0, 4); // รองรับ 4 แถวแรกตามเทมเพลต
  const out: AnyObj = {};
  rows.forEach((r, idx) => {
    const i = idx + 1;
    out[`ch${i}`] = r?.hasChange ? "?" : "";
    out[`nc${i}`] = r?.noChange ? "?" : "";
    out[`note${i}`] = r?.note ?? r?.changeDetailNote ?? "";
    out[`ok${i}`] = r?.inspectorOpinion === "canUse" ? "?" : "";
    out[`ng${i}`] = r?.inspectorOpinion === "cannotUse" ? "?" : "";
    out[`na${i}`] = !r?.inspectorOpinion ? "?" : "";
    out[`other${i}`] = (r as AnyObj)?.otherNote ?? "";
  });
  return out;
};

const buildDataContext = (form: Form8_1Data): AnyObj => {
  const photos = mapPhotos(form.photos);
  const location = {
    map: buildRemoteUrl(form.location?.mapImageFilename || ""),
    layout: buildRemoteUrl(form.location?.layoutImageFilename || ""),
    coordinate: form.location?.coordinate || {},
  };
    const tick = (v?: boolean | null, yes = true) => (v === yes ? "?" : "");
  return {
    ...form,
    photos,
    location,
    ...mapGeneralShort(form.general),
    ...mapShortCheckboxes(form.inspect),
    // legacy/template alias keys
    hpY: tick(form.general?.hasPermitDocument),
    hpN: tick(form.general?.hasPermitDocument, false),
    planY: tick(form.general?.hasPlan),
    planN: tick(form.general?.hasPlan, false),
    unknown: tick((form.general as AnyObj)?.permitInfoUnknown ?? null),
    permitDate: form.general?.permitIssuedDate ?? "",
    approxYear: form.general?.approxBuddhistYear ?? form.general?.ageYears ?? "",
    pMain: photos.signMain,
    pA1: photos.setA1,
    pA2: photos.setA2,
    g1: photos.setB1,
    g2: photos.setB2,
    g3: photos.setB3,
    g4: photos.setB4,
    g5: photos.setB5,
    g6: photos.setB6,
  };
};

const fetchTemplate = async () => {
  // พยายามโหลดจาก API ก่อน แล้ว fallback ไป path public/templates
  let buf: ArrayBuffer | null = null;
  try {
    const res = await fetch(`/api/export/pptx/template/get?name=${encodeURIComponent("Form1-8.1.pptx")}`);
    if (res.ok) buf = await res.arrayBuffer();
  } catch (err) {
    console.warn("load template from api failed", err);
  }
  if (!buf) {
    const res = await fetch("/templates/Form1-8.1.pptx");
    if (!res.ok) throw new Error("ไม่พบไฟล์เทมเพลต Form1-8.1.pptx");
    buf = await res.arrayBuffer();
  }
  return buf;
};

const getImageModule = async () => {
  const ImageModule = (await import("docxtemplater-image-module-free")).default as any;
  return new ImageModule({
    centered: false,
    fileType: "pptx",
    getImage: async (tag: any) => {
      const url = String(tag || "");
      if (!url) return null;
      const resp = await fetch(url);
      return await resp.arrayBuffer();
    },
    getSize: () => [640, 360],
  });
};

export async function exportToPptxForm8_1(form: Partial<Form8_1Data> | null | undefined) {
  if (!form) {
    void showAlert("warning", "ไม่พบข้อมูลฟอร์ม");
    return;
  }
  showLoading(true);
  try {
    const templateBuf = await fetchTemplate();
    const [{ default: PizZip }, { default: Docxtemplater }] = await Promise.all([
      import("pizzip"),
      import("docxtemplater"),
    ]);
    const imageModule = await getImageModule();
    const zip = new PizZip(templateBuf);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: { start: "{{", end: "}}" },
      modules: [imageModule],
    });

    const dataCtx = buildDataContext(form as Form8_1Data);
    doc.render(dataCtx);

    const blob = doc.getZip().generate({
      type: "blob",
      mimeType:
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    });
    const fileName = `Form8_1_${form.report?.signTitle ?? "report"}_${Date.now()}.pptx`;
    // trigger download (anchor), fallback file-saver/msSaveOrOpenBlob
    let downloaded = false;
    try {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 0);
      downloaded = true;
    } catch (err) {
      console.warn("anchor download failed", err);
    }

    if (!downloaded) {
      // fallback file-saver หรือ msSave
      try {
        if (typeof (window as any).navigator?.msSaveOrOpenBlob === "function") {
          (window as any).navigator.msSaveOrOpenBlob(blob, fileName);
          downloaded = true;
        } else {
          const { saveAs } = await import("file-saver");
          saveAs(blob, fileName);
          downloaded = true;
        }
      } catch (err) {
        console.error("fallback download failed", err);
        throw err;
      }
    }
  } catch (err: any) {
    console.error(err);
    void showAlert("error", err?.message || "Export PPTX ไม่สำเร็จ");
  } finally {
    showLoading(false);
  }
}

