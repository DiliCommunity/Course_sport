// Register functionality - использует Supabase напрямую

// Current registration method
let currentRegistrationMethod = 'email'; // 'email' or 'phone'

// Switch registration method
function switchRegistrationMethod(method) {
    currentRegistrationMethod = method;
    
    const emailTab = document.getElementById('emailTab');
    const phoneTab = document.getElementById('phoneTab');
    const emailFieldGroup = document.getElementById('emailFieldGroup');
    const phoneFieldGroup = document.getElementById('phoneFieldGroup');
    const passwordFieldsGroup = document.getElementById('passwordFieldsGroup');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    
    if (method === 'email') {
        emailTab.classList.add('active');
        phoneTab.classList.remove('active');
        emailFieldGroup.style.display = 'block';
        phoneFieldGroup.style.display = 'none';
        passwordFieldsGroup.style.display = 'block';
        emailInput.required = true;
        phoneInput.required = false;
        passwordInput.required = true;
        confirmPasswordInput.required = true;
        phoneInput.value = '';
    } else {
        phoneTab.classList.add('active');
        emailTab.classList.remove('active');
        emailFieldGroup.style.display = 'none';
        phoneFieldGroup.style.display = 'block';
        passwordFieldsGroup.style.display = 'none';
        emailInput.required = false;
        phoneInput.required = true;
        passwordInput.required = false;
        confirmPasswordInput.required = false;
        emailInput.value = '';
        passwordInput.value = '';
        confirmPasswordInput.value = '';
    }
}

// Format phone number
function formatPhoneNumber(value) {
    let cleaned = value.replace(/\D/g, '');
    
    if (cleaned.startsWith('8')) {
        cleaned = '7' + cleaned.substring(1);
    }
    
    if (!cleaned.startsWith('7') && cleaned.length > 0) {
        cleaned = '7' + cleaned;
    }
    
    if (cleaned.length > 0) {
        let formatted = '+7';
        if (cleaned.length > 1) {
            formatted += ' (' + cleaned.substring(1, 4);
        }
        if (cleaned.length >= 4) {
            formatted += ') ' + cleaned.substring(4, 7);
        }
        if (cleaned.length >= 7) {
            formatted += '-' + cleaned.substring(7, 9);
        }
        if (cleaned.length >= 9) {
            formatted += '-' + cleaned.substring(9, 11);
        }
        return formatted;
    }
    
    return value;
}

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

