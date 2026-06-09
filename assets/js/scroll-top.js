/**
 * Künstlerischer „Nach oben“-Button – erscheint beim Scrollen.
 */
(function () {
  if (document.body.classList.contains('admin-app')) return;

  const SHOW_AFTER_PX = 380;
  let btn = null;

  function createButton() {
    btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'scroll-top-btn';
    btn.hidden = true;
    const label = window.ktI18n?.t('ui.scrollTop') || 'Nach oben scrollen';
    btn.setAttribute('aria-label', label);
    btn.dataset.i18nAria = 'ui.scrollTop';
    btn.innerHTML = '<span class="scroll-top-arrow" aria-hidden="true">↑</span>';
    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    document.body.appendChild(btn);
  }

  function updateBottomOffset() {
    if (!btn) return;
    const bannerVisible =
      typeof window.isConsentBannerVisible === 'function' && window.isConsentBannerVisible();
    btn.style.setProperty('--scroll-top-bottom', bannerVisible ? '6.5rem' : 'clamp(1rem, 3vw, 1.75rem)');
  }

  function updateVisibility() {
    if (!btn) return;
    updateBottomOffset();
    const show = window.scrollY > SHOW_AFTER_PX;
    if (show && btn.hidden) {
      btn.hidden = false;
      requestAnimationFrame(() => btn.classList.add('scroll-top-visible'));
    } else if (!show && !btn.hidden) {
      btn.classList.remove('scroll-top-visible');
      window.setTimeout(() => {
        if (window.scrollY <= SHOW_AFTER_PX) btn.hidden = true;
      }, 620);
    }
  }

  function init() {
    createButton();
    updateVisibility();
    window.addEventListener('scroll', updateVisibility, { passive: true });
    window.addEventListener('consent-settled', updateBottomOffset);
    window.addEventListener('consent-updated', updateBottomOffset);
    window.addEventListener('consent-banner-closed', updateBottomOffset);
  }

  document.addEventListener('kt-lang-change', () => {
    if (!btn) return;
    const label = window.ktI18n?.t('ui.scrollTop') || 'Nach oben scrollen';
    btn.setAttribute('aria-label', label);
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
