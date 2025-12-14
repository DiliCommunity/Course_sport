// Register functionality
// Supabase credentials will be handled by API endpoints

// Toggle password visibility
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const eyeIcon = passwordInput.nextElementSibling.querySelector('.eye-icon');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeIcon.textContent = '🙈';
    } else {
        passwordInput.type = 'password';
        eyeIcon.textContent = '👁️';
    }
}

function toggleConfirmPassword() {
    const passwordInput = document.getElementById('confirmPassword');
    const eyeIcon = passwordInput.nextElementSibling.querySelector('.eye-icon');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeIcon.textContent = '🙈';
    } else {
        passwordInput.type = 'password';
        eyeIcon.textContent = '👁️';
    }
}

// Handle form registration
async function handleRegister(event) {
    event.preventDefault();
    
    const form = document.getElementById('registerForm');
    const errorDiv = document.getElementById('registerError');
    const successDiv = document.getElementById('registerSuccess');
    const submitBtn = form.querySelector('button[type="submit"]');
    
    // Hide previous messages
    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';
    
    // Get form data
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const terms = document.getElementById('terms').checked;
    
    // Validation
    if (!terms) {
        showError('Необходимо согласиться с условиями использования');
        return;
    }
    
    if (password !== confirmPassword) {
        showError('Пароли не совпадают');
        return;
    }
    
    if (password.length < 6) {
        showError('Пароль должен содержать минимум 6 символов');
        return;
    }
    
    // Disable button
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Регистрация...</span>';
    
    try {
        // Register through API endpoint
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                password: password,
                name: name,
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || data.message || 'Ошибка регистрации');
        }
        
        // Show success
        form.style.display = 'none';
        successDiv.style.display = 'block';
        
        // Save to localStorage
        if (data.user_id) {
            localStorage.setItem('user_id', data.user_id);
            localStorage.setItem('user_email', email);
            localStorage.setItem('user_name', name);
        }
        
        // Redirect after 2 seconds
        setTimeout(() => {
            window.location.href = '/courses.html';
        }, 2000);
        
    } catch (error) {
        console.error('Registration error:', error);
        showError(error.message || 'Ошибка регистрации. Попробуйте позже.');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Создать аккаунт</span><span>→</span>';
    }
}


// Register with Telegram
function registerWithTelegram() {
    // Check if Telegram WebApp is available
    if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        const user = tg.initDataUnsafe?.user;
        
        if (user) {
            handleTelegramRegistration(user);
        } else {
            // Open Telegram bot
            window.open('https://t.me/CourseHealthBot', '_blank');
        }
    } else {
        // Open Telegram bot
        window.open('https://t.me/CourseHealthBot', '_blank');
    }
}

// Handle Telegram registration
async function handleTelegramRegistration(telegramUser) {
    const errorDiv = document.getElementById('registerError');
    const successDiv = document.getElementById('registerSuccess');
    const form = document.getElementById('registerForm');
    const telegramDiv = document.getElementById('telegramRegister');
    
    errorDiv.style.display = 'none';
    
    try {
        const response = await fetch('/api/auth/telegram', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                telegramUser: {
                    id: telegramUser.id,
                    first_name: telegramUser.first_name,
                    last_name: telegramUser.last_name,
                    username: telegramUser.username,
                    photo_url: telegramUser.photo_url,
                }
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Ошибка регистрации через Telegram');
        }
        
        // Save to localStorage
        localStorage.setItem('telegram_user_id', data.userId);
        localStorage.setItem('telegram_id', data.telegramId);
        localStorage.setItem('user_name', `${telegramUser.first_name} ${telegramUser.last_name || ''}`.trim());
        
        // Show success
        form.style.display = 'none';
        telegramDiv.style.display = 'none';
        successDiv.style.display = 'block';
        
    } catch (error) {
        console.error('Telegram registration error:', error);
        showError(error.message || 'Ошибка регистрации через Telegram');
    }
}

// Show error message
function showError(message) {
    const errorDiv = document.getElementById('registerError');
    const errorMessage = document.getElementById('errorMessage');
    
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
            // Auto-register if in Telegram
            const telegramDiv = document.getElementById('telegramRegister');
            telegramDiv.querySelector('button').textContent = 'Продолжить как ' + user.first_name;
        }
    }
    
    // Check if already logged in
    if (localStorage.getItem('user_id') || localStorage.getItem('telegram_user_id')) {
        window.location.href = '/courses.html';
    }
});

