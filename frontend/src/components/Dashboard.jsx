import { useState, useEffect, useCallback, useMemo } from 'react'
import { getDashboard, downloadExcel, getAggregateReport, getRecurringReport } from '../lib/api'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const PLAT_CONFIG = [
  { key: 'facebook', label: 'Facebook', color: '#1877F2', short: 'FB' },
  { key: 'instagram', label: 'Instagram', color: '#E1306C', short: 'IG' },
  { key: 'twitter', label: 'X / Twitter', color: '#1DA1F2', short: 'TW' },
  { key: 'linkedin', label: 'LinkedIn', color: '#0A66C2', short: 'LI' },
  { key: 'youtube', label: 'YouTube', color: '#FF0000', short: 'YT' },
]

const fmt = (n) => {
  if (n == null || n === 0) return '—'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return String(n)
}

const fmtFull = (n) => n != null && n !== 0 ? Number(n).toLocaleString('en-IN') : '—'

export default function Dashboard({ refreshKey }) {
  const [data, setData] = useState([])
  const [aggData, setAggData] = useState([])
  const [recData, setRecData] = useState([])
  const [tab, setTab] = useState('realtime')
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [selected, setSelected] = useState(null)
  const [chartPlat, setChartPlat] = useState('facebook')
  const [searchTerm, setSearchTerm] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [res, resAgg, resRec] = await Promise.all([
        getDashboard(),
        getAggregateReport(),
        getRecurringReport()
      ])
      setData(res.data?.data || [])
      setAggData(resAgg.data?.data || [])
      setRecData(resRec.data?.data || [])
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
    return { brands: brands.size, entries: filteredData.length }
  }, [filteredData])

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
        <TabButton id="realtime" label="Real-time Feed" />
        <TabButton id="aggregate" label="Aggregate Report" />
        <TabButton id="recurring" label="15-Day Recurring" />
      </div>

      {tab === 'realtime' && (
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
        />
      )}

      {tab === 'aggregate' && <AggregateView data={aggData} />}
      {tab === 'recurring' && <RecurringView data={recData} />}

      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  )
}

