import { CURRENT_TAX_PARAMETERS } from '../tax-parameters';

const { incomeTax, pauschbetraege, children, socialInsurance, vorsorge, soli, kirchensteuer } = CURRENT_TAX_PARAMETERS;

// Central compatibility layer: calculation code keeps importing constants, but
// the yearly values now come from frontend/src/tax-parameters/*.json.
export const TAX_PARAMETER_YEAR = CURRENT_TAX_PARAMETERS.year;

// ---- Einkommensteuertarif § 32a EStG ----
export const GRUNDFREIBETRAG_2026 = incomeTax.grundfreibetrag;
export const TARIF_ZONE2_END_2026 = incomeTax.zone2End;
export const TARIF_ZONE3_END_2026 = incomeTax.zone3End;
export const TARIF_ZONE4_END_2026 = incomeTax.zone4End;

export const TARIF_ZONE2_A_2026 = incomeTax.zone2A;
export const TARIF_ZONE2_B_2026 = incomeTax.zone2B;
export const TARIF_ZONE3_A_2026 = incomeTax.zone3A;
export const TARIF_ZONE3_B_2026 = incomeTax.zone3B;
export const TARIF_ZONE3_C_2026 = incomeTax.zone3C;
export const TARIF_ZONE4_RATE_2026 = incomeTax.zone4Rate;
export const TARIF_ZONE4_C_2026 = incomeTax.zone4C;
export const TARIF_ZONE5_RATE_2026 = incomeTax.zone5Rate;
export const TARIF_ZONE5_C_2026 = incomeTax.zone5C;

// ---- Werbungskosten / Pauschbetraege ----
export const ARBEITNEHMER_PAUSCHBETRAG = pauschbetraege.arbeitnehmer;
export const SONDERAUSGABEN_PAUSCHBETRAG_SINGLE = pauschbetraege.sonderausgabenSingle;
export const SONDERAUSGABEN_PAUSCHBETRAG_JOINT = pauschbetraege.sonderausgabenJoint;

// ---- Familienleistungsausgleich ----
export const KFB_FULL_PER_CHILD_2026 = children.kfbFullPerChild;
export const KFB_HALF_PER_CHILD_2026 = KFB_FULL_PER_CHILD_2026 / 2;
export const KINDERGELD_PER_MONTH_PER_CHILD_2026 = children.kindergeldMonthlyPerChild;
export const ENTLASTUNGSBETRAG_ALLEINERZIEHENDE_BASE_2026 = children.singleParentBase;
export const ENTLASTUNGSBETRAG_ALLEINERZIEHENDE_ADDITIONAL_CHILD_2026 = children.singleParentAdditionalChild;

// ---- Sozialversicherung ----
export const BBG_KV_PV_MONTHLY_2026 = socialInsurance.bbgKvPvMonthly;
export const BBG_RV_ALV_MONTHLY_2026 = socialInsurance.bbgRvAlvMonthly;
export const ALLGEMEINER_KV_RATE = socialInsurance.kvGeneralRate;
export const ERMAESSIGTER_KV_RATE = socialInsurance.kvReducedRate;
export const DEFAULT_ZUSATZBEITRAG_RATE = socialInsurance.defaultAdditionalKvRate;
export const AVERAGE_ZUSATZBEITRAG_RATE = socialInsurance.averageAdditionalKvRate;
export const JAEG_YEARLY = socialInsurance.jaegYearly;

export const PV_RATE_TOTAL_WITH_CHILD = socialInsurance.pvTotalWithChild;
export const PV_RATE_AN_WITH_CHILD = socialInsurance.pvEmployeeWithChild;
export const PV_RATE_AN_WITH_CHILD_SACHSEN = socialInsurance.pvEmployeeWithChildSachsen;
export const PV_CHILDLESS_SURCHARGE_RATE = socialInsurance.pvChildlessSurcharge;
export const PV_CHILD_DISCOUNT_RATE = socialInsurance.pvChildDiscount;
export const PV_CHILD_DISCOUNT_MAX_CHILDREN = socialInsurance.pvChildDiscountMaxChildren;
export const RV_RATE_AN = socialInsurance.rvEmployeeRate;
export const ALV_RATE_AN = socialInsurance.alvEmployeeRate;

// ---- Vorsorgeaufwendungen § 10 EStG ----
export const VORSORGE_KV_KRANKENGELD_ABSCHLAG = vorsorge.kvKrankengeldAbschlag;
export const VORSORGE_BASIS_HOECHSTBETRAG_2026 = vorsorge.basisHoechstbetrag;

// ---- Sonderausgaben Spenden § 10b EStG ----
export const SPENDEN_HOECHSTGRENZE_RATE = pauschbetraege.donationCapRate;

// ---- Solidaritätszuschlag ----
export const SOLI_FREIGRENZE_SINGLE_2026 = soli.singleFreigrenze;
export const SOLI_OBERGRENZE_SINGLE_2026 = soli.singleObergrenze;
export const SOLI_FREIGRENZE_JOINT_2026 = soli.jointFreigrenze;
export const SOLI_OBERGRENZE_JOINT_2026 = soli.jointObergrenze;
export const SOLI_RATE = soli.rate;
export const SOLI_MILDERUNGSZONE_RATE = soli.milderungszoneRate;

// ---- Kirchensteuer ----
export const KIST_RATE_BY_BW = kirchensteuer.rateByBw;
export const KIST_RATE_OTHER = kirchensteuer.rateOther;

export function kirchensteuerRate(state: string): number {
  return state === 'BY' || state === 'BW' ? KIST_RATE_BY_BW : KIST_RATE_OTHER;
}
