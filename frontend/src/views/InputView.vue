<!--
  InputView（输入模块，Task 07）：
  - 使用 PrimeVue Forms (Form + 内置 resolver) 做基础校验
  - 顶部：Single/Familie SelectButton（控制是否显示 Ehepartner 区块）
  - 紧随其后：两个快速跳转 Button 与 Accordion 当前展开项联动
  - 两段式 Accordion：Stammdaten / Einkommen & Abfindung
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

// Singleton-Store für Snapshot + 3-h-localStorage-Persistenz
const { committedInput, commit: commitUserInput, clear: clearUserInput } = useUserInput();

// Toast-Service für Save/Reset-Feedback (oben zentriert, siehe <Toast position="top-center"/> im Template)
const toast = useToast();

// 共用类型别名
type InsuranceKind = 'statutoryMandatory' | 'private' | 'voluntaryStatutory';
type SocialInsuranceKind = 'notMandatory' | 'statutoryMandatory' | 'employerOnly' | 'employeeOnly';

// ============ Personal data (user) ============
// 默认 Familie 模式 → Steuerklasse 4/4；切到 Single 时自动回到 1
const taxClass = ref('4');
const taxClassFactor = ref(1);
const paysChurchTax = ref(false);
const federalState = ref<string | null>('RP');
const healthInsurance = ref<InsuranceKind>('statutoryMandatory');
const healthInsuranceAdditionalRate = ref(2.18);
const privateHealthInsuranceAnnual = ref(0);
const privateCareInsuranceAnnual = ref(0);
// Familie 默认有 1 个 25 岁以下子女、Kinderfreibetrag=1（Single 模式下用户可手动改）
const hasChildren = ref(true);
const childrenUnder25 = ref(1);
const isAlleinerziehend = ref(false);
const childAllowance = ref(1);
const childBenefitMonthlyPerChild = ref(259);
const age = ref(47);
const pensionInsurance = ref<SocialInsuranceKind>('statutoryMandatory');
const unemploymentInsurance = ref<SocialInsuranceKind>('statutoryMandatory');

// ============ Personal data (spouse) ============
// 默认 Familie 模式（withSpouse=true），符合产品默认设定
const withSpouse = ref(true);
const spouseTaxClass = ref('4');
const spouseTaxClassFactor = ref(1);

