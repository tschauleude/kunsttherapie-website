#!/usr/bin/env node
/**
 * Ersetzt Du/Sie-Anrede in i18n-Dateien durch neutrale Formulierungen (grobe Muster).
 */
const fs = require('fs');
const path = require('path');

const files = [
  path.join(__dirname, '../assets/js/i18n-messages.js'),
  path.join(__dirname, '../assets/js/i18n-messages-pages.js'),
];

const pairs = [
  // DE – häufige Muster (Reihenfolge: spezifisch zuerst)
  ['Deine Angaben', 'Angaben'],
  ['Deine Anfrage', 'Die Anfrage'],
  ['Dein geschützter Ort', 'Geschützter Ort'],
  ['Dein Werk', 'Das Werk'],
  ['deine E-Mail-Adresse', 'die angegebene E-Mail-Adresse'],
  ['deinem Kalender', 'dem Kalender'],
  ['deine Auswahl', 'die Auswahl'],
  ['deinen Neuigkeiten-Hinweis', 'den Neuigkeiten-Hinweis'],
  ['deine Einwilligung', 'die Einwilligung'],
  ['Deine Rechte', 'Betroffenenrechte'],
  ['Deine Angaben werden', 'Die Angaben werden'],
  ['Danke! Deine Nachricht', 'Vielen Dank – die Nachricht'],
  ['Was passt zu dir?', 'Welches Angebot passt?'],
  ['Probier dich aus', 'Ausprobieren im Mini-Atelier'],
  ["Probier's aus", 'Ausprobieren'],
  ['für dich stimmig', 'stimmig'],
  ['ob du „künstlerisch“', 'ob „künstlerisch“'],
  ['<strong>Trau dich –', '<strong>Ausprobieren lohnt sich –'],
  ['Was du erwarten kannst', 'Im Atelier'],
  ['findest du unten', 'siehe unten'],
  ['dass du dich schnell geborgen', 'sich schnell geborgen'],
  ['Wenn du magst', 'Optional'],
  ['wenn du Interesse', 'bei Interesse'],
  ['Melde dich an', 'Anmeldung per Kontakt'],
  ['Schreib uns gerne', 'Gern per Kontakt'],
  ['bleib gern auf dem Laufenden', 'auf dem Laufenden bleiben'],
  ['Schreib mir direkt', 'Gern direkt anfragen'],
  ['Martina bestätigt den Termin', 'Die Anfrage wird per E-Mail bestätigt'],
  ['Danach kannst du ihn', 'Danach lässt sich der Termin'],
  ['kannst du Darstellungseinstellungen', 'sind Darstellungseinstellungen möglich'],
  ['Du kannst deine Einwilligung', 'Die Einwilligung lässt sich'],
  ['Du hast das Recht', 'Es besteht das Recht'],
  ['kannst du diese jederzeit widerrufen', 'ist jederzeit widerrufbar'],
  ['Wenn du online einen Termin buchst', 'Bei einer Online-Terminbuchung'],
  ['die von dir eingegebenen', 'die eingegebenen'],
  ['und dich zu kontaktieren', 'und zur Kontaktaufnahme'],
  ['Wenn du uns per E-Mail', 'Bei Kontakt per E-Mail'],
  ['die von dir mitgeteilten', 'die mitgeteilten'],
  ['zur Bearbeitung deiner Anfrage', 'zur Bearbeitung der Anfrage'],
  ['Daten erhältst du nur dann von uns, wenn du uns', 'Daten werden nur übermittelt, wenn'],
  ['wenn du uns etwas aktiv mitteilst', 'bei aktiver Mitteilung'],
  ['wenn du optionale Dienste', 'bei Zustimmung zu optionalen Diensten'],
  ['welche Meldung du zuletzt', 'welche Meldung zuletzt'],
  ['ob du den', 'ob der'],
  ['was du uns aktiv gibst', 'was aktiv mitgeteilt wird'],
  ['auf deinem Gerät', 'im Browser'],
  ['nicht auf deinem Gerät', 'nicht im Browser'],
  ['Passen Sie die Darstellung an Ihre Bedürfnisse an', 'Darstellung anpassen – Einstellungen für Bedürfnisse'],
  ['mit deiner Einwilligung', 'mit Einwilligung'],
  // EN
  ['Your details', 'Details'],
  ['Your request', 'The request'],
  ['Your safe place', 'A safe place'],
  ['Your artwork', 'Artwork'],
  ['your email address', 'the email address provided'],
  ['your calendar', 'the calendar'],
  ['Your rights', 'Data subject rights'],
  ['Thank you! Your message', 'Thank you – message received'],
  ['What suits you?', 'Which offer fits?'],
  ['Try it out', 'Try the mini studio'],
  ['right for you', 'feels right'],
  ['whether you consider', 'whether someone considers'],
  ['<strong>Be brave –', '<strong>Curiosity welcome –'],
  ['so you feel at home', 'to feel at home quickly'],
  ['What you can expect', 'What to expect'],
  ['find below', 'see below'],
  ['You can send', 'Artwork can be sent'],
  ['You can then save', 'The appointment can then be saved'],
  ['You can withdraw', 'Consent can be withdrawn'],
  ['You have the right', 'There is a right'],
  ['you may withdraw', 'withdrawal is possible at any time'],
  ['When you book online', 'When booking online'],
  ['data you enter', 'data entered'],
  ['and contact you', 'and for contact'],
  ['When you contact us', 'When contacting us'],
  ['data you provide', 'data provided'],
  ['your enquiry', 'the enquiry'],
  ['we only receive data from you when you', 'data is only received when'],
  ['when you actively', 'when actively'],
  ['when you consent', 'when consenting to'],
  ['which message you last', 'which message was last'],
  ['whether you have', 'whether the'],
  ['what you actively give us', 'what is actively shared'],
  ['on your device', 'in the browser'],
  ['Adjust the display to your needs', 'Adjust display settings'],
  ['with your consent', 'with consent'],
  ['I will get back to you', 'A reply follows soon'],
  ['ich melde mich zeitnah', 'Rückmeldung folgt zeitnah'],
];

for (const file of files) {
  let text = fs.readFileSync(file, 'utf8');
  let count = 0;
  for (const [from, to] of pairs) {
    if (text.includes(from)) {
      text = text.split(from).join(to);
      count += 1;
    }
  }
  fs.writeFileSync(file, text);
  console.log(path.basename(file), count, 'pattern groups applied');
}
