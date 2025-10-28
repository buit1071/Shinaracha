import * as React from "react";
import type { ReactNode } from "react";
import Form1_3 from "./Form1_3";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import IconButton from "@mui/material/IconButton";

type Props = {
  formId: string;
  jobId: string;
  equipment_id: string;
  name: string;
  onBack: () => void;
};

export default function CheckLabelForm({ formId, jobId, equipment_id, name, onBack }: Props) {
  // FORM_MAP เปลี่ยนจาก ReactNode เป็น function รับ props
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
    ) => <Form1_3 jobId={jobId} equipment_id={equipment_id} name={name} onBack={onBack} />,
  };

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
        {/* พื้นที่ A4 แนวตั้ง */}
        <div className="w-full shadow-sm border bg-white">
          {FORM_MAP[formId]?.(jobId, equipment_id, name, onBack) ?? null}
        </div>
      </div>
    </>
  );
}
