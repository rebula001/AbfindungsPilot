# 04 - UI 规范

> **30 秒了解：** PrimeVue + 默认样式优先，Tailwind 只用 layout 类，表单一律 `@primevue/forms`，所有标识符英语（除税务术语外），模板里不允许写德语字符串。

## PrimeVue 优先 - 接受默认样式

| 规则 | 允许 | 禁止 |
| --- | --- | --- |
| 组件选择 | PrimeVue 4（Aura, violet） | 自己重写、其它 UI 库 |
| 尺寸 | `size="small"`（Buttons、Inputs、DataTables 默认） | 没理由就改大小 |
| 视觉覆盖 | 不可避免时也要先问用户 | `*pt={...}` 加颜色、`bg-*`、`py-2!` 等 |
| Tailwind 类 | 仅可做 layout：`flex`、`grid`、`gap-*`、`p-*`、`m-*`、`w-*`、`h-*`、`items-*`、`justify-*` | 视觉类如 `bg-blue-500`、`text-3xl`、`rounded-xl` |
| 图标 | PrimeIcons（`pi pi-*`） | 其它图标集 |
| Tooltip | `v-tooltip` 指令（已在 `main.ts` 注册为 `tooltip`） | 自写 Tooltip 组件 |

**理由：** Aura 主题内部一致（间距、配色、Focus 环）。点状覆盖很快会破坏一致性。如果真觉得不对劲，先质疑设计需求，必要时改 Aura token，**不要**局部覆盖。

### 已认可的覆盖：Accordion

InputView / CalculationView 一致性的有意例外（见 `.claude/tasks/development-standards.md` § 1.8）：

```html
<AccordionPanel class="border border-surface-200 dark:border-surface-700 rounded-md overflow-hidden mb-2">
  <AccordionHeader class="bg-surface-50! dark:bg-surface-900! py-2.5!">
    <span class="font-semibold">{{ t('...') }}</span>
  </AccordionHeader>
</AccordionPanel>
```

## Forms

只用 `@primevue/forms` + zod / yup / valibot resolver。不允许手写 `ref()` + `onSubmit` 的模式。

```vue
<script setup lang="ts">
import { Form, FormField } from '@primevue/forms';
import { zodResolver } from '@primevue/forms/resolvers/zod';
import { z } from 'zod';

const schema = z.object({ email: z.string().email(t('form.errors.invalidEmail')) });
const resolver = zodResolver(schema);
function onFormSubmit(e) {
  if (e.valid) commit(e.values);
}
</script>
<template>
  <Form v-slot="$form" :resolver="resolver" @submit="onFormSubmit">
    <FormField v-slot="$field" name="email" initial-value="">
      <InputText v-model="$field.value" size="small" />
      <Message v-if="$field.invalid" severity="error" size="small" variant="simple">
        {{ $field.error?.message }}
      </Message>
    </FormField>
  </Form>
</template>
```

## 命名 - 所有标识符英语

**允许德语（税务术语）：**

`zvE`、`KFB`、`BBG`、`KV`/`PV`/`RV`/`ALV`、`Soli`、`Tarif`、`Grundtarif`、`Splittingtarif`、`Fünftelregelung`、`Progressionsvorbehalt`、`Veranlagungsart`、所有 `*_2026` 常量、`§ XX EStG/SolzG/SGB ...` 引用、源码中的德语注释。

**其它一律英语：**

| 层 | 例子 |
| --- | --- |
| 类型 | `PersonProfile`、`PersonIncomeData`、`IncomeBreakdown`、`SvBreakdown`、`PersonYearResult`、`PersonTaxResult`、`JointTaxResult`、`YearComputation` |
| Veranlagungsart 取值 | `separate` \|\| `joint`（不是 `einzeln` \|\| `zusammen`） |
| Engine 函数 | `estWithProgressionsvorbehalt`、`tarifEStWithFuenftelAndProgrV`、`calcPensionExpenseDeduction` |
| ComputeYearInput 字段 | `profileUser`、`profileSpouse`、`incomeUser`、`incomeSpouse`、`scenarioStayUnemployed`、`scenarioNewJob` |
| YearComputation 字段 | `stayUnemployed`、`newJob`（不是 `liegen` / `neueArbeit`） |
| 视图 | `InputView.vue`、`CalculationView.vue`、`ChartView.vue`（不是 `EingabeView`） |
| i18n keys | `workspace.sections.basic`、`calculation.veranlagungsart.separate` |

## 硬编码字符串 - 红线

任何 `.vue` 或 `.ts` UI 文件：

| 位置 | ❌ 禁止 | ✅ 必须 |
| --- | --- | --- |
| 模板可见文本 | `<span>Daten speichern</span>` | `<span>{{ t('form.commit') }}</span>` |
| 属性中的文案 | `label="Speichern"`、`placeholder="z. B. 50000"`、`header="Stammdaten"` | `:label="t('...')"`、`:placeholder="t('...')"`、`:header="t('...')"` |
| Toast / 错误 | `summary: "Fehler"` | `summary: t('toast.errorTitle')` |
| Suffix / Prefix | `suffix="Monate"` | `:suffix="' ' + t('units.months')"` |
| 多行列表 / 公式 | 内联 | `tList()` + `tm()` 数组（参考 `CalculationView.vue`） |

**允许保留为字面量：**

- 联邦州代码（`'BY'`、`'BW'`、`'SN'` …）和 Steuerklasse 罗马数字（`'I'`-`'VI'`）
- 法律 ID（`'§ 32a EStG'`、`'§ 158 SGB III'`）
- 领域层常量名（不是 UI 文案）

校验：`npm run i18n:check`（见 [05](./05-i18n.md)）会自动找出大部分违规。

## 组件结构

```vue
<script setup lang="ts">
// 1. Imports (Vue、PrimeVue、自家 composables、类型)
// 2. Props/Emits（用 defineProps/defineEmits + TS 泛型）
// 3. State（ref/computed）
// 4. Composables（useI18n、useUserInput …）
// 5. Methods
// 6. Watch / lifecycle
</script>

<template>
  <!-- Template; 所有可见字符串走 t() -->
</template>

<style scoped>
/* 尽量留空；CSS 应交给主题 */
</style>
```

## Composable 结构

```ts
// composables/useXxx.ts
export function useXxx() {
  // 1. 引入依赖 composables（如 useUserInput）
  // 2. 本地 ref()/computed()/watch() 状态
  // 3. 辅助函数
  // 4. 末尾返回对象，只导出必要项
  return { stateA, stateB, action1 };
}
```

Composables **不要**重新实现领域逻辑，它们只负责调用 `engine.ts`，然后包一层 Vue 响应式。
