import type { Metadata, Viewport } from 'next'
import { Space_Grotesk, Outfit, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { TelegramProvider } from '@/components/providers/TelegramProvider'
import { AuthProvider } from '@/components/providers/AuthProvider'
import React from 'react'

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
  title: 'Course Sport | Профессиональные курсы по спорту',
  description: 'Премиум курсы по фитнесу, тренировкам и здоровому образу жизни от лучших тренеров',
  keywords: ['спорт', 'фитнес', 'тренировки', 'курсы', 'онлайн обучение'],
  authors: [{ name: 'Course Sport Team' }],
  openGraph: {
    title: 'Course Sport | Профессиональные курсы по спорту',
    description: 'Премиум курсы по фитнесу, тренировкам и здоровому образу жизни',
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
      <body className="bg-dark-900 text-white font-body antialiased">
        <ErrorBoundary>
          <TelegramProvider>
            <AuthProvider>
              <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-1">
                  {children}
                </main>
                <Footer />
              </div>
            </AuthProvider>
          </TelegramProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}