// 切换 Single/Familie 时联动 Steuerklasse 与子女默认值
watch(withSpouse, (next, prev) => {
  if (next === prev) return;
  if (next) {
    taxClass.value = '4';
    spouseTaxClass.value = '4';
    spousePaysChurchTax.value = paysChurchTax.value;
    hasChildren.value = true;
    childrenUnder25.value = 1;
    isAlleinerziehend.value = false;
    childAllowance.value = 1;
  } else {
    taxClass.value = '1';
    hasChildren.value = false;
    childrenUnder25.value = 0;
    isAlleinerziehend.value = false;
    childAllowance.value = 0;
  }
});
watch([withSpouse, hasChildren, childrenUnder25], () => {
  if (!canUseSingleParentRelief()) {
    isAlleinerziehend.value = false;
  }
});
watch(paysChurchTax, (next) => {
  if (withSpouse.value) {
    spousePaysChurchTax.value = next;
  }
});
function canUseSingleParentRelief(): boolean {
  return !withSpouse.value && hasChildren.value && childrenUnder25.value > 0;
}
// Steuerklassen-Kombination III/V (gilt nur im Familie-Modus):
//   - Ein Ehegatte wählt III → Partner muss V haben.
//   - Ein Ehegatte wählt V  → Partner muss III haben.
//   - Verlässt einer der beiden III/V (z. B. III → IV), während der Partner noch
//     in der zugehörigen Klasse steht, wird der Partner auf IV zurückgesetzt;
//     so vermeiden wir illegale Kombinationen wie III/IV oder IV/V.
//   - 4/4, IV mit Faktor und sonstige Kombinationen werden nicht erzwungen.
watch(taxClass, (next, prev) => {
  if (!withSpouse.value) return;
  if (next === '3') {
    if (spouseTaxClass.value !== '5') spouseTaxClass.value = '5';
  } else if (next === '5') {
    if (spouseTaxClass.value !== '3') spouseTaxClass.value = '3';
  } else if (
    // Wir haben III/V verlassen → Partner aus der korrespondierenden Klasse befreien.
    (prev === '3' && spouseTaxClass.value === '5') ||
    (prev === '5' && spouseTaxClass.value === '3')
  ) {
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

// ============ Income & Severance ============
const hasNewJob = ref(false);
const expectedMonthlySalaryMin = ref(5000);
const expectedMonthlySalaryMax = ref(8000);
const expectedMonthlySalaryStep = ref(500);

// Schrittweite 上限 = Max − Min（至少 100），随 Min/Max 实时变化
const expectedMonthlySalaryStepMax = computed(() => Math.max(100, expectedMonthlySalaryMax.value - expectedMonthlySalaryMin.value));
// Schrittweite 下限：限制最多 8 条曲线 → step ≥ (max-min)/7，向上取整到 100
const MAX_SALARY_LINES = 7;
const expectedMonthlySalaryStepMin = computed(() => {
  const range = expectedMonthlySalaryMax.value - expectedMonthlySalaryMin.value;
  const minStep = Math.ceil(range / (MAX_SALARY_LINES - 1) / 100) * 100;
  return Math.max(100, minStep);
});
// Max. Monatsgehalt 必须严格大于 Min（至少高 100）
const expectedMonthlySalaryMaxMin = computed(() => expectedMonthlySalaryMin.value + 100);

// 当 Min/Max 变动时，把 Schrittweite/Max 钳回合法区间，避免出现不一致状态
watch(expectedMonthlySalaryMin, (min) => {
  if (expectedMonthlySalaryMax.value <= min) {
    expectedMonthlySalaryMax.value = min + 100;
  }
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

// 从失业开始日期推算两个可能的 Abfindung 发放日期：
//  · 选项 A：失业当月 15 日（同年发放，与旧工资叠加）
//  · 选项 B：次年 1 月 15 日（隔年发放，让 Fünftelregelung 落入低税年）
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

function dateToIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseStoredDate(raw: unknown): Date | null {
  if (typeof raw !== 'string') return null;
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (dateOnly) {
    const year = Number(dateOnly[1]);
    const month = Number(dateOnly[2]) - 1;
    const day = Number(dateOnly[3]);
    const date = new Date(year, month, day);
    return date.getFullYear() === year && date.getMonth() === month && date.getDate() === day ? date : null;
  }
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

const oldEmployerIncomeCurrentYear = ref(0);
const lastMonthlyGrossBeforeUnemployment = ref(0);
const unemploymentBenefitMonthly = ref(0);
const alvInsuranceMonthsLast5Years = ref(60);
const hasBenefitReductionPeriod = ref(false);
const benefitReductionMonths = ref(1);
const hasBenefitSuspensionPeriod = ref(false);
const benefitSuspensionMonths = ref(1);
const rentalIncomeYearly = ref(0);
const sharedIncomeUserShare = ref(50);
// Spenden (§ 10b EStG) — Familien-Topf, bei Familie nach Anteil aufgeteilt
const donationYearly = ref(0);
const sharedDonationUserShare = ref(50);
const spouseGrossIncomeYearly = ref(0);
const otherIncomeYearly = ref(0);

// 仅用于按钮触发后才显示 form-level 错误
const hasSubmitted = ref(false);

// 后续阶段填充：基于自定义业务规则（非 PrimeVue Form resolver）的字段错误
const validationErrors = ref<Record<string, string>>({});

// 集中保存所有字段的初始默认值，重置按钮使用
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
  isAlleinerziehend: false,
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
  lastMonthlyGrossBeforeUnemployment: 0,
  unemploymentBenefitMonthly: 0,
  alvInsuranceMonthsLast5Years: 60,
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

// 把所有 ref 还原成默认值（unemploymentDate 单独 clone，避免共享同一个 Date 对象）
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
  isAlleinerziehend.value = DEFAULTS.isAlleinerziehend;
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
  lastMonthlyGrossBeforeUnemployment.value = DEFAULTS.lastMonthlyGrossBeforeUnemployment;
  unemploymentBenefitMonthly.value = DEFAULTS.unemploymentBenefitMonthly;
  alvInsuranceMonthsLast5Years.value = DEFAULTS.alvInsuranceMonthsLast5Years;
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

// ============ Persistenz (delegiert an useUserInput) ============
// useUserInput verwaltet localStorage + 3-h-TTL als Singleton; InputView ruft
// nur commit/clear und liest beim Mount den aktuellen Snapshot.

// Sammelt alle Refs zu einem voll-serialisierbaren Snapshot.
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
    isAlleinerziehend: canUseSingleParentRelief() && isAlleinerziehend.value,
    childAllowance: childAllowance.value,
    childBenefitMonthlyPerChild: childBenefitMonthlyPerChild.value,
    age: age.value,
    pensionInsurance: pensionInsurance.value,
    unemploymentInsurance: unemploymentInsurance.value,
    withSpouse: withSpouse.value,
    spouseTaxClass: spouseTaxClass.value,
    spouseTaxClassFactor: spouseTaxClassFactor.value,
    spousePaysChurchTax: withSpouse.value ? paysChurchTax.value : spousePaysChurchTax.value,
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
    newJobStartDate: newJobStartDate.value ? dateToIsoDate(newJobStartDate.value) : null,
    newJobMonthlySalary: newJobMonthlySalary.value,
    severanceGross: severanceGross.value,
    unemploymentDate: unemploymentDate.value ? dateToIsoDate(unemploymentDate.value) : null,
    oldEmployerIncomeCurrentYear: oldEmployerIncomeCurrentYear.value,
    lastMonthlyGrossBeforeUnemployment: lastMonthlyGrossBeforeUnemployment.value,
    unemploymentBenefitMonthly: unemploymentBenefitMonthly.value,
    alvInsuranceMonthsLast5Years: alvInsuranceMonthsLast5Years.value,
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
  };
}

// 把快照里的纯值写回 ref；缺失的字段保留当前值
function applyInputState(d: Record<string, unknown>) {
  const setIfDefined = <T,>(key: string, setter: (v: T) => void) => {
    if (d[key] !== undefined) setter(d[key] as T);
  };
  const setDateIfDefined = (key: string, setter: (v: Date | null) => void) => {
    if (d[key] === undefined) return;
    setter(parseStoredDate(d[key]));
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
  setIfDefined<boolean>('isAlleinerziehend', (v) => (isAlleinerziehend.value = v));
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
  if (withSpouse.value) {
    spousePaysChurchTax.value = paysChurchTax.value;
  }
  setIfDefined<boolean>('hasNewJob', (v) => (hasNewJob.value = v));
  setIfDefined<number>('expectedMonthlySalaryMin', (v) => (expectedMonthlySalaryMin.value = v));
  setIfDefined<number>('expectedMonthlySalaryMax', (v) => (expectedMonthlySalaryMax.value = v));
  setIfDefined<number>('expectedMonthlySalaryStep', (v) => (expectedMonthlySalaryStep.value = v));
  setDateIfDefined('newJobStartDate', (v) => (newJobStartDate.value = v));
  setIfDefined<number>('newJobMonthlySalary', (v) => (newJobMonthlySalary.value = v));
  setIfDefined<number>('severanceGross', (v) => (severanceGross.value = v));
  setDateIfDefined('unemploymentDate', (v) => (unemploymentDate.value = v));
  setIfDefined<number>('oldEmployerIncomeCurrentYear', (v) => (oldEmployerIncomeCurrentYear.value = v));
  setIfDefined<number>('lastMonthlyGrossBeforeUnemployment', (v) => (lastMonthlyGrossBeforeUnemployment.value = v));
  setIfDefined<number>('unemploymentBenefitMonthly', (v) => (unemploymentBenefitMonthly.value = v));
  setIfDefined<number>('alvInsuranceMonthsLast5Years', (v) => (alvInsuranceMonthsLast5Years.value = v));
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
  if (!canUseSingleParentRelief()) isAlleinerziehend.value = false;
}

function persistInputs(): void {
  commitUserInput(collectInputState());
}

function clearPersistedInputs(): void {
  clearUserInput();
}

// Beim Mount den aktuellen Singleton-Snapshot übernehmen (falls vorhanden
// und nicht abgelaufen — das prüft useUserInput beim Modul-Init).
function restorePersistedInputs(): void {
  if (committedInput.value) applyInputState(committedInput.value as unknown as Record<string, unknown>);
}

restorePersistedInputs();

// ============ 选项 ============
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
  { label: 'Baden-Württemberg', value: 'BW' },
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
  { label: 'Thüringen', value: 'TH' }
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
const showSingleParentReliefOption = computed(() => canUseSingleParentRelief());

// SelectButton Pass Through：active item 高亮风格与顶部 Toolbar 主菜单一致
const activeContentStyle = {
  background: 'var(--p-primary-color)',
  color: 'var(--p-primary-contrast-color, #fff)'
};
const activeContrastTextStyle = {
  color: 'var(--p-primary-contrast-color, #fff)'
};
const familyTypeSelectButtonPt = {
  pcToggleButton: {
    content: ({ context }: { context: { active: boolean } }) => ({
      style: context.active ? activeContentStyle : undefined
    }),
    label: ({ context }: { context: { active: boolean } }) => ({
      style: context.active ? activeContrastTextStyle : undefined
    })
  }
};

// 派生值
const sharedIncomeSpouseShare = computed(() => 100 - sharedIncomeUserShare.value);
const sharedDonationSpouseShare = computed(() => 100 - sharedDonationUserShare.value);
const newJobStartMinDate = computed(() => new Date());

function isAlvEmployeeSubject(v: SocialInsuranceKind): boolean {
  return v === 'statutoryMandatory' || v === 'employeeOnly';
}

function deriveAlgDurationMonthsByInsurance(ageValue: number, insuranceMonthsValue: number): number {
  const months = Math.max(0, Math.min(60, Math.floor(insuranceMonthsValue)));
  if (ageValue >= 58 && months >= 48) return 24;
  if (ageValue >= 55 && months >= 36) return 18;
  if (ageValue >= 50 && months >= 30) return 15;
  if (months >= 24) return 12;
  if (months >= 20) return 10;
  if (months >= 16) return 8;
  if (months >= 12) return 6;
  return 0;
}

// ALG-I-Anspruchsdauer nach § 147 SGB III: Alter + versicherungspflichtige Monate.
const unemploymentBenefitDurationMonths = computed(() => {
  if (!isAlvEmployeeSubject(unemploymentInsurance.value)) return 0;
  return deriveAlgDurationMonthsByInsurance(age.value, alvInsuranceMonthsLast5Years.value);
});

// ============ Tooltip-Inhalte (HTML) ============
const taxClassInfoTooltip = computed(() => {
  const items = (tm('form.taxClassInfoClasses') as string[]).map((item) => `<li>${item}</li>`).join('');
  return `<p><strong>${t('form.taxClassInfoTitle')}</strong></p><p>${t('form.taxClassInfoIntro')}</p><ul>${items}</ul>`;
});
const careInsuranceInfoTooltip = computed(() => t('form.careInsuranceInfoTooltip'));
const churchTaxInfoTooltip = computed(() => t('form.churchTaxInfoTooltip'));
const healthInsuranceInfoTooltip = computed(() => t('form.healthInsuranceInfoTooltip'));
const healthInsuranceRateInfoTooltip = computed(() => t('form.healthInsuranceRateInfoTooltip'));
const privateInsuranceDeductibleTooltip = computed(() => t('form.privateInsuranceDeductibleTooltip'));
const singleParentReliefTooltip = computed(() => t('form.singleParentReliefTooltip'));
const childAllowanceInfoTooltip = computed(() => t('form.childAllowanceInfoTooltip'));
const childBenefitInfoTooltip = computed(() => t('form.childBenefitInfoTooltip'));
const pensionInsuranceInfoTooltip = computed(() => t('form.pensionInsuranceInfoTooltip'));
const unemploymentInsuranceInfoTooltip = computed(() => t('form.unemploymentInsuranceInfoTooltip'));
const alvInsuranceMonthsLast5YearsTooltip = computed(() => t('form.alvInsuranceMonthsLast5YearsTooltip'));
const unemploymentBenefitDurationTooltip = computed(() => t('form.unemploymentBenefitDurationTooltip'));
const possibleSeverancePaymentDatesTooltip = computed(() => t('form.possibleSeverancePaymentDatesTooltip'));
const oldEmployerIncomeCurrentYearTooltip = computed(() => t('form.oldEmployerIncomeCurrentYearTooltip'));
const lastMonthlyGrossBeforeUnemploymentTooltip = computed(() => t('form.lastMonthlyGrossBeforeUnemploymentTooltip'));
const donationSectionTooltip = computed(() => t('form.donationSectionTooltip'));
const salaryRangeSectionTooltip = computed(() => t('form.salaryRangeSectionTooltip'));
const unemploymentBenefitMonthlyTooltip = computed(() => t('form.unemploymentBenefitMonthlyTooltip'));
const benefitReductionPeriodTooltip = computed(() => t('form.benefitReductionPeriodTooltip'));
const benefitSuspensionPeriodTooltip = computed(() => t('form.benefitSuspensionPeriodTooltip'));
const taxClassFactorTooltip = computed(() => t('form.taxClassFactorTooltip'));
const rentalIncomeYearlyTooltip = computed(() => t('form.rentalIncomeYearlyTooltip'));

// ============ 校验 resolver（最小化） ============
type FormValues = Record<string, unknown>;
type FormErrorMap = Record<string, { message: string }[]>;

function resolver({ values }: { values: FormValues }): { errors: FormErrorMap } {
  const errors: FormErrorMap = {};
  const requireField = (name: string) => {
    const v = values[name];
    if (v === undefined || v === null || v === '') {
      errors[name] = [{ message: t('form.requiredField') }];
    }
  };
  requireField('federalState');
  requireField('severanceGross');

  // Cross-Field-Plausibilitätsprüfungen — unabhängig vom PrimeVue-Resolver-Mechanismus,
  // damit Fehlermeldungen direkt am betroffenen Feld erscheinen.
  const localErrors: Record<string, string> = {};
  // 0a) severanceGross muss > 0 sein (requireField akzeptiert 0, weil 0 !== '' / null).
  if (typeof severanceGross.value !== 'number' || severanceGross.value <= 0) {
    localErrors.severanceGross = t('form.requiredField');
  }
  // 0b) unemploymentDate ist Pflichtfeld, ist aber nicht im Form registriert
  //     (kein <name="unemploymentDate">), daher hier prüfen.
  if (!unemploymentDate.value) {
    localErrors.unemploymentDate = t('form.requiredField');
  }
  // 1) Beginn neue Arbeit darf nicht vor Beginn Arbeitslosigkeit liegen.
  if (hasNewJob.value && newJobStartDate.value && unemploymentDate.value && newJobStartDate.value < unemploymentDate.value) {
    localErrors.newJobStartDate = t('validation.newJobBeforeUnemployment');
  }
  // 2) Sperrzeit darf die Anspruchsdauer ALG I nicht überschreiten.
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
  // event.valid prüft nur im Form registrierte Felder (name="..."). Cross-Field-
  // und nicht-registrierte Pflichtfelder (z. B. unemploymentDate) werden über
  // validationErrors abgebildet — hier zusätzlich prüfen, sonst rutscht ein
  // leeres Datum durch.
  if (Object.keys(validationErrors.value).length > 0) return;
  // 通过校验 → 把当前输入快照写入 localStorage（3 小时 TTL）
  persistInputs();
  toast.add({
    severity: 'success',
    summary: t('form.savedToastSummary'),
    detail: t('form.savedToastDetail'),
    life: 6000
  });
  // 通知父组件折叠输入区
  emit('saved');
}

// 重置：清空缓存 + 还原默认值
function handleReset() {
  // 主动让当前焦点元素（被点击的「Zurücksetzen」按钮）失焦，
  // 避免 PrimeVue Form 重置后内部 autofocus 处理触发
  // 浏览器警告 "Autofocus processing was blocked …"
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
  <!-- 多根节点：Toast 会 teleport 到 body，Form 直接作为根。父列（App.vue 左栏）提供唯一的 overflow-auto 与 padding。 -->
  <Toast position="top-center" />
  <Form v-slot="$form" :initial-values="initialValues" :resolver="resolver" class="flex flex-col gap-6" @submit="onFormSubmit">
    <!-- Familienstand: Single / Familie -->
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
      <!-- ===================== Stammdaten ===================== -->
      <AccordionPanel value="basicData" class="border border-surface-200 dark:border-surface-700 rounded-md overflow-hidden mb-2">
        <AccordionHeader class="bg-surface-50! dark:bg-surface-900! py-1.5!">
          <span class="font-semibold">{{ t('workspace.sections.basic') }}</span>
        </AccordionHeader>
        <AccordionContent>
          <div class="flex flex-col gap-5 pt-4">
            <!-- Lohnsteuerklasse -->
            <div class="flex flex-col gap-2">
              <div class="flex items-center gap-2">
                <label for="taxClass">{{ t('form.taxClassOwn') }}</label>
                <button
                  v-tooltip.right="{
                    value: taxClassInfoTooltip,
                    escape: false,
                    class: 'tax-class-tooltip',
                    showDelay: 150
                  }"
                  type="button"
                  class="pi pi-info-circle cursor-help border-0 bg-transparent p-0 text-primary-600"
                  :aria-label="t('form.taxClassInfoAriaLabel')"
                ></button>
              </div>
              <Select
                v-model="taxClass"
                input-id="taxClass"
                :options="taxClassOptions"
                option-label="label"
                option-value="value"
                size="small"
                fluid
              />
            </div>

            <div v-if="taxClass === '4-factor'" class="flex flex-col gap-2">
              <div class="flex items-center gap-2">
                <label for="taxClassFactor">{{ t('form.taxClassFactor') }}</label>
                <button
                  v-tooltip.right="{
                    value: taxClassFactorTooltip,
                    escape: false,
                    class: 'tax-class-tooltip',
                    showDelay: 150
                  }"
                  type="button"
                  class="pi pi-info-circle cursor-help border-0 bg-transparent p-0 text-primary-600"
                  :aria-label="t('form.taxClassFactorAriaLabel')"
                ></button>
              </div>
              <InputNumber
                v-model="taxClassFactor"
                input-id="taxClassFactor"
                :min="0.001"
                :max="0.999"
                :step="0.001"
                :min-fraction-digits="3"
                :max-fraction-digits="3"
                locale="de-DE"
                size="small"
                show-buttons
                fluid
              />
            </div>

            <!-- Kirchensteuer -->
            <fieldset class="m-0 flex flex-col gap-2 border-0 p-0">
              <legend class="flex items-center gap-2">
                <span>{{ t('form.churchTax') }}</span>
                <button
                  v-tooltip.right="{
                    value: churchTaxInfoTooltip,
                    escape: false,
                    class: 'tax-class-tooltip',
                    showDelay: 150
                  }"
                  type="button"
                  class="pi pi-info-circle cursor-help border-0 bg-transparent p-0 text-primary-600"
                  :aria-label="t('form.churchTaxInfoAriaLabel')"
                ></button>
              </legend>
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

            <!-- Bundesland -->
            <div class="flex flex-col gap-2">
              <label for="federalState">
                {{ t('form.federalState') }}
                <span class="text-primary-600" aria-hidden="true">*</span>
              </label>
              <Select
                v-model="federalState"
                input-id="federalState"
                name="federalState"
                :options="federalStateOptions"
                option-label="label"
                option-value="value"
                :placeholder="t('form.federalStatePlaceholder')"
                size="small"
                fluid
              />
              <Message v-if="hasSubmitted && $form.federalState?.invalid" severity="error" size="small" variant="simple">
                {{ $form.federalState.error?.message }}
              </Message>
              <Message v-else-if="validationErrors.federalState" severity="error" size="small" variant="simple">
                {{ validationErrors.federalState }}
              </Message>
            </div>

            <!-- Krankenversicherung -->
            <div class="flex flex-col gap-2">
              <div class="flex items-center gap-2">
                <label for="healthInsurance">{{ t('form.healthInsurance') }}</label>
                <button
                  v-tooltip.right="{
                    value: healthInsuranceInfoTooltip,
                    escape: false,
                    class: 'tax-class-tooltip',
                    showDelay: 150
                  }"
                  type="button"
                  class="pi pi-info-circle cursor-help border-0 bg-transparent p-0 text-primary-600"
                  :aria-label="t('form.healthInsuranceInfoAriaLabel')"
                ></button>
              </div>
              <Select
                v-model="healthInsurance"
                input-id="healthInsurance"
                :options="insuranceOptions"
                option-label="label"
                option-value="value"
                size="small"
                fluid
              />
            </div>

            <div v-if="healthInsurance !== 'private'" class="flex flex-col gap-2">
              <div class="flex items-center gap-2">
                <label for="healthInsuranceAdditionalRate">{{ t('form.healthInsuranceRate') }}</label>
                <button
                  v-tooltip.right="{
                    value: healthInsuranceRateInfoTooltip,
                    escape: false,
                    class: 'tax-class-tooltip',
                    showDelay: 150
                  }"
                  type="button"
                  class="pi pi-info-circle cursor-help border-0 bg-transparent p-0 text-primary-600"
                  :aria-label="t('form.healthInsuranceRateInfoAriaLabel')"
                ></button>
              </div>
              <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                <InputNumber
                  :model-value="14.6"
                  :min-fraction-digits="1"
                  :max-fraction-digits="1"
                  suffix=" %"
                  size="small"
                  disabled
                  fluid
                  :aria-label="t('form.baseHealthInsuranceRate')"
                />
                <span class="font-semibold text-surface-500">+</span>
                <InputNumber
                  v-model="healthInsuranceAdditionalRate"
                  input-id="healthInsuranceAdditionalRate"
                  :min="0"
                  :max="10"
                  :step="0.01"
                  :min-fraction-digits="2"
                  :max-fraction-digits="3"
                  suffix=" %"
                  show-buttons
                  size="small"
                  fluid
                />
              </div>
            </div>

            <template v-else>
              <div class="flex flex-col gap-2">
                <div class="flex items-center gap-2">
                  <label for="privateHealthInsuranceAnnual">{{ t('form.privateHealthInsuranceAnnual') }}</label>
                  <button
                    v-tooltip.right="{
                      value: privateInsuranceDeductibleTooltip,
                      escape: false,
                      class: 'tax-class-tooltip',
                      showDelay: 150
                    }"
                    type="button"
                    class="pi pi-info-circle cursor-help border-0 bg-transparent p-0 text-primary-600"
                    :aria-label="t('form.privateInsuranceDeductibleAriaLabel')"
                  ></button>
                </div>
                <InputNumber
                  v-model="privateHealthInsuranceAnnual"
                  input-id="privateHealthInsuranceAnnual"
                  :min="0"
                  :step="500"
                  mode="currency"
                  currency="EUR"
                  locale="de-DE"
                  size="small"
                  show-buttons
                  fluid
                />
              </div>

              <div class="flex flex-col gap-2">
                <div class="flex items-center gap-2">
                  <label for="privateCareInsuranceAnnual">{{ t('form.privateCareInsuranceAnnual') }}</label>
                  <button
                    v-tooltip.right="{
                      value: privateInsuranceDeductibleTooltip,
                      escape: false,
                      class: 'tax-class-tooltip',
                      showDelay: 150
                    }"
                    type="button"
                    class="pi pi-info-circle cursor-help border-0 bg-transparent p-0 text-primary-600"
                    :aria-label="t('form.privateInsuranceDeductibleAriaLabel')"
                  ></button>
                </div>
                <InputNumber
                  v-model="privateCareInsuranceAnnual"
                  input-id="privateCareInsuranceAnnual"
                  :min="0"
                  :step="100"
                  mode="currency"
                  currency="EUR"
                  locale="de-DE"
                  size="small"
                  show-buttons
                  fluid
                />
              </div>
            </template>

            <!-- Kinder -->
            <fieldset class="m-0 flex flex-col gap-2 border-0 p-0">
              <legend class="flex items-center gap-2">
                <span>{{ t('form.hasChildren') }}</span>
                <button
                  v-tooltip.right="{
                    value: careInsuranceInfoTooltip,
                    escape: false,
                    class: 'tax-class-tooltip',
                    showDelay: 150
                  }"
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
              <Select
                v-model="childrenUnder25"
                input-id="childrenUnder25"
                :options="childrenUnder25Options"
                option-label="label"
                option-value="value"
                size="small"
                fluid
              />
            </div>

            <fieldset v-if="showSingleParentReliefOption" class="m-0 flex flex-col gap-2 border-0 p-0">
              <legend class="flex items-center gap-2">
                <span>{{ t('form.singleParentRelief') }}</span>
                <button
                  v-tooltip.right="{
                    value: singleParentReliefTooltip,
                    escape: false,
                    class: 'tax-class-tooltip',
                    showDelay: 150
                  }"
                  type="button"
                  class="pi pi-info-circle cursor-help border-0 bg-transparent p-0 text-primary-600"
                  :aria-label="t('form.singleParentReliefAriaLabel')"
                ></button>
              </legend>
              <div class="flex min-h-9 items-center gap-5">
                <div class="flex items-center gap-2">
                  <RadioButton v-model="isAlleinerziehend" input-id="isAlleinerziehendYes" name="isAlleinerziehend" :value="true" size="small" />
                  <label class="text-surface-800" for="isAlleinerziehendYes">{{ t('form.yes') }}</label>
                </div>
                <div class="flex items-center gap-2">
                  <RadioButton v-model="isAlleinerziehend" input-id="isAlleinerziehendNo" name="isAlleinerziehend" :value="false" size="small" />
                  <label class="text-surface-800" for="isAlleinerziehendNo">{{ t('form.no') }}</label>
                </div>
              </div>
            </fieldset>

            <div v-if="hasChildren" class="flex flex-col gap-2">
              <div class="flex items-center gap-2">
                <label for="childAllowance">{{ t('form.childAllowance') }}</label>
                <button
                  v-tooltip.right="{
                    value: childAllowanceInfoTooltip,
                    escape: false,
                    class: 'tax-class-tooltip',
                    showDelay: 150
                  }"
                  type="button"
                  class="pi pi-info-circle cursor-help border-0 bg-transparent p-0 text-primary-600"
                  :aria-label="t('form.childAllowanceInfoAriaLabel')"
                ></button>
              </div>
              <Select
                v-model="childAllowance"
                input-id="childAllowance"
                :options="childAllowanceOptions"
                option-label="label"
                option-value="value"
                size="small"
                fluid
              />
            </div>

            <div v-if="hasChildren" class="flex flex-col gap-2">
              <div class="flex items-center gap-2">
                <label for="childBenefitMonthlyPerChild">{{ t('form.childBenefitMonthlyPerChild') }}</label>
                <button
                  v-tooltip.right="{
                    value: childBenefitInfoTooltip,
                    escape: false,
                    class: 'tax-class-tooltip',
                    showDelay: 150
                  }"
                  type="button"
                  class="pi pi-info-circle cursor-help border-0 bg-transparent p-0 text-primary-600"
                  :aria-label="t('form.childBenefitInfoAriaLabel')"
                ></button>
              </div>
              <InputNumber
                v-model="childBenefitMonthlyPerChild"
                input-id="childBenefitMonthlyPerChild"
                :min="0"
                :step="1"
                :min-fraction-digits="0"
                :max-fraction-digits="0"
                mode="currency"
                currency="EUR"
                locale="de-DE"
                size="small"
                show-buttons
                fluid
              />
            </div>

            <!-- Alter -->
            <div class="flex flex-col gap-2">
              <label for="age">{{ t('form.age') }}</label>
              <Select v-model="age" input-id="age" :options="ageOptions" option-label="label" option-value="value" size="small" fluid />
            </div>

            <!-- Rentenversicherung -->
            <div class="flex flex-col gap-2">
              <div class="flex items-center gap-2">
                <label for="pensionInsurance">{{ t('form.pensionInsurance') }}</label>
                <button
                  v-tooltip.right="{
                    value: pensionInsuranceInfoTooltip,
                    escape: false,
                    class: 'tax-class-tooltip',
                    showDelay: 150
                  }"
                  type="button"
                  class="pi pi-info-circle cursor-help border-0 bg-transparent p-0 text-primary-600"
                  :aria-label="t('form.pensionInsuranceInfoAriaLabel')"
                ></button>
              </div>
              <Select
                v-model="pensionInsurance"
                input-id="pensionInsurance"
                :options="socialInsuranceOptions"
                option-label="label"
                option-value="value"
                size="small"
                fluid
              />
            </div>

            <!-- Arbeitslosenversicherung -->
            <div class="flex flex-col gap-2">
              <div class="flex items-center gap-2">
                <label for="unemploymentInsurance">{{ t('form.unemploymentInsurance') }}</label>
                <button
                  v-tooltip.right="{
                    value: unemploymentInsuranceInfoTooltip,
                    escape: false,
                    class: 'tax-class-tooltip',
                    showDelay: 150
                  }"
                  type="button"
                  class="pi pi-info-circle cursor-help border-0 bg-transparent p-0 text-primary-600"
                  :aria-label="t('form.unemploymentInsuranceInfoAriaLabel')"
                ></button>
              </div>
              <Select
                v-model="unemploymentInsurance"
                input-id="unemploymentInsurance"
                :options="socialInsuranceOptions"
                option-label="label"
                option-value="value"
                size="small"
                fluid
              />
            </div>

            <!-- Ehepartner-Sektion -->
            <section v-if="withSpouse" class="rounded border border-surface-200 bg-surface-50 p-4">
              <h2 class="mb-4 text-base font-semibold text-surface-900">{{ t('form.spouseSection') }}</h2>
              <div class="flex flex-col gap-4">
                <div class="flex flex-col gap-2">
                  <div class="flex items-center gap-2">
                    <label for="spouseTaxClass">{{ t('form.taxClassOwn') }}</label>
                    <button
                      v-tooltip.right="{
                        value: taxClassInfoTooltip,
                        escape: false,
                        class: 'tax-class-tooltip',
                        showDelay: 150
                      }"
                      type="button"
                      class="pi pi-info-circle cursor-help border-0 bg-transparent p-0 text-primary-600"
                      :aria-label="t('form.taxClassInfoAriaLabel')"
                    ></button>
                  </div>
                  <Select
                    v-model="spouseTaxClass"
                    input-id="spouseTaxClass"
                    :options="taxClassOptions"
                    option-label="label"
                    option-value="value"
                    size="small"
                    fluid
                  />
                </div>

                <div v-if="spouseTaxClass === '4-factor'" class="flex flex-col gap-2">
                  <div class="flex items-center gap-2">
                    <label for="spouseTaxClassFactor">{{ t('form.taxClassFactor') }}</label>
                    <button
                      v-tooltip.right="{
                        value: taxClassFactorTooltip,
                        escape: false,
                        class: 'tax-class-tooltip',
                        showDelay: 150
                      }"
                      type="button"
                      class="pi pi-info-circle cursor-help border-0 bg-transparent p-0 text-primary-600"
                      :aria-label="t('form.taxClassFactorAriaLabel')"
                    ></button>
                  </div>
                  <InputNumber
                    v-model="spouseTaxClassFactor"
                    input-id="spouseTaxClassFactor"
                    :min="0.001"
                    :max="0.999"
                    :step="0.001"
                    :min-fraction-digits="3"
                    :max-fraction-digits="3"
                    locale="de-DE"
                    size="small"
                    show-buttons
                    fluid
                  />
                </div>

                <div class="flex flex-col gap-2">
                  <div class="flex items-center gap-2">
                    <label for="spouseHealthInsurance">{{ t('form.healthInsurance') }}</label>
                    <button
                      v-tooltip.right="{
                        value: healthInsuranceInfoTooltip,
                        escape: false,
                        class: 'tax-class-tooltip',
                        showDelay: 150
                      }"
                      type="button"
                      class="pi pi-info-circle cursor-help border-0 bg-transparent p-0 text-primary-600"
                      :aria-label="t('form.healthInsuranceInfoAriaLabel')"
                    ></button>
                  </div>
                  <Select
                    v-model="spouseHealthInsurance"
                    input-id="spouseHealthInsurance"
                    :options="insuranceOptions"
                    option-label="label"
                    option-value="value"
                    size="small"
                    fluid
                  />
                </div>

                <div v-if="spouseHealthInsurance !== 'private'" class="flex flex-col gap-2">
                  <div class="flex items-center gap-2">
                    <label for="spouseHealthInsuranceAdditionalRate">{{ t('form.healthInsuranceRate') }}</label>
                    <button
                      v-tooltip.right="{
                        value: healthInsuranceRateInfoTooltip,
                        escape: false,
                        class: 'tax-class-tooltip',
                        showDelay: 150
                      }"
                      type="button"
                      class="pi pi-info-circle cursor-help border-0 bg-transparent p-0 text-primary-600"
                      :aria-label="t('form.healthInsuranceRateInfoAriaLabel')"
                    ></button>
                  </div>
                  <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                    <InputNumber
                      :model-value="14.6"
                      :min-fraction-digits="1"
                      :max-fraction-digits="1"
                      suffix=" %"
                      size="small"
                      disabled
                      fluid
                      :aria-label="t('form.baseHealthInsuranceRate')"
                    />
                    <span class="font-semibold text-surface-500">+</span>
                    <InputNumber
                      v-model="spouseHealthInsuranceAdditionalRate"
                      input-id="spouseHealthInsuranceAdditionalRate"
                      :min="0"
                      :max="10"
                      :step="0.01"
                      :min-fraction-digits="2"
                      :max-fraction-digits="3"
                      suffix=" %"
                      show-buttons
                      size="small"
                      fluid
                    />
                  </div>
                </div>

                <template v-else>
                  <div class="flex flex-col gap-2">
                    <div class="flex items-center gap-2">
                      <label for="spousePrivateHealthInsuranceAnnual">{{ t('form.privateHealthInsuranceAnnual') }}</label>
                      <button
                        v-tooltip.right="{
                          value: privateInsuranceDeductibleTooltip,
                          escape: false,
                          class: 'tax-class-tooltip',
                          showDelay: 150
                        }"
                        type="button"
                        class="pi pi-info-circle cursor-help border-0 bg-transparent p-0 text-primary-600"
                        :aria-label="t('form.privateInsuranceDeductibleAriaLabel')"
                      ></button>
                    </div>
                    <InputNumber
                      v-model="spousePrivateHealthInsuranceAnnual"
                      input-id="spousePrivateHealthInsuranceAnnual"
                      :min="0"
                      :step="500"
                      mode="currency"
                      currency="EUR"
                      locale="de-DE"
                      size="small"
                      show-buttons
                      fluid
                    />
                  </div>

                  <div class="flex flex-col gap-2">
                    <div class="flex items-center gap-2">
                      <label for="spousePrivateCareInsuranceAnnual">{{ t('form.privateCareInsuranceAnnual') }}</label>
                      <button
                        v-tooltip.right="{
                          value: privateInsuranceDeductibleTooltip,
                          escape: false,
                          class: 'tax-class-tooltip',
                          showDelay: 150
                        }"
                        type="button"
                        class="pi pi-info-circle cursor-help border-0 bg-transparent p-0 text-primary-600"
                        :aria-label="t('form.privateInsuranceDeductibleAriaLabel')"
                      ></button>
                    </div>
                    <InputNumber
                      v-model="spousePrivateCareInsuranceAnnual"
                      input-id="spousePrivateCareInsuranceAnnual"
                      :min="0"
                      :step="100"
                      mode="currency"
                      currency="EUR"
                      locale="de-DE"
                      size="small"
                      show-buttons
                      fluid
                    />
                  </div>
                </template>

                <div class="flex flex-col gap-2">
                  <div class="flex items-center gap-2">
                    <label for="spousePensionInsurance">{{ t('form.pensionInsurance') }}</label>
                    <button
                      v-tooltip.right="{
                        value: pensionInsuranceInfoTooltip,
                        escape: false,
                        class: 'tax-class-tooltip',
                        showDelay: 150
                      }"
                      type="button"
                      class="pi pi-info-circle cursor-help border-0 bg-transparent p-0 text-primary-600"
                      :aria-label="t('form.pensionInsuranceInfoAriaLabel')"
                    ></button>
                  </div>
                  <Select
                    v-model="spousePensionInsurance"
                    input-id="spousePensionInsurance"
                    :options="socialInsuranceOptions"
                    option-label="label"
                    option-value="value"
                    size="small"
                    fluid
                  />
                </div>

                <div class="flex flex-col gap-2">
                  <div class="flex items-center gap-2">
                    <label for="spouseUnemploymentInsurance">{{ t('form.unemploymentInsurance') }}</label>
                    <button
                      v-tooltip.right="{
                        value: unemploymentInsuranceInfoTooltip,
                        escape: false,
                        class: 'tax-class-tooltip',
                        showDelay: 150
                      }"
                      type="button"
                      class="pi pi-info-circle cursor-help border-0 bg-transparent p-0 text-primary-600"
                      :aria-label="t('form.unemploymentInsuranceInfoAriaLabel')"
                    ></button>
                  </div>
                  <Select
                    v-model="spouseUnemploymentInsurance"
                    input-id="spouseUnemploymentInsurance"
                    :options="socialInsuranceOptions"
                    option-label="label"
                    option-value="value"
                    size="small"
                    fluid
                  />
                </div>

                <div class="flex flex-col gap-2">
                  <label for="spouseAge">{{ t('form.age') }}</label>
                  <Select
                    v-model="spouseAge"
                    input-id="spouseAge"
                    :options="ageOptions"
                    option-label="label"
                    option-value="value"
                    size="small"
                    fluid
                  />
                </div>
              </div>
            </section>
          </div>
        </AccordionContent>
      </AccordionPanel>

      <!-- ===================== Einkommen & Abfindung ===================== -->
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
                  v-tooltip.right="{
                    value: t('form.hasNewJobTooltip'),
                    escape: false,
                    class: 'tax-class-tooltip',
                    showDelay: 150
                  }"
                  type="button"
                  class="pi pi-info-circle cursor-help border-0 bg-transparent p-0 text-primary-600"
                  :aria-label="t('form.hasNewJobAriaLabel')"
                ></button>
              </div>
              <ToggleSwitch v-model="hasNewJob" input-id="hasNewJob" />
            </div>

            <!-- Sweep range -->
            <section v-if="!hasNewJob" class="rounded border border-surface-200 bg-surface-50 p-4">
              <div class="mb-4 flex items-center gap-2">
                <h2 class="text-base font-semibold text-surface-900">{{ t('form.salaryRangeSection') }}</h2>
                <button
                  v-tooltip.right="{
                    value: salaryRangeSectionTooltip,
                    escape: false,
                    class: 'tax-class-tooltip',
                    showDelay: 150
                  }"
                  type="button"
                  class="pi pi-info-circle cursor-help border-0 bg-transparent p-0 text-primary-600"
                  :aria-label="t('form.salaryRangeSectionAriaLabel')"
                ></button>
              </div>
              <div class="flex flex-col gap-4">
                <div class="flex flex-col gap-2">
                  <label for="expectedMonthlySalaryMin">
                    {{ t('form.expectedMonthlySalaryMin') }}
                    <span class="text-primary-600" aria-hidden="true">*</span>
                  </label>
                  <InputNumber
                    v-model="expectedMonthlySalaryMin"
                    input-id="expectedMonthlySalaryMin"
                    :min="2000"
                    :step="100"
                    :min-fraction-digits="0"
                    :max-fraction-digits="0"
                    mode="currency"
                    currency="EUR"
                    locale="de-DE"
                    size="small"
                    show-buttons
                    fluid
                  />
                  <Message v-if="validationErrors.expectedMonthlySalaryMin" severity="error" size="small" variant="simple">
                    {{ validationErrors.expectedMonthlySalaryMin }}
                  </Message>
                </div>

                <div class="flex flex-col gap-2">
                  <label for="expectedMonthlySalaryMax">
                    {{ t('form.expectedMonthlySalaryMax') }}
                    <span class="text-primary-600" aria-hidden="true">*</span>
                  </label>
                  <InputNumber
                    v-model="expectedMonthlySalaryMax"
                    input-id="expectedMonthlySalaryMax"
                    :min="expectedMonthlySalaryMaxMin"
                    :step="100"
                    :min-fraction-digits="0"
                    :max-fraction-digits="0"
                    mode="currency"
                    currency="EUR"
                    locale="de-DE"
                    size="small"
                    show-buttons
                    fluid
                  />
                  <Message v-if="validationErrors.expectedMonthlySalaryMax" severity="error" size="small" variant="simple">
                    {{ validationErrors.expectedMonthlySalaryMax }}
                  </Message>
                </div>

                <div class="flex flex-col gap-2">
                  <label for="expectedMonthlySalaryStep">
                    {{ t('form.expectedMonthlySalaryStep') }}
                    <span class="text-primary-600" aria-hidden="true">*</span>
                  </label>
                  <InputNumber
                    v-model="expectedMonthlySalaryStep"
                    input-id="expectedMonthlySalaryStep"
                    :min="expectedMonthlySalaryStepMin"
                    :max="expectedMonthlySalaryStepMax"
                    :step="100"
                    :min-fraction-digits="0"
                    :max-fraction-digits="0"
                    mode="currency"
                    currency="EUR"
                    locale="de-DE"
                    size="small"
                    show-buttons
                    fluid
                  />
                  <Message v-if="validationErrors.expectedMonthlySalaryStep" severity="error" size="small" variant="simple">
                    {{ validationErrors.expectedMonthlySalaryStep }}
                  </Message>
                </div>
              </div>
            </section>

            <template v-if="hasNewJob">
              <div class="flex flex-col gap-2">
                <label for="newJobStartDate">
                  {{ t('form.newJobStartDate') }}
                  <span class="text-primary-600" aria-hidden="true">*</span>
                </label>
                <DatePicker
                  v-model="newJobStartDate"
                  input-id="newJobStartDate"
                  :min-date="newJobStartMinDate"
                  date-format="dd.mm.yy"
                  size="small"
                  show-icon
                  fluid
                />
                <Message v-if="validationErrors.newJobStartDate" severity="error" size="small" variant="simple">
                  {{ validationErrors.newJobStartDate }}
                </Message>
              </div>

              <div class="flex flex-col gap-2">
                <label for="newJobMonthlySalary">
                  {{ t('form.newJobMonthlySalary') }}
                  <span class="text-primary-600" aria-hidden="true">*</span>
                </label>
                <InputNumber
                  v-model="newJobMonthlySalary"
                  input-id="newJobMonthlySalary"
                  :min="0"
                  :step="500"
                  mode="currency"
                  currency="EUR"
                  locale="de-DE"
                  size="small"
                  show-buttons
                  fluid
                />
                <Message v-if="validationErrors.newJobMonthlySalary" severity="error" size="small" variant="simple">
                  {{ validationErrors.newJobMonthlySalary }}
                </Message>
              </div>
            </template>

            <!-- Abfindung & ALG I -->
            <section class="rounded border border-surface-200 bg-surface-50 p-4">
              <h2 class="mb-4 text-base font-semibold text-surface-900">{{ t('form.unemploymentSection') }}</h2>
              <div class="flex flex-col gap-4">
                <div class="flex flex-col gap-2">
                  <label for="severanceGross">
                    {{ t('form.abfindungGross') }}
                    <span class="text-primary-600" aria-hidden="true">*</span>
                  </label>
                  <InputNumber
                    v-model="severanceGross"
                    input-id="severanceGross"
                    name="severanceGross"
                    :min="0"
                    :step="1000"
                    mode="currency"
                    currency="EUR"
                    locale="de-DE"
                    size="small"
                    show-buttons
                    fluid
                  />
                  <Message v-if="hasSubmitted && $form.severanceGross?.invalid" severity="error" size="small" variant="simple">
                    {{ $form.severanceGross.error?.message }}
                  </Message>
                  <Message v-else-if="validationErrors.severanceGross" severity="error" size="small" variant="simple">
                    {{ validationErrors.severanceGross }}
                  </Message>
                </div>

                <div class="flex flex-col gap-2">
                  <label for="unemploymentDate">
                    {{ t('form.unemploymentDate') }}
                    <span class="text-primary-600" aria-hidden="true">*</span>
                  </label>
                  <DatePicker v-model="unemploymentDate" input-id="unemploymentDate" date-format="dd.mm.yy" size="small" show-icon fluid />
                  <Message v-if="validationErrors.unemploymentDate" severity="error" size="small" variant="simple">
                    {{ validationErrors.unemploymentDate }}
                  </Message>
                </div>

                <!-- 由 Beginn Arbeitslosigkeit 推算的两个可能的 Abfindung 发放日期（只读，作为 Fünftelregelung 对比基准） -->
                <div class="flex flex-col gap-2">
                  <div class="flex items-center gap-2">
                    <span class="text-sm text-surface-700">{{ t('form.possibleSeverancePaymentDates') }}</span>
                    <button
                      v-tooltip.right="{
                        value: possibleSeverancePaymentDatesTooltip,
                        escape: false,
                        class: 'tax-class-tooltip',
                        showDelay: 150
                      }"
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
                      v-tooltip.right="{
                        value: oldEmployerIncomeCurrentYearTooltip,
                        escape: false,
                        class: 'tax-class-tooltip',
                        showDelay: 150
                      }"
                      type="button"
                      class="pi pi-info-circle cursor-help border-0 bg-transparent p-0 text-primary-600"
                      :aria-label="t('form.oldEmployerIncomeCurrentYearAriaLabel')"
                    ></button>
                  </div>
                  <InputNumber
                    v-model="oldEmployerIncomeCurrentYear"
                    input-id="oldEmployerIncomeCurrentYear"
                    :min="0"
                    :step="1000"
                    mode="currency"
                    currency="EUR"
                    locale="de-DE"
                    size="small"
                    show-buttons
                    fluid
                  />
                </div>

                <div class="flex flex-col gap-2">
                  <div class="flex items-center gap-2">
                    <label for="lastMonthlyGrossBeforeUnemployment">{{ t('form.lastMonthlyGrossBeforeUnemployment') }}</label>
                    <button
                      v-tooltip.right="{
                        value: lastMonthlyGrossBeforeUnemploymentTooltip,
                        escape: false,
                        class: 'tax-class-tooltip',
                        showDelay: 150
                      }"
                      type="button"
                      class="pi pi-info-circle cursor-help border-0 bg-transparent p-0 text-primary-600"
                      :aria-label="t('form.lastMonthlyGrossBeforeUnemploymentAriaLabel')"
                    ></button>
                  </div>
                  <InputNumber
                    v-model="lastMonthlyGrossBeforeUnemployment"
                    input-id="lastMonthlyGrossBeforeUnemployment"
                    :min="0"
                    :step="100"
                    mode="currency"
                    currency="EUR"
                    locale="de-DE"
                    size="small"
                    show-buttons
                    fluid
                  />
                </div>

                <div class="flex flex-col gap-2">
                  <div class="flex items-center gap-2">
                    <label for="unemploymentBenefitMonthly">{{ t('form.unemploymentBenefitMonthly') }}</label>
                    <button
                      v-tooltip.right="{
                        value: unemploymentBenefitMonthlyTooltip,
                        escape: false,
                        class: 'tax-class-tooltip',
                        showDelay: 150
                      }"
                      type="button"
                      class="pi pi-info-circle cursor-help border-0 bg-transparent p-0 text-primary-600"
                      :aria-label="t('form.unemploymentBenefitMonthlyAriaLabel')"
                    ></button>
                  </div>
                  <InputNumber
                    v-model="unemploymentBenefitMonthly"
                    input-id="unemploymentBenefitMonthly"
                    :min="0"
                    :step="100"
                    mode="currency"
                    currency="EUR"
                    locale="de-DE"
                    size="small"
                    show-buttons
                    fluid
                  />
                </div>

                <div class="flex flex-col gap-2">
                  <div class="flex items-center gap-2">
                    <label for="alvInsuranceMonthsLast5Years">{{ t('form.alvInsuranceMonthsLast5Years') }}</label>
                    <button
                      v-tooltip.right="{
                        value: alvInsuranceMonthsLast5YearsTooltip,
                        escape: false,
                        class: 'tax-class-tooltip',
                        showDelay: 150
                      }"
                      type="button"
                      class="pi pi-info-circle cursor-help border-0 bg-transparent p-0 text-primary-600"
                      :aria-label="t('form.alvInsuranceMonthsLast5YearsAriaLabel')"
                    ></button>
                  </div>
                  <InputNumber
                    v-model="alvInsuranceMonthsLast5Years"
                    input-id="alvInsuranceMonthsLast5Years"
                    :min="0"
                    :max="60"
                    :step="1"
                    :min-fraction-digits="0"
                    :max-fraction-digits="0"
                    :suffix="t('form.monthsSuffix')"
                    locale="de-DE"
                    size="small"
                    show-buttons
                    fluid
                  />
                </div>

                <div class="flex flex-col gap-2">
                  <div class="flex items-center gap-2">
                    <label for="unemploymentBenefitDurationMonths">{{ t('form.unemploymentBenefitDurationMonths') }}</label>
                    <button
                      v-tooltip.right="{
                        value: unemploymentBenefitDurationTooltip,
                        escape: false,
                        class: 'tax-class-tooltip',
                        showDelay: 150
                      }"
                      type="button"
                      class="pi pi-info-circle cursor-help border-0 bg-transparent p-0 text-primary-600"
                      :aria-label="t('form.unemploymentBenefitDurationMonths')"
                    ></button>
                  </div>
                  <InputNumber
                    :model-value="unemploymentBenefitDurationMonths"
                    input-id="unemploymentBenefitDurationMonths"
                    :suffix="t('form.monthsSuffix')"
                    size="small"
                    disabled
                    fluid
                  />
                </div>

                <div class="flex items-center justify-between gap-4">
                  <div class="flex items-center gap-2">
                    <label for="hasBenefitReductionPeriod">{{ t('form.hasBenefitReductionPeriod') }}</label>
                    <button
                      v-tooltip.right="{
                        value: benefitReductionPeriodTooltip,
                        escape: false,
                        class: 'tax-class-tooltip',
                        showDelay: 150
                      }"
                      type="button"
                      class="pi pi-info-circle cursor-help border-0 bg-transparent p-0 text-primary-600"
                      :aria-label="t('form.hasBenefitReductionPeriod')"
                    ></button>
                  </div>
                  <ToggleSwitch v-model="hasBenefitReductionPeriod" input-id="hasBenefitReductionPeriod" />
                </div>

                <div v-if="hasBenefitReductionPeriod" class="flex flex-col gap-2">
                  <label for="benefitReductionMonths">
                    {{ t('form.benefitReductionMonths') }}
                    <span class="text-primary-600" aria-hidden="true">*</span>
                  </label>
                  <InputNumber
                    v-model="benefitReductionMonths"
                    input-id="benefitReductionMonths"
                    :min="1"
                    :max="3"
                    :step="1"
                    :min-fraction-digits="0"
                    :max-fraction-digits="0"
                    :suffix="t('form.monthsSuffix')"
                    size="small"
                    show-buttons
                    fluid
                  />
                  <Message v-if="validationErrors.benefitReductionMonths" severity="error" size="small" variant="simple">
                    {{ validationErrors.benefitReductionMonths }}
                  </Message>
                </div>

                <div class="flex items-center justify-between gap-4">
                  <div class="flex items-center gap-2">
                    <label for="hasBenefitSuspensionPeriod">{{ t('form.hasBenefitSuspensionPeriod') }}</label>
                    <button
                      v-tooltip.right="{
                        value: benefitSuspensionPeriodTooltip,
                        escape: false,
                        class: 'tax-class-tooltip',
                        showDelay: 150
                      }"
                      type="button"
                      class="pi pi-info-circle cursor-help border-0 bg-transparent p-0 text-primary-600"
                      :aria-label="t('form.hasBenefitSuspensionPeriod')"
                    ></button>
                  </div>
                  <ToggleSwitch v-model="hasBenefitSuspensionPeriod" input-id="hasBenefitSuspensionPeriod" />
                </div>

                <div v-if="hasBenefitSuspensionPeriod" class="flex flex-col gap-2">
                  <label for="benefitSuspensionMonths">
                    {{ t('form.benefitSuspensionMonths') }}
                    <span class="text-primary-600" aria-hidden="true">*</span>
                  </label>
                  <InputNumber
                    v-model="benefitSuspensionMonths"
                    input-id="benefitSuspensionMonths"
                    :min="1"
                    :max="12"
                    :step="1"
                    :min-fraction-digits="0"
                    :max-fraction-digits="0"
                    :suffix="t('form.monthsSuffix')"
                    size="small"
                    show-buttons
                    fluid
                  />
                  <Message v-if="validationErrors.benefitSuspensionMonths" severity="error" size="small" variant="simple">
                    {{ validationErrors.benefitSuspensionMonths }}
                  </Message>
                </div>
              </div>
            </section>

            <!-- V&V -->
            <section class="rounded border border-surface-200 bg-surface-50 p-4">
              <h2 class="mb-4 text-base font-semibold text-surface-900">{{ t('form.rentalIncomeSection') }}</h2>
              <div class="flex flex-col gap-4">
                <div class="flex flex-col gap-2">
                  <div class="flex items-center gap-2">
                    <label for="rentalIncomeYearly">{{ t('form.rentalIncomeYearly') }}</label>
                    <button
                      v-tooltip.right="{
                        value: rentalIncomeYearlyTooltip,
                        escape: false,
                        class: 'tax-class-tooltip',
                        showDelay: 150
                      }"
                      type="button"
                      class="pi pi-info-circle cursor-help border-0 bg-transparent p-0 text-primary-600"
                      :aria-label="t('form.rentalIncomeYearlyAriaLabel')"
                    ></button>
                  </div>
                  <InputNumber
                    v-model="rentalIncomeYearly"
                    input-id="rentalIncomeYearly"
                    :min="0"
                    :step="1000"
                    mode="currency"
                    currency="EUR"
                    locale="de-DE"
                    size="small"
                    show-buttons
                    fluid
                  />
                </div>

                <div v-if="withSpouse" class="flex flex-col gap-2">
                  <label for="sharedIncomeUserShare">{{ t('form.sharedIncomeUserShare') }}</label>
                  <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                    <InputNumber
                      v-model="sharedIncomeUserShare"
                      input-id="sharedIncomeUserShare"
                      :min="0"
                      :max="100"
                      :step="1"
                      :min-fraction-digits="0"
                      :max-fraction-digits="0"
                      suffix=" %"
                      size="small"
                      show-buttons
                      fluid
                    />
                    <span class="font-semibold text-surface-500">/</span>
                    <InputNumber
                      :model-value="sharedIncomeSpouseShare"
                      :min-fraction-digits="0"
                      :max-fraction-digits="0"
                      suffix=" %"
                      size="small"
                      disabled
                      fluid
                      :aria-label="t('form.sharedIncomeSpouseShare')"
                    />
                  </div>
                  <Message v-if="validationErrors.sharedIncomeUserShare" severity="error" size="small" variant="simple">
                    {{ validationErrors.sharedIncomeUserShare }}
                  </Message>
                </div>
              </div>
            </section>

            <!-- Spenden (§ 10b EStG) -->
            <section class="rounded border border-surface-200 bg-surface-50 p-4">
              <div class="mb-4 flex items-center gap-2">
                <h2 class="text-base font-semibold text-surface-900">{{ t('form.donationSection') }}</h2>
                <button
                  v-tooltip.right="{
                    value: donationSectionTooltip,
                    escape: false,
                    class: 'tax-class-tooltip',
                    showDelay: 150
                  }"
                  type="button"
                  class="pi pi-info-circle cursor-help border-0 bg-transparent p-0 text-primary-600"
                  :aria-label="t('form.donationSectionAriaLabel')"
                ></button>
              </div>
              <div class="flex flex-col gap-4">
                <div class="flex flex-col gap-2">
                  <label for="donationYearly">{{ t('form.donationYearly') }}</label>
                  <InputNumber
                    v-model="donationYearly"
                    input-id="donationYearly"
                    :min="0"
                    :step="100"
                    mode="currency"
                    currency="EUR"
                    locale="de-DE"
                    size="small"
                    show-buttons
                    fluid
                  />
                </div>

                <div v-if="withSpouse" class="flex flex-col gap-2">
                  <label for="sharedDonationUserShare">{{ t('form.sharedDonationUserShare') }}</label>
                  <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                    <InputNumber
                      v-model="sharedDonationUserShare"
                      input-id="sharedDonationUserShare"
                      :min="0"
                      :max="100"
                      :step="1"
                      :min-fraction-digits="0"
                      :max-fraction-digits="0"
                      suffix=" %"
                      size="small"
                      show-buttons
                      fluid
                    />
                    <span class="font-semibold text-surface-500">/</span>
                    <InputNumber
                      :model-value="sharedDonationSpouseShare"
                      :min-fraction-digits="0"
                      :max-fraction-digits="0"
                      suffix=" %"
                      size="small"
                      disabled
                      fluid
                      :aria-label="t('form.sharedDonationSpouseShare')"
                    />
                  </div>
                </div>
              </div>
            </section>

            <div v-if="withSpouse" class="flex flex-col gap-2">
              <label for="spouseGrossIncomeYearly">{{ t('form.spouseGrossIncomeYearly') }}</label>
              <InputNumber
                v-model="spouseGrossIncomeYearly"
                input-id="spouseGrossIncomeYearly"
                :min="0"
                :step="1000"
                mode="currency"
                currency="EUR"
                locale="de-DE"
                size="small"
                show-buttons
                fluid
              />
            </div>

            <div class="flex flex-col gap-2">
              <label for="otherIncomeYearly">{{ t('form.otherIncomeYearly') }}</label>
              <InputNumber
                v-model="otherIncomeYearly"
                input-id="otherIncomeYearly"
                :min="0"
                :step="1000"
                mode="currency"
                currency="EUR"
                locale="de-DE"
                size="small"
                show-buttons
                fluid
              />
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
