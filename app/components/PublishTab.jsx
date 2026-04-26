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

function CopyButton({ text, label = 'Copy' }) {
  const [copied, setCopied] = useState(false);
  if (!text) return null;
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch (e) {
          // fallback
          const ta = document.createElement('textarea');
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }
      }}
      className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded text-xs font-medium"
    >
      {copied ? '✓ Copied' : `📋 ${label}`}
    </button>
  );
}

function Field({ label, text, copyable }) {
  if (!text) return null;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="text-xs uppercase text-gray-500 tracking-wide">{label}</div>
        {copyable && <CopyButton text={text} />}
      </div>
      <pre className="text-xs text-gray-300 whitespace-pre-wrap font-sans bg-gray-900/40 border border-gray-800 rounded p-3 max-h-72 overflow-y-auto">{text}</pre>
    </div>
  );
}

export default function PublishTab() {
  const [rows, setRows] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shipping, setShipping] = useState(null);
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

  useEffect(() => { load(); }, [load]);

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
          Click a row to see the script, Seedance prompt, and (once uploaded) video preview. Days 1–70 are scheduled content; 100+ are specials. Upload videos to <code className="text-gray-300">reels/day-N/REEL-N.mp4</code> via Supabase Storage, then click Ship.
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
                      {expandedRow === r.day ? '▾ ' : '▸ '}{r.title}
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
                    <td colSpan={6} className="px-4 py-5">
                      <div className="space-y-4">
                        {r.video_url && (
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <div className="text-xs uppercase text-gray-500 tracking-wide">Video — review before shipping</div>
                              <a
                                href={r.video_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded text-xs font-medium"
                              >
                                ↗ Open in new tab
                              </a>
                            </div>
                            <video
                              src={r.video_url}
                              controls
                              preload="metadata"
                              className="rounded border border-gray-700 max-h-[480px] bg-black"
                              style={{ aspectRatio: '9/16', width: 'auto' }}
                            />
                            <div className="text-xs text-gray-500 mt-1 font-mono">{r.storage_path}</div>
                          </div>
                        )}

                        <Field label="Hook (IG caption)" text={r.hook} copyable />
                        <Field label="CTA" text={r.cta} copyable />
                        <Field label="Voice-over text" text={r.voiceover_text} copyable />
                        <Field label="Body / scene notes" text={r.body} copyable />
                        <Field label="🎬 Seedance prompt — paste this into Higgsfield" text={r.seedance_prompt} copyable />

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
