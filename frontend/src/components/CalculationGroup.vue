<!--
  Calculation Group Renderer:
  - 渲染单个 StepGroup（含可选收入区 + 扣扣区 + 组结果）
  - 三列网格布局：左场景值 / 中央步骤 marker / 右场景值
  - 每个值卡片内部按 Benutzer | Ehepartner 拆 2 列
  - 数值单元格点击 => 共享 Popover：公式 + 实际代入数字 + 法律依据
  - 结果单元格下方可显示动态判定徽章（Günstigerprüfung 等）
-->
<script setup lang="ts">
import { ref, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import Popover from 'primevue/popover';
import type { Cell, DisplayStep, ResultNote, Scenario, StepGroup } from '../types/calculationSteps';

const {
  group,
  i18nParams = {},
  incomeLabelKey = undefined,
  deductionLabelKey = undefined,
  alternativesLabelKey = undefined,
  alternativesHintKey = undefined,
  hideSpouse = false
} = defineProps<{
  group: StepGroup;
  i18nParams?: Record<string, string | number>;
  /** 收入区段标签 i18n key（仅 income 非空时使用） */
  incomeLabelKey?: string;
  /** 扣扣区段标签 i18n key */
  deductionLabelKey?: string;
  /** 备注/比较区段标签 i18n key（仅 alternatives 非空时使用） */
  alternativesLabelKey?: string;
  /** 备注区段下方的辅助说明文本 i18n key（可选，例如：这些值不直接累加，只用于比较） */
  alternativesHintKey?: string;
  /** Single-Modus：Ehepartner-Spalte ausblenden（kein Spouse-Label, keine Spouse-Zelle, 1-spaltiges Innen-Grid）。 */
  hideSpouse?: boolean;
}>();

const { t } = useI18n();

function tr(key: string): string {
  return t(key, i18nParams);
}

const euroFmt = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
});

function formatEuro(n: number): string {
  return euroFmt.format(Math.round(n));
}

function formatEuroSigned(n: number, asDeduction: boolean): string {
  if (n === 0) return formatEuro(0);
  return asDeduction ? `-${formatEuro(Math.abs(n))}` : formatEuro(n);
}

// --- Shared Popover state ---
const popoverRef = ref<InstanceType<typeof Popover> | null>(null);
const popoverStep = ref<DisplayStep | null>(null);
const popoverScenario = ref<Scenario>('liegen');
const popoverCell = ref<Cell>('user');

function openPopover(event: MouseEvent, step: DisplayStep, scenario: Scenario, cell: Cell): void {
  if (!step.popover) return;
  const target = event.currentTarget as HTMLElement;
  const sameTarget = popoverStep.value === step && popoverScenario.value === scenario && popoverCell.value === cell;
  // Immer erst schließen, dann am neuen Target öffnen -> garantiert Reposition + nur ein offenes Popover
  popoverRef.value?.hide();
  if (sameTarget) {
    // Toggle-Verhalten: zweiter Klick auf dieselbe Zelle schließt nur
    popoverStep.value = null;
    return;
  }

  popoverStep.value = step;
  popoverScenario.value = scenario;
  popoverCell.value = cell;
  void nextTick(() => {
    popoverRef.value?.show({ currentTarget: target } as unknown as Event);
  });
}

function noteClass(variant: ResultNote['variant']): string {
  switch (variant) {
    case 'success':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700';
    case 'warning':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 border-amber-300 dark:border-amber-700';
    default:
      return 'bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-200 border-sky-300 dark:border-sky-700';
  }
}

function valueCellClass(hasPopover: boolean): string {
  return hasPopover ? 'cursor-pointer hover:underline decoration-dotted underline-offset-4' : '';
}
</script>

