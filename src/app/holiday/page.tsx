"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import { showAlert, showConfirm } from "@/lib/fetcher";
import { showLoading } from "@/lib/loading";

const FullCalendar = dynamic(() => import("@fullcalendar/react"), { ssr: false });

import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import thLocale from "@fullcalendar/core/locales/th";
import type { CalendarApi, DatesSetArg } from "@fullcalendar/core";
import { HolidayRow } from "@/interfaces/master";
import { useCurrentUser } from "@/hooks/useCurrentUser";

function addDays(dateStr: string, days = 1) {
  const d = new Date(dateStr); // รองรับทั้ง "2025-08-21" และ "2025-08-21T17:00:00.000Z"
  if (isNaN(d.getTime())) return ""; // ป้องกัน Invalid Date

  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10); // คืนในรูป "YYYY-MM-DD"
}

export default function HolidayPage() {
  const user = useCurrentUser();
  const username = React.useMemo(
    () => (user ? `${user.first_name_th} ${user.last_name_th}` : ""),
    [user]
  );
  const [events, setEvents] = React.useState<HolidayRow[]>([]);
  const [form, setForm] = React.useState({
    title: "",
    description: "",
    start: "",
    end: "",
  });
  const calendarApiRef = React.useRef<CalendarApi | null>(null);
  const [selectedDate, setSelectedDate] = React.useState(new Date().toISOString().slice(0, 10));
  const handleDatesSet = React.useCallback((arg: DatesSetArg) => {
    calendarApiRef.current = arg.view.calendar;
  }, []);
  const gotoSelected = () => calendarApiRef.current?.gotoDate(selectedDate);
  const showSelectedAsList = () => calendarApiRef.current?.changeView("listDay", selectedDate);

  // ---- Dialog state ----
  const [openDialog, setOpenDialog] = React.useState(false);
  const [dialogMode, setDialogMode] = React.useState<"create" | "edit">("create");
  const [editingId, setEditingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const res = await fetch("/api/auth/holiday");
        const json = await res.json();
        if (res.ok && json.success) {
          const holidays: HolidayRow[] = json.data;
          setEvents(holidays);
        } else {
          showAlert("error", "โหลดข้อมูลวันหยุดล้มเหลว");
        }
      } catch (err) {
        showAlert("error", "เกิดข้อผิดพลาดในการเชื่อมต่อ");
      }
    };

    fetchHolidays();
  }, []);
  const openCreate = (start_date: string, end_date?: string) => {
    setDialogMode("create");
    setEditingId(null);
    setForm({
      title: "",
      description: "",
      start: start_date,
      end: end_date || start_date,
    });
    setOpenDialog(true);
  };
  // select ช่วงวันที่ในปฏิทิน -> เปิด dialog แบบเพิ่ม (inclusive end)
  const handleSelect = (info: any) => {
    const start = info.startStr.slice(0, 10);
    const inclusiveEnd = addDays(info.endStr.slice(0, 10), -1);
    openCreate(start, inclusiveEnd);
  };

  // กดปุ่ม “เพิ่มข้อมูล”
  const handleOpenAdd = () => {
    const today = new Date().toISOString().slice(0, 10);
    openCreate(today, today);
  };

  // คลิก event -> เปิด dialog แบบแก้ไข (ไม่ลบที่นี่)
  const handleEventClick = async (clickInfo: any) => {
    const start = clickInfo.event.start?.toISOString().slice(0, 10) || "";
    const inclusiveEnd = clickInfo.event.end
      ? addDays(clickInfo.event.end.toISOString().slice(0, 10), -1)
      : start;

    setDialogMode("edit");
    setEditingId(clickInfo.event.id);
    setForm({
      title: clickInfo.event.title,
      description: clickInfo.event.extendedProps?.description || "",
      start,
      end: inclusiveEnd,
    });
    setOpenDialog(true);
  };

  const isInvalidRange = (start: string, end?: string) =>
    !!end && start && end && end < start;

  const handleSave = async () => {
    if (!form.title || !form.start) return showAlert("info", "กรอกหัวข้อและวันเริ่ม");
    if (isInvalidRange(form.start, form.end)) return showAlert("info", "วันสิ้นสุดต้องไม่ก่อนวันเริ่ม");

    const payload = {
      holiday_id: editingId ?? "",
      title: form.title,
      description: form.description,
      start_date: form.start,
      end_date: form.end,
    };
    showLoading(true);
    try {
      const res = await fetch("/api/auth/holiday", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (res.ok) {
        const newEvent: HolidayRow = {
          holiday_id: result.holiday_id ?? editingId ?? crypto.randomUUID(),
          title: payload.title,
          description: payload.description,
          start_date: payload.start_date,
          end_date: payload.end_date ?? payload.start_date,
          is_active: 1,
          created_by: username,
          updated_by: username,
        };

        if (dialogMode === "create") {
          setEvents((prev) => [...prev, newEvent]);
        } else {
          setEvents((prev) =>
            prev.map((e) => (e.holiday_id === editingId ? newEvent : e))
          );
        }
        showLoading(false);
        showAlert("success", "บันทึกข้อมูลสำเร็จ");
        setOpenDialog(false);
      } else {
        showLoading(false);
        showAlert("error", "เกิดข้อผิดพลาด");
      }
    } catch (err) {
      showLoading(false);
      showAlert("error", "การเชื่อมต่อล้มเหลว");
    }
  };


  const handleDelete = async () => {
    if (!editingId) return;

    const ok = await showConfirm(
      "หากลบแล้วจะไม่สามารถนำกลับมาได้",
      "คุณต้องการลบข้อมูลนี้หรือไม่?"
    );
    if (!ok) return;
    showLoading(true);
    try {
      const res = await fetch(`/api/auth/holiday/${editingId}`, {
        method: "DELETE",
      });

      const result = await res.json();
      showLoading(false);
      if (res.ok) {
        setEvents((prev) => prev.filter((e) => e.holiday_id !== editingId));
        setOpenDialog(false);
        showAlert("success", "ลบเรียบร้อย");
      } else {
        showAlert("error", result.message || "เกิดข้อผิดพลาดในการลบข้อมูล");
      }
    } catch (err) {
      showAlert("error", "การเชื่อมต่อล้มเหลว");
    }
  };

  return (
    <div className="min-h-[96vh] bg-gray-50 flex flex-col justify-between">
      {/* Top Bar */}
      <div className="h-[6vh] w-full bg-white shadow-md flex items-center justify-between px-4 text-black font-semibold rounded-lg">
        Calendar
        <div className="flex gap-2 items-center">
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
          <Button variant="outlined" onClick={gotoSelected}>ไป</Button>
          <Button variant="outlined" onClick={showSelectedAsList}>ดูรายการ</Button>
          <Button variant="contained" color="primary" onClick={handleOpenAdd}>
            เพิ่มข้อมูล
          </Button>
        </div>
      </div>

      {/* Calendar (หัวตาราง sticky เลื่อนเฉพาะตาราง) */}
      <div className="calendar-shell h-[88vh] overflow-auto">
        <FullCalendar
          datesSet={handleDatesSet}
          locales={[thLocale]}
          locale="th"
          plugins={[dayGridPlugin, interactionPlugin, listPlugin]}
          initialView="dayGridMonth"
          selectable
          selectMirror
          select={handleSelect}
          eventClick={handleEventClick}   // ← ไม่ลบแล้ว แค่เปิด dialog แก้ไข
          events={events.map((e) => ({
            id: e.holiday_id,
            title: e.title,
            description: e.description,
            start: e.start_date,
            end: addDays(e.end_date, 1),
            allDay: true,
          }))}
          height="100%"
          stickyHeaderDates
          expandRows
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,dayGridWeek,dayGridDay,listWeek",
          }}
          buttonText={{ today: "วันนี้", month: "เดือน", week: "สัปดาห์", day: "วัน", list: "รายการ" }}
          nowIndicator={false}
        />
      </div>

      {/* Dialog เพิ่ม/แก้ไข + ปุ่มลบ */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth maxWidth="sm" sx={{ zIndex: 1000 }}>
        <DialogTitle sx={{ fontWeight: 700, pb: 1.5 }}>
          {dialogMode === "create" ? "เพิ่มกำหนดการ (รายวัน)" : "แก้ไขกำหนดการ (รายวัน)"}
        </DialogTitle>

        <DialogContent sx={{ display: "grid", gap: 1.25, pt: 1.5 }}>
          {editingId && (
            <TextField
              label="ID"
              value={editingId}
              disabled
              fullWidth
              size="small"
              margin="dense"
            />
          )}

          <TextField
            label="หัวข้อ"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            fullWidth
            size="small"
            margin="dense"
            autoFocus
          />
          <TextField
            label="รายละเอียด"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            fullWidth
            size="small"
            margin="dense"
            autoFocus
          />
          <TextField
            label="วันเริ่ม"
            type="date"
            value={form.start}
            onChange={(e) => {
              const start = e.target.value;
              setForm((f) => ({
                ...f,
                start,
                end: f.end && f.end < start ? start : f.end || start,
              }));
            }}
            fullWidth
            size="small"
            margin="dense"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="วันสิ้นสุด"
            type="date"
            value={form.end || ""}
            inputProps={{ min: form.start || undefined }}
            onChange={(e) => setForm((f) => ({ ...f, end: e.target.value }))}
            fullWidth
            size="small"
            margin="dense"
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 1.25 }}>
          {dialogMode === "edit" && (
            <Button color="error" onClick={handleDelete}>
              ลบ
            </Button>
          )}
          <div className="flex-1" />
          <Button onClick={() => setOpenDialog(false)}>ยกเลิก</Button>
          <Button
            variant="contained"
            onClick={handleSave}
          >
            บันทึก
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
