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
      const fields = 'id,caption,media_type,timestamp,like_count,comments_count'
      const url = `https://graph.facebook.com/v25.0/${userId}/media?fields=${fields}&limit=25&access_token=${token}`
      const res = await fetch(url)
      const data = await res.json()
      const posts = data.data || []

      // Fetch comments text for each post in parallel
      const postsWithComments = await Promise.all(
        posts.map(async (post) => {
          // Only fetch comments if there are any
          if (!post.comments_count || post.comments_count === 0) {
            return { ...post, comments: [], impressions: null, reach: null, saved: null }
          }
          try {
            const commentsUrl = `https://graph.facebook.com/v25.0/${post.id}/comments?fields=id,text,timestamp,username&limit=50&access_token=${token}`
            const commentsRes = await fetch(commentsUrl)
            const commentsData = await commentsRes.json()
            return {
              ...post,
              comments: commentsData.data || [],
              impressions: null,
              reach: null,
              saved: null,
            }
          } catch {
            return { ...post, comments: [], impressions: null, reach: null, saved: null }
          }
        })
      )

      return Response.json({ success: true, data: postsWithComments })
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
