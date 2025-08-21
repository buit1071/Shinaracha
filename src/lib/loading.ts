declare global {
  interface Window { __loadingOverlayEl?: HTMLDivElement | null }
}

export function showLoading(show: boolean) {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  // ถ้ามี overlay ค้างจากรอบก่อน (เช่น HMR) ดึงมาใช้/ลบทิ้งได้
  let el =
    (window as any).__loadingOverlayEl ||
    (document.getElementById("app-loading-overlay") as HTMLDivElement | null);

  const appRoot = document.getElementById("__next") || document.body;

  if (show) {
    if (!el) {
      el = document.createElement("div");
      el.id = "app-loading-overlay";
      el.setAttribute("data-loading-overlay", "true");
      el.innerHTML = `
        <div style="
          position: fixed;
          inset: 0;
          z-index: 20000;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0,0,0,0.4);
          pointer-events: all;
        ">
          <div class="lds-ring" style="color:white">
            <div></div><div></div><div></div><div></div>
          </div>
        </div>
        <style>
          .lds-ring, .lds-ring div { box-sizing: border-box; }
          .lds-ring { display: inline-block; position: relative; width: 80px; height: 80px; }
          .lds-ring div {
            box-sizing: border-box; display: block; position: absolute;
            width: 64px; height: 64px; margin: 8px;
            border: 8px solid currentColor; border-radius: 50%;
            animation: lds-ring 1.2s cubic-bezier(0.5,0,0.5,1) infinite;
            border-color: currentColor transparent transparent transparent;
          }
          .lds-ring div:nth-child(1) { animation-delay: -0.45s; }
          .lds-ring div:nth-child(2) { animation-delay: -0.3s; }
          .lds-ring div:nth-child(3) { animation-delay: -0.15s; }
          @keyframes lds-ring { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
      `;
      document.body.appendChild(el);
    } else {
      el.style.display = "block";
    }

    // lock หน้าจอ/โฟกัส
    appRoot.setAttribute("inert", "");
    document.body.setAttribute("aria-busy", "true");
    document.body.style.overflow = "hidden";

    (window as any).__loadingOverlayEl = el;
  } else {
    // ปิดแบบ “ถอนราก” กันค้าง
    try {
      appRoot.removeAttribute("inert");
      document.body.removeAttribute("aria-busy");
      document.body.style.overflow = "";

      // เผื่อมีหลายตัว คุ้ยลบทั้งหมด
      document
        .querySelectorAll('[data-loading-overlay="true"], #app-loading-overlay')
        .forEach((n) => n.parentElement?.removeChild(n));

      (window as any).__loadingOverlayEl = null;
    } catch { }
  }
}

// เผื่ออยากมีปุ่มปิดแบบ force
export function forceCloseLoading() {
  showLoading(false);
}
