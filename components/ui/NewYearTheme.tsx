'use client'

import { useEffect, useState } from 'react'

/**
 * 🎄 Новогодняя тема
 * 
 * Подключите этот компонент в layout.tsx:
 * import { NewYearTheme } from '@/components/ui/NewYearTheme'
 * 
 * И добавьте <NewYearTheme /> внутри body
 * 
 * Тема автоматически выключится после 15 января
 */

export function NewYearTheme() {
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    // Проверяем дату - показываем тему с 20 декабря по 15 января
    const now = new Date()
    const month = now.getMonth() // 0-11
    const day = now.getDate()
    
    const isNewYearPeriod = 
      (month === 11 && day >= 20) || // 20-31 декабря
      (month === 0 && day <= 15)     // 1-15 января
    
    setIsActive(isNewYearPeriod)

    // Добавляем класс к body
    if (isNewYearPeriod) {
      document.body.classList.add('new-year-theme')
    }

    return () => {
      document.body.classList.remove('new-year-theme')
    }
  }, [])

  if (!isActive) return null

  return (
    <>
      {/* Боковые гирлянды */}
      <div className="garland-left" />
      <div className="garland-right" />

      {/* Снежинки */}
      <div className="snowflakes">
        <span className="snowflake">❄</span>
        <span className="snowflake">❅</span>
        <span className="snowflake">❆</span>
        <span className="snowflake">❄</span>
        <span className="snowflake">❅</span>
        <span className="snowflake">❆</span>
        <span className="snowflake">❄</span>
        <span className="snowflake">❅</span>
        <span className="snowflake">❆</span>
        <span className="snowflake">❄</span>
      </div>

      {/* Мини ёлочки */}
      <span className="mini-tree mini-tree-1" aria-hidden="true">🎄</span>
      <span className="mini-tree mini-tree-2" aria-hidden="true">🎄</span>
      <span className="mini-tree mini-tree-3" aria-hidden="true">🌟</span>
      <span className="mini-tree mini-tree-4" aria-hidden="true">🌟</span>

      {/* Праздничный баннер */}
      <div className="new-year-banner">
        🎄 С Новым 2025 Годом! 🎁
      </div>

      {/* Огоньки в углах */}
      <div className="corner-lights top-left" />
      <div className="corner-lights top-right" />
      <div className="corner-lights bottom-left" />
      <div className="corner-lights bottom-right" />
    </>
  )
}

/**
 * Хук для проверки активности новогодней темы
 */
export function useNewYearTheme() {
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    const now = new Date()
    const month = now.getMonth()
    const day = now.getDate()
    
    const isNewYearPeriod = 
      (month === 11 && day >= 20) ||
      (month === 0 && day <= 15)
    
    setIsActive(isNewYearPeriod)
  }, [])

  return isActive
}

