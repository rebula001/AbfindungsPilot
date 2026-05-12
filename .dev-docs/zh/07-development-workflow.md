# 07 - 工作流

> **30 秒了解：** 三个常见任务——加 UI 字段、改税率常量、加新组件——各列出分步清单。每个任务最后都跑同一套 Quality Gate（lint + i18n + build）。

## 任务 A：UI 加新输入字段

例子：加个“年度资本利得”字段，要进 `totalIncome`。

### 步骤 1：扩展类型（Domain）

[`calculation/types.ts`](../../../frontend/src/calculation/types.ts)：

```ts
export interface PersonIncomeData {
  // ... 已有字段
  /** 年度资本利得（简化为 netto，未抵 Sparerpauschbetrag） */
  capitalIncome?: number;
}
```

### 步骤 2：Engine 消费新字段

[`calculation/engine.ts`](../../../frontend/src/calculation/engine.ts) -> `computePersonYear()`：

```ts
const capitalIncome = einkommen.capitalIncome ?? 0;
const totalIncome = employmentIncome + rentalIncomeNet + otherIncome + capitalIncome;
```

如果改动不简单（如新 § 法条或独立税率算法）：**先在** `.claude/decisions/YYYY-MM-DD-...md` 写 ADR，因为 engine 有审计历史。

### 步骤 3：扩展 UserInputSnapshot

[`composables/useUserInput.ts`](../../../frontend/src/composables/useUserInput.ts)：

```ts
export interface UserInputSnapshot {
  // ...
  capitalIncomeYearly: number;
}
```

### 步骤 4：Adapter

[`calculation/inputAdapter.ts`](../../../frontend/src/calculation/inputAdapter.ts) -> `inputToIncomeUser()`：

```ts
return {
  // ...
  capitalIncome: s.capitalIncomeYearly * userIncomeShare
};
```

`inputToIncomeSpouse()` 同理（Single 模式 -> 0，Familie -> 余下分成）。

### 步骤 5：InputView（UI + Form）

[`views/InputView.vue`](../../../frontend/src/views/InputView.vue)：

```vue
<FormField v-slot="$field" name="capitalIncomeYearly" :initial-value="0">
  <InputNumber v-model="$field.value" :suffix="' ' + t('units.eurPerYear')" :min="0" size="small" />
  <Message v-if="$field.invalid" severity="error" size="small" variant="simple">
    {{ $field.error?.message }}
  </Message>
</FormField>
```

zod schema 加：`capitalIncomeYearly: z.number().min(0)`。

### 步骤 6：i18n - 两种 locale 都要加

[`i18n/de.ts`](../../../frontend/src/i18n/de.ts) + [`i18n/zh.ts`](../../../frontend/src/i18n/zh.ts)：

```ts
form: {
  // ...
  capitalIncomeYearly: 'Kapitalerträge pro Jahr',   // de.ts
  capitalIncomeYearly: '资本利得 / 年',              // zh.ts
}
```

### 步骤 7：Quality Gate

```powershell
cd frontend
npm run i18n:check   # 0 Missing, 0 Diff
npm run lint:check   # 绿
npm run build        # vue-tsc 绿 -> 确认结构一致
```

### 步骤 8：更新 `.claude/`（如非琐碎）

- engine 新字段 / 简化 -> `.claude/decisions/YYYY-MM-DD-...md` ADR
- 新任务 -> `.claude/tasks/YYYY-MM-DD-task-XX-...md` + 在 `.claude/tasks/README.md` 加表格条目
- engine 变动 -> 扩展本文档（[03](./03-calculation-engine.md)）

## 任务 B：改税率常量（如 2027 通胀调整）

### 步骤 1：先 ADR

`.claude/decisions/YYYY-MM-DD-tarif-2027.md` 写：

- 来源（Bundesgesetzblatt、BMF-Schreiben…）
- 适用范围（Veranlagungszeitraum）
- 受影响的常量

### 步骤 2：常量加进 `constants.ts`

推荐：**新增套用 `_2027` 后缀**，旧 `_2026` 保留。Engine 加版本选择（或用 `ComputeYearInput.year` 触发选择）。这样历史计算结果不变。

```ts
// constants.ts
export const GRUNDFREIBETRAG_2026 = 12_348;
export const GRUNDFREIBETRAG_2027 = 12_852; // 示例

export function grundfreibetrag(year: number): number {
  return year >= 2027 ? GRUNDFREIBETRAG_2027 : GRUNDFREIBETRAG_2026;
}
```

### 步骤 3：Engine

在 `engine.ts` 中把直接 import 的常量替换成 `grundfreibetrag(year)` 等函数调用。

### 步骤 4：测试（一旦装了 Vitest）

2026 的 golden snapshot 测试**不应**变化。新加 2027 的测试。

### 步骤 5：Quality Gate（同任务 A 步骤 7）

## 任务 C：新建 Vue 组件

### 清单

- [ ] 文件放 `components/`（可复用）或 `views/`（top-level）
- [ ] 用 `<script setup lang="ts">`（Composition API）
- [ ] Props 用 `defineProps<{...}>()` + TS interface
- [ ] Emits 用 `defineEmits<{...}>()`
- [ ] PrimeVue 组件加 `size="small"`，不写视觉 override
- [ ] Tailwind 只用 layout（`flex`、`grid`、`gap-*`、`p-*`）
- [ ] 所有可见字符串走 `t('...')`
- [ ] `<style scoped>` 尽量空
- [ ] Form 用 `@primevue/forms` + zod resolver
- [ ] Tooltip 用 `v-tooltip` 指令
- [ ] 显示数据的组件：考虑 Empty-State（参考 `EmptyStateOverlay.vue`）

## 任务 D：小 bugfix / 改文案

| 工作量 | 文档义务 |
| --- | --- |
| `< 10 行，纯文案` | 无 |
| 新 i18n key | 两个 locale + `i18n:check` |
| engine 逻辑改 | ADR + 测试 + 文档更新 |
| 构建配置改 | `.claude/tasks/` 加条目 |
| 新依赖 | `.claude/tasks/` 加条目，可需要 ADR |

## **不**做的事

- **不做投机性重构**，没具体诱因就别动。
- **不为一次性操作作 helper**，留 inline。
- **不给未改动的代码加 TS 类型 / docstring**。
- **不在 engine 函数里加“永远不会发生”的默认值**。系统边界（Adapter、Forms）做校验就够。
- **不在 commit 的代码里留 `console.log`**。

## 出问题怎么办

1. 看 `npm run build` 的输出 —— `vue-tsc` 报错通常很精准（文件 + 行号）。
2. i18n 报错：直接跑 `npm run i18n:check` 看 diff 列表。
3. VS Code 里 SonarLint 波浪线：右键 -> `"SonarLint: Show Issue Details"` 看解释 + 修复建议。
4. engine 行为不明：`engine.ts` 每个步骤都有注释；有疑问对照 [03](./03-calculation-engine.md)。
