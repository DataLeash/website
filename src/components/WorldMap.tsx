'use client'

import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.heat'
import {
    Layers, Zap, ShieldAlert, Play, Pause,
    SkipBack, Clock, Map as MapIcon, Globe,
    Activity, Eye, Sun, Moon, Satellite
} from 'lucide-react'

// Extended Leaflet types for Heatmap
declare module 'leaflet' {
    export function heatLayer(latlngs: any[], options?: any): any;
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
}

interface WorldMapProps {
    locations: MapLocation[]
    ownerLocation?: { lat: number; lon: number; city: string } | null
    onLocationClick?: (location: MapLocation) => void
}

type MapMode = 'standard' | 'heatmap' | 'threat'
type MapTheme = 'dark' | 'light' | 'satellite' | 'slate'

const THEMES = {
    dark: {
        url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        icon: Moon,
        name: 'Midnight'
    },
    light: {
        url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        icon: Sun,
        name: 'Voyager'
    },
    satellite: {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        icon: Satellite,
        name: 'Satellite'
    },
    slate: {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
        icon: MapIcon,
        name: 'Slate'
    }
}

export function WorldMap({ locations, ownerLocation, onLocationClick }: WorldMapProps) {
    const mapRef = useRef<HTMLDivElement>(null)
    const leafletMapRef = useRef<L.Map | null>(null)
    const markersRef = useRef<L.LayerGroup | null>(null)
    const heatLayerRef = useRef<L.Layer | null>(null)
    const flightLinesRef = useRef<L.LayerGroup | null>(null)
    const tileLayerRef = useRef<L.TileLayer | null>(null)

    // UI State
    const [mode, setMode] = useState<MapMode>('standard')
    const [theme, setTheme] = useState<MapTheme>('satellite') // Default to Satellite for "Wow"
    const [showFlights, setShowFlights] = useState(true)
    const [isReplaying, setIsReplaying] = useState(false)
    const [replayProgress, setReplayProgress] = useState(100)

    // Filtering state derived from replay
    const [displayLocations, setDisplayLocations] = useState<MapLocation[]>([])

    // Initialize Map
    useEffect(() => {
        if (!mapRef.current || leafletMapRef.current) return

        const map = L.map(mapRef.current, {
            center: [25, 0],
            zoom: 2.5,
            minZoom: 2,
            maxZoom: 18,
            zoomControl: false,
            attributionControl: false,
            worldCopyJump: true
        })

        // Initial Tile Layer
        tileLayerRef.current = L.tileLayer(THEMES[theme].url, {
            subdomains: 'abcd',
            maxZoom: 19,
            opacity: 1
        }).addTo(map)

        // Layers
        markersRef.current = L.layerGroup().addTo(map)
        flightLinesRef.current = L.layerGroup().addTo(map)

        leafletMapRef.current = map

        return () => {
            map.remove()
            leafletMapRef.current = null
        }
    }, [])

    // Update Theme
    useEffect(() => {
        if (!leafletMapRef.current || !tileLayerRef.current) return

        tileLayerRef.current.setUrl(THEMES[theme].url)
    }, [theme])

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
                l.isActive ? 1.0 : l.isBlocked ? 0.3 : Math.min(l.viewerCount * 0.2, 0.8)
            ])

            // @ts-ignore
            heatLayerRef.current = L.heatLayer(heatPoints, {
                radius: 25,
                blur: 15,
                maxZoom: 10,
                gradient: {
                    0.2: '#2c3e50',
                    0.4: '#00afb9',
                    0.6: '#0081a7',
                    0.8: '#e63946',
                    1.0: '#fdfcdc'
                }
            }).addTo(map)
        }

        // 4. Render Pins
        if (mode !== 'heatmap') {
            displayLocations.forEach(loc => {
                if (mode === 'threat' && !loc.isBlocked && !loc.isActive) return

                const isThreat = loc.isBlocked
                const isActive = loc.isActive

                const color = isThreat ? '#ef4444' : isActive ? '#22c55e' : '#06b6d4'

                const icon = L.divIcon({
                    className: 'custom-pin',
                    html: `
                        <div class="pin-wrapper ${isActive ? 'active' : ''} ${isThreat ? 'threat' : ''}">
                            <div class="pin-dot" style="background-color: ${color}"></div>
                            ${isActive ? '<div class="pin-pulse"></div>' : ''}
                            ${loc.viewerCount > 1 ? `<div class="badge">${loc.viewerCount}</div>` : ''}
                        </div>
                    `,
                    iconSize: [20, 20],
                    iconAnchor: [10, 10]
                })

                L.marker([loc.lat, loc.lon], { icon })
                    .bindPopup(`
                        <div class="popup-card">
                            <div class="popup-header" style="border-left: 3px solid ${color}">
                                <span class="status">${isThreat ? '⚠️ THREAT BLOCKED' : isActive ? '🟢 LIVE ACCESS' : '📍 HISTORY'}</span>
                            </div>
                            <div class="popup-body">
                                <h3>${loc.city}, ${loc.country}</h3>
                                <div class="user-row">
                                    <span>👤 ${loc.viewerName || 'Anonymous'}</span>
                                </div>
                                <div class="meta-row">
                                    <span>📧 ${loc.viewerEmail || 'No email'}</span>
                                </div>
                                <div class="stats-row">
                                    <span>👁️ ${loc.viewerCount} views</span>
                                    <span>🕒 ${new Date(loc.lastAccess || '').toLocaleTimeString()}</span>
                                </div>
                                <a href="https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${loc.lat},${loc.lon}" target="_blank" class="street-view-btn">
                                    See Street View
                                </a>
                            </div>
                        </div>
                    `, { maxWidth: 300, closeButton: false })
                    .on('click', () => onLocationClick?.(loc))
                    .addTo(markersRef.current!)
            })
        }

        // 5. Render Flight Lines
        if (showFlights && ownerLocation && displayLocations.length > 0) {
            displayLocations.forEach(loc => {
                if (mode === 'threat' && !loc.isBlocked) return
                if (!loc.isActive && !loc.isBlocked && Math.random() > 0.3) return

                const color = loc.isBlocked ? '#ef4444' : loc.isActive ? '#22c55e' : '#06b6d4'
                const isSatellite = theme === 'satellite'
                const showLine = isSatellite ? (loc.isActive || loc.isBlocked) : true // Reduce clutter on satellite

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

    }, [locations, ownerLocation, mode, theme, showFlights, displayLocations])

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
        <div className="relative w-full h-full bg-[#0a1628] rounded-xl overflow-hidden group">
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
                        onClick={cycleTheme}
                        className="p-2 w-full rounded-md flex items-center justify-center transition-all hover:bg-white/10 text-yellow-400"
                        title={`Theme: ${THEMES[theme].name}`}
                    >
                        <ThemeIcon size={18} />
                    </button>
                </div>
            </div>

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
                
                /* Owner Pin */
                .avatar-pin {
                    width: 40px;
                    height: 40px;
                    background: linear-gradient(135deg, #6366f1, #8b5cf6);
                    border-radius: 50%;
                    border: 2px solid white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 2;
                    position: relative;
                }
                .glow-effect {
                    position: relative;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
                .pulse-ring {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    background: #8b5cf6;
                    border-radius: 50%;
                    z-index: 1;
                    opacity: 0.6;
                    animation: pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
                }
                
                /* Viewer Pins */
                .pin-wrapper {
                    position: relative;
                    transition: all 0.3s ease;
                }
                .pin-dot {
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    border: 2px solid white;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                }
                .pin-pulse {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 20px;
                    height: 20px;
                    background: inherit;
                    border-radius: 50%;
                    border: 2px solid currentColor;
                    opacity: 0;
                    animation: pin-ping 1.5s infinite;
                }
                /* Badge visibility improvements */
                .badge {
                    position: absolute;
                    top: -8px;
                    right: -8px;
                    background: #2563eb;
                    color: white;
                    font-size: 9px;
                    font-weight: bold;
                    padding: 1px 4px;
                    border-radius: 6px;
                    border: 1px solid rgba(255,255,255,0.8);
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                }

                .active .pin-dot {
                    box-shadow: 0 0 10px #22c55e, 0 0 20px #22c55e;
                }
                .threat .pin-dot {
                    box-shadow: 0 0 10px #ef4444, 0 0 20px #ef4444;
                }

                /* Popups */
                .leaflet-popup-content-wrapper {
                    background: transparent !important;
                    box-shadow: none !important;
                    padding: 0 !important;
                }
                .leaflet-popup-tip {
                    display: none;
                }
                .popup-card {
                    background: rgba(15, 23, 42, 0.95);
                    backdrop-filter: blur(8px);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                    min-width: 200px;
                }
                .popup-header {
                    background: rgba(255,255,255,0.03);
                    padding: 8px 12px;
                    font-size: 10px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .popup-body {
                    padding: 12px;
                    color: #fff;
                }
                .popup-body h3 {
                    margin: 0 0 8px 0;
                    font-size: 14px;
                    font-weight: 600;
                }
                .user-row, .meta-row, .stats-row {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 12px;
                    color: #cbd5e1;
                    margin-bottom: 4px;
                }
                .street-view-btn {
                    display: block;
                    margin-top: 10px;
                    text-align: center;
                    background: rgba(59, 130, 246, 0.2);
                    color: #93c5fd;
                    padding: 6px;
                    border-radius: 6px;
                    font-size: 11px;
                    font-weight: 600;
                    text-decoration: none;
                    transition: all 0.2s;
                }
                .street-view-btn:hover {
                    background: rgba(59, 130, 246, 0.4);
                    color: white;
                }

                /* Flight Lines Animation */
                .flight-line {
                    stroke-dasharray: 4, 8;
                    animation: dash 30s linear infinite;
                }

                @keyframes pulse-ring {
                    0% { transform: scale(0.8); opacity: 0.5; }
                    100% { transform: scale(2); opacity: 0; }
                }
                @keyframes pin-ping {
                    0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0.8; }
                    100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
                }
                @keyframes dash {
                    to { stroke-dashoffset: -1000; }
                }

                .leaflet-control-zoom { display: none; }
                .leaflet-container { font-family: inherit; }
            `}</style>
        </div>
    )
}

export default WorldMap
