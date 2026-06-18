// 计算引擎：从原始输入计算到 zvE_ohneKFB 的全部纯函数。
// 完全独立、无副作用、可单元测试；不依赖任何 Vue 或现有 composable。

import {
  ARBEITNEHMER_PAUSCHBETRAG,
  BBG_KV_PV_MONTHLY_2026,
  BBG_RV_ALV_MONTHLY_2026,
  PV_RATE_AN_WITH_CHILD,
  PV_RATE_AN_WITH_CHILD_SACHSEN,
  RV_RATE_AN,
  ALV_RATE_AN,
  VORSORGE_KV_KRANKENGELD_ABSCHLAG,
  VORSORGE_BASIS_HOECHSTBETRAG_2026,
  SPENDEN_HOECHSTGRENZE_RATE,
  GRUNDFREIBETRAG_2026,
  TARIF_ZONE2_END_2026,
  TARIF_ZONE3_END_2026,
  TARIF_ZONE4_END_2026,
  TARIF_ZONE2_A_2026,
  TARIF_ZONE2_B_2026,
  TARIF_ZONE3_A_2026,
  TARIF_ZONE3_B_2026,
  TARIF_ZONE3_C_2026,
  TARIF_ZONE4_RATE_2026,
  TARIF_ZONE4_C_2026,
  TARIF_ZONE5_RATE_2026,
  TARIF_ZONE5_C_2026,
  KFB_HALF_PER_CHILD_2026,
  KFB_FULL_PER_CHILD_2026,
  KINDERGELD_PER_MONTH_PER_CHILD_2026,
  SOLI_FREIGRENZE_SINGLE_2026,
  SOLI_FREIGRENZE_JOINT_2026,
  SOLI_RATE,
  SOLI_MILDERUNGSZONE_RATE,
  kirchensteuerRate
} from './constants';
import type {
  PersonProfile,
  PersonIncomeData,
  ScenarioOverride,
  IncomeBreakdown,
  SvBreakdown,
  SvSegment,
  PersonYearResult,
  PersonTaxResult,
  JointTaxResult,
  Veranlagungsart,
  YearComputation
} from './types';

// ---------- 日期 / 月份工具 ----------

/** 整月差：start..end（end 不含）；两端按“该月属于哪个月”取整 */
function fullMonthsBetween(start: Date, end: Date): number {
  if (end <= start) return 0;
  return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
}

/** 在日期上加 n 个月（保持每月 1 号） */
function addMonths(date: Date, n: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + n, 1);
}

/** 把日期裁剪到指定税年内（用于计算与该年的重叠月数） */
function clampToYear(date: Date | null, year: number, fallbackToYearStart: boolean): Date {
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year + 1, 0, 1);
  if (!date) return fallbackToYearStart ? yearStart : yearEnd;
  if (date < yearStart) return yearStart;
  if (date > yearEnd) return yearEnd;
  return date;
}

// ---------- 收入分解（每年每人每场景） ----------

/**
 * 计算单年内单人单场景的收入构成（毛额，未扣 Werbungskosten）。
 * scenario 仅作用于 user；spouse 始终使用其 base 数据，scenario 传任何值都不影响。
 */
