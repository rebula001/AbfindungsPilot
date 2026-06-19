<script setup lang="ts">
import { computed } from 'vue';
import { useI18n, I18nT } from 'vue-i18n';
import Accordion from 'primevue/accordion';
import AccordionPanel from 'primevue/accordionpanel';
import AccordionHeader from 'primevue/accordionheader';
import AccordionContent from 'primevue/accordioncontent';
import DatePicker from 'primevue/datepicker';
import Select from 'primevue/select';
import SelectButton from 'primevue/selectbutton';

import CalculationGroup from '../components/CalculationGroup.vue';
import { useCalculation } from '../composables/useCalculation';
import type { PersonYearResult, PersonTaxResult, YearComputation } from '../calculation/types';
import { grundtarifESt, estWithProgressionsvorbehalt } from '../calculation/engine';
import type { Cell, Scenario, ScenarioValues, StepGroup, StepPopover } from '../types/calculationSteps';
import {
  KFB_HALF_PER_CHILD_2026,
  KINDERGELD_PER_MONTH_PER_CHILD_2026,
  BBG_KV_PV_MONTHLY_2026,
  VORSORGE_KV_KRANKENGELD_ABSCHLAG,
  SOLI_FREIGRENZE_SINGLE_2026,
  SOLI_FREIGRENZE_JOINT_2026,
  SOLI_RATE,
  SOLI_MILDERUNGSZONE_RATE
} from '../calculation/constants';

const { t, tm } = useI18n();
const {
  newJobStartDate,
  monthlyGrossNewJob,
  severancePaymentDate,
  veranlagungsart,
  isSingleMode,
  hasNewJobFixed,
  years,
  newJobStartOptions: newJobStartOptionsRef,
  monthlyGrossOptions: monthlyGrossOptionsRef,
  severanceDateOptions: severanceDateOptionsRef
} = useCalculation();

const taxYearParams = computed(() => {
  const ys = years.value;
  return { y1: ys[0]?.year ?? '', y2: ys[1]?.year ?? '' };
});

const veranlagungsartOptions = computed(() => [
  { value: 'separate', label: t('calculation.veranlagungsart.separate') },
  { value: 'joint', label: t('calculation.veranlagungsart.joint') }
]);

const euroFmt = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
});
const dateFmt = new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });

function formatEuro(n: number): string {
  return euroFmt.format(Math.round(n));
}

function tList(key: string, params?: Record<string, string | number>): string {
  const raw = tm(key);
  if (Array.isArray(raw)) {
    return (raw as string[])
      .map((line) => (params ? line.replace(/\{(\w+)\}/g, (_m, k) => (params[k] === undefined ? `{${k}}` : String(params[k]))) : line))
      .join('\n');
  }
  return params ? t(key, params) : t(key);
}

const newJobStartProxy = computed<Date>({
  get: () => newJobStartDate.value,
  set: (d: Date) => {
    newJobStartDate.value = new Date(d.getFullYear(), d.getMonth(), 1);
  }
});
const minNewJobDate = computed(() => newJobStartOptionsRef.value[0]);
const maxNewJobDate = computed(() => newJobStartOptionsRef.value[newJobStartOptionsRef.value.length - 1]);

const monthlyGrossOptions = computed(() => monthlyGrossOptionsRef.value.map((v) => ({ value: v, label: euroFmt.format(v) })));

const severanceOptions = computed(() => severanceDateOptionsRef.value.map((d) => ({ value: d.getTime(), label: dateFmt.format(d) })));
const severanceIndex = computed<number>({
  get: () => severancePaymentDate.value.getTime(),
  set: (v: number) => {
    severancePaymentDate.value = new Date(v);
  }
});

function buildCellDetails<T extends { scenario: Scenario; cell: Cell }>(cells: T[], builder: (c: T) => string): StepPopover['details'] {
  const out = {
    liegen: { user: { computation: '' }, spouse: { computation: '' } },
    neue: { user: { computation: '' }, spouse: { computation: '' } }
  };
  for (const c of cells) out[c.scenario][c.cell] = { computation: builder(c) };
  return out;
}

function buildZvEGroup(yc: YearComputation): StepGroup {
  const pull = (sel: (r: PersonYearResult) => number) => ({
    liegen: { user: sel(yc.stayUnemployed.user), spouse: sel(yc.stayUnemployed.spouse) },
    neue: { user: sel(yc.newJob.user), spouse: sel(yc.newJob.spouse) }
  });

  const personCells: Array<{ scenario: 'liegen' | 'neue'; cell: 'user' | 'spouse'; person: PersonYearResult }> = [
    { scenario: 'liegen', cell: 'user', person: yc.stayUnemployed.user },
    { scenario: 'liegen', cell: 'spouse', person: yc.stayUnemployed.spouse },
    { scenario: 'neue', cell: 'user', person: yc.newJob.user },
    { scenario: 'neue', cell: 'spouse', person: yc.newJob.spouse }
  ];

  function buildPersonDetails(builder: (p: PersonYearResult) => string) {
    const out = {
      liegen: { user: { computation: '' }, spouse: { computation: '' } },
      neue: { user: { computation: '' }, spouse: { computation: '' } }
    };
    for (const c of personCells) out[c.scenario][c.cell] = { computation: builder(c.person) };
    return out;
  }

  const fmtE = (n: number) => euroFmt.format(Math.round(n));
  const kvAbzugRate = 1 - VORSORGE_KV_KRANKENGELD_ABSCHLAG;

  return {
    titleKey: 'calculation.groups.zvE.title',
    legalBasisKey: 'calculation.groups.zvE.legalBasis',
    income: [
      {
        label: '0.1',
        titleKey: 'calculation.steps.grossWages.title',
        legalBasisKey: 'calculation.steps.grossWages.legalBasis',
        ...pull((r) => r.grossWages),
        isDeduction: false
      },
      {
        label: '0.2',
        titleKey: 'calculation.steps.rentalIncomeNet.title',
        legalBasisKey: 'calculation.steps.rentalIncomeNet.legalBasis',
        ...pull((r) => r.rentalIncomeNet),
        isDeduction: false
      }
    ],
    deductions: [
      {
        label: '0.3',
        titleKey: 'calculation.steps.incomeRelatedExpenses.title',
        legalBasisKey: 'calculation.steps.incomeRelatedExpenses.legalBasis',
        ...pull((r) => r.incomeRelatedExpenses),
        isDeduction: true
      },
      {
        label: '0.4',
        titleKey: 'calculation.steps.singleParentRelief.title',
        legalBasisKey: 'calculation.steps.singleParentRelief.legalBasis',
        ...pull((r) => r.singleParentRelief),
        isDeduction: true
      },
      {
        label: '0.5',
        titleKey: 'calculation.steps.vorsorge.title',
        legalBasisKey: 'calculation.steps.vorsorge.legalBasis',
        ...pull((r) => r.pensionExpenseDeduction),
        isDeduction: true,
        popover: {
          formula: tList('calculation.popover.vorsorge.formula'),
          details: buildPersonDetails((p) => {
            const kvEmploymentDeduct = p.sv.kvEmployment * kvAbzugRate;
            const kvSelfPaidDeduct = p.sv.kvSelfPaidAfterAlg;
            const kvAnteil = kvEmploymentDeduct + kvSelfPaidDeduct;
            const total = p.sv.rv + kvAnteil + p.sv.pv;
            return tList('calculation.popover.vorsorge.detail', {
              rv: fmtE(p.sv.rv),
              kvEmployment: fmtE(p.sv.kvEmployment),
              kvEmploymentDeduct: fmtE(kvEmploymentDeduct),
              kvSelfPaid: fmtE(p.sv.kvSelfPaidAfterAlg),
              kvDeduct: fmtE(kvAnteil),
              pv: fmtE(p.sv.pv),
              total: fmtE(total)
            });
          })
        }
      },
      {
        label: '0.6',
        titleKey: 'calculation.steps.spenden.title',
        legalBasisKey: 'calculation.steps.spenden.legalBasis',
        ...pull((r) => r.generalSpecialExpensesDeduction),
        isDeduction: true
      }
    ],
    result: {
      label: '1',
      titleKey: 'calculation.steps.zvE.title',
      legalBasisKey: 'calculation.steps.zvE.legalBasis',
      ...pull((r) => r.zvEwithoutKFB),
      isDeduction: false,
      highlight: true
    }
  };
}

