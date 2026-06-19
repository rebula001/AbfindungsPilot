# 09 - Abschlussaudit Berechnungslogik

Stand: 2026-06-19  
Quelle: konsolidiert aus dem temporären Auditbericht vom 2026-06-19.

## Zweck

Dieses Dokument fasst den letzten fachlichen Audit der Steuer- und Sozialversicherungslogik zusammen. Es ersetzt nicht [03 - Berechnungs-Engine](./03-calculation-engine.md), sondern hält fest:

- welche Punkte geprüft wurden,
- welche Punkte als Produktannahme gelten,
- welche Punkte bereits korrigiert wurden,
- welche Grenzen bewusst im Produkt bleiben.

## Gesamtergebnis

Die Kernlogik ist nach dem Audit für den Produktzweck geeignet: eine nicht verbindliche, nachvollziehbare Schätzung von Nettoeffekten rund um Abfindung, ALG I, neues Einkommen und Sozialabgaben. Die App ist weiterhin kein Ersatz für Steuerberater, Finanzamt, Lohnabrechnung oder Krankenkassenbescheid.

Der wichtigste Designrahmen bleibt: Das zweite Prognosejahr nutzt bewusst die 2026er Parameter. Das ist keine fachliche Aussage über die spätere Rechtslage, sondern eine konservative Projektion, solange die tatsächlichen 2027er Werte noch nicht als Produktgrundlage verwendet werden.

## Validierung

Im Auditlauf wurde zuletzt ausgeführt:

```bash
cmd.exe /d /c "cd frontend && npm run build"
```

Der Lauf war erfolgreich. Damit waren `eslint`, `prettier --check`, `i18n:check`, `vue-tsc -b` und `vite build` abgedeckt. Zusätzlich wurde `git diff --check -- . ':(exclude)frontend/public/font-roboto/OFL.txt'` ohne Whitespace-Fehler ausgeführt.

Der frühere TypeScript-Fehler in `CalculationView.vue` und `CalculationGroup.vue` wurde behoben, indem die Anzeige-Typen für Berechnungsschritte in `frontend/src/types/calculationSteps.ts` vereinheitlicht wurden.

## Produktannahmen

| Thema                                 | Entscheidung                                                                                                      | Konsequenz                                                                   |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Prognosejahr nach dem Entlassungsjahr | Verwendet weiterhin 2026er Steuer- und Sozialversicherungswerte                                                   | Ergebnisse für 2027 sind Projektionen, keine tatsächliche 2027er Veranlagung |
| Abfindung und § 34 EStG               | Der Produktbegriff "Abfindung" meint eine Entlassungsentschädigung, die die Fünftelregelung grundsätzlich erfüllt | Keine zusätzliche UI-Prüfung für Entschädigung/Zusammenballung               |
| Kirchensteuer bei Familie             | Ehepartner gelten im Modell als gleich kirchensteuerpflichtig oder gleich nicht kirchensteuerpflichtig            | Keine Modellierung "nur ein Ehepartner zahlt Kirchensteuer"                  |
| Ergebnisart                           | Jahresbasierte Einkommensteuer-/Cashflow-Schätzung                                                                | Keine monatliche Lohnsteuerabrechnung, keine amtliche Steuererklärung        |

## Auditstatus

