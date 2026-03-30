'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const SITES = [
  { id: 'eybi', label: 'EYbi', domain: 'eybi.co.uk', color: '#6366f1', conversions: ['Free Sign-up', 'Paid Upgrade'] },
  { id: 'book', label: 'Book', domain: 'childcare-superhero.co/.com', color: '#10b981', conversions: ['Book Purchase', 'Email Capture'] },
  { id: 'course', label: 'Course', domain: 'childcare-superhero.co.uk/resources', color: '#f59e0b', conversions: ['Course Enrol', 'Lead/Waitlist'] },
  { id: 'blueprint', label: 'Blueprint', domain: 'childcare-business-blueprint.co.uk', color: '#ec4899', conversions: ['Course Enrol', 'Lead/Waitlist'] },
]

const SOURCES = [
  { id: 'ig_organic', label: 'Instagram Organic', color: '#c026d3', icon: '📸' },
  { id: 'ig_paid', label: 'Instagram Paid', color: '#9333ea', icon: '💜' },
  { id: 'google_paid', label: 'Google Paid', color: '#3b82f6', icon: '🔵' },
  { id: 'google_organic', label: 'Google Organic', color: '#22c55e', icon: '🟢' },
  { id: 'email', label: 'Email (MailerLite)', color: '#f97316', icon: '📧' },
  { id: 'direct', label: 'Direct', color: '#6b7280', icon: '🔗' },
]

const DATE_RANGES = ['Last 7 days', 'Last 30 days', 'This month', 'Custom']

const card = { background: '#1a1d27', borderRadius: 12, padding: '20px 24px', marginBottom: 16 }
const kpiBox = { background: '#12151f', borderRadius: 10, padding: '16px 20px', textAlign: 'center', flex: 1 }

function emptyTrafficData() {
  const data = {}
  SOURCES.forEach(src => {
    data[src.id] = {}
    SITES.forEach(site => {
      data[src.id][site.id] = { sessions: 0, conversions: 0, revenue: 0 }
    })
  })
  return data
}

function emptySiteData() {
  const data = {}
  SITES.forEach(site => {
    data[site.id] = {
      sessions: 0,
      conversions: { [site.conversions[0]]: 0, [site.conversions[1]]: 0 },
      topSource: null,
      ga4Connected: false,
    }
  })
  return data
}

