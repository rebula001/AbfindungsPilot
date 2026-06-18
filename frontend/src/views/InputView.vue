<!--
  InputView (输入模块, Task 07)：
  - 使用 PrimeVue Forms (Form + 内置 resolver) 做基础校验
  - 顶部：Single/Family + SelectButton（控制是否显示 Ehepartner 区块）
  - 聚焦其后：两个快速切换 Button 与 Accordion 当前展开项联动
  - 两段主 Accordion：Stammdaten / Einkommen & Abfindung
  - Tooltip（v-tooltip 指令，已在 main.ts 注册）解释税务概念
  - 本阶段聚焦 UI 重建；与 useCalculation 的接线、持久化等逻辑后续接入
-->
<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { Form } from '@primevue/forms';
import Accordion from 'primevue/accordion';
import AccordionContent from 'primevue/accordioncontent';
import AccordionHeader from 'primevue/accordionheader';
import AccordionPanel from 'primevue/accordionpanel';
import Button from 'primevue/button';
import DatePicker from 'primevue/datepicker';
import InputNumber from 'primevue/inputnumber';
import Message from 'primevue/message';
import RadioButton from 'primevue/radiobutton';
import Select from 'primevue/select';
import SelectButton from 'primevue/selectbutton';
import Toast from 'primevue/toast';
import ToggleSwitch from 'primevue/toggleswitch';
import { useToast } from 'primevue/usetoast';
import { useUserInput, type UserInputSnapshot } from '../composables/useUserInput';

const { t, tm } = useI18n();

const emit = defineEmits<{ saved: [] }>();

const { committedInput, commit: commitUserInput, clear: clearUserInput } = useUserInput();
const toast = useToast();

type InsuranceKind = 'statutoryMandatory' | 'private' | 'voluntaryStatutory';
type SocialInsuranceKind = 'notMandatory' | 'statutoryMandatory' | 'employerOnly' | 'employeeOnly';

const taxClass = ref('4');
const taxClassFactor = ref(1);
const paysChurchTax = ref(false);
const federalState = ref<string | null>('RP');
const healthInsurance = ref<InsuranceKind>('statutoryMandatory');
const healthInsuranceAdditionalRate = ref(2.18);
const privateHealthInsuranceAnnual = ref(0);
const privateCareInsuranceAnnual = ref(0);
const hasChildren = ref(true);
const childrenUnder25 = ref(1);
const childAllowance = ref(1);
const childBenefitMonthlyPerChild = ref(259);
const age = ref(47);
const pensionInsurance = ref<SocialInsuranceKind>('statutoryMandatory');
const unemploymentInsurance = ref<SocialInsuranceKind>('statutoryMandatory');

const withSpouse = ref(true);
const spouseTaxClass = ref('4');
const spouseTaxClassFactor = ref(1);

watch(withSpouse, (next, prev) => {
  if (next === prev) return;
  if (next) {
    taxClass.value = '4';
    spouseTaxClass.value = '4';
    hasChildren.value = true;
    childrenUnder25.value = 1;
    childAllowance.value = 1;
  } else {
    taxClass.value = '1';
    hasChildren.value = false;
    childrenUnder25.value = 0;
    childAllowance.value = 0;
  }
});

watch(taxClass, (next, prev) => {
  if (!withSpouse.value) return;
  if (next === '3') {
    if (spouseTaxClass.value !== '5') spouseTaxClass.value = '5';
  } else if (next === '5') {
    if (spouseTaxClass.value !== '3') spouseTaxClass.value = '3';
  } else if ((prev === '3' && spouseTaxClass.value === '5') || (prev === '5' && spouseTaxClass.value === '3')) {
    spouseTaxClass.value = '4';
  }
});

watch(spouseTaxClass, (next, prev) => {
  if (!withSpouse.value) return;
  if (next === '3') {
    if (taxClass.value !== '5') taxClass.value = '5';
  } else if (next === '5') {
    if (taxClass.value !== '3') taxClass.value = '3';
  } else if ((prev === '3' && taxClass.value === '5') || (prev === '5' && taxClass.value === '3')) {
    taxClass.value = '4';
  }
});

const spousePaysChurchTax = ref(false);
const spouseHealthInsurance = ref<InsuranceKind>('statutoryMandatory');
const spouseHealthInsuranceAdditionalRate = ref(2.18);
const spousePrivateHealthInsuranceAnnual = ref(0);
const spousePrivateCareInsuranceAnnual = ref(0);
const spousePensionInsurance = ref<SocialInsuranceKind>('statutoryMandatory');
const spouseUnemploymentInsurance = ref<SocialInsuranceKind>('statutoryMandatory');
const spouseAge = ref(42);

const hasNewJob = ref(false);
const expectedMonthlySalaryMin = ref(5000);
const expectedMonthlySalaryMax = ref(8000);
const expectedMonthlySalaryStep = ref(500);

const expectedMonthlySalaryStepMax = computed(() => Math.max(100, expectedMonthlySalaryMax.value - expectedMonthlySalaryMin.value));
const MAX_SALARY_LINES = 7;
const expectedMonthlySalaryStepMin = computed(() => {
  const range = expectedMonthlySalaryMax.value - expectedMonthlySalaryMin.value;
  const minStep = Math.ceil(range / (MAX_SALARY_LINES - 1) / 100) * 100;
  return Math.max(100, minStep);
});
const expectedMonthlySalaryMaxMin = computed(() => expectedMonthlySalaryMin.value + 100);

watch(expectedMonthlySalaryMin, (min) => {
  if (expectedMonthlySalaryMax.value < min) expectedMonthlySalaryMax.value = min + 100;
  if (expectedMonthlySalaryStep.value > expectedMonthlySalaryStepMax.value) {
    expectedMonthlySalaryStep.value = expectedMonthlySalaryStepMax.value;
  }
  if (expectedMonthlySalaryStep.value < expectedMonthlySalaryStepMin.value) {
    expectedMonthlySalaryStep.value = expectedMonthlySalaryStepMin.value;
  }
});

watch(expectedMonthlySalaryMax, () => {
  if (expectedMonthlySalaryStep.value > expectedMonthlySalaryStepMax.value) {
    expectedMonthlySalaryStep.value = expectedMonthlySalaryStepMax.value;
  }
  if (expectedMonthlySalaryStep.value < expectedMonthlySalaryStepMin.value) {
    expectedMonthlySalaryStep.value = expectedMonthlySalaryStepMin.value;
  }
});

const newJobStartDate = ref<Date | null>(null);
const newJobMonthlySalary = ref(6000);
const severanceGross = ref(0);
const unemploymentDate = ref<Date | null>(null);

const possibleSeverancePaymentDateSameYear = computed<Date | null>(() => {
  const d = unemploymentDate.value;
  if (!d) return null;
  return new Date(d.getFullYear(), d.getMonth(), 15);
});
const possibleSeverancePaymentDateNextYear = computed<Date | null>(() => {
  const d = unemploymentDate.value;
  if (!d) return null;
  return new Date(d.getFullYear() + 1, 0, 15);
});

const oldEmployerIncomeCurrentYear = ref(0);
const unemploymentBenefitMonthly = ref(0);
const hasBenefitReductionPeriod = ref(false);
const benefitReductionMonths = ref(1);
const hasBenefitSuspensionPeriod = ref(false);
const benefitSuspensionMonths = ref(1);
const rentalIncomeYearly = ref(0);
const sharedIncomeUserShare = ref(50);
const donationYearly = ref(0);
const sharedDonationUserShare = ref(50);
const spouseGrossIncomeYearly = ref(0);
const otherIncomeYearly = ref(0);

const hasSubmitted = ref(false);
const validationErrors = ref<Record<string, string>>({});

const DEFAULTS = {
  taxClass: '4',
  taxClassFactor: 1,
  paysChurchTax: false,
  federalState: 'RP' as string | null,
  healthInsurance: 'statutoryMandatory' as InsuranceKind,
  healthInsuranceAdditionalRate: 2.18,
  privateHealthInsuranceAnnual: 0,
  privateCareInsuranceAnnual: 0,
  hasChildren: true,
  childrenUnder25: 1,
  childAllowance: 1,
  childBenefitMonthlyPerChild: 259,
  age: 47,
  pensionInsurance: 'statutoryMandatory' as SocialInsuranceKind,
  unemploymentInsurance: 'statutoryMandatory' as SocialInsuranceKind,
  withSpouse: true,
  spouseTaxClass: '4',
  spouseTaxClassFactor: 1,
  spousePaysChurchTax: false,
  spouseHealthInsurance: 'statutoryMandatory' as InsuranceKind,
  spouseHealthInsuranceAdditionalRate: 2.18,
  spousePrivateHealthInsuranceAnnual: 0,
  spousePrivateCareInsuranceAnnual: 0,
  spousePensionInsurance: 'statutoryMandatory' as SocialInsuranceKind,
  spouseUnemploymentInsurance: 'statutoryMandatory' as SocialInsuranceKind,
  spouseAge: 42,
  hasNewJob: false,
  expectedMonthlySalaryMin: 5000,
  expectedMonthlySalaryMax: 8000,
  expectedMonthlySalaryStep: 500,
  newJobStartDate: null as Date | null,
  newJobMonthlySalary: 6000,
  severanceGross: 0,
  unemploymentDate: null as Date | null,
  oldEmployerIncomeCurrentYear: 0,
  unemploymentBenefitMonthly: 0,
  hasBenefitReductionPeriod: false,
  benefitReductionMonths: 1,
  hasBenefitSuspensionPeriod: false,
  benefitSuspensionMonths: 1,
  rentalIncomeYearly: 0,
  sharedIncomeUserShare: 50,
  donationYearly: 0,
  sharedDonationUserShare: 50,
  spouseGrossIncomeYearly: 0,
  otherIncomeYearly: 0
};

function resetToDefaults() {
  taxClass.value = DEFAULTS.taxClass;
  taxClassFactor.value = DEFAULTS.taxClassFactor;
  paysChurchTax.value = DEFAULTS.paysChurchTax;
  federalState.value = DEFAULTS.federalState;
  healthInsurance.value = DEFAULTS.healthInsurance;
  healthInsuranceAdditionalRate.value = DEFAULTS.healthInsuranceAdditionalRate;
  privateHealthInsuranceAnnual.value = DEFAULTS.privateHealthInsuranceAnnual;
  privateCareInsuranceAnnual.value = DEFAULTS.privateCareInsuranceAnnual;
  hasChildren.value = DEFAULTS.hasChildren;
  childrenUnder25.value = DEFAULTS.childrenUnder25;
  childAllowance.value = DEFAULTS.childAllowance;
  childBenefitMonthlyPerChild.value = DEFAULTS.childBenefitMonthlyPerChild;
  age.value = DEFAULTS.age;
  pensionInsurance.value = DEFAULTS.pensionInsurance;
  unemploymentInsurance.value = DEFAULTS.unemploymentInsurance;
  withSpouse.value = DEFAULTS.withSpouse;
  spouseTaxClass.value = DEFAULTS.spouseTaxClass;
  spouseTaxClassFactor.value = DEFAULTS.spouseTaxClassFactor;
  spousePaysChurchTax.value = DEFAULTS.spousePaysChurchTax;
  spouseHealthInsurance.value = DEFAULTS.spouseHealthInsurance;
  spouseHealthInsuranceAdditionalRate.value = DEFAULTS.spouseHealthInsuranceAdditionalRate;
  spousePrivateHealthInsuranceAnnual.value = DEFAULTS.spousePrivateHealthInsuranceAnnual;
  spousePrivateCareInsuranceAnnual.value = DEFAULTS.spousePrivateCareInsuranceAnnual;
  spousePensionInsurance.value = DEFAULTS.spousePensionInsurance;
  spouseUnemploymentInsurance.value = DEFAULTS.spouseUnemploymentInsurance;
  spouseAge.value = DEFAULTS.spouseAge;
  hasNewJob.value = DEFAULTS.hasNewJob;
  expectedMonthlySalaryMin.value = DEFAULTS.expectedMonthlySalaryMin;
  expectedMonthlySalaryMax.value = DEFAULTS.expectedMonthlySalaryMax;
  expectedMonthlySalaryStep.value = DEFAULTS.expectedMonthlySalaryStep;
  newJobStartDate.value = DEFAULTS.newJobStartDate;
  newJobMonthlySalary.value = DEFAULTS.newJobMonthlySalary;
  severanceGross.value = DEFAULTS.severanceGross;
  unemploymentDate.value = DEFAULTS.unemploymentDate ? new Date(DEFAULTS.unemploymentDate) : null;
  oldEmployerIncomeCurrentYear.value = DEFAULTS.oldEmployerIncomeCurrentYear;
  unemploymentBenefitMonthly.value = DEFAULTS.unemploymentBenefitMonthly;
  hasBenefitReductionPeriod.value = DEFAULTS.hasBenefitReductionPeriod;
  benefitReductionMonths.value = DEFAULTS.benefitReductionMonths;
  hasBenefitSuspensionPeriod.value = DEFAULTS.hasBenefitSuspensionPeriod;
  benefitSuspensionMonths.value = DEFAULTS.benefitSuspensionMonths;
  rentalIncomeYearly.value = DEFAULTS.rentalIncomeYearly;
  sharedIncomeUserShare.value = DEFAULTS.sharedIncomeUserShare;
  donationYearly.value = DEFAULTS.donationYearly;
  sharedDonationUserShare.value = DEFAULTS.sharedDonationUserShare;
  spouseGrossIncomeYearly.value = DEFAULTS.spouseGrossIncomeYearly;
  otherIncomeYearly.value = DEFAULTS.otherIncomeYearly;
  hasSubmitted.value = false;
  validationErrors.value = {};
}

function collectInputState(): UserInputSnapshot {
  return {
    taxClass: taxClass.value,
    taxClassFactor: taxClassFactor.value,
    paysChurchTax: paysChurchTax.value,
    federalState: federalState.value,
    healthInsurance: healthInsurance.value,
    healthInsuranceAdditionalRate: healthInsuranceAdditionalRate.value,
    privateHealthInsuranceAnnual: privateHealthInsuranceAnnual.value,
    privateCareInsuranceAnnual: privateCareInsuranceAnnual.value,
    hasChildren: hasChildren.value,
    childrenUnder25: childrenUnder25.value,
    childAllowance: childAllowance.value,
    childBenefitMonthlyPerChild: childBenefitMonthlyPerChild.value,
    age: age.value,
    pensionInsurance: pensionInsurance.value,
    unemploymentInsurance: unemploymentInsurance.value,
    withSpouse: withSpouse.value,
    spouseTaxClass: spouseTaxClass.value,
    spouseTaxClassFactor: spouseTaxClassFactor.value,
    spousePaysChurchTax: spousePaysChurchTax.value,
    spouseHealthInsurance: spouseHealthInsurance.value,
    spouseHealthInsuranceAdditionalRate: spouseHealthInsuranceAdditionalRate.value,
    spousePrivateHealthInsuranceAnnual: spousePrivateHealthInsuranceAnnual.value,
    spousePrivateCareInsuranceAnnual: spousePrivateCareInsuranceAnnual.value,
    spousePensionInsurance: spousePensionInsurance.value,
    spouseUnemploymentInsurance: spouseUnemploymentInsurance.value,
    spouseAge: spouseAge.value,
    hasNewJob: hasNewJob.value,
    expectedMonthlySalaryMin: expectedMonthlySalaryMin.value,
    expectedMonthlySalaryMax: expectedMonthlySalaryMax.value,
    expectedMonthlySalaryStep: expectedMonthlySalaryStep.value,
    newJobStartDate: newJobStartDate.value ? newJobStartDate.value.toISOString() : null,
    newJobMonthlySalary: newJobMonthlySalary.value,
    severanceGross: severanceGross.value,
    unemploymentDate: unemploymentDate.value ? unemploymentDate.value.toISOString() : null,
    oldEmployerIncomeCurrentYear: oldEmployerIncomeCurrentYear.value,
    unemploymentBenefitMonthly: unemploymentBenefitMonthly.value,
    hasBenefitReductionPeriod: hasBenefitReductionPeriod.value,
    benefitReductionMonths: benefitReductionMonths.value,
    hasBenefitSuspensionPeriod: hasBenefitSuspensionPeriod.value,
    benefitSuspensionMonths: benefitSuspensionMonths.value,
    rentalIncomeYearly: rentalIncomeYearly.value,
    sharedIncomeUserShare: sharedIncomeUserShare.value,
    donationYearly: donationYearly.value,
    sharedDonationUserShare: sharedDonationUserShare.value,
    spouseGrossIncomeYearly: spouseGrossIncomeYearly.value,
    otherIncomeYearly: otherIncomeYearly.value
  } as UserInputSnapshot;
}

