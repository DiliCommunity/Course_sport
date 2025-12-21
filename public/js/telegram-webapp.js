// Telegram WebApp Integration
// Автоматическая регистрация и синхронизация с браузером

(function() {
    'use strict';

    // Флаг для предотвращения повторных вызовов
    let authInProgress = false;
    let authAttempted = false;

    // Проверяем, что мы в Telegram WebApp
    function isTelegramWebApp() {
        return typeof window !== 'undefined' && 
               window.Telegram && 
               window.Telegram.WebApp &&
               window.Telegram.WebApp.initData;
    }

    // Инициализация Telegram WebApp
    function initTelegramWebApp() {
        if (!isTelegramWebApp()) {
            return;
        }

        const tg = window.Telegram.WebApp;
        const user = tg.initDataUnsafe?.user;

        if (!user) {
            console.log('Telegram user data not available');
            return;
        }

        // Настраиваем WebApp
        tg.ready();
        tg.expand();
        tg.setHeaderColor('#0a0a0b');
        tg.setBackgroundColor('#0a0a0b');
        tg.enableClosingConfirmation();

        // Проверяем, была ли уже попытка авторизации в этой сессии
        const lastAuthAttempt = sessionStorage.getItem('telegram_auth_attempt');
        const now = Date.now();
        
        // Не пытаемся авторизоваться чаще чем раз в 60 секунд
        if (lastAuthAttempt && (now - parseInt(lastAuthAttempt)) < 60000) {
            console.log('Telegram auth: waiting for cooldown');
            return;
        }

        // Автоматическая регистрация/авторизация только если еще не авторизованы
        checkAndAuth(user, tg);
    }

    // Проверяем авторизацию и авторизуем если нужно
    async function checkAndAuth(telegramUser, tg) {
        if (authInProgress || authAttempted) {
            return;
        }

        // Сначала проверяем, есть ли уже сессия через Supabase
        if (window.SupabaseAuth) {
            try {
                const session = await window.SupabaseAuth.getSession();
                if (session) {
                    console.log('Already authenticated via Supabase');
                    updateUIForAuthenticatedUser();
                    return;
                }
            } catch (e) {
                // Игнорируем ошибки проверки сессии
            }
        }

        // Если нет сессии, пытаемся авторизоваться через Telegram
        authInProgress = true;
        authAttempted = true;
        sessionStorage.setItem('telegram_auth_attempt', Date.now().toString());

        try {
            await autoAuthWithTelegram(telegramUser, tg);
        } finally {
            authInProgress = false;
        }
    }

    // Автоматическая авторизация через Telegram
    async function autoAuthWithTelegram(telegramUser, tg) {
        try {
            const response = await fetch('/api/auth/telegram', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: telegramUser.id,
                    first_name: telegramUser.first_name,
                    last_name: telegramUser.last_name,
                    username: telegramUser.username,
                    photo_url: telegramUser.photo_url,
                    phone_number: telegramUser.phone_number,
                }),
                credentials: 'include',
            });

            const data = await response.json();

            if (response.ok) {
                if (data.requires_otp) {
                    console.log('OTP required');
                    return;
                }

                if (data.user || data.user_id) {
                    console.log('Telegram auth successful');
                    updateUIForAuthenticatedUser();
                    
                    // Перенаправляем только со страниц логина/регистрации
                    const currentPath = window.location.pathname;
                    if (currentPath.includes('login.html') || currentPath.includes('register.html')) {
                        tg.showAlert('Добро пожаловать, ' + telegramUser.first_name + '!', () => {
                            window.location.href = '/profile.html';
                        });
                    }
                    tg.HapticFeedback.notificationOccurred('success');
                }
            } else {
                // Если ошибка rate limiting, не показываем popup
                if (data.error && data.error.includes('security purposes')) {
                    console.log('Rate limited, will retry later');
                    return;
                }
                console.error('Telegram auth error:', data.error);
            }
        } catch (error) {
            console.error('Telegram auth network error:', error);
        }
    }

    // Обновление UI для авторизованного пользователя
    function updateUIForAuthenticatedUser() {
        const authButtons = document.getElementById('authButtons');
        const guestButtons = document.getElementById('guestButtons');
        const mobileProfileLink = document.getElementById('mobileProfileLink');

        if (authButtons && guestButtons) {
            authButtons.style.display = 'flex';
            authButtons.style.gap = '10px';
            authButtons.style.alignItems = 'center';
            guestButtons.style.display = 'none';
        }

        if (mobileProfileLink) {
            mobileProfileLink.style.display = 'block';
        }
    }

    // Инициализация при загрузке страницы
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            // Ждем загрузки SupabaseAuth
            setTimeout(initTelegramWebApp, 500);
        });
    } else {
        setTimeout(initTelegramWebApp, 500);
    }

    // Экспортируем функции
    window.TelegramWebApp = {
        isTelegramWebApp: isTelegramWebApp,
        init: initTelegramWebApp,
    };
})();
