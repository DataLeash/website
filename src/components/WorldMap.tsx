'use client'

import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.heat'
import {
    Layers, Zap, ShieldAlert, Play, Pause,
    SkipBack, Clock, Map as MapIcon, Globe,
    Activity, Eye, Sun, Moon, Satellite,
    Smartphone, Laptop, Tablet, Monitor, HelpCircle
} from 'lucide-react'

// Extended Leaflet types for Heatmap and MarkerCluster
declare module 'leaflet' {
    export function heatLayer(latlngs: unknown[], options?: unknown): unknown;
    export function markerClusterGroup(options?: unknown): unknown;
}

interface MapLocation {
    id: string
    lat: number
    lon: number
    city: string
    country: string
    countryCode?: string
    isActive: boolean
    isBlocked: boolean
    viewerCount: number
    lastAccess?: string
    files?: string[]
    mapsUrl?: string
    viewerEmail?: string
    viewerName?: string
    // Reconnaissance data
    deviceType?: 'mobile' | 'tablet' | 'desktop' | 'unknown'
    browser?: string
    os?: string
    ip?: string
    isp?: string
    timezone?: string
    screenRes?: string
    language?: string
}

interface WorldMapProps {
    locations: MapLocation[]
    ownerLocation?: { lat: number; lon: number; city: string } | null
    onLocationClick?: (location: MapLocation) => void
    blockedCountries?: string[]
    onToggleCountry?: (countryCode: string) => void
}

type MapMode = 'standard' | 'heatmap' | 'threat' | 'geofence' | 'recon'
type MapTheme = 'dark' | 'light' | 'satellite' | 'slate'

const THEMES = {
    dark: {
        url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        icon: Moon,
        name: 'Midnight',
        maxZoom: 19
    },
    light: {
        url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        icon: Sun,
        name: 'Voyager',
        maxZoom: 19
    },
    satellite: {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        icon: Satellite,
        name: 'Satellite',
        maxZoom: 18
    },
    slate: {
        url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        icon: MapIcon,
        name: 'Slate',
        maxZoom: 19
    }
}

// 3D SVG Device Icons
const getDevice3DIcon = (deviceType?: string, size: number = 16): string => {
    switch (deviceType) {
        case 'mobile':
            return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none">
                <defs>
                    <linearGradient id="phone-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#c084fc"/>
                        <stop offset="100%" style="stop-color:#7c3aed"/>
                    </linearGradient>
                </defs>
                <rect x="5" y="2" width="14" height="20" rx="3" fill="url(#phone-grad)" stroke="#fff" stroke-width="1.5"/>
                <rect x="7" y="4" width="10" height="14" rx="1" fill="#1e1b4b" opacity="0.8"/>
                <circle cx="12" cy="20" r="1.5" fill="#fff"/>
                <rect x="9" y="3" width="6" height="1" rx="0.5" fill="#fff" opacity="0.5"/>
            </svg>`
        case 'tablet':
            return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none">
                <defs>
                    <linearGradient id="tablet-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#fbbf24"/>
                        <stop offset="100%" style="stop-color:#d97706"/>
                    </linearGradient>
                </defs>
                <rect x="3" y="3" width="18" height="18" rx="2.5" fill="url(#tablet-grad)" stroke="#fff" stroke-width="1.5"/>
                <rect x="5" y="5" width="14" height="12" rx="1" fill="#451a03" opacity="0.8"/>
                <circle cx="12" cy="19" r="1" fill="#fff"/>
            </svg>`
        case 'desktop':
            return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none">
                <defs>
                    <linearGradient id="desktop-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#60a5fa"/>
                        <stop offset="100%" style="stop-color:#2563eb"/>
                    </linearGradient>
                </defs>
                <rect x="2" y="3" width="20" height="13" rx="2" fill="url(#desktop-grad)" stroke="#fff" stroke-width="1.5"/>
                <rect x="4" y="5" width="16" height="9" rx="1" fill="#1e3a5f" opacity="0.9"/>
                <path d="M8 18h8v1H8z" fill="#fff" opacity="0.7"/>
                <path d="M6 19h12v2H6z" fill="url(#desktop-grad)" stroke="#fff" stroke-width="0.5"/>
            </svg>`
        default:
            return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="4" width="18" height="12" rx="2" fill="#6b7280" stroke="#fff" stroke-width="1.5"/>
                <rect x="5" y="6" width="14" height="8" rx="1" fill="#374151"/>
                <path d="M8 18h8l1 2H7z" fill="#6b7280" stroke="#fff" stroke-width="0.5"/>
            </svg>`
    }
}

