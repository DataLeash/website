'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import { Sidebar } from '@/components/Sidebar'
import {
    Globe, MapPin, Radio, Shield, AlertTriangle, ExternalLink, RefreshCw,
    Activity, Eye, Ban, ChevronRight, ChevronDown, Clock, User, FileText,
    Zap, X, Bell, History
} from 'lucide-react'

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

interface ActivityEvent {
    id: string
    type: string
    timestamp: string
    fileName: string
    fileId: string
    viewerEmail?: string
    viewerName?: string
    location: { city?: string; country?: string }
    isBlocked: boolean
}

interface ThreatEntry {
    id: string
    email: string
    name: string
    fileName: string
    timestamp: string
    location: { city?: string; country?: string }
    reason: string
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

    // New state for live feed and threats
    const [liveEvents, setLiveEvents] = useState<ActivityEvent[]>([])
    const [threats, setThreats] = useState<ThreatEntry[]>([])
    const [showLiveFeed, setShowLiveFeed] = useState(true)
    const [showThreats, setShowThreats] = useState(false)
    const [activeTab, setActiveTab] = useState<'live' | 'threats' | 'history'>('live')

    // Geofencing State
    const [blockedCountries, setBlockedCountries] = useState<string[]>([])

    // Fetch blocked countries
    useEffect(() => {
        fetch('/api/settings')
            .then(res => res.json())
            .then(data => {
                if (data.blockedCountries) setBlockedCountries(data.blockedCountries)
            })
            .catch(err => console.error('Failed to fetch blocked countries:', err))
    }, [])

