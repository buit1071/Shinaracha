import Swal from "sweetalert2";

export async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

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

export function generateCustomerId(): string {
  const randomNum = Math.floor(10000000 + Math.random() * 90000000); // 8 หลัก
  return `CUST-${randomNum}`;
}
export function generateServiceId(): string {
  const randomNum = Math.floor(10000000 + Math.random() * 90000000); // 8 หลัก
  return `SERV-${randomNum}`;
}

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