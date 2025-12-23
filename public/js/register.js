// Простая регистрация (логин + пароль)

// Получаем реферальный код из URL
const urlParams = new URLSearchParams(window.location.search);
const referralCode = urlParams.get('ref');

// Если есть реферальный код - сохраняем его
if (referralCode) {
    localStorage.setItem('pending_referral', referralCode);
    console.log('Реферальный код сохранён:', referralCode);
}

// Показать/скрыть пароль
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const eyeIcon = document.querySelector('#password ~ .password-toggle .eye-icon');
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
    const eyeIcon = document.querySelector('#confirmPassword ~ .password-toggle .eye-icon');
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeIcon.textContent = '🙈';
    } else {
        passwordInput.type = 'password';
        eyeIcon.textContent = '👁️';
    }
}

// Показать ошибку
function showError(message) {
    const errorDiv = document.getElementById('registerError');
    const errorMessage = document.getElementById('errorMessage');
    
    if (errorDiv && errorMessage) {
        errorDiv.style.display = 'block';
        errorMessage.textContent = message;
    } else {
        alert(message);
    }
    
    // Скрыть форму успеха если была показана
    const successDiv = document.getElementById('registerSuccess');
    if (successDiv) successDiv.style.display = 'none';
}

// Скрыть ошибку
function hideError() {
    const errorDiv = document.getElementById('registerError');
    if (errorDiv) errorDiv.style.display = 'none';
}

// Показать успех
function showSuccess() {
    const successDiv = document.getElementById('registerSuccess');
    const formDiv = document.getElementById('registerForm');
    const errorDiv = document.getElementById('registerError');
    
    if (successDiv) successDiv.style.display = 'block';
    if (formDiv) formDiv.style.display = 'none';
    if (errorDiv) errorDiv.style.display = 'none';
}

// Обработка регистрации
async function handleRegister(event) {
    event.preventDefault();
    hideError();

    const username = document.getElementById('username').value.trim();
    const name = document.getElementById('name').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const email = document.getElementById('email')?.value.trim() || '';
    const phone = document.getElementById('phone')?.value.trim() || '';
    const terms = document.getElementById('terms').checked;

    // Валидация
    if (!username || username.length < 3) {
        showError('Логин должен содержать минимум 3 символа');
        return;
    }

    if (!name) {
        showError('Введите ваше имя');
        return;
    }

    if (password.length < 6) {
        showError('Пароль должен содержать минимум 6 символов');
        return;
    }

    if (password !== confirmPassword) {
        showError('Пароли не совпадают');
        return;
    }

    if (!terms) {
        showError('Необходимо принять условия использования');
        return;
    }

    // Показываем загрузку
    const submitBtn = document.querySelector('#registerForm button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span>Регистрация...</span>';
    submitBtn.disabled = true;

    try {
        // Получаем сохраненный реферальный код
        const savedReferral = localStorage.getItem('pending_referral');
        
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                password: password,
                name: name,
                email: email || null,
                phone: phone || null,
                referralCode: savedReferral || null
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Ошибка регистрации');
        }

        // Сохраняем данные пользователя
        localStorage.setItem('user_id', data.user_id);
        localStorage.setItem('user_name', name);
        localStorage.setItem('user_username', username);
        if (email) localStorage.setItem('user_email', email);
        if (phone) localStorage.setItem('user_phone', phone);
        
        // Удаляем использованный реферальный код
        localStorage.removeItem('pending_referral');

        // Показываем успех
        showSuccess();

        // Перенаправляем через 2 секунды
        setTimeout(() => {
            window.location.href = '/courses.html';
        }, 2000);

    } catch (error) {
        console.error('Ошибка регистрации:', error);
        showError(error.message || 'Произошла ошибка при регистрации');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Проверяем, авторизован ли пользователь
document.addEventListener('DOMContentLoaded', function() {
    const userId = localStorage.getItem('user_id');
    if (userId) {
        // Уже авторизован - перенаправляем на курсы
        window.location.href = '/courses.html';
    }
});
