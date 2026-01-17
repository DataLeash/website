'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
    LayoutDashboard, Users, CreditCard, Activity,
    Shield, LogOut, Lock, Settings, AlertTriangle,
    FileText, Database, Bell
} from 'lucide-react'
import { createClient } from '@/lib/supabase-browser'

interface AdminData {
    isAdmin: boolean
    user: {
        id: string
        email: string
        fullName: string
        tier: string
    } | null
    systemStats: {
        totalUsers: number
        totalFiles: number
        proUsers: number
    } | null
    permissions: {
        canManageUsers: boolean
        canViewLogs: boolean
        canManagePayments: boolean
        canModifySettings: boolean
        canDeleteFiles: boolean
    } | null
}

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)
    const [adminData, setAdminData] = useState<AdminData | null>(null)
    const [error, setError] = useState<string | null>(null)
    const supabase = createClient()

    useEffect(() => {
        async function verifyAdmin() {
            try {
                // Use server-side verification API to bypass RLS
                const response = await fetch('/api/admin/verify')
                const data = await response.json()

                if (!response.ok || !data.authenticated) {
                    router.push('/login?redirect=/admin')
                    return
                }

                if (!data.isAdmin) {
                    console.warn('User is not an admin:', data)
                    router.push('/dashboard')
                    return
                }

                setAdminData(data)
            } catch (err) {
                console.error('Admin verification error:', err)
                setError('Failed to verify admin access')
                router.push('/login?redirect=/admin')
            } finally {
                setIsLoading(false)
            }
        }

        verifyAdmin()
    }, [router])

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center text-white">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500 mx-auto mb-4"></div>
                    <p className="text-gray-400 text-sm">Verifying admin access...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center text-white">
                <div className="text-center">
                    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <p className="text-red-400">{error}</p>
                </div>
            </div>
        )
    }

    if (!adminData?.isAdmin) return null

    const navItems = [
        { name: 'Overview', href: '/admin', icon: LayoutDashboard },
        { name: 'User Management', href: '/admin/users', icon: Users },
        { name: 'Payment Monitoring', href: '/admin/payments', icon: CreditCard },
        { name: 'System Logs', href: '/admin/logs', icon: Activity },
        { name: 'Settings', href: '/admin/settings', icon: Settings },
    ]

    return (
        <div className="min-h-screen bg-[#050505] text-gray-100 flex font-sans">
            {/* Admin Sidebar */}
            <aside className="w-64 bg-[#0A0A0A] border-r border-red-900/30 flex flex-col fixed h-full z-10">
                {/* Header */}
                <div className="p-6 border-b border-red-900/30 bg-gradient-to-r from-red-950/20 to-transparent">
                    <div className="flex items-center gap-2 text-red-500">
                        <Shield className="w-7 h-7 fill-current" />
                        <span className="font-bold text-xl tracking-wider">ADMIN<span className="text-white">PORTAL</span></span>
                    </div>
                    <div className="text-xs text-red-400/60 mt-1 uppercase tracking-widest pl-9">System Owner Access</div>
                </div>

                {/* Quick Stats */}
                {adminData.systemStats && (
                    <div className="p-4 border-b border-gray-800/50">
                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="bg-[#050505] rounded-lg p-2">
                                <div className="text-lg font-bold text-white">{adminData.systemStats.totalUsers}</div>
                                <div className="text-[10px] text-gray-500 uppercase">Users</div>
                            </div>
                            <div className="bg-[#050505] rounded-lg p-2">
                                <div className="text-lg font-bold text-white">{adminData.systemStats.totalFiles}</div>
                                <div className="text-[10px] text-gray-500 uppercase">Files</div>
                            </div>
                            <div className="bg-[#050505] rounded-lg p-2">
                                <div className="text-lg font-bold text-yellow-500">{adminData.systemStats.proUsers}</div>
                                <div className="text-[10px] text-gray-500 uppercase">Pro</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                                    ? 'bg-red-500/10 text-red-500 border border-red-500/20 shadow-lg shadow-red-500/5'
                                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                <item.icon className="w-5 h-5" />
                                {item.name}
                            </Link>
                        )
                    })}
                </nav>

                {/* Admin Info */}
                <div className="p-4 border-t border-gray-800">
                    {/* Security Notice */}
                    <div className="bg-red-950/20 border border-red-900/30 rounded-lg p-3 mb-4">
                        <div className="flex items-center gap-2 text-red-400 text-xs font-bold mb-1">
                            <Lock className="w-3 h-3" />
                            SECURE SESSION
                        </div>
                        <div className="text-[10px] text-red-300/60 leading-tight">
                            {adminData.user?.email}
                        </div>
                        <div className="text-[10px] text-gray-500 mt-1">
                            All actions are logged and audited.
                        </div>
                    </div>

                    {/* Permissions Badge */}
                    <div className="flex flex-wrap gap-1 mb-4">
                        {adminData.permissions?.canManageUsers && (
                            <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[9px] rounded uppercase font-bold">Users</span>
                        )}
                        {adminData.permissions?.canViewLogs && (
                            <span className="px-2 py-0.5 bg-green-500/10 text-green-400 text-[9px] rounded uppercase font-bold">Logs</span>
                        )}
                        {adminData.permissions?.canManagePayments && (
                            <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-400 text-[9px] rounded uppercase font-bold">Payments</span>
                        )}
                    </div>

                    <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 w-full px-4 py-2 text-gray-400 hover:text-red-400 hover:bg-red-500/5 rounded-lg transition text-sm font-medium"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 p-8 bg-[#050505]">
                {children}
            </main>
        </div>
    )
}
