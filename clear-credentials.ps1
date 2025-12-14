# Очистка всех сохранённых credentials для GitHub
Write-Host "🧹 Очистка сохранённых credentials..." -ForegroundColor Cyan
Write-Host ""

# Удаляем через cmdkey
Write-Host "Удаляю сохранённые credentials..." -ForegroundColor Yellow
cmdkey /delete:git:https://github.com 2>$null
cmdkey /delete:LegacyGeneric:target=git:https://github.com 2>$null
cmdkey /delete:LegacyGeneric:target=git:https://github.com/DiliCommunity 2>$null

# Очищаем git config
Write-Host "Очищаю git config..." -ForegroundColor Yellow
git config --global --unset-all credential.helper 2>$null
git config --global --unset-all credential.https://github.com.helper 2>$null

# Устанавливаем новый helper
Write-Host "Настраиваю credential helper..." -ForegroundColor Yellow
git config --global credential.helper manager-core

Write-Host ""
Write-Host "✅ Credentials очищены!" -ForegroundColor Green
Write-Host ""
Write-Host "Теперь выполните:" -ForegroundColor Cyan
Write-Host "  git push origin main" -ForegroundColor White
Write-Host ""
Write-Host "При запросе:" -ForegroundColor Yellow
Write-Host "  Username: DiliCommunity" -ForegroundColor White
Write-Host "  Password: ваш Personal Access Token" -ForegroundColor White
Write-Host ""

