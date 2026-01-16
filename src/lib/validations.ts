import { z } from 'zod'

// Auth validation schemas
export const signupSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z
        .string()
        .min(12, 'Password must be at least 12 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character'),
    full_name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format (use E.164 format)'),
    qid: z.string().min(5, 'QID must be at least 5 characters'),
})

export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
})

// File operation schemas
export const fileSettingsSchema = z.object({
    lockdown_level: z.number().min(1).max(5).default(1),
    trust_level: z.number().min(1).max(5).default(1),
    expires_at: z.string().nullable().default(null),
    max_views: z.number().nullable().default(null),
    blocked_countries: z.array(z.string()).default([]),
    allowed_ips: z.array(z.string()).default([]),
    blocked_ips: z.array(z.string()).default([]),
    allowed_domains: z.array(z.string()).default([]),
    device_limit: z.number().min(1).max(100).default(3),
    require_vpn_block: z.boolean().default(false),
    require_nda: z.boolean().default(false),
    require_facial: z.boolean().default(false),
    require_email_otp: z.boolean().default(false),
    require_phone_verify: z.boolean().default(false),
    require_password: z.boolean().default(false),
    file_password: z.string().default(''),
    add_watermark: z.boolean().default(true),
    watermark_text: z.string().default(''),
    block_copy_paste: z.boolean().default(true),
    block_printing: z.boolean().default(true),
    block_download: z.boolean().default(true),
    blur_on_inactive: z.boolean().default(false),
    notify_on_view: z.boolean().default(true),
    track_scroll_depth: z.boolean().default(false),
    track_time_per_page: z.boolean().default(false),
    alert_on_screenshot: z.boolean().default(true),
    log_all_actions: z.boolean().default(true),
    auto_kill_on_screenshot: z.boolean().default(false),
    self_destruct_after_read: z.boolean().default(false),
    destroy_on_forward: z.boolean().default(false),
    destroy_on_leak_detected: z.boolean().default(true),
    dead_man_switch: z.boolean().default(false),
    dead_man_hours: z.number().min(1).max(8760).default(72),
})

// OTP schemas
export const otpSendSchema = z.object({
    email: z.string().email('Invalid email address'),
    fileId: z.string().uuid('Invalid file ID'),
})

export const otpVerifySchema = z.object({
    email: z.string().email('Invalid email address'),
    code: z.string().length(6, 'OTP must be 6 digits'),
    fileId: z.string().uuid('Invalid file ID'),
})

// Session schemas
export const sessionHeartbeatSchema = z.object({
    session_id: z.string().uuid().optional(),
    file_id: z.string().uuid().optional(),
    fileId: z.string().uuid().optional(),
    viewer_email: z.string().email().optional(),
    viewerEmail: z.string().email().optional(),
}).refine(data => data.session_id || (data.file_id || data.fileId), {
    message: 'Either session_id or file_id is required',
})

// Helper to format Zod errors
export function formatZodErrors(error: z.ZodError<unknown>): string {
    return error.issues.map(e => e.message).join(', ')
}

export type SignupInput = z.infer<typeof signupSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type FileSettings = z.infer<typeof fileSettingsSchema>
