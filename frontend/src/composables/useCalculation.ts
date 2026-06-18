import { computed, ref, watch, type Ref } from 'vue';

import { computeYear } from '../calculation/engine';
import type { ScenarioOverride, Veranlagungsart } from '../calculation/types';
import {
  inputToProfileUser,
  inputToProfileSpouse,
  inputToIncomeUser,
  inputToIncomeSpouse,
  deriveTaxYears,
  deriveNewJobStartOptions,
  deriveMonthlyGrossOptions,
  deriveSeveranceDateOptions,
} from '../calculation/inputAdapter';
import { useUserInput } from './useUserInput';

export type { Veranlagungsart } from '../calculation/types';

const STAY_UNEMPLOYED_BASE: Omit<ScenarioOverride, 'severancePaymentDate'> = {
  newJobStartDate: null,
  monthlyGrossNewJob: 0,
};

const NEUTRAL_DATE = new Date();
const NEUTRAL_GROSS = 0;

export function useCalculation() {
  const { committedInput } = useUserInput();

  const hasData = computed(() => committedInput.value !== null);

  const isSingleMode = computed(
    () => committedInput.value ? !committedInput.value.withSpouse : false,
  );

  const calcInputs = computed(() => {
    const s = committedInput.value;
    if (!s) return null;

    const newJobStartOptions = deriveNewJobStartOptions(s);
    const monthlyGrossOptions = deriveMonthlyGrossOptions(s);
    const severanceDateOptions = deriveSeveranceDateOptions(s);

    return {
      profileUser: inputToProfileUser(s),
      profileSpouse: inputToProfileSpouse(s),
      incomeUser: inputToIncomeUser(s),
      incomeSpouse: inputToIncomeSpouse(s),
      taxYears: deriveTaxYears(s),
      newJobStartOptions,
      monthlyGrossOptions,
      severanceDateOptions,
      initialNewJobStart: s.newJobStartDate ? new Date(s.newJobStartDate) : newJobStartOptions[0],
      initialMonthlyGross: s.newJobMonthlySalary || monthlyGrossOptions[0],
      initialSeveranceDate: severanceDateOptions[1] ?? severanceDateOptions[0],
    };
  });

  const severancePaymentDate = ref<Date>(calcInputs.value?.initialSeveranceDate ?? NEUTRAL_DATE);
  const newJobStartDate = ref<Date>(calcInputs.value?.initialNewJobStart ?? NEUTRAL_DATE);
  const monthlyGrossNewJob = ref<number>(calcInputs.value?.initialMonthlyGross ?? NEUTRAL_GROSS);
  const veranlagungsart = ref<Veranlagungsart>('separate');

  watch(
    isSingleMode,
    (single) => {
      if (single && veranlagungsart.value !== 'separate') veranlagungsart.value = 'separate';
    },
    { immediate: true },
  );

  watch(
    () => committedInput.value,
    () => {
      const inp = calcInputs.value;
      if (!inp) return;
      severancePaymentDate.value = inp.initialSeveranceDate;
      newJobStartDate.value = inp.initialNewJobStart;
      monthlyGrossNewJob.value = inp.initialMonthlyGross;
    },
  );

  const scenarioStayUnemployed = computed<ScenarioOverride>(() => ({
    ...STAY_UNEMPLOYED_BASE,
    severancePaymentDate: severancePaymentDate.value,
  }));

  const scenarioNewJob = computed<ScenarioOverride>(() => ({
    newJobStartDate: newJobStartDate.value,
    monthlyGrossNewJob: monthlyGrossNewJob.value,
    severancePaymentDate: severancePaymentDate.value,
  }));

  const years = computed(() => {
    const inp = calcInputs.value;
    if (!inp) return [];

    return inp.taxYears.map((y) =>
      computeYear({
        profileUser: inp.profileUser,
        profileSpouse: inp.profileSpouse,
        incomeUser: inp.incomeUser,
        incomeSpouse: inp.incomeSpouse,
        scenarioStayUnemployed: scenarioStayUnemployed.value,
        scenarioNewJob: scenarioNewJob.value,
        year: y,
        veranlagungsart: veranlagungsart.value,
      }),
    );
  });

  const newJobStartOptions = computed<readonly Date[]>(() => calcInputs.value?.newJobStartOptions ?? []);
  const monthlyGrossOptions = computed<readonly number[]>(() => calcInputs.value?.monthlyGrossOptions ?? []);
  const severanceDateOptions = computed<readonly Date[]>(() => calcInputs.value?.severanceDateOptions ?? []);

  const hasNewJobFixed = computed(() => committedInput.value?.hasNewJob === true);

  return {
    severancePaymentDate,
    newJobStartDate,
    monthlyGrossNewJob,
    veranlagungsart,
    hasData,
    isSingleMode,
    hasNewJobFixed,
    years,
    newJobStartOptions,
    monthlyGrossOptions,
    severanceDateOptions,
  };
}