| Bereich                           | Status                | Ergebnis                                                                                                                                            |
| --------------------------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| § 32a EStG 2026 und Splitting     | Bestätigt             | Grundtarif, Splitting-Verfahren und Kinderwerte sind in der Basislogik plausibel umgesetzt.                                                         |
| Kindergeld/KFB und § 31 EStG      | Bestätigt mit Grenze  | Günstigerprüfung ist grundsätzlich korrekt. KFB/BEA-Übertragungen bleiben außerhalb des Modells.                                                    |
| Solidaritätszuschlag 2026         | Korrigiert            | Freigrenzen wurden auf 20.350 EUR / 40.700 EUR aktualisiert; Übergangsbereich wird über die 11,9-Prozent-Regel begrenzt.                            |
| Pflegeversicherung                | Korrigiert            | Kinderlosenzuschlag, Kinderabschläge für mehrere Kinder unter 25 und Sachsen-Sonderfall werden berücksichtigt.                                      |
| § 32b EStG ALG I                  | Korrigiert            | Nicht genutzter Arbeitnehmer-Pauschbetrag wird vor dem Progressionsvorbehalt vom ALG I abgezogen.                                                   |
| § 34 Abs. 1 Satz 3 EStG           | Korrigiert            | Negative ordinary zvE mit positiver Gesamtbemessung wird über die Sonderformel behandelt.                                                           |
| Alleinerziehende nach § 24b EStG  | Korrigiert mit Grenze | Single + Kinder kann "alleinerziehend" erfassen; KFB/BEA-Übertragungen bleiben nicht modelliert.                                                    |
| Sonderausgaben-Pauschbetrag       | Korrigiert            | 36 EUR pro realem Steuerpflichtigen, bei Zusammenveranlagung faktisch 72 EUR, fließen in die allgemeinen Sonderausgaben ein.                        |
| ALG-I Anspruchsdauer              | Korrigiert            | Anspruchsdauer nutzt Alter plus versicherungspflichtige Monate in den letzten 5 Jahren nach § 147 SGB III.                                          |
| Soli/Kirchensteuer-Basis          | Korrigiert mit Grenze | Zuschlagsteuern verwenden die § 51a EStG-Basis mit Kinderfreibetrag. Kappung, besonderes Kirchgeld und gemischte Ehepartnerfälle bleiben außerhalb. |
| GKV/PV nach ALG-I-Ende            | Teilweise modelliert  | Freiwillige GKV/PV-Selbstzahlung wegen durch Abfindung blockierter Familienversicherung wird konservativ geschätzt.                                 |
| PKV, BA-Zuschuss, Midijob/Minijob | Außerhalb             | Bleibt eine bewusst dokumentierte Vereinfachung.                                                                                                    |

## Wichtige Rechenkorrekturen

### Solidaritätszuschlag 2026

Die 2026er Soli-Freigrenzen sind nicht die 2025er Werte. Korrigiert wurden:

- single: 20.350 EUR Einkommensteuer-Bemessungsgrundlage,
- joint: 40.700 EUR Einkommensteuer-Bemessungsgrundlage,
- vollständiger 5,5-Prozent-Soli ungefähr ab 37.839 EUR / 75.678 EUR.

### Pflegeversicherung

Die PV-AN-Berechnung berücksichtigt jetzt:

- Kinderlosenzuschlag bei typisierend `age >= 23`,
- Abschläge für das 2. bis 5. Kind unter 25,
- Sachsen-Sonderfall während Beschäftigung,
- keinen Sachsen-AN/AG-Split in der freiwilligen Selbstzahlerphase nach ALG I.

Grenze: Da kein Geburtsmonat erfasst wird, kann der genaue Monat des 23. Geburtstags nicht tagesgenau abgebildet werden.

### ALG I und Progressionsvorbehalt

ALG I geht nicht mehr brutto in § 32b EStG ein, wenn der Arbeitnehmer-Pauschbetrag im jeweiligen Steuerjahr noch nicht vollständig durch Arbeitslohn verbraucht wurde. Die App berechnet den ungenutzten Anteil personenbezogen und zieht ihn vor dem Progressionsvorbehalt ab.

### § 34 EStG bei negativem ordinary zvE

Wenn das verbleibende zu versteuernde Einkommen ohne Abfindung negativ ist, die Summe mit Abfindung aber positiv wird, nutzt die App die Satz-3-Logik:

```text
5 * ESt((ordinary zvE + Abfindung) / 5)
```

### GKV/PV-Selbstzahlung nach ALG I

Für hohe Abfindungen kann § 10 SGB V die Familienversicherung nach ALG-I-Ende blockieren. Die App schätzt deshalb eine freiwillige GKV/PV-Selbstzahlung für Monate, in denen alle Bedingungen gleichzeitig erfüllt sind:

