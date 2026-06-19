<script setup lang="ts">
import { computed, ref } from 'vue';
import Chart from 'primevue/chart';
import { useI18n } from 'vue-i18n';

import type { ScenarioRow } from '../composables/useScenarioChartData';

const { t } = useI18n();

const props = defineProps<{
  rows: ScenarioRow[];
  title: string;
  description: string;
  xAxis: string;
  yAxis: string;
  referenceLine?: { value: number; label: string; color?: string };
  periodEnd?: Date;
}>();

const dateFormatter = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric'
});

const euroFormatter = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
});

const PER_MONTH_LOW = 2500;
const PER_MONTH_HIGH = 3000;

function perMonthVerdictKey(perMonth: number): string {
  if (perMonth < 0) return 'chart.tooltip.perMonthVerdict.negative';
  if (perMonth < PER_MONTH_LOW) return 'chart.tooltip.perMonthVerdict.low';
  if (perMonth < PER_MONTH_HIGH) return 'chart.tooltip.perMonthVerdict.mid';
  return 'chart.tooltip.perMonthVerdict.high';
}

function formatPerMonthLine(diff: number, months: number): string {
  const perMonth = diff / months;
  return t('chart.tooltip.perMonth', {
    amount: euroFormatter.format(perMonth),
    verdict: t(perMonthVerdictKey(perMonth))
  });
}

const chartData = computed(() => {
  const groups = new Map<string, { payDate: Date; gross: number; rows: ScenarioRow[] }>();
  for (const r of props.rows) {
    const key = `${r.severancePaymentDate.toISOString()}|${r.monthlyGrossNewJob}`;
    if (!groups.has(key)) {
      groups.set(key, { payDate: r.severancePaymentDate, gross: r.monthlyGrossNewJob, rows: [] });
    }
    groups.get(key)!.rows.push(r);
  }

  const startDates = [...new Set(props.rows.map((r) => r.newJobStartDate.getTime()))].sort((a, b) => a - b).map((t) => new Date(t));

  const SALARY_PALETTE = [
    'rgb(255, 0, 0)',
    'rgb(255, 165, 0)',
    'rgb(255, 215, 0)',
    'rgb(0, 180, 0)',
    'rgb(0, 200, 200)',
    'rgb(0, 90, 255)',
    'rgb(150, 0, 200)'
  ];

  const uniqueGrosses = [...new Set(props.rows.map((r) => r.monthlyGrossNewJob))].sort((a, b) => a - b);
  const grossColors = new Map<number, string>(uniqueGrosses.map((g, i) => [g, SALARY_PALETTE[i % SALARY_PALETTE.length]]));
  const payDateDash = new Map<string, number[]>();
  const uniquePayDates = [...new Set(props.rows.map((r) => r.severancePaymentDate.toISOString()))].sort();
  uniquePayDates.forEach((iso, idx) => payDateDash.set(iso, idx === 0 ? [] : [6, 4]));

  return {
    labels: startDates.map((d) => dateFormatter.format(d)),
    datasets: [
      ...[...groups.values()].map((g) => {
        const color = grossColors.get(g.gross) ?? 'rgb(100, 116, 139)';
        return {
          label: `${euroFormatter.format(g.gross)} / ${t('chart.legend.auszahlungPrefix')} ${dateFormatter.format(g.payDate)}`,
          data: startDates.map((sd) => g.rows.find((r) => r.newJobStartDate.getTime() === sd.getTime())?.netto ?? null),
          borderColor: color,
          backgroundColor: color,
          borderDash: payDateDash.get(g.payDate.toISOString()) ?? [],
          tension: 0.3,
          fill: false,
          pointRadius: 3,
          pointHoverRadius: 5
        };
      }),
      ...(props.referenceLine
        ? [
            {
              label: `${props.referenceLine.label}: ${euroFormatter.format(props.referenceLine.value)}`,
              data: startDates.map(() => props.referenceLine!.value),
              borderColor: props.referenceLine.color ?? 'rgb(220, 38, 38)',
              backgroundColor: props.referenceLine.color ?? 'rgb(220, 38, 38)',
              borderDash: [],
              borderWidth: 2,
              tension: 0,
              fill: false,
              pointRadius: 0,
              pointHoverRadius: 0,
              order: -1
            }
          ]
        : [])
    ]
  };
});

