// Adapter: UserInputSnapshot -> Berechnungs-Engine-Inputs.
//
// Reine Mapping-Funktionen, kein Vue-State. Wird von useCalculation konsumiert
// und ist per Design synchron + ohne Seiteneffekte (gut für Tests).
//
// Annahmen:
// - State-Code ('RP', 'BY', …) wird durchgereicht - die Engine benutzt das Feld nicht.
// - SV-Pflicht wird nur bei 'statutoryMandatory' oder 'employeeOnly' aktiv;
//   'private', 'voluntaryStatutory', 'notMandatory', 'employerOnly' setzen die
//   AN-Beiträge auf 0.
// - KV-Voll-Satz = allgemeiner Beitragssatz (14,60 %) + Zusatzbeitrag (User-Eingabe in %).
// - Single-Modus (withSpouse=false) wird über 'nullSpouseProfile' + Null-Income abgebildet,
//   sodass die Engine unverändert mit zwei Personen rechnen kann.

import type { PersonProfile, PersonIncomeData } from '../calculation/types';
import { ALLGEMEINER_KV_RATE, TAX_PARAMETER_YEAR } from '../calculation/constants';
import type { InsuranceKind, SocialInsuranceKind, UserInputSnapshot } from '../composables/useUserInput';

function isSvSubject(v: SocialInsuranceKind): boolean {
  return v === 'statutoryMandatory' || v === 'employeeOnly';
}

/** PKV nur bei expliziter Wahl 'private'. 'voluntaryStatutory' bleibt GKV-Pfad. */
function isPkv(v: InsuranceKind): boolean {
  return v === 'private';
}

function fullKvRate(zusatzPercent: number): number {
  return ALLGEMEINER_KV_RATE + zusatzPercent / 100;
}

function parseTaxClass(s: string): number {
  // Sonderwert '4-factor' -> Klasse IV (Faktor selbst beeinflusst nur die LSt-Vorauszahlung,
  // nicht die Jahres-ESt). Ohne diesen Strip lieferte parseInt('4-factor') zwar 4,
  // aber wir entkoppeln die Logik bewusst von parseInt-Implementierungsdetails.
  const stripped = s.replace(/-factor$/i, '');
  const n = Number.parseInt(stripped, 10);
  return Number.isFinite(n) && n >= 1 && n <= 6 ? n : 1;
}

/** § 147 SGB III: Anspruchsdauer ALG I aus Alter und Versicherungsmonaten ableiten. */
function deriveAlgDurationMonths(age: number, insuranceMonthsLast5Years: number): number {
  const months = Math.max(0, Math.min(60, Math.floor(insuranceMonthsLast5Years)));
  if (age >= 58 && months >= 48) return 24;
  if (age >= 55 && months >= 36) return 18;
  if (age >= 50 && months >= 30) return 15;
  if (months >= 24) return 12;
  if (months >= 20) return 10;
  if (months >= 16) return 8;
  if (months >= 12) return 6;
  return 0;
}

