"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { showLoading } from "@/lib/loading";

import {
    Bars3Icon,
    ChevronLeftIcon,
    UserCircleIcon,
} from "@heroicons/react/24/solid";
import {
    ArrowRightOnRectangleIcon,
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
    ChevronDownIcon,
} from "@heroicons/react/24/outline";

export default function MainLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();

    const [openMenus, setOpenMenus] = useState<string[]>([]);
    const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
    const avatarUrl = "";

    // ปิดโหลดเมื่อเปลี่ยนหน้า
    useEffect(() => {
        showLoading(false);
    }, [pathname]);

    // ยุบ sidebar อัตโนมัติเมื่อจอกว้างน้อย (ให้ฟีล responsive)
    useEffect(() => {
        if (typeof window !== "undefined" && window.innerWidth < 1024) {
            setIsCollapsed(true);
        }
    }, []);

    const toggleMenu = (menuId: string) => {
        setOpenMenus((prev) =>
            prev.includes(menuId) ? prev.filter((id) => id !== menuId) : [...prev, menuId]
        );
    };

    const handleLogout = async () => {
        showLoading(true);
        await fetch("/api/auth/logout", { method: "POST" });
        showLoading(false);
        router.replace("/login");
    };

    const collapse = () => setIsCollapsed(true);
    const expand = () => setIsCollapsed(false);

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Sidebar */}
            <aside
                className={`flex flex-col h-screen overflow-y-hidden
              bg-gray-800 text-white border-r border-black/10
              transition-all duration-300 ease-in-out
              ${isCollapsed ? "w-16" : "w-64"}`}
            >
                {/* Top area: logo + toggle */}
                <div
                    className={`flex-none relative flex flex-col items-center justify-center p-4`}
                >
                    {/* block ซ้าย: โลโก้+ชื่อ ตอนขยาย / ช่องว่างตอนย่อ */}
                    <div className={`${isCollapsed ? "h-10" : "flex items-center gap-2 flex-col"}`}>
                        {!isCollapsed && (
                            <>
                                <img
                                    src="/images/NewLOGOSF.webp"
                                    alt="Logo"
                                    className="w-[50px] h-[50px]"
                                />
                                <span className="text-lg font-semibold">Shinaracha</span>
                            </>
                        )}
                    </div>

                    {/* ปุ่ม toggle ลอยขวา คงตำแหน่งเดิม */}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {!isCollapsed ? (
                            <button
                                onClick={collapse}
                                className="rounded-xl p-2 bg-white/15 hover:bg-white/25 transition cursor-pointer"
                                title="ย่อเมนู"
                            >
                                <ChevronLeftIcon className="w-5 h-5" />
                            </button>
                        ) : (
                            <button
                                onClick={expand}
                                className="rounded-xl p-2 bg-white/15 hover:bg-white/25 transition cursor-pointer"
                                title="ขยายเมนู"
                            >
                                <Bars3Icon className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex-none w-[90%] h-px bg-white/60 mx-auto" />

                {/* NAV */}
                <nav className="flex-1 min-h-0 overflow-y-auto px-2 py-3 space-y-2 scrollbar-hide">
                    {/* หน้าหลัก */}
                    <NavLink
                        href="/dashboard"
                        currentPath={pathname}
                        icon={HomeIcon}
                        collapsed={isCollapsed}
                    >
                        หน้าหลัก
                    </NavLink>

                    {/* กลุ่ม: ข้อมูลบริษัท */}
                    <SectionButton
                        icon={BuildingOfficeIcon}
                        label="ข้อมูลบริษัท"
                        open={openMenus.includes("company")}
                        onClick={() => toggleMenu("company")}
                        collapsed={isCollapsed}
                    />
                    {openMenus.includes("company") && !isCollapsed && (
                        <div className="ml-7 mt-1 space-y-1">
                            <NavLink href="/team" currentPath={pathname} icon={UsersIcon} collapsed={isCollapsed}>
                                ทีมตรวจ
                            </NavLink>
                            <NavLink href="/zone" currentPath={pathname} icon={MapIcon} collapsed={isCollapsed}>
                                พื้นที่การตรวจ
                            </NavLink>
                            <NavLink
                                href="/employee"
                                currentPath={pathname}
                                icon={IdentificationIcon}
                                collapsed={isCollapsed}
                            >
                                ข้อมูลพนักงาน
                            </NavLink>
                            <NavLink
                                href="/permission"
                                currentPath={pathname}
                                icon={KeyIcon}
                                collapsed={isCollapsed}
                            >
                                สิทธิการใช้งาน
                            </NavLink>
                            <NavLink
                                href="/holiday"
                                currentPath={pathname}
                                icon={CalendarDaysIcon}
                                collapsed={isCollapsed}
                            >
                                วันหยุด
                            </NavLink>
                        </div>
                    )}

                    {/* กลุ่ม: ข้อมูลหลัก */}
                    <SectionButton
                        icon={Cog6ToothIcon}
                        label="ข้อมูลหลัก"
                        open={openMenus.includes("settings")}
                        onClick={() => toggleMenu("settings")}
                        collapsed={isCollapsed}
                    />
                    {openMenus.includes("settings") && !isCollapsed && (
                        <div className="ml-7 mt-1 space-y-1">
                            <NavLink
                                href="/equipment"
                                currentPath={pathname}
                                icon={WrenchScrewdriverIcon}
                                collapsed={isCollapsed}
                            >
                                ระบบ & อุปกรณ์
                            </NavLink>
                        </div>
                    )}

                    {/* กลุ่ม: ตั้งค่ารายงาน */}
                    <SectionButton
                        icon={ClipboardDocumentListIcon}
                        label="ตั้งค่ารายงาน"
                        open={openMenus.includes("projects")}
                        onClick={() => toggleMenu("projects")}
                        collapsed={isCollapsed}
                    />
                    {openMenus.includes("projects") && !isCollapsed && (
                        <div className="ml-7 mt-1 space-y-1">
                            <NavLink
                                href="/inspection-form"
                                currentPath={pathname}
                                icon={DocumentTextIcon}
                                collapsed={isCollapsed}
                            >
                                จัดการแบบฟอร์ม
                            </NavLink>
                            <NavLink
                                href="/customer"
                                currentPath={pathname}
                                icon={UserGroupIcon}
                                collapsed={isCollapsed}
                            >
                                ข้อมูลลูกค้า
                            </NavLink>
                            <NavLink
                                href="/project-list"
                                currentPath={pathname}
                                icon={ClipboardDocumentListIcon}
                                collapsed={isCollapsed}
                            >
                                จัดการโครงการ
                            </NavLink>
                            <NavLink href="/job" currentPath={pathname} icon={BriefcaseIcon} collapsed={isCollapsed} title="จัดการงาน">
                                จัดการงาน
                            </NavLink>
                            <NavLink
                                href="/inspection-type"
                                currentPath={pathname}
                                icon={Cog6ToothIcon}
                                collapsed={isCollapsed}
                            >
                                การบริการ
                            </NavLink>
                            <NavLink
                                href="/report"
                                currentPath={pathname}
                                icon={DocumentTextIcon}
                                collapsed={isCollapsed}
                            >
                                ข้อมูลแบบฟอร์ม
                            </NavLink>
                            <NavLink
                                href="/plan"
                                currentPath={pathname}
                                icon={TableCellsIcon}
                                collapsed={isCollapsed}
                            >
                                ตารางแผนงาน
                            </NavLink>
                            <NavLink
                                href="/inspection"
                                currentPath={pathname}
                                icon={DocumentMagnifyingGlassIcon}
                                collapsed={isCollapsed}
                            >
                                แสดงผลรายงาน
                            </NavLink>
                        </div>
                    )}
                </nav>

                {/* Bottom user box */}
                <div className={`flex-none border-t border-gray-700 flex items-center justify-between ${isCollapsed ? "px-2 py-3" : "px-4 py-4"}`}>
                    <div className={`flex items-center ${isCollapsed ? "justify-center w-full" : "space-x-2"}`}>
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="User" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                            <UserCircleIcon className="w-10 h-10 text-gray-400" />
                        )}
                        {!isCollapsed && (
                            <div>
                                <div className="text-sm font-semibold">username</div>
                                <div className="text-xs text-gray-400">ตำแหน่ง</div>
                            </div>
                        )}
                    </div>

                    {!isCollapsed && (
                        <button onClick={handleLogout} className="text-red-500 hover:text-red-600 cursor-pointer" title="ออกจากระบบ">
                            <ArrowRightOnRectangleIcon className="w-6 h-6" />
                        </button>
                    )}
                </div>
            </aside>

            {/* Content */}
            <div className="flex-1 flex flex-col">
                <main
                    className={`flex-1 min-w-0 overflow-auto p-4 bg-gray-50 w-full mx-auto 
      ${isCollapsed ? "max-w-[1856px]" : "max-w-[1664px]"}`}
                >
                    {children}
                </main>
            </div>
        </div>
    );
}

