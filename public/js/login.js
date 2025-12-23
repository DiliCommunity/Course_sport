// Простой вход (логин + пароль)

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
    
    errorDiv.style.display = 'block';
    errorMessage.textContent = message;
}

// Скрыть ошибку
function hideError() {
    document.getElementById('loginError').style.display = 'none';
}

// Показать успех
function showSuccess() {
    document.getElementById('loginSuccess').style.display = 'block';
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('loginError').style.display = 'none';
}

// Обработка входа
async function handleLogin(event) {
    event.preventDefault();
    hideError();

    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const remember = document.getElementById('remember')?.checked || false;

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
        // Формируем email из логина если нужно
        const userEmail = username.includes('@') ? username : `${username}@temp.local`;
        
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: userEmail,
                password: password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Неверный логин или пароль');
        }

        // Сохраняем данные пользователя
        localStorage.setItem('user_id', data.user_id);
        localStorage.setItem('user_email', data.email);
        
        if (remember) {
            localStorage.setItem('remember_login', 'true');
        }

        // Показываем успех
        showSuccess();

        // Перенаправляем через 1 секунду
        setTimeout(() => {
            window.location.href = '/courses.html';
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
document.addEventListener('DOMContentLoaded', function() {
    const userId = localStorage.getItem('user_id');
    if (userId) {
        // Уже авторизован - перенаправляем на курсы
        window.location.href = '/courses.html';
    }
});
