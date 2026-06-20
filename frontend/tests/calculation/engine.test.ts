import { describe, expect, it } from 'vitest';

import { calcPersonIncome } from '../../src/calculation/engine';
import type { PersonIncomeData, ScenarioOverride } from '../../src/calculation/types';

const basePerson: PersonIncomeData = {
  personKey: 'user',
  monthlyGrossOldJob: 6000,
  lastMonthlyGrossBeforeUnemployment: 6000,
  unemployed: true,
  unemploymentDate: new Date(2026, 2, 1),
  algStartDate: new Date(2026, 2, 1),
  monthlyUnemploymentBenefit: 2200,
  unemploymentBenefitDuration: 3,
  severance: 24000,
  rentalIncome: 1200,
  annualDonation: 0
};

const baseScenario: ScenarioOverride = {
  newJobStartDate: null,
  monthlyGrossNewJob: 7000,
  severancePaymentDate: new Date(2026, 2, 15)
};

describe('calcPersonIncome', () => {
  it('splits old job, unemployment benefit, severance, and self-paid health insurance into the tax year', () => {
    const result = calcPersonIncome(basePerson, baseScenario, 2026);

    expect(result.oldJobWage).toBe(12000);
    expect(result.newJobWage).toBe(0);
    expect(result.unemploymentBenefit).toBe(6600);
    expect(result.severance).toBe(24000);
    expect(result.rentalIncome).toBe(1200);
    expect(result.svSegments).toEqual([{ kind: 'oldJob', monthlyGross: 6000, months: 2 }]);
    expect(result.selfPaidHealthInsuranceSegments).toEqual([
      {
        kind: 'postAlgUnemployed',
        monthlyGrossBeforeCap: 6000,
        monthlyAssessment: 5812.5,
        months: 2
      }
    ]);
  });

  it('uses the new job start date to end unemployment benefit and start new wages', () => {
    const result = calcPersonIncome(
      basePerson,
      {
        ...baseScenario,
        newJobStartDate: new Date(2026, 4, 1)
      },
      2026
    );

    expect(result.newJobWage).toBe(56000);
    expect(result.unemploymentBenefit).toBe(4400);
    expect(result.svSegments).toEqual([
      { kind: 'oldJob', monthlyGross: 6000, months: 2 },
      { kind: 'newJob', monthlyGross: 7000, months: 8 }
    ]);
    expect(result.selfPaidHealthInsuranceSegments).toEqual([]);
  });

  it('ignores scenario-only severance and new job data for the spouse', () => {
    const result = calcPersonIncome(
      {
        ...basePerson,
        personKey: 'spouse',
        unemploymentDate: null,
        algStartDate: null,
        unemploymentBenefitDuration: 0,
        severance: 24000
      },
      baseScenario,
      2026
    );

    expect(result.oldJobWage).toBe(72000);
    expect(result.newJobWage).toBe(0);
    expect(result.unemploymentBenefit).toBe(0);
    expect(result.severance).toBe(0);
    expect(result.selfPaidHealthInsuranceSegments).toEqual([]);
  });

  it('uses the unemployment date as ALG coverage end when no benefit duration exists', () => {
    const result = calcPersonIncome(
      {
        ...basePerson,
        monthlyUnemploymentBenefit: 0,
        unemploymentBenefitDuration: 0
      },
      baseScenario,
      2026
    );

    expect(result.unemploymentBenefit).toBe(0);
    expect(result.selfPaidHealthInsuranceSegments).toEqual([
      {
        kind: 'postAlgUnemployed',
        monthlyGrossBeforeCap: 6000,
        monthlyAssessment: 5812.5,
        months: 4
      }
    ]);
  });
});
