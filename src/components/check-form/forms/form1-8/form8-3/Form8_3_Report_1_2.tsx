"use client";

import * as React from "react";
import type {
  Form8_1General,
  Form8_1Location,
  Form8_1Photos,
  Form8_1TypeAndOwner,
  Form8_1Materials,
  Form8_1Report,
  PartyInfo,
  MaterialKind,
} from "./types";
import { buildRemoteUrl, renameWithDateTime } from "./UploadUtils";
import Main1_Photos from "./Main1_Photos";
import CheckTick from "./ui/CheckTickLocal";

type Props = {
  general?: Partial<Form8_1General>;
  location?: Partial<Form8_1Location>;
  photos?: Partial<Form8_1Photos>;
  typeAndOwner?: Partial<Form8_1TypeAndOwner>;
  materials?: Partial<Form8_1Materials>;
  installType?: Form8_1Report["installType"];
  onChangeGeneral: (patch: Partial<Form8_1General>) => void;
  onChangeLocation: (patch: Partial<Form8_1Location>) => void;
  onChangePhotos: (patch: Partial<Form8_1Photos>) => void;
  onChangeTypeAndOwner: (patch: Partial<Form8_1TypeAndOwner>) => void;
  onChangeMaterials: (patch: Partial<Form8_1Materials>) => void;
  onChangeInstallType: (installType: Form8_1Report["installType"] | undefined) => void;
};

const SectionCard = React.memo(function SectionCard({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`border border-gray-300 rounded-xl p-4 sm:p-6 bg-white space-y-3 ${className}`}>
      <div className="font-semibold text-gray-800">{title}</div>
      {children}
    </div>
  );
});

