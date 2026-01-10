'use client'

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon3D } from "./Icon3D";
import { DataLeashLogo } from "./DataLeashLogo";
import { useNotifications, useAuth } from "@/lib/hooks";

interface SidebarProps {
    showLogout?: boolean;
}

export function Sidebar({ showLogout = true }: SidebarProps) {
    const pathname = usePathname();
    const { unreadCount } = useNotifications();
    const { signOut } = useAuth();

    const navItems = [
        { iconType: "dashboard", label: "Dashboard", href: "/dashboard" },
        { iconType: "folder", label: "My Files", href: "/dashboard/files" },
        { iconType: "upload", label: "Upload", href: "/dashboard/upload" },
        { iconType: "lock", label: "Access Requests", href: "/dashboard/requests" },
        { iconType: "activity", label: "Activity Log", href: "/dashboard/activity" },
        { iconType: "users", label: "Contacts", href: "/dashboard/contacts" },
        { iconType: "bell", label: "Notifications", href: "/dashboard/notifications", badge: unreadCount || undefined },
        { iconType: "chart", label: "Analytics", href: "/dashboard/analytics" },
        { iconType: "danger", label: "Blacklist", href: "/dashboard/blacklist" },
        { iconType: "eye", label: "Leakers", href: "/dashboard/leakers" },
        { iconType: "report", label: "Reports", href: "/dashboard/reports" },
        { iconType: "settings", label: "Settings", href: "/dashboard/settings" },
    ];

    const isActive = (href: string) => {
        if (href === "/dashboard") {
            return pathname === "/dashboard";
        }
        return pathname?.startsWith(href);
    };

    return (
        <aside className="fixed left-0 top-0 bottom-0 w-64 glass-card m-4 p-6 flex flex-col z-40">
            <Link href="/dashboard" className="flex items-center gap-3 mb-8">
                <DataLeashLogo size={40} />
                <span className="font-bold text-gradient">Data Leash</span>
            </Link>

            <nav className="flex-1 space-y-2 overflow-y-auto">
                {navItems.map((item, i) => (
                    <Link
                        key={i}
                        href={item.href}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${isActive(item.href)
                            ? "bg-[var(--primary)] text-black font-semibold"
                            : "hover:bg-[rgba(0,212,255,0.1)]"
                            }`}
                    >
                        <Icon3D type={item.iconType} size="sm" />
                        <span>{item.label}</span>
                        {item.badge && (
                            <span className="ml-auto bg-[var(--error)] text-white text-xs px-2 py-0.5 rounded-full">
                                {item.badge}
                            </span>
                        )}
                    </Link>
                ))}
            </nav>

            {showLogout && (
                <div className="pt-4 border-t border-[rgba(0,212,255,0.2)]">
                    <button
                        onClick={() => signOut()}
                        className="flex items-center gap-3 px-4 py-3 text-[var(--foreground-muted)] hover:text-white transition w-full rounded-lg hover:bg-[rgba(255,100,100,0.1)]"
                    >
                        <Icon3D type="danger" size="sm" />
                        <span>Logout</span>
                    </button>
                </div>
            )}
        </aside>
    );
}

export default Sidebar;
