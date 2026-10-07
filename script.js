/* --- TEST ENVIRONMENT GATEKEEPER (identique au site principal) --- */
(function checkTestAccess() {
  // Hôtes protégés : tout sous-domaine "test." (ex. test-desinscription.geostratum.eu)
  const host = window.location.hostname;
  const isTestSite = host.startsWith('test.') || host.startsWith('test-');
  if (!isTestSite) return;

  const TEST_AUTH_KEY = 'geostratum_test_authorized';
  const EXPECTED_USER = 'dev@geostratum.eu';
  // Hash SHA-256 du mot de passe de test (même que le site principal)
  const EXPECTED_HASH = '47ed4b6b0caeef16644a9c0932976c17161b73e060b6439c9282c741ce739312';

  if (sessionStorage.getItem(TEST_AUTH_KEY) === 'true') return;

  const styleBlock = document.createElement('style');
  styleBlock.id = 'test-lock-style';
  styleBlock.innerHTML = 'html, body { overflow: hidden !important; } #test-lock-overlay { position: fixed; inset: 0; z-index: 9999999; background: #0c1017; display: flex; align-items: center; justify-content: center; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #f0f6fc; padding: 20px; }';
  document.head.appendChild(styleBlock);

  async function sha256(str) {
    const buffer = new TextEncoder().encode(str);
    const hash = await crypto.subtle.digest('SHA-256', buffer);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function showLockModal() {
    if (document.getElementById('test-lock-overlay')) return;
    const overlay = document.createElement('div');
    overlay.id = 'test-lock-overlay';
    overlay.innerHTML = `
      <div style="max-width: 400px; width: 100%; background: #161b22; border: 1px solid #30363d; border-radius: 12px; padding: 28px; box-shadow: 0 16px 36px rgba(0,0,0,0.6); text-align: center;">
        <div style="font-size: 38px; margin-bottom: 12px;">🔒</div>
        <h2 style="margin: 0 0 8px 0; font-size: 1.3rem; font-weight: 600; color: #fff;">Environnement de Test</h2>
        <p style="margin: 0 0 20px 0; font-size: 0.9rem; color: #8b949e; line-height: 1.4;">L'accès à cet environnement de test est strictement réservé. Veuillez vous identifier.</p>
        <form id="test-lock-form" style="display: flex; flex-direction: column; gap: 12px;">
          <input type="text" id="test-user-input" placeholder="Identifiant (e-mail)" required autocomplete="username"
            style="width: 100%; box-sizing: border-box; padding: 12px 14px; border-radius: 8px; border: 1px solid #30363d; background: #0d1117; color: #fff; font-size: 1rem; outline: none; transition: border-color 0.2s;" />
          <input type="password" id="test-password-input" placeholder="Mot de passe" required autocomplete="current-password"
            style="width: 100%; box-sizing: border-box; padding: 12px 14px; border-radius: 8px; border: 1px solid #30363d; background: #0d1117; color: #fff; font-size: 1rem; outline: none; transition: border-color 0.2s;" />
          <div id="test-lock-error" style="display: none; color: #f85149; font-size: 0.85rem; text-align: left;">Identifiant ou mot de passe incorrect.</div>
          <button type="submit" id="test-lock-submit"
            style="padding: 12px; border: none; border-radius: 8px; background: #238636; color: #fff; font-weight: 600; font-size: 0.95rem; cursor: pointer; transition: background 0.2s;">
            Déverrouiller l'accès
          </button>
        </form>
      </div>
    `;
    document.body.appendChild(overlay);

    const form = document.getElementById('test-lock-form');
    const userInput = document.getElementById('test-user-input');
    const passInput = document.getElementById('test-password-input');
    const error = document.getElementById('test-lock-error');
    userInput.focus();

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      error.style.display = 'none';
      const user = userInput.value.trim();
      const pass = passInput.value;
      const hashed = await sha256(pass);
      if (user.toLowerCase() === EXPECTED_USER.toLowerCase() && hashed === EXPECTED_HASH) {
        sessionStorage.setItem(TEST_AUTH_KEY, 'true');
        overlay.remove();
        styleBlock.remove();
      } else {
        error.style.display = 'block';
        passInput.value = '';
        passInput.focus();
      }
    });
  }

  if (document.body) {
    showLockModal();
  } else {
    window.addEventListener('DOMContentLoaded', showLockModal);
  }
})();

