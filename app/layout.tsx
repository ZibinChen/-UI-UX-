import type { Metadata, Viewport } from 'next'
import { Noto_Sans_SC } from 'next/font/google'

import './globals.css'

const notoSansSC = Noto_Sans_SC({
  subsets: ['latin'],
  variable: '--font-noto-sans-sc',
})

export const metadata: Metadata = {
  title: '管理驾驶舱 - 银行报表系统',
  description: '银行管理驾驶舱报表系统',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" className="bg-background" suppressHydrationWarning>
      <body className={`${notoSansSC.variable} font-sans antialiased`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
