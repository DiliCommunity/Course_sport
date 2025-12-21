// Register functionality
// Supabase credentials will be handled by API endpoints

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
        // Activate email tab
        emailTab.classList.add('active');
        phoneTab.classList.remove('active');
        
        // Show email field, hide phone field
        emailFieldGroup.style.display = 'block';
        phoneFieldGroup.style.display = 'none';
        passwordFieldsGroup.style.display = 'block';
        
        // Set required attributes
        emailInput.required = true;
        phoneInput.required = false;
        passwordInput.required = true;
        confirmPasswordInput.required = true;
        
        // Clear phone input
        phoneInput.value = '';
    } else {
        // Activate phone tab
        phoneTab.classList.add('active');
        emailTab.classList.remove('active');
        
        // Show phone field, hide email field
        emailFieldGroup.style.display = 'none';
        phoneFieldGroup.style.display = 'block';
        passwordFieldsGroup.style.display = 'none';
        
        // Set required attributes
        emailInput.required = false;
        phoneInput.required = true;
        passwordInput.required = false;
        confirmPasswordInput.required = false;
        
        // Clear email and password inputs
        emailInput.value = '';
        passwordInput.value = '';
        confirmPasswordInput.value = '';
    }
}

// Format phone number
function formatPhoneNumber(value) {
    // Remove all non-digit characters
    let cleaned = value.replace(/\D/g, '');
    
    // If starts with 8, replace with +7
    if (cleaned.startsWith('8')) {
        cleaned = '7' + cleaned.substring(1);
    }
    
    // If doesn't start with +7, add it
    if (!cleaned.startsWith('7') && cleaned.length > 0) {
        cleaned = '7' + cleaned;
    }
    
    // Format: +7 (XXX) XXX-XX-XX
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
    
    // Validate based on registration method
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
        // Phone registration
        if (!phone) {
            showError('Введите номер телефона');
            return;
        }
        
        // Format phone number
        let formattedPhone = formatPhoneNumber(phone);
        if (!formattedPhone.startsWith('+7') || formattedPhone.length < 12) {
            showError('Введите корректный номер телефона');
            return;
        }
    }
    
    // Disable button
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Регистрация...</span>';
    
    try {
        // Получаем реферальный код из URL
        const urlParams = new URLSearchParams(window.location.search);
        const referralCode = urlParams.get('ref');

        // Prepare request body based on method
        let requestBody = { name };
        
        if (referralCode) {
            requestBody.referral_code = referralCode;
        }
        
        if (currentRegistrationMethod === 'email') {
            requestBody.email = email;
            requestBody.password = password;
        } else {
            // Format phone: +7XXXXXXXXXX
            let cleanedPhone = phone.replace(/\D/g, '');
            if (cleanedPhone.startsWith('8')) {
                cleanedPhone = '7' + cleanedPhone.substring(1);
            }
            if (!cleanedPhone.startsWith('7')) {
                cleanedPhone = '7' + cleanedPhone;
            }
            requestBody.phone = '+' + cleanedPhone;
        }
        
        // Register through API endpoint
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
            credentials: 'include',
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || data.message || 'Ошибка регистрации');
        }
        
        // If phone registration, OTP was sent
        if (currentRegistrationMethod === 'phone' && data.success) {
            // Show OTP input form with formatted phone from response
            const phoneToShow = data.phone || requestBody.phone;
            showOTPForm(phoneToShow, name);
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>Создать аккаунт</span><span>→</span>';
            return;
        }
        
        // Email registration success
        form.style.display = 'none';
        successDiv.style.display = 'block';
        
        // Save to localStorage
        if (data.user) {
            localStorage.setItem('user_id', data.user.id);
            if (email) {
                localStorage.setItem('user_email', email);
            }
            localStorage.setItem('user_name', name);
        }
        
        // Redirect after 2 seconds
        setTimeout(() => {
            window.location.href = '/profile.html';
        }, 2000);
        
    } catch (error) {
        console.error('Registration error:', error);
        showError(error.message || 'Ошибка регистрации. Попробуйте позже.');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Создать аккаунт</span><span>→</span>';
    }
}

