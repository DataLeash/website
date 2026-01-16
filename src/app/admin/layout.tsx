'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
    LayoutDashboard, Users, CreditCard, Activity,
    Shield, LogOut, Lock, FileText
} from 'lucide-react'
import { createClient } from '@/lib/supabase-browser'

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)
    const [isAdmin, setIsAdmin] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        async function checkAdmin() {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                router.push('/login?redirect=/admin')
                return
            }

            // Check admin status via API (which checks DB + Env)
            // We can also check DB directly here since we fixed RLS
            const { data: userData, error } = await supabase
                .from('users')
                .select('is_admin')
                .eq('id', user.id)
                .single()

            if (error || !userData?.is_admin) {
                console.error('Admin check failed:', error)
                router.push('/dashboard') // Redirect non-admins to user dashboard
                return
            }

            setIsAdmin(true)
            setIsLoading(false)
        }

        checkAdmin()
    }, [router, supabase])

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center text-white">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
            </div>
        )
    }

    if (!isAdmin) return null

    const navItems = [
        { name: 'Overview', href: '/admin', icon: LayoutDashboard },
        { name: 'User Management', href: '/admin/users', icon: Users },
        { name: 'Payment Monitoring', href: '/admin/payments', icon: CreditCard },
        { name: 'System Logs', href: '/admin/logs', icon: Activity },
    ]

    return (
        <div className="min-h-screen bg-[#050505] text-gray-100 flex font-sans">
            {/* Admin Sidebar */}
            <aside className="w-64 bg-[#0A0A0A] border-r border-gray-800 flex flex-col fixed h-full z-10">
                <div className="p-6 border-b border-gray-800">
                    <div className="flex items-center gap-2 text-red-500">
                        <Shield className="w-6 h-6 fill-current" />
                        <span className="font-bold text-lg tracking-wider">ADMIN<span className="text-white">PORTAL</span></span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1 uppercase tracking-widest pl-8">Restricted Access</div>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                                    ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                <item.icon className="w-5 h-5" />
                                {item.name}
                            </Link>
                        )
                    })}
                </nav>

                <div className="p-4 border-t border-gray-800">
                    <div className="bg-red-950/20 border border-red-900/30 rounded-lg p-3 mb-4">
                        <div className="flex items-center gap-2 text-red-400 text-xs font-bold mb-1">
                            <Lock className="w-3 h-3" />
                            SECURE ENV
                        </div>
                        <div className="text-[10px] text-red-300/60 leading-tight">
                            All actions are logged and audited.
                        </div>
                    </div>

                    <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 w-full px-4 py-2 text-gray-400 hover:text-white transition text-sm font-medium"
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
