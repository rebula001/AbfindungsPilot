// 计算引擎使用的类型定义

/** 税务相关的人员主数据（不可变属性） */
export interface PersonProfile {
  /** 人员标识 i18n key（'user' | 'spouse'） */
  personKey: 'user' | 'spouse';
  age: number;
  taxClass: number;
  churchTax: boolean;
  state: string;
  /** 全 KV 费率（allgemeiner Beitragssatz + Zusatzbeitrag），z.B. 0.1678 = 16,78 % - nur GKV-Pfad. */
  healthInsuranceRate: number;
  /**
   * Krankenversicherungs-Variante:
   * - 'gkv'  -> SV-Pfad mit healthInsuranceRate x BBG（Standard，monatliche Beitragsberechnung）
   * - 'pkv'  -> AN zahlt feste Jahresbeiträge（privateAnnualKV/privateAnnualPV）；BBG-Logik entfällt
   * - voluntaryStatutory' wird wie 'gkv' behandelt。
   */
  kvKind?: 'gkv' | 'pkv';
  /** PKV-Beitrag pro Jahr（AN-Anteil；bei PKV de facto = volle Prämie nach AG-Zuschuss） */
  privateAnnualKV?: number;
  /** Private Pflegeversicherung pro Jahr */
  privateAnnualPV?: number;
  pensionInsurance: boolean;
  unemploymentInsurance: boolean;
  hasChildren: boolean;
  childrenUnder25: number;
}

/** 人员的收入与支出基础参数（与场景无关的部分） */
export interface PersonIncomeData {
  personKey: 'user' | 'spouse';
  /** 旧工作每月毛工资（截至失业前） */
  monthlyGrossOldJob: number;
  /** 是否经历失业 */
  unemployed: boolean;
  /** 失业开始日期（含此日）- 旧工作在此日结束 */
  unemploymentDate: Date | null;
  /**
   * ALG I 起付日期（= unemploymentDate + Sperrzeit + Ruhezeit, § 158/159 SGB III）。
   * Wenn null -> fallback auf unemploymentDate。Während [unemploymentDate, algStartDate)
   * besteht keine Beschäftigung und KEIN ALG-Anspruch（Cash-Loch）。
   */
  algStartDate?: Date | null;
  /** ALG I 月额 */
  monthlyUnemploymentBenefit: number;
  /** ALG I 最长持续月数（§ 147 SGB III，ggf. um Sperrzeit-Monate gekürzt） */
  unemploymentBenefitDuration: number;
  /** Abfindung 总额（一次性） */
  severance: number;
  /** 年度租金收入（V&V，vereinfacht netto） */
  rentalIncome: number;
  /** Sonstige Einkünfte / Jahr（§ 22 EStG, vereinfacht netto in totalIncome） */
  otherIncome?: number;
  /** 年度捐款（教会等） */
  annualDonation: number;
  /** Monatliches Kindergeld pro Kind（Default Const 2026: 259 €）。Erlaubt Override aus User-Eingabe。 */
  childBenefitMonthlyPerChild?: number;
}

/**
 * 场景覆盖参数：仅作用于“用户”（user）。
 * Ehepartner 在两场景下相同，使用其 PersonIncomeData 即可。
 */
export interface ScenarioOverride {
  /** 用户新工作起始日期；null = 永不开始（躺平） */
  newJobStartDate: Date | null;
  /** 用户新工作每月毛工资 */
  monthlyGrossNewJob: number;
  /**
   * 用户 Abfindung 实际支付日期（决定 Fünftelregelung 落入哪个税年）。
   *
   * NUR USER：das Modell sieht keine Abfindung für den Ehepartner vor
   * (`PersonIncomeData.severance` = 0 für spouse)，Engine ignoriert das
   * Feld in `calcPersonIncome()` wenn `personKey === 'spouse'`.
   * Das Feld lebt aus historischen Gründen auf der gemeinsamen Scenario-
   * Struktur und wird bewusst NICHT entfernt，um die Schnittstelle zwischen
   * Adapter，Engine und UI stabil zu halten。
   */
  severancePaymentDate: Date;
}

