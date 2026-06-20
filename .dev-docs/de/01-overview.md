# 01 - Überblick

> **In 30 Sekunden:** Das deutsche Steuerrecht ist für Normalbürger eine Black Box. Diese Browser-App löst die zwei wichtigsten Schmerzpunkte rund um eine **Abfindung** aus einem Aufhebungsvertrag - und zeigt jeweils per Vergleichsrechnung in Echtzeit, welche Variante netto am meisten übrig lässt.

## Die zwei Schmerzpunkte

### Schmerzpunkt 1 - In welchem Jahr soll die Abfindung ausgezahlt werden?

Beim Unterzeichnen eines Aufhebungsvertrags steht oft die Wahl im Raum: **Auszahlung noch im laufenden Jahr** oder **Verschiebung auf das Folgejahr**. Die App vergleicht beide Auszahlungstermine über die zwei betroffenen Steuerjahre und zeigt direkt, welche Variante mehr Netto übrig lässt - meistens entscheidend wegen der **Fünftelregelung (§ 34 EStG)**, die nur dann greift, wenn das übrige zvE im Auszahlungsjahr niedrig ist.

### Schmerzpunkt 2 - Wann und mit welchem Gehalt zurück in den Job?

Wenn der neue Arbeitsvertrag noch offen ist (Startdatum unklar, Verhandlungs-Range beim Brutto), ist es schwer zu sagen, welche Kombination aus **Eintrittstermin** und **Monatsbrutto** wirklich am attraktivsten ist - weil ALG-I-Bezug, Progressionsvorbehalt (§ 32b EStG), SV-Beiträge, eine mögliche GKV/PV-Selbstzahlung nach ALG-I-Ende und der Wegfall der Fünftelregelungs-Wirkung gleichzeitig spielen. Die App durchrechnet das Kreuzprodukt aus Startdaten und Monatsbrutto-Stufen und plottet alle Familien-Netto-Werte als Diagramm - so wird sofort sichtbar, ab welchem Brutto sich ein früher Wiedereinstieg lohnt und ab wann es egal wird.

## Warum das nicht trivial ist

Vier Effekte greifen ineinander, jede Stellschraube verändert mehrere davon gleichzeitig:

- **§ 34 EStG (Fünftelregelung)** glättet die Abfindung tariflich, aber nur effektiv bei niedrigem übrigen zvE im Auszahlungsjahr
- **§ 32b EStG (Progressionsvorbehalt)** hebt den Steuersatz durch ALG-I-Bezug an
- **§ 10 SGB V / § 240 SGB V** können nach ALG-I-Ende zu freiwilliger GKV/PV-Selbstzahlung führen, wenn eine Abfindung die Familienversicherung blockiert
- **§ 31 EStG (KFB vs. Kindergeld)** ist Veranlagungsart-abhängig
- **Splittingtarif (§ 32a Abs. 5)** vs. Einzelveranlagung kann mehrere Tausend Euro Unterschied bedeuten

Deshalb rechnet die App alle relevanten Kombinationen über zwei Steuerjahre durch und visualisiert sie - anstatt den Nutzer raten zu lassen.

## Kernszenarien

Die App vergleicht für jedes der zwei betrachteten Steuerjahre **zwei Szenarien**:

| Szenario                             | Bedeutung                                                                                           |
| ------------------------------------ | --------------------------------------------------------------------------------------------------- |
| **`stayUnemployed`** (Liegenbleiben) | User bezieht ALG I bis zur maximalen Anspruchsdauer (§ 147 SGB III) und nimmt keine neue Arbeit auf |
| **`newJob`** (Neue Arbeit)           | User beginnt zu `newJobStartDate` einen neuen Job mit `monthlyGrossNewJob`                          |

Variabel sind drei **Slider** (rechte Spalte der `CalculationView`):

1. `severancePaymentDate` - Auszahlungsmonat der Abfindung (verschiebt Fünftelregelung in steuergünstiges Jahr)
2. `newJobStartDate` - Wann beginnt der neue Job (nur newJob-Szenario)
3. `monthlyGrossNewJob` - Brutto-Monatsgehalt im neuen Job

Das **`ChartView`** plottet das Familien-Netto über alle Kombinationen, mit dem Liegenbleiben-Wert als horizontaler Referenzlinie.

## Veranlagungsart

| Modus                                        | Trigger                         | Engine-Verhalten                                                                                                        |
| -------------------------------------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Single**                                   | `withSpouse=false` im InputView | Spouse-Profil wird auf Null-Werte gesetzt (siehe [03](./03-calculation-engine.md#null-spouse)); Splittingtarif disabled |
| **Familie - Einzelveranlagung** (`separate`) | `withSpouse=true`               | § 26a EStG: jeder Ehegatte einzeln, KFB hälftig                                                                         |
| **Familie - Zusammenveranlagung** (`joint`)  | `withSpouse=true` + Toggle      | § 26b EStG: gemeinsames zvE, Splittingtarif (§ 32a Abs. 5), voller KFB                                                  |

Die **Veranlagungsart** kann der Nutzer in der `CalculationView` umschalten (außer im Single-Modus, dort fixiert auf `separate`).

## Was die App **nicht** tut

- Keine Steuererklärung erzeugen - nur Vorausschau / Vergleich
- Keine **asymmetrische KFB-Übertragung** (§ 32 Abs. 6 EStG): immer hälftige Aufteilung; das UI-Feld `childAllowance` ist informatorisch
- Kein **Lohnsteuer-Vorabzug** modelliert - nur Jahres-ESt
- **GKV/PV-Selbstzahlung nach ALG-I-Ende** wird als konservative Näherung modelliert, aber kein Krankenkassen-Bescheid, keine Mindestbemessung, kein Bürgergeld
- Keine **PKV-BA-Zuschüsse** während ALG-Bezug abgezogen (konservativ -> leichte Überschätzung der PKV-Kosten im Liegenbleiben-Szenario)
- Keine gemischten **Kirchensteuer-Ehen**; im Familie-Modus gilt ein gemeinsamer Kirchensteuerstatus
- Keine **Riester / Rürup**-Optimierung
- Keine **Kapitalerträge** (Abgeltungssteuer) - nur § 19 (Arbeit), § 21 (V&V), § 22 (sonstige), § 34 (außerordentlich)

Diese Vereinfachungen sind im Code an den jeweiligen Stellen kommentiert (siehe [`engine.ts`](../../../frontend/src/calculation/engine.ts) und [`inputAdapter.ts`](../../../frontend/src/calculation/inputAdapter.ts)).

## Tech-Stack (Kurzfassung)

| Schicht   | Wahl                                             |
| --------- | ------------------------------------------------ |
| Framework | Vue 3.5 + `<script setup>` Composition API       |
| Sprache   | TypeScript 6 (strict)                            |
| Build     | Vite 8                                           |
| UI        | PrimeVue 4 (Aura Theme, violet) + Tailwind CSS 4 |
| Forms     | `@primevue/forms`                                |
| i18n      | vue-i18n 11 (DE/ZH)                              |
| Chart     | Chart.js 4                                       |
| Lint      | ESLint 10 + Prettier 3                           |
| Quality   | SonarCloud + Vitest Coverage                     |

-> Architekturdetails siehe [02 - Architektur](./02-architecture.md).