function buildSozialabgabenGroup(yc: YearComputation): StepGroup {
  const pull = (sel: (r: PersonYearResult) => number) => ({
    liegen: { user: sel(yc.stayUnemployed.user), spouse: sel(yc.stayUnemployed.spouse) },
    neue: { user: sel(yc.newJob.user), spouse: sel(yc.newJob.spouse) }
  });

  const cells: Array<{ scenario: 'liegen' | 'neue'; cell: 'user' | 'spouse'; person: PersonYearResult }> = [
    { scenario: 'liegen', cell: 'user', person: yc.stayUnemployed.user },
    { scenario: 'liegen', cell: 'spouse', person: yc.stayUnemployed.spouse },
    { scenario: 'neue', cell: 'user', person: yc.newJob.user },
    { scenario: 'neue', cell: 'spouse', person: yc.newJob.spouse }
  ];
  const buildDetails = (builder: (c: (typeof cells)[number]) => string) => buildCellDetails(cells, builder);
  const fmtE = (n: number) => euroFmt.format(Math.round(n));
  const fmtPct = (n: number) => `${n.toFixed(2).replace('.', ',')} %`;

  function describeKv(p: PersonYearResult): string {
    const months = p.sv.selfPaidHealthInsuranceMonths;
    const base = p.sv.selfPaidHealthInsuranceMonthlyBase;
    const gross = p.sv.selfPaidHealthInsuranceMonthlyGross;
    if (months > 0 && base > 0) {
      const rate = (p.sv.kvSelfPaidAfterAlg / (base * months)) * 100;
      const monthlySelfPay = p.sv.kvSelfPaidAfterAlg / months;
      return tList('calculation.popover.kv.detailWithSelfPay', {
        employment: fmtE(p.sv.kvEmployment),
        gross: fmtE(gross),
        bbg: fmtE(BBG_KV_PV_MONTHLY_2026),
        base: fmtE(base),
        months,
        rate: fmtPct(rate),
        monthlySelfPay: fmtE(monthlySelfPay),
        selfPay: fmtE(p.sv.kvSelfPaidAfterAlg),
        total: fmtE(p.sv.kv)
      });
    }
    return tList('calculation.popover.kv.detailWithoutSelfPay', {
      employment: fmtE(p.sv.kvEmployment),
      total: fmtE(p.sv.kv)
    });
  }

  function describePv(p: PersonYearResult): string {
    const months = p.sv.selfPaidHealthInsuranceMonths;
    const base = p.sv.selfPaidHealthInsuranceMonthlyBase;
    const gross = p.sv.selfPaidHealthInsuranceMonthlyGross;
    if (months > 0 && base > 0) {
      const rate = (p.sv.pvSelfPaidAfterAlg / (base * months)) * 100;
      const monthlySelfPay = p.sv.pvSelfPaidAfterAlg / months;
      return tList('calculation.popover.pv.detailWithSelfPay', {
        employment: fmtE(p.sv.pvEmployment),
        gross: fmtE(gross),
        bbg: fmtE(BBG_KV_PV_MONTHLY_2026),
        base: fmtE(base),
        months,
        rate: fmtPct(rate),
        monthlySelfPay: fmtE(monthlySelfPay),
        selfPay: fmtE(p.sv.pvSelfPaidAfterAlg),
        total: fmtE(p.sv.pv)
      });
    }
    return tList('calculation.popover.pv.detailWithoutSelfPay', {
      employment: fmtE(p.sv.pvEmployment),
      total: fmtE(p.sv.pv)
    });
  }

  return {
    titleKey: 'calculation.groups.sozialabgaben.title',
    legalBasisKey: 'calculation.groups.sozialabgaben.legalBasis',
    deductions: [
      {
        label: '1.1',
        titleKey: 'calculation.steps.kv.title',
        legalBasisKey: 'calculation.steps.kv.legalBasis',
        ...pull((r) => r.sv.kv),
        isDeduction: true,
        popover: {
          formula: tList('calculation.popover.kv.formula'),
          details: buildDetails((c) => describeKv(c.person))
        }
      },
      {
        label: '1.2',
        titleKey: 'calculation.steps.pv.title',
        legalBasisKey: 'calculation.steps.pv.legalBasis',
        ...pull((r) => r.sv.pv),
        isDeduction: true,
        popover: {
          formula: tList('calculation.popover.pv.formula'),
          details: buildDetails((c) => describePv(c.person))
        }
      },
      {
        label: '1.3',
        titleKey: 'calculation.steps.rv.title',
        legalBasisKey: 'calculation.steps.rv.legalBasis',
        ...pull((r) => r.sv.rv),
        isDeduction: true
      },
      {
        label: '1.4',
        titleKey: 'calculation.steps.alv.title',
        legalBasisKey: 'calculation.steps.alv.legalBasis',
        ...pull((r) => r.sv.alv),
        isDeduction: true
      }
    ],
    result: {
      label: '2',
      titleKey: 'calculation.steps.sozialabgabenGesamt.title',
      legalBasisKey: 'calculation.steps.sozialabgabenGesamt.legalBasis',
      ...pull((r) => r.sv.kv + r.sv.pv + r.sv.rv + r.sv.alv),
      isDeduction: true,
      highlight: true
    }
  };
}

interface YearView {
  year: number;
  zvEGroup: StepGroup;
  sozialabgabenGroup: StepGroup;
  estGroup: StepGroup;
  nettoGroup: StepGroup;
  algLiegen: ScenarioValues;
  algNeue: ScenarioValues;
  severanceLiegen: ScenarioValues;
  severanceNeue: ScenarioValues;
}

