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
    <p>vielen Dank – dein Termin ist bei uns eingegangen:</p>
    <p><strong>${when}</strong><br>
    Otto-Stadler-Straße 23c, 33102 Paderborn</p>
    <p>Speichere den Termin direkt in deinem Kalender:</p>
    <ul>
      <li><a href="${links.googleUrl}">Google Kalender</a></li>
      <li><a href="${links.icsUrl}">Apple / Outlook (.ics herunterladen)</a></li>
    </ul>
    <p>Bei Fragen erreichst du uns unter <a href="mailto:info@kunsttherapie-pb.de">info@kunsttherapie-pb.de</a> oder Tel. 05251-690111.</p>
    <p>Herzliche Grüße<br>Martina Schwierzke<br>Kunsttherapie Paderborn</p>
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

  await transport.sendMail({
    from,
    to: booking.email,
    subject: `Terminbestätigung Kunsttherapie – ${when}`,
    text: `Hallo ${booking.name},\n\nIhr Termin ist eingegangen: ${when}\nOtto-Stadler-Straße 23c, Paderborn\n\nGoogle Kalender: ${links.googleUrl}\nICS-Datei: ${links.icsUrl}\n\nMartina Schwierzke`,
    html: buildClientEmailHtml(booking, links),
    attachments: [
      {
        filename: 'termin-kunsttherapie.ics',
        content: icsContent,
        contentType: 'text/calendar; charset=utf-8; method=PUBLISH',
      },
    ],
  });

  await transport.sendMail({
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
  });

  return { sent: true };
}

module.exports = {
  isEmailConfigured,
  sendBookingEmails,
  formatGermanDateTime,
};
