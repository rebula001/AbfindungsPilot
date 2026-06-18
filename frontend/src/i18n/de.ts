// 德语文案集合：所有用户可见文本统一从这里导出，避免在组件中硬编码德语字符串
export default {
  app: {
    name: 'Abfindungspilot',
    logoAlt: 'Abfindungspilot Logo'
  },
  nav: {
    // 顶部工具栏按钮文案
    input: 'Eingabe',
    calculation: 'Berechnung',
    chart: 'Diagramm',
    menuLabel: 'Hauptmenü: Eingabe, Berechnung, Diagramm'
  },
  layout: {
    // 三栏布局中折叠/切换按钮的提示与 ARIA 文本
    showInputPanel: 'Eingabe einblenden',
    hideInputPanel: 'Eingabe ausblenden',
    showCalculationPanel: 'Berechnung anzeigen',
    showChartPanel: 'Diagramm anzeigen'
  },
  emptyState: {
    title: 'Noch keine Eingaben gespeichert',
    intro: 'Um Ihre persönliche Berechnung zu sehen, gehen Sie wie folgt vor:',
    step1: 'Öffnen Sie das Eingabemodul auf der linken Seite.',
    step2: 'Geben Sie Ihre persönlichen und finanziellen Daten ein.',
    step3: 'Klicken Sie auf „Daten speichern" — Berechnung und Diagramm erscheinen sofort.',
    disclaimerTitle: 'Wichtiger rechtlicher Hinweis',
    disclaimerBody:
      'Diese Anwendung wird <strong>kostenlos</strong> zur Verfügung gestellt und dient ausschließlich der <strong>unverbindlichen Orientierung</strong>. Alle Berechnungen sind vereinfachte Schätzungen auf Basis des deutschen Steuerrechts 2026 und ersetzen <strong>keine steuerliche, rechtliche oder finanzielle Beratung</strong>. Es wird <strong>keinerlei Haftung</strong> für Richtigkeit, Vollständigkeit oder Aktualität der Ergebnisse übernommen — insbesondere nicht für finanzielle Nachteile, die aus deren Nutzung entstehen. Für verbindliche Aussagen wenden Sie sich bitte an einen <strong>Steuerberater</strong> oder Ihr Finanzamt.<br><br><strong>Datenschutz:</strong> Ihre Eingaben bleiben ausschließlich lokal in Ihrem Browser-Cache (3 Stunden) und werden zu keinem Zeitpunkt an einen Server übertragen.'
  },
  workspace: {
    // Eingabe-View 内的快速跳转按钮 / Accordion 标题
    sections: {
      basic: 'Stammdaten',
      income: 'Einnahmen & Ausgaben'
    }
  },
  form: {
    // 通用
    yes: 'ja',
    no: 'nein',
    submit: 'Daten speichern',
    reset: 'Zurücksetzen',
    requiredField: 'Pflichtfeld',
    savedToastSummary: 'Daten gespeichert',
    savedToastDetail:
      'Ihre Eingaben wurden lokal im Browser-Cache gespeichert und werden für die Berechnung verwendet. Es werden keine personenbezogenen Daten an einen Server übertragen. Die Daten bleiben für 3 Stunden im Cache.',
    resetToastSummary: 'Cache gelöscht',
    resetToastDetail: 'Der lokale Cache wurde geleert und alle Felder auf die Standardwerte zurückgesetzt.',
    // Stammdaten
    familyType: 'Familienstand',
    familyTypeSingle: 'Single',
    familyTypeFamily: 'Familie',
    spouseSection: 'Ehepartner',
    taxClassOwn: 'Ihre Steuerklasse',
    taxClassFactor: 'Faktor auf der LohnSt.-Karte',
    taxClassFactorAriaLabel: 'Hinweis zum Faktor (Klasse IV mit Faktor)',
    taxClassFactorTooltip:
      '<p>Der <strong>Faktor</strong> bei Steuerklasse <strong>IV mit Faktor</strong> verteilt die monatliche <strong>Lohnsteuer-Vorauszahlung</strong> beider Ehegatten gerechter über das Jahr.</p><p><strong>Hinweis:</strong> Diese Anwendung berechnet die <strong>Jahres-Einkommensteuer</strong> (Veranlagung), nicht die monatliche Lohnsteuer. Der Faktor wirkt sich daher auf das Endergebnis <strong>nicht</strong> aus — er ist hier nur informatorisch und wird der Engine nicht übergeben.</p>',
    taxClassInfoAriaLabel: 'Hinweis zur Lohnsteuerklasse',
    churchTax: 'Zahlen Sie Kirchensteuer',
    federalState: 'Ihr Bundesland',
    federalStatePlaceholder: 'Bundesland auswählen',
    healthInsurance: 'Krankenversicherung',
    healthInsuranceInfoAriaLabel: 'Hinweis zur Krankenversicherung',
    healthInsuranceRate: 'Krankenversicherungssatz',
    healthInsuranceRateInfoAriaLabel: 'Hinweis zum Krankenversicherungssatz',
    baseHealthInsuranceRate: 'Allgemeiner Beitragssatz',
    privateHealthInsuranceAnnual: 'Private KV-Beiträge / Jahr',
    privateCareInsuranceAnnual: 'Private PV-Beiträge / Jahr',
    privateInsuranceDeductibleAriaLabel: 'Hinweis zur abziehbaren Höhe',
    hasChildren: 'Haben Sie Kinder?',
    careInsuranceInfoAriaLabel: 'Hinweis zur Pflegeversicherung',
    childrenUnder25: 'Anzahl Kinder unter 25',
    childAllowance: 'Kinderfreibetrag',
    childAllowanceInfoAriaLabel: 'Hinweis zum Kinderfreibetrag',
    childBenefitMonthlyPerChild: 'Kindergeld pro Kind / Monat',
    childBenefitInfoAriaLabel: 'Hinweis zum Kindergeld',
    age: 'Ihr Alter',
    pensionInsurance: 'Rentenversicherung',
    pensionInsuranceInfoAriaLabel: 'Hinweis zur Rentenversicherung',
    unemploymentInsurance: 'Arbeitslosenversicherung',
    unemploymentInsuranceInfoAriaLabel: 'Hinweis zur Arbeitslosenversicherung',
    // Einkommen & Abfindung
    hasNewJob: 'Neue Arbeit bereits gefunden',
    hasNewJobAriaLabel: 'Hinweis zur Option „Neue Arbeit bereits gefunden"',
    hasNewJobTooltip:
      '<p><strong>aktiviert</strong>: Beginn und Monatsbrutto der neuen Arbeit gelten als <strong>fest</strong>. Berechnung und Diagramm verwenden ausschließlich diese beiden Werte (eine einzige Linie statt Sweep). Slider in der Berechnungsansicht werden gesperrt.</p><p><strong>deaktiviert</strong>: noch keine konkrete Stelle. Es wird über die <strong>Gehalts-Bandbreite</strong> (Min / Max / Schrittweite) und 17 Monate ab Arbeitslosigkeit gefächert; das Diagramm zeigt eine Kurve pro Gehaltsstufe, und die Berechnungsansicht erlaubt das Durchprobieren beliebiger Kombinationen.</p>',
    salaryRangeSection: 'Gehalts-Bandbreite (Sweep für Diagramm)',
    salaryRangeSectionAriaLabel: 'Hinweis zur Gehalts-Bandbreite',
    salaryRangeSectionTooltip:
      '<p>Diese drei Werte (<strong>Min</strong>, <strong>Max</strong>, <strong>Schrittweite</strong>) erzeugen eine Reihe möglicher <strong>Monatsbrutto-Werte</strong> für eine neue Arbeit — z. B. 5.000 €, 5.500 €, …, 8.000 €.</p><ul><li><strong>Verwendung:</strong> Jeder Wert wird im <strong>Diagramm</strong> als eigene farbige Kurve gezeichnet und in der <strong>Berechnungsansicht</strong> als auswählbare Stufe angeboten.</li><li><strong>Regel:</strong> Es werden höchstens <strong>7 Stufen</strong> erzeugt. Die Schrittweite wird automatisch nach oben angepasst, falls (Max − Min) / Schrittweite > 6 ergeben würde.</li><li><strong>Warum:</strong> Mehr als 7 Kurven sind in einem Liniendiagramm visuell kaum noch unterscheidbar; außerdem ist die Farbpalette auf 7 gut unterscheidbare Regenbogentöne (Rot · Orange · Gelb · Grün · Cyan · Blau · Violett) ausgelegt.</li></ul><p>Tipp: Für eine feinere Auflösung verkleinern Sie die Bandbreite (Max − Min); für eine breitere Übersicht vergrößern Sie die Schrittweite.</p>',
    expectedMonthlySalaryMin: 'Min. Monatsgehalt',
    expectedMonthlySalaryMax: 'Max. Monatsgehalt',
    expectedMonthlySalaryStep: 'Schrittweite',
    newJobStartDate: 'Beginn neue Arbeit',
    newJobMonthlySalary: 'Monatsbrutto neue Arbeit',
    unemploymentSection: 'Abfindung & Arbeitslosengeld',
    abfindungGross: 'Abfindung (brutto)',
    unemploymentDate: 'Beginn Arbeitslosigkeit',
    possibleSeverancePaymentDates: 'Mögliche Auszahlungstermine der Abfindung',
    possibleSeverancePaymentDatesAriaLabel: 'Hinweis zu den möglichen Auszahlungsterminen',
    possibleSeverancePaymentDatesTooltip:
      '<p>Aus dem <strong>Beginn der Arbeitslosigkeit</strong> abgeleitet – die App vergleicht die Steuerlast für beide Termine:</p><ul><li><strong>Auszahlung im selben Jahr</strong> (15. des Monats der Arbeitslosigkeit): Abfindung trifft auf das laufende Jahresgehalt → höhere Progression.</li><li><strong>Auszahlung im Folgejahr</strong> (15. Januar): zvE im Folgejahr meist niedrig → <strong>Fünftelregelung (§ 34 EStG)</strong> wirkt stärker.</li></ul>',
    oldEmployerIncomeCurrentYear: 'Bruttolohn gesamt (alter Job)',
    oldEmployerIncomeCurrentYearAriaLabel: 'Hinweis zum Bruttolohn alter Arbeitgeber',
    oldEmployerIncomeCurrentYearTooltip:
      '<p>Summe des <strong>Bruttoarbeitslohns</strong> beim alten Arbeitgeber im Jahr der Arbeitslosigkeit – vom <strong>1. Januar bis zum Tag vor Beginn der Arbeitslosigkeit</strong>.</p><p>Beispiel: Beginn Arbeitslosigkeit am 01.08.2026 → Eintrag = Bruttolohn 01.01.–31.07.2026 (inkl. Urlaubs-/Weihnachtsgeld, ohne Abfindung).</p>',
    unemploymentBenefitMonthly: 'ALG I / Monat',
    unemploymentBenefitMonthlyAriaLabel: 'Hinweis zur Berechnung des ALG I',
    unemploymentBenefitMonthlyTooltip:
      '<p>Das <strong>monatliche ALG I</strong> wird so ermittelt:</p><ol><li><strong>Bemessungsentgelt / Tag</strong> = beitragspflichtiges Bruttoarbeitsentgelt der letzten 12 Monate vor Arbeitslosigkeit ÷ 365.</li><li><strong>Leistungsentgelt / Tag</strong> = Bemessungsentgelt − pauschalierte Lohnsteuer (Lohnsteuerklasse) − pauschaliertes Sozialversicherungsentgelt (21 %).</li><li><strong>Leistungssatz</strong>: 60 % des Leistungsentgelts; 67 % bei mindestens einem berücksichtigungsfähigen Kind (§ 149 SGB III).</li><li><strong>Monatsbetrag</strong> = Tagesleistung × 30.</li></ol><p>Den exakten Wert können Sie mit dem <strong>offiziellen Tool der Bundesagentur für Arbeit</strong> berechnen.</p>',
    unemploymentBenefitDurationMonths: 'Anspruchsdauer ALG I',
    hasBenefitReductionPeriod: 'Sperrzeit (Minderung)',
    benefitReductionMonths: 'Sperrzeit-Monate',
    hasBenefitSuspensionPeriod: 'Ruhezeit',
    benefitSuspensionMonths: 'Ruhezeit-Monate',
    rentalIncomeSection: 'Vermietung & Verpachtung',
    rentalIncomeYearly: 'Mieteinnahmen / Jahr (netto)',
    rentalIncomeYearlyAriaLabel: 'Hinweis zu Mieteinnahmen',
    rentalIncomeYearlyTooltip:
      '<p>Bitte geben Sie hier die <strong>Netto-Einkünfte</strong> aus Vermietung und Verpachtung ein — also Mieteinnahmen <strong>nach</strong> Abzug aller Werbungskosten (AfA, Zinsen, Reparaturen, Hausgeld nicht-umlagefähig, Verwaltung, Versicherung).</p><p><strong>Vereinfachung:</strong> Diese App rechnet keine AfA und keine sonstigen V»&V-Werbungskosten selbst aus. Den errechneten Wert finden Sie in Ihrer Anlage V/V der Steuererklärung (Zeile <em>„Einkünfte aus Vermietung und Verpachtung“</em>) oder in Ihrem letzten Steuerbescheid.</p>',
    sharedIncomeUserShare: 'Anteil Benutzer / Ehepartner',
    sharedIncomeSpouseShare: 'Anteil Ehepartner',
    donationSection: 'Spenden',
    donationSectionAriaLabel: 'Hinweis zu Spenden',
    donationSectionTooltip:
      '<p><strong>Spenden</strong> an steuerbegünstigte Empfänger sind als Sonderausgaben abziehbar (§ 10b EStG).</p><ul><li><strong>Abzugshöchstbetrag</strong>: bis zu <strong>20 % des Gesamtbetrags der Einkünfte</strong> oder 4 ‰ der Summe aus Umsätzen, Löhnen und Gehältern.</li><li>Nicht berücksichtigte Beträge werden in Folgejahre vorgetragen.</li><li><strong>Zuwendungen an politische Parteien</strong> werden gesondert behandelt (§ 34g EStG).</li></ul>',
    donationYearly: 'Spenden / Jahr',
    sharedDonationUserShare: 'Anteil Benutzer / Ehepartner',
    sharedDonationSpouseShare: 'Anteil Ehepartner',
    spouseGrossIncomeYearly: 'Bruttoeinkommen Ehepartner / Jahr',
    otherIncomeYearly: 'Sonstige Einkünfte / Jahr',
    // Optionsbeschriftungen (analog zu nettolohn.de)
    insuranceStatutoryMandatory: 'gesetzlich pflichtversichert',
    insurancePrivate: 'privat versichert',
    insuranceVoluntaryStatutory: 'freiwillig gesetzlich versichert',
    socialNotMandatory: 'nicht gesetzlich pflichtversichert',
    socialStatutoryMandatory: 'gesetzlich pflichtversichert',
    socialEmployerOnly: 'nur Arbeitgeber-Pflichtanteil',
    socialEmployeeOnly: 'nur Arbeitnehmer-Pflichtanteil',
    monthsSuffix: ' Monate',
    taxClassFactorLabel: 'IV mit Faktor',
    // Tooltip-Inhalte (HTML-Strings, dürfen <p>/<ul>/<li>/<strong> enthalten)
    taxClassInfoTitle: 'Lohnsteuerklassen in Deutschland',
    taxClassInfoIntro: 'Die Lohnsteuerklasse bestimmt, wie viel Lohnsteuer monatlich vom Brutto einbehalten wird.',
    taxClassInfoClasses: [
      '<strong>I</strong>: Ledige, Geschiedene, dauernd getrennt Lebende',
      '<strong>II</strong>: Alleinerziehende mit Entlastungsbetrag',
      '<strong>III</strong>: Verheiratete (Hauptverdiener) – Partner in V',
      '<strong>IV</strong>: Verheiratete mit ähnlichem Einkommen',
      '<strong>IV mit Faktor</strong>: Verheiratete mit gerechterer monatlicher Verteilung',
      '<strong>V</strong>: Verheiratete (Geringverdiener) – Partner in III',
      '<strong>VI</strong>: Zweit- und weitere Beschäftigungsverhältnisse'
    ],
    healthInsuranceInfoTooltip:
      '<p>Die <strong>gesetzliche Krankenversicherung (GKV)</strong> ist Pflichtversicherung für Arbeitnehmer bis zur <strong>Jahresarbeitsentgeltgrenze (JAEG)</strong> – 2026: 73.800 € brutto/Jahr (§ 6 Abs. 1 Nr. 1 SGB V). Wer regelmäßig darüber liegt, kann in die <strong>private Krankenversicherung (PKV)</strong> wechseln oder freiwillig in der GKV bleiben.</p><p><strong>gesetzlich pflichtversichert</strong>: Standard für abhängig Beschäftigte unter der JAEG – AG/AN tragen den Beitrag je zur Hälfte.</p><p><strong>freiwillig gesetzlich versichert</strong>: oberhalb der JAEG, in der GKV verbleibend (z. B. nach Wechsel zurück, Selbstständige).</p><p><strong>privat versichert</strong>: PKV statt GKV; Beitrag risiko- und tarifabhängig, AG-Zuschuss bis zur Hälfte des GKV-Höchstbeitrags.</p>',
    healthInsuranceRateInfoTooltip:
      '<p>Der <strong>GKV-Beitragssatz</strong> setzt sich aus zwei Teilen zusammen:</p><ul><li><strong>Allgemeiner Beitragssatz: 14,60 %</strong> (§ 241 SGB V) – fest, je zur Hälfte von AG und AN getragen.</li><li><strong>Kassenindividueller Zusatzbeitrag</strong> (§ 242a SGB V) – jede Krankenkasse legt ihn selbst fest. Durchschnitt 2026 ca. 2,90 %; den genauen Wert Ihrer Kasse tragen Sie hier ein. Seit 2019 ebenfalls paritätisch.</li></ul><p>AN-Anteil = (14,60 % + Zusatzbeitrag) ÷ 2, gedeckelt bei der Beitragsbemessungsgrenze (2026: 5.812,50 €/Monat).</p>',
    careInsuranceInfoTooltip:
      '<p><strong>Pflegeversicherung 2026</strong>: Beitragssatz 3,60 % (4,20 % für Kinderlose) vom beitragspflichtigen Einkommen bis zur Bemessungsgrenze (5.812,50 €/Monat).</p><p>Arbeitgeber und Arbeitnehmer teilen sich den Beitrag je zur Hälfte (jeweils 1,80 %) – Ausnahme Sachsen. Am Zuschlag von 0,60 %-Punkten für Kinderlose werden Arbeitgeber <strong>nicht</strong> beteiligt.</p><p>Kinder unter 25 entlasten den AN-Anteil: Der Kinderlosenzuschlag entfällt; ab dem 2. Kind reduziert sich der PV-Beitrag pro Kind um 0,25 %-Punkte (max. 5 Kinder).</p>',
    privateInsuranceDeductibleTooltip:
      '<p>Nur der <strong>Basisanteil</strong> der privaten KV/PV ist als Sonderausgabe abziehbar.</p><p>Komfort- und Wahlleistungen bleiben außen vor.</p><p><strong>Hinweis zur Arbeitslosigkeit (Vereinfachung):</strong> Während des ALG-I-Bezugs übernimmt die Bundesagentur für Arbeit (BA) für PKV-Versicherte einen Zuschuss bis zur Höhe des fiktiven GKV-Beitrags (§ 174 SGB III) — der hier eingegebene Basisanteil wäre also in arbeitslosen Monaten faktisch zum großen Teil abgedeckt. Diese App rechnet dennoch den vollen Jahresbasisbeitrag ab, ohne den BA-Zuschuss abzuziehen. Das überschätzt die PKV-Kosten im Liegenbleiben-Szenario leicht und führt zu einem konservativen Netto (Richtung „Neue Arbeit lohnt sich eher").</p>',
    childAllowanceInfoTooltip:
      '<p>Der <strong>Kinderfreibetrag</strong> (KFB + BEA = 9.756 € pro Kind, 2026) ersetzt im Rahmen der Günstigerprüfung das Kindergeld.</p><p>0,5 = halber Anteil pro Elternteil, 1,0 = ganzer Freibetrag auf diese Person übertragen.</p><p><strong>Hinweis:</strong> Diese Anwendung berücksichtigt aktuell stets die <strong>hälftige Aufteilung</strong> pro Elternteil bei Einzelveranlagung bzw. den <strong>vollen KFB</strong> bei Zusammenveranlagung. Abweichende Übertragungen (§ 32 Abs. 6 EStG) fließen vereinfacht <strong>nicht</strong> in die Berechnung ein und sind hier rein informatorisch.</p>',
    childBenefitInfoTooltip: '<p><strong>Kindergeld</strong> 2026: 259 €/Monat pro Kind (= 3.108 €/Jahr).</p>',
    pensionInsuranceInfoTooltip:
      '<p>Die <strong>gesetzliche Rentenversicherung</strong> ist ein Zweig des deutschen Sozialversicherungssystems und dient vorrangig der Alterssicherung von Arbeitnehmern.</p><p>In Deutschland gilt grundsätzlich <strong>Versicherungspflicht</strong>. Ausgenommen sind u. a. Beamte, Richter, Soldaten und weitere Beschäftigte öffentlicher Institutionen sowie viele Selbstständige (eigenständige Altersversorgung über Versorgungswerke / private Vorsorge).</p><p><strong>pflichtversichert</strong>: Standard für abhängig Beschäftigte – AN-Anteil wird vom Bruttolohn einbehalten.</p><p><strong>nicht pflichtversichert</strong>: Beamte, Selbstständige ohne RV-Pflicht – kein AN-Beitrag.</p>',
    unemploymentInsuranceInfoTooltip:
      '<p>Die <strong>Arbeitslosenversicherung</strong> sichert das Einkommen während der Arbeitssuche und finanziert Beratung & Vermittlung durch die Bundesagentur für Arbeit.</p><p>Es gilt grundsätzlich <strong>Versicherungspflicht</strong> für alle abhängig Beschäftigten; ausgenommen sind u. a. Selbstständige sowie außerhalb der EU beschäftigte Arbeitnehmer.</p><p><strong>Beitragssatz 2026: 2,60 %</strong> des beitragspflichtigen Bruttoentgelts – je zur Hälfte von Arbeitgeber und Arbeitnehmer getragen (jeweils 1,30 %).</p><p><strong>pflichtversichert</strong>: Standard für abhängig Beschäftigte.</p><p><strong>nicht pflichtversichert</strong>: z. B. Beamte, Selbstständige – kein ALG-I-Anspruch.</p>',
    unemploymentBenefitDurationTooltip:
      '<p>Anspruchsdauer ALG I nach <strong>§ 147 SGB III</strong> (vereinfacht):</p><ul><li>≥ 58 Jahre: 24 Monate</li><li>≥ 55 Jahre: 18 Monate</li><li>≥ 50 Jahre: 15 Monate</li><li>sonst: 12 Monate</li></ul>',
    benefitReductionPeriodTooltip:
      '<p>Eine <strong>Sperrzeit</strong> (§ 159 SGB III) verhängt die Bundesagentur für Arbeit, wenn die Arbeitslosigkeit aus Sicht der Versichertengemeinschaft selbst herbeigeführt wurde – ohne wichtigen Grund. Während der Sperrzeit wird <strong>kein ALG I gezahlt</strong>; gleichzeitig <strong>verkürzt sich die Anspruchsdauer</strong> um die entsprechenden Wochen.</p><p><strong>Typische Auslöser:</strong></p><ul><li><strong>Sperrzeit bei Arbeitsaufgabe</strong>: eigene Kündigung oder einvernehmlicher Aufhebungsvertrag ohne wichtigen Grund (z. B. Mobbing, drohende betriebsbedingte Kündigung) – i. d. R. <strong>12 Wochen</strong>.</li><li><strong>Sperrzeit bei Arbeitsablehnung</strong>: zumutbares Stellenangebot abgelehnt – 3, 6 oder 12 Wochen je nach Wiederholung.</li><li><strong>Sperrzeit bei unzureichenden Eigenbemühungen</strong> oder verspäteter Arbeitsuchend-Meldung (§ 38 SGB III) – meist 1 Woche.</li><li><strong>Sperrzeit bei Meldeversäumnis</strong> oder Ablehnung einer Maßnahme – 1 bis mehrere Wochen.</li></ul><p><strong>Folge:</strong> ALG-I-Beginn verschiebt sich, die maximale Bezugsdauer reduziert sich, ggf. erlischt der Anspruch ganz (Sperrzeiten ≥ 21 Wochen kumuliert).</p>',
    benefitSuspensionPeriodTooltip:
      '<p><strong>Ruhezeit</strong> (§ 158 SGB III): bei Abfindung ohne Einhaltung der Kündigungsfrist ruht der ALG-Anspruch; die Anspruchsdauer bleibt erhalten.</p>'
  },
  validation: {
    newJobBeforeUnemployment: 'Beginn der neuen Arbeit darf nicht vor dem Beginn der Arbeitslosigkeit liegen.',
    benefitReductionExceedsDuration:
      'Sperrzeit ({months} Monate) ist größer als die Anspruchsdauer ALG I ({duration} Monate) — das ALG würde komplett entfallen. Bitte Wert anpassen.'
  },
  views: {
    chart: {
      title: 'Diagramm'
    }
  },
  chart: {
    szenario: {
      title: 'Nettoeinkommen (2 Jahre) bei Zusammenveranlagung',
      description:
        'Liniendiagramm: Summe des Familien-Nettoeinkommens über beide Steuerjahre in Abhängigkeit vom Beginn der neuen Arbeit (Sweep über die in den Stammdaten festgelegte Gehaltsbandbreite).<br><strong>Tipp:</strong> Mit der Maus über einen Punkt fahren, um Detailwerte (Δ ggü. Liegenbleiben, zusätzlich gearbeitete Monate, Ø pro zusätzlichem Monat) zu sehen. Mit den Buttons unter dem Diagramm einzelne Linien aus- bzw. einblenden.',
      xAxis: 'Beginn neue Arbeit',
      yAxis: 'Netto (2 Jahre)'
    },
    szenarioSplit: {
      title: 'Nettoeinkommen (2 Jahre) bei getrennter Veranlagung',
      description:
        'Wie oben, jedoch wird jede Person einzeln nach Grundtabelle § 32a EStG besteuert (getrennte Veranlagung § 26a EStG).<br><strong>Tipp:</strong> Mit der Maus über einen Punkt fahren für Detailwerte; mit den Buttons unter dem Diagramm einzelne Linien aus-/einblenden.',
      xAxis: 'Beginn neue Arbeit',
      yAxis: 'Netto (2 Jahre)'
    },
    szenarioSingle: {
      // Single-Modus (kein Ehepartner): nur eine Kurve, keine Veranlagungsart-Unterscheidung
      title: 'Nettoeinkommen (2 Jahre)',
      description:
        'Liniendiagramm: Summe des Nettoeinkommens über beide Steuerjahre in Abhängigkeit vom Beginn der neuen Arbeit (Sweep über die in den Stammdaten festgelegte Gehaltsbandbreite).<br><strong>Tipp:</strong> Mit der Maus über einen Punkt fahren, um Detailwerte (Δ ggü. Liegenbleiben, zusätzlich gearbeitete Monate, Ø pro zusätzlichem Monat) zu sehen. Mit den Buttons unter dem Diagramm einzelne Linien aus- bzw. einblenden.',
      xAxis: 'Beginn neue Arbeit',
      yAxis: 'Netto (2 Jahre)'
    },
    legend: {
      auszahlungPrefix: 'Auszahlung',
      referenceLabel: 'Liegenbleiben (Referenz)'
    },
    diff: {
      differenz: 'Differenz',
      maximum: 'Maximum'
    },
    tooltip: {
      // Tooltip-Zusatzzeilen pro Datenpunkt: Vergleich gegen Liegenbleiben + Ø pro zusätzlich gearbeitetem Monat
      diffVsLiegen: 'Δ ggü. Liegenbleiben: {amount}',
      extraMonths: 'Zusätzlich gearbeitet: {months} Monate',
      perMonth: 'Ø pro zusätzlichem Monat: {amount} ({verdict})',
      perMonthVerdict: {
        negative: 'nicht lohnenswert',
        low: 'kaum attraktiv (< 2.500 €)',
        mid: 'normal (2.500 – 3.000 €)',
        high: 'klar attraktiv (≥ 3.000 €)'
      }
    },
    summary: {
      // 动态结论：结合当前 snapshot 的最佳「找新工作」行与「躺平到底」基准对比
      heading: 'Vergleich: Neue Arbeit vs. Liegenbleiben',
      referenceIntro:
        'Die graue Linie ({jointValue} bei Zusammenveranlagung, {splitValue} bei getrennter Veranlagung) zeigt das Familien-Netto über 2 Jahre, wenn der Benutzer ab Beginn der Arbeitslosigkeit dauerhaft arbeitslos bleibt und die Abfindung erst im Folgejahr ({payDateFolgejahr}) ausgezahlt wird. Alle farbigen Linien stehen für „Neue Arbeit" — oberhalb der grauen Linie lohnt sich die Arbeitsaufnahme netto, unterhalb nicht.',
      referenceIntroSingle:
        'Die graue Linie ({value}) zeigt das Netto-Einkommen über 2 Jahre, wenn der Benutzer ab Beginn der Arbeitslosigkeit dauerhaft arbeitslos bleibt und die Abfindung erst im Folgejahr ({payDateFolgejahr}) ausgezahlt wird. Alle farbigen Linien stehen für „Neue Arbeit" — oberhalb der grauen Linie lohnt sich die Arbeitsaufnahme netto, unterhalb nicht.',
      // Beste Wahl nach „Rendite pro zusätzlich gearbeitetem Monat" (Δ Netto / Mehrarbeitsmonate).
      // Diese Bewertung beantwortet die Kernfrage „lohnt sich das eigentlich?".
      bestPerMonth:
        'Beste Wahl bei {veranlagungLabel}: Beginn am {start}, Monatsbrutto {gross}, Abfindungsauszahlung {payDate} — ergibt <strong>{perMonth} pro zusätzlich gearbeitetem Monat</strong> ({verdict}). Über {months} Monate Mehrarbeit sind das {delta} mehr Familien-Netto ({netto} insgesamt).',
      bestPerMonthSingle:
        'Beste Wahl: Beginn am {start}, Monatsbrutto {gross}, Abfindungsauszahlung {payDate} — ergibt <strong>{perMonth} pro zusätzlich gearbeitetem Monat</strong> ({verdict}). Über {months} Monate Mehrarbeit sind das {delta} mehr Netto-Einkommen ({netto} insgesamt).',
      perMonthVerdict: {
        negative: 'nicht lohnenswert',
        low: 'kaum attraktiv — unter Median-Vollzeit-Netto',
        mid: 'normal — nahe Median-Vollzeit-Netto',
        high: 'klar attraktiv — über Median-Vollzeit-Netto'
      },
      veranlagungJoint: 'Zusammenveranlagung',
      veranlagungSplit: 'getrennter Veranlagung',
      insightTitle: 'Worauf zu achten ist',
      insightFuenftel:
        'Die Fünftelregelung (§ 34 EStG) wirkt am stärksten, wenn das ordentliche zvE im Auszahlungsjahr niedrig ist — typischerweise bei Auszahlung im Folgejahr nach längerer Arbeitslosigkeit.',
      insightProgression:
        'Sobald wieder ein Gehalt fließt, verschiebt sich der Grenzsteuersatz nach oben und der Vorteil der Fünftelregelung schrumpft.',
      insightSv:
        'Auf neues Gehalt fallen zusätzlich KV / PV / RV / ALV (~ 21 % Arbeitnehmer-Anteil bis zur Beitragsbemessungsgrenze) an — sie reduzieren den Netto-Zugewinn weiter.',
      insightTimingTitle: 'Praktische Empfehlung',
      insightTimingPayDate:
        'Die Abfindung möglichst in das Jahr mit dem niedrigeren ordentlichen zvE legen — meist das Folgejahr nach Beginn der Arbeitslosigkeit.',
      insightTimingStart:
        'Wenn eine neue Arbeit aufgenommen wird, hängt der Netto-Vorteil vor allem vom <strong>Monatsbrutto</strong> ab — bei niedrigem Gehalt fällt er oft komplett weg. Ein <strong>früherer Beginn</strong> erhöht zwar das absolute Plus über zwei Jahre, senkt aber meist den Wert „Ø pro zusätzlichem Monat", weil entgangenes ALG und zusätzliche Sozialabgaben/Steuern mit eingerechnet werden.',
      benchmarkTitle: 'Bewertung „Ø pro zusätzlichem Monat" (Tooltip)',
      benchmarkBody:
        'Im Tooltip der einzelnen Datenpunkte wird der Wert <strong>Ø pro zusätzlichem Monat</strong> (= Δ Netto ÷ zusätzlich gearbeitete Monate) anhand folgender Schwellen bewertet: <strong>≤ 0 €</strong> nicht lohnenswert · <strong>0 – 2.500 €</strong> kaum attraktiv · <strong>2.500 – 3.000 €</strong> normal · <strong>≥ 3.000 €</strong> klar attraktiv. Der Bezugspunkt <strong>2.500 €/Monat</strong> entspricht dem geschätzten <strong>Median-Netto eines Vollzeitbeschäftigten</strong> in Deutschland (Destatis Verdiensterhebung 2023, Median-Brutto Vollzeit ≈ 3.978 €/Monat, Steuerklasse I). <strong>Hinweis:</strong> Bei höherem Lebensstandard oder höherem persönlichem Vergleichsgehalt verschiebt sich Ihre individuelle Schwelle nach oben — z. B. 5.000 €/Monat. Die Bewertung ist nur eine grobe Orientierung.'
    }
  },
  calculation: {
    // 计算过程视图：按 Steuerjahr 用 Accordion 分组，内部用 Timeline 逐步展示。
    pageTitle: 'Berechnungsprozess ({veranlagung})',
    pageIntro:
      'Schrittweise Herleitung der Einkommensteuer bei {veranlagung} — links die statische "Liegenbleiben"-Variante (Benutzer dauerhaft arbeitslos), rechts die interaktive "Neue Arbeit"-Variante.',
    pageDisclaimer:
      'Alle Berechnungen folgen dem deutschen Steuerrecht 2026 (EStG, SolzG, SGB V/VI/III, Beitragsbemessungsgrenzen-Verordnung 2026 inkl. Inflationsausgleichsgesetz). Für die Steuerjahre {y1} und {y2} werden mangels separat veröffentlichter Werte dieselben Tarife, Frei- und Pauschbeträge wie für 2026 angewandt.',
    scenarios: {
      liegen: 'Liegenbleiben',
      liegenSubtitle: 'Benutzer durchgehend arbeitslos (kein neuer Job)',
      neue: 'Neue Arbeit',
      neueSubtitle: 'Variabel: Beginn / Monatsbrutto'
    },
    sliders: {
      newJobStartDate: 'Beginn neue Arbeit (Benutzer)',
      monthlyGrossNewJob: 'Monatsbrutto neue Arbeit (Benutzer)',
      severancePaymentDate: 'Zahlungsdatum Abfindung',
      newJobFixedHint: 'Fest aus Eingabe „Neue Arbeit bereits gefunden" — Sweep deaktiviert.'
    },
    veranlagungsart: {
      label: 'Veranlagungsart',
      separate: 'Einzeln',
      joint: 'Zusammen',
      separateLong: 'getrennte Veranlagung',
      jointLong: 'Zusammenveranlagung',
      singleLong: 'Single'
    },
    accordion: {
      year: 'Steuerjahr {year}',
      summary: 'Gesamtsumme ({y1} + {y2})'
    },
    summary: {
      headline: 'Familien-Netto über 2 Jahre',
      headlineSingle: 'Netto-Einkommen über 2 Jahre',
      headlineHint: 'Summe aus Benutzer + Ehepartner, {y1} + {y2} — das Geld, das nach allen Steuern, SV-Beiträgen und Spenden auf dem Konto bleibt.',
      headlineHintSingle: 'Summe {y1} + {y2} — das Geld, das nach allen Steuern, SV-Beiträgen und Spenden auf dem Konto bleibt.',
      verdictNeue: 'Neue Arbeit bringt {amount} mehr Familien-Netto.',
      verdictNeueSingle: 'Neue Arbeit bringt {amount} mehr Netto-Einkommen.',
      verdictLiegen: 'Liegenbleiben wäre um {amount} besser — Neue Arbeit kostet netto.',
      verdictLiegenSingle: 'Liegenbleiben wäre um {amount} besser — Neue Arbeit kostet netto.',
      verdictEven: 'Beide Szenarien sind nahezu gleichwertig (Differenz {amount}).',
      verdictEvenSingle: 'Beide Szenarien sind nahezu gleichwertig (Differenz {amount}).',
      // Detail-Zeile unter der Headline: identische Bewertung wie im Diagramm-Tooltip
      // (Δ Netto ÷ zusätzlich gearbeitete Monate, Schwellen 2.500 / 3.000 € am Median-Vollzeit-Netto orientiert).
      perMonthDetail:
        'Bewertung pro Mehrarbeit: <strong>{perMonth} Ø pro zusätzlich gearbeitetem Monat</strong> ({verdict}). Über {months} Monate Mehrarbeit zwischen {start} und {end} ergeben das insgesamt {delta} mehr Netto. Schwellen (orientiert am Median-Vollzeit-Netto in Deutschland ≈ 2.500 €): ≤ 0 € nicht lohnenswert · 0–2.500 € kaum attraktiv · 2.500–3.000 € normal · ≥ 3.000 € klar attraktiv.',
      breakdown: 'Aufschlüsselung pro Szenario',
      breakdownJointHint:
        'Hinweis (Zusammenveranlagung): Bei der Aufteilung der gemeinsamen Festzus.-ESt + Soli auf Benutzer/Ehepartner wird der gemeinsame Steuerbetrag {proportional} zur jeweiligen Einzel-Tarif-ESt verteilt — nur zur Veranschaulichung der Personenspalten. Der rechtlich verbindliche Wert ist die {familySumme} (rechte Spalte).',
      colYear: 'Jahr',
      colBrutto: 'Brutto-Lohn',
      colAbfindung: 'Abfindung',
      colAlg: 'ALG I',
      colSv: 'SV-Beiträge',
      colSteuer: 'Steuer gesamt',
      colNetto: 'Familien-Netto',
      colNettoSingle: 'Netto-Einkommen',
      colSum: 'Summe {y1}+{y2}',
      colDiff: 'Δ Neue − Liegen',
      scenarioLiegen: 'Liegenbleiben',
      scenarioNeue: 'Neue Arbeit'
    },
    person: {
      user: 'Benutzer',
      spouse: 'Ehepartner'
    },
    groups: {
      zvE: {
        title: 'Gruppe 1: Ermittlung des zu versteuernden Einkommens (zvE)',
        legalBasis: '§ 2 EStG — Umfang der Besteuerung; Begriffsbestimmungen',
        incomeSection: 'Einkünfte',
        deductionSection: 'Sonderausgaben / Abzüge'
      },
      sozialabgaben: {
        title: 'Gruppe 2: Sozialversicherungsbeiträge (Arbeitnehmer-Anteil)',
        legalBasis: 'SGB V/VI/XI/III — monatliche Bemessung mit Beitragsbemessungsgrenzen 2026',
        deductionSection: 'Beiträge'
      },
      est: {
        title: 'Gruppe 3: Einkommensteuer (Einzelveranlagung, Progressionsvorbehalt, Fünftelregelung, Günstigerprüfung) + Solidaritätszuschlag',
        legalBasis: '§§ 32a Abs. 1, 32b, 34, 31, 26a EStG, §§ 1 ff. SolzG — getrennte Veranlagung der Ehegatten',
        deductionSection: 'Zuschläge',
        alternativesSection: 'Hilfsgrößen (Aufschlüsselung & Günstigerprüfung)',
        alternativesHint:
          'Diese Werte fließen NICHT direkt in das Ergebnis (3) ein. 2.1–2.4 dienen der Günstigerprüfung KFB ↔ Kindergeld (§ 31 EStG, Ergebnis: 2.3 > 2.4 ⇒ 2.2 + 2.4, sonst 2.1). 2.5 ist die Aufschlüsselung der bereits in 2.1 enthaltenen Steuer auf die Abfindung (§ 34 EStG).'
      },
      netto: {
        title: 'Gruppe 4: Netto-Einkommen pro Person',
        legalBasis: 'Tatsächlich verfügbares Geld nach SV-Beiträgen, Steuern und freiwilligen Spenden',
        incomeSection: 'Zuflüsse',
        deductionSection: 'Abflüsse'
      }
    },
    steps: {
      // ① Bruttolohn (mit Untergliederung)
      grossWages: {
        title: 'Bruttolohn (alte + neue Arbeit)',
        legalBasis: '§ 19 EStG — Einkünfte aus nichtselbständiger Arbeit'
      },
      // Hinweis: ALG nicht in zvE, nur Progressionsvorbehalt
      arbeitslosengeld: {
        title: 'Arbeitslosengeld I (Progressionsvorbehalt)',
        note: 'ALG I ist steuerfrei und wird NICHT zum zvE addiert. Es erhöht nur den Steuersatz (Progressionsvorbehalt).'
      },
      incomeRelatedExpenses: {
        title: 'Werbungskosten (Arbeitnehmer-Pauschbetrag)',
        legalBasis: '§ 9a Satz 1 Nr. 1 Buchst. a EStG — 1.230 € pro AN mit Arbeitslohn'
      },
      rentalIncomeNet: {
        title: 'Einkünfte aus Vermietung & Verpachtung',
        legalBasis:
          '§ 21 EStG (vereinfacht netto, ohne AfA / weitere Werbungskosten). Sonstige Einkünfte (§ 22 EStG) werden ebenfalls dem Gesamtbetrag der Einkünfte zugerechnet.'
      },
      vorsorge: {
        title: 'Vorsorgeaufwendungen (Sonderausgaben)',
        legalBasis: '§ 10 Abs. 1 Nr. 2 + 3 EStG'
      },
      spenden: {
        title: 'Spenden',
        legalBasis: '§ 10b EStG — bis 20 % des Gesamtbetrags der Einkünfte'
      },
      zvE: {
        title: 'zu versteuerndes Einkommen (zvE, ohne KFB)',
        legalBasis: '§ 2 Abs. 5 EStG — KFB wird erst bei der Günstigerprüfung berücksichtigt'
      },
      kv: {
        title: 'Krankenversicherung (KV-AN)',
        legalBasis: 'GKV: min(Brutto/Monat ; 5.812,50 €) × KV-Satz/2 × Monate — PKV: feste Jahresprämie laut Eingabe (BBG entfällt)'
      },
      pv: {
        title: 'Pflegeversicherung (PV-AN)',
        legalBasis: 'GKV: min(Brutto/Monat ; 5.812,50 €) × 1,80 % (Sachsen 2,30 %) × Monate — PKV: feste Jahresprämie laut Eingabe'
      },
      rv: {
        title: 'Rentenversicherung (RV-AN)',
        legalBasis: 'min(Brutto/Monat ; 8.450,00 €) × 9,30 % × Monate'
      },
      alv: {
        title: 'Arbeitslosenversicherung (ALV-AN)',
        legalBasis: 'min(Brutto/Monat ; 8.450,00 €) × 1,30 % × Monate'
      },
      sozialabgabenGesamt: {
        title: 'Sozialabgaben gesamt (AN-Anteil)',
        legalBasis: '= KV + PV + RV + ALV — keine Beiträge während ALG-I-Bezug'
      },
      // Gruppe 3 — ESt (Einzelveranlagung, per Person)
      tariffIncomeTaxWithoutKFB: {
        title: 'Tarifliche ESt OHNE KFB',
        legalBasis: 'Grundtarif (§ 32a Abs. 1) + ProgrV für eigenes ALG (§ 32b) + Fünftelregelung Abfindung (§ 34)'
      },
      tariffIncomeTaxWithKFB: {
        title: 'Tarifliche ESt MIT KFB-Hälfte',
        legalBasis: 'Wie 2.1, jedoch zvE − 4.878 € pro Kind (KFB-Hälfte)'
      },
      kfbSavings: {
        title: 'Steuerersparnis durch KFB-Hälfte',
        legalBasis: '= 2.1 − 2.2 — direkter Vergleichswert in der Günstigerprüfung'
      },
      childBenefitShare: {
        title: 'Kindergeld-Anteil (Jahr)',
        legalBasis: '129,50 €/Monat × 12 × Kinderzahl — Hälfte je Elternteil; bei KFB-Wahl Hinzurechnung (§ 31 Satz 4)'
      },
      abfindungSteuer: {
        title: 'Auf Abfindung entfallende Steuer',
        legalBasis: '§ 34 EStG — Zusatz nach Fünftelregelung (Aufschlüsselung; bereits in 2.1 / 2.2 enthalten)'
      },
      soli: {
        title: 'Solidaritätszuschlag',
        legalBasis: '§§ 1, 4 SolzG — Freigrenze 19.950 € (Einzel), Milderung 11,9 %, Cap 5,5 %'
      },
      steuerGesamt: {
        title: 'Steuer gesamt',
        legalBasis: '= Festzus. ESt + Soli + Kirchensteuer (8 % BY/BW, sonst 9 % der festzus. ESt; 0 € wenn nicht kirchensteuerpflichtig)'
      },
      // Gruppe 4 — Netto-Einkommen pro Person
      bruttoeinnahmen: {
        title: 'Bruttoeinnahmen (alle Zuflüsse)',
        legalBasis: '= Brutto-Lohn + Abfindung + ALG I + Mieteinnahmen + Kindergeld-Anteil (Hälfte)'
      },
      sozialabgabenAbfluss: {
        title: 'Sozialabgaben (AN-Anteil)',
        legalBasis: 'Bereits in Gruppe 2 ermittelt — wird hier als Geld-Abfluss übernommen'
      },
      steuerGesamtAbfluss: {
        title: 'Steuer gesamt (ESt + Soli)',
        legalBasis: 'Bereits in Gruppe 3 ermittelt — wird hier als Geld-Abfluss übernommen'
      },
      spendenAbfluss: {
        title: 'Spenden (tatsächlich gezahlt)',
        legalBasis: 'Freiwillige Ausgabe; bereits als Sonderausgabe in Gruppe 1 (0.5) berücksichtigt'
      },
      nettoEinkommen: {
        title: 'Netto-Einkommen pro Person',
        legalBasis: '= Zuflüsse − Abflüsse — das, was am Jahresende tatsächlich auf dem Konto verbleibt'
      }
    },
    // 模板中固定显示的小标签 / 副行
    abfindungBoxTitle: 'Abfindung (§ 34 EStG, Fünftelregelung)',
    nettoSuffix: 'Netto',
    childUnit: { one: 'Kind', many: 'Kinder' },
    // Popover 内容：formula 数组 = 公式说明（无参数），detail 数组 = 数字代入（带 {var} 占位符）
    popover: {
      vorsorge: {
        formula: [
          'Vorsorgeaufwendungen = RV-AN + KV-AN × 0,96 + PV-AN',
          '',
          '   RV-AN: zu 100 % als Basisaltersvorsorge abzugsfähig (§ 10 Abs. 1 Nr. 2 EStG, seit 2023 voll)',
          '   KV-AN: nur 96 % (4 % Krankengeld-Anteil nicht abzugsfähig, § 10 Abs. 1 Nr. 3 Satz 4 EStG)',
          '   PV-AN: zu 100 % abzugsfähig (§ 10 Abs. 1 Nr. 3 Buchst. a EStG)',
          '   ALV-AN: NICHT als Sonderausgabe abzugsfähig (nur „sonstige Vorsorge" im Pauschbetrag)',
          '',
          'Höchstbetragsprüfung wird hier vereinfacht weggelassen (für die hier vorliegenden Einkommen unkritisch).'
        ],
        detail: [
          'RV-AN              = {rv}            (× 100 %)',
          'KV-AN              = {kv}',
          'KV-AN × 0,96       = {kvDeduct}',
          'PV-AN              = {pv}            (× 100 %)',
          '',
          '→ Vorsorgeabzug   = {rv} + {kvDeduct} + {pv}',
          '                  = {total}'
        ]
      },
      fuenftel: {
        head: ['zvE_ord (ohne Abfindung) = {zvEord}', 'Abfindung                = {abfindung}', 'ALG (§ 32b)              = {alg}'],
        progrVWithAlg: ['ProgrV-Satz = ESt({sumPlain})/{sumPlain} = {ratePct} %', 'Sockel-ESt  = {ratePct} % × {zvEordPlain} = {sockel}'],
        progrVWithoutAlg: ['Sockel-ESt  = Grundtarif({zvEordPlain}) = {sockel}'],
        fuenftelWithAbf: [
          '1/5 Abfindung      = {fuenftelBetrag}',
          'ESt(zvE_ord + 1/5) = {estMitFuenftel}',
          'Zusatz § 34       = 5 × ({estMitPlain} − {sockelPlain}) = {zusatz}',
          '→ ESt = Sockel + Zusatz = {total}'
        ],
        fuenftelWithoutAbf: ['→ ESt = Sockel (keine Abfindung) = {sockel}']
      },
      tariffIncomeTaxWithoutKFB: {
        formula: [
          'tarifliche ESt = ESt(zvE_ord) + 5 × [ ESt(zvE_ord + Abfindung/5) − ESt(zvE_ord) ]',
          '   (§ 34 Abs. 1 EStG, Fünftelregelung)',
          '',
          'zvE_ord ist das ordentliche zvE OHNE Abfindung. Die Abfindung wird durch',
          'die Fünftelregelung separat behandelt und nur als Zusatzbetrag aufgeschlagen.',
          '',
          'ESt(·) mit ProgrV § 32b: bes. Steuersatz = Grundtarif(zvE+ALG) / (zvE+ALG)',
          'Grundtarif: Grundfreibetrag 12.348 €, danach 4 Zonen (§ 32a Abs. 1 EStG)'
        ]
      },
      tariffIncomeTaxWithKFB: {
        formula: ['Wie 2.1, jedoch zvE → zvE − KFB-Hälfte', 'KFB-Hälfte = 4.878 € × Kinderzahl   (§ 32 Abs. 6 EStG, hier: {childCount} {childWord})'],
        detailPrefix: ['KFB-Hälfte             = {kfbHalf}', 'zvE_ord − KFB-Hälfte   = {zvEminusKfb}', '']
      },
      kfbSavings: {
        formula: ['KFB-Steuerersparnis = ESt(2.1) − ESt(2.2)', 'Das ist der direkte Vergleichswert zur Kindergeld-Hälfte (§ 31 EStG).'],
        detail: ['2.1: {est21}', '2.2: {est22}', '→   {savings}']
      },
      childBenefitShare: {
        formula: ['Kindergeld-Anteil = (259 € / 2) × 12 × Kinderzahl   (§ 31 EStG, hälftige Aufteilung bei Einzelveranlagung)'],
        detail: ['{kgHalf} €/Monat', '× 12 Monate × {childCount} {childWord}', '= {result}']
      },
      abfindungSteuer: {
        formula: [
          'Auf die Abfindung entfallende Steuer = Zusatz nach § 34 EStG',
          '   = 5 × [ ESt(zvE_ord + Abfindung/5) − ESt(zvE_ord) ]',
          '',
          'Effektiver Steuersatz auf Abfindung = Zusatz / Abfindung',
          '',
          'Referenz: KFB-freie Variante (wie 2.1) — entspricht der Sicht der',
          'Lohnsteuerbescheinigung. Hängt stark vom Auszahlungsjahr ab:',
          'In einem Jahr mit niedrigem zvE_ord (z. B. nach Liegenbleiben)',
          'startet die 1/5-Berechnung in einer flacheren Tarifzone → niedrigerer',
          'effektiver Steuersatz auf die Abfindung.',
          '',
          'Wert NICHT in Ergebnis (3) addieren — er ist bereits in 2.1 / 2.2 enthalten.',
          'Diese Zeile dient nur zur Aufschlüsselung „wie viel Steuer kostet die Abfindung?".'
        ],
        noAbfindung: 'keine Abfindung in diesem Jahr',
        detail: [
          'Abfindung           = {abfindung}',
          '1/5 Abfindung       = {fuenftel}',
          '',
          'Sockel-ESt(zvE_ord)            = {sockel}',
          'ESt(zvE_ord + 1/5 Abfindung)   = {mitFuenftel}',
          'Zusatz § 34 = 5 × ({mitPlain} − {sockelPlain})',
          '            = {zusatz}',
          '',
          '→ effektiver Steuersatz auf Abfindung',
          '   = {zusatzPlain} / {abfindungPlain}',
          '   = {ratePct} %'
        ]
      },
      soli: {
        formula: [
          'Solidaritätszuschlag (Einzelveranlagung 2026):',
          '',
          '   Wenn festzus. ESt ≤ 19.950 €  → Soli = 0 €  (Freigrenze)',
          '',
          '   Sonst: Soli = min( 5,5 % × ESt ; 11,9 % × (ESt − 19.950) )',
          '          (Milderungszone bis 33.912 €; ab dann greift der Cap 5,5 % × ESt)',
          '',
          'Berechnungsbasis ist die festzus. ESt aus der Günstigerprüfung (3 ohne Soli).',
          'Kirchensteuer entfällt: beide Personen laut Stammdaten kirchensteuerfrei.'
        ],
        detailBelowFreigrenze: ['festzus. ESt = {est}', '→ ≤ Freigrenze {freigrenze}', '→ Soli = 0 €'],
        detailAboveFreigrenze: [
          'festzus. ESt = {est}',
          '',
          'Cap (5,5 %)        = {soliRate} % × {estPlain} = {cap}',
          'Milderungszone     = {milderungRate} % × ({estPlain} − {freigrenzePlain})',
          '                   = {milderung}',
          '',
          '→ Soli = min({capPlain}, {milderungPlain}) = {soli}',
          '   ({chosen})'
        ],
        capWins: 'Cap 5,5 % greift',
        milderungActive: 'Milderungszone aktiv'
      },
      steuerGesamt: {
        formula: [
          'Steuer gesamt (3) = festzus. ESt + Soli (2.6)',
          '   festzus. ESt entstammt der Günstigerprüfung § 31 EStG (siehe unten),',
          '   Soli wird in 2.6 separat ausgewiesen.',
          '',
          'Günstigerprüfung § 31 EStG (per Person bei Einzelveranlagung):',
          '',
          'Hintergrund: Kindergeld und Kinderfreibetrag (KFB) sind ALTERNATIVEN, sie werden NIE',
          'gleichzeitig gewährt. Während des Jahres zahlt die Familienkasse das Kindergeld bereits',
          'monatlich aus. Am Jahresende prüft das Finanzamt, welche Variante für die Familie',
          'günstiger ist:',
          '',
          '   Variante A — nur Kindergeld:',
          '      ESt        = 2.1 (ohne KFB)',
          '      Kindergeld bleibt vollständig in der Familie',
          '      → real an FA gezahlt = 2.1',
          '',
          '   Variante B — KFB + Hinzurechnung des Kindergelds:',
          '      ESt        = 2.2 (mit KFB → niedriger)',
          '      + 2.4      Kindergeld wird zur ESt HINZUGERECHNET (nicht versteuert!),',
          '                 damit es nicht zusätzlich zum KFB-Vorteil "doppelt" gewährt wird.',
          '                 Das Geld bleibt physisch in der Familie — auf der Steuerrechnung',
          '                 wird es nur "verrechnet".',
          '      → real an FA gezahlt = 2.2 + 2.4',
          '',
          'Vergleich (mathematisch äquivalent):',
          '   2.3 (= 2.1 − 2.2, Steuerersparnis durch KFB)  vs.  2.4 (Kindergeld)',
          '   Wenn 2.3 > 2.4 → KFB günstiger → festzus. ESt = 2.2 + 2.4',
          '   sonst         → Kindergeld günstiger → festzus. ESt = 2.1',
          '',
          'Wichtig: Kindergeld wird in keiner Variante als steuerpflichtiges Einkommen behandelt.',
          'In Variante B ist die "+ 2.4" lediglich die Hinzurechnung der bereits ausgezahlten',
          'Familienleistung, um Doppelförderung zu verhindern.'
        ],
        detailKfbWins: [
          'Vergleich:',
          '   2.3 KFB-Ersparnis  = {kfbSavings}',
          '   2.4 Kindergeld    = {childBenefitShare}',
          '   → KFB günstiger um {kfbDiff}',
          '',
          'Variante B (gewählt) — KFB + Hinzurechnung:',
          '   2.2 ESt mit KFB           = {est22}',
          '   + 2.4 Hinzurechnung KG    = {childBenefitShare}',
          '   = festzus. ESt           = {assessedIncomeTax}',
          '   + 2.6 Soli                = {soli}',
          '   + Kirchensteuer           = {kirchensteuer}',
          '   = Steuer gesamt          = {total}',
          '',
          'Vergleich zur Variante A: A hätte {est21} gekostet',
          '→ Familie spart {savings} gegenüber Variante A.',
          '',
          'Hinweis: Die {childBenefitShare} Kindergeld bleiben physisch im Konto.',
          'Sie werden hier nur in der Steuerrechnung verrechnet, NICHT versteuert.'
        ],
        detailKindergeldWins: [
          'Vergleich:',
          '   2.3 KFB-Ersparnis  = {kfbSavings}',
          '   2.4 Kindergeld    = {childBenefitShare}',
          '   → Kindergeld günstiger um {kgDiff}',
          '',
          'Variante A (gewählt) — nur Kindergeld:',
          '   2.1 ESt ohne KFB          = {est21}',
          '   = festzus. ESt           = {assessedIncomeTax}',
          '   + 2.6 Soli                = {soli}',
          '   + Kirchensteuer           = {kirchensteuer}',
          '   = Steuer gesamt          = {total}',
          '',
          'Kindergeld {childBenefitShare} bleibt vollständig in der Familie',
          '(keine Hinzurechnung, da kein KFB beansprucht wurde).'
        ],
        notes: {
          kfbWinsBadge: 'KFB günstiger → 2.2 + 2.4 = {est22} + {kg}',
          kindergeldWinsBadge: 'Kindergeld günstiger → nimmt 2.1 (Kindergeld {kg} bleibt)'
        }
      },
      bruttoeinnahmen: {
        formula: [
          'Bruttoeinnahmen = Brutto-Lohn + Abfindung + ALG I + Mieteinnahmen (V&V) + Kindergeld-Anteil',
          '',
          '   Brutto-Lohn       — alte + neue Tätigkeit (vor SV/Steuer)',
          '   Abfindung         — einmalig im Auszahlungsjahr (§ 34 EStG: Fünftelregelung nur steuerlich)',
          '   ALG I             — Auszahlung der Agentur für Arbeit (steuerfrei, ProgrV § 32b)',
          '   Mieteinnahmen     — V&V netto (vereinfacht)',
          '   Kindergeld-Anteil — Hälfte je Elternteil (129,50 € × 12 × Kinderzahl / 2)',
          '',
          'Hinweis: Kindergeld wird hier als Cash-Zufluss berücksichtigt — unabhängig davon,',
          'ob steuerlich KFB oder Kindergeld günstiger war (siehe Gruppe 3).'
        ],
        detail: [
          'Brutto-Lohn        = {brutto}',
          'Abfindung          = {abfindung}',
          'ALG I              = {alg}',
          'Mieteinnahmen V&V  = {vuv}',
          'Kindergeld-Anteil  = {kindergeld}',
          '',
          '→ Bruttoeinnahmen  = {sum}'
        ]
      },
      nettoEinkommen: {
        formula: [
          'Netto-Einkommen = Bruttoeinnahmen − (Sozialabgaben + Steuer gesamt + Spenden)',
          '',
          'Das ist der reale Geldbetrag, der pro Person am Jahresende übrig bleibt.',
          'Familien-Netto = Summe aus Benutzer + Ehepartner.'
        ],
        detail: [
          'Zuflüsse           = {zuflusse}',
          '   Brutto-Lohn      {brutto}',
          '   Abfindung        {abfindung}',
          '   ALG I            {alg}',
          '   V&V              {vuv}',
          '   Kindergeld       {kindergeld}',
          '',
          'Abflüsse           = {abflusse}',
          '   Sozialabgaben    {sv}',
          '   Steuer gesamt    {steuer}',
          '   Spenden          {spenden}',
          '',
          '→ Netto = {zuflusse} − {abflusse} = {netto}'
        ]
      }
    }
  }
} as const;
