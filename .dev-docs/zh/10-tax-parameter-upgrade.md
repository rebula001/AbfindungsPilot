# 10 - 更新年度参数

> **30 秒了解：** App 当前有一套激活中的年度参数，位于
> [`frontend/src/tax-parameters`](../../../frontend/src/tax-parameters/)。税表区间、社保 BBG、Kindergeld、Soli、Kirchensteuer 以及 UI 中显示的年份/金额示例都从 JSON 读取。如果只是数值变化、计算法律结构不变，那么更新 JSON 并跑一次 build 即可。

## 基本原则

计算引擎仍然使用现有函数；年度数值不再直接写死在手写常量中，而是来自：

| 文件                                                                                    | 作用                                                                                      |
| --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| [`2026.json`](../../../frontend/src/tax-parameters/2026.json)                           | 当前激活的 2026 年参数集                                                                  |
| [`types.ts`](../../../frontend/src/tax-parameters/types.ts)                             | JSON 字段 schema                                                                          |
| [`index.ts`](../../../frontend/src/tax-parameters/index.ts)                             | 加载当前参数集，格式化 i18n/UI 使用的显示值，并导出 `CURRENT_TAX_PARAMETERS`             |
| [`constants.ts`](../../../frontend/src/calculation/constants.ts)                        | 兼容层：保留旧常量名，但实际值来自 JSON                                                   |
| [`de.ts`](../../../frontend/src/i18n/de.ts) / [`zh.ts`](../../../frontend/src/i18n/zh.ts) | 带占位符的显示文案，例如 `{taxYear}`、`{bbgKvPvMonthly}`、`{soliSingleFreigrenze}`        |

重要：当前 App 只有**一套激活参数**。即使 UI 展示两个税年，两个年度也都使用这套激活参数计算。这是为了预测场景而有意设计的。真正“每个税年各用自己历史参数”的模式，需要另行扩展。

## JSON 数值格式

| 字段类型             | JSON 格式                                 | 示例                          |
| -------------------- | ------------------------------------------ | ----------------------------- |
| 欧元金额             | 直接写欧元数字，不写千位点                 | `12348`, `5812.5`             |
| 百分比               | 写小数，不写百分号字符串                   | `0.146` 表示 14.6%            |
| 月度 BBG             | 写月度值，不写年度值                       | `5812.5`                      |
| Kindergeld           | 每个孩子每月金额                           | `259`                         |
| Soli / Kirchensteuer | 写小数                                     | `0.055`, `0.08`, `0.09`       |
| UI 示例              | 月份和日期分开写，月份按 1-12              | `"unemploymentDateMonth": 8`  |

UI 文案中看到的格式化值由 `buildTaxParameterI18nParams()` 生成。例如：`0.055` 会显示成 `5,5 %`，`5812.5` 会显示成 `5.812,50 EUR`。

## 2027 / 2028 更新步骤

1. **确认法律基础。** 先判断是不是只有数值变化。如果税表公式、取整规则、§ 34、§ 32b、§ 51a、SGB 逻辑或 ALG/PV/KV 结构变化，仅改 JSON 不够。
2. **创建新 JSON。** 将 `2026.json` 复制为 `2027.json`，并把 `"year"` 改为 `2027`。
3. **更新全部数值。** 检查并修改 `incomeTax`、`pauschbetraege`、`children`、`socialInsurance`、`vorsorge`、`soli`、`kirchensteuer`、`uiExamples`。
4. **切换激活参数集。** 在 `frontend/src/tax-parameters/index.ts` 中导入新 JSON，并让 `CURRENT_TAX_PARAMETERS` 指向新的参数集。
5. **只有新增字段时才改类型。** 如果只是现有字段换数值，不需要改 `types.ts`。只有计算或 UI 真的要使用新法律参数时，才新增字段。
6. **只有新增文案时才改 i18n。** 年份和金额应该通过占位符显示。如果 UI 仍有写死数值，优先在 `buildTaxParameterI18nParams()` 中新增参数占位符。
7. **运行检查。** 在 `frontend` 下执行 `npm run build`。

当前产品模型只有一套激活参数，因此最小切换示例应是：

