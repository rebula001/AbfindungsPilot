# 03 - Berechnungs-Engine

> **In 30 Sekunden:** Eine pure Funktion `computeYear(input)` rechnet pro Steuerjahr beide Szenarien (`stayUnemployed`, `newJob`) für beide Personen aus, inkl. SV, ESt, Progressionsvorbehalt, Fünftelregelung, Spendenabzug, KFB nach § 31a/31b und Soli. Alle Zahlen kommen aus `constants.ts`.

## Quick-Navigation

| Datei | Inhalt |
| --- | --- |
| [`engine.ts`](../../../frontend/src/calculation/engine.ts) | Alle Formeln (`computeYear()`, `computePersonYear()`, `computePersonTax()`, ...) |
| [`types.ts`](../../../frontend/src/calculation/types.ts) | Eingabe-/Ausgabe-Typen (`PersonProfile`, `YearComputation`, ...) |
| [`constants.ts`](../../../frontend/src/calculation/constants.ts) | Freibeträge, BBG, Sätze, Jahreswerte |
| [`inputAdapter.ts`](../../../frontend/src/calculation/inputAdapter.ts) | UI -> Engine-Inputs |

## Eingabe / Ausgaben

```ts
interface ComputeYearInput {
  profileUser: PersonProfile;   // unveränderliche Stammdaten
  profileSpouse: PersonProfile; // Kirchen/Miete + Null-Spouse, siehe unten
  incomeUser: PersonIncomeData; // jahres-/szenariobezogene Werte
  incomeSpouse: PersonIncomeData;
  scenarioUser: ScenarioIncomeData;
  scenarioSpouse: ScenarioIncomeData;
  year: number;
  veranlagungsart?: 'separate' | 'joint'; // Default: 'separate'
}

interface YearComputation {
  year: number;
  mode: 'separate' | 'joint';
  steuerpflichtige: { user: PersonTax; spouse?: JointTax };
  result: { user: Aggregat; userNet; spouseNet?; jointNet? };
}
```

## High-Level-Flow

```text
computeYear(input)
│
├─ für jedes Szenario × jede Person:
│   computePersonYear()
│   ├─ calcPersonIncome()              ← Monatsanteile + ALG + Abfindung
│   ├─ calcSvAnteil()                  ← KV/PV/RV/ALV mit BBG-Cap
│   ├─ calcPensionExpenseDeduction()   ← § 10 EStG
│   └─ calcDonationDeduction()         ← § 10b EStG
│
├─ für jede Person bzw. das Paar:
│   computePersonTax()  oder  computeJointTax()
│   ├─ tarifEStWithFuenftelAndProgrV() ← §§ 32a + 32b + 34
│   ├─ Günstigerprüfung KFB + Kindergeld ← § 31 EStG
│   ├─ calcSoli() / calcSoliJoint()    ← SolzG
│   └─ kirchensteuerRate(state)        ← 8 % BY/BW, sonst 9 %
│
└─ bei mode='joint': distributeJointToPersons() ← anteilige Aufteilung Joint->Einzel
```

## Schritt 1: Einkommensaufteilung pro Jahr (`calcPersonIncome`)

Ein Jahr wird in **drei Phasen** zerlegt:

| Phase | Zeitraum | Geld |
| --- | --- | --- |
| Alter Job | `[Jahresanfang … unemploymentDate)` | `monthlyGrossOldJob × Monate` |
| ALG I | `[algStartDate … min(algEnd, newJobStart, Jahresende))` | `monthlyUnemploymentBenefit × Monate` |
| Neuer Job | `[newJobStartDate … Jahresende)` | `monthlyGrossNewJob × Monate` |

Spezialfälle:

- **Sperrzeit / Ruhezeit (§ 158/159 SGB III):** Adapter setzt `algStartDate > unemploymentDate` -> zwischen beiden gibt es **kein** Geld (Cash-Loch)
- **Sperrzeit kürzt zusätzlich `unemploymentBenefitDuration`** um die gleichen Monate
- **Kein ALV-Beitrag im letzten Jahr** -> `monthlyUnemploymentBenefit = 0` und `unemploymentBenefitDuration = 0` (siehe `isAlvSubject` im Adapter, § 142 SGB III)
- **Abfindung** zählt nur in das Jahr, in dem `severancePaymentDate.getFullYear() === year`

`spouse.personKey === 'spouse'` -> keine Abfindung, kein neuer Job, ALG nur wenn explizit gesetzt (im aktuellen UI nicht der Fall).

### Null-Spouse (Single-Modus) {#null-spouse}

