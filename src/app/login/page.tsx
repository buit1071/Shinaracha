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
    <div className="min-h-screen grid place-items-center bg-gray-50">
      <form onSubmit={submit} className="w-full max-w-sm bg-white p-6 rounded-xl shadow-lg border border-gray-300">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">Login</h1>

        {err && <div className="mb-4 rounded border border-red-500 bg-red-100 text-red-800 px-3 py-2 text-sm font-medium">{err}</div>}

        <label className="block text-sm mb-1 font-semibold text-gray-700">Username</label>
        <input className="w-full mb-4 rounded border border-gray-400 px-3 py-2 focus:ring-blue-200 outline-none text-black"
          value={u} onChange={(e) => setU(e.target.value)} autoFocus />

        <label className="block text-sm mb-1 font-semibold text-gray-700">Password</label>
        <input type="password" className="w-full mb-6 rounded border border-gray-400 px-3 py-2 outline-none text-black"
          value={p} onChange={(e) => setP(e.target.value)} />

        <button className="w-full rounded bg-blue-600 hover:bg-blue-700 text-white py-2 font-semibold shadow-md disabled:opacity-60 transition">
          เข้าสู่ระบบ
        </button>
      </form>
    </div>
  );
}
