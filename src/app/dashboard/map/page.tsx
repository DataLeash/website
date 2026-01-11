'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Sidebar } from '@/components/Sidebar'
import { Globe, MapPin, Radio, Shield, AlertTriangle } from 'lucide-react'

// Dynamic import for Three.js component (no SSR)
const Globe3D = dynamic(() => import('@/components/Globe3D'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
        </div>
    )
})

interface AccessLocation {
    id: string
    lat: number
    lon: number
    city: string
    country: string
    countryCode: string
    isActive: boolean
    isBlocked: boolean
    viewerCount: number
    lastAccess: string
    files: string[]
}

export default function WorldMapPage() {
    const [locations, setLocations] = useState<AccessLocation[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedLocation, setSelectedLocation] = useState<AccessLocation | null>(null)
    const [stats, setStats] = useState({
        totalCountries: 0,
        activeViewers: 0,
        blockedAttempts: 0
    })

    useEffect(() => {
        fetchLocations()
        const interval = setInterval(fetchLocations, 30000)
        return () => clearInterval(interval)
    }, [])

    const fetchLocations = async () => {
        try {
            const res = await fetch('/api/analytics/locations')
            const data = await res.json()

            if (res.ok) {
                setLocations(data.locations || [])
                setStats({
                    totalCountries: data.totalCountries || 0,
                    activeViewers: data.activeViewers || 0,
                    blockedAttempts: data.blockedAttempts || 0
                })
            }
        } catch (err) {
            console.error('Failed to fetch locations:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleLocationClick = (loc: any) => {
        setSelectedLocation(loc as AccessLocation)
    }

    return (
        <div className="gradient-bg min-h-screen">
            <Sidebar />

            <main className="ml-72 p-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                                <Globe className="w-5 h-5 text-white" />
                            </div>
                            World Map
                        </h1>
                        <p className="text-[var(--foreground-muted)]">Interactive 3D globe showing global file access</p>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="glass-card p-4 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                            <MapPin className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold">{stats.totalCountries}</div>
                            <div className="text-sm text-[var(--foreground-muted)]">Countries</div>
                        </div>
                    </div>

                    <div className="glass-card p-4 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                            <Radio className="w-6 h-6 text-white animate-pulse" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-[var(--success)]">{stats.activeViewers}</div>
                            <div className="text-sm text-[var(--foreground-muted)]">Active Viewers</div>
                        </div>
                    </div>

                    <div className="glass-card p-4 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
                            <Shield className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-[var(--error)]">{stats.blockedAttempts}</div>
                            <div className="text-sm text-[var(--foreground-muted)]">Blocked</div>
                        </div>
                    </div>
                </div>

                {/* 3D Globe Container */}
                <div className="glass-card p-2 mb-6">
                    <div className="relative w-full h-[600px] rounded-lg overflow-hidden bg-[#0a1628]">
                        {loading ? (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center">
                                    <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                                    <p className="text-[var(--foreground-muted)]">Loading 3D Globe...</p>
                                </div>
                            </div>
                        ) : (
                            <Globe3D
                                locations={locations}
                                onLocationClick={handleLocationClick}
                            />
                        )}
                    </div>
                </div>

                {/* Selected location details */}
                {selectedLocation && (
                    <div className="glass-card p-6 mb-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedLocation.isBlocked ? 'bg-red-500/20' : 'bg-cyan-500/20'
                                    }`}>
                                    {selectedLocation.isBlocked ? (
                                        <AlertTriangle className="w-5 h-5 text-red-500" />
                                    ) : (
                                        <MapPin className="w-5 h-5 text-cyan-500" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">{selectedLocation.city}, {selectedLocation.country}</h3>
                                    <p className="text-sm text-[var(--foreground-muted)]">
                                        {selectedLocation.viewerCount} viewer{selectedLocation.viewerCount !== 1 ? 's' : ''}
                                        {selectedLocation.isActive && (
                                            <span className="ml-2 text-green-400">● Currently Active</span>
                                        )}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedLocation(null)}
                                className="text-[var(--foreground-muted)] hover:text-white"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-[var(--foreground-muted)]">Coordinates:</span>
                                <span className="ml-2">{selectedLocation.lat.toFixed(2)}, {selectedLocation.lon.toFixed(2)}</span>
                            </div>
                            <div>
                                <span className="text-[var(--foreground-muted)]">Last Access:</span>
                                <span className="ml-2">{new Date(selectedLocation.lastAccess).toLocaleString()}</span>
                            </div>
                            <div className="col-span-2">
                                <span className="text-[var(--foreground-muted)]">Files Accessed:</span>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {selectedLocation.files.slice(0, 5).map((file, i) => (
                                        <span key={i} className="px-2 py-1 bg-[rgba(0,212,255,0.1)] rounded text-xs">
                                            {file}
                                        </span>
                                    ))}
                                    {selectedLocation.files.length > 5 && (
                                        <span className="px-2 py-1 bg-[rgba(0,212,255,0.1)] rounded text-xs">
                                            +{selectedLocation.files.length - 5} more
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Legend */}
                <div className="glass-card p-4">
                    <h4 className="font-bold mb-3">Legend</h4>
                    <div className="flex gap-6 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                            <span>Active Viewer</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-cyan-500" />
                            <span>Historical Access</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500" />
                            <span>Blocked Access</span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
