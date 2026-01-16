'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
    Command, Search, Upload, FolderLock, Activity, Settings,
    Users, Bell, BarChart3, Globe, Link2, Ban, Eye, FileText,
    X, ArrowRight, Keyboard
} from 'lucide-react'

interface CommandItem {
    id: string
    title: string
    description?: string
    icon: React.ElementType
    action: () => void
    shortcut?: string
    category: 'navigation' | 'actions' | 'files'
}

export function CommandPalette() {
    const [isOpen, setIsOpen] = useState(false)
    const [search, setSearch] = useState('')
    const [selectedIndex, setSelectedIndex] = useState(0)
    const inputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()

    const commands: CommandItem[] = [
        // Navigation
        { id: 'dashboard', title: 'Go to Dashboard', icon: Command, action: () => router.push('/dashboard'), shortcut: '⌘D', category: 'navigation' },
        { id: 'files', title: 'Go to Files', icon: FolderLock, action: () => router.push('/dashboard/files'), shortcut: '⌘F', category: 'navigation' },
        { id: 'upload', title: 'Upload File', icon: Upload, action: () => router.push('/dashboard/upload'), shortcut: '⌘U', category: 'navigation' },
        { id: 'requests', title: 'Access Requests', icon: Users, action: () => router.push('/dashboard/requests'), shortcut: '⌘R', category: 'navigation' },
        { id: 'activity', title: 'Activity Log', icon: Activity, action: () => router.push('/dashboard/activity'), category: 'navigation' },
        { id: 'notifications', title: 'Notifications', icon: Bell, action: () => router.push('/dashboard/notifications'), category: 'navigation' },
        { id: 'analytics', title: 'Analytics', icon: BarChart3, action: () => router.push('/dashboard/analytics'), category: 'navigation' },
        { id: 'map', title: 'World Map', icon: Globe, action: () => router.push('/dashboard/map'), category: 'navigation' },
        { id: 'chain', title: 'Chain View', icon: Link2, action: () => router.push('/dashboard/chain'), category: 'navigation' },
        { id: 'blacklist', title: 'Blacklist', icon: Ban, action: () => router.push('/dashboard/blacklist'), category: 'navigation' },
        { id: 'leakers', title: 'Leakers', icon: Eye, action: () => router.push('/dashboard/leakers'), category: 'navigation' },
        { id: 'reports', title: 'Reports', icon: FileText, action: () => router.push('/dashboard/reports'), category: 'navigation' },
        { id: 'settings', title: 'Settings', icon: Settings, action: () => router.push('/dashboard/settings'), shortcut: '⌘,', category: 'navigation' },
    ]

    const filteredCommands = commands.filter(cmd =>
        cmd.title.toLowerCase().includes(search.toLowerCase()) ||
        cmd.description?.toLowerCase().includes(search.toLowerCase())
    )

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        // Open command palette with Cmd/Ctrl + K
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault()
            setIsOpen(prev => !prev)
            setSearch('')
            setSelectedIndex(0)
        }

        // Direct shortcuts
        if ((e.metaKey || e.ctrlKey) && !isOpen) {
            switch (e.key.toLowerCase()) {
                case 'u':
                    e.preventDefault()
                    router.push('/dashboard/upload')
                    break
                case 'd':
                    e.preventDefault()
                    router.push('/dashboard')
                    break
                case ',':
                    e.preventDefault()
                    router.push('/dashboard/settings')
                    break
            }
        }

        // Escape to close
        if (e.key === 'Escape' && isOpen) {
            setIsOpen(false)
        }
    }, [isOpen, router])

    const handleInternalKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1))
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setSelectedIndex(prev => Math.max(prev - 1, 0))
        } else if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action()
            setIsOpen(false)
        }
    }

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [handleKeyDown])

    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus()
        }
    }, [isOpen])

    useEffect(() => {
        setSelectedIndex(0)
    }, [search])

    if (!isOpen) return null

    return (
        <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-[15vh] z-[100]"
            onClick={() => setIsOpen(false)}
        >
            <div
                className="w-full max-w-xl bg-[rgba(10,10,20,0.95)] border border-[rgba(0,212,255,0.2)] rounded-2xl shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Search Input */}
                <div className="flex items-center gap-3 px-4 py-4 border-b border-[rgba(0,212,255,0.1)]">
                    <Search className="w-5 h-5 text-[var(--foreground-muted)]" />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Type a command or search..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={handleInternalKeyDown}
                        className="flex-1 bg-transparent text-white text-lg focus:outline-none placeholder:text-[var(--foreground-muted)]"
                    />
                    <kbd className="px-2 py-1 text-xs bg-[rgba(255,255,255,0.1)] rounded text-[var(--foreground-muted)]">ESC</kbd>
                </div>

                {/* Commands List */}
                <div className="max-h-[50vh] overflow-y-auto p-2">
                    {filteredCommands.length === 0 ? (
                        <div className="text-center py-8 text-[var(--foreground-muted)]">
                            No commands found
                        </div>
                    ) : (
                        filteredCommands.map((cmd, index) => (
                            <button
                                key={cmd.id}
                                onClick={() => {
                                    cmd.action()
                                    setIsOpen(false)
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition text-left ${index === selectedIndex
                                        ? 'bg-[rgba(0,212,255,0.15)] text-white'
                                        : 'hover:bg-[rgba(0,212,255,0.08)] text-[var(--foreground-muted)]'
                                    }`}
                            >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${index === selectedIndex ? 'bg-[var(--primary)] text-black' : 'bg-[rgba(255,255,255,0.1)]'
                                    }`}>
                                    <cmd.icon className="w-4 h-4" />
                                </div>
                                <div className="flex-1">
                                    <div className={`font-medium ${index === selectedIndex ? 'text-white' : ''}`}>
                                        {cmd.title}
                                    </div>
                                    {cmd.description && (
                                        <div className="text-sm text-[var(--foreground-muted)]">{cmd.description}</div>
                                    )}
                                </div>
                                {cmd.shortcut && (
                                    <kbd className="px-2 py-1 text-xs bg-[rgba(255,255,255,0.1)] rounded">
                                        {cmd.shortcut}
                                    </kbd>
                                )}
                                <ArrowRight className={`w-4 h-4 ${index === selectedIndex ? 'text-[var(--primary)]' : 'opacity-0'}`} />
                            </button>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-[rgba(0,212,255,0.1)] flex items-center justify-between text-xs text-[var(--foreground-muted)]">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-[rgba(255,255,255,0.1)] rounded">↑</kbd>
                            <kbd className="px-1.5 py-0.5 bg-[rgba(255,255,255,0.1)] rounded">↓</kbd>
                            Navigate
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-[rgba(255,255,255,0.1)] rounded">↵</kbd>
                            Select
                        </span>
                    </div>
                    <span className="flex items-center gap-1">
                        <Keyboard className="w-3 h-3" />
                        ⌘K to open
                    </span>
                </div>
            </div>
        </div>
    )
}

// Hint button to show users the shortcut exists
export function CommandPaletteHint() {
    return (
        <div className="fixed bottom-4 right-4 z-50">
            <button
                className="flex items-center gap-2 px-3 py-2 glass-card rounded-lg text-sm hover:border-[var(--primary)] transition group"
                onClick={() => {
                    // Dispatch the keyboard event
                    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))
                }}
            >
                <Keyboard className="w-4 h-4 text-[var(--foreground-muted)] group-hover:text-[var(--primary)]" />
                <span className="text-[var(--foreground-muted)] group-hover:text-white">
                    <kbd className="px-1.5 py-0.5 bg-[rgba(255,255,255,0.1)] rounded text-xs">⌘K</kbd>
                </span>
            </button>
        </div>
    )
}
