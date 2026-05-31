const NEWS_API_URL = window.location.origin + '/api';

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatNewsDate(createdAt) {
  return new Date(createdAt).toLocaleDateString('de-DE', {
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
    ? `<img src="${item.image}" alt="" class="news-image"/>`
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

async function fetchPublishedNews() {
  const response = await fetch(`${NEWS_API_URL}/news`);
  if (!response.ok) throw new Error('News laden fehlgeschlagen');
  return response.json();
}

async function loadHomeNews() {
  const section = document.getElementById('homeNewsSection');
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

    const limit = parseInt(section.dataset.limit || '3', 10);
    const items = news.slice(0, limit);
    list.innerHTML = items.map((item) => renderNewsCard(item, 160)).join('');
    section.hidden = false;
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

    list.innerHTML = news.map((item) => renderNewsCard(item, 200)).join('');
  } catch (err) {
    if (loading) {
      loading.innerHTML =
        '<p style="color:var(--text-light)">Aktuelles konnte gerade nicht geladen werden. Bitte später erneut versuchen.</p>';
    }
    console.error('News page error:', err);
  }
}

if (document.getElementById('homeNewsList')) {
  document.addEventListener('DOMContentLoaded', loadHomeNews);
}
if (document.getElementById('newsList') && !document.getElementById('homeNewsList')) {
  document.addEventListener('DOMContentLoaded', loadNewsPage);
}
