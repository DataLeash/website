'use client'

import { ReactNode } from 'react'

interface IconProps {
    type: string
    className?: string
    size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizeMap = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
}

// 3D-style SVG icons with gradients and glows
export function Icon3D({ type, className = '', size = 'md' }: IconProps): ReactNode {
    const sizeClass = sizeMap[size]

    const icons: { [key: string]: ReactNode } = {
        // Security icons
        lock: (
            <svg className={`${sizeClass} ${className}`} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="lock-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#00d4ff" />
                        <stop offset="100%" stopColor="#0099ff" />
                    </linearGradient>
                    <filter id="lock-glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                </defs>
                <rect x="12" y="28" width="40" height="30" rx="4" fill="url(#lock-grad)" filter="url(#lock-glow)" />
                <rect x="14" y="30" width="36" height="26" rx="3" fill="#0a1628" fillOpacity="0.7" />
                <path d="M20 28V20C20 13.373 25.373 8 32 8V8C38.627 8 44 13.373 44 20V28" stroke="url(#lock-grad)" strokeWidth="4" strokeLinecap="round" />
                <circle cx="32" cy="43" r="4" fill="url(#lock-grad)" />
                <rect x="30" y="43" width="4" height="8" rx="2" fill="url(#lock-grad)" />
            </svg>
        ),
        shield: (
            <svg className={`${sizeClass} ${className}`} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="shield-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#00d4ff" />
                        <stop offset="100%" stopColor="#0099ff" />
                    </linearGradient>
                    <filter id="shield-glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                </defs>
                <path d="M32 4L8 14V30C8 44.36 18.14 57.14 32 60C45.86 57.14 56 44.36 56 30V14L32 4Z" stroke="url(#shield-grad)" strokeWidth="3" fill="none" filter="url(#shield-glow)" />
                <path d="M32 4L8 14V30C8 44.36 18.14 57.14 32 60C45.86 57.14 56 44.36 56 30V14L32 4Z" fill="url(#shield-grad)" fillOpacity="0.1" />
                <path d="M24 32L30 38L42 26" stroke="url(#shield-grad)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
        eye: (
            <svg className={`${sizeClass} ${className}`} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="eye-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ff6b6b" />
                        <stop offset="100%" stopColor="#ee5a5a" />
                    </linearGradient>
                    <filter id="eye-glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                </defs>
                <ellipse cx="32" cy="32" rx="26" ry="16" stroke="url(#eye-grad)" strokeWidth="3" fill="none" filter="url(#eye-glow)" />
                <circle cx="32" cy="32" r="10" fill="url(#eye-grad)" />
                <circle cx="32" cy="32" r="5" fill="#0a1628" />
                <circle cx="35" cy="29" r="2" fill="white" fillOpacity="0.8" />
                <line x1="8" y1="8" x2="56" y2="56" stroke="url(#eye-grad)" strokeWidth="4" strokeLinecap="round" />
            </svg>
        ),

        // Action icons
        bolt: (
            <svg className={`${sizeClass} ${className}`} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="bolt-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#fbbf24" />
                        <stop offset="100%" stopColor="#f59e0b" />
                    </linearGradient>
                    <filter id="bolt-glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                </defs>
                <path d="M36 4L12 36H28L24 60L52 24H34L36 4Z" fill="url(#bolt-grad)" filter="url(#bolt-glow)" />
                <path d="M36 4L12 36H28L24 60L52 24H34L36 4Z" fill="none" stroke="#fff" strokeWidth="1" strokeOpacity="0.3" />
            </svg>
        ),
        upload: (
            <svg className={`${sizeClass} ${className}`} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="upload-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#00d4ff" />
                        <stop offset="100%" stopColor="#0099ff" />
                    </linearGradient>
                    <filter id="upload-glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                </defs>
                <path d="M32 8V40M32 8L20 20M32 8L44 20" stroke="url(#upload-grad)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" filter="url(#upload-glow)" />
                <path d="M8 44V52C8 54.2 9.8 56 12 56H52C54.2 56 56 54.2 56 52V44" stroke="url(#upload-grad)" strokeWidth="4" strokeLinecap="round" />
            </svg>
        ),
        link: (
            <svg className={`${sizeClass} ${className}`} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="link-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#a78bfa" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                    <filter id="link-glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                </defs>
                <path d="M26 38L38 26" stroke="url(#link-grad)" strokeWidth="4" strokeLinecap="round" filter="url(#link-glow)" />
                <path d="M18 34L14 38C10.134 41.866 10.134 48.134 14 52V52C17.866 55.866 24.134 55.866 28 52L32 48" stroke="url(#link-grad)" strokeWidth="4" strokeLinecap="round" />
                <path d="M46 30L50 26C53.866 22.134 53.866 15.866 50 12V12C46.134 8.134 39.866 8.134 36 12L32 16" stroke="url(#link-grad)" strokeWidth="4" strokeLinecap="round" />
            </svg>
        ),

        // Status icons
        chart: (
            <svg className={`${sizeClass} ${className}`} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="chart-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#60a5fa" />
                        <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                    <filter id="chart-glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                </defs>
                <rect x="8" y="40" width="10" height="16" rx="2" fill="url(#chart-grad)" filter="url(#chart-glow)" />
                <rect x="22" y="28" width="10" height="28" rx="2" fill="url(#chart-grad)" filter="url(#chart-glow)" />
                <rect x="36" y="18" width="10" height="38" rx="2" fill="url(#chart-grad)" filter="url(#chart-glow)" />
                <rect x="50" y="8" width="10" height="48" rx="2" fill="url(#chart-grad)" filter="url(#chart-glow)" />
            </svg>
        ),
        robot: (
            <svg className={`${sizeClass} ${className}`} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="robot-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#34d399" />
                        <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                    <filter id="robot-glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                </defs>
                <rect x="14" y="20" width="36" height="32" rx="6" stroke="url(#robot-grad)" strokeWidth="3" fill="none" filter="url(#robot-glow)" />
                <circle cx="24" cy="34" r="4" fill="url(#robot-grad)" />
                <circle cx="40" cy="34" r="4" fill="url(#robot-grad)" />
                <path d="M26 44H38" stroke="url(#robot-grad)" strokeWidth="3" strokeLinecap="round" />
                <line x1="32" y1="8" x2="32" y2="20" stroke="url(#robot-grad)" strokeWidth="3" strokeLinecap="round" />
                <circle cx="32" cy="6" r="4" fill="url(#robot-grad)" />
            </svg>
        ),
        cloud: (
            <svg className={`${sizeClass} ${className}`} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="cloud-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#a78bfa" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                    <filter id="cloud-glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                </defs>
                <path d="M16 40C10.477 40 6 35.523 6 30C6 24.477 10.477 20 16 20C16.34 20 16.677 20.015 17.01 20.046C18.56 14.337 23.774 10 30 10C37.732 10 44 16.268 44 24C44 24.338 43.988 24.673 43.965 25.005C49.617 25.118 54 29.579 54 35C54 40.523 49.523 45 44 45H16" stroke="url(#cloud-grad)" strokeWidth="3" fill="none" filter="url(#cloud-glow)" />
            </svg>
        ),

        // File icons
        file: (
            <svg className={`${sizeClass} ${className}`} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="file-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#00d4ff" />
                        <stop offset="100%" stopColor="#0099ff" />
                    </linearGradient>
                    <filter id="file-glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                </defs>
                <path d="M12 8H36L52 24V52C52 54.2 50.2 56 48 56H12C9.8 56 8 54.2 8 52V12C8 9.8 9.8 8 12 8Z" stroke="url(#file-grad)" strokeWidth="3" fill="none" filter="url(#file-glow)" />
                <path d="M36 8V20C36 22.2 37.8 24 40 24H52" stroke="url(#file-grad)" strokeWidth="3" />
                <line x1="16" y1="34" x2="40" y2="34" stroke="url(#file-grad)" strokeWidth="2" />
                <line x1="16" y1="42" x2="40" y2="42" stroke="url(#file-grad)" strokeWidth="2" />
                <line x1="16" y1="50" x2="32" y2="50" stroke="url(#file-grad)" strokeWidth="2" />
            </svg>
        ),
        folder: (
            <svg className={`${sizeClass} ${className}`} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="folder-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#fbbf24" />
                        <stop offset="100%" stopColor="#f59e0b" />
                    </linearGradient>
                    <filter id="folder-glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                </defs>
                <path d="M8 16H24L28 12H52C54.2 12 56 13.8 56 16V48C56 50.2 54.2 52 52 52H8C5.8 52 4 50.2 4 48V20C4 17.8 5.8 16 8 16Z" stroke="url(#folder-grad)" strokeWidth="3" fill="none" filter="url(#folder-glow)" />
                <path d="M4 24H56" stroke="url(#folder-grad)" strokeWidth="2" />
            </svg>
        ),

        // Dashboard icons
        dashboard: (
            <svg className={`${sizeClass} ${className}`} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="dash-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#00d4ff" />
                        <stop offset="100%" stopColor="#0099ff" />
                    </linearGradient>
                    <filter id="dash-glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                </defs>
                <rect x="4" y="4" width="24" height="24" rx="4" stroke="url(#dash-grad)" strokeWidth="3" fill="none" filter="url(#dash-glow)" />
                <rect x="36" y="4" width="24" height="24" rx="4" stroke="url(#dash-grad)" strokeWidth="3" fill="none" filter="url(#dash-glow)" />
                <rect x="4" y="36" width="24" height="24" rx="4" stroke="url(#dash-grad)" strokeWidth="3" fill="none" filter="url(#dash-glow)" />
                <rect x="36" y="36" width="24" height="24" rx="4" stroke="url(#dash-grad)" strokeWidth="3" fill="none" filter="url(#dash-glow)" />
            </svg>
        ),
        users: (
            <svg className={`${sizeClass} ${className}`} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="users-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#a78bfa" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                    <filter id="users-glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                </defs>
                <circle cx="24" cy="20" r="10" stroke="url(#users-grad)" strokeWidth="3" fill="none" filter="url(#users-glow)" />
                <path d="M4 52C4 42 12 34 24 34C36 34 44 42 44 52" stroke="url(#users-grad)" strokeWidth="3" fill="none" />
                <circle cx="44" cy="16" r="8" stroke="url(#users-grad)" strokeWidth="3" fill="none" />
                <path d="M48 52C48 44 52 38 60 38" stroke="url(#users-grad)" strokeWidth="3" fill="none" />
            </svg>
        ),
        bell: (
            <svg className={`${sizeClass} ${className}`} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="bell-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#fbbf24" />
                        <stop offset="100%" stopColor="#f59e0b" />
                    </linearGradient>
                    <filter id="bell-glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                </defs>
                <path d="M32 8V12M32 12C22 12 14 20 14 30V40L8 48H56L50 40V30C50 20 42 12 32 12Z" stroke="url(#bell-grad)" strokeWidth="3" fill="none" filter="url(#bell-glow)" />
                <path d="M24 48C24 52.418 27.582 56 32 56C36.418 56 40 52.418 40 48" stroke="url(#bell-grad)" strokeWidth="3" />
            </svg>
        ),
        settings: (
            <svg className={`${sizeClass} ${className}`} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="settings-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#6b7280" />
                        <stop offset="100%" stopColor="#4b5563" />
                    </linearGradient>
                    <filter id="settings-glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                </defs>
                <circle cx="32" cy="32" r="10" stroke="url(#settings-grad)" strokeWidth="3" fill="none" filter="url(#settings-glow)" />
                <path d="M32 4V12M32 52V60M60 32H52M12 32H4M52.28 11.72L46.2 17.78M17.8 46.22L11.72 52.28M52.28 52.28L46.2 46.22M17.8 17.78L11.72 11.72" stroke="url(#settings-grad)" strokeWidth="3" strokeLinecap="round" />
            </svg>
        ),
        activity: (
            <svg className={`${sizeClass} ${className}`} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="activity-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#34d399" />
                        <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                    <filter id="activity-glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                </defs>
                <path d="M4 32H16L22 16L30 48L38 24L46 32H60" stroke="url(#activity-grad)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" filter="url(#activity-glow)" />
            </svg>
        ),
        danger: (
            <svg className={`${sizeClass} ${className}`} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="danger-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ef4444" />
                        <stop offset="100%" stopColor="#dc2626" />
                    </linearGradient>
                    <filter id="danger-glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                </defs>
                <circle cx="32" cy="32" r="26" stroke="url(#danger-grad)" strokeWidth="3" fill="none" filter="url(#danger-glow)" />
                <line x1="32" y1="18" x2="32" y2="36" stroke="url(#danger-grad)" strokeWidth="4" strokeLinecap="round" />
                <circle cx="32" cy="46" r="3" fill="url(#danger-grad)" />
            </svg>
        ),
        report: (
            <svg className={`${sizeClass} ${className}`} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="report-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#60a5fa" />
                        <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                    <filter id="report-glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                </defs>
                <rect x="8" y="4" width="40" height="56" rx="4" stroke="url(#report-grad)" strokeWidth="3" fill="none" filter="url(#report-glow)" />
                <line x1="16" y1="16" x2="40" y2="16" stroke="url(#report-grad)" strokeWidth="2" />
                <line x1="16" y1="26" x2="40" y2="26" stroke="url(#report-grad)" strokeWidth="2" />
                <line x1="16" y1="36" x2="32" y2="36" stroke="url(#report-grad)" strokeWidth="2" />
                <rect x="40" y="36" width="20" height="24" rx="2" fill="url(#report-grad)" filter="url(#report-glow)" />
                <path d="M45 44V54M50 44V54M55 44V54" stroke="#0a1628" strokeWidth="2" />
            </svg>
        ),
        // Unique destroy/nuke icon for Kill page
        destroy: (
            <svg className={`${sizeClass} ${className}`} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="destroy-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ff4444" />
                        <stop offset="50%" stopColor="#ff0066" />
                        <stop offset="100%" stopColor="#cc0000" />
                    </linearGradient>
                    <filter id="destroy-glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                    <radialGradient id="explosion-grad" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#ffff00" />
                        <stop offset="50%" stopColor="#ff6600" />
                        <stop offset="100%" stopColor="#ff0000" />
                    </radialGradient>
                </defs>
                {/* Explosion rays */}
                <path d="M32 4L34 18L32 8L30 18Z" fill="url(#destroy-grad)" filter="url(#destroy-glow)" />
                <path d="M32 60L34 46L32 56L30 46Z" fill="url(#destroy-grad)" filter="url(#destroy-glow)" />
                <path d="M4 32L18 30L8 32L18 34Z" fill="url(#destroy-grad)" filter="url(#destroy-glow)" />
                <path d="M60 32L46 30L56 32L46 34Z" fill="url(#destroy-grad)" filter="url(#destroy-glow)" />
                {/* Diagonal rays */}
                <path d="M12 12L22 20L14 14L20 22Z" fill="url(#destroy-grad)" filter="url(#destroy-glow)" />
                <path d="M52 52L42 44L50 50L44 42Z" fill="url(#destroy-grad)" filter="url(#destroy-glow)" />
                <path d="M52 12L44 22L50 14L42 20Z" fill="url(#destroy-grad)" filter="url(#destroy-glow)" />
                <path d="M12 52L22 44L14 50L20 42Z" fill="url(#destroy-grad)" filter="url(#destroy-glow)" />
                {/* Center explosion */}
                <circle cx="32" cy="32" r="14" fill="url(#explosion-grad)" filter="url(#destroy-glow)" />
                {/* Skull shape */}
                <path d="M26 28C26 28 24 32 26 35M38 28C38 28 40 32 38 35M28 38L32 40L36 38" stroke="#0a1628" strokeWidth="2" strokeLinecap="round" />
            </svg>
        ),
        analytics: (
            <svg className={`${sizeClass} ${className}`} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="analytics-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#8b5cf6" />
                        <stop offset="100%" stopColor="#6366f1" />
                    </linearGradient>
                    <filter id="analytics-glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                </defs>
                <circle cx="32" cy="32" r="26" stroke="url(#analytics-grad)" strokeWidth="3" fill="none" filter="url(#analytics-glow)" />
                <path d="M32 10V32L48 44" stroke="url(#analytics-grad)" strokeWidth="3" strokeLinecap="round" />
                <circle cx="32" cy="32" r="4" fill="url(#analytics-grad)" />
            </svg>
        ),
    }

    return icons[type] || null
}

export default Icon3D