// Flow diagram SVG
function FlowDiagram({ trafficData, siteData, selectedSite, selectedSource, onSelectSite }) {
  const svgWidth = 900
  const svgHeight = 420
  const colX = { source: 80, site: 420, conv: 760 }

  // Compute totals per source and per site
  const sourceTotals = {}
  SOURCES.forEach(src => {
    sourceTotals[src.id] = SITES.reduce((sum, site) => sum + (trafficData[src.id]?.[site.id]?.sessions || 0), 0)
  })
  const siteTotals = {}
  SITES.forEach(site => {
    siteTotals[site.id] = SOURCES.reduce((sum, src) => sum + (trafficData[src.id]?.[site.id]?.sessions || 0), 0)
  })
  const maxSessions = Math.max(1, ...Object.values(siteTotals))

  const sourceY = (i) => 50 + i * 62
  const siteY = (i) => 80 + i * 80
  const convY = (siteIdx, convIdx) => siteY(siteIdx) + (convIdx === 0 ? -18 : 18)

  const [hovered, setHovered] = useState(null)

  // Draw flow lines from sources to sites
  const lines = []
  SOURCES.forEach((src, si) => {
    SITES.forEach((site, ti) => {
      const sessions = trafficData[src.id]?.[site.id]?.sessions || 0
      if (sessions === 0 && !hovered) return
      const dimmed = (selectedSite && selectedSite !== site.id) || (selectedSource && selectedSource !== src.id)
      const isHov = hovered && hovered.src === src.id && hovered.site === site.id
      const strokeW = sessions > 0 ? Math.max(1.5, Math.min(8, (sessions / Math.max(1, maxSessions)) * 10)) : 1
      const x1 = colX.source + 110
      const y1 = sourceY(si)
      const x2 = colX.site - 10
      const y2 = siteY(ti)
      const cx1 = x1 + 80
      const cx2 = x2 - 80
      lines.push(
        <path
          key={`${src.id}-${site.id}`}
          d={`M${x1},${y1} C${cx1},${y1} ${cx2},${y2} ${x2},${y2}`}
          stroke={sessions === 0 ? '#1e2130' : src.color}
          strokeWidth={sessions === 0 ? 1 : strokeW}
          fill="none"
          opacity={dimmed ? 0.1 : isHov ? 1 : sessions === 0 ? 0.3 : 0.6}
          strokeDasharray={sessions === 0 ? '4 4' : undefined}
          style={{ cursor: sessions > 0 ? 'pointer' : 'default', transition: 'opacity 0.2s' }}
          onMouseEnter={() => sessions > 0 && setHovered({ src: src.id, site: site.id, sessions, y: y1 + (y2 - y1) / 2 })}
          onMouseLeave={() => setHovered(null)}
        />
      )
    })
  })

  // Site to conversion lines
  const convLines = []
  SITES.forEach((site, si) => {
    site.conversions.forEach((conv, ci) => {
      const x1 = colX.site + 90
      const y1 = siteY(si)
      const x2 = colX.conv - 10
      const y2 = convY(si, ci)
      const dimmed = selectedSite && selectedSite !== site.id
      convLines.push(
        <path
          key={`${site.id}-conv-${ci}`}
          d={`M${x1},${y1} C${(x1 + x2) / 2},${y1} ${(x1 + x2) / 2},${y2} ${x2},${y2}`}
          stroke={site.color}
          strokeWidth={1.5}
          fill="none"
          opacity={dimmed ? 0.1 : 0.4}
          style={{ transition: 'opacity 0.2s' }}
        />
      )
    })
  })

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg width={svgWidth} height={svgHeight} style={{ display: 'block', maxWidth: '100%' }}>
        {/* Column labels */}
        {[{ x: colX.source + 55, label: 'SOURCES' }, { x: colX.site + 45, label: 'SITES' }, { x: colX.conv + 60, label: 'CONVERSIONS' }].map(col => (
          <text key={col.label} x={col.x} y={20} textAnchor="middle" fill="#4b5563" fontSize={10} fontWeight={700} letterSpacing={2}>{col.label}</text>
        ))}

        {/* Flow lines (behind nodes) */}
        {lines}
        {convLines}

        {/* Source nodes */}
        {SOURCES.map((src, i) => {
          const total = sourceTotals[src.id]
          const dimmed = selectedSource && selectedSource !== src.id
          return (
            <g key={src.id} transform={`translate(${colX.source}, ${sourceY(i) - 18})`} opacity={dimmed ? 0.2 : 1} style={{ transition: 'opacity 0.2s' }}>
              <rect x={0} y={0} width={110} height={36} rx={8} fill={selectedSource === src.id ? src.color : '#1a1d27'} stroke={src.color} strokeWidth={selectedSource === src.id ? 0 : 1} />
              <text x={8} y={14} fill={selectedSource === src.id ? '#fff' : src.color} fontSize={10} fontWeight={700}>{src.icon} {src.label.split(' ').slice(0, 2).join(' ')}</text>
              <text x={8} y={28} fill={selectedSource === src.id ? '#fff' : '#9ca3af'} fontSize={11} fontWeight={800}>{total.toLocaleString()} sessions</text>
            </g>
          )
        })}

        {/* Site nodes */}
        {SITES.map((site, i) => {
          const total = siteTotals[site.id]
          const dimmed = selectedSite && selectedSite !== site.id
          const connected = siteData[site.id]?.ga4Connected
          return (
            <g key={site.id} transform={`translate(${colX.site - 10}, ${siteY(i) - 22})`} opacity={dimmed ? 0.2 : 1} style={{ cursor: 'pointer', transition: 'opacity 0.2s' }} onClick={() => onSelectSite(site.id === selectedSite ? null : site.id)}>
              <rect x={0} y={0} width={100} height={44} rx={8} fill={selectedSite === site.id ? site.color : '#1a1d27'} stroke={site.color} strokeWidth={selectedSite === site.id ? 0 : 1.5} />
              <text x={50} y={15} textAnchor="middle" fill={selectedSite === site.id ? '#fff' : site.color} fontSize={11} fontWeight={700}>{site.label}</text>
              <text x={50} y={29} textAnchor="middle" fill={selectedSite === site.id ? '#fff' : '#e5e7eb'} fontSize={12} fontWeight={800}>{total.toLocaleString()}</text>
              {!connected && <text x={50} y={40} textAnchor="middle" fill="#4b5563" fontSize={8}>manual</text>}
              {connected && <text x={50} y={40} textAnchor="middle" fill="#22c55e" fontSize={8}>● live</text>}
            </g>
          )
        })}

        {/* Conversion nodes */}
        {SITES.map((site, si) =>
          site.conversions.map((conv, ci) => {
            const count = siteData[site.id]?.conversions?.[conv] || 0
            const dimmed = selectedSite && selectedSite !== site.id
            return (
              <g key={`${site.id}-conv-${ci}`} transform={`translate(${colX.conv - 10}, ${convY(si, ci) - 14})`} opacity={dimmed ? 0.2 : 1} style={{ transition: 'opacity 0.2s' }}>
                <rect x={0} y={0} width={140} height={28} rx={6} fill="#12151f" stroke={site.color} strokeWidth={0.8} />
                <text x={8} y={12} fill={site.color} fontSize={9} fontWeight={700}>{conv}</text>
                <text x={8} y={23} fill="#9ca3af" fontSize={10} fontWeight={600}>{count.toLocaleString()} conversions</text>
              </g>
            )
          })
        )}

        {/* Hover tooltip */}
        {hovered && (
          <g transform={`translate(${colX.source + 160}, ${hovered.y - 20})`}>
            <rect x={0} y={0} width={130} height={36} rx={6} fill="#0e1018" stroke="#2d3148" strokeWidth={1} />
            <text x={8} y={14} fill="#e5e7eb" fontSize={11} fontWeight={700}>{hovered.sessions.toLocaleString()} sessions</text>
            <text x={8} y={28} fill="#6b7280" fontSize={10}>Click site node for detail</text>
          </g>
        )}
      </svg>
    </div>
  )
}

