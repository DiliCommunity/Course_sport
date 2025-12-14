# Автоматическая проверка и исправление аутентификации
Write-Host "🔍 Проверка и исправление аутентификации GitHub" -ForegroundColor Cyan
Write-Host ""

# Проверяем оба варианта username
$usernames = @("DiliCommunity", "Dili_Community")

Write-Host "🔎 Проверяю доступность репозиториев..." -ForegroundColor Yellow
Write-Host ""

foreach ($username in $usernames) {
    $url = "https://github.com/$username/Course_sport.git"
    Write-Host "Проверяю: $url" -ForegroundColor Gray
    
    try {
        $result = git ls-remote --heads $url 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ НАЙДЕНО! Правильный username: $username" -ForegroundColor Green
            Write-Host ""
            
            # Обновляем remote URL
            Write-Host "🔄 Обновляю remote URL..." -ForegroundColor Cyan
            git remote set-url origin $url
            Write-Host "✅ URL обновлён на: $url" -ForegroundColor Green
            Write-Host ""
            
            # Проверяем текущий remote
            Write-Host "📋 Текущий remote:" -ForegroundColor Yellow
            git remote -v
            Write-Host ""
            
            break
        }
    } catch {
        Write-Host "❌ Недоступен: $username" -ForegroundColor Red
    }
}

Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🔐 СЛЕДУЮЩИЙ ШАГ: Создайте Personal Access Token" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Откройте: https://github.com/settings/tokens" -ForegroundColor White
Write-Host "2. Generate new token → Generate new token (classic)" -ForegroundColor White
Write-Host "3. Название: 'Course Health'" -ForegroundColor White
Write-Host "4. Права: repo (полный доступ)" -ForegroundColor White
Write-Host "5. Generate и СКОПИРУЙТЕ токен!" -ForegroundColor White
Write-Host ""
Write-Host "После создания токена выполните:" -ForegroundColor Yellow
Write-Host "  git push origin main" -ForegroundColor Cyan
Write-Host ""
Write-Host "При запросе пароля вставьте токен (НЕ пароль!)" -ForegroundColor Yellow
Write-Host ""

