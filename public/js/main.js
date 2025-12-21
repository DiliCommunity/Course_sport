// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Header scroll effect
let lastScroll = 0;
const header = document.querySelector('.header');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
        header.style.background = 'rgba(10, 10, 11, 0.95)';
    } else {
        header.style.background = 'rgba(10, 10, 11, 0.8)';
    }
    
    lastScroll = currentScroll;
});

// Animate on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe course cards
document.querySelectorAll('.course-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(card);
});

// Add hover effect to buttons
document.querySelectorAll('.btn-primary, .btn-secondary').forEach(btn => {
    btn.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-2px)';
    });
    
    btn.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
    });
});

// Mobile Menu
const burgerMenu = document.getElementById('burgerMenu');
const mobileMenu = document.getElementById('mobileMenu');
const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
const mobileMenuClose = document.getElementById('mobileMenuClose');

if (burgerMenu && mobileMenu && mobileMenuOverlay && mobileMenuClose) {
    // Open menu
    burgerMenu.addEventListener('click', () => {
        mobileMenu.classList.add('active');
        mobileMenuOverlay.classList.add('active');
        burgerMenu.classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    // Close menu
    const closeMenu = () => {
        mobileMenu.classList.remove('active');
        mobileMenuOverlay.classList.remove('active');
        burgerMenu.classList.remove('active');
        document.body.style.overflow = '';
    };

    mobileMenuClose.addEventListener('click', closeMenu);
    mobileMenuOverlay.addEventListener('click', closeMenu);

    // Close menu when clicking on a link
    const mobileMenuLinks = mobileMenu.querySelectorAll('.mobile-menu-links a');
    mobileMenuLinks.forEach(link => {
        link.addEventListener('click', () => {
            setTimeout(closeMenu, 200);
        });
    });

    // Close menu on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mobileMenu.classList.contains('active')) {
            closeMenu();
        }
    });
}

// Check authentication through Supabase and show/hide profile links
async function checkAuth() {
    const authButtons = document.getElementById('authButtons');
    const guestButtons = document.getElementById('guestButtons');
    const mobileProfileLink = document.getElementById('mobileProfileLink');
    
    // Ждем загрузки Supabase
    let attempts = 0;
    while (!window.SupabaseAuth && attempts < 30) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    
    let isAuthenticated = false;
    
    if (window.SupabaseAuth) {
        try {
            const user = await window.SupabaseAuth.getCurrentUser();
            isAuthenticated = !!user;
        } catch (error) {
            console.error('Auth check error:', error);
        }
    }
    
    if (isAuthenticated) {
        // User is authenticated
        if (authButtons && guestButtons) {
            authButtons.style.display = 'flex';
            authButtons.style.gap = '10px';
            authButtons.style.alignItems = 'center';
            guestButtons.style.display = 'none';
        }
        
        if (mobileProfileLink) {
            mobileProfileLink.style.display = 'block';
        }
    } else {
        // User is not authenticated
        if (authButtons && guestButtons) {
            authButtons.style.display = 'none';
            guestButtons.style.display = 'flex';
            guestButtons.style.gap = '10px';
            guestButtons.style.alignItems = 'center';
        }
        
        if (mobileProfileLink) {
            mobileProfileLink.style.display = 'none';
        }
    }
}

// Logout function (global)
async function logout() {
    try {
        if (window.SupabaseAuth) {
            await window.SupabaseAuth.signOut();
        }
        window.location.href = '/index.html';
    } catch (error) {
        console.error('Logout error:', error);
        window.location.href = '/index.html';
    }
}

// Check auth on page load
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});

console.log('Course Health - сайт загружен успешно!');
