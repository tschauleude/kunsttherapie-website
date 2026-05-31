/**
 * Angebots-Karten: Farbtropfen öffnet Beschreibungs-Blase (Modal).
 */
(function () {
  const root = document.querySelector('.page-kunsttherapie');
  if (!root) return;

  let openCard = null;
  let lastFocus = null;

  function labelLearn() {
    return window.ktI18n ? window.ktI18n.t('btn.learnMore') : 'Mehr erfahren';
  }

  function labelClose() {
    return window.ktI18n ? window.ktI18n.t('btn.close') : 'Schließen';
  }

  function getCardParts(card) {
    return {
      btn: card.querySelector('.kt-drop-btn'),
      bubble: card.querySelector('.kt-offer-bubble'),
    };
  }

  function updateCloseLabels() {
    root.querySelectorAll('[data-offer-close].kt-offer-bubble__close').forEach((el) => {
      el.setAttribute('aria-label', labelClose());
    });
  }

  function setBtnLabel(btn) {
    const label = btn.querySelector('.kt-drop-btn__label');
    if (label) label.textContent = labelLearn();
  }

  function resetDropShape(btn) {
    const shape = btn?.querySelector('.kt-drop-btn__shape');
    if (!shape) return;
    shape.style.animation = '';
    shape.style.transform = '';
    shape.style.opacity = '';
    shape.style.filter = '';
  }

  function closeOffer(card) {
    if (!card) return;
    const { btn, bubble } = getCardParts(card);
    if (!btn || !bubble) return;

    bubble.hidden = true;
    bubble.classList.remove('is-visible');
    card.classList.remove('is-open');
    btn.setAttribute('aria-expanded', 'false');
    btn.classList.remove('is-active');
    setBtnLabel(btn);
    resetDropShape(btn);

    if (openCard === card) {
      openCard = null;
      document.body.classList.remove('kt-offer-modal-open');
    }

    if (lastFocus && typeof lastFocus.focus === 'function') {
      lastFocus.focus();
      lastFocus = null;
    }
  }

  function closeAll() {
    root.querySelectorAll('[data-offer].is-open').forEach((card) => closeOffer(card));
  }

  function openOffer(card) {
    const { btn, bubble } = getCardParts(card);
    if (!btn || !bubble) return;

    closeAll();
    lastFocus = document.activeElement;

    bubble.hidden = false;
    requestAnimationFrame(() => {
      bubble.classList.add('is-visible');
    });

    card.classList.add('is-open');
    btn.setAttribute('aria-expanded', 'true');
    btn.classList.add('is-active');
    setBtnLabel(btn);
    openCard = card;
    document.body.classList.add('kt-offer-modal-open');

    const closeBtn = bubble.querySelector('.kt-offer-bubble__close');
    if (closeBtn) closeBtn.focus();
  }

  window.ktUpdateToggleLabels = function () {
    root.querySelectorAll('[data-offer]').forEach((card) => {
      const { btn } = getCardParts(card);
      if (!btn) return;
      setBtnLabel(btn);
      if (!card.classList.contains('is-open')) resetDropShape(btn);
    });
    updateCloseLabels();
  };

  root.addEventListener('click', (e) => {
    const dropBtn = e.target.closest('.kt-drop-btn');
    if (dropBtn && root.contains(dropBtn)) {
      e.preventDefault();
      const card = dropBtn.closest('[data-offer]');
      if (!card) return;
      if (card.classList.contains('is-open')) {
        closeOffer(card);
      } else {
        openOffer(card);
      }
      return;
    }

    if (e.target.closest('[data-offer-close]')) {
      const card = e.target.closest('[data-offer]') || openCard;
      if (card) closeOffer(card);
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !openCard) return;
    e.preventDefault();
    closeOffer(openCard);
  });

  updateCloseLabels();
  document.addEventListener('kt-lang-change', window.ktUpdateToggleLabels);
})();
