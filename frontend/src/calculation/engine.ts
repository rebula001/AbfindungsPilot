// 计算引擎：从原始输入计算到 zvE_ohneKFB 的全部纯函数。
// 完全独立、无副作用、可单元测试；不依赖任何 Vue 或现有 composable。

import {
  ARBEITNEHMER_PAUSCHBETRAG,
  BBG_KV_PV_MONTHLY_2026,
  BBG_RV_ALV_MONTHLY_2026,
  ALLGEMEINER_KV_RATE,
  ERMAESSIGTER_KV_RATE,
  PV_RATE_TOTAL_WITH_CHILD,
  PV_RATE_AN_WITH_CHILD,
  PV_RATE_AN_WITH_CHILD_SACHSEN,
  PV_CHILDLESS_SURCHARGE_RATE,
  PV_CHILD_DISCOUNT_RATE,
  PV_CHILD_DISCOUNT_MAX_CHILDREN,
  RV_RATE_AN,
  ALV_RATE_AN,
  VORSORGE_KV_KRANKENGELD_ABSCHLAG,
  VORSORGE_BASIS_HOECHSTBETRAG_2026,
  SPENDEN_HOECHSTGRENZE_RATE,
  SONDERAUSGABEN_PAUSCHBETRAG_SINGLE,
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
  ENTLASTUNGSBETRAG_ALLEINERZIEHENDE_BASE_2026,
  ENTLASTUNGSBETRAG_ALLEINERZIEHENDE_ADDITIONAL_CHILD_2026,
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
  SelfPaidHealthInsuranceSegment,
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

function firstDayOfNextMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}

function maxDate(...dates: Date[]): Date {
  return new Date(Math.max(...dates.map((d) => d.getTime())));
}

