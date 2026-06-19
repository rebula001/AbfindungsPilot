# 01 - 总览

> **30 秒了解：** 德国税法对普通人来说是个盲盒。这个浏览器 App 专门解决 Aufhebungsvertrag（解约协议）里 **Abfindung（遣散费）** 的两个核心痛点。每个痛点都通过实时对比计算，告诉你哪种选择 **家庭净收入更高**。

## 两个核心痛点

### 痛点 1 - Abfindung 应该哪一年领?

在德国签 Aufhebungsvertrag 时，常见的纠结是：**“当年领”** 还是 **“推到下一年领”**？App 把两种支付时间点放进 **受影响的两个税年** 一起算，直接告诉你哪种家庭 Netto 更高。关键往往在于 **“Fünftelregelung (§ 34 EStG, 五分之一规则)”** 只有在领取年份的其他 zvE（应税所得）低时才能真正起到节税作用。

### 痛点 2 - 新工作什么时候、以多少月薪入职最划算?

如果你拿了 Abfindung 但下家工作还没定（不知道入职日期、月薪也是个谈判区间），很难判断哪个 **“入职时点 × 月薪”** 组合最划算。因为 ALG I（失业救济）、Progressionsvorbehalt (§ 32b EStG, 累进保留)、社保扣款、ALG I 结束后可能出现的 GKV/PV 自付，以及 Fünftelregelung 失效效应同时在起作用。App 把入职日期和月薪档位的笛卡尔积全部算出来，把所有家庭 Netto 画成图表，一眼就能看出从哪个月薪开始早入职值得、从哪开始无所谓。

## 为什么这事不简单

四个效应互相纠缠，调一个变量会同时影响其他几个：

- **§ 34 EStG (Fünftelregelung)** 把 Abfindung 摊到 5 年来削弱税率，但前提是当年其他 zvE 必须低
- **§ 32b EStG (Progressionsvorbehalt)** 因 ALG I 抬高税率
- **§ 10 SGB V / § 240 SGB V** 可能让 ALG I 结束后的失业期产生 GKV/PV 自付，尤其是高额 Abfindung 阻断 Familienversicherung 时
- **§ 31 EStG (KFB vs. Kindergeld)** 取决于 Veranlagungsart（申报方式）
- **Splittingtarif (§ 32a Abs. 5, 分摊税率)** 与 Einzelveranlagung 可能差几千欧元

所以 App 把所有相关组合在两个税年上整体算出来并可视化，而不是让用户瞎猜。

## 核心场景

App 对两个税年各算 **两个场景**：

| 场景                         | 含义                                                     |
| ---------------------------- | -------------------------------------------------------- |
| **`stayUnemployed`**（躺平） | 用户领满 ALG I 最长期限（§ 147 SGB III），不入职         |
| **`newJob`**（新工作）       | 用户在 `newJobStartDate` 入职，月薪 `monthlyGrossNewJob` |

`CalculationView` 右栏三个 **Slider** 可调：

1. `severancePaymentDate` - Abfindung 支付月份（把 Fünftelregelung 推到税负更低的年份）
2. `newJobStartDate` - 何时入职（仅 newJob 场景）
3. `monthlyGrossNewJob` - 新工作月毛薪

**`ChartView`** 把所有组合的家庭 Netto 画出来，并以“完全躺平”画一条水平参考线。

## Veranlagungsart（申报方式）

| 模式                                         | 触发条件                          | 引擎行为                                                                                        |
| -------------------------------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------- |
| **Single（单身）**                           | `InputView` 中 `withSpouse=false` | 配偶 Profile 全部置零（见 [03](./03-calculation-engine.md#null-spouse)）；Splittingtarif 不可用 |
| **Familie - Einzelveranlagung** (`separate`) | `withSpouse=true`                 | § 26a EStG：夫妻各自申报，KFB 各半                                                              |
| **Familie - Zusammenveranlagung** (`joint`)  | `withSpouse=true` + 切换按钮      | § 26b EStG：合并 zvE、Splittingtarif (§ 32a Abs. 5)、KFB 全额                                   |

**Veranlagungsart** 用户可在 `CalculationView` 切换（Single 模式下强制锁定 `separate`）。

## App **不** 做的事

- 不生成报税单，只做预测 / 比较
- 不支持 **KFB 非对称转让**（§ 32 Abs. 6 EStG）：固定各半；UI 里的 `childAllowance` 字段只是信息性的
- 不建模 **月度 Lohnsteuer 预扣**，只算年度 ESt
- **ALG I 结束后的 GKV/PV 自付**已做保守估算，但不等于 Krankenkasse Bescheid，不覆盖最低缴费基数、Bürgergeld、特殊 Familienversicherung 边界
- 不扣除 **PKV 失业期间 BA 补贴**（保守 -> 躺平场景的 PKV 成本略高估）
- 不建模夫妻只有一方缴 **Kirchensteuer** 的混合情况；Familie 模式默认夫妻教会税状态相同
- 不优化 **Riester / Rürup**
- 不算 **资本利得**（Abgeltungsteuer）- 只覆盖 § 19（工资）、§ 21（V&V 出租）、§ 22（其他）、§ 34（特殊收入）

这些简化在代码里相应位置都有注释（见 [`engine.ts`](../../../frontend/src/calculation/engine.ts) 和 [`inputAdapter.ts`](../../../frontend/src/calculation/inputAdapter.ts)）。

## 技术栈（速览）

| 层     | 选型                                            |
| ------ | ----------------------------------------------- |
| 框架   | Vue 3.5 + `<script setup>` Composition API      |
| 语言   | TypeScript 6 (strict)                           |
| 构建   | Vite 8                                          |
| UI     | PrimeVue 4（Aura 主题, violet）+ Tailwind CSS 4 |
| 表单   | `@primevue/forms`                               |
| 国际化 | vue-i18n 11 (DE/ZH)                             |
| 图表   | Chart.js 4                                      |
| Lint   | ESLint 10 + Prettier 3                          |
| 质量   | SonarQube（自建服务器）                         |

-> 架构细节见 [02 - 架构](./02-architecture.md)。
