"use client";

import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  const router = useRouter();

  // useEffect(() => {
  //   const token = Cookies.get("token");
  //   if (!token) {
  //     router.replace("/login");
  //   }
  // }, [router]);

  return (
    <div className="min-h-[96vh] grid place-items-center bg-gray-50">
      
    </div>
  );
}
