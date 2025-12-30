import type { Metadata, Viewport } from 'next'
import { Space_Grotesk, Outfit, JetBrains_Mono } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import './new-year-theme.css' // 🎄 Новогодняя тема
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { TelegramProvider } from '@/components/providers/TelegramProvider'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { NewYearTheme } from '@/components/ui/NewYearTheme'
import { ReferralTracker } from '@/components/providers/ReferralTracker'
import React, { Suspense } from 'react'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-space-grotesk',
  display: 'swap',
})

const outfit = Outfit({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-outfit',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-jetbrains',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Course Health | Кето-диета и интервальное голодание',
  description: 'Премиум курсы по кето-диете, интервальному голоданию и здоровому питанию от лучших экспертов',
  keywords: ['кето-диета', 'интервальное голодание', 'здоровое питание', 'курсы', 'онлайн обучение'],
  authors: [{ name: 'Course Health Team' }],
  openGraph: {
    title: 'Course Health | Кето-диета и интервальное голодание',
    description: 'Премиум курсы по кето-диете, интервальному голоданию и здоровому питанию',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0a0a0b',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru" className={`${spaceGrotesk.variable} ${outfit.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-dark-900 text-white font-body antialiased relative">
        {/* Telegram WebApp Script - загружается автоматически Telegram, но добавляем для надёжности */}
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
        <TelegramProvider>
          <AuthProvider>
            {/* Отслеживание реферальных ссылок */}
            <Suspense fallback={null}>
              <ReferralTracker />
            </Suspense>
            {/* 🎄 Новогодняя тема - автоматически активируется с 20 декабря по 15 января */}
            <NewYearTheme />
            <div className="flex flex-col min-h-screen relative z-10">
              <Header />
              <main className="flex-1 relative z-10">
                {children}
              </main>
              <Footer />
            </div>
          </AuthProvider>
        </TelegramProvider>
      </body>
    </html>
  )
}