export function calcPersonIncome(person: PersonIncomeData, scenario: ScenarioOverride, year: number): IncomeBreakdown {
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year + 1, 0, 1);

  // ---- 旧工作工资：从年初到 unemploymentDate（未失业则全年） ----
  // 注：spouse 没有 unemploymentDate，等同于全年旧工作。
  const oldEndRaw = person.unemploymentDate ?? yearEnd;
  const oldEnd = clampToYear(oldEndRaw, year, false);
  const oldMonths = fullMonthsBetween(yearStart, oldEnd);
  const oldJobWage = oldMonths * person.monthlyGrossOldJob;

  // ---- 新工作起始日期：仅 user 适用（且仅 NEUE_ARBEIT 场景非 null） ----
  // spouse 不会有 newJobStartDate（其 personKey === 'spouse'）
  const newJobStartRaw = person.personKey === 'user' ? scenario.newJobStartDate : null;

  // ---- ALG I：从 algStartDate 起，到 min(algEnd, newJobStart, yearEnd) ----
  // Sperrzeit/Ruhezeit (§ 158/159 SGB III) wird im Adapter durch Setzen von algStartDate
  // > unemploymentDate abgebildet; während [unemploymentDate, algStartDate) gibt es kein ALG.
  let algMonths = 0;
  if (person.unemploymentDate && person.unemploymentBenefitDuration) {
    const algStartRaw = person.algStartDate ?? person.unemploymentDate;
    const algMaxEnd = addMonths(algStartRaw, person.unemploymentBenefitDuration);
    let algEndRaw = algMaxEnd;
    if (newJobStartRaw && newJobStartRaw < algEndRaw) algEndRaw = newJobStartRaw;
    const algStart = clampToYear(algStartRaw, year, true);
    const algEnd = clampToYear(algEndRaw, year, false);
    algMonths = Math.max(0, fullMonthsBetween(algStart, algEnd));
  }
  const unemploymentBenefit = algMonths * person.monthlyUnemploymentBenefit;

  // ---- 新工作工资：从 newJobStartDate 到年末 ----
  let newMonths = 0;
  let newMonthlyGross = 0;
  if (newJobStartRaw) {
    const newStart = clampToYear(newJobStartRaw, year, true);
    newMonths = Math.max(0, fullMonthsBetween(newStart, yearEnd));
    newMonthlyGross = scenario.monthlyGrossNewJob;
  }
  const newJobWage = newMonths * newMonthlyGross;

  // ---- Abfindung：仅在 severancePaymentDate 落入本税年时计入本年 ----
  const severance = person.personKey === 'user' && scenario.severancePaymentDate.getFullYear() === year ? person.severance : 0;

  // ---- SV-Segmente：旧工作段 / 新工作段（ALG 段不计 SV-AN） ----
  const svSegments: SvSegment[] = [];
  if (oldMonths > 0) {
    svSegments.push({ kind: 'oldJob', monthlyGross: person.monthlyGrossOldJob, months: oldMonths });
  }
  if (newMonths > 0) {
    svSegments.push({ kind: 'newJob', monthlyGross: newMonthlyGross, months: newMonths });
  }

  return {
    oldJobWage,
    newJobWage,
    unemploymentBenefit,
    rentalIncome: person.rentalIncome,
    severance,
    svSegments
  };
}

// ---------- Sozialversicherung（AN-Anteil） ----------

/**
 * 计算 SV-AN-Anteil 总额（KV/PV/RV/ALV），按月度 BBG 单独封顶。
 * 返回各分量及合计。
 */
export function calcSvAnteil(stamm: PersonProfile, segments: SvSegment[]): SvBreakdown {
  let kv = 0;
  let pv = 0;
  let rv = 0;
  let alv = 0;

  // PV-AN-Satz：in Sachsen 0,5 pp höher als im Rest der Republik（mit Kind = 2,30 %）。
  const pvRate = stamm.state === 'SN' ? PV_RATE_AN_WITH_CHILD_SACHSEN : PV_RATE_AN_WITH_CHILD;

  // Bei PKV: AN zahlt feste Jahresbeiträge unabhängig vom Monatsbrutto; BBG-Logik entfällt.
  // RV/ALV bleiben unverändert (nur an Beschäftigung gekoppelt, nicht an KV-Form).
  //
  // VEREINFACHUNG (PKV während Arbeitslosigkeit, ALG-I-Bezug):
  // Während des ALG-I-Bezugs übernimmt die Bundesagentur für Arbeit (BA) die
  // Krankenversicherungsbeiträge für GKV-Versicherte vollständig und für PKV-
  // Versicherte bis zur Höhe des fiktiven GKV-Beitrags (§ 174 SGB III) - der
  // Basisanteil der PKV ist dadurch typischerweise zum großen Teil abgedeckt;
  // Komfort-/Wahlleistungen trägt der PKV-Versicherte weiterhin selbst.
  //
  // Diese Anwendung berücksichtigt diesen BA-Zuschuss bewusst NICHT: Der vom
  // Benutzer eingegebene Basisanteil (`privateAnnualKV` / `privateAnnualPV`)
  // wird über alle 12 Monate voll abgezogen - auch in Monaten der Arbeits-
  // losigkeit. Ergebnis: Im Liegenbleiben-Szenario werden die PKV-Kosten
  // tendenziell überschätzt -> das Netto liegt etwas unter dem realen Wert ->
  // konservative Richtung (zugunsten der Variante „Neue Arbeit“). Eine genauere
  // Modellierung müsste BA-Zuschuss (= GKV-Höchstbeitrag, monatlich) je
  // arbeitslosem Monat von kv/pv abziehen.
  const isPkv = stamm.kvKind === 'pkv';
  if (isPkv) {
    kv = Math.max(0, stamm.privateAnnualKV ?? 0);
    pv = Math.max(0, stamm.privateAnnualPV ?? 0);
  }

  for (const seg of segments) {
    const cappedKvPv = Math.min(seg.monthlyGross, BBG_KV_PV_MONTHLY_2026);
    const cappedRvAlv = Math.min(seg.monthlyGross, BBG_RV_ALV_MONTHLY_2026);
    if (!isPkv) {
      kv += cappedKvPv * (stamm.healthInsuranceRate / 2) * seg.months;
      pv += cappedKvPv * pvRate * seg.months;
    }
    if (stamm.pensionInsurance) rv += cappedRvAlv * RV_RATE_AN * seg.months;
    if (stamm.unemploymentInsurance) alv += cappedRvAlv * ALV_RATE_AN * seg.months;
  }

  return { kv, pv, rv, alv };
}

