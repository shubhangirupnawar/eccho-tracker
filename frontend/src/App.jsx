import { useState, useEffect } from 'react'
import ScrapeForm from './components/ScrapeForm'
import Dashboard from './components/Dashboard'

export default function App() {
  const [tab, setTab] = useState('scrape')
  const [refreshKey, setRefreshKey] = useState(0)

  const [entries, setEntries] = useState(0)
  const [lastScraped, setLastScraped] = useState(null)

  useEffect(() => {
    import('./lib/api').then(m => m.getDashboard()).then(res => {
      const data = res.data?.data || []
      setEntries(data.length)
      if (data.length > 0) setLastScraped(data[0].scraped_at)
    })
  }, [])

  const handleSuccess = () => {
    setRefreshKey(k => k + 1)
    setTimeout(() => setTab('dashboard'), 1200)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* Subtle grid bg */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
        maskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)',
      }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 820, margin: '0 auto', padding: '0 1.5rem 4rem' }}>

        {/* Header */}
        <header style={{ padding: '2.5rem 0 2rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <p style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--accent)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 6 }}>
                ECCHO ·  Social Intelligence
              </p>
              <h1 style={{ fontSize: 32, fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--text)', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
                Follower<br />
                <span style={{ color: 'var(--accent)' }}>Tracker</span>
              </h1>
            </div>
            <div style={{ display: 'flex', gap: 8, alignSelf: 'flex-end' }}>
              {[
                { id: 'scrape', label: '↗ Scrape' },
                { id: 'dashboard', label: '⬡ Dashboard' },
              ].map(t => (
                <button key={t.id} onClick={() => setTab(t.id)} style={{
                  padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                  fontFamily: 'var(--font-body)',
                  background: tab === t.id ? 'rgba(200,255,0,0.1)' : 'transparent',
                  border: tab === t.id ? '1px solid rgba(200,255,0,0.4)' : '1px solid var(--border2)',
                  color: tab === t.id ? 'var(--accent)' : 'var(--muted)',
                  transition: 'all .15s',
                }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Content */}
        <main style={{ paddingTop: '2rem' }}>
          {tab === 'scrape' ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
                  Paste brand social profile links below.
                </p>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase' }}>Total Scrapes</p>
                  <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent)' }}>{entries}</p>
                </div>
              </div>
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: '1.75rem' }}>
                <ScrapeForm onSuccess={handleSuccess} onUpdateCount={(c) => setEntries(c)} />
              </div>
            </div>
          ) : (
            <Dashboard refreshKey={refreshKey} onUpdateStats={(e, d) => { setEntries(e); setLastScraped(d); }} />
          )}
        </main>
      </div>
    </div>
  )
}
