
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { UserCircleIcon } from "@heroicons/react/24/solid";
import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";
import { showLoading } from "@/lib/loading";

import {
    HomeIcon,
    BuildingOfficeIcon,
    UsersIcon,
    MapIcon,
    IdentificationIcon,
    KeyIcon,
    CalendarDaysIcon,
    Cog6ToothIcon,
    WrenchScrewdriverIcon,
    DocumentTextIcon,
    UserGroupIcon,
    ClipboardDocumentListIcon,
    BriefcaseIcon,
    TableCellsIcon,
    DocumentMagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

export default function MainLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [openMenus, setOpenMenus] = useState<string[]>([]);
    const avatarUrl = "";

    useEffect(() => {
        showLoading(false);
    }, [pathname]);

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
                    <NavLink href="/dashboard" currentPath={pathname} icon={HomeIcon}>
                        หน้าหลัก
                    </NavLink>

                    {/* ตั้งค่า */}
                    <button
                        onClick={() => toggleMenu("company")}
                        className="w-full flex justify-between items-center px-3 py-2 rounded hover:bg-gray-700 cursor-pointer"
                    >
                        <span className="flex items-center gap-2">
                            <BuildingOfficeIcon className="w-5 h-5" />
                            ข้อมูลบริษัท
                        </span>
                        <span className="text-sm">{openMenus.includes("company") ? "▲" : "▼"}</span>
                    </button>

                    {openMenus.includes("company") && (
                        <div className="ml-4 mt-1 space-y-1">
                            <NavLink href="/team" currentPath={pathname} icon={UsersIcon}>
                                ทีมตรวจ
                            </NavLink>
                            <NavLink href="/zone" currentPath={pathname} icon={MapIcon}>
                                พื้นที่การตรวจ
                            </NavLink>
                            <NavLink href="/employee" currentPath={pathname} icon={IdentificationIcon}>
                                ข้อมูลพนักงาน
                            </NavLink>
                            <NavLink href="/permission" currentPath={pathname} icon={KeyIcon}>
                                สิทธิการใช้งาน
                            </NavLink>
                            <NavLink href="/holiday" currentPath={pathname} icon={CalendarDaysIcon}>
                                วันหยุด
                            </NavLink>
                        </div>
                    )}

                    {/* ตั้งค่า */}
                    <button
                        onClick={() => toggleMenu("settings")}
                        className="w-full flex justify-between items-center px-3 py-2 rounded hover:bg-gray-700 cursor-pointer"
                    >
                        <span className="flex items-center gap-2">
                            <Cog6ToothIcon className="w-5 h-5" />
                            ข้อมูลหลัก
                        </span>
                        <span className="text-sm">{openMenus.includes("settings") ? "▲" : "▼"}</span>
                    </button>

                    {openMenus.includes("settings") && (
                        <div className="ml-4 mt-1 space-y-1">
                            <NavLink href="/equipment" currentPath={pathname} icon={WrenchScrewdriverIcon}>
                                ระบบ & อุปกรณ์
                            </NavLink>
                            {/* <NavLink href="/upload-file" currentPath={pathname}>Upload File</NavLink> */}
                        </div>
                    )}

                    {/* โครงการ */}
                    <button
                        onClick={() => toggleMenu("projects")}
                        className="w-full flex justify-between items-center px-3 py-2 rounded hover:bg-gray-700 cursor-pointer"
                    >
                        <span className="flex items-center gap-2">
                            <ClipboardDocumentListIcon className="w-5 h-5" />
                            ตั้งค่ารายงาน
                        </span>
                        <span className="text-sm">{openMenus.includes("projects") ? "▲" : "▼"}</span>
                    </button>

                    {openMenus.includes("projects") && (
                        <div className="ml-4 mt-1 space-y-1">
                            <NavLink href="/inspection-form" currentPath={pathname} icon={DocumentTextIcon}>
                                จัดการแบบฟอร์ม
                            </NavLink>
                            <NavLink href="/customer" currentPath={pathname} icon={UserGroupIcon}>
                                จัดการข้อมูลลูกค้า
                            </NavLink>
                            <NavLink href="/project-list" currentPath={pathname} icon={ClipboardDocumentListIcon}>
                                จัดการโครงการ
                            </NavLink>
                            <NavLink href="/job" currentPath={pathname} icon={BriefcaseIcon}>
                                จัดการงาน
                            </NavLink>
                            <NavLink href="/inspection-type" currentPath={pathname} icon={Cog6ToothIcon}>
                                จัดการแผนงาน
                            </NavLink>
                            <NavLink href="/report" currentPath={pathname} icon={DocumentTextIcon}>
                                ลงข้อมูลแบบฟอร์ม
                            </NavLink>
                            <NavLink href="/plan" currentPath={pathname} icon={TableCellsIcon}>
                                ตารางแผนงาน
                            </NavLink>
                            <NavLink href="/inspection" currentPath={pathname} icon={DocumentMagnifyingGlassIcon}>
                                แสดงผลรายงาน
                            </NavLink>
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
                <main className="p-4 bg-gray-50 flex-1">{children}</main>
            </div>
        </div>
    );
}

function NavLink({
    href,
    currentPath,
    children,
    icon: Icon,
}: {
    href: string;
    currentPath: string;
    children: React.ReactNode;
    icon?: React.ElementType;
}) {
    const active = currentPath === href;

    const handleClick: React.MouseEventHandler<HTMLAnchorElement> = (e) => {
        if (
            e.metaKey || e.ctrlKey || e.shiftKey || e.altKey ||
            e.button === 1
        ) return;

        if (currentPath === href) return;
        showLoading(true);
    };

    return (
        <Link
            href={href}
            onClick={handleClick}
            className={`flex items-center gap-2 px-3 py-2 rounded ${active ? "bg-blue-600 text-white" : "hover:bg-gray-700"
                }`}
        >
            {Icon && <Icon className="w-5 h-5" />}
            {children}
        </Link>
    );
}