// ---------- Vorsorgeaufwendungen § 10 EStG ----------

/**
 * Vorsorgeaufwendungen-Abzug（vereinfacht）:
 *   GKV: RV-AN × 100 % + KV-AN × 96 %（Krankengeld-Abschlag § 10 Abs. 1 Nr. 3 Satz 4 EStG）+ PV-AN × 100 %
 *   PKV: RV-AN × 100 % + KV-Basisbeitrag × 100 %                                      + PV-Basisbeitrag × 100 %
 * (Bei PKV ist der Krankengeld-Anteil typischerweise nicht im Basisbeitrag enthalten;
 *  der User gibt laut UI-Tooltip nur den Basisanteil ein.)
 * ALV ist NICHT als Sonderausgabe abzugsfähig。
 *
 * Höchstbetragsprüfung Basisaltersvorsorge (§ 10 Abs. 3 EStG): RV-AN + ggf. Rürup ist
 * pro Person auf VORSORGE_BASIS_HOECHSTBETRAG_2026 (≈ 30.230 €) gedeckelt; KV/PV-Basis
 * bleiben ohne Höchstbetrag (Bürgerentlastungsgesetz 2010). In der Praxis greift der Cap
 * im hier modellierten Einkommensbereich nur selten (RV-ANteil ist durch BBG_RV_ALV
 * faktisch auf ≈ 9.430 € p. a. begrenzt), die Prüfung dient als Schutz vor extremen
 * Eingaben / Rürup-Kombinationen。
 */
export function calcPensionExpenseDeduction(sv: SvBreakdown, kvKind: 'gkv' | 'pkv' = 'gkv'): number {
  const kvFactor = kvKind === 'pkv' ? 1 : 1 - VORSORGE_KV_KRANKENGELD_ABSCHLAG;
  const cappedRv = Math.min(sv.rv, VORSORGE_BASIS_HOECHSTBETRAG_2026);
  return cappedRv + sv.kv * kvFactor + sv.pv;
}

// ---------- Spenden § 10b EStG ----------

/** Spende kappen auf 20 % des Gesamtbetrags der Einkünfte */
export function calcDonationDeduction(annualDonation: number, totalIncomeForDonations: number): number {
  const cap = Math.max(0, totalIncomeForDonations) * SPENDEN_HOECHSTGRENZE_RATE;
  return Math.min(annualDonation, cap);
}

// ---------- 单人单年完整计算 ----------

