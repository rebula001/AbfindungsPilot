export interface IncomeTaxParameters {
  grundfreibetrag: number;
  zone2End: number;
  zone3End: number;
  zone4End: number;
  zone2A: number;
  zone2B: number;
  zone3A: number;
  zone3B: number;
  zone3C: number;
  zone4Rate: number;
  zone4C: number;
  zone5Rate: number;
  zone5C: number;
}

export interface PauschbetragParameters {
  arbeitnehmer: number;
  sonderausgabenSingle: number;
  sonderausgabenJoint: number;
  donationCapRate: number;
}

export interface ChildrenParameters {
  kfbFullPerChild: number;
  kindergeldMonthlyPerChild: number;
  singleParentBase: number;
  singleParentAdditionalChild: number;
}

export interface SocialInsuranceParameters {
  bbgKvPvMonthly: number;
  bbgRvAlvMonthly: number;
  jaegYearly: number;
  kvGeneralRate: number;
  kvReducedRate: number;
  averageAdditionalKvRate: number;
  defaultAdditionalKvRate: number;
  pvTotalWithChild: number;
  pvEmployeeWithChild: number;
  pvEmployeeWithChildSachsen: number;
  pvChildlessSurcharge: number;
  pvChildDiscount: number;
  pvChildDiscountMaxChildren: number;
  rvEmployeeRate: number;
  alvEmployeeRate: number;
}

export interface VorsorgeParameters {
  kvKrankengeldAbschlag: number;
  basisHoechstbetrag: number;
}

export interface SoliParameters {
  singleFreigrenze: number;
  singleObergrenze: number;
  jointFreigrenze: number;
  jointObergrenze: number;
  rate: number;
  milderungszoneRate: number;
}

export interface KirchensteuerParameters {
  rateByBw: number;
  rateOther: number;
}

export interface UiExampleParameters {
  unemploymentDateMonth: number;
  unemploymentDateDay: number;
}

export interface TaxParameters {
  year: number;
  incomeTax: IncomeTaxParameters;
  pauschbetraege: PauschbetragParameters;
  children: ChildrenParameters;
  socialInsurance: SocialInsuranceParameters;
  vorsorge: VorsorgeParameters;
  soli: SoliParameters;
  kirchensteuer: KirchensteuerParameters;
  uiExamples: UiExampleParameters;
}
