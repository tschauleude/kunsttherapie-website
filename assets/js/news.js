const NEWS_API_URL = window.location.origin + '/api';
const NEWS_POPUP_STORAGE_KEY = 'kunsttherapie_news_popup_id';
const POPUP_AFTER_CONSENT_MS = 700;
let cachedHomeNews = [];

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function stripHtml(html) {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || '';
}

function renderContentHtml(content) {
  if (!content) return '';
  if (/<[a-zA-Z]/.test(content)) return content;
  return content.split(/\n+/).filter(Boolean).map(p => `<p>${escapeHtml(p)}</p>`).join('');
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
  const raw = item.content || '';
  const plain = stripHtml(raw);
  const isLong = plain.length > excerptLen;
  const excerpt = isLong ? plain.substring(0, excerptLen) + '…' : plain;

  const imageHtml = item.image
    ? `<img src="${escapeHtml(item.image)}" alt="" class="news-image"/>`
    : `<div class="news-image news-image-placeholder" aria-hidden="true"></div>`;

  const bodyHtml = isLong
    ? `<p class="news-excerpt">${escapeHtml(excerpt)}</p>
       <div class="news-full-content" hidden>${renderContentHtml(raw)}</div>
       <button type="button" class="news-readmore">${window.ktI18n?.t('news.readMore') || 'Weiterlesen'}</button>`
    : `<p>${escapeHtml(excerpt)}</p>`;

  return `
    <article class="news-card">
      ${imageHtml}
      <div class="news-content">
        <div class="news-date">${date}</div>
        <h2>${escapeHtml(item.title)}</h2>
        ${bodyHtml}
      </div>
    </article>
  `;
}

function renderNewsPopupBlock(item, isFirst) {
  const date = formatNewsDate(item.createdAt);
  const imageHtml = item.image
    ? `<img src="${escapeHtml(item.image)}" alt="" class="news-popup-image"/>`
    : '';
  const raw = item.content || '';
  const contentHtml = /<[a-zA-Z]/.test(raw)
    ? raw
    : raw.split(/\n+/).filter(Boolean).map(p => `<p>${escapeHtml(p)}</p>`).join('');

  return `
    <article class="news-popup-item${isFirst ? '' : ' news-popup-item-more'}">
      ${imageHtml}
      <div class="news-date">${date}</div>
      <h3>${escapeHtml(item.title)}</h3>
      <div class="news-popup-text">${contentHtml}</div>
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
  if (!popup || popup.hidden) return;

  const latestId = popup.dataset.latestNewsId;
  const finish = () => {
    popup.hidden = true;
    document.body.classList.remove('news-popup-open');
    delete popup.dataset.latestNewsId;
    if (latestId) {
      try {
        localStorage.setItem(NEWS_POPUP_STORAGE_KEY, latestId);
      } catch (e) {
        /* ignore */
      }
    }
  };

  if (window.flowMotion) {
    window.flowMotion.close(popup, 'news-popup-visible').then(finish);
    return;
  }
  popup.classList.remove('news-popup-visible');
  window.setTimeout(finish, 620);
}

function openNewsPopup(items) {
  const popup = document.getElementById('newsPopup');
  const body = document.getElementById('newsPopupBody');
  if (!popup || !body || !items.length) return;

  body.innerHTML = items
    .map((item, index) => renderNewsPopupBlock(item, index === 0))
    .join('');

  popup.dataset.latestNewsId = String(items[0].id);

  const afterOpen = () => {
    document.body.classList.add('news-popup-open');
    popup.querySelector('.news-popup-close')?.focus();
  };

  if (window.flowMotion) {
    window.flowMotion.open(popup, 'news-popup-visible').then(afterOpen);
  } else {
    popup.hidden = false;
    popup.classList.add('news-popup-visible');
    afterOpen();
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

    const reopenBtn = document.getElementById('openNewsPopupBtn');
    if (reopenBtn) {
      reopenBtn.onclick = () => openNewsPopup(news.slice(0, popupLimit));
    }

    // Automatisches Popup beim ersten Besuch (mit „gesehen"-Merker, nach Reveal
    // und Consent). War zuvor nie aufgerufen → Funktion blieb wirkungslos.
    scheduleNewsPopup(popupItems);
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

document.addEventListener('click', (e) => {
  const btn = e.target.closest('.news-readmore');
  if (!btn) return;
  const article = btn.closest('.news-card');
  if (!article) return;
  const full = article.querySelector('.news-full-content');
  const excerpt = article.querySelector('.news-excerpt');
  if (!full) return;
  const isExpanded = !full.hidden;
  full.hidden = isExpanded;
  if (excerpt) excerpt.hidden = !isExpanded;
  btn.textContent = isExpanded
    ? (window.ktI18n?.t('news.readMore') || 'Weiterlesen')
    : (window.ktI18n?.t('news.readLess') || 'Weniger anzeigen');
});
