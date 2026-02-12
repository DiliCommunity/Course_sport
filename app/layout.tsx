import type { Metadata, Viewport } from 'next'
import { Space_Grotesk, Outfit, JetBrains_Mono } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { TelegramProvider } from '@/components/providers/TelegramProvider'
import { VKProvider } from '@/components/providers/VKProvider'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { ReferralTracker } from '@/components/providers/ReferralTracker'
import { ChatButton } from '@/components/ui/ChatButton'
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
  // ВАЖНО для iOS/VK: без viewport-fit=cover safe-area-inset-* часто возвращает 0
  // и фиксированный header может залезать под верхнюю панель.
  viewportFit: 'cover',
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
        {/* VK Bridge Script - VK загружает автоматически, но добавляем для совместимости */}
        {/* НЕ используем strategy="beforeInteractive" - VK должен загрузить свой bridge первым */}
        
        {/* VK Ads Pixel - Top.Mail.Ru counter для отслеживания рекламы */}
        <Script
          id="vk-ads-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              var _tmr = window._tmr || (window._tmr = []);
              _tmr.push({id: "3742277", type: "pageView", start: (new Date()).getTime()});
              (function (d, w, id) {
                if (d.getElementById(id)) return;
                var ts = d.createElement("script"); ts.type = "text/javascript"; ts.async = true; ts.id = id;
                ts.src = "https://top-fwz1.mail.ru/js/code.js";
                var f = function () {var s = d.getElementsByTagName("script")[0]; s.parentNode.insertBefore(ts, s);};
                if (w.opera == "[object Opera]") { d.addEventListener("DOMContentLoaded", f, false); } else { f(); }
              })(document, window, "tmr-code");
            `,
          }}
        />
        <noscript>
          <div>
            <img 
              src="https://top-fwz1.mail.ru/counter?id=3742277;js=na" 
              style={{ position: 'absolute', left: '-9999px' }} 
              alt="Top.Mail.Ru"
              loading="lazy"
            />
          </div>
        </noscript>
        <TelegramProvider>
          <VKProvider>
            <AuthProvider>
            {/* Отслеживание реферальных ссылок */}
            <Suspense fallback={null}>
              <ReferralTracker />
            </Suspense>
            <div className="flex flex-col min-h-screen relative z-10">
              <Header />
              <main className="flex-1 relative z-10">
                {children}
              </main>
              <Footer />
              <ChatButton />
            </div>
            </AuthProvider>
          </VKProvider>
        </TelegramProvider>
      </body>
    </html>
  )
}
