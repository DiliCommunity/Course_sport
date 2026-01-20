'use client'

export default function TestPage() {
  return (
    <div className="min-h-screen pt-20 flex items-center justify-center bg-dark-900 text-white">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Сайт работает! ✅</h1>
        <p className="text-xl text-white/60">Если ты видишь это сообщение, значит сайт загружается корректно.</p>
        <a href="/" className="mt-8 inline-block px-6 py-3 bg-accent-electric text-dark-900 rounded-lg font-semibold hover:bg-accent-neon transition-colors">
          Вернуться на главную
        </a>
      </div>
    </div>
  )
}

