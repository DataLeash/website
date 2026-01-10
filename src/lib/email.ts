import { Resend } from 'resend'

// Lazy initialization - only create Resend client when needed
let resendClient: Resend | null = null

function getResendClient(): Resend {
    if (!resendClient) {
        if (!process.env.RESEND_API_KEY) {
            throw new Error('RESEND_API_KEY is not configured')
        }
        resendClient = new Resend(process.env.RESEND_API_KEY)
    }
    return resendClient
}

interface SendOtpEmailParams {
    to: string
    viewerName: string
    fileName: string
    ownerName: string
    code: string
}

export async function sendOtpEmail({ to, viewerName, fileName, ownerName, code }: SendOtpEmailParams) {
    const resend = getResendClient()
    const { data, error } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'Data Leash <noreply@dataleash.app>',
        to: [to],
        subject: `Your verification code: ${code}`,
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="480" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, rgba(0,212,255,0.1) 0%, rgba(0,153,255,0.1) 100%); border: 1px solid rgba(0,212,255,0.3); border-radius: 16px; padding: 40px;">
                    <tr>
                        <td align="center" style="padding-bottom: 24px;">
                            <h1 style="margin: 0; font-size: 28px; font-weight: bold; background: linear-gradient(135deg, #00d4ff 0%, #0099ff 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
                                🔐 Data Leash
                            </h1>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding-bottom: 24px;">
                            <p style="margin: 0; color: #ffffff; font-size: 18px;">
                                Hi ${viewerName},
                            </p>
                            <p style="margin: 8px 0 0; color: #888888; font-size: 14px;">
                                ${ownerName} has shared a protected file with you
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding-bottom: 24px;">
                            <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(0,212,255,0.2); border-radius: 8px; padding: 16px; display: inline-block;">
                                <p style="margin: 0; color: #888888; font-size: 12px;">File</p>
                                <p style="margin: 4px 0 0; color: #00d4ff; font-size: 16px; font-weight: bold;">
                                    📄 ${fileName}
                                </p>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding-bottom: 16px;">
                            <p style="margin: 0; color: #888888; font-size: 14px;">
                                Your verification code is:
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding-bottom: 24px;">
                            <div style="background: linear-gradient(135deg, #00d4ff 0%, #0099ff 100%); border-radius: 12px; padding: 20px 40px; display: inline-block;">
                                <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #000000; font-family: monospace;">
                                    ${code}
                                </span>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding-bottom: 24px;">
                            <p style="margin: 0; color: #888888; font-size: 12px;">
                                This code expires in 10 minutes
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="border-top: 1px solid rgba(0,212,255,0.2); padding-top: 24px;">
                            <p style="margin: 0; color: #666666; font-size: 11px; text-align: center;">
                                If you didn't request this code, please ignore this email.<br>
                                Your access will be logged and the file owner will be notified.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `,
        text: `
Data Leash - Email Verification

Hi ${viewerName},

${ownerName} has shared a protected file with you: ${fileName}

Your verification code is: ${code}

This code expires in 10 minutes.

If you didn't request this code, please ignore this email.
        `
    })

    if (error) {
        console.error('Resend error:', error)
        throw new Error(error.message)
    }

    return data
}

interface SendAccessNotificationParams {
    to: string
    ownerName: string
    viewerName: string
    viewerEmail: string
    fileName: string
    action: 'viewed' | 'accessed' | 'nda_signed'
}

export async function sendAccessNotification({ to, ownerName, viewerName, viewerEmail, fileName, action }: SendAccessNotificationParams) {
    const resend = getResendClient()
    const actionText = {
        viewed: 'viewed',
        accessed: 'requested access to',
        nda_signed: 'signed the NDA for'
    }

    const { data, error } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'Data Leash <noreply@dataleash.app>',
        to: [to],
        subject: `🔔 ${viewerName} ${actionText[action]} your file`,
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="480" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, rgba(0,212,255,0.1) 0%, rgba(0,153,255,0.1) 100%); border: 1px solid rgba(0,212,255,0.3); border-radius: 16px; padding: 40px;">
                    <tr>
                        <td align="center" style="padding-bottom: 24px;">
                            <h1 style="margin: 0; font-size: 24px; color: #00d4ff;">🔔 File Activity Alert</h1>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding-bottom: 24px;">
                            <p style="margin: 0; color: #ffffff; font-size: 16px;">
                                Hi ${ownerName},
                            </p>
                            <p style="margin: 16px 0 0; color: #ffffff; font-size: 16px;">
                                <strong>${viewerName}</strong> (${viewerEmail})<br>
                                ${actionText[action]} your file:
                            </p>
                            <p style="margin: 16px 0 0; color: #00d4ff; font-size: 18px; font-weight: bold;">
                                📄 ${fileName}
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td align="center">
                            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://dataleash.app'}/dashboard/activity" style="display: inline-block; background: linear-gradient(135deg, #00d4ff 0%, #0099ff 100%); color: #000000; font-weight: bold; padding: 12px 24px; border-radius: 8px; text-decoration: none;">
                                View Activity Log
                            </a>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `,
        text: `
Data Leash - File Activity Alert

Hi ${ownerName},

${viewerName} (${viewerEmail}) ${actionText[action]} your file: ${fileName}

View your activity log at: ${process.env.NEXT_PUBLIC_APP_URL || 'https://dataleash.app'}/dashboard/activity
        `
    })

    if (error) {
        console.error('Resend notification error:', error)
        // Don't throw - notifications are not critical
        return null
    }

    return data
}
