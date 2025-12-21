// Telegram WebApp Integration
// Автоматическая регистрация и синхронизация с браузером

(function() {
    'use strict';

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

        // Автоматическая регистрация/авторизация
        autoAuthWithTelegram(user, tg);
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
                credentials: 'include', // Важно для сохранения сессии
            });

            const data = await response.json();

            if (response.ok) {
                if (data.requires_otp) {
                    // Требуется подтверждение телефона
                    console.log('OTP required');
                    tg.showAlert('Для завершения регистрации необходимо подтвердить номер телефона через SMS', () => {
                        // Можно перенаправить на страницу ввода OTP
                        if (window.location.pathname.includes('login.html') || window.location.pathname.includes('register.html')) {
                            // Показываем форму ввода OTP или перенаправляем
                        }
                    });
                    return;
                }

                if (data.user && data.session) {
                    // Успешная регистрация/авторизация
                    console.log('Telegram auth successful');
                    
                    // Сохраняем данные в localStorage для синхронизации
                    localStorage.setItem('telegram_auth', 'true');
                    localStorage.setItem('telegram_user_id', String(telegramUser.id));
                    localStorage.setItem('user_id', data.user.id);
                    
                    // Обновляем UI
                    updateUIForAuthenticatedUser();
                    
                    // Показываем уведомление и перенаправляем
                    tg.showAlert('Добро пожаловать, ' + telegramUser.first_name + '!', () => {
                        // Перенаправляем на профиль или главную
                        const currentPath = window.location.pathname;
                        if (currentPath.includes('login.html') || currentPath.includes('register.html')) {
                            window.location.href = '/profile.html';
                        }
                    });
                    tg.HapticFeedback.notificationOccurred('success');
                } else if (data.user_id) {
                    // Пользователь существует
                    localStorage.setItem('telegram_auth', 'true');
                    localStorage.setItem('telegram_user_id', String(telegramUser.id));
                    localStorage.setItem('user_id', data.user_id);
                    
                    // Если есть сессия, обновляем UI сразу
                    if (data.session) {
                        updateUIForAuthenticatedUser();
                        const currentPath = window.location.pathname;
                        if (currentPath.includes('login.html') || currentPath.includes('register.html')) {
                            setTimeout(() => {
                                window.location.href = '/profile.html';
                            }, 1000);
                        }
                    } else {
                        // Если нет сессии, проверяем через профиль
                        setTimeout(async () => {
                            const profileResponse = await fetch('/api/profile/data', {
                                credentials: 'include',
                            });
                            if (profileResponse.ok) {
                                updateUIForAuthenticatedUser();
                                const currentPath = window.location.pathname;
                                if (currentPath.includes('login.html') || currentPath.includes('register.html')) {
                                    window.location.href = '/profile.html';
                                }
                            }
                        }, 500);
                    }
                }
            } else {
                console.error('Telegram auth error:', data.error);
                tg.showAlert('Ошибка авторизации: ' + (data.error || 'Неизвестная ошибка'));
            }
        } catch (error) {
            console.error('Telegram auth error:', error);
            if (tg) {
                tg.showAlert('Ошибка подключения. Проверьте интернет-соединение.');
            }
        }
    }

    // Обновление UI для авторизованного пользователя
    function updateUIForAuthenticatedUser() {
        // Обновляем навигацию
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

        // Проверяем, на какой странице мы находимся
        const currentPath = window.location.pathname;
        
        // Если на странице логина/регистрации, перенаправляем
        if (currentPath.includes('login.html') || currentPath.includes('register.html')) {
            setTimeout(() => {
                window.location.href = '/profile.html';
            }, 1000);
        }
        
        // Если на главной странице и в WebApp, можно перенаправить на профиль
        if (currentPath === '/' || currentPath === '/index.html') {
            const tg = window.Telegram?.WebApp;
            if (tg && tg.initData) {
                // В WebApp можно автоматически перенаправить на профиль
                // Раскомментируйте, если нужно:
                // setTimeout(() => {
                //     window.location.href = '/profile.html';
                // }, 2000);
            }
        }
    }

    // Синхронизация с браузером (для случаев, когда пользователь открывает сайт в браузере после WebApp)
    function syncWithBrowser() {
        const telegramAuth = localStorage.getItem('telegram_auth');
        const userId = localStorage.getItem('user_id');

        if (telegramAuth === 'true' && userId) {
            // Проверяем сессию на сервере
            fetch('/api/profile/data', {
                credentials: 'include',
            })
            .then(response => {
                if (response.ok) {
                    updateUIForAuthenticatedUser();
                } else {
                    // Сессия истекла, очищаем localStorage
                    localStorage.removeItem('telegram_auth');
                    localStorage.removeItem('user_id');
                }
            })
            .catch(error => {
                console.error('Sync error:', error);
            });
        }
    }

    // Инициализация при загрузке страницы
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initTelegramWebApp();
            syncWithBrowser();
        });
    } else {
        initTelegramWebApp();
        syncWithBrowser();
    }

    // Экспортируем функции для использования в других скриптах
    window.TelegramWebApp = {
        isTelegramWebApp: isTelegramWebApp,
        init: initTelegramWebApp,
        sync: syncWithBrowser,
    };
})();
