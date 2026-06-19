# 10 - Jahresparameter aktualisieren

> **In 30 Sekunden:** Die App hat ein aktives Jahresparameter-Set in
> [`frontend/src/tax-parameters`](../../../frontend/src/tax-parameters/). Zahlen wie Tarifgrenzen, BBG, Kindergeld, Soli, KiSt und UI-Beispieljahre werden aus JSON gelesen. Wenn sich nur Werte aendern und die Rechenstruktur gleich bleibt, reicht ein neues bzw. aktualisiertes JSON plus Build-Check.

## Grundprinzip

Die Berechnung nutzt weiterhin die bestehenden Engine-Funktionen. Die Zahlen kommen aber nicht mehr direkt aus handgeschriebenen Konstanten, sondern aus:

| Datei                                                                                   | Rolle                                                                                   |
| --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| [`2026.json`](../../../frontend/src/tax-parameters/2026.json)                           | Aktives Parameter-Set fuer 2026                                                         |
| [`types.ts`](../../../frontend/src/tax-parameters/types.ts)                             | Schema der erlaubten JSON-Felder                                                        |
| [`index.ts`](../../../frontend/src/tax-parameters/index.ts)                             | Laedt das aktive Set, formatiert Werte fuer i18n/UI und exportiert `CURRENT_TAX_PARAMETERS` |
| [`constants.ts`](../../../frontend/src/calculation/constants.ts)                        | Kompatibilitaetsschicht: alte Konstantennamen bleiben, Werte kommen aus JSON            |
| [`de.ts`](../../../frontend/src/i18n/de.ts) / [`zh.ts`](../../../frontend/src/i18n/zh.ts) | Texte mit Platzhaltern wie `{taxYear}`, `{bbgKvPvMonthly}`, `{soliSingleFreigrenze}`    |

Wichtig: Zurzeit gibt es **ein aktives Parameter-Set**. Auch wenn die UI zwei Steuerjahre zeigt, rechnet die Engine beide Jahre mit diesem aktiven Set. Das ist fuer Prognosen gewollt. Echte parallel historische Jahreslogik waere eine eigene Erweiterung.

## JSON-Werte: Formatregeln

| Feldtyp          | Format im JSON                                 | Beispiel                  |
| ---------------- | ---------------------------------------------- | ------------------------- |
| Euro-Betraege    | Zahl in Euro, ohne Tausenderpunkt              | `12348`, `5812.5`         |
| Prozentsaetze    | Dezimalzahl, nicht Prozentstring               | `0.146` fuer 14,6 %       |
| Monatliche BBG   | Monatswert, nicht Jahreswert                   | `5812.5`                  |
| Kindergeld       | Monatswert pro Kind                            | `259`                     |
| Soli/KiSt-Saetze | Dezimalzahl                                    | `0.055`, `0.08`, `0.09`   |
| UI-Beispiele     | Monat und Tag separat, 1-basiert beim Monat    | `"unemploymentDateMonth": 8` |

Die formatierten UI-Texte entstehen in `buildTaxParameterI18nParams()`. Beispiel: Aus `0.055` wird fuer die UI `5,5 %`, aus `5812.5` wird `5.812,50 EUR`.

## Vorgehen fuer 2027 / 2028

1. **Rechtsstand klaeren.** Pruefen, ob sich nur Werte geaendert haben. Wenn sich Tarifformeln, Rundungsregeln, § 34, § 32b, § 51a, SGB-Logik oder die ALG/PV/KV-Struktur aendern, reicht JSON nicht.
2. **Neues JSON anlegen.** `2026.json` nach `2027.json` kopieren und `"year": 2027` setzen.
3. **Werte aktualisieren.** Alle relevanten Felder in `incomeTax`, `pauschbetraege`, `children`, `socialInsurance`, `vorsorge`, `soli`, `kirchensteuer` und `uiExamples` anpassen.
4. **Aktives Set umschalten.** In `frontend/src/tax-parameters/index.ts` das neue JSON importieren und `CURRENT_TAX_PARAMETERS` auf dieses Set zeigen lassen.
5. **Typen nur bei neuen Feldern aendern.** Wenn ein vorhandenes Feld nur einen neuen Wert bekommt, `types.ts` nicht anfassen. Neue Rechtswerte brauchen erst dann ein neues Feld, wenn sie in Berechnung oder UI wirklich verwendet werden.
6. **i18n nur bei neuen Texten aendern.** Jahreszahlen und Betraege sollen ueber Platzhalter kommen. Wenn ein Wert im UI noch hart codiert ist, besser einen neuen Parameter-Platzhalter in `buildTaxParameterI18nParams()` ergaenzen.
7. **Build und Plausibilitaet pruefen.** Danach `npm run build` im Frontend ausfuehren.

