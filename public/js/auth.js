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
    
    if (isAuthenticated()) {
        const user = getUserData();
        
        // Показываем кнопку профиля вместо входа
        if (authButtons) {
            authButtons.style.display = 'block';
            authButtons.innerHTML = `
                <a href="/profile.html" class="btn-primary">
                    <span>👤 Мой профиль</span>
                </a>
            `;
        }
        
        if (guestButtons) {
            guestButtons.style.display = 'none';
        }
        
        // Обновляем мобильное меню
        if (mobileProfileLink) {
            mobileProfileLink.style.display = 'block';
        }
    } else {
        if (authButtons) {
            authButtons.style.display = 'none';
        }
        
        if (guestButtons) {
            guestButtons.style.display = 'block';
        }
        
        if (mobileProfileLink) {
            mobileProfileLink.style.display = 'none';
        }
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    updateNavigation();
});