function buildEstGroup(yc: YearComputation): StepGroup {
  const pullTax = (sel: (t: PersonTaxResult) => number) => ({
    liegen: { user: sel(yc.stayUnemployed.userTax), spouse: sel(yc.stayUnemployed.spouseTax) },
    neue: { user: sel(yc.newJob.userTax), spouse: sel(yc.newJob.spouseTax) }
  });

  const cells: Array<{
    scenario: 'liegen' | 'neue';
    cell: 'user' | 'spouse';
    tax: PersonTaxResult;
    person: PersonYearResult;
  }> = [
    { scenario: 'liegen', cell: 'user', tax: yc.stayUnemployed.userTax, person: yc.stayUnemployed.user },
    { scenario: 'liegen', cell: 'spouse', tax: yc.stayUnemployed.spouseTax, person: yc.stayUnemployed.spouse },
    { scenario: 'neue', cell: 'user', tax: yc.newJob.userTax, person: yc.newJob.user },
    { scenario: 'neue', cell: 'spouse', tax: yc.newJob.spouseTax, person: yc.newJob.spouse }
  ];

  const buildDetails = (builder: (c: (typeof cells)[number]) => string) => buildCellDetails(cells, builder);
  const fmtE = (n: number) => euroFmt.format(Math.round(n));
  const fmtENoSym = (n: number) => Math.round(n).toLocaleString('de-DE');

  function showFuenftelProgrV(zvEOrd: number, abfindung: number, alg: number, algForProgression: number, algPauschbetragDeduction: number): string {
    const estSockel = estWithProgressionsvorbehalt(zvEOrd, algForProgression, false);
    const parts: string[] = [];
    parts.push(tList('calculation.popover.fuenftel.head', { zvEOrd: fmtE(zvEOrd), abfindung: fmtE(abfindung), alg: fmtE(alg) }));
    if (alg > 0) {
      const progressionBase = zvEOrd + algForProgression;
      const estTotal = grundtarifESt(progressionBase);
      const satz = progressionBase > 0 ? estTotal / progressionBase : 0;
      parts.push(
        tList('calculation.popover.fuenftel.progrVWithAlg', {
          apbDeduction: fmtE(algPauschbetragDeduction),
          algForProgression: fmtE(algForProgression),
          algForProgressionPlain: fmtENoSym(algForProgression),
          sumPlain: fmtENoSym(progressionBase),
          ratePct: (satz * 100).toFixed(2),
          zvEOrdPlain: fmtENoSym(zvEOrd),
          sockel: fmtE(estSockel)
        })
      );
    } else {
      parts.push(
        tList('calculation.popover.fuenftel.progrVWithoutAlg', {
          zvEOrdPlain: fmtENoSym(zvEOrd),
          sockel: fmtE(estSockel)
        })
      );
    }
    if (abfindung > 0) {
      const totalZvE = zvEOrd + abfindung;
      if (zvEOrd < 0 && totalZvE > 0) {
        const satz3Base = totalZvE / 5;
        const estSatz3Base = estWithProgressionsvorbehalt(satz3Base, algForProgression, false);
        parts.push(
          tList('calculation.popover.fuenftel.fuenftelNegativeOrdinary', {
            totalZvE: fmtE(totalZvE),
            satz3Base: fmtE(satz3Base),
            estSatz3Base: fmtE(estSatz3Base),
            estSatz3BasePlain: fmtENoSym(estSatz3Base),
            total: fmtE(5 * estSatz3Base)
          })
        );
        return parts.join('\n');
      }
      const fuenftelBetrag = abfindung / 5;
      const estMitFuenftel = estWithProgressionsvorbehalt(zvEOrd + fuenftelBetrag, algForProgression, false);
      const zusatz = Math.max(0, 5 * (estMitFuenftel - estSockel));
      parts.push(
        tList('calculation.popover.fuenftel.fuenftelWithAbf', {
          fuenftelBetrag: fmtE(fuenftelBetrag),
          estMitFuenftel: fmtE(estMitFuenftel),
          estMitPlain: fmtENoSym(estMitFuenftel),
          sockelPlain: fmtENoSym(estSockel),
          zusatz: fmtE(zusatz),
          total: fmtE(estSockel + zusatz)
        })
      );
    } else {
      parts.push(tList('calculation.popover.fuenftel.fuenftelWithoutAbf', { sockel: fmtE(estSockel) }));
    }
    return parts.join('\n');
  }

  const childrenForDisplay = Math.round(yc.stayUnemployed.userTax.kfbHalf / KFB_HALF_PER_CHILD_2026);

  function abfindungTaxBreakdown(tax: PersonTaxResult): { sockel: number; mitFuenftel: number; zusatz: number; rate: number } {
    const zvEOrd = tax.zvEwithoutKFB;
    const sockel = estWithProgressionsvorbehalt(zvEOrd, tax.unemploymentBenefitForProgression, false);
    if (tax.severance <= 0) return { sockel, mitFuenftel: sockel, zusatz: 0, rate: 0 };
    const totalZvE = zvEOrd + tax.severance;
    if (zvEOrd < 0 && totalZvE > 0) {
      const total = 5 * estWithProgressionsvorbehalt(totalZvE / 5, tax.unemploymentBenefitForProgression, false);
      return {
        sockel,
        mitFuenftel: total,
        zusatz: Math.max(0, total - sockel),
        rate: tax.severance > 0 ? Math.max(0, total - sockel) / tax.severance : 0
      };
    }
    const mitFuenftel = estWithProgressionsvorbehalt(zvEOrd + tax.severance / 5, tax.unemploymentBenefitForProgression, false);
    const zusatz = Math.max(0, 5 * (mitFuenftel - sockel));
    const rate = tax.severance > 0 ? zusatz / tax.severance : 0;
    return { sockel, mitFuenftel, zusatz, rate };
  }

  const pullAbfindungTax = () => ({
    liegen: {
      user: abfindungTaxBreakdown(yc.stayUnemployed.userTax).zusatz,
      spouse: abfindungTaxBreakdown(yc.stayUnemployed.spouseTax).zusatz
    },
    neue: {
      user: abfindungTaxBreakdown(yc.newJob.userTax).zusatz,
      spouse: abfindungTaxBreakdown(yc.newJob.spouseTax).zusatz
    }
  });

  const buildAbfindungMeta = () => {
    const pctFmt = new Intl.NumberFormat('de-DE', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 });
    const cellMeta = (tax: PersonTaxResult) => {
      if (tax.severance <= 0) return undefined;
      const b = abfindungTaxBreakdown(tax);
      return {
        suffix: `(${pctFmt.format(b.rate)})`,
        sub: `${euroFmt.format(Math.round(tax.severance - b.zusatz))} (${t('calculation.nettoSuffix')})`
      };
    };
    return {
      liegen: { user: cellMeta(yc.stayUnemployed.userTax), spouse: cellMeta(yc.stayUnemployed.spouseTax) },
      neue: { user: cellMeta(yc.newJob.userTax), spouse: cellMeta(yc.newJob.spouseTax) }
    };
  };

  function describeSoli(c: (typeof cells)[number]): string {
    const jointTax = yc.mode === 'joint' ? (c.scenario === 'liegen' ? yc.stayUnemployed.jointTax : yc.newJob.jointTax) : undefined;
    const freigrenze = jointTax ? SOLI_FREIGRENZE_JOINT_2026 : SOLI_FREIGRENZE_SINGLE_2026;
    const est = Math.floor(Math.max(0, jointTax ? jointTax.zuschlagsteuerBaseIncomeTaxJoint : c.tax.zuschlagsteuerBaseIncomeTax));
    const jointAllocation = jointTax
      ? '\n' +
        tList('calculation.popover.soli.jointAllocation', {
          allocated: fmtE(c.tax.soli)
        })
      : '';
    if (est <= freigrenze) {
      return (
        tList('calculation.popover.soli.detailBelowFreigrenze', {
          est: fmtE(est),
          freigrenze: fmtE(freigrenze)
        }) + jointAllocation
      );
    }
    const cap = SOLI_RATE * est;
    const milderung = SOLI_MILDERUNGSZONE_RATE * (est - freigrenze);
    const capWins = cap <= milderung;
    return (
      tList('calculation.popover.soli.detailAboveFreigrenze', {
        est: fmtE(est),
        soliRate: SOLI_RATE * 100,
        milderungRate: SOLI_MILDERUNGSZONE_RATE * 100,
        estPlain: fmtENoSym(est),
        freigrenzePlain: fmtENoSym(freigrenze),
        cap: fmtE(cap),
        milderung: fmtE(milderung),
        capPlain: fmtENoSym(cap),
        milderungPlain: fmtENoSym(milderung),
        soli: fmtE(Math.floor(Math.min(cap, milderung))),
        chosen: capWins ? t('calculation.popover.soli.capWins') : t('calculation.popover.soli.milderungActive')
      }) + jointAllocation
    );
  }

  return {
    titleKey: 'calculation.groups.est.title',
    legalBasisKey: 'calculation.groups.est.legalBasis',
    deductions: [
      {
        label: '2.6',
        titleKey: 'calculation.steps.soli.title',
        legalBasisKey: 'calculation.steps.soli.legalBasis',
        ...pullTax((tx) => tx.soli),
        isDeduction: true,
        popover: {
          formula: tList('calculation.popover.soli.formula'),
          details: buildDetails((c) => describeSoli(c))
        }
      }
    ],
    alternatives: [
      {
        label: '2.1',
        titleKey: 'calculation.steps.tariffIncomeTaxWithoutKFB.title',
        legalBasisKey: 'calculation.steps.tariffIncomeTaxWithoutKFB.legalBasis',
        ...pullTax((tx) => tx.tarifIncomeTaxWithoutKFB),
        isDeduction: true,
        popover: {
          formula: tList('calculation.popover.tariffIncomeTaxWithoutKFB.formula'),
          details: buildDetails((c) =>
            showFuenftelProgrV(
              c.tax.zvEwithoutKFB,
              c.tax.severance,
              c.tax.unemploymentBenefit,
              c.tax.unemploymentBenefitForProgression,
              c.tax.unemploymentBenefitPauschbetragDeduction
            )
          )
        }
      },
      {
        label: '2.2',
        titleKey: 'calculation.steps.tariffIncomeTaxWithKFB.title',
        legalBasisKey: 'calculation.steps.tariffIncomeTaxWithKFB.legalBasis',
        ...pullTax((tx) => tx.tarifIncomeTaxWithKFB),
        isDeduction: true,
        popover: {
          formula: tList('calculation.popover.tariffIncomeTaxWithKFB.formula', {
            childCount: childrenForDisplay,
            childWord: t(childrenForDisplay === 1 ? 'calculation.childUnit.one' : 'calculation.childUnit.many')
          }),
          details: buildDetails(
            (c) =>
              tList('calculation.popover.tariffIncomeTaxWithKFB.detailPrefix', {
                kfbHalf: fmtE(c.tax.kfbHalf),
                zvEminusKfb: fmtE(c.tax.zvEwithKFB)
              }) +
              '\n' +
              showFuenftelProgrV(
                c.tax.zvEwithKFB,
                c.tax.severance,
                c.tax.unemploymentBenefit,
                c.tax.unemploymentBenefitForProgression,
                c.tax.unemploymentBenefitPauschbetragDeduction
              )
          )
        }
      },
      {
        label: '2.3',
        titleKey: 'calculation.steps.kfbSavings.title',
        legalBasisKey: 'calculation.steps.kfbSavings.legalBasis',
        ...pullTax((tx) => tx.kfbSavings),
        isDeduction: false,
        popover: {
          formula: tList('calculation.popover.kfbSavings.formula'),
          details: buildDetails((c) =>
            tList('calculation.popover.kfbSavings.detail', {
              est21: fmtE(c.tax.tarifIncomeTaxWithoutKFB),
              est22: fmtE(c.tax.tarifIncomeTaxWithKFB),
              savings: fmtE(c.tax.kfbSavings)
            })
          )
        }
      },
      {
        label: '2.4',
        titleKey: 'calculation.steps.childBenefitShare.title',
        legalBasisKey: 'calculation.steps.childBenefitShare.legalBasis',
        ...pullTax((tx) => tx.childBenefitShare),
        isDeduction: false,
        popover: {
          formula: tList('calculation.popover.childBenefitShare.formula'),
          details: buildDetails((c) =>
            tList('calculation.popover.childBenefitShare.detail', {
              kgHalf: KINDERGELD_PER_MONTH_PER_CHILD_2026 / 2,
              childCount: childrenForDisplay,
              childWord: t(childrenForDisplay === 1 ? 'calculation.childUnit.one' : 'calculation.childUnit.many'),
              result: fmtE(c.tax.childBenefitShare)
            })
          )
        }
      },
      {
        label: '2.5',
        titleKey: 'calculation.steps.abfindungSteuer.title',
        legalBasisKey: 'calculation.steps.abfindungSteuer.legalBasis',
        ...pullAbfindungTax(),
        isDeduction: true,
        cellMeta: buildAbfindungMeta(),
        popover: {
          formula: tList('calculation.popover.abfindungSteuer.formula'),
          details: buildDetails((c) => {
            if (c.tax.severance <= 0) return t('calculation.popover.abfindungSteuer.noAbfindung');
            const b = abfindungTaxBreakdown(c.tax);
            return tList('calculation.popover.abfindungSteuer.detail', {
              abfindung: fmtE(c.tax.severance),
              fuenftel: fmtE(c.tax.severance / 5),
              sockel: fmtE(b.sockel),
              mitFuenftel: fmtE(b.mitFuenftel),
              mitPlain: fmtENoSym(b.mitFuenftel),
              sockelPlain: fmtENoSym(b.sockel),
              zusatz: fmtE(b.zusatz),
              zusatzPlain: fmtENoSym(b.zusatz),
              abfindungPlain: fmtENoSym(c.tax.severance),
              ratePct: (b.rate * 100).toFixed(2)
            });
          })
        }
      }
    ],
    result: {
      label: '3',
      titleKey: 'calculation.steps.steuerGesamt.title',
      legalBasisKey: 'calculation.steps.steuerGesamt.legalBasis',
      ...pullTax((tx) => tx.assessedIncomeTax + tx.soli + tx.kirchensteuer),
      isDeduction: true,
      highlight: true,
      popover: {
        formula: tList('calculation.popover.steuerGesamt.formula'),
        details: buildDetails((c) => {
          const tax = c.tax;
          if (tax.kfbPreferred) {
            return tList('calculation.popover.steuerGesamt.detailKfbWins', {
              kfbSavings: fmtE(tax.kfbSavings),
              childBenefitShare: fmtE(tax.childBenefitShare),
              kfbDiff: fmtE(tax.kfbSavings - tax.childBenefitShare),
              est22: fmtE(tax.tarifIncomeTaxWithKFB),
              assessedIncomeTax: fmtE(tax.assessedIncomeTax),
              zuschlagsteuerBaseIncomeTax: fmtE(tax.zuschlagsteuerBaseIncomeTax),
              soli: fmtE(tax.soli),
              kirchensteuer: fmtE(tax.kirchensteuer),
              total: fmtE(tax.assessedIncomeTax + tax.soli + tax.kirchensteuer),
              est21: fmtE(tax.tarifIncomeTaxWithoutKFB),
              savings: fmtE(tax.tarifIncomeTaxWithoutKFB - tax.assessedIncomeTax)
            });
          }
          return tList('calculation.popover.steuerGesamt.detailKindergeldWins', {
            kfbSavings: fmtE(tax.kfbSavings),
            childBenefitShare: fmtE(tax.childBenefitShare),
            kgDiff: fmtE(tax.childBenefitShare - tax.kfbSavings),
            est21: fmtE(tax.tarifIncomeTaxWithoutKFB),
            assessedIncomeTax: fmtE(tax.assessedIncomeTax),
            zuschlagsteuerBaseIncomeTax: fmtE(tax.zuschlagsteuerBaseIncomeTax),
            soli: fmtE(tax.soli),
            kirchensteuer: fmtE(tax.kirchensteuer),
            total: fmtE(tax.assessedIncomeTax + tax.soli + tax.kirchensteuer)
          });
        })
      },
      notes: {
        liegen: {
          user: {
            text: yc.stayUnemployed.userTax.kfbPreferred
              ? t('calculation.popover.steuerGesamt.notes.kfbWinsBadge', {
                  est22: fmtE(yc.stayUnemployed.userTax.tarifIncomeTaxWithKFB),
                  kg: fmtE(yc.stayUnemployed.userTax.childBenefitShare)
                })
              : t('calculation.popover.steuerGesamt.notes.kindergeldWinsBadge', {
                  kg: fmtE(yc.stayUnemployed.userTax.childBenefitShare)
                }),
            variant: yc.stayUnemployed.userTax.kfbPreferred ? 'success' : 'info'
          },
          spouse: {
            text: yc.stayUnemployed.spouseTax.kfbPreferred
              ? t('calculation.popover.steuerGesamt.notes.kfbWinsBadge', {
                  est22: fmtE(yc.stayUnemployed.spouseTax.tarifIncomeTaxWithKFB),
                  kg: fmtE(yc.stayUnemployed.spouseTax.childBenefitShare)
                })
              : t('calculation.popover.steuerGesamt.notes.kindergeldWinsBadge', {
                  kg: fmtE(yc.stayUnemployed.spouseTax.childBenefitShare)
                }),
            variant: yc.stayUnemployed.spouseTax.kfbPreferred ? 'success' : 'info'
          }
        },
        neue: {
          user: {
            text: yc.newJob.userTax.kfbPreferred
              ? t('calculation.popover.steuerGesamt.notes.kfbWinsBadge', {
                  est22: fmtE(yc.newJob.userTax.tarifIncomeTaxWithKFB),
                  kg: fmtE(yc.newJob.userTax.childBenefitShare)
                })
              : t('calculation.popover.steuerGesamt.notes.kindergeldWinsBadge', {
                  kg: fmtE(yc.newJob.userTax.childBenefitShare)
                }),
            variant: yc.newJob.userTax.kfbPreferred ? 'success' : 'info'
          },
          spouse: {
            text: yc.newJob.spouseTax.kfbPreferred
              ? t('calculation.popover.steuerGesamt.notes.kfbWinsBadge', {
                  est22: fmtE(yc.newJob.spouseTax.tarifIncomeTaxWithKFB),
                  kg: fmtE(yc.newJob.spouseTax.childBenefitShare)
                })
              : t('calculation.popover.steuerGesamt.notes.kindergeldWinsBadge', {
                  kg: fmtE(yc.newJob.spouseTax.childBenefitShare)
                }),
            variant: yc.newJob.spouseTax.kfbPreferred ? 'success' : 'info'
          }
        }
      }
    }
  };
}

