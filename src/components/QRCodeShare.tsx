'use client'

import { useState, useEffect, useRef } from 'react'
import { QrCode, Download, Copy, Check, Printer } from 'lucide-react'

interface QRCodeShareProps {
    url: string
    fileName: string
    onClose?: () => void
}

export function QRCodeShare({ url, fileName, onClose }: QRCodeShareProps) {
    const [copied, setCopied] = useState(false)
    const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        generateQR()
    }, [url])

    const generateQR = async () => {
        if (!canvasRef.current) return

        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const size = 280
        canvas.width = size
        canvas.height = size

        // Generate QR code using simple encoding
        // For production, use a proper QR library like qrcode

        // White background
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, size, size)

        // Generate QR matrix
        const qrMatrix = generateQRMatrix(url)
        const moduleSize = Math.floor(size / qrMatrix.length)
        const offset = Math.floor((size - moduleSize * qrMatrix.length) / 2)

        ctx.fillStyle = '#000000'
        for (let y = 0; y < qrMatrix.length; y++) {
            for (let x = 0; x < qrMatrix[y].length; x++) {
                if (qrMatrix[y][x]) {
                    ctx.fillRect(
                        offset + x * moduleSize,
                        offset + y * moduleSize,
                        moduleSize,
                        moduleSize
                    )
                }
            }
        }

        // Add DataLeash branding
        ctx.fillStyle = '#00d4ff'
        const logoSize = 40
        const logoX = (size - logoSize) / 2
        const logoY = (size - logoSize) / 2

        // White background for logo
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(logoX - 5, logoY - 5, logoSize + 10, logoSize + 10)

        // Logo text
        ctx.fillStyle = '#00d4ff'
        ctx.font = 'bold 12px Arial'
        ctx.textAlign = 'center'
        ctx.fillText('DL', size / 2, size / 2 + 4)

        setQrDataUrl(canvas.toDataURL('image/png'))
    }

    // Simplified QR matrix generation (for demo - use proper library in prod)
    const generateQRMatrix = (data: string): boolean[][] => {
        const size = 29 // QR code version 3
        const matrix: boolean[][] = Array(size).fill(null).map(() => Array(size).fill(false))

        // Add finder patterns
        addFinderPattern(matrix, 0, 0)
        addFinderPattern(matrix, size - 7, 0)
        addFinderPattern(matrix, 0, size - 7)

        // Add timing patterns
        for (let i = 8; i < size - 8; i++) {
            matrix[6][i] = i % 2 === 0
            matrix[i][6] = i % 2 === 0
        }

        // Fill with data pattern (simplified)
        const hash = simpleHash(data)
        let idx = 0
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                if (!isReserved(x, y, size)) {
                    matrix[y][x] = ((hash.charCodeAt(idx % hash.length) + x + y) % 3) === 0
                    idx++
                }
            }
        }

        return matrix
    }

    const addFinderPattern = (matrix: boolean[][], x: number, y: number) => {
        for (let dy = 0; dy < 7; dy++) {
            for (let dx = 0; dx < 7; dx++) {
                const isFrame = dx === 0 || dx === 6 || dy === 0 || dy === 6
                const isCenter = dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4
                matrix[y + dy][x + dx] = isFrame || isCenter
            }
        }
    }

    const isReserved = (x: number, y: number, size: number): boolean => {
        return (
            (x < 8 && y < 8) ||
            (x < 8 && y >= size - 8) ||
            (x >= size - 8 && y < 8) ||
            x === 6 || y === 6
        )
    }

    const simpleHash = (str: string): string => {
        let hash = ''
        for (let i = 0; i < str.length; i++) {
            hash += str.charCodeAt(i).toString(36)
        }
        return hash
    }

    const copyLink = async () => {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const downloadQR = () => {
        if (!qrDataUrl) return
        const link = document.createElement('a')
        link.download = `${fileName.replace(/\.[^.]+$/, '')}_qr.png`
        link.href = qrDataUrl
        link.click()
    }

    const printQR = () => {
        if (!qrDataUrl) return
        const printWindow = window.open('', '_blank')
        if (!printWindow) return

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head><title>QR Code - ${fileName}</title></head>
            <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:system-ui;">
                <h2 style="margin-bottom:1rem;">${fileName}</h2>
                <img src="${qrDataUrl}" style="width:300px;height:300px;" />
                <p style="margin-top:1rem;color:#666;font-size:0.875rem;">Scan to view protected file</p>
                <p style="color:#00d4ff;font-size:0.75rem;margin-top:0.5rem;">Protected by DataLeash</p>
            </body>
            </html>
        `)
        printWindow.document.close()
        printWindow.print()
    }

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={onClose}>
            <div
                className="glass-card p-6 max-w-sm w-full mx-4"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                        <QrCode className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="font-bold">Share QR Code</h3>
                </div>

                <div className="bg-white rounded-lg p-4 mb-4 flex items-center justify-center">
                    <canvas ref={canvasRef} width={280} height={280} className="max-w-full" />
                </div>

                <p className="text-xs text-[var(--foreground-muted)] truncate mb-4 px-2">
                    {url}
                </p>

                <div className="grid grid-cols-3 gap-2">
                    <button
                        onClick={copyLink}
                        className="flex flex-col items-center gap-1 p-3 rounded-lg bg-[rgba(0,212,255,0.1)] hover:bg-[rgba(0,212,255,0.2)] transition"
                    >
                        {copied ? <Check className="w-5 h-5 text-[var(--success)]" /> : <Copy className="w-5 h-5" />}
                        <span className="text-xs">{copied ? 'Copied!' : 'Copy'}</span>
                    </button>

                    <button
                        onClick={downloadQR}
                        className="flex flex-col items-center gap-1 p-3 rounded-lg bg-[rgba(0,212,255,0.1)] hover:bg-[rgba(0,212,255,0.2)] transition"
                    >
                        <Download className="w-5 h-5" />
                        <span className="text-xs">Download</span>
                    </button>

                    <button
                        onClick={printQR}
                        className="flex flex-col items-center gap-1 p-3 rounded-lg bg-[rgba(0,212,255,0.1)] hover:bg-[rgba(0,212,255,0.2)] transition"
                    >
                        <Printer className="w-5 h-5" />
                        <span className="text-xs">Print</span>
                    </button>
                </div>

                <button
                    onClick={onClose}
                    className="w-full mt-4 py-2 text-sm text-[var(--foreground-muted)] hover:text-white transition"
                >
                    Close
                </button>
            </div>
        </div>
    )
}

export default QRCodeShare
