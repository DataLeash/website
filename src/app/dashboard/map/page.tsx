'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import { Sidebar } from '@/components/Sidebar'
import { Globe, MapPin, Radio, Shield, AlertTriangle, ExternalLink, RefreshCw } from 'lucide-react'

// Dynamic import for Leaflet (no SSR)
const WorldMap = dynamic(() => import('@/components/WorldMap'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex items-center justify-center bg-[#0a1628]">
            <div className="text-center">
                <div className="w-10 h-10 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm text-[var(--foreground-muted)]">Loading Map...</p>
            </div>
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
    mapsUrl?: string
    viewerEmail?: string
    viewerName?: string
}

export default function WorldMapPage() {
    const [locations, setLocations] = useState<AccessLocation[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedLocation, setSelectedLocation] = useState<AccessLocation | null>(null)
    const [ownerLocation, setOwnerLocation] = useState<{ lat: number; lon: number; city: string } | null>(null)
    const [stats, setStats] = useState({
        totalCountries: 0,
        activeViewers: 0,
        blockedAttempts: 0
    })
    const lastDataHash = useRef<string>('')
    const refreshInterval = useRef<NodeJS.Timeout | null>(null)

    const fetchLocations = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true)
            const res = await fetch('/api/analytics/locations')
            const data = await res.json()

            if (res.ok) {
                // Check if data changed before updating state
                const newHash = JSON.stringify(data.locations?.map((l: AccessLocation) => `${l.id}-${l.isActive}`))
                if (newHash !== lastDataHash.current || !silent) {
                    setLocations(data.locations || [])
                    setStats({
                        totalCountries: data.totalCountries || 0,
                        activeViewers: data.activeViewers || 0,
                        blockedAttempts: data.blockedAttempts || 0
                    })
                    lastDataHash.current = newHash
                }
            }
        } catch (err) {
            console.error('Failed to fetch locations:', err)
        } finally {
            setLoading(false)
        }
    }, [])

    // Get owner's location on mount
    useEffect(() => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    try {
                        // Get city name from reverse geocoding
                        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${position.coords.latitude}&lon=${position.coords.longitude}&format=json`)
                        const data = await res.json()
                        setOwnerLocation({
                            lat: position.coords.latitude,
                            lon: position.coords.longitude,
                            city: data.address?.city || data.address?.town || data.address?.village || 'Your Location'
                        })
                    } catch {
                        setOwnerLocation({
                            lat: position.coords.latitude,
                            lon: position.coords.longitude,
                            city: 'Your Location'
                        })
                    }
                },
                () => {
                    // Geolocation denied or unavailable
                    console.log('Owner geolocation not available')
                }
            )
        }
    }, [])

    useEffect(() => {
        fetchLocations()

        // Smart refresh - every 30s but only updates if data changed
        refreshInterval.current = setInterval(() => fetchLocations(true), 30000)

        return () => {
            if (refreshInterval.current) clearInterval(refreshInterval.current)
        }
    }, [fetchLocations])

    const handleLocationClick = (loc: any) => {
        setSelectedLocation(loc as AccessLocation)
    }

    const openInGoogleMaps = (location: AccessLocation) => {
        const url = location.mapsUrl || `https://www.google.com/maps?q=${location.lat},${location.lon}`
        window.open(url, '_blank')
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
                            Access Map
                        </h1>
                        <p className="text-[var(--foreground-muted)]">Real-time global file access • Auto-refreshes every 30s</p>
                    </div>
                    <button
                        onClick={() => fetchLocations()}
                        className="px-4 py-2 bg-[rgba(0,212,255,0.1)] hover:bg-[rgba(0,212,255,0.2)] rounded-lg flex items-center gap-2 transition"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-4 gap-4 mb-6">
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
                            <Globe className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold">{locations.length}</div>
                            <div className="text-sm text-[var(--foreground-muted)]">Locations</div>
                        </div>
                    </div>

                    <div className="glass-card p-4 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                            <Radio className="w-6 h-6 text-white animate-pulse" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-[var(--success)]">{stats.activeViewers}</div>
                            <div className="text-sm text-[var(--foreground-muted)]">Active Now</div>
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

                {/* Map Container */}
                <div className="glass-card p-2 mb-6">
                    <div className="relative w-full h-[550px] rounded-lg overflow-hidden">
                        {loading && locations.length === 0 ? (
                            <div className="w-full h-full flex items-center justify-center bg-[#0a1628]">
                                <div className="text-center">
                                    <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                                    <p className="text-[var(--foreground-muted)]">Loading access data...</p>
                                </div>
                            </div>
                        ) : locations.length === 0 ? (
                            <div className="w-full h-full flex items-center justify-center bg-[#0a1628]">
                                <div className="text-center">
                                    <Globe className="w-16 h-16 mx-auto mb-4 text-[var(--primary)] opacity-50" />
                                    <p className="text-[var(--foreground-muted)]">No access data yet</p>
                                    <p className="text-xs text-[var(--foreground-muted)]">Access locations will appear here when files are viewed</p>
                                </div>
                            </div>
                        ) : (
                            <WorldMap
                                locations={locations}
                                ownerLocation={ownerLocation}
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
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedLocation.isBlocked ? 'bg-red-500/20' :
                                        selectedLocation.isActive ? 'bg-green-500/20' : 'bg-cyan-500/20'
                                    }`}>
                                    {selectedLocation.isBlocked ? (
                                        <AlertTriangle className="w-5 h-5 text-red-500" />
                                    ) : selectedLocation.isActive ? (
                                        <Radio className="w-5 h-5 text-green-500 animate-pulse" />
                                    ) : (
                                        <MapPin className="w-5 h-5 text-cyan-500" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">{selectedLocation.city}, {selectedLocation.country}</h3>
                                    <p className="text-sm text-[var(--foreground-muted)]">
                                        {selectedLocation.viewerCount} access{selectedLocation.viewerCount !== 1 ? 'es' : ''}
                                        {selectedLocation.isActive && (
                                            <span className="ml-2 text-green-400 flex items-center gap-1 inline-flex">
                                                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                                Currently Active
                                            </span>
                                        )}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => openInGoogleMaps(selectedLocation)}
                                    className="px-3 py-1.5 bg-[rgba(0,212,255,0.1)] rounded-lg hover:bg-[rgba(0,212,255,0.2)] flex items-center gap-1 text-sm"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    Google Maps
                                </button>
                                <button
                                    onClick={() => setSelectedLocation(null)}
                                    className="text-[var(--foreground-muted)] hover:text-white px-2"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-[var(--foreground-muted)]">Coordinates:</span>
                                <span className="ml-2 font-mono">{selectedLocation.lat.toFixed(4)}, {selectedLocation.lon.toFixed(4)}</span>
                            </div>
                            <div>
                                <span className="text-[var(--foreground-muted)]">Last Access:</span>
                                <span className="ml-2">{new Date(selectedLocation.lastAccess).toLocaleString()}</span>
                            </div>
                            {selectedLocation.viewerEmail && (
                                <div>
                                    <span className="text-[var(--foreground-muted)]">Viewer:</span>
                                    <span className="ml-2">{selectedLocation.viewerName || selectedLocation.viewerEmail}</span>
                                </div>
                            )}
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
            </main>
        </div>
    )
}
