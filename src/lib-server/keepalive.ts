// src/lib-server/keepalive.ts
declare global {
  // กัน start ซ้ำตอน dev/hmr หรือหลาย import
  // eslint-disable-next-line no-var
  var __keepaliveStarted: boolean | undefined;
}

type KeepAliveOptions = {
  intervalMs?: number;
  url?: string;
};

function buildDefaultPingUrl() {
  // ยิงไป "หารูป" ผ่าน n8n (ต้องมีไฟล์จริงชื่อเดียวกันใน storage)
  const base = process.env.NEXT_PUBLIC_N8N_UPLOAD_FILE;
  const name = process.env.KEEPALIVE_IMAGE_NAME; // เช่น keepalive.png

  if (base && name) {
    return `${base}?name=${encodeURIComponent(name)}`;
  }

  // fallback: ยิงเข้า API ในระบบตัวเอง (ถ้าตั้ง APP_URL)
  const appUrl = process.env.APP_URL; // เช่น https://hrms-app.apthai.co.th
  if (appUrl) return `${appUrl}/api/health`;

  // ถ้าไม่ตั้งอะไรเลย จะไม่ยิง (กันพังใน prod)
  return "";
}

async function pingOnce(url: string) {
  if (!url) return;

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 15_000);

  try {
    const res = await fetch(url, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    });

    // ไม่ต้องแสดงผลอะไร แค่ log เบาๆพอ
    if (!res.ok) {
      console.warn(`[keepalive] ping not ok: ${res.status} ${res.statusText}`);
    }
  } catch (err: any) {
    console.warn(`[keepalive] ping error: ${err?.message ?? err}`);
  } finally {
    clearTimeout(t);
  }
}

export function startKeepAlive(opts: KeepAliveOptions = {}) {
  if (globalThis.__keepaliveStarted) return;
  globalThis.__keepaliveStarted = true;

  const enabled = process.env.KEEPALIVE_ENABLED === "true";
  if (!enabled) return;

  const intervalMs =
    opts.intervalMs ??
    Number(process.env.KEEPALIVE_INTERVAL_MS ?? 300_000); // default 5 นาที

  const url = opts.url ?? process.env.KEEPALIVE_URL ?? buildDefaultPingUrl();

  // ยิงทันทีตอนเริ่ม
  void pingOnce(url);

  // ยิงซ้ำทุกๆ interval
  const timer = setInterval(() => void pingOnce(url), intervalMs);

  // ให้ process ปิดได้เอง ไม่ค้างเพราะ interval
  (timer as any).unref?.();

  console.log(`[keepalive] started: every ${intervalMs}ms -> ${url || "(no url)"}`);
}
