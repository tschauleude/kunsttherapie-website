(function () {
  const form = document.getElementById('contactForm');
  if (!form) return;

  const msg = document.getElementById('contactStatus');

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
    };

    try {
      const res = await fetch(`${window.location.origin}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Nachricht konnte nicht gesendet werden');

      if (msg) {
        msg.textContent = data.message || 'Danke! Deine Nachricht ist angekommen.';
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