function applyInputState(d: Record<string, unknown>) {
  const setIfDefined = <T,>(key: string, setter: (v: T) => void) => {
    if (d[key] !== undefined) setter(d[key] as T);
  };
  const setDateIfDefined = (key: string, setter: (v: Date | null) => void) => {
    if (d[key] === undefined) return;
    const raw = d[key];
    setter(typeof raw === 'string' ? new Date(raw) : null);
  };
  setIfDefined<string>('taxClass', (v) => (taxClass.value = v));
  setIfDefined<number>('taxClassFactor', (v) => (taxClassFactor.value = v));
  setIfDefined<boolean>('paysChurchTax', (v) => (paysChurchTax.value = v));
  setIfDefined<string | null>('federalState', (v) => (federalState.value = v));
  setIfDefined<InsuranceKind>('healthInsurance', (v) => (healthInsurance.value = v));
  setIfDefined<number>('healthInsuranceAdditionalRate', (v) => (healthInsuranceAdditionalRate.value = v));
  setIfDefined<number>('privateHealthInsuranceAnnual', (v) => (privateHealthInsuranceAnnual.value = v));
  setIfDefined<number>('privateCareInsuranceAnnual', (v) => (privateCareInsuranceAnnual.value = v));
  setIfDefined<boolean>('hasChildren', (v) => (hasChildren.value = v));
  setIfDefined<number>('childrenUnder25', (v) => (childrenUnder25.value = v));
  setIfDefined<number>('childAllowance', (v) => (childAllowance.value = v));
  setIfDefined<number>('childBenefitMonthlyPerChild', (v) => (childBenefitMonthlyPerChild.value = v));
  setIfDefined<number>('age', (v) => (age.value = v));
  setIfDefined<SocialInsuranceKind>('pensionInsurance', (v) => (pensionInsurance.value = v));
  setIfDefined<SocialInsuranceKind>('unemploymentInsurance', (v) => (unemploymentInsurance.value = v));
  setIfDefined<boolean>('withSpouse', (v) => (withSpouse.value = v));
  setIfDefined<string>('spouseTaxClass', (v) => (spouseTaxClass.value = v));
  setIfDefined<number>('spouseTaxClassFactor', (v) => (spouseTaxClassFactor.value = v));
  setIfDefined<boolean>('spousePaysChurchTax', (v) => (spousePaysChurchTax.value = v));
  setIfDefined<InsuranceKind>('spouseHealthInsurance', (v) => (spouseHealthInsurance.value = v));
  setIfDefined<number>('spouseHealthInsuranceAdditionalRate', (v) => (spouseHealthInsuranceAdditionalRate.value = v));
  setIfDefined<number>('spousePrivateHealthInsuranceAnnual', (v) => (spousePrivateHealthInsuranceAnnual.value = v));
  setIfDefined<number>('spousePrivateCareInsuranceAnnual', (v) => (spousePrivateCareInsuranceAnnual.value = v));
  setIfDefined<SocialInsuranceKind>('spousePensionInsurance', (v) => (spousePensionInsurance.value = v));
  setIfDefined<SocialInsuranceKind>('spouseUnemploymentInsurance', (v) => (spouseUnemploymentInsurance.value = v));
  setIfDefined<number>('spouseAge', (v) => (spouseAge.value = v));
  setIfDefined<boolean>('hasNewJob', (v) => (hasNewJob.value = v));
  setIfDefined<number>('expectedMonthlySalaryMin', (v) => (expectedMonthlySalaryMin.value = v));
  setIfDefined<number>('expectedMonthlySalaryMax', (v) => (expectedMonthlySalaryMax.value = v));
  setIfDefined<number>('expectedMonthlySalaryStep', (v) => (expectedMonthlySalaryStep.value = v));
  setDateIfDefined('newJobStartDate', (v) => (newJobStartDate.value = v));
  setIfDefined<number>('newJobMonthlySalary', (v) => (newJobMonthlySalary.value = v));
  setIfDefined<number>('severanceGross', (v) => (severanceGross.value = v));
  setDateIfDefined('unemploymentDate', (v) => (unemploymentDate.value = v));
  setIfDefined<number>('oldEmployerIncomeCurrentYear', (v) => (oldEmployerIncomeCurrentYear.value = v));
  setIfDefined<number>('unemploymentBenefitMonthly', (v) => (unemploymentBenefitMonthly.value = v));
  setIfDefined<boolean>('hasBenefitReductionPeriod', (v) => (hasBenefitReductionPeriod.value = v));
  setIfDefined<number>('benefitReductionMonths', (v) => (benefitReductionMonths.value = v));
  setIfDefined<boolean>('hasBenefitSuspensionPeriod', (v) => (hasBenefitSuspensionPeriod.value = v));
  setIfDefined<number>('benefitSuspensionMonths', (v) => (benefitSuspensionMonths.value = v));
  setIfDefined<number>('rentalIncomeYearly', (v) => (rentalIncomeYearly.value = v));
  setIfDefined<number>('sharedIncomeUserShare', (v) => (sharedIncomeUserShare.value = v));
  setIfDefined<number>('donationYearly', (v) => (donationYearly.value = v));
  setIfDefined<number>('sharedDonationUserShare', (v) => (sharedDonationUserShare.value = v));
  setIfDefined<number>('spouseGrossIncomeYearly', (v) => (spouseGrossIncomeYearly.value = v));
  setIfDefined<number>('otherIncomeYearly', (v) => (otherIncomeYearly.value = v));
}

function persistInputs(): void {
  commitUserInput(collectInputState());
}

function clearPersistedInputs(): void {
  clearUserInput();
}

function restorePersistedInputs(): void {
  if (committedInput.value) applyInputState(committedInput.value as unknown as Record<string, unknown>);
}

restorePersistedInputs();

const taxClassOptions = computed(() => [
  { label: 'I', value: '1' },
  { label: 'II', value: '2' },
  { label: 'III', value: '3' },
  { label: 'IV', value: '4' },
  { label: t('form.taxClassFactorLabel'), value: '4-factor' },
  { label: 'V', value: '5' },
  { label: 'VI', value: '6' }
]);

const federalStateOptions = computed(() => [
  { label: 'Baden-Wuerttemberg', value: 'BW' },
  { label: 'Bayern', value: 'BY' },
  { label: 'Berlin', value: 'BE' },
  { label: 'Brandenburg', value: 'BB' },
  { label: 'Bremen', value: 'HB' },
  { label: 'Hamburg', value: 'HH' },
  { label: 'Hessen', value: 'HE' },
  { label: 'Mecklenburg-Vorpommern', value: 'MV' },
  { label: 'Niedersachsen', value: 'NI' },
  { label: 'Nordrhein-Westfalen', value: 'NW' },
  { label: 'Rheinland-Pfalz', value: 'RP' },
  { label: 'Saarland', value: 'SL' },
  { label: 'Sachsen', value: 'SN' },
  { label: 'Sachsen-Anhalt', value: 'ST' },
  { label: 'Schleswig-Holstein', value: 'SH' },
  { label: 'Thueringen', value: 'TH' }
]);

const insuranceOptions = computed(() => [
  { label: t('form.insuranceStatutoryMandatory'), value: 'statutoryMandatory' },
  { label: t('form.insurancePrivate'), value: 'private' },
  { label: t('form.insuranceVoluntaryStatutory'), value: 'voluntaryStatutory' }
]);

const socialInsuranceOptions = computed(() => [
  { label: t('form.socialNotMandatory'), value: 'notMandatory' },
  { label: t('form.socialStatutoryMandatory'), value: 'statutoryMandatory' },
  { label: t('form.socialEmployerOnly'), value: 'employerOnly' },
  { label: t('form.socialEmployeeOnly'), value: 'employeeOnly' }
]);

