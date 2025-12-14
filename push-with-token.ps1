# Push с использованием токена напрямую
Write-Host "🚀 Push в GitHub с использованием токена" -ForegroundColor Cyan
Write-Host ""

Write-Host "⚠️  ВАЖНО: Вставьте ваш Personal Access Token" -ForegroundColor Yellow
Write-Host ""
$token = Read-Host "Введите ваш Personal Access Token" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($token)
$plainToken = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

if ($plainToken) {
    Write-Host ""
    Write-Host "🔄 Выполняю push..." -ForegroundColor Cyan
    
    # Используем токен в URL
    $urlWithToken = "https://$plainToken@github.com/DiliCommunity/Course_sport.git"
    git remote set-url origin $urlWithToken
    
    git push origin main
    
    # Возвращаем обычный URL
    git remote set-url origin https://github.com/DiliCommunity/Course_sport.git
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ УСПЕШНО! Изменения отправлены!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "❌ Ошибка. Проверьте правильность токена." -ForegroundColor Red
    }
} else {
    Write-Host "Токен не введён." -ForegroundColor Red
}

