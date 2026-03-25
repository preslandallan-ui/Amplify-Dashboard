'use client'
import { useState } from 'react'

const HOOKS = Array.from({ length: 100 }, (_, i) => ({
  id: i + 1,
  structure: i % 2 === 0 ? 'Story-First' : 'Stat-First',
  cta: i % 3 === 0 ? 'BOOK' : i % 3 === 1 ? 'INSIGHT' : 'COURSE',
}))

const initialWeekData = {
  impressions: 0, comments: 0, clicks: 0, signups: 0, revenue: 0
}

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

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [weeks, setWeeks] = useState(
    Array.from({ length: 10 }, (_, i) => ({ week: i + 1, ...initialWeekData }))
  )
  const [hookData, setHookData] = useState(
    HOOKS.map(h => ({ ...h, impressions: 0, comments: 0, saves: 0, shares: 0 }))
  )
  const [editingWeek, setEditingWeek] = useState(null)
  const [draft, setDraft] = useState({})

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

  const saveWeek = (weekNum) => {
    setWeeks(prev => prev.map(w => w.week === weekNum ? { ...w, ...draft } : w))
    setEditingWeek(null)
    setDraft({})
  }

  const tabs = ['overview', 'weekly', 'hooks', 'funnel']

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: '#fff' }}>Amplify Dashboard</h1>
        <p style={{ color: '#6b7280', fontSize: 14, margin: '4px 0 0' }}>EYbi Campaign · Amplify Training FZE</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setActiveTab(t)} style={{
            padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: 13, textTransform: 'capitalize',
            background: activeTab === t ? '#6366f1' : '#1a1d27',
            color: activeTab === t ? '#fff' : '#9ca3af',
          }}>{t}</button>
        ))}
      </div>

      {activeTab === 'ov