export function computePersonYear(stamm: PersonProfile, einkommen: PersonIncomeData, scenario: ScenarioOverride, year: number): PersonYearResult {
  const income = calcPersonIncome(einkommen, scenario, year);
  const grossWages = income.oldJobWage + income.newJobWage;
  // Werbungskosten-Pauschbetrag nur, wenn überhaupt Arbeitslohn bezogen wurde
  const incomeRelatedExpenses = grossWages > 0 ? ARBEITNEHMER_PAUSCHBETRAG : 0;
  const employmentIncome = grossWages - incomeRelatedExpenses;
  const rentalIncomeNet = income.rentalIncome;
  // Sonstige Einkünfte (§ 22 EStG, vereinfacht netto); direkt in totalIncome.
  const otherIncome = einkommen.otherIncome ?? 0;
  const totalIncome = employmentIncome + rentalIncomeNet + otherIncome;

  const sv = calcSvAnteil(stamm, income.svSegments);
  const pensionExpenseDeduction = calcPensionExpenseDeduction(sv, stamm.kvKind ?? 'gkv');
  // § 10b Höchstgrenze: 20 % des Gesamtbetrags der Einkünfte INKL. Abfindung.
  // Die Fünftelregelung (§ 34 EStG) ändert nur die Tarifberechnung, nicht die Zugehörigkeit
  // der Abfindung zu den Einkünften aus § 19 EStG.
  const totalIncomeForDonations = totalIncome + income.severance;
  const donationDeduction = calcDonationDeduction(einkommen.annualDonation, totalIncomeForDonations);
  const specialExpenses = pensionExpenseDeduction + donationDeduction;

  const zvEwithoutKFB = totalIncome - specialExpenses;

  return {
    income,
    grossWages,
    incomeRelatedExpenses,
    employmentIncome,
    rentalIncomeNet,
    totalIncome,
    sv,
    pensionExpenseDeduction,
    donationDeduction,
    specialExpenses,
    zvEwithoutKFB
  };
}

// ---------- Einkommensteuertarif § 32a EStG 2026 ----------

/**
 * Tarifliche Einkommensteuer nach Grundtabelle (§ 32a Abs. 1 EStG, Veranlagungszeitraum 2026).
 * zvE wird gemäß Gesetz auf vollen Euro abgerundet, das Ergebnis ebenfalls。
 */
export function grundtarifESt(zvE: number): number {
  if (zvE <= 0) return 0;
  const x = Math.floor(zvE);
  let est: number;
  if (x <= GRUNDFREIBETRAG_2026) return 0;
  if (x <= TARIF_ZONE2_END_2026) {
    const y = (x - GRUNDFREIBETRAG_2026) / 10000;
    est = (TARIF_ZONE2_A_2026 * y + TARIF_ZONE2_B_2026) * y;
  } else if (x <= TARIF_ZONE3_END_2026) {
    const z = (x - TARIF_ZONE2_END_2026) / 10000;
    est = (TARIF_ZONE3_A_2026 * z + TARIF_ZONE3_B_2026) * z + TARIF_ZONE3_C_2026;
  } else if (x <= TARIF_ZONE4_END_2026) {
    est = TARIF_ZONE4_RATE_2026 * x - TARIF_ZONE4_C_2026;
  } else {
    est = TARIF_ZONE5_RATE_2026 * x - TARIF_ZONE5_C_2026;
  }
  return Math.floor(est);
}

/** Splittingtabelle § 32a Abs. 5 EStG（für Zusammenveranlagung; bleibt für mögliche Vergleiche）：2 × Grundtarif(zvE/2) */
export function splittingESt(zvE: number): number {
  return 2 * grundtarifESt(zvE / 2);
}

/**
 * § 32b EStG Progressionsvorbehalt（vereinfacht, nur ALG I als Lohnersatzleistung）：
 * besonderer Steuersatz = ESt(zvE + alg) / (zvE + alg); tarifliche ESt = besSatz × zvE。
 * In Einzelveranlagung: tarifFn = grundtarifEst。
 */
export function estWithProgressionsvorbehalt(zvE: number, alg: number, joint: boolean): number {
  const tarifFn = joint ? splittingESt : grundtarifESt;
  if (alg <= 0 || zvE <= 0) return tarifFn(zvE);
  const total = zvE + alg;
  const estTotal = tarifFn(total);
  if (total <= 0) return tarifFn(zvE);
  const satz = estTotal / total;
  return zvE * satz;
}

/**
 * § 34 Abs. 1 EStG Fünftelregelung kombiniert mit § 32b Progressionsvorbehalt。
 *
 * WICHTIG：zvEord ist das **ordentliche** zvE OHNE die außerordentlichen Einkünfte
 * (Abfindung). Der Aufrufer übergibt also `zvEwithoutKFB` bzw. `zvEwithKFB` aus
 * `PersonYearResult` direkt - diese enthalten Abfindung nicht。
 *
 *   tariflicheESt = ESt(zvEord) + 5 × [ ESt(zvEord + Abfindung/5) - ESt(zvEord) ]
 *
 * Ohne Abfindung degeneriert die Formel zu ESt(zvEord)。
 */
export function tariffEstWithFuenftelAndProgrV(zvEord: number, abfindung: number, alg: number, joint: boolean): number {
  const estOhneAO = estWithProgressionsvorbehalt(zvEord, alg, joint);
  if (abfindung <= 0) return estOhneAO;
  const estMitFuenftel = estWithProgressionsvorbehalt(zvEord + abfindung / 5, alg, joint);
  const zusatz = 5 * (estMitFuenftel - estOhneAO);
  return estOhneAO + Math.max(0, zusatz);
}

/**
 * Vollständige Berechnung der ESt einer einzelnen Person（Einzelveranlagung § 26a EStG）
 * inklusive Günstigerprüfung KFB-Hälfte + Kindergeld-Hälfte（§ 31 EStG, hälftige Aufteilung）。
 * childrenJoint：gemeinsame Kinderzahl（jeder Elternteil bekommt KFB-Hälfte und Kindergeld-Hälfte）。
 */
export function computePersonTax(
  stamm: PersonProfile,
  person: PersonYearResult,
  einkommen: PersonIncomeData,
  childrenJoint: number
): PersonTaxResult {
  const zvEwithoutKFB = person.zvEwithoutKFB;
  const kfbHalf = childrenJoint * KFB_HALF_PER_CHILD_2026;
  const zvEwithKFB = zvEwithoutKFB - kfbHalf;
  const severance = person.income.severance;
  const unemploymentBenefit = person.income.unemploymentBenefit;

  const tarifIncomeTaxWithoutKFB = tariffEstWithFuenftelAndProgrV(zvEwithoutKFB, severance, unemploymentBenefit, false);
  const tarifIncomeTaxWithKFB = tariffEstWithFuenftelAndProgrV(zvEwithKFB, severance, unemploymentBenefit, false);

  // Kindergeld-Anteil（Hälfte pro Elternteil）für Günstigerprüfung。Erlaubt User-Override。
  const kindergeldMonthlyPerChild = einkommen.childBenefitMonthlyPerChild ?? KINDERGELD_PER_MONTH_PER_CHILD_2026;
  const childBenefitShare = childrenJoint * (kindergeldMonthlyPerChild / 2) * 12;
  const kfbSavings = tarifIncomeTaxWithoutKFB - tarifIncomeTaxWithKFB;
  const kfbPreferred = kfbSavings > childBenefitShare;
  // § 31 Satz 4：bei KFB-Wahl wird（anteiliges）Kindergeld der tariflichen ESt hinzugerechnet。
  const assessedIncomeTax = kfbPreferred ? tarifIncomeTaxWithKFB + childBenefitShare : tarifIncomeTaxWithoutKFB;
  const soli = calcSoli(assessedIncomeTax);
  // Kirchensteuer：8 %/9 % auf festzus. Est, sofern kirchensteuerpflichtig。
  const kirchensteuer = stamm.churchTax ? Math.max(0, assessedIncomeTax) * kirchensteuerRate(stamm.state) : 0;

  return {
    zvEwithoutKFB,
    zvEwithKFB,
    kfbHalf,
    severance,
    unemploymentBenefit,
    tarifIncomeTaxWithoutKFB,
    tarifIncomeTaxWithKFB,
    childBenefitShare,
    kfbSavings,
    kfbPreferred,
    assessedIncomeTax,
    soli,
    kirchensteuer
  };
}

// ---------- Solidaritätszuschlag（§§ 1 ff. SolzG） ----------

/**
 * Solidaritätszuschlag bei Einzelveranlagung 2026。
 *   - ESt ≤ 19.950 €：0 €（Freigrenze）
 *   - sonst：min(5,5 % × ESt；11,9 % × (ESt - 19.950)）
 *     （Milderungszone bis 33.912 €，danach greift der Cap 5,5 % × ESt）
 * ESt wird auf vollen Euro abgerundet，das Ergebnis ebenfalls。
 */
export function calcSoli(assessedIncomeTax: number): number {
  const est = Math.floor(Math.max(0, assessedIncomeTax));
  if (est <= SOLI_FREIGRENZE_SINGLE_2026) return 0;
  const cap = SOLI_RATE * est;
  const milderung = SOLI_MILDERUNGSZONE_RATE * (est - SOLI_FREIGRENZE_SINGLE_2026);
  return Math.floor(Math.min(cap, milderung));
}

/**
 * Solidaritätszuschlag bei Zusammenveranlagung 2026。
 * Verdoppelte Schwellen：Freigrenze 39.900 €，Milderungszone bis 67.824 €。
 *
 * Rechtsgrundlage：§ 3 Abs. 4 SolzG 1995 - bei Anwendung des Splittingverfahrens
 * (§ 32a Abs. 5 EStG) verdoppeln sich Freigrenze und Obergrenze der Milderungszone
 * gegenüber der Einzelveranlagung。Der lineare Cap（5,5 %）und die Milderungsrate
 *（11,9 %）bleiben identisch。
 */
export function calcSoliJoint(assessedIncomeTaxJoint: number): number {
  const est = Math.floor(Math.max(0, assessedIncomeTaxJoint));
  if (est <= SOLI_FREIGRENZE_JOINT_2026) return 0;
  const cap = SOLI_RATE * est;
  const milderung = SOLI_MILDERUNGSZONE_RATE * (est - SOLI_FREIGRENZE_JOINT_2026);
  return Math.floor(Math.min(cap, milderung));
}

// ---------- Zusammenveranlagung（§ 26b EStG） ----------

/**
 * Vollständige gemeinsame Steuerberechnung beider Ehegatten bei Zusammenveranlagung：
 * - gemeinsames zvE = userZvE + spouseZvE（jeweils ohne KFB）
 * - voller KFB pro Kind = childrenJoint × 9.756 €（statt 2 × Hälfte aufgeteilt）
 * - Splittingtarif (§ 32a Abs. 5): ESt = 2 × Grundtarif(zvE/2)
 * - § 32b Progressionsvorbehalt mit summiertem ALG
 * - § 34 Fünftelregelung mit summierter Abfindung（rechnerisch，da nur User Abfindung hat）
 * - Günstigerprüfung § 31 EStG：KFB-Ersparnis vs. volles Kindergeld
 * - Soli mit Joint-Schwellen（39.900 € / 67.824 €）
 */
export function computeJointTax(
  stammUser: PersonProfile,
  stammSpouse: PersonProfile,
  einkommenUser: PersonIncomeData,
  einkommenSpouse: PersonIncomeData,
  user: PersonYearResult,
  spouse: PersonYearResult,
  childrenJoint: number
): JointTaxResult {
  const zvEjointWithoutKFB = user.zvEwithoutKFB + spouse.zvEwithoutKFB;
  const kfbFull = childrenJoint * KFB_FULL_PER_CHILD_2026;
  const zvEjointWithKFB = zvEjointWithoutKFB - kfbFull;
  const severanceJoint = user.income.severance + spouse.income.severance;
  const unemploymentBenefitJoint = user.income.unemploymentBenefit + spouse.income.unemploymentBenefit;

  // Splittingtarif：tariffEstWithFuenftelAndProgrV mit joint=true wendet splittingESt an
  const tarifIncomeTaxWithoutKFB = tariffEstWithFuenftelAndProgrV(zvEjointWithoutKFB, severanceJoint, unemploymentBenefitJoint, true);
  const tarifIncomeTaxWithKFB = tariffEstWithFuenftelAndProgrV(zvEjointWithKFB, severanceJoint, unemploymentBenefitJoint, true);

  // Volles Kindergeld für Günstigerprüfung（User-Override falls vorhanden，sonst Default）。
  const kindergeldMonthlyPerChild =
    einkommenUser.childBenefitMonthlyPerChild ?? einkommenSpouse.childBenefitMonthlyPerChild ?? KINDERGELD_PER_MONTH_PER_CHILD_2026;
  const childBenefitFull = childrenJoint * kindergeldMonthlyPerChild * 12;
  const kfbSavings = tarifIncomeTaxWithoutKFB - tarifIncomeTaxWithKFB;
  const kfbPreferred = kfbSavings > childBenefitFull;
  // § 31 Satz 4：bei KFB-Wahl wird Kindergeld der tariflichen ESt hinzugerechnet。
  const assessedIncomeTax = kfbPreferred ? tarifIncomeTaxWithKFB + childBenefitFull : tarifIncomeTaxWithoutKFB;
  const soli = calcSoliJoint(assessedIncomeTax);
  // Kirchensteuer im Joint-Modus：jeder Ehegatte zahlt KISt nur，wenn er kirchensteuerpflichtig ist。
  // Bemessungsgrundlage：Hälfte der gemeinsamen festzus. ESt（vereinfachte Halbteilung）。
  const halfEst = Math.max(0, assessedIncomeTax) / 2;
  const kistUser = stammUser.churchTax ? halfEst * kirchensteuerRate(stammUser.state) : 0;
  const kistSpouse = stammSpouse.churchTax ? halfEst * kirchensteuerRate(stammSpouse.state) : 0;
  const kirchensteuer = kistUser + kistSpouse;

  return {
    zvEjointWithoutKFB,
    zvEjointWithKFB,
    kfbFull,
    severanceJoint,
    unemploymentBenefitJoint,
    tarifIncomeTaxWithoutKFB,
    tarifIncomeTaxWithKFB,
    childBenefitFull,
    kfbSavings,
    kfbPreferred,
    assessedIncomeTax,
    soli,
    kirchensteuer
  };
}

/**
 * Verteilt das gemeinsame festzus.-ESt + Soli proportional zur Einzel-Tarif-ESt jedes Ehegatten
 * auf die beiden `PersonTaxResult`-Objekte，damit bestehende UI-Aggregationen（Summe user + spouse =
 * Familien-Steuer）auch im Zusammen-Modus korrekt bleiben。KFB-/Kindergeld-/Günstigerprüfungs-Felder
 * bleiben dabei die Einzelveranlagungs-Referenzwerte（informativ）；die maßgeblichen gemeinsamen Werte
 * stehen in `JointTaxResult`。
 */
function distributeJointToPersons(
  userTaxSeparate: PersonTaxResult,
  spouseTaxSeparate: PersonTaxResult,
  joint: JointTaxResult,
  stammUser: PersonProfile,
  stammSpouse: PersonProfile
): { userTax: PersonTaxResult; spouseTax: PersonTaxResult } {
  const denom = userTaxSeparate.tarifIncomeTaxWithoutKFB + spouseTaxSeparate.tarifIncomeTaxWithoutKFB;
  const userShare = denom > 0 ? userTaxSeparate.tarifIncomeTaxWithoutKFB / denom : 0.5;
  const spouseShare = 1 - userShare;
  const userAssessed = joint.assessedIncomeTax * userShare;
  const spouseAssessed = joint.assessedIncomeTax * spouseShare;
  const userSoli = joint.soli * userShare;
  const spouseSoli = joint.soli * spouseShare;
  // Kirchensteuer pro Person：Hälfte des gemeinsamen festzus. ESt × individueller Satz，sofern pflichtig。
  const halfEst = Math.max(0, joint.assessedIncomeTax) / 2;
  const userKist = stammUser.churchTax ? halfEst * kirchensteuerRate(stammUser.state) : 0;
  const spouseKist = stammSpouse.churchTax ? halfEst * kirchensteuerRate(stammSpouse.state) : 0;
  return {
    userTax: { ...userTaxSeparate, assessedIncomeTax: userAssessed, soli: userSoli, kirchensteuer: userKist },
    spouseTax: { ...spouseTaxSeparate, assessedIncomeTax: spouseAssessed, soli: spouseSoli, kirchensteuer: spouseKist }
  };
}

// ---------- 单年两场景两人聚合 ----------