function minDate(...dates: Date[]): Date {
  return new Date(Math.min(...dates.map((d) => d.getTime())));
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
  let algCoverageEndRaw: Date | null = null;
  if (person.unemploymentDate && person.unemploymentBenefitDuration) {
    const algStartRaw = person.algStartDate ?? person.unemploymentDate;
    const algMaxEnd = addMonths(algStartRaw, person.unemploymentBenefitDuration);
    algCoverageEndRaw = algMaxEnd;
    let algEndRaw = algMaxEnd;
    if (newJobStartRaw && newJobStartRaw < algEndRaw) algEndRaw = newJobStartRaw;
    const algStart = clampToYear(algStartRaw, year, true);
    const algEnd = clampToYear(algEndRaw, year, false);
    algMonths = Math.max(0, fullMonthsBetween(algStart, algEnd));
  } else if (person.unemploymentDate) {
    algCoverageEndRaw = person.unemploymentDate;
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

  // ---- Freiwillige GKV/PV nach ALG-I-Ende wegen Entlassungsentschaedigung ----
  // § 10 Abs. 1 S. 4 SGB V blockiert die Familienversicherung fuer die Monate,
  // in denen die Abfindung rechnerisch durch das letzte Monatsentgelt gedeckt ist.
  // Die App modelliert daraus konservativ eine Selbstzahler-Phase nach ALG-I-Ende
  // und vor Beginn einer neuen Arbeit. RV/ALV entstehen in dieser Phase nicht.
  const selfPaidHealthInsuranceSegments: SelfPaidHealthInsuranceSegment[] = [];
  if (person.personKey === 'user' && person.unemploymentDate && person.severance > 0 && person.lastMonthlyGrossBeforeUnemployment > 0) {
    const severanceMonths = Math.ceil(person.severance / person.lastMonthlyGrossBeforeUnemployment);
    const severanceCoverageStartRaw = firstDayOfNextMonth(scenario.severancePaymentDate);
    const severanceCoverageEndRaw = addMonths(severanceCoverageStartRaw, severanceMonths);
    const postAlgStartRaw = algCoverageEndRaw ?? person.unemploymentDate;
    const selfPayStartRaw = maxDate(person.unemploymentDate, postAlgStartRaw, severanceCoverageStartRaw);
    const selfPayEndRaw = minDate(newJobStartRaw ?? yearEnd, severanceCoverageEndRaw, yearEnd);
    const selfPayStart = clampToYear(selfPayStartRaw, year, true);
    const selfPayEnd = clampToYear(selfPayEndRaw, year, false);
    const selfPayMonths = Math.max(0, fullMonthsBetween(selfPayStart, selfPayEnd));
    if (selfPayMonths > 0) {
      selfPaidHealthInsuranceSegments.push({
        kind: 'postAlgUnemployed',
        monthlyGrossBeforeCap: person.lastMonthlyGrossBeforeUnemployment,
        monthlyAssessment: Math.min(person.lastMonthlyGrossBeforeUnemployment, BBG_KV_PV_MONTHLY_2026),
        months: selfPayMonths
      });
    }
  }

  return {
    oldJobWage,
    newJobWage,
    unemploymentBenefit,
    rentalIncome: person.rentalIncome,
    severance,
    svSegments,
    selfPaidHealthInsuranceSegments
  };
}

// ---------- Sozialversicherung（AN-Anteil） ----------

/**
 * PV-AN-Satz 2026 nach § 55 Abs. 3 und § 58 SGB XI.
 *
 * Vereinfachung: Die Eingabe enthält nur das Alter, kein Geburtsdatum. Der
 * Kinderlosenzuschlag wird daher ganzjährig ab age >= 23 berücksichtigt,
 * obwohl er rechtlich erst nach Ablauf des Geburtstagsmonats beginnt.
 */
export function calcPvRateAn(stamm: PersonProfile): number {
  const baseRate = stamm.state === 'SN' ? PV_RATE_AN_WITH_CHILD_SACHSEN : PV_RATE_AN_WITH_CHILD;
  const hasAnyChildren = stamm.hasChildren || stamm.childrenUnder25 > 0;

  if (!hasAnyChildren) {
    return stamm.age >= 23 ? baseRate + PV_CHILDLESS_SURCHARGE_RATE : baseRate;
  }

  const relevantChildrenUnder25 = Math.max(0, Math.min(stamm.childrenUnder25, PV_CHILD_DISCOUNT_MAX_CHILDREN));
  const discountChildren = Math.max(0, relevantChildrenUnder25 - 1);
  return baseRate - discountChildren * PV_CHILD_DISCOUNT_RATE;
}

/** PV-Mitgliedssatz fuer Selbstzahler, ohne Arbeitgeber-/Sachsen-Aufteilung. */
export function calcPvRateMember(stamm: PersonProfile): number {
  const hasAnyChildren = stamm.hasChildren || stamm.childrenUnder25 > 0;

  if (!hasAnyChildren) {
    return stamm.age >= 23 ? PV_RATE_TOTAL_WITH_CHILD + PV_CHILDLESS_SURCHARGE_RATE : PV_RATE_TOTAL_WITH_CHILD;
  }

  const relevantChildrenUnder25 = Math.max(0, Math.min(stamm.childrenUnder25, PV_CHILD_DISCOUNT_MAX_CHILDREN));
  const discountChildren = Math.max(0, relevantChildrenUnder25 - 1);
  return PV_RATE_TOTAL_WITH_CHILD - discountChildren * PV_CHILD_DISCOUNT_RATE;
}

/**
 * 计算 SV-AN-Anteil 总额（KV/PV/RV/ALV），按月度 BBG 单独封顶。
 * 返回各分量及合计。
 */
export function calcSvAnteil(
  stamm: PersonProfile,
  segments: SvSegment[],
  selfPaidHealthInsuranceSegments: SelfPaidHealthInsuranceSegment[] = []
): SvBreakdown {
  let kv = 0;
  let pv = 0;
  let rv = 0;
  let alv = 0;
  let kvEmployment = 0;
  let pvEmployment = 0;
  let rvEmployment = 0;
  let alvEmployment = 0;
  let kvSelfPaidAfterAlg = 0;
  let pvSelfPaidAfterAlg = 0;
  let selfPaidHealthInsuranceMonths = 0;
  let selfPaidHealthInsuranceMonthlyGross = 0;
  let selfPaidHealthInsuranceMonthlyBase = 0;

  const pvRate = calcPvRateAn(stamm);
  const pvMemberRate = calcPvRateMember(stamm);
  const selfPaidKvRate = ERMAESSIGTER_KV_RATE + Math.max(0, stamm.healthInsuranceRate - ALLGEMEINER_KV_RATE);

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
    kvEmployment = kv;
    pvEmployment = pv;
  }

  for (const seg of segments) {
    const cappedKvPv = Math.min(seg.monthlyGross, BBG_KV_PV_MONTHLY_2026);
    const cappedRvAlv = Math.min(seg.monthlyGross, BBG_RV_ALV_MONTHLY_2026);
    if (!isPkv) {
      const kvPart = cappedKvPv * (stamm.healthInsuranceRate / 2) * seg.months;
      const pvPart = cappedKvPv * pvRate * seg.months;
      kv += kvPart;
      pv += pvPart;
      kvEmployment += kvPart;
      pvEmployment += pvPart;
    }
    if (stamm.pensionInsurance) {
      const rvPart = cappedRvAlv * RV_RATE_AN * seg.months;
      rv += rvPart;
      rvEmployment += rvPart;
    }
    if (stamm.unemploymentInsurance) {
      const alvPart = cappedRvAlv * ALV_RATE_AN * seg.months;
      alv += alvPart;
      alvEmployment += alvPart;
    }
  }

  if (!isPkv) {
    for (const seg of selfPaidHealthInsuranceSegments) {
      const cappedKvPv = Math.min(seg.monthlyAssessment, BBG_KV_PV_MONTHLY_2026);
      const kvPart = cappedKvPv * selfPaidKvRate * seg.months;
      const pvPart = cappedKvPv * pvMemberRate * seg.months;
      kv += kvPart;
      pv += pvPart;
      kvSelfPaidAfterAlg += kvPart;
      pvSelfPaidAfterAlg += pvPart;
      selfPaidHealthInsuranceMonths += seg.months;
      selfPaidHealthInsuranceMonthlyGross = Math.max(selfPaidHealthInsuranceMonthlyGross, seg.monthlyGrossBeforeCap);
      selfPaidHealthInsuranceMonthlyBase = Math.max(selfPaidHealthInsuranceMonthlyBase, cappedKvPv);
    }
  }

  return {
    kv,
    pv,
    rv,
    alv,
    kvEmployment,
    pvEmployment,
    rvEmployment,
    alvEmployment,
    kvSelfPaidAfterAlg,
    pvSelfPaidAfterAlg,
    selfPaidHealthInsuranceMonths,
    selfPaidHealthInsuranceMonthlyGross,
    selfPaidHealthInsuranceMonthlyBase
  };
}

