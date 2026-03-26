'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const HOOKS = Array.from({ length: 100 }, (_, i) => ({
  id: i + 1,
  structure: i % 2 === 0 ? 'Story-First' : 'Stat-First',
  cta: i % 3 === 0 ? 'BOOK' : i % 3 === 1 ? 'INSIGHT' : 'COURSE',
}))

const card = {
  background: '#1a1d27',
  borderRadius: 12,
  padding: '20px 24px',
  marginBottom: 16,
}

const kpiBox = {
  background: '#12151f',
  borderRadius: 10,
  padding: '16px 20px',
  textAlign: 'center',
  flex: 1,
}

const defaultWeeks = Array.from({ length: 10 }, (_, i) => ({
  week: i + 1, impressions: 0, comments: 0, clicks: 0, signups: 0, revenue: 0
}))

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [weeks, setWeeks] = useState(defaultWeeks)
  const [hookData, setHookData] = useState(
    HOOKS.map(h => ({ ...h, impressions: 0, comments: 0, saves: 0, shares: 0 }))
  )
  const [editingWeek, setEditingWeek] = useState(null)
  const [draft, setDraft] = useState({})
  const [saving, setSaving] = useState(false)
  const [igPosts, setIgPosts] = useState([])
  const [igLoading, setIgLoading] = useState(false)
  const [igError, setIgError] = useState(null)

  useEffect(() => {
    async function loadWeeks() {
      const { data, error } = await supabase
        .from('dashboard_metrics')
        .select('*')
        .order('week', { ascending: true })
      if (!error && data && data.length > 0) {
        const merged = defaultWeeks.map(dw => {
          const found = data.find(r => r.week === dw.week)
          return found ? { week: dw.week, impressions: found.impressions, comments: found.comments, clicks: found.clicks, signups: found.signups, revenue: found.revenue } : dw
        })
        setWeeks(merged)
      }
    }
    loadWeeks()
  }, [])

  useEffect(() => {
    if (activeTab === 'instagram') {
      loadInstagram()
    }
  }, [activeTab])

  async function loadInstagram() {
    setIgLoading(true)
    setIgError(null)
    try {
      const res = await fetch('/api/dashboard?type=instagram')
      const json = await res.json()
      if (json.success) {
        setIgPosts(json.data)
      } else {
        setIgError(json.error || 'Failed to load Instagram data')
      }
    } catch (err) {
      setIgError(err.message)
    }
    setIgLoading(false)
  }

  const saveWeek = async (weekNum) => {
    setSaving(true)
    const updated = { ...weeks.find(w => w.week === weekNum), ...draft }
    const { error } = await supabase
      .from('dashboard_metrics')
      .upsert({ week: weekNum, ...draft }, { onConflict: 'week' })
    if (!error) {
      setWeeks(prev => prev.map(w => w.week === weekNum ? updated : w))
    }
    setEditingWeek(null)
    setDraft({})
    setSaving(false)
  }

  const totals = weeks.reduce((acc, w) => ({
    impressions: acc.impressions + w.impressions,
    comments: acc.comments + w.comments,
    clicks: acc.clicks + w.clicks,
    signups: acc.signups + w.signups,
    revenue: acc.revenue + w.revenue,
  }), { impressions: 0, comments: 0, clicks: 0, signups: 0, revenue: 0 })

  const signupGate = Math.min(100, (totals.signups / 100) * 100)
  const revenueGate = Math.min(100, (totals.revenue / 90000) * 100)

  const storyFirst = hookData.filter(h => h.structure === 'Story-First')
  const statFirst = hookData.filter(h => h.structure === 'Stat-First')
  const avgEngagement = (arr) => {
    const total = arr.reduce((a, h) => a + h.comments + h.saves + h.shares, 0)
    return arr.length ? (total / arr.length).toFixed(1) : 0
  }

  const igTotals = igPosts.reduce((acc, p) => ({
    impressions: acc.impressions + (p.impressions || 0),
    reach: acc.reach + (p.reach || 0),
    likes: acc.likes + (p.like_count || 0),
    comments: acc.comments + (p.comments_count || 0),
    saves: acc.saves + (p.saved || 0),
  }), { impressions: 0, reach: 0, likes: 0, comments: 0, saves: 0 })

  const tabs = ['overview', 'instagram', 'weekly', 'hooks', 'funnel']

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: '#fff' }}>Amplify Dashboard</h1>
        <p style={{ color: '#6b7280', fontSize: 14, margin: '4px 0 0' }}>EYbi Campaign · Amplify Training FZE</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setActiveTab(t)} style={{
            padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: 13, textTransform: 'capitalize',
            background: activeTab === t ? '#6366f1' : '#1a1d27',
            color: activeTab === t ? '#fff' : '#9ca3af',
          }}>{t}</button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            {[
              { label: 'Total Impressions', value: totals.impressions.toLocaleString(), color: '#6366f1' },
              { label: 'Comments', value: totals.comments.toLocaleString(), color: '#10b981' },
              { label: 'EYbi Signups', value: totals.signups.toLocaleString(), color: '#f59e0b' },
              { label: 'Revenue', value: `£${totals.revenue.toLocaleString()}`, color: '#ec4899' },
            ].map(k => (
              <div key={k.label} style={kpiBox}>
                <div style={{ fontSize: 26, fontWeight: 800, color: k.color }}>{k.value}</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{k.label}</div>
              </div>
            ))}
          </div>

          <div style={card}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15, color: '#e5e7eb' }}>Campaign Gates</h3>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#9ca3af', marginBottom: 6 }}>
                <span>Week 4 Gate — 100 EYbi Signups (Unlock Paid Ads)</span>
                <span style={{ color: '#f59e0b' }}>{totals.signups} / 100</span>
              </div>
              <div style={{ background: '#2d3148', borderRadius: 6, height: 10 }}>
                <div style={{ width: `${signupGate}%`, background: '#f59e0b', height: 10, borderRadius: 6, transition: 'width 0.4s' }} />
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#9ca3af', marginBottom: 6 }}>
                <span>Week 8 Gate — £90,000 Revenue (30-Day Payback)</span>
                <span style={{ color: '#ec4899' }}>£{totals.revenue.toLocaleString()} / £90,000</span>
              </div>
              <div style={{ background: '#2d3148', borderRadius: 6, height: 10 }}>
                <div style={{ width: `${revenueGate}%`, background: '#ec4899', height: 10, borderRadius: 6, transition: 'width 0.4s' }} />
              </div>
            </div>
          </div>

          <div style={card}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, color: '#e5e7eb' }}>Hook Structure A/B Test</h3>
            <div style={{ display: 'flex', gap: 12 }}>
              {[
                { label: 'Story-First', count: storyFirst.length, avg: avgEngagement(storyFirst), color: '#6366f1' },
                { label: 'Stat-First', count: statFirst.length, avg: avgEngagement(statFirst), color: '#10b981' },
              ].map(s => (
                <div key={s.label} style={{ ...kpiBox, borderLeft: `3px solid ${s.color}` }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.avg}</div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{s.label} — avg engagement</div>
                  <div style={{ fontSize: 11, color: '#4b5563', marginTop: 2 }}>{s.count} hooks assigned</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* INSTAGRAM TAB */}
      {activeTab === 'instagram' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 16, color: '#e5e7eb' }}>@allanpresland — Instagram</h2>
            <button onClick={loadInstagram} style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: 12 }}>
              Refresh
            </button>
          </div>

          {igLoading && <div style={{ color: '#6b7280', padding: '40px 0', textAlign: 'center' }}>Loading Instagram data...</div>}
          {igError && <div style={{ color: '#ef4444', padding: '20px', background: '#1a1d27', borderRadius: 8, marginBottom: 16 }}>Error: {igError}</div>}

          {!igLoading && !igError && igPosts.length > 0 && (
            <>
              <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                {[
                  { label: 'Total Impressions', value: igTotals.impressions.toLocaleString(), color: '#6366f1' },
                  { label: 'Total Reach', value: igTotals.reach.toLocaleString(), color: '#10b981' },
                  { label: 'Total Likes', value: igTotals.likes.toLocaleString(), color: '#f59e0b' },
                  { label: 'Total Comments', value: igTotals.comments.toLocaleString(), color: '#ec4899' },
                  { label: 'Total Saves', value: igTotals.saves.toLocaleString(), color: '#8b5cf6' },
                ].map(k => (
                  <div key={k.label} style={{ ...kpiBox, minWidth: 120 }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: k.color }}>{k.value}</div>
                    <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>{k.label}</div>
                  </div>
                ))}
              </div>

              <div style={card}>
                <h3 style={{ margin: '0 0 16px', fontSize: 15, color: '#e5e7eb' }}>Posts — ranked by impressions</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ color: '#6b7280' }}>
                        {['Date', 'Caption', 'Type', 'Impressions', 'Reach', 'Likes', 'Comments', 'Saves'].map(h => (
                          <th key={h} style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid #2d3148', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[...igPosts].sort((a, b) => (b.impressions || 0) - (a.impressions || 0)).map((p, idx) => (
                        <tr key={p.id} style={{ borderBottom: '1px solid #1a1d27', background: idx % 2 === 0 ? 'transparent' : '#12151f' }}>
                          <td style={{ padding: '7px 10px', color: '#9ca3af', whiteSpace: 'nowrap' }}>
                            {new Date(p.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          </td>
                          <td style={{ padding: '7px 10px', color: '#e5e7eb', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p.caption ? p.caption.substring(0, 60) + (p.caption.length > 60 ? '...' : '') : '—'}
                          </td>
                          <td style={{ padding: '7px 10px' }}>
                            <span style={{ background: p.media_type === 'CAROUSEL_ALBUM' ? '#312e81' : '#064e3b', color: p.media_type === 'CAROUSEL_ALBUM' ? '#818cf8' : '#34d399', borderRadius: 4, padding: '2px 6px', fontSize: 10 }}>
                              {p.media_type === 'CAROUSEL_ALBUM' ? 'Carousel' : p.media_type === 'VIDEO' ? 'Reel' : 'Image'}
                            </span>
                          </td>
                          <td style={{ padding: '7px 10px', color: '#6366f1', fontWeight: 600 }}>{(p.impressions || 0).toLocaleString()}</td>
                          <td style={{ padding: '7px 10px', color: '#9ca3af' }}>{(p.reach || 0).toLocaleString()}</td>
                          <td style={{ padding: '7px 10px', color: '#f59e0b' }}>{(p.like_count || 0).toLocaleString()}</td>
                          <td style={{ padding: '7px 10px', color: '#ec4899' }}>{(p.comments_count || 0).toLocaleString()}</td>
                          <td style={{ padding: '7px 10px', color: '#8b5cf6' }}>{(p.saved || 0).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {!igLoading && !igError && igPosts.length === 0 && (
            <div style={{ color: '#6b7280', padding: '40px 0', textAlign: 'center' }}>No posts found. Click Refresh to load.</div>
          )}
        </>
      )}

      {/* WEEKLY TAB */}
      {activeTab === 'weekly' && (
        <div style={card}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, color: '#e5e7eb' }}>Weekly Metrics</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ color: '#6b7280' }}>
                {['Week', 'Impressions', 'Comments', 'Clicks', 'Signups', 'Revenue', ''].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid #2d3148' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weeks.map(w => (
                <tr key={w.week} style={{ borderBottom: '1px solid #1e2130' }}>
                  {editingWeek === w.week ? (
                    <>
                      <td style={{ padding: '8px 10px', color: '#e5e7eb' }}>Wk {w.week}</td>
                      {['impressions','comments','clicks','signups','revenue'].map(field => (
                        <td key={field} style={{ padding: '4px 6px' }}>
                          <input
                            type="number"
                            defaultValue={w[field]}
                            onChange={e => setDraft(d => ({ ...d, [field]: Number(e.target.value) }))}
                            style={{ width: 80, background: '#12151f', border: '1px solid #6366f1', borderRadius: 4, color: '#fff', padding: '4px 6px', fontSize: 12 }}
                          />
                        </td>
                      ))}
                      <td style={{ padding: '4px 6px' }}>
                        <button onClick={() => saveWeek(w.week)} disabled={saving} style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>
                          {saving ? '...' : 'Save'}
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ padding: '8px 10px', color: '#e5e7eb' }}>Wk {w.week}</td>
                      <td style={{ padding: '8px 10px', color: '#9ca3af' }}>{w.impressions.toLocaleString()}</td>
                      <td style={{ padding: '8px 10px', color: '#9ca3af' }}>{w.comments.toLocaleString()}</td>
                      <td style={{ padding: '8px 10px', color: '#9ca3af' }}>{w.clicks.toLocaleString()}</td>
                      <td style={{ padding: '8px 10px', color: '#f59e0b' }}>{w.signups}</td>
                      <td style={{ padding: '8px 10px', color: '#10b981' }}>£{w.revenue.toLocaleString()}</td>
                      <td style={{ padding: '8px 10px' }}>
                        <button onClick={() => { setEditingWeek(w.week); setDraft({...w}) }} style={{ background: '#1e2130', color: '#6366f1', border: '1px solid #6366f1', borderRadius: 4, padding: '3px 10px', cursor: 'pointer', fontSize: 11 }}>Edit</button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* HOOKS TAB */}
      {activeTab === 'hooks' && (
        <div style={card}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, color: '#e5e7eb' }}>Hook Performance — All 100</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ color: '#6b7280' }}>
                  {['Hook #', 'Structure', 'CTA', 'Impressions', 'Comments', 'Saves', 'Shares'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid #2d3148', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {hookData.map((h, idx) => (
                  <tr key={h.id} style={{ borderBottom: '1px solid #1a1d27', background: idx % 2 === 0 ? 'transparent' : '#12151f' }}>
                    <td style={{ padding: '7px 10px', color: '#e5e7eb' }}>#{h.id}</td>
                    <td style={{ padding: '7px 10px' }}>
                      <span style={{ background: h.structure === 'Story-First' ? '#312e81' : '#064e3b', color: h.structure === 'Story-First' ? '#818cf8' : '#34d399', borderRadius: 4, padding: '2px 7px', fontSize: 11 }}>{h.structure}</span>
                    </td>
                    <td style={{ padding: '7px 10px', color: '#f59e0b', fontSize: 11 }}>{h.cta}</td>
                    {['impressions','comments','saves','shares'].map(field => (
                      <td key={field} style={{ padding: '4px 6px' }}>
                        <input
                          type="number"
                          value={hookData[idx][field]}
                          onChange={e => setHookData(prev => prev.map((item, i) => i === idx ? { ...item, [field]: Number(e.target.value) } : item))}
                          style={{ width: 70, background: '#12151f', border: '1px solid #2d3148', borderRadius: 4, color: '#9ca3af', padding: '3px 6px', fontSize: 11 }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FUNNEL TAB */}
      {activeTab === 'funnel' && (
        <div style={card}>
          <h3 style={{ margin: '0 0 20px', fontSize: 15, color: '#e5e7eb' }}>Funnel Conversion</h3>
          {[
            { label: 'Impressions → Comments', value: totals.impressions > 0 ? ((totals.comments / totals.impressions) * 100).toFixed(2) + '%' : '—', color: '#6366f1' },
            { label: 'Comments → Clicks', value: totals.comments > 0 ? ((totals.clicks / totals.comments) * 100).toFixed(1) + '%' : '—', color: '#10b981' },
            { label: 'Clicks → Signups', value: totals.clicks > 0 ? ((totals.signups / totals.clicks) * 100).toFixed(1) + '%' : '—', color: '#f59e0b' },
            { label: 'Signups → Revenue', value: totals.signups > 0 ? '£' + (totals.revenue / Math.max(totals.signups, 1)).toFixed(0) + ' per signup' : '—', color: '#ec4899' },
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #1e2130' }}>
              <span style={{ color: '#9ca3af', fontSize: 14 }}>{row.label}</span>
              <span style={{ color: row.color, fontWeight: 700, fontSize: 22 }}>{row.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
