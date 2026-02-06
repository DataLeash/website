'use client'

import { useState } from 'react'
import { Send, CheckCircle, Mail, Building2, User, MessageSquare, Users, Briefcase, Phone } from 'lucide-react'

// Discord webhook for quote submissions
const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1468950207931613417/gvQte3nAhpoNdvHpXRXl1e_29GtC0LnWtHk-LDpSU1qgTphlt3zG3LMH6iTUkH9yFhxB'

const INDUSTRY_OPTIONS = [
  { value: '', label: 'Select your sector...' },
  { value: 'defense', label: 'Defense & Military' },
  { value: 'government', label: 'Government & Public Sector' },
  { value: 'intelligence', label: 'Intelligence & Security' },
  { value: 'aerospace', label: 'Aerospace' },
  { value: 'critical-infrastructure', label: 'Critical Infrastructure' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'legal', label: 'Legal & Law Enforcement' },
  { value: 'finance', label: 'Finance & Banking' },
  { value: 'other', label: 'Other' },
]

export function DemoRequestForm() {
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    phone: '',
    organization: '',
    industry: '',
    userCount: '',
    message: ''
  })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setErrorMessage('')

    // Format the message for Discord
    const discordMessage = {
      embeds: [{
        title: '📋 New Quote Request',
        color: 0x3B82F6, // Blue color
        fields: [
          { name: '👤 Name', value: formState.name || 'Not provided', inline: true },
          { name: '📧 Email', value: formState.email || 'Not provided', inline: true },
          { name: '📞 Phone', value: formState.phone || 'Not provided', inline: true },
          { name: '🏢 Organization', value: formState.organization || 'Not provided', inline: true },
          { name: '🏛️ Industry', value: INDUSTRY_OPTIONS.find(o => o.value === formState.industry)?.label || 'Not specified', inline: true },
          { name: '👥 Expected Users', value: formState.userCount || 'Not specified', inline: true },
          { name: '💬 Message', value: formState.message || 'No additional message' },
        ],
        timestamp: new Date().toISOString(),
        footer: {
          text: 'DataLeash Quote Request'
        }
      }]
    }

    try {
      const response = await fetch(DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(discordMessage),
      })

      if (response.ok || response.status === 204) {
        setStatus('success')
      } else {
        throw new Error('Failed to submit request')
      }
    } catch (error) {
      console.error('Error submitting quote request:', error)
      setStatus('error')
      setErrorMessage('There was an issue submitting your request. Please try again or contact us directly.')
    }
  }

  return (
    <section id="pricing" className="py-24 px-6 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-slate-950/50" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Request a Quote
          </h2>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto">
            Discover how DataLeash can protect your organization's most sensitive data. 
            Fill out the form below and our team will provide a customized quote for your needs.
          </p>
        </div>

        <div className="bg-black/60 backdrop-blur-xl border border-blue-500/20 rounded-3xl p-8 md:p-12 shadow-[0_0_30px_rgba(59,130,246,0.1),inset_0_1px_0_rgba(255,255,255,0.03)] relative overflow-hidden">
          {/* Form Status Content */}
          {status === 'success' ? (
            <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
              <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="w-10 h-10 text-emerald-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Request Received!</h3>
              <p className="text-slate-400 max-w-md">
                Thank you, {formState.name}. We've received your quote request and will contact you at <span className="text-slate-200">{formState.email}</span> within 24-48 hours.
              </p>
              <button 
                onClick={() => {
                  setStatus('idle')
                  setFormState({
                    name: '',
                    email: '',
                    phone: '',
                    organization: '',
                    industry: '',
                    userCount: '',
                    message: ''
                  })
                }}
                className="mt-8 px-6 py-2 text-sm font-medium text-slate-500 hover:text-white transition-colors"
              >
                Submit another request
              </button>
            </div>
          ) : status === 'error' ? (
            <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                <span className="text-4xl">⚠️</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Submission Error</h3>
              <p className="text-slate-400 max-w-md">{errorMessage}</p>
              <button 
                onClick={() => setStatus('idle')}
                className="mt-8 px-6 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium text-slate-300 ml-1">Full Name *</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                    <input
                      type="text"
                      id="name"
                      required
                      value={formState.name}
                      onChange={e => setFormState(s => ({ ...s, name: e.target.value }))}
                      className="w-full bg-black/50 border border-blue-500/20 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                      placeholder="Your full name"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-slate-300 ml-1">Work Email *</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                    <input
                      type="email"
                      id="email"
                      required
                      value={formState.email}
                      onChange={e => setFormState(s => ({ ...s, email: e.target.value }))}
                      className="w-full bg-black/50 border border-blue-500/20 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                      placeholder="you@organization.gov"
                    />
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-medium text-slate-300 ml-1">Phone Number</label>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                    <input
                      type="tel"
                      id="phone"
                      value={formState.phone}
                      onChange={e => setFormState(s => ({ ...s, phone: e.target.value }))}
                      className="w-full bg-black/50 border border-blue-500/20 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="organization" className="text-sm font-medium text-slate-300 ml-1">Organization *</label>
                  <div className="relative group">
                    <Building2 className="absolute left-4 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                    <input
                      type="text"
                      id="organization"
                      required
                      value={formState.organization}
                      onChange={e => setFormState(s => ({ ...s, organization: e.target.value }))}
                      className="w-full bg-black/50 border border-blue-500/20 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                      placeholder="Your organization name"
                    />
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="industry" className="text-sm font-medium text-slate-300 ml-1">Industry Sector *</label>
                  <div className="relative group">
                    <Briefcase className="absolute left-4 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                    <select
                      id="industry"
                      required
                      value={formState.industry}
                      onChange={e => setFormState(s => ({ ...s, industry: e.target.value }))}
                      className="w-full bg-black/50 border border-blue-500/20 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all appearance-none cursor-pointer"
                    >
                      {INDUSTRY_OPTIONS.map(option => (
                        <option key={option.value} value={option.value} className="bg-slate-900">
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="userCount" className="text-sm font-medium text-slate-300 ml-1">Expected Users</label>
                  <div className="relative group">
                    <Users className="absolute left-4 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                    <input
                      type="text"
                      id="userCount"
                      value={formState.userCount}
                      onChange={e => setFormState(s => ({ ...s, userCount: e.target.value }))}
                      className="w-full bg-black/50 border border-blue-500/20 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                      placeholder="e.g., 50-100"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium text-slate-300 ml-1">Additional Requirements</label>
                <div className="relative group">
                  <MessageSquare className="absolute left-4 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                  <textarea
                    id="message"
                    rows={4}
                    value={formState.message}
                    onChange={e => setFormState(s => ({ ...s, message: e.target.value }))}
                    className="w-full bg-black/50 border border-blue-500/20 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all resize-none"
                    placeholder="Tell us about your specific security requirements..."
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
              >
                {status === 'loading' ? (
                  <>Submitting...</>
                ) : (
                  <>
                    Request Quote
                    <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              <p className="text-xs text-slate-500 text-center mt-4">
                By submitting this form, you agree to be contacted by our team regarding your inquiry.
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
