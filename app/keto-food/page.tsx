'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

// Редирект на страницу рецептов - весь функционал теперь там
export default function KetoFoodRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/recipes')
  }, [router])

  return (
    <div className="min-h-screen pt-20 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-accent-mint mx-auto mb-4" />
        <p className="text-white/60">Перенаправление на рецепты...</p>
      </div>
    </div>
  )
}
