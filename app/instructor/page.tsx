'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/components/providers/AuthProvider'
import { ArrowLeft, Send, Loader2, Bot, User, Lock, Users } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import Image from 'next/image'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface Instructor {
  id: string
  name: string
  avatar: string
  specialization: string
  description: string
}

const INSTRUCTORS: Instructor[] = [
  {
    id: 'anna',
    name: 'Анна Здоровьева',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200',
    specialization: 'Кето-диета и метаболическое здоровье',
    description: 'Эксперт по кето-диете, поможет с расчетом макросов, рецептами и адаптацией к кетозу'
  },
  {
    id: 'dmitry',
    name: 'Дмитрий Фастинг',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    specialization: 'Интервальное голодание и долголетие',
    description: 'Специалист по IF, поможет выбрать протокол, настроить режим и преодолеть трудности'
  },
  {
    id: 'general',
    name: 'Алексей Помощник',
    avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=200',
    specialization: 'Помощник по сайту и общие вопросы',
    description: 'Поможет с навигацией по сайту, приложениями, ссылками и общими вопросами по здоровью'
  }
]

export default function InstructorPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [hasAccess, setHasAccess] = useState(false)
  const [checkingAccess, setCheckingAccess] = useState(true)
  const [userName, setUserName] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Загружаем сохранённое имя из localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedName = localStorage.getItem('instructor_chat_user_name')
      if (savedName) {
        setUserName(savedName)
      }
    }
  }, [])

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      router.push('/login')
      return
    }

    checkAccess()
  }, [user, authLoading])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const checkAccess = async () => {
    // Если пользователь админ - сразу даём доступ
    if (user?.is_admin) {
      console.log('[InstructorPage] User is admin - full access granted')
      setHasAccess(true)
      setCheckingAccess(false)
      return
    }

    try {
      const response = await fetch('/api/courses/access?check_purchased=true', {
        credentials: 'include'
      })
      const data = await response.json()
      // Админ или купил курс
      setHasAccess(data.hasPurchased === true || data.isAdmin === true)
    } catch (error) {
      console.error('Error checking access:', error)
      setHasAccess(false)
    } finally {
      setCheckingAccess(false)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || loading || !hasAccess || !selectedInstructor) return

    const userMessageContent = input.trim()
    
    // Пытаемся извлечь имя из сообщения пользователя
    let extractedName = userName
    const namePatterns = [
      /(?:меня|мене) зовут ([А-Яа-яЁёA-Za-z]+)/i,
      /зовут ([А-Яа-яЁёA-Za-z]+)/i,
      /я ([А-Яа-яЁёA-Za-z]+)/i,
      /обращайся ([А-Яа-яЁёA-Za-z]+)/i,
      /называй ([А-Яа-яЁёA-Za-z]+)/i,
    ]
    
    for (const pattern of namePatterns) {
      const match = userMessageContent.match(pattern)
      if (match && match[1]) {
        extractedName = match[1]
        // Сохраняем имя в localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('instructor_chat_user_name', extractedName)
        }
        setUserName(extractedName)
        break
      }
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessageContent,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/instructor/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          message: userMessage.content,
          instructorId: selectedInstructor?.id || 'general',
          conversationHistory: messages.map(m => ({
            role: m.role,
            content: m.content
          })),
          userName: extractedName
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || 'Извините, произошла ошибка. Попробуйте еще раз.',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
      
      // Пытаемся извлечь имя из ответа инструктора (если он подтвердил имя)
      const responseContent = data.response || ''
      const nameConfirmationPattern = /(?:отлично|хорошо|понял|поняла),?\s+([А-Яа-яЁёA-Za-z]+)!/i
      const nameMatch = responseContent.match(nameConfirmationPattern)
      if (nameMatch && nameMatch[1] && !extractedName) {
        const confirmedName = nameMatch[1]
        if (typeof window !== 'undefined') {
          localStorage.setItem('instructor_chat_user_name', confirmedName)
        }
        setUserName(confirmedName)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Извините, произошла ошибка при отправке сообщения. Пожалуйста, попробуйте еще раз.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Функция для парсинга сообщений с Markdown ссылками
  const parseMessageWithLinks = (text: string) => {
    // Паттерн для Markdown ссылок: [текст](/ссылка)
    const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g
    const parts: (string | JSX.Element)[] = []
    let lastIndex = 0
    let match
    let key = 0

    while ((match = linkPattern.exec(text)) !== null) {
      // Добавляем текст до ссылки
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index))
      }
      
      // Добавляем ссылку
      const linkText = match[1]
      const linkUrl = match[2]
      parts.push(
        <Link
          key={key++}
          href={linkUrl}
          className="text-accent-teal hover:text-accent-teal/80 underline font-medium"
        >
          {linkText}
        </Link>
      )
      
      lastIndex = match.index + match[0].length
    }

    // Добавляем оставшийся текст
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex))
    }

    return parts.length > 0 ? parts : text
  }

  if (authLoading || checkingAccess) {
    return (
      <main className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-accent-teal animate-spin mx-auto mb-4" />
          <p className="text-white/60">Загрузка...</p>
        </div>
      </main>
    )
  }

  if (!hasAccess) {
    return (
      <main className="min-h-screen pt-20 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
          >
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-8"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Назад</span>
            </Link>

            <div className="rounded-2xl glass border border-white/10 p-8 text-center">
              <Lock className="w-16 h-16 text-accent-gold mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white mb-4">Доступ ограничен</h1>
              <p className="text-white/70 mb-6">
                Чат с AI-инструктором доступен только для пользователей, которые приобрели хотя бы один курс.
              </p>
              <Link href="/courses">
                <Button>Посмотреть курсы</Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen pt-28 pb-16 bg-gradient-to-b from-dark-900 via-dark-800 to-dark-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Назад</span>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <Bot className="w-8 h-8 text-accent-teal" />
            <h1 className="text-3xl font-display font-bold text-white">Мой инструктор</h1>
          </div>
          <p className="text-white/60">
            Выберите инструктора и получите персональные рекомендации по кето-диете и интервальному голоданию!
          </p>
        </motion.div>

        {/* Instructor Selection */}
        {!selectedInstructor ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <h2 className="text-xl font-bold text-white mb-4">Выберите инструктора</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {INSTRUCTORS.map((instructor) => (
                <motion.button
                  key={instructor.id}
                  onClick={() => setSelectedInstructor(instructor)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="rounded-xl glass border border-white/10 p-6 text-left hover:border-accent-teal/50 transition-all"
                >
                  <div className="relative w-20 h-20 rounded-full overflow-hidden mx-auto mb-4 ring-2 ring-accent-teal/30">
                    <Image
                      src={instructor.avatar}
                      alt={instructor.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <h3 className="font-bold text-white text-center mb-2">{instructor.name}</h3>
                  <p className="text-accent-teal text-sm text-center mb-3">{instructor.specialization}</p>
                  <p className="text-white/60 text-sm text-center">{instructor.description}</p>
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="rounded-xl glass border border-white/10 p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 rounded-full overflow-hidden ring-2 ring-accent-teal/30">
                  <Image
                    src={selectedInstructor.avatar}
                    alt={selectedInstructor.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-white">{selectedInstructor.name}</h3>
                  <p className="text-accent-teal text-sm">{selectedInstructor.specialization}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedInstructor(null)
                  setMessages([])
                  // Не очищаем имя при смене инструктора - оно остается сохранённым
                }}
                className="text-white/60 hover:text-white transition-colors text-sm"
              >
                Выбрать другого
              </button>
            </div>
          </motion.div>
        )}

        {/* Chat Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl glass border border-white/10 overflow-hidden flex flex-col"
          style={{ height: 'calc(100vh - 280px)', minHeight: '500px' }}
        >
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {!selectedInstructor ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Users className="w-16 h-16 text-accent-teal mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">Выберите инструктора</h2>
                <p className="text-white/60 max-w-md">
                  Выберите инструктора выше, чтобы начать общение
                </p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="relative w-20 h-20 rounded-full overflow-hidden mb-4 ring-2 ring-accent-teal/30">
                  <Image
                    src={selectedInstructor.avatar}
                    alt={selectedInstructor.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Привет! Я {selectedInstructor.name.split(' ')[0]}</h2>
                <p className="text-white/60 max-w-md">
                  {selectedInstructor.description}. Задавайте любые вопросы, и я помогу вам!
                </p>
              </div>
            ) : (
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.role === 'assistant' && selectedInstructor && (
                      <div className="relative w-8 h-8 rounded-full overflow-hidden ring-2 ring-accent-teal/30 flex-shrink-0">
                        <Image
                          src={selectedInstructor.avatar}
                          alt={selectedInstructor.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl p-4 ${
                        message.role === 'user'
                          ? 'bg-gradient-to-r from-accent-mint to-accent-teal text-dark-900'
                          : 'bg-white/5 text-white border border-white/10'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">
                        {parseMessageWithLinks(message.content)}
                      </p>
                      <span className="text-xs opacity-60 mt-2 block">
                        {message.timestamp.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {message.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-accent-mint/20 flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-accent-mint" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
            {loading && selectedInstructor && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3"
              >
                <div className="relative w-8 h-8 rounded-full overflow-hidden ring-2 ring-accent-teal/30 flex-shrink-0">
                  <Image
                    src={selectedInstructor.avatar}
                    alt={selectedInstructor.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="bg-white/5 text-white border border-white/10 rounded-2xl p-4">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-accent-teal rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-accent-teal rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-accent-teal rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-white/10 p-4">
            <div className="flex gap-3">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Задайте вопрос..."
                className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-accent-mint/50 focus:ring-2 focus:ring-accent-mint/20 transition-all resize-none"
                rows={1}
                disabled={loading || !hasAccess || !selectedInstructor}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading || !hasAccess}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-accent-mint to-accent-teal text-dark-900 font-medium hover:shadow-lg hover:shadow-accent-mint/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  )
}

