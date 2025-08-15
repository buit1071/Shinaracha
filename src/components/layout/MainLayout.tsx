
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { UserCircleIcon } from "@heroicons/react/24/solid";
import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";
import { showLoading } from "@/lib/loading";

export default function MainLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [openMenus, setOpenMenus] = useState<string[]>([]);
    const avatarUrl = "";

    const toggleMenu = (menuId: string) => {
        setOpenMenus((prev) =>
            prev.includes(menuId)
                ? prev.filter((id) => id !== menuId)
                : [...prev, menuId]
        );
    };

    const router = useRouter();

    const handleLogout = async () => {
        showLoading(true);
        await fetch("/api/auth/logout", { method: "POST" });
        showLoading(false);
        router.replace("/login");
    };

    return (
        <div className="flex min-h-screen">
            {/* Sidebar */}
            <aside className="w-64 bg-gray-800 text-white flex flex-col">
                <div className="p-4 flex items-center text-center justify-center flex-col">
                    <img
                        src="/images/NewLOGOSF.webp"
                        alt="Logo"
                        className="w-[75px]"
                    />
                    <span className="text-xl font-bold">Shinaracha</span>
                </div>
                <div className="w-[90%] h-px bg-white mx-auto"></div>
                <nav className="flex-1 p-4 space-y-2 max-h-[739px] overflow-y-auto scrollbar-hide">
                    {/* หน้าหลัก */}
                    <NavLink href="/dashboard" currentPath={pathname}>
                        หน้าหลัก
                    </NavLink>

                    {/* โครงการ */}
                    <button
                        onClick={() => toggleMenu("projects")}
                        className="w-full flex justify-between items-center px-3 py-2 rounded hover:bg-gray-700 cursor-pointer"
                    >
                        <span>โครงการ</span>
                        <span className="text-sm">{openMenus.includes("projects") ? "▲" : "▼"}</span>
                    </button>
                    {openMenus.includes("projects") && (
                        <div className="ml-4 mt-1 space-y-1">
                            <NavLink href="/project-list" currentPath={pathname}>โครงการ</NavLink>
                            <NavLink href="/jobs" currentPath={pathname}>งาน</NavLink>
                            <NavLink href="/plans" currentPath={pathname}>แผนงาน</NavLink>
                            <NavLink href="/inspections" currentPath={pathname}>ผลตรวจ</NavLink>
                            <NavLink href="/reports" currentPath={pathname}>รายงาน</NavLink>
                        </div>
                    )}

                    {/* ตั้งค่า */}
                    <button
                        onClick={() => toggleMenu("settings")}
                        className="w-full flex justify-between items-center px-3 py-2 rounded hover:bg-gray-700 cursor-pointer"
                    >
                        <span>ตั้งค่า</span>
                        <span className="text-sm">{openMenus.includes("settings") ? "▲" : "▼"}</span>
                    </button>
                    {openMenus.includes("settings") && (
                        <div className="ml-4 mt-1 space-y-1">
                            <NavLink href="/inspection-form" currentPath={pathname}>แบบฟอร์มการตรวจ</NavLink>
                            <NavLink href="/inspection-type" currentPath={pathname}>ประเภทการตรวจ</NavLink>
                            <NavLink href="/team" currentPath={pathname}>ทีม</NavLink>
                            <NavLink href="/customer" currentPath={pathname}>ข้อมูลลูกค้า</NavLink>
                            <NavLink href="/device" currentPath={pathname}>อุปกรณ์</NavLink>
                            <NavLink href="/holiday" currentPath={pathname}>วันหยุด</NavLink>
                            <NavLink href="/employee" currentPath={pathname}>ข้อมูลพนักงาน</NavLink>
                            <NavLink href="/permission" currentPath={pathname}>สิทธิการใช้งาน</NavLink>
                            <NavLink href="/zone" currentPath={pathname}>พื้นที่</NavLink>
                        </div>
                    )}

                </nav>
                <div className="p-4 border-t border-gray-700 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        {avatarUrl ? (
                            <img
                                src={avatarUrl}
                                alt="User"
                                className="w-10 h-10 rounded-full object-cover"
                            />
                        ) : (
                            <UserCircleIcon className="w-10 h-10 text-gray-400" />
                        )}
                        <div>
                            <div className="text-sm font-semibold">username</div>
                            <div className="text-xs text-gray-400">ตำแหน่ง</div>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="text-red-500 hover:text-red-600 cursor-pointer"
                    >
                        <ArrowRightOnRectangleIcon className="w-6 h-6" />
                    </button>
                </div>
            </aside>

            {/* Content */}
            <div className="flex-1 flex flex-col">
                <main className="p-6 bg-gray-50 flex-1">{children}</main>
            </div>
        </div>
    );
}

function NavLink({
    href,
    currentPath,
    children,
}: {
    href: string;
    currentPath: string;
    children: React.ReactNode;
}) {
    const active = currentPath === href;
    return (
        <Link
            href={href}
            className={`block px-3 py-2 rounded ${active ? "bg-blue-600 text-white" : "hover:bg-gray-700"
                }`}
        >
            {children}
        </Link>
    );
}
