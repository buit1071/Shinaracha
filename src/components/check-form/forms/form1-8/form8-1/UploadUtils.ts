export function buildRemoteUrl(name: string): string {
  const base = process.env.NEXT_PUBLIC_N8N_UPLOAD_FILE || "";
  return name ? `${base}?name=${encodeURIComponent(name)}` : "";
}

export function renameWithDateTime(orig: File): { file: File; filename: string } {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const day = pad(now.getDate());
  const month = pad(now.getMonth() + 1);
  const year = String(now.getFullYear());
  const hour = pad(now.getHours());
  const min = pad(now.getMinutes());
  const sec = pad(now.getSeconds());
  const ext = (orig.name.split(".").pop() || "jpg").toLowerCase();
  const filename = `${day}${month}${year}_${hour}${min}${sec}.${ext}`;
  return { file: orig, filename };
}

export async function uploadBlob(blob: Blob, filename: string): Promise<boolean> {
  const fd = new FormData();
  fd.append("file", blob, filename);
  fd.append("filename", filename);
  const res = await fetch("/api/auth/upload-file", { method: "POST", body: fd });
  if (!res.ok) return false;
  const data = await res.json().catch(() => ({}));
  return Boolean(data?.success ?? res.ok);
}

export async function uploadIfNeeded(previewUrl?: string | null, filename?: string | null, file?: Blob): Promise<boolean> {
  if (!previewUrl || !filename) return true; // nothing to do
  try {
    // If we still have the file/blob, upload directly to avoid fetch(blob:...) errors
    if (file) {
      return await uploadBlob(file, filename);
    }
    if (previewUrl.startsWith("blob:")) {
      const resp = await fetch(previewUrl);
      const blob = await resp.blob();
      return await uploadBlob(blob, filename);
    }
    if (previewUrl.startsWith("data:image")) {
      const resp = await fetch(previewUrl);
      const blob = await resp.blob();
      return await uploadBlob(blob, filename);
    }
    // remote http(s): assume already uploaded
    return true;
  } catch {
    return false;
  }
}
