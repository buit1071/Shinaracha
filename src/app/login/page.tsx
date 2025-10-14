"use client";
import { useState, } from "react";
import { useRouter } from "next/navigation";
import { showLoading } from "@/lib/loading";

export default function LoginForm() {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    showLoading(true);
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: u, password: p }),
      });

      const data = await r.json();               // อ่าน body ก่อน
      if (!r.ok || !data.ok) {
        throw new Error(data.message || "Login failed");
      }

      // ✅ เก็บผู้ใช้ที่ล็อกอินสำเร็จไว้ฝั่ง client
      localStorage.setItem("currentUser", JSON.stringify(data.user));

      // กัน timing set-cookie (ถ้าจำเป็นจะหน่วงนิดเดียว)
      // await new Promise(r => setTimeout(r, 150));

      router.replace("/dashboard");
      showLoading(false);
    } catch (e: any) {
      showLoading(false);
      setErr(e.message);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/images/BackgroudLogin.webp')" }}
    >
      <div
        className="w-full max-w-5xl mx-auto flex flex-col md:flex-row bg-white 
             rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.25)] 
             overflow-hidden border border-gray-300 h-[500px]"
      >

        {/* === กล่องซ้าย === */}
        <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-5 bg-white relative">
          {/* เอฟเฟกต์แสงบางๆ */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-transparent"></div>

          <div className="relative z-10 flex flex-col items-center text-center">
            <img
              src="/images/NewLOGOSF.webp"
              alt="Logo"
              className="w-40 md:w-52 mb-6 drop-shadow-[0_5px_25px_rgba(0,0,0,0.15)] animate-float"
            />
            <h1 className="text-3xl md:text-3xl font-extrabold text-gray-800 tracking-wide">
              SHINARACHA FROTECTOR
            </h1>
            <p className="mt-2 text-sm md:text-base text-rose-600 font-semibold tracking-[0.15em] uppercase">
              Total Solution For Fire Protection
            </p>
          </div>
        </div>

        {/* === กล่องขวา (ฟอร์มล็อกอิน) === */}
        <div className="w-full md:w-1/2 flex justify-center items-center p-10">
          <form
            onSubmit={submit}
            className="w-full max-w-md"
          >
            <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">
              เข้าสู่ระบบ
            </h1>

            {err && (
              <div className="mb-4 rounded-lg border border-red-400 bg-red-100 text-red-700 px-3 py-2 text-sm font-medium animate-shake">
                {err}
              </div>
            )}

            <label className="block text-sm mb-1 font-semibold text-gray-700">
              Username
            </label>
            <input
              className="w-full mb-4 rounded-lg border border-gray-300 px-3 py-2 
                         focus:ring-2 focus:ring-blue-400 outline-none text-gray-800 shadow-sm"
              value={u}
              onChange={(e) => setU(e.target.value)}
              placeholder="ชื่อผู้ใช้ของคุณ"
            />

            <label className="block text-sm mb-1 font-semibold text-gray-700">
              Password
            </label>
            <input
              type="password"
              className="w-full mb-6 rounded-lg border border-gray-300 px-3 py-2 
                         focus:ring-2 focus:ring-blue-400 outline-none text-gray-800 shadow-sm"
              value={p}
              onChange={(e) => setP(e.target.value)}
              placeholder="••••••••"
            />

            <button
              type="submit"
              className="w-full rounded-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 
                         hover:from-blue-700 hover:to-indigo-800 text-white py-2.5 font-semibold 
                         shadow-md transition-all duration-200"
            >
              เข้าสู่ระบบ
            </button>
            <p className="mt-5 text-center text-xs text-gray-500">
              © 2025 Nice Software. All rights reserved.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