// Site detail card
function SiteCard({ site, siteData, trafficData, selected, onClick }) {
  const data = siteData[site.id]
  const totalSessions = SOURCES.reduce((sum, src) => sum + (trafficData[src.id]?.[site.id]?.sessions || 0), 0)
  const totalConversions = Object.values(data.conversions).reduce((a, b) => a + b, 0)
  const cvr = totalSessions > 0 ? ((totalConversions / totalSessions) * 100).toFixed(1) : '0.0'
  const topSrc = SOURCES.reduce((best, src) => {
    const s = trafficData[src.id]?.[site.id]?.sessions || 0
    return s > (trafficData[best?.id]?.[site.id]?.sessions || 0) ? src : best
  }, SOURCES[0])

  return (
    <div
      onClick={onClick}
      style={{
        background: selected ? '#12151f' : '#1a1d27',
        borderRadius: 12,
        padding: '16px 20px',
        border: `1.5px solid ${selected ? site.color : '#2d3148'}`,
        cursor: 'pointer',
        transition: 'all 0.2s',
        flex: 1,
        minWidth: 200,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: site.color }}>{site.label}</div>
          <div style={{ fontSize: 10, color: '#4b5563', marginTop: 2 }}>{site.domain}</div>
        </div>
        {data.ga4Connected
          ? <span style={{ fontSize: 9, color: '#22c55e', background: '#052e16', borderRadius: 4, padding: '2px 6px' }}>● LIVE</span>
          : <span style={{ fontSize: 9, color: '#6b7280', background: '#1e2130', borderRadius: 4, padding: '2px 6px' }}>MANUAL</span>
        }
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: '#e5e7eb', marginBottom: 2 }}>{totalSessions.toLocaleString()}</div>
      <div style={{ fontSize: 11, color: '#4b5563', marginBottom: 10 }}>sessions</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        {site.conversions.map(conv => (
          <div key={conv} style={{ background: '#0e1018', borderRadius: 6, padding: '4px 8px' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: site.color }}>{(data.conversions[conv] || 0).toLocaleString()}</div>
            <div style={{ fontSize: 9, color: '#4b5563' }}>{conv}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#6b7280', borderTop: '1px solid #2d3148', paddingTop: 8 }}>
        <span>CVR: <span style={{ color: site.color, fontWeight: 700 }}>{cvr}%</span></span>
        <span>Top: <span style={{ color: topSrc.color, fontWeight: 600 }}>{topSrc.label.split(' ').slice(0, 2).join(' ')}</span></span>
      </div>
    </div>
  )
}

// Source breakdown table
function SourceBreakdown({ site, trafficData }) {
  const rows = SOURCES.map(src => {
    const d = trafficData[src.id]?.[site.id] || { sessions: 0, conversions: 0 }
    return { ...src, ...d, cvr: d.sessions > 0 ? ((d.conversions / d.sessions) * 100).toFixed(1) : '—' }
  }).sort((a, b) => b.sessions - a.sessions)
  const totalSessions = rows.reduce((s, r) => s + r.sessions, 0)

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
      <thead>
        <tr style={{ color: '#6b7280' }}>
          {['Source', 'Sessions', 'Share', 'Conversions', 'CVR'].map(h => (
            <th key={h} style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid #2d3148' }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, idx) => (
          <tr key={row.id} style={{ borderBottom: '1px solid #1a1d27', background: idx % 2 === 0 ? 'transparent' : '#12151f' }}>
            <td style={{ padding: '7px 10px' }}>
              <span style={{ color: row.color, fontWeight: 600 }}>{row.icon} {row.label}</span>
            </td>
            <td style={{ padding: '7px 10px', color: '#e5e7eb', fontWeight: 600 }}>{row.sessions.toLocaleString()}</td>
            <td style={{ padding: '7px 10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 60, background: '#12151f', borderRadius: 3, height: 6 }}>
                  <div style={{ width: `${totalSessions > 0 ? (row.sessions / totalSessions * 100) : 0}%`, background: row.color, height: 6, borderRadius: 3 }} />
                </div>
                <span style={{ color: '#9ca3af', fontSize: 11 }}>{totalSessions > 0 ? (row.sessions / totalSessions * 100).toFixed(0) : 0}%</span>
              </div>
            </td>
            <td style={{ padding: '7px 10px', color: '#f59e0b' }}>{row.conversions.toLocaleString()}</td>
            <td style={{ padding: '7px 10px', color: row.sessions > 0 ? '#10b981' : '#4b5563', fontWeight: 600 }}>{row.cvr}{row.cvr !== '—' ? '%' : ''}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// Manual data entry panel
function ManualEntryPanel({ site, siteData, setSiteData, trafficData, setTrafficData, activeSite, dateRange }) {
  if (!site) return null
  const [localSessions, setLocalSessions] = useState({})
  const [localConversions, setLocalConversions] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const sessions = {}
    SOURCES.forEach(src => {
      sessions[src.id] = trafficData[src.id]?.[activeSite]?.sessions || 0
    })
    setLocalSessions(sessions)
    const convs = {}
    site.conversions.forEach(conv => {
      convs[conv] = siteData[activeSite]?.conversions?.[conv] || 0
    })
    setLocalConversions(convs)
  }, [activeSite])

  const handleSave = async () => {
    setSaving(true)
    try {
      // Upsert sessions rows
      const sessionRows = SOURCES.map(src => ({
        site_id: activeSite,
        source_id: src.id,
        sessions: Number(localSessions[src.id] || 0),
        date_range: dateRange,
        updated_at: new Date().toISOString(),
      }))
      await supabase.from('traffic_sessions').upsert(sessionRows, { onConflict: 'site_id,source_id,date_range' })

      // Upsert conversion rows
      const convRows = site.conversions.map(conv => ({
        site_id: activeSite,
        conversion_type: conv,
        count: Number(localConversions[conv] || 0),
        date_range: dateRange,
        updated_at: new Date().toISOString(),
      }))
      await supabase.from('traffic_conversions').upsert(convRows, { onConflict: 'site_id,conversion_type,date_range' })

      // Update local state
      const newTrafficData = { ...trafficData }
      SOURCES.forEach(src => {
        if (!newTrafficData[src.id]) newTrafficData[src.id] = {}
        newTrafficData[src.id][activeSite] = { sessions: Number(localSessions[src.id] || 0), conversions: 0 }
      })
      setTrafficData(newTrafficData)
      const newSiteData = { ...siteData }
      newSiteData[activeSite] = {
        ...newSiteData[activeSite],
        conversions: Object.fromEntries(site.conversions.map(c => [c, Number(localConversions[c] || 0)])),
      }
      setSiteData(newSiteData)
    } catch (e) { console.error('Save error:', e) }
    setSaving(false)
  }

  return (
    <div style={{ background: '#12151f', borderRadius: 10, padding: '16px 20px', marginTop: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: site.color }}>Manual Entry — {site.label}</div>
          <div style={{ fontSize: 11, color: '#4b5563', marginTop: 2 }}>Enter sessions per source. GA4 will auto-populate once connected.</div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{ background: site.color, color: '#fff', border: 'none', borderRadius: 6, padding: '6px 16px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 2, minWidth: 260 }}>
          <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8, fontWeight: 600 }}>SESSIONS BY SOURCE</div>
          {SOURCES.map(src => (
            <div key={src.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{ width: 140, fontSize: 12, color: src.color }}>{src.icon} {src.label}</div>
              <input
                type="number"
                min={0}
                value={localSessions[src.id] || 0}
                onChange={e => setLocalSessions(p => ({ ...p, [src.id]: e.target.value }))}
                style={{ width: 90, background: '#1a1d27', border: '1px solid #2d3148', borderRadius: 4, color: '#e5e7eb', padding: '4px 8px', fontSize: 12 }}
              />
            </div>
          ))}
        </div>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8, fontWeight: 600 }}>CONVERSIONS</div>
          {site.conversions.map(conv => (
            <div key={conv} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{ width: 110, fontSize: 12, color: site.color }}>{conv}</div>
              <input
                type="number"
                min={0}
                value={localConversions[conv] || 0}
                onChange={e => setLocalConversions(p => ({ ...p, [conv]: e.target.value }))}
                style={{ width: 80, background: '#1a1d27', border: '1px solid #2d3148', borderRadius: 4, color: '#e5e7eb', padding: '4px 8px', fontSize: 12 }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Cross-site summary row
function CrossSiteSummary({ trafficData, siteData }) {
  const totalSessions = SITES.reduce((sum, site) =>
    sum + SOURCES.reduce((s, src) => s + (trafficData[src.id]?.[site.id]?.sessions || 0), 0), 0)
  const totalConversions = SITES.reduce((sum, site) =>
    sum + Object.values(siteData[site.id]?.conversions || {}).reduce((a, b) => a + b, 0), 0)
  const overallCvr = totalSessions > 0 ? ((totalConversions / totalSessions) * 100).toFixed(1) : '0.0'

  const bestSite = SITES.reduce((best, site) => {
    const sessions = SOURCES.reduce((s, src) => s + (trafficData[src.id]?.[site.id]?.sessions || 0), 0)
    const bestSessions = SOURCES.reduce((s, src) => s + (trafficData[src.id]?.[best?.id]?.sessions || 0), 0)
    return sessions > bestSessions ? site : best
  }, SITES[0])

  const bestSource = SOURCES.reduce((best, src) => {
    const total = SITES.reduce((s, site) => s + (trafficData[src.id]?.[site.id]?.sessions || 0), 0)
    const bestTotal = SITES.reduce((s, site) => s + (trafficData[best?.id]?.[site.id]?.sessions || 0), 0)
    return total > bestTotal ? src : best
  }, SOURCES[0])

  const igSessions = SITES.reduce((sum, site) =>
    sum + (trafficData['ig_organic']?.[site.id]?.sessions || 0) + (trafficData['ig_paid']?.[site.id]?.sessions || 0), 0)
  const igConversions = SITES.reduce((sum, site) => {
    const convs = Object.values(siteData[site.id]?.conversions || {}).reduce((a, b) => a + b, 0)
    return sum + convs
  }, 0)
  const igCvr = igSessions > 0 ? ((igConversions / igSessions) * 100).toFixed(1) : '0.0'

  const items = [
    { label: 'Total Sessions', value: totalSessions.toLocaleString(), color: '#6366f1' },
    { label: 'Total Conversions', value: totalConversions.toLocaleString(), color: '#f59e0b' },
    { label: 'Overall CVR', value: `${overallCvr}%`, color: '#10b981' },
    { label: 'Best Site', value: bestSite.label, color: bestSite.color },
    { label: 'Best Source', value: bestSource.label.split(' ').slice(0, 2).join(' '), color: bestSource.color },
    { label: 'Instagram CVR', value: `${igCvr}%`, color: '#c026d3' },
  ]

  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
      {items.map(item => (
        <div key={item.label} style={{ ...kpiBox, minWidth: 120 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: item.color }}>{item.value}</div>
          <div style={{ fontSize: 11, color: '#4b5563', marginTop: 4 }}>{item.label}</div>
        </div>
      ))}
    </div>
  )
}

export default function TrafficTab() {
  const [dateRange, setDateRange] = useState('Last 30 days')
  const [selectedSite, setSelectedSite] = useState(null)
  const [selectedSource, setSelectedSource] = useState(null)
  const [trafficData, setTrafficData] = useState(emptyTrafficData())
  const [siteData, setSiteData] = useState(emptySiteData())
  const [expandedSite, setExpandedSite] = useState(null)
  const [showEntry, setShowEntry] = useState(false)
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [loading, setLoading] = useState(true)

  // Load persisted data from Supabase on mount and when date range changes
  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const [sessionsRes, conversionsRes] = await Promise.all([
          supabase.from('traffic_sessions').select('*').eq('date_range', dateRange),
          supabase.from('traffic_conversions').select('*').eq('date_range', dateRange),
        ])
        if (!sessionsRes.error && sessionsRes.data?.length > 0) {
          const newTrafficData = emptyTrafficData()
          sessionsRes.data.forEach(row => {
            if (newTrafficData[row.source_id] && newTrafficData[row.source_id][row.site_id] !== undefined) {
              newTrafficData[row.source_id][row.site_id].sessions = row.sessions
            }
          })
          setTrafficData(newTrafficData)
        }
        if (!conversionsRes.error && conversionsRes.data?.length > 0) {
          const newSiteData = emptySiteData()
          conversionsRes.data.forEach(row => {
            if (newSiteData[row.site_id]) {
              newSiteData[row.site_id].conversions[row.conversion_type] = row.count
            }
          })
          setSiteData(newSiteData)
        }
      } catch (e) { console.error('Traffic load error:', e) }
      setLoading(false)
    }
    loadData()
  }, [dateRange])

  const handleSiteClick = (siteId) => {
    setSelectedSite(siteId)
    setExpandedSite(siteId)
    setShowEntry(false)
  }

  const clearSelection = () => {
    setSelectedSite(null)
    setExpandedSite(null)
    setSelectedSource(null)
    setShowEntry(false)
  }

  const expandedSiteObj = SITES.find(s => s.id === expandedSite)

  return (
    <div>
      {/* Controls */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {DATE_RANGES.map(r => (
            <button
              key={r}
              onClick={() => setDateRange(r)}
              style={{
                padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 600,
                background: dateRange === r ? '#6366f1' : '#1a1d27',
                color: dateRange === r ? '#fff' : '#9ca3af',
              }}
            >{r}</button>
          ))}
        </div>
        {dateRange === 'Custom' && (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
              style={{ background: '#1a1d27', border: '1px solid #2d3148', borderRadius: 6, color: '#e5e7eb', padding: '5px 10px', fontSize: 12 }} />
            <span style={{ color: '#4b5563' }}>→</span>
            <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
              style={{ background: '#1a1d27', border: '1px solid #2d3148', borderRadius: 6, color: '#e5e7eb', padding: '5px 10px', fontSize: 12 }} />
          </div>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {SOURCES.map(src => (
            <button
              key={src.id}
              onClick={() => setSelectedSource(selectedSource === src.id ? null : src.id)}
              title={src.label}
              style={{
                padding: '5px 10px', borderRadius: 6, border: `1px solid ${src.color}`,
                cursor: 'pointer', fontSize: 11, fontWeight: 600,
                background: selectedSource === src.id ? src.color : 'transparent',
                color: selectedSource === src.id ? '#fff' : src.color,
              }}
            >{src.icon}</button>
          ))}
          {(selectedSite || selectedSource) && (
            <button onClick={clearSelection} style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid #4b5563', cursor: 'pointer', fontSize: 11, color: '#9ca3af', background: 'transparent' }}>Clear ×</button>
          )}
        </div>
      </div>

      {/* Cross-site summary KPIs */}
      <CrossSiteSummary trafficData={trafficData} siteData={siteData} />

      {/* Section A: Flow Diagram */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 15, color: '#e5e7eb' }}>Traffic Flow — Sources → Sites → Conversions</h3>
            <p style={{ margin: '4px 0 0', fontSize: 11, color: '#4b5563' }}>
              Line thickness = session volume. Click a site node to drill down. Filter sources using the icons above.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: '#22c55e' }}>● Live = GA4 connected</span>
            <span style={{ fontSize: 10, color: '#4b5563' }}>· Manual = enter data below</span>
          </div>
        </div>
        <FlowDiagram
          trafficData={trafficData}
          siteData={siteData}
          selectedSite={selectedSite}
          selectedSource={selectedSource}
          onSelectSite={handleSiteClick}
        />
      </div>

      {/* Section B: Site Cards */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        {SITES.map(site => (
          <SiteCard
            key={site.id}
            site={site}
            siteData={siteData}
            trafficData={trafficData}
            selected={expandedSite === site.id}
            onClick={() => handleSiteClick(expandedSite === site.id ? null : site.id)}
          />
        ))}
      </div>

      {/* Section C: Expanded Site Detail */}
      {expandedSite && expandedSiteObj && (
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 15, color: expandedSiteObj.color }}>{expandedSiteObj.label} — Source Breakdown</h3>
              <div style={{ fontSize: 11, color: '#4b5563', marginTop: 2 }}>{expandedSiteObj.domain}</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setShowEntry(!showEntry)}
                style={{
                  padding: '6px 14px', borderRadius: 6, border: `1px solid ${expandedSiteObj.color}`,
                  cursor: 'pointer', fontSize: 12, fontWeight: 600,
                  background: showEntry ? expandedSiteObj.color : 'transparent',
                  color: showEntry ? '#fff' : expandedSiteObj.color,
                }}
              >
                {showEntry ? 'Hide Entry' : '+ Enter Data'}
              </button>
              <button onClick={clearSelection} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #2d3148', cursor: 'pointer', fontSize: 12, color: '#6b7280', background: 'transparent' }}>Close ×</button>
            </div>
          </div>
          <SourceBreakdown site={expandedSiteObj} trafficData={trafficData} />
          {showEntry && (
            <ManualEntryPanel
              site={expandedSiteObj}
              siteData={siteData}
              setSiteData={setSiteData}
              trafficData={trafficData}
              setTrafficData={setTrafficData}
              activeSite={expandedSite}
              dateRange={dateRange}
            />
          )}
        </div>
      )}

      {/* GA4 Infrastructure Banner */}
      <div style={{ background: '#0e1018', borderRadius: 10, padding: '14px 20px', border: '1px solid #2d3148' }}>
        <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 700, marginBottom: 8, letterSpacing: 1 }}>GA4 INFRASTRUCTURE STATUS</div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {[
            { site: 'EYbi', status: 'live', note: 'G-XSDC05FB8V - confirmed tracking' },
            { site: 'Book site', status: 'live', note: 'G-DVE827YSEC - confirmed tracking' },
            { site: 'Course site', status: 'live', note: 'G-DVE827YSEC - same property as book' },
            { site: 'Blueprint', status: 'installed', note: 'G-Y300MN32EM - publish to activate' },
          ].map(item => (
            <div key={item.site} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 200 }}>
              <span style={{
                fontSize: 9, fontWeight: 700, borderRadius: 4, padding: '2px 6px',
                background: item.status === 'live' ? '#052e16' : item.status === 'installed' ? '#422006' : '#1a0a0a',
                color: item.status === 'live' ? '#22c55e' : item.status === 'installed' ? '#f97316' : '#ef4444',
              }}>
                {item.status === 'live' ? '● LIVE' : item.status.toUpperCase()}
              </span>
              <div>
                <div style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600 }}>{item.site}</div>
                <div style={{ fontSize: 10, color: '#4b5563' }}>{item.note}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 10, fontSize: 11, color: '#4b5563' }}>
          Once GA4 is confirmed on each site and the Data API is connected, this dashboard will auto-populate. Until then, use "+ Enter Data" on each site card.
        </div>
      </div>
    </div>
  )
}
