import { useState, useEffect, useCallback, useMemo } from 'react'
import { getDashboard, downloadExcel, deleteEntry, deleteAllEntries } from '../lib/api'
// Removed Recharts imports as chart was removed

const PLAT_CONFIG = [
  { key: 'facebook', label: 'Facebook', color: '#1877F2', short: 'FB' },
  { key: 'instagram', label: 'Instagram', color: '#E1306C', short: 'IG' },
  { key: 'twitter', label: 'X / Twitter', color: '#1DA1F2', short: 'TW' },
  { key: 'linkedin', label: 'LinkedIn', color: '#0A66C2', short: 'LI' },
  { key: 'youtube', label: 'YouTube', color: '#FF0000', short: 'YT' },
]

const fmt = (n) => {
  if (n == null) return '—'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return String(n)
}

const fmtFull = (n) => n != null ? Number(n).toLocaleString('en-IN') : '—'

export default function Dashboard({ refreshKey, onUpdateStats }) {
  const [data, setData] = useState([])
  // Removed unused state vars
  const [tab, setTab] = useState('realtime')
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [selected, setSelected] = useState(null)
  const [chartPlat, setChartPlat] = useState('facebook')
  const [searchTerm, setSearchTerm] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getDashboard()
      setData(res.data?.data || [])
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load, refreshKey])

  const filteredData = useMemo(() => {
    if (!searchTerm) return data
    return data.filter(r => r.brand.toLowerCase().includes(searchTerm.toLowerCase()))
  }, [data, searchTerm])

  const stats = useMemo(() => {
    const brands = new Set(filteredData.map(r => r.brand))
    const lastScraped = filteredData.length > 0 ? filteredData[0].scraped_at : null
    const res = { brands: brands.size, entries: filteredData.length, lastScraped }
    onUpdateStats?.(res.entries, res.lastScraped)
    return res
  }, [filteredData, onUpdateStats])

  const comparisonData = useMemo(() => {
    const latestByBrand = {}
    filteredData.forEach(r => {
      if (!latestByBrand[r.brand]) {
        latestByBrand[r.brand] = r
      }
    })
    return Object.values(latestByBrand)
  }, [filteredData])

  const handleDownload = async () => {
    setDownloading(true)
    try { await downloadExcel() } catch {}
    setDownloading(false)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this entry?')) return
    try {
      await deleteEntry(id)
      load()
    } catch (err) { console.error(err) }
  }

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to delete ALL previous entries? This cannot be undone.')) return
    try {
      await deleteAllEntries()
      load()
    } catch (err) { console.error(err) }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--muted)', fontSize: 13, fontFamily: 'var(--font-mono)' }}>
      Loading dashboard…
    </div>
  )

  const TabButton = ({ id, label }) => (
    <button onClick={() => setTab(id)} style={{
      padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500,
      background: tab === id ? 'var(--bg3)' : 'transparent',
      border: tab === id ? '1px solid var(--accent)' : '1px solid transparent',
      color: tab === id ? 'var(--accent)' : 'var(--muted)',
      transition: 'all .15s', cursor: 'pointer'
    }}>{label}</button>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)', padding: '8px 0' }}>Social Scraping Feed</p>
      </div>

      <RealtimeView 
        data={filteredData} 
        stats={stats}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        comparisonData={comparisonData}
        downloading={downloading} 
        handleDownload={handleDownload} 
        selected={selected} 
        setSelected={setSelected}
        chartPlat={chartPlat}
        setChartPlat={setChartPlat}
        onDelete={handleDelete}
        onClearAll={handleClearAll}
      />

      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  )
}

function RealtimeView({ data, stats, searchTerm, setSearchTerm, comparisonData, downloading, handleDownload, selected, setSelected, chartPlat, setChartPlat, onDelete, onClearAll }) {
  const platKey = chartPlat === 'youtube' ? 'youtube_subscribers' : `${chartPlat}_followers`
  const platConf = PLAT_CONFIG.find(p => p.key === chartPlat)

  const chartData = comparisonData.map(b => ({
    brand: b.brand.split(' ')[0],
    value: b[platKey] || 0,
    fullBrand: b.brand,
    color: platConf?.color
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', animation: 'fadeIn .3s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input 
              type="text"
              placeholder="Filter by brand..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8,
                padding: '6px 12px', fontSize: 13, color: 'var(--text)', width: 200
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
            <div>
              <p style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 2 }}>Link Count (Scrapes)</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent)' }}>{stats.entries}</p>
            </div>
            <div>
              <p style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 2 }}>Last Scraping Date</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
                {stats.lastScraped ? new Date(stats.lastScraped).toLocaleString('en-IN', { 
                  day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true 
                }).toUpperCase() : '—'}
              </p>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onClearAll} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 8, fontSize: 13, 
              background: 'rgba(255,69,69,0.08)', border: '1px solid rgba(255,69,69,0.2)', color: 'var(--danger)', cursor: 'pointer'
            }}>
            Clear All
          </button>
          <button onClick={handleDownload} disabled={downloading} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 8, fontSize: 13, 
              background: 'transparent', border: '1px solid var(--border2)', color: 'var(--text)', cursor: 'pointer'
            }}>
            {downloading ? 'Preparing…' : 'Download Excel'}
          </button>
        </div>
      </div>

      {/* Simplified view - Chart removed as per request */}

      <div style={{ background: 'var(--bg3)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: 12, textAlign: 'left' }}>SCRAPING DATE</th>
              <th style={{ padding: 12, textAlign: 'center' }}>PLATFORM / LINK</th>
              <th style={{ padding: 12, textAlign: 'right' }}>FOLLOWER COUNT</th>
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 20).map((r, i) => {
              const platform = PLAT_CONFIG.find(p => {
                const k = p.key === 'youtube' ? 'youtube_subscribers' : `${p.key}_followers`
                return r[k] != null
              })
              const countKey = platform ? (platform.key === 'youtube' ? 'youtube_subscribers' : `${platform.key}_followers`) : null
              const countValue = countKey ? r[countKey] : null

              return (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: 12, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                    {new Date(r.scraped_at).toLocaleString('en-IN', { 
                      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true 
                    })}
                  </td>
                  <td style={{ padding: 12, textAlign: 'center' }}>
                    {platform ? (
                      <a 
                        href={r[`${platform.key}_url`]} 
                        target="_blank" 
                        rel="noreferrer" 
                        title="View Profile"
                        style={{ 
                          display: 'inline-flex', alignItems: 'center', gap: 4, 
                          padding: '4px 10px', borderRadius: 12, background: `${platform.color}15`,
                          color: platform.color, fontSize: 10, fontWeight: 700,
                          textDecoration: 'none', transition: 'all 0.2s',
                          border: `1px solid ${platform.color}30`
                        }}
                        onMouseOver={e => e.currentTarget.style.background = `${platform.color}25`}
                        onMouseOut={e => e.currentTarget.style.background = `${platform.color}15`}
                      >
                        {platform.short} ↗
                      </a>
                    ) : '—'}
                  </td>
                  <td style={{ padding: 12, textAlign: 'right', fontWeight: 700, color: platform?.color || 'var(--text)' }}>
                    {fmtFull(countValue)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
// Unused views removed for simplicity
