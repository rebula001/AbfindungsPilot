<script setup lang="ts">
import { computed, defineAsyncComponent, ref, watchEffect } from 'vue';
import { useI18n } from 'vue-i18n';
import Button from 'primevue/button';
import SelectButton from 'primevue/selectbutton';
import Toolbar from 'primevue/toolbar';

import EmptyStateOverlay from './components/EmptyStateOverlay.vue';
import { useUserInput } from './composables/useUserInput';
import { cacheLanguage, type Language } from './i18n';
import CalculationView from './views/CalculationView.vue';
import InputView from './views/InputView.vue';

const ChartView = defineAsyncComponent(() => import('./views/ChartView.vue'));

type MenuKey = 'input' | 'calculation' | 'chart';
type WorkspaceKey = 'calculation' | 'chart';

const { committedInput } = useUserInput();
const hasData = computed(() => committedInput.value !== null);

const { locale, t } = useI18n();

watchEffect(() => {
  document.documentElement.lang = locale.value;
});

const inputPanelCollapsed = ref(false);
const activeWorkspacePanel = ref<WorkspaceKey>('calculation');

const workspaceGridStyle = computed(() => {
  const inputCols = inputPanelCollapsed.value ? '0 32px' : '480px 32px';
  const workspaceCols = activeWorkspacePanel.value === 'calculation' ? 'minmax(0, 1fr) 32px 0' : '0 32px minmax(0, 1fr)';

  return {
    gridTemplateColumns: `${inputCols} ${workspaceCols}`
  };
});

const inputToggleIcon = computed(() => (inputPanelCollapsed.value ? 'pi pi-angle-double-right' : 'pi pi-angle-double-left'));
const inputToggleLabel = computed(() => (inputPanelCollapsed.value ? t('layout.showInputPanel') : t('layout.hideInputPanel')));

const workspaceToggleIcon = computed(() => (activeWorkspacePanel.value === 'calculation' ? 'pi pi-angle-double-left' : 'pi pi-angle-double-right'));
const workspaceToggleLabel = computed(() =>
  activeWorkspacePanel.value === 'calculation' ? t('layout.showChartPanel') : t('layout.showCalculationPanel')
);

function toggleInputPanel() {
  inputPanelCollapsed.value = !inputPanelCollapsed.value;
}

function toggleWorkspacePanel() {
  activeWorkspacePanel.value = activeWorkspacePanel.value === 'calculation' ? 'chart' : 'calculation';
}

const menuOptions = computed(() => [
  { label: t('nav.input'), value: 'input' as MenuKey, icon: 'pi pi-pencil' },
  { label: t('nav.calculation'), value: 'calculation' as MenuKey, icon: 'pi pi-calculator' },
  { label: t('nav.chart'), value: 'chart' as MenuKey, icon: 'pi pi-chart-bar' }
]);

const menuModel = computed<MenuKey[]>({
  get: () => {
    const result: MenuKey[] = [];

    if (!inputPanelCollapsed.value) {
      result.push('input');
    }

    result.push(activeWorkspacePanel.value);
    return result;
  },
  set: (next) => {
    inputPanelCollapsed.value = !next.includes('input');

    const newWorkspace = next.find((value): value is WorkspaceKey => value !== 'input' && value !== activeWorkspacePanel.value);

    if (newWorkspace) {
      activeWorkspacePanel.value = newWorkspace;
    }
  }
});

function onMenuOptionClick(value: MenuKey, event: MouseEvent) {
  if (value !== 'input' && value === activeWorkspacePanel.value) {
    event.stopPropagation();
    event.preventDefault();
  }
}

const activeContentStyle = {
  background: 'var(--p-primary-color)',
  color: 'var(--p-primary-contrast-color, #fff)'
};

const activeContrastTextStyle = {
  color: 'var(--p-primary-contrast-color, #fff)'
};

const menuSelectButtonPt = {
  pcToggleButton: {
    content: ({ context }: { context: { active: boolean } }) => ({
      style: context.active ? activeContentStyle : undefined
    }),
    label: ({ context }: { context: { active: boolean } }) => ({
      style: context.active ? activeContrastTextStyle : undefined
    }),
    icon: ({ context }: { context: { active: boolean } }) => ({
      style: context.active ? activeContrastTextStyle : undefined
    })
  }
};

function setLanguage(language: Language) {
  locale.value = language;
  cacheLanguage(language);
}

const logoUrl = `${import.meta.env.BASE_URL}logo/logo.svg`;
</script>

