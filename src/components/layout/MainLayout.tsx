"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { showLoading } from "@/lib/loading";
import { CurrentUser } from "@/interfaces/master";

import {
    Bars3Icon,
    ChevronLeftIcon,
    UserCircleIcon,
    XMarkIcon,
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
    ChevronDownIcon,
    MapPinIcon,
    Squares2X2Icon,
    ScaleIcon,
    ExclamationTriangleIcon
} from "@heroicons/react/24/outline";

export default function MainLayout({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<CurrentUser | null>(null);
    const pathname = usePathname();
    const router = useRouter();
    const [openMenus, setOpenMenus] = useState<string[]>([]);
    const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const avatarUrl = user?.image_url ? `/images/profile/${user.image_url}` : null;
    const isShinaracha = user?.company_id === "COM-27162740";
    const isTaskOnly = user?.permission_id === "PER-93994499";

    useEffect(() => {
        showLoading(false);
    }, [pathname]);

    useEffect(() => {
        if (typeof window !== "undefined" && window.innerWidth < 1024) {
            setIsCollapsed(true);
        }
    }, []);

    useEffect(() => {
        try {
            const saved = localStorage.getItem("currentUser");
            if (saved) setUser(JSON.parse(saved));
        } catch { }
    }, []);

    const toggleMenu = (menuId: string) => {
        setOpenMenus((prev) =>
            prev.includes(menuId)
                ? prev.filter((id) => id !== menuId)
                : [...prev, menuId]
        );
    };

    const handleLogout = async () => {
        showLoading(true);
        await fetch("/api/auth/logout", { method: "POST" });
        try {
            localStorage.removeItem("currentUser");
            sessionStorage.clear();
        } catch { }
        router.replace("/login");
        showLoading(false);
    };

    const collapse = () => setIsCollapsed(true);
    const expand = () => setIsCollapsed(false);
    const closeMobileMenu = () => setIsMobileMenuOpen(false);

    return (
        <div className="flex min-h-screen bg-gray-50 relative">
            {/* Mobile Top Bar */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-gray-800 text-white shadow-lg">
                <div className="flex items-center justify-between px-4 py-3">
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
                        aria-label="เปิดเมนู"
                    >
                        <Bars3Icon className="w-6 h-6" />
                    </button>

                    <div className="flex items-center gap-2">
                        <img
                            src={
                                isShinaracha
                                    ? "/images/Logo_Shinaracha.webp"
                                    : "/images/Logo_Profire.png"
                            }
                            alt="Logo"
                            className="w-8 h-8"
                        />
                        <span className="font-semibold text-lg">
                            {isShinaracha ? "Shinaracha" : "Profire Inspector"}
                        </span>
                    </div>

                    {avatarUrl ? (
                        <img
                            src={avatarUrl}
                            alt="User"
                            className="w-8 h-8 rounded-full object-cover"
                        />
                    ) : (
                        <UserCircleIcon className="w-8 h-8 text-gray-300" />
                    )}
                </div>
            </div>

            {/* Sidebar */}
            <aside
                className={`fixed lg:static top-0 left-0 h-screen bg-gray-800 text-white border-r border-black/10 flex flex-col transition-all duration-300 ease-in-out z-40 overflow-hidden
                    ${isCollapsed ? "lg:w-16" : "lg:w-70"}
                    ${isMobileMenuOpen ? "translate-x-0 w-72" : "-translate-x-full lg:translate-x-0"}
                `}
            >
                {/* Mobile Header */}
                <div className="lg:hidden flex justify-between items-center px-4 py-3 border-b border-gray-700">
                    <span className="text-lg font-semibold">เมนู</span>
                    <button
                        onClick={closeMobileMenu}
                        className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
                        aria-label="ปิดเมนู"
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Desktop Logo */}
                <div className="hidden lg:flex flex-col items-center justify-center p-6 relative">
                    {!isCollapsed && (
                        <>
                            <img
                                src={
                                    isShinaracha
                                        ? "/images/Logo_Shinaracha.webp"
                                        : "/images/Logo_Profire.png"
                                }
                                alt="Logo"
                                className="w-[80px] h-[70px]"
                            />
                            <span className="text-lg font-semibold mt-2">
                                {isShinaracha ? "Shinaracha" : "Profire Inspector"}
                            </span>
                        </>
                    )}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {!isCollapsed ? (
                            <button
                                onClick={collapse}
                                className="rounded-xl p-2 bg-white/15 hover:bg-white/25 transition"
                                title="ย่อเมนู"
                            >
                                <ChevronLeftIcon className="w-5 h-5" />
                            </button>
                        ) : (
                            <button
                                onClick={expand}
                                className="rounded-xl p-2 bg-white/15 hover:bg-white/25 transition"
                                title="ขยายเมนู"
                            >
                                <Bars3Icon className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>

                <div className="hidden lg:block flex-none w-[90%] h-px bg-white/60 mx-auto" />

                {/* Navigation - บนมือถือแสดงข้อความเต็ม, บน desktop ตาม isCollapsed */}
                <nav
                    className="flex-1 min-h-0 overflow-y-auto px-2 py-3 space-y-2"
                    style={{ scrollbarWidth: "thin", scrollbarColor: "#4B5563 #1F2937" }}
                >
                    {/* ====== เมนูทั้งหมดด้านบน: ซ่อนเมื่อเป็น TaskOnly ====== */}
                    {!isTaskOnly && (
                        <>
                            <NavLink
                                href="/dashboard"
                                currentPath={pathname}
                                icon={HomeIcon}
                                collapsed={isCollapsed}
                                isMobile={isMobileMenuOpen}
                                onClick={closeMobileMenu}
                            >
                                หน้าหลัก
                            </NavLink>

                            {/* ข้อมูลบริษัท */}
                            <SectionButton
                                icon={BuildingOfficeIcon}
                                label="ข้อมูลบริษัท"
                                open={openMenus.includes("company")}
                                onClick={() => toggleMenu("company")}
                                collapsed={isCollapsed}
                                isMobile={isMobileMenuOpen}
                            />
                            {openMenus.includes("company") && (!isCollapsed || isMobileMenuOpen) && (
                                <div className="ml-7 mt-1 space-y-1">
                                    <NavLink href="/company" currentPath={pathname} icon={BuildingOfficeIcon} collapsed={false} onClick={closeMobileMenu}>
                                        บริษัท
                                    </NavLink>
                                    <NavLink href="/team" currentPath={pathname} icon={UsersIcon} collapsed={false} onClick={closeMobileMenu}>
                                        ทีมตรวจ
                                    </NavLink>
                                    <NavLink href="/zone" currentPath={pathname} icon={MapIcon} collapsed={false} onClick={closeMobileMenu}>
                                        พื้นที่การตรวจ
                                    </NavLink>
                                    <NavLink href="/employee" currentPath={pathname} icon={IdentificationIcon} collapsed={false} onClick={closeMobileMenu}>
                                        ข้อมูลพนักงาน
                                    </NavLink>
                                    <NavLink href="/permission" currentPath={pathname} icon={KeyIcon} collapsed={false} onClick={closeMobileMenu}>
                                        สิทธิ์การใช้งาน
                                    </NavLink>
                                    <NavLink href="/holiday" currentPath={pathname} icon={CalendarDaysIcon} collapsed={false} onClick={closeMobileMenu}>
                                        วันหยุด
                                    </NavLink>
                                </div>
                            )}

                            {/* ข้อมูลหลัก */}
                            <SectionButton
                                icon={Cog6ToothIcon}
                                label="ข้อมูลหลัก Master Data"
                                open={openMenus.includes("settings")}
                                onClick={() => toggleMenu("settings")}
                                collapsed={isCollapsed}
                                isMobile={isMobileMenuOpen}
                            />
                            {openMenus.includes("settings") && (!isCollapsed || isMobileMenuOpen) && (
                                <div className="ml-7 mt-1 space-y-1">
                                    <NavLink href="/project-list" currentPath={pathname} icon={ClipboardDocumentListIcon} collapsed={false} onClick={closeMobileMenu}>
                                        จัดการโครงการ
                                    </NavLink>
                                    <NavLink href="/inspection-type" currentPath={pathname} icon={Cog6ToothIcon} collapsed={false} onClick={closeMobileMenu}>
                                        การบริการ
                                    </NavLink>
                                    <NavLink href="/customer-group" currentPath={pathname} icon={Squares2X2Icon} collapsed={false} onClick={closeMobileMenu}>
                                        กลุ่มลูกค้า
                                    </NavLink>
                                    <NavLink href="/customer" currentPath={pathname} icon={UserGroupIcon} collapsed={false} onClick={closeMobileMenu}>
                                        ข้อมูลลูกค้า
                                    </NavLink>
                                    <NavLink href="/equipment-type" currentPath={pathname} icon={Cog6ToothIcon} collapsed={false} onClick={closeMobileMenu}>
                                        ประเภทระบบ & อุปกรณ์
                                    </NavLink>
                                    <NavLink href="/inspection-form" currentPath={pathname} icon={DocumentTextIcon} collapsed={false} onClick={closeMobileMenu}>
                                        แบบฟอร์ม
                                    </NavLink>
                                    <NavLink href="/equipment" currentPath={pathname} icon={WrenchScrewdriverIcon} collapsed={false} onClick={closeMobileMenu}>
                                        ระบบ & อุปกรณ์
                                    </NavLink>
                                    <NavLink href="/location" currentPath={pathname} icon={MapPinIcon} collapsed={false} onClick={closeMobileMenu}>
                                        สถานที่ติดตั้ง
                                    </NavLink>
                                    <NavLink href="/legal-regulations" currentPath={pathname} icon={ScaleIcon} collapsed={false} onClick={closeMobileMenu}>
                                        ข้อบังคับกฎหมาย (major)
                                    </NavLink>
                                    <NavLink href="/defects" currentPath={pathname} icon={ExclamationTriangleIcon} collapsed={false} onClick={closeMobileMenu}>
                                        รายการปัญหา (minor)
                                    </NavLink>
                                </div>
                            )}
                        </>
                    )}

                    {/* ====== งาน Task (อยู่ล่างสุดเหมือนเดิม และ TaskOnly ก็ยังเห็น) ====== */}
                    <SectionButton
                        icon={ClipboardDocumentListIcon}
                        label="งาน Task"
                        open={openMenus.includes("projects")}
                        onClick={() => toggleMenu("projects")}
                        collapsed={isCollapsed}
                        isMobile={isMobileMenuOpen}
                    />
                    {openMenus.includes("projects") && (!isCollapsed || isMobileMenuOpen) && (
                        <div className="ml-7 mt-1 space-y-1">
                            <NavLink href="/job" currentPath={pathname} icon={BriefcaseIcon} collapsed={false} onClick={closeMobileMenu}>
                                จัดการงาน
                            </NavLink>
                            <NavLink href="/report" currentPath={pathname} icon={DocumentTextIcon} collapsed={false} onClick={closeMobileMenu}>
                                ข้อมูลแบบฟอร์ม
                            </NavLink>
                            <NavLink href="/plan" currentPath={pathname} icon={TableCellsIcon} collapsed={false} onClick={closeMobileMenu}>
                                ตารางแผนงาน
                            </NavLink>
                        </div>
                    )}
                </nav>

                {/* User Info & Logout - บนมือถือแสดงข้อความเต็ม */}
                <div className={`flex-none border-t border-gray-700 ${isCollapsed && !isMobileMenuOpen ? "px-2 py-3" : "px-4 py-4"}`}>
                    <div className="flex items-center justify-between">
                        <div className={`flex items-center min-w-0 ${isCollapsed && !isMobileMenuOpen ? "justify-center w-full" : "space-x-3 flex-1"}`}>
                            {avatarUrl ? (
                                <img
                                    src={avatarUrl}
                                    alt="User"
                                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                                />
                            ) : (
                                <UserCircleIcon className="w-10 h-10 text-gray-400 flex-shrink-0" />
                            )}

                            {(!isCollapsed || isMobileMenuOpen) && user && (
                                <div className="min-w-0 flex-1">
                                    <div className="text-sm font-semibold truncate">
                                        {user.first_name_th} {user.last_name_th}
                                    </div>
                                    <div className="text-xs text-gray-400 truncate">
                                        {user.permission_name}
                                    </div>
                                </div>
                            )}
                        </div>

                        {(!isCollapsed || isMobileMenuOpen) && (
                            <button
                                onClick={handleLogout}
                                className="text-red-500 hover:text-red-600 transition-colors flex-shrink-0 ml-2"
                                title="ออกจากระบบ"
                            >
                                <ArrowRightOnRectangleIcon className="w-6 h-6" />
                            </button>
                        )}
                    </div>
                </div>
            </aside>

            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                    onClick={closeMobileMenu}
                />
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col pt-14 lg:pt-0 min-w-0">
                <main className={`flex-1 overflow-auto p-3 sm:p-4 md:p-6 bg-gray-50 w-full mx-auto 
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
    isMobile = false,
    title,
    onClick,
}: {
    href: string;
    currentPath: string;
    children: React.ReactNode;
    icon?: React.ElementType;
    collapsed?: boolean;
    isMobile?: boolean;
    title?: string;
    onClick?: () => void;
}) {
    const active = currentPath === href;
    // บนมือถือแสดงข้อความเต็มเสมอ
    const showText = isMobile || !collapsed;

    const handleClick: React.MouseEventHandler<HTMLAnchorElement> = (e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button === 1) return;
        if (currentPath === href) return;
        showLoading(true);
        onClick?.();
    };

    return (
        <Link
            href={href}
            onClick={handleClick}
            title={!showText ? (typeof children === "string" ? children : title) : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors
                ${!showText ? "justify-center" : ""}
                ${active ? "bg-blue-600 text-white font-medium" : "hover:bg-gray-700/80"}
            `}
        >
            {Icon && <Icon className="w-5 h-5 shrink-0" />}
            {showText && <span className="truncate">{children}</span>}
        </Link>
    );
}

function SectionButton({
    icon: Icon,
    label,
    open,
    onClick,
    collapsed,
    isMobile = false,
}: {
    icon: React.ElementType;
    label: string;
    open: boolean;
    onClick: () => void;
    collapsed: boolean;
    isMobile?: boolean;
}) {
    // บนมือถือแสดงข้อความเต็มเสมอ
    const showText = isMobile || !collapsed;

    return (
        <button
            onClick={onClick}
            title={!showText ? label : undefined}
            className={`w-full flex items-center rounded-lg px-3 py-2.5 hover:bg-gray-700/80 transition-colors
                ${!showText ? "justify-center" : "justify-between"}
            `}
        >
            <span className={`flex items-center gap-3 ${!showText ? "justify-center" : ""}`}>
                <Icon className="w-5 h-5 shrink-0" />
                {showText && <span className="font-medium">{label}</span>}
            </span>
            {showText && (
                <ChevronDownIcon
                    className={`w-4 h-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                />
            )}
        </button>
    );
}