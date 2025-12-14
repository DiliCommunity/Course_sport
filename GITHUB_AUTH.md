# 🔐 Настройка аутентификации GitHub

## Проблема
```
remote: No anonymous write access.
fatal: Authentication failed for 'https://github.com/DiliCommunity/Course_sport.git/'
```

## Решение 1: Personal Access Token (Рекомендуется)

### Шаг 1: Создайте Personal Access Token

1. Перейдите на GitHub: https://github.com/settings/tokens
2. Нажмите **Generate new token** → **Generate new token (classic)**
3. Назовите токен (например: "Course Health Deploy")
4. Выберите срок действия (рекомендуется: 90 дней или No expiration)
5. Выберите права доступа:
   - ✅ `repo` (полный доступ к репозиториям)
6. Нажмите **Generate token**
7. **ВАЖНО:** Скопируйте токен сразу! Он показывается только один раз!

### Шаг 2: Используйте токен для push

При следующем push используйте:
- **Username:** `DiliCommunity`
- **Password:** ваш Personal Access Token (НЕ пароль от GitHub!)

Или выполните:

```bash
git push origin main
```

Когда попросит пароль - вставьте токен.

### Шаг 3: Сохранить credentials (опционально)

Чтобы не вводить токен каждый раз:

```bash
git config --global credential.helper wincred
```

## Решение 2: SSH ключ

### Шаг 1: Проверьте, есть ли SSH ключ

```bash
ls ~/.ssh/id_rsa.pub
```

Если файла нет, создайте ключ:

```bash
ssh-keygen -t ed25519 -C "dilicommunity076@gmail.com"
```

Нажмите Enter для всех вопросов.

### Шаг 2: Добавьте ключ в GitHub

1. Скопируйте публичный ключ:
```bash
cat ~/.ssh/id_rsa.pub
```

2. Перейдите на GitHub: https://github.com/settings/keys
3. Нажмите **New SSH key**
4. Вставьте ключ и сохраните

### Шаг 3: Измените remote на SSH

```bash
git remote set-url origin git@github.com:DiliCommunity/Course_sport.git
```

### Шаг 4: Проверьте подключение

```bash
ssh -T git@github.com
```

Должно быть: "Hi DiliCommunity! You've successfully authenticated..."

### Шаг 5: Push

```bash
git push origin main
```

## Решение 3: GitHub CLI

### Установите GitHub CLI

```bash
winget install --id GitHub.cli
```

Или скачайте с: https://cli.github.com/

### Авторизуйтесь

```bash
gh auth login
```

Следуйте инструкциям.

### Push

```bash
git push origin main
```

## Быстрое решение (Windows Credential Manager)

Если у вас уже есть токен:

```bash
# Настройте credential helper
git config --global credential.helper wincred

# Попробуйте push
git push origin main
```

При запросе:
- Username: `DiliCommunity`
- Password: ваш Personal Access Token

Windows сохранит эти данные.

## Проверка

После настройки проверьте:

```bash
git push origin main
```

Должно работать без ошибок аутентификации!

