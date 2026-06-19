# 03 - Berechnungs-Engine

> **In 30 Sekunden:** `computeYear(input)` rechnet pro Steuerjahr beide Szenarien (`stayUnemployed`, `newJob`) fuer beide Personen aus. Enthalten sind Lohn/ALG/Abfindung, SV-AN inkl. GKV/PV-Selbstzahlung nach ALG-I-Ende, Vorsorgeaufwendungen, Spenden bzw. Sonderausgaben-Pauschbetrag, § 24b, §§ 32a/32b/34 EStG, KFB/Kindergeld, Soli und Kirchensteuer. Alle 2026er Zahlen stehen in `constants.ts`.

## Quick-Navigation

| Datei                                                                  | Inhalt                                                                           |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| [`engine.ts`](../../../frontend/src/calculation/engine.ts)             | Alle Formeln (`computeYear()`, `computePersonYear()`, `computePersonTax()`, ...) |
| [`types.ts`](../../../frontend/src/calculation/types.ts)               | Eingabe-/Ausgabe-Typen (`PersonProfile`, `YearComputation`, ...)                 |
| [`constants.ts`](../../../frontend/src/calculation/constants.ts)       | 2026er Tarif-, SV-, Familien-, Soli- und KiSt-Konstanten                         |
| [`inputAdapter.ts`](../../../frontend/src/calculation/inputAdapter.ts) | UI-Snapshot -> Engine-Inputs                                                     |

## Eingabe / Ausgabe

```ts
interface ComputeYearInput {
  profileUser: PersonProfile;
  profileSpouse: PersonProfile;
  incomeUser: PersonIncomeData;
  incomeSpouse: PersonIncomeData;
  scenarioStayUnemployed: ScenarioOverride;
  scenarioNewJob: ScenarioOverride;
  year: number;
  veranlagungsart?: "separate" | "joint";
}

interface YearComputation {
  year: number;
  mode: "separate" | "joint";
  stayUnemployed: { user; spouse; userTax; spouseTax; jointTax? };
  newJob: { user; spouse; userTax; spouseTax; jointTax? };
}
```

## High-Level-Flow

```text
computeYear(input)
|
├─ fuer jedes Szenario x jede Person:
|   computePersonYear()
|   ├─ calcPersonIncome()              ← Monatsanteile + ALG + Abfindung + Selbstzahler-Segmente
|   ├─ calcSvAnteil()                  ← KV/PV/RV/ALV + GKV/PV-Selbstzahlung
|   ├─ calcPensionExpenseDeduction()   ← § 10 EStG
|   ├─ calcDonationDeduction()         ← § 10b EStG
|   └─ calcGeneralSpecialExpensesDeduction() ← § 10c EStG
|
├─ fuer jede Person bzw. das Paar:
|   computePersonTax() oder computeJointTax()
|   ├─ tariffEstWithFuenftelAndProgrV() ← §§ 32a + 32b + 34
|   ├─ Guenstigerpruefung KFB + Kindergeld ← § 31 EStG
|   ├─ calcSoli() / calcSoliJoint()     ← SolzG, Basis nach § 51a EStG
|   └─ kirchensteuerRate(state)         ← 8 % BY/BW, sonst 9 %, Basis nach § 51a EStG
|
└─ bei mode='joint': distributeJointToPersons() ← Anzeige-Aufteilung Joint -> Einzel
```

## Schritt 1: Einkommensaufteilung pro Jahr (`calcPersonIncome`)

Ein Jahr wird nach Monaten in Beschaeftigung, ALG I, neue Arbeit und ggf. Selbstzahlerphase zerlegt:

| Phase                | Zeitraum                                                                                                           | Geld / Wirkung                        |
| -------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------- |
| Alter Job            | `[Jahresanfang ... unemploymentDate)`                                                                              | `monthlyGrossOldJob x Monate`         |
| ALG I                | `[algStartDate ... min(algEnd, newJobStart, Jahresende))`                                                          | `monthlyUnemploymentBenefit x Monate` |
| Neuer Job            | `[newJobStartDate ... Jahresende)`                                                                                 | `monthlyGrossNewJob x Monate`         |
| GKV/PV-Selbstzahlung | `[max(unemploymentDate, ALG-Ende, Abfindung-FolgeMonat) ... min(newJobStart, Abfindung-Deckungsende, Jahresende))` | KV/PV-Selbstzahlung, keine RV/ALV     |

Spezialfaelle:

