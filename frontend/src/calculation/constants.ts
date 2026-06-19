// 2026 年德国税务计算所用常量（独立模块，不依赖任何现有 composable）
// 来源参考：§ 32a EStG、§ 9a EStG、§ 10/§ 10b EStG、SGB V/VI/III、SvEV 2026、Inflationsausgleich

// ---- Einkommensteuertarif § 32a EStG 2026 ----
// Offiziell veröffentlichte Tarifformel ab Veranlagungszeitraum 2026 (§ 32a Abs. 1 EStG):
// 1) bis 12.348 €:                          0
// 2) 12.349 .. 17.799 €:                   (914,51 · y + 1.400) · y      mit y = (x - 12.348)/10000
// 3) 17.800 .. 69.878 €:                   (173,10 · z + 2.397) · z + 1.034,87  mit z = (x - 17.799)/10000
// 4) 69.879 .. 277.825 €:                  0,42 · x - 11.135,63
// 5) ab 277.826 €:                         0,45 · x - 19.470,38
// Splitting (§ 32a Abs. 5): ESt(zvE_couple) = 2 × ESt(zvE_couple/2)
// Grundfreibetrag pro Person (Grundtabelle)
export const GRUNDFREIBETRAG_2026 = 12_348;
export const TARIF_ZONE2_END_2026 = 17_799;
export const TARIF_ZONE3_END_2026 = 69_878;
export const TARIF_ZONE4_END_2026 = 277_825;

// Koeffizienten Zone 2: (a2·y + b2)·y
export const TARIF_ZONE2_A_2026 = 914.51;
export const TARIF_ZONE2_B_2026 = 1_400;

// Koeffizienten Zone 3: (a3·z + b3)·z + c3
export const TARIF_ZONE3_A_2026 = 173.1;
export const TARIF_ZONE3_B_2026 = 2_397;
export const TARIF_ZONE3_C_2026 = 1_034.87;

// Koeffizienten Zone 4: 0,42·x - c4
export const TARIF_ZONE4_RATE_2026 = 0.42;
export const TARIF_ZONE4_C_2026 = 11_135.63;

// Koeffizienten Zone 5: 0,45·x - c5
export const TARIF_ZONE5_RATE_2026 = 0.45;
export const TARIF_ZONE5_C_2026 = 19_470.38;

// ---- Werbungskosten / Pauschbetraege ----
export const ARBEITNEHMER_PAUSCHBETRAG = 1_230; // § 9a Nr. 1a EStG
export const SONDERAUSGABEN_PAUSCHBETRAG_SINGLE = 36; // § 10c EStG
export const SONDERAUSGABEN_PAUSCHBETRAG_JOINT = 72;

// ---- Familienleistungsausgleich 2026 ----
// Kinderfreibetrag (joint, pro Kind, voll): 6.828 € KFB + 2.928 € BEA = 9.756 €
export const KFB_FULL_PER_CHILD_2026 = 9_756;
// Bei getrennter Veranlagung erhaelt jeder Elternteil die Haelfte:
export const KFB_HALF_PER_CHILD_2026 = KFB_FULL_PER_CHILD_2026 / 2; // 4.878 €
// Kindergeld pro Kind und Monat (seit 01.01.2025 einheitlich 259 €)
export const KINDERGELD_PER_MONTH_PER_CHILD_2026 = 259;
// Entlastungsbetrag fuer Alleinerziehende (§ 24b EStG): 4.260 € + 240 € je weiterem Kind.
export const ENTLASTUNGSBETRAG_ALLEINERZIEHENDE_BASE_2026 = 4_260;
export const ENTLASTUNGSBETRAG_ALLEINERZIEHENDE_ADDITIONAL_CHILD_2026 = 240;

// ---- Sozialversicherung 2026 (West/einheitlich) ----
// Beitragsbemessungsgrenzen (monatlich)
export const BBG_KV_PV_MONTHLY_2026 = 5_812.5; // 69.750 €/Jahr
export const BBG_RV_ALV_MONTHLY_2026 = 8_450; // 101.400 €/Jahr (einheitlich seit 2025)

// Krankenversicherung
export const ALLGEMEINER_KV_RATE = 0.146; // § 241 SGB V
export const ERMAESSIGTER_KV_RATE = 0.14; // § 243 SGB V, ohne Krankengeldanspruch

// AN-Anteile (Standardsaetze)
export const PV_RATE_TOTAL_WITH_CHILD = 0.036; // 3,60 % Mitgliedsbeitrag
export const PV_RATE_AN_WITH_CHILD = 0.018; // 1,80 % (Eltern / unter 23, ohne Kinderlosenzuschlag)
// Sachsen: AN traegt seit 1995 0,5 pp mehr als die anderen Bundeslaender
// (Buß- und Bettag wurde nicht gestrichen -> kein hälftiger Splitt). Mit Kind:
// AN = 1,80 % + 0,50 pp = 2,30 % der beitragspflichtigen Einnahmen.
export const PV_RATE_AN_WITH_CHILD_SACHSEN = 0.023;
// § 55 Abs. 3 SGB XI: Kinderlose zahlen ab vollendetem 23. Lebensjahr +0,60 pp.
export const PV_CHILDLESS_SURCHARGE_RATE = 0.006;
// § 55 Abs. 3 SGB XI: ab dem 2. bis zum 5. Kind unter 25 jeweils -0,25 pp.
export const PV_CHILD_DISCOUNT_RATE = 0.0025;
export const PV_CHILD_DISCOUNT_MAX_CHILDREN = 5;
export const RV_RATE_AN = 0.093; // 9,30 %
export const ALV_RATE_AN = 0.013; // 1,30 %
// KV-AN-Satz = healthInsuranceRate / 2 (allgemeiner Satz 14,6 % + Zusatzbeitrag, jeweils hälftig)

// ---- Vorsorgeaufwendungen § 10 EStG ----
// Krankengeldanteil-Abschlag: KV-AN nur zu 96 % als Basisversorgung abzugsfähig
export const VORSORGE_KV_KRANKENGELD_ABSCHLAG = 0.04;
// RV-AN: zu 100 % abzugsfähig (seit 2023)
// PV-AN: zu 100 % abzugsfähig
// ALV: NICHT als Sonderausgabe abzugsfähig (nur sonstige Vorsorge im Pauschbetrag)

// Höchstbetrag der Basisaltersvorsorge (§ 10 Abs. 3 EStG): 2026 ca. 30.230 € pro Person
// (= 2 × knappschaftliche RV-BBG-West × 18,6 % AN+AG-Anteil; Splittingverfahren - doppelt).
// Bezieht sich AUSSCHLIESSLICH auf Basisrente (RV-AN, Rürup, Versorgungswerk). Beiträge zur
// Basis-KV/PV sind seit dem Bürgerentlastungsgesetz 2010 in vollem Umfang OHNE Höchstbetrag
// abzugsfähig, dürfen also nicht in diesen Cap einbezogen werden.
export const VORSORGE_BASIS_HOECHSTBETRAG_2026 = 30_230;

// ---- Sonderausgaben Spenden § 10b EStG ----
// Höchstgrenze: 20 % des Gesamtbetrags der Einkünfte
export const SPENDEN_HOECHSTGRENZE_RATE = 0.2;

// ---- Solidaritätszuschlag (Soli) 2026 ----
// Freigrenze (Einzelveranlagung): 20.350 € ESt; Milderungszone bis ca. 37.839 €
export const SOLI_FREIGRENZE_SINGLE_2026 = 20_350;
export const SOLI_OBERGRENZE_SINGLE_2026 = 37_839;
// Freigrenze (Zusammenveranlagung): 40.700 € ESt; Milderungszone bis ca. 75.678 €
export const SOLI_FREIGRENZE_JOINT_2026 = 40_700;
export const SOLI_OBERGRENZE_JOINT_2026 = 75_678;
export const SOLI_RATE = 0.055;
export const SOLI_MILDERUNGSZONE_RATE = 0.119;

// ---- Kirchensteuer ----
// 8 % in Bayern und Baden-Württemberg, 9 % in allen übrigen Bundesländern.
// Bemessungsgrundlage: ESt nach § 51a EStG; Kinderfreibetraege werden fuer
// Zuschlagsteuern beruecksichtigt, ohne Kindergeld-Hinzurechnung.
export const KIST_RATE_BY_BW = 0.08;
export const KIST_RATE_OTHER = 0.09;

export function kirchensteuerRate(state: string): number {
  return state === 'BY' || state === 'BW' ? KIST_RATE_BY_BW : KIST_RATE_OTHER;
}