function buildNettoGroup(yc: YearComputation): StepGroup {
  const fmtE = (n: number) => euroFmt.format(Math.round(n));

  type PersonNetto = {
    brutto: number;
    abfindung: number;
    alg: number;
    vuv: number;
    kindergeld: number;
    sv: number;
    steuer: number;
    spenden: number;
    netto: number;
  };

  function compute(p: PersonYearResult, tax: PersonTaxResult): PersonNetto {
    const brutto = p.grossWages;
    const abfindung = p.income.severance;
    const alg = p.income.unemploymentBenefit;
    const vuv = p.rentalIncomeNet;
    const kindergeld = tax.childBenefitShare;
    const sv = p.sv.kv + p.sv.pv + p.sv.rv + p.sv.alv;
    const steuer = tax.assessedIncomeTax + tax.soli + tax.kirchensteuer;
    const spenden = p.donationDeduction;
    const netto = brutto + abfindung + alg + vuv + kindergeld - sv - steuer - spenden;
    return { brutto, abfindung, alg, vuv, kindergeld, sv, steuer, spenden, netto };
  }

  const data = {
    liegen: {
      user: compute(yc.stayUnemployed.user, yc.stayUnemployed.userTax),
      spouse: compute(yc.stayUnemployed.spouse, yc.stayUnemployed.spouseTax)
    },
    neue: {
      user: compute(yc.newJob.user, yc.newJob.userTax),
      spouse: compute(yc.newJob.spouse, yc.newJob.spouseTax)
    }
  };

  const pull = (sel: (n: PersonNetto) => number) => ({
    liegen: { user: sel(data.liegen.user), spouse: sel(data.liegen.spouse) },
    neue: { user: sel(data.neue.user), spouse: sel(data.neue.spouse) }
  });

  const cells = (['liegen', 'neue'] as const).flatMap((s) => (['user', 'spouse'] as const).map((c) => ({ scenario: s, cell: c, n: data[s][c] })));
  function detailsFor(builder: (n: PersonNetto) => string) {
    return buildCellDetails(cells, (c) => builder(c.n));
  }

  return {
    titleKey: 'calculation.groups.netto.title',
    legalBasisKey: 'calculation.groups.netto.legalBasis',
    income: [
      {
        label: '3.1',
        titleKey: 'calculation.steps.bruttoeinnahmen.title',
        legalBasisKey: 'calculation.steps.bruttoeinnahmen.legalBasis',
        ...pull((n) => n.brutto + n.abfindung + n.alg + n.vuv + n.kindergeld),
        isDeduction: false,
        popover: {
          formula: tList('calculation.popover.bruttoeinnahmen.formula'),
          details: detailsFor((n) =>
            tList('calculation.popover.bruttoeinnahmen.detail', {
              brutto: fmtE(n.brutto),
              abfindung: fmtE(n.abfindung),
              alg: fmtE(n.alg),
              vuv: fmtE(n.vuv),
              kindergeld: fmtE(n.kindergeld),
              sum: fmtE(n.brutto + n.abfindung + n.alg + n.vuv + n.kindergeld)
            })
          )
        }
      }
    ],
    deductions: [
      {
        label: '3.2',
        titleKey: 'calculation.steps.sozialabgabenAbfluss.title',
        legalBasisKey: 'calculation.steps.sozialabgabenAbfluss.legalBasis',
        ...pull((n) => n.sv),
        isDeduction: true
      },
      {
        label: '3.3',
        titleKey: 'calculation.steps.steuerGesamtAbfluss.title',
        legalBasisKey: 'calculation.steps.steuerGesamtAbfluss.legalBasis',
        ...pull((n) => n.steuer),
        isDeduction: true
      },
      {
        label: '3.4',
        titleKey: 'calculation.steps.spendenAbfluss.title',
        legalBasisKey: 'calculation.steps.spendenAbfluss.legalBasis',
        ...pull((n) => n.spenden),
        isDeduction: true
      }
    ],
    result: {
      label: '4',
      titleKey: 'calculation.steps.nettoEinkommen.title',
      legalBasisKey: 'calculation.steps.nettoEinkommen.legalBasis',
      ...pull((n) => n.netto),
      isDeduction: false,
      highlight: true,
      popover: {
        formula: tList('calculation.popover.nettoEinkommen.formula'),
        details: detailsFor((n) => {
          const zufluesse = n.brutto + n.abfindung + n.alg + n.vuv + n.kindergeld;
          const abfluesse = n.sv + n.steuer + n.spenden;
          return tList('calculation.popover.nettoEinkommen.detail', {
            zufluesse: fmtE(zufluesse),
            brutto: fmtE(n.brutto),
            abfindung: fmtE(n.abfindung),
            alg: fmtE(n.alg),
            vuv: fmtE(n.vuv),
            kindergeld: fmtE(n.kindergeld),
            abfluesse: fmtE(abfluesse),
            sv: fmtE(n.sv),
            steuer: fmtE(n.steuer),
            spenden: fmtE(n.spenden),
            netto: fmtE(n.netto)
          });
        })
      }
    }
  };
}

