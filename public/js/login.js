// Login functionality - использует Supabase напрямую

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

// Handle form login - через Supabase
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
    
    // Disable button
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Вход...</span>';
    
    try {
        // Проверяем что Supabase загружен
        if (!window.SupabaseAuth) {
            throw new Error('Supabase не загружен. Обновите страницу.');
        }
        
        // Вход через Supabase
        const data = await window.SupabaseAuth.signInWithEmail(email, password);
        
        if (!data.user) {
            throw new Error('Не удалось войти');
        }
        
        console.log('Login successful:', data.user.id);
        
        // Show success
        form.style.display = 'none';
        successDiv.style.display = 'block';
        
        // Redirect after 1 second
        setTimeout(() => {
            window.location.href = '/profile.html';
        }, 1000);
        
    } catch (error) {
        console.error('Login error:', error);
        let message = error.message || 'Ошибка входа';
        
        // Translate common errors
        if (message.includes('Invalid login credentials')) {
            message = 'Неверный email или пароль';
        } else if (message.includes('Email not confirmed')) {
            message = 'Email не подтверждён. Проверьте почту.';
        }
        
        showLoginError(message);
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
            window.open('https://t.me/Course_Sport_bot', '_blank');
        }
    } else {
        window.open('https://t.me/Course_Sport_bot', '_blank');
    }
}

// Login with VK (placeholder)
function loginWithVK() {
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
        // Отправляем на API для обработки Telegram авторизации
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
        
        if (!response.ok) {
            throw new Error(data.error || 'Ошибка входа через Telegram');
        }
        
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
    
    errorDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Logout function
async function logout() {
    try {
        if (window.SupabaseAuth) {
            await window.SupabaseAuth.signOut();
        }
        window.location.href = '/login.html';
    } catch (error) {
        console.error('Logout error:', error);
        window.location.href = '/login.html';
    }
}

// Check if user is already logged in
window.addEventListener('DOMContentLoaded', async () => {
    // Check Telegram WebApp
    if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();
        
        const user = tg.initDataUnsafe?.user;
        if (user) {
            const telegramDiv = document.getElementById('telegramLogin');
            if (telegramDiv) {
                const button = telegramDiv.querySelector('button');
                if (button) {
                    button.textContent = 'Продолжить как ' + user.first_name;
                }
            }
        }
    }
    
    // Ждем инициализации Supabase
    await new Promise(resolve => {
        if (window.SupabaseAuth) {
            resolve();
        } else {
            const check = setInterval(() => {
                if (window.SupabaseAuth) {
                    clearInterval(check);
                    resolve();
                }
            }, 100);
            setTimeout(() => { clearInterval(check); resolve(); }, 3000);
        }
    });
    
    // Проверяем авторизацию через Supabase
    if (window.SupabaseAuth) {
        const user = await window.SupabaseAuth.getCurrentUser();
        if (user) {
            // Пользователь уже авторизован - редирект на профиль
            window.location.href = '/profile.html';
            return;
        }
    }
    
    // Auto-fill email if remembered
    const rememberedEmail = localStorage.getItem('remember_email');
    if (rememberedEmail) {
        const emailInput = document.getElementById('loginEmail');
        const rememberCheckbox = document.getElementById('remember');
        if (emailInput) emailInput.value = rememberedEmail;
        if (rememberCheckbox) rememberCheckbox.checked = true;
    }
});