- ALG I ist beendet,
- keine neue Beschäftigung im Szenario,
- Abfindung blockiert rechnerisch noch die Familienversicherung,
- die Person ist gesetzlich versichert.

Die Bemessungsgrundlage ist `min(letztes Monatsbrutto, KV/PV-BBG)`. Falls kein letztes Monatsbrutto eingegeben wurde, wird es aus dem alten Jahresbrutto und den vollständig gearbeiteten Monaten bis zur Arbeitslosigkeit abgeleitet. Die Anzeige zeigt deshalb getrennt:

- letztes Monatsbrutto oder abgeleiteten Durchschnitt,
- Beitragsbemessungsgrenze,
- tatsächliche Bemessungsgrundlage,
- monatliche Selbstzahlung mal Anzahl der betroffenen Monate.

In dieser Selbstzahlerphase entstehen nicht automatisch Renten- oder Arbeitslosenversicherungsbeiträge.

## Verbleibende Grenzen

- KFB/BEA-Übertragungen bei getrennt lebenden Eltern sind nicht modelliert.
- Besonderes Kirchgeld, Kirchensteuer-Kappung und gemischte Ehepartner-Kirchensteuer werden nicht modelliert.
- PKV in ALG-I-Zeiten inklusive Bundesagentur-Zuschuss bleibt vereinfacht.
- Bürgergeld, Midijob/Minijob, Kapitalerträge, Riester/Rürup, Vermietung und Verpachtung mit Detailkosten/AfA sind außerhalb.
- Die GKV/PV-Selbstzahlung nach ALG I ist eine konservative Schätzung, kein Krankenkassenbescheid. Mindestbemessung, weitere Einnahmen und individuelle Krankenkassenprüfung können abweichen.
- Steuerklasse/Faktor beeinflusst im Modell nicht die Jahres-Einkommensteuer. Das ist für eine Jahresveranlagung plausibel, aber nicht für Lohnabrechnung.

## Empfohlene nächste Absicherungen

1. Golden Tests für die Engine ergänzen: single/family, getrennt/gemeinsam, Abfindung im selben Jahr/folgenden Jahr, ALG-only-Jahr, Soli-Grenzbereich, PV mit 0/1/mehreren Kindern, § 34 Satz 3, GKV/PV-Selbstzahlerphase.
2. Für KFB/BEA-Übertragung entweder eine klare UI-Grenzerklärung ergänzen oder das Thema später gezielt modellieren.
3. Sobald belastbare 2027er Werte als Produktbasis verwendet werden sollen, die zentrale Konstantendatei und diese Auditnotiz aktualisieren.

## Referenznormen

- EStG: §§ 9a, 10, 10b, 10c, 24b, 31, 32, 32a, 32b, 34, 51a, 66
- SolzG 1995: §§ 3, 4, 6
- SGB III: § 147
- SGB V: §§ 10, 240, 241, 242, 243
- SGB XI: §§ 55, 58

## Jahreswechsel-Checkliste 2027/2028

Wenn die App später nicht mehr bewusst mit 2026er Werten rechnen soll, sondern 2027 und 2028 fachlich abbilden soll, müssen mindestens die folgenden Werte und Texte geprüft werden. Zentrale Startpunkte sind `frontend/src/calculation/constants.ts`, `frontend/src/i18n/de.ts`, `frontend/src/i18n/zh.ts`, `frontend/src/views/InputView.vue`, `frontend/src/views/CalculationView.vue` und die Berechnungsdokumentation unter `.dev-docs/de` / `.dev-docs/zh`.