```ts
import parameters2027 from './2027.json';
import type { TaxParameters } from './types';

export const CURRENT_TAX_PARAMETERS: TaxParameters = parameters2027;

const TAX_PARAMETER_BY_YEAR: Record<number, TaxParameters> = {
  [CURRENT_TAX_PARAMETERS.year]: CURRENT_TAX_PARAMETERS
};
```

如果产品上仍然希望用 2026 数值预测未来年度，不要激活新的 JSON。此时 `2026.json` 继续作为有意选择的产品基准。

真正切换到 2027 后，`2026.json` 不需要继续 import。可以把它保留在仓库中作为历史参考，但运行中的 App 只需要当前激活的参数集。只有当以后 engine 真的要通过 `getTaxParameters(year)` 让不同税年使用不同参数时，同时 import 多个年度 JSON 才有意义。

## 每年需要核查的值

| 模块                         | JSON 路径                                                                                           |
| ---------------------------- | ---------------------------------------------------------------------------------------------------- |
| Einkommensteuertarif § 32a   | `incomeTax.grundfreibetrag`, `zone*`, `zone*A/B/C`, `zone4Rate`, `zone5Rate`                        |
| Arbeitnehmer / Sonderausgaben | `pauschbetraege.arbeitnehmer`, `sonderausgabenSingle`, `sonderausgabenJoint`, `donationCapRate`      |
| 子女 / 家庭                  | `children.kfbFullPerChild`, `kindergeldMonthlyPerChild`, `singleParentBase`, `singleParentAdditionalChild` |
| Krankenversicherung          | `socialInsurance.jaegYearly`, `kvGeneralRate`, `kvReducedRate`, `averageAdditionalKvRate`, `defaultAdditionalKvRate` |
| Pflegeversicherung           | `socialInsurance.pvTotalWithChild`, `pvEmployeeWithChild`, `pvEmployeeWithChildSachsen`, `pvChildlessSurcharge`, `pvChildDiscount`, `pvChildDiscountMaxChildren` |
| BBG                          | `socialInsurance.bbgKvPvMonthly`, `bbgRvAlvMonthly`                                                 |
| RV / ALV                     | `socialInsurance.rvEmployeeRate`, `alvEmployeeRate`                                                 |
| Vorsorge                     | `vorsorge.kvKrankengeldAbschlag`, `basisHoechstbetrag`                                              |
| Solidaritätszuschlag         | `soli.singleFreigrenze`, `jointFreigrenze`, `singleObergrenze`, `jointObergrenze`, `rate`, `milderungszoneRate` |
| Kirchensteuer                | `kirchensteuer.rateByBw`, `rateOther`                                                               |
| UI 示例日期                  | `uiExamples.unemploymentDateMonth`, `uiExamples.unemploymentDateDay`                                |

## 更新后检查

在 `frontend` 目录运行：

```bash
npm run build
```

这会覆盖：

- ESLint
- Prettier
- i18n key 对比
- `vue-tsc`
- Vite production build

可选：搜索可见 UI 文案里的硬编码旧数值：

```bash
rg -n "12\\.348|259|5\\.812|8\\.450|20\\.350|40\\.700|14,6|2,9" src/i18n src/views src/components
```

如果命中 `CalculationView.vue` 里的 `KFB_HALF_PER_CHILD_2026` 这类旧常量名，目前是预期现象，因为 `constants.ts` 仍作为兼容层导出旧名字。关键是用户可见文案和默认值应来自 `tax-parameters`。

## 什么时候 JSON 不够？

以下情况不能只靠 JSON：

- § 32a 税表公式或取整规则变化。
- § 34 Fünftelregelung 结构变化或取消。
- § 51a 下 Soli / Kirchensteuer 的核算基数变化。
- ALG-I 领取期限或给付逻辑需要重新建模。
- GKV/PV 自缴阶段必须加入 Mindestbemessung、Krankenkasse Bescheid 或更多特殊情况。
- App 不再使用一套激活参数做预测，而是要在同一个两年视图中让每个税年使用自己的参数集。

这些情况下，应先扩展 engine、UI 和审计文档，再更新 JSON 数值。