/** 单年单人单场景的收入构成（毛额，未扣 Werbungskosten） */
export interface IncomeBreakdown {
  /** 旧工作工资（Lohn alte Arbeit）- 计入 Bruttolohn / zvE */
  oldJobWage: number;
  /** 新工作工资（Lohn neue Arbeit）- 计入 Bruttolohn / zvE */
  newJobWage: number;
  /** Arbeitslosengeld I - 不计入 zvE，仅 Progressionsvorbehalt § 32b EStG */
  unemploymentBenefit: number;
  /** Mieteinnahmen - Einkünfte aus V&V */
  rentalIncome: number;
  /** Abfindung - getrennt nach § 34 EStG（Fünftelregelung） */
  severance: number;
  /** SV-Bemessungssegmente：每段含 monatliches Brutto + Anzahl Monate */
  svSegments: SvSegment[];
}

/** SV-Beitragssegment：一段连续月份内的固定月毛 */
export interface SvSegment {
  kind: 'oldJob' | 'newJob';
  monthlyGross: number;
  months: number;
}

/** 单年单人单场景的 SV-AN-Anteile */
export interface SvBreakdown {
  kv: number;
  pv: number;
  rv: number;
  alv: number;
}

/** 单年单人单场景的完整中间结果（直到 zvE） */
export interface PersonYearResult {
  income: IncomeBreakdown;
  grossWages: number; // = oldJobWage + newJobWage
  incomeRelatedExpenses: number;
  employmentIncome: number; // = grossWages - incomeRelatedExpenses
  rentalIncomeNet: number; // = rentalIncome
  totalIncome: number; // = employmentIncome + rentalIncomeNet
  sv: SvBreakdown;
  pensionExpenseDeduction: number; // abzugsfähige Vorsorgeaufwendungen § 10 EStG
  donationDeduction: number;
  specialExpenses: number; // = pensionExpenseDeduction + donationDeduction
  zvEwithoutKFB: number; // = totalIncome - specialExpenses
}

/** 单人单年单场景的 ESt-Ergebnis（Einzelveranlagung § 26a EStG） */
export interface PersonTaxResult {
  /** zvE ohne KFB-Abzug（= PersonYearResult.zvEwithoutKFB） */
  zvEwithoutKFB: number;
  /** zvE mit KFB-Abzug = zvEwithoutKFB - kfbHalf */
  zvEwithKFB: number;
  /** KFB-Hälfte für diese Person（4.878 € × Kinderzahl） */
  kfbHalf: number;
  /** Abfindung dieser Person（für § 34 Fünftelregelung） */
  severance: number;
  /** ALG I dieser Person（für § 32b Progressionsvorbehalt） */
  unemploymentBenefit: number;
  /** Tarifliche ESt nach §§ 32a/32b/34 - ohne KFB-Abzug，Grundtarif */
  tarifIncomeTaxWithoutKFB: number;
  /** Tarifliche ESt nach §§ 32a/32b/34 - mit KFB-Abzug，Grundtarif */
  tarifIncomeTaxWithKFB: number;
  /** Anteiliges Kindergeld（Hälfte: 129,50 € × 12 × Kinderzahl） */
  childBenefitShare: number;
  /** Steuerersparnis durch KFB = tarifIncomeTaxWithoutKFB - tarifIncomeTaxWithKFB */
  kfbSavings: number;
  /** true -> KFB-Abzug günstiger als Kindergeld-Anteil（Günstigerprüfung § 31 EStG，per Person） */
  kfbPreferred: boolean;
  /** Festzusetzende ESt（Günstigerprüfung-Ergebnis inkl. ggf. Hinzurechnung Kindergeld-Anteil） */
  assessedIncomeTax: number;
  /** Solidaritätszuschlag（§§ 1 ff. SolzG）basierend auf assessedIncomeTax，Einzelveranlagung */
  soli: number;
  /** Kirchensteuer（8 % BY/BW，sonst 9 % der festzus. ESt；0 wenn nicht kirchensteuerpflichtig） */
  kirchensteuer: number;
}

