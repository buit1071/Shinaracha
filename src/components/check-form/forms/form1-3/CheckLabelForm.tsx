import * as React from "react";

import type { ReactNode } from "react";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import IconButton from "@mui/material/IconButton";
import Form8_1 from "../form1-8/form8-1/Form8_1";
import Form8_2 from "../form1-8/form8-2/Form8_2";
import Form8_3 from "../form1-8/form8-3/Form8_3";
import Form1_3 from "./Form1_3";
import Form1_9 from "../form1-9/Form1_9";

type Props = {
  formId: string;
  jobId: string;
  equipment_id: string;
  name: string; // ชื่ออุปกรณ์ (แสดงหัวข้อ)
  inspectName?: string; // ชื่อการตรวจ/โซน มักมี "แบบที่ X" ใช้ช่วยเลือกฟอร์ม
  forceForm?: "form1_3" | "form1_9" | "form8_1" | "form8_2" | "form8_3";
  onBack: () => void;
};

export default function CheckLabelForm({ formId, jobId, equipment_id, name, inspectName, forceForm, onBack }: Props) {
  // FORM_MAP: เก็บตัวสร้าง ReactNode ตาม form key
  const FORM_MAP: Record<
    string,
    (
      jobId: string,
      equipment_id: string,
      name: string,
      onBack: () => void
    ) => ReactNode
  > = {
    "FORM-67554643": (
      jobId: string,
      equipment_id: string,
      name: string,
      onBack: () => void
    ) => (
      <Form1_3
        jobId={jobId}
        equipment_id={equipment_id}
        name={name}
        onBack={onBack}
      />
    ),

    "FORM-71543253": (
      jobId: string,
      equipment_id: string,
      name: string,
      onBack: () => void
    ) => (
      <Form8_1
        jobId={jobId}
        equipment_id={equipment_id}
        name={name}
        onBack={onBack}
      />
    ),

    "FORM-82703483": (
      jobId: string,
      equipment_id: string,
      name: string,
      onBack: () => void
    ) => (
      <Form8_2
        jobId={jobId}
        equipment_id={equipment_id}
        name={name}
        onBack={onBack}
      />
    ),

    "FORM-61240890": (
      jobId: string,
      equipment_id: string,
      name: string,
      onBack: () => void
    ) => (
      <Form8_3
        jobId={jobId}
        equipment_id={equipment_id}
        name={name}
        onBack={onBack}
      />
    ),

    "FORM-62864268": (
      jobId: string,
      equipment_id: string,
      name: string,
      onBack: () => void
    ) => (
      <Form1_9
        jobId={jobId}
        equipment_id={equipment_id}
        name={name}
        onBack={onBack}
      />
    ),
  };

  // หากกำหนด forceForm มาก็ใช้คอมโพเนนต์นั้นโดยตรง (ไม่ต้องเดา)
  if (forceForm) {
    const direct = {
      form1_3: (j: string, e: string, n: string, b: () => void) => (
        <Form1_3 jobId={j} equipment_id={e} name={n} onBack={b} />
      ),
      form1_9: (j: string, e: string, n: string, b: () => void) => (
        <Form1_9 jobId={j} equipment_id={e} name={n} onBack={b} />
      ),
      form8_1: (j: string, e: string, n: string, b: () => void) => (
        <Form8_1 jobId={j} equipment_id={e} name={n} onBack={b} />
      ),
      form8_2: (j: string, e: string, n: string, b: () => void) => (
        <Form8_2 jobId={j} equipment_id={e} name={n} onBack={b} />
      ),
      form8_3: (j: string, e: string, n: string, b: () => void) => (
        <Form8_3 jobId={j} equipment_id={e} name={n} onBack={b} />
      ),
    } as const;

    return (
      <>
        <div className="h-[6vh] flex items-center justify-between px-4 py-2 bg-white shadow-md mb-2 rounded-lg">
          <div className="flex items-center">
            <IconButton onClick={onBack} color="primary">
              <ArrowBackIcon />
            </IconButton>
            <h2 className="text-xl font-bold text-blue-900 ml-5">{name}</h2>
          </div>
        </div>
        <div className="h-full w-full overflow-auto">
          <div className="w-full shadow-sm border bg-white">
            {direct[forceForm](jobId, equipment_id, name, onBack)}
          </div>
        </div>
      </>
    );
  }

  // ตัว resolve key: ถ้า formId ไม่แมปในแผนที่ ให้ใช้ข้อความชื่อการตรวจที่มักระบุ "แบบที่ X"
  const resolvedKey = React.useMemo(() => {
    if (FORM_MAP[formId]) return formId;
    const textForMatch = String(inspectName || name || "").toLowerCase();
    if (/(แบบที่\s*8|\b8\b)/.test(textForMatch)) return "FORM-71543253"; // 8.1
    if (/(แบบที่\s*3|\b3\b)/.test(textForMatch)) return "FORM-67554643"; // 1.3
    if (/(แบบที่\s*9|\b9\b)/.test(textForMatch)) return "FORM-62864268"; // 1.9
    return formId;
  }, [formId, name, inspectName]);

  return (
    <>
      <div className="h-[6vh] flex items-center justify-between px-4 py-2 bg-white shadow-md mb-2 rounded-lg">
        <div className="flex items-center">
          <IconButton onClick={onBack} color="primary">
            <ArrowBackIcon />
          </IconButton>
          <h2 className="text-xl font-bold text-blue-900 ml-5">{name}</h2>
        </div>
      </div>
      <div className="h-full w-full overflow-auto">
        {/* พื้นที่ A4 */}
        <div className="w-full shadow-sm border bg-white">
          {FORM_MAP[resolvedKey]?.(jobId, equipment_id, name, onBack) ?? (
            <div className="p-6 text-center text-gray-700">
              <p className="font-semibold">ไม่พบแบบฟอร์มที่ตรงกับเงื่อนไข</p>
              <p className="text-sm mt-1">รหัสที่ระบุ: <span className="font-mono">{formId || "(ว่าง)"}</span> • หัวข้อ: {name}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
