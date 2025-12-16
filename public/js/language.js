// Language switcher functionality
class LanguageSwitcher {
    constructor() {
        this.currentLang = localStorage.getItem('language') || 'ru';
        this.init();
    }

    init() {
        // Load saved language
        this.setLanguage(this.currentLang);
        
        // Setup language switcher button
        this.setupLanguageButton();
    }

    setupLanguageButton() {
        const langButton = document.getElementById('languageButton');
        const langDropdown = document.getElementById('languageDropdown');
        
        if (langButton && langDropdown) {
            langButton.addEventListener('click', (e) => {
                e.stopPropagation();
                langDropdown.classList.toggle('active');
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!langButton.contains(e.target) && !langDropdown.contains(e.target)) {
                    langDropdown.classList.remove('active');
                }
            });

            // Language selection
            const langOptions = langDropdown.querySelectorAll('.lang-option');
            langOptions.forEach(option => {
                option.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const lang = option.getAttribute('data-lang');
                    this.setLanguage(lang);
                    langDropdown.classList.remove('active');
                });
            });
        }
    }

    setLanguage(lang) {
        this.currentLang = lang;
        localStorage.setItem('language', lang);
        
        // Update all elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.getTranslation(key);
            if (translation) {
                if (element.tagName === 'INPUT' && element.type === 'submit') {
                    element.value = translation;
                } else if (element.hasAttribute('placeholder')) {
                    element.placeholder = translation;
                } else {
                    // Check if element has child elements that should be preserved (like <span>→</span>)
                    const preservedChildren = Array.from(element.childNodes).filter(node => 
                        node.nodeType === 1 && node.tagName === 'SPAN' && !node.hasAttribute('data-i18n')
                    );
                    
                    if (preservedChildren.length > 0) {
                        // Save preserved children
                        const saved = preservedChildren.map(child => child.cloneNode(true));
                        // Update text content
                        element.textContent = translation;
                        // Restore preserved children
                        saved.forEach(child => element.appendChild(child));
                    } else {
                        element.textContent = translation;
                    }
                }
            }
        });

        // Update placeholder attributes
        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            const translation = this.getTranslation(key);
            if (translation) {
                element.placeholder = translation;
            }
        });

        // Update HTML lang attribute
        document.documentElement.lang = lang;

        // Update language button
        this.updateLanguageButton();

        // Trigger custom event
        document.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
    }

    getTranslation(key) {
        const keys = key.split('.');
        let value = translations[this.currentLang];
        
        for (const k of keys) {
            if (value && value[k]) {
                value = value[k];
            } else {
                return null;
            }
        }
        
        return value;
    }

    updateLanguageButton() {
        const langButton = document.getElementById('languageButton');
        const langIcon = langButton?.querySelector('.lang-icon');
        const langOptions = document.querySelectorAll('.lang-option');
        
        if (langIcon) {
            langIcon.textContent = this.currentLang === 'ru' ? '🇷🇺' : '🇬🇧';
        }

        // Update active state in dropdown
        langOptions.forEach(option => {
            const lang = option.getAttribute('data-lang');
            if (lang === this.currentLang) {
                option.classList.add('active');
            } else {
                option.classList.remove('active');
            }
        });
    }

    getCurrentLanguage() {
        return this.currentLang;
    }
}

// Initialize language switcher when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.languageSwitcher = new LanguageSwitcher();
    });
} else {
    window.languageSwitcher = new LanguageSwitcher();
}

