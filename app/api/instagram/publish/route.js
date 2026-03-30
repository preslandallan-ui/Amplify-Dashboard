'use client';
import { useState } from 'react';

export default function PublishTab() {
  const [mode, setMode] = useState('single');
  const [caption, setCaption] = useState('');
  const [imageUrls, setImageUrls] = useState(['']);
  const [publishing, setPublishing] = useState(false);
  const [result, setResult] = useState(null);

  const handleUrlChange = (i, val) => {
    const urls = [...imageUrls];
    urls[i] = val;
    setImageUrls(urls);
  };

  const publish = async () => {
    setPublishing(true);
    setResult(null);
    try {
      const res = await fetch('/api/instagram/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: mode,
          imageUrl: imageUrls[0],
          imageUrls: imageUrls.filter(u => u.trim()),
          caption
        })
      });
      const data = await res.json();
      setResult(data.success ? { success: true, postId: data.postId } : { error: data.error });
      if (data.success) { setCaption(''); setImageUrls(['']); }
    } catch (e) {
      setResult({ error: e.message });
    }
    setPublishing(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <button onClick={() => setMode('single')} className={`px-4 py-2 rounded-lg ${mode === 'single' ? 'bg-orange-500 text-white' : 'bg-gray-700 text-gray-300'}`}>Single Image</button>
        <button onClick={() => setMode('carousel')} className={`px-4 py-2 rounded-lg ${mode === 'carousel' ? 'bg-orange-500 text-white' : 'bg-gray-700 text-gray-300'}`}>Carousel</button>
      </div>
      
      <div>
        <label className="block text-gray-300 mb-2">Image URL(s)</label>
        {imageUrls.map((url, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <input type="url" value={url} onChange={e => handleUrlChange(i, e.target.value)} placeholder="https://..." className="flex-1 bg-gray-800 text-white border border-gray-600 rounded-lg px-4 py-2" />
            {mode === 'carousel' && imageUrls.length > 1 && <button onClick={() => setImageUrls(imageUrls.filter((_, j) => j !== i))} className="px-3 bg-red-600 text-white rounded-lg">✕</button>}
          </div>
        ))}
        {mode === 'carousel' && imageUrls.length < 10 && <button onClick={() => setImageUrls([...imageUrls, ''])} className="text-orange-400">+ Add image</button>}
      </div>

      <div>
        <label className="block text-gray-300 mb-2">Caption</label>
        <textarea value={caption} onChange={e => setCaption(e.target.value)} rows={4} placeholder="Write caption... include Comment INSIGHT" className="w-full bg-gray-800 text-white border border-gray-600 rounded-lg px-4 py-2" />
      </div>

      <button onClick={publish} disabled={publishing} className="px-6 py-3 bg-orange-500 text-white rounded-lg font-medium disabled:opacity-50">
        {publishing ? '⏳ Publishing...' : '🚀 Publish Now'}
      </button>

      {result && (
        <div className={`p-4 rounded-lg ${result.success ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'}`}>
          {result.success ? `✅ Published! ID: ${result.postId}` : `❌ ${result.error}`}
        </div>
      )}
    </div>
  );
}
