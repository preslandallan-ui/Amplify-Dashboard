export const metadata = {
  title: 'Amplify Dashboard',
  description: 'Amplify Training FZE — Marketing Attribution Dashboard',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#0f1117', color: '#fff' }}>
        {children}
      </body>
    </html>
  )
}
