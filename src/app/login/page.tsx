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
    <div className="min-h-[100dvh] flex items-center justify-center bg-gray-100 p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm sm:max-w-md bg-white rounded-2xl border border-gray-200 shadow-md p-6 sm:p-8"
      >
        <h1 className="text-2xl sm:text-3xl font-semibold text-center mb-6 text-gray-800">
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
          className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 
                     text-white py-2.5 font-semibold shadow-md transition-colors duration-150"
        >
          เข้าสู่ระบบ
        </button>

        <p className="mt-5 text-center text-xs text-gray-500">
          © 2025 Nice Software. All rights reserved.
        </p>
      </form>
    </div>
  );
}
