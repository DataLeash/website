import { NextRequest, NextResponse } from 'next/server'

// Discord webhook for upgrade requests
const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1461334382718488723/mKYGUSJs4LJxRJsynkw88WLWlZNnweGUxDaWe4PLvE_8y2dwelEEEO6AwRaXRWVlILFo'

export async function POST(req: NextRequest) {
    try {
        const { email, transactionId } = await req.json()

        if (!email || !transactionId) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
        }

        // Send to Discord webhook for manual verification
        const discordPayload = {
            embeds: [{
                title: '💰 New Pro Upgrade Request',
                color: 0x10B981, // Green
                fields: [
                    { name: '📧 Email', value: email, inline: true },
                    { name: '🧾 PayPal Transaction ID', value: transactionId, inline: true },
                    { name: '📅 Requested At', value: new Date().toISOString(), inline: false }
                ],
                footer: { text: 'Verify payment in PayPal, then upgrade user in Supabase' }
            }]
        }

        await fetch(DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(discordPayload)
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Upgrade request error:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
