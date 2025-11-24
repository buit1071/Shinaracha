"use client";
import * as React from "react";
import type { Form8_1General, Form8_1Location, Form8_1Photos } from "./types";
import { buildRemoteUrl, renameWithDateTime, uploadIfNeeded } from "./UploadUtils";
import Main1_Photos from "./Main1_Photos";
import CheckTick from "./ui/CheckTickLocal";

type Props = {
  general?: Partial<Form8_1General>;
  location?: Partial<Form8_1Location>;
  photos?: Partial<Form8_1Photos>;
  onChangeGeneral: (patch: Partial<Form8_1General>) => void;
  onChangeLocation: (patch: Partial<Form8_1Location>) => void;
  onChangePhotos: (patch: Partial<Form8_1Photos>) => void;
};

// Address + Permit section (local state, commit onBlur)
const AddressPermitSection = React.memo(
  ({ general, onChangeGeneral }: { general?: Partial<Form8_1General>; onChangeGeneral: (p: Partial<Form8_1General>) => void }) => {
    const g = general || {};
    const [addr, setAddr] = React.useState({
      addressNo: g.addressNo || "",
      moo: g.moo || "",
      alley: g.alley || "",
      road: g.road || "",
      subdistrict: g.subdistrict || "",
      district: g.district || "",
      province: g.province || "",
      postalCode: g.postalCode || "",
      phoneNo: g.phoneNo || "",
      fax: g.fax || "",
      approxBuddhistYear: g.approxBuddhistYear || "",
      permitIssuedDate: g.permitIssuedDate || "",
    });
    React.useEffect(() => {
      setAddr({
        addressNo: g.addressNo || "",
        moo: g.moo || "",
        alley: g.alley || "",
        road: g.road || "",
        subdistrict: g.subdistrict || "",
        district: g.district || "",
        province: g.province || "",
        postalCode: g.postalCode || "",
        phoneNo: g.phoneNo || "",
        fax: g.fax || "",
        approxBuddhistYear: g.approxBuddhistYear || "",
        permitIssuedDate: g.permitIssuedDate || "",
      });
    }, [g.addressNo, g.moo, g.alley, g.road, g.subdistrict, g.district, g.province, g.postalCode, g.phoneNo, g.fax, g.approxBuddhistYear, g.permitIssuedDate]);

    type PermitChoice = "have" | "none" | "unknown" | "exempt" | "";
    const currentPermitChoice: PermitChoice = ((): PermitChoice => {
      if (g.permitExempt) return "exempt";
      if (g.permitInfoUnknown) return "unknown";
      if (g.hasPermitDocument === true) return "have";
      if (g.hasPermitDocument === false) return "none";
      return "";
    })();
    const pickPermit = (choice: PermitChoice) => {
      onChangeGeneral({
        hasPermitDocument: choice === "have" ? true : choice === "none" ? false : null,
        permitInfoUnknown: choice === "unknown" ? true : false,
        permitExempt: choice === "exempt" ? true : false,
      });
    };
    const setOriginalPlan = (flag: boolean | null) => {
      onChangeGeneral({ hasOriginalPlan: flag, missingOriginalPlan: flag === false ? true : false });
    };

    const commit = (patch: Partial<typeof addr>) => {
      onChangeGeneral(patch as any);
    };

    return (
      <div className="rounded-xl border bg-white p-4 space-y-4 permit-section">
        <div className="font-medium text-gray-800">ข้อมูลที่อยู่/การติดต่อ</div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {([
            ["เลขที่", "addressNo"],
            ["หมู่ที่", "moo"],
            ["ตรอก/ซอย", "alley"],
            ["ถนน", "road"],
            ["ตำบล/แขวง", "subdistrict"],
            ["อำเภอ/เขต", "district"],
            ["จังหวัด", "province"],
            ["รหัสไปรษณีย์", "postalCode"],
            ["โทรศัพท์", "phoneNo"],
            ["โทรสาร", "fax"],
          ] as const).map(([label, key]) => (
            <div key={key} className="flex flex-col gap-1">
              <label className="text-sm text-gray-700">{label}</label>
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                value={(addr as any)[key] as string}
                onChange={(e) => setAddr((p) => ({ ...p, [key]: e.target.value }))}
                onBlur={(e) => commit({ [key]: e.target.value } as any)}
              />
            </div>
          ))}
        </div>

        <div className="pt-2 font-medium text-gray-800">เอกสารประกอบการก่อสร้าง/ใบอนุญาต</div>
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm text-gray-700">สถานะใบอนุญาตติดตั้ง:</span>
            <div className="inline-flex items-center gap-2 text-sm">
              <CheckTick checked={currentPermitChoice === "have"} onChange={() => pickPermit(currentPermitChoice === "have" ? ("" as any) : ("have" as any))} label="มี" />
              <span>มี</span>
            </div>
            <div className="inline-flex items-center gap-2 text-sm">
              <CheckTick checked={currentPermitChoice === "none"} onChange={() => pickPermit(currentPermitChoice === "none" ? ("" as any) : ("none" as any))} label="ไม่มี" />
              <span>ไม่มี</span>
            </div>
            <div className="inline-flex items-center gap-2 text-sm">
              <CheckTick checked={currentPermitChoice === "unknown"} onChange={() => pickPermit(currentPermitChoice === "unknown" ? ("" as any) : ("unknown" as any))} label="ไม่ทราบ" />
              <span>ไม่ทราบ</span>
            </div>
            <div className="inline-flex items-center gap-2 text-sm">
              <CheckTick checked={currentPermitChoice === "exempt"} onChange={() => pickPermit(currentPermitChoice === "exempt" ? ("" as any) : ("exempt" as any))} label="ได้รับการยกเว้น" />
              <span>ได้รับการยกเว้น</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-700">วันที่ออกใบอนุญาต</label>
              <input type="date" className="w-full rounded-lg border border-gray-300 px-3 py-2" value={addr.permitIssuedDate} onChange={(e) => setAddr((p) => ({ ...p, permitIssuedDate: e.target.value }))} onBlur={(e) => commit({ permitIssuedDate: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-700">แบบแปลนเดิม</label>
              <div className="flex items-center gap-4">
                <div className="inline-flex items-center gap-2 text-sm"><CheckTick checked={!!general?.hasOriginalPlan} onChange={() => setOriginalPlan(general?.hasOriginalPlan ? (null as any) : (true as any))} label="มี" /><span>มี</span></div>
                <div className="inline-flex items-center gap-2 text-sm"><CheckTick checked={!!general?.missingOriginalPlan} onChange={() => setOriginalPlan(general?.missingOriginalPlan ? (null as any) : (false as any))} label="ไม่มี" /><span>ไม่มี</span></div>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-700">ปี พ.ศ. (โดยประมาณ)</label>
              <input className="w-full rounded-lg border border-gray-300 px-3 py-2" value={addr.approxBuddhistYear} onChange={(e) => setAddr((p) => ({ ...p, approxBuddhistYear: e.target.value }))} onBlur={(e) => commit({ approxBuddhistYear: e.target.value })} />
            </div>
          </div>
        </div>
      </div>
    );
  },
  (prev, next) => {
    const a = prev.general || {}; const b = next.general || {};
    const keys: (keyof Form8_1General)[] = ["addressNo","moo","alley","road","subdistrict","district","province","postalCode","phoneNo","fax","approxBuddhistYear","permitIssuedDate","hasOriginalPlan","missingOriginalPlan","hasPermitDocument","permitInfoUnknown","permitExempt"];
    return keys.every((k) => (a as any)[k] === (b as any)[k]);
  }
);

export default function Form8_1_Report_1_2({ general, location, photos, onChangeGeneral, onChangeLocation, onChangePhotos }: Props) {
  const g = general || {};
  const loc = location || {};

  // แผนที่/ผัง: จัดการ preview + อัปโหลดเฉพาะที่จำเป็น และเก็บเฉพาะ filename
  const [mapPreview, setMapPreview] = React.useState<string | undefined>(
    loc.mapImageFilename ? buildRemoteUrl(loc.mapImageFilename) : undefined
  );
  const [layoutPreview, setLayoutPreview] = React.useState<string | undefined>(
    loc.layoutImageFilename ? buildRemoteUrl(loc.layoutImageFilename) : undefined
  );
  const [mapFilename, setMapFilename] = React.useState<string | undefined>(loc.mapImageFilename);
  const [layoutFilename, setLayoutFilename] = React.useState<string | undefined>(loc.layoutImageFilename);
  const [loading, setLoading] = React.useState(false);
  const [uploadStatus, setUploadStatus] = React.useState<{ type: "idle" | "success" | "error"; msg?: string }>({ type: "idle" });

  React.useEffect(() => {
    return () => {
      if (mapPreview?.startsWith("blob:")) URL.revokeObjectURL(mapPreview);
      if (layoutPreview?.startsWith("blob:")) URL.revokeObjectURL(layoutPreview);
    };
  }, [mapPreview, layoutPreview]);

  const pick = (key: "map" | "layout", file: File | null) => {
    if (!file) return;
    const { filename } = renameWithDateTime(file);
    const url = URL.createObjectURL(file);
    const tryUpload = async (prev: string, name: string, setPrev: (s: string) => void) => {
      try {
        const ok = await uploadIfNeeded(prev, name);
        if (ok && name) setPrev(buildRemoteUrl(name));
      } catch { /* ignore; pre-save จะอัปโหลดซ้ำ */ }
    };
    if (key === "map") {
      if (mapPreview?.startsWith("blob:")) URL.revokeObjectURL(mapPreview);
      setMapPreview(url);
      setMapFilename(filename);
      void tryUpload(url, filename, setMapPreview);
    } else {
      if (layoutPreview?.startsWith("blob:")) URL.revokeObjectURL(layoutPreview);
      setLayoutPreview(url);
      setLayoutFilename(filename);
      void tryUpload(url, filename, setLayoutPreview);
    }
  };

  const upload = async () => {
    setLoading(true);
    try {
      const ok1 = await uploadIfNeeded(mapPreview, mapFilename || null);
      const ok2 = await uploadIfNeeded(layoutPreview, layoutFilename || null);
      if (!ok1 || !ok2) throw new Error("อัปโหลดไฟล์ไม่สำเร็จ");
      onChangeLocation({
        mapImageFilename: mapFilename || null || undefined,
        layoutImageFilename: layoutFilename || null || undefined,
      });
      if (mapFilename) setMapPreview(buildRemoteUrl(mapFilename));
      if (layoutFilename) setLayoutPreview(buildRemoteUrl(layoutFilename));
      setUploadStatus({ type: "success", msg: "อัปโหลดรูปเรียบร้อย" });
    } catch (e: any) {
      setUploadStatus({ type: "error", msg: e?.message || "อัปโหลดไฟล์ไม่สำเร็จ" });
    } finally {
      setLoading(false);
    }
  };

  // moved to AddressPermitSection

  return (
    <>
    <section className="space-y-6">
      <div className="text-base font-semibold">1.2 ส่วนที่ 2 ข้อมูลป้ายทั่วไป/ผัง-แผนที่</div>

      {/* A) กรอบข้อมูลที่อยู่ + เอกสารประกอบการก่อสร้าง */}
      <AddressPermitSection general={general} onChangeGeneral={onChangeGeneral} />

      {/* B) แผนที่/ผัง (อัปโหลดและเก็บชื่อไฟล์) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="border border-gray-300 rounded-xl p-4 sm:p-6 bg-white">
          <div className="font-medium text-gray-800 text-center mb-3">แผนที่ตั้งอาคาร/พื้นที่ตรวจ</div>
          {mapPreview ? (
            <img src={mapPreview} alt="map" className="w-full h-auto object-contain max-h-[28rem] border border-gray-300 rounded" />
          ) : (
            <div className="w-full h-56 border border-gray-300 rounded flex items-center justify-center text-gray-400">ยังไม่มีภาพแผนที่</div>
          )}
          <div className="mt-3">
            <label className="inline-block px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer">
              เลือกไฟล์แผนที่
              <input type="file" accept="image/*" className="hidden" onChange={(e) => pick("map", e.target.files?.[0] || null)} />
            </label>
            {mapFilename ? <span className="ml-2 text-sm text-gray-600">{mapFilename}</span> : null}
          </div>
        </div>

        <div className="border border-gray-300 rounded-xl p-4 sm:p-6 bg-white">
          <div className="font-medium text-gray-800 text-center mb-3">ผัง/เลย์เอาต์โดยสังเขป</div>
          {layoutPreview ? (
            <img src={layoutPreview} alt="layout" className="w-full h-auto object-contain max-h-[28rem] border border-gray-300 rounded" />
          ) : (
            <div className="w-full h-56 border border-gray-300 rounded flex items-center justify-center text-gray-400">ยังไม่มีภาพผัง</div>
          )}
          <div className="mt-3">
            <label className="inline-block px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer">
              เลือกไฟล์ผัง
              <input type="file" accept="image/*" className="hidden" onChange={(e) => pick("layout", e.target.files?.[0] || null)} />
            </label>
            {layoutFilename ? <span className="ml-2 text-sm text-gray-600">{layoutFilename}</span> : null}
          </div>
        </div>
      </div>
      <div className="flex gap-3">
        <button type="button" onClick={upload} disabled={loading} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">
          {loading ? "กำลังอัปโหลด..." : "อัปโหลดและบันทึกชื่อไฟล์"}
        </button>
        {uploadStatus.type !== "idle" ? (
          <span className={`text-sm ${uploadStatus.type === "success" ? "text-emerald-600" : "text-rose-600"}`}>
            {uploadStatus.msg}
          </span>
        ) : null}
      </div>

      {/* C) รูปภาพอื่น ๆ (ต่อจากแผนที่/ผัง) */}
      <div className="rounded-xl border bg-white p-3">
        <div className="font-medium text-gray-800 mb-2">รูปภาพประกอบ</div>
        <Main1_Photos value={photos} onChange={onChangePhotos} />
      </div>
    </section>
    <style jsx>{`
      .permit-section input[type="radio"],
      .permit-section input[type="checkbox"] {
        accent-color: rgb(2 132 199); /* sky-600 */
        width: 1rem;
        height: 1rem;
      }
      .permit-section label { cursor: pointer; }
    `}</style>
    </>
  );
}



