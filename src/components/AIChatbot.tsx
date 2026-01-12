'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, X, MessageSquare, Loader2 } from 'lucide-react'
import { EncryptedText } from './EncryptedText'

interface Message {
    role: 'user' | 'assistant'
    content: string
}

export function AIChatbot() {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: 'Secure connection established. Asking about DataLeash security protocols?' }
    ])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
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

            if (!response.ok) throw new Error('Network response was not ok')

            const data = await response.json()
            const assistantMessage: Message = {
                role: 'assistant',
                content: data.choices[0].message.content
            }
            setMessages(prev => [...prev, assistantMessage])
        } catch (error) {
            console.error('Chat error:', error)
            setMessages(prev => [...prev, { role: 'assistant', content: 'Connection interrupted. Security protocol preventing response.' }])
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            {/* Launcher Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-8 right-8 z-50 p-4 rounded-full bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.5)] hover:bg-blue-500 hover:scale-110 transition-all duration-300 group ${isOpen ? 'rotate-90 opacity-0 pointer-events-none' : 'opacity-100'}`}
            >
                <Bot className="w-6 h-6" />
                <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-xs px-2 py-1 rounded border border-blue-500/30 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-blue-300">
                    Ask DataLeash AI
                </span>
            </button>

            {/* Chat Window */}
            <div
                className={`fixed bottom-8 right-8 z-50 w-[350px] md:w-[400px] h-[500px] bg-slate-950/90 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl flex flex-col transition-all duration-500 origin-bottom-right ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-90 opacity-0 translate-y-10 pointer-events-none'
                    }`}
            >
                {/* Header */}
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 rounded-t-2xl relative overflow-hidden">
                    {/* Scanline overlay for header */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.05)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none" />

                    <div className="flex items-center gap-3 relative z-10">
                        {/* Animated Profile Pic */}
                        <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center border border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.3)] group-hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] transition-all overflow-hidden relative">
                            <div className="absolute inset-0 bg-blue-500/10" />
                            <Bot className="w-6 h-6 text-blue-400 relative z-10" />

                            {/* Shine Effect */}
                            <div className="absolute inset-0 w-[200%] translate-x-[-100%] animate-[shine_3s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12" />

                            {/* Static Scanline */}
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-blue-400/50 animate-[scan_2s_linear_infinite]" />
                        </div>

                        <div>
                            <h3 className="font-bold text-blue-400 text-base tracking-widest font-mono">CERBERUS</h3>
                            <div className="flex items-center gap-1.5">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                </span>
                                <span className="text-[10px] text-blue-500 font-mono tracking-wider font-bold">SYSTEM ONLINE</span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white z-10"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    {/* Inject Shine Keyframe locally for this component */}
                    <style jsx>{`
                        @keyframes shine {
                            0% { transform: translateX(-100%) skewX(-15deg); }
                            20% { transform: translateX(100%) skewX(-15deg); }
                            100% { transform: translateX(100%) skewX(-15deg); }
                        }
                    `}</style>
                </div>

                {/* Messages */}
                <div className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    {messages.map((msg, i) => (
                        <div
                            key={i}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                                    ? 'bg-blue-600 text-white rounded-br-none'
                                    : 'bg-slate-800/50 text-slate-300 border border-slate-700/50 rounded-bl-none'
                                    }`}
                            >
                                {msg.role === 'assistant' ? (
                                    // Simple animation for new tokens could go here, but static for now is safer
                                    msg.content
                                ) : (
                                    msg.content
                                )}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-slate-800/50 p-3 rounded-2xl rounded-bl-none border border-slate-700/50 flex items-center gap-2">
                                <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                                <span className="text-xs text-slate-500">Decrypting response...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSubmit} className="p-4 border-t border-slate-800 bg-slate-900/30 rounded-b-2xl">
                    <div className="relative">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask about encryption protocols..."
                            className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600"
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </form>
            </div>
        </>
    )
}
