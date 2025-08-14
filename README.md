Shinaracha (Next.js App Router)
โปรเจกต์ Next.js + TypeScript + Tailwind สำหรับงานระบบภายใน (มี Login, Layout แยกตามหน้า, ดัก cookie ด้วย middleware)

# ชุดคำสั่งเบื้องต้น
- npm i
- npm run dev
- เปิด http://localhost:3000

# สร้างไฟล์ .env.local
JWT_SECRET=supersecret_change_me

# โครงสร้างโปรเจกต์ (สำคัญ)
public/
└─ images/                  # รูป static เสิร์ฟตรงจาก /images/*
scripts/
└─ check-env.mjs            # สคริปต์เช็ค ENV ที่จำเป็น
src/
└─ app/
   ├─ api/                  # Next.js Route Handlers (API)
   │  ├─ auth/
   │  │  ├─ login/route.ts  # POST /api/auth/login → ตรวจ user, เซ็ต cookie "token"
   │  │  └─ logout/route.ts # POST /api/auth/logout → ลบ cookie
   │  ├─ health/route.ts    # GET /api/health → ping ดูสถานะ
   │  └─ routes/            # โฟลเดอร์เผื่อ API อื่น ๆ (เช่น /api/routes/*)
   │
   ├─ dashboard/
   │  └─ page.tsx           # หน้า Dashboard (เพจหลังล็อกอิน)
   ├─ login/
   │  └─ page.tsx           # หน้า Login (เพจ public)
   │
   ├─ globals.css           # global styles + tailwind directives
   ├─ layout.tsx            # RootLayout → ใส่ <html><body> และครอบ <LayoutSwitch>
   ├─ LayoutSwitch.tsx      # (client) สวิตช์จะครอบ MainLayout หรือไม่ ตาม path
   └─ page.tsx              # หน้า "/" (จะใช้เป็น landing หรือ redirect ก็ได้)
│
├─ components/
│  └─ layout/
│     └─ MainLayout.tsx     # (client) โครงหลัก: Sidebar, Topbar, Footer
│
├─ config/                  # ค่าคงที่/การตั้งค่าโปรเจกต์ (ถ้ามี)
├─ hooks/                   # React hooks ใช้ซ้ำ
├─ lib/                     # ฟังก์ชันฝั่ง client (fetcher, formatter ฯลฯ)
├─ lib-server/
│  ├─ db.ts                 # จุดต่อ DB/SDK ฝั่ง server-only
│  └─ jwt.ts                # sign/verify JWT ด้วย jose (ใช้ใน API auth)
├─ middlewares/             # โค้ดประกอบอื่น ๆ ที่เกี่ยวกับ middleware (ถ้ามี)
├─ services/                # service layer เรียก API/แหล่งข้อมูล
├─ styles/                  # CSS เพิ่มเติมแยกจาก globals.css
├─ types/                   # TypeScript types
└─ utils/                   # helper เล็ก ๆ ใช้ซ้ำ