/* --- NEWSLETTER UNPERSISTENT / LIGHTWEIGHT JS --- */
const SITE_LANG_KEY = 'geostratum_site_lang';
const SITE_THEME_KEY = 'geostratum_site_theme';
const DEFAULT_SITE_LANG = 'en';

const LANG_TO_LOCALE = {
  'ar': 'ar-sa', 'bn': 'bn-bd', 'bg': 'bg-bg', 'ca': 'ca-es', 'cs': 'cs-cz',
  'zh': 'zh-cn', 'da': 'da-dk', 'de': 'de-de', 'et': 'et-ee', 'el': 'el-gr',
  'en': 'en-us', 'es': 'es-es', 'fa': 'fa-ir', 'fil': 'fil-ph', 'fi': 'fi-fi',
  'fr': 'fr-fr', 'gu': 'gu-in', 'he': 'he-il', 'hi': 'hi-in', 'hr': 'hr-hr',
  'hu': 'hu-hu', 'id': 'id-id', 'is': 'is-is', 'it': 'it-it', 'ja': 'ja-jp',
  'kn': 'kn-in', 'ko': 'ko-kr', 'lv': 'lv-lv', 'lt': 'lt-lt', 'ml': 'ml-in',
  'mr': 'mr-in', 'nl': 'nl-nl', 'no': 'no-no', 'pl': 'pl-pl', 'pt': 'pt-pt',
  'pa': 'pa-in', 'ro': 'ro-ro', 'ru': 'ru-ru', 'sk': 'sk-sk', 'sl': 'sl-si',
  'sr': 'sr-rs', 'sw': 'sw-tz', 'sv': 'sv-se', 'ta': 'ta-in', 'te': 'te-in',
  'th': 'th-th', 'tr': 'tr-tr', 'uk': 'uk-ua', 'ur': 'ur-pk', 'vi': 'vi-vn'
};

const LANG_LABELS = {
  ar: 'العربية', bg: 'Български', bn: 'বাংলা', ca: 'Català', cs: 'Čeština',
  da: 'Dansk', de: 'Deutsch', el: 'Ελληνικά', en: 'English', es: 'Español',
  et: 'Eesti', fa: 'فارسی', fi: 'Suomi', fil: 'Filipino', fr: 'Français',
  gu: 'ગુજરાતી', he: 'עברית', hi: 'हिन्दी', hr: 'Hrvatski', hu: 'Magyar',
  id: 'Bahasa Indonesia', is: 'Íslenska', it: 'Italiano', ja: '日本語',
  kn: 'ಕನ್ನಡ', ko: '한국어', lt: 'Lietuvių', lv: 'Latviešu', ml: 'മലയാളം',
  mr: 'मराठी', nl: 'Nederlands', no: 'Norsk', pa: 'ਪੰਜਾਬੀ', pl: 'Polski',
  pt: 'Português', ro: 'Română', ru: 'Русский', sk: 'Slovenčina', sl: 'Slovenščina',
  sr: 'Српски', sv: 'Svenska', sw: 'Kiswahili', ta: 'தமிழ்', te: 'తెలుగు',
  th: 'ไทย', tr: 'Türkçe', uk: 'Українська', ur: 'اردو', vi: 'Tiếng Việt', zh: '中文'
};

window.siteTranslations = {};
window.currentActiveLang = 'en';

document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  const lang = getInitialLanguage();
  await initLanguage(lang);
  initUnsubscribeForm();
});

function initTheme() {
  const saved = localStorage.getItem(SITE_THEME_KEY);
  const isDark = saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.classList.toggle('theme-dark', isDark);
  document.documentElement.classList.toggle('theme-light', !isDark);
}

function getInitialLanguage() {
  const urlParams = new URLSearchParams(window.location.search);
  const qLang = urlParams.get('lang');
  if (qLang && LANG_TO_LOCALE[qLang.toLowerCase().slice(0, 2)]) {
    return qLang.toLowerCase().slice(0, 2);
  }
  const saved = localStorage.getItem(SITE_LANG_KEY);
  if (saved && LANG_TO_LOCALE[saved]) return saved;
  const nav = (navigator.language || 'en').toLowerCase().slice(0, 2);
  return LANG_TO_LOCALE[nav] ? nav : DEFAULT_SITE_LANG;
}