// Handle form registration - через Supabase
async function handleRegister(event) {
    event.preventDefault();
    
    const form = document.getElementById('registerForm');
    const errorDiv = document.getElementById('registerError');
    const successDiv = document.getElementById('registerSuccess');
    const submitBtn = form.querySelector('button[type="submit"]');
    
    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';
    
    // Get form data
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const terms = document.getElementById('terms').checked;
    
    // Validation
    if (!name) {
        showError('Введите ваше имя');
        return;
    }
    
    if (!terms) {
        showError('Необходимо согласиться с условиями использования');
        return;
    }
    
    if (currentRegistrationMethod === 'email') {
        if (!email) {
            showError('Введите email');
            return;
        }
        
        if (!password) {
            showError('Введите пароль');
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
    } else {
        if (!phone) {
            showError('Введите номер телефона');
            return;
        }
    }
    
    // Disable button
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Регистрация...</span>';
    
    try {
        // Проверяем что Supabase загружен
        if (!window.SupabaseAuth) {
            throw new Error('Supabase не загружен. Обновите страницу.');
        }
        
        // Получаем реферальный код из URL
        const urlParams = new URLSearchParams(window.location.search);
        const referralCode = urlParams.get('ref');
        
        if (currentRegistrationMethod === 'email') {
            // Регистрация по email через Supabase
            const data = await window.SupabaseAuth.signUpWithEmail(email, password, name, referralCode);
            
            if (!data.user) {
                throw new Error('Не удалось создать аккаунт');
            }
            
            console.log('Registration successful:', data.user.id);
            
            // Проверяем, нужно ли подтверждение email
            if (data.session) {
                // Автоматический вход - редирект на профиль
                form.style.display = 'none';
                successDiv.innerHTML = `
                    <div class="success-icon">✅</div>
                    <h3>Регистрация успешна!</h3>
                    <p>Добро пожаловать, ${name}!</p>
                    <a href="/profile.html" class="btn-primary btn-full">Перейти в профиль</a>
                `;
                successDiv.style.display = 'block';
                
                setTimeout(() => {
                    window.location.href = '/profile.html';
                }, 2000);
            } else {
                // Нужно подтвердить email
                form.style.display = 'none';
                successDiv.innerHTML = `
                    <div class="success-icon">📧</div>
                    <h3>Проверьте почту!</h3>
                    <p>Мы отправили письмо на <strong>${email}</strong></p>
                    <p>Перейдите по ссылке в письме для завершения регистрации.</p>
                    <a href="/login.html" class="btn-primary btn-full">Перейти ко входу</a>
                `;
                successDiv.style.display = 'block';
            }
            
        } else {
            // Регистрация по телефону - отправка OTP
            const data = await window.SupabaseAuth.signInWithPhone(phone, name);
            
            console.log('OTP sent to:', data.phone);
            
            // Показываем форму ввода OTP
            showOTPForm(data.phone, name);
        }
        
    } catch (error) {
        console.error('Registration error:', error);
        let message = error.message || 'Ошибка регистрации';
        
        // Translate common errors
        if (message.includes('User already registered')) {
            message = 'Пользователь с таким email уже зарегистрирован';
        } else if (message.includes('Password should be')) {
            message = 'Пароль должен быть минимум 6 символов';
        } else if (message.includes('Invalid email')) {
            message = 'Некорректный email адрес';
        }
        
        showError(message);
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Создать аккаунт</span><span>→</span>';
    }
}

// Show OTP verification form
function showOTPForm(phone, name) {
    const form = document.getElementById('registerForm');
    const errorDiv = document.getElementById('registerError');
    errorDiv.style.display = 'none';
    
    const safePhone = phone.replace(/[&<>"']/g, m => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    }[m]));
    
    form.innerHTML = `
        <div class="otp-verification">
            <div class="otp-icon">📱</div>
            <h3>Подтверждение номера телефона</h3>
            <p>Мы отправили SMS с кодом подтверждения на номер <strong>${safePhone}</strong></p>
            <div class="form-group">
                <label for="otpCode">Код подтверждения</label>
                <input 
                    type="text" 
                    id="otpCode" 
                    name="otpCode" 
                    placeholder="Введите 6-значный код"
                    maxlength="6"
                    pattern="[0-9]{6}"
                    required
                    autocomplete="one-time-code"
                    inputmode="numeric"
                >
            </div>
            <button type="button" class="btn-primary btn-full btn-large" onclick="verifyOTP('${safePhone}')">
                <span>Подтвердить</span>
                <span>→</span>
            </button>
            <button type="button" class="btn-secondary btn-full" onclick="backToRegistration()" style="margin-top: 10px;">
                <span>← Назад</span>
            </button>
        </div>
    `;
    
    setTimeout(() => {
        const otpInput = document.getElementById('otpCode');
        if (otpInput) otpInput.focus();
    }, 100);
}

// Verify OTP code
async function verifyOTP(phone) {
    const otpInput = document.getElementById('otpCode');
    const otpCode = otpInput.value.trim().replace(/\D/g, '');
    const errorDiv = document.getElementById('registerError');
    const successDiv = document.getElementById('registerSuccess');
    const submitBtn = document.querySelector('.otp-verification .btn-primary');
    
    if (!otpCode || otpCode.length !== 6) {
        showError('Введите 6-значный код');
        otpInput.focus();
        return;
    }
    
    errorDiv.style.display = 'none';
    
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Проверка...</span>';
    }
    
    try {
        if (!window.SupabaseAuth) {
            throw new Error('Supabase не загружен');
        }
        
        const data = await window.SupabaseAuth.verifyOTP(phone, otpCode);
        
        if (!data.user) {
            throw new Error('Не удалось подтвердить номер');
        }
        
        console.log('OTP verified:', data.user.id);
        
        // Success
        const form = document.getElementById('registerForm');
        if (form) form.style.display = 'none';
        
        successDiv.innerHTML = `
            <div class="success-icon">✅</div>
            <h3>Регистрация успешна!</h3>
            <p>Добро пожаловать!</p>
            <a href="/profile.html" class="btn-primary btn-full">Перейти в профиль</a>
        `;
        successDiv.style.display = 'block';
        
        setTimeout(() => {
            window.location.href = '/profile.html';
        }, 2000);
        
    } catch (error) {
        console.error('OTP verification error:', error);
        showError(error.message || 'Неверный код подтверждения');
        
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>Подтвердить</span><span>→</span>';
        }
        
        if (otpInput) {
            otpInput.value = '';
            otpInput.focus();
        }
    }
}

// Back to registration form
function backToRegistration() {
    window.location.reload();
}

// Register with Telegram
function registerWithTelegram() {
    if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        const user = tg.initDataUnsafe?.user;
        
        if (user) {
            handleTelegramRegistration(user);
        } else {
            window.open('https://t.me/Course_Sport_bot', '_blank');
        }
    } else {
        window.open('https://t.me/Course_Sport_bot', '_blank');
    }
}

// Register with VK (placeholder)
function registerWithVK() {
    alert('Регистрация через ВКонтакте скоро будет доступна');
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
            throw new Error(data.error || 'Ошибка регистрации через Telegram');
        }
        
        // Show success
        form.style.display = 'none';
        if (telegramDiv) telegramDiv.style.display = 'none';
        successDiv.style.display = 'block';
        
        setTimeout(() => {
            window.location.href = '/profile.html';
        }, 1000);
        
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
    
    errorDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Phone input formatting
document.addEventListener('DOMContentLoaded', () => {
    const phoneInput = document.getElementById('phone');
    
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            e.target.value = formatPhoneNumber(e.target.value);
        });
    }
});

// Check if user is already logged in
window.addEventListener('DOMContentLoaded', async () => {
    // Check Telegram WebApp
    if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();
        
        const user = tg.initDataUnsafe?.user;
        if (user) {
            const telegramDiv = document.getElementById('telegramRegister');
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
});
