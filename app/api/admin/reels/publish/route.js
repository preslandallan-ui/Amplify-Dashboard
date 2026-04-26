const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

export const maxDuration = 60 // Vercel Pro: 60s. Function may continue server-side past this.

export async function POST(request) {
  try {
    const { day } = await request.json()
    if (!day) {
      return Response.json({ success: false, error: 'day required' }, { status: 400 })
    }

    const url = `${SUPABASE_URL}/functions/v1/publish-reel?day=${day}`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
      body: JSON.stringify({}),
    })

    let data = {}
    try {
      data = await res.json()
    } catch {
      data = { error: 'Non-JSON response from publish-reel' }
    }

    return Response.json({ success: res.ok, ...data }, { status: res.status })
  } catch (err) {
    // Even on Vercel timeout, the edge function continues — client should poll list endpoint.
    return Response.json(
      { success: false, error: err.message, hint: 'Edge function may still be running. Refresh list to see status.' },
      { status: 500 }
    )
  }
}