- **Sperrzeit / Ruhezeit (§§ 158/159 SGB III):** Adapter setzt `algStartDate > unemploymentDate`; zwischen `unemploymentDate` und `algStartDate` gibt es kein ALG.
- **Sperrzeit kuerzt `unemploymentBenefitDuration`** um die gleichen Monate; Ruhezeit verschiebt nur den Beginn.
- **ALG-I-Anspruchsdauer (§ 147 SGB III):** Adapter leitet sie aus Alter und `alvInsuranceMonthsLast5Years` ab. Die Versicherungsmonate muessen nicht durchgehend sein.
- **Kein ALV-Beitrag / keine ALV-Pflicht:** `monthlyUnemploymentBenefit = 0` und `unemploymentBenefitDuration = 0` (siehe `isAlvSubject`, § 142 SGB III).
- **Abfindung** zaehlt nur in das Jahr, in dem `severancePaymentDate.getFullYear() === year`.
- **Letztes Monatsbrutto vor Arbeitslosigkeit:** Wenn das UI-Feld 0 ist, nutzt der Adapter `oldEmployerIncomeCurrentYear / gearbeitete Monate`. Beispiel: arbeitslos ab 01.08.2026 -> Jan-Jul = 7 Monate.
- **Datumsspeicherung:** UI speichert reine lokale `YYYY-MM-DD`-Daten, damit `2026-08-01` nicht per UTC in den Vortag kippt.

`spouse.personKey === 'spouse'` -> keine Abfindung, kein neuer Job, ALG aktuell nicht ueber UI modelliert.

### Null-Spouse (Single-Modus) {#null-spouse}

`inputToProfileSpouse(s)` gibt bei `s.withSpouse === false` ein neutrales Profil zurueck: alle Beitraege aus, `activeTaxSubject=false`, `age=0`, `taxClass=1`, alle Finanzwerte 0. `inputToIncomeSpouse(s)` analog. Die Engine rechnet 0 EUR SV / 0 EUR ESt fuer Spouse; die UI blendet die Spouse-Spalte aus.

## Schritt 2: Sozialversicherung (`calcSvAnteil`)

Jedes Beschaeftigungssegment (`oldJob` / `newJob`) wird monatsweise mit BBG-Cap berechnet:

| BBG 2026                                 | Gilt fuer |
| ---------------------------------------- | --------- |
| `BBG_KV_PV_MONTHLY_2026 = 5.812,50 EUR`  | KV, PV    |
| `BBG_RV_ALV_MONTHLY_2026 = 8.450,00 EUR` | RV, ALV   |

### Beschaeftigungsmonate

```text
KV-AN = min(Brutto_m, BBG_KV/PV) x healthInsuranceRate / 2
RV-AN = min(Brutto_m, BBG_RV/ALV) x 9,30 %
ALV-AN = min(Brutto_m, BBG_RV/ALV) x 1,30 %
```

`healthInsuranceRate` = allgemeiner Beitragssatz 14,60 % + individueller Zusatzbeitrag.

PV-AN wird mit `calcPvRateAn(stamm)` berechnet:

- Ausgangspunkt Eltern / unter 23: 1,80 %, in Sachsen 2,30 %
- kinderlos und `age >= 23`: plus 0,60 Prozentpunkte
- mit Kindern: kein Kinderlosenzuschlag
- 2. bis 5. Kind unter 25: je 0,25 Prozentpunkte Abschlag

Die App kennt nur das Alter, nicht Geburtsmonat/Kind-Geburtsmonat; daher ist die PV monatsgenau vereinfacht.

### GKV/PV-Selbstzahlung nach ALG-I-Ende

Wenn der User nach Ende von ALG I weiter arbeitslos ist und eine Abfindung die beitragsfreie Familienversicherung nach § 10 Abs. 1 S. 4 SGB V blockiert, erzeugt `calcPersonIncome()` ein `selfPaidHealthInsuranceSegment`.

Monate:

```text
AbfindungDeckungsmonate = ceil(Abfindung / letztes Monatsbrutto)
Start = max(unemploymentDate, ALG-Ende, Monat nach Abfindungszahlung)
Ende = min(newJobStart, Deckungsende, Jahresende)
```

Beitrag:

```text
Bemessungsgrundlage = min(letztes Monatsbrutto, BBG_KV/PV)
KV-Selbstzahlung = Bemessungsgrundlage x (14,0 % ermaessigter Satz + Zusatzbeitrag) x Monate
PV-Selbstzahlung = Bemessungsgrundlage x PV-Mitgliedssatz x Monate
```

