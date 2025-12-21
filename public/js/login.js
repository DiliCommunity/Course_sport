// Login functionality
// Supabase credentials will be handled by API endpoints

// Toggle password visibility
function toggleLoginPassword() {
    const passwordInput = document.getElementById('loginPassword');
    const eyeIcon = passwordInput.nextElementSibling.querySelector('.eye-icon');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeIcon.textContent = '🙈';
    } else {
        passwordInput.type = 'password';
        eyeIcon.textContent = '👁️';
    }
}

// Handle form login
async function handleLogin(event) {
    event.preventDefault();
    
    const form = document.getElementById('loginForm');
    const errorDiv = document.getElementById('loginError');
    const successDiv = document.getElementById('loginSuccess');
    const submitBtn = form.querySelector('button[type="submit"]');
    
    // Hide previous messages
    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';
    
    // Get form data
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const remember = document.getElementById('remember').checked;
    
    // Disable button
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Вход...</span>';
    
    try {
        // Login through API endpoint
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                password: password,
                remember: remember,
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || data.message || 'Неверный email или пароль');
        }
        
        // Save to localStorage
        if (data.user_id) {
            localStorage.setItem('user_id', data.user_id);
            localStorage.setItem('user_email', email);
            localStorage.setItem('access_token', data.access_token || '');
            
            if (remember) {
                localStorage.setItem('remember_me', 'true');
            }
        }
        
        // Show success
        form.style.display = 'none';
        successDiv.style.display = 'block';
        
        // Redirect after 1 second
        setTimeout(() => {
            window.location.href = '/courses.html';
        }, 1000);
        
    } catch (error) {
        console.error('Login error:', error);
        showLoginError(error.message || 'Ошибка входа. Проверьте данные.');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Войти</span><span>→</span>';
    }
}

// Login with Telegram
function loginWithTelegram() {
    // Check if Telegram WebApp is available
    if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        const user = tg.initDataUnsafe?.user;
        
        if (user) {
            handleTelegramLogin(user);
        } else {
            // Open Telegram bot
            window.open('https://t.me/Course_Sport_bot', '_blank');
        }
    } else {
        // Open Telegram bot
        window.open('https://t.me/Course_Sport_bot', '_blank');
    }
}

// Login with VK (placeholder)
function loginWithVK() {
    // TODO: Implement VK OAuth
    alert('Вход через ВКонтакте скоро будет доступен');
}

// Handle Telegram login
async function handleTelegramLogin(telegramUser) {
    const errorDiv = document.getElementById('loginError');
    const successDiv = document.getElementById('loginSuccess');
    const form = document.getElementById('loginForm');
    const telegramDiv = document.getElementById('telegramLogin');
    
    errorDiv.style.display = 'none';
    
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
        
        if (!response.ok) {
            throw new Error(data.error || 'Ошибка входа через Telegram');
        }
        
        if (data.requires_otp) {
            showLoginError('Для завершения входа необходимо подтвердить номер телефона через SMS');
            return;
        }
        
        // Save to localStorage
        if (data.user_id) {
            localStorage.setItem('telegram_user_id', String(telegramUser.id));
            localStorage.setItem('telegram_id', String(telegramUser.id));
            localStorage.setItem('user_id', data.user_id);
        }
        if (data.user) {
            localStorage.setItem('user_id', data.user.id);
        }
        localStorage.setItem('user_name', `${telegramUser.first_name} ${telegramUser.last_name || ''}`.trim());
        localStorage.setItem('telegram_auth', 'true');
        
        // Show success
        form.style.display = 'none';
        if (telegramDiv) telegramDiv.style.display = 'none';
        successDiv.style.display = 'block';
        
        // Redirect
        setTimeout(() => {
            window.location.href = '/profile.html';
        }, 1000);
        
    } catch (error) {
        console.error('Telegram login error:', error);
        showLoginError(error.message || 'Ошибка входа через Telegram');
    }
}

// Show error message
function showLoginError(message) {
    const errorDiv = document.getElementById('loginError');
    const errorMessage = document.getElementById('loginErrorMessage');
    
    errorMessage.textContent = message;
    errorDiv.style.display = 'block';
    
    // Scroll to error
    errorDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Check if user is already logged in
window.addEventListener('DOMContentLoaded', () => {
    // Check Telegram WebApp
    if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();
        
        const user = tg.initDataUnsafe?.user;
        if (user) {
            // Auto-login if in Telegram
            const telegramDiv = document.getElementById('telegramLogin');
            telegramDiv.querySelector('button').textContent = 'Продолжить как ' + user.first_name;
        }
    }
    
    // Check if already logged in
    if (localStorage.getItem('user_id') || localStorage.getItem('telegram_user_id')) {
        window.location.href = '/courses.html';
    }
    
    // Auto-fill email if remembered
    if (localStorage.getItem('remember_me') === 'true' && localStorage.getItem('user_email')) {
        document.getElementById('loginEmail').value = localStorage.getItem('user_email');
        document.getElementById('remember').checked = true;
    }
});

