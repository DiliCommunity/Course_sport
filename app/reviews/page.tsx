'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { Star, Quote, ArrowLeft, Filter, ChevronDown } from 'lucide-react'

// Данные отзывов
const reviews = [
  {
    id: 1,
    name: 'Елена Смирнова',
    avatar: '/img/avatars/user1.jpg',
    rating: 5,
    date: '15 декабря 2025',
    course: 'Кето диета: от Мифов к Результатам',
    text: 'Потрясающий курс! За 3 месяца сбросила 12 кг и чувствую себя прекрасно. Материал подан очень доступно, много практических советов. Особенно понравились рецепты - теперь готовлю только по ним!',
    verified: true,
  },
  {
    id: 2,
    name: 'Алексей Петров',
    avatar: '/img/avatars/user2.jpg',
    rating: 5,
    date: '10 декабря 2025',
    course: 'Интервальное голодание',
    text: 'Начал практиковать ИГ по этому курсу. Уже месяц на схеме 16/8 и результаты потрясающие - минус 6 кг, больше энергии, лучше сплю. Рекомендую всем, кто хочет изменить образ жизни!',
    verified: true,
  },
  {
    id: 3,
    name: 'Марина Козлова',
    avatar: '/img/avatars/user3.jpg',
    rating: 4,
    date: '5 декабря 2025',
    course: 'Кето диета: от Мифов к Результатам',
    text: 'Хороший курс для начинающих. Много полезной информации о кето-диете. Единственное - хотелось бы больше видео-материалов. Но в целом довольна покупкой.',
    verified: true,
  },
  {
    id: 4,
    name: 'Дмитрий Волков',
    avatar: '/img/avatars/user4.jpg',
    rating: 5,
    date: '1 декабря 2025',
    course: 'Интервальное голодание',
    text: 'Скептически относился к ИГ, но курс полностью изменил моё мнение. Научный подход, много исследований, практические рекомендации. За 2 месяца минус 8 кг!',
    verified: true,
  },
  {
    id: 5,
    name: 'Ольга Новикова',
    avatar: '/img/avatars/user5.jpg',
    rating: 5,
    date: '28 ноября 2025',
    course: 'Кето диета: от Мифов к Результатам',
    text: 'Лучшие инвестиции в своё здоровье! Курс очень структурирован, понятные объяснения. Особенно благодарна за раздел про кето-адаптацию - это помогло избежать многих ошибок.',
    verified: true,
  },
  {
    id: 6,
    name: 'Игорь Соколов',
    avatar: '/img/avatars/user6.jpg',
    rating: 4,
    date: '20 ноября 2025',
    course: 'Интервальное голодание',
    text: 'Очень полезный курс! Понравилось, что есть разные схемы голодания на выбор. Выбрал для себя 18/6 и придерживаюсь уже 3 недели. Чувствую себя отлично!',
    verified: true,
  },
  {
    id: 7,
    name: 'Наталья Федорова',
    avatar: '/img/avatars/user7.jpg',
    rating: 5,
    date: '15 ноября 2025',
    course: 'Кето диета: от Мифов к Результатам',
    text: 'После родов никак не могла сбросить вес. Этот курс стал спасением! За 4 месяца минус 15 кг, при этом никакого голода. Кето рецепты - это что-то невероятное! Муж тоже подсел 😄',
    verified: true,
  },
  {
    id: 8,
    name: 'Сергей Морозов',
    avatar: '/img/avatars/user8.jpg',
    rating: 5,
    date: '10 ноября 2025',
    course: 'Интервальное голодание',
    text: 'Работаю в IT, сидячий образ жизни. Курс помог понять, как питаться правильно даже при таком графике. ИГ отлично вписалось в мой режим. Рекомендую!',
    verified: true,
  },
]

const courses = ['Все курсы', 'Кето диета: от Мифов к Результатам', 'Интервальное голодание']
const ratings = ['Все оценки', '5 звёзд', '4 звезды', '3 звезды']