Fuer diese Selbstzahlerphase entstehen **keine** automatischen RV-/ALV-Pflichtbeitraege. In den Popovers werden letztes Monatsbrutto, BBG, Bemessungsgrundlage, Monatsbetrag und `Monatsbetrag x Monate = Gesamt` angezeigt.

### PKV-Pfad (`kvKind === 'pkv'`)

KV/PV werden nicht ueber BBG berechnet, sondern als Jahressumme aus User-Eingabe uebernommen (`privateAnnualKV`, `privateAnnualPV`). RV/ALV bleiben an Beschaeftigung gekoppelt.

**Bewusste Vereinfachung:** Der BA-Zuschuss zur PKV waehrend ALG-I-Bezug (§ 174 SGB III) wird nicht abgezogen. Das ueberschaetzt PKV-Kosten im Liegenbleiben-Szenario leicht und ist konservativ Richtung „Neue Arbeit lohnt sich eher”.

## Schritt 3: Vorsorgeaufwendungen (`calcPensionExpenseDeduction`, § 10 EStG)

```text
RV-Basis = min(RV-AN, VORSORGE_BASIS_HOECHSTBETRAG_2026)

GKV:
  Vorsorge = RV-Basis
            + KV-Beschaeftigung x 96 %
            + KV-Selbstzahlung nach ALG-I-Ende x 100 %
            + PV x 100 %

PKV:
  Vorsorge = RV-Basis + KV-Basisbeitrag x 100 % + PV-Basisbeitrag x 100 %
```

- Der 4-%-Abschlag gilt fuer GKV-Beitraege mit Krankengeldanspruch (§ 10 Abs. 1 Nr. 3 Satz 4 EStG).
- Die GKV-Selbstzahlung nach ALG-I-Ende nutzt den ermaessigten Satz ohne Krankengeldanspruch und wird deshalb zu 100 % angesetzt.
- ALV ist nicht als Sonderausgabe abziehbar.

## Schritt 4: Spenden und Sonderausgaben-Pauschbetrag

Spendenabzug (§ 10b EStG):

```text
donationDeduction = min(Jahresspende, 20 % x Gesamtbetrag der Einkuenfte inkl. Abfindung)
```

Allgemeine Sonderausgaben (§ 10c EStG):

```text
generalSpecialExpensesDeduction = max(donationDeduction, 36 EUR je aktivem Steuerpflichtigen)
```

Im Joint-Modus entstehen durch zwei aktive Steuerpflichtige insgesamt 72 EUR Mindestbetrag. Der technische Null-Spouse im Single-Modus bekommt keinen Pauschbetrag.

## Schritt 5: zvE pro Person

```text
grossWages             = oldJobWage + newJobWage
incomeRelatedExpenses  = min(max(grossWages, 0), 1.230 EUR)
unusedAPB              = max(0, 1.230 EUR - incomeRelatedExpenses)
employmentIncome       = grossWages - incomeRelatedExpenses
singleParentRelief     = § 24b Betrag, falls im Single-Modus bestaetigt
totalIncome            = employmentIncome + rentalIncomeNet + otherIncome - singleParentRelief
specialExpenses        = pensionExpenseDeduction + generalSpecialExpensesDeduction
zvEwithoutKFB          = totalIncome - specialExpenses
```

ALG I ist nicht im `totalIncome`, sondern nur im Progressionsvorbehalt. Die Abfindung ist ebenfalls nicht in `zvEwithoutKFB` enthalten; sie wird in § 34 tariflich separat verarbeitet. Fuer die Spendenobergrenze wird sie aber dem Gesamtbetrag der Einkuenfte zugerechnet.

## Schritt 6: Einkommensteuertarif (§ 32a EStG 2026)

```text
zvE <= 12.348 EUR:                       ESt = 0
12.348 < zvE <= 17.799:                 ESt = (914,51*y + 1.400)*y
17.799 < zvE <= 69.878:                 ESt = (173,10*z + 2.397)*z + 1.034,87
69.878 < zvE <= 277.825:                ESt = 0,42*x - 11.135,63
zvE > 277.825:                          ESt = 0,45*x - 19.470,38
```

`x` ist das abgerundete zvE. `y = (x - 12.348) / 10.000`, `z = (x - 17.799) / 10.000`. Implementiert in `grundtarifESt()`.

**Splittingtarif (§ 32a Abs. 5 EStG):** `splittingESt(zvE) = 2 * grundtarifESt(zvE / 2)`.

## Schritt 7: Progressionsvorbehalt (§ 32b EStG)

ALG I ist steuerfrei, hebt aber den Steuersatz. Vor der Einbeziehung wird der nicht durch Arbeitslohn verbrauchte Arbeitnehmer-Pauschbetrag abgezogen:

```text
algForProgression = max(0, ALG I - min(ALG I, unusedAPB))
besSatz = ESt(zvE + algForProgression) / (zvE + algForProgression)
tariflicheESt = besSatz x zvE
```

Bei Zusammenveranlagung wird der Pauschbetragsabzug je Person berechnet und dann summiert. Implementiert in `estWithProgressionsvorbehalt(zvE, progressionIncome, joint)`.

## Schritt 8: Fünftelregelung (§ 34 Abs. 1 EStG)

Regelfall:

```text
ESt = ESt(zvE_ord) + 5 x (ESt(zvE_ord + Abfindung / 5) - ESt(zvE_ord))
```

`ESt(...)` meint hier bereits die Tariffunktion inkl. Progressionsvorbehalt.

Sonderfall § 34 Abs. 1 Satz 3:

```text
wenn zvE_ord < 0 und zvE_ord + Abfindung > 0:
  ESt = 5 x ESt((zvE_ord + Abfindung) / 5)
```

Implementiert in `tariffEstWithFuenftelAndProgrV(zvEord, abfindung, progressionIncome, joint)`. Das UI dokumentiert den Sonderfall im Popover.

## Schritt 9: Guenstigerpruefung KFB + Kindergeld (§ 31 EStG)

| Variante | Formel                                                                              |
| -------- | ----------------------------------------------------------------------------------- |
| Ohne KFB | `tariffIncomeTaxWithoutKFB = tariffEstWithFuenftelAndProgrV(zvEwithoutKFB, ...)`    |
| Mit KFB  | `tariffIncomeTaxWithKFB = tariffEstWithFuenftelAndProgrV(zvEwithoutKFB - KFB, ...)` |

```text
kfbSavings   = tariffIncomeTaxWithoutKFB - tariffIncomeTaxWithKFB
kfbPreferred = kfbSavings > childBenefitShare
assessedIncomeTax =
  kfbPreferred ? tariffIncomeTaxWithKFB + childBenefitShare : tariffIncomeTaxWithoutKFB
```

Konstanten 2026:

|                   | Einzelveranlagung (Haelfte pro Elternteil) | Zusammenveranlagung (voll) |
| ----------------- | ------------------------------------------ | -------------------------- |
| KFB pro Kind      | 4.878 EUR                                  | 9.756 EUR                  |
| Kindergeld        | 129,50 EUR/Monat                           | 259 EUR/Monat              |
| Jahres-Kindergeld | 1.554 EUR                                  | 3.108 EUR                  |

Asymmetrische KFB-/BEA-Uebertragungen sind nicht modelliert; das UI-Feld `childAllowance` ist informatorisch.

## Schritt 10: Solidaritätszuschlag (SolzG 2026)

Soli wird auf der Zuschlagsteuer-Bemessungsgrundlage nach § 51a EStG berechnet. Bei Kindern ist das die ESt **mit** KFB, ohne Kindergeld-Hinzurechnung aus § 31.

| Veranlagung         | Freigrenze     | Milderungszone bis ca. |
| ------------------- | -------------- | ---------------------- |
| Einzelveranlagung   | 20.350 EUR ESt | 37.839 EUR             |
| Zusammenveranlagung | 40.700 EUR ESt | 75.678 EUR             |

```text
Soli = 0, wenn Basis <= Freigrenze
sonst min(5,5 % x Basis, 11,9 % x (Basis - Freigrenze))
```

Implementiert in `calcSoli()` und `calcSoliJoint()`.

## Schritt 11: Kirchensteuer

```ts
function kirchensteuerRate(state: string): number {
  return state === "BY" || state === "BW" ? 0.08 : 0.09;
}
```

Auch Kirchensteuer nutzt die §-51a-Basis: ESt mit KFB, ohne Kindergeld-Hinzurechnung. Produktannahme im Familie-Modus: beide Ehegatten haben denselben Kirchensteuerstatus; gemischte Ehen werden nicht separat modelliert. In der gemeinsamen Anzeige wird die gemeinsame Kirchensteuer haelftig auf User/Spouse verteilt.

## Joint-Modus: Verteilung auf Personen

`distributeJointToPersons()` verteilt gemeinsame ESt und Soli proportional zu den Einzel-`tariffIncomeTaxWithoutKFB`-Anteilen. Die Kirchensteuer wird nach der Produktannahme haelftig verteilt. Das dient nur der Tabellenanzeige; massgeblich ist `jointTax`.

## 2026er Konstanten - Quellenliste

| Konstante                                                  | Wert               | Quelle                   |
| ---------------------------------------------------------- | ------------------ | ------------------------ |
| `GRUNDFREIBETRAG_2026`                                     | 12.348 EUR         | § 32a Abs. 1 EStG        |
| Tarifkoeffizienten Zone 2-5                                | siehe Datei        | § 32a Abs. 1 EStG 2026   |
| `ARBEITNEHMER_PAUSCHBETRAG`                                | 1.230 EUR          | § 9a Nr. 1a EStG         |
| `SONDERAUSGABEN_PAUSCHBETRAG_SINGLE`                       | 36 EUR             | § 10c EStG               |
| `KFB_FULL_PER_CHILD_2026`                                  | 9.756 EUR          | § 32 Abs. 6 EStG         |
| `KINDERGELD_PER_MONTH_PER_CHILD_2026`                      | 259 EUR            | § 66 EStG                |
| `ENTLASTUNGSBETRAG_ALLEINERZIEHENDE_BASE_2026`             | 4.260 EUR          | § 24b EStG               |
| `ENTLASTUNGSBETRAG_ALLEINERZIEHENDE_ADDITIONAL_CHILD_2026` | 240 EUR            | § 24b EStG               |
| `BBG_KV_PV_MONTHLY_2026`                                   | 5.812,50 EUR       | SvEV 2026                |
| `BBG_RV_ALV_MONTHLY_2026`                                  | 8.450 EUR          | SvEV 2026                |
| `ALLGEMEINER_KV_RATE`                                      | 14,60 %            | § 241 SGB V              |
| `ERMAESSIGTER_KV_RATE`                                     | 14,00 %            | § 243 SGB V              |
| `RV_RATE_AN`                                               | 9,30 %             | § 158 SGB VI             |
| `ALV_RATE_AN`                                              | 1,30 %             | § 341 SGB III            |
| `PV_RATE_TOTAL_WITH_CHILD`                                 | 3,60 %             | § 55 SGB XI              |
| `PV_CHILDLESS_SURCHARGE_RATE`                              | 0,60 Prozentpunkte | § 55 SGB XI              |
| `PV_CHILD_DISCOUNT_RATE`                                   | 0,25 Prozentpunkte | § 55 SGB XI              |
| `VORSORGE_BASIS_HOECHSTBETRAG_2026`                        | 30.230 EUR         | § 10 Abs. 3 EStG         |
| `SPENDEN_HOECHSTGRENZE_RATE`                               | 20 %               | § 10b Abs. 1 EStG        |
| `SOLI_FREIGRENZE_SINGLE_2026`                              | 20.350 EUR         | § 3 SolzG                |
| `SOLI_FREIGRENZE_JOINT_2026`                               | 40.700 EUR         | § 3 SolzG                |
| `SOLI_RATE`                                                | 5,5 %              | § 4 SolzG                |
| `SOLI_MILDERUNGSZONE_RATE`                                 | 11,9 %             | § 4 SolzG                |
| `KIST_RATE_BY_BW` / `KIST_RATE_OTHER`                      | 8 % / 9 %          | Landeskirchensteuerrecht |

> Produktannahme: Wenn das zweite betrachtete Steuerjahr z. B. 2027 ist, nutzt die App weiterhin 2026er Parameter als Prognosebasis. Das ist bewusst, solange die spaeteren Werte noch nicht final in der App gepflegt sind.

## Bewusste Vereinfachungen (re-cap)

1. Keine asymmetrische KFB-/BEA-Uebertragung.
2. Single mit Kindern bildet § 24b ab, aber nicht alle Trennungs-/Uebertragungsfaelle.
3. PKV-BA-Zuschuss waehrend ALG-I-Bezug wird nicht abgezogen.
4. GKV/PV-Selbstzahlung nach ALG-I-Ende wird geschaetzt; Krankenkassen-Bescheid, Mindestbemessung, Buergergeld und Sonderfaelle bleiben ausserhalb.
5. Keine monatliche Lohnsteuer-Vorabberechnung, nur Jahres-ESt.
6. Kirchensteuer-Kappung, besonderes Kirchgeld und gemischte Kirchensteuer-Ehen sind nicht modelliert.
7. Midijob/Minijob, Kapitalertraege, Riester/Ruerup und detaillierte V&V-Werbungskosten/AfA sind nicht modelliert.