// ---------- Vorsorgeaufwendungen § 10 EStG ----------

/**
 * Vorsorgeaufwendungen-Abzug（vereinfacht）:
 *   GKV: RV-AN × 100 % + KV-AN Beschäftigung × 96 %（Krankengeld-Abschlag）+
 *        KV-Selbstzahlung ohne Krankengeldanspruch × 100 % + PV × 100 %
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
  const cappedRv = Math.min(sv.rv, VORSORGE_BASIS_HOECHSTBETRAG_2026);
  if (kvKind === 'gkv') {
    const employmentKvDeduction = sv.kvEmployment * (1 - VORSORGE_KV_KRANKENGELD_ABSCHLAG);
    return cappedRv + employmentKvDeduction + sv.kvSelfPaidAfterAlg + sv.pv;
  }
  return cappedRv + sv.kv + sv.pv;
}

// ---------- Spenden § 10b EStG ----------

/** Spende kappen auf 20 % des Gesamtbetrags der Einkünfte */
export function calcDonationDeduction(annualDonation: number, totalIncomeForDonations: number): number {
  const cap = Math.max(0, totalIncomeForDonations) * SPENDEN_HOECHSTGRENZE_RATE;
  return Math.min(annualDonation, cap);
}

/** Allgemeine Sonderausgaben nach § 10c EStG: mindestens 36 € pro aktivem Steuerpflichtigen. */
export function calcGeneralSpecialExpensesDeduction(
  stamm: PersonProfile,
  donationDeduction: number
): {
  generalSpecialExpensesDeduction: number;
  sonderausgabenPauschbetrag: number;
} {
  const sonderausgabenPauschbetrag = stamm.activeTaxSubject ? SONDERAUSGABEN_PAUSCHBETRAG_SINGLE : 0;
  return {
    sonderausgabenPauschbetrag,
    generalSpecialExpensesDeduction: Math.max(donationDeduction, sonderausgabenPauschbetrag)
  };
}

