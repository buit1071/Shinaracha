let loadingEl: HTMLDivElement | null = null;

export function showLoading(show: boolean) {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  if (show) {
    if (!loadingEl) {
      loadingEl = document.createElement("div");
      loadingEl.innerHTML = `
        <div style="
          position: fixed;
          inset: 0;
          z-index: 20000;          /* ⬅️ สูงกว่า Dialog แน่นอน */
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0,0,0,0.4);
          pointer-events: all;      /* บล็อกคลิกทะลุ */
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
      document.body.appendChild(loadingEl);
      document.body.style.overflow = "hidden"; // ป้องกัน scroll ระหว่างโหลด
    } else {
      // ถ้าเคยสร้างแล้ว แค่โชว์
      loadingEl.style.display = "block";
      document.body.style.overflow = "hidden";
    }
  } else {
    if (loadingEl) {
      // ซ่อนแทนลบทิ้ง เพื่อลด cost การสร้างใหม่
      loadingEl.style.display = "none";
      document.body.style.overflow = "";
    }
  }
}
