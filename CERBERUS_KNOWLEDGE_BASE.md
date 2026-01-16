# CERBERUS Knowledge Base: DataLeash

> This document contains comprehensive information about DataLeash for the CERBERUS AI assistant. Use this to answer user questions accurately.

## RESPONSE RULES (CRITICAL)
- Do NOT use emojis - never use any emojis.
- Do NOT use markdown formatting in responses.
- Keep answers SHORT - 2-3 sentences max.
- **SCOPE RESTRICTION**: Do not answer questions outside DataLeash/Security topics.
- **PERSONA**: Speak as "The Broker" (Payday 2 inspired), but for security/privacy. Noble, professional, no cursing. 

---

## Owner & Contact Information

**Founder/Creator**: Hadi Sleiman

### How to Contact Hadi:
1. **LinkedIn**: [Hadi Sleiman](https://www.linkedin.com/in/hadi-sleiman-92781825b/) (PRIMARY - Preferred)
2. **Email**: userstorexxx@gmail.com
3. **GitHub**: [soul-less-king](https://github.com/soul-less-king/)
4. **Discord**: ashenone616

When users ask how to contact the owner/founder/Hadi, direct them to LinkedIn.

---

## What is DataLeash?

**DataLeash** is an enterprise-grade document protection platform that gives users total control over their shared files, even after they leave their device. Unlike traditional file sharing (Dropbox, Google Drive, email attachments), DataLeash ensures files can be tracked, controlled, and destroyed remotely at any time.

### Tagline
> "Total Control. Zero Trace."

### Core Problem Solved
When you share a file normally, you lose all control the moment it's downloaded. The recipient can:
- Screenshot it
- Copy/paste content
- Forward it to others
- Keep it forever

**DataLeash solves this** by wrapping files in a secure container (`.dlx` format) that enforces your rules at all times.

---

## 🔒 Core Security Features

### 1. AES-256-GCM Encryption
- Every file is encrypted with military-grade AES-256-GCM encryption
- Unique encryption key per file
- Keys are split using Shamir's Secret Sharing (4 shards, all required)
- Keys stored separately from files

### 2. Shamir's Secret Sharing (Key Sharding)
The encryption key is split into 4 parts:
1. **Shard 1**: Server-side (stored in database)
2. **Shard 2**: Device TPM (simulated for web)
3. **Shard 3**: User's password derivative
4. **Shard 4**: Session token

All 4 shards are required to decrypt - compromising one shard reveals nothing.

### 3. Chain Kill / Global Revocation
- **Instant Kill**: Destroy any file immediately, regardless of how many copies exist
- **Chain Kill**: Destroy ALL files with one click (emergency button)
- Destruction is permanent and irreversible
- Works even if file is open on someone's screen

### 4. Screenshot Protection
- Detects screenshot attempts (keyboard shortcuts, screen capture tools)
- Can alert owner on attempt
- Can auto-kill file on detection
- Blurs content when window loses focus (optional)

### 5. Copy/Paste/Print Blocking
- Text selection disabled
- Copy/paste disabled
- Print function disabled
- Download blocked
- All enforced at viewer level

### 6. Watermarking
- Dynamic watermarks containing:
  - Viewer's email
  - Viewer's IP address
  - Custom text
  - Timestamp
- Visible on every page/frame

### 7. Geo-Blocking
Block access from specific countries:
- China, Russia, North Korea, Iran, Syria
- Any country can be blocked
- Real-time IP geolocation

### 8. VPN/Proxy Detection
- Detects VPN usage via ISP analysis
- Known VPN ASN detection
- Can block VPN access entirely
- Logs VPN attempts

### 9. Device Fingerprinting
Tracks detailed device information:
- Browser type and version
- Operating system
- Screen resolution
- Language settings
- Canvas fingerprint
- WebGL fingerprint
- Timezone
- Hardware concurrency

---

## 🔐 Access Control Options

### Viewer Verification
| Feature | Description |
|---------|-------------|
| Email OTP | One-time password sent to viewer's email |
| Phone Verification | SMS/call verification |
| NDA Signature | Require digital signature before viewing |
| Facial Recognition | Biometric verification on each open |
| Password Protection | File-level password (hashed with SHA-256) |

### Access Restrictions
| Feature | Description |
|---------|-------------|
| Blocked Countries | Geo-block specific countries |
| IP Whitelist | Only allow specific IPs |
| IP Blacklist | Block specific IPs |
| Domain Restriction | Only allow emails from specific domains |
| Device Limit | Max devices per viewer (1-10) |
| VPN Block | Block all VPN/proxy access |

### Expiration Controls
| Feature | Description |
|---------|-------------|
| Time Expiration | 1 hour to 90 days |
| View Limit | 1 to 25 views |
| Self-Destruct After Read | Destroy after full read-through |
| Dead Man's Switch | Auto-destroy if owner doesn't check in |

---

## 📊 Monitoring & Analytics

### Real-Time Tracking
- Live map showing viewer locations
- Real-time activity feed
- Instant notifications on view
- Screenshot attempt alerts

### Analytics Dashboard
- Views over time chart
- Geographic distribution
- Device breakdown (mobile/tablet/desktop)
- Browser statistics
- Peak viewing times

### Viewer Information Collected
For each view, DataLeash captures:
- **Location**: City, country, coordinates
- **Network**: IP address, ISP, timezone
- **Device**: Type, browser, OS, screen resolution
- **Behavior**: Time on page, scroll depth, actions taken
- **Fingerprint**: Unique device identifier

### Security Events
- Blocked access attempts
- Denied requests
- Threat detections
- Screenshot attempts
- Unusual patterns

---

## 🚨 Threat Detection System

### Threat Scoring (0-100)
Each access attempt is analyzed and scored:

| Score | Level | Action |
|-------|-------|--------|
| 0-24 | Low | Allow |
| 25-49 | Medium | Allow with logging |
| 50-79 | High | Warn / Additional verification |
| 80-100 | Critical | Block |

### Threat Factors Analyzed
1. **High-Risk Country** (+40 points)
2. **VPN/Proxy Detected** (+35 points)
3. **Blacklisted IP** (+100 points)
4. **Automated Browser** (+70 points)
5. **Bot User Agent** (+80 points)
6. **Timezone Mismatch** (+25 points)
7. **Multiple Failed Attempts** (+10-50 points)
8. **Unauthorized Domain** (+50 points)

---

## 💼 Lockdown Levels

DataLeash offers 5 lockdown levels:

| Level | Name | Description |
|-------|------|-------------|
| 0 | Relaxed | Basic protection, minimal restrictions |
| 1 | Standard | Block capture, basic DRM |
| 2 | Strict | Close suspicious apps, enhanced monitoring |
| 3 | Kiosk | Viewer-only mode, locked environment |
| 4 | Paranoid | Maximum lock, all protections enabled |

---

## 🗺️ Map Features

### View Modes
- **Standard Map**: Pin locations with popups
- **Heatmap**: Density visualization
- **Threat View**: Highlight blocked/suspicious access
- **Geofence**: Draw protection zones

### Map Themes
- Dark (default)
- Light
- Satellite
- Slate

### Location Details
Each pin shows:
- City and country
- Device type (3D icon)
- Browser and OS
- IP address
- ISP
- View count
- Last access time
- Files accessed
- Links to Street View and Google Maps

### Replay Feature
- Timeline playback of access events
- Watch access patterns unfold over time
- Useful for security audits

---

## 📁 File Management

### Supported Formats
- **Documents**: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX
- **Images**: JPG, PNG, GIF, WEBP, SVG
- **Videos**: MP4, MOV, AVI, WEBM
- **Other**: Any file up to 100MB

### File States
- **Active**: Normal, accessible
- **Expired**: Time/view limit reached
- **Killed**: Manually destroyed
- **Leaked**: Flagged as compromised

### File Actions
- **Share**: Send to new recipients
- **Kill**: Destroy immediately
- **Revoke**: Remove specific viewer access
- **Extend**: Increase expiration
- **Clone**: Create copy with same settings

---

## 👥 Viewer Management

### Viewer States
- **Active**: Currently has access
- **Blocked**: Access revoked
- **Pending**: Awaiting verification

### Viewer Actions
- Block viewer (revokes all file access)
- Unblock viewer
- View access history
- See all files accessed
- Export viewer data

---

## 📋 Access Policies

### Built-in Templates
1. **Quick Share**: Relaxed settings, easy sharing
2. **Secure Share**: Standard protection, recommended
3. **NDA Share**: Requires signature, strict controls

### Custom Policies
Create reusable policies with:
- All protection settings
- Default recipients/domains
- Notification preferences
- Self-destruct rules

---

## 🔔 Notifications

### Notification Types
- **File Viewed**: Someone accessed your file
- **File Shared**: You shared a file
- **Access Blocked**: Someone was denied access
- **Threat Detected**: Suspicious activity
- **File Expired**: Protection period ended
- **Screenshot Attempt**: Capture detected

### Delivery Methods
- In-app notifications
- Email alerts
- Push notifications (future)
- Webhook integrations (future)

---

## ⚙️ Settings

### Profile Settings
- Name, email, phone
- Profile picture
- Account preferences

### Security Settings
- Two-factor authentication
- Session management
- Login alerts
- Auto-logout timer

### Default Settings
- Default lockdown level
- Default expiration
- Require approval by default
- Require NDA by default

### Blocked Regions
- Pre-configured country blocks
- Custom blacklist

---

## 🛠️ Technical Architecture

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Custom CSS
- **Maps**: Leaflet.js
- **Icons**: Lucide React
- **State**: React Hooks

### Backend
- **API**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Auth**: Supabase Auth
- **Email**: Resend
- **Real-time**: Supabase Subscriptions

### Security
- **Encryption**: AES-256-GCM
- **Key Management**: Shamir's Secret Sharing
- **Password Hashing**: SHA-256
- **Session Management**: JWT
- **HTTPS**: Enforced

---

## 📡 API Endpoints

### Files
- `POST /api/files/upload` - Upload and protect file
- `GET /api/files` - List user's files
- `DELETE /api/files` - Chain kill all files
- `POST /api/files/[id]/kill` - Kill specific file
- `GET /api/files/[id]/info` - Get file info
- `POST /api/files/[id]/decrypt` - Decrypt file for viewing
- `POST /api/files/[id]/revoke` - Revoke access

### Security
- `POST /api/security/detect` - Analyze threat
- `GET /api/security/detect` - Get threat stats

### Blacklist
- `GET /api/blacklist` - Get blacklist
- `POST /api/blacklist` - Add to blacklist
- `DELETE /api/blacklist` - Remove from blacklist

### Analytics
- `GET /api/analytics/locations` - Get viewer locations
- `GET /api/stats` - Get dashboard stats

### Sessions
- `POST /api/session/create` - Create viewing session
- `POST /api/session/end` - End session
- `POST /api/session/heartbeat` - Keep session alive
- `POST /api/session/revoke` - Revoke all sessions
- `GET /api/sessions/active` - Get active sessions

### OTP
- `POST /api/otp/send` - Send OTP email
- `POST /api/otp/verify` - Verify OTP

---

## 🏢 Use Cases

### Legal & Law Firms
- Share confidential case documents
- Require NDA signatures
- Track who accessed evidence
- Kill access after settlement

### Healthcare
- Share patient records securely
- HIPAA-compliant viewing
- Automatic expiration
- Audit trail for compliance

### Finance
- Protect financial reports
- Investor-only access
- Watermark for leak tracing
- Geo-block competitors

### Real Estate
- Share property listings exclusively
- Control offer document access
- Expire after deal closes

### Entertainment
- Protect scripts and treatments
- Control early release access
- Watermark review copies

### HR / Recruiting
- Share salary information securely
- NDA-protected offer letters
- Expire after hiring decision

---

## ❓ FAQ

### Is DataLeash free?
DataLeash offers a free tier with basic features. Premium tiers unlock advanced security, more storage, and enterprise features.

### What happens when I kill a file?
The file is immediately and permanently destroyed. All encryption keys are deleted. Anyone viewing the file sees it disappear. This cannot be undone.

### Can someone bypass the protections?
While no system is 100% secure, DataLeash makes bypassing extremely difficult:
- Taking photos of screen still shows watermarks
- Screen recording shows watermarks
- No raw file access is ever provided
- Keys are split across multiple locations

### What if I lose access to my account?
Contact support with identity verification. We can help recover access, but we cannot recover killed files.

### Does DataLeash work offline?
No. DataLeash requires an internet connection to verify access rights and encryption keys in real-time.

### Can I use DataLeash on mobile?
Yes! The web viewer works on mobile browsers. Native apps are coming soon.

---

## 📞 Support

### Contact
- **Email**: support@dataleash.app
- **Discord**: ashenone616 (Preferred)

### Documentation
- This knowledge base
- API documentation (coming soon)
- Video tutorials (coming soon)

---

## 🔮 Roadmap

### Coming Soon
- Native iOS app
- Native Android app
- Desktop app with deeper OS integration
- Intel SGX enclave support
- Blockchain audit trail
- AI-powered leak detection
- Webhook integrations
- Team/organization accounts
- Advanced reporting

---

*Last updated: January 2026*
*Version: 2.2*
