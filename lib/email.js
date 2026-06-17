const nodemailer = require('nodemailer');
const ical = require('./ical');

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isEmailConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.SMTP_FROM
  );
}

function createTransport() {
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function formatGermanDateTime(booking) {
  const [y, m, d] = booking.date.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const weekday = date.toLocaleDateString('de-DE', { weekday: 'long' });
  const datePart = date.toLocaleDateString('de-DE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return `${weekday}, ${datePart}, ${booking.start_time}–${booking.end_time} Uhr`;
}

function buildClientEmailHtml(booking, links) {
  const when = formatGermanDateTime(booking);
  return `
    <p>Hallo ${esc(booking.name)},</p>
    <p>der Termin ist <strong>bestätigt</strong>:</p>
    <p><strong>${esc(when)}</strong><br>
    Otto-Stadler-Straße 23c, 33102 Paderborn</p>
    <p>Der Termin lässt sich direkt im Kalender speichern:</p>
    <ul>
      <li><a href="${esc(links.googleUrl)}">Google Kalender</a></li>
      <li><a href="${esc(links.icsUrl)}">Apple / Outlook (.ics herunterladen)</a></li>
    </ul>
    <p>Bei Fragen: <a href="mailto:info@kunsttherapie-pb.de">info@kunsttherapie-pb.de</a> oder Tel. 05251-690111.</p>
    <p>Herzliche Grüße<br>Kunsttherapie Paderborn</p>
  `;
}

function buildClientRequestEmailHtml(booking) {
  const when = formatGermanDateTime(booking);
  return `
    <p>Hallo ${esc(booking.name)},</p>
    <p>vielen Dank für die Terminanfrage:</p>
    <p><strong>${esc(when)}</strong><br>
    Otto-Stadler-Straße 23c, 33102 Paderborn</p>
    <p>Die Anfrage wird geprüft – die <strong>Bestätigung folgt per E-Mail</strong>, sobald der Termin fest steht.</p>
    <p>Bei Fragen: <a href="mailto:info@kunsttherapie-pb.de">info@kunsttherapie-pb.de</a> · Tel. 05251-690111</p>
    <p>Herzliche Grüße<br>Kunsttherapie Paderborn</p>
  `;
}

function buildPracticeEmailHtml(booking, links) {
  const when = formatGermanDateTime(booking);
  return `
    <p><strong>Neue Online-Buchung #${esc(String(booking.id))}</strong></p>
    <p>${esc(when)}</p>
    <p>
      <strong>${esc(booking.name)}</strong><br>
      E-Mail: <a href="mailto:${esc(booking.email)}">${esc(booking.email)}</a><br>
      ${booking.phone ? `Telefon: ${esc(booking.phone)}<br>` : ''}
      ${booking.message ? `Nachricht: ${esc(booking.message)}` : ''}
    </p>
    <p><a href="${esc(links.icsUrl)}">Termin als .ics</a></p>
  `;
}

// Sendet mehrere Mails unabhängig voneinander: schlägt eine fehl, werden die
// anderen trotzdem versendet (z. B. Praxis-Benachrichtigung auch dann, wenn die
// Kunden-Adresse abprallt). Gibt pro Mail true/false zurück.
async function sendIndependently(transport, mails) {
  const results = await Promise.allSettled(mails.map((m) => transport.sendMail(m.options)));
  return results.map((r, i) => {
    if (r.status === 'rejected') {
      console.error(`E-Mail (${mails[i].label}) fehlgeschlagen:`, r.reason?.message || r.reason);
      return false;
    }
    return true;
  });
}

async function sendBookingRequestEmails(booking) {
  if (!isEmailConfigured()) {
    return { sent: false, reason: 'smtp_not_configured' };
  }

  const practiceTo = process.env.PRACTICE_EMAIL || process.env.ADMIN_EMAIL || 'info@kunsttherapie-pb.de';
  const from = process.env.SMTP_FROM;
  const transport = createTransport();
  const when = formatGermanDateTime(booking);

  const [clientSent, practiceSent] = await sendIndependently(transport, [
    {
      label: 'Kunde',
      options: {
        from,
        to: booking.email,
        subject: `Terminanfrage eingegangen – ${when}`,
        text: `Hallo ${booking.name},\n\nvielen Dank für die Terminanfrage: ${when}\nDie Bestätigung folgt zeitnah per E-Mail.\n\nKunsttherapie Paderborn`,
        html: buildClientRequestEmailHtml(booking),
      },
    },
    {
      label: 'Praxis',
      options: {
        from,
        to: practiceTo,
        replyTo: booking.email,
        subject: `Neue Terminanfrage: ${booking.name} – ${when}`,
        text: `Neue Anfrage #${booking.id} (ausstehend)\n${when}\n${booking.name} <${booking.email}>\n${booking.phone || ''}\n${booking.message || ''}\n\nBitte im Admin-Bereich bestätigen.`,
        html: `
      <p><strong>Neue Terminanfrage #${esc(String(booking.id))}</strong> (Status: ausstehend)</p>
      <p>${esc(when)}</p>
      <p>${esc(booking.name)} &lt;<a href=”mailto:${esc(booking.email)}”>${esc(booking.email)}</a>&gt;<br>
      ${booking.phone ? `Telefon: ${esc(booking.phone)}<br>` : ''}
      ${booking.message ? `Nachricht: ${esc(booking.message)}` : ''}</p>
      <p>Bitte im Admin-Bereich unter „Termine” bestätigen.</p>
    `,
      },
    },
  ]);

  return { sent: clientSent || practiceSent, clientSent, practiceSent };
}

async function sendBookingEmails(booking, baseUrl) {
  if (!isEmailConfigured()) {
    return { sent: false, reason: 'smtp_not_configured' };
  }

  const links = ical.buildCalendarLinks(booking, baseUrl);
  const icsContent = ical.buildIcs(booking);
  const practiceTo = process.env.PRACTICE_EMAIL || process.env.ADMIN_EMAIL || 'info@kunsttherapie-pb.de';
  const from = process.env.SMTP_FROM;
  const transport = createTransport();
  const when = formatGermanDateTime(booking);

  const [clientSent, practiceSent] = await sendIndependently(transport, [
    {
      label: 'Kunde (Bestätigung)',
      options: {
        from,
        to: booking.email,
        subject: `Terminbestätigung Kunsttherapie – ${when}`,
        text: `Hallo ${booking.name},\n\nDer Termin ist bestätigt: ${when}\nOtto-Stadler-Straße 23c, Paderborn\n\nGoogle Kalender: ${links.googleUrl}\nICS-Datei: ${links.icsUrl}\n\nKunsttherapie Paderborn`,
        html: buildClientEmailHtml(booking, links),
        attachments: [
          {
            filename: 'termin-kunsttherapie.ics',
            content: icsContent,
            contentType: 'text/calendar; charset=utf-8; method=PUBLISH',
          },
        ],
      },
    },
    {
      label: 'Praxis (Bestätigung)',
      options: {
        from,
        to: practiceTo,
        replyTo: booking.email,
        subject: `Neue Buchung: ${booking.name} – ${when}`,
        text: `Neue Buchung #${booking.id}\n${when}\n${booking.name} <${booking.email}>\n${booking.phone || ''}\n${booking.message || ''}`,
        html: buildPracticeEmailHtml(booking, links),
        attachments: [
          {
            filename: `buchung-${booking.id}.ics`,
            content: icsContent,
            contentType: 'text/calendar; charset=utf-8',
          },
        ],
      },
    },
  ]);

  return { sent: clientSent || practiceSent, clientSent, practiceSent };
}

function emailWrapper(content) {
  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body { margin:0; padding:0; background:#f2efe8; font-family: Georgia, 'Times New Roman', serif; color:#3d3d3d; }
  .wrap { max-width:580px; margin:32px auto; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,.08); }
  .header { background:#4a6e6a; padding:28px 36px 22px; }
  .header h1 { margin:0; font-size:20px; color:#fff; font-weight:normal; letter-spacing:.03em; }
  .header p { margin:4px 0 0; color:rgba(255,255,255,.75); font-size:13px; }
  .body { padding:32px 36px; }
  .body p { margin:0 0 16px; line-height:1.7; font-size:15px; }
  .body .msg { background:#f9f7f3; border-left:3px solid #d18d89; padding:14px 18px; border-radius:0 6px 6px 0; margin:20px 0; font-style:italic; line-height:1.7; }
  .body .meta { font-size:13px; color:#767676; margin-bottom:20px; }
  .body .meta span { display:inline-block; margin-right:16px; }
  .btn-row { margin:28px 0 8px; display:flex; gap:12px; flex-wrap:wrap; }
  .btn { display:inline-block; padding:12px 24px; border-radius:8px; text-decoration:none; font-family:Georgia,serif; font-size:15px; font-weight:bold; }
  .btn-confirm { background:#4a6e6a; color:#fff; }
  .btn-reject  { background:#fff; color:#b8736f; border:2px solid #b8736f; }
  .footer { padding:18px 36px; border-top:1px solid #ede9e0; font-size:12px; color:#aaa; }
  @media(max-width:480px){ .body,.header,.footer{padding:20px;} .btn-row{flex-direction:column;} }
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <h1>Kunsttherapie Paderborn</h1>
    <p>Martina Schwierzke</p>
  </div>
  <div class="body">${content}</div>
  <div class="footer">Kunsttherapie Paderborn · Otto-Stadler-Straße 23c · 33102 Paderborn</div>
</div>
</body></html>`;
}

// Schritt 1: E-Mail-Adresse des Absenders verifizieren
async function sendContactVerification({ name, email: fromEmail, verifyUrl }) {
  if (!isEmailConfigured()) return { sent: false, reason: 'smtp_not_configured' };

  const from = process.env.SMTP_FROM;
  const transport = createTransport();
  const html = emailWrapper(`
    <p>Hallo ${esc(name)},</p>
    <p>vielen Dank für Ihre Nachricht an Kunsttherapie Paderborn.</p>
    <p>Bitte bestätigen Sie Ihre E-Mail-Adresse, damit die Nachricht zugestellt werden kann:</p>
    <div class="btn-row">
      <a href="${esc(verifyUrl)}" class="btn btn-confirm">E-Mail-Adresse bestätigen</a>
    </div>
    <p style="font-size:13px;color:#888;margin-top:24px;">Dieser Link ist 24 Stunden gültig. Falls Sie kein Kontaktformular ausgefüllt haben, können Sie diese E-Mail ignorieren.</p>
  `);

  const [sent] = await sendIndependently(transport, [{
    label: 'Absender (Verifizierung)',
    options: {
      from,
      to: fromEmail,
      subject: 'Bitte bestätigen Sie Ihre E-Mail – Kunsttherapie Paderborn',
      text: `Hallo ${name},\n\nbitte bestätigen Sie Ihre E-Mail-Adresse:\n${verifyUrl}\n\nDer Link ist 24 Stunden gültig.\n\nKunsttherapie Paderborn`,
      html,
    },
  }]);

  return { sent };
}

// Schritt 2: Nachricht an Martina mit Bestätigen/Ablehnen-Buttons
async function sendContactNotificationToPractice({ name, email: fromEmail, phone, message, confirmUrl, rejectUrl }) {
  if (!isEmailConfigured()) return { sent: false, reason: 'smtp_not_configured' };

  const practiceTo = process.env.PRACTICE_EMAIL || process.env.ADMIN_EMAIL || 'info@kunsttherapie-pb.de';
  const from = process.env.SMTP_FROM;
  const transport = createTransport();

  const html = emailWrapper(`
    <p><strong>Neue verifizierte Kontaktanfrage</strong></p>
    <div class="meta">
      <span>👤 ${esc(name)}</span>
      <span>✉️ <a href="mailto:${esc(fromEmail)}">${esc(fromEmail)}</a></span>
      ${phone ? `<span>📞 ${esc(phone)}</span>` : ''}
    </div>
    <div class="msg">${esc(message).replace(/\n/g, '<br>')}</div>
    <p>Bitte wählen Sie, wie Sie auf diese Anfrage reagieren möchten:</p>
    <div class="btn-row">
      <a href="${esc(confirmUrl)}" class="btn btn-confirm">✓ Anfrage annehmen</a>
      <a href="${esc(rejectUrl)}" class="btn btn-reject">✗ Anfrage ablehnen</a>
    </div>
    <p style="font-size:13px;color:#888;margin-top:20px;">Nach dem Klick wird der Anfragensteller automatisch benachrichtigt.</p>
  `);

  const [sent] = await sendIndependently(transport, [{
    label: 'Praxis (Kontakt)',
    options: {
      from,
      to: practiceTo,
      replyTo: fromEmail,
      subject: `Kontaktanfrage von ${name} (verifiziert)`,
      text: `Neue Kontaktanfrage\n\nName: ${name}\nE-Mail: ${fromEmail}\nTelefon: ${phone || '–'}\n\n${message}\n\nAnnehmen: ${confirmUrl}\nAblehnen: ${rejectUrl}`,
      html,
    },
  }]);

  return { sent };
}

// Bestätigungsmail an Anfragensteller nach Martinas Entscheidung
async function sendContactOutcome({ name, email: fromEmail, accepted }) {
  if (!isEmailConfigured()) return { sent: false };

  const from = process.env.SMTP_FROM;
  const transport = createTransport();

  const html = accepted
    ? emailWrapper(`
        <p>Hallo ${esc(name)},</p>
        <p>vielen Dank für Ihre Anfrage. Ich habe Ihre Nachricht erhalten und <strong>melde mich in Kürze persönlich bei Ihnen</strong>.</p>
        <p>Herzliche Grüße<br>Martina Schwierzke<br>Kunsttherapie Paderborn</p>
        <p><a href="mailto:info@kunsttherapie-pb.de">info@kunsttherapie-pb.de</a> · Tel. 05251-690111</p>
      `)
    : emailWrapper(`
        <p>Hallo ${esc(name)},</p>
        <p>vielen Dank für Ihre Anfrage. Leider kann ich Ihre Anfrage zum aktuellen Zeitpunkt nicht annehmen.</p>
        <p>Für dringende Anliegen können Sie mich direkt unter <a href="mailto:info@kunsttherapie-pb.de">info@kunsttherapie-pb.de</a> oder Tel. 05251-690111 erreichen.</p>
        <p>Herzliche Grüße<br>Martina Schwierzke<br>Kunsttherapie Paderborn</p>
      `);

  const [sent] = await sendIndependently(transport, [{
    label: `Absender (${accepted ? 'Angenommen' : 'Abgelehnt'})`,
    options: {
      from,
      to: fromEmail,
      subject: accepted
        ? 'Ihre Anfrage wurde angenommen – Kunsttherapie Paderborn'
        : 'Ihre Anfrage – Kunsttherapie Paderborn',
      text: accepted
        ? `Hallo ${name},\n\nIhre Anfrage wurde angenommen. Ich melde mich in Kürze.\n\nHerzliche Grüße\nMartina Schwierzke`
        : `Hallo ${name},\n\nleider kann ich Ihre Anfrage aktuell nicht annehmen.\n\nHerzliche Grüße\nMartina Schwierzke`,
      html,
    },
  }]);

  return { sent };
}

// Rückwärtskompatibel – wird intern nicht mehr für Kontaktformular genutzt
async function sendContactMessage({ name, email: fromEmail, phone, message }) {
  return sendContactNotificationToPractice({
    name, email: fromEmail, phone, message,
    confirmUrl: '#', rejectUrl: '#',
  });
}

async function sendAtelierSubmissionNotice(submission, baseUrl) {
  if (!isEmailConfigured()) {
    return { sent: false, reason: 'smtp_not_configured' };
  }

  const practiceTo = process.env.PRACTICE_EMAIL || process.env.ADMIN_EMAIL || 'info@kunsttherapie-pb.de';
  const from = process.env.SMTP_FROM;
  const transport = createTransport();
  const imageUrl = `${baseUrl.replace(/\/$/, '')}/uploads/${submission.image_path.replace(/\\/g, '/')}`;
  const who = submission.is_anonymous
    ? 'Anonym'
    : [submission.submitter_name, submission.submitter_email].filter(Boolean).join(' · ') || 'Mit Name';

  const mails = [
    {
      label: 'Praxis (Atelier)',
      options: {
        from,
        to: practiceTo,
        subject: `Neue Mini-Atelier-Einsendung #${submission.id}`,
        text: `Neue Einsendung aus dem Mini-Atelier (#${submission.id})\n${who}\n${submission.note || ''}\n\nBild: ${imageUrl}\n\nAdmin: ${baseUrl}/admin`,
        html: `
          <p><strong>Neue Mini-Atelier-Einsendung #${esc(String(submission.id))}</strong></p>
          <p>${esc(who)}</p>
          ${submission.note ? `<p>${esc(submission.note).replace(/\n/g, '<br>')}</p>` : ''}
          <p><a href="${esc(imageUrl)}">Werk ansehen</a> · <a href="${esc(baseUrl)}/admin">Im Admin öffnen</a></p>
        `,
      },
    },
  ];

  // Bestätigungsmail nur wenn nicht anonym – unabhängig von der Praxis-Mail.
  if (!submission.is_anonymous && submission.submitter_email) {
    mails.push({
      label: 'Einsender (Bestätigung)',
      options: {
        from,
        to: submission.submitter_email,
        subject: 'Einsendung angekommen – Kunsttherapie Paderborn',
        text: `Hallo${submission.submitter_name ? ' ' + submission.submitter_name : ''},\n\nvielen Dank für die Einsendung aus dem Mini-Atelier. Das Werk ist eingegangen und kann vertraulich als Impuls genutzt werden.\n\nHerzliche Grüße\nKunsttherapie Paderborn`,
        html: `<p>Hallo${submission.submitter_name ? ' ' + esc(submission.submitter_name) : ''},</p>
          <p>vielen Dank für die Einsendung aus dem Mini-Atelier. Das Werk ist eingegangen und kann vertraulich als Impuls genutzt werden.</p>
          <p>Herzliche Grüße<br>Kunsttherapie Paderborn</p>`,
      },
    });
  }

  const results = await sendIndependently(transport, mails);
  return { sent: results.some(Boolean) };
}

async function sendEventRegistration({ name, email: fromEmail, phone, message, eventTitle, eventDate, eventTime }) {
  if (!isEmailConfigured()) {
    return { sent: false, reason: 'smtp_not_configured' };
  }

  const practiceTo = process.env.PRACTICE_EMAIL || process.env.ADMIN_EMAIL || 'info@kunsttherapie-pb.de';
  const from = process.env.SMTP_FROM;
  const transport = createTransport();

  const dateStr = eventDate ? new Date(eventDate).toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
  const when = [dateStr, eventTime].filter(Boolean).join(' um ');

  const [practiceSent, clientSent] = await sendIndependently(transport, [
    {
      label: 'Praxis (Anmeldung)',
      options: {
        from,
        to: practiceTo,
        replyTo: fromEmail,
        subject: `Anmeldung: ${eventTitle}${when ? ' · ' + when : ''} – ${name}`,
        text: `Neue Anmeldung für: ${eventTitle}${when ? ' (' + when + ')' : ''}\n\nName: ${name}\nE-Mail: ${fromEmail}\nTelefon: ${phone || '–'}\n\n${message || ''}`,
        html: `<p><strong>Neue Anmeldung für: ${esc(eventTitle)}</strong>${when ? `<br>${esc(when)}` : ''}</p>
          <p><strong>${esc(name)}</strong> &lt;<a href="mailto:${esc(fromEmail)}">${esc(fromEmail)}</a>&gt;</p>
          ${phone ? `<p>Telefon: ${esc(phone)}</p>` : ''}
          ${message ? `<p>${esc(message).replace(/\n/g, '<br>')}</p>` : ''}`,
      },
    },
    {
      label: 'Anmelder (Bestätigung)',
      options: {
        from,
        to: fromEmail,
        subject: `Anmeldung bestätigt: ${eventTitle}`,
        text: `Hallo ${name},\n\nvielen Dank für die Anmeldung zu „${eventTitle}"${when ? ' am ' + when : ''}.\n\nIch melde mich zeitnah mit weiteren Details.\n\nHerzliche Grüße\nMartina Schwierzke\nKunsttherapie Paderborn`,
        html: `<p>Hallo ${esc(name)},</p>
          <p>vielen Dank für die Anmeldung zu <strong>${esc(eventTitle)}</strong>${when ? ' am ' + esc(when) : ''}.</p>
          <p>Ich melde mich zeitnah mit weiteren Details.</p>
          <p>Herzliche Grüße<br>Martina Schwierzke<br>Kunsttherapie Paderborn</p>`,
      },
    },
  ]);

  return { sent: practiceSent || clientSent };
}

module.exports = {
  isEmailConfigured,
  sendBookingRequestEmails,
  sendBookingEmails,
  sendContactMessage,
  sendContactVerification,
  sendContactNotificationToPractice,
  sendContactOutcome,
  sendAtelierSubmissionNotice,
  sendEventRegistration,
  formatGermanDateTime,
};
