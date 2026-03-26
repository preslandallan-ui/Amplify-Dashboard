import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')

  if (type === 'instagram') {
    try {
      const userId = process.env.INSTAGRAM_USER_ID
      const token = process.env.INSTAGRAM_ACCESS_TOKEN
      const fields = 'id,caption,media_type,timestamp,like_count,comments_count,impressions,reach,saved,shares'
      const url = `https://graph.facebook.com/v25.0/${userId}/media?fields=${fields}&access_token=${token}`
      const res = await fetch(url)
      const data = await res.json()
      return Response.json({ success: true, data: data.data || [] })
    } catch (err) {
      return Response.json({ success: false, error: err.message }, { status: 500 })
    }
  }

  try {
    const { data, error } = await supabase.from('dashboard_metrics').select('*')
    if (error) throw error
    return Response.json({ success: true, data })
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 })
  }
}
