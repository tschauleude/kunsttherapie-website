const NEWS_API_URL = window.location.origin + '/api';
const NEWS_POPUP_STORAGE_KEY = 'kunsttherapie_news_popup_id';
const POPUP_AFTER_CONSENT_MS = 700;
let cachedHomeNews = [];

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function newsLocale() {
  return window.ktI18n?.getLocale?.() || 'de-DE';
}

function formatNewsDate(createdAt) {
  return new Date(createdAt).toLocaleDateString(newsLocale(), {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function renderNewsCard(item, excerptLen = 200) {
  const date = formatNewsDate(item.createdAt);
  const plain = item.content || '';
  const excerpt =
    plain.length > excerptLen ? `${plain.substring(0, excerptLen)}…` : plain;

  const imageHtml = item.image
    ? `<img src="${escapeHtml(item.image)}" alt="" class="news-image"/>`
    : `<div class="news-image news-image-placeholder" aria-hidden="true"></div>`;

  return `
    <article class="news-card">
      ${imageHtml}
      <div class="news-content">
        <div class="news-date">${date}</div>
        <h2>${escapeHtml(item.title)}</h2>
        <p>${escapeHtml(excerpt)}</p>
      </div>
    </article>
  `;
}

function renderNewsPopupBlock(item, isFirst) {
  const date = formatNewsDate(item.createdAt);
  const imageHtml = item.image
    ? `<img src="${escapeHtml(item.image)}" alt="" class="news-popup-image"/>`
    : '';
  const paragraphs = (item.content || '')
    .split(/\n+/)
    .filter(Boolean)
    .map((p) => `<p>${escapeHtml(p)}</p>`)
    .join('');

  const titleTag = isFirst ? 'h3' : 'h3';

  return `
    <article class="news-popup-item${isFirst ? '' : ' news-popup-item-more'}">
      ${imageHtml}
      <div class="news-date">${date}</div>
      <${titleTag}>${escapeHtml(item.title)}</${titleTag}>
      <div class="news-popup-text">${paragraphs}</div>
    </article>
  `;
}

async function fetchPublishedNews() {
  const response = await fetch(`${NEWS_API_URL}/news`);
  if (!response.ok) throw new Error('News laden fehlgeschlagen');
  return response.json();
}

function closeNewsPopup() {
  const popup = document.getElementById('newsPopup');
  if (!popup) return;
  popup.classList.remove('news-popup-visible');
  window.setTimeout(() => {
    popup.hidden = true;
    document.body.classList.remove('news-popup-open');
  }, 280);
}

function openNewsPopup(items) {
  const popup = document.getElementById('newsPopup');
  const body = document.getElementById('newsPopupBody');
  if (!popup || !body || !items.length) return;

  body.innerHTML = items
    .map((item, index) => renderNewsPopupBlock(item, index === 0))
    .join('');

  popup.hidden = false;
  document.body.classList.add('news-popup-open');
  requestAnimationFrame(() => {
    popup.classList.add('news-popup-visible');
    popup.querySelector('.news-popup-close')?.focus();
  });

  const latestId = String(items[0].id);
  try {
    localStorage.setItem(NEWS_POPUP_STORAGE_KEY, latestId);
  } catch (e) {
    /* ignore */
  }
}

function shouldShowNewsPopup(latestId) {
  try {
    return localStorage.getItem(NEWS_POPUP_STORAGE_KEY) !== String(latestId);
  } catch (e) {
    return true;
  }
}

function showNewsPopupWhenReady(popupItems) {
  if (!popupItems?.length || !shouldShowNewsPopup(popupItems[0].id)) return;

  const present = () => openNewsPopup(popupItems);

  const afterConsent = () => {
    if (typeof window.whenConsentSettled === 'function') {
      window.whenConsentSettled(present, POPUP_AFTER_CONSENT_MS);
    } else {
      window.setTimeout(present, POPUP_AFTER_CONSENT_MS);
    }
  };

  if (typeof window.whenRevealIdle === 'function') {
    window.whenRevealIdle().then(afterConsent);
  } else {
    afterConsent();
  }
}

function scheduleNewsPopup(popupItems) {
  if (!popupItems.length || !shouldShowNewsPopup(popupItems[0].id)) return;
  showNewsPopupWhenReady(popupItems);
}

function initNewsPopupControls() {
  const popup = document.getElementById('newsPopup');
  if (!popup) return;

  popup.querySelectorAll('[data-close-popup]').forEach((el) => {
    el.addEventListener('click', closeNewsPopup);
  });

  document.addEventListener('keydown', (e) => {
    if (!popup.hidden && e.key === 'Escape') closeNewsPopup();
  });
}

async function loadHomeNews() {
  const section = document.getElementById('neuigkeiten');
  const list = document.getElementById('homeNewsList');
  const loading = document.getElementById('homeNewsLoading');
  if (!section || !list) return;

  try {
    const news = await fetchPublishedNews();
    if (loading) loading.style.display = 'none';

    if (!news.length) {
      section.hidden = true;
      return;
    }

    cachedHomeNews = news;

    const limit = parseInt(section.dataset.limit || '3', 10);
    const items = news.slice(0, limit);
    list.innerHTML = items.map((item) => renderNewsCard(item, 160)).join('');
    section.hidden = false;

    if (window.revealStagger) {
      const intro = section.querySelector('.section-intro');
      const actions = section.querySelector(':scope > .center');
      const cards = list.querySelectorAll('.news-card');
      window.revealStagger([intro, ...cards, actions].filter(Boolean));
    }

    const popupLimit = parseInt(section.dataset.popupLimit || '2', 10);
    const popupItems = news.slice(0, popupLimit);
    scheduleNewsPopup(popupItems);

    const reopenBtn = document.getElementById('openNewsPopupBtn');
    if (reopenBtn) {
      reopenBtn.onclick = () => openNewsPopup(news.slice(0, popupLimit));
    }
  } catch (err) {
    if (loading) loading.style.display = 'none';
    section.hidden = true;
    console.error('Home news error:', err);
  }
}

async function loadNewsPage() {
  const list = document.getElementById('newsList');
  const loading = document.getElementById('newsLoading');
  const empty = document.getElementById('newsEmpty');
  if (!list) return;

  try {
    const news = await fetchPublishedNews();
    if (loading) loading.style.display = 'none';

    if (!news.length) {
      if (empty) empty.style.display = 'block';
      return;
    }

    cachedNewsPage = news;
    list.innerHTML = news.map((item) => renderNewsCard(item, 200)).join('');
    if (window.revealStagger) {
      window.revealStagger(list.querySelectorAll('.news-card'));
    }
  } catch (err) {
    if (loading) {
      const errText =
        window.ktI18n?.t('newsPage.error') ||
        'Aktuelles konnte gerade nicht geladen werden. Bitte später erneut versuchen.';
      loading.innerHTML = `<p style="color:var(--text-light)">${errText}</p>`;
    }
    console.error('News page error:', err);
  }
}

if (document.getElementById('homeNewsList')) {
  document.addEventListener('DOMContentLoaded', () => {
    initNewsPopupControls();
    loadHomeNews();
  });
}
if (document.getElementById('newsList') && !document.getElementById('homeNewsList')) {
  document.addEventListener('DOMContentLoaded', loadNewsPage);
}

let cachedNewsPage = null;

function rerenderNewsFromCache() {
  const list = document.getElementById('newsList');
  if (list && cachedNewsPage) {
    list.innerHTML = cachedNewsPage.map((item) => renderNewsCard(item, 200)).join('');
    return;
  }

  const homeList = document.getElementById('homeNewsList');
  const section = document.getElementById('neuigkeiten');
  if (homeList && cachedHomeNews.length) {
    const limit = parseInt(section?.dataset.limit || '3', 10);
    homeList.innerHTML = cachedHomeNews
      .slice(0, limit)
      .map((item) => renderNewsCard(item, 160))
      .join('');
  }
}

document.addEventListener('kt-lang-change', () => {
  if (document.getElementById('newsList') || document.getElementById('homeNewsList')) {
    rerenderNewsFromCache();
  }
});