<template>
  <div class="rounded-lg border-2 border-surface-300 dark:border-surface-600 p-4 flex flex-col gap-4">
    <!-- 组标题 -->
    <div class="flex flex-col gap-0.5 -mt-1">
      <div class="text-sm font-semibold text-surface-800 dark:text-surface-100">
        {{ tr(group.titleKey) }}
      </div>
      <div class="text-[11px] text-surface-500 italic">{{ tr(group.legalBasisKey) }}</div>
    </div>

    <!-- 收入区（可选） -->
    <div v-if="group.income && group.income.length > 0 && incomeLabelKey" class="flex flex-col gap-2">
      <div class="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400 px-1">+ {{ tr(incomeLabelKey) }}</div>
      <div class="grid grid-cols-[1fr_auto_1fr] gap-x-4 gap-y-3 items-stretch">
        <template v-for="step in group.income" :key="step.label">
          <div class="rounded-md border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 p-3">
            <div :class="['grid gap-x-3 text-sm', hideSpouse ? 'grid-cols-1' : 'grid-cols-2']">
              <div class="text-xs text-surface-500">{{ tr('calculation.person.user') }}</div>
              <div v-if="!hideSpouse" class="text-xs text-surface-500">{{ tr('calculation.person.spouse') }}</div>
              <div
                :class="['font-mono inline-flex items-center gap-1.5', valueCellClass(!!step.popover)]"
                @click="openPopover($event, step, 'liegen', 'user')"
              >
                <span>{{ formatEuroSigned(step.liegen.user, step.isDeduction) }}</span>
                <i v-if="step.popover" class="pi pi-info-circle text-primary-500 text-xs"></i>
              </div>
              <div
                v-if="!hideSpouse"
                :class="['font-mono inline-flex items-center gap-1.5', valueCellClass(!!step.popover)]"
                @click="openPopover($event, step, 'liegen', 'spouse')"
              >
                <span>{{ formatEuroSigned(step.liegen.spouse, step.isDeduction) }}</span>
                <i v-if="step.popover" class="pi pi-info-circle text-primary-500 text-xs"></i>
              </div>
            </div>
          </div>

          <div class="flex flex-col items-center justify-center gap-1 min-w-40 max-w-56">
            <div
              class="min-w-9 h-9 px-2 rounded-full flex items-center justify-center font-mono font-semibold text-sm shrink-0 bg-primary-500 text-white"
            >
              {{ step.label }}
            </div>
            <div class="text-xs text-center text-surface-700 dark:text-surface-300 font-medium">
              {{ tr(step.titleKey) }}
            </div>
            <div class="text-[10px] text-center text-surface-500 italic">
              {{ tr(step.legalBasisKey) }}
            </div>
          </div>

          <div class="rounded-md border border-primary-200 dark:border-primary-700 bg-primary-50/40 dark:bg-primary-950/30 p-3">
            <div :class="['grid gap-x-3 text-sm', hideSpouse ? 'grid-cols-1' : 'grid-cols-2']">
              <div class="text-xs text-surface-500">{{ tr('calculation.person.user') }}</div>
              <div v-if="!hideSpouse" class="text-xs text-surface-500">{{ tr('calculation.person.spouse') }}</div>
              <div
                :class="['font-mono inline-flex items-center gap-1.5', valueCellClass(!!step.popover)]"
                @click="openPopover($event, step, 'neue', 'user')"
              >
                <span>{{ formatEuroSigned(step.neue.user, step.isDeduction) }}</span>
                <i v-if="step.popover" class="pi pi-info-circle text-primary-500 text-xs"></i>
              </div>
              <div
                v-if="!hideSpouse"
                :class="['font-mono inline-flex items-center gap-1.5', valueCellClass(!!step.popover)]"
                @click="openPopover($event, step, 'neue', 'spouse')"
              >
                <span>{{ formatEuroSigned(step.neue.spouse, step.isDeduction) }}</span>
                <i v-if="step.popover" class="pi pi-info-circle text-primary-500 text-xs"></i>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- 抽扣区已移至 alternatives 之后，以保证标号自然顺序：2.1-2.5 + 2.6 -->

    <!-- 备注 / 比较区段 -->
    <div v-if="group.alternatives && group.alternatives.length > 0 && alternativesLabelKey" class="flex flex-col gap-2">
      <div class="flex items-center gap-2 px-1">
        <i class="pi pi-sliders-h text-amber-600 dark:text-amber-400 text-xs"></i>
        <span class="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
          {{ tr(alternativesLabelKey) }}
        </span>
      </div>
      <div v-if="alternativesHintKey" class="text-[11px] text-amber-700/80 dark:text-amber-300/80 italic px-1 -mt-1">
        {{ tr(alternativesHintKey) }}
      </div>

      <div class="grid grid-cols-[1fr_auto_1fr] gap-x-4 gap-y-3 items-stretch">
        <template v-for="step in group.alternatives" :key="step.label">
          <div class="rounded-md border border-amber-300 dark:border-amber-700 bg-amber-50/40 dark:bg-amber-950/30 p-3">
            <div :class="['grid gap-x-3 text-sm', hideSpouse ? 'grid-cols-1' : 'grid-cols-2']">
              <div class="text-xs text-surface-500">{{ tr('calculation.person.user') }}</div>
              <div v-if="!hideSpouse" class="text-xs text-surface-500">{{ tr('calculation.person.spouse') }}</div>

              <div :class="['flex flex-col gap-0.5', valueCellClass(!!step.popover)]" @click="openPopover($event, step, 'liegen', 'user')">
                <div class="font-mono inline-flex items-baseline gap-1.5">
                  <span>{{ formatEuroSigned(step.liegen.user, step.isDeduction) }}</span>
                  <span v-if="step.cellMeta?.liegen.user?.suffix" class="text-xs text-amber-700 dark:text-amber-300 font-semibold">
                    {{ step.cellMeta.liegen.user.suffix }}
                  </span>
                  <i v-if="step.popover" class="pi pi-info-circle text-amber-600 dark:text-amber-400 text-xs self-center"></i>
                </div>
                <div v-if="step.cellMeta?.liegen.user?.sub" class="text-[11px] text-surface-600 dark:text-surface-400 font-mono leading-tight">
                  {{ step.cellMeta.liegen.user.sub }}
                </div>
              </div>

              <div
                v-if="!hideSpouse"
                :class="['flex flex-col gap-0.5', valueCellClass(!!step.popover)]"
                @click="openPopover($event, step, 'liegen', 'spouse')"
              >
                <div class="font-mono inline-flex items-baseline gap-1.5">
                  <span>{{ formatEuroSigned(step.liegen.spouse, step.isDeduction) }}</span>
                  <span v-if="step.cellMeta?.liegen.spouse?.suffix" class="text-xs text-amber-700 dark:text-amber-300 font-semibold">
                    {{ step.cellMeta.liegen.spouse.suffix }}
                  </span>
                  <i v-if="step.popover" class="pi pi-info-circle text-amber-600 dark:text-amber-400 text-xs self-center"></i>
                </div>
                <div v-if="step.cellMeta?.liegen.spouse?.sub" class="text-[11px] text-surface-600 dark:text-surface-400 font-mono leading-tight">
                  {{ step.cellMeta.liegen.spouse.sub }}
                </div>
              </div>
            </div>
          </div>

          <!-- 中央菱形 marker：旋转外框 + 反向旋转内容，区别于 income/deductions 的圆形 marker -->
          <div class="flex flex-col items-center justify-center gap-1 min-w-40 max-w-56">
            <div class="w-9 h-9 shrink-0 flex items-center justify-center bg-amber-500 text-white shadow-sm rotate-45 rounded-sm">
              <span class="-rotate-45 font-mono font-semibold text-xs leading-none">{{ step.label }}</span>
            </div>
            <div class="text-xs text-center text-surface-700 dark:text-surface-300 font-medium">
              {{ tr(step.titleKey) }}
            </div>
            <div class="text-[10px] text-center text-surface-500 italic">
              {{ tr(step.legalBasisKey) }}
            </div>
          </div>

          <div class="rounded-md border border-amber-300 dark:border-amber-700 bg-amber-50/40 dark:bg-amber-950/30 p-3">
            <div :class="['grid gap-x-3 text-sm', hideSpouse ? 'grid-cols-1' : 'grid-cols-2']">
              <div class="text-xs text-surface-500">{{ tr('calculation.person.user') }}</div>
              <div v-if="!hideSpouse" class="text-xs text-surface-500">{{ tr('calculation.person.spouse') }}</div>

              <div :class="['flex flex-col gap-0.5', valueCellClass(!!step.popover)]" @click="openPopover($event, step, 'neue', 'user')">
                <div class="font-mono inline-flex items-baseline gap-1.5">
                  <span>{{ formatEuroSigned(step.neue.user, step.isDeduction) }}</span>
                  <span v-if="step.cellMeta?.neue.user?.suffix" class="text-xs text-amber-700 dark:text-amber-300 font-semibold">
                    {{ step.cellMeta.neue.user.suffix }}
                  </span>
                  <i v-if="step.popover" class="pi pi-info-circle text-amber-600 dark:text-amber-400 text-xs self-center"></i>
                </div>
                <div v-if="step.cellMeta?.neue.user?.sub" class="text-[11px] text-surface-600 dark:text-surface-400 font-mono leading-tight">
                  {{ step.cellMeta.neue.user.sub }}
                </div>
              </div>

              <div
                v-if="!hideSpouse"
                :class="['flex flex-col gap-0.5', valueCellClass(!!step.popover)]"
                @click="openPopover($event, step, 'neue', 'spouse')"
              >
                <div class="font-mono inline-flex items-baseline gap-1.5">
                  <span>{{ formatEuroSigned(step.neue.spouse, step.isDeduction) }}</span>
                  <span v-if="step.cellMeta?.neue.spouse?.suffix" class="text-xs text-amber-700 dark:text-amber-300 font-semibold">
                    {{ step.cellMeta.neue.spouse.suffix }}
                  </span>
                  <i v-if="step.popover" class="pi pi-info-circle text-amber-600 dark:text-amber-400 text-xs self-center"></i>
                </div>
                <div v-if="step.cellMeta?.neue.spouse?.sub" class="text-[11px] text-surface-600 dark:text-surface-400 font-mono leading-tight">
                  {{ step.cellMeta.neue.spouse.sub }}
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- 抽扣区（位于 alternatives 之后，以保证步骤编号自然递增：2.1-2.5 + 2.6 等） -->
    <div v-if="group.deductions.length > 0 && deductionLabelKey" class="flex flex-col gap-2">
      <div class="text-xs font-semibold uppercase tracking-wide text-rose-700 dark:text-rose-400 px-1">- {{ tr(deductionLabelKey) }}</div>
      <div class="grid grid-cols-[1fr_auto_1fr] gap-x-4 gap-y-3 items-stretch">
        <template v-for="step in group.deductions" :key="step.label">
          <div class="rounded-md border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 p-3">
            <div :class="['grid gap-x-3 text-sm', hideSpouse ? 'grid-cols-1' : 'grid-cols-2']">
              <div class="text-xs text-surface-500">{{ tr('calculation.person.user') }}</div>
              <div v-if="!hideSpouse" class="text-xs text-surface-500">{{ tr('calculation.person.spouse') }}</div>
              <div
                :class="['font-mono inline-flex items-center gap-1.5', valueCellClass(!!step.popover)]"
                @click="openPopover($event, step, 'liegen', 'user')"
              >
                <span>{{ formatEuroSigned(step.liegen.user, step.isDeduction) }}</span>
                <i v-if="step.popover" class="pi pi-info-circle text-primary-500 text-xs"></i>
              </div>
              <div
                v-if="!hideSpouse"
                :class="['font-mono inline-flex items-center gap-1.5', valueCellClass(!!step.popover)]"
                @click="openPopover($event, step, 'liegen', 'spouse')"
              >
                <span>{{ formatEuroSigned(step.liegen.spouse, step.isDeduction) }}</span>
                <i v-if="step.popover" class="pi pi-info-circle text-primary-500 text-xs"></i>
              </div>
            </div>
          </div>

          <div class="flex flex-col items-center justify-center gap-1 min-w-40 max-w-56">
            <div
              class="min-w-9 h-9 px-2 rounded-full flex items-center justify-center font-mono font-semibold text-sm shrink-0 bg-rose-500 text-white"
            >
              {{ step.label }}
            </div>
            <div class="text-xs text-center text-surface-700 dark:text-surface-300 font-medium">
              {{ tr(step.titleKey) }}
            </div>
            <div class="text-[10px] text-center text-surface-500 italic">
              {{ tr(step.legalBasisKey) }}
            </div>
          </div>

          <div class="rounded-md border border-primary-200 dark:border-primary-700 bg-primary-50/40 dark:bg-primary-950/30 p-3">
            <div :class="['grid gap-x-3 text-sm', hideSpouse ? 'grid-cols-1' : 'grid-cols-2']">
              <div class="text-xs text-surface-500">{{ tr('calculation.person.user') }}</div>
              <div v-if="!hideSpouse" class="text-xs text-surface-500">{{ tr('calculation.person.spouse') }}</div>
              <div
                :class="['font-mono inline-flex items-center gap-1.5', valueCellClass(!!step.popover)]"
                @click="openPopover($event, step, 'neue', 'user')"
              >
                <span>{{ formatEuroSigned(step.neue.user, step.isDeduction) }}</span>
                <i v-if="step.popover" class="pi pi-info-circle text-primary-500 text-xs"></i>
              </div>
              <div
                v-if="!hideSpouse"
                :class="['font-mono inline-flex items-center gap-1.5', valueCellClass(!!step.popover)]"
                @click="openPopover($event, step, 'neue', 'spouse')"
              >
                <span>{{ formatEuroSigned(step.neue.spouse, step.isDeduction) }}</span>
                <i v-if="step.popover" class="pi pi-info-circle text-primary-500 text-xs"></i>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- 分隔线 -->
    <div class="border-t-2 border-dashed border-surface-300 dark:border-surface-600"></div>

    <!-- 组结果 -->
    <div class="grid grid-cols-[1fr_auto_1fr] gap-x-4 items-stretch">
      <div class="rounded-md border border-emerald-400 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 p-3 flex flex-col gap-2">
        <div :class="['grid gap-x-3 text-sm', hideSpouse ? 'grid-cols-1' : 'grid-cols-2']">
          <div class="text-xs text-surface-500">{{ tr('calculation.person.user') }}</div>
          <div v-if="!hideSpouse" class="text-xs text-surface-500">{{ tr('calculation.person.spouse') }}</div>
          <div
            :class="['font-mono font-semibold text-base inline-flex items-center gap-1.5', valueCellClass(!!group.result.popover)]"
            @click="openPopover($event, group.result, 'liegen', 'user')"
          >
            <span>{{ formatEuroSigned(group.result.liegen.user, group.result.isDeduction) }}</span>
            <i v-if="group.result.popover" class="pi pi-info-circle text-emerald-600 dark:text-emerald-400 text-sm"></i>
          </div>
          <div
            v-if="!hideSpouse"
            :class="['font-mono font-semibold text-base inline-flex items-center gap-1.5', valueCellClass(!!group.result.popover)]"
            @click="openPopover($event, group.result, 'liegen', 'spouse')"
          >
            <span>{{ formatEuroSigned(group.result.liegen.spouse, group.result.isDeduction) }}</span>
            <i v-if="group.result.popover" class="pi pi-info-circle text-emerald-600 dark:text-emerald-400 text-sm"></i>
          </div>
        </div>

        <div v-if="group.result.notes" :class="['grid gap-x-3', hideSpouse ? 'grid-cols-1' : 'grid-cols-2']">
          <div
            v-if="group.result.notes.liegen.user"
            :class="['px-2 py-1 rounded text-[10px] border leading-tight', noteClass(group.result.notes.liegen.user.variant)]"
          >
            {{ group.result.notes.liegen.user.text }}
          </div>
          <div v-else></div>
          <template v-if="!hideSpouse">
            <div
              v-if="group.result.notes.liegen.spouse"
              :class="['px-2 py-1 rounded text-[10px] border leading-tight', noteClass(group.result.notes.liegen.spouse.variant)]"
            >
              {{ group.result.notes.liegen.spouse.text }}
            </div>
            <div v-else></div>
          </template>
        </div>
      </div>

      <div class="flex flex-col items-center justify-center gap-1 min-w-40 max-w-56">
        <div
          class="w-10 h-10 rounded-full flex items-center justify-center font-mono font-bold text-base shrink-0 bg-emerald-500 text-white shadow-md"
        >
          {{ group.result.label }}
        </div>
        <div class="text-xs text-center text-surface-800 dark:text-surface-100 font-semibold">
          {{ tr(group.result.titleKey) }}
        </div>
        <div class="text-[10px] text-center text-surface-500 italic">
          {{ tr(group.result.legalBasisKey) }}
        </div>
      </div>

      <div class="rounded-md border border-emerald-400 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 p-3 flex flex-col gap-2">
        <div :class="['grid gap-x-3 text-sm', hideSpouse ? 'grid-cols-1' : 'grid-cols-2']">
          <div class="text-xs text-surface-500">{{ tr('calculation.person.user') }}</div>
          <div v-if="!hideSpouse" class="text-xs text-surface-500">{{ tr('calculation.person.spouse') }}</div>
          <div
            :class="['font-mono font-semibold text-base inline-flex items-center gap-1.5', valueCellClass(!!group.result.popover)]"
            @click="openPopover($event, group.result, 'neue', 'user')"
          >
            <span>{{ formatEuroSigned(group.result.neue.user, group.result.isDeduction) }}</span>
            <i v-if="group.result.popover" class="pi pi-info-circle text-emerald-600 dark:text-emerald-400 text-sm"></i>
          </div>
          <div
            v-if="!hideSpouse"
            :class="['font-mono font-semibold text-base inline-flex items-center gap-1.5', valueCellClass(!!group.result.popover)]"
            @click="openPopover($event, group.result, 'neue', 'spouse')"
          >
            <span>{{ formatEuroSigned(group.result.neue.spouse, group.result.isDeduction) }}</span>
            <i v-if="group.result.popover" class="pi pi-info-circle text-emerald-600 dark:text-emerald-400 text-sm"></i>
          </div>
        </div>

        <div v-if="group.result.notes" :class="['grid gap-x-3', hideSpouse ? 'grid-cols-1' : 'grid-cols-2']">
          <div
            v-if="group.result.notes.neue.user"
            :class="['px-2 py-1 rounded text-[10px] border leading-tight', noteClass(group.result.notes.neue.user.variant)]"
          >
            {{ group.result.notes.neue.user.text }}
          </div>
          <div v-else></div>
          <template v-if="!hideSpouse">
            <div
              v-if="group.result.notes.neue.spouse"
              :class="['px-2 py-1 rounded text-[10px] border leading-tight', noteClass(group.result.notes.neue.spouse.variant)]"
            >
              {{ group.result.notes.neue.spouse.text }}
            </div>
            <div v-else></div>
          </template>
        </div>
      </div>
    </div>

    <!-- 共享 Popover：内容由 popoverStep / popoverScenario / popoverCell 决定 -->
    <Popover ref="popoverRef">
      <div v-if="popoverStep" class="flex flex-col gap-3 p-1 min-w-80 max-w-xl">
        <div class="flex items-baseline gap-2 border-b border-surface-200 dark:border-surface-700 pb-2">
          <span
            class="inline-flex items-center justify-center min-w-8 h-7 px-2 rounded-full bg-primary-500 text-white font-mono font-semibold text-xs"
          >
            {{ popoverStep.label }}
          </span>
          <div class="flex flex-col">
            <span class="text-sm font-semibold">{{ tr(popoverStep.titleKey) }}</span>
            <span class="text-[11px] text-surface-500 italic">{{ tr(popoverStep.legalBasisKey) }}</span>
          </div>
        </div>

        <div class="text-[10px] uppercase tracking-wide text-surface-500">
          {{ tr('calculation.scenarios.' + popoverScenario) }} · {{ tr('calculation.person.' + popoverCell) }}
        </div>

        <div v-if="popoverStep.popover" class="flex flex-col gap-2">
          <div>
            <div class="text-[11px] uppercase tracking-wide text-surface-500 mb-1">Formel</div>
            <pre
              class="text-xs font-mono whitespace-pre-wrap bg-surface-50 dark:bg-surface-900 p-2 rounded border border-surface-200 dark:border-surface-700"
              >{{ popoverStep.popover.formula }}</pre
            >
          </div>

          <div>
            <div class="text-[11px] uppercase tracking-wide text-surface-500 mb-1">Berechnung mit aktuellen Werten</div>
            <pre
              class="text-xs font-mono whitespace-pre-wrap bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded border border-emerald-200 dark:border-emerald-800"
              >{{ popoverStep.popover.details[popoverScenario][popoverCell].computation }}</pre
            >
          </div>
        </div>
      </div>
    </Popover>
  </div>
</template>
