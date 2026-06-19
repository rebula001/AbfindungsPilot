import parameters2026 from './2026.json';
import type { TaxParameters } from './types';

export type { TaxParameters } from './types';

export const CURRENT_TAX_PARAMETERS: TaxParameters = parameters2026;

const TAX_PARAMETER_BY_YEAR: Record<number, TaxParameters> = {
  [CURRENT_TAX_PARAMETERS.year]: CURRENT_TAX_PARAMETERS
};

export function getTaxParameters(year = CURRENT_TAX_PARAMETERS.year): TaxParameters {
  return TAX_PARAMETER_BY_YEAR[year] ?? CURRENT_TAX_PARAMETERS;
}

const euroFmt = new Intl.NumberFormat('de-DE', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
});

const euroCentFmt = new Intl.NumberFormat('de-DE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const numberOneDecimalFmt = new Intl.NumberFormat('de-DE', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1
});

const numberZeroDecimalFmt = new Intl.NumberFormat('de-DE', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
});

const numberTwoDecimalFmt = new Intl.NumberFormat('de-DE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

function euro(n: number): string {
  return `${euroFmt.format(Math.round(n))} €`;
}

function euroCent(n: number): string {
  return `${euroCentFmt.format(n)} €`;
}

function pct(rate: number, digits = 2): string {
  const formatter = percentFormatter(digits);
  return `${formatter.format(rate * 100)} %`;
}

function percentFormatter(digits: number): Intl.NumberFormat {
  if (digits === 0) return numberZeroDecimalFmt;
  if (digits === 1) return numberOneDecimalFmt;
  return numberTwoDecimalFmt;
}

function isoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function deDate(year: number, month: number, day: number): string {
  return `${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}.${year}`;
}

function isoFromDate(date: Date): string {
  return isoDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

function deFromDate(date: Date): string {
  return deDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

export function buildTaxParameterI18nParams(params: TaxParameters = CURRENT_TAX_PARAMETERS): Record<string, string | number> {
  const { year, incomeTax, children, pauschbetraege, socialInsurance, vorsorge, soli, kirchensteuer, uiExamples } = params;
  const exampleMonth = uiExamples.unemploymentDateMonth;
  const exampleDay = uiExamples.unemploymentDateDay;
  const exampleWorkedMonths = Math.max(0, exampleMonth - 1);
  const oldJobEnd = new Date(year, exampleMonth - 1, 0);
  return {
    taxYear: year,
    nextTaxYear: year + 1,
    exampleUnemploymentDateIso: isoDate(year, exampleMonth, exampleDay),
    exampleUnemploymentDateDe: deDate(year, exampleMonth, exampleDay),
    exampleOldJobStartIso: isoDate(year, 1, 1),
    exampleOldJobEndIso: isoFromDate(oldJobEnd),
    exampleOldJobStartDe: deDate(year, 1, 1),
    exampleOldJobEndDe: deFromDate(oldJobEnd),
    exampleWorkedMonths,
    grundfreibetrag: euro(incomeTax.grundfreibetrag),
    arbeitnehmerPauschbetrag: euro(pauschbetraege.arbeitnehmer),
    sonderausgabenPauschbetragSingle: euro(pauschbetraege.sonderausgabenSingle),
    kfbFullPerChild: euro(children.kfbFullPerChild),
    kfbHalfPerChild: euro(children.kfbFullPerChild / 2),
    kindergeldMonthlyPerChild: euro(children.kindergeldMonthlyPerChild),
    kindergeldHalfMonthlyPerChild: euroCent(children.kindergeldMonthlyPerChild / 2),
    kindergeldYearlyPerChild: euro(children.kindergeldMonthlyPerChild * 12),
    singleParentBase: euro(children.singleParentBase),
    singleParentAdditionalChild: euro(children.singleParentAdditionalChild),
    bbgKvPvMonthly: euroCent(socialInsurance.bbgKvPvMonthly),
    bbgRvAlvMonthly: euroCent(socialInsurance.bbgRvAlvMonthly),
    bbgKvPvYearly: euro(socialInsurance.bbgKvPvMonthly * 12),
    bbgRvAlvYearly: euro(socialInsurance.bbgRvAlvMonthly * 12),
    jaegYearly: euro(socialInsurance.jaegYearly),
    kvGeneralRate: pct(socialInsurance.kvGeneralRate, 2),
    kvGeneralRateInput: socialInsurance.kvGeneralRate * 100,
    kvReducedRate: pct(socialInsurance.kvReducedRate, 1),
    kvAverageAdditionalRate: pct(socialInsurance.averageAdditionalKvRate, 2),
    kvDefaultAdditionalRateInput: socialInsurance.defaultAdditionalKvRate * 100,
    pvTotalWithChild: pct(socialInsurance.pvTotalWithChild, 2),
    pvChildlessTotal: pct(socialInsurance.pvTotalWithChild + socialInsurance.pvChildlessSurcharge, 2),
    pvEmployeeWithChild: pct(socialInsurance.pvEmployeeWithChild, 2),
    pvEmployeeWithChildSachsen: pct(socialInsurance.pvEmployeeWithChildSachsen, 2),
    pvChildlessSurcharge: pct(socialInsurance.pvChildlessSurcharge, 2),
    pvChildDiscount: pct(socialInsurance.pvChildDiscount, 2),
    pvChildDiscountMaxChildren: socialInsurance.pvChildDiscountMaxChildren,
    rvEmployeeRate: pct(socialInsurance.rvEmployeeRate, 2),
    alvEmployeeRate: pct(socialInsurance.alvEmployeeRate, 2),
    alvTotalRate: pct(socialInsurance.alvEmployeeRate * 2, 2),
    vorsorgeKvEmploymentDeductRate: pct(1 - vorsorge.kvKrankengeldAbschlag, 0),
    vorsorgeKvKrankengeldAbschlag: pct(vorsorge.kvKrankengeldAbschlag, 0),
    vorsorgeBasisHoechstbetrag: euro(vorsorge.basisHoechstbetrag),
    soliSingleFreigrenze: euro(soli.singleFreigrenze),
    soliJointFreigrenze: euro(soli.jointFreigrenze),
    soliSingleObergrenze: euro(soli.singleObergrenze),
    soliJointObergrenze: euro(soli.jointObergrenze),
    soliRate: pct(soli.rate, 1),
    soliMilderungszoneRate: pct(soli.milderungszoneRate, 1),
    kistRateByBw: pct(kirchensteuer.rateByBw, 0),
    kistRateOther: pct(kirchensteuer.rateOther, 0)
  };
}

export const TAX_PARAMETER_I18N_PARAMS = buildTaxParameterI18nParams();
