'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Sidebar } from '@/components/Sidebar'
import {
    Link2, Monitor, Smartphone, Tablet, MapPin, Clock,
    ChevronDown, ChevronRight, Eye, AlertTriangle, Globe,
    Trash2, Ban, ExternalLink, RefreshCw
} from 'lucide-react'

interface ChainNode {
    id: string
    accessId: string
    viewerName: string
    viewerEmail: string
    device: 'desktop' | 'mobile' | 'tablet'
    deviceInfo: string
    city: string
    country: string
    countryCode: string
    accessTime: string
    duration: number
    shareCount: number
    isBlocked: boolean
    isActive?: boolean
    children: ChainNode[]
}

interface FileChain {
    fileId: string
    fileName: string
    totalViews: number
    uniqueViewers: number
    activeViewers: number
    chain: ChainNode[]
}

export default function ChainViewPage() {
    const [chains, setChains] = useState<FileChain[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedFile, setSelectedFile] = useState<string | null>(null)
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
    const [actionLoading, setActionLoading] = useState<string | null>(null)
    const lastDataHash = useRef<string>('')
    const refreshInterval = useRef<NodeJS.Timeout | null>(null)

    const fetchChains = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true)
            const res = await fetch('/api/analytics/chains')
            const data = await res.json()

            if (res.ok) {
                // Check if data changed
                const newHash = JSON.stringify(data.chains?.map((c: FileChain) => c.chain.length))
                if (newHash !== lastDataHash.current || !silent) {
                    setChains(data.chains || [])
                    lastDataHash.current = newHash
                }
                if (data.chains?.length > 0 && !selectedFile) {
                    setSelectedFile(data.chains[0].fileId)
                }
            }
        } catch (err) {
            console.error('Failed to fetch chains:', err)
        } finally {
            setLoading(false)
        }
    }, [selectedFile])

    useEffect(() => {
        fetchChains()

        // Smart refresh - every 30s but only updates if data changed
        refreshInterval.current = setInterval(() => fetchChains(true), 30000)

        return () => {
            if (refreshInterval.current) clearInterval(refreshInterval.current)
        }
    }, [fetchChains])

    const toggleNode = (nodeId: string) => {
        const newExpanded = new Set(expandedNodes)
        if (newExpanded.has(nodeId)) {
            newExpanded.delete(nodeId)
        } else {
            newExpanded.add(nodeId)
        }
        setExpandedNodes(newExpanded)
    }

    const handleRevokeAccess = async (node: ChainNode) => {
        if (!confirm(`Revoke access for ${node.viewerName} (${node.viewerEmail})?`)) return

        setActionLoading(node.id)
        try {
            const res = await fetch('/api/session/revoke', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    accessId: node.accessId,
                    viewerEmail: node.viewerEmail
                })
            })

            if (res.ok) {
                fetchChains()
            }
        } catch (err) {
            console.error('Failed to revoke:', err)
        } finally {
            setActionLoading(null)
        }
    }

    const handleDeleteAccess = async (node: ChainNode, fileId: string) => {
        if (!confirm(`Delete access record for ${node.viewerName}? This cannot be undone.`)) return

        setActionLoading(node.id)
        try {
            const res = await fetch(`/api/analytics/chains/${node.accessId}`, {
                method: 'DELETE'
            })

            if (res.ok) {
                fetchChains()
            }
        } catch (err) {
            console.error('Failed to delete:', err)
        } finally {
            setActionLoading(null)
        }
    }

    const openInMaps = (city: string, country: string) => {
        window.open(`https://maps.google.com/maps?q=${encodeURIComponent(city + ', ' + country)}`, '_blank')
    }

    const getDeviceIcon = (device: string) => {
        switch (device) {
            case 'mobile': return <Smartphone className="w-4 h-4" />
            case 'tablet': return <Tablet className="w-4 h-4" />
            default: return <Monitor className="w-4 h-4" />
        }
    }

    const formatDuration = (seconds: number) => {
        if (seconds < 60) return `${seconds}s`
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
        return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
    }

    const formatTime = (isoString: string) => {
        const date = new Date(isoString)
        const now = new Date()
        const diff = now.getTime() - date.getTime()

        // If less than 5 minutes ago, show "Just now" or "X mins ago"
        if (diff < 60000) return 'Just now'
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`

        return date.toLocaleDateString()
    }

    const renderChainNode = (node: ChainNode, depth: number = 0, fileId: string) => {
        const hasChildren = node.children && node.children.length > 0
        const isExpanded = expandedNodes.has(node.id)
        const isLoading = actionLoading === node.id

        return (
            <div key={node.id} className="relative">
                {/* Connection line */}
                {depth > 0 && (
                    <div
                        className="absolute left-4 -top-4 w-px h-4 bg-[rgba(0,212,255,0.3)]"
                    />
                )}

                <div
                    className={`relative glass-card p-4 mb-3 transition-all ${node.isBlocked ? 'border-l-4 border-red-500' :
                            node.isActive ? 'border-l-4 border-green-500 shadow-[0_0_15px_rgba(0,255,100,0.2)]' : ''
                        }`}
                    style={{ marginLeft: `${depth * 2}rem` }}
                >
                    <div className="flex items-start gap-4">
                        {/* Expand/collapse button */}
                        <div className="w-5">
                            {hasChildren && (
                                <button
                                    onClick={() => toggleNode(node.id)}
                                    className="mt-1 text-[var(--primary)] hover:text-white transition"
                                >
                                    {isExpanded ? (
                                        <ChevronDown className="w-4 h-4" />
                                    ) : (
                                        <ChevronRight className="w-4 h-4" />
                                    )}
                                </button>
                            )}
                        </div>

                        {/* Device icon with status indicator */}
                        <div className={`relative w-10 h-10 rounded-lg flex items-center justify-center ${node.isBlocked ? 'bg-red-500/20' :
                                node.isActive ? 'bg-green-500/20' :
                                    'bg-gradient-to-br from-cyan-500/20 to-blue-600/20'
                            }`}>
                            {node.isBlocked ? (
                                <AlertTriangle className="w-5 h-5 text-red-500" />
                            ) : (
                                getDeviceIcon(node.device)
                            )}
                            {node.isActive && !node.isBlocked && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold">{node.viewerName}</span>
                                <span className="text-sm text-[var(--foreground-muted)]">{node.viewerEmail}</span>
                                {node.isActive && !node.isBlocked && (
                                    <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                                        Live Now
                                    </span>
                                )}
                                {node.isBlocked && (
                                    <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">
                                        Blocked
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-4 text-xs text-[var(--foreground-muted)] mt-1 flex-wrap">
                                <button
                                    onClick={() => openInMaps(node.city, node.country)}
                                    className="flex items-center gap-1 hover:text-[var(--primary)] transition"
                                >
                                    <MapPin className="w-3 h-3" />
                                    {node.city}, {node.country}
                                    <ExternalLink className="w-2.5 h-2.5 opacity-50" />
                                </button>
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatTime(node.accessTime)}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Eye className="w-3 h-3" />
                                    {formatDuration(node.duration)}
                                </span>
                            </div>
                            <div className="text-xs text-[var(--foreground-muted)] mt-1 opacity-70 truncate">
                                {node.deviceInfo}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                            {node.shareCount > 0 && (
                                <div className="text-right mr-2">
                                    <div className="text-sm font-bold text-[var(--primary)]">
                                        {node.shareCount}
                                    </div>
                                    <div className="text-xs text-[var(--foreground-muted)]">shares</div>
                                </div>
                            )}

                            {!node.isBlocked && (
                                <button
                                    onClick={() => handleRevokeAccess(node)}
                                    disabled={isLoading}
                                    className="p-2 rounded-lg hover:bg-orange-500/20 text-orange-400 hover:text-orange-300 transition"
                                    title="Revoke Access"
                                >
                                    <Ban className="w-4 h-4" />
                                </button>
                            )}

                            <button
                                onClick={() => handleDeleteAccess(node, fileId)}
                                disabled={isLoading}
                                className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 hover:text-red-300 transition"
                                title="Delete Record"
                            >
                                {isLoading ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Trash2 className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Children */}
                {hasChildren && isExpanded && (
                    <div className="relative ml-8 pl-4 border-l-2 border-[rgba(0,212,255,0.2)]">
                        {node.children.map((child) => renderChainNode(child, depth + 1, fileId))}
                    </div>
                )}
            </div>
        )
    }

    const selectedChain = chains.find(c => c.fileId === selectedFile)

    return (
        <div className="gradient-bg min-h-screen">
            <Sidebar />

            <main className="ml-72 p-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
                                <Link2 className="w-5 h-5 text-white" />
                            </div>
                            Chain View
                        </h1>
                        <p className="text-[var(--foreground-muted)]">Track how your files spread • Auto-refreshes every 30s</p>
                    </div>
                    <button
                        onClick={() => fetchChains()}
                        className="px-4 py-2 bg-[rgba(0,212,255,0.1)] hover:bg-[rgba(0,212,255,0.2)] rounded-lg flex items-center gap-2 transition"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>

                {loading && chains.length === 0 ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="w-10 h-10 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : chains.length === 0 ? (
                    <div className="glass-card p-12 text-center">
                        <Link2 className="w-16 h-16 mx-auto mb-4 text-[var(--primary)] opacity-50" />
                        <h3 className="text-xl font-bold mb-2">No Access Chains Yet</h3>
                        <p className="text-[var(--foreground-muted)]">
                            When viewers access your files, the chain will appear here
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-4 gap-6">
                        {/* File list */}
                        <div className="glass-card p-4">
                            <h3 className="font-bold mb-4">Files</h3>
                            <div className="space-y-2">
                                {chains.map((chain) => (
                                    <button
                                        key={chain.fileId}
                                        onClick={() => setSelectedFile(chain.fileId)}
                                        className={`w-full text-left p-3 rounded-lg transition ${selectedFile === chain.fileId
                                            ? 'bg-[var(--primary)] text-black'
                                            : 'hover:bg-[rgba(0,212,255,0.1)]'
                                            }`}
                                    >
                                        <div className="font-medium truncate">{chain.fileName}</div>
                                        <div className="text-xs opacity-70 flex items-center gap-2">
                                            <span>{chain.totalViews} views</span>
                                            <span>•</span>
                                            <span>{chain.uniqueViewers} viewers</span>
                                            {chain.activeViewers > 0 && (
                                                <>
                                                    <span>•</span>
                                                    <span className="text-green-400 flex items-center gap-1">
                                                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                                                        {chain.activeViewers} live
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Chain visualization */}
                        <div className="col-span-3">
                            {selectedChain ? (
                                <>
                                    {/* Chain stats */}
                                    <div className="grid grid-cols-4 gap-4 mb-6">
                                        <div className="glass-card p-4 flex items-center gap-3">
                                            <Eye className="w-8 h-8 text-[var(--primary)]" />
                                            <div>
                                                <div className="text-2xl font-bold">{selectedChain.totalViews}</div>
                                                <div className="text-xs text-[var(--foreground-muted)]">Total Views</div>
                                            </div>
                                        </div>
                                        <div className="glass-card p-4 flex items-center gap-3">
                                            <Globe className="w-8 h-8 text-cyan-500" />
                                            <div>
                                                <div className="text-2xl font-bold">{selectedChain.uniqueViewers}</div>
                                                <div className="text-xs text-[var(--foreground-muted)]">Unique Viewers</div>
                                            </div>
                                        </div>
                                        <div className="glass-card p-4 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                                                <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse" />
                                            </div>
                                            <div>
                                                <div className="text-2xl font-bold text-green-400">{selectedChain.activeViewers}</div>
                                                <div className="text-xs text-[var(--foreground-muted)]">Active Now</div>
                                            </div>
                                        </div>
                                        <div className="glass-card p-4 flex items-center gap-3">
                                            <Link2 className="w-8 h-8 text-purple-500" />
                                            <div>
                                                <div className="text-2xl font-bold">{selectedChain.chain.length}</div>
                                                <div className="text-xs text-[var(--foreground-muted)]">Access Records</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Legend */}
                                    <div className="flex items-center gap-6 mb-4 text-xs text-[var(--foreground-muted)]">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                                            <span>Active Viewer</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-cyan-500 rounded-full" />
                                            <span>Historical</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-red-500 rounded-full" />
                                            <span>Blocked</span>
                                        </div>
                                    </div>

                                    {/* Chain tree */}
                                    <div className="space-y-2">
                                        {selectedChain.chain.map((node) => renderChainNode(node, 0, selectedChain.fileId))}
                                    </div>
                                </>
                            ) : (
                                <div className="glass-card p-12 text-center">
                                    <p className="text-[var(--foreground-muted)]">Select a file to view its access chain</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}
