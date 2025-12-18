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
  name: string;
  onBack: () => void;
};

type FormRenderer = (
  jobId: string,
  equipment_id: string,
  name: string,
  onBack: () => void
) => React.ReactNode;

export default function CheckLabelForm({ formId, jobId, equipment_id, name, onBack }: Props) {
  // FORM_MAP เปลี่ยนจาก ReactNode เป็น function รับ props

  const renderForm1_3: FormRenderer = (jobId, equipment_id, name, onBack) => (
    <Form1_3 jobId={jobId} equipment_id={equipment_id} name={name} onBack={onBack} />
  );

  const FORM_MAP: Record<string, FormRenderer> = {
    //ป้าย
    "FORM-53242768": renderForm1_3,
    "FORM-35898338": renderForm1_3,
    "FORM-11057862": renderForm1_3,
    //อื่นๆ ต่อด้านล่าง
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
          {FORM_MAP[formId]?.(jobId, equipment_id, name, onBack)}
        </div>
      </div>
    </>
  );
}