/* ---------- Components ---------- */

function NavLink({
    href,
    currentPath,
    children,
    icon: Icon,
    collapsed = false,
    title,
}: {
    href: string;
    currentPath: string;
    children: React.ReactNode;
    icon?: React.ElementType;
    collapsed?: boolean;
    title?: string;
}) {
    const active = currentPath === href;

    const handleClick: React.MouseEventHandler<HTMLAnchorElement> = (e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button === 1) return;
        if (currentPath === href) return;
        showLoading(true);
    };

    return (
        <Link
            href={href}
            onClick={handleClick}
            title={collapsed ? (typeof children === "string" ? children : title) : undefined}
            className={`flex items-center gap-3 rounded px-3 py-2 transition 
        ${collapsed ? "justify-center" : ""}
        ${active ? "bg-blue-600 text-white" : "hover:bg-gray-700/80"}
      `}
        >
            {Icon && <Icon className="w-5 h-5 shrink-0" />}
            {!collapsed && <span className="truncate">{children}</span>}
        </Link>
    );
}

function SectionButton({
    icon: Icon,
    label,
    open,
    onClick,
    collapsed,
}: {
    icon: React.ElementType;
    label: string;
    open: boolean;
    onClick: () => void;
    collapsed: boolean;
}) {
    return (
        <button
            onClick={onClick}
            title={collapsed ? label : undefined}
            className={`cursor-pointer w-full flex items-center rounded px-3 py-2 hover:bg-gray-700/80 transition 
        ${collapsed ? "justify-center" : "justify-between"}`}
        >
            <span className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
                <Icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span>{label}</span>}
            </span>
            {!collapsed && <ChevronDownIcon className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />}
        </button>
    );
}
