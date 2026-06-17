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

function logSmtpWarning() {
  if (!isEmailConfigured()) {
    console.warn('[E-Mail] SMTP nicht konfiguriert – E-Mails werden NICHT versendet. Bitte SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM in .env setzen.');
  }
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

// Einheitliches E-Mail-Layout passend zur Website (Teal/Rose, Georgia, #f2efe8)
function emailWrapper(content) {
  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{margin:0;padding:0;background:#f2efe8;font-family:Georgia,'Times New Roman',serif;color:#3d3d3d}
  .wrap{max-width:580px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,.10)}
  .header{background:#4a6e6a;padding:28px 36px 22px}
  .header h1{margin:0;font-size:20px;color:#fff;font-weight:normal;letter-spacing:.03em}
  .header p{margin:4px 0 0;color:rgba(255,255,255,.72);font-size:13px}
  .body{padding:32px 36px}
  .body p{margin:0 0 16px;line-height:1.75;font-size:15px}
  .body a{color:#4a6e6a}
  .body strong{color:#3d3d3d}
  .info-box{background:#f9f7f3;border-left:3px solid #4a6e6a;padding:14px 18px;border-radius:0 6px 6px 0;margin:20px 0}
  .info-box p{margin:0 0 6px;font-size:14px}
  .info-box p:last-child{margin:0}
  .msg-box{background:#f9f7f3;border-left:3px solid #d18d89;padding:14px 18px;border-radius:0 6px 6px 0;margin:20px 0;font-style:italic;line-height:1.75;font-size:15px}
  .meta{font-size:13px;color:#767676;margin-bottom:16px;line-height:1.8}
  .meta strong{color:#3d3d3d}
  .btn-row{margin:24px 0 8px;display:flex;gap:12px;flex-wrap:wrap}
  .btn{display:inline-block;padding:12px 28px;border-radius:8px;text-decoration:none;font-family:Georgia,serif;font-size:15px;font-weight:bold;line-height:1}
  .btn-primary{background:#4a6e6a;color:#fff !important}
  .btn-confirm{background:#4a6e6a;color:#fff !important}
  .btn-reject{background:#fff;color:#b8736f !important;border:2px solid #b8736f}
  .divider{border:none;border-top:1px solid #ede9e0;margin:24px 0}
  .note{font-size:13px;color:#999;margin-top:8px}
  .footer{padding:18px 36px;border-top:1px solid #ede9e0;font-size:12px;color:#aaa;line-height:1.6}
  .footer a{color:#aaa}
  @media(max-width:480px){.body,.header,.footer{padding:20px}.btn-row{flex-direction:column}}
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <h1>Kunsttherapie Paderborn</h1>
    <p>Martina Schwierzke</p>
  </div>
  <div class="body">${content}</div>
  <div class="footer">
    Kunsttherapie Paderborn · Martina Schwierzke<br>
    Otto-Stadler-Straße 23c · 33102 Paderborn<br>
    <a href="mailto:info@kunsttherapie-pb.de">info@kunsttherapie-pb.de</a> · Tel. 05251-690111
  </div>
</div>
</body></html>`;
}

// Sendet mehrere Mails unabhängig voneinander.
async function sendIndependently(transport, mails) {
  const results = await Promise.allSettled(mails.map((m) => transport.sendMail(m.options)));
  return results.map((r, i) => {
    if (r.status === 'rejected') {
      console.error(`[E-Mail] (${mails[i].label}) fehlgeschlagen:`, r.reason?.message || r.reason);
      return false;
    }
    return true;
  });
}

// ── Buchung: Anfrage eingegangen ──────────────────────────────────────────────

async function sendBookingRequestEmails(booking) {
  if (!isEmailConfigured()) return { sent: false, reason: 'smtp_not_configured' };

  const practiceTo = process.env.PRACTICE_EMAIL || process.env.ADMIN_EMAIL || 'info@kunsttherapie-pb.de';
  const from = process.env.SMTP_FROM;
  const transport = createTransport();
  const when = formatGermanDateTime(booking);

  const clientHtml = emailWrapper(`
    <p>Hallo ${esc(booking.name)},</p>
    <p>vielen Dank für Ihre Terminanfrage. Ich habe sie erhalten und melde mich zeitnah zur Bestätigung.</p>
    <div class="info-box">
      <p><strong>Gewünschter Termin</strong></p>
      <p>${esc(when)}</p>
      <p>Otto-Stadler-Straße 23c, 33102 Paderborn</p>
    </div>
    ${booking.message ? `<p><em>Ihre Nachricht:</em> ${esc(booking.message)}</p>` : ''}
    <hr class="divider">
    <p>Bei Fragen können Sie mich jederzeit erreichen.</p>
    <p>Herzliche Grüße<br><strong>Martina Schwierzke</strong></p>
  `);

  const practiceHtml = emailWrapper(`
    <p><strong>Neue Terminanfrage #${esc(String(booking.id))}</strong></p>
    <div class="info-box">
      <p><strong>${esc(when)}</strong></p>
    </div>
    <div class="meta">
      <strong>${esc(booking.name)}</strong><br>
      <a href="mailto:${esc(booking.email)}">${esc(booking.email)}</a><br>
      ${booking.phone ? `${esc(booking.phone)}<br>` : ''}
    </div>
    ${booking.message ? `<div class="msg-box">${esc(booking.message).replace(/\n/g, '<br>')}</div>` : ''}
    <p>Bitte im <a href="${esc(process.env.PUBLIC_SITE_URL || '')}/admin">Admin-Bereich</a> unter „Buchungen" bestätigen.</p>
  `);

  const [clientSent, practiceSent] = await sendIndependently(transport, [
    {
      label: 'Kunde (Anfrage)',
      options: {
        from,
        to: booking.email,
        subject: `Terminanfrage eingegangen – ${when}`,
        text: `Hallo ${booking.name},\n\nvielen Dank für Ihre Terminanfrage: ${when}\nDie Bestätigung folgt zeitnah per E-Mail.\n\nHerzliche Grüße\nMartina Schwierzke\nKunsttherapie Paderborn`,
        html: clientHtml,
      },
    },
    {
      label: 'Praxis (Anfrage)',
      options: {
        from,
        to: practiceTo,
        replyTo: booking.email,
        subject: `Neue Terminanfrage: ${booking.name} – ${when}`,
        text: `Neue Anfrage #${booking.id}\n${when}\n${booking.name} <${booking.email}>\n${booking.phone || ''}\n${booking.message || ''}\n\nBitte im Admin bestätigen.`,
        html: practiceHtml,
      },
    },
  ]);

  return { sent: clientSent || practiceSent, clientSent, practiceSent };
}

// ── Buchung: Bestätigung ──────────────────────────────────────────────────────

async function sendBookingEmails(booking, baseUrl) {
  if (!isEmailConfigured()) return { sent: false, reason: 'smtp_not_configured' };

  const links = ical.buildCalendarLinks(booking, baseUrl);
  const icsContent = ical.buildIcs(booking);
  const practiceTo = process.env.PRACTICE_EMAIL || process.env.ADMIN_EMAIL || 'info@kunsttherapie-pb.de';
  const from = process.env.SMTP_FROM;
  const transport = createTransport();
  const when = formatGermanDateTime(booking);

  const clientHtml = emailWrapper(`
    <p>Hallo ${esc(booking.name)},</p>
    <p>Ihr Termin ist <strong>bestätigt</strong>. Ich freue mich auf unser Treffen!</p>
    <div class="info-box">
      <p><strong>${esc(when)}</strong></p>
      <p>Otto-Stadler-Straße 23c, 33102 Paderborn</p>
    </div>
    <p>Den Termin direkt im Kalender speichern:</p>
    <div class="btn-row">
      <a href="${esc(links.googleUrl)}" class="btn btn-primary">Google Kalender</a>
      <a href="${esc(links.icsUrl)}" class="btn btn-primary">Apple / Outlook (.ics)</a>
    </div>
    <p class="note">Die .ics-Datei ist auch als Anhang beigefügt.</p>
    <hr class="divider">
    <p>Herzliche Grüße<br><strong>Martina Schwierzke</strong></p>
  `);

  const practiceHtml = emailWrapper(`
    <p><strong>Buchung bestätigt: #${esc(String(booking.id))}</strong></p>
    <div class="info-box">
      <p><strong>${esc(when)}</strong></p>
    </div>
    <div class="meta">
      <strong>${esc(booking.name)}</strong><br>
      <a href="mailto:${esc(booking.email)}">${esc(booking.email)}</a><br>
      ${booking.phone ? `${esc(booking.phone)}<br>` : ''}
    </div>
    ${booking.message ? `<div class="msg-box">${esc(booking.message).replace(/\n/g, '<br>')}</div>` : ''}
    <p><a href="${esc(links.icsUrl)}">Termin als .ics herunterladen</a></p>
  `);

  const [clientSent, practiceSent] = await sendIndependently(transport, [
    {
      label: 'Kunde (Bestätigung)',
      options: {
        from,
        to: booking.email,
        subject: `Terminbestätigung – ${when}`,
        text: `Hallo ${booking.name},\n\nIhr Termin ist bestätigt: ${when}\nOtto-Stadler-Straße 23c, Paderborn\n\nGoogle Kalender: ${links.googleUrl}\nICS-Datei: ${links.icsUrl}\n\nHerzliche Grüße\nMartina Schwierzke`,
        html: clientHtml,
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
        subject: `Buchung bestätigt: ${booking.name} – ${when}`,
        text: `Buchung #${booking.id}\n${when}\n${booking.name} <${booking.email}>\n${booking.phone || ''}\n${booking.message || ''}`,
        html: practiceHtml,
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

// ── Kontakt: E-Mail-Verifizierung (Schritt 1) ─────────────────────────────────

async function sendContactVerification({ name, email: fromEmail, verifyUrl }) {
  if (!isEmailConfigured()) return { sent: false, reason: 'smtp_not_configured' };

  const from = process.env.SMTP_FROM;
  const transport = createTransport();

  const html = emailWrapper(`
    <p>Hallo ${esc(name)},</p>
    <p>vielen Dank für Ihre Nachricht an Kunsttherapie Paderborn.</p>
    <p>Ein letzter Schritt: Bitte bestätigen Sie Ihre E-Mail-Adresse, damit die Nachricht zugestellt werden kann.</p>
    <div class="btn-row">
      <a href="${esc(verifyUrl)}" class="btn btn-primary">E-Mail-Adresse bestätigen</a>
    </div>
    <p class="note">Dieser Link ist 24 Stunden gültig. Falls Sie kein Kontaktformular ausgefüllt haben, können Sie diese E-Mail ignorieren.</p>
  `);

  const [sent] = await sendIndependently(transport, [{
    label: 'Absender (Verifizierung)',
    options: {
      from,
      to: fromEmail,
      subject: 'Bitte bestätigen Sie Ihre E-Mail – Kunsttherapie Paderborn',
      text: `Hallo ${name},\n\nbitte bestätigen Sie Ihre E-Mail-Adresse:\n${verifyUrl}\n\nDer Link ist 24 Stunden gültig. Falls Sie kein Formular ausgefüllt haben, einfach ignorieren.\n\nKunsttherapie Paderborn`,
      html,
    },
  }]);

  return { sent };
}

// ── Kontakt: Benachrichtigung an Martina (Schritt 2) ─────────────────────────

async function sendContactNotificationToPractice({ name, email: fromEmail, phone, message, confirmUrl, rejectUrl }) {
  if (!isEmailConfigured()) return { sent: false, reason: 'smtp_not_configured' };

  const practiceTo = process.env.PRACTICE_EMAIL || process.env.ADMIN_EMAIL || 'info@kunsttherapie-pb.de';
  const from = process.env.SMTP_FROM;
  const transport = createTransport();

  const html = emailWrapper(`
    <p><strong>Neue Kontaktanfrage</strong> (E-Mail verifiziert)</p>
    <div class="meta">
      <strong>${esc(name)}</strong><br>
      <a href="mailto:${esc(fromEmail)}">${esc(fromEmail)}</a><br>
      ${phone ? `${esc(phone)}<br>` : ''}
    </div>
    <div class="msg-box">${esc(message).replace(/\n/g, '<br>')}</div>
    <p>Bitte wählen Sie eine Aktion:</p>
    <div class="btn-row">
      <a href="${esc(confirmUrl)}" class="btn btn-confirm">Anfrage annehmen</a>
      <a href="${esc(rejectUrl)}" class="btn btn-reject">Anfrage ablehnen</a>
    </div>
    <p class="note">Nach dem Klick wird ${esc(name)} automatisch per E-Mail benachrichtigt.</p>
  `);

  const [sent] = await sendIndependently(transport, [{
    label: 'Praxis (Kontakt)',
    options: {
      from,
      to: practiceTo,
      replyTo: fromEmail,
      subject: `Kontaktanfrage von ${name}`,
      text: `Neue Kontaktanfrage (verifiziert)\n\nName: ${name}\nE-Mail: ${fromEmail}\nTelefon: ${phone || '–'}\n\n${message}\n\nAnnehmen: ${confirmUrl}\nAblehnen: ${rejectUrl}`,
      html,
    },
  }]);

  return { sent };
}

// ── Kontakt: Ergebnis an Anfragensteller (Schritt 3) ─────────────────────────

async function sendContactOutcome({ name, email: fromEmail, accepted }) {
  if (!isEmailConfigured()) return { sent: false };

  const from = process.env.SMTP_FROM;
  const transport = createTransport();

  const html = accepted
    ? emailWrapper(`
        <p>Hallo ${esc(name)},</p>
        <p>vielen Dank für Ihre Nachricht. Ich habe sie erhalten und <strong>melde mich in Kürze persönlich bei Ihnen</strong>.</p>
        <hr class="divider">
        <p>Herzliche Grüße<br><strong>Martina Schwierzke</strong></p>
      `)
    : emailWrapper(`
        <p>Hallo ${esc(name)},</p>
        <p>vielen Dank für Ihre Nachricht. Leider kann ich zum aktuellen Zeitpunkt keine neuen Anfragen annehmen.</p>
        <p>Für dringende Anliegen wenden Sie sich gerne direkt an mich:</p>
        <div class="info-box">
          <p><a href="mailto:info@kunsttherapie-pb.de">info@kunsttherapie-pb.de</a></p>
          <p>Tel. 05251-690111</p>
        </div>
        <hr class="divider">
        <p>Herzliche Grüße<br><strong>Martina Schwierzke</strong></p>
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
        : `Hallo ${name},\n\nleider kann ich Ihre Anfrage aktuell nicht annehmen. Bei Bedarf: info@kunsttherapie-pb.de · Tel. 05251-690111\n\nHerzliche Grüße\nMartina Schwierzke`,
      html,
    },
  }]);

  return { sent };
}

// ── Mini-Atelier: Einsendung ──────────────────────────────────────────────────

async function sendAtelierSubmissionNotice(submission, baseUrl) {
  if (!isEmailConfigured()) return { sent: false, reason: 'smtp_not_configured' };

  const practiceTo = process.env.PRACTICE_EMAIL || process.env.ADMIN_EMAIL || 'info@kunsttherapie-pb.de';
  const from = process.env.SMTP_FROM;
  const transport = createTransport();

  // URI-encode path segments to handle special characters
  const encodedPath = submission.image_path
    .replace(/\\/g, '/')
    .split('/')
    .map(encodeURIComponent)
    .join('/');
  const imageUrl = `${baseUrl.replace(/\/$/, '')}/uploads/${encodedPath}`;

  const who = submission.is_anonymous
    ? 'Anonym'
    : [submission.submitter_name, submission.submitter_email].filter(Boolean).join(' · ') || 'Mit Name';

  const practiceHtml = emailWrapper(`
    <p><strong>Neue Mini-Atelier-Einsendung #${esc(String(submission.id))}</strong></p>
    <div class="meta">
      <strong>${esc(who)}</strong>
    </div>
    ${submission.note ? `<div class="msg-box">${esc(submission.note).replace(/\n/g, '<br>')}</div>` : ''}
    <div class="btn-row">
      <a href="${esc(imageUrl)}" class="btn btn-primary">Werk ansehen</a>
      <a href="${esc(baseUrl.replace(/\/$/, ''))}/admin" class="btn btn-primary">Im Admin öffnen</a>
    </div>
  `);

  const mails = [
    {
      label: 'Praxis (Atelier)',
      options: {
        from,
        to: practiceTo,
        subject: `Neue Mini-Atelier-Einsendung #${submission.id}`,
        text: `Neue Einsendung (#${submission.id})\n${who}\n${submission.note || ''}\n\nBild: ${imageUrl}\nAdmin: ${baseUrl}/admin`,
        html: practiceHtml,
      },
    },
  ];

  if (!submission.is_anonymous && submission.submitter_email) {
    const clientHtml = emailWrapper(`
      <p>Hallo${submission.submitter_name ? ' ' + esc(submission.submitter_name) : ''},</p>
      <p>vielen Dank für Ihre Einsendung im Mini-Atelier. Das Werk ist angekommen und kann als kreativer Impuls genutzt werden.</p>
      <hr class="divider">
      <p>Herzliche Grüße<br><strong>Kunsttherapie Paderborn</strong></p>
    `);
    mails.push({
      label: 'Einsender (Bestätigung)',
      options: {
        from,
        to: submission.submitter_email,
        subject: 'Ihre Einsendung ist angekommen – Kunsttherapie Paderborn',
        text: `Hallo${submission.submitter_name ? ' ' + submission.submitter_name : ''},\n\nvielen Dank für die Einsendung. Das Werk ist eingegangen.\n\nHerzliche Grüße\nKunsttherapie Paderborn`,
        html: clientHtml,
      },
    });
  }

  const results = await sendIndependently(transport, mails);
  return { sent: results.some(Boolean) };
}

// ── Veranstaltung: Anmeldung ──────────────────────────────────────────────────

async function sendEventRegistration({ name, email: fromEmail, phone, message, eventTitle, eventDate, eventTime }) {
  if (!isEmailConfigured()) return { sent: false, reason: 'smtp_not_configured' };

  const practiceTo = process.env.PRACTICE_EMAIL || process.env.ADMIN_EMAIL || 'info@kunsttherapie-pb.de';
  const from = process.env.SMTP_FROM;
  const transport = createTransport();

  const dateStr = eventDate
    ? new Date(eventDate).toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';
  const when = [dateStr, eventTime ? `${eventTime} Uhr` : ''].filter(Boolean).join(', ');

  const practiceHtml = emailWrapper(`
    <p><strong>Neue Anmeldung: ${esc(eventTitle)}</strong></p>
    ${when ? `<div class="info-box"><p>${esc(when)}</p></div>` : ''}
    <div class="meta">
      <strong>${esc(name)}</strong><br>
      <a href="mailto:${esc(fromEmail)}">${esc(fromEmail)}</a><br>
      ${phone ? `${esc(phone)}<br>` : ''}
    </div>
    ${message ? `<div class="msg-box">${esc(message).replace(/\n/g, '<br>')}</div>` : ''}
  `);

  const clientHtml = emailWrapper(`
    <p>Hallo ${esc(name)},</p>
    <p>vielen Dank für Ihre Anmeldung. Ich freue mich auf Sie!</p>
    <div class="info-box">
      <p><strong>${esc(eventTitle)}</strong></p>
      ${when ? `<p>${esc(when)}</p>` : ''}
      <p>Otto-Stadler-Straße 23c, 33102 Paderborn</p>
    </div>
    <p>Ich melde mich zeitnah mit weiteren Details.</p>
    <hr class="divider">
    <p>Herzliche Grüße<br><strong>Martina Schwierzke</strong></p>
  `);

  const [practiceSent, clientSent] = await sendIndependently(transport, [
    {
      label: 'Praxis (Anmeldung)',
      options: {
        from,
        to: practiceTo,
        replyTo: fromEmail,
        subject: `Anmeldung: ${eventTitle}${when ? ' · ' + when : ''} – ${name}`,
        text: `Neue Anmeldung: ${eventTitle}${when ? ' (' + when + ')' : ''}\n\nName: ${name}\nE-Mail: ${fromEmail}\nTelefon: ${phone || '–'}\n\n${message || ''}`,
        html: practiceHtml,
      },
    },
    {
      label: 'Anmelder (Bestätigung)',
      options: {
        from,
        to: fromEmail,
        subject: `Anmeldung bestätigt: ${eventTitle}`,
        text: `Hallo ${name},\n\nvielen Dank für Ihre Anmeldung zu „${eventTitle}"${when ? ' am ' + when : ''}.\nIch melde mich zeitnah.\n\nHerzliche Grüße\nMartina Schwierzke`,
        html: clientHtml,
      },
    },
  ]);

  return { sent: practiceSent || clientSent };
}

// Rückwärtskompatibel
async function sendContactMessage({ name, email: fromEmail, phone, message }) {
  return sendContactNotificationToPractice({
    name, email: fromEmail, phone, message,
    confirmUrl: '#', rejectUrl: '#',
  });
}

module.exports = {
  isEmailConfigured,
  logSmtpWarning,
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
