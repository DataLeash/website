'use client'

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DataLeashLogoCompact } from "./DataLeashLogo";
import { useNotifications, useAuth } from "@/lib/hooks";
import {
    LayoutDashboard, FolderLock, Upload, KeyRound, Activity,
    Users, Bell, BarChart3, Ban, Eye, FileText, Settings,
    Github, LogOut, Globe, Link2
} from "lucide-react";

interface SidebarProps {
    showLogout?: boolean;
}

export function Sidebar({ showLogout = true }: SidebarProps) {
    const pathname = usePathname();
    const { unreadCount } = useNotifications();
    const { signOut } = useAuth();

    const navItems = [
        { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard", color: "from-cyan-500 to-blue-600" },
        { icon: FolderLock, label: "My Files", href: "/dashboard/files", color: "from-emerald-500 to-green-600" },
        { icon: Upload, label: "Upload", href: "/dashboard/upload", color: "from-purple-500 to-violet-600" },
        { icon: KeyRound, label: "Access Requests", href: "/dashboard/requests", color: "from-amber-500 to-orange-600" },
        { icon: Activity, label: "Activity Log", href: "/dashboard/activity", color: "from-pink-500 to-rose-600" },
        { icon: Users, label: "Contacts", href: "/dashboard/contacts", color: "from-indigo-500 to-purple-600" },
        { icon: Bell, label: "Notifications", href: "/dashboard/notifications", badge: unreadCount || undefined, color: "from-yellow-500 to-amber-600" },
        { icon: BarChart3, label: "Analytics", href: "/dashboard/analytics", color: "from-teal-500 to-cyan-600" },
        { icon: Globe, label: "World Map", href: "/dashboard/map", color: "from-blue-500 to-indigo-600" },
        { icon: Link2, label: "Chain View", href: "/dashboard/chain", color: "from-violet-500 to-purple-600" },
        { icon: Ban, label: "Blacklist", href: "/dashboard/blacklist", color: "from-red-500 to-rose-600" },
        { icon: Eye, label: "Leakers", href: "/dashboard/leakers", color: "from-orange-500 to-red-600" },
        { icon: FileText, label: "Reports", href: "/dashboard/reports", color: "from-sky-500 to-blue-600" },
        { icon: Settings, label: "Settings", href: "/dashboard/settings", color: "from-slate-500 to-gray-600" },
    ];

    const isActive = (href: string) => {
        if (href === "/dashboard") {
            return pathname === "/dashboard";
        }
        return pathname?.startsWith(href);
    };

    return (
        <aside className="fixed left-0 top-0 bottom-0 w-64 glass-card m-4 p-6 flex flex-col z-40">
            <Link href="/dashboard" className="mb-8">
                <DataLeashLogoCompact size={36} />
            </Link>

            <nav className="flex-1 space-y-1 overflow-y-auto">
                {navItems.map((item, i) => (
                    <Link
                        key={i}
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition group ${isActive(item.href)
                            ? "bg-[var(--primary)] text-black font-semibold"
                            : "hover:bg-[rgba(0,212,255,0.1)]"
                            }`}
                    >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActive(item.href)
                            ? "bg-black/20"
                            : `bg-gradient-to-br ${item.color} shadow-lg`
                            } group-hover:scale-110 transition-transform`}>
                            <item.icon className={`w-4 h-4 ${isActive(item.href) ? 'text-black' : 'text-white'}`} />
                        </div>
                        <span className="text-sm">{item.label}</span>
                        {item.badge && (
                            <span className="ml-auto bg-[var(--error)] text-white text-xs px-2 py-0.5 rounded-full">
                                {item.badge}
                            </span>
                        )}
                    </Link>
                ))}
            </nav>

            {/* GitHub Link */}
            <div className="pt-4 border-t border-[rgba(0,212,255,0.2)]">
                <a
                    href="https://github.com/soul-less-king"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-3 py-2.5 text-[var(--foreground-muted)] hover:text-white transition w-full rounded-lg hover:bg-[rgba(0,212,255,0.1)] group"
                >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                        <Github className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm">GitHub</span>
                </a>
            </div>

            {showLogout && (
                <div className="border-t border-[rgba(0,212,255,0.2)]">
                    <button
                        onClick={() => signOut()}
                        className="flex items-center gap-3 px-3 py-2.5 text-[var(--foreground-muted)] hover:text-white transition w-full rounded-lg hover:bg-[rgba(255,100,100,0.1)] group"
                    >
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                            <LogOut className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-sm">Logout</span>
                    </button>
                </div>
            )}
        </aside>
    );
}

export default Sidebar;