    const handleToggleCountry = async (countryCode: string) => {
        const newBlocked = blockedCountries.includes(countryCode)
            ? blockedCountries.filter(c => c !== countryCode)
            : [...blockedCountries, countryCode]

        setBlockedCountries(newBlocked) // Optimistic

        try {
            await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ blockedCountries: newBlocked })
            })
        } catch (err) {
            console.error('Failed to update blocked countries:', err)
            // Revert on error? For now rely on optimistic.
        }
    }

    const lastDataHash = useRef<string>('')
    const refreshInterval = useRef<NodeJS.Timeout | null>(null)
    const activityInterval = useRef<NodeJS.Timeout | null>(null)

    const fetchLocations = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true)
            const res = await fetch('/api/analytics/locations')
            const data = await res.json()

            if (res.ok) {
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

    // Fetch live activity and threats
    const fetchActivity = useCallback(async () => {
        try {
            const res = await fetch('/api/activity/recent?limit=15')
            const data = await res.json()
            if (res.ok) {
                setLiveEvents(data.events || [])
                setThreats(data.threats || [])
                // Update active viewers from activity endpoint too
                if (data.activeViewers > 0) {
                    setStats(prev => ({ ...prev, activeViewers: data.activeViewers }))
                }
            }
        } catch (err) {
            console.error('Failed to fetch activity:', err)
        }
    }, [])

    // Get owner's location on mount
    useEffect(() => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    try {
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
                () => console.log('Owner geolocation not available')
            )
        }
    }, [])

    useEffect(() => {
        fetchLocations()
        fetchActivity()

        // Smart refresh - faster when active viewers exist
        const setupIntervals = () => {
            // Location data: 30s normally, 10s when active
            const locationInterval = stats.activeViewers > 0 ? 10000 : 30000
            refreshInterval.current = setInterval(() => fetchLocations(true), locationInterval)

            // Activity feed: 5s always for real-time feel
            activityInterval.current = setInterval(fetchActivity, 5000)
        }

        setupIntervals()

        return () => {
            if (refreshInterval.current) clearInterval(refreshInterval.current)
            if (activityInterval.current) clearInterval(activityInterval.current)
        }
    }, [fetchLocations, fetchActivity, stats.activeViewers])

    const handleLocationClick = (loc: any) => {
        setSelectedLocation(loc as AccessLocation)
    }

    const openInGoogleMaps = (location: AccessLocation) => {
        const url = location.mapsUrl || `https://www.google.com/maps?q=${location.lat},${location.lon}`
        window.open(url, '_blank')
    }

    const formatTimeAgo = (timestamp: string) => {
        const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000)
        if (seconds < 60) return `${seconds}s ago`
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
        return `${Math.floor(seconds / 86400)}d ago`
    }

    const getEventIcon = (type: string) => {
        switch (type) {
            case 'view': return <Eye className="w-4 h-4 text-green-400" />
            case 'access_approved': return <Shield className="w-4 h-4 text-blue-400" />
            case 'access_denied':
            case 'blocked': return <Ban className="w-4 h-4 text-red-400" />
            case 'access_requested': return <Bell className="w-4 h-4 text-yellow-400" />
            default: return <Activity className="w-4 h-4 text-gray-400" />
        }
    }

    const getEventColor = (type: string) => {
        switch (type) {
            case 'view': return 'border-l-green-500'
            case 'access_approved': return 'border-l-blue-500'
            case 'access_denied':
            case 'blocked': return 'border-l-red-500'
            case 'access_requested': return 'border-l-yellow-500'
            default: return 'border-l-gray-500'
        }
    }

    // Quick action: Block viewer
    const blockViewer = async (email: string, name: string) => {
        if (!confirm(`Block ${email} from all your files?`)) return
        try {
            await fetch('/api/blacklist/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, name, reason: 'Blocked from map' })
            })
            fetchActivity()
        } catch (err) {
            console.error('Block failed:', err)
        }
    }

    return (
        <div className="gradient-bg min-h-screen">
            <Sidebar />

            <main className="md:ml-72 ml-0 p-4 md:p-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                                <Globe className="w-5 h-5 text-white" />
                            </div>
                            Command Center
                        </h1>
                        <p className="text-sm text-[var(--foreground-muted)]">Real-time access monitoring • Live updates every 5s</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveTab(activeTab === 'live' ? 'threats' : 'live')}
                            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition ${activeTab === 'threats' ? 'bg-red-500/20 text-red-400' : 'bg-[rgba(0,212,255,0.1)]'
                                }`}
                        >
                            <AlertTriangle className="w-4 h-4" />
                            Threats ({threats.length})
                        </button>
                        <button
                            onClick={() => fetchLocations()}
                            className="px-4 py-2 bg-[rgba(0,212,255,0.1)] hover:bg-[rgba(0,212,255,0.2)] rounded-lg flex items-center gap-2 transition"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-4 gap-4 mb-4">
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

                {/* Main Content: Map + Sidebar */}
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Map Container */}
                    <div className="flex-1 glass-card p-2">
                        <div className="relative w-full h-[500px] rounded-lg overflow-hidden">
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
                                    blockedCountries={blockedCountries}
                                    onToggleCountry={handleToggleCountry}
                                />
                            )}
                        </div>
                    </div>

                    {/* Live Activity Sidebar */}
                    <div className="w-full md:w-80 flex flex-col gap-4">
                        {/* Tab Switcher */}
                        <div className="glass-card p-1 flex gap-1">
                            <button
                                onClick={() => setActiveTab('live')}
                                className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition ${activeTab === 'live' ? 'bg-green-500/20 text-green-400' : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                <Zap className="w-4 h-4" />
                                Live
                            </button>
                            <button
                                onClick={() => setActiveTab('threats')}
                                className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition ${activeTab === 'threats' ? 'bg-red-500/20 text-red-400' : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                <AlertTriangle className="w-4 h-4" />
                                Threats
                            </button>
                        </div>

                        {/* Feed Content */}
                        <div className="glass-card flex-1 overflow-hidden flex flex-col max-h-[500px]">
                            <div className="p-3 border-b border-[rgba(255,255,255,0.1)] flex items-center justify-between">
                                <span className="text-sm font-medium flex items-center gap-2">
                                    {activeTab === 'live' ? (
                                        <>
                                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                            Live Activity
                                        </>
                                    ) : (
                                        <>
                                            <AlertTriangle className="w-4 h-4 text-red-400" />
                                            Threat History
                                        </>
                                    )}
                                </span>
                                <span className="text-xs text-[var(--foreground-muted)]">
                                    {activeTab === 'live' ? liveEvents.length : threats.length} events
                                </span>
                            </div>

                            <div className="flex-1 overflow-y-auto">
                                {activeTab === 'live' ? (
                                    liveEvents.length === 0 ? (
                                        <div className="p-8 text-center text-[var(--foreground-muted)]">
                                            <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                            <p className="text-sm">No recent activity</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-[rgba(255,255,255,0.05)]">
                                            {liveEvents.map((event) => (
                                                <div
                                                    key={event.id}
                                                    className={`p-3 hover:bg-[rgba(255,255,255,0.03)] border-l-2 ${getEventColor(event.type)} transition cursor-pointer`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className="mt-0.5">{getEventIcon(event.type)}</div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between gap-2">
                                                                <span className="font-medium text-sm truncate">
                                                                    {event.viewerName || event.viewerEmail?.split('@')[0] || 'Anonymous'}
                                                                </span>
                                                                <span className="text-xs text-[var(--foreground-muted)] whitespace-nowrap">
                                                                    {formatTimeAgo(event.timestamp)}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-[var(--foreground-muted)] truncate">
                                                                {event.type.replace('_', ' ')} • {event.fileName}
                                                            </p>
                                                            {event.location?.city && (
                                                                <p className="text-xs text-[var(--foreground-muted)] flex items-center gap-1 mt-1">
                                                                    <MapPin className="w-3 h-3" />
                                                                    {event.location.city}, {event.location.country}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )
                                ) : (
                                    threats.length === 0 ? (
                                        <div className="p-8 text-center text-[var(--foreground-muted)]">
                                            <Shield className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                            <p className="text-sm">No threats detected</p>
                                            <p className="text-xs mt-1">All access attempts are legitimate</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-[rgba(255,255,255,0.05)]">
                                            {threats.map((threat) => (
                                                <div
                                                    key={threat.id}
                                                    className="p-3 hover:bg-[rgba(255,255,255,0.03)] border-l-2 border-l-red-500"
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <Ban className="w-4 h-4 text-red-400 mt-0.5" />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between gap-2">
                                                                <span className="font-medium text-sm text-red-400 truncate">
                                                                    {threat.name || threat.email?.split('@')[0]}
                                                                </span>
                                                                <span className="text-xs text-[var(--foreground-muted)]">
                                                                    {formatTimeAgo(threat.timestamp)}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-[var(--foreground-muted)] truncate">
                                                                {threat.email}
                                                            </p>
                                                            <p className="text-xs text-red-400/70 mt-1">
                                                                {threat.reason}
                                                            </p>
                                                            <div className="flex items-center gap-2 mt-2">
                                                                <button
                                                                    onClick={() => blockViewer(threat.email, threat.name)}
                                                                    className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"
                                                                >
                                                                    Blacklist
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Selected location details */}
                {selectedLocation && (
                    <div className="glass-card p-6 mt-4">
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
                                {selectedLocation.viewerEmail && (
                                    <button
                                        onClick={() => blockViewer(selectedLocation.viewerEmail!, selectedLocation.viewerName || '')}
                                        className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 flex items-center gap-1 text-sm"
                                    >
                                        <Ban className="w-4 h-4" />
                                        Block
                                    </button>
                                )}
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
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-sm">
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
                            <div className="col-span-3">
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
