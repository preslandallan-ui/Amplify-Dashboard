'use client';
import { useState, useEffect, useCallback, Fragment } from 'react';

const STATUS_STYLES = {
  scripted: { bg: 'bg-gray-700', text: 'text-gray-300', label: 'Scripted' },
  'video ready': { bg: 'bg-yellow-900/60', text: 'text-yellow-300', label: 'Video ready' },
  processing: { bg: 'bg-blue-900/60', text: 'text-blue-300', label: 'Processing…' },
  published: { bg: 'bg-green-900/60', text: 'text-green-300', label: 'Published' },
  failed: { bg: 'bg-red-900/60', text: 'text-red-300', label: 'Failed' },
};

function StatusPill({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.scripted;
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
}

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function PublishTab() {
  const [rows, setRows] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shipping, setShipping] = useState(null); // day being shipped
  const [shipResult, setShipResult] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/reels/list', { cache: 'no-store' });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'load failed');
      setRows(json.data || []);
      setRecent(json.recent || []);
      setError(null);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Auto-poll while any row is processing
  useEffect(() => {
    const hasProcessing = rows.some((r) => r.status === 'processing') || shipping;
    if (!hasProcessing) return;
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [rows, shipping, load]);

  const ship = async (day) => {
    if (!confirm(`Publish Day ${day} Reel to Instagram NOW?\n\nThis posts live to @allanpresland and cannot be undone (only deleted after).`)) return;
    setShipping(day);
    setShipResult(null);
    try {
      const res = await fetch('/api/admin/reels/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day }),
      });
      const data = await res.json();
      setShipResult({ day, ...data });
      await load();
    } catch (e) {
      setShipResult({ day, success: false, error: e.message });
    }
    setShipping(null);
  };

  if (loading) return <div className="text-gray-400">Loading reels…</div>;
  if (error) return <div className="text-red-400">Error: {error}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-1">Reels Pipeline</h2>
        <p className="text-sm text-gray-400">
          Scripts pulled from <code className="text-gray-300">reel_scripts</code>. Days 1–70 are scheduled content; 100+ are specials. Upload videos to <code className="text-gray-300">reels/day-N/REEL-N.mp4</code> via Supabase Storage, then click Ship.
        </p>
      </div>

      <div className="rounded-lg border border-gray-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-800 text-gray-300">
            <tr>
              <th className="text-left px-4 py-2">Day</th>
              <th className="text-left px-4 py-2">Title</th>
              <th className="text-left px-4 py-2">Trigger</th>
              <th className="text-left px-4 py-2">Status</th>
              <th className="text-left px-4 py-2">Published</th>
              <th className="text-right px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-500">No reel scripts yet.</td></tr>
            )}
            {rows.map((r) => (
              <Fragment key={r.day}>
                <tr className="border-t border-gray-700 hover:bg-gray-800/50">
                  <td className="px-4 py-3 font-mono text-gray-300">{r.day}</td>
                  <td className="px-4 py-3 text-white">
                    <button
                      onClick={() => setExpandedRow(expandedRow === r.day ? null : r.day)}
                      className="text-left hover:underline"
                    >
                      {r.title}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-purple-900/60 text-purple-300">
                      {r.trigger}
                    </span>
                  </td>
                  <td className="px-4 py-3"><StatusPill status={r.status} /></td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{formatTime(r.published_at)}</td>
                  <td className="px-4 py-3 text-right">
                    {r.status === 'video ready' && (
                      <button
                        onClick={() => ship(r.day)}
                        disabled={shipping === r.day}
                        className="px-3 py-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded text-xs font-medium"
                      >
                        {shipping === r.day ? '⏳ Shipping…' : '🚀 Ship now'}
                      </button>
                    )}
                    {r.status === 'published' && r.post_id && (
                      <span className="text-xs text-gray-500 font-mono">{r.post_id}</span>
                    )}
                    {r.status === 'failed' && (
                      <button
                        onClick={() => ship(r.day)}
                        className="px-3 py-1 bg-red-700 hover:bg-red-600 text-white rounded text-xs font-medium"
                      >
                        Retry
                      </button>
                    )}
                    {r.status === 'scripted' && (
                      <span className="text-xs text-gray-500">Upload video to ship</span>
                    )}
                  </td>
                </tr>
                {expandedRow === r.day && (
                  <tr className="bg-gray-900/50">
                    <td colSpan={6} className="px-4 py-4">
                      <div className="space-y-3">
                        <div>
                          <div className="text-xs uppercase text-gray-500 mb-1">Hook (caption body)</div>
                          <pre className="text-xs text-gray-300 whitespace-pre-wrap font-sans">{r.hook}</pre>
                        </div>
                        <div>
                          <div className="text-xs uppercase text-gray-500 mb-1">CTA</div>
                          <pre className="text-xs text-gray-300 whitespace-pre-wrap font-sans">{r.cta}</pre>
                        </div>
                        {r.storage_path && (
                          <div className="text-xs text-gray-500">
                            <span className="uppercase">Video:</span> <code>{r.storage_path}</code>
                          </div>
                        )}
                        {r.publish_error && (
                          <div className="text-xs text-red-400">
                            <span className="uppercase">Last error:</span> {r.publish_error}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {shipResult && (
        <div className={`p-4 rounded-lg ${shipResult.success ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'}`}>
          {shipResult.success
            ? `✅ Day ${shipResult.day} shipped. post_id: ${shipResult.post_id}`
            : `❌ Day ${shipResult.day} failed: ${shipResult.error || 'unknown'}${shipResult.hint ? ' — ' + shipResult.hint : ''}`}
        </div>
      )}

      <div>
        <h3 className="text-base font-semibold text-white mb-2">Recent activity</h3>
        <div className="rounded-lg border border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-800 text-gray-300">
              <tr>
                <th className="text-left px-4 py-2">When</th>
                <th className="text-left px-4 py-2">Day</th>
                <th className="text-left px-4 py-2">Status</th>
                <th className="text-left px-4 py-2">post_id / error</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-4 text-center text-gray-500">No publish history yet.</td></tr>
              )}
              {recent.map((p, i) => (
                <tr key={i} className="border-t border-gray-700">
                  <td className="px-4 py-2 text-gray-400 text-xs">{formatTime(p.published_at || p.created_at)}</td>
                  <td className="px-4 py-2 font-mono text-gray-300">{p.day}</td>
                  <td className="px-4 py-2"><StatusPill status={p.status} /></td>
                  <td className="px-4 py-2 text-xs text-gray-400 font-mono">{p.post_id || p.error || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
