"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Button } from "@mui/material";

const FullCalendar = dynamic(() => import("@fullcalendar/react"), { ssr: false });

import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import thLocale from "@fullcalendar/core/locales/th";
import type { CalendarApi, DatesSetArg, EventInput } from "@fullcalendar/core";
import type { JobsRow } from "@/interfaces/master";
import { showLoading } from "@/lib/loading";

// ===== helper =====
const pad2 = (n: number) => n.toString().padStart(2, "0");
const addDays = (isoDate: string, days = 1) => {
  const d = new Date((isoDate.includes("T") ? isoDate : isoDate + "T00:00:00"));
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

// รองรับทั้งรูปแบบ 'YYYY-MM-DD' และ ISO ที่มี 'T'/'Z' -> คืนค่า 'YYYY-MM-DD' ตามเวลาท้องถิ่น
function normalizeDate(dateStr?: string) {
  if (!dateStr) return undefined;
  if (dateStr.includes("T")) {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
    }
  }
  return dateStr; // สมมติเป็น 'YYYY-MM-DD'
}

// คืนค่า 'HH:mm' จากเวลาหลากหลายรูปแบบ (เช่น '03:00', '03:00:00', '03:00:00.000Z')
function formatHM(timeStr?: string) {
  if (!timeStr) return "";
  const m = timeStr.match(/(\d{2}:\d{2})/);
  return m ? m[1] : "";
}

/** รวม date + time (ถ้ามีเวลา) ให้เป็น ISO string, ถ้าไม่มีเวลา ให้เป็น allDay */
function toDateTimeISO(dateStr?: string, timeStr?: string) {
  const norm = normalizeDate(dateStr);
  if (!norm) return undefined;
  const hm = formatHM(timeStr);
  if (!hm) return `${norm}`; // all-day
  const t = hm.length === 5 ? `${hm}:00` : hm;
  return `${norm}T${t}`;
}

function mapJobToEvent(job: JobsRow): EventInput {
  const startHasTime = !!formatHM(job.job_start_time);
  const endHasTime = !!formatHM(job.job_end_time);

  const startISO = toDateTimeISO(job.job_start_date, job.job_start_time);
  let endISO = toDateTimeISO(job.job_end_date, job.job_end_time);

  const allDay = !(startHasTime || endHasTime);

  if (allDay && job.job_end_date) {
    endISO = addDays(job.job_end_date, 1);
  }

  const hm = formatHM(job.job_start_time);
  const title = `${hm ? hm + " " : ""}${job.job_name ?? ""} | ${job.team_name ?? ""}`;

  return {
    id: job.job_id,
    title: title.trim() || "(ไม่มีชื่อ)",
    start: startISO,
    end: endISO,
    allDay,
    backgroundColor: "#1E90FF", // 🎨 dodgerblue
    borderColor: "#1E90FF",
    textColor: "#fff",          // ตัวอักษรสีขาว
  };
}

export default function PlanPage() {
  const calendarApiRef = React.useRef<CalendarApi | null>(null);
  const [selectedDate, setSelectedDate] = React.useState(
    new Date().toISOString().slice(0, 10)
  );

  const [events, setEvents] = React.useState<EventInput[]>([]);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const handleDatesSet = React.useCallback((arg: DatesSetArg) => {
    calendarApiRef.current = arg.view.calendar;
  }, []);

  const gotoSelected = () => calendarApiRef.current?.gotoDate(selectedDate);
  const showSelectedAsList = () =>
    calendarApiRef.current?.changeView("listDay", selectedDate);

  const fetchJobs = React.useCallback(async () => {
    showLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/auth/job/get", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ function: "job" }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();
      if (!json?.success) throw new Error(json?.message || "ไม่สามารถดึงข้อมูลงานได้");

      const rows: JobsRow[] = json.data || [];
      const mapped = rows
        .filter((j) => j?.job_start_date && j?.job_end_date)
        .map(mapJobToEvent);

      setEvents(mapped);
    } catch (err: any) {
      setErrorMsg(err?.message || "เกิดข้อผิดพลาดในการดึงข้อมูล");
      setEvents([]);
    } finally {
      showLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return (
    <div className="min-h-[96vh] bg-gray-50 flex flex-col justify-between">
      {/* Top Bar */}
      <div className="h-[6vh] w-full bg-white shadow-md flex items-center justify-between px-4 text-black font-semibold rounded-lg">
        แผนงาน
        <div className="flex gap-2 items-center">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
          <Button variant="outlined" onClick={gotoSelected}>ไป</Button>
          <Button variant="outlined" onClick={showSelectedAsList}>ดูรายการ</Button>
          {/* <Button variant="contained" color="primary">
            เพิ่มข้อมูล
          </Button> */}
        </div>
      </div>

      {/* แจ้ง error ถ้ามี */}
      {errorMsg && (
        <div className="px-4 py-2 text-red-600 text-sm">⚠️ {errorMsg}</div>
      )}

      {/* Calendar */}
      <div className="calendar-shell h-[88vh] overflow-auto">
        <FullCalendar
          datesSet={handleDatesSet}
          locales={[thLocale]}
          locale="th"
          plugins={[dayGridPlugin, interactionPlugin, listPlugin]}
          initialView="dayGridMonth"
          selectable={false}   // ❌ ไม่ให้เลือก
          editable={false}     // ❌ ไม่ให้ลาก / resize
          eventClick={() => { }} // ❌ คลิกแล้วไม่ทำอะไร
          height="100%"
          stickyHeaderDates
          expandRows
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,dayGridWeek,dayGridDay,listWeek",
          }}
          buttonText={{
            today: "วันนี้",
            month: "เดือน",
            week: "สัปดาห์",
            day: "วัน",
            list: "รายการ",
          }}
          nowIndicator={false}
          eventDisplay="block"
          displayEventTime={false}
          events={events}
          eventDidMount={(info) => {
            info.el.style.borderRadius = "2px";
            info.el.style.lineHeight = "1.25";
            const harness = info.el.parentElement as HTMLElement | null;
          }}
        />
      </div>
    </div>
  );
}
