// Supabase Client для браузера
// Этот файл инициализирует Supabase клиент для статических HTML страниц

// Supabase configuration - загружается из meta тегов или напрямую
const SUPABASE_URL = 'https://ynfciltkggqfkperobet.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InluZmNpbHRrZ2dxZmtwZXJvYmV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQxMTk0NzAsImV4cCI6MjA0OTY5NTQ3MH0.1NLjnjbF_brZaHKFCshxhqLQfJyJfwPNqDpzwGPNz4E';

// Глобальный Supabase клиент
let supabaseClient = null;

// Инициализация Supabase
function initSupabase() {
    if (supabaseClient) return supabaseClient;
    
    if (typeof window.supabase === 'undefined') {
        console.error('Supabase JS library not loaded! Add script tag for @supabase/supabase-js');
        return null;
    }
    
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
            storage: window.localStorage,
            storageKey: 'supabase.auth.token',
        }
    });
    
    console.log('Supabase client initialized');
    return supabaseClient;
}

// Получить текущую сессию
async function getSession() {
    const client = initSupabase();
    if (!client) return null;
    
    const { data: { session }, error } = await client.auth.getSession();
    if (error) {
        console.error('Error getting session:', error);
        return null;
    }
    return session;
}

// Получить текущего пользователя
async function getCurrentUser() {
    const client = initSupabase();
    if (!client) return null;
    
    try {
        const { data: { user }, error } = await client.auth.getUser();
        if (error) {
            // Не логируем ошибку "Auth session missing" - это нормально для неавторизованных
            if (!error.message?.includes('session')) {
                console.error('Error getting user:', error);
            }
            return null;
        }
        return user;
    } catch (e) {
        // Игнорируем ошибки сети
        return null;
    }
}

// Регистрация по email
async function signUpWithEmail(email, password, name, referralCode) {
    const client = initSupabase();
    if (!client) throw new Error('Supabase not initialized');
    
    const { data, error } = await client.auth.signUp({
        email,
        password,
        options: {
            data: {
                name: name,
                full_name: name,
                referral_code: referralCode || null,
            }
        }
    });
    
    if (error) throw error;
    return data;
}

// Вход по email
async function signInWithEmail(email, password) {
    const client = initSupabase();
    if (!client) throw new Error('Supabase not initialized');
    
    const { data, error } = await client.auth.signInWithPassword({
        email,
        password
    });
    
    if (error) throw error;
    return data;
}

// Регистрация/вход по телефону (отправка OTP)
async function signInWithPhone(phone, name) {
    const client = initSupabase();
    if (!client) throw new Error('Supabase not initialized');
    
    // Форматируем телефон
    let cleanedPhone = phone.replace(/\D/g, '');
    if (cleanedPhone.startsWith('8')) {
        cleanedPhone = '7' + cleanedPhone.substring(1);
    }
    if (!cleanedPhone.startsWith('7')) {
        cleanedPhone = '7' + cleanedPhone;
    }
    const formattedPhone = '+' + cleanedPhone;
    
    const { data, error } = await client.auth.signInWithOtp({
        phone: formattedPhone,
        options: {
            data: {
                name: name,
                full_name: name,
            }
        }
    });
    
    if (error) throw error;
    return { ...data, phone: formattedPhone };
}

// Подтверждение OTP
async function verifyOTP(phone, token) {
    const client = initSupabase();
    if (!client) throw new Error('Supabase not initialized');
    
    const { data, error } = await client.auth.verifyOtp({
        phone,
        token,
        type: 'sms'
    });
    
    if (error) throw error;
    return data;
}

// Выход
async function signOut() {
    const client = initSupabase();
    if (!client) throw new Error('Supabase not initialized');
    
    const { error } = await client.auth.signOut();
    if (error) throw error;
    
    // Очищаем все данные
    localStorage.removeItem('supabase.auth.token');
    
    return true;
}

// Получить профиль пользователя из БД
async function getUserProfile(userId) {
    const client = initSupabase();
    if (!client) return null;
    
    const { data, error } = await client
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
    
    if (error) {
        console.error('Error fetching profile:', error);
        return null;
    }
    return data;
}

