import { ref } from 'vue';

export type InsuranceKind = 'statutoryMandatory' | 'private' | 'voluntaryStatutory';
export type SocialInsuranceKind = 'notMandatory' | 'statutoryMandatory' | 'employerOnly' | 'employeeOnly';

export interface UserInputSnapshot {
  taxClass: string;
  taxClassFactor: number;
  paysChurchTax: boolean;
  federalState: string | null;
  healthInsurance: InsuranceKind;
  healthInsuranceAdditionalRate: number;
  privateHealthInsuranceAnnual: number;
  privateCareInsuranceAnnual: number;
  hasChildren: boolean;
  childrenUnder25: number;
  isAlleinerziehend: boolean;
  childAllowance: number;
  childBenefitMonthlyPerChild: number;
  age: number;
  pensionInsurance: SocialInsuranceKind;
  unemploymentInsurance: SocialInsuranceKind;

  withSpouse: boolean;
  spouseTaxClass: string;
  spouseTaxClassFactor: number;
  spousePaysChurchTax: boolean;
  spouseHealthInsurance: InsuranceKind;
  spouseHealthInsuranceAdditionalRate: number;
  spousePrivateHealthInsuranceAnnual: number;
  spousePrivateCareInsuranceAnnual: number;
  spousePensionInsurance: SocialInsuranceKind;
  spouseUnemploymentInsurance: SocialInsuranceKind;
  spouseAge: number;

  hasNewJob: boolean;
  expectedMonthlySalaryMin: number;
  expectedMonthlySalaryMax: number;
  expectedMonthlySalaryStep: number;
  newJobStartDate: string | null;
  newJobMonthlySalary: number;
  severanceGross: number;
  unemploymentDate: string | null;
  oldEmployerIncomeCurrentYear: number;
  lastMonthlyGrossBeforeUnemployment: number;
  unemploymentBenefitMonthly: number;
  alvInsuranceMonthsLast5Years: number;
  hasBenefitReductionPeriod: boolean;
  benefitReductionMonths: number;
  hasBenefitSuspensionPeriod: boolean;
  benefitSuspensionMonths: number;
  rentalIncomeYearly: number;
  sharedIncomeUserShare: number;
  donationYearly: number;
  sharedDonationUserShare: number;
  spouseGrossIncomeYearly: number;
  otherIncomeYearly: number;
}

const STORAGE_KEY = 'abfindungspilot.input.v1';
const STORAGE_TTL_MS = 3 * 60 * 60 * 1000;

interface StoredEnvelope {
  savedAt: number;
  data: UserInputSnapshot;
}

function loadFromStorage(): UserInputSnapshot | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<StoredEnvelope> | null;
    if (!parsed || typeof parsed.savedAt !== 'number' || !parsed.data) return null;

    if (Date.now() - parsed.savedAt > STORAGE_TTL_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return parsed.data;
  } catch {
    return null;
  }
}

const committedInput = ref<UserInputSnapshot | null>(loadFromStorage());

function commit(snapshot: UserInputSnapshot): void {
  committedInput.value = snapshot;

  try {
    const envelope: StoredEnvelope = { savedAt: Date.now(), data: snapshot };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
  } catch (err) {
    console.warn('[useUserInput] persist failed', err);
  }
}

function clear(): void {
  committedInput.value = null;

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function useUserInput() {
  return { committedInput, commit, clear };
}
