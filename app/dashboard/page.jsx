'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import PublishTab from '../components/PublishTab'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const HOOKS = Array.from({ length: 100 }, (_, i) => ({
  id: i + 1,
  structure: i % 2 === 0 ? 'Story-First' : 'Stat-First',
  cta: i % 3 === 0 ? 'BOOK' : i % 3 === 1 ? 'INSIGHT' : 'COURSE',
}))

const card = { background: '#1a1d27', borderRadius: 12, padding: '20px 24px', marginBottom: 16 }
const kpiBox = { background: '#12151f', borderRadius: 10, padding: '16px 20px', textAlign: 'center', flex: 1 }
const defaultWeeks = Array.from({ length: 10 }, (_, i) => ({ week: i + 1, impressions: 0, comments: 0, clicks: 0, signups: 0, revenue: 0 }))
const defaultFunnelCtas = {
  BOOK: { comments: 0, dms: 0, clicks: 0, conversions: 0, revenue: 0 },
  INSIGHT: { comments: 0, dms: 0, clicks: 0, conversions: 0, revenue: 0 },
  COURSE: { comments: 0, dms: 0, clicks: 0, conversions: 0, revenue: 0 },
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [weeks, setWeeks] = useState(defaultWeeks)
  const [hookData, setHookData] = useState(HOOKS.map(h => ({ ...h, impressions: 0, comments: 0, saves: 0, shares: 0 })))
  const [editingWeek, setEditingWeek] = useState(null)
  const [draft, setDraft] = useState({})
  const [saving, setSaving] = useState(false)
  const [igPosts, setIgPosts] = useState([])
  const [igLoading, setIgLoading] = useState(false)
  const [igError, setIgError] = useState(null)
  const [expandedPost, setExpandedPost] = useState(null)
  const [funnelCtas, setFunnelCtas] = useState(defaultFunnelCtas)
  const [editingCta, setEditingCta] = useState(null)
  const [ctaDraft, setCtaDraft] = useState({})
  const [savingCta, setSavingCta] = useState(false)

  useEffect(() => {
    async function loadWeeks() {
      const { data, error } = await supabase.from('dashboard_metrics').select('*').order('week', { ascending: true })
      if (!error && data && data.length > 0) {
        const merged = defaultWeeks.map(dw => { const found = data.find(r => r.week === dw.week); return found ? { week: dw.week, impressions: found.impressions, comments: found.comments, clicks: found.clicks, signups: found.signups, revenue: found.revenue } : dw })
        setWeeks(merged)
      }
    }
    async function loadFunnelCtas() {
      const { data, error } = await supabase.from('funnel_ctas').select('*')
      if (!error && data && data.length > 0) {
        const merged = { ...defaultFunnelCtas }
        data.forEach(row => { if (merged[row.cta]) merged[row.cta] = row })
        setFunnelCtas(merged)
      }
    }
    loadWeeks()
    loadFunnelCtas()
  }, [])

  useEffect(() => {
    if (activeTab === 'instagram' || activeTab === 'funnel') { if (igPosts.length === 0) loadInstagram() }
  }, [activeTab])

  async function loadInstagram() {
    setIgLoading(true); setIgError(null)
    try {
      const res = await fetch('/api/dashboard?type=instagram')
      const json = await res.json()
      if (json.success) { setIgPosts(json.data) } else { setIgError(json.error || 'Failed to load Instagram data') }
    } catch (err) { setIgError(err.message) }
    setIgLoading(false)
  }

  const saveWeek = async (weekNum) => {
    setSaving(true)
    const updated = { ...weeks.find(w => w.week === weekNum), ...draft }
    const { error } = await supabase.from('dashboard_metrics').upsert({ week: weekNum, ...draft }, { onConflict: 'week' })
    if (!error) { setWeeks(prev => prev.map(w => w.week === weekNum ? updated : w)) }
    setEditingWeek(null); setDraft({}); setSaving(false)
  }

  const saveCtaRow = async (cta) => {
    setSavingCta(true)
    const updated = { ...funnelCtas[cta], ...ctaDraft }
    const { error } = await supabase.from('funnel_ctas').upsert({ cta, ...ctaDraft }, { onConflict: 'cta' })
    if (!error) { setFunnelCtas(prev => ({ ...prev, [cta]: updated })) }
    setEditingCta(null); setCtaDraft({}); setSavingCta(false)
  }

  const totals = weeks.reduce((acc, w) => ({ impressions: acc.impressions + w.impressions, comments: acc.comments + w.comments, clicks: acc.clicks + w.clicks, signups: acc.signups + w.signups, revenue: acc.revenue + w.revenue }), { impressions: 0, comments: 0, clicks: 0, signups: 0, revenue: 0 })
  const signupGate = Math.min(100, (totals.signups / 100) * 100)
  const revenueGate = Math.min(100, (totals.revenue / 90000) * 100)
  const storyFirst = hookData.filter(h => h.structure === 'Story-First')
  const statFirst = hookData.filter(h => h.structure === 'Stat-First')
  const avgEngagement = (arr) => { const total = arr.reduce((a, h) => a + h.comments + h.saves + h.shares, 0); return arr.length ? (total / arr.length).toFixed(1) : 0 }
  const igTotals = igPosts.reduce((acc, p) => ({ impressions: acc.impressions + (p.impressions || 0), reach: acc.reach + (p.reach || 0), likes: acc.likes + (p.like_count || 0), comments: acc.comments + (p.comments_count || 0), saves: acc.saves + (p.saved || 0) }), { impressions: 0, reach: 0, likes: 0, comments: 0, saves: 0 })
  const ctaTotals = Object.values(funnelCtas).reduce((acc, c) => ({ comments: acc.comments + (c.comments || 0), dms: acc.dms + (c.dms || 0), clicks: acc.clicks + (c.clicks || 0), conversions: acc.conversions + (c.conversions || 0), revenue: acc.revenue + (c.revenue || 0) }), { comments: 0, dms: 0, clicks: 0, conversions: 0, revenue: 0 })
  const topPostsByComments = [...igPosts].sort((a, b) => (b.comments_count || 0) - (a.comments_count || 0)).slice(0, 10)
  const pct = (num, den) => den > 0 ? ((num / den) * 100).toFixed(1) + '%' : '—'
  const funnelSteps = [
    { label: 'Impressions', sublabel: 'Total reel/carousel views', value: totals.impressions, color: '#6366f1' },
    { label: 'Comments', sublabel: 'BOOK / INSIGHT / COURSE triggers', value: ctaTotals.comments || totals.comments, color: '#8b5cf6', dropPct: pct(ctaTotals.comments || totals.comments, totals.impressions) },
    { label: 'ManyChat DMs Sent', sublabel: 'Auto-replies triggered', value: ctaTotals.dms, color: '#06b6d4', dropPct: pct(ctaTotals.dms, ctaTotals.comments || totals.comments) },
    { label: 'Link Clicks', sublabel: 'Clicked link in DM', value: ctaTotals.clicks, color: '#10b981', dropPct: pct(ctaTotals.clicks, ctaTotals.dms) },
    { label: 'Conversions', sublabel: 'Purchases or EYbi signups', value: ctaTotals.conversions, color: '#f59e0b', dropPct: pct(ctaTotals.conversions, ctaTotals.clicks) },
    { label: 'Revenue', sublabel: 'Total from funnel', value: `£${(ctaTotals.revenue || totals.revenue).toLocaleString()}`, color: '#ec4899', dropPct: ctaTotals.conversions > 0 ? `£${((ctaTotals.revenue || totals.revenue) / ctaTotals.conversions).toFixed(0)} per conversion` : '—' },
  ]
  const tabs = ['overview', 'instagram', 'weekly', 'hooks', 'funnel', 'publish']

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: '#fff' }}>Amplify Dashboard</h1>
        <p style={{ color: '#6b7280', fontSize: 14, margin: '4px 0 0' }}>EYbi Campaign · Amplify Training FZE</p>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {tabs.map(t => (<button key={t} onClick={() => setActiveTab(t)} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, textTransform: 'capitalize', background: activeTab === t ? '#6366f1' : '#1a1d27', color: activeTab === t ? '#fff' : '#9ca3af' }}>{t}</button>))}
      </div>

      {activeTab === 'overview' && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            {[{ label: 'Total Impressions', value: totals.impressions.toLocaleString(), color: '#6366f1' }, { label: 'Comments', value: totals.comments.toLocaleString(), color: '#10b981' }, { label: 'EYbi Signups', value: totals.signups.toLocaleString(), color: '#f59e0b' }, { label: 'Revenue', value: `£${totals.revenue.toLocaleString()}`, color: '#ec4899' }].map(k => (
              <div key={k.label} style={kpiBox}><div style={{ fontSize: 26, fontWeight: 800, color: k.color }}>{k.value}</div><div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{k.label}</div></div>
            ))}
          </div>
          <div style={card}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15, color: '#e5e7eb' }}>Campaign Gates</h3>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#9ca3af', marginBottom: 6 }}><span>Week 4 Gate — 100 EYbi Signups (Unlock Paid Ads)</span><span style={{ color: '#f59e0b' }}>{totals.signups} / 100</span></div>
              <div style={{ background: '#2d3148', borderRadius: 6, height: 10 }}><div style={{ width: `${signupGate}%`, background: '#f59e0b', height: 10, borderRadius: 6, transition: 'width 0.4s' }} /></div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#9ca3af', marginBottom: 6 }}><span>Week 8 Gate — £90,000 Revenue (30-Day Payback)</span><span style={{ color: '#ec4899' }}>£{totals.revenue.toLocaleString()} / £90,000</span></div>
              <div style={{ background: '#2d3148', borderRadius: 6, height: 10 }}><div style={{ width: `${revenueGate}%`, background: '#ec4899', height: 10, borderRadius: 6, transition: 'width 0.4s' }} /></div>
            </div>
          </div>
          <div style={card}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, color: '#e5e7eb' }}>Hook Structure A/B Test</h3>
            <div style={{ display: 'flex', gap: 12 }}>
              {[{ label: 'Story-First', count: storyFirst.length, avg: avgEngagement(storyFirst), color: '#6366f1' }, { label: 'Stat-First', count: statFirst.length, avg: avgEngagement(statFirst), color: '#10b981' }].map(s => (
                <div key={s.label} style={{ ...kpiBox, borderLeft: `3px solid ${s.color}` }}><div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.avg}</div><div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{s.label} — avg engagement</div><div style={{ fontSize: 11, color: '#4b5563', marginTop: 2 }}>{s.count} hooks assigned</div></div>
              ))}
            </div>
          </div>
        </>
      )}

      {activeTab === 'instagram' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 16, color: '#e5e7eb' }}>@allanpresland — Instagram</h2>
            <button onClick={loadInstagram} style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: 12 }}>Refresh</button>
          </div>
          {igLoading && <div style={{ color: '#6b7280', padding: '40px 0', textAlign: 'center' }}>Loading Instagram data...</div>}
          {igError && <div style={{ color: '#ef4444', padding: '20px', background: '#1a1d27', borderRadius: 8, marginBottom: 16 }}>Error: {igError}</div>}
          {!igLoading && !igError && igPosts.length > 0 && (
            <>
              <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                {[{ label: 'Total Impressions', value: igTotals.impressions.toLocaleString(), color: '#6366f1' }, { label: 'Total Reach', value: igTotals.reach.toLocaleString(), color: '#10b981' }, { label: 'Total Likes', value: igTotals.likes.toLocaleString(), color: '#f59e0b' }, { label: 'Total Comments', value: igTotals.comments.toLocaleString(), color: '#ec4899' }, { label: 'Total Saves', value: igTotals.saves.toLocaleString(), color: '#8b5cf6' }].map(k => (
                  <div key={k.label} style={{ ...kpiBox, minWidth: 120 }}><div style={{ fontSize: 22, fontWeight: 800, color: k.color }}>{k.value}</div><div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>{k.label}</div></div>
                ))}
              </div>
              <div style={card}>
                <h3 style={{ margin: '0 0 4px', fontSize: 15, color: '#e5e7eb' }}>Posts — ranked by date</h3>
                <p style={{ margin: '0 0 16px', fontSize: 11, color: '#4b5563' }}>Impressions, Reach &amp; Saves require instagram_manage_insights — pending Meta App Review</p>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead><tr style={{ color: '#6b7280' }}>{['Date','Caption','Type','Impressions','Reach','Likes','Comments','Saves',''].map(h => (<th key={h} style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid #2d3148', whiteSpace: 'nowrap' }}>{h}</th>))}</tr></thead>
                    <tbody>
                      {[...igPosts].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).map((p, idx) => (
                        <>
                          <tr key={p.id} style={{ borderBottom: expandedPost === p.id ? 'none' : '1px solid #1a1d27', background: idx % 2 === 0 ? 'transparent' : '#12151f' }}>
                            <td style={{ padding: '7px 10px', color: '#9ca3af', whiteSpace: 'nowrap' }}>{new Date(p.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</td>
                            <td style={{ padding: '7px 10px', color: '#e5e7eb', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.caption ? p.caption.substring(0, 60) + (p.caption.length > 60 ? '...' : '') : '—'}</td>
                            <td style={{ padding: '7px 10px' }}><span style={{ background: p.media_type === 'CAROUSEL_ALBUM' ? '#312e81' : '#064e3b', color: p.media_type === 'CAROUSEL_ALBUM' ? '#818cf8' : '#34d399', borderRadius: 4, padding: '2px 6px', fontSize: 10 }}>{p.media_type === 'CAROUSEL_ALBUM' ? 'Carousel' : p.media_type === 'VIDEO' ? 'Reel' : 'Image'}</span></td>
                            <td style={{ padding: '7px 10px', color: '#4b5563', fontSize: 11 }}>—</td>
                            <td style={{ padding: '7px 10px', color: '#4b5563', fontSize: 11 }}>—</td>
                            <td style={{ padding: '7px 10px', color: '#f59e0b' }}>{(p.like_count || 0).toLocaleString()}</td>
                            <td style={{ padding: '7px 10px', color: '#ec4899' }}>{(p.comments_count || 0).toLocaleString()}</td>
                            <td style={{ padding: '7px 10px', color: '#4b5563', fontSize: 11 }}>—</td>
                            <td style={{ padding: '7px 10px' }}>{p.comments_count > 0 && (<button onClick={() => setExpandedPost(expandedPost === p.id ? null : p.id)} style={{ background: 'transparent', color: '#6366f1', border: '1px solid #6366f1', borderRadius: 4, padding: '2px 8px', cursor: 'pointer', fontSize: 10 }}>{expandedPost === p.id ? 'Hide' : 'Comments'}</button>)}</td>
                          </tr>
                          {expandedPost === p.id && p.comments && p.comments.length > 0 && (
                            <tr key={p.id + '_comments'} style={{ background: '#0e1018', borderBottom: '1px solid #1a1d27' }}>
                              <td colSpan={9} style={{ padding: '10px 16px' }}>
                                {p.comments.map(c => (<div key={c.id} style={{ display: 'flex', gap: 10, marginBottom: 8 }}><span style={{ color: '#6366f1', fontWeight: 600, minWidth: 100, fontSize: 11 }}>@{c.username || 'user'}</span><span style={{ color: '#d1d5db', fontSize: 12, flex: 1 }}>{c.text}</span><span style={{ color: '#4b5563', fontSize: 10 }}>{new Date(c.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span></div>))}
                              </td>
                            </tr>
                          )}
                        </>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
          {!igLoading && !igError && igPosts.length === 0 && (<div style={{ color: '#6b7280', padding: '40px 0', textAlign: 'center' }}>No posts found. Click Refresh to load.</div>)}
        </>
      )}

      {activeTab === 'weekly' && (
        <div style={card}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, color: '#e5e7eb' }}>Weekly Metrics</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr style={{ color: '#6b7280' }}>{['Week','Impressions','Comments','Clicks','Signups','Revenue',''].map(h => (<th key={h} style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid #2d3148' }}>{h}</th>))}</tr></thead>
            <tbody>
              {weeks.map(w => (
                <tr key={w.week} style={{ borderBottom: '1px solid #1e2130' }}>
                  {editingWeek === w.week ? (
                    <><td style={{ padding: '8px 10px', color: '#e5e7eb' }}>Wk {w.week}</td>{['impressions','comments','clicks','signups','revenue'].map(field => (<td key={field} style={{ padding: '4px 6px' }}><input type="number" defaultValue={w[field]} onChange={e => setDraft(d => ({ ...d, [field]: Number(e.target.value) }))} style={{ width: 80, background: '#12151f', border: '1px solid #6366f1', borderRadius: 4, color: '#fff', padding: '4px 6px', fontSize: 12 }} /></td>))}<td style={{ padding: '4px 6px' }}><button onClick={() => saveWeek(w.week)} disabled={saving} style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>{saving ? '...' : 'Save'}</button></td></>
                  ) : (
                    <><td style={{ padding: '8px 10px', color: '#e5e7eb' }}>Wk {w.week}</td><td style={{ padding: '8px 10px', color: '#9ca3af' }}>{w.impressions.toLocaleString()}</td><td style={{ padding: '8px 10px', color: '#9ca3af' }}>{w.comments.toLocaleString()}</td><td style={{ padding: '8px 10px', color: '#9ca3af' }}>{w.clicks.toLocaleString()}</td><td style={{ padding: '8px 10px', color: '#f59e0b' }}>{w.signups}</td><td style={{ padding: '8px 10px', color: '#10b981' }}>£{w.revenue.toLocaleString()}</td><td style={{ padding: '8px 10px' }}><button onClick={() => { setEditingWeek(w.week); setDraft({...w}) }} style={{ background: '#1e2130', color: '#6366f1', border: '1px solid #6366f1', borderRadius: 4, padding: '3px 10px', cursor: 'pointer', fontSize: 11 }}>Edit</button></td></>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'hooks' && (
        <div style={card}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, color: '#e5e7eb' }}>Hook Performance — All 100</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead><tr style={{ color: '#6b7280' }}>{['Hook #','Structure','CTA','Impressions','Comments','Saves','Shares'].map(h => (<th key={h} style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid #2d3148', whiteSpace: 'nowrap' }}>{h}</th>))}</tr></thead>
              <tbody>
                {hookData.map((h, idx) => (
                  <tr key={h.id} style={{ borderBottom: '1px solid #1a1d27', background: idx % 2 === 0 ? 'transparent' : '#12151f' }}>
                    <td style={{ padding: '7px 10px', color: '#e5e7eb' }}>#{h.id}</td>
                    <td style={{ padding: '7px 10px' }}><span style={{ background: h.structure === 'Story-First' ? '#312e81' : '#064e3b', color: h.structure === 'Story-First' ? '#818cf8' : '#34d399', borderRadius: 4, padding: '2px 7px', fontSize: 11 }}>{h.structure}</span></td>
                    <td style={{ padding: '7px 10px', color: '#f59e0b', fontSize: 11 }}>{h.cta}</td>
                    {['impressions','comments','saves','shares'].map(field => (<td key={field} style={{ padding: '4px 6px' }}><input type="number" value={hookData[idx][field]} onChange={e => setHookData(prev => prev.map((item, i) => i === idx ? { ...item, [field]: Number(e.target.value) } : item))} style={{ width: 70, background: '#12151f', border: '1px solid #2d3148', borderRadius: 4, color: '#9ca3af', padding: '3px 6px', fontSize: 11 }} /></td>))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'funnel' && (
        <>
          <div style={card}>
            <h3 style={{ margin: '0 0 4px', fontSize: 15, color: '#e5e7eb' }}>Funnel Pipeline</h3>
            <p style={{ margin: '0 0 20px', fontSize: 11, color: '#4b5563' }}>End-to-end conversion from impressions to revenue. Enter data per CTA below to populate.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {funnelSteps.map((step, idx) => {
                const barWidth = idx === 0 ? 100 : funnelSteps[0].value > 0 && typeof step.value === 'number' ? Math.min(100, (step.value / funnelSteps[0].value) * 100) : 0
                return (
                  <div key={step.label}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 4 }}>
                      <div style={{ width: 140, textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 12, color: '#e5e7eb', fontWeight: 600 }}>{step.label}</div>
                        <div style={{ fontSize: 10, color: '#4b5563' }}>{step.sublabel}</div>
                      </div>
                      <div style={{ flex: 1, background: '#12151f', borderRadius: 6, height: 32, position: 'relative', overflow: 'hidden' }}>
                        <div style={{ width: `${barWidth}%`, background: step.color, height: '100%', borderRadius: 6, opacity: 0.85, transition: 'width 0.5s ease', display: 'flex', alignItems: 'center', paddingLeft: 10, minWidth: typeof step.value === 'number' && step.value > 0 ? 40 : 0 }}>
                          {typeof step.value === 'number' && step.value > 0 && <span style={{ color: '#fff', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>{step.value.toLocaleString()}</span>}
                          {typeof step.value === 'string' && step.value !== '£0' && <span style={{ color: '#fff', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>{step.value}</span>}
                        </div>
                        {((typeof step.value === 'number' && step.value === 0) || step.value === '£0') && <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#4b5563', fontSize: 11 }}>0 — enter data below</span>}
                      </div>
                      <div style={{ width: 120, flexShrink: 0 }}>{step.dropPct && step.dropPct !== '—' && <span style={{ fontSize: 11, color: step.color, fontWeight: 600 }}>{step.dropPct}</span>}</div>
                    </div>
                    {idx < funnelSteps.length - 1 && <div style={{ marginLeft: 156, marginBottom: 4, color: '#2d3148', fontSize: 18, lineHeight: 1 }}>↓</div>}
                  </div>
                )
              })}
            </div>
          </div>
          <div style={card}>
            <h3 style={{ margin: '0 0 4px', fontSize: 15, color: '#e5e7eb' }}>Per-CTA Breakdown</h3>
            <p style={{ margin: '0 0 16px', fontSize: 11, color: '#4b5563' }}>BOOK → purchase · INSIGHT → EYbi signup · COURSE → Blueprint</p>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr style={{ color: '#6b7280' }}>{['CTA','Comments','DMs Sent','Link Clicks','Conversions','Revenue','Conv. Rate',''].map(h => (<th key={h} style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid #2d3148', whiteSpace: 'nowrap' }}>{h}</th>))}</tr></thead>
                <tbody>
                  {Object.entries(funnelCtas).map(([cta, data], idx) => {
                    const ctaColor = cta === 'BOOK' ? '#6366f1' : cta === 'INSIGHT' ? '#10b981' : '#f59e0b'
                    const convRate = data.clicks > 0 ? ((data.conversions / data.clicks) * 100).toFixed(1) + '%' : '—'
                    return (
                      <tr key={cta} style={{ borderBottom: '1px solid #1e2130', background: idx % 2 === 0 ? 'transparent' : '#12151f' }}>
                        {editingCta === cta ? (
                          <><td style={{ padding: '8px 10px' }}><span style={{ background: '#1e2130', color: ctaColor, borderRadius: 4, padding: '2px 8px', fontSize: 12, fontWeight: 700 }}>{cta}</span></td>{['comments','dms','clicks','conversions','revenue'].map(field => (<td key={field} style={{ padding: '4px 6px' }}><input type="number" defaultValue={data[field] || 0} onChange={e => setCtaDraft(d => ({ ...d, [field]: Number(e.target.value) }))} style={{ width: 80, background: '#12151f', border: '1px solid #6366f1', borderRadius: 4, color: '#fff', padding: '4px 6px', fontSize: 12 }} /></td>))}<td style={{ padding: '4px 6px', color: '#6b7280', fontSize: 11 }}>—</td><td style={{ padding: '4px 6px' }}><button onClick={() => saveCtaRow(cta)} disabled={savingCta} style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>{savingCta ? '...' : 'Save'}</button></td></>
                        ) : (
                          <><td style={{ padding: '8px 10px' }}><span style={{ background: '#1e2130', color: ctaColor, borderRadius: 4, padding: '2px 8px', fontSize: 12, fontWeight: 700 }}>{cta}</span></td><td style={{ padding: '8px 10px', color: '#9ca3af' }}>{(data.comments || 0).toLocaleString()}</td><td style={{ padding: '8px 10px', color: '#9ca3af' }}>{(data.dms || 0).toLocaleString()}</td><td style={{ padding: '8px 10px', color: '#9ca3af' }}>{(data.clicks || 0).toLocaleString()}</td><td style={{ padding: '8px 10px', color: '#f59e0b' }}>{(data.conversions || 0).toLocaleString()}</td><td style={{ padding: '8px 10px', color: '#10b981' }}>£{(data.revenue || 0).toLocaleString()}</td><td style={{ padding: '8px 10px', color: ctaColor, fontWeight: 600 }}>{convRate}</td><td style={{ padding: '8px 10px' }}><button onClick={() => { setEditingCta(cta); setCtaDraft({ ...data }) }} style={{ background: '#1e2130', color: '#6366f1', border: '1px solid #6366f1', borderRadius: 4, padding: '3px 10px', cursor: 'pointer', fontSize: 11 }}>Edit</button></td></>
                        )}
                      </tr>
                    )
                  })}
                  <tr style={{ borderTop: '2px solid #2d3148', background: '#0e1018' }}>
                    <td style={{ padding: '10px 10px', color: '#e5e7eb', fontWeight: 700, fontSize: 13 }}>TOTAL</td>
                    <td style={{ padding: '10px 10px', color: '#e5e7eb', fontWeight: 700 }}>{ctaTotals.comments.toLocaleString()}</td>
                    <td style={{ padding: '10px 10px', color: '#e5e7eb', fontWeight: 700 }}>{ctaTotals.dms.toLocaleString()}</td>
                    <td style={{ padding: '10px 10px', color: '#e5e7eb', fontWeight: 700 }}>{ctaTotals.clicks.toLocaleString()}</td>
                    <td style={{ padding: '10px 10px', color: '#f59e0b', fontWeight: 700 }}>{ctaTotals.conversions.toLocaleString()}</td>
                    <td style={{ padding: '10px 10px', color: '#10b981', fontWeight: 700 }}>£{ctaTotals.revenue.toLocaleString()}</td>
                    <td style={{ padding: '10px 10px', color: '#e5e7eb', fontWeight: 700 }}>{ctaTotals.clicks > 0 ? ((ctaTotals.conversions / ctaTotals.clicks) * 100).toFixed(1) + '%' : '—'}</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p style={{ margin: '12px 0 0', fontSize: 11, color: '#4b5563' }}>⚡ UTM tracking coming — will auto-populate from ManyChat links · Stripe integration coming — will auto-populate revenue</p>
          </div>
          <div style={card}>
            <h3 style={{ margin: '0 0 4px', fontSize: 15, color: '#e5e7eb' }}>Top Posts by Comments</h3>
            <p style={{ margin: '0 0 16px', fontSize: 11, color: '#4b5563' }}>Comments are the best current proxy for ManyChat trigger attempts. Ranked highest first.</p>
            {igLoading && <div style={{ color: '#6b7280', fontSize: 13 }}>Loading Instagram data...</div>}
            {!igLoading && topPostsByComments.length === 0 && <div style={{ color: '#4b5563', fontSize: 13 }}>No Instagram data loaded yet — visit the Instagram tab first.</div>}
            {!igLoading && topPostsByComments.length > 0 && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead><tr style={{ color: '#6b7280' }}>{['Rank','Date','Caption','Type','Likes','Comments','Engagement'].map(h => (<th key={h} style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid #2d3148', whiteSpace: 'nowrap' }}>{h}</th>))}</tr></thead>
                <tbody>
                  {topPostsByComments.map((p, idx) => {
                    const engagement = (p.like_count || 0) + (p.comments_count || 0)
                    const rankColor = idx === 0 ? '#f59e0b' : idx === 1 ? '#9ca3af' : idx === 2 ? '#b45309' : '#4b5563'
                    return (
                      <tr key={p.id} style={{ borderBottom: '1px solid #1a1d27', background: idx % 2 === 0 ? 'transparent' : '#12151f' }}>
                        <td style={{ padding: '7px 10px', color: rankColor, fontWeight: 700, fontSize: 14 }}>#{idx + 1}</td>
                        <td style={{ padding: '7px 10px', color: '#9ca3af', whiteSpace: 'nowrap' }}>{new Date(p.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</td>
                        <td style={{ padding: '7px 10px', color: '#e5e7eb', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.caption ? p.caption.substring(0, 70) + (p.caption.length > 70 ? '...' : '') : '—'}</td>
                        <td style={{ padding: '7px 10px' }}><span style={{ background: p.media_type === 'CAROUSEL_ALBUM' ? '#312e81' : '#064e3b', color: p.media_type === 'CAROUSEL_ALBUM' ? '#818cf8' : '#34d399', borderRadius: 4, padding: '2px 6px', fontSize: 10 }}>{p.media_type === 'CAROUSEL_ALBUM' ? 'Carousel' : p.media_type === 'VIDEO' ? 'Reel' : 'Image'}</span></td>
                        <td style={{ padding: '7px 10px', color: '#f59e0b' }}>{(p.like_count || 0).toLocaleString()}</td>
                        <td style={{ padding: '7px 10px', color: '#ec4899', fontWeight: 700 }}>{(p.comments_count || 0).toLocaleString()}</td>
                        <td style={{ padding: '7px 10px', color: '#6366f1', fontWeight: 600 }}>{engagement.toLocaleString()}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {activeTab === 'publish' && (
        <div style={card}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, color: '#e5e7eb' }}>Publish to Instagram</h3>
          <PublishTab />
        </div>
      )}
    </div>
  )
}
