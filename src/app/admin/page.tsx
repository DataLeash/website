'use client'

import { useState, useEffect } from 'react'
import { Users, Crown, Activity, Shield } from 'lucide-react'

export default function AdminOverviewPage() {
    const [stats, setStats] = useState({ total: 0, free: 0, pro: 0, enterprise: 0 })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchStats() {
            try {
                // Fetch stats from users endpoint
                const res = await fetch('/api/admin/users?limit=1')
                const data = await res.json()
                if (res.ok && data.stats) {
                    setStats(data.stats)
                }
            } catch (error) {
                console.error('Failed to fetch stats', error)
            } finally {
                setLoading(false)
            }
        }
        fetchStats()
    }, [])

    const cards = [
        { name: 'Total Users', value: stats.total, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { name: 'Pro Members', value: stats.pro, icon: Crown, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
        { name: 'Free Tier', value: stats.free, icon: Users, color: 'text-gray-400', bg: 'bg-gray-500/10' },
        { name: 'Conversion', value: stats.total ? `${Math.round((stats.pro / stats.total) * 100)}%` : '0%', icon: Activity, color: 'text-green-500', bg: 'bg-green-500/10' },
    ]

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                    <Shield className="w-8 h-8 text-red-500" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-white">System Overview</h1>
                    <p className="text-gray-400">Welcome back, Administrator.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {cards.map((card) => (
                    <div key={card.name} className="bg-[#0A0A0A] border border-gray-800 p-6 rounded-xl hover:border-gray-700 transition">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-2 rounded-lg ${card.bg}`}>
                                <card.icon className={`w-6 h-6 ${card.color}`} />
                            </div>
                            <span className={`text-sm font-medium ${card.color}`}>{card.loading ? '...' : ''}</span>
                        </div>
                        <div className="text-3xl font-bold text-white mb-1">
                            {loading ? '-' : card.value}
                        </div>
                        <div className="text-sm text-gray-500 font-medium">
                            {card.name}
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Actions or Recent Activity could go here */}
            <div className="bg-[#0A0A0A] border border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">System Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center justify-between p-4 bg-[#050505] rounded-lg border border-gray-800">
                        <span className="text-gray-400">Database Connection</span>
                        <span className="text-green-400 text-sm font-bold flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            ONLINE
                        </span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-[#050505] rounded-lg border border-gray-800">
                        <span className="text-gray-400">Payment Gateway</span>
                        <span className="text-green-400 text-sm font-bold flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            ACTIVE
                        </span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-[#050505] rounded-lg border border-gray-800">
                        <span className="text-gray-400">Security Policies</span>
                        <span className="text-green-400 text-sm font-bold flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            ENFORCED
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}
