"use client";
import { useState } from "react";
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

      const data = await r.json();
      if (!r.ok || !data.ok) {
        throw new Error(data.message || "Login failed");
      }

      localStorage.setItem("currentUser", JSON.stringify(data.user));
      router.replace("/dashboard");
      showLoading(false);
    } catch (e: any) {
      showLoading(false);
      setErr(e.message);
    }
  };

  return (
    <div
      className="min-h-[100dvh] flex items-center justify-center bg-cover bg-center bg-no-repeat p-4 sm:p-6 lg:p-10"
      style={{ backgroundImage: "url('/images/BackgroudLogin.webp')" }}
    >
      <div
        className="flex flex-wrap md:flex-nowrap w-full max-w-6xl bg-white rounded-2xl overflow-hidden
                   shadow-[0_10px_35px_rgba(0,0,0,0.25)] border border-gray-200
                   min-h-[480px] md:min-h-[560px] lg:min-h-[600px]"
      >
        {/* === กล่องซ้าย === */}
        <div className="flex-1 flex flex-col justify-center items-center 
                        bg-gradient-to-br from-white via-orange-50 to-transparent p-1 sm:p-1 relative">
          <img
            src="/images/NewLOGOSF.webp"
            alt="Logo"
            className="w-24 sm:w-36 md:w-44 lg:w-56 mb-4 drop-shadow-[0_5px_25px_rgba(0,0,0,0.15)] animate-float"
          />
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-gray-800 tracking-wide text-center">
            SHINARACHA FROTECTOR
          </h1>
          <p className="mt-2 text-xs sm:text-sm md:text-base lg:text-lg text-rose-600 font-semibold tracking-[0.15em] uppercase text-center">
            Total Solution For Fire Protection
          </p>
        </div>

        {/* === กล่องขวา === */}
        <div className="flex-1 flex justify-center items-center bg-gray-50 p-1 sm:p-1 lg:p-1">
          <form
            onSubmit={submit}
            className="w-full max-w-sm sm:max-w-md bg-white rounded-2xl border border-gray-100 shadow-md p-1 sm:p-1"
          >
            <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6 text-gray-800">
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