// Get device color
const getDeviceColor = (deviceType?: string): string => {
    switch (deviceType) {
        case 'mobile': return '#a855f7'
        case 'tablet': return '#f59e0b'
        case 'desktop': return '#3b82f6'
        default: return '#6b7280'
    }
}

// Browser icon (keep emojis for these, they're small)
const getBrowserIcon = (browser?: string): string => {
    const b = browser?.toLowerCase() || ''
    if (b.includes('chrome')) return '🌐'
    if (b.includes('firefox')) return '🦊'
    if (b.includes('safari')) return '🧭'
    if (b.includes('edge')) return '📘'
    if (b.includes('opera')) return '🔴'
    return '🌍'
}

// OS icon
const getOSIcon = (os?: string): string => {
    const o = os?.toLowerCase() || ''
    if (o.includes('windows')) return '🪟'
    if (o.includes('mac') || o.includes('ios')) return '🍎'
    if (o.includes('android')) return '🤖'
    if (o.includes('linux')) return '🐧'
    return '💻'
}

export function WorldMap({ locations, ownerLocation, onLocationClick, blockedCountries = [], onToggleCountry }: WorldMapProps) {
    const mapRef = useRef<HTMLDivElement>(null)
    const leafletMapRef = useRef<L.Map | null>(null)
    const markersRef = useRef<L.LayerGroup | null>(null)
    const heatLayerRef = useRef<L.Layer | null>(null)
    const flightLinesRef = useRef<L.LayerGroup | null>(null)
    const tileLayerRef = useRef<L.TileLayer | null>(null)
    const geoJsonLayerRef = useRef<L.GeoJSON | null>(null)

    // UI State
    const [mode, setMode] = useState<MapMode>('standard')
    const [theme, setTheme] = useState<MapTheme>('satellite')
    const [geoJsonData, setGeoJsonData] = useState<any>(null)
    const [countryMapping, setCountryMapping] = useState<Record<string, string>>({})
    const [showFlights, setShowFlights] = useState(true)
    const [isReplaying, setIsReplaying] = useState(false)
    const [replayProgress, setReplayProgress] = useState(100)
    const [showDeviceIcons, setShowDeviceIcons] = useState(true)

    // Filtering state derived from replay
    const [displayLocations, setDisplayLocations] = useState<MapLocation[]>([])

    // Initialize Map with higher maxZoom
    useEffect(() => {
        console.log('WorldMap: MountingComponent')
        if (!mapRef.current || leafletMapRef.current) return

        console.log('WorldMap: Initializing Leaflet')
        const map = L.map(mapRef.current, {
            center: [20, 0],
            zoom: 2,
            minZoom: 2,
            maxZoom: 19, // Increased from 10 to 19 for street-level zoom
            zoomControl: true,
            attributionControl: false
        })

        // Add zoom control to bottom-right
        L.control.zoom({ position: 'bottomright' }).addTo(map)

        leafletMapRef.current = map

        // Initial Tile Layer
        const currentTheme = THEMES[theme] || THEMES.satellite
        const tileLayer = L.tileLayer(currentTheme.url, {
            noWrap: true,
            maxZoom: currentTheme.maxZoom
        }).addTo(map)

        tileLayerRef.current = tileLayer

        // Layer Groups
        markersRef.current = L.layerGroup().addTo(map)
        flightLinesRef.current = L.layerGroup().addTo(map)

        // Handle resize
        const resizeObserver = new ResizeObserver(() => {
            map.invalidateSize()
        })
        resizeObserver.observe(mapRef.current)

        return () => {
            map.remove()
            resizeObserver.disconnect()
            leafletMapRef.current = null
        }
    }, [])

    // Update Theme with proper maxZoom
    useEffect(() => {
        if (!leafletMapRef.current || !tileLayerRef.current) return
        const themeConfig = THEMES[theme]
        tileLayerRef.current.setUrl(themeConfig.url)
        leafletMapRef.current.setMaxZoom(themeConfig.maxZoom)
    }, [theme])

    // Fetch GeoJSON & Codes
    useEffect(() => {
        fetch('/world.json')
            .then(res => res.json())
            .then(data => setGeoJsonData(data))
            .catch(err => console.error('Failed to load GeoJSON:', err))

        fetch('/country-codes.json')
            .then(res => res.json())
            .then(data => {
                const map: Record<string, string> = {}
                if (Array.isArray(data)) {
                    data.forEach((c: any) => {
                        if (c['alpha-3'] && c['alpha-2']) map[c['alpha-3']] = c['alpha-2']
                    })
                    setCountryMapping(map)
                }
            })
            .catch(err => console.error('Failed to load codes:', err))

    }, [])

    // Calculate locations based on Time/Replay
    useEffect(() => {
        if (!isReplaying) {
            setDisplayLocations(locations)
            return
        }
        const count = Math.ceil((locations.length * replayProgress) / 100)
        setDisplayLocations(locations.slice(0, count))
    }, [locations, isReplaying, replayProgress])

    // Replay Loop
    useEffect(() => {
        if (!isReplaying) return
        const interval = setInterval(() => {
            setReplayProgress(prev => {
                if (prev >= 100) {
                    setIsReplaying(false)
                    return 100
                }
                return prev + 1
            })
        }, 50)
        return () => clearInterval(interval)
    }, [isReplaying])

    // Render Map Content
    useEffect(() => {
        if (!leafletMapRef.current) return
        const map = leafletMapRef.current

        // 1. Clear Layers
        markersRef.current?.clearLayers()
        flightLinesRef.current?.clearLayers()
        if (heatLayerRef.current) {
            map.removeLayer(heatLayerRef.current)
            heatLayerRef.current = null
        }

        // 3. Render Heatmap
        if (mode === 'heatmap') {
            const heatPoints = displayLocations.map(l => [
                l.lat,
                l.lon,
                l.isActive ? 1.0 : l.isBlocked ? 0.8 : Math.min(l.viewerCount * 0.3, 0.7)
            ])

            // @ts-ignore
            heatLayerRef.current = L.heatLayer(heatPoints, {
                radius: 35,
                blur: 20,
                maxZoom: 15,
                minOpacity: 0.4,
                gradient: {
                    0.0: '#1e3a5f',
                    0.2: '#2563eb',
                    0.4: '#06b6d4',
                    0.6: '#22c55e',
                    0.8: '#f59e0b',
                    1.0: '#ef4444'
                }
            }).addTo(map)
        }

        // 4. Render GeoJSON (Geofence Mode)
        if (mode === 'geofence' && geoJsonData) {
            if (geoJsonLayerRef.current) geoJsonLayerRef.current.remove()

            geoJsonLayerRef.current = L.geoJSON(geoJsonData, {
                style: (feature: any) => {
                    const iso3 = String(feature.id)
                    const iso2 = countryMapping[iso3] || iso3
                    const isBlocked = blockedCountries.includes(iso2);

                    return {
                        fillColor: isBlocked ? '#ef4444' : '#22c55e',
                        weight: 1,
                        opacity: 1,
                        color: 'rgba(255,255,255,0.2)',
                        dashArray: '3',
                        fillOpacity: isBlocked ? 0.6 : 0.1
                    }
                },
                onEachFeature: (feature, layer) => {
                    layer.on({
                        click: () => {
                            const iso3 = String(feature.id)
                            const iso2 = countryMapping[iso3] || iso3
                            if (onToggleCountry && iso2) onToggleCountry(String(iso2))
                        },
                        mouseover: (e) => {
                            const layer = e.target;
                            layer.setStyle({
                                weight: 2,
                                color: '#666',
                                dashArray: '',
                                fillOpacity: 0.7
                            });
                        },
                        mouseout: (e) => {
                            if (geoJsonLayerRef.current) {
                                geoJsonLayerRef.current.resetStyle(e.target);
                            }
                        }
                    });
                    const iso3 = String(feature.id)
                    layer.bindTooltip(`${feature.properties.name} (${countryMapping[iso3] || iso3})`);
                }
            }).addTo(map)
        } else {
            if (geoJsonLayerRef.current) geoJsonLayerRef.current.remove()
        }

        // 5. Render Pins with 3D device icons and click-toggle popup
        if (mode !== 'heatmap') {
            displayLocations.forEach(loc => {
                if (mode === 'threat' && !loc.isBlocked && !loc.isActive) return

                const isThreat = loc.isBlocked
                const isActive = loc.isActive

                const color = isThreat ? '#ef4444' : isActive ? '#22c55e' : '#06b6d4'
                const deviceColor = getDeviceColor(loc.deviceType)
                const device3DSvg = getDevice3DIcon(loc.deviceType, 18)
                const browserEmoji = getBrowserIcon(loc.browser)
                const osEmoji = getOSIcon(loc.os)

                // 3D SVG device icon
                const iconHtml = showDeviceIcons && loc.deviceType ? `
                    <div class="pin-3d ${isActive ? 'active' : ''} ${isThreat ? 'threat' : ''}">
                        <div class="pin-3d-svg" style="filter: drop-shadow(0 2px 4px ${color}80);">
                            ${device3DSvg}
                        </div>
                        ${isActive ? '<div class="pulse-ring-3d"></div>' : ''}
                        ${loc.viewerCount > 1 ? `<span class="count-badge">${loc.viewerCount}</span>` : ''}
                    </div>
                ` : `
                    <div class="pin-simple ${isActive ? 'active' : ''} ${isThreat ? 'threat' : ''}">
                        <div class="dot-3d" style="background: radial-gradient(circle at 30% 30%, ${color}, ${color}80); box-shadow: 0 2px 6px ${color}60;"></div>
                        ${isActive ? '<div class="pulse-sm"></div>' : ''}
                        ${loc.viewerCount > 1 ? `<span class="count-sm">${loc.viewerCount}</span>` : ''}
                    </div>
                `

                const icon = L.divIcon({
                    className: 'custom-pin-3d',
                    html: iconHtml,
                    iconSize: showDeviceIcons ? [28, 28] : [14, 14],
                    iconAnchor: showDeviceIcons ? [14, 14] : [7, 7]
                })

                // Compact click-toggle popup
                const popupContent = `
                    <div class="info-card">
                        <div class="card-header" style="border-color: ${color}">
                            <span class="card-status">${isThreat ? '⚠️' : isActive ? '🟢' : '📍'}</span>
                            <div class="card-title">
                                <div class="card-loc">${loc.city}</div>
                                <div class="card-country">${loc.country}</div>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="card-grid">
                                <div class="card-item">
                                    <span class="card-label">👤</span>
                                    <span class="card-val">${loc.viewerName || loc.viewerEmail?.split('@')[0] || 'Anon'}</span>
                                </div>
                                <div class="card-item">
                                    <span class="card-label">${device3DSvg}</span>
                                    <span class="card-val">${loc.deviceType || '?'}</span>
                                </div>
                                <div class="card-item">
                                    <span class="card-label">${browserEmoji}</span>
                                    <span class="card-val">${loc.browser || '?'}</span>
                                </div>
                                <div class="card-item">
                                    <span class="card-label">${osEmoji}</span>
                                    <span class="card-val">${loc.os?.split(' ')[0] || '?'}</span>
                                </div>
                            </div>
                            ${loc.ip ? `<div class="card-ip">🌐 ${loc.ip}</div>` : ''}
                            <div class="card-meta">
                                <span>👁 ${loc.viewerCount} views</span>
                                <span>📍 ${loc.lat.toFixed(2)}, ${loc.lon.toFixed(2)}</span>
                            </div>
                        </div>
                        <div class="card-actions">
                            <a href="https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${loc.lat},${loc.lon}" target="_blank">🛣️ Street</a>
                            <a href="https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lon}" target="_blank">📍 Maps</a>
                        </div>
                    </div>
                `

                L.marker([loc.lat, loc.lon], { icon })
                    .bindPopup(popupContent, {
                        maxWidth: 220,
                        minWidth: 180,
                        className: 'compact-popup',
                        closeButton: true,
                        autoPan: false,        // Don't move map when opening
                        closeOnClick: false,   // Keep open when clicking map
                        autoClose: false       // Keep open when opening another
                    })
                    .on('click', () => onLocationClick?.(loc))
                    .addTo(markersRef.current!)
            })
        }

        // 6. Render Flight Lines
        if (showFlights && ownerLocation && displayLocations.length > 0) {
            displayLocations.forEach(loc => {
                if (mode === 'threat' && !loc.isBlocked) return
                if (!loc.isActive && !loc.isBlocked && Math.random() > 0.3) return

                const color = loc.isBlocked ? '#ef4444' : loc.isActive ? '#22c55e' : '#06b6d4'
                const isSatellite = theme === 'satellite'
                const showLine = isSatellite ? (loc.isActive || loc.isBlocked) : true

                if (showLine) {
                    L.polyline([
                        [ownerLocation.lat, ownerLocation.lon],
                        [loc.lat, loc.lon]
                    ], {
                        color: color,
                        weight: loc.isActive ? 2 : 1,
                        opacity: loc.isActive ? 0.8 : 0.4,
                        dashArray: '5, 10',
                        className: 'flight-line'
                    }).addTo(flightLinesRef.current!)
                }
            })
        }

    }, [locations, ownerLocation, mode, theme, showFlights, displayLocations, blockedCountries, geoJsonData, countryMapping, showDeviceIcons, onLocationClick, onToggleCountry])

    const toggleReplay = () => {
        if (isReplaying) {
            setIsReplaying(false)
        } else {
            setReplayProgress(0)
            setIsReplaying(true)
            setMode('standard')
        }
    }

    const cycleTheme = () => {
        const themes: MapTheme[] = ['dark', 'satellite', 'light', 'slate']
        const nextIndex = (themes.indexOf(theme) + 1) % themes.length
        setTheme(themes[nextIndex])
    }

    const ThemeIcon = THEMES[theme].icon

    return (
        <div className="relative w-full h-full min-h-[500px] bg-[#0a1628] rounded-xl overflow-hidden group">
            {/* The Map */}
            <div ref={mapRef} className="w-full h-full z-0" />

            {/* Top Left: Controls */}
            <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2">
                {/* Mode Switcher */}
                <div className="glass-panel p-1 flex gap-1 rounded-lg">
                    <button
                        onClick={() => setMode('standard')}
                        className={`p-2 rounded-md transition-all ${mode === 'standard' ? 'bg-blue-500 text-white shadow-lg' : 'hover:bg-white/10 text-gray-300'}`}
                        title="Standard View"
                    >
                        <MapIcon size={18} />
                    </button>
                    <button
                        onClick={() => setMode('heatmap')}
                        className={`p-2 rounded-md transition-all ${mode === 'heatmap' ? 'bg-orange-500 text-white shadow-lg' : 'hover:bg-white/10 text-gray-300'}`}
                        title="Heatmap Density"
                    >
                        <Activity size={18} />
                    </button>
                    <button
                        onClick={() => setMode('threat')}
                        className={`p-2 rounded-md transition-all ${mode === 'threat' ? 'bg-red-500 text-white shadow-lg' : 'hover:bg-white/10 text-gray-300'}`}
                        title="Threat Radar"
                    >
                        <ShieldAlert size={18} />
                    </button>
                    <button
                        onClick={() => setMode('recon')}
                        className={`p-2 rounded-md transition-all ${mode === 'recon' ? 'bg-purple-500 text-white shadow-lg' : 'hover:bg-white/10 text-gray-300'}`}
                        title="Reconnaissance Mode"
                    >
                        <Eye size={18} />
                    </button>
                </div>

                {/* Theme & Extras */}
                <div className="glass-panel p-1 rounded-lg flex flex-col gap-1">
                    <button
                        onClick={() => setShowFlights(!showFlights)}
                        className={`p-2 w-full rounded-md flex items-center justify-center transition-all ${showFlights ? 'text-green-400 bg-green-500/10' : 'text-gray-400'}`}
                        title="Toggle Connections"
                    >
                        <Zap size={18} />
                    </button>

                    <button
                        onClick={() => setShowDeviceIcons(!showDeviceIcons)}
                        className={`p-2 w-full rounded-md flex items-center justify-center transition-all ${showDeviceIcons ? 'text-purple-400 bg-purple-500/10' : 'text-gray-400'}`}
                        title="Toggle Device Icons"
                    >
                        <Smartphone size={18} />
                    </button>

                    <button
                        onClick={cycleTheme}
                        className="p-2 w-full rounded-md flex items-center justify-center transition-all hover:bg-white/10 text-yellow-400"
                        title={`Theme: ${THEMES[theme].name}`}
                    >
                        <ThemeIcon size={18} />
                    </button>

                    <button
                        onClick={() => setMode('geofence')}
                        className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-xs font-bold transition ${mode === 'geofence'
                            ? 'bg-[var(--primary)] text-black shadow-[0_0_15px_rgba(0,212,255,0.4)]'
                            : 'bg-black/40 text-gray-400 hover:text-white hover:bg-white/10'
                            }`}
                    >
                        <Globe className="w-3 h-3" />
                        GEO
                    </button>
                </div>
            </div>

            {/* Device Legend (when device icons enabled) */}
            {showDeviceIcons && (
                <div className="absolute top-4 right-4 z-[1000] glass-panel p-3 rounded-lg">
                    <div className="text-xs font-bold mb-2 text-gray-300">Device Types</div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <span dangerouslySetInnerHTML={{ __html: getDevice3DIcon('mobile', 20) }} />
                            <span className="text-gray-400 text-xs">Mobile</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span dangerouslySetInnerHTML={{ __html: getDevice3DIcon('tablet', 20) }} />
                            <span className="text-gray-400 text-xs">Tablet</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span dangerouslySetInnerHTML={{ __html: getDevice3DIcon('desktop', 20) }} />
                            <span className="text-gray-400 text-xs">Desktop</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Bottom Center: Timeline / Replay */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] glass-panel px-4 py-3 rounded-full flex items-center gap-4 transition-all transform translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100">
                <button
                    onClick={toggleReplay}
                    className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center text-white shadow-lg transition-transform hover:scale-110 active:scale-95"
                >
                    {isReplaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
                </button>

                <div className="flex flex-col gap-1 w-48">
                    <div className="flex justify-between text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                        <span>Past</span>
                        <span>{isReplaying ? 'Replaying...' : 'Live Now'}</span>
                    </div>
                    <div className="h-1.5 bg-gray-700/50 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-75"
                            style={{ width: `${replayProgress}%` }}
                        />
                    </div>
                </div>

                <div className="h-8 w-px bg-white/10 mx-1" />

                <div className="flex items-center gap-2 text-xs text-gray-300">
                    <Clock size={14} className="text-blue-400" />
                    <span>{locations.length} events</span>
                </div>
            </div>

            {/* Styles */}
            <style jsx global>{`
                .glass-panel {
                    background: rgba(15, 23, 42, 0.9);
                    backdrop-filter: blur(16px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
                }
                
                /* 3D SVG Pin Styles */
                .pin-3d {
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .pin-3d-svg {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: transform 0.2s;
                    cursor: pointer;
                }
                .pin-3d-svg:hover {
                    transform: scale(1.3) translateY(-2px);
                }
                .pin-3d-svg svg {
                    display: block;
                }
                .pulse-ring-3d {
                    position: absolute;
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    border: 2px solid #22c55e;
                    animation: pulse-3d 1.5s infinite;
                    pointer-events: none;
                }
                .count-badge {
                    position: absolute;
                    top: -4px;
                    right: -4px;
                    background: #3b82f6;
                    color: white;
                    font-size: 8px;
                    font-weight: bold;
                    padding: 1px 4px;
                    border-radius: 6px;
                    border: 1px solid white;
                    min-width: 12px;
                    text-align: center;
                    z-index: 10;
                }
                
                /* Simple Pin Styles */
                .pin-simple {
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .dot-3d {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    border: 1.5px solid white;
                    transition: transform 0.2s;
                    cursor: pointer;
                }
                .dot-3d:hover {
                    transform: scale(1.4);
                }
                .pulse-sm {
                    position: absolute;
                    width: 18px;
                    height: 18px;
                    border-radius: 50%;
                    border: 1px solid #22c55e;
                    animation: pulse-3d 1.5s infinite;
                }
                .count-sm {
                    position: absolute;
                    top: -3px;
                    right: -3px;
                    background: #3b82f6;
                    color: white;
                    font-size: 7px;
                    font-weight: bold;
                    padding: 1px 3px;
                    border-radius: 4px;
                    border: 1px solid white;
                }
                
                /* Active/Threat States */
                .pin-3d.active .pin-3d-svg,
                .pin-simple.active .dot-3d {
                    filter: drop-shadow(0 0 6px #22c55e) drop-shadow(0 0 12px #22c55e50) !important;
                }
                .pin-3d.threat .pin-3d-svg,
                .pin-simple.threat .dot-3d {
                    filter: drop-shadow(0 0 6px #ef4444) drop-shadow(0 0 12px #ef444450) !important;
                }
                
                /* Click-Toggle Popup Styles */
                /* Compact Popup Styles */
                .compact-popup .leaflet-popup-content-wrapper {
                    background: transparent !important;
                    padding: 0 !important;
                    box-shadow: none !important;
                    border-radius: 10px;
                }
                .compact-popup .leaflet-popup-tip {
                    background: rgba(15, 23, 42, 0.95) !important;
                }
                .compact-popup .leaflet-popup-close-button {
                    color: #64748b !important;
                    font-size: 16px !important;
                    padding: 4px 6px !important;
                    z-index: 100;
                    right: 2px !important;
                    top: 2px !important;
                }
                .compact-popup .leaflet-popup-close-button:hover {
                    color: white !important;
                }
                .compact-popup .leaflet-popup-content {
                    margin: 0;
                }
                
                /* Compact Info Card */
                .info-card {
                    background: rgba(15, 23, 42, 0.95);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(255,255,255,0.12);
                    border-radius: 10px;
                    overflow: hidden;
                    box-shadow: 0 8px 24px rgba(0,0,0,0.5);
                    font-size: 11px;
                    color: white;
                    width: 180px;
                }
                .card-header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 10px;
                    background: rgba(255,255,255,0.03);
                    border-left: 3px solid;
                }
                .card-status {
                    font-size: 14px;
                }
                .card-title {
                    flex: 1;
                    min-width: 0;
                }
                .card-loc {
                    font-size: 12px;
                    font-weight: 600;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .card-country {
                    font-size: 9px;
                    color: #64748b;
                }
                .card-body {
                    padding: 8px 10px;
                }
                .card-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 6px;
                }
                .card-item {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }
                .card-label {
                    font-size: 12px;
                    flex-shrink: 0;
                }
                .card-label svg {
                    width: 12px;
                    height: 12px;
                }
                .card-val {
                    font-size: 10px;
                    color: #94a3b8;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    text-transform: capitalize;
                }
                .card-ip {
                    margin-top: 6px;
                    font-family: 'SF Mono', monospace;
                    font-size: 9px;
                    color: #60a5fa;
                    background: rgba(59, 130, 246, 0.1);
                    padding: 3px 6px;
                    border-radius: 4px;
                }
                .card-meta {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 6px;
                    font-size: 9px;
                    color: #64748b;
                }
                .card-actions {
                    display: flex;
                    gap: 6px;
                    padding: 8px 10px;
                    border-top: 1px solid rgba(255,255,255,0.06);
                }
                .card-actions a {
                    flex: 1;
                    text-align: center;
                    padding: 5px;
                    border-radius: 5px;
                    font-size: 10px;
                    font-weight: 600;
                    text-decoration: none;
                    background: rgba(59, 130, 246, 0.12);
                    color: #93c5fd;
                    transition: all 0.15s;
                }
                .card-actions a:hover {
                    background: rgba(59, 130, 246, 0.25);
                    color: white;
                }
                
                /* Device Legend */
                .glass-panel .text-xs { font-size: 10px; }
                
                /* Flight Lines Animation */
                .flight-line {
                    stroke-dasharray: 4, 8;
                    animation: dash 30s linear infinite;
                }

                @keyframes pulse-3d {
                    0% { transform: scale(1); opacity: 0.8; }
                    100% { transform: scale(2); opacity: 0; }
                }
                @keyframes dash {
                    to { stroke-dashoffset: -1000; }
                }

                .leaflet-control-zoom {
                    border: none !important;
                    background: rgba(15, 23, 42, 0.9) !important;
                    backdrop-filter: blur(8px);
                    border-radius: 8px !important;
                    overflow: hidden;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
                }
                .leaflet-control-zoom a {
                    background: transparent !important;
                    color: white !important;
                    border: none !important;
                    width: 28px !important;
                    height: 28px !important;
                    line-height: 28px !important;
                    font-size: 14px !important;
                }
                .leaflet-control-zoom a:hover {
                    background: rgba(255,255,255,0.1) !important;
                }
                .leaflet-container { font-family: inherit; }
            `}</style>
        </div>
    )
}

export default WorldMap