const legendItems = computed(() =>
  chartData.value.datasets.map((ds, index) => {
    const isDashed = Array.isArray(ds.borderDash) && ds.borderDash.length > 0;
    const color = (ds.borderColor as string) ?? 'rgb(100, 116, 139)';
    return { label: ds.label ?? '', color, isDashed, index };
  })
);

const datasetRows = computed<(ScenarioRow | null)[][]>(() => {
  const groups = new Map<string, { payDate: Date; gross: number; rows: ScenarioRow[] }>();
  for (const r of props.rows) {
    const key = `${r.severancePaymentDate.toISOString()}|${r.monthlyGrossNewJob}`;
    if (!groups.has(key)) {
      groups.set(key, { payDate: r.severancePaymentDate, gross: r.monthlyGrossNewJob, rows: [] });
    }
    groups.get(key)!.rows.push(r);
  }

  const startDates = [...new Set(props.rows.map((r) => r.newJobStartDate.getTime()))].sort((a, b) => a - b).map((t) => new Date(t));

  const result = [...groups.values()].map((g) => startDates.map((sd) => g.rows.find((r) => r.newJobStartDate.getTime() === sd.getTime()) ?? null));
  if (props.referenceLine) result.push(startDates.map(() => null));
  return result;
});

function monthsWorkedUntil(start: Date, end: Date): number {
  return Math.max(0, (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1);
}

type LegendItem = { label: string; color: string; isDashed: boolean; index: number };
type LegendGroup = {
  key: string;
  solid: LegendItem | null;
  dashed: LegendItem | null;
  isReference: boolean;
};

const legendGroups = computed<LegendGroup[]>(() => {
  const groups = new Map<string, LegendGroup>();
  const refGroups: LegendGroup[] = [];

  for (const item of legendItems.value) {
    const isLast = item.index === chartData.value.datasets.length - 1 && !!props.referenceLine;
    if (isLast) {
      refGroups.push({ key: `ref-${item.index}`, solid: item, dashed: null, isReference: true });
      continue;
    }

    let group = groups.get(item.color);
    if (!group) {
      group = { key: item.color, solid: null, dashed: null, isReference: false };
      groups.set(item.color, group);
    }

    if (item.isDashed) group.dashed = item;
    else group.solid = item;
  }

  return [...groups.values(), ...refGroups];
});

const diffBetweenActivePair = computed(() => {
  const visible = chartData.value.datasets.map((ds, index) => ({ ds, index })).filter(({ index }) => !hiddenDatasets.value.has(index));
  if (visible.length !== 2) return null;

  const peakOf = (ds: { label?: string; data: (number | null)[]; borderColor?: string; borderDash?: number[] }) => {
    let peak = -Infinity;
    let peakIdx = -1;
    ds.data.forEach((v, i) => {
      if (v !== null && v > peak) {
        peak = v;
        peakIdx = i;
      }
    });
    return peakIdx >= 0
      ? {
          label: ds.label ?? '',
          value: peak,
          dateLabel: chartData.value.labels[peakIdx],
          color: (ds.borderColor as string) ?? 'rgb(100, 116, 139)',
          isDashed: Array.isArray(ds.borderDash) && ds.borderDash.length > 0
        }
      : null;
  };

  const a = peakOf(visible[0].ds as never);
  const b = peakOf(visible[1].ds as never);
  if (!a || !b) return null;
  const [hi, lo] = a.value > b.value ? [a, b] : [b, a];
  return { hi, lo, diff: hi.value - lo.value };
});

const chartRef = ref<InstanceType<typeof Chart> | null>(null);
const hiddenDatasets = ref<Set<number>>(new Set());

const BAR_PALETTE = [
  { fill: 'rgba(255, 159, 64, 0.45)', border: 'rgb(255, 159, 64)' },
  { fill: 'rgba(75, 192, 192, 0.45)', border: 'rgb(75, 192, 192)' },
  { fill: 'rgba(153, 102, 255, 0.45)', border: 'rgb(153, 102, 255)' },
  { fill: 'rgba(255, 99, 132, 0.45)', border: 'rgb(255, 99, 132)' },
  { fill: 'rgba(201, 203, 70, 0.45)', border: 'rgb(201, 203, 70)' },
  { fill: 'rgba(54, 162, 235, 0.45)', border: 'rgb(54, 162, 235)' },
  { fill: 'rgba(255, 205, 86, 0.45)', border: 'rgb(255, 205, 86)' }
];
const REFERENCE_BAR = { fill: 'rgba(148, 163, 184, 0.35)', border: 'rgb(100, 116, 139)' };

const isBarMode = computed(() => {
  const starts = new Set(props.rows.map((r) => r.newJobStartDate.getTime()));
  return starts.size <= 1 && props.rows.length > 0;
});

type BarRowMeta = { row: ScenarioRow | null; isReference: boolean };

const barRows = computed<BarRowMeta[]>(() => {
  const out: BarRowMeta[] = [];
  if (props.referenceLine) out.push({ row: null, isReference: true });

  const sorted = [...props.rows].sort((a, b) => {
    const dt = a.severancePaymentDate.getTime() - b.severancePaymentDate.getTime();
    return dt === 0 ? a.monthlyGrossNewJob - b.monthlyGrossNewJob : dt;
  });

  for (const r of sorted) out.push({ row: r, isReference: false });
  return out;
});

const barChartData = computed(() => {
  const labels: string[] = [];
  const data: number[] = [];
  const fills: string[] = [];
  const borders: string[] = [];
  let scenarioIdx = 0;

  for (const meta of barRows.value) {
    if (meta.isReference && props.referenceLine) {
      labels.push(props.referenceLine.label);
      data.push(props.referenceLine.value);
      fills.push(REFERENCE_BAR.fill);
      borders.push(REFERENCE_BAR.border);
    } else if (meta.row) {
      const r = meta.row;
      labels.push(
        `${euroFormatter.format(r.monthlyGrossNewJob)} · ${t('chart.legend.auszahlungPrefix')} ${dateFormatter.format(r.severancePaymentDate)}`
      );
      data.push(r.netto);
      const palette = BAR_PALETTE[scenarioIdx % BAR_PALETTE.length];
      fills.push(palette.fill);
      borders.push(palette.border);
      scenarioIdx++;
    }
  }

  return {
    labels,
    datasets: [
      {
        label: t('chart.legend.referenceLabel'),
        data,
        backgroundColor: fills,
        borderColor: borders,
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false
      }
    ]
  };
});

const barChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      enabled: true,
      mode: 'nearest' as const,
      intersect: true,
      position: 'nearest' as const,
      yAlign: 'bottom' as const,
      padding: 16,
      boxPadding: 8,
      caretPadding: 10,
      titleFont: { size: 18, weight: 'bold' as const, lineHeight: 1.5 },
      titleMarginBottom: 10,
      bodyFont: { size: 14, lineHeight: 1.5 },
      bodySpacing: 8,
      footerFont: { size: 14, lineHeight: 1.5 },
      footerSpacing: 6,
      footerMarginTop: 10,
      animation: { duration: 400 },
      callbacks: {
        title: (items: { parsed: { y: number }; dataIndex: number }[]) => {
          if (items.length === 0) return '';
          const main = euroFormatter.format(items[0].parsed.y);
          const meta = barRows.value[items[0].dataIndex];
          if (meta?.isReference || !props.referenceLine) return main;
          return `${main} vs. ${euroFormatter.format(props.referenceLine.value)}`;
        },
        beforeBody: (items: { dataIndex: number }[]) => {
          if (!props.referenceLine || items.length === 0) return '';
          const meta = barRows.value[items[0].dataIndex];
          if (!meta || meta.isReference || !meta.row) return '';
          const diff = meta.row.netto - props.referenceLine.value;
          const lines: string[] = [t('chart.tooltip.diffVsLiegen', { amount: euroFormatter.format(diff) })];
          if (props.periodEnd) {
            const months = monthsWorkedUntil(meta.row.newJobStartDate, props.periodEnd);
            lines.push(t('chart.tooltip.extraMonths', { months }));
            if (months > 0) lines.push(formatPerMonthLine(diff, months));
          }
          return lines;
        },
        label: (ctx: { parsed: { y: number }; dataIndex: number }) => {
          const meta = barRows.value[ctx.dataIndex];
          const amount = euroFormatter.format(ctx.parsed.y);
          if (!meta || meta.isReference || !meta.row) return amount;
          const start = dateFormatter.format(meta.row.newJobStartDate);
          const pay = dateFormatter.format(meta.row.severancePaymentDate);
          return `${amount} | ${start} | ${t('chart.legend.auszahlungPrefix')} ${pay}`;
        },
        labelColor: (ctx: { dataIndex: number }) => {
          const meta = barRows.value[ctx.dataIndex];
          const palette =
            meta?.isReference || !meta?.row
              ? REFERENCE_BAR
              : (() => {
                  let scenarioIdx = 0;
                  for (let i = 0; i < ctx.dataIndex; i++) {
                    if (!barRows.value[i].isReference) scenarioIdx++;
                  }
                  return BAR_PALETTE[scenarioIdx % BAR_PALETTE.length];
                })();
          return {
            borderColor: palette.border,
            backgroundColor: palette.fill,
            borderWidth: 2,
            borderDash: [] as number[]
          };
        }
      }
    },
    scales: {
      x: {
        title: { display: false },
        ticks: { color: 'rgb(100, 116, 139)', autoSkip: false, maxRotation: 30, minRotation: 0 },
        grid: { display: false }
      },
      y: {
        title: { display: true, text: props.yAxis, color: 'rgb(100, 116, 139)' },
        ticks: {
          color: 'rgb(100, 116, 139)',
          callback: (value: number | string) => euroFormatter.format(typeof value === 'number' ? value : Number(value))
        },
        grid: { color: 'rgba(148, 163, 184, 0.2)' }
      }
    }
  }
}));

function toggleDataset(index: number) {
  const inst = (
    chartRef.value as unknown as {
      chart?: {
        isDatasetVisible(i: number): boolean;
        setDatasetVisibility(i: number, v: boolean): void;
        update(): void;
      };
    } | null
  )?.chart;

  if (!inst) return;
  const visible = inst.isDatasetVisible(index);
  inst.setDatasetVisibility(index, !visible);
  inst.update();

  const next = new Set(hiddenDatasets.value);
  if (visible) next.add(index);
  else next.delete(index);
  hiddenDatasets.value = next;
}

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'nearest' as const, intersect: true },
  hover: { mode: 'nearest' as const, intersect: true },
  plugins: {
    legend: { display: false },
    tooltip: {
      enabled: true,
      mode: 'nearest' as const,
      intersect: true,
      padding: 16,
      boxPadding: 8,
      caretPadding: 10,
      titleFont: { size: 18, weight: 'bold' as const, lineHeight: 1.5 },
      titleMarginBottom: 10,
      bodyFont: { size: 14, lineHeight: 1.5 },
      bodySpacing: 8,
      footerFont: { size: 14, lineHeight: 1.5 },
      footerSpacing: 6,
      footerMarginTop: 10,
      animation: { duration: 400 },
      callbacks: {
        title: (items: { parsed: { y: number }; datasetIndex: number; dataIndex: number }[]) => {
          if (items.length === 0) return '';
          const main = euroFormatter.format(items[0].parsed.y);
          if (!props.referenceLine) return main;
          return `${main} vs. ${euroFormatter.format(props.referenceLine.value)}`;
        },
        beforeBody: (items: { datasetIndex: number; dataIndex: number; parsed: { y: number } }[]) => {
          if (!props.referenceLine || !props.periodEnd || items.length === 0) return '';
          const lines: string[] = [];
          for (const item of items) {
            const row = datasetRows.value[item.datasetIndex]?.[item.dataIndex];
            if (!row) continue;
            const diff = row.netto - props.referenceLine.value;
            const months = monthsWorkedUntil(row.newJobStartDate, props.periodEnd);
            lines.push(t('chart.tooltip.diffVsLiegen', { amount: euroFormatter.format(diff) }), t('chart.tooltip.extraMonths', { months }));
            if (months > 0) lines.push(formatPerMonthLine(diff, months));
          }
          return lines;
        },
        label: (ctx: {
          datasetIndex: number;
          dataIndex: number;
          parsed: { y: number };
          chart: { data: { labels: string[] } };
          dataset: { label?: string };
        }) => {
          const row = datasetRows.value[ctx.datasetIndex]?.[ctx.dataIndex];
          const amount = euroFormatter.format(ctx.parsed.y);
          if (!row) return ctx.dataset.label ?? amount;
          const start = dateFormatter.format(row.newJobStartDate);
          const pay = dateFormatter.format(row.severancePaymentDate);
          return `${amount} | ${start} | ${t('chart.legend.auszahlungPrefix')} ${pay}`;
        },
        labelColor: (ctx: { dataset: { borderColor?: string; borderDash?: number[] } }) => {
          const isDashed = Array.isArray(ctx.dataset.borderDash) && ctx.dataset.borderDash.length > 0;
          const color = (ctx.dataset.borderColor as string) ?? 'rgb(100, 116, 139)';
          return {
            borderColor: color,
            backgroundColor: isDashed ? 'transparent' : color,
            borderWidth: 2,
            borderDash: isDashed ? [4, 2] : []
          };
        }
      }
    }
  },
  scales: {
    x: {
      title: { display: true, text: props.xAxis, color: 'rgb(100, 116, 139)' },
      ticks: { color: 'rgb(100, 116, 139)' },
      grid: { color: 'rgba(148, 163, 184, 0.2)' }
    },
    y: {
      title: { display: true, text: props.yAxis, color: 'rgb(100, 116, 139)' },
      ticks: {
        color: 'rgb(100, 116, 139)',
        callback: (value: number | string) => euroFormatter.format(typeof value === 'number' ? value : Number(value))
      },
      grid: { color: 'rgba(148, 163, 184, 0.2)' }
    }
  }
}));
</script>

<template>
  <div class="flex flex-col gap-4 rounded-lg border border-surface-300 bg-white p-5 shadow-sm dark:border-surface-700 dark:bg-surface-900">
    <div class="flex flex-col gap-2">
      <span class="text-lg font-semibold text-primary-700 dark:text-primary-300">{{ title }}</span>
      <!-- eslint-disable-next-line vue/no-v-html -->
      <span class="text-sm text-surface-600 dark:text-surface-400" v-html="description" />
    </div>

    <div
      v-if="!isBarMode && diffBetweenActivePair"
      class="mx-auto flex flex-wrap items-center gap-x-6 gap-y-1 rounded-md border border-primary-200 bg-primary-50/60 px-4 py-3 text-sm dark:border-primary-800 dark:bg-primary-950/40"
    >
      <span class="font-semibold text-primary-700 dark:text-primary-300">
        {{ t('chart.diff.differenz') }}: {{ euroFormatter.format(diffBetweenActivePair.diff) }}
      </span>
      <span class="text-surface-600 dark:text-surface-400">
        {{ t('chart.diff.maximum') }}:
        <span
          class="mx-1 inline-block h-2 w-3 align-middle"
          :style="{
            position: 'relative',
            top: '-1px',
            backgroundColor: diffBetweenActivePair.hi.isDashed ? 'transparent' : diffBetweenActivePair.hi.color,
            border: diffBetweenActivePair.hi.isDashed ? `2px dashed ${diffBetweenActivePair.hi.color}` : 'none'
          }"
        />
        {{ diffBetweenActivePair.hi.label }}:
        <span class="font-medium">{{ euroFormatter.format(diffBetweenActivePair.hi.value) }}</span>
        <span class="ml-1 text-xs text-surface-500">({{ diffBetweenActivePair.hi.dateLabel }})</span>
      </span>
    </div>

    <div class="h-168 w-full">
      <Chart v-if="isBarMode" ref="chartRef" type="bar" :data="barChartData" :options="barChartOptions" class="h-full w-full" />
      <Chart v-else ref="chartRef" type="line" :data="chartData" :options="chartOptions" class="h-full w-full" />
    </div>

    <ul
      v-if="!isBarMode"
      class="mx-auto grid max-w-6xl grid-cols-1 gap-x-6 gap-y-3 text-sm text-surface-600 dark:text-surface-400 sm:grid-cols-2 lg:grid-cols-4"
    >
      <li v-for="group in legendGroups" :key="group.key" class="flex flex-col gap-1 leading-none">
        <button
          v-for="item in [group.solid, group.dashed].filter((i): i is LegendItem => i !== null)"
          :key="item.index"
          type="button"
          class="flex cursor-pointer select-none items-center gap-2 whitespace-nowrap text-left transition-opacity"
          :class="hiddenDatasets.has(item.index) ? 'opacity-40 line-through' : 'opacity-100'"
          @click="toggleDataset(item.index)"
        >
          <span
            class="inline-block shrink-0"
            :style="{
              width: '18px',
              height: '10px',
              marginTop: '0px',
              backgroundColor: item.isDashed ? 'transparent' : item.color,
              border: item.isDashed ? `2px dashed ${item.color}` : 'none'
            }"
          />
          <span>{{ item.label }}</span>
        </button>
      </li>
    </ul>
  </div>
</template>