| Bereich                                        | Prüfen / aktualisieren                                                                                                                                                                                                                                   | Code- und Textstellen                                                                                                                                                                                                                     |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Einkommensteuertarif § 32a EStG                | Grundfreibetrag, Zonengrenzen, Koeffizienten der Progressionszonen, Proportionalzonen, Reichensteuergrenze, Rundungsregeln; Splitting bleibt formal `2 * Grundtarif(zvE / 2)`, aber mit den neuen Grundtarifwerten.                                      | `constants.ts` `GRUNDFREIBETRAG_2026`, `TARIF_*_2026`; `engine.ts` `grundtarifESt`; i18n-Formeltexte mit "Grundfreibetrag 12.348 €"                                                                                                       |
| Arbeitnehmer- und Sonderausgaben-Pauschbeträge | Arbeitnehmer-Pauschbetrag § 9a, Sonderausgaben-Pauschbetrag § 10c, Spendenhöchstgrenze § 10b falls geändert.                                                                                                                                             | `ARBEITNEHMER_PAUSCHBETRAG`, `SONDERAUSGABEN_PAUSCHBETRAG_*`, `SPENDEN_HOECHSTGRENZE_RATE`; Rechentexte in i18n                                                                                                                           |
| Kinder / Familie                               | Kinderfreibetrag und BEA je Kind, halber KFB, Kindergeld pro Monat, § 24b Entlastungsbetrag für Alleinerziehende inklusive Erhöhungsbetrag je weiterem Kind.                                                                                             | `KFB_FULL_PER_CHILD_2026`, `KFB_HALF_PER_CHILD_2026`, `KINDERGELD_PER_MONTH_PER_CHILD_2026`, `ENTLASTUNGSBETRAG_ALLEINERZIEHENDE_*`; `InputView.vue` Default `childBenefitMonthlyPerChild`; i18n-Texte mit 259 €, 9.756 €, 4.260 €, 240 € |
| Solidaritätszuschlag                           | Freigrenzen single/joint, Milderungszonen-Obergrenzen, Soli-Satz 5,5 %, Milderungsrate 11,9 %, § 51a-Bemessungsgrundlage.                                                                                                                                | `SOLI_FREIGRENZE_*`, `SOLI_OBERGRENZE_*`, `SOLI_RATE`, `SOLI_MILDERUNGSZONE_RATE`; `engine.ts` `calcSoli*`; `CalculationView.vue`; i18n-Soli-Formeln                                                                                      |
| Kirchensteuer                                  | Landessteuersätze 8 % Bayern/Baden-Württemberg und 9 % andere Länder; prüfen, ob Länderrecht, Kappung oder besonderes Kirchgeld für den Produktumfang relevant werden soll.                                                                              | `KIST_RATE_BY_BW`, `KIST_RATE_OTHER`, `kirchensteuerRate`; i18n-Tooltip `churchTaxInfoTooltip`                                                                                                                                            |
| Sozialversicherung-BBG                         | KV/PV-BBG monatlich und jährlich, RV/ALV-BBG monatlich und jährlich; prüfen, ob regionale Unterschiede wieder relevant werden.                                                                                                                           | `BBG_KV_PV_MONTHLY_2026`, `BBG_RV_ALV_MONTHLY_2026`; i18n-Texte mit 5.812,50 €, 8.450 €, 69.750 €, 101.400 €                                                                                                                              |
| Krankenversicherung                            | Allgemeiner Beitragssatz, ermäßigter Beitragssatz, durchschnittlicher Zusatzbeitrag und UI-Default für Zusatzbeitrag; JAEG/Jahresarbeitsentgeltgrenze. Der Nutzer kann den Zusatzbeitrag überschreiben, aber Default und Tooltip sollten zusammenpassen. | `ALLGEMEINER_KV_RATE`, `ERMAESSIGTER_KV_RATE`; `InputView.vue` Default `healthInsuranceAdditionalRate` und feste Anzeige `14.6`; i18n-Texte mit 14,60 %, 14,0 %, Durchschnitt Zusatzbeitrag, JAEG 73.800 €                                |
| Pflegeversicherung                             | Gesamtbeitrag mit Kind, AN-Anteil, Sachsen-Abweichung, Kinderlosenzuschlag, Abschlag je Kind unter 25, maximale Kinderzahl für Abschlag, Altersgrenze für Kinderlosenzuschlag.                                                                           | `PV_RATE_TOTAL_WITH_CHILD`, `PV_RATE_AN_WITH_CHILD`, `PV_RATE_AN_WITH_CHILD_SACHSEN`, `PV_CHILDLESS_SURCHARGE_RATE`, `PV_CHILD_DISCOUNT_RATE`, `PV_CHILD_DISCOUNT_MAX_CHILDREN`; i18n-PV-Texte                                            |
| Renten- und Arbeitslosenversicherung           | RV-AN-Satz, ALV-AN-Satz, Parität, Beitragsbemessungsgrenzen; prüfen, ob freiwillige Phasen weiterhin keine RV/ALV-Pflicht auslösen sollen.                                                                                                               | `RV_RATE_AN`, `ALV_RATE_AN`; i18n-Texte mit 9,30 %, 1,30 %, 2,60 %                                                                                                                                                                        |
| Vorsorgeaufwendungen § 10 EStG                 | Höchstbetrag Basisaltersvorsorge, 100-%-Abzug RV, 96-%-Ansatz Beschäftigungs-GKV, 100-%-Ansatz selbst gezahlter KV ohne Krankengeldanspruch, PV-Abzug, ALV-Nichtabzug.                                                                                   | `VORSORGE_BASIS_HOECHSTBETRAG_2026`, `VORSORGE_KV_KRANKENGELD_ABSCHLAG`; `calcPensionExpenseDeduction`; i18n-Vorsorgeformeln                                                                                                              |
| ALG I                                          | § 147 SGB III Anspruchsdauer-Tabelle, Anwartschaftszeit, Sperrzeit-/Ruhezeit-Logik, Leistungsformel in Tooltips inklusive 60 % / 67 % und pauschaler Sozialabgabenabzug.                                                                                 | `inputAdapter.ts` `deriveAlgDurationMonths`; `InputView.vue` `deriveAlgDurationMonthsByInsurance`; i18n-ALG-Texte                                                                                                                         |
| ALG-I-Ende und GKV/PV-Selbstzahlung            | § 10 SGB V Familienversicherung bei Entlassungsentschädigung, § 240 SGB V beitragspflichtige Einnahmen, ermäßigter KV-Satz, Mindestbemessung und Krankenkassenpraxis prüfen.                                                                             | `calcPersonIncome` Selbstzahlersegment; `calcSvAnteil`; i18n-KV/PV-Popovertexte; Dokumentation in `03-calculation-engine.md`                                                                                                              |
| Fünftelregelung / Zuschlagsteuern              | Prüfen, ob § 34 EStG, § 32b EStG und § 51a EStG strukturell unverändert sind; besonders Satz-3-Sonderfall, ALG-I-Pauschbetragsabzug und KFB-Basis für Soli/KiSt.                                                                                         | `tariffEstWithFuenftelAndProgrV`, `estWithProgressionsvorbehalt`, `computePersonTax`, `computeJointTax`; i18n-Berechnungserläuterungen                                                                                                    |
| Hardcoded Jahres- und Beispieltexte            | Alle Texte mit "2026", Beispieltermine 01.08.2026, Fallbackdaten 2026/2027, Disclaimer und Diagrammhinweise aktualisieren.                                                                                                                               | `rg -n -e "2026" -e "2027" -e "12\\.348" -e "259" -e "5\\.812" -e "8\\.450" -e "20\\.350" -e "40\\.700" frontend/src .dev-docs`                                                                                                           |
| Tests und Plausibilisierung                    | Golden Tests mit neuen Jahreswerten aktualisieren: single/family, separate/joint, Abfindung im selben Jahr/Folgejahr, ALG-only-Jahr, Soli-Grenzbereich, PV-Kinderfälle, § 34 Satz 3, GKV/PV-Selbstzahlerphase.                                           | Testdateien ergänzen; danach `npm run build`, `npm run i18n:check`, `git diff --check`                                                                                                                                                    |

Wichtig: Wenn nur einzelne Zahlen geändert werden, aber die Konstantennamen weiter `_2026` heißen, bleibt die Codebasis schwer wartbar. Für echte 2027/2028-Unterstützung sollte entweder die feste 2026-Logik bewusst umbenannt werden oder ein jahresparametrisches Konstantenmodell eingeführt werden.