const childrenUnder25Options = computed(() => Array.from({ length: 11 }, (_, i) => ({ label: String(i), value: i })));
const childAllowanceFormatter = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const childAllowanceOptions = computed(() =>
  Array.from({ length: 13 }, (_, i) => {
    const v = i * 0.5;
    return { label: childAllowanceFormatter.format(v), value: v };
  })
);
const ageOptions = computed(() => Array.from({ length: 60 }, (_, i) => ({ label: `${18 + i}`, value: 18 + i })));
const familyTypeOptions = computed(() => [
  { label: t('form.familyTypeSingle'), value: false },
  { label: t('form.familyTypeFamily'), value: true }
]);

const activeContentStyle = { background: 'var(--p-primary-color)', color: 'var(--p-primary-contrast-color, #fff)' };
const activeContrastTextStyle = { color: 'var(--p-primary-contrast-color, #fff)' };
const familyTypeSelectButtonPt = {
  pcToggleButton: {
    content: ({ context }: { context: { active: boolean } }) => ({ style: context.active ? activeContentStyle : undefined }),
    label: ({ context }: { context: { active: boolean } }) => ({ style: context.active ? activeContrastTextStyle : undefined })
  }
};

const sharedIncomeSpouseShare = computed(() => 100 - sharedIncomeUserShare.value);
const sharedDonationSpouseShare = computed(() => 100 - sharedDonationUserShare.value);
const newJobStartMinDate = computed(() => new Date());

const unemploymentBenefitDurationMonths = computed(() => {
  const a = age.value;
  if (a >= 58) return 24;
  if (a >= 55) return 18;
  if (a >= 50) return 15;
  return 12;
});

const taxClassInfoTooltip = computed(() => {
  const items = (tm('form.taxClassInfoClasses') as string[]).map((item) => `<li>${item}</li>`).join('');
  return `<p><strong>${t('form.taxClassInfoTitle')}</strong></p><p>${t('form.taxClassInfoIntro')}</p><ul>${items}</ul>`;
});

const careInsuranceInfoTooltip = computed(() => t('form.careInsuranceInfoTooltip'));
const healthInsuranceInfoTooltip = computed(() => t('form.healthInsuranceInfoTooltip'));
const healthInsuranceRateInfoTooltip = computed(() => t('form.healthInsuranceRateInfoTooltip'));
const privateInsuranceDeductibleTooltip = computed(() => t('form.privateInsuranceDeductibleTooltip'));
const childAllowanceInfoTooltip = computed(() => t('form.childAllowanceInfoTooltip'));
const childBenefitInfoTooltip = computed(() => t('form.childBenefitInfoTooltip'));
const pensionInsuranceInfoTooltip = computed(() => t('form.pensionInsuranceInfoTooltip'));
const unemploymentInsuranceInfoTooltip = computed(() => t('form.unemploymentInsuranceInfoTooltip'));
const unemploymentBenefitDurationTooltip = computed(() => t('form.unemploymentBenefitDurationTooltip'));
const possibleSeverancePaymentDatesTooltip = computed(() => t('form.possibleSeverancePaymentDatesTooltip'));
const oldEmployerIncomeCurrentYearTooltip = computed(() => t('form.oldEmployerIncomeCurrentYearTooltip'));
const donationSectionTooltip = computed(() => t('form.donationSectionTooltip'));
const salaryRangeSectionTooltip = computed(() => t('form.salaryRangeSectionTooltip'));
const unemploymentBenefitMonthlyTooltip = computed(() => t('form.unemploymentBenefitMonthlyTooltip'));
const benefitReductionPeriodTooltip = computed(() => t('form.benefitReductionPeriodTooltip'));
const benefitSuspensionPeriodTooltip = computed(() => t('form.benefitSuspensionPeriodTooltip'));
const taxClassFactorTooltip = computed(() => t('form.taxClassFactorTooltip'));
const rentalIncomeYearlyTooltip = computed(() => t('form.rentalIncomeYearlyTooltip'));

type FormValues = Record<string, unknown>;
type FormErrorMap = Record<string, { message: string }[]>;

function resolver({ values }: { values: FormValues }): { errors: FormErrorMap } {
  const errors: FormErrorMap = {};
  const requireField = (name: string) => {
    const v = values[name];
    if (v === undefined || v === null || v === '') errors[name] = [{ message: t('form.requiredField') }];
  };
  requireField('federalState');
  requireField('severanceGross');

  const localErrors: Record<string, string> = {};
  if (typeof severanceGross.value !== 'number' || severanceGross.value < 0) {
    localErrors.severanceGross = t('form.requiredField');
  }
  if (!unemploymentDate.value) {
    localErrors.unemploymentDate = t('form.requiredField');
  }
  if (hasNewJob.value && newJobStartDate.value && unemploymentDate.value && newJobStartDate.value < unemploymentDate.value) {
    localErrors.newJobStartDate = t('validation.newJobBeforeUnemployment');
  }
  if (hasBenefitReductionPeriod.value && benefitReductionMonths.value > unemploymentBenefitDurationMonths.value) {
    localErrors.benefitReductionMonths = t('validation.benefitReductionExceedsDuration', {
      months: benefitReductionMonths.value,
      duration: unemploymentBenefitDurationMonths.value
    });
  }

  validationErrors.value = localErrors;
  for (const [name, message] of Object.entries(localErrors)) {
    errors[name] = [{ message }];
  }
  return { errors };
}

const initialValues = computed<FormValues>(() => ({
  federalState: federalState.value,
  severanceGross: severanceGross.value
}));

function markFormAsSubmitted() {
  hasSubmitted.value = true;
}

function onFormSubmit(event: { valid: boolean; values: FormValues }) {
  hasSubmitted.value = true;
  if (!event.valid) return;
  if (Object.keys(validationErrors.value).length > 0) return;
  persistInputs();
  toast.add({
    severity: 'success',
    summary: t('form.savedToastSummary'),
    detail: t('form.savedToastDetail'),
    life: 6000
  });
  emit('saved');
}

function handleReset() {
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  clearPersistedInputs();
  resetToDefaults();
  toast.add({
    severity: 'info',
    summary: t('form.resetToastSummary'),
    detail: t('form.resetToastDetail'),
    life: 4000
  });
}
</script>

