'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Редирект на статический сайт
    window.location.href = '/index.html'
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-900 text-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-electric mx-auto mb-4"></div>
        <p>Загрузка...</p>
      </div>
    </div>
  )
}