/** Eingaben für `computeYear` als Options-Objekt（hält die Parameteranzahl niedrig）。 */
export interface ComputeYearInput {
  profileUser: PersonProfile;
  profileSpouse: PersonProfile;
  incomeUser: PersonIncomeData;
  incomeSpouse: PersonIncomeData;
  scenarioStayUnemployed: ScenarioOverride;
  scenarioNewJob: ScenarioOverride;
  year: number;
  /** Default 'separate'（§ 26a EStG） */
  veranlagungsart?: Veranlagungsart;
}

export function computeYear(input: ComputeYearInput): YearComputation {
  const { profileUser, profileSpouse, incomeUser, incomeSpouse, scenarioStayUnemployed, scenarioNewJob, year, veranlagungsart = 'separate' } = input;

  // Gemeinsame Kinderzahl（jeder Elternteil bekommt KFB-/Kindergeld-Hälfte bei Einzelveranlagung；
  // bei Zusammenveranlagung wird der volle KFB einmal abgezogen。）
  //
  // VEREINFACHUNG：Die UI bietet im Eingabeformular zwar das Feld
  // `childAllowance`（0 / 0,5 / 1,0 / 1,5 / 2,0 Zähler je Kind）an，mit dem
  // Eltern eine asymmetrische Übertragung des Kinderfreibetrags abbilden
  // könnten（§ 32 Abs. 6 EStG，Übertragung auf den anderen Elternteil）。
  // Diese Anwendung berücksichtigt das **bewusst nicht**：Bei Einzelveranlagung
  // bekommt jeder Elternteil immer die halbe KFB-/Kindergeld-Quote，bei
  // Zusammenveranlagung den vollen KFB。`childAllowance` ist daher rein
  // informatorisch und fließt NICHT in die Berechnung ein。Hinweis steht im
  // Tooltip von `form.childAllowance` in `i18n/de.ts`。
  const childrenJoint = Math.max(profileUser.childrenUnder25, profileSpouse.childrenUnder25);

  const stayUser = computePersonYear(profileUser, incomeUser, scenarioStayUnemployed, year);
  const staySpouse = computePersonYear(profileSpouse, incomeSpouse, scenarioStayUnemployed, year);
  const newJobUser = computePersonYear(profileUser, incomeUser, scenarioNewJob, year);
  const newJobSpouse = computePersonYear(profileSpouse, incomeSpouse, scenarioNewJob, year);

  // Einzel-PersonTaxResult immer berechnen - dient bei Zusammenveranlagung als Referenz für die Verteilung。
  const stayUserTaxSeparate = computePersonTax(profileUser, stayUser, incomeUser, childrenJoint);
  const staySpouseTaxSeparate = computePersonTax(profileSpouse, staySpouse, incomeSpouse, childrenJoint);
  const newJobUserTaxSeparate = computePersonTax(profileUser, newJobUser, incomeUser, childrenJoint);
  const newJobSpouseTaxSeparate = computePersonTax(profileSpouse, newJobSpouse, incomeSpouse, childrenJoint);

  if (veranlagungsart === 'joint') {
    const stayJoint = computeJointTax(profileUser, profileSpouse, incomeUser, incomeSpouse, stayUser, staySpouse, childrenJoint);
    const newJobJoint = computeJointTax(profileUser, profileSpouse, incomeUser, incomeSpouse, newJobUser, newJobSpouse, childrenJoint);
    const stayDist = distributeJointToPersons(stayUserTaxSeparate, staySpouseTaxSeparate, stayJoint, profileUser, profileSpouse);
    const newJobDist = distributeJointToPersons(newJobUserTaxSeparate, newJobSpouseTaxSeparate, newJobJoint, profileUser, profileSpouse);
    return {
      year,
      mode: 'joint',
      stayUnemployed: { user: stayUser, spouse: staySpouse, ...stayDist, jointTax: stayJoint },
      newJob: { user: newJobUser, spouse: newJobSpouse, ...newJobDist, jointTax: newJobJoint }
    };
  }

  return {
    year,
    mode: 'separate',
    stayUnemployed: {
      user: stayUser,
      spouse: staySpouse,
      userTax: stayUserTaxSeparate,
      spouseTax: staySpouseTaxSeparate
    },
    newJob: {
      user: newJobUser,
      spouse: newJobSpouse,
      userTax: newJobUserTaxSeparate,
      spouseTax: newJobSpouseTaxSeparate
    }
  };
}
