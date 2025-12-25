'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Heart, Instagram, Youtube, Send, Mail, Phone, MapPin } from 'lucide-react'

const footerLinks = {
  courses: [
    { label: 'Все курсы', href: '/courses' },
    { label: 'Кето-рецепты', href: '/keto-food' },
    { label: 'Отзывы', href: '/reviews' },
  ],
  company: [
    { label: 'О нас', href: '/about' },
  ],
  support: [
    { label: 'Войти', href: '/login' },
    { label: 'Регистрация', href: '/register' },
    { label: 'Профиль', href: '/profile' },
  ],
}

const socialLinks = [
  { icon: Instagram, href: 'https://instagram.com', label: 'Instagram' },
  { icon: Youtube, href: 'https://youtube.com', label: 'YouTube' },
  { icon: Send, href: 'https://t.me', label: 'Telegram' },
]

export function Footer() {
  return (
    <footer className="relative bg-dark-900 border-t border-white/5">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/95 to-transparent pointer-events-none" />
      
      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-6">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-teal to-accent-mint p-0.5">
                <div className="w-full h-full rounded-[10px] bg-dark-900 flex items-center justify-center">
                  <span className="text-xl">💚</span>
                </div>
              </div>
              <span className="font-display font-bold text-xl">
                <span className="text-white">Course</span>
                <span className="gradient-text">Health</span>
              </span>
            </Link>
            
            <p className="text-white/60 max-w-sm leading-relaxed">
              Профессиональные онлайн-курсы по кето-диете и интервальному голоданию. 
              Улучшай здоровье и меняй образ жизни с лучшими экспертами.
            </p>

            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/60 hover:text-accent-teal hover:bg-accent-teal/10 transition-all duration-300"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          <div>
            <h4 className="font-display font-semibold text-white mb-4">Курсы</h4>
            <ul className="space-y-3">
              {footerLinks.courses.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-white/60 hover:text-accent-teal transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-white mb-4">Компания</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-white/60 hover:text-accent-teal transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-white mb-4">Поддержка</h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-white/60 hover:text-accent-teal transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Contact Info */}
        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-sm text-white/50">
            <a href="mailto:info@coursehealth.ru" className="flex items-center gap-2 hover:text-accent-teal transition-colors">
              <Mail className="w-4 h-4" />
              info@coursehealth.ru
            </a>
            <a href="tel:+79001234567" className="flex items-center gap-2 hover:text-accent-teal transition-colors">
              <Phone className="w-4 h-4" />
              +7 (900) 123-45-67
            </a>
          </div>
          
          <p className="text-sm text-white/40">
            © {new Date().getFullYear()} Course Health. Все права защищены.
          </p>
        </div>
      </div>
    </footer>
  )
}