/** Entlastungsbetrag fuer Alleinerziehende (§ 24b EStG). */
export function calcSingleParentRelief(stamm: PersonProfile): number {
  if (!stamm.singleParentReliefEligible) return 0;
  const childCount = Math.max(0, Math.floor(stamm.childrenUnder25));
  if (childCount <= 0) return 0;
  return ENTLASTUNGSBETRAG_ALLEINERZIEHENDE_BASE_2026 + Math.max(0, childCount - 1) * ENTLASTUNGSBETRAG_ALLEINERZIEHENDE_ADDITIONAL_CHILD_2026;
}

// ---------- 单人单年完整计算 ----------

export function computePersonYear(stamm: PersonProfile, einkommen: PersonIncomeData, scenario: ScenarioOverride, year: number): PersonYearResult {
  const income = calcPersonIncome(einkommen, scenario, year);
  const grossWages = income.oldJobWage + income.newJobWage;
  // § 9a EStG: Arbeitnehmer-Pauschbetrag nur bis zur Höhe des Arbeitslohns.
  // Der nicht verbrauchte Teil mindert nach § 32b Abs. 2 Nr. 1 EStG das ALG I,
  // das in den Progressionsvorbehalt einfließt.
  const incomeRelatedExpenses = Math.min(Math.max(0, grossWages), ARBEITNEHMER_PAUSCHBETRAG);
  const unusedArbeitnehmerPauschbetrag = Math.max(0, ARBEITNEHMER_PAUSCHBETRAG - incomeRelatedExpenses);
  const unemploymentBenefitPauschbetragDeduction = Math.min(Math.max(0, income.unemploymentBenefit), unusedArbeitnehmerPauschbetrag);
  const unemploymentBenefitForProgression = Math.max(0, income.unemploymentBenefit - unemploymentBenefitPauschbetragDeduction);
  const employmentIncome = grossWages - incomeRelatedExpenses;
  const rentalIncomeNet = income.rentalIncome;
  // Sonstige Einkünfte (§ 22 EStG, vereinfacht netto); direkt in totalIncome.
  const otherIncome = einkommen.otherIncome ?? 0;
  const singleParentRelief = calcSingleParentRelief(stamm);
  const totalIncome = employmentIncome + rentalIncomeNet + otherIncome - singleParentRelief;

  const sv = calcSvAnteil(stamm, income.svSegments, income.selfPaidHealthInsuranceSegments);
  const pensionExpenseDeduction = calcPensionExpenseDeduction(sv, stamm.kvKind ?? 'gkv');
  // § 10b Höchstgrenze: 20 % des Gesamtbetrags der Einkünfte INKL. Abfindung.
  // Die Fünftelregelung (§ 34 EStG) ändert nur die Tarifberechnung, nicht die Zugehörigkeit
  // der Abfindung zu den Einkünften aus § 19 EStG.
  const totalIncomeForDonations = totalIncome + income.severance;
  const donationDeduction = calcDonationDeduction(einkommen.annualDonation, totalIncomeForDonations);
  const { generalSpecialExpensesDeduction, sonderausgabenPauschbetrag } = calcGeneralSpecialExpensesDeduction(stamm, donationDeduction);
  const specialExpenses = pensionExpenseDeduction + generalSpecialExpensesDeduction;

  const zvEwithoutKFB = totalIncome - specialExpenses;

  return {
    income,
    grossWages,
    incomeRelatedExpenses,
    employmentIncome,
    unusedArbeitnehmerPauschbetrag,
    unemploymentBenefitPauschbetragDeduction,
    unemploymentBenefitForProgression,
    rentalIncomeNet,
    singleParentRelief,
    totalIncome,
    sv,
    pensionExpenseDeduction,
    generalSpecialExpensesDeduction,
    sonderausgabenPauschbetrag,
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
 * `progressionIncome` ist ALG I nach Abzug des nicht verbrauchten
 * Arbeitnehmer-Pauschbetrags (§ 32b Abs. 2 Nr. 1 i.V.m. § 9a EStG).
 * besonderer Steuersatz = ESt(zvE + progressionIncome) / (zvE + progressionIncome);
 * tarifliche ESt = besSatz × zvE。
 * In Einzelveranlagung: tarifFn = grundtarifEst。
 */
export function estWithProgressionsvorbehalt(zvE: number, progressionIncome: number, joint: boolean): number {
  const tarifFn = joint ? splittingESt : grundtarifESt;
  if (progressionIncome <= 0 || zvE <= 0) return tarifFn(zvE);
  const total = zvE + progressionIncome;
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
 *   regulär: tariflicheESt = ESt(zvEord) + 5 × [ ESt(zvEord + Abfindung/5) - ESt(zvEord) ]
 *   § 34 Abs. 1 Satz 3: wenn zvEord < 0 und zvEord + Abfindung > 0,
 *   dann tariflicheESt = 5 × ESt((zvEord + Abfindung) / 5)
 *
 * Ohne Abfindung degeneriert die Formel zu ESt(zvEord)。
 */
export function tariffEstWithFuenftelAndProgrV(zvEord: number, abfindung: number, progressionIncome: number, joint: boolean): number {
  const estOhneAO = estWithProgressionsvorbehalt(zvEord, progressionIncome, joint);
  if (abfindung <= 0) return estOhneAO;
  const totalZvE = zvEord + abfindung;
  if (zvEord < 0 && totalZvE > 0) {
    return 5 * estWithProgressionsvorbehalt(totalZvE / 5, progressionIncome, joint);
  }
  const estMitFuenftel = estWithProgressionsvorbehalt(zvEord + abfindung / 5, progressionIncome, joint);
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
  const unemploymentBenefitPauschbetragDeduction = person.unemploymentBenefitPauschbetragDeduction;
  const unemploymentBenefitForProgression = person.unemploymentBenefitForProgression;

  const tarifIncomeTaxWithoutKFB = tariffEstWithFuenftelAndProgrV(zvEwithoutKFB, severance, unemploymentBenefitForProgression, false);
  const tarifIncomeTaxWithKFB = tariffEstWithFuenftelAndProgrV(zvEwithKFB, severance, unemploymentBenefitForProgression, false);

  // Kindergeld-Anteil（Hälfte pro Elternteil）für Günstigerprüfung。Erlaubt User-Override。
  const kindergeldMonthlyPerChild = einkommen.childBenefitMonthlyPerChild ?? KINDERGELD_PER_MONTH_PER_CHILD_2026;
  const childBenefitShare = childrenJoint * (kindergeldMonthlyPerChild / 2) * 12;
  const kfbSavings = tarifIncomeTaxWithoutKFB - tarifIncomeTaxWithKFB;
  const kfbPreferred = kfbSavings > childBenefitShare;
  // § 31 Satz 4：bei KFB-Wahl wird（anteiliges）Kindergeld der tariflichen ESt hinzugerechnet。
  const assessedIncomeTax = kfbPreferred ? tarifIncomeTaxWithKFB + childBenefitShare : tarifIncomeTaxWithoutKFB;
  // § 51a EStG: Soli/Kirchensteuer verwenden bei Kindern die ESt mit KFB,
  // ohne Kindergeld-Hinzurechnung aus der Günstigerprüfung.
  const zuschlagsteuerBaseIncomeTax = tarifIncomeTaxWithKFB;
  const soli = calcSoli(zuschlagsteuerBaseIncomeTax);
  const kirchensteuer = stamm.churchTax ? Math.max(0, zuschlagsteuerBaseIncomeTax) * kirchensteuerRate(stamm.state) : 0;

  return {
    zvEwithoutKFB,
    zvEwithKFB,
    kfbHalf,
    severance,
    unemploymentBenefit,
    unemploymentBenefitPauschbetragDeduction,
    unemploymentBenefitForProgression,
    tarifIncomeTaxWithoutKFB,
    tarifIncomeTaxWithKFB,
    childBenefitShare,
    kfbSavings,
    kfbPreferred,
    assessedIncomeTax,
    zuschlagsteuerBaseIncomeTax,
    soli,
    kirchensteuer
  };
}

// ---------- Solidaritätszuschlag（§§ 1 ff. SolzG） ----------

/**
 * Solidaritätszuschlag bei Einzelveranlagung 2026。
 *   - §-51a-Bemessungsgrundlage ≤ 20.350 €：0 €（Freigrenze）
 *   - sonst：min(5,5 % × Basis；11,9 % × (Basis - 20.350)）
 *     （Milderungszone bis ca. 37.839 €，danach greift der Cap 5,5 % × ESt）
 * Basis wird auf vollen Euro abgerundet，das Ergebnis ebenfalls。
 */
export function calcSoli(zuschlagsteuerBaseIncomeTax: number): number {
  const est = Math.floor(Math.max(0, zuschlagsteuerBaseIncomeTax));
  if (est <= SOLI_FREIGRENZE_SINGLE_2026) return 0;
  const cap = SOLI_RATE * est;
  const milderung = SOLI_MILDERUNGSZONE_RATE * (est - SOLI_FREIGRENZE_SINGLE_2026);
  return Math.floor(Math.min(cap, milderung));
}

/**
 * Solidaritätszuschlag bei Zusammenveranlagung 2026。
 * Verdoppelte Schwellen：Freigrenze 40.700 €，Milderungszone bis ca. 75.678 €。
 *
 * Rechtsgrundlage：§ 3 Abs. 3 SolzG 1995 - bei Anwendung des Splittingverfahrens
 * (§ 32a Abs. 5 EStG) verdoppelt sich die Freigrenze
 * gegenüber der Einzelveranlagung。Der lineare Cap（5,5 %）und die Milderungsrate
 *（11,9 %）bleiben identisch。
 */
export function calcSoliJoint(zuschlagsteuerBaseIncomeTaxJoint: number): number {
  const est = Math.floor(Math.max(0, zuschlagsteuerBaseIncomeTaxJoint));
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
 * - Soli mit Joint-Schwellen（40.700 € / ca. 75.678 €）
 */
export function computeJointTax(
  stammUser: PersonProfile,
  _stammSpouse: PersonProfile,
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
  const unemploymentBenefitPauschbetragDeductionJoint =
    user.unemploymentBenefitPauschbetragDeduction + spouse.unemploymentBenefitPauschbetragDeduction;
  const unemploymentBenefitJointForProgression = user.unemploymentBenefitForProgression + spouse.unemploymentBenefitForProgression;

  // Splittingtarif：tariffEstWithFuenftelAndProgrV mit joint=true wendet splittingESt an
  const tarifIncomeTaxWithoutKFB = tariffEstWithFuenftelAndProgrV(zvEjointWithoutKFB, severanceJoint, unemploymentBenefitJointForProgression, true);
  const tarifIncomeTaxWithKFB = tariffEstWithFuenftelAndProgrV(zvEjointWithKFB, severanceJoint, unemploymentBenefitJointForProgression, true);

  // Volles Kindergeld für Günstigerprüfung（User-Override falls vorhanden，sonst Default）。
  const kindergeldMonthlyPerChild =
    einkommenUser.childBenefitMonthlyPerChild ?? einkommenSpouse.childBenefitMonthlyPerChild ?? KINDERGELD_PER_MONTH_PER_CHILD_2026;
  const childBenefitFull = childrenJoint * kindergeldMonthlyPerChild * 12;
  const kfbSavings = tarifIncomeTaxWithoutKFB - tarifIncomeTaxWithKFB;
  const kfbPreferred = kfbSavings > childBenefitFull;
  // § 31 Satz 4：bei KFB-Wahl wird Kindergeld der tariflichen ESt hinzugerechnet。
  const assessedIncomeTax = kfbPreferred ? tarifIncomeTaxWithKFB + childBenefitFull : tarifIncomeTaxWithoutKFB;
  // § 51a EStG: Zuschlagsteuern verwenden die gemeinsame ESt mit vollem KFB,
  // ohne Kindergeld-Hinzurechnung. Produktannahme: In Familie gelten beide
  // Ehegatten als gleich kirchensteuerpflichtig; gemischte Ehen werden nicht modelliert.
  const zuschlagsteuerBaseIncomeTaxJoint = tarifIncomeTaxWithKFB;
  const soli = calcSoliJoint(zuschlagsteuerBaseIncomeTaxJoint);
  const kirchensteuer = stammUser.churchTax ? Math.max(0, zuschlagsteuerBaseIncomeTaxJoint) * kirchensteuerRate(stammUser.state) : 0;

  return {
    zvEjointWithoutKFB,
    zvEjointWithKFB,
    kfbFull,
    severanceJoint,
    unemploymentBenefitJoint,
    unemploymentBenefitPauschbetragDeductionJoint,
    unemploymentBenefitJointForProgression,
    tarifIncomeTaxWithoutKFB,
    tarifIncomeTaxWithKFB,
    childBenefitFull,
    kfbSavings,
    kfbPreferred,
    assessedIncomeTax,
    zuschlagsteuerBaseIncomeTaxJoint,
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
  stammUser: PersonProfile
): { userTax: PersonTaxResult; spouseTax: PersonTaxResult } {
  const denom = userTaxSeparate.tarifIncomeTaxWithoutKFB + spouseTaxSeparate.tarifIncomeTaxWithoutKFB;
  const userShare = denom > 0 ? userTaxSeparate.tarifIncomeTaxWithoutKFB / denom : 0.5;
  const spouseShare = 1 - userShare;
  const userAssessed = joint.assessedIncomeTax * userShare;
  const spouseAssessed = joint.assessedIncomeTax * spouseShare;
  const userSoli = joint.soli * userShare;
  const spouseSoli = joint.soli * spouseShare;
  const userZuschlagsteuerBase = joint.zuschlagsteuerBaseIncomeTaxJoint * userShare;
  const spouseZuschlagsteuerBase = joint.zuschlagsteuerBaseIncomeTaxJoint * spouseShare;
  // Anzeige-Aufteilung: gemeinsames Ergebnis wird je zur Hälfte den Ehegatten zugeordnet.
  const halfKirchensteuer = joint.kirchensteuer / 2;
  const userKist = stammUser.churchTax ? halfKirchensteuer : 0;
  const spouseKist = stammUser.churchTax ? halfKirchensteuer : 0;
  return {
    userTax: {
      ...userTaxSeparate,
      assessedIncomeTax: userAssessed,
      zuschlagsteuerBaseIncomeTax: userZuschlagsteuerBase,
      soli: userSoli,
      kirchensteuer: userKist
    },
    spouseTax: {
      ...spouseTaxSeparate,
      assessedIncomeTax: spouseAssessed,
      zuschlagsteuerBaseIncomeTax: spouseZuschlagsteuerBase,
      soli: spouseSoli,
      kirchensteuer: spouseKist
    }
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
    const stayDist = distributeJointToPersons(stayUserTaxSeparate, staySpouseTaxSeparate, stayJoint, profileUser);
    const newJobDist = distributeJointToPersons(newJobUserTaxSeparate, newJobSpouseTaxSeparate, newJobJoint, profileUser);
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