function parseIso(s: string | null): Date | null {
  if (!s) return null;
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (dateOnly) {
    const year = Number(dateOnly[1]);
    const month = Number(dateOnly[2]) - 1;
    const day = Number(dateOnly[3]);
    const d = new Date(year, month, day);
    if (d.getFullYear() === year && d.getMonth() === month && d.getDate() === day) return d;
    return null;
  }
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function inputToProfileUser(s: UserInputSnapshot): PersonProfile {
  // Hinweis zu `s.childAllowance` (KFB-Zähler 0 / 0,5 / 1,0 / 1,5 / 2,0):
  // Dieser Wert wird bewusst NICHT an die Engine übergeben. Die Engine verteilt
  // den Kinderfreibetrag und das Kindergeld immer hälftig pro Elternteil
  // (Einzelveranlagung) bzw. zieht den vollen KFB einmal bei Zusammenveranlagung;
  // asymmetrische Übertragungen (§ 32 Abs. 6 EStG) sind aktuell nicht modelliert;
  // `childAllowance` bleibt daher rein informatorisch (siehe Tooltip in
  // `i18n/de.ts` -> `form.childAllowanceInfoTooltip`).
  return {
    personKey: 'user',
    age: s.age,
    taxClass: parseTaxClass(s.taxClass),
    churchTax: s.paysChurchTax,
    state: s.federalState ?? '',
    healthInsuranceRate: fullKvRate(s.healthInsuranceAdditionalRate),
    kvKind: isPkv(s.healthInsurance) ? 'pkv' : 'gkv',
    privateAnnualKV: s.privateHealthInsuranceAnnual,
    privateAnnualPV: s.privateCareInsuranceAnnual,
    pensionInsurance: isSvSubject(s.pensionInsurance),
    unemploymentInsurance: isSvSubject(s.unemploymentInsurance),
    activeTaxSubject: true,
    hasChildren: s.hasChildren,
    childrenUnder25: s.childrenUnder25,
    singleParentReliefEligible: !s.withSpouse && s.hasChildren && s.childrenUnder25 > 0 && s.isAlleinerziehend
  };
}

/**
 * Single-Modus (withSpouse=false): liefert ein neutrales Spouse-Profil mit
 * 0 €-Finanzwerten. Ergebnis: die Engine berechnet für Spouse 0 € SV / 0 € ESt /
 * 0 € Netto - mathematisch äquivalent zu „kein Ehepartner“ für das User-Resultat.
 * Engine bleibt unangetastet (calculation/* ist eingefroren); UI blendet die
 * Spouse-Spalte separat aus.
 */
function nullSpouseProfile(s: UserInputSnapshot): PersonProfile {
  return {
    personKey: 'spouse',
    age: 0,
    taxClass: 1,
    churchTax: false,
    state: s.federalState ?? '',
    healthInsuranceRate: ALLGEMEINER_KV_RATE,
    pensionInsurance: false,
    unemploymentInsurance: false,
    activeTaxSubject: false,
    hasChildren: s.hasChildren,
    childrenUnder25: s.childrenUnder25,
    singleParentReliefEligible: false
  };
}

export function inputToProfileSpouse(s: UserInputSnapshot): PersonProfile {
  if (!s.withSpouse) return nullSpouseProfile(s);
  return {
    personKey: 'spouse',
    age: s.spouseAge,
    taxClass: parseTaxClass(s.spouseTaxClass),
    // Produktannahme: Familie modelliert keinen gemischten Kirchensteuerstatus.
    // Der gemeinsame Schalter beim User gilt fuer beide Ehegatten.
    churchTax: s.paysChurchTax,
    state: s.federalState ?? '',
    healthInsuranceRate: fullKvRate(s.spouseHealthInsuranceAdditionalRate),
    kvKind: isPkv(s.spouseHealthInsurance) ? 'pkv' : 'gkv',
    privateAnnualKV: s.spousePrivateHealthInsuranceAnnual,
    privateAnnualPV: s.spousePrivateCareInsuranceAnnual,
    pensionInsurance: isSvSubject(s.spousePensionInsurance),
    unemploymentInsurance: isSvSubject(s.spouseUnemploymentInsurance),
    activeTaxSubject: true,
    hasChildren: s.hasChildren,
    childrenUnder25: s.childrenUnder25,
    singleParentReliefEligible: false
  };
}

export function inputToIncomeUser(s: UserInputSnapshot): PersonIncomeData {
  const unemploymentDate = parseIso(s.unemploymentDate);
  // Bruttolohn alter Job (Jahressumme bis zum Tag vor Arbeitslosigkeit)
  // -> durchschnittliches Monatsbrutto = Jahressumme / Anzahl gearbeiteter Monate (1-basiert).
  // Beispiel: Arbeitslos ab 01.08.2026 -> 7 Arbeitsmonate (Jan..Jul) -> /7.
  const monthsWorkedThisYear = unemploymentDate ? Math.max(unemploymentDate.getMonth(), 1) : 12;
  const monthlyGrossOldJob = s.oldEmployerIncomeCurrentYear / monthsWorkedThisYear;
  const lastMonthlyGrossBeforeUnemployment = s.lastMonthlyGrossBeforeUnemployment > 0 ? s.lastMonthlyGrossBeforeUnemployment : monthlyGrossOldJob;

  const userIncomeShare = s.withSpouse ? s.sharedIncomeUserShare / 100 : 1;
  const userDonationShare = s.withSpouse ? s.sharedDonationUserShare / 100 : 1;

  // § 158 SGB III Ruhezeit + § 159 SGB III Sperrzeit:
  // Ruhezeit verschiebt nur den ALG-Beginn, ohne die Anspruchsdauer zu kürzen.
  // Sperrzeit verschiebt den Beginn UND kürzt die Anspruchsdauer um die gleichen Monate.
  const sperrzeitMonths = s.hasBenefitReductionPeriod ? Math.max(0, s.benefitReductionMonths) : 0;
  const ruhezeitMonths = s.hasBenefitSuspensionPeriod ? Math.max(0, s.benefitSuspensionMonths) : 0;
  const algShiftMonths = sperrzeitMonths + ruhezeitMonths;
  const algStartDate =
    unemploymentDate && algShiftMonths > 0
      ? new Date(unemploymentDate.getFullYear(), unemploymentDate.getMonth() + algShiftMonths, unemploymentDate.getDate())
      : unemploymentDate;
  const fullDuration = deriveAlgDurationMonths(s.age, s.alvInsuranceMonthsLast5Years);
  // ALG-I-Anspruch besteht nur, wenn der User in den letzten 12 Monaten Beiträge zur ALV
  // geleistet hat (= AN-pflichtbeitrag). 'notMandatory' (z.B. Beamte, Selbstständige) und
  // 'employerOnly' bedeuten keinen AN-Beitrag -> kein ALG-Anspruch (§ 142 SGB III).
  // Wir nehmen Monatsbetrag UND Anspruchsdauer beide als Engine-Result konsistent bleibt
  // (kein „Cash-Loch“ mit Sperrzeit auf 0-Anspruch, keine Inkonsistenz „kein ALV gezahlt,
  // aber ALG kassiert“).
  const isAlvSubject = isSvSubject(s.unemploymentInsurance);
  const monthlyUnemploymentBenefit = isAlvSubject ? s.unemploymentBenefitMonthly : 0;
  const unemploymentBenefitDuration = isAlvSubject ? Math.max(0, fullDuration - sperrzeitMonths) : 0;

  return {
    personKey: 'user',
    monthlyGrossOldJob,
    lastMonthlyGrossBeforeUnemployment,
    unemployed: !!unemploymentDate,
    unemploymentDate,
    algStartDate,
    monthlyUnemploymentBenefit,
    unemploymentBenefitDuration,
    severance: s.severanceGross,
    rentalIncome: s.rentalIncomeYearly * userIncomeShare,
    otherIncome: s.withSpouse ? s.otherIncomeYearly * userIncomeShare : s.otherIncomeYearly,
    annualDonation: s.donationYearly * userDonationShare,
    childBenefitMonthlyPerChild: s.childBenefitMonthlyPerChild
  };
}

export function inputToIncomeSpouse(s: UserInputSnapshot): PersonIncomeData {
  if (!s.withSpouse) {
    return {
      personKey: 'spouse',
      monthlyGrossOldJob: 0,
      lastMonthlyGrossBeforeUnemployment: 0,
      unemployed: false,
      unemploymentDate: null,
      algStartDate: null,
      monthlyUnemploymentBenefit: 0,
      unemploymentBenefitDuration: 0,
      severance: 0,
      rentalIncome: 0,
      otherIncome: 0,
      annualDonation: 0,
      childBenefitMonthlyPerChild: s.childBenefitMonthlyPerChild
    };
  }

  const userIncomeShare = s.sharedIncomeUserShare / 100;
  const userDonationShare = s.sharedDonationUserShare / 100;
  return {
    personKey: 'spouse',
    monthlyGrossOldJob: s.spouseGrossIncomeYearly / 12,
    lastMonthlyGrossBeforeUnemployment: s.spouseGrossIncomeYearly / 12,
    unemployed: false,
    unemploymentDate: null,
    algStartDate: null,
    monthlyUnemploymentBenefit: 0,
    unemploymentBenefitDuration: 0,
    severance: 0,
    rentalIncome: s.rentalIncomeYearly * (1 - userIncomeShare),
    otherIncome: s.otherIncomeYearly * (1 - userIncomeShare),
    annualDonation: s.donationYearly * (1 - userDonationShare),
    childBenefitMonthlyPerChild: s.childBenefitMonthlyPerChild
  };
}

// ---------- Slider-Konfiguration für CalculationView (NEUE_ARBEIT) ----------

/** Tax-Jahre: Jahr der Arbeitslosigkeit + folgendes Jahr. */
export function deriveTaxYears(s: UserInputSnapshot): readonly number[] {
  const d = parseIso(s.unemploymentDate);
  const y = d ? d.getFullYear() : TAX_PARAMETER_YEAR;
  return [y, y + 1] as const;
}

/**
 * Slider 1: newJobStartDate-Optionen.
 * - hasNewJob=true -> nur DER vom Benutzer eingegebene Termin (kein Sweep, kein Probieren).
 *   Die Berechnung/Diagramm zeigen dann genau diese eine Variante.
 * - hasNewJob=false -> 17 Monate ab Arbeitslosigkeit als Sweep-Bereich.
 */
export function deriveNewJobStartOptions(s: UserInputSnapshot): Date[] {
  if (s.hasNewJob) {
    const fixed = parseIso(s.newJobStartDate);
    if (fixed) return [fixed];
  }
  const start = parseIso(s.unemploymentDate) ?? new Date(TAX_PARAMETER_YEAR, 7, 1);
  const out: Date[] = [];
  for (let i = 0; i < 17; i++) {
    out.push(new Date(start.getFullYear(), start.getMonth() + i, 1));
  }
  return out;
}

/**
 * Slider 2: monthlyGrossNewJob-Optionen.
 * - hasNewJob=true -> nur DAS vom Benutzer angegebene Monatsbrutto.
 * - hasNewJob=false -> Min..Max in Schrittweite (Sweep über Gehaltsbandbreite).
 */
export function deriveMonthlyGrossOptions(s: UserInputSnapshot): number[] {
  if (s.hasNewJob && s.newJobMonthlySalary > 0) {
    return [s.newJobMonthlySalary];
  }
  const min = s.expectedMonthlySalaryMin;
  const max = s.expectedMonthlySalaryMax;
  const step = Math.max(s.expectedMonthlySalaryStep, 1);
  const out: number[] = [];
  let last: number | undefined;
  for (let v = min; v <= max; v += step) {
    out.push(v);
    last = v;
  }
  if (last !== max) out.push(max);
  return out;
}

/**
 * SelectButton: severancePaymentDate-Optionen.
 * A) 15. des Arbeitslosigkeitsmonats (gleiches Jahr)
 * B) 15.01. des Folgejahres (Fünftelregelung in steuergünstiges Jahr verschieben)
 */
export function deriveSeveranceDateOptions(s: UserInputSnapshot): Date[] {
  const d = parseIso(s.unemploymentDate);
  if (!d) return [new Date(TAX_PARAMETER_YEAR, 7, 15), new Date(TAX_PARAMETER_YEAR + 1, 0, 15)];
  return [new Date(d.getFullYear(), d.getMonth(), 15), new Date(d.getFullYear() + 1, 0, 15)];
}