function RealtimeView({ data, stats, searchTerm, setSearchTerm, comparisonData, downloading, handleDownload, selected, setSelected, chartPlat, setChartPlat }) {
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
          <p style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
            {stats.brands} brands tracked · {stats.entries} entries
          </p>
        </div>
        <button onClick={handleDownload} disabled={downloading} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 8, fontSize: 13, 
            background: 'transparent', border: '1px solid var(--border2)', color: 'var(--text)', cursor: 'pointer'
          }}>
          {downloading ? 'Preparing…' : 'Download Excel'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        {comparisonData.map(b => {
          const total = PLAT_CONFIG.reduce((s, p) => {
            const k = p.key === 'youtube' ? 'youtube_subscribers' : `${p.key}_followers`
            return s + (b[k] || 0)
          }, 0)
          return (
            <button key={b.brand} onClick={() => setSelected(selected?.brand === b.brand ? null : b)}
              style={{
                textAlign: 'left', padding: '1rem 1.1rem', borderRadius: 12,
                background: selected?.brand === b.brand ? 'rgba(200,255,0,0.05)' : 'var(--bg3)',
                border: selected?.brand === b.brand ? '1px solid var(--accent)' : '1px solid var(--border)',
                cursor: 'pointer'
              }}>
              <p style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase' }}>{b.brand}</p>
              <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>{fmt(total)}</p>
            </button>
          )
        })}
      </div>

      <div style={{ background: 'var(--bg3)', borderRadius: 12, border: '1px solid var(--border)', padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
           <p style={{ fontSize: 11, color: 'var(--muted)' }}>COMPARISON</p>
           <div style={{ display: 'flex', gap: 4 }}>
             {PLAT_CONFIG.map(p => (
               <button key={p.key} onClick={() => setChartPlat(p.key)} style={{
                 padding: '4px 8px', fontSize: 10, borderRadius: 4,
                 background: chartPlat === p.key ? p.color : 'transparent',
                 color: chartPlat === p.key ? 'white' : 'var(--muted)',
                 border: '1px solid var(--border)'
               }}>{p.short}</button>
             ))}
           </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <XAxis dataKey="brand" tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={fmt} tick={{ fill: 'var(--muted)', fontSize: 10 }} axisLine={false} tickLine={false} width={45} />
            <Tooltip contentStyle={{ background: 'var(--bg2)', border: '1px solid var(--border2)' }} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chartData.map((_, i) => <Cell key={i} fill={platConf?.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ background: 'var(--bg3)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: 12, textAlign: 'left' }}>DATE</th>
              <th style={{ padding: 12, textAlign: 'left' }}>BRAND</th>
              {PLAT_CONFIG.map(p => <th key={p.key} style={{ padding: 12, textAlign: 'right' }}>{p.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 20).map((r, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: 12, color: 'var(--muted)' }}>{r.scraped_at?.slice(0, 10)}</td>
                <td style={{ padding: 12, fontWeight: 600 }}>{r.brand}</td>
                {PLAT_CONFIG.map(p => {
                   const k = p.key === 'youtube' ? 'youtube_subscribers' : `${p.key}_followers`
                   return <td key={p.key} style={{ padding: 12, textAlign: 'right', color: p.color }}>{fmtFull(r[k])}</td>
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function AggregateView({ data }) {
  return (
    <div style={{ background: 'var(--bg3)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden', animation: 'fadeIn .3s ease' }}>
      <div style={{ padding: 16, borderBottom: '1px solid var(--border)' }}>
        <p style={{ fontSize: 14, fontWeight: 600 }}>Aggregate Monthly Report</p>
        <p style={{ fontSize: 11, color: 'var(--muted)' }}>Updates only on the last day of each month</p>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)' }}>
            <th style={{ padding: 12, textAlign: 'left' }}>BRAND</th>
            {PLAT_CONFIG.map(p => <th key={p.key} style={{ padding: 12, textAlign: 'right' }}>{p.label}</th>) }
            <th style={{ padding: 12, textAlign: 'right' }}>LAST UPDATED</th>
          </tr>
        </thead>
        <tbody>
          {data.map((r, i) => (
            <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: 12, fontWeight: 600 }}>{r.brand}</td>
              {PLAT_CONFIG.map(p => <td key={p.key} style={{ padding: 12, textAlign: 'right', color: p.color }}>{fmtFull(r[p.key])}</td>)}
              <td style={{ padding: 12, textAlign: 'right', color: 'var(--muted)', fontSize: 11 }}>{r.last_updated}</td>
            </tr>
          ))}
          {!data.length && <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>No aggregate records yet. Wait for month-end.</td></tr>}
        </tbody>
      </table>
    </div>
  )
}

function RecurringView({ data }) {
  return (
    <div style={{ background: 'var(--bg3)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden', animation: 'fadeIn .3s ease' }}>
      <div style={{ padding: 16, borderBottom: '1px solid var(--border)' }}>
        <p style={{ fontSize: 14, fontWeight: 600 }}>15-Day Recurring Table</p>
        <p style={{ fontSize: 11, color: 'var(--muted)' }}>Snapshots captured on the 15th and EOM</p>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)' }}>
            <th style={{ padding: 12, textAlign: 'left' }}>MONTH</th>
            <th style={{ padding: 12, textAlign: 'left' }}>CYCLE</th>
            <th style={{ padding: 12, textAlign: 'left' }}>BRAND</th>
            {PLAT_CONFIG.map(p => <th key={p.key} style={{ padding: 12, textAlign: 'right' }}>{p.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.map((r, i) => (
            <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: 12 }}>{r.month}</td>
              <td style={{ padding: 12 }}><span style={{ padding: '2px 6px', background: 'var(--bg2)', borderRadius: 4, fontSize: 10 }}>{r.date_label}</span></td>
              <td style={{ padding: 12, fontWeight: 600 }}>{r.brand}</td>
              {PLAT_CONFIG.map(p => <td key={p.key} style={{ padding: 12, textAlign: 'right', color: p.color }}>{fmtFull(r[p.key])}</td>)}
            </tr>
          ))}
          {!data.length && <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>No recurring records yet.</td></tr>}
        </tbody>
      </table>
    </div>
  )
}
