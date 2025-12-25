// Простой вход (логин + пароль)
// Сессия устанавливается через cookie на сервере

// Показать/скрыть пароль
function toggleLoginPassword() {
    const passwordInput = document.getElementById('loginPassword');
    const eyeIcon = document.querySelector('#loginPassword ~ .password-toggle .eye-icon');
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
    const errorDiv = document.getElementById('loginError');
    const errorMessage = document.getElementById('loginErrorMessage');
    
    if (errorDiv && errorMessage) {
        errorDiv.style.display = 'block';
        errorMessage.textContent = message;
    } else {
        alert(message);
    }
}

// Скрыть ошибку
function hideError() {
    const errorDiv = document.getElementById('loginError');
    if (errorDiv) errorDiv.style.display = 'none';
}

// Показать успех
function showSuccess() {
    const successDiv = document.getElementById('loginSuccess');
    const formDiv = document.getElementById('loginForm');
    const errorDiv = document.getElementById('loginError');
    
    if (successDiv) successDiv.style.display = 'block';
    if (formDiv) formDiv.style.display = 'none';
    if (errorDiv) errorDiv.style.display = 'none';
}

// Обработка входа
async function handleLogin(event) {
    event.preventDefault();
    hideError();

    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;

    // Валидация
    if (!username) {
        showError('Введите логин');
        return;
    }

    if (!password) {
        showError('Введите пароль');
        return;
    }

    // Показываем загрузку
    const submitBtn = document.querySelector('#loginForm button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span>Вход...</span>';
    submitBtn.disabled = true;

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include', // Важно для cookies
            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Неверный логин или пароль');
        }

        // Cookie сессии устанавливается сервером автоматически
        // Показываем успех
        showSuccess();

        // Перенаправляем через 1 секунду
        setTimeout(() => {
            window.location.href = '/profile.html';
        }, 1000);

    } catch (error) {
        console.error('Ошибка входа:', error);
        showError(error.message || 'Произошла ошибка при входе');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Проверяем, авторизован ли пользователь
document.addEventListener('DOMContentLoaded', async function() {
    try {
        const response = await fetch('/api/profile/data', {
            credentials: 'include'
        });
        
        if (response.ok) {
            // Уже авторизован - перенаправляем на профиль
            window.location.href = '/profile.html';
        }
    } catch (error) {
        // Не авторизован - остаёмся на странице
    }
});