async function initLanguage(lang) {
  window.currentActiveLang = lang;
  localStorage.setItem(SITE_LANG_KEY, lang);
  document.documentElement.lang = lang;

  // Populate dropdown
  const langBtn = document.getElementById('lang-btn');
  const langMenu = document.getElementById('lang-menu');
  if (langBtn) {
    const codeSpan = langBtn.querySelector('.lang-code');
    if (codeSpan) codeSpan.textContent = lang.toUpperCase();
  }

  const validLangs = Object.keys(LANG_LABELS).sort().map(code => ({
    code,
    label: LANG_LABELS[code]
  }));

  if (langMenu) {
    langMenu.innerHTML = validLangs.map(l => `
      <li role="option" class="lang-option ${l.code === lang ? 'selected' : ''}" data-lang="${l.code}" tabindex="0">
        <span>${l.label}</span> ${l.code === lang ? '<span>✓</span>' : ''}
      </li>
    `).join('');
  }

  // Setup dropdown toggle once
  if (langBtn && langMenu && !langBtn.dataset.listenerAttached) {
    langBtn.dataset.listenerAttached = 'true';

    const toggleMenu = (open) => {
      langBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) {
        langMenu.hidden = false;
        requestAnimationFrame(() => langMenu.classList.add('is-open'));
      } else {
        langMenu.classList.remove('is-open');
        setTimeout(() => {
          if (!langMenu.classList.contains('is-open')) langMenu.hidden = true;
        }, 200);
      }
    };

    langBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = langBtn.getAttribute('aria-expanded') === 'true';
      toggleMenu(!isOpen);
    });

    langMenu.addEventListener('click', async (e) => {
      const option = e.target.closest('.lang-option');
      if (!option) return;
      const selectedLang = option.dataset.lang;
      if (selectedLang) {
        await initLanguage(selectedLang);
      }
      toggleMenu(false);
    });

    document.addEventListener('click', (e) => {
      if (!langBtn.contains(e.target) && !langMenu.contains(e.target)) {
        toggleMenu(false);
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        toggleMenu(false);
      }
    });
  }

  // Load translations JSON
  try {
    const res = await fetch(`/langue/unsub_${lang}.json`);
    if (res.ok) {
      window.siteTranslations = await res.json();
    } else {
      const fallback = await fetch('/langue/unsub_en.json');
      window.siteTranslations = await fallback.json();
    }
  } catch (err) {
    try {
      const fallback = await fetch('/langue/unsub_en.json');
      window.siteTranslations = await fallback.json();
    } catch (e) {
      window.siteTranslations = {};
    }
  }

  applyTranslations();
}

function applyTranslations() {
  const dict = window.siteTranslations || {};
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key]) el.textContent = dict[key];
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (dict[key]) el.setAttribute('placeholder', dict[key]);
  });
}

function initUnsubscribeForm() {
  const form = document.getElementById('unsub-form');
  if (!form) return;

  const emailInput = document.getElementById('unsub-email');
  const statusEl = document.getElementById('unsub-status');
  const submitBtn = form.querySelector('.unsub-btn');

  // Pre-fill email from query param (?email=user@example.com)
  const params = new URLSearchParams(window.location.search);
  const qEmail = params.get('email');
  if (qEmail && emailInput) {
    emailInput.value = qEmail;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!emailInput || !statusEl) return;

    const email = emailInput.value.trim();
    if (!email) {
      statusEl.className = 'footer-newsletter-status is-error unsub-status';
      statusEl.textContent = (window.siteTranslations && window.siteTranslations['unsub.error.email']) || 'Please enter a valid email address.';
      emailInput.focus();
      return;
    }

    if (submitBtn) submitBtn.disabled = true;
    statusEl.className = 'footer-newsletter-status unsub-status';
    statusEl.textContent = '...';

    try {
      const res = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          source: 'unsubscribe_page'
        })
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        statusEl.className = 'footer-newsletter-status is-success unsub-status';
        statusEl.textContent = (window.siteTranslations && window.siteTranslations['unsub.success']) || 'You have been successfully unsubscribed.';
        form.reset();
      } else {
        throw new Error(data.message || 'Unsubscribe failed');
      }
    } catch (err) {
      statusEl.className = 'footer-newsletter-status is-error unsub-status';
      statusEl.textContent = (window.siteTranslations && window.siteTranslations['unsub.error.network']) || 'An error occurred. Please try again later.';
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}