`inputToProfileSpouse(s)` gibt bei `s.withSpouse === false` ein neutrales Profil zurück: alle Beiträge aus, `age=0`, `taxClass=1`, alle Finanzwerte 0. `inputToIncomeSpouse(s)` analog. Die Engine rechnet 0 € SV / 0 € ESt für Spouse, mathematisch äquivalent zu „existiert nicht“. Die UI blendet die Spouse-Spalte separat aus. Vorteil: Engine bleibt unverändert, nur eine Codestelle (Adapter) entscheidet über Single/Familie.

## Schritt 2: Sozialversicherung (`calcSvAnteil`)

$$
\text{PV}_{AN} = \min(\text{Brutto}_{m}, \text{BBG}_{KV/PV}) \times r_{PV}, \quad
r_{PV} =
\begin{cases}
0{,}023 & \text{Sachsen} \\
0{,}018 & \text{sonst}
\end{cases}
$$

$$
\text{RV}_{AN} = \min(\text{Brutto}_{m}, \text{BBG}_{RV/ALV}) \times 0{,}093
$$

$$
\text{ALV}_{AN} = \min(\text{Brutto}_{m}, \text{BBG}_{RV/ALV}) \times 0{,}013
$$

`healthInsuranceRate` = allgemeiner Beitragssatz 14,60 % + individueller Zusatzbeitrag (User-Eingabe in %), siehe Adapter `fullKvRate()`.

### PKV-Pfad (`kvKind === 'pkv'`)

KV/PV werden nicht über die BBG berechnet, sondern direkt als Jahressumme aus User-Eingabe übernommen (`privateAnnualKV`, `privateAnnualPV`). RV/ALV bleiben unverändert (an Beschäftigung gekoppelt).

**Bewusste Vereinfachung:** Der BA-Zuschuss zur KV während ALG-Bezug (§ 174 SGB III) wird NICHT abgezogen - PKV-Kosten werden also leicht überschätzt -> Ergebnis tendiert zugunsten „Neue Arbeit” -> konservativ.

## Schritt 3: Vorsorgeaufwendungen (`calcPensionExpenseDeduction`, § 10 EStG)

$$
\text{Vorsorge} = \min(\text{RV}_{AN}, 30\,230,€) + \text{KV}_{AN} \cdot k_{KV} + \text{PV}_{AN}
$$

mit dem **Krankengeld-Abschlag**:

$$
k_{KV} =
\begin{cases}
1{,}00 & \text{PKV} \\
0{,}96 & \text{GKV} \ (\text{§ 10 Abs. 1 Nr. 3 Satz 4 EStG})
\end{cases}
$$

- RV-Cap (`VORSORGE_BASIS_HOECHSTBETRAG_2026 = 30 230 €`) ist § 10 Abs. 3 EStG; greift im modellierten Bereich praktisch nie (BBG_RV_ALV deckelt RV-AN bei ~ 9 430 €/Jahr)
- ALV ist NICHT abzugsfähig (nur Pauschbetrag, hier ignoriert)

## Schritt 4: Spenden (`calcDonationDeduction`, § 10b EStG)

$$
\text{Spendenabzug} = \min(\text{Jahresspende}, 0{,}20 \cdot \text{Gesamtbetrag der Einkünfte inkl. Abfindung})
$$

Wichtig: die Abfindung **gehört** zu den Einkünften aus § 19 EStG. Nur die Tarifberechnung wird durch § 34 verändert, nicht die Spenden-Höchstgrenze.

## Schritt 5: zvE pro Person

```text
grossWages             = oldJobWage + newJobWage
incomeRelatedExpenses  = 1 230 €  falls grossWages > 0  sonst 0    (§ 9a Nr. 1a EStG)
employmentIncome       = grossWages - incomeRelatedExpenses
totalIncome            = employmentIncome + rentalIncomeNet + otherIncome
specialExpenses        = pensionExpenseDeduction + donationDeduction
zvEwithoutKFB          = totalIncome - specialExpenses
```

ALG I und Abfindung sind **nicht** in `totalIncome` - sie wirken erst in der Tarifberechnung (§§ 32b, 34).

## Schritt 6: Einkommensteuertarif (§ 32a EStG 2026)

```text
zvE ≤ 12 348 €:                         ESt = 0
12 348 < zvE ≤ 17 799:                 ESt = (914,51·y + 1 400)·y        mit y = (zvE - 12 348)/10 000
17 799 < zvE ≤ 69 878:                 ESt = (173,10·z + 2 397)·z + 1 034,87 mit z = (zvE - 17 799)/10 000
69 878 < zvE ≤ 277 825:                ESt = 0,42·zvE - 11 135,63
zvE > 277 825:                         ESt = 0,45·zvE - 19 470,38
```

