'use client'

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DataLeashLogoCompact } from "./DataLeashLogo";
import { useNotifications, useAuth } from "@/lib/hooks";
import { TierBadge, ProBadge } from "./TierBadge";
import {
    LayoutDashboard, FolderLock, Upload, KeyRound, Activity,
    Users, Bell, BarChart3, Ban, Eye, FileText, Settings,
    Github, LogOut, Globe, Link2, Menu, X, Command, Shield
} from "lucide-react";
import { useState } from "react";
import { CommandPalette } from "./CommandPalette";

interface SidebarProps {
    showLogout?: boolean;
}

export function Sidebar({ showLogout = true }: SidebarProps) {
    const pathname = usePathname();
    const { unreadCount } = useNotifications();
    const { signOut, user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);

    const navItems = [
        ...(user?.is_admin ? [{
            icon: Shield,
            label: "Admin Portal",
            href: "/admin",
            color: "from-red-600 to-red-900",
            badge: "ADMIN"
        }] : []),
        { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard", color: "from-cyan-500 to-blue-600" },
        { icon: FolderLock, label: "My Files", href: "/dashboard/files", color: "from-emerald-500 to-green-600" },
        { icon: Upload, label: "Upload", href: "/dashboard/upload", color: "from-purple-500 to-violet-600" },
        { icon: Settings, label: "Policies", href: "/dashboard/policies", color: "from-violet-500 to-fuchsia-600" },
        { icon: KeyRound, label: "Access Requests", href: "/dashboard/requests", color: "from-amber-500 to-orange-600" },
        { icon: Activity, label: "Activity Log", href: "/dashboard/activity", color: "from-pink-500 to-rose-600" },
        { icon: Users, label: "Contacts", href: "/dashboard/contacts", color: "from-indigo-500 to-purple-600" },
        { icon: Eye, label: "Viewers", href: "/dashboard/viewers", color: "from-cyan-500 to-teal-600" },
        { icon: Bell, label: "Notifications", href: "/dashboard/notifications", badge: unreadCount || undefined, color: "from-yellow-500 to-amber-600" },
        { icon: BarChart3, label: "Analytics", href: "/dashboard/analytics", color: "from-teal-500 to-cyan-600", proOnly: true },
        { icon: Shield, label: "Security", href: "/dashboard/security", color: "from-emerald-500 to-green-600", proOnly: true },
        { icon: Globe, label: "World Map", href: "/dashboard/map", color: "from-blue-500 to-indigo-600", proOnly: true },
        { icon: Link2, label: "Chain View", href: "/dashboard/chain", color: "from-violet-500 to-purple-600", proOnly: true },
        { icon: Ban, label: "Blacklist", href: "/dashboard/blacklist", color: "from-red-500 to-rose-600", proOnly: true },
        { icon: Eye, label: "Leakers", href: "/dashboard/leakers", color: "from-orange-500 to-red-600", proOnly: true },
        { icon: FileText, label: "Reports", href: "/dashboard/reports", color: "from-sky-500 to-blue-600", proOnly: true },
        { icon: Settings, label: "Settings", href: "/dashboard/settings", color: "from-slate-500 to-gray-600" },
    ];

    const isActive = (href: string) => {
        if (href === "/dashboard") {
            return pathname === "/dashboard";
        }
        return pathname?.startsWith(href);
    };

    return (
        <>
            {/* Mobile Toggle */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="md:hidden fixed top-4 left-4 z-[60] p-2 glass-card rounded-lg text-white hover:bg-white/10 transition"
            >
                {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[45] md:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <aside className={`
                fixed left-0 top-0 bottom-0 w-64 glass-card m-4 p-6 flex flex-col z-50
                transition-transform duration-300 ease-in-out
                md:translate-x-0
                ${isOpen ? 'translate-x-0' : '-translate-x-[120%]'}
            `}>
                <Link href="/dashboard" className="mb-4" onClick={() => setIsOpen(false)}>
                    <DataLeashLogoCompact size={36} />
                </Link>

                {/* Tier Badge */}
                <TierBadge className="mb-4" />

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
                            <span className="text-sm flex-1">{item.label}</span>
                            {item.proOnly && <ProBadge />}
                            {item.badge && (
                                <span className="bg-[var(--error)] text-white text-xs px-2 py-0.5 rounded-full">
                                    {item.badge}
                                </span>
                            )}
                        </Link>
                    ))}
                </nav>



                {showLogout && (
                    <div className="border-t border-[rgba(0,212,255,0.2)] space-y-1 pt-2">
                        {/* Command Palette Hint */}
                        <button
                            onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
                            className="flex items-center gap-3 px-3 py-2 text-[var(--foreground-muted)] hover:text-white transition w-full rounded-lg hover:bg-[rgba(0,212,255,0.1)] group"
                        >
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-600 to-slate-700 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                                <Command className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-sm flex-1 text-left">Search</span>
                            <kbd className="px-1.5 py-0.5 text-xs bg-[rgba(255,255,255,0.1)] rounded">⌘K</kbd>
                        </button>

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

            {/* Global Command Palette */}
            <CommandPalette />
        </>
    );
}

export default Sidebar;
