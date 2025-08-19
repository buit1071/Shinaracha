import Swal from "sweetalert2";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
dayjs.extend(customParseFormat);

export async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

export const formatToThaiDate = (input?: string | Date | null): string => {
  if (!input) return "";
  const tryFormats = ["DD/MM/YYYY", "YYYY-MM-DD", "YYYY-MM-DD HH:mm:ss", "YYYY-MM-DDTHH:mm:ssZ"];
  for (const f of tryFormats) {
    const d = typeof input === "string" ? dayjs(input, f, true) : dayjs(input);
    if (d.isValid()) return d.format("DD/MM/YYYY");
  }
  const d = dayjs(input); // fallback
  return d.isValid() ? d.format("DD/MM/YYYY") : "";
};

export const parseToInputDate = (input?: string | Date | null): string => {
  if (!input) return "";
  const tryFormats = ["YYYY-MM-DD", "DD/MM/YYYY", "YYYY-MM-DD HH:mm:ss", "YYYY-MM-DDTHH:mm:ssZ"];
  for (const f of tryFormats) {
    const d = typeof input === "string" ? dayjs(input, f, true) : dayjs(input);
    if (d.isValid()) return d.format("YYYY-MM-DD");
  }
  const d = dayjs(input); // fallback
  return d.isValid() ? d.format("YYYY-MM-DD") : "";
};

export function formatDateTime(dateStr?: string) {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "-";

  const pad = (n: number) => String(n).padStart(2, "0");

  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear();
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

export const formatDate = (value?: string) => {
  if (!value) return "-";
  return dayjs(value).format("DD/MM/YYYY"); // แค่วันที่
};

export function generateCustomerId(): string {
  const randomNum = Math.floor(10000000 + Math.random() * 90000000); // 8 หลัก
  return `CUST-${randomNum}`;
}
export function generateServiceId(): string {
  const randomNum = Math.floor(10000000 + Math.random() * 90000000); // 8 หลัก
  return `SERV-${randomNum}`;
}
export function generateZoneId(): string {
  const randomNum = Math.floor(10000000 + Math.random() * 90000000); // 8 หลัก
  return `ZONE-${randomNum}`;
}
export function generateProjectId(): string {
  const randomNum = Math.floor(10000000 + Math.random() * 90000000); // 8 หลัก
  return `PROJ-${randomNum}`;
}

export const toSqlDate = (thai?: string | null): string | null => {
  if (!thai) return null;
  // expected: "DD/MM/YYYY"
  const [d, m, y] = thai.split("/");
  if (!d || !m || !y) return null;
  // return "YYYY-MM-DD"
  return `${y.padStart(4, "0")}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
};

export const showAlert = (
  type: "success" | "error" | "warning" | "info" | "question",
  message: string,
  title?: string
) => {
  return Swal.fire({
    icon: type,
    title: title || (type === "success" ? "สำเร็จ" : "แจ้งเตือน"),
    text: message,
    confirmButtonColor: type === "success" ? "#3085d6" : "#d33",
    confirmButtonText: "ตกลง",
    zIndex: 9999,
  } as any);
};

export const showConfirm = async (
  message: string,
  title = "คุณแน่ใจหรือไม่?",
  confirmText = "ยืนยัน",
  cancelText = "ยกเลิก"
) => {
  const result = await Swal.fire({
    title,
    text: message,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
  });
  return result.isConfirmed;
};