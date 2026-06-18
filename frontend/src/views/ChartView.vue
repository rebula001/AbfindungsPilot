<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import ScenarioChart from '../components/ScenarioChart.vue';
import { useScenarioChartData } from '../composables/useScenarioChartData';

const { t } = useI18n();

// EmptyStateOverlay wird auf Panel-Ebene in App.vue gerendert (gilt fuer Berechnung + Diagramm einheitlich) - hier bewusst nicht erneut.
const {
  hasData,
  isSingleMode,
  scenarioRows,
  scenarioRowsSplit,
  liegenNettoJoint,
  liegenNettoSplit,
  payDateFolgejahr,
  periodEnd,
} = useScenarioChartData();

const euroFmt = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const dateFmt = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const REFERENCE_COLOR = 'rgb(107, 114, 128)';

const referenceLineJoint = computed(() =>
  liegenNettoJoint.value === null
    ? undefined
    : {
        value: liegenNettoJoint.value,
        label: t('chart.legend.referenceLabel'),
        color: REFERENCE_COLOR,
      },
);

const referenceLineSplit = computed(() =>
  liegenNettoSplit.value === null
    ? undefined
    : {
        value: liegenNettoSplit.value,
        label: t('chart.legend.referenceLabel'),
        color: REFERENCE_COLOR,
      },
);

const PER_MONTH_LOW = 2500;
const PER_MONTH_HIGH = 3000;

type PerMonthVerdictType = 'negative' | 'low' | 'mid' | 'high';

function perMonthVerdictType(perMonth: number): PerMonthVerdictType {
  if (perMonth < 0) return 'negative';
  if (perMonth < PER_MONTH_LOW) return 'low';
  if (perMonth < PER_MONTH_HIGH) return 'mid';
  return 'high';
}

function monthsWorkedUntil(start: Date, end: Date): number {
  return Math.max(0, (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1);
}

type BestVerdict = {
  type: PerMonthVerdictType;
  text: string;
};

function buildBestPerMonth(
  rows: typeof scenarioRows.value,
  liegen: number | null,
  veranlagungLabel: string,
): BestVerdict | null {
  if (rows.length === 0 || liegen === null || !periodEnd.value) return null;

  let bestPerMonth = -Infinity;
  let bestRow: (typeof rows)[number] | null = null;
  let bestMonths = 0;
  let bestDelta = 0;

  for (const r of rows) {
    const months = monthsWorkedUntil(r.newJobStartDate, periodEnd.value);
    if (months <= 0) continue;

    const delta = r.netto - liegen;
    const perMonth = delta / months;

    if (perMonth > bestPerMonth) {
      bestPerMonth = perMonth;
      bestRow = r;
      bestMonths = months;
      bestDelta = delta;
    }
  }

  if (!bestRow) return null;

  const type = perMonthVerdictType(bestPerMonth);
  const params = {
    veranlagungLabel,
    start: dateFmt.format(bestRow.newJobStartDate),
    gross: euroFmt.format(bestRow.monthlyGrossNewJob),
    payDate: dateFmt.format(bestRow.severancePaymentDate),
    perMonth: euroFmt.format(Math.round(bestPerMonth)),
    months: bestMonths,
    delta: euroFmt.format(Math.round(bestDelta)),
    netto: euroFmt.format(Math.round(bestRow.netto)),
    verdict: t(`chart.summary.perMonthVerdict.${type}`),
  };

  return {
    type,
    text: t(isSingleMode.value ? 'chart.summary.bestPerMonthSingle' : 'chart.summary.bestPerMonth', params),
  };
}

const verdictJoint = computed(() =>
  buildBestPerMonth(scenarioRows.value, liegenNettoJoint.value, t('chart.summary.veranlagungJoint')),
);

const verdictSplit = computed(() =>
  buildBestPerMonth(
    scenarioRowsSplit.value,
    liegenNettoSplit.value,
    t('chart.summary.veranlagungSplit'),
  ),
);

const referenceIntro = computed(() => {
  if (liegenNettoJoint.value === null || liegenNettoSplit.value === null || payDateFolgejahr.value === null) {
    return '';
  }

  if (isSingleMode.value) {
    return t('chart.summary.referenceIntroSingle', {
      value: euroFmt.format(Math.round(liegenNettoJoint.value)),
      payDateFolgejahr: dateFmt.format(payDateFolgejahr.value),
    });
  }

  return t('chart.summary.referenceIntro', {
    jointValue: euroFmt.format(Math.round(liegenNettoJoint.value)),
    splitValue: euroFmt.format(Math.round(liegenNettoSplit.value)),
    payDateFolgejahr: dateFmt.format(payDateFolgejahr.value),
  });
});

function verdictBoxClass(type: PerMonthVerdictType): string {
  if (type === 'high') {
    return 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100';
  }
  if (type === 'mid') {
    return 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800 text-sky-900 dark:text-sky-100';
  }
  if (type === 'low') {
    return 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100';
  }

  return 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-100';
}
</script>

<template>
  <section class="relative flex flex-col gap-10">
    <h1 class="text-2xl font-semibold text-primary-700 dark:text-primary-300">
      {{ t('views.chart.title') }}
    </h1>

    <article
      v-if="hasData"
      class="flex flex-col gap-4 rounded-lg border border-primary-200 bg-primary-50/60 px-6 py-5 text-sm leading-relaxed text-surface-800 dark:border-primary-800 dark:bg-primary-950/40 dark:text-surface-100"
    >
      <h2 class="text-base font-semibold text-primary-700 dark:text-primary-300">
        {{ t('chart.summary.heading') }}
      </h2>

      <p>{{ referenceIntro }}</p>

      <div v-if="verdictJoint" :class="['rounded-md border p-4', verdictBoxClass(verdictJoint.type)]">
        <!-- eslint-disable-next-line vue/no-v-html -->
        <p class="font-medium" v-html="verdictJoint.text" />
      </div>

      <div
        v-if="!isSingleMode && verdictSplit"
        :class="['rounded-md border p-4', verdictBoxClass(verdictSplit.type)]"
      >
        <!-- eslint-disable-next-line vue/no-v-html -->
        <p class="font-medium" v-html="verdictSplit.text" />
      </div>

      <div
        class="flex flex-col gap-4 rounded-md border border-surface-200 bg-surface-100 p-4 text-surface-700 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-200"
      >
        <div class="flex flex-col gap-2">
          <h3 class="font-semibold">{{ t('chart.summary.insightTitle') }}</h3>
          <ul class="list-disc pl-5 text-xs flex flex-col gap-1">
            <li>{{ t('chart.summary.insightFuenftel') }}</li>
            <li>{{ t('chart.summary.insightProgression') }}</li>
            <li>{{ t('chart.summary.insightSv') }}</li>
          </ul>
        </div>

        <div class="flex flex-col gap-2">
          <h3 class="font-semibold">{{ t('chart.summary.insightTimingTitle') }}</h3>
          <ul class="list-disc pl-5 text-xs flex flex-col gap-1">
            <li>{{ t('chart.summary.insightTimingPayDate') }}</li>
            <!-- eslint-disable-next-line vue/no-v-html -->
            <li v-html="t('chart.summary.insightTimingStart')" />
          </ul>
        </div>

        <div class="flex flex-col gap-2">
          <h3 class="font-semibold">{{ t('chart.summary.benchmarkTitle') }}</h3>
          <!-- eslint-disable-next-line vue/no-v-html -->
          <p class="text-xs leading-relaxed" v-html="t('chart.summary.benchmarkBody')" />
        </div>
      </div>
    </article>

    <ScenarioChart
      :rows="scenarioRows"
      :title="t(isSingleMode ? 'chart.szenarioSingle.title' : 'chart.szenario.title')"
      :description="t(isSingleMode ? 'chart.szenarioSingle.description' : 'chart.szenario.description')"
      :x-axis="t(isSingleMode ? 'chart.szenarioSingle.xAxis' : 'chart.szenario.xAxis')"
      :y-axis="t(isSingleMode ? 'chart.szenarioSingle.yAxis' : 'chart.szenario.yAxis')"
      :reference-line="referenceLineJoint"
      :period-end="periodEnd ?? undefined"
    />

    <ScenarioChart
      v-if="!isSingleMode"
      :rows="scenarioRowsSplit"
      :title="t('chart.szenarioSplit.title')"
      :description="t('chart.szenarioSplit.description')"
      :x-axis="t('chart.szenarioSplit.xAxis')"
      :y-axis="t('chart.szenarioSplit.yAxis')"
      :reference-line="referenceLineSplit"
      :period-end="periodEnd ?? undefined"
    />
  </section>
</template>