// 1) ที่ตั้ง + ใบอนุญาต
const AddressPermitSection = React.memo(function AddressPermitSection({
  general,
  onChangeGeneral,
}: {
  general?: Partial<Form8_1General>;
  onChangeGeneral: (patch: Partial<Form8_1General>) => void;
}) {
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
      <div className="font-medium text-gray-800">ข้อมูลที่ตั้ง/ใบอนุญาต</div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {([
          ["เลขที่", "addressNo"],
          ["หมู่ที่", "moo"],
          ["ซอย/ตรอก", "alley"],
          ["ถนน", "road"],
          ["แขวง/ตำบล", "subdistrict"],
          ["เขต/อำเภอ", "district"],
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

      <div className="space-y-3 pt-2">
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-700">มีข้อมูลการได้รับใบอนุญาตก่อสร้างจากเจ้าพนักงานท้องถิ่น</label>
          <div className="flex items-center gap-2">
            <CheckTick checked={currentPermitChoice === "have"} onChange={() => pickPermit(currentPermitChoice === "have" ? ("" as any) : ("have" as any))} label="มีข้อมูลใบอนุญาต" />
            <span className="text-sm text-gray-700">ได้รับใบอนุญาตก่อสร้างจากเจ้าพนักงานท้องถิ่น เมื่อวันที่</span>
            <input
              type="date"
              className="rounded-lg border border-gray-300 px-3 py-2"
              value={addr.permitIssuedDate}
              onChange={(e) => setAddr((p) => ({ ...p, permitIssuedDate: e.target.value }))}
              onBlur={(e) => commit({ permitIssuedDate: e.target.value })}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <CheckTick checked={!!general?.hasOriginalPlan} onChange={() => setOriginalPlan(general?.hasOriginalPlan ? (null as any) : (true as any))} label="มี แบบแปลนเดิม" />
            <span className="text-sm text-gray-700">มี แบบแปลนเดิม</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckTick checked={!!general?.missingOriginalPlan} onChange={() => setOriginalPlan(general?.missingOriginalPlan ? (null as any) : (false as any))} label="ไม่มี แบบแปลนเดิม" />
            <span className="text-sm text-gray-700">
              ไม่มี แบบแปลนเดิม (กรณีที่ไม่มีแบบแปลนหรือแผนผังรายการเกี่ยวกับการก่อสร้าง ให้เจ้าของป้ายจัดหาหรือจัดทำแบบแปลนสำหรับใช้ในการตรวจสอบป้ายและอุปกรณ์ประกอบของป้ายให้กับผู้ตรวจสอบอาคาร)
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-start gap-2">
            <CheckTick checked={currentPermitChoice === "unknown"} onChange={() => pickPermit(currentPermitChoice === "unknown" ? ("" as any) : ("unknown" as any))} label="ไม่มีข้อมูลใบอนุญาต" />
            <span className="text-sm text-gray-700">ไม่มี ข้อมูลการได้รับใบอนุญาตก่อสร้างจากเจ้าพนักงานท้องถิ่น</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-700">
              อายุของป้าย {Number.isFinite(Number(addr.approxBuddhistYear)) ? Math.max((new Date().getFullYear() + 543) - Number(addr.approxBuddhistYear), 0) : "-"} ปี (คำนวณจาก พ.ศ.)
            </span>
            <input
              className="rounded-lg border border-gray-300 px-3 py-2"
              placeholder="กรอกปี พ.ศ."
              value={addr.approxBuddhistYear}
              onChange={(e) => setAddr((p) => ({ ...p, approxBuddhistYear: e.target.value }))}
              onBlur={(e) => commit({ approxBuddhistYear: e.target.value })}
            />
          </div>
        </div>

        <div className="flex items-start gap-2">
          <CheckTick checked={currentPermitChoice === "exempt"} onChange={() => pickPermit(currentPermitChoice === "exempt" ? ("" as any) : ("exempt" as any))} label="ป้ายไม่เข้าข่ายต้องขออนุญาตก่อสร้าง" />
          <span className="text-sm text-gray-700">ป้ายไม่เข้าข่ายต้องขออนุญาตก่อสร้าง **</span>
        </div>
      </div>
    </div>
  );
}, (prev, next) => {
  const a = prev.general || {}; const b = next.general || {};
  const keys: (keyof Form8_1General)[] = ["addressNo","moo","alley","road","subdistrict","district","province","postalCode","phoneNo","fax","approxBuddhistYear","permitIssuedDate","hasOriginalPlan","missingOriginalPlan","hasPermitDocument","permitInfoUnknown","permitExempt"];
  return keys.every((k) => (a as any)[k] === (b as any)[k]);
});

// 2) ประเภทป้าย + เจ้าของ + ผู้ออกแบบ
const TypeOwnerSection = React.memo(function TypeOwnerSection({
  installType,
  onChangeInstallType,
  typeAndOwner,
  onChangeTypeAndOwner,
  onChangeGeneral,
  general,
}: {
  installType?: Form8_1Report["installType"];
  onChangeInstallType: (v: Form8_1Report["installType"] | undefined) => void;
  typeAndOwner?: Partial<Form8_1TypeAndOwner>;
  onChangeTypeAndOwner: (p: Partial<Form8_1TypeAndOwner>) => void;
  onChangeGeneral: (p: Partial<Form8_1General>) => void;
  general?: Partial<Form8_1General>;
}) {
  const tao = typeAndOwner || { categories: [] };
  const handleInstallType = React.useCallback((v: Form8_1Report["installType"]) => {
    onChangeInstallType(installType === v ? undefined : v);
  }, [installType, onChangeInstallType]);

  const updateParty = React.useCallback((party: "owner" | "buildingOwner" | "designer" | "designerBuilding", field: keyof PartyInfo, value: string) => {
    onChangeTypeAndOwner({
      [party]: { ...(tao as any)[party], [field]: value },
    } as any);
  }, [onChangeTypeAndOwner, tao]);

  const showBuildingOwner = installType && installType !== "onGround";

  return (
    <div className="grid grid-cols-1 gap-4">
      <SectionCard title="2. ประเภทของป้าย" className="min-h-[200px]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {[
            { v: "onGround", t: "ป้ายติดตั้งบนพื้นดิน" },
            { v: "onRoofDeck", t: "ป้ายบนดาดฟ้า/หลังคา" },
            { v: "onFacadePart", t: "ป้ายบนผนังส่วนใดของอาคาร" },
            { v: "others", t: "อื่น ๆ (โปรดระบุ)" },
          ].map((opt) => (
            <label key={opt.v} className="inline-flex items-center gap-2 text-sm text-gray-800">
              <CheckTick
                size="md"
                checked={installType === opt.v}
                onChange={() => handleInstallType(opt.v as any)}
                label={opt.t}
              />
              <span>{opt.t}</span>
            </label>
          ))}
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">อื่น ๆ (โปรดระบุ)</label>
          <input
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
            value={tao.otherNote || ""}
            onChange={(e) => onChangeTypeAndOwner({ otherNote: e.target.value })}
          />
        </div>
      </SectionCard>

      <SectionCard title="3. ชื่อเจ้าของหรือผู้ครอบครองป้าย และผู้ออกแบบด้านวิศวกรรมโครงสร้าง" className="min-h-[280px]">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">3.1 ชื่อผลิตภัณฑ์โฆษณาหรือข้อความในป้าย</label>
          <input
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
            value={(general || {})?.productName || ""}
            onChange={(e) => onChangeGeneral({ productName: e.target.value } as any)}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="font-medium text-gray-800">3.2 ชื่อเจ้าของหรือผู้ครอบครองป้าย</div>
            <input className="w-full rounded-lg border border-gray-300 px-3 py-2" placeholder="ชื่อ" value={tao.owner?.name || ""} onChange={(e) => updateParty("owner", "name", e.target.value)} />
            <textarea className="w-full rounded-lg border border-gray-300 px-3 py-2 min-h-20" placeholder="ที่อยู่" value={tao.owner?.address || ""} onChange={(e) => updateParty("owner", "address", e.target.value)} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input className="rounded-lg border border-gray-300 px-3 py-2" placeholder="โทรศัพท์" value={tao.owner?.phone || ""} onChange={(e) => updateParty("owner", "phone", e.target.value)} />
              <input className="rounded-lg border border-gray-300 px-3 py-2" placeholder="โทรสาร/อีเมล" value={tao.owner?.email || ""} onChange={(e) => updateParty("owner", "email", e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <div className="font-medium text-gray-800">{showBuildingOwner ? "3.3 ชื่อเจ้าของ/ผู้ครอบครองอาคารที่ป้ายตั้งอยู่" : "3.3 ชื่อเจ้าของ/ผู้ครอบครองอาคารที่ป้ายตั้งอยู่ (ถ้ามี)"}</div>
            <input className="w-full rounded-lg border border-gray-300 px-3 py-2" placeholder="ชื่อ" value={(tao as any)?.buildingOwner?.name || ""} onChange={(e) => updateParty("buildingOwner", "name", e.target.value)} disabled={!showBuildingOwner} />
            <textarea className="w-full rounded-lg border border-gray-300 px-3 py-2 min-h-20" placeholder="ที่อยู่" value={(tao as any)?.buildingOwner?.address || ""} onChange={(e) => updateParty("buildingOwner", "address", e.target.value)} disabled={!showBuildingOwner} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input className="rounded-lg border border-gray-300 px-3 py-2" placeholder="โทรศัพท์" value={(tao as any)?.buildingOwner?.phone || ""} onChange={(e) => updateParty("buildingOwner", "phone", e.target.value)} disabled={!showBuildingOwner} />
              <input className="rounded-lg border border-gray-300 px-3 py-2" placeholder="โทรสาร/อีเมล" value={(tao as any)?.buildingOwner?.email || ""} onChange={(e) => updateParty("buildingOwner", "email", e.target.value)} disabled={!showBuildingOwner} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="font-medium text-gray-800">3.4 ชื่อผู้ออกแบบด้านวิศวกรรมโครงสร้าง</div>
            <input className="w-full rounded-lg border border-gray-300 px-3 py-2" placeholder="ชื่อ" value={tao.designer?.name || ""} onChange={(e) => updateParty("designer", "name", e.target.value)} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input className="rounded-lg border border-gray-300 px-3 py-2" placeholder="โทรศัพท์" value={tao.designer?.phone || ""} onChange={(e) => updateParty("designer", "phone", e.target.value)} />
              <input className="rounded-lg border border-gray-300 px-3 py-2" placeholder="ใบอนุญาตเลขที่" value={tao.designer?.licenseNo || ""} onChange={(e) => updateParty("designer", "licenseNo", e.target.value)} />
            </div>
            <textarea className="w-full rounded-lg border border-gray-300 px-3 py-2 min-h-20" placeholder="ที่อยู่" value={tao.designer?.address || ""} onChange={(e) => updateParty("designer", "address", e.target.value)} />
          </div>

          <div className="space-y-2">
            <div className="font-medium text-gray-800">3.5 ชื่อผู้ออกแบบด้านวิศวกรรมโครงสร้างของอาคารที่ป้ายตั้งอยู่ (ถ้ามี)</div>
            <input className="w-full rounded-lg border border-gray-300 px-3 py-2" placeholder="ชื่อ" value={(tao as any)?.designerBuilding?.name || ""} onChange={(e) => updateParty("designerBuilding", "name", e.target.value)} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input className="rounded-lg border border-gray-300 px-3 py-2" placeholder="โทรศัพท์" value={(tao as any)?.designerBuilding?.phone || ""} onChange={(e) => updateParty("designerBuilding", "phone", e.target.value)} />
              <input className="rounded-lg border border-gray-300 px-3 py-2" placeholder="ใบอนุญาตเลขที่" value={(tao as any)?.designerBuilding?.licenseNo || ""} onChange={(e) => updateParty("designerBuilding", "licenseNo", e.target.value)} />
            </div>
            <textarea className="w-full rounded-lg border border-gray-300 px-3 py-2 min-h-20" placeholder="ที่อยู่" value={(tao as any)?.designerBuilding?.address || ""} onChange={(e) => updateParty("designerBuilding", "address", e.target.value)} />
          </div>
        </div>
      </SectionCard>
    </div>
  );
});

// 3) วัสดุ
const MaterialsSection = React.memo(function MaterialsSection({
  materials,
  onChangeMaterials,
  general,
  onChangeGeneral,
}: {
  materials?: Partial<Form8_1Materials>;
  onChangeMaterials: (p: Partial<Form8_1Materials>) => void;
  general?: Partial<Form8_1General>;
  onChangeGeneral: (p: Partial<Form8_1General>) => void;
}) {
  const mats = materials || { structureKinds: [] };

  const toggleStructureKind = React.useCallback((kind: MaterialKind) => {
    const next = new Set(mats.structureKinds || []);
    if (next.has(kind)) next.delete(kind);
    else next.add(kind);
    onChangeMaterials({ structureKinds: Array.from(next) as any });
  }, [mats.structureKinds, onChangeMaterials]);

  const setFaces = React.useCallback((val: string) => {
    onChangeGeneral({
      size: {
        ...(general?.size || {}),
        faces: val === "" ? null : Number(val),
      },
    });
  }, [general?.size, onChangeGeneral]);

  const setHasOpenings = React.useCallback((val: boolean | null) => {
    onChangeMaterials({ hasOpenings: val, flagOpening: val === null ? mats.flagOpening : true });
  }, [mats.flagOpening, onChangeMaterials]);

  return (
    <SectionCard title="4. ประเภทวัสดุและรายละเอียดของแผ่นป้าย" className="min-h-[260px]">
      <div className="space-y-2">
        <div className="font-medium text-gray-800">4.1 ประเภทวัสดุของโครงสร้างที่รับน้ำหนักของตัวป้าย (เลือกได้มากกว่า 1)</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {([
            { v: "steel", t: "เหล็กโครงสร้างรูปพรรณ" },
            { v: "wood", t: "ไม้" },
            { v: "stainless", t: "สแตนเลส" },
            { v: "reinforcedConcrete", t: "คอนกรีตเสริมเหล็ก" },
            { v: "other", t: "อื่น ๆ (โปรดระบุ)" },
          ] as const).map((opt) => (
            <label key={opt.v} className="inline-flex items-center gap-2 text-sm text-gray-800">
              <CheckTick
                size="md"
                checked={Boolean(mats.structureKinds?.includes(opt.v as MaterialKind))}
                onChange={() => toggleStructureKind(opt.v as MaterialKind)}
                label={opt.t}
              />
              <span>{opt.t}</span>
            </label>
          ))}
        </div>
        <input className="w-full rounded-lg border border-gray-300 px-3 py-2" placeholder="อื่น ๆ (โปรดระบุ)" value={mats.openingNote || ""} onChange={(e) => onChangeMaterials({ openingNote: e.target.value })} />
      </div>

      <div className="space-y-3">
        <div className="font-medium text-gray-800">4.2 รายละเอียดของแผ่นป้าย</div>

        <div className="flex items-start gap-3">
          <CheckTick size="md" checked={!!mats.flagMaterial} onChange={() => onChangeMaterials({ flagMaterial: !mats.flagMaterial })} label="วัสดุผิวป้าย" />
          <div className="flex flex-col gap-1 w-full">
            <label className="text-sm font-medium text-gray-700">วัสดุผิวป้าย (โปรดระบุ)</label>
            <input className="w-full rounded-lg border border-gray-300 px-3 py-2" disabled={!mats.flagMaterial} value={mats.surfaceMaterial || ""} onChange={(e) => onChangeMaterials({ surfaceMaterial: e.target.value })} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <CheckTick size="md" checked={!!mats.flagFaces} onChange={() => onChangeMaterials({ flagFaces: !mats.flagFaces })} label="จำนวนหน้าป้าย" />
          <div className="flex items-center gap-2 flex-wrap">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">จำนวนหน้าที่ติดตั้งป้าย</label>
            <input type="number" className="w-24 rounded-lg border border-gray-300 px-3 py-2" disabled={!mats.flagFaces} value={general?.size?.faces ?? ""} onChange={(e) => setFaces(e.target.value)} />
            <span className="text-sm text-gray-700">ด้าน</span>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <CheckTick
            size="md"
            checked={!!mats.flagOpening}
            onChange={() => onChangeMaterials({ flagOpening: !mats.flagOpening, hasOpenings: !mats.flagOpening ? null : mats.hasOpenings })}
            label="มีการเจาะช่องทะลุแผ่นป้าย"
          />
          <div className="flex items-center gap-4 flex-wrap">
            <label className="inline-flex items-center gap-2 text-sm">
              <CheckTick size="md" checked={mats.hasOpenings === true} disabled={!mats.flagOpening} onChange={() => setHasOpenings(true)} label="มี" />
              <span>มี</span>
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <CheckTick size="md" checked={mats.hasOpenings === false} disabled={!mats.flagOpening} onChange={() => setHasOpenings(false)} label="ไม่มี" />
              <span>ไม่มี</span>
            </label>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <CheckTick size="md" checked={!!mats.flagOther} onChange={() => onChangeMaterials({ flagOther: !mats.flagOther })} label="อื่น ๆ" className="mt-1" />
          <div className="flex flex-col gap-1 w-full">
            <label className="text-sm font-medium text-gray-700">อื่น ๆ (โปรดระบุ)</label>
            <input className="w-full rounded-lg border border-gray-300 px-3 py-2" disabled={!mats.flagOther} value={mats.otherNote || ""} onChange={(e) => onChangeMaterials({ otherNote: e.target.value })} />
          </div>
        </div>
      </div>
    </SectionCard>
  );
});

export default function Form8_3_Report_1_2({
  general,
  location,
  photos,
  typeAndOwner,
  materials,
  installType,
  onChangeGeneral,
  onChangeLocation,
  onChangePhotos,
  onChangeTypeAndOwner,
  onChangeMaterials,
  onChangeInstallType,
}: Props) {
  const g = general || {};
  const loc = location || {};
  const tao = typeAndOwner || { categories: [] };
  const mats = materials || { structureKinds: [] };

  // preview upload
  const [mapPreview, setMapPreview] = React.useState<string | undefined>(loc.mapImageLocal?.preview || (loc.mapImageFilename ? buildRemoteUrl(loc.mapImageFilename) : undefined));
  const [layoutPreview, setLayoutPreview] = React.useState<string | undefined>(loc.layoutImageLocal?.preview || (loc.layoutImageFilename ? buildRemoteUrl(loc.layoutImageFilename) : undefined));
  const [mapFilename, setMapFilename] = React.useState<string | undefined>(loc.mapImageLocal?.filename || loc.mapImageFilename);
  const [layoutFilename, setLayoutFilename] = React.useState<string | undefined>(loc.layoutImageLocal?.filename || loc.layoutImageFilename);
  const [, setMapFile] = React.useState<File | undefined>(loc.mapImageLocal?.file as File | undefined);
  const [, setLayoutFile] = React.useState<File | undefined>(loc.layoutImageLocal?.file as File | undefined);
  const [uploadStatus, setUploadStatus] = React.useState<{ type: "idle" | "success" | "error"; msg?: string }>({ type: "idle" });
  React.useEffect(() => {
    return () => {
      if (mapPreview?.startsWith("blob:")) URL.revokeObjectURL(mapPreview);
      if (layoutPreview?.startsWith("blob:")) URL.revokeObjectURL(layoutPreview);
    };
  }, [mapPreview, layoutPreview]);

  const pick = React.useCallback((key: "map" | "layout", file: File | null) => {
    if (!file) return;
    const { filename } = renameWithDateTime(file);
    const url = URL.createObjectURL(file);
    if (key === "map") {
      if (mapPreview?.startsWith("blob:")) URL.revokeObjectURL(mapPreview);
      setMapPreview(url);
      setMapFilename(filename);
      setMapFile(file);
      onChangeLocation({ mapImageFilename: filename, mapImageLocal: { file, preview: url, filename } });
    } else {
      if (layoutPreview?.startsWith("blob:")) URL.revokeObjectURL(layoutPreview);
      setLayoutPreview(url);
      setLayoutFilename(filename);
      setLayoutFile(file);
      onChangeLocation({ layoutImageFilename: filename, layoutImageLocal: { file, preview: url, filename } });
    }
  }, [layoutPreview, mapPreview, onChangeLocation]);

  const upload = React.useCallback(() => {
    if (!mapFilename && !layoutFilename) {
      setUploadStatus({ type: "error", msg: "กรุณาเลือกไฟล์ก่อน" });
      return;
    }
    setUploadStatus({ type: "success", msg: "ไฟล์จะอัปโหลดเมื่อกดบันทึก" });
  }, [layoutFilename, mapFilename]);

  return (
    <>
      <section className="space-y-6">
        <div className="text-base font-semibold">1.2 ข้อมูลที่ตั้ง/ภาพแผนที่และผัง</div>

        <AddressPermitSection general={general} onChangeGeneral={onChangeGeneral} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="border border-gray-300 rounded-xl p-4 sm:p-6 bg-white">
            <div className="font-medium text-gray-800 text-center mb-3">แผนที่ตั้ง/จุดสังเกต</div>
            {mapPreview ? (
              <img src={mapPreview} alt="map" className="w-full h-auto object-contain max-h-[28rem] border border-gray-300 rounded" />
            ) : (
              <div className="w-full h-56 border border-gray-300 rounded flex items-center justify-center text-gray-400">ยังไม่มีแผนที่</div>
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
            <div className="font-medium text-gray-800 text-center mb-3">ผัง/แปลนภายในอาคาร</div>
            {layoutPreview ? (
              <img src={layoutPreview} alt="layout" className="w-full h-auto object-contain max-h-[28rem] border border-gray-300 rounded" />
            ) : (
              <div className="w-full h-56 border border-gray-300 rounded flex items-center justify-center text-gray-400">ยังไม่มีผัง</div>
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
          <button type="button" onClick={upload} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">
            อัปเดตสถานะ (จะอัปโหลดเมื่อบันทึก)
          </button>
          {uploadStatus.type !== "idle" ? (
            <span className={`text-sm ${uploadStatus.type === "success" ? "text-emerald-600" : "text-rose-600"}`}>
              {uploadStatus.msg}
            </span>
          ) : null}
        </div>

        <div className="rounded-xl border bg-white p-3">
          <div className="font-medium text-gray-800 mb-2">รูปถ่ายประกอบ</div>
          <Main1_Photos value={photos} onChange={onChangePhotos} />
        </div>

        <TypeOwnerSection
          installType={installType}
          onChangeInstallType={onChangeInstallType}
          typeAndOwner={tao}
          onChangeTypeAndOwner={onChangeTypeAndOwner}
          onChangeGeneral={onChangeGeneral}
          general={g}
        />

        <MaterialsSection
          materials={mats}
          onChangeMaterials={onChangeMaterials}
          general={g}
          onChangeGeneral={onChangeGeneral}
        />
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



