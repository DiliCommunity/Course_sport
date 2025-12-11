'use client'

import { useEffect, useCallback } from 'react'
import { useTelegram } from '@/components/providers/TelegramProvider'

interface UseMainButtonOptions {
  text: string
  onClick: () => void
  isVisible?: boolean
  isEnabled?: boolean
  color?: string
  textColor?: string
}

export function useTelegramMainButton({
  text,
  onClick,
  isVisible = true,
  isEnabled = true,
  color,
  textColor,
}: UseMainButtonOptions) {
  const { webApp, isTelegramApp } = useTelegram()

  const handleClick = useCallback(() => {
    if (webApp) {
      webApp.HapticFeedback.impactOccurred('medium')
    }
    onClick()
  }, [webApp, onClick])

  useEffect(() => {
    if (!webApp || !isTelegramApp) return

    const mainButton = webApp.MainButton

    // Set button properties
    mainButton.setText(text)
    
    if (color) {
      mainButton.setParams({ color })
    }
    
    if (textColor) {
      mainButton.setParams({ text_color: textColor })
    }

    // Set visibility
    if (isVisible) {
      mainButton.show()
    } else {
      mainButton.hide()
    }

    // Set enabled state
    if (isEnabled) {
      mainButton.enable()
    } else {
      mainButton.disable()
    }

    // Attach click handler
    mainButton.onClick(handleClick)

    // Cleanup
    return () => {
      mainButton.offClick(handleClick)
      mainButton.hide()
    }
  }, [webApp, isTelegramApp, text, isVisible, isEnabled, color, textColor, handleClick])
}

export function useTelegramBackButton(onBack: () => void) {
  const { webApp, isTelegramApp } = useTelegram()

  const handleBack = useCallback(() => {
    if (webApp) {
      webApp.HapticFeedback.impactOccurred('light')
    }
    onBack()
  }, [webApp, onBack])

  useEffect(() => {
    if (!webApp || !isTelegramApp) return

    const backButton = webApp.BackButton

    backButton.show()
    backButton.onClick(handleBack)

    return () => {
      backButton.offClick(handleBack)
      backButton.hide()
    }
  }, [webApp, isTelegramApp, handleBack])
}

export function useTelegramHaptic() {
  const { webApp, isTelegramApp } = useTelegram()

  const impact = useCallback(
    (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'medium') => {
      if (webApp && isTelegramApp) {
        webApp.HapticFeedback.impactOccurred(style)
      }
    },
    [webApp, isTelegramApp]
  )

  const notification = useCallback(
    (type: 'error' | 'success' | 'warning') => {
      if (webApp && isTelegramApp) {
        webApp.HapticFeedback.notificationOccurred(type)
      }
    },
    [webApp, isTelegramApp]
  )

  const selection = useCallback(() => {
    if (webApp && isTelegramApp) {
      webApp.HapticFeedback.selectionChanged()
    }
  }, [webApp, isTelegramApp])

  return { impact, notification, selection }
}