const yearViews = computed<YearView[]>(() =>
  years.value.map((yc) => ({
    year: yc.year,
    zvEGroup: buildZvEGroup(yc),
    sozialabgabenGroup: buildSozialabgabenGroup(yc),
    estGroup: buildEstGroup(yc),
    nettoGroup: buildNettoGroup(yc),
    algLiegen: { user: yc.stayUnemployed.user.income.unemploymentBenefit, spouse: yc.stayUnemployed.spouse.income.unemploymentBenefit },
    algNeue: { user: yc.newJob.user.income.unemploymentBenefit, spouse: yc.newJob.spouse.income.unemploymentBenefit },
    severanceLiegen: { user: yc.stayUnemployed.user.income.severance, spouse: yc.stayUnemployed.spouse.income.severance },
    severanceNeue: { user: yc.newJob.user.income.severance, spouse: yc.newJob.spouse.income.severance }
  }))
);

interface ScenarioYearTotals {
  brutto: number;
  abfindung: number;
  alg: number;
  vuv: number;
  kindergeld: number;
  sv: number;
  steuer: number;
  spenden: number;
  netto: number;
}
interface ScenarioTotals {
  perYear: Array<{ year: number } & ScenarioYearTotals>;
  sum: ScenarioYearTotals;
}
interface SummaryView {
  liegen: ScenarioTotals;
  neue: ScenarioTotals;
  diffNetto: number;
}

function aggregateScenario(
  rows: Array<{ user: PersonYearResult; userTax: PersonTaxResult; spouse: PersonYearResult; spouseTax: PersonTaxResult; year: number }>
): ScenarioTotals {
  const perYear = rows.map((r) => {
    const sumPerson = (p: PersonYearResult, t: PersonTaxResult) => ({
      brutto: p.grossWages,
      abfindung: p.income.severance,
      alg: p.income.unemploymentBenefit,
      vuv: p.rentalIncomeNet,
      kindergeld: t.childBenefitShare,
      sv: p.sv.kv + p.sv.pv + p.sv.rv + p.sv.alv,
      steuer: t.assessedIncomeTax + t.soli + t.kirchensteuer,
      spenden: p.donationDeduction
    });
    const a = sumPerson(r.user, r.userTax);
    const b = sumPerson(r.spouse, r.spouseTax);
    const yearTotals: ScenarioYearTotals = {
      brutto: a.brutto + b.brutto,
      abfindung: a.abfindung + b.abfindung,
      alg: a.alg + b.alg,
      vuv: a.vuv + b.vuv,
      kindergeld: a.kindergeld + b.kindergeld,
      sv: a.sv + b.sv,
      steuer: a.steuer + b.steuer,
      spenden: a.spenden + b.spenden,
      netto: 0
    };
    yearTotals.netto =
      yearTotals.brutto +
      yearTotals.abfindung +
      yearTotals.alg +
      yearTotals.vuv +
      yearTotals.kindergeld -
      yearTotals.sv -
      yearTotals.steuer -
      yearTotals.spenden;
    return { year: r.year, ...yearTotals };
  });
  const zero: ScenarioYearTotals = { brutto: 0, abfindung: 0, alg: 0, vuv: 0, kindergeld: 0, sv: 0, steuer: 0, spenden: 0, netto: 0 };
  const sum = perYear.reduce<ScenarioYearTotals>(
    (acc, y) => ({
      brutto: acc.brutto + y.brutto,
      abfindung: acc.abfindung + y.abfindung,
      alg: acc.alg + y.alg,
      vuv: acc.vuv + y.vuv,
      kindergeld: acc.kindergeld + y.kindergeld,
      sv: acc.sv + y.sv,
      steuer: acc.steuer + y.steuer,
      spenden: acc.spenden + y.spenden,
      netto: acc.netto + y.netto
    }),
    zero
  );
  return { perYear, sum };
}

