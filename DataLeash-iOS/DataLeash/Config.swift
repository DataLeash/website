import Foundation

enum Config {
    // Supabase
    static let supabaseURL = "https://lmztgowusgerekrqmjnj.supabase.co"
    static let supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtenRnb3d1c2dlcmVrcnFtam5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5ODAxMjgsImV4cCI6MjA4MzU1NjEyOH0.El2sfWJ2uX7IzC_HdFNSBezAy7a0Mm16YSj0au9QetU"
    
    // API Base URL (your deployed Next.js app)
    static let apiBaseURL = "https://dataleash.vercel.app"
    
    // OAuth redirect scheme
    static let oauthRedirectScheme = "dataleash"
}
