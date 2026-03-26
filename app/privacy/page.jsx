export const metadata = {
  title: 'Privacy Policy — Amplify Dashboard',
}

export default function PrivacyPolicy() {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '48px 24px', fontFamily: 'system-ui, sans-serif', color: '#1a1a1a', lineHeight: 1.7 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Privacy Policy</h1>
      <p style={{ color: '#6b7280', marginBottom: 32 }}>Last updated: March 2026</p>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 32 }}>1. Overview</h2>
      <p>
        Amplify Dashboard (&ldquo;the App&rdquo;) is a private analytics dashboard operated by Dr Allan Presland
        (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;). This App is used solely to display
        performance data from the operator&rsquo;s own Instagram account (@allanpresland) and is not
        available to the general public.
      </p>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 32 }}>2. Data We Access</h2>
      <p>
        The App connects to the Meta Graph API to retrieve the following data from the operator&rsquo;s
        own Instagram Business account:
      </p>
      <ul>
        <li>Post content, captions, and media type</li>
        <li>Engagement metrics: likes, comments, impressions, reach, and saves</li>
        <li>Comment text and usernames on public posts</li>
      </ul>
      <p>
        This data is accessed solely for the purpose of displaying analytics to the account owner.
        No data is shared with third parties, sold, or used for advertising purposes.
      </p>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 32 }}>3. Data Storage</h2>
      <p>
        Campaign metrics entered manually by the operator are stored in a private Supabase database
        accessible only to the operator. Instagram data retrieved via the Graph API is not persistently
        stored — it is fetched on demand and displayed in the browser only.
      </p>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 32 }}>4. User Data</h2>
      <p>
        This App does not collect, store, or process personal data from any users other than the
        operator. No login, registration, or personal information is required from visitors.
      </p>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 32 }}>5. Third-Party Services</h2>
      <p>The App uses the following third-party services:</p>
      <ul>
        <li><strong>Meta Graph API</strong> — to retrieve Instagram account data</li>
        <li><strong>Supabase</strong> — for private database storage of campaign metrics</li>
        <li><strong>Vercel</strong> — for hosting and deployment</li>
      </ul>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 32 }}>6. Data Deletion</h2>
      <p>
        As this App accesses only the operator&rsquo;s own Instagram data, no user data deletion
        requests are applicable. If you have questions about data accessed via the Meta Graph API,
        please refer to{' '}
        <a href="https://www.facebook.com/policy.php" style={{ color: '#6366f1' }}>Meta&rsquo;s Data Policy</a>.
      </p>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 32 }}>7. Contact</h2>
      <p>
        For any questions regarding this privacy policy, please contact:{' '}
        <a href="mailto:allan@allanpresland.com" style={{ color: '#6366f1' }}>allan@allanpresland.com</a>
      </p>
    </div>
  )
}
