import { computed } from 'vue';

import { computeYear } from '../calculation/engine';
import type { PersonYearResult, PersonTaxResult, ScenarioOverride, Veranlagungsart } from '../calculation/types';
import {
  inputToProfileUser,
  inputToProfileSpouse,
  inputToIncomeUser,
  inputToIncomeSpouse,
  deriveTaxYears,
  deriveNewJobStartOptions,
  deriveMonthlyGrossOptions,
  deriveSeveranceDateOptions
} from '../calculation/inputAdapter';
import { useUserInput } from './useUserInput';

export type ScenarioRow = {
  newJobStartDate: Date;
  severancePaymentDate: Date;
  monthlyGrossNewJob: number;
  bruttoLohn: number;
  alg: number;
  vermietung: number;
  abfindung: number;
  kindergeld: number;
  sozialausgaben: number;
  spenden: number;
  steuer: number;
  netto: number;
};

function personCashflow(p: PersonYearResult, t: PersonTaxResult) {
  return {
    brutto: p.grossWages,
    abfindung: p.income.severance,
    alg: p.income.unemploymentBenefit,
    vuv: p.rentalIncomeNet,
    kindergeld: t.childBenefitShare,
    sv: p.sv.kv + p.sv.pv + p.sv.rv + p.sv.alv,
    steuer: t.assessedIncomeTax + t.soli + t.kirchensteuer,
    spenden: p.donationDeduction
  };
}

