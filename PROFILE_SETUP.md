# Настройка профиля пользователя

## Требования

1. **База данных Supabase**
   - Выполните обновленный `supabase/schema.sql` для создания новых таблиц:
     - `user_balance` - баланс пользователя
     - `referrals` - реферальная система
     - `transactions` - история транзакций

2. **Supabase Storage**
   - Создайте bucket с именем `avatars` в Supabase Storage
   - Настройте политики доступа:
     ```sql
     -- Политика для загрузки аватаров (только авторизованные пользователи)
     CREATE POLICY "Users can upload own avatars"
     ON storage.objects FOR INSERT
     TO authenticated
     WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

     -- Политика для чтения аватаров (публичный доступ)
     CREATE POLICY "Public avatar access"
     ON storage.objects FOR SELECT
     TO public
     USING (bucket_id = 'avatars');
     ```

3. **Переменные окружения**
   - Убедитесь, что в `.env.local` указаны:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

## Функционал профиля

### 1. Аватарка
- Загрузка фото из галереи
- Автоматическое обновление после загрузки
- Валидация размера (макс. 5MB) и типа файла

### 2. Баланс
- Текущий баланс
- Общая сумма заработанного
- Сумма выведенных средств

### 3. Купленные курсы
- Список всех купленных курсов
- Прогресс прохождения каждого курса
- Быстрый переход к курсу

### 4. Реферальная система
- Уникальная реферальная ссылка
- Статистика приглашенных друзей
- Заработанные средства с рефералов
- Копирование ссылки одним кликом

### 5. История транзакций
- Все операции с балансом
- Типы транзакций: заработано, выведено, потрачено, возврат
- Фильтрация и сортировка

## API Endpoints

- `POST /api/profile/avatar` - Загрузка аватара
- `GET /api/profile/data` - Получение данных профиля
- `POST /api/referrals/generate` - Генерация реферального кода

## Компоненты

- `AvatarUpload` - Загрузка и отображение аватара
- `BalanceCard` - Карточка баланса
- `ReferralSection` - Реферальная секция
- `CoursesList` - Список курсов
- `TransactionsHistory` - История транзакций

## Стили

Профиль использует дизайн в стиле SpaceX:
- Glassmorphism эффекты
- Градиенты и анимации
- Темная тема с акцентами
- Плавные переходы и hover-эффекты