<template>
  <Toast position="top-center" />
  <Form v-slot="$form" :initial-values="initialValues" :resolver="resolver" class="flex flex-col gap-6" @submit="onFormSubmit">
    <SelectButton
      v-model="withSpouse"
      :options="familyTypeOptions"
      option-label="label"
      option-value="value"
      :allow-empty="false"
      size="small"
      :pt="familyTypeSelectButtonPt"
      :aria-label="t('form.familyType')"
    />

    <Accordion value="basicData">
      <AccordionPanel value="basicData" class="border border-surface-200 dark:border-surface-700 rounded-md overflow-hidden mb-2">
        <AccordionHeader class="bg-surface-50 dark:bg-surface-900! py-1.5!">
          <span class="font-semibold">{{ t('workspace.sections.basic') }}</span>
        </AccordionHeader>
        <AccordionContent>
          <div class="flex flex-col gap-5 pt-4">
            <div class="flex flex-col gap-2">
              <div class="flex items-center gap-2">
                <label for="taxClass">{{ t('form.taxClassOwn') }}</label>
                <button
                  v-tooltip.right="{ value: taxClassInfoTooltip, escape: false, class: 'tax-class-tooltip', showDelay: 150 }"
                  type="button"
                  class="pi pi-info-circle cursor-help border-0 bg-transparent p-0 text-primary-600"
                  :aria-label="t('form.taxClassInfoAriaLabel')"
                ></button>
              </div>
              <Select v-model="taxClass" input-id="taxClass" :options="taxClassOptions" option-label="label" option-value="value" size="small" fluid />
            </div>

            <div v-if="taxClass === '4-factor'" class="flex flex-col gap-2">
              <div class="flex items-center gap-2">
                <label for="taxClassFactor">{{ t('form.taxClassFactor') }}</label>
                <button
                  v-tooltip.right="{ value: taxClassFactorTooltip, escape: false, class: 'tax-class-tooltip', showDelay: 150 }"
                  type="button"
                  class="pi pi-info-circle cursor-help border-0 bg-transparent p-0 text-primary-600"
                  :aria-label="t('form.taxClassFactorAriaLabel')"
                ></button>
              </div>
              <InputNumber v-model="taxClassFactor" input-id="taxClassFactor" :min="0.001" :max="0.999" :step="0.001" :min-fraction-digits="3" :max-fraction-digits="3" locale="de-DE" size="small" show-buttons fluid />
            </div>

            <fieldset class="m-0 flex flex-col gap-2 border-0 p-0">
              <legend>{{ t('form.churchTax') }}</legend>
              <div class="flex min-h-9 items-center gap-5">
                <div class="flex items-center gap-2">
                  <RadioButton v-model="paysChurchTax" input-id="paysChurchTaxYes" name="paysChurchTax" :value="true" size="small" />
                  <label class="text-surface-800" for="paysChurchTaxYes">{{ t('form.yes') }}</label>
                </div>
                <div class="flex items-center gap-2">
                  <RadioButton v-model="paysChurchTax" input-id="paysChurchTaxNo" name="paysChurchTax" :value="false" size="small" />
                  <label class="text-surface-800" for="paysChurchTaxNo">{{ t('form.no') }}</label>
                </div>
              </div>
            </fieldset>

            <div class="flex flex-col gap-2">
              <label for="federalState">{{ t('form.federalState') }} <span class="text-primary-600" aria-hidden="true">*</span></label>
              <Select v-model="federalState" input-id="federalState" name="federalState" :options="federalStateOptions" option-label="label" option-value="value" :placeholder="t('form.federalStatePlaceholder')" size="small" fluid />
              <Message v-if="hasSubmitted && $form.federalState?.invalid" severity="error" size="small" variant="simple">
                {{ $form.federalState.error?.message }}
              </Message>
              <Message v-else-if="validationErrors.federalState" severity="error" size="small" variant="simple">
                {{ validationErrors.federalState }}
              </Message>
            </div>

            <div class="flex flex-col gap-2">
              <div class="flex items-center gap-2">
                <label for="healthInsurance">{{ t('form.healthInsurance') }}</label>
                <button
                  v-tooltip.right="{ value: healthInsuranceInfoTooltip, escape: false, class: 'tax-class-tooltip', showDelay: 150 }"
                  type="button"
                  class="pi pi-info-circle cursor-help border-0 bg-transparent p-0 text-primary-600"
                  :aria-label="t('form.healthInsuranceInfoAriaLabel')"
                ></button>
              </div>
              <Select v-model="healthInsurance" input-id="healthInsurance" :options="insuranceOptions" option-label="label" option-value="value" size="small" fluid />
            </div>

            <div v-if="healthInsurance !== 'private'" class="flex flex-col gap-2">
              <div class="flex items-center gap-2">
                <label for="healthInsuranceAdditionalRate">{{ t('form.healthInsuranceRate') }}</label>
                <button
                  v-tooltip.right="{ value: healthInsuranceRateInfoTooltip, escape: false, class: 'tax-class-tooltip', showDelay: 150 }"
                  type="button"
                  class="pi pi-info-circle cursor-help border-0 bg-transparent p-0 text-primary-600"
                  :aria-label="t('form.healthInsuranceRateInfoAriaLabel')"
                ></button>
              </div>
              <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                <InputNumber :model-value="14.6" :min-fraction-digits="1" :max-fraction-digits="1" suffix=" %" size="small" disabled fluid :aria-label="t('form.baseHealthInsuranceRate')" />
                <span class="font-semibold text-surface-500">+</span>
                <InputNumber v-model="healthInsuranceAdditionalRate" input-id="healthInsuranceAdditionalRate" :min="0" :max="10" :step="0.01" :min-fraction-digits="2" :max-fraction-digits="3" suffix=" %" show-buttons size="small" fluid />
              </div>
            </div>
            <template v-else>
              <div class="flex flex-col gap-2">
                <div class="flex items-center gap-2">
                  <label for="privateHealthInsuranceAnnual">{{ t('form.privateHealthInsuranceAnnual') }}</label>
                  <button
                    v-tooltip.right="{ value: privateInsuranceDeductibleTooltip, escape: false, class: 'tax-class-tooltip', showDelay: 150 }"
                    type="button"
                    class="pi pi-info-circle cursor-help border-0 bg-transparent p-0 text-primary-600"
                    :aria-label="t('form.privateInsuranceDeductibleAriaLabel')"
                  ></button>
                </div>
                <InputNumber v-model="privateHealthInsuranceAnnual" input-id="privateHealthInsuranceAnnual" :min="0" :step="500" mode="currency" currency="EUR" locale="de-DE" size="small" show-buttons fluid />
              </div>
              <div class="flex flex-col gap-2">
                <div class="flex items-center gap-2">
                  <label for="privateCareInsuranceAnnual">{{ t('form.privateCareInsuranceAnnual') }}</label>
                  <button
                    v-tooltip.right="{ value: privateInsuranceDeductibleTooltip, escape: false, class: 'tax-class-tooltip', showDelay: 150 }"
                    type="button"
                    class="pi pi-info-circle cursor-help border-0 bg-transparent p-0 text-primary-600"
                    :aria-label="t('form.privateInsuranceDeductibleAriaLabel')"
                  ></button>
                </div>
                <InputNumber v-model="privateCareInsuranceAnnual" input-id="privateCareInsuranceAnnual" :min="0" :step="100" mode="currency" currency="EUR" locale="de-DE" size="small" show-buttons fluid />
              </div>
            </template>

            <fieldset class="m-0 flex flex-col gap-2 border-0 p-0">
              <legend class="flex items-center gap-2">
                <span>{{ t('form.hasChildren') }}</span>
                <button
                  v-tooltip.right="{ value: careInsuranceInfoTooltip, escape: false, class: 'tax-class-tooltip', showDelay: 150 }"
                  type="button"
                  class="pi pi-info-circle cursor-help border-0 bg-transparent p-0 text-primary-600"
                  :aria-label="t('form.careInsuranceInfoAriaLabel')"
                ></button>
              </legend>
              <div class="flex min-h-9 items-center gap-5">
                <div class="flex items-center gap-2">
                  <RadioButton v-model="hasChildren" input-id="hasChildrenYes" name="hasChildren" :value="true" size="small" />
                  <label class="text-surface-800" for="hasChildrenYes">{{ t('form.yes') }}</label>
                </div>
                <div class="flex items-center gap-2">
                  <RadioButton v-model="hasChildren" input-id="hasChildrenNo" name="hasChildren" :value="false" size="small" />
                  <label class="text-surface-800" for="hasChildrenNo">{{ t('form.no') }}</label>
                </div>
              </div>
            </fieldset>

            <div v-if="hasChildren" class="flex flex-col gap-2">
              <label for="childrenUnder25">{{ t('form.childrenUnder25') }}</label>
              <Select v-model="childrenUnder25" input-id="childrenUnder25" :options="childrenUnder25Options" option-label="label" option-value="value" size="small" fluid />
            </div>

            <div v-if="hasChildren" class="flex flex-col gap-2">
              <div class="flex items-center gap-2">
                <label for="childAllowance">{{ t('form.childAllowance') }}</label>
                <button
                  v-tooltip.right="{ value: childAllowanceInfoTooltip, escape: false, class: 'tax-class-tooltip', showDelay: 150 }"
                  type="button"
                  class="pi pi-info-circle cursor-help border-0 bg-transparent p-0 text-primary-600"
                  :aria-label="t('form.childAllowanceInfoAriaLabel')"
                ></button>
              </div>
              <Select v-model="childAllowance" input-id="childAllowance" :options="childAllowanceOptions" option-label="label" option-value="value" size="small" fluid />
            </div>

            <div v-if="hasChildren" class="flex flex-col gap-2">
              <div class="flex items-center gap-2">
                <label for="childBenefitMonthlyPerChild">{{ t('form.childBenefitMonthlyPerChild') }}</label>
                <button
                  v-tooltip.right="{ value: childBenefitInfoTooltip, escape: false, class: 'tax-class-tooltip', showDelay: 150 }"
                  type="button"
                  class="pi pi-info-circle cursor-help border-0 bg-transparent p-0 text-primary-600"
                  :aria-label="t('form.childBenefitInfoAriaLabel')"
                ></button>
              </div>
              <InputNumber v-model="childBenefitMonthlyPerChild" input-id="childBenefitMonthlyPerChild" :min="0" :step="1" :min-fraction-digits="0" :max-fraction-digits="0" mode="currency" currency="EUR" locale="de-DE" size="small" show-buttons fluid />
            </div>

            <div class="flex flex-col gap-2">
              <label for="age">{{ t('form.age') }}</label>
              <Select v-model="age" input-id="age" :options="ageOptions" option-label="label" option-value="value" size="small" fluid />
            </div>

            <div class="flex flex-col gap-2">
              <div class="flex items-center gap-2">
                <label for="pensionInsurance">{{ t('form.pensionInsurance') }}</label>
                <button
                  v-tooltip.right="{ value: pensionInsuranceInfoTooltip, escape: false, class: 'tax-class-tooltip', showDelay: 150 }"
                  type="button"
                  class="pi pi-info-circle cursor-help border-0 bg-transparent p-0 text-primary-600"
                  :aria-label="t('form.pensionInsuranceInfoAriaLabel')"
                ></button>
              </div>
              <Select v-model="pensionInsurance" input-id="pensionInsurance" :options="socialInsuranceOptions" option-label="label" option-value="value" size="small" fluid />
            </div>

            <div class="flex flex-col gap-2">
              <div class="flex items-center gap-2">
                <label for="unemploymentInsurance">{{ t('form.unemploymentInsurance') }}</label>
                <button
                  v-tooltip.right="{ value: unemploymentInsuranceInfoTooltip, escape: false, class: 'tax-class-tooltip', showDelay: 150 }"
                  type="button"
                  class="pi pi-info-circle cursor-help border-0 bg-transparent p-0 text-primary-600"
                  :aria-label="t('form.unemploymentInsuranceInfoAriaLabel')"
                ></button>
              </div>
              <Select v-model="unemploymentInsurance" input-id="unemploymentInsurance" :options="socialInsuranceOptions" option-label="label" option-value="value" size="small" fluid />
            </div>

            <section v-if="withSpouse" class="rounded border border-surface-200 bg-surface-50 p-4">
              <h2 class="mb-4 text-base font-semibold text-surface-900">{{ t('form.spouseSection') }}</h2>
              <div class="flex flex-col gap-4">
                <div class="flex flex-col gap-2">
                  <label for="spouseTaxClass">{{ t('form.taxClassOwn') }}</label>
                  <Select v-model="spouseTaxClass" input-id="spouseTaxClass" :options="taxClassOptions" option-label="label" option-value="value" size="small" fluid />
                </div>
                <div v-if="spouseTaxClass === '4-factor'" class="flex flex-col gap-2">
                  <label for="spouseTaxClassFactor">{{ t('form.taxClassFactor') }}</label>
                  <InputNumber v-model="spouseTaxClassFactor" input-id="spouseTaxClassFactor" :min="0.001" :max="0.999" :step="0.001" :min-fraction-digits="3" :max-fraction-digits="3" locale="de-DE" size="small" show-buttons fluid />
                </div>
                <fieldset class="m-0 flex flex-col gap-2 border-0 p-0">
                  <legend>{{ t('form.churchTax') }}</legend>
                  <div class="flex min-h-9 items-center gap-5">
                    <div class="flex items-center gap-2">
                      <RadioButton v-model="spousePaysChurchTax" input-id="spousePaysChurchTaxYes" name="spousePaysChurchTax" :value="true" size="small" />
                      <label class="text-surface-800" for="spousePaysChurchTaxYes">{{ t('form.yes') }}</label>
                    </div>
                    <div class="flex items-center gap-2">
                      <RadioButton v-model="spousePaysChurchTax" input-id="spousePaysChurchTaxNo" name="spousePaysChurchTax" :value="false" size="small" />
                      <label class="text-surface-800" for="spousePaysChurchTaxNo">{{ t('form.no') }}</label>
                    </div>
                  </div>
                </fieldset>
                <div class="flex flex-col gap-2">
                  <label for="spouseHealthInsurance">{{ t('form.healthInsurance') }}</label>
                  <Select v-model="spouseHealthInsurance" input-id="spouseHealthInsurance" :options="insuranceOptions" option-label="label" option-value="value" size="small" fluid />
                </div>
                <div v-if="spouseHealthInsurance !== 'private'" class="flex flex-col gap-2">
                  <label for="spouseHealthInsuranceAdditionalRate">{{ t('form.healthInsuranceRate') }}</label>
                  <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                    <InputNumber :model-value="14.6" :min-fraction-digits="1" :max-fraction-digits="1" suffix=" %" size="small" disabled fluid :aria-label="t('form.baseHealthInsuranceRate')" />
                    <span class="font-semibold text-surface-500">+</span>
                    <InputNumber v-model="spouseHealthInsuranceAdditionalRate" input-id="spouseHealthInsuranceAdditionalRate" :min="0" :max="10" :step="0.01" :min-fraction-digits="2" :max-fraction-digits="3" suffix=" %" show-buttons size="small" fluid />
                  </div>
                </div>
                <template v-else>
                  <div class="flex flex-col gap-2">
                    <label for="spousePrivateHealthInsuranceAnnual">{{ t('form.privateHealthInsuranceAnnual') }}</label>
                    <InputNumber v-model="spousePrivateHealthInsuranceAnnual" input-id="spousePrivateHealthInsuranceAnnual" :min="0" :step="500" mode="currency" currency="EUR" locale="de-DE" size="small" show-buttons fluid />
                  </div>
                  <div class="flex flex-col gap-2">
                    <label for="spousePrivateCareInsuranceAnnual">{{ t('form.privateCareInsuranceAnnual') }}</label>
                    <InputNumber v-model="spousePrivateCareInsuranceAnnual" input-id="spousePrivateCareInsuranceAnnual" :min="0" :step="100" mode="currency" currency="EUR" locale="de-DE" size="small" show-buttons fluid />
                  </div>
                </template>
                <div class="flex flex-col gap-2">
                  <label for="spousePensionInsurance">{{ t('form.pensionInsurance') }}</label>
                  <Select v-model="spousePensionInsurance" input-id="spousePensionInsurance" :options="socialInsuranceOptions" option-label="label" option-value="value" size="small" fluid />
                </div>
                <div class="flex flex-col gap-2">
                  <label for="spouseUnemploymentInsurance">{{ t('form.unemploymentInsurance') }}</label>
                  <Select v-model="spouseUnemploymentInsurance" input-id="spouseUnemploymentInsurance" :options="socialInsuranceOptions" option-label="label" option-value="value" size="small" fluid />
                </div>
                <div class="flex flex-col gap-2">
                  <label for="spouseAge">{{ t('form.age') }}</label>
                  <Select v-model="spouseAge" input-id="spouseAge" :options="ageOptions" option-label="label" option-value="value" size="small" fluid />
                </div>
              </div>
            </section>
          </div>
        </AccordionContent>
      </AccordionPanel>

      <AccordionPanel value="income" class="border border-surface-200 dark:border-surface-700 rounded-md overflow-hidden mb-2">
        <AccordionHeader class="bg-surface-50! dark:bg-surface-900! py-1.5!">
          <span class="font-semibold">{{ t('workspace.sections.income') }}</span>
        </AccordionHeader>
        <AccordionContent>
          <div class="flex flex-col gap-5 pt-4">
            <div class="flex items-center justify-between gap-4">
              <div class="flex items-center gap-2">
                <label for="hasNewJob">{{ t('form.hasNewJob') }}</label>
                <button
                  v-tooltip.right="{ value: t('form.hasNewJobTooltip'), escape: false, class: 'tax-class-tooltip', showDelay: 150 }"
                  type="button"
                  class="pi pi-info-circle cursor-help border-0 bg-transparent p-0 text-primary-600"
                  :aria-label="t('form.hasNewJobAriaLabel')"
                ></button>
              </div>
              <ToggleSwitch v-model="hasNewJob" input-id="hasNewJob" />
            </div>

            <section v-if="!hasNewJob" class="rounded border border-surface-200 bg-surface-50 p-4">
              <div class="mb-4 flex items-center gap-2">
                <h2 class="text-base font-semibold text-surface-900">{{ t('form.salaryRangeSection') }}</h2>
                <button
                  v-tooltip.right="{ value: salaryRangeSectionTooltip, escape: false, class: 'tax-class-tooltip', showDelay: 150 }"
                  type="button"
                  class="pi pi-info-circle cursor-help border-0 bg-transparent p-0 text-primary-600"
                  :aria-label="t('form.salaryRangeSectionAriaLabel')"
                ></button>
              </div>
              <div class="flex flex-col gap-4">
                <div class="flex flex-col gap-2">
                  <label for="expectedMonthlySalaryMin">{{ t('form.expectedMonthlySalaryMin') }} <span class="text-primary-600" aria-hidden="true">*</span></label>
                  <InputNumber v-model="expectedMonthlySalaryMin" input-id="expectedMonthlySalaryMin" :min="2000" :step="100" :min-fraction-digits="0" :max-fraction-digits="0" mode="currency" currency="EUR" locale="de-DE" size="small" show-buttons fluid />
                  <Message v-if="validationErrors.expectedMonthlySalaryMin" severity="error" size="small" variant="simple">{{ validationErrors.expectedMonthlySalaryMin }}</Message>
                </div>
                <div class="flex flex-col gap-2">
                  <label for="expectedMonthlySalaryMax">{{ t('form.expectedMonthlySalaryMax') }} <span class="text-primary-600" aria-hidden="true">*</span></label>
                  <InputNumber v-model="expectedMonthlySalaryMax" input-id="expectedMonthlySalaryMax" :min="expectedMonthlySalaryMaxMin" :step="100" :min-fraction-digits="0" :max-fraction-digits="0" mode="currency" currency="EUR" locale="de-DE" size="small" show-buttons fluid />
                  <Message v-if="validationErrors.expectedMonthlySalaryMax" severity="error" size="small" variant="simple">{{ validationErrors.expectedMonthlySalaryMax }}</Message>
                </div>
                <div class="flex flex-col gap-2">
                  <label for="expectedMonthlySalaryStep">{{ t('form.expectedMonthlySalaryStep') }} <span class="text-primary-600" aria-hidden="true">*</span></label>
                  <InputNumber v-model="expectedMonthlySalaryStep" input-id="expectedMonthlySalaryStep" :min="expectedMonthlySalaryStepMin" :max="expectedMonthlySalaryStepMax" :step="100" :min-fraction-digits="0" :max-fraction-digits="0" mode="currency" currency="EUR" locale="de-DE" size="small" show-buttons fluid />
                  <Message v-if="validationErrors.expectedMonthlySalaryStep" severity="error" size="small" variant="simple">{{ validationErrors.expectedMonthlySalaryStep }}</Message>
                </div>
              </div>
            </section>

            <template v-if="hasNewJob">
              <div class="flex flex-col gap-2">
                <label for="newJobStartDate">{{ t('form.newJobStartDate') }} <span class="text-primary-600" aria-hidden="true">*</span></label>
                <DatePicker v-model="newJobStartDate" input-id="newJobStartDate" :min-date="newJobStartMinDate" date-format="dd.mm.yy" size="small" show-icon fluid />
                <Message v-if="validationErrors.newJobStartDate" severity="error" size="small" variant="simple">{{ validationErrors.newJobStartDate }}</Message>
              </div>
              <div class="flex flex-col gap-2">
                <label for="newJobMonthlySalary">{{ t('form.newJobMonthlySalary') }} <span class="text-primary-600" aria-hidden="true">*</span></label>
                <InputNumber v-model="newJobMonthlySalary" input-id="newJobMonthlySalary" :min="0" :step="500" mode="currency" currency="EUR" locale="de-DE" size="small" show-buttons fluid />
                <Message v-if="validationErrors.newJobMonthlySalary" severity="error" size="small" variant="simple">{{ validationErrors.newJobMonthlySalary }}</Message>
              </div>
            </template>

            <section class="rounded border border-surface-200 bg-surface-50 p-4">
              <h2 class="mb-4 text-base font-semibold text-surface-900">{{ t('form.unemploymentSection') }}</h2>
              <div class="flex flex-col gap-4">
                <div class="flex flex-col gap-2">
                  <label for="severanceGross">{{ t('form.abfindungGross') }} <span class="text-primary-600" aria-hidden="true">*</span></label>
                  <InputNumber v-model="severanceGross" input-id="severanceGross" name="severanceGross" :min="0" :step="1000" mode="currency" currency="EUR" locale="de-DE" size="small" show-buttons fluid />
                  <Message v-if="hasSubmitted && $form.severanceGross?.invalid" severity="error" size="small" variant="simple">{{ $form.severanceGross.error?.message }}</Message>
                  <Message v-else-if="validationErrors.severanceGross" severity="error" size="small" variant="simple">{{ validationErrors.severanceGross }}</Message>
                </div>
                <div class="flex flex-col gap-2">
                  <label for="unemploymentDate">{{ t('form.unemploymentDate') }} <span class="text-primary-600" aria-hidden="true">*</span></label>
                  <DatePicker v-model="unemploymentDate" input-id="unemploymentDate" date-format="dd.mm.yy" size="small" show-icon fluid />
                  <Message v-if="validationErrors.unemploymentDate" severity="error" size="small" variant="simple">{{ validationErrors.unemploymentDate }}</Message>
                </div>
                <div class="flex flex-col gap-2">
                  <div class="flex items-center gap-2">
                    <span class="text-sm text-surface-700">{{ t('form.possibleSeverancePaymentDates') }}</span>
                    <button
                      v-tooltip.right="{ value: possibleSeverancePaymentDatesTooltip, escape: false, class: 'tax-class-tooltip', showDelay: 150 }"
                      type="button"
                      class="pi pi-info-circle cursor-help border-0 bg-transparent p-0 text-primary-600"
                      :aria-label="t('form.possibleSeverancePaymentDatesAriaLabel')"
                    ></button>
                  </div>
                  <div class="grid grid-cols-2 gap-2">
                    <DatePicker :model-value="possibleSeverancePaymentDateSameYear" date-format="dd.mm.yy" size="small" show-icon disabled fluid />
                    <DatePicker :model-value="possibleSeverancePaymentDateNextYear" date-format="dd.mm.yy" size="small" show-icon disabled fluid />
                  </div>
                </div>
                <div class="flex flex-col gap-2">
                  <div class="flex items-center gap-2">
                    <label for="oldEmployerIncomeCurrentYear">{{ t('form.oldEmployerIncomeCurrentYear') }}</label>
                    <button
                      v-tooltip.right="{ value: oldEmployerIncomeCurrentYearTooltip, escape: false, class: 'tax-class-tooltip', showDelay: 150 }"
                      type="button"
                      class="pi pi-info-circle cursor-help border-0 bg-transparent p-0 text-primary-600"
                      :aria-label="t('form.oldEmployerIncomeCurrentYearAriaLabel')"
                    ></button>
                  </div>
                  <InputNumber v-model="oldEmployerIncomeCurrentYear" input-id="oldEmployerIncomeCurrentYear" :min="0" :step="1000" mode="currency" currency="EUR" locale="de-DE" size="small" show-buttons fluid />
                </div>
                <div class="flex flex-col gap-2">
                  <div class="flex items-center gap-2">
                    <label for="unemploymentBenefitMonthly">{{ t('form.unemploymentBenefitMonthly') }}</label>
                    <button
                      v-tooltip.right="{ value: unemploymentBenefitMonthlyTooltip, escape: false, class: 'tax-class-tooltip', showDelay: 150 }"
                      type="button"
                      class="pi pi-info-circle cursor-help border-0 bg-transparent p-0 text-primary-600"
                      :aria-label="t('form.unemploymentBenefitMonthlyAriaLabel')"
                    ></button>
                  </div>
                  <InputNumber v-model="unemploymentBenefitMonthly" input-id="unemploymentBenefitMonthly" :min="0" :step="100" mode="currency" currency="EUR" locale="de-DE" size="small" show-buttons fluid />
                </div>
                <div class="flex flex-col gap-2">
                  <div class="flex items-center justify-between gap-4">
                    <div class="flex items-center gap-2">
                      <label for="hasBenefitReductionPeriod">{{ t('form.hasBenefitReductionPeriod') }}</label>
                      <button
                        v-tooltip.right="{ value: benefitReductionPeriodTooltip, escape: false, class: 'tax-class-tooltip', showDelay: 150 }"
                        type="button"
                        class="pi pi-info-circle cursor-help border-0 bg-transparent p-0 text-primary-600"
                        :aria-label="t('form.hasBenefitReductionPeriod')"
                      ></button>
                    </div>
                    <ToggleSwitch v-model="hasBenefitReductionPeriod" input-id="hasBenefitReductionPeriod" />
                  </div>
                  <div v-if="hasBenefitReductionPeriod" class="flex flex-col gap-2">
                    <label for="benefitReductionMonths">{{ t('form.benefitReductionMonths') }} <span class="text-primary-600" aria-hidden="true">*</span></label>
                    <InputNumber v-model="benefitReductionMonths" input-id="benefitReductionMonths" :min="1" :max="3" :step="1" :min-fraction-digits="0" :max-fraction-digits="0" :suffix="t('form.monthsSuffix')" size="small" show-buttons fluid />
                    <Message v-if="validationErrors.benefitReductionMonths" severity="error" size="small" variant="simple">{{ validationErrors.benefitReductionMonths }}</Message>
                  </div>
                </div>
                <div class="flex flex-col gap-2">
                  <div class="flex items-center justify-between gap-4">
                    <div class="flex items-center gap-2">
                      <label for="hasBenefitSuspensionPeriod">{{ t('form.hasBenefitSuspensionPeriod') }}</label>
                      <button
                        v-tooltip.right="{ value: benefitSuspensionPeriodTooltip, escape: false, class: 'tax-class-tooltip', showDelay: 150 }"
                        type="button"
                        class="pi pi-info-circle cursor-help border-0 bg-transparent p-0 text-primary-600"
                        :aria-label="t('form.hasBenefitSuspensionPeriod')"
                      ></button>
                    </div>
                    <ToggleSwitch v-model="hasBenefitSuspensionPeriod" input-id="hasBenefitSuspensionPeriod" />
                  </div>
                  <div v-if="hasBenefitSuspensionPeriod" class="flex flex-col gap-2">
                    <label for="benefitSuspensionMonths">{{ t('form.benefitSuspensionMonths') }} <span class="text-primary-600" aria-hidden="true">*</span></label>
                    <InputNumber v-model="benefitSuspensionMonths" input-id="benefitSuspensionMonths" :min="1" :max="12" :step="1" :min-fraction-digits="0" :max-fraction-digits="0" :suffix="t('form.monthsSuffix')" size="small" show-buttons fluid />
                    <Message v-if="validationErrors.benefitSuspensionMonths" severity="error" size="small" variant="simple">{{ validationErrors.benefitSuspensionMonths }}</Message>
                  </div>
                </div>
              </div>
            </section>

            <section class="rounded border border-surface-200 bg-surface-50 p-4">
              <div class="mb-4 flex items-center gap-2">
                <h2 class="text-base font-semibold text-surface-900">{{ t('form.rentalIncomeSection') }}</h2>
              </div>
              <div class="flex flex-col gap-4">
                <div class="flex flex-col gap-2">
                  <div class="flex items-center gap-2">
                    <label for="rentalIncomeYearly">{{ t('form.rentalIncomeYearly') }}</label>
                    <button
                      v-tooltip.right="{ value: rentalIncomeYearlyTooltip, escape: false, class: 'tax-class-tooltip', showDelay: 150 }"
                      type="button"
                      class="pi pi-info-circle cursor-help border-0 bg-transparent p-0 text-primary-600"
                      :aria-label="t('form.rentalIncomeYearlyAriaLabel')"
                    ></button>
                  </div>
                  <InputNumber v-model="rentalIncomeYearly" input-id="rentalIncomeYearly" :min="0" :step="1000" mode="currency" currency="EUR" locale="de-DE" size="small" show-buttons fluid />
                </div>
                <div v-if="withSpouse" class="flex flex-col gap-2">
                  <label for="sharedIncomeUserShare">{{ t('form.sharedIncomeUserShare') }}</label>
                  <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                    <InputNumber v-model="sharedIncomeUserShare" input-id="sharedIncomeUserShare" :min="0" :max="100" :step="1" :min-fraction-digits="0" :max-fraction-digits="0" suffix=" %" size="small" show-buttons fluid />
                    <span class="font-semibold text-surface-500">/</span>
                    <InputNumber :model-value="sharedIncomeSpouseShare" :min-fraction-digits="0" :max-fraction-digits="0" suffix=" %" size="small" disabled fluid :aria-label="t('form.sharedIncomeSpouseShare')" />
                  </div>
                  <Message v-if="validationErrors.sharedIncomeUserShare" severity="error" size="small" variant="simple">{{ validationErrors.sharedIncomeUserShare }}</Message>
                </div>
              </div>
            </section>

            <section class="rounded border border-surface-200 bg-surface-50 p-4">
              <div class="mb-4 flex items-center gap-2">
                <h2 class="text-base font-semibold text-surface-900">{{ t('form.donationSection') }}</h2>
                <button
                  v-tooltip.right="{ value: donationSectionTooltip, escape: false, class: 'tax-class-tooltip', showDelay: 150 }"
                  type="button"
                  class="pi pi-info-circle cursor-help border-0 bg-transparent p-0 text-primary-600"
                  :aria-label="t('form.donationSectionAriaLabel')"
                ></button>
              </div>
              <div class="flex flex-col gap-4">
                <div class="flex flex-col gap-2">
                  <label for="donationYearly">{{ t('form.donationYearly') }}</label>
                  <InputNumber v-model="donationYearly" input-id="donationYearly" :min="0" :step="100" mode="currency" currency="EUR" locale="de-DE" size="small" show-buttons fluid />
                </div>
                <div v-if="withSpouse" class="flex flex-col gap-2">
                  <label for="sharedDonationUserShare">{{ t('form.sharedDonationUserShare') }}</label>
                  <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                    <InputNumber v-model="sharedDonationUserShare" input-id="sharedDonationUserShare" :min="0" :max="100" :step="1" :min-fraction-digits="0" :max-fraction-digits="0" suffix=" %" size="small" show-buttons fluid />
                    <span class="font-semibold text-surface-500">/</span>
                    <InputNumber :model-value="sharedDonationSpouseShare" :min-fraction-digits="0" :max-fraction-digits="0" suffix=" %" size="small" disabled fluid :aria-label="t('form.sharedDonationSpouseShare')" />
                  </div>
                </div>
              </div>
            </section>

            <div v-if="withSpouse" class="flex flex-col gap-2">
              <label for="spouseGrossIncomeYearly">{{ t('form.spouseGrossIncomeYearly') }}</label>
              <InputNumber v-model="spouseGrossIncomeYearly" input-id="spouseGrossIncomeYearly" :min="0" :step="1000" mode="currency" currency="EUR" locale="de-DE" size="small" show-buttons fluid />
            </div>

            <div class="flex flex-col gap-2">
              <label for="otherIncomeYearly">{{ t('form.otherIncomeYearly') }}</label>
              <InputNumber v-model="otherIncomeYearly" input-id="otherIncomeYearly" :min="0" :step="1000" mode="currency" currency="EUR" locale="de-DE" size="small" show-buttons fluid />
            </div>
          </div>
        </AccordionContent>
      </AccordionPanel>
    </Accordion>

    <div class="mt-2 flex items-center justify-between gap-2">
      <Button type="button" :label="t('form.reset')" icon="pi pi-refresh" outlined size="small" @click="handleReset" />
      <Button type="submit" :label="t('form.submit')" icon="pi pi-save" size="small" @click="markFormAsSubmitted" />
    </div>
  </Form>
</template>
