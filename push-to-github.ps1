# Скрипт для push в GitHub с использованием Personal Access Token
# Использование: .\push-to-github.ps1

Write-Host "🚀 Подготовка к push в GitHub..." -ForegroundColor Cyan
Write-Host ""

# Проверка статуса
Write-Host "📋 Проверка статуса git..." -ForegroundColor Yellow
git status --short

Write-Host ""
Write-Host "⚠️  ВАЖНО: Для push нужен Personal Access Token!" -ForegroundColor Red
Write-Host ""
Write-Host "📝 Инструкция:" -ForegroundColor Cyan
Write-Host "1. Перейдите: https://github.com/settings/tokens" -ForegroundColor White
Write-Host "2. Нажмите 'Generate new token (classic)'" -ForegroundColor White
Write-Host "3. Выберите права: repo (полный доступ)" -ForegroundColor White
Write-Host "4. Скопируйте токен" -ForegroundColor White
Write-Host ""
Write-Host "При push используйте:" -ForegroundColor Yellow
Write-Host "  Username: DiliCommunity" -ForegroundColor White
Write-Host "  Password: ваш Personal Access Token" -ForegroundColor White
Write-Host ""

$confirm = Read-Host "Готовы выполнить push? (y/n)"
if ($confirm -eq "y" -or $confirm -eq "Y") {
    Write-Host ""
    Write-Host "🔄 Выполняю push..." -ForegroundColor Cyan
    git push origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Успешно отправлено в GitHub!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "❌ Ошибка при push. Проверьте токен и попробуйте снова." -ForegroundColor Red
    }
} else {
    Write-Host "Отменено." -ForegroundColor Yellow
}

