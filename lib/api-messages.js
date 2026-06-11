/**
 * Öffentliche API-Antworten (DE/EN) für Kontakt, Buchung und Atelier.
 */
const MESSAGES = {
  de: {
    'contact.success': 'Vielen Dank – die Nachricht ist angekommen. Ich melde mich zeitnah.',
    'contact.required': 'Name, E-Mail und Nachricht sind erforderlich',
    'contact.invalidEmail': 'Ungültige E-Mail-Adresse',
    'contact.mailFailed':
      'Nachricht konnte nicht per E-Mail versendet werden. Bitte ruf uns an oder schreib direkt an info@kunsttherapie-pb.de.',
    'contact.sendFailed': 'Nachricht konnte nicht gesendet werden',
    'booking.success': 'Anfrage eingegangen! Die Bestätigung folgt per E-Mail.',
    'booking.successEmail':
      'Anfrage eingegangen! Die Bestätigung folgt per E-Mail – danach lässt sich der Termin im Kalender speichern.',
    'booking.successSaved':
      'Anfrage gespeichert! Die Bestätigung folgt zeitnah per E-Mail.',
    'booking.required': 'Name, E-Mail, Datum und Uhrzeit sind erforderlich',
    'booking.invalidDateTime': 'Ungültiges Datum oder Uhrzeit',
    'booking.noWorkingDay': 'An diesem Tag sind keine Termine möglich',
    'booking.tooSoon': 'Dieser Termin liegt zu nah in der Vergangenheit',
    'booking.invalidSlot': 'Ungültiger Termin-Slot',
    'booking.unavailable': 'Dieser Termin ist leider nicht mehr verfügbar',
    'booking.failed': 'Buchung fehlgeschlagen',
    'atelier.rateLimit': 'Zu viele Einsendungen – bitte später erneut versuchen.',
    'atelier.uploadFailed': 'Upload fehlgeschlagen',
    'atelier.imageRequired': 'Bitte ein fertiges Werk (Bild) mitsenden',
    'atelier.identityRequired': 'Bitte Name oder E-Mail angeben – oder anonym senden.',
    'atelier.success':
      'Vielen Dank! Das Werk ist im Atelier eingegangen und kann vertraulich als Impuls genutzt werden.',
    'atelier.saveFailed': 'Einsendung konnte nicht gespeichert werden',
  },
  en: {
    'contact.success': 'Thank you – your message has been received. I will get back to you soon.',
    'contact.required': 'Name, email, and message are required',
    'contact.invalidEmail': 'Invalid email address',
    'contact.mailFailed':
      'Your message could not be sent by email. Please call us or write directly to info@kunsttherapie-pb.de.',
    'contact.sendFailed': 'Your message could not be sent',
    'booking.success': 'Request received! Confirmation will follow by email.',
    'booking.successEmail':
      'Request received! Confirmation will follow by email – you can then save the appointment in your calendar.',
    'booking.successSaved': 'Request saved! Confirmation will follow by email soon.',
    'booking.required': 'Name, email, date, and time are required',
    'booking.invalidDateTime': 'Invalid date or time',
    'booking.noWorkingDay': 'No appointments are available on this day',
    'booking.tooSoon': 'This appointment is too soon in the past',
    'booking.invalidSlot': 'Invalid appointment slot',
    'booking.unavailable': 'Unfortunately this appointment is no longer available',
    'booking.failed': 'Booking failed',
    'atelier.rateLimit': 'Too many submissions – please try again later.',
    'atelier.uploadFailed': 'Upload failed',
    'atelier.imageRequired': 'Please include a finished artwork (image)',
    'atelier.identityRequired': 'Please provide a name or email – or send anonymously.',
    'atelier.success':
      'Thank you! Your artwork has been received at the atelier and may be used confidentially as inspiration.',
    'atelier.saveFailed': 'Submission could not be saved',
  },
};

function apiLang(req) {
  const raw = req.body?.lang || req.query?.lang || req.headers['x-kt-lang'];
  return raw === 'en' ? 'en' : 'de';
}

function apiMsg(key, lang) {
  const bucket = MESSAGES[lang] || MESSAGES.de;
  return bucket[key] || MESSAGES.de[key] || key;
}

module.exports = { apiLang, apiMsg };