/** Veranlagungsart：'separate' = getrennte Veranlagung（§ 26a EStG），'joint' = Zusammenveranlagung（§ 26b EStG）。 */
export type Veranlagungsart = 'separate' | 'joint';

/**
 * Ergebnis der Zusammenveranlagung（§ 26b EStG）：ein gemeinsames zvE，Splittingtarif（§ 32a Abs. 5），
 * voller KFB pro Kind，voller Kindergeld-Betrag，gemeinsamer Soli mit verdoppelter Freigrenze。
 */
export interface JointTaxResult {
  /** Gemeinsames zvE ohne KFB-Abzug = userZvE + spouseZvE */
  zvEjointWithoutKFB: number;
  /** Gemeinsames zvE mit vollem KFB-Abzug */
  zvEjointWithKFB: number;
  /** Voller KFB für beide Eltern（childrenJoint × 9.756 €） */
  kfbFull: number;
  /** Summierte Abfindung beider Ehegatten（§ 34 Abs. 1 auf gemeinsamer Basis） */
  severanceJoint: number;
  /** Summiertes ALG I beider Ehegatten（§ 32b Progressionsvorbehalt auf gemeinsamer Basis） */
  unemploymentBenefitJoint: number;
  /** Tarifliche ESt nach §§ 32a Abs. 5 / 32b / 34 - ohne KFB-Abzug, Splittingtarif */
  tarifIncomeTaxWithoutKFB: number;
  /** Tarifliche ESt nach §§ 32a Abs. 5 / 32b / 34 - mit vollem KFB-Abzug, Splittingtarif */
  tarifIncomeTaxWithKFB: number;
  /** Volles Kindergeld（childrenJoint × 259 € × 12），für Günstigerprüfung */
  childBenefitFull: number;
  /** KFB-Steuerersparnis = tarifIncomeTaxWithoutKFB - tarifIncomeTaxWithKFB */
  kfbSavings: number;
  /** true -> KFB-Abzug günstiger als Kindergeld（§ 31 EStG, gemeinsame Prüfung） */
  kfbPreferred: boolean;
  /** Festzusetzende ESt（gemeinsam，ggf. inkl. Hinzurechnung Kindergeld bei KFB-Wahl） */
  assessedIncomeTax: number;
  /** Solidaritätszuschlag bei Zusammenveranlagung（Freigrenze 39.900 €，Milderungszone bis 67.824 €） */
  soli: number;
  /** Kirchensteuer gemeinsam（Summe der individuellen Anteile beider Ehegatten） */
  kirchensteuer: number;
}

/** 一年内两场景 × 两人的完整结果 */
export interface YearComputation {
  year: number;
  /** Veranlagungsart, mit der dieser Jahresblock berechnet wurde */
  mode: Veranlagungsart;
  stayUnemployed: {
    user: PersonYearResult;
    spouse: PersonYearResult;
    /**
     * Bei Einzelveranlagung: tatsächliche persönliche ESt（Grundtarif）。
     * Bei Zusammenveranlagung: anteilige Aufteilung des gemeinsamen Festzus.-ESt + Soli
     * proportional zur jeweiligen Einzel-Tarif-ESt，damit familien-Netto-Aggregationen korrekt bleiben。
     * Die KFB-/Kindergeld-/Günstigerprüfungs-Felder geben in Zusammen-Mode die Einzelveranlagungs-Werte wieder
     * （informativ）；die rechtlich verbindlichen gemeinsamen Werte stehen in `jointTax`。
     */
    userTax: PersonTaxResult;
    spouseTax: PersonTaxResult;
    /** Nur bei Zusammenveranlagung gesetzt: gemeinsame ESt + Soli，KFB voll，Splittingtarif。 */
    jointTax?: JointTaxResult;
  };
  newJob: {
    user: PersonYearResult;
    spouse: PersonYearResult;
    userTax: PersonTaxResult;
    spouseTax: PersonTaxResult;
    jointTax?: JointTaxResult;
  };
}