<template>
  <div class="min-h-screen min-w-7xl bg-surface-50 text-surface-950 dark:bg-surface-950 dark:text-surface-50">
    <Toolbar class="rounded-none! border-x-0 border-t-0">
      <template #start>
        <div class="flex items-center gap-3">
          <img class="h-7 w-7" :src="logoUrl" :alt="t('app.logoAlt')" />
          <div class="font-semibold tracking-wide">{{ t('app.name') }}</div>
        </div>
      </template>

      <template #center>
        <SelectButton
          v-model="menuModel"
          :options="menuOptions"
          multiple
          option-label="label"
          option-value="value"
          size="small"
          :pt="menuSelectButtonPt"
          :aria-label="t('nav.menuLabel')"
        >
          <template #option="{ option }">
            <span class="flex items-center gap-2" @click="onMenuOptionClick(option.value, $event)">
              <i :class="option.icon" class="text-xs" aria-hidden="true" />
              <span>{{ option.label }}</span>
            </span>
          </template>
        </SelectButton>
      </template>

      <template #end>
        <div class="flex items-center gap-2">
          <Button
            label="DE"
            size="small"
            :severity="locale === 'de' ? 'primary' : 'secondary'"
            :text="locale !== 'de'"
            :pt="{ root: { style: 'padding: 3px 8px; border: 1px solid var(--p-primary-color)' } }"
            @click="setLanguage('de')"
          />
          <Button
            label="ZH"
            size="small"
            :severity="locale === 'zh' ? 'primary' : 'secondary'"
            :text="locale !== 'zh'"
            :pt="{ root: { style: 'padding: 3px 8px; border: 1px solid var(--p-primary-color)' } }"
            @click="setLanguage('zh')"
          />
        </div>
      </template>
    </Toolbar>

    <main class="h-[calc(100vh-65px)] overflow-hidden p-4">
      <div
        class="grid h-full w-full overflow-hidden rounded-md border border-surface-200 transition-[grid-template-columns] dark:border-surface-700"
        :style="workspaceGridStyle"
      >
        <div
          class="min-w-0 overflow-auto bg-surface-0 px-6 py-5 dark:bg-surface-950"
          :class="{ 'pointer-events-none invisible': inputPanelCollapsed }"
          :inert="inputPanelCollapsed"
        >
          <InputView @saved="inputPanelCollapsed = true" />
        </div>

        <button
          type="button"
          class="relative flex min-w-0 cursor-pointer select-none items-center justify-center border-0 border-x border-surface-200 bg-surface-50 text-surface-500 transition-colors hover:bg-primary-50 hover:text-primary-700 dark:border-surface-700 dark:bg-surface-900 dark:hover:bg-primary-950"
          :aria-label="inputToggleLabel"
          :title="inputToggleLabel"
          @click="toggleInputPanel"
        >
          <span class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90 whitespace-nowrap text-xs font-medium tracking-widest">
            {{ inputToggleLabel }}
          </span>
          <i :class="inputToggleIcon" class="absolute bottom-3" aria-hidden="true" />
        </button>

        <div
          class="relative min-w-0 bg-surface-0 px-6 py-5 dark:bg-surface-950"
          :class="[hasData ? 'overflow-auto' : 'overflow-hidden', { 'pointer-events-none invisible': activeWorkspacePanel !== 'calculation' }]"
          :inert="activeWorkspacePanel !== 'calculation'"
        >
          <CalculationView />
          <EmptyStateOverlay v-if="!hasData" />
        </div>

        <button
          type="button"
          class="relative flex min-w-0 cursor-pointer select-none items-center justify-center border-0 border-x border-surface-200 bg-surface-50 text-surface-500 transition-colors hover:bg-primary-50 hover:text-primary-700 dark:border-surface-700 dark:bg-surface-900 dark:hover:bg-primary-950"
          :aria-label="workspaceToggleLabel"
          :title="workspaceToggleLabel"
          @click="toggleWorkspacePanel"
        >
          <span class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90 whitespace-nowrap text-xs font-medium tracking-widest">
            {{ workspaceToggleLabel }}
          </span>
          <i :class="workspaceToggleIcon" class="absolute bottom-3" aria-hidden="true" />
        </button>

        <div
          class="relative min-w-0 bg-surface-0 px-6 py-5 dark:bg-surface-950"
          :class="[hasData ? 'overflow-auto' : 'overflow-hidden', { 'pointer-events-none invisible': activeWorkspacePanel !== 'chart' }]"
          :inert="activeWorkspacePanel !== 'chart'"
        >
          <ChartView />
          <EmptyStateOverlay v-if="!hasData" />
        </div>
      </div>
    </main>
  </div>
</template>