// Show OTP verification form
function showOTPForm(phone, name) {
    const form = document.getElementById('registerForm');
    const errorDiv = document.getElementById('registerError');
    errorDiv.style.display = 'none';
    
    // Escape HTML to prevent XSS
    const safePhone = phone.replace(/[&<>"']/g, function(m) {
        const escapeMap = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return escapeMap[m];
    });
    const safeName = name.replace(/[&<>"']/g, function(m) {
        const escapeMap = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return escapeMap[m];
    });
    
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
            <button type="button" class="btn-primary btn-full btn-large" onclick="verifyOTP('${safePhone}', '${safeName}')">
                <span>Подтвердить</span>
                <span>→</span>
            </button>
            <button type="button" class="btn-secondary btn-full" onclick="backToRegistration()" style="margin-top: 10px;">
                <span>← Назад</span>
            </button>
        </div>
    `;
    
    // Focus on OTP input
    setTimeout(() => {
        const otpInput = document.getElementById('otpCode');
        if (otpInput) {
            otpInput.focus();
        }
    }, 100);
}

// Verify OTP code
async function verifyOTP(phone, name) {
    const otpInput = document.getElementById('otpCode');
    const otpCode = otpInput.value.trim().replace(/\D/g, ''); // Only digits
    const errorDiv = document.getElementById('registerError');
    const successDiv = document.getElementById('registerSuccess');
    const submitBtn = document.querySelector('.otp-verification .btn-primary');
    
    if (!otpCode || otpCode.length !== 6) {
        showError('Введите 6-значный код');
        otpInput.focus();
        return;
    }
    
    errorDiv.style.display = 'none';
    
    // Disable button
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Проверка...</span>';
    }
    
    try {
        const response = await fetch('/api/auth/phone/verify-otp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                phone: phone,
                token: otpCode,
                name: name,
            }),
            credentials: 'include',
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Неверный код подтверждения');
        }
        
        // Success
        const form = document.getElementById('registerForm');
        if (form) {
            form.style.display = 'none';
        }
        successDiv.style.display = 'block';
        
        // Save to localStorage
        if (data.user) {
            localStorage.setItem('user_id', data.user.id);
            localStorage.setItem('user_phone', phone);
            localStorage.setItem('user_name', name);
        }
        if (data.session) {
            localStorage.setItem('telegram_auth', 'true');
        }
        
        // Redirect
        setTimeout(() => {
            window.location.href = '/profile.html';
        }, 2000);
        
    } catch (error) {
        console.error('OTP verification error:', error);
        showError(error.message || 'Ошибка подтверждения кода');
        
        // Re-enable button
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>Подтвердить</span><span>→</span>';
        }
        
        // Clear and focus OTP input
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
    // Check if Telegram WebApp is available
    if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        const user = tg.initDataUnsafe?.user;
        
        if (user) {
            handleTelegramRegistration(user);
        } else {
            // Open Telegram bot
            window.open('https://t.me/Course_Sport_bot', '_blank');
        }
    } else {
        // Open Telegram bot
        window.open('https://t.me/Course_Sport_bot', '_blank');
    }
}

// Register with VK (placeholder)
function registerWithVK() {
    // TODO: Implement VK OAuth
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
            credentials: 'include', // Важно для сохранения сессии
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Ошибка регистрации через Telegram');
        }
        
        if (data.requires_otp) {
            showError('Для завершения регистрации необходимо подтвердить номер телефона через SMS');
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

    // Phone input formatting
    const phoneInput = document.getElementById('phone');
    
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            let value = e.target.value;
            // Format phone number
            let formatted = formatPhoneNumber(value);
            e.target.value = formatted;
        });
        
        phoneInput.addEventListener('keydown', function(e) {
            // Allow backspace, delete, tab, escape, enter
            if ([8, 9, 27, 13, 46].indexOf(e.keyCode) !== -1 ||
                // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                (e.keyCode === 65 && e.ctrlKey === true) ||
                (e.keyCode === 67 && e.ctrlKey === true) ||
                (e.keyCode === 86 && e.ctrlKey === true) ||
                (e.keyCode === 88 && e.ctrlKey === true) ||
                // Allow home, end, left, right
                (e.keyCode >= 35 && e.keyCode <= 39)) {
                return;
            }
            // Allow +, space, parentheses, dash
            if ([43, 32, 40, 41, 45].indexOf(e.keyCode) !== -1) {
                return;
            }
            // Ensure that it is a number and stop the keypress
            if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                e.preventDefault();
            }
        });
    }
    
    // OTP input formatting (only digits)
    document.addEventListener('DOMContentLoaded', () => {
        // This will be called when OTP form is shown
        const observer = new MutationObserver(function(mutations) {
            const otpInput = document.getElementById('otpCode');
            if (otpInput && !otpInput.hasAttribute('data-listener-added')) {
                otpInput.setAttribute('data-listener-added', 'true');
                otpInput.addEventListener('input', function(e) {
                    // Only allow digits
                    e.target.value = e.target.value.replace(/\D/g, '').substring(0, 6);
                });
                
                otpInput.addEventListener('keydown', function(e) {
                    // Allow backspace, delete, tab, escape, enter
                    if ([8, 9, 27, 13, 46].indexOf(e.keyCode) !== -1 ||
                        // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                        (e.keyCode === 65 && e.ctrlKey === true) ||
                        (e.keyCode === 67 && e.ctrlKey === true) ||
                        (e.keyCode === 86 && e.ctrlKey === true) ||
                        (e.keyCode === 88 && e.ctrlKey === true) ||
                        // Allow home, end, left, right
                        (e.keyCode >= 35 && e.keyCode <= 39)) {
                        return;
                    }
                    // Only allow digits
                    if ((e.keyCode < 48 || e.keyCode > 57) && (e.keyCode < 96 || e.keyCode > 105)) {
                        e.preventDefault();
                    }
                });
            }
        });
        
        const form = document.getElementById('registerForm');
        if (form) {
            observer.observe(form, { childList: true, subtree: true });
        }
    });
    
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
            if (telegramDiv) {
                const button = telegramDiv.querySelector('button');
                if (button) {
                    button.textContent = 'Продолжить как ' + user.first_name;
                }
            }
        }
    }
    
    // Check if already logged in
    if (localStorage.getItem('user_id') || localStorage.getItem('telegram_user_id')) {
        window.location.href = '/courses.html';
    }
});

