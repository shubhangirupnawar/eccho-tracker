import { useState } from 'react'
import { scrapeFollowers } from '../lib/api'

const PLATFORMS = [
  { key: 'facebook_url', label: 'Facebook', color: '#1877F2', domains: ['facebook.com'] },
  { key: 'instagram_url', label: 'Instagram', color: '#E1306C', domains: ['instagram.com'] },
  { key: 'twitter_url', label: 'X / Twitter', color: '#1DA1F2', domains: ['twitter.com', 'x.com'] },
  { key: 'linkedin_url', label: 'LinkedIn', color: '#0A66C2', domains: ['linkedin.com'] },
  { key: 'youtube_url', label: 'YouTube', color: '#FF0000', domains: ['youtube.com', 'youtu.be'] },
]

const icons = {
  facebook_url: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
  ),
  instagram_url: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
  ),
  twitter_url: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.26 5.632 5.905-5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
  ),
  linkedin_url: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
  ),
  youtube_url: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
  ),
}

export default function ScrapeForm({ onSuccess }) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const detectPlatform = (val) => {
    if (!val) return null
    return PLATFORMS.find(p => p.domains.some(d => val.toLowerCase().includes(d)))
  }

  const detected = detectPlatform(url)

  const handleSubmit = async () => {
    if (!url.trim()) { setError('Please enter a URL'); return }
    if (!detected) { setError('Unsupported platform. Please enter a valid social media URL.'); return }

    setError('')
    setLoading(true)
    setResult(null)
    try {
      const payload = { brand: 'Aditya Birla', [detected.key]: url }
      const res = await scrapeFollowers(payload)
      setResult(res.data)
      onSuccess?.()
    } catch (e) {
      setError(e.response?.data?.detail || 'Scrape failed. Check URL and try again.')
    } finally {
      setLoading(false)
    }
  }

  const fmt = (n) => n != null ? Number(n).toLocaleString('en-IN') : '—'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Single URL input */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <label style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Paste Social Media Link
          </label>
          {detected && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: detected.color }}>
              {icons[detected.key]}
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.05em' }}>{detected.label.toUpperCase()} DETECTED</span>
            </div>
          )}
        </div>
        
        <input
          type="url"
          value={url}
          onChange={e => { setUrl(e.target.value); setError(''); setResult(null); }}
          placeholder="https://facebook.com/page or https://instagram.com/handle..."
          style={{
            flex: 1, padding: '14px 18px',
            background: 'var(--bg3)', 
            border: detected ? `1.5px solid ${detected.color}50` : '1px solid var(--border)',
            borderRadius: 12, color: 'var(--text)', fontSize: 14,
            fontFamily: 'var(--font-mono)',
            transition: 'all .2s ease',
            outline: 'none',
            boxShadow: detected ? `0 0 15px ${detected.color}15` : 'none',
          }}
        />
      </div>

      {error && (
        <p style={{ fontSize: 13, color: 'var(--danger)', background: 'rgba(255,69,69,0.08)', padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(255,69,69,0.2)' }}>
          {error}
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading || !url}
        style={{
          padding: '14px 24px', borderRadius: 10, fontSize: 14, fontWeight: 600,
          fontFamily: 'var(--font-display)',
          background: loading ? 'rgba(200,255,0,0.2)' : 'var(--accent)',
          color: loading ? 'var(--accent)' : '#000',
          border: loading ? '1px solid var(--accent)' : 'none',
          letterSpacing: '0.02em',
          transition: 'all .2s',
          cursor: loading || !url ? 'not-allowed' : 'pointer',
          opacity: !url ? 0.6 : 1,
        }}
      >
        {loading ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
            <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block', width: 16, height: 16, border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%' }} />
            Detecting & Scraping…
          </span>
        ) : '↗ Scrape Follower Count'}
      </button>

      {/* Results */}
      {result && detected && (
        <div style={{ 
          background: 'var(--bg3)', 
          border: `1.2px solid ${detected.color}40`, 
          borderRadius: 14, 
          padding: '1.5rem',
          animation: 'slideUp 0.3s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
               <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: `${detected.color}18`, border: `1px solid ${detected.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: detected.color,
                }}>
                  {icons[detected.key]}
                </div>
                <div>
                  <p style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 2 }}>{detected.label}</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Success</p>
                </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 2 }}>Count</p>
              <p style={{ fontSize: 20, fontFamily: 'var(--font-mono)', fontWeight: 800, color: detected.color }}>
                {fmt(result.data?.[detected.key === 'youtube_url' ? 'youtube_subscribers' : detected.key.replace('_url', '_followers')])}
              </p>
            </div>
          </div>
          <p style={{ fontSize: 11, color: 'var(--muted)', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
            Data saved to Supabase for <b>Aditya Birla</b>
          </p>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  )
}
