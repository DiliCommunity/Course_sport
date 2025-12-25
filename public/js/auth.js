// Общий файл для проверки авторизации и обновления навигации
// Работает через API сессий (cookies)

// Кэш данных пользователя
let cachedUser = null;
let isCheckingAuth = false;

// Проверка авторизации через API
async function checkAuth() {
    // Предотвращаем множественные одновременные запросы
    if (isCheckingAuth) {
        return cachedUser;
    }
    
    isCheckingAuth = true;
    
    try {
        const response = await fetch('/api/profile/data', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            cachedUser = data.user;
            return data.user;
        }
        
        cachedUser = null;
        return null;
    } catch (error) {
        console.error('Auth check error:', error);
        cachedUser = null;
        return null;
    } finally {
        isCheckingAuth = false;
    }
}

// Синхронная проверка - для быстрого UI (использует кэш)
function isAuthenticated() {
    return cachedUser !== null;
}

// Получение данных пользователя из кэша
function getUserData() {
    return cachedUser;
}

// Выход
async function logout() {
    try {
        await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
        });
    } catch (error) {
        console.error('Logout error:', error);
    }
    
    cachedUser = null;
    window.location.href = '/index.html';
}

// Обновление навигации на всех страницах
function updateNavigation(user) {
    const authButtons = document.getElementById('authButtons');
    const guestButtons = document.getElementById('guestButtons');
    const mobileProfileLink = document.getElementById('mobileProfileLink');
    const mobileWalletLink = document.getElementById('mobileWalletLink');
    const mobileEarnLink = document.getElementById('mobileEarnLink');
    const mobileLogoutLink = document.getElementById('mobileLogoutLink');
    
    if (user) {
        // Показываем бургер-меню вместо кнопки входа
        if (authButtons) {
            authButtons.style.display = 'flex';
            authButtons.style.alignItems = 'center';
            authButtons.style.gap = '10px';
            authButtons.innerHTML = `
                <div class="user-menu-container" style="position: relative;">
                    <button class="btn-primary" id="userMenuBtn" style="
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        background: linear-gradient(135deg, var(--accent-electric), var(--accent-neon));
                        border: none;
                        padding: 10px 20px;
                        border-radius: 12px;
                        color: var(--bg-dark);
                        font-weight: 600;
                        cursor: pointer;
                        box-shadow: 0 4px 15px rgba(0, 217, 255, 0.4);
                        transition: all 0.3s;
                    " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(0, 217, 255, 0.6)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(0, 217, 255, 0.4)'">
                        <span>👤</span>
                        <span>${user.name || 'Мой профиль'}</span>
                        <span style="font-size: 12px;">▼</span>
                    </button>
                    <div class="user-dropdown" id="userDropdown" style="
                        display: none;
                        position: absolute;
                        top: 100%;
                        right: 0;
                        margin-top: 10px;
                        background: linear-gradient(135deg, rgba(15, 15, 18, 0.95), rgba(26, 26, 32, 0.95));
                        border: 2px solid var(--accent-electric);
                        border-radius: 16px;
                        padding: 12px;
                        min-width: 220px;
                        z-index: 1000;
                        backdrop-filter: blur(20px);
                        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
                    ">
                        <a href="/profile.html" style="display: block; padding: 12px; color: var(--text-white); text-decoration: none; border-radius: 8px; transition: all 0.3s;" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='transparent'">
                            👤 Профиль
                        </a>
                        <a href="/profile.html#wallet" style="display: block; padding: 12px; color: var(--text-white); text-decoration: none; border-radius: 8px; transition: all 0.3s;" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='transparent'">
                            💰 Кошелек
                        </a>
                        <a href="/promotions.html#referral" style="display: block; padding: 12px; color: var(--text-white); text-decoration: none; border-radius: 8px; transition: all 0.3s;" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='transparent'">
                            💎 Заработать
                        </a>
                        <hr style="border: none; border-top: 1px solid var(--glass-border); margin: 8px 0;">
                        <a href="#" onclick="logout(); return false;" style="display: block; padding: 12px; color: var(--accent-flame); text-decoration: none; border-radius: 8px; transition: all 0.3s;" onmouseover="this.style.background='rgba(255,107,53,0.1)'" onmouseout="this.style.background='transparent'">
                            🚪 Выйти
                        </a>
                    </div>
                </div>
            `;
            
            // Обработчик клика на кнопку меню
            const userMenuBtn = document.getElementById('userMenuBtn');
            const userDropdown = document.getElementById('userDropdown');
            if (userMenuBtn && userDropdown) {
                userMenuBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    userDropdown.style.display = userDropdown.style.display === 'none' ? 'block' : 'none';
                });
                
                // Закрытие при клике вне меню
                document.addEventListener('click', function(e) {
                    if (!e.target.closest('.user-menu-container')) {
                        userDropdown.style.display = 'none';
                    }
                });
            }
        }
        
        if (guestButtons) {
            guestButtons.style.display = 'none';
        }
        
        // Обновляем мобильное меню
        if (mobileProfileLink) mobileProfileLink.style.display = 'block';
        if (mobileWalletLink) mobileWalletLink.style.display = 'block';
        if (mobileEarnLink) mobileEarnLink.style.display = 'block';
        if (mobileLogoutLink) mobileLogoutLink.style.display = 'block';
    } else {
        if (authButtons) {
            authButtons.style.display = 'none';
        }
        
        if (guestButtons) {
            guestButtons.style.display = 'block';
        }
        
        if (mobileProfileLink) mobileProfileLink.style.display = 'none';
        if (mobileWalletLink) mobileWalletLink.style.display = 'none';
        if (mobileEarnLink) mobileEarnLink.style.display = 'none';
        if (mobileLogoutLink) mobileLogoutLink.style.display = 'none';
    }
}

// Инициализация при загрузке страницы
(async function() {
    async function initAuth() {
        const user = await checkAuth();
        updateNavigation(user);
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAuth);
    } else {
        // DOM уже загружен
        await initAuth();
    }
})();
