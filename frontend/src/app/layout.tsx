import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Apple Music Experience',
  description: 'Apple Music 风格音乐播放器 — 搜索、播放、歌词同步',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'Music Player',
    statusBarStyle: 'black-translucent',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#000000',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-touch-fullscreen" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Music Player" />
        <meta name="apple-mobile-web-app-title" content="Music Player" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="apple-touch-icon" sizes="152x152" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%23000'/><text y='75' font-size='70' text-anchor='middle' x='50'>🎵</text></svg>" />
        <link rel="apple-touch-startup-image" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 393 852'><rect width='393' height='852' fill='%23000'/></svg>" media="(device-width: 393px) and (device-height: 852px)" />
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_API_HOST || 'http://localhost:4000'} />
        <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_API_HOST || 'http://localhost:4000'} />
        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js').catch(() => {});
              });
            }
          `,
        }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
