'use client'

import { motion } from 'framer-motion'
import { Play, Download, CheckCircle2, X, FileText, Video, Image as ImageIcon } from 'lucide-react'
import { Button } from './Button'
import { formatDuration } from '@/lib/utils'

interface FreeLesson {
  id: string
  title: string
  type: 'video' | 'text' | 'infographic'
  duration?: number
  content: string
  checklist?: string[]
  bonus?: {
    title: string
    type: 'pdf' | 'calculator' | 'guide'
    description: string
  }
}

interface PaidModule {
  title: string
  description: string
}

interface FreeModuleProps {
  courseId: string
  moduleTitle: string
  lessons: FreeLesson[]
  paidModules: PaidModule[]
  onClose?: () => void
  onPurchase?: () => void
}

export function FreeModule({
  courseId,
  moduleTitle,
  lessons,
  paidModules,
  onClose,
  onPurchase,
}: FreeModuleProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="w-5 h-5" />
      case 'text':
        return <FileText className="w-5 h-5" />
      case 'infographic':
        return <ImageIcon className="w-5 h-5" />
      default:
        return <FileText className="w-5 h-5" />
    }
  }

  const getBonusIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <Download className="w-5 h-5" />
      case 'calculator':
        return <FileText className="w-5 h-5" />
      case 'guide':
        return <FileText className="w-5 h-5" />
      default:
        return <FileText className="w-5 h-5" />
    }
  }

  return (
    <div className="space-y-8">
      {/* Module Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="badge badge-neon mb-3">Бесплатный модуль</div>
            <h2 className="font-display font-bold text-3xl text-white mb-2">
              {moduleTitle}
            </h2>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>
        <p className="text-white/70 text-lg">
          Изучите основы бесплатно и решите, готовы ли вы получить полный доступ к курсу
        </p>
      </motion.div>

      {/* Free Lessons */}
      <div className="space-y-6">
        {lessons.map((lesson, index) => (
          <motion.div
            key={lesson.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card p-6 space-y-4"
          >
            {/* Lesson Header */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent-neon/20 flex items-center justify-center flex-shrink-0">
                {getIcon(lesson.type)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-display font-bold text-xl text-white">
                    Урок {index + 1}: {lesson.title}
                  </h3>
                  {lesson.duration && (
                    <span className="text-white/50 text-sm">
                      {formatDuration(lesson.duration)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Lesson Content */}
            <div className="prose prose-invert max-w-none">
              {lesson.content.split('\n\n').map((paragraph, pIndex) => {
                // Обработка жирного текста
                const parts = paragraph.split(/(\*\*.*?\*\*)/g)
                return (
                  <p key={pIndex} className="text-white/70 leading-relaxed mb-4">
                    {parts.map((part, partIndex) => {
                      if (part.startsWith('**') && part.endsWith('**')) {
                        return (
                          <strong key={partIndex} className="text-white font-semibold">
                            {part.slice(2, -2)}
                          </strong>
                        )
                      }
                      return <span key={partIndex}>{part}</span>
                    })}
                  </p>
                )
              })}
            </div>

            {/* Checklist */}
            {lesson.checklist && lesson.checklist.length > 0 && (
              <div className="p-4 rounded-xl bg-accent-neon/10 border border-accent-neon/20">
                <h4 className="font-semibold text-white mb-3">Чек-лист:</h4>
                <ul className="space-y-2">
                  {lesson.checklist.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-accent-neon flex-shrink-0 mt-0.5" />
                      <span className="text-white/70">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Bonus */}
            {lesson.bonus && (
              <div className="p-4 rounded-xl bg-accent-electric/10 border border-accent-electric/20">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent-electric/20 flex items-center justify-center flex-shrink-0">
                    {getBonusIcon(lesson.bonus.type)}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-white mb-1">
                      🎁 Ваш бесплатный бонус: {lesson.bonus.title}
                    </div>
                    <div className="text-sm text-white/70 mb-3">
                      {lesson.bonus.description}
                    </div>
                    <Button variant="secondary" size="sm">
                      {lesson.bonus.type === 'pdf' ? 'Скачать PDF' : 'Открыть'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Paid Modules Preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: lessons.length * 0.1 }}
        className="card p-6 space-y-4"
      >
        <h3 className="font-display font-bold text-2xl text-white">
          Что ждет вас в платной части курса:
        </h3>
        <div className="space-y-4">
          {paidModules.map((module, index) => (
            <div key={index} className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent-teal/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-accent-teal font-bold">{index + 1}</span>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-1">{module.title}</h4>
                  <p className="text-white/70 text-sm">{module.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* CTA Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: (lessons.length + 1) * 0.1 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <Button className="flex-1" size="lg" onClick={onPurchase}>
          Приобрести полный доступ
        </Button>
        <Button variant="secondary" className="flex-1" size="lg" onClick={onPurchase}>
          Забронировать место со скидкой
        </Button>
      </motion.div>
    </div>
  )
}

