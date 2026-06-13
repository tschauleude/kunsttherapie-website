const nodemailer = require('nodemailer');
const ical = require('./ical');

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
    <p>Hallo ${booking.name},</p>
    <p>der Termin ist <strong>bestätigt</strong>:</p>
    <p><strong>${when}</strong><br>
    Otto-Stadler-Straße 23c, 33102 Paderborn</p>
    <p>Der Termin lässt sich direkt im Kalender speichern:</p>
    <ul>
      <li><a href="${links.googleUrl}">Google Kalender</a></li>
      <li><a href="${links.icsUrl}">Apple / Outlook (.ics herunterladen)</a></li>
    </ul>
    <p>Bei Fragen: <a href="mailto:info@kunsttherapie-pb.de">info@kunsttherapie-pb.de</a> oder Tel. 05251-690111.</p>
    <p>Herzliche Grüße<br>Kunsttherapie Paderborn</p>
  `;
}

function buildClientRequestEmailHtml(booking) {
  const when = formatGermanDateTime(booking);
  return `
    <p>Hallo ${booking.name},</p>
    <p>vielen Dank für die Terminanfrage:</p>
    <p><strong>${when}</strong><br>
    Otto-Stadler-Straße 23c, 33102 Paderborn</p>
    <p>Die Anfrage wird geprüft – die <strong>Bestätigung folgt per E-Mail</strong>, sobald der Termin fest steht.</p>
    <p>Bei Fragen: <a href="mailto:info@kunsttherapie-pb.de">info@kunsttherapie-pb.de</a> · Tel. 05251-690111</p>
    <p>Herzliche Grüße<br>Kunsttherapie Paderborn</p>
  `;
}

function buildPracticeEmailHtml(booking, links) {
  const when = formatGermanDateTime(booking);
  return `
    <p><strong>Neue Online-Buchung #${booking.id}</strong></p>
    <p>${when}</p>
    <p>
      <strong>${booking.name}</strong><br>
      E-Mail: <a href="mailto:${booking.email}">${booking.email}</a><br>
      ${booking.phone ? `Telefon: ${booking.phone}<br>` : ''}
      ${booking.message ? `Nachricht: ${booking.message}` : ''}
    </p>
    <p><a href="${links.icsUrl}">Termin als .ics</a></p>
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
      <p><strong>Neue Terminanfrage #${booking.id}</strong> (Status: ausstehend)</p>
      <p>${when}</p>
      <p>${booking.name} &lt;<a href="mailto:${booking.email}">${booking.email}</a>&gt;<br>
      ${booking.phone ? `Telefon: ${booking.phone}<br>` : ''}
      ${booking.message ? `Nachricht: ${booking.message}` : ''}</p>
      <p>Bitte im Admin-Bereich unter „Termine“ bestätigen.</p>
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

async function sendContactMessage({ name, email: fromEmail, phone, message }) {
  if (!isEmailConfigured()) {
    return { sent: false, reason: 'smtp_not_configured' };
  }

  const practiceTo = process.env.PRACTICE_EMAIL || process.env.ADMIN_EMAIL || 'info@kunsttherapie-pb.de';
  const from = process.env.SMTP_FROM;
  const transport = createTransport();

  await transport.sendMail({
    from,
    to: practiceTo,
    replyTo: fromEmail,
    subject: `Kontaktanfrage Website: ${name}`,
    text: `Name: ${name}\nE-Mail: ${fromEmail}\nTelefon: ${phone || '–'}\n\n${message}`,
    html: `<p><strong>${name}</strong> &lt;<a href="mailto:${fromEmail}">${fromEmail}</a>&gt;</p>
      ${phone ? `<p>Telefon: ${phone}</p>` : ''}
      <p>${message.replace(/\n/g, '<br>')}</p>`,
  });

  await transport.sendMail({
    from,
    to: fromEmail,
    subject: 'Nachricht eingegangen – Kunsttherapie Paderborn',
    text: `Hallo ${name},\n\nvielen Dank für die Nachricht. Ich melde mich zeitnah.\n\nHerzliche Grüße\nMartina Schwierzke`,
    html: `<p>Hallo ${name},</p><p>vielen Dank für die Nachricht. Ich melde mich zeitnah.</p><p>Herzliche Grüße<br>Martina Schwierzke</p>`,
  });

  return { sent: true };
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

  await transport.sendMail({
    from,
    to: practiceTo,
    subject: `Neue Mini-Atelier-Einsendung #${submission.id}`,
    text: `Neue Einsendung aus dem Mini-Atelier (#${submission.id})\n${who}\n${submission.note || ''}\n\nBild: ${imageUrl}\n\nAdmin: ${baseUrl}/admin`,
    html: `
      <p><strong>Neue Mini-Atelier-Einsendung #${submission.id}</strong></p>
      <p>${who}</p>
      ${submission.note ? `<p>${submission.note.replace(/\n/g, '<br>')}</p>` : ''}
      <p><a href="${imageUrl}">Werk ansehen</a> · <a href="${baseUrl}/admin">Im Admin öffnen</a></p>
    `,
  });

  if (!submission.is_anonymous && submission.submitter_email) {
    await transport.sendMail({
      from,
      to: submission.submitter_email,
      subject: 'Einsendung angekommen – Kunsttherapie Paderborn',
      text: `Hallo${submission.submitter_name ? ' ' + submission.submitter_name : ''},\n\nvielen Dank für die Einsendung aus dem Mini-Atelier. Das Werk ist eingegangen und kann vertraulich als Impuls genutzt werden.\n\nHerzliche Grüße\nKunsttherapie Paderborn`,
      html: `<p>Hallo${submission.submitter_name ? ' ' + submission.submitter_name : ''},</p>
        <p>vielen Dank für die Einsendung aus dem Mini-Atelier. Das Werk ist eingegangen und kann vertraulich als Impuls genutzt werden.</p>
        <p>Herzliche Grüße<br>Kunsttherapie Paderborn</p>`,
    });
  }

  return { sent: true };
}

module.exports = {
  isEmailConfigured,
  sendBookingRequestEmails,
  sendBookingEmails,
  sendContactMessage,
  sendAtelierSubmissionNotice,
  formatGermanDateTime,
};