Implementiert in `grundtarifESt()`. `zvE` wird auf vollen Euro abgerundet, das Ergebnis ebenfalls.

**Splittingtarif (§ 32a Abs. 5 EStG):** `splittingESt(zvE) = 2 · grundtarifESt(zvE / 2)`.

## Schritt 7: Progressionsvorbehalt (§ 32b EStG)

ALG I ist **steuerfrei**, hebt aber den Steuersatz an:

$$
\text{besSatz} = \frac{\text{ESt}(\text{zvE} + \text{ALG})}{\text{zvE} + \text{ALG}},
\qquad
\text{tariflicheESt} = \text{besSatz} \cdot \text{zvE}
$$

Implementiert in `estWithProgressionsvorbehalt(zvE, alg, joint)`. Bei `joint=true` wird `splittingESt` als Tariffunktion verwendet, sonst `grundtarifESt`.

## Schritt 8: Fünftelregelung (§ 34 Abs. 1 EStG)

Die Abfindung ist eine **außerordentliche Einkunft**. Tariflich wird sie geglättet:

$$
\text{tariflicheESt}
=
\text{ESt}_{\text{ord}}(\text{zvE}_{\text{ord}})
+
5 \cdot \Bigl(
\text{ESt}_{\text{ord}}\!\left(\text{zvE}_{\text{ord}} + \tfrac{\text{Abfindung}}{5}\right)
- \text{ESt}_{\text{ord}}(\text{zvE}_{\text{ord}})
\Bigr)
$$

wobei $\text{ESt}_{\text{ord}}$ bereits den Progressionsvorbehalt enthält (Funktion `estWithProgressionsvorbehalt` aus Schritt 7).

Implementiert in `tarifEStWithFuenftelAndProgrV(zvEord, abfindung, alg, joint)`. **`zvEord` ist das ordentliche zvE OHNE Abfindung** (= `PersonYearResult.zvEWithoutKFB` bzw. `zvEWithKFB`). `Math.max(0, …)` schützt vor negativem Zusatzbetrag (kann bei sehr niedrigem ord. zvE auftreten).

## Schritt 9: Günstigerprüfung KFB + Kindergeld (§ 31 EStG)

Für jede Person (bei Einzelveranlagung) bzw. das Paar (bei Zusammenveranlagung) werden zwei ESt-Werte berechnet:

| Variante | Formel |
| --- | --- |
| Ohne KFB | `tariffIncomeTaxWithoutKFB = tarifEStWithFuenftelAndProgrV(zvEwithoutKFB, …)` |
| Mit KFB | `tariffIncomeTaxWithKFB = tarifEStWithFuenftelAndProgrV(zvEwithoutKFB - KFB, …)` |

Dann:

```text
kfbSavings      = tariffIncomeTaxWithoutKFB - tariffIncomeTaxWithKFB
kfbPreferred    = kfbSavings > childBenefitShare
assessedIncomeTax
  = kfbPreferred
    ? tariffIncomeTaxWithKFB + childBenefitShare    (§ 31 Satz 4: KG hinzurechnen)
    : tariffIncomeTaxWithoutKFB
```

Konstanten 2026:

|  | Einzelveranlagung (Hälfte pro Elternteil) | Zusammenveranlagung (voll) |
| --- | --- | --- |
| KFB pro Kind | 4 878 € | 9 756 € |
| Kindergeld | 129,50 €/Monat | 259 €/Monat |
| Jahres-Kindergeld | 1 554 € | 3 108 € |

`childBenefitMonthlyPerChild` ist überschreibbar (User-Eingabe), Default = 259 €.

## Schritt 10: Solidaritätszuschlag (SolzG)

| Veranlagung | Freigrenze | Milderungszone bis |
| --- | --- | --- |
| Einzelveranlagung | 19 950 € ESt | 33 912 € |
| Zusammenveranlagung | 39 900 € ESt | 67 824 € |

Formel:

$$
\text{Soli} =
\begin{cases}
0 & \text{ESt} \leq \text{Freigrenze} \\
\min(0{,}055 \cdot \text{ESt}, \ 0{,}119 \cdot (\text{ESt} - \text{Freigrenze})) & \text{sonst}
\end{cases}
$$

Implementiert in `calcSoli()` (Single) und `calcSoliJoint()` (verdoppelte Schwellen, § 3 Abs. 4 SolzG 1995).

