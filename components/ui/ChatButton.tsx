'use client'

import { motion } from 'framer-motion'
import { MessageCircle } from 'lucide-react'

export function ChatButton() {
  return (
    <motion.a
      href="https://t.me/Course_Health_chat"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-[#0088cc] to-[#0066aa] shadow-lg hover:shadow-xl shadow-[#0088cc]/50 flex items-center justify-center text-white transition-all group"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
      <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-dark-900 animate-pulse" />
    </motion.a>
  )
}

