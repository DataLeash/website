'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, X, Lock, MessageCircle } from 'lucide-react'
import Image from 'next/image'

interface Message {
    role: 'user' | 'assistant'
    content: string
    isNew?: boolean
}

// Encryption animation component - shows random chars then reveals text
function EncryptingMessage({ text, onComplete }: { text: string, onComplete: () => void }) {
    const [displayText, setDisplayText] = useState('')
    const [charIndex, setCharIndex] = useState(0)
    const chars = '█▓▒░₿Ξ◊∆∇⌘⌥⎋⏎⏻⏼0123456789ABCDEFabcdef'

    useEffect(() => {
        if (charIndex >= text.length) {
            onComplete()
            return
        }

        // Show random chars for current position
        const scrambleInterval = setInterval(() => {
            setDisplayText(prev => {
                const revealed = text.slice(0, charIndex)
                const current = chars[Math.floor(Math.random() * chars.length)]
                const remaining = text.slice(charIndex + 1).split('').map(() =>
                    chars[Math.floor(Math.random() * chars.length)]
                ).join('')
                return revealed + current + remaining
            })
        }, 30)

        // Move to next char
        const advanceTimeout = setTimeout(() => {
            clearInterval(scrambleInterval)
            setCharIndex(prev => prev + 1)
            setDisplayText(text.slice(0, charIndex + 1) + text.slice(charIndex + 1).split('').map(() =>
                chars[Math.floor(Math.random() * chars.length)]
            ).join(''))
        }, 50)

        return () => {
            clearInterval(scrambleInterval)
            clearTimeout(advanceTimeout)
        }
    }, [charIndex, text, chars, onComplete])

    return (
        <span className="font-mono">
            {displayText || text.split('').map(() => chars[Math.floor(Math.random() * chars.length)]).join('')}
        </span>
    )
}

// Shiny text effect
function ShinyText({ children, className = '' }: { children: React.ReactNode, className?: string }) {
    return (
        <span className={`relative inline-block ${className}`}>
            {children}
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        </span>
    )
}