const summary = computed<SummaryView>(() => {
  const liegen = aggregateScenario(years.value.map((yc) => ({ year: yc.year, ...yc.stayUnemployed })));
  const neue = aggregateScenario(years.value.map((yc) => ({ year: yc.year, ...yc.newJob })));
  return { liegen, neue, diffNetto: neue.sum.netto - liegen.sum.netto };
});

const SUMMARY_EVEN_THRESHOLD = 500;
const PER_MONTH_LOW = 2500;
const PER_MONTH_HIGH = 3000;
type PerMonthVerdictType = 'negative' | 'low' | 'mid' | 'high';
function perMonthVerdictType(perMonth: number): PerMonthVerdictType {
  if (perMonth < 0) return 'negative';
  if (perMonth < PER_MONTH_LOW) return 'low';
  if (perMonth < PER_MONTH_HIGH) return 'mid';
  return 'high';
}
const periodEnd = computed<Date | null>(() => {
  const ys = years.value;
  if (ys.length === 0) return null;
  return new Date(ys[ys.length - 1].year, 11, 31);
});
const monthsWorked = computed<number>(() => {
  const end = periodEnd.value;
  const start = newJobStartDate.value;
  if (!end || !start) return 0;
  return Math.max(0, (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1);
});
const perMonthInfo = computed<{ perMonth: number; type: PerMonthVerdictType } | null>(() => {
  const m = monthsWorked.value;
  if (m <= 0) return null;
  const perMonth = summary.value.diffNetto / m;
  return { perMonth, type: perMonthVerdictType(perMonth) };
});

const summaryVerdict = computed<{ key: string; amount: string; tone: 'success' | 'warning' | 'info' | PerMonthVerdictType }>(() => {
  const d = summary.value.diffNetto;
  const abs = Math.abs(d);
  if (abs <= SUMMARY_EVEN_THRESHOLD) {
    return {
      key: isSingleMode.value ? 'calculation.summary.verdictEvenSingle' : 'calculation.summary.verdictEven',
      amount: euroFmt.format(Math.round(abs)),
      tone: 'info'
    };
  }
  if (d > 0) {
    const tone = perMonthInfo.value?.type ?? 'high';
    return {
      key: isSingleMode.value ? 'calculation.summary.verdictNeueSingle' : 'calculation.summary.verdictNeue',
      amount: euroFmt.format(Math.round(abs)),
      tone
    };
  }
  return {
    key: isSingleMode.value ? 'calculation.summary.verdictLiegenSingle' : 'calculation.summary.verdictLiegen',
    amount: euroFmt.format(Math.round(abs)),
    tone: 'warning'
  };
});

function summaryBoxClass(tone: 'success' | 'warning' | 'info' | PerMonthVerdictType): string {
  if (tone === 'high' || tone === 'success') return 'border-emerald-400 bg-emerald-50 dark:border-emerald-600 dark:bg-emerald-950/40';
  if (tone === 'mid' || tone === 'info') return 'border-sky-400 bg-sky-50 dark:border-sky-600 dark:bg-sky-950/40';
  if (tone === 'low') return 'border-amber-400 bg-amber-50 dark:border-amber-600 dark:bg-amber-950/40';
  return 'border-rose-400 bg-rose-50 dark:border-rose-600 dark:bg-rose-950/40';
}

const perMonthDetailText = computed<string | null>(() => {
  const info = perMonthInfo.value;
  if (!info) return null;
  if (summary.value.diffNetto <= SUMMARY_EVEN_THRESHOLD) return null;
  return t('calculation.summary.perMonthDetail', {
    perMonth: euroFmt.format(Math.round(info.perMonth)),
    months: monthsWorked.value,
    delta: euroFmt.format(Math.round(summary.value.diffNetto)),
    start: dateFmt.format(newJobStartDate.value),
    end: periodEnd.value ? dateFmt.format(periodEnd.value) : '',
    verdict: t(`chart.summary.perMonthVerdict.${info.type}`)
  });
});

const openPanels = ['summary'];
const veranlagungLabel = computed(() => {
  if (isSingleMode.value) return t('calculation.veranlagungsart.singleLong');
  return t(veranlagungsart.value === 'joint' ? 'calculation.veranlagungsart.jointLong' : 'calculation.veranlagungsart.separateLong');
});
</script>

<template>
  <section class="flex flex-col gap-6">
    <header class="flex flex-col gap-1">
      <h1 class="text-2xl font-semibold text-primary-700 dark:text-primary-300">
        {{ t('calculation.pageTitle', { veranlagung: veranlagungLabel }) }}
      </h1>
      <p class="text-sm text-surface-600 dark:text-surface-400">
        {{ t('calculation.pageIntro', { veranlagung: veranlagungLabel }) }}
      </p>
      <p class="text-xs italic text-surface-500 dark:text-surface-400">
        {{ t('calculation.pageDisclaimer', taxYearParams) }}
      </p>
    </header>

    <div class="rounded-lg border border-primary-300 bg-primary-50/40 p-4 dark:border-primary-700 dark:bg-primary-950/40">
      <div class="flex flex-col gap-4 lg:flex-row lg:gap-6 lg:items-end">
        <div class="flex flex-wrap gap-x-4 gap-y-3 items-end flex-1 lg:justify-end">
          <div v-if="!isSingleMode" class="flex flex-col gap-1 w-55">
            <span class="text-xs text-surface-700 dark:text-surface-300">{{ t('calculation.veranlagungsart.label') }}</span>
            <SelectButton
              v-model="veranlagungsart"
              :options="veranlagungsartOptions"
              option-label="label"
              option-value="value"
              :allow-empty="false"
              size="small"
              :pt="{ root: { class: 'flex w-full' }, pcToggleButton: { root: { class: 'flex-1' } } }"
            />
          </div>

          <div class="flex flex-col gap-1 w-55">
            <span class="text-xs text-surface-700 dark:text-surface-300">{{ t('calculation.sliders.severancePaymentDate') }}</span>
            <SelectButton
              v-model="severanceIndex"
              :options="severanceOptions"
              option-label="label"
              option-value="value"
              :allow-empty="false"
              size="small"
              :pt="{ root: { class: 'flex w-full' }, pcToggleButton: { root: { class: 'flex-1' } } }"
            />
          </div>
        </div>

        <div class="hidden self-stretch bg-primary-200 px-px dark:bg-primary-800 lg:block" aria-hidden="true"></div>

        <div class="flex flex-wrap gap-x-4 gap-y-3 items-end flex-1 lg:justify-start">
          <div class="flex flex-col gap-1 w-55">
            <span class="text-xs text-surface-700 dark:text-surface-300">{{ t('calculation.sliders.newJobStartDate') }}</span>
            <DatePicker
              v-model="newJobStartProxy"
              view="month"
              date-format="mm/yy"
              :min-date="minNewJobDate"
              :max-date="maxNewJobDate"
              :disabled="hasNewJobFixed"
              show-icon
              size="small"
              fluid
            />
          </div>

          <div class="flex flex-col gap-1 w-55">
            <span class="text-xs text-surface-700 dark:text-surface-300">{{ t('calculation.sliders.monthlyGrossNewJob') }}</span>
            <Select
              v-model="monthlyGrossNewJob"
              :options="monthlyGrossOptions"
              option-label="label"
              option-value="value"
              :disabled="hasNewJobFixed"
              size="small"
              fluid
            />
          </div>
        </div>
      </div>

      <p v-if="hasNewJobFixed" class="mt-3 text-xs text-primary-700 dark:text-primary-300">
        <i class="pi pi-info-circle mr-1" aria-hidden="true"></i>
        {{ t('calculation.sliders.newJobFixedHint') }}
      </p>
    </div>

    <Accordion :value="openPanels" multiple>
      <AccordionPanel
        v-for="yv in yearViews"
        :key="yv.year"
        :value="String(yv.year)"
        class="mb-2 overflow-hidden rounded-md border border-surface-200 dark:border-surface-700"
      >
        <AccordionHeader class="bg-surface-50 py-2.5! dark:bg-surface-900!">
          <span class="font-semibold">{{ t('calculation.accordion.year', { year: yv.year }) }}</span>
        </AccordionHeader>
        <AccordionContent>
          <div class="flex flex-col gap-4 pt-2">
            <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-x-4">
              <div class="text-center text-xs uppercase tracking-wide text-surface-500">
                {{ t('calculation.scenarios.liegen') }}
              </div>
              <div class="w-12"></div>
              <div class="text-center text-xs uppercase tracking-wide text-primary-600 dark:text-primary-400">
                {{ t('calculation.scenarios.neue') }}
              </div>
            </div>

            <div class="grid grid-cols-[1fr_auto_1fr] gap-x-4 items-stretch">
              <div class="rounded-md border border-amber-300 bg-amber-50/60 p-3 dark:border-amber-700 dark:bg-amber-950/40">
                <div class="mb-1 text-xs font-semibold text-amber-800 dark:text-amber-300">
                  {{ t('calculation.steps.arbeitslosengeld.title') }}
                </div>
                <div :class="['grid gap-x-3 text-sm', isSingleMode ? 'grid-cols-1' : 'grid-cols-2']">
                  <div class="text-xs text-surface-500">{{ t('calculation.person.user') }}</div>
                  <div v-if="!isSingleMode" class="text-xs text-surface-500">{{ t('calculation.person.spouse') }}</div>
                  <div class="font-mono">{{ formatEuro(yv.algLiegen.user) }}</div>
                  <div v-if="!isSingleMode" class="font-mono">{{ formatEuro(yv.algLiegen.spouse) }}</div>
                </div>
              </div>
              <div class="flex items-center justify-center">
                <i class="pi pi-info-circle text-xl text-amber-500" aria-hidden="true"></i>
              </div>
              <div class="rounded-md border border-amber-300 bg-amber-50/60 p-3 dark:border-amber-700 dark:bg-amber-950/40">
                <div class="mb-1 text-xs font-semibold text-amber-800 dark:text-amber-300">
                  {{ t('calculation.steps.arbeitslosengeld.title') }}
                </div>
                <div :class="['grid gap-x-3 text-sm', isSingleMode ? 'grid-cols-1' : 'grid-cols-2']">
                  <div class="text-xs text-surface-500">{{ t('calculation.person.user') }}</div>
                  <div v-if="!isSingleMode" class="text-xs text-surface-500">{{ t('calculation.person.spouse') }}</div>
                  <div class="font-mono">{{ formatEuro(yv.algNeue.user) }}</div>
                  <div v-if="!isSingleMode" class="font-mono">{{ formatEuro(yv.algNeue.spouse) }}</div>
                </div>
              </div>
            </div>
            <p class="px-1 text-xs italic text-surface-500">
              {{ t('calculation.steps.arbeitslosengeld.note') }}
            </p>

            <div v-if="yv.severanceLiegen.user > 0 || yv.severanceNeue.user > 0" class="grid grid-cols-[1fr_auto_1fr] gap-x-4 items-stretch">
              <div class="rounded-md border border-purple-300 bg-purple-50/60 p-3 dark:border-purple-700 dark:bg-purple-950/40">
                <div class="mb-1 text-xs font-semibold text-purple-800 dark:text-purple-300">{{ t('calculation.abfindungBoxTitle') }}</div>
                <div :class="['grid gap-x-3 text-sm', isSingleMode ? 'grid-cols-1' : 'grid-cols-2']">
                  <div class="text-xs text-surface-500">{{ t('calculation.person.user') }}</div>
                  <div v-if="!isSingleMode" class="text-xs text-surface-500">{{ t('calculation.person.spouse') }}</div>
                  <div class="font-mono">{{ formatEuro(yv.severanceLiegen.user) }}</div>
                  <div v-if="!isSingleMode" class="font-mono">{{ formatEuro(yv.severanceLiegen.spouse) }}</div>
                </div>
              </div>
              <div class="flex items-center justify-center">
                <i class="pi pi-info-circle text-xl text-purple-500" aria-hidden="true"></i>
              </div>
              <div class="rounded-md border border-purple-300 bg-purple-50/60 p-3 dark:border-purple-700 dark:bg-purple-950/40">
                <div class="mb-1 text-xs font-semibold text-purple-800 dark:text-purple-300">{{ t('calculation.abfindungBoxTitle') }}</div>
                <div :class="['grid gap-x-3 text-sm', isSingleMode ? 'grid-cols-1' : 'grid-cols-2']">
                  <div class="text-xs text-surface-500">{{ t('calculation.person.user') }}</div>
                  <div v-if="!isSingleMode" class="text-xs text-surface-500">{{ t('calculation.person.spouse') }}</div>
                  <div class="font-mono">{{ formatEuro(yv.severanceNeue.user) }}</div>
                  <div v-if="!isSingleMode" class="font-mono">{{ formatEuro(yv.severanceNeue.spouse) }}</div>
                </div>
              </div>
            </div>

            <CalculationGroup
              :group="yv.zvEGroup"
              :hide-spouse="isSingleMode"
              income-label-key="calculation.groups.zvE.incomeSection"
              deduction-label-key="calculation.groups.zvE.deductionSection"
            />

            <CalculationGroup
              :group="yv.sozialabgabenGroup"
              :hide-spouse="isSingleMode"
              deduction-label-key="calculation.groups.sozialabgaben.deductionSection"
            />

            <CalculationGroup
              :group="yv.estGroup"
              :hide-spouse="isSingleMode"
              alternatives-label-key="calculation.groups.est.alternativesSection"
              alternatives-hint-key="calculation.groups.est.alternativesHint"
              deduction-label-key="calculation.groups.est.deductionSection"
            />

            <CalculationGroup
              :group="yv.nettoGroup"
              :hide-spouse="isSingleMode"
              income-label-key="calculation.groups.netto.incomeSection"
              deduction-label-key="calculation.groups.netto.deductionSection"
            />
          </div>
        </AccordionContent>
      </AccordionPanel>

      <AccordionPanel value="summary" class="overflow-hidden rounded-md border border-surface-200 dark:border-surface-700">
        <AccordionHeader class="bg-surface-50 py-2.5! dark:bg-surface-900!">
          <span class="font-semibold">{{ t('calculation.accordion.summary', taxYearParams) }}</span>
        </AccordionHeader>
        <AccordionContent>
          <div class="flex flex-col gap-5 pt-2">
            <div :class="['rounded-lg border-2 p-4 flex flex-col gap-1', summaryBoxClass(summaryVerdict.tone)]">
              <div class="text-xs uppercase tracking-wide text-surface-600 dark:text-surface-400">
                {{ t(isSingleMode ? 'calculation.summary.headlineSingle' : 'calculation.summary.headline') }}
              </div>
              <div class="text-lg font-semibold">
                {{ t(summaryVerdict.key, { amount: summaryVerdict.amount }) }}
              </div>
              <div class="text-xs italic text-surface-600 dark:text-surface-400">
                {{ t(isSingleMode ? 'calculation.summary.headlineHintSingle' : 'calculation.summary.headlineHint', taxYearParams) }}
              </div>
              <!-- eslint-disable-next-line vue/no-v-html -->
              <div v-if="perMonthDetailText" class="mt-1 text-xs text-surface-700 dark:text-surface-300" v-html="perMonthDetailText"></div>
            </div>

            <div class="grid grid-cols-[1fr_auto_1fr] gap-x-4 items-stretch">
              <div class="flex flex-col gap-1 rounded-md border border-surface-300 bg-surface-50 p-4 dark:border-surface-600 dark:bg-surface-900">
                <div class="text-xs uppercase tracking-wide text-surface-500">{{ t('calculation.summary.scenarioLiegen') }}</div>
                <div class="text-2xl font-mono font-semibold text-surface-800 dark:text-surface-100">{{ formatEuro(summary.liegen.sum.netto) }}</div>
                <div class="text-[11px] text-surface-500">{{ t('calculation.summary.colSum', taxYearParams) }}</div>
              </div>
              <div class="flex min-w-12 items-center justify-center">
                <i class="pi pi-arrow-right-arrow-left text-xl text-primary-500" aria-hidden="true"></i>
              </div>
              <div
                class="flex flex-col gap-1 rounded-md border-2 border-primary-400 bg-primary-50/60 p-4 dark:border-primary-600 dark:bg-primary-950/40"
              >
                <div class="text-xs uppercase tracking-wide text-primary-700 dark:text-primary-300">{{ t('calculation.summary.scenarioNeue') }}</div>
                <div class="text-2xl font-mono font-semibold text-primary-800 dark:text-primary-100">{{ formatEuro(summary.neue.sum.netto) }}</div>
                <div class="text-[11px] text-primary-600 dark:text-primary-400">{{ t('calculation.summary.colSum', taxYearParams) }}</div>
              </div>
            </div>

            <div class="flex flex-col gap-2">
              <div class="px-1 text-xs font-semibold uppercase tracking-wide text-surface-700 dark:text-surface-300">
                {{ t('calculation.summary.breakdown') }}
              </div>

              <I18nT
                v-if="!isSingleMode && veranlagungsart === 'joint'"
                keypath="calculation.summary.breakdownJointHint"
                tag="p"
                class="px-1 text-[12px] leading-snug text-surface-600 dark:text-surface-400"
                scope="global"
              >
                <template #proportional><strong>proportional</strong></template>
                <template #familySum><strong>Familien-Summe</strong></template>
              </I18nT>

              <div class="overflow-x-auto rounded-md border border-surface-300 dark:border-surface-600">
                <table class="w-full font-mono text-sm">
                  <thead class="bg-surface-100 text-xs uppercase tracking-wide dark:bg-surface-800">
                    <tr>
                      <th class="p-2 text-left font-semibold">{{ t('calculation.summary.colYear') }}</th>
                      <th class="p-2 text-right font-semibold text-emerald-700 dark:text-emerald-400">+ {{ t('calculation.summary.colBrutto') }}</th>
                      <th class="p-2 text-right font-semibold text-emerald-700 dark:text-emerald-400">
                        + {{ t('calculation.summary.colAbfindung') }}
                      </th>
                      <th class="p-2 text-right font-semibold text-emerald-700 dark:text-emerald-400">+ {{ t('calculation.summary.colAlg') }}</th>
                      <th class="p-2 text-right font-semibold text-rose-700 dark:text-rose-400">- {{ t('calculation.summary.colSv') }}</th>
                      <th class="p-2 text-right font-semibold text-rose-700 dark:text-rose-400">- {{ t('calculation.summary.colSteuer') }}</th>
                      <th class="p-2 text-right font-semibold text-emerald-800 dark:text-emerald-300">
                        = {{ t(isSingleMode ? 'calculation.summary.colNettoSingle' : 'calculation.summary.colNetto') }}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr class="bg-surface-50/40 dark:bg-surface-950/40">
                      <td
                        colspan="7"
                        class="px-2 py-1 font-sans text-xs font-semibold uppercase tracking-wide text-surface-600 dark:text-surface-400"
                      >
                        {{ t('calculation.summary.scenarioLiegen') }}
                      </td>
                    </tr>
                    <tr v-for="row in summary.liegen.perYear" :key="'l' + row.year" class="border-t border-surface-200 dark:border-surface-700">
                      <td class="p-2 font-sans">{{ row.year }}</td>
                      <td class="p-2 text-right">{{ formatEuro(row.brutto) }}</td>
                      <td class="p-2 text-right">{{ formatEuro(row.abfindung) }}</td>
                      <td class="p-2 text-right">{{ formatEuro(row.alg) }}</td>
                      <td class="p-2 text-right text-rose-700 dark:text-rose-400">{{ formatEuro(row.sv) }}</td>
                      <td class="p-2 text-right text-rose-700 dark:text-rose-400">{{ formatEuro(row.steuer) }}</td>
                      <td class="p-2 text-right font-semibold">{{ formatEuro(row.netto) }}</td>
                    </tr>
                    <tr class="border-t-2 border-surface-400 bg-surface-100/50 font-semibold dark:border-surface-500 dark:bg-surface-800/50">
                      <td class="p-2 font-sans">Σ</td>
                      <td class="p-2 text-right">{{ formatEuro(summary.liegen.sum.brutto) }}</td>
                      <td class="p-2 text-right">{{ formatEuro(summary.liegen.sum.abfindung) }}</td>
                      <td class="p-2 text-right">{{ formatEuro(summary.liegen.sum.alg) }}</td>
                      <td class="p-2 text-right text-rose-700 dark:text-rose-400">{{ formatEuro(summary.liegen.sum.sv) }}</td>
                      <td class="p-2 text-right text-rose-700 dark:text-rose-400">{{ formatEuro(summary.liegen.sum.steuer) }}</td>
                      <td class="p-2 text-right">{{ formatEuro(summary.liegen.sum.netto) }}</td>
                    </tr>

                    <tr class="bg-primary-50/40 dark:bg-primary-950/40">
                      <td
                        colspan="7"
                        class="px-2 py-1 font-sans text-xs font-semibold uppercase tracking-wide text-primary-700 dark:text-primary-300"
                      >
                        {{ t('calculation.summary.scenarioNeue') }}
                      </td>
                    </tr>
                    <tr v-for="row in summary.neue.perYear" :key="'n' + row.year" class="border-t border-surface-200 dark:border-surface-700">
                      <td class="p-2 font-sans">{{ row.year }}</td>
                      <td class="p-2 text-right">{{ formatEuro(row.brutto) }}</td>
                      <td class="p-2 text-right">{{ formatEuro(row.abfindung) }}</td>
                      <td class="p-2 text-right">{{ formatEuro(row.alg) }}</td>
                      <td class="p-2 text-right text-rose-700 dark:text-rose-400">{{ formatEuro(row.sv) }}</td>
                      <td class="p-2 text-right text-rose-700 dark:text-rose-400">{{ formatEuro(row.steuer) }}</td>
                      <td class="p-2 text-right font-semibold">{{ formatEuro(row.netto) }}</td>
                    </tr>
                    <tr class="border-t-2 border-primary-400 bg-primary-100/50 font-semibold dark:border-primary-500 dark:bg-primary-900/40">
                      <td class="p-2 font-sans">Σ</td>
                      <td class="p-2 text-right">{{ formatEuro(summary.neue.sum.brutto) }}</td>
                      <td class="p-2 text-right">{{ formatEuro(summary.neue.sum.abfindung) }}</td>
                      <td class="p-2 text-right">{{ formatEuro(summary.neue.sum.alg) }}</td>
                      <td class="p-2 text-right text-rose-700 dark:text-rose-400">{{ formatEuro(summary.neue.sum.sv) }}</td>
                      <td class="p-2 text-right text-rose-700 dark:text-rose-400">{{ formatEuro(summary.neue.sum.steuer) }}</td>
                      <td class="p-2 text-right">{{ formatEuro(summary.neue.sum.netto) }}</td>
                    </tr>

                    <tr class="border-t-2 border-double border-surface-500 bg-amber-50/60 font-semibold dark:border-surface-400 dark:bg-amber-950/30">
                      <td class="p-2 font-sans text-amber-800 dark:text-amber-300">{{ t('calculation.summary.colDiff') }}</td>
                      <td class="p-2 text-right">{{ formatEuro(summary.neue.sum.brutto - summary.liegen.sum.brutto) }}</td>
                      <td class="p-2 text-right">{{ formatEuro(summary.neue.sum.abfindung - summary.liegen.sum.abfindung) }}</td>
                      <td class="p-2 text-right">{{ formatEuro(summary.neue.sum.alg - summary.liegen.sum.alg) }}</td>
                      <td class="p-2 text-right">{{ formatEuro(summary.neue.sum.sv - summary.liegen.sum.sv) }}</td>
                      <td class="p-2 text-right">{{ formatEuro(summary.neue.sum.steuer - summary.liegen.sum.steuer) }}</td>
                      <td
                        :class="[
                          'p-2 text-right text-base',
                          summary.diffNetto > 0
                            ? 'text-emerald-700 dark:text-emerald-300'
                            : summary.diffNetto < 0
                              ? 'text-rose-700 dark:text-rose-300'
                              : 'text-surface-700 dark:text-surface-300'
                        ]"
                      >
                        {{ summary.diffNetto >= 0 ? '+' : '-' }}{{ formatEuro(Math.abs(summary.diffNetto)) }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </AccordionContent>
      </AccordionPanel>
    </Accordion>
  </section>
</template>