export default function ReviewsPage() {
  const [selectedCourse, setSelectedCourse] = useState('Все курсы')
  const [selectedRating, setSelectedRating] = useState('Все оценки')
  const [showCourseFilter, setShowCourseFilter] = useState(false)
  const [showRatingFilter, setShowRatingFilter] = useState(false)

  const filteredReviews = reviews.filter((review) => {
    const courseMatch = selectedCourse === 'Все курсы' || review.course === selectedCourse
    const ratingMatch =
      selectedRating === 'Все оценки' ||
      (selectedRating === '5 звёзд' && review.rating === 5) ||
      (selectedRating === '4 звезды' && review.rating === 4) ||
      (selectedRating === '3 звезды' && review.rating === 3)
    return courseMatch && ratingMatch
  })

  const averageRating = (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)

  return (
    <main className="min-h-screen pt-28 pb-16">
      {/* Hero Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-accent-gold/10 border border-accent-gold/30 mb-6">
            <Star className="w-5 h-5 text-accent-gold fill-accent-gold" />
            <span className="text-accent-gold font-semibold">Отзывы студентов</span>
          </div>
          <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl text-white mb-6">
            Что говорят наши студенты
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto mb-8">
            Реальные отзывы от людей, которые изменили свою жизнь с нашими курсами
          </p>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 mb-12">
            <div className="text-center">
              <div className="text-4xl font-bold text-accent-gold mb-1">{averageRating}</div>
              <div className="flex items-center gap-1 justify-center mb-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-accent-gold fill-accent-gold" />
                ))}
              </div>
              <div className="text-white/60 text-sm">Средняя оценка</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-accent-electric mb-1">{reviews.length}+</div>
              <div className="text-white/60 text-sm">Отзывов</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-accent-mint mb-1">98%</div>
              <div className="text-white/60 text-sm">Рекомендуют</div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Filters */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="flex flex-wrap gap-4 justify-center">
          {/* Course Filter */}
          <div className="relative">
            <button
              onClick={() => {
                setShowCourseFilter(!showCourseFilter)
                setShowRatingFilter(false)
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
            >
              <Filter className="w-4 h-4 text-white/60" />
              <span className="text-white">{selectedCourse}</span>
              <ChevronDown className="w-4 h-4 text-white/60" />
            </button>
            {showCourseFilter && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-full left-0 mt-2 w-72 rounded-xl glass border border-white/10 overflow-hidden z-10"
              >
                {courses.map((course) => (
                  <button
                    key={course}
                    onClick={() => {
                      setSelectedCourse(course)
                      setShowCourseFilter(false)
                    }}
                    className={`w-full px-4 py-3 text-left hover:bg-white/5 transition-colors ${
                      selectedCourse === course ? 'bg-accent-electric/10 text-accent-electric' : 'text-white'
                    }`}
                  >
                    {course}
                  </button>
                ))}
              </motion.div>
            )}
          </div>

          {/* Rating Filter */}
          <div className="relative">
            <button
              onClick={() => {
                setShowRatingFilter(!showRatingFilter)
                setShowCourseFilter(false)
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
            >
              <Star className="w-4 h-4 text-accent-gold" />
              <span className="text-white">{selectedRating}</span>
              <ChevronDown className="w-4 h-4 text-white/60" />
            </button>
            {showRatingFilter && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-full left-0 mt-2 w-48 rounded-xl glass border border-white/10 overflow-hidden z-10"
              >
                {ratings.map((rating) => (
                  <button
                    key={rating}
                    onClick={() => {
                      setSelectedRating(rating)
                      setShowRatingFilter(false)
                    }}
                    className={`w-full px-4 py-3 text-left hover:bg-white/5 transition-colors ${
                      selectedRating === rating ? 'bg-accent-gold/10 text-accent-gold' : 'text-white'
                    }`}
                  >
                    {rating}
                  </button>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Reviews Grid */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredReviews.map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass rounded-2xl p-6 relative overflow-hidden"
            >
              {/* Quote Icon */}
              <Quote className="absolute top-4 right-4 w-12 h-12 text-accent-electric/10" />

              {/* Header */}
              <div className="flex items-start gap-4 mb-4">
                <div className="relative w-14 h-14 rounded-full overflow-hidden flex-shrink-0 bg-white/10">
                  <div className="w-full h-full flex items-center justify-center text-2xl">
                    {review.name[0]}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-white">{review.name}</h3>
                    {review.verified && (
                      <span className="px-2 py-0.5 rounded-full bg-accent-mint/20 text-accent-mint text-xs">
                        Проверено
                      </span>
                    )}
                  </div>
                  <p className="text-white/60 text-sm">{review.date}</p>
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < review.rating ? 'text-accent-gold fill-accent-gold' : 'text-white/20'
                    }`}
                  />
                ))}
              </div>

              {/* Course Badge */}
              <div className="inline-block px-3 py-1 rounded-full bg-accent-electric/10 text-accent-electric text-sm mb-4">
                {review.course}
              </div>

              {/* Review Text */}
              <p className="text-white/80 leading-relaxed">{review.text}</p>
            </motion.div>
          ))}
        </div>

        {filteredReviews.length === 0 && (
          <div className="text-center py-12">
            <p className="text-white/60">Нет отзывов по выбранным фильтрам</p>
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-3xl p-8 md:p-12 text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-accent-electric/10 via-transparent to-accent-mint/10" />
          <div className="relative z-10">
            <h2 className="font-display font-bold text-3xl text-white mb-4">
              Готовы изменить свою жизнь?
            </h2>
            <p className="text-white/60 mb-8 max-w-xl mx-auto">
              Присоединяйтесь к тысячам студентов, которые уже достигли своих целей
            </p>
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-accent-electric to-accent-mint text-dark-900 font-bold hover:shadow-lg hover:shadow-accent-electric/30 transition-all"
            >
              Выбрать курс
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Back Button */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          На главную
        </Link>
      </div>
    </main>
  )
}