export function useScenarioChartData() {
  const { committedInput } = useUserInput();

  const hasData = computed(() => committedInput.value !== null);

  const calcInputs = computed(() => {
    const s = committedInput.value;
    if (!s) return null;

    return {
      profileUser: inputToProfileUser(s),
      profileSpouse: inputToProfileSpouse(s),
      incomeUser: inputToIncomeUser(s),
      incomeSpouse: inputToIncomeSpouse(s),
      taxYears: deriveTaxYears(s),
      newJobStartOptions: deriveNewJobStartOptions(s),
      monthlyGrossOptions: deriveMonthlyGrossOptions(s),
      severanceDateOptions: deriveSeveranceDateOptions(s),
      isSingle: !s.withSpouse
    };
  });

  function buildRow(
    inp: NonNullable<typeof calcInputs.value>,
    newJobStartDate: Date,
    severancePaymentDate: Date,
    monthlyGrossNewJob: number,
    veranlagungsart: Veranlagungsart
  ): ScenarioRow {
    const scenarioStayUnemployed: ScenarioOverride = {
      newJobStartDate: null,
      monthlyGrossNewJob: 0,
      severancePaymentDate
    };
    const scenarioNewJob: ScenarioOverride = {
      newJobStartDate,
      monthlyGrossNewJob,
      severancePaymentDate
    };

    let bruttoLohn = 0;
    let alg = 0;
    let vermietung = 0;
    let abfindung = 0;
    let kindergeld = 0;
    let sozialausgaben = 0;
    let spenden = 0;
    let steuer = 0;

    for (const year of inp.taxYears) {
      const yc = computeYear({
        profileUser: inp.profileUser,
        profileSpouse: inp.profileSpouse,
        incomeUser: inp.incomeUser,
        incomeSpouse: inp.incomeSpouse,
        scenarioStayUnemployed,
        scenarioNewJob,
        year,
        veranlagungsart
      });

      const u = personCashflow(yc.newJob.user, yc.newJob.userTax);
      const sp = personCashflow(yc.newJob.spouse, yc.newJob.spouseTax);

      bruttoLohn += u.brutto + sp.brutto;
      alg += u.alg + sp.alg;
      vermietung += u.vuv + sp.vuv;
      abfindung += u.abfindung + sp.abfindung;
      kindergeld += u.kindergeld + sp.kindergeld;
      sozialausgaben += u.sv + sp.sv;
      spenden += u.spenden + sp.spenden;
      steuer += u.steuer + sp.steuer;
    }

    const netto = bruttoLohn + alg + vermietung + abfindung + kindergeld - sozialausgaben - spenden - steuer;

    return {
      newJobStartDate,
      severancePaymentDate,
      monthlyGrossNewJob,
      bruttoLohn,
      alg,
      vermietung,
      abfindung,
      kindergeld,
      sozialausgaben,
      spenden,
      steuer,
      netto
    };
  }

  function buildAllRows(veranlagungsart: Veranlagungsart): ScenarioRow[] {
    const inp = calcInputs.value;
    if (!inp) return [];

    const rows: ScenarioRow[] = [];
    for (const startDate of inp.newJobStartOptions) {
      for (const payDate of inp.severanceDateOptions) {
        for (const gross of inp.monthlyGrossOptions) {
          rows.push(buildRow(inp, startDate, payDate, gross, veranlagungsart));
        }
      }
    }
    return rows;
  }

  function baselineNetto(veranlagungsart: Veranlagungsart): number | null {
    const inp = calcInputs.value;
    if (!inp) return null;

    const payDate = inp.severanceDateOptions[1] ?? inp.severanceDateOptions[0];
    const scenarioStayUnemployed: ScenarioOverride = {
      newJobStartDate: null,
      monthlyGrossNewJob: 0,
      severancePaymentDate: payDate
    };
    const scenarioNewJob: ScenarioOverride = {
      newJobStartDate: inp.newJobStartOptions[0] ?? payDate,
      monthlyGrossNewJob: inp.monthlyGrossOptions[0] ?? 0,
      severancePaymentDate: payDate
    };

    let netto = 0;
    for (const year of inp.taxYears) {
      const yc = computeYear({
        profileUser: inp.profileUser,
        profileSpouse: inp.profileSpouse,
        incomeUser: inp.incomeUser,
        incomeSpouse: inp.incomeSpouse,
        scenarioStayUnemployed,
        scenarioNewJob,
        year,
        veranlagungsart
      });

      const u = personCashflow(yc.stayUnemployed.user, yc.stayUnemployed.userTax);
      const sp = personCashflow(yc.stayUnemployed.spouse, yc.stayUnemployed.spouseTax);
      netto +=
        u.brutto +
        u.abfindung +
        u.alg +
        u.vuv +
        u.kindergeld -
        u.sv -
        u.steuer -
        u.spenden +
        (sp.brutto + sp.abfindung + sp.alg + sp.vuv + sp.kindergeld - sp.sv - sp.steuer - sp.spenden);
    }

    return netto;
  }

  const scenarioRows = computed<ScenarioRow[]>(() => buildAllRows('joint'));
  const scenarioRowsSplit = computed<ScenarioRow[]>(() => buildAllRows('separate'));
  const liegenNettoJoint = computed(() => baselineNetto('joint'));
  const liegenNettoSplit = computed(() => baselineNetto('separate'));
  const isSingleMode = computed(() => calcInputs.value?.isSingle ?? false);

  function pickBestRow(rows: ScenarioRow[]): ScenarioRow | null {
    if (rows.length === 0) return null;
    let best = rows[0];
    for (const r of rows) if (r.netto > best.netto) best = r;
    return best;
  }

  const bestNeueJoint = computed(() => pickBestRow(scenarioRows.value));
  const bestNeueSplit = computed(() => pickBestRow(scenarioRowsSplit.value));

  const payDateFolgejahr = computed<Date | null>(() => {
    const inp = calcInputs.value;
    if (!inp) return null;
    return inp.severanceDateOptions[1] ?? inp.severanceDateOptions[0] ?? null;
  });

  const periodEnd = computed<Date | null>(() => {
    const inp = calcInputs.value;
    if (!inp || inp.taxYears.length === 0) return null;
    const lastYear = inp.taxYears[inp.taxYears.length - 1];
    return new Date(lastYear, 11, 31);
  });

  return {
    hasData,
    isSingleMode,
    scenarioRows,
    scenarioRowsSplit,
    liegenNettoJoint,
    liegenNettoSplit,
    bestNeueJoint,
    bestNeueSplit,
    payDateFolgejahr,
    periodEnd
  };
}
