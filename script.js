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
  if (langMenu && !langMenu.hasChildNodes()) {
    Object.keys(LANG_LABELS).sort().forEach(code => {
      const li = document.createElement('li');
      li.className = 'lang-item';
      li.setAttribute('role', 'option');
      li.dataset.lang = code;
      li.innerHTML = `<span class="lang-flag">${code.toUpperCase()}</span><span>${LANG_LABELS[code]}</span>`;
      li.addEventListener('click', () => {
        langMenu.hidden = true;
        initLanguage(code);
      });
      langMenu.appendChild(li);
    });

    if (langBtn) {
      langBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        langMenu.hidden = !langMenu.hidden;
        langBtn.setAttribute('aria-expanded', !langMenu.hidden);
      });
      document.addEventListener('click', () => {
        langMenu.hidden = true;
        langBtn.setAttribute('aria-expanded', 'false');
      });
    }
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