// Получить баланс пользователя
async function getUserBalance(userId) {
    const client = initSupabase();
    if (!client) return null;
    
    const { data, error } = await client
        .from('user_balance')
        .select('*')
        .eq('user_id', userId)
        .single();
    
    if (error && error.code !== 'PGRST116') {
        console.error('Error fetching balance:', error);
        return null;
    }
    return data || { balance: 0, total_earned: 0, total_withdrawn: 0 };
}

// Получить реферальный код пользователя
async function getUserReferralCode(userId) {
    const client = initSupabase();
    if (!client) return null;
    
    const { data, error } = await client
        .from('user_referral_codes')
        .select('*')
        .eq('user_id', userId)
        .single();
    
    if (error && error.code !== 'PGRST116') {
        console.error('Error fetching referral code:', error);
        return null;
    }
    return data;
}

// Получить рефералов пользователя
async function getUserReferrals(userId) {
    const client = initSupabase();
    if (!client) return [];
    
    const { data, error } = await client
        .from('referrals')
        .select(`
            *,
            referred:users!referrals_referred_id_fkey(id, name, email, phone, created_at)
        `)
        .eq('referrer_id', userId)
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error('Error fetching referrals:', error);
        return [];
    }
    return data || [];
}

// Получить курсы пользователя
async function getUserEnrollments(userId) {
    const client = initSupabase();
    if (!client) return [];
    
    const { data, error } = await client
        .from('enrollments')
        .select(`
            *,
            course:courses(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error('Error fetching enrollments:', error);
        return [];
    }
    return data || [];
}

// Получить транзакции пользователя
async function getUserTransactions(userId) {
    const client = initSupabase();
    if (!client) return [];
    
    const { data, error } = await client
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
    
    if (error) {
        console.error('Error fetching transactions:', error);
        return [];
    }
    return data || [];
}

// Проверить авторизацию и вернуть полные данные профиля
async function checkAuthAndGetProfile() {
    const user = await getCurrentUser();
    if (!user) return null;
    
    const [profile, balance, referralCode, referrals, enrollments, transactions] = await Promise.all([
        getUserProfile(user.id),
        getUserBalance(user.id),
        getUserReferralCode(user.id),
        getUserReferrals(user.id),
        getUserEnrollments(user.id),
        getUserTransactions(user.id)
    ]);
    
    return {
        user: {
            id: user.id,
            email: user.email,
            phone: user.phone,
            ...profile
        },
        balance,
        referralCode,
        referrals,
        enrollments,
        transactions,
        referralStats: {
            total: referrals.length,
            active: referrals.filter(r => r.status === 'active').length,
            totalEarned: referrals.reduce((sum, r) => sum + (r.referrer_earned || 0) + (r.total_earned_from_purchases || 0), 0)
        }
    };
}

// Слушатель изменения состояния авторизации
function onAuthStateChange(callback) {
    const client = initSupabase();
    if (!client) return null;
    
    return client.auth.onAuthStateChange((event, session) => {
        console.log('Auth state changed:', event);
        callback(event, session);
    });
}

// Экспортируем в глобальный объект
window.SupabaseAuth = {
    init: initSupabase,
    getSession,
    getCurrentUser,
    signUpWithEmail,
    signInWithEmail,
    signInWithPhone,
    verifyOTP,
    signOut,
    getUserProfile,
    getUserBalance,
    getUserReferralCode,
    getUserReferrals,
    getUserEnrollments,
    getUserTransactions,
    checkAuthAndGetProfile,
    onAuthStateChange,
    getClient: () => supabaseClient
};

// Автоинициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    // Ждем загрузки Supabase библиотеки
    if (typeof window.supabase !== 'undefined') {
        initSupabase();
    } else {
        // Ждем загрузки скрипта
        const checkSupabase = setInterval(() => {
            if (typeof window.supabase !== 'undefined') {
                clearInterval(checkSupabase);
                initSupabase();
            }
        }, 100);
        
        // Таймаут через 5 секунд
        setTimeout(() => clearInterval(checkSupabase), 5000);
    }
});

console.log('Supabase client module loaded');
