import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export const dynamic = 'force-dynamic'

const STORAGE_BASE = 'https://fexqxblelamfyfcldtzs.supabase.co/storage/v1/object/public/reels'

export async function GET() {
  try {
    const { data: scripts, error: sErr } = await supabase
      .from('reel_scripts')
      .select('day, title, trigger, production_type, hook, body, cta, voiceover_text, seedance_prompt, updated_at')
      .order('day', { ascending: true })
    if (sErr) throw sErr

    const { data: gens } = await supabase
      .from('reel_generation_log')
      .select('day, status, storage_path, completed_at')

    const { data: pubs } = await supabase
      .from('reel_publish_log')
      .select('day, status, post_id, error, published_at, created_at')
      .order('created_at', { ascending: false })

    const latestPubByDay = {}
    ;(pubs || []).forEach((p) => {
      if (!latestPubByDay[p.day]) latestPubByDay[p.day] = p
    })

    const rows = (scripts || []).map((s) => {
      const gen = (gens || []).find((g) => g.day === s.day)
      const pub = latestPubByDay[s.day]
      let status = 'scripted'
      if (pub?.status === 'published') status = 'published'
      else if (pub?.status === 'processing') status = 'processing'
      else if (pub?.status === 'failed') status = 'failed'
      else if (gen?.status === 'uploaded') status = 'video ready'

      const hasUploadedVideo = gen?.status === 'uploaded'
      return {
        day: s.day,
        title: s.title,
        trigger: s.trigger,
        production_type: s.production_type,
        hook: s.hook,
        body: s.body,
        cta: s.cta,
        voiceover_text: s.voiceover_text,
        seedance_prompt: s.seedance_prompt,
        status,
        storage_path: hasUploadedVideo ? gen.storage_path : null,
        video_url: hasUploadedVideo && gen.storage_path ? `${STORAGE_BASE}/${gen.storage_path}` : null,
        post_id: pub?.post_id || null,
        published_at: pub?.published_at || null,
        publish_error: pub?.error || null,
      }
    })

    const recent = (pubs || []).slice(0, 10).map((p) => ({
      day: p.day,
      status: p.status,
      post_id: p.post_id,
      error: p.error,
      published_at: p.published_at,
      created_at: p.created_at,
    }))

    return Response.json({ success: true, data: rows, recent })
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 })
  }
}
