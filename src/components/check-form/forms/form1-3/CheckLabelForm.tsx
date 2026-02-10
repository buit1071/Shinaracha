import * as React from "react";

import type { ReactNode } from "react";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import IconButton from "@mui/material/IconButton";
import Form1_3 from "./Form1_3";
import { Checkins } from "@/interfaces/master";
import { showLoading } from "@/lib/loading";

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
  const [checkInData, setCheckInData] = React.useState<Checkins | null>(null);

  const FORM_MAP: Record<string, FormRenderer> = {
    //ป้าย
    "FORM-53242768": renderForm1_3,
    "FORM-35898338": renderForm1_3,
    "FORM-11057862": renderForm1_3,
    //อื่นๆ ต่อด้านล่าง
  };

  const fetchCheckInStatus = React.useCallback(async () => {
    // ถ้าไม่มี Job ID หรือ Equipment ID ไม่ต้องยิง
    if (!jobId || !equipment_id) return;
    showLoading(true);

    try {
      // สมมติว่า endpoint คือตัวเดียวกับที่ใช้ viewEq (หรือเปลี่ยนเป็น path ที่คุณเอา logic ไปวาง)
      const res = await fetch("/api/auth/forms/get", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          function: "RCheckIn",
          job_id: jobId,
          equipment_id: equipment_id,
        }),
      });

      const data = await res.json();

      if (data.success && data.exists) {
        setCheckInData(data.data); // เก็บข้อมูลลง State
        showLoading(false);
      } else {
        setCheckInData(null); // เคลียร์ค่าถ้าไม่เจอ
        showLoading(false);
      }

    } catch (err) {
      console.error("Error fetching check-in status:", err);
      setCheckInData(null);
      showLoading(false);
    }
  }, [jobId, equipment_id]);

  React.useEffect(() => {
    fetchCheckInStatus();
  }, [fetchCheckInStatus]);

  return (
    <>
      <div className="h-[6vh] flex items-center justify-between px-4 py-2 bg-white shadow-md mb-2 rounded-lg">
        {/* ส่วนซ้าย: ปุ่ม Back และ ชื่อ */}
        <div className="flex items-center">
          <IconButton onClick={onBack} color="primary">
            <ArrowBackIcon />
          </IconButton>
          <h2 className="text-xl font-bold text-blue-900">{name}</h2>
        </div>

        {/* ✅ ส่วนขวา: ข้อมูล Check In / Check Out */}
        <div className="flex flex-col items-end justify-center text-xs text-gray-600 space-y-0.5">
          {/* แถว Check In */}
          <div>
            <span className="font-bold text-green-700 mr-2">CHECK IN:</span>
            {checkInData?.check_in_date ? (
              <span>
                {new Date(checkInData.check_in_date).toLocaleString("th-TH", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                <span className="text-gray-400">
                  ({Number(checkInData.check_in_lat).toFixed(5)}, {Number(checkInData.check_in_long).toFixed(5)})
                </span>
              </span>
            ) : (
              "-"
            )}
          </div>

          {/* แถว Check Out */}
          <div>
            <span className="font-bold text-orange-700 mr-2">CHECK OUT:</span>
            {checkInData?.check_out_date ? (
              <span>
                {new Date(checkInData.check_out_date).toLocaleString("th-TH", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                <span className="text-gray-400">
                  ({Number(checkInData.check_out_lat).toFixed(5)}, {Number(checkInData.check_out_long).toFixed(5)})
                </span>
              </span>
            ) : (
              "-"
            )}
          </div>
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