Minimaler Umschalt-Ausschnitt fuer das aktuelle Produktmodell mit genau einem aktiven Parameter-Set:

```ts
import parameters2027 from './2027.json';
import type { TaxParameters } from './types';

export const CURRENT_TAX_PARAMETERS: TaxParameters = parameters2027;

const TAX_PARAMETER_BY_YEAR: Record<number, TaxParameters> = {
  [CURRENT_TAX_PARAMETERS.year]: CURRENT_TAX_PARAMETERS
};
```

Wenn nur eine Prognose mit unveraenderten 2026er Werten gewollt ist, kein neues JSON aktivieren. Dann bleibt `2026.json` bewusst die Produktbasis.

`2026.json` muss nach einem echten Wechsel auf 2027 nicht importiert bleiben. Man kann es im Repository als historische Referenz behalten, aber die laufende App braucht nur das aktive Set. Mehrere importierte Jahresdateien sind erst sinnvoll, wenn die Engine spaeter wirklich je Steuerjahr unterschiedliche Parameter aus `getTaxParameters(year)` verwenden soll.

## Welche Werte jedes Jahr pruefen?

| Bereich                         | JSON-Pfad                                                                                          |
| ------------------------------- | --------------------------------------------------------------------------------------------------- |
| Einkommensteuertarif § 32a      | `incomeTax.grundfreibetrag`, `zone*`, `zone*A/B/C`, `zone4Rate`, `zone5Rate`                       |
| Arbeitnehmer-/Sonderausgaben    | `pauschbetraege.arbeitnehmer`, `sonderausgabenSingle`, `sonderausgabenJoint`, `donationCapRate`     |
| Kinder/Familie                  | `children.kfbFullPerChild`, `kindergeldMonthlyPerChild`, `singleParentBase`, `singleParentAdditionalChild` |
| Krankenversicherung             | `socialInsurance.jaegYearly`, `kvGeneralRate`, `kvReducedRate`, `averageAdditionalKvRate`, `defaultAdditionalKvRate` |
| Pflegeversicherung              | `socialInsurance.pvTotalWithChild`, `pvEmployeeWithChild`, `pvEmployeeWithChildSachsen`, `pvChildlessSurcharge`, `pvChildDiscount`, `pvChildDiscountMaxChildren` |
| BBG                             | `socialInsurance.bbgKvPvMonthly`, `bbgRvAlvMonthly`                                                |
| RV/ALV                          | `socialInsurance.rvEmployeeRate`, `alvEmployeeRate`                                                |
| Vorsorge                        | `vorsorge.kvKrankengeldAbschlag`, `basisHoechstbetrag`                                             |
| Solidaritaetszuschlag           | `soli.singleFreigrenze`, `jointFreigrenze`, `singleObergrenze`, `jointObergrenze`, `rate`, `milderungszoneRate` |
| Kirchensteuer                   | `kirchensteuer.rateByBw`, `rateOther`                                                              |
| UI-Beispieldaten                | `uiExamples.unemploymentDateMonth`, `uiExamples.unemploymentDateDay`                               |

## Nachkontrolle

Im Ordner `frontend` ausfuehren:

```bash
npm run build
```

Das deckt ab:

- ESLint
- Prettier
- i18n-Key-Vergleich
- `vue-tsc`
- Vite Production Build

Optional nach hart codierten Zahlen in sichtbaren UI-Dateien suchen:

```bash
rg -n "12\\.348|259|5\\.812|8\\.450|20\\.350|40\\.700|14,6|2,9" src/i18n src/views src/components
```

Treffer auf alte Konstantennamen wie `KFB_HALF_PER_CHILD_2026` in `CalculationView.vue` sind derzeit erwartbar, weil `constants.ts` als Kompatibilitaetsschicht weiter alte Exportnamen bereitstellt. Entscheidend ist, dass sichtbare Texte und Default-Werte aus `tax-parameters` kommen.

## Wann reicht JSON nicht?

JSON reicht **nicht**, wenn sich die rechtliche Struktur aendert, zum Beispiel:

- § 32a bekommt eine andere Tarifformel oder andere Rundung.
- § 34 Fuenftelregelung wird strukturell geaendert oder abgeschafft.
- Soli/Kirchensteuer-Bemessungsgrundlage nach § 51a aendert sich.
- ALG-I-Anspruchsdauer oder Leistungslogik wird anders modelliert.
- GKV/PV-Selbstzahlerphase braucht Mindestbemessung, Krankenkassenbescheid oder weitere Sonderfaelle.
- Es soll nicht mehr ein aktives Prognose-Set gelten, sondern echte Berechnung je Steuerjahr mit unterschiedlichen Parametern innerhalb derselben Zwei-Jahres-Ansicht.

In diesen Faellen zuerst Engine, UI und Audit-Doku gezielt erweitern, danach erst die JSON-Werte aktualisieren.