export function AIChatbot() {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: 'Hello! I\'m here to help you learn about DataLeash and our security solutions. What would you like to know?', isNew: false }
    ])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [encryptingMessageId, setEncryptingMessageId] = useState<number | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || isLoading) return

        const userMessage: Message = { role: 'user', content: input }
        setMessages(prev => [...prev, userMessage])
        setInput('')
        setIsLoading(true)

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: [...messages, userMessage].map(({ role, content }) => ({ role, content })) }),
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.error || `Server error: ${response.status}`)
            }

            const data = await response.json()
            const newMessageIndex = messages.length + 1
            setEncryptingMessageId(newMessageIndex)

            const assistantMessage: Message = {
                role: 'assistant',
                content: data.choices[0].message.content,
                isNew: true
            }
            setMessages(prev => [...prev, assistantMessage])
        } catch (error: any) {
            console.error('Chat error:', error)
            const errorMessage = error.message || 'Connection lost. Retrying secure handshake...'
            setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${errorMessage}`, isNew: true }])
        } finally {
            setIsLoading(false)
        }
    }

    const handleEncryptionComplete = (index: number) => {
        if (encryptingMessageId === index) {
            setEncryptingMessageId(null)
            setMessages(prev => prev.map((msg, i) =>
                i === index ? { ...msg, isNew: false } : msg
            ))
        }
    }

    return (
        <>
            {/* Launcher Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-6 right-6 z-50 p-3 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 group ${isOpen ? 'scale-0 opacity-0 pointer-events-none' : 'opacity-100'
                    }`}
            >
                <div className="relative">
                    <MessageCircle className="w-6 h-6" />
                    {/* Pulse ring */}
                    <span className="absolute -inset-1 rounded-full bg-blue-400 opacity-20 animate-ping" />
                </div>
                <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900/95 text-xs px-3 py-1.5 rounded-lg border border-blue-500/30 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-blue-300 backdrop-blur">
                    Ask Us Anything
                </span>
            </button>

            {/* Chat Window */}
            <div
                className={`fixed bottom-6 right-6 z-50 w-[380px] md:w-[420px] h-[550px] bg-slate-950/95 backdrop-blur-xl border border-cyan-500/30 rounded-3xl shadow-[0_0_60px_rgba(0,212,255,0.2)] flex flex-col transition-all duration-500 origin-bottom-right overflow-hidden ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-90 opacity-0 translate-y-10 pointer-events-none'
                    }`}
            >
                {/* Animated border glow */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 animate-pulse pointer-events-none" />
                <div className="absolute inset-[1px] rounded-3xl bg-slate-950/95 pointer-events-none" />

                {/* Header */}
                <div className="relative p-4 border-b border-slate-700/50 flex justify-between items-center bg-gradient-to-r from-slate-900 to-slate-800 z-10">
                    <div className="flex items-center gap-3 relative z-10">
                        {/* Avatar Image */}
                        <div className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-blue-500/50 shadow-lg">
                            <Image
                                src="/cerberus-avatar.png"
                                alt="DataLeash Assistant"
                                fill
                                className="object-cover"
                            />
                        </div>

                        <div>
                            <h3 className="font-semibold text-white text-base">
                                DataLeash Assistant
                            </h3>
                            <div className="flex items-center gap-2">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                                </span>
                                <span className="text-xs text-emerald-400">
                                    Online
                                </span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 hover:bg-slate-700/50 rounded-lg transition-all text-slate-400 hover:text-white z-10"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar relative z-10">
                    {/* Background grid */}
                    <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
                        backgroundImage: 'radial-gradient(circle, #00d4ff 1px, transparent 1px)',
                        backgroundSize: '20px 20px'
                    }} />

                    {messages.map((msg, i) => (
                        <div
                            key={i}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                        >
                            <div
                                className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed relative overflow-hidden ${msg.role === 'user'
                                    ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-br-sm shadow-[0_0_20px_rgba(0,212,255,0.3)]'
                                    : 'bg-slate-800/80 text-slate-200 border border-cyan-500/20 rounded-bl-sm backdrop-blur'
                                    }`}
                            >
                                {msg.role === 'assistant' && msg.isNew && encryptingMessageId === i ? (
                                    <EncryptingMessage
                                        text={msg.content}
                                        onComplete={() => handleEncryptionComplete(i)}
                                    />
                                ) : (
                                    <span className={msg.role === 'assistant' ? 'relative' : ''}>
                                        {msg.content}
                                    </span>
                                )}

                                {/* Shine effect on assistant messages */}
                                {msg.role === 'assistant' && !msg.isNew && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/5 to-transparent animate-shimmer pointer-events-none" />
                                )}
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex justify-start animate-fadeIn">
                            <div className="bg-slate-800/80 p-4 rounded-2xl rounded-bl-sm border border-cyan-500/20 flex items-center gap-3">
                                <div className="relative">
                                    <Lock className="w-4 h-4 text-cyan-400" />
                                    <span className="absolute inset-0 animate-ping">
                                        <Lock className="w-4 h-4 text-cyan-400 opacity-50" />
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="text-xs text-cyan-400 font-mono">Decrypting</span>
                                    <span className="flex gap-1">
                                        <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSubmit} className="relative p-4 border-t border-cyan-500/20 bg-slate-900/50 z-10">
                    <div className="relative group">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask about security features..."
                            className="w-full bg-slate-800/50 border border-cyan-500/30 text-slate-200 text-sm rounded-xl pl-4 pr-14 py-3.5 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all placeholder:text-slate-500 font-mono"
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_15px_rgba(0,212,255,0.3)] hover:shadow-[0_0_25px_rgba(0,212,255,0.5)]"
                        >
                            <Send className="w-4 h-4" />
                        </button>

                        {/* Input glow effect */}
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/0 via-cyan-500/5 to-cyan-500/0 opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />
                    </div>

                    {/* Security badge */}
                    <div className="flex items-center justify-center gap-2 mt-3 text-[10px] text-slate-500">
                        <Lock className="w-3 h-3" />
                        <span>Secure • Powered by AI</span>
                    </div>
                </form>
            </div>

            {/* Styles */}
            <style jsx global>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                @keyframes scan {
                    0% { background-position: 0 0; }
                    100% { background-position: 0 100%; }
                }
                @keyframes scanline {
                    0%, 100% { transform: translateY(0); opacity: 0; }
                    50% { transform: translateY(40px); opacity: 1; }
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-shimmer {
                    animation: shimmer 3s infinite;
                }
                .animate-scan {
                    animation: scan 8s linear infinite;
                }
                .animate-scanline {
                    animation: scanline 2s ease-in-out infinite;
                }
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(0, 212, 255, 0.3);
                    border-radius: 2px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(0, 212, 255, 0.5);
                }
            `}</style>
        </>
    )
}