## Schritt 11: Kirchensteuer

```ts
function kirchensteuerRate(state: string): number {
  return state === 'BY' || state === 'BW' ? 0.08 : 0.09;
}
```

Bemessungsgrundlage = festzusetzende ESt (vereinfacht ohne KFB-Hinzurechnungs-Korrektur). Bei Zusammenveranlagung trägt jeder Ehegatte nur dann KiSt, wenn er kirchensteuerpflichtig ist; Bemessungsgrundlage = halber gemeinsamer ESt-Betrag (vereinfachte Halbteilung).

### Joint-Modus: Verteilung auf Personen

`distributeJointToPersons()` verteilt das gemeinsame `assessedIncomeTax` und `soli` proportional zur Einzel-`tariffIncomeTaxWithoutKFB`-Anteile, damit `summe(user.tax + spouse.tax) = jointTax.assessed` bleibt - wichtig für die Tabellen-Aggregation in CalculationView.

KFB-/Kindergeld-Felder im `PersonTaxResult` zeigen im Joint-Mode informativ die Einzelveranlagungswerte; die rechtlich verbindlichen gemeinsamen Werte stehen in `jointTax`.

## 2026er Konstanten - Quellenliste

Alle Konstanten in [`constants.ts`](../../../frontend/src/calculation/constants.ts), jeweils mit § verweist:

| Konstante | Wert | Quelle |
| --- | --- | --- |
| `GRUNDFREIBETRAG_2026` | 12 348 € | § 32a Abs. 1 Nr. 1 EStG (Inflationsausgleichsgesetz) |
| Tarifkoeffizienten Zone 2-5 | siehe Datei | § 32a Abs. 1 EStG 2026 |
| `ARBEITNEHMER_PAUSCHBETRAG` | 1 230 € | § 9a Nr. 1a EStG |
| `KFB_FULL_PER_CHILD_2026` | 9 756 € (= 6 828 € KFB + 2 928 € BEA) | § 32 Abs. 6 EStG |
| `KINDERGELD_PER_MONTH_PER_CHILD_2026` | 259 € | § 66 EStG (seit 01.01.2025 einheitlich) |
| `BBG_KV_PV_MONTHLY_2026` | 5 812,50 € | SvEV 2026 |
| `BBG_RV_ALV_MONTHLY_2026` | 8 450 € | SvEV 2026 |
| `RV_RATE_AN` | 9,30 % | § 158 SGB VI |
| `ALV_RATE_AN` | 1,30 % | § 341 SGB III |
| `PV_RATE_AN_WITH_CHILD` | 1,80 % (SN: 2,30 %) | § 55 SGB XI |
| `VORSORGE_BASIS_HOECHSTBETRAG_2026` | 30 230 € | § 10 Abs. 3 EStG |
| `SPENDEN_HOECHSTGRENZE_RATE` | 20 % | § 10b Abs. 1 EStG |
| `SOLI_FREIGRENZE_SINGLE_2026` | 19 950 € | § 3 SolzG |
| `SOLI_FREIGRENZE_JOINT_2026` | 39 900 € | § 3 Abs. 4 SolzG |
| `SOLI_RATE` | 5,5 % | § 4 SolzG |
| `SOLI_MILDERUNGSZONE_RATE` | 11,9 % | § 4 SolzG |
| `KIST_RATE_BY_BW` / `KIST_RATE_OTHER` | 8 % / 9 % | Jeweils Landeskirchensteuergesetz |

> ⚠ Bei Steuerjahr-Wechsel (z. B. 2027): alle Konstanten in `constants.ts` neu setzen, ADR in `.claude/decisions/` schreiben, Tests aktualisieren. Datei-Suffix `_2026` ist Absicht: zwei parallele Jahre (2026 + 2027) sollten irgendwann nebeneinander existieren können.

## Bewusste Vereinfachungen (re-cap)

1. Keine asymmetrische KFB-Übertragung (immer hälftig)
2. Kein BA-Zuschuss zur PKV während ALG-Bezug
3. Keine monatliche Lohnsteuer-Vorabberechnung (nur Jahres-ESt)
4. KiSt-Bemessungsgrundlage ohne KFB-Hinzurechnungs-Korrektur
5. ALV-Beiträge nicht in Vorsorgeaufwendungen (nur Pauschbetrag)
6. Sonstige Einkünfte (§ 22) und Mieteinnahmen (§ 21) als „netto“ direkt in `totalIncome` (keine Werbungskosten / AfA modelliert)
