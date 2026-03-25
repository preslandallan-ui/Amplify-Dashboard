import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    const { data, error } = await supabase.from('dashboard_metrics').select('*')
    if (error) throw error
    return Response.json({ success: true, data })
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 })
  }
}
