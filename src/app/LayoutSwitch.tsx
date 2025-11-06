"use client";

import { usePathname } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";

const NO_LAYOUT = ["/", "/login", "/auth/forgot"];

export default function LayoutSwitch({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const noLayout = NO_LAYOUT.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  if (noLayout) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <div className="w-full">
          {children}
        </div>
      </main>
    );
  }

  return <MainLayout>{children}</MainLayout>;
}