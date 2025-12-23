// Общий файл для проверки авторизации и обновления навигации

// Проверка авторизации
function isAuthenticated() {
    return !!localStorage.getItem('user_id');
}

// Получение данных пользователя
function getUserData() {
    return {
        id: localStorage.getItem('user_id'),
        username: localStorage.getItem('user_username'),
        name: localStorage.getItem('user_name'),
        email: localStorage.getItem('user_email'),
        phone: localStorage.getItem('user_phone')
    };
}

// Выход
function logout() {
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_username');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_phone');
    localStorage.removeItem('remember_login');
    window.location.href = '/index.html';
}

// Обновление навигации на всех страницах
function updateNavigation() {
    const authButtons = document.getElementById('authButtons');
    const guestButtons = document.getElementById('guestButtons');
    const mobileProfileLink = document.getElementById('mobileProfileLink');
    const mobileWalletLink = document.getElementById('mobileWalletLink');
    const mobileEarnLink = document.getElementById('mobileEarnLink');
    const mobileLogoutLink = document.getElementById('mobileLogoutLink');
    
    if (isAuthenticated()) {
        const user = getUserData();
        
        // Показываем бургер-меню вместо кнопки входа
        if (authButtons) {
            authButtons.style.display = 'block';
            authButtons.innerHTML = `
                <div class="user-menu-container" style="position: relative;">
                    <button class="btn-primary" id="userMenuBtn" style="display: flex; align-items: center; gap: 8px;">
                        <span>👤</span>
                        <span>Мой профиль</span>
                        <span style="font-size: 12px;">▼</span>
                    </button>
                    <div class="user-dropdown" id="userDropdown" style="
                        display: none;
                        position: absolute;
                        top: 100%;
                        right: 0;
                        margin-top: 10px;
                        background: linear-gradient(135deg, var(--glass), rgba(255, 255, 255, 0.05));
                        border: 1px solid var(--glass-border);
                        border-radius: 16px;
                        padding: 10px;
                        min-width: 200px;
                        z-index: 1000;
                        backdrop-filter: blur(20px);
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
(function() {
    function initAuth() {
        updateNavigation();
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAuth);
    } else {
        // DOM уже загружен
        setTimeout(initAuth, 0);
    }
})();

