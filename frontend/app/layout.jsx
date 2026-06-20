import './globals.css'

export const metadata = {
  title: 'PIXEL DJ MIXER',
  description: 'Retro Arcade AI DJ Mixer — mix, analyse, and export tracks',
  icons: { icon: '/favicon.svg' },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Share+Tech+Mono&display=swap" rel="stylesheet" />
      </head>
      <body className="crt-screen">
        {children}
      </body>
    </html>
  )
}
