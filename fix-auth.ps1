# Скрипт для исправления аутентификации GitHub
# Использование: .\fix-auth.ps1

Write-Host "🔧 Исправление аутентификации GitHub" -ForegroundColor Cyan
Write-Host ""

# Проверка текущей конфигурации
Write-Host "📋 Текущая конфигурация:" -ForegroundColor Yellow
Write-Host "Username: $(git config --global user.name)" -ForegroundColor White
Write-Host "Email: $(git config --global user.email)" -ForegroundColor White
Write-Host "Remote URL: $(git remote get-url origin)" -ForegroundColor White
Write-Host ""

# Вопрос о правильном username
Write-Host "❓ Какой правильный username на GitHub?" -ForegroundColor Yellow
Write-Host "1. DiliCommunity (без подчеркивания)" -ForegroundColor White
Write-Host "2. Dili_Community (с подчеркиванием)" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Выберите вариант (1 или 2)"

if ($choice -eq "2") {
    Write-Host ""
    Write-Host "🔄 Обновляю remote URL на Dili_Community..." -ForegroundColor Cyan
    git remote set-url origin https://github.com/Dili_Community/Course_sport.git
    Write-Host "✅ URL обновлён!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "✅ Используется DiliCommunity" -ForegroundColor Green
}

Write-Host ""
Write-Host "🔐 Настройка аутентификации..." -ForegroundColor Cyan
Write-Host ""

# Проверка SSH
Write-Host "Проверка SSH ключа..." -ForegroundColor Yellow
if (Test-Path "$env:USERPROFILE\.ssh\id_rsa.pub") {
    Write-Host "✅ SSH ключ найден" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Вариант 1: Использовать SSH (рекомендуется)" -ForegroundColor Cyan
    Write-Host "   Выполните: git remote set-url origin git@github.com:DiliCommunity/Course_sport.git" -ForegroundColor White
    Write-Host "   Или: git remote set-url origin git@github.com:Dili_Community/Course_sport.git" -ForegroundColor White
} else {
    Write-Host "❌ SSH ключ не найден" -ForegroundColor Red
    Write-Host ""
    Write-Host "📋 Вариант 2: Использовать Personal Access Token (проще)" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📝 ИНСТРУКЦИЯ ПО СОЗДАНИЮ PERSONAL ACCESS TOKEN:" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Откройте: https://github.com/settings/tokens" -ForegroundColor White
Write-Host "2. Нажмите 'Generate new token' → 'Generate new token (classic)'" -ForegroundColor White
Write-Host "3. Название: 'Course Health Deploy'" -ForegroundColor White
Write-Host "4. Срок: выберите нужный" -ForegroundColor White
Write-Host "5. Права: отметьте 'repo' (полный доступ)" -ForegroundColor White
Write-Host "6. Нажмите 'Generate token'" -ForegroundColor White
Write-Host "7. СКОПИРУЙТЕ ТОКЕН СРАЗУ! (показывается один раз)" -ForegroundColor Red
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$ready = Read-Host "Токен создан? (y/n)"

if ($ready -eq "y" -or $ready -eq "Y") {
    Write-Host ""
    Write-Host "🔄 Пробую выполнить push..." -ForegroundColor Cyan
    Write-Host ""
    Write-Host "⚠️  При запросе пароля вставьте ваш Personal Access Token!" -ForegroundColor Yellow
    Write-Host ""
    
    git push origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ УСПЕШНО! Изменения отправлены в GitHub!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "❌ Ошибка. Проверьте:" -ForegroundColor Red
        Write-Host "   - Правильность username (DiliCommunity или Dili_Community)" -ForegroundColor White
        Write-Host "   - Правильность токена" -ForegroundColor White
        Write-Host "   - Права доступа к репозиторию" -ForegroundColor White
    }
} else {
    Write-Host ""
    Write-Host "Создайте токен и запустите скрипт снова." -ForegroundColor Yellow
}

