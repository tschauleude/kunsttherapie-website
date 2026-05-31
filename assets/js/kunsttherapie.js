(function () {
  const root = document.querySelector('.page-kunsttherapie');
  if (!root) return;

  root.querySelectorAll('[data-offer]').forEach((card) => {
    const toggle = card.querySelector('.kt-toggle');
    const body = card.querySelector('.kt-offer-body');
    if (!toggle || !body) return;

    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') === 'true';
      root.querySelectorAll('[data-offer] .kt-toggle').forEach((t) => {
        t.setAttribute('aria-expanded', 'false');
        t.textContent = 'Mehr erfahren';
      });
      root.querySelectorAll('[data-offer] .kt-offer-body').forEach((b) => {
        b.hidden = true;
      });
      root.querySelectorAll('[data-offer]').forEach((c) => c.classList.remove('is-open'));

      if (!open) {
        toggle.setAttribute('aria-expanded', 'true');
        toggle.textContent = 'Weniger';
        body.hidden = false;
        card.classList.add('is-open');
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  });
})();
