(function () {
  const form = document.getElementById('contactForm');
  if (!form) return;

  const msg = document.getElementById('contactStatus');

  function tr(key) {
    const v = window.ktI18n?.t(key);
    return v != null ? v : '';
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    if (msg) msg.hidden = true;

    const body = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      phone: form.phone.value.trim(),
      message: form.message.value.trim(),
      website: document.getElementById('contactWebsite')?.value || '',
      _formAt: Date.now(),
      lang: window.ktI18n?.getLang?.() || 'de',
    };

    try {
      const res = await fetch(`${window.location.origin}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      let data = {};
      try {
        data = await res.json();
      } catch (parseErr) {
        if (!res.ok) throw new Error(tr('contact.msg.error'));
      }
      if (!res.ok) throw new Error(data.error || tr('contact.msg.error'));

      if (msg) {
        msg.textContent = data.message || tr('contact.msg.success');
        msg.className = 'booking-alert booking-alert-success';
        msg.hidden = false;
      }
      form.reset();
    } catch (err) {
      if (msg) {
        msg.textContent = err.message;
        msg.className = 'booking-alert booking-alert-error';
        msg.hidden = false;
      }
    } finally {
      btn.disabled = false;
    }
  });
})();
