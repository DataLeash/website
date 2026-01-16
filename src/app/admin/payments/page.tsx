'use client'

import { useState, useEffect } from 'react'
import { CreditCard, Check, AlertTriangle, RefreshCw } from 'lucide-react'

interface Payment {
    id: string
    user_email: string
    amount: number
    currency: string
    payment_source: string
    status: string
    tier_granted: string
    tier_duration_days: number
    auto_activated: boolean
    created_at: string
}

export default function AdminPaymentsPage() {
    const [payments, setPayments] = useState<Payment[]>([])
    const [loading, setLoading] = useState(true)

    const fetchPayments = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/payments?limit=50')
            const data = await res.json()
            if (res.ok) setPayments(data.payments || [])
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchPayments()
    }, [])

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-1">Payment Monitoring</h1>
                    <p className="text-gray-400 text-sm">Track real-time transactions and subscriptions</p>
                </div>
                <button
                    onClick={fetchPayments}
                    className="p-2 bg-[#0A0A0A] border border-gray-800 rounded-lg text-gray-400 hover:text-white transition"
                >
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="bg-[#0A0A0A] border border-gray-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-[#0F0F0F] text-gray-500 font-medium border-b border-gray-800">
                        <tr>
                            <th className="px-6 py-3">Date</th>
                            <th className="px-6 py-3">User</th>
                            <th className="px-6 py-3">Amount</th>
                            <th className="px-6 py-3">Source</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Auto?</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/50">
                        {loading && payments.length === 0 ? (
                            <tr><td colSpan={6} className="p-8 text-center text-gray-500">Loading payments...</td></tr>
                        ) : payments.map((payment) => (
                            <tr key={payment.id} className="hover:bg-white/[0.02] transition-colors">
                                <td className="px-6 py-3 text-gray-400">
                                    {new Date(payment.created_at).toLocaleString()}
                                </td>
                                <td className="px-6 py-3 text-gray-200">{payment.user_email}</td>
                                <td className="px-6 py-3 font-mono text-green-400">
                                    ${payment.amount} <span className="text-gray-600 text-xs">{payment.currency}</span>
                                </td>
                                <td className="px-6 py-3">
                                    <span className="px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-xs capitalize">
                                        {payment.payment_source}
                                    </span>
                                </td>
                                <td className="px-6 py-3">
                                    <span className={`px-2 py-1 rounded text-xs capitalize ${payment.status === 'completed'
                                            ? 'text-green-400'
                                            : 'text-yellow-400'
                                        }`}>
                                        {payment.status}
                                    </span>
                                </td>
                                <td className="px-6 py-3">
                                    {payment.auto_activated ? (
                                        <Check className="w-4 h-4 text-green-500" />
                                    ) : (
                                        <AlertTriangle className="w-4 h-4 text-yellow-500" />
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
