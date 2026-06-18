<!--
  EmptyStateOverlay：当用户尚未保存任何输入数据（committedInput === null）时，
  在 Berechnung / Chart 视图上方覆盖一层半透明遮罩 + 居中卡片，引导用户去 InputView 填写。

  - 全部文案走 i18n（emptyState.* keys，见 src/i18n/de.ts）
-->
<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import Message from 'primevue/message';

const { t } = useI18n();
</script>

<template>
  <div class="absolute inset-0 z-20 flex items-center justify-center bg-black/30 backdrop-blur-sm">
    <div class="mx-6 max-w-lg rounded-lg bg-surface-0 p-6 shadow-2xl dark:bg-surface-900">
      <h2 class="mb-3 text-lg font-semibold">{{ t('emptyState.title') }}</h2>
      <p class="mb-3 text-sm text-surface-700 dark:text-surface-300">
        {{ t('emptyState.intro') }}
      </p>
      <ol class="mb-4 list-decimal pl-5 text-sm text-surface-700 dark:text-surface-300">
        <li>{{ t('emptyState.step1') }}</li>
        <li>{{ t('emptyState.step2') }}</li>
        <li>{{ t('emptyState.step3') }}</li>
      </ol>
      <Message severity="warn" :closable="false">
        <div class="flex items-start gap-2">
          <i class="pi pi-exclamation-triangle mt-0.5"></i>
          <div class="text-xs leading-relaxed">
            <div class="mb-1 font-semibold">{{ t('emptyState.disclaimerTitle') }}</div>
            <!-- eslint-disable-next-line vue/no-v-html -->
            <div v-html="t('emptyState.disclaimerBody')"></div>
          </div>
        </div>
      </Message>
    </div>
  </div>
</template>
