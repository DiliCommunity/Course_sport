/**
 * Универсальная функция для скачивания PDF с поддержкой мобильных устройств
 * Использует blob URL и программный клик для совместимости с мобильными браузерами
 */
export function downloadPDFBlob(pdf: any, fileName: string): void {
  try {
    // Используем blob URL для лучшей совместимости с мобильными устройствами
    const pdfBlob = pdf.output('blob')
    const blobUrl = URL.createObjectURL(pdfBlob)
    
    // Создаем ссылку для скачивания
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = fileName
    link.style.display = 'none'
    
    // Добавляем ссылку в DOM и кликаем
    document.body.appendChild(link)
    link.click()
    
    // Удаляем ссылку и очищаем blob URL через задержку (увеличенная для мобильных)
    // На мобильных устройствах нужно больше времени для начала загрузки
    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link)
      }
      URL.revokeObjectURL(blobUrl)
    }, 1000)
  } catch (error) {
    console.error('Error downloading PDF:', error)
    // Fallback на стандартный метод, если blob не поддерживается
    try {
      pdf.save(fileName)
    } catch (fallbackError) {
      console.error('Fallback PDF save also failed:', fallbackError)
      alert('Не удалось скачать PDF файл')
    }
  }
}

