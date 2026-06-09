(function () {
  if (!window.I18N_MESSAGES) window.I18N_MESSAGES = { de: {}, en: {} };
  const extra = {
    de: {
      'nav.aria': 'Hauptnavigation',
      'nav.menu': 'Menü',
      'nav.events': 'Veranstaltungen',
      'btn.inquiry': 'Anfrage stellen',
      'btn.contact': 'Kontakt aufnehmen',
      'btn.message': 'Nachricht schicken',
      'form.phone': 'Telefon (optional)',

      'meta.home.title': 'Kunsttherapie Paderborn | Psychosoziale Kunsttherapie & Atelier',
      'meta.home.description':
        'Kunsttherapie in Paderborn: Di 11:00–12:30 und Do 18:00–19:30. Gruppen, Auszeit, Einzel, Teambuilding – Termin online buchen.',
      'meta.therapy.title': 'Kunsttherapie & Angebote – Paderborn',
      'meta.therapy.description':
        'Gruppen Dienstag morgens, Auszeit Donnerstag abends, Teambuilding und Einzelsitzungen. Atelier Otto-Stadler-Straße 23c, Paderborn.',
      'meta.about.title': 'Über mich – Kunsttherapeutin Paderborn',
      'meta.about.description':
        'Ich bin psychosoziale und klinische Kunsttherapeutin mit über 16 Jahren Erfahrung – Palliativ, Psychoonkologie, mein eigenes Atelier in Paderborn.',
      'meta.booking.title': 'Termin buchen – Kunsttherapie Paderborn',
      'meta.booking.description':
        'Online-Termin anfragen: Dienstag morgens und Donnerstag abends. Freie Zeiten im Kalender – Bestätigung per E-Mail.',
      'meta.contact.title': 'Kontakt – Kunsttherapie Paderborn',
      'meta.contact.description':
        'Nachricht senden, anrufen oder Anfahrt zum Atelier Otto-Stadler-Straße 23c, Paderborn.',
      'meta.prices.title': 'Preise – Kunsttherapie Paderborn',
      'meta.prices.description':
        'Transparente Preise für Gruppensitzungen ab 55 €, Programme und Einzelsitzungen auf Anfrage.',
      'meta.news.title': 'Neuigkeiten – Kunsttherapie Paderborn',
      'meta.news.description': 'Aktuelles aus dem Atelier: Termine, Raum und Ankündigungen.',
      'meta.events.title': 'Veranstaltungen – Kunsttherapie Paderborn',
      'meta.events.description': 'Workshops, Teambuilding und Veranstaltungen in Paderborn.',
      'meta.atelier.title': 'Mini-Atelier – Kunsttherapie Paderborn',
      'meta.atelier.description':
        'Ausprobieren im Mini-Atelier: Malen, Zeichnen und Kollage – optional anonym an das Atelier senden.',
      'meta.imprint.title': 'Impressum – Kunsttherapie Paderborn',
      'meta.imprint.description': 'Impressum der Website Kunsttherapie Paderborn.',
      'meta.privacy.title': 'Datenschutz – Kunsttherapie Paderborn',
      'meta.privacy.description': 'Datenschutzerklärung der Website Kunsttherapie Paderborn.',

      'home.popup.title': 'Aktuelles aus dem Atelier',
      'home.news.kicker': 'Aktuelles',
      'home.news.sub': 'Was gerade ansteht – direkt aus dem Atelier.',
      'home.news.loading': 'Neuigkeiten werden geladen …',
      'home.news.show': 'Aktuelles anzeigen',
      'home.news.all': 'Alle Neuigkeiten',
      'home.gallery.kicker': 'Einblicke',
      'home.gallery.sub':
        'Kreativität ohne Leistungsdruck – ein Blick in den Atelier-Alltag. Klick auf ein Bild zum Vergrößern.',
      'home.services.kicker': 'Leistungen',
      'home.praxis.title': 'Angemieteter Raum in Paderborn – ab 1. Juli 2026',
      'home.praxis.sub':
        'Ein angemieteter Atelier- und Gruppenraum an der Otto-Stadler-Straße 23c – hell, ruhig und mit Platz zum Malen und Gestalten.',
      'home.praxis.address':
        '<span class="pill">Adresse</span><br><strong>Otto-Stadler-Straße 23c</strong><br>33102 Paderborn',
      'home.praxis.di':
        '<span class="pill">Di</span><br>11:00–12:30 · Gruppen &amp; Therapie',
      'home.praxis.do':
        '<span class="pill">Do</span><br>18:00–19:30 · Auszeit, Workshops',
      'home.praxis.link':
        'Raum, Fotos &amp; Details: <a href="kunsttherapie.html#atelier">Atelier entdecken</a>',
      'home.praxis.more': 'Mehr zum Atelier',
      'home.hero.imgAlt': 'Atelier – gemeinsam malen und gestalten in Paderborn',
      'home.gallery.openPrefix': 'Bild vergrößern: ',
      'home.gallery.img1.alt': 'Materialien im Atelier – Farben, Kreiden, Pinsel',
      'home.gallery.img2.alt': 'Kunsttherapeutisches Bild – Natur und Kreativität',
      'home.gallery.img3.alt': 'Abstraktes Aquarell – Farben und Formen',
      'home.gallery.img4.alt': 'Kunsttherapie in sensiblen Settings – behutsame Begleitung',
      'home.gallery.img5.alt': 'Atelier von außen – Otto-Stadler-Straße in Paderborn',
      'home.gallery.img6.alt': 'Malen mit Pinseln – Kreativität im Sonnenlicht',

      'kt.effects.title': 'Wie Kunsttherapie wirkt',
      'kt.effects.sub': 'In wenigen Sätzen – vertiefend per Klick.',
      'kt.faq1.q': 'Warum Kunst statt nur Gespräch?',
      'kt.faq1.a':
        '<p><strong>Nur Gespräch:</strong> Gedanken und Gefühle in Worte fassen – manchmal stößt man an Grenzen.</p><p><strong>Mit Gestalten:</strong> „Ich könnte es malen, nicht in Worte ausdrücken.“ Der Prozess ist ein wesentlicher Teil der Kunsttherapie, wie auch das Werk, das entsteht – als Projektionsfläche, als Spiegel: Distanz und Nähe zugleich.</p>',
      'kt.faq2.q': 'Brauche ich Vorkenntnisse?',
      'kt.faq2.a':
        '<p>Nein – Vorkenntnisse sind nicht nötig. Entscheidend ist, dass sich das Gestalten stimmig anfühlt. <strong>Ausprobieren lohnt sich – der Überraschungseffekt gehört dazu.</strong></p>',
      'kt.faq3.q': 'Welche Materialien und Methoden gibt es?',
      'kt.faq3.a':
        '<p>Die Materialien sind sehr facettenreich: Pastellkreide, Collagen, Malen mit flüssigen Farben wie Gouache, Aquarell und Acryl, Zeichnen und Plastizieren in Ton. Regelmäßige Gruppen <strong>Dienstag 11:00–12:30</strong>, Auszeit und Workshops <strong>Donnerstag 18:00–19:30</strong>. Die Gruppenzeiten rotieren: im Wechsel auch donnerstags abends.</p>',
      'kt.faq4.q': 'Mit welchen Themen kann ich kommen?',
      'kt.faq4.a':
        '<ul><li>Raum für Trauer, die noch keinen Ausdruck gefunden hat</li><li>Hilfe bei chronischen Schmerzen</li><li>Vision Board: Vorstellungskraft, Klarheit und Struktur finden</li><li>Achtsamkeit malend – die Umwelt bewusst wahrnehmen; Meditationstechniken für innere Ruhe</li><li>Positiver Flow und Techniken erleben</li></ul>',
      'kt.faq5.q': 'Muss ich malen können?',
      'kt.faq5.a':
        '<p><strong>Nicht entscheidend:</strong> ein schönes Ergebnis oder „können“.</p><p><strong>Im Mittelpunkt:</strong> der Prozess. Jede Spur, jede Farbe ist richtig – Vorerfahrung ist nicht nötig.</p>',
      'kt.faq6.q': 'Ist Kunsttherapie das Richtige für mich?',
      'kt.faq6.a':
        '<p>Kunsttherapie kann begleiten bei Belastung, Trauer, chronischen Schmerzen oder einfach dem Wunsch nach einer kreativen Auszeit. In einem unverbindlichen Kennenlernen klären wir gemeinsam, ob es passt.</p>',
      'kt.faq7.q': 'Übernimmt die Krankenkasse die Kosten?',
      'kt.faq7.a':
        '<p>Die Angebote sind in der Regel Selbstzahler-Leistungen. Bei Fragen zu Kostenübernahme, Firmen- oder Einrichtungs-Abrechnung sprich mich gern direkt an.</p>',
      'kt.faq8.q': 'Wie läuft eine Sitzung ab?',
      'kt.faq8.a':
        '<p>Eine Sitzung dauert 90 Minuten. Nach einem kurzen Ankommen gibt es einen Impuls oder ein Thema – oder du gestaltest frei. Das Gestalten steht im Mittelpunkt, am Ende ist Raum für ein Gespräch über das, was entstanden ist. Es gibt kein Richtig oder Falsch und kein Tempo, das du halten musst.</p>',
      'kt.faq9.q': 'Was muss ich mitbringen?',
      'kt.faq9.a':
        '<p>Nur dich selbst. Die gängigen Materialien – Farben, Kreiden, Papier, Collage-Material und mehr – sind je nach Absprache vor Ort und im Preis enthalten. Kleidung, die auch mal Farbe abbekommen darf, ist sinnvoll. Wird im Einzelfall mehr benötigt, kann es zu Zusatzkosten kommen; diese klären wir vorab gemeinsam im Vorgespräch.</p>',
      'kt.faq10.q': 'Ist Kunsttherapie vertraulich?',
      'kt.faq10.a':
        '<p>Ja. Alles, was in den Sitzungen besprochen und gestaltet wird, bleibt vertraulich. Deine Werke gehören dir – sie werden nur mit deiner ausdrücklichen Einwilligung gezeigt oder verwendet.</p>',
      'kt.faq11.q': 'Einzeln oder lieber in der Gruppe?',
      'kt.faq11.a':
        '<p><strong>Gruppe (4–12 Personen):</strong> gemeinsames Erleben, gegenseitige Inspiration, geschützter Rahmen.</p><p><strong>Einzel:</strong> intensiver und ganz auf dein Thema abgestimmt.</p><p>Im Kennenlernen finden wir heraus, was zu dir passt.</p>',
      'kt.faq12.q': 'Ersetzt Kunsttherapie eine Psychotherapie?',
      'kt.faq12.a':
        '<p><strong>Psychotherapie</strong> ist medizinische Behandlung bei entsprechenden Indikationen.</p><p><strong>Kunsttherapie</strong> ist eigenständige, ressourcenorientierte Begleitung und kann sehr entlastend wirken – ersetzt jedoch keine ärztliche oder psychotherapeutische Behandlung.</p><p>Bei akuten oder schweren Beschwerden bitte zusätzlich eine Ärztin oder einen Arzt aufsuchen; gern bespreche ich mit dir, wie sich beides ergänzen kann.</p>',
      'kt.praxis.kicker': 'Das Atelier',
      'kt.praxis.title': 'Angemieteter Atelier- und Gruppenraum',
      'kt.praxis.sub':
        'Ab <strong>1. Juli 2026</strong> in Paderborn – ein eigener Raum zum Ankommen, Gestalten und Begegnen. Die Räumlichkeiten werden laufend eingerichtet und hier Schritt für Schritt vorgestellt.',
      'kt.praxis.photoNote': 'Einblicke aus dem Raum – weitere Fotos und Einrichtungsdetails folgen in Kürze.',
      'kt.praxis.headline': 'Ankommen und gestalten in Paderborn',
      'kt.praxis.p1':
        'Der Raum hat eine schöne Atmosphäre, etwas im Grünen mit Terrasse, und hält alles bereit, um sich schnell geborgen und wohl zu fühlen. Platz zum Malen, für Gespräche dazwischen – <strong>Dienstag 11:00–12:30</strong> für Gruppen, <strong>Donnerstag 18:00–19:30</strong> für Auszeit und Workshops. Die Gruppenzeiten rotieren: im Wechsel auch donnerstags abends.',
      'kt.praxis.p2':
        '<strong>Im Atelier:</strong> helle, ruhige Atmosphäre, Materialien vor Ort, kleine Gruppen, klare Struktur ohne Leistungsdruck. Parken und Anreise mit ÖPNV sind unkompliziert – Details zur Anfahrt siehe unten.',
      'kt.praxis.schedule1': '<strong>Dienstag 11:00–12:30</strong> · Gruppentherapie, professionelles Setting',
      'kt.praxis.schedule2': '<strong>Donnerstag 18:00–19:30</strong> · Auszeit, Workshops, Teambuilding',
      'kt.praxis.book': 'Online-Termin wählen',
      'kt.praxis.news': 'Neuigkeiten zum Atelier',
      'kt.highlight1.title': 'Atelierfläche',
      'kt.highlight1.text': 'Gemeinsames Gestalten mit Acryl, Gouache, Pastellkreide, Collage – Materialien werden gestellt.',
      'kt.highlight2.title': 'Gruppenraum',
      'kt.highlight2.text': '4–12 Personen, geschützter Rahmen, auch für Seniorengruppen und Einrichtungen.',
      'kt.highlight3.title': 'Angemietet & wachsend',
      'kt.highlight3.text':
        'Der Raum wird weiter ausgebaut und auf der Website präsentiert – auf dem Laufenden bleiben.',
      'kt.highlight4.title': 'Ab Juli 2026',
      'kt.highlight4.text':
        'Regelmäßig <strong>Dienstag 11:00–12:30</strong> und <strong>Donnerstag 18:00–19:30</strong> – Gruppenzeiten rotieren, im Wechsel auch donnerstags abends. Termine online oder per Anfrage.',
      'kt.location.title': 'Anfahrt & Kontakt vor Ort',
      'kt.location.address': '<strong>Otto-Stadler-Straße 23c</strong><br>33102 Paderborn',
      'kt.location.phone':
        'Tel. <a href="tel:+495251690111">05251-690111</a> · Mobil <a href="tel:+491704790790">0170-4790790</a>',
      'kt.cta.title': 'Bereit für den ersten Schritt?',
      'kt.cta.sub': 'Termin online buchen oder kurz anfragen – ich melde mich zeitnah.',
      'kt.cta.book': 'Zum Buchungskalender',
      'kt.cta.about': 'Über mich',
      'kt.cta.news': 'Mehr Einblicke: <a href="neuigkeiten.html">Aktuelles &amp; Neuigkeiten</a>',
      'kt.praxis.imgAlt': 'Atelier – gemeinsam malen und gestalten',
      'kt.raum.tab.eingang': 'Eingang',
      'kt.raum.tab.innen': 'Atelier innen',
      'kt.raum.tab.gestalten': 'Gestalten',
      'kt.raum.compare.before': 'Aktuelles Foto',
      'kt.raum.compare.after': 'Stimmungsvision',
      'kt.raum.compare.hint':
        'Regler ziehen: links das Foto vom Eingang, rechts die Stimmungsvision · Punkte antippen für Details · Bild antippen zum Vergrößern',
      'kt.raum.innen.hint': 'Klick auf die Punkte für mehr · Bild antippen zum Vergrößern',
      'kt.raum.gestalten.hint': 'Kreativität ohne Leistungsdruck – ein Blick auf das, was im Atelier entsteht.',
      'kt.raum.hotspot1.title': 'Willkommen',
      'kt.raum.hotspot1.text': 'Barrierefreier Zugang über die Rampe – direkt ins Atelier.',
      'kt.raum.hotspot2.title': 'Licht & Grün',
      'kt.raum.hotspot2.text': 'Glasfassade mit Blick ins Grüne – ruhiger Rahmen zum Ankommen.',
      'kt.raum.hotspot3.title': 'Gruppenraum',
      'kt.raum.hotspot3.text': '4–12 Personen, Materialien vor Ort, geschützter Rahmen.',
      'kt.raum.hotspot4.title': 'Materialien',
      'kt.raum.hotspot4.text': 'Acryl, Gouache, Kreide, Collage – alles bereitgestellt.',

      'about.kicker': 'Über mich',
      'about.name': 'Martina Schwierzke',
      'about.intro':
        'Als psychosoziale und klinische Kunsttherapeutin und Heilpraktikerin für Psychotherapie arbeite ich selbstständig. Mit über 16 Jahren Erfahrung begleite ich Menschen in schwierigen Situationen – im klinischen Kontext und im eigenen Atelier.',
      'about.passion.title': 'Meine Leidenschaft',
      'about.passion.p1':
        'Ich bin seit vielen Jahren in der Palliativversorgung und Psychoonkologie tätig und leite kunsttherapeutische Gruppen im klinischen Umfeld. Regelmäßige Weiterbildungen und Supervisionen sind für mich selbstverständlich.',
      'about.passion.p2':
        'Kunst ist für mich ein existenzieller Freiraum. Natur ist eine wesentliche Inspirations- und Kraftquelle.',
      'about.quote': '„Weil ich weiß, dass Zeit endlich ist, lebe ich lieber jetzt.“',
      'about.qual.title': 'Qualifikationen',
      'about.qual.list':
        '<ul style="color:var(--muted); line-height:1.8"><li>Psychosoziale Kunsttherapeutin (2006–2009, anerkanntes Institut)</li><li>Klinische Kunsttherapeutin (2010)</li><li>Heilpraktikerin für Psychotherapie (2011)</li><li>Gestalterin für visuelles Marketing, IHK (2007)</li></ul>',
      'about.offers': 'Kunsttherapie & Angebote',
      'about.imgAlt': 'Kunsttherapeutin in Paderborn',

      'book.kicker': 'Terminbuchung',
      'book.title': 'Kennenlernen oder Sitzung buchen',
      'book.sub':
        'Nur <strong>Dienstag 11:00–12:30</strong> und <strong>Donnerstag 18:00–19:30</strong> sind buchbar (grüne Tage). Die Anfrage wird per E-Mail bestätigt. Danach lässt sich der Termin in Apple- oder Google-Kalender speichern.',
      'book.introNote':
        'Unsicher, ob Kunsttherapie das Richtige ist? Ein kurzes, unverbindliches Kennenlernen klärt offene Fragen – einfach anfragen.',
      'book.prevMonth': 'Vorheriger Monat',
      'book.nextMonth': 'Nächster Monat',
      'book.legend':
        '<span class="legend-dot legend-free"></span> Frei (Di / Do) <span class="legend-dot legend-busy"></span> Ausgebucht <span class="legend-dot legend-off"></span> Kein Ateliertag',
      'book.weekdays':
        '<span>Mo</span><span>Di</span><span>Mi</span><span>Do</span><span>Fr</span><span>Sa</span><span>So</span>',
      'book.calendarAria': 'Kalender',
      'book.pickDay': 'Bitte einen Tag wählen',
      'book.slotsHint':
        'Nur <strong>Dienstag 11:00–12:30</strong> und <strong>Donnerstag 18:00–19:30</strong> – Termine à 90 Minuten.',
      'book.slotsHintDynamic':
        'Buchbar: {schedule} (je {minutes} Minuten). <strong>Nur grüne Tage</strong> im Kalender anklicken.',
      'book.scheduleSlot.2': 'Dienstag Vormittag',
      'book.scheduleSlot.4': 'Donnerstag Abend',
      'book.timeOfDay.morning': 'Vormittag',
      'book.timeOfDay.evening': 'Abend',
      'book.formTitle': 'Angaben',
      'book.messagePlaceholder':
        'z.B. Erstgespräch, Gruppe Dienstag morgens, Auszeit Donnerstag abends …',
      'book.privacyNote':
        'Mit der Buchung werden Name, E-Mail und Termindaten auf unserem Server gespeichert (siehe <a href="datenschutz.html">Datenschutz</a>). Kein Marketing-Tracking.',
      'book.submit': 'Termin anfragen',
      'book.loading': 'Kalender wird geladen …',
      'book.hintFree':
        'Wähle einen grünen Tag (Dienstag oder Donnerstag), dann eine freie Uhrzeit. Google Kalender ist optional – die Buchung läuft über unsere Website.',
      'book.hintNone':
        'In diesem Monat sind keine freien Termine mehr sichtbar – bitte den nächsten Monat wählen (nur Di vormittags & Do abends).',
      'book.statusError': 'Kalender konnte nicht geladen werden. Bitte später erneut versuchen.',
      'book.noSlotsDay':
        'An diesem Tag gibt es keine Termine (nur Dienstag vormittags & Donnerstag abends).',
      'book.noSlots': 'Keine Slots an diesem Tag.',
      'book.allBusy':
        'An diesem Tag sind alle Zeiten belegt oder liegen zu nah in der Zukunft (mind. 24&nbsp;Std. Vorlauf). Bitte einen anderen Tag wählen.',
      'book.loadingSlots': 'Zeiten werden geladen …',
      'book.slotsError': 'Zeiten konnten nicht geladen werden.',
      'book.dayNoOffer': 'Kein Angebot',
      'book.dayOff': 'Kein Ateliertag (nur Di & Do)',
      'book.dayFree': 'Freie Termine – klicken',
      'book.dayBusy': 'Ausgebucht oder Vorlauf – trotzdem Zeiten anzeigen',
      'book.confirmedNote':
        'Eine Bestätigung wurde an die angegebene E-Mail-Adresse gesendet (mit Kalender-Anhang).',
      'book.saveCalendar': 'Speichere den Termin direkt in dem Kalender:',
      'book.googleCal': 'Google Kalender',
      'book.icsCal': 'In Apple / Outlook (.ics)',
      'book.success': 'Anfrage eingegangen. Vielen Dank!',
      'book.error': 'Buchung fehlgeschlagen',
      'book.slotBusy': ' (belegt)',
      'book.timeUnit': ' Uhr',

      'contact.kicker': 'Kontakt',
      'contact.title': 'Fragen, Anfragen & Termine',
      'contact.sub':
        'Für einen festen Termin nutze die <a href="buchung.html">Online-Buchung</a>. Für alles andere: kurz schreiben oder anrufen.',
      'contact.reach.title': 'Erreichbarkeit',
      'contact.reach.list':
        '<li><strong>Adresse</strong><br>Otto-Stadler-Straße 23c<br>33102 Paderborn</li><li><strong>Telefon</strong><br><a href="tel:+495251690111">05251-690111</a></li><li><strong>Mobil</strong><br><a href="tel:+491704790790">0170-4790790</a></li><li><strong>E-Mail</strong><br><a href="#" class="js-email" data-u="info" data-d="kunsttherapie-pb.de">E-Mail schreiben</a></li>',
      'contact.hours': 'Atelier ab 1. Juli 2026 · Di 11:00–12:30 · Do 18:00–19:30',
      'contact.book': 'Online-Termin buchen',
      'contact.offers': 'Angebote',
      'contact.form.title': 'Nachricht senden',
      'contact.form.messageLabel': 'Nachricht *',
      'contact.messagePlaceholder': 'Worum geht es? z. B. Gruppe, Auszeit, Teambuilding …',
      'contact.privacyNote':
        'Angaben werden nur zur Bearbeitung der Anfrage genutzt (<a href="datenschutz.html">Datenschutz</a>).',
      'contact.submit': 'Nachricht senden',
      'contact.map.title': 'Anfahrt',
      'contact.mapIframeTitle': 'Karte Atelier Otto-Stadler-Straße 23c Paderborn',
      'ui.scrollTop': 'Nach oben scrollen',
      'ui.lightbox.title': 'Vergrößertes Bild',
      'ui.lightbox.prev': 'Vorheriges Bild',
      'ui.lightbox.next': 'Nächstes Bild',
      'ui.lightbox.thumbs': 'Galerie-Vorschau',
      'contact.msg.success': 'Vielen Dank – die Nachricht ist angekommen. Ich melde mich zeitnah.',
      'contact.msg.error': 'Nachricht konnte nicht gesendet werden',
      'ui.scrollTop': 'Nach oben scrollen',
      'ui.lightbox.title': 'Vergrößertes Bild',
      'ui.lightbox.prev': 'Vorheriges Bild',
      'ui.lightbox.next': 'Nächstes Bild',
      'ui.lightbox.thumbs': 'Galerie-Vorschau',

      'prices.kicker': 'Preise',
      'prices.title': 'Transparent & fair',
      'prices.sub': 'Materialien sind inklusive. Einzelsitzungen sind möglich – bitte direkt anfragen.',
      'prices.tableHead':
        '<tr><th scope="col">Leistung</th><th scope="col">Dauer</th><th scope="col">Preis</th><th scope="col">Hinweis</th></tr>',
      'prices.tableBody':
        '<tr><td>Gruppensitzung</td><td data-label="Dauer">90 Minuten</td><td data-label="Preis"><strong>ab 55 €</strong><span class="price-per">pro Person</span></td><td data-label="Hinweis">4–12 Personen, Material inkl.</td></tr><tr><td>Gruppenprogramm (typisch)</td><td data-label="Dauer">4 Einheiten</td><td data-label="Preis">auf Anfrage</td><td data-label="Hinweis">je nach Thema/Setting</td></tr><tr><td>Einzelsitzung</td><td data-label="Dauer">90 Minuten</td><td data-label="Preis">auf Anfrage</td><td data-label="Hinweis">individuelle Begleitung</td></tr><tr><td>Teambuilding Event</td><td data-label="Dauer">nach Bedarf</td><td data-label="Preis">auf Anfrage</td><td data-label="Hinweis">inkl. Konzept &amp; Material</td></tr>',
      'prices.unit': 'Alle Preise verstehen sich pro Person und Sitzung.',
      'prices.note':
        'Fragen zu Preisen oder Rabatten? Schreib mir gern – jede Situation ist individuell.',
      'prices.ask': 'Preis anfragen',

      'newsPage.kicker': 'Updates & News',
      'newsPage.title': 'Was ist neu?',
      'newsPage.sub':
        'Aktuelle Neuigkeiten, Termine und Ankündigungen. Verpasse keine wichtigen Updates!',
      'newsPage.loading': 'Laden …',
      'newsPage.empty': 'Noch keine Neuigkeiten vorhanden.',
      'newsPage.error':
        'Aktuelles konnte gerade nicht geladen werden. Bitte später erneut versuchen.',

      'eventsPage.kicker': 'Termine',
      'eventsPage.title': 'Events & Workshops',
      'eventsPage.sub':
        'Kommende Events, Workshops und Gruppentherapien. Anmeldung per Kontakt und sei dabei!',
      'eventsPage.loading': 'Termine werden geladen …',
      'eventsPage.empty': 'Momentan sind keine Events geplant.',
      'eventsPage.emptyHint':
        'Schreib mir gern über das Kontaktformular, wenn du Interesse an einem Workshop hast.',
      'eventsPage.signUp': 'Anmelden',
      'eventsPage.cardDate': 'Termin',
      'eventsPage.metaTime': 'Uhrzeit: {value}',
      'eventsPage.metaLocation': 'Ort: {value}',
      'eventsPage.metaCapacity': '{value} Plätze',
      'eventsPage.error':
        'Termine konnten gerade nicht geladen werden. Bitte später erneut versuchen.',

      'map.consent':
        'Die Karte wird nur mit Einwilligung geladen (Google Maps, siehe <a href="datenschutz.html">Datenschutz</a>).',
      'map.show': 'Karte anzeigen',
      'map.open': 'In Google Maps öffnen',
      'map.route': 'Route in Google Maps öffnen',

      'legal.imprint.body': `<h1>Impressum</h1>
<p class="sub">Angaben gemäß § 5 TMG – Stand: Juni 2026</p>
<hr class="sep"/>
<h2>Verantwortliche Person</h2>
<p>
  <strong>Martina Schwierzke</strong><br/>
  Konrad-Martin-Straße 11c<br/>
  33102 Paderborn<br/>
  Deutschland
</p>
<h2>Atelier-Adresse</h2>
<p>
  Psychosoziale Kunsttherapie Paderborn<br/>
  Otto-Stadler-Straße 23c<br/>
  33102 Paderborn
</p>
<h2>Kontakt</h2>
<p>
  Telefon: <a href="tel:+495251690111">05251-690111</a><br/>
  Mobil: <a href="tel:+491704790790">0170-4790790</a><br/>
  E-Mail: <a href="#" class="js-email" data-u="info" data-d="kunsttherapie-pb.de">E-Mail schreiben</a>
</p>
<h2>Berufsbezeichnung &amp; Kammer</h2>
<p>
  Heilpraktikerin für Psychotherapie (amtlich anerkannt)<br/>
  Kunsttherapeutin (DGKT)<br/>
  Registriert: Künstlersozialkasse (KSK)
</p>
<h2>Haftungsausschluss</h2>
<p>
  Die Inhalte dieser Website wurden mit größter Sorgfalt zusammengestellt. Für die Richtigkeit, Vollständigkeit und Aktualität
  der Inhalte wird jedoch keine Gewähr übernommen. Die Kunsttherapie ersetzt keine ärztliche oder psychologische Fachbehandlung,
  sondern wird als komplementärer Ansatz verstanden.
</p>
<h2>Urheberrecht</h2>
<p>
  © 2026 Kunsttherapie Paderborn. Alle Inhalte, Texte und Bilder sind urheberrechtlich geschützt.
</p>
<div class="actions">
  <a class="btn" href="index.html">Zurück zur Startseite</a>
</div>`,

      'legal.privacy.body': `<h1>Datenschutzerklärung</h1>
<p class="sub">Transparente Information nach DSGVO – Stand: Mai 2026</p>
<hr class="sep"/>
<h2>1. Verantwortliche Stelle</h2>
<p>
  Martina Schwierzke<br>
  Psychosoziale Kunsttherapie Paderborn<br>
  Otto-Stadler-Straße 23c, 33102 Paderborn<br>
  E-Mail: <a href="#" class="js-email" data-u="info" data-d="kunsttherapie-pb.de">E-Mail schreiben</a><br>
  Telefon: 05251-690111
</p>
<h2>2. Kurzüberblick</h2>
<p>
  Diese Website setzt <strong>kein Besucher-Tracking</strong> (kein Google Analytics, keine Werbe-Pixel) ein.
  Wir speichern keine Marketing-Profile. Daten werden nur übermittelt bei aktiver Mitteilung
  (z.&nbsp;B. Terminbuchung oder E-Mail) oder nach Zustimmung zu optionalen Diensten wie Google Maps.
</p>
<h2>3. Hosting</h2>
<p>
  Die Website wird bei einem europäischen Hosting-Anbieter (z.&nbsp;B. Hostinger) betrieben.
  Dabei fallen technisch Server-Logdaten an (z.&nbsp;B. IP-Adresse, Zeitpunkt, aufgerufene Seite) –
  zur Absicherung und Bereitstellung der Website. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO
  (berechtigtes Interesse an einem sicheren Betrieb).
</p>
<h2>4. Terminbuchung</h2>
<p>
  Bei einer Online-Terminbuchung speichern wir die eingegebenen Daten
  (Name, E-Mail, optional Telefon und Nachricht, gewählter Termin) in einer Datenbank auf unserem Server,
  um den Termin zu verwalten und zur Kontaktaufnahme.
</p>
<p>
  Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (vorvertragliche Maßnahmen / Vertrag) bzw. lit. f
  (organisatorisches Interesse an der Terminverwaltung). Die Daten werden gelöscht, sobald sie
  für den Zweck nicht mehr erforderlich sind, sofern keine gesetzlichen Aufbewahrungspflichten entgegenstehen.
</p>
<p>
  <strong>Google Kalender:</strong> Termine können – nach technischer Einrichtung durch das Atelier –
  mit dem Google-Kalender des Ateliers synchronisiert werden. Das betrifft die interne
  Atelierorganisation; Besucher der Website laden dabei keinen Google-Kalender auf ihrem Gerät.
  Anbieter: Google Ireland Limited / Google LLC (USA). Bei Übermittlung in die USA können
  Standardvertragsklauseln der EU greifen. Details: <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google Datenschutz</a>.
</p>
<h2>5. Neuigkeiten auf der Website</h2>
<p>
  Veröffentlichte Neuigkeiten werden vom Server ausgeliefert. Ein Hinweis-Fenster auf der Startseite merkt sich
  lokal im Browser (localStorage), welche Meldung zuletzt gesehen wurde – ohne Tracking und ohne Cookies
  zu Werbezwecken.
</p>
<h2>6. Cookies & lokale Speicherung</h2>
<p>
  <strong>Notwendig (ohne Marketing):</strong> Wir speichern die Auswahl im Cookie-Banner
  (localStorage-Schlüssel <code>kunsttherapie_consent_v1</code>) sowie optional, ob der
  Neuigkeiten-Hinweis bereits gesehen wurde.
  Über „Barrierefreiheit“ (unten links oder im Footer) sind Darstellungseinstellungen möglich;
  diese werden nur lokal gespeichert (<code>kunsttherapie-a11y</code>, ohne Tracking).
</p>
<p>
  <strong>Optional – nur mit Einwilligung:</strong>
</p>
<ul>
  <li><strong>Google Maps</strong> (Karten auf Kontakt- und Angebotsseiten): kann IP-Adresse und Nutzungsdaten an Google übertragen.</li>
  <li><strong>Google Fonts</strong> (Schriftarten): beim Laden können Daten an Google übermittelt werden.</li>
</ul>
<p>
  Die Einwilligung lässt sich jederzeit über „Cookie-Einstellungen“ im Footer widerrufen oder anpassen.
  Rechtsgrundlage für optionale Dienste: Art. 6 Abs. 1 lit. a DSGVO.
</p>
<h2>7. Admin-Bereich</h2>
<p>
  Der geschützte Bereich <code>/admin</code> ist nur für autorisierte Nutzer des Ateliers bestimmt.
  Dort wird eine technisch notwendige Session (Login-Cookie) verwendet. Besucher der öffentlichen
  Website erhalten dieses Cookie nicht.
</p>
<h2>8. Kontakt per E-Mail oder Telefon</h2>
<p>
  Bei Kontakt per E-Mail oder Telefon werden die mitgeteilten Daten verarbeitet
  zur Bearbeitung der Anfrage (Art. 6 Abs. 1 lit. b oder lit. f DSGVO).
</p>
<h2>9. Betroffenenrechte</h2>
<p>
  Es besteht das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung,
  Datenübertragbarkeit und Widerspruch. Bei erteilter Einwilligung ist jederzeit widerrufbar.
</p>
<p>
  Beschwerderecht bei einer Datenschutz-Aufsichtsbehörde, z.&nbsp;B. die LDI NRW.
</p>
<h2>10. Änderungen</h2>
<p>
  Wir passen diese Erklärung an, wenn sich die Website oder Rechtslage ändert.
</p>
<div class="actions">
  <button type="button" class="btn outline" onclick="openCookieSettings()">Cookie-Einstellungen</button>
  <a class="btn" href="index.html">Zur Startseite</a>
</div>`,

      'consent.banner.title': 'Datenschutz & Cookies',
      'consent.lead':
        'Wir setzen <strong>kein Tracking</strong> ein und verkaufen keine Daten. Gespeichert werden nur das, was aktiv mitgeteilt wird (z.&nbsp;B. Terminbuchung) sowie technische Einstellungen im Browser.',
      'consent.list':
        '<li><strong>Notwendig:</strong> Cookie-Einstellungen, Hinweis zu Neuigkeiten (lokal im Browser)</li><li><strong>Optional:</strong> Google Maps &amp; Google Fonts (Datenübertragung in die USA möglich)</li>',
      'consent.note':
        'Terminbuchungen werden auf unserem Server gespeichert und können mit dem <strong>Google Kalender des Ateliers</strong> synchronisiert werden (nicht im Browser). <a href="/datenschutz">Datenschutzerklärung</a>',
      'consent.acceptAll': 'Alle akzeptieren',
      'consent.essential': 'Nur notwendige',
      'consent.settings': 'Einstellungen',
      'consent.settingsTitle': 'Cookie-Einstellungen',
      'consent.necessary': 'Notwendig',
      'consent.necessaryNote':
        'Speichert die Auswahl und ob der Neuigkeiten-Hinweis schon gesehen hast. Ohne Tracking.',
      'consent.external': 'Externe Medien (Google)',
      'consent.externalNote':
        'Google Maps auf Kontakt- und Angebotsseiten sowie Schriftarten von Google Fonts.',
      'consent.save': 'Auswahl speichern',
      'consent.legalLinks':
        '<a href="/datenschutz">Datenschutzerklärung</a> · <a href="/impressum">Impressum</a>',
      'consent.footerLink': 'Cookie-Einstellungen',

      'a11y.toggle': 'Barrierefreiheit-Einstellungen öffnen',
      'a11y.title': 'Barrierefreiheit',
      'a11y.intro':
        'Darstellung anpassen – Einstellungen für Bedürfnisse. Einstellungen werden auf diesem Gerät gespeichert.',
      'a11y.fontSize': 'Schriftgröße',
      'a11y.font.normal': 'Standard',
      'a11y.font.large': 'Größer',
      'a11y.font.xlarge': 'Sehr groß',
      'a11y.contrast': 'Kontrast',
      'a11y.contrast.default': 'Standard',
      'a11y.contrast.high': 'Hoher Kontrast',
      'a11y.motion': 'Bewegung',
      'a11y.motion.default': 'Standard',
      'a11y.motion.reduce': 'Reduziert',
      'a11y.links': 'Links',
      'a11y.links.default': 'Standard',
      'a11y.links.underline': 'Immer unterstrichen',
      'a11y.spacing': 'Lesbarkeit',
      'a11y.spacing.default': 'Standard',
      'a11y.spacing.readable': 'Mehr Zeilenabstand',
      'a11y.focus': 'Tastatur-Fokus',
      'a11y.focus.default': 'Standard',
      'a11y.focus.strong': 'Deutlicher Fokusrahmen',
      'a11y.reset': 'Zurücksetzen',
      'a11y.announce.set': 'Einstellung übernommen.',
      'a11y.announce.reset': 'Alle Einstellungen zurückgesetzt.',
      'a11y.footerBtn': 'Barrierefreiheit',
    },
    en: {
      'nav.aria': 'Main navigation',
      'nav.menu': 'Menu',
      'nav.events': 'Events',
      'btn.inquiry': 'Send inquiry',
      'btn.contact': 'Get in touch',
      'btn.message': 'Send message',
      'form.phone': 'Phone (optional)',

      'meta.home.title': 'Art Therapy Paderborn | Psychosocial Art Therapy & Studio',
      'meta.home.description':
        'Art therapy in Paderborn: Tuesday mornings and Thursday evenings. Groups, downtime, one-to-one, team building – book online.',
      'meta.therapy.title': 'Art Therapy & Services – Paderborn',
      'meta.therapy.description':
        'Groups Tuesday mornings, downtime Thursday evenings, team building and one-to-one sessions. Studio at Otto-Stadler-Straße 23c, Paderborn.',
      'meta.about.title': 'About me – Art Therapist Paderborn',
      'meta.about.description':
        'I am a psychosocial and clinical art therapist with over 16 years of experience – palliative care, psycho-oncology, and my own atelier in Paderborn.',
      'meta.booking.title': 'Book appointment – Art Therapy Paderborn',
      'meta.booking.description':
        'Request an appointment online: Tuesday mornings and Thursday evenings. Available slots in the calendar – confirmation by email.',
      'meta.contact.title': 'Contact – Art Therapy Paderborn',
      'meta.contact.description':
        'Send a message, call, or find directions to the atelier at Otto-Stadler-Straße 23c, Paderborn.',
      'meta.prices.title': 'Prices – Art Therapy Paderborn',
      'meta.prices.description':
        'Transparent pricing for group sessions from €55, programmes and one-to-one sessions on request.',
      'meta.news.title': 'News – Art Therapy Paderborn',
      'meta.news.description': 'Updates from the atelier: appointments, studio news, and announcements.',
      'meta.events.title': 'Events – Art Therapy Paderborn',
      'meta.events.description': 'Workshops, team building, and events in Paderborn.',
      'meta.atelier.title': 'Mini Studio – Art Therapy Paderborn',
      'meta.atelier.description':
        'Try the mini studio: painting, drawing, and collage – optionally send artwork to the atelier anonymously.',
      'meta.imprint.title': 'Imprint – Art Therapy Paderborn',
      'meta.imprint.description': 'Legal imprint for the Art Therapy Paderborn website.',
      'meta.privacy.title': 'Privacy – Art Therapy Paderborn',
      'meta.privacy.description': 'Privacy policy for the Art Therapy Paderborn website.',

      'home.popup.title': 'News from the atelier',
      'home.news.kicker': 'Updates',
      'home.news.sub': 'What is coming up – straight from the atelier.',
      'home.news.loading': 'Loading news …',
      'home.news.show': 'Show updates',
      'home.news.all': 'All news',
      'home.gallery.kicker': 'Insights',
      'home.gallery.sub':
        'Creativity without pressure to perform – a glimpse into studio life. Click an image to enlarge.',
      'home.services.kicker': 'Services',
      'home.praxis.title': 'Rented studio space in Paderborn – from 1 July',
      'home.praxis.sub':
        'A rented studio and group space on Otto-Stadler-Straße 23c – bright, calm, and with room to paint and create.',
      'home.praxis.address':
        '<span class="pill">Address</span><br><strong>Otto-Stadler-Straße 23c</strong><br>33102 Paderborn',
      'home.praxis.di':
        '<span class="pill">Tue</span><br>11:00–12:30 · Groups &amp; therapy',
      'home.praxis.do':
        '<span class="pill">Thu</span><br>18:00–19:30 · Downtime, workshops',
      'home.praxis.link':
        'Space, photos &amp; details: <a href="kunsttherapie.html#atelier">Explore the atelier</a>',
      'home.praxis.more': 'More about the atelier',
      'home.hero.imgAlt': 'Atelier – painting and creating together in Paderborn',
      'home.gallery.openPrefix': 'Enlarge image: ',
      'home.gallery.img1.alt': 'Studio materials – paints, chalks, brushes',
      'home.gallery.img2.alt': 'Art therapy image – nature and creativity',
      'home.gallery.img3.alt': 'Abstract watercolour – colours and shapes',
      'home.gallery.img4.alt': 'Art therapy in sensitive settings – gentle support',
      'home.gallery.img5.alt': 'Atelier exterior – Otto-Stadler-Straße in Paderborn',
      'home.gallery.img6.alt': 'Painting with brushes – creativity in sunlight',

      'kt.effects.title': 'How art therapy works',
      'kt.effects.sub': 'In a few sentences – click for more detail.',
      'kt.faq1.q': 'Why art instead of talk alone?',
      'kt.faq1.a':
        '<p><strong>Talk alone:</strong> putting thoughts and feelings into words – sometimes you hit a limit.</p><p><strong>With creating:</strong> “I could paint it, but not put it into words.” The process is essential in art therapy, as is the artwork that emerges – as a projection surface, as a mirror: distance and closeness at once.</p>',
      'kt.faq2.q': 'Do I need prior experience?',
      'kt.faq2.a':
        '<p>No prior experience needed. What matters is that creating feels right. <strong>Curiosity welcome – surprise is part of the process.</strong></p>',
      'kt.faq3.q': 'What materials and methods are available?',
      'kt.faq3.a':
        '<p>Materials are richly varied: pastel chalk, collage, painting with gouache, watercolour, and acrylic, drawing and clay work. Regular groups <strong>Tuesday 11:00–12:30</strong>, downtime and workshops <strong>Thursday 18:00–19:30</strong>. Group times rotate: on alternate weeks also on Thursday evenings.</p>',
      'kt.faq4.q': 'What themes can I bring?',
      'kt.faq4.a':
        '<ul><li>Space for grief that has not yet found expression</li><li>Support with chronic pain</li><li>Vision board: imagination, clarity, and structure</li><li>Mindful painting – perceiving the environment consciously; meditation techniques for inner calm</li><li>Positive flow and creative techniques</li></ul>',
      'kt.faq5.q': 'Do I need to be good at painting?',
      'kt.faq5.a':
        '<p><strong>Not what matters:</strong> skill or a pretty result.</p><p><strong>What matters:</strong> the process. Every mark, every colour is valid – no prior experience needed.</p>',
      'kt.faq6.q': 'Is art therapy right for me?',
      'kt.faq6.a':
        '<p>Art therapy can support you through stress, grief, chronic pain, or simply the wish for a creative break. In a no-obligation intro chat we find out together whether it\'s a fit.</p>',
      'kt.faq7.q': 'Does health insurance cover the cost?',
      'kt.faq7.a':
        '<p>Sessions are generally self-pay. For questions about reimbursement or invoicing for companies and institutions, please get in touch directly.</p>',
      'kt.faq8.q': 'What does a session look like?',
      'kt.faq8.a':
        '<p>A session lasts 90 minutes. After a short arrival, there\'s a prompt or theme – or you create freely. Creating is at the centre, and at the end there\'s space to talk about what emerged. There\'s no right or wrong and no pace you have to keep.</p>',
      'kt.faq9.q': 'What do I need to bring?',
      'kt.faq9.a':
        '<p>Just yourself. The usual materials – paints, chalks, paper, collage supplies and more – are provided on site and included in the price, depending on what we agree in advance. Clothes that can handle a bit of paint are a good idea. If more is needed in individual cases, there may be additional costs; we clarify these together in advance during the intro conversation.</p>',
      'kt.faq10.q': 'Is art therapy confidential?',
      'kt.faq10.a':
        '<p>Yes. Everything discussed and created in sessions stays confidential. Your artwork belongs to you – it is only shown or used with your explicit consent.</p>',
      'kt.faq11.q': 'One-to-one or in a group?',
      'kt.faq11.a':
        '<p><strong>Group (4–12 people):</strong> shared experience, mutual inspiration, a safe setting.</p><p><strong>One-to-one:</strong> more intensive and fully focused on your theme.</p><p>In an intro chat we find out what suits you.</p>',
      'kt.faq12.q': 'Does art therapy replace psychotherapy?',
      'kt.faq12.a':
        '<p><strong>Psychotherapy</strong> is medical treatment for defined indications.</p><p><strong>Art therapy</strong> is independent, resource-oriented support and can be a real relief – but it does not replace medical or psychotherapeutic treatment.</p><p>For acute or serious symptoms, please also consult a doctor – I\'m happy to discuss how the two can complement each other.</p>',
      'kt.praxis.kicker': 'The atelier',
      'kt.praxis.title': 'Rented art therapy and group room',
      'kt.praxis.sub':
        'From <strong>1 July 2026</strong> in Paderborn – a dedicated space to arrive, create, and connect. The rooms are being set up and introduced here step by step.',
      'kt.praxis.photoNote': 'A first look inside – more photos and setup details coming soon.',
      'kt.praxis.headline': 'A place to arrive and create in Paderborn',
      'kt.praxis.p1':
        'The space has a welcoming atmosphere, a touch of green with a terrace, and everything needed to feel at home quickly. Room to paint and talk in between – <strong>Tuesday 11:00–12:30</strong> for groups, <strong>Thursday 18:00–19:30</strong> for downtime and workshops. Group times rotate: on alternate weeks also on Thursday evenings.',
      'kt.praxis.p2':
        '<strong>What to expect:</strong> a bright, calm atmosphere, materials on site, small groups, clear structure without pressure to perform. Parking and public transport are straightforward – directions below.',
      'kt.praxis.schedule1': '<strong>Tuesday 11:00–12:30</strong> · Group therapy, professional setting',
      'kt.praxis.schedule2': '<strong>Thursday 18:00–19:30</strong> · Downtime, workshops, team building',
      'kt.praxis.book': 'Choose appointment online',
      'kt.praxis.news': 'Atelier news',
      'kt.highlight1.title': 'Studio area',
      'kt.highlight1.text': 'Shared creating with acrylic, gouache, pastel chalk, collage – materials provided.',
      'kt.highlight2.title': 'Group room',
      'kt.highlight2.text': '4–12 people, safe setting, also for senior groups and institutions.',
      'kt.highlight3.title': 'Rented & evolving',
      'kt.highlight3.text':
        'The space is being developed further and shown on the website – stay tuned for updates.',
      'kt.highlight4.title': 'From July 2026',
      'kt.highlight4.text':
        'Regularly <strong>Tuesday 11:00–12:30</strong> and <strong>Thursday 18:00–19:30</strong> – group times rotate, on alternate weeks also Thursday evenings. Book online or enquire.',
      'kt.location.title': 'Directions & contact on site',
      'kt.location.address': '<strong>Otto-Stadler-Straße 23c</strong><br>33102 Paderborn',
      'kt.location.phone':
        'Tel. <a href="tel:+495251690111">05251-690111</a> · Mobile <a href="tel:+491704790790">0170-4790790</a>',
      'kt.cta.title': 'Ready for the first step?',
      'kt.cta.sub': 'Book online or send a quick enquiry – I\'ll get back to you soon.',
      'kt.cta.book': 'Go to booking calendar',
      'kt.cta.about': 'About me',
      'kt.cta.news': 'More insights: <a href="neuigkeiten.html">News &amp; updates</a>',
      'kt.praxis.imgAlt': 'Atelier – painting and creating together',
      'kt.raum.tab.eingang': 'Entrance',
      'kt.raum.tab.innen': 'Inside the atelier',
      'kt.raum.tab.gestalten': 'Creating',
      'kt.raum.compare.before': 'Current photo',
      'kt.raum.compare.after': 'Mood vision',
      'kt.raum.compare.hint':
        'Drag the slider: photo on the left, mood vision on the right · Tap hotspots for details · Tap image to enlarge',
      'kt.raum.innen.hint': 'Tap the points for more · Tap image to enlarge',
      'kt.raum.gestalten.hint': 'Creativity without pressure – a glimpse of what emerges in the atelier.',
      'kt.raum.hotspot1.title': 'Welcome',
      'kt.raum.hotspot1.text': 'Accessible ramp – straight into the atelier.',
      'kt.raum.hotspot2.title': 'Light & green',
      'kt.raum.hotspot2.text': 'Glass facade with views of greenery – a calm place to arrive.',
      'kt.raum.hotspot3.title': 'Group room',
      'kt.raum.hotspot3.text': '4–12 people, materials on site, safe setting.',
      'kt.raum.hotspot4.title': 'Materials',
      'kt.raum.hotspot4.text': 'Acrylic, gouache, chalk, collage – all provided.',

      'about.kicker': 'About me',
      'about.name': 'Martina Schwierzke',
      'about.intro':
        'As a psychosocial and clinical art therapist and practitioner for psychotherapy, I work independently. With over 16 years of experience, I support people in difficult situations – in clinical settings and in private practice.',
      'about.passion.title': 'My passion',
      'about.passion.p1':
        'For many years I have worked in palliative care and psycho-oncology and lead art therapy groups in clinical settings. Continuing education and supervision are essential to my work.',
      'about.passion.p2':
        'Art is an existential space of freedom for me. Nature is a vital source of inspiration and strength.',
      'about.quote': '"Because I know time is finite, I\'d rather live now."',
      'about.qual.title': 'Qualifications',
      'about.qual.list':
        '<ul style="color:var(--muted); line-height:1.8"><li>Psychosocial art therapist (2006–2009, accredited institute)</li><li>Clinical art therapist (2010)</li><li>Practitioner for psychotherapy (2011)</li><li>Visual marketing designer, Chamber of Commerce (2007)</li></ul>',
      'about.offers': 'Art therapy & services',
      'about.imgAlt': 'Art therapist in Paderborn',

      'book.kicker': 'Booking',
      'book.title': 'Book an introductory or regular session',
      'book.sub':
        'Only <strong>Tue 11:00–12:30</strong> and <strong>Thu 18:00–19:30</strong> can be booked (green days). The request is confirmed by email. The appointment can then be saved in Apple or Google Calendar.',
      'book.introNote':
        'Not sure if art therapy is right for you? A short, no-obligation intro chat answers your questions – just ask.',
      'book.prevMonth': 'Previous month',
      'book.nextMonth': 'Next month',
      'book.legend':
        '<span class="legend-dot legend-free"></span> Available (Tue / Thu) <span class="legend-dot legend-busy"></span> Fully booked <span class="legend-dot legend-off"></span> No atelier day',
      'book.weekdays':
        '<span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>',
      'book.calendarAria': 'Calendar',
      'book.pickDay': 'Please select a day',
      'book.slotsHint':
        'Only <strong>Tuesday mornings</strong> and <strong>Thursday evenings</strong> – 90-minute sessions.',
      'book.slotsHintDynamic':
        'Bookable: {schedule} ({minutes} min slots). <strong>Click green days only</strong> in the calendar.',
      'book.scheduleSlot.2': 'Tuesday morning',
      'book.scheduleSlot.4': 'Thursday evening',
      'book.timeOfDay.morning': 'morning',
      'book.timeOfDay.evening': 'evening',
      'book.formTitle': 'Details',
      'book.messagePlaceholder':
        'e.g. introductory call, Tuesday morning group, Thursday evening downtime …',
      'book.privacyNote':
        'With your booking, name, email, and appointment data are stored on our server (see <a href="datenschutz.html">Privacy</a>). No marketing tracking.',
      'book.submit': 'Request appointment',
      'book.loading': 'Loading calendar …',
      'book.hintFree':
        'Choose a green day (Tuesday or Thursday), then a free time slot. Google Calendar is optional – booking runs through our website.',
      'book.hintNone':
        'No available appointments are visible this month – please choose the next month (Tue mornings & Thu evenings only).',
      'book.statusError': 'The calendar could not be loaded. Please try again later.',
      'book.noSlotsDay':
        'There are no appointments on this day (Tuesday mornings & Thursday evenings only).',
      'book.noSlots': 'No slots on this day.',
      'book.allBusy':
        'All times on this day are taken or too soon (minimum 24&nbsp;hours notice). Please choose another day.',
      'book.loadingSlots': 'Loading times …',
      'book.slotsError': 'Times could not be loaded.',
      'book.dayNoOffer': 'Not available',
      'book.dayOff': 'No atelier day (Tue & Thu only)',
      'book.dayFree': 'Available slots – click',
      'book.dayBusy': 'Fully booked or too soon – show times anyway',
      'book.confirmedNote':
        'A confirmation has been sent to the email address provided (with calendar attachment).',
      'book.saveCalendar': 'Save the appointment directly in the calendar:',
      'book.googleCal': 'Google Calendar',
      'book.icsCal': 'Apple / Outlook (.ics)',
      'book.success': 'Request received. Thank you!',
      'book.error': 'Booking failed',
      'book.slotBusy': ' (unavailable)',
      'book.timeUnit': '',

      'contact.kicker': 'Contact',
      'contact.title': 'Questions, enquiries & appointments',
      'contact.sub':
        'For a fixed appointment, use <a href="buchung.html">online booking</a>. For everything else: write briefly or call.',
      'contact.reach.title': 'How to reach me',
      'contact.reach.list':
        '<li><strong>Address</strong><br>Otto-Stadler-Straße 23c<br>33102 Paderborn</li><li><strong>Phone</strong><br><a href="tel:+495251690111">05251-690111</a></li><li><strong>Mobile</strong><br><a href="tel:+491704790790">0170-4790790</a></li><li><strong>Email</strong><br><a href="#" class="js-email" data-u="info" data-d="kunsttherapie-pb.de">Send e-mail</a></li>',
      'contact.hours': 'Atelier from 1 July · Tue 11:00–12:30 · Thu 18:00–19:30',
      'contact.book': 'Book online',
      'contact.offers': 'Services',
      'contact.form.title': 'Send a message',
      'contact.form.messageLabel': 'Message *',
      'contact.messagePlaceholder':
        'What is it about? e.g. group, downtime, team building …',
      'contact.privacyNote':
        'Details are used only to handle the enquiry (<a href="datenschutz.html">Privacy</a>).',
      'contact.submit': 'Send message',
      'contact.map.title': 'Directions',
      'contact.mapIframeTitle': 'Map: atelier Otto-Stadler-Straße 23c Paderborn',
      'ui.scrollTop': 'Scroll to top',
      'ui.lightbox.title': 'Enlarged image',
      'ui.lightbox.prev': 'Previous image',
      'ui.lightbox.next': 'Next image',
      'ui.lightbox.thumbs': 'Gallery preview',
      'contact.msg.success': 'Thank you – your message has been received. I\'ll get back to you soon.',
      'contact.msg.error': 'Your message could not be sent',
      'ui.scrollTop': 'Scroll to top',
      'ui.lightbox.title': 'Enlarged image',
      'ui.lightbox.prev': 'Previous image',
      'ui.lightbox.next': 'Next image',
      'ui.lightbox.thumbs': 'Gallery preview',

      'prices.kicker': 'Prices',
      'prices.title': 'Transparent & fair',
      'prices.sub': 'Materials included. One-to-one sessions available – please enquire directly.',
      'prices.tableHead':
        '<tr><th scope="col">Service</th><th scope="col">Duration</th><th scope="col">Price</th><th scope="col">Note</th></tr>',
      'prices.tableBody':
        '<tr><td>Group session</td><td data-label="Duration">90 minutes</td><td data-label="Price"><strong>from €55</strong><span class="price-per">per person</span></td><td data-label="Note">4–12 people, materials incl.</td></tr><tr><td>Group programme (typical)</td><td data-label="Duration">4 sessions</td><td data-label="Price">on request</td><td data-label="Note">depending on topic/setting</td></tr><tr><td>One-to-one session</td><td data-label="Duration">90 minutes</td><td data-label="Price">on request</td><td data-label="Note">individual support</td></tr><tr><td>Team-building event</td><td data-label="Duration">as needed</td><td data-label="Price">on request</td><td data-label="Note">incl. concept &amp; materials</td></tr>',
      'prices.unit': 'All prices are per person and per session.',
      'prices.note':
        'Questions about prices or concessions? Write to me directly – every situation is individual.',
      'prices.ask': 'Ask about pricing',

      'newsPage.kicker': 'Updates & news',
      'newsPage.title': 'What is new?',
      'newsPage.sub':
        'Current news, dates, and announcements. Do not miss important updates!',
      'newsPage.loading': 'Loading …',
      'newsPage.empty': 'No news yet.',
      'newsPage.error': 'News could not be loaded right now. Please try again later.',

      'eventsPage.kicker': 'Dates',
      'eventsPage.title': 'Events & workshops',
      'eventsPage.sub':
        'Upcoming events, workshops, and group sessions. Register and join in!',
      'eventsPage.loading': 'Loading events …',
      'eventsPage.empty': 'No events are scheduled at the moment.',
      'eventsPage.emptyHint':
        'Feel free to message me via the contact form if you\'re interested in a workshop.',
      'eventsPage.signUp': 'Register',
      'eventsPage.cardDate': 'Event',
      'eventsPage.metaTime': 'Time: {value}',
      'eventsPage.metaLocation': 'Location: {value}',
      'eventsPage.metaCapacity': '{value} places',
      'eventsPage.error': 'Events could not be loaded right now. Please try again later.',

      'map.consent':
        'The map loads only with consent (Google Maps, see <a href="datenschutz.html">Privacy</a>).',
      'map.show': 'Show map',
      'map.open': 'Open in Google Maps',
      'map.route': 'Open route in Google Maps',

      'legal.imprint.body': `<h1>Imprint</h1>
<p class="sub">Information pursuant to § 5 TMG – as of June 2026</p>
<hr class="sep"/>
<h2>Responsible person</h2>
<p>
  <strong>Martina Schwierzke</strong><br/>
  Konrad-Martin-Straße 11c<br/>
  33102 Paderborn<br/>
  Germany
</p>
<h2>Studio address</h2>
<p>
  Psychosocial Art Therapy Paderborn<br/>
  Otto-Stadler-Straße 23c<br/>
  33102 Paderborn
</p>
<h2>Contact</h2>
<p>
  Phone: <a href="tel:+495251690111">05251-690111</a><br/>
  Mobile: <a href="tel:+491704790790">0170-4790790</a><br/>
  Email: <a href="#" class="js-email" data-u="info" data-d="kunsttherapie-pb.de">Send e-mail</a>
</p>
<h2>Professional title &amp; registration</h2>
<p>
  Practitioner for psychotherapy (officially recognised)<br/>
  Art therapist (DGKT)<br/>
  Registered with: Künstlersozialkasse (KSK)
</p>
<h2>Disclaimer</h2>
<p>
  The content of this website has been compiled with the greatest care. However, no guarantee is given for the accuracy,
  completeness, or timeliness of the content. Art therapy does not replace medical or psychological specialist treatment
  but is understood as a complementary approach.
</p>
<h2>Copyright</h2>
<p>
  © 2026 Art Therapy Paderborn. All content, text, and images are protected by copyright.
</p>
<div class="actions">
  <a class="btn" href="index.html">Back to home</a>
</div>`,

      'legal.privacy.body': `<h1>Privacy policy</h1>
<p class="sub">Transparent information under the GDPR – as of May 2026</p>
<hr class="sep"/>
<h2>1. Controller</h2>
<p>
  Martina Schwierzke<br>
  Psychosocial Art Therapy Paderborn<br>
  Otto-Stadler-Straße 23c, 33102 Paderborn<br>
  Email: <a href="#" class="js-email" data-u="info" data-d="kunsttherapie-pb.de">Send e-mail</a><br>
  Phone: 05251-690111
</p>
<h2>2. Overview</h2>
<p>
  This website uses <strong>no visitor tracking</strong> (no Google Analytics, no advertising pixels).
  We do not store marketing profiles. We only receive data from you when actively share it with us
  (e.g. booking or email) or when consenting to to optional services such as Google Maps.
</p>
<h2>3. Hosting</h2>
<p>
  The website is hosted with a European provider (e.g. Hostinger).
  Server log data is generated technically (e.g. IP address, time, page accessed) –
  to secure and provide the website. Legal basis: Art. 6(1)(f) GDPR
  (legitimate interest in secure operation).
</p>
<h2>4. Appointment booking</h2>
<p>
  When booking online, we store the data entered
  (name, email, optional phone and message, chosen appointment) in a database on our server
  to manage the appointment and for contact.
</p>
<p>
  Legal basis: Art. 6(1)(b) GDPR (pre-contractual measures / contract) or (f)
  (organisational interest in appointment management). Data is deleted once no longer required for the purpose,
  unless statutory retention obligations apply.
</p>
<p>
  <strong>Google Calendar:</strong> Appointments may – once set up technically by the practice –
  be synchronised with the atelier Google Calendar. This affects internal
  practice organisation; website visitors do not load Google Calendar on their device.
  Provider: Google Ireland Limited / Google LLC (USA). Transfers to the USA may rely on
  EU standard contractual clauses. Details: <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google Privacy</a>.
</p>
<h2>5. News on the website</h2>
<p>
  Published news is delivered from the server. A notice on the home page remembers locally in your browser (localStorage)
  which message was last saw – without tracking and without cookies for advertising purposes.
</p>
<h2>6. Cookies & local storage</h2>
<p>
  <strong>Necessary (no marketing):</strong> We store your choice in the cookie banner
  (localStorage key <code>kunsttherapie_consent_v1</code>) and optionally whether the already seen the news notice.
  Via “Accessibility” (bottom left or in the footer) you can choose display settings;
  these are stored locally only (<code>kunsttherapie-a11y</code>, no tracking).
</p>
<p>
  <strong>Optional – only with consent:</strong>
</p>
<ul>
  <li><strong>Google Maps</strong> (maps on contact and services pages): may transfer IP address and usage data to Google.</li>
  <li><strong>Google Fonts</strong> (typefaces): loading may transmit data to Google.</li>
</ul>
<p>
  Consent can be withdrawn or adjust your consent at any time via “Cookie settings” in the footer.
  Legal basis for optional services: Art. 6(1)(a) GDPR.
</p>
<h2>7. Admin area</h2>
<p>
  The protected area <code>/admin</code> is intended for authorised atelier users only.
  A technically necessary session (login cookie) is used there. Visitors to the public
  website do not receive this cookie.
</p>
<h2>8. Contact by email or phone</h2>
<p>
  When contacting us by email or phone, we process the data provided
  to handle the enquiry (Art. 6(1)(b) or (f) GDPR).
</p>
<h2>9. Data subject rights</h2>
<p>
  There is a right to access, rectification, erasure, restriction of processing,
  data portability, and objection. Where consent was given, withdrawal is possible at any time it at any time.
</p>
<p>
  You may lodge a complaint with a data protection supervisory authority, e.g. the LDI NRW.
</p>
<h2>10. Changes</h2>
<p>
  We update this policy when the website or legal situation changes.
</p>
<div class="actions">
  <button type="button" class="btn outline" onclick="openCookieSettings()">Cookie settings</button>
  <a class="btn" href="index.html">Back to home</a>
</div>`,

      'consent.banner.title': 'Privacy & cookies',
      'consent.lead':
        'We use <strong>no tracking</strong> and do not sell data. We only store what is actively shared (e.g. booking) and technical settings in the browser.',
      'consent.list':
        '<li><strong>Necessary:</strong> cookie settings, news notice (stored locally in the browser)</li><li><strong>Optional:</strong> Google Maps &amp; Google Fonts (data transfer to the USA possible)</li>',
      'consent.note':
        'Bookings are stored on our server and may be synchronised with the <strong>practice Google Calendar</strong> (not in the browser). <a href="/datenschutz">Privacy policy</a>',
      'consent.acceptAll': 'Accept all',
      'consent.essential': 'Essential only',
      'consent.settings': 'Settings',
      'consent.settingsTitle': 'Cookie settings',
      'consent.necessary': 'Necessary',
      'consent.necessaryNote':
        'Stores your choice and whether the already seen the news notice. No tracking.',
      'consent.external': 'External media (Google)',
      'consent.externalNote':
        'Google Maps on contact and services pages and typefaces from Google Fonts.',
      'consent.save': 'Save selection',
      'consent.legalLinks':
        '<a href="/datenschutz">Privacy policy</a> · <a href="/impressum">Imprint</a>',
      'consent.footerLink': 'Cookie settings',

      'a11y.toggle': 'Open accessibility settings',
      'a11y.title': 'Accessibility',
      'a11y.intro':
        'Adjust display settings. Settings are saved on this device.',
      'a11y.fontSize': 'Font size',
      'a11y.font.normal': 'Default',
      'a11y.font.large': 'Larger',
      'a11y.font.xlarge': 'Extra large',
      'a11y.contrast': 'Contrast',
      'a11y.contrast.default': 'Default',
      'a11y.contrast.high': 'High contrast',
      'a11y.motion': 'Motion',
      'a11y.motion.default': 'Default',
      'a11y.motion.reduce': 'Reduced',
      'a11y.links': 'Links',
      'a11y.links.default': 'Default',
      'a11y.links.underline': 'Always underlined',
      'a11y.spacing': 'Readability',
      'a11y.spacing.default': 'Default',
      'a11y.spacing.readable': 'More line spacing',
      'a11y.focus': 'Keyboard focus',
      'a11y.focus.default': 'Default',
      'a11y.focus.strong': 'Stronger focus outline',
      'a11y.reset': 'Reset',
      'a11y.announce.set': 'Setting applied.',
      'a11y.announce.reset': 'All settings reset.',
      'a11y.footerBtn': 'Accessibility',
    },
  };
  Object.assign(window.I18N_MESSAGES.de, extra.de);
  Object.assign(window.I18N_MESSAGES.en, extra.en);
})();
