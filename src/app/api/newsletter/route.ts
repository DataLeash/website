import { NextRequest, NextResponse } from 'next/server'

// Discord webhook for newsletter signups
const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1461334382718488723/mKYGUSJs4LJxRJsynkw88WLWlZNnweGUxDaWe4PLvE_8y2dwelEEEO6AwRaXRWVlILFo'

export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json()

        if (!email || !email.includes('@')) {
            return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
        }

        // Send to Discord webhook
        const discordPayload = {
            embeds: [{
                title: '📧 New Newsletter Signup',
                color: 0x3B82F6, // Blue
                fields: [
                    { name: 'Email', value: email, inline: true },
                    { name: 'Timestamp', value: new Date().toISOString(), inline: true }
                ],
                footer: { text: 'DataLeash Newsletter' }
            }]
        }

        const discordRes = await fetch(DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(discordPayload)
        })

        if (!discordRes.ok) {
            console.error('Discord webhook failed:', await discordRes.text())
        }

        return NextResponse.json({ success: true, message: 'Subscribed successfully!' })
    } catch (error) {
        console.error('Newsletter API error:', error)
        return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 })
    }
}
