# 03 - 计算引擎

> **30 秒了解：** 一个纯函数 `computeYear(input)` 在每个税年内对两个场景（`stayUnemployed`、`newJob`）和两个人各算一遍，包含 SV-AN 社保、Vorsorgeaufwendungen 抚养扣除、Spenden 捐款封顶、§§ 32a/32b/34 ESt 和 Soli。所有 2026 年常量与 § 法条引用都在 [`constants.ts`](../../../frontend/src/calculation/constants.ts)。

## 源文件

| 文件 | 内容 |
| --- | --- |
| [`engine.ts`](../../../frontend/src/calculation/engine.ts) | 全部公式（`computeYear`、`computePersonYear`、`computePersonTax`、`computeJointTax`…） |
| [`types.ts`](../../../frontend/src/calculation/types.ts) | 接口定义 |
| [`constants.ts`](../../../frontend/src/calculation/constants.ts) | 2026 税率 + 社保 + 家庭 + Soli + Kirchensteuer |
| [`inputAdapter.ts`](../../../frontend/src/calculation/inputAdapter.ts) | UI snapshot -> Engine 输入 |

## 输入 / 输出

```ts
interface ComputeYearInput {
  profileUser: PersonProfile; // 不变的 Stammdaten
  profileSpouse: PersonProfile; // （Single 模式 -> Null-Spouse，见下）
  incomeUser: PersonIncomeData; // 与年份/场景无关的值
  incomeSpouse: PersonIncomeData;
  scenarioStayUnemployed: ScenarioOverride;
  scenarioNewJob: ScenarioOverride;
  year: number;
  veranlagungsart?: 'separate' | 'joint'; // 默认 'separate'
}

interface YearComputation {
  year: number;
  mode: 'separate' | 'joint';
  stayUnemployed: { user; spouse; userTax; spouseTax; jointTax? };
  newJob: { user; spouse; userTax; spouseTax; jointTax? };
}
```

## 高层流程

```text
computeYear(input)
│
├─ 对每个场景 × 每个人：
│   computePersonYear()
│   ├─ calcPersonIncome()            ← 月份分摊 + ALG + Abfindung
│   ├─ calcSvAnteil()                ← KV/PV/RV/ALV 按 BBG 封顶
│   ├─ calcPensionExpenseDeduction() ← § 10 EStG
│   └─ calcDonationDeduction()       ← § 10b EStG
│
├─ 对每个人或夫妻：
│   computePersonTax() 或 computeJointTax()
│   ├─ tarifEStWithFuenftelAndProgrV() ← §§ 32a + 32b + 34
│   ├─ KFB + Kindergeld 择优         ← § 31 EStG
│   ├─ calcSoli() / calcSoliJoint()  ← SolzG
│   └─ kirchensteuerRate(state)      ← BY/BW 8%，其他 9%
│
└─ mode='joint' 时：distributeJointToPersons() ← Joint->Einzel 比例分摊
```

## 步骤 1：年内收入分段 (`calcPersonIncome`)

一年被切成 **三段**：

| 阶段 | 时间区间 | 收入 |
| --- | --- | --- |
| 旧工作 | `[年初 … unemploymentDate)` | `monthlyGrossOldJob × 月数` |
| ALG I | `[algStartDate … min(algEnd, newJobStart, 年末))` | `monthlyUnemploymentBenefit × 月数` |
| 新工作 | `[newJobStartDate … 年末)` | `monthlyGrossNewJob × 月数` |

特殊情况：

- **Sperrzeit / Ruhezeit (§ 158/159 SGB III)：** Adapter 把 `algStartDate > unemploymentDate` 设好 -> 这两个日期之间 **没有** 任何收入（“现金洞”）
- **Sperrzeit 还会同时缩短 `unemploymentBenefitDuration`** 相同月数
- **去年没交过 ALV (§ 142 SGB III)：** `monthlyUnemploymentBenefit = 0` 且 `unemploymentBenefitDuration = 0`（见 Adapter 中 `isAlvSubject`）
- **Abfindung** 仅在 `severancePaymentDate.getFullYear() === year` 的那一年计入

`spouse.personKey === 'spouse'` -> 不算 Abfindung、不算新工作；ALG 仅当显式设定时（当前 UI 不允许）。

### Null-Spouse（单身模式） {#null-spouse}

`inputToProfileSpouse(s)` 在 `s.withSpouse === false` 时返回中性 profile：所有保险关、`age=0`、`taxClass=1`、所有金额 0。`inputToIncomeSpouse(s)` 同理。Engine 对 spouse 算出 0 € SV / 0 € ESt，数学上等价于“不存在”。UI 单独把 spouse 列隐藏。好处：engine 完全不动，只在 adapter 一个位置决定 Single / Familie。

## 步骤 2：社保 (`calcSvAnteil`)

每个雇佣段（`oldJob` / `newJob`）的月毛分别按两条 BBG 封顶：

| BBG（每月，2026） | 适用 |
| --- | --- |
| `BBG_KV_PV_MONTHLY_2026 = 5 812,50 €`（≈ 69 750 €/年） | KV、PV |
| `BBG_RV_ALV_MONTHLY_2026 = 8 450,00 €`（≈ 101 400 €/年） | RV、ALV |

AN（雇员）保费：

$$
\text{KV}_{AN} = \min(\text{Brutto}_{m}, \text{BBG}_{KV/PV}) \times \frac{\text{healthInsuranceRate}}{2}
$$

$$
\text{PV}_{AN} = \min(\text{Brutto}_{m}, \text{BBG}_{KV/PV}) \times r_{PV}, \quad
r_{PV} =
\begin{cases}
0{,}023 & \text{Sachsen 萨克森} \\
0{,}018 & \text{其他}
\end{cases}
$$

$$
\text{RV}_{AN} = \min(\text{Brutto}_{m}, \text{BBG}_{RV/ALV}) \times 0{,}093
$$

$$
\text{ALV}_{AN} = \min(\text{Brutto}_{m}, \text{BBG}_{RV/ALV}) \times 0{,}013
$$

`healthInsuranceRate` = 法定基础费率 14,60 % + 个人 Zusatzbeitrag 附加费率（用户输入，%），见 Adapter `fullKvRate()`。

### PKV 路径 (`kvKind === 'pkv'`)

KV / PV 不按 BBG 算，直接采用用户输入的年度总额（`privateAnnualKV`、`privateAnnualPV`）。RV/ALV 不变（与雇佣挂钩）。

**有意为之的简化：** ALG 期间 BA 对 KV 的补贴（§ 174 SGB III）**不**扣减 -> PKV 成本略高估 -> 结果偏向“新工作”方向，保守。

## 步骤 3：Vorsorgeaufwendungen (`calcPensionExpenseDeduction`, § 10 EStG)

$$
\text{Vorsorge} = \min(\text{RV}_{AN}, 30\,230,€) + \text{KV}_{AN} \cdot k_{KV} + \text{PV}_{AN}
$$

其中 **Krankengeld 折扣**：

$$
k_{KV} =
\begin{cases}
1{,}00 & \text{PKV} \\
0{,}96 & \text{GKV}\ (\text{§ 10 Abs. 1 Nr. 3 Satz 4 EStG})
\end{cases}
$$

- RV 上限（`VORSORGE_BASIS_HOECHSTBETRAG_2026 ≈ 30 230 €`）来自 § 10 Abs. 3 EStG；本模型范围内基本不会触发（`BBG_RV_ALV` 已把 `RV-AN` 实际封在 ≈ 9 430 €/年）
- ALV **不可**抵扣（只能走 `Pauschbetrag`，本模型忽略）

## 步骤 4：捐款 (`calcDonationDeduction`, § 10b EStG)

$$
\text{Spendenabzug} = \min(\text{年度捐款}, 0{,}20 \cdot \text{Gesamtbetrag der Einkünfte 含 Abfindung})
$$

注意：Abfindung **属于** § 19 EStG 的所得，§ 34 只改变税率算法，不改变它对捐款上限的影响。

## 步骤 5：每人 zvE

```text
grossWages             = oldJobWage + newJobWage
incomeRelatedExpenses  = 1 230 €  当 grossWages > 0 否则 0    (§ 9a Nr. 1a EStG)
employmentIncome       = grossWages - incomeRelatedExpenses
totalIncome            = employmentIncome + rentalIncomeNet + otherIncome
specialExpenses        = pensionExpenseDeduction + donationDeduction
zvEwithoutKFB          = totalIncome - specialExpenses
```

ALG I 和 Abfindung **不在** `totalIncome` 里，它们只在税率算法（§§ 32b、34）中起作用。

## 步骤 6：Einkommensteuertarif (§ 32a EStG 2026)

```text
zvE ≤ 12 348 €:                         ESt = 0
12 348 < zvE ≤ 17 799:                 ESt = (914,51·y + 1 400)·y        y = (zvE - 12 348)/10 000
17 799 < zvE ≤ 69 878:                 ESt = (173,10·z + 2 397)·z + 1 034,87   z = (zvE - 17 799)/10 000
69 878 < zvE ≤ 277 825:                ESt = 0,42·zvE - 11 135,63
zvE > 277 825:                         ESt = 0,45·zvE - 19 470,38
```

实现在 `grundtarifESt()`。`zvE` 向下取整到欧元，结果同样向下取整。

**Splittingtarif (§ 32a Abs. 5 EStG)：** `splittingESt(zvE) = 2 · grundtarifESt(zvE / 2)`。

## 步骤 7：Progressionsvorbehalt (§ 32b EStG)

ALG I **免税**，但抬高税率：

$$
\text{besSatz} = \frac{\text{ESt}(\text{zvE} + \text{ALG})}{\text{zvE} + \text{ALG}}, \qquad \text{tariflicheESt} = \text{besSatz} \cdot \text{zvE}
$$

实现在 `estWithProgressionsvorbehalt(zvE, alg, joint)`。`joint=true` 时用 `splittingESt` 当 tariff 函数，否则用 `grundtarifESt`。

## 步骤 8：Fünftelregelung (§ 34 Abs. 1 EStG)

Abfindung 是 **außerordentliche Einkunft**（特殊收入），税率上做平滑处理：

$$
\text{tariflicheESt} = \text{ESt}_{\text{ord}}(\text{zvE}_{\text{ord}}) + 5 \cdot \biggl[ \text{ESt}_{\text{ord}}\!\left(\text{zvE}_{\text{ord}} + \tfrac{\text{Abfindung}}{5}\right) - \text{ESt}_{\text{ord}}(\text{zvE}_{\text{ord}}) \biggr]
$$

其中 $\text{ESt}_{\text{ord}}$ 已经包含 Progressionsvorbehalt（步骤 7 的函数）。

实现在 `tarifEStWithFuenftelAndProgrV(zvEord, abfindung, alg, joint)`。**`zvEord` 是不含 Abfindung 的 ordentliche zvE**（=`PersonYearResult.zvEWithoutKFB` 或 `zvEWithKFB`）。`Math.max(0, …)` 防止额外项变负（极低 ord. zvE 时可能出现）。

## 步骤 9：KFB + Kindergeld 择优 (§ 31 EStG)

对每个人（Einzelveranlagung）或夫妻（Zusammenveranlagung），算两个 ESt：

| 方案 | 公式 |
| --- | --- |
| 不扣 KFB | `tariffIncomeTaxWithoutKFB = tarifEStWithFuenftelAndProgrV(zvEwithoutKFB, …)` |
| 扣 KFB | `tariffIncomeTaxWithKFB = tarifEStWithFuenftelAndProgrV(zvEwithoutKFB - KFB, …)` |

然后：

```text
kfbSavings      = tariffIncomeTaxWithoutKFB - tariffIncomeTaxWithKFB
kfbPreferred    = kfbSavings > childBenefitShare
assessedIncomeTax
  = kfbPreferred
    ? tariffIncomeTaxWithKFB + childBenefitShare    (§ 31 Satz 4: 把 Kindergeld 加回去)
    : tariffIncomeTaxWithoutKFB
```

2026 常量：

|  | Einzelveranlagung（每位家长各半） | Zusammenveranlagung（全额） |
| --- | --- | --- |
| 每孩 KFB | 4 878 € | 9 756 € |
| Kindergeld | 129,50 €/月 | 259 €/月 |
| 年 Kindergeld | 1 554 € | 3 108 € |

`childBenefitMonthlyPerChild` 用户可覆盖，默认 259 €。

## 步骤 10：Solidaritätszuschlag (SolzG)

| Veranlagung | Freigrenze 起征点 | Milderungszone 缓和区上限 |
| --- | --- | --- |
| Einzelveranlagung | 19 950 € ESt | 33 912 € |
| Zusammenveranlagung | 39 900 € ESt | 67 824 € |

公式：

$$
\text{Soli} = \begin{cases}
0 & \text{ESt} \leq \text{Freigrenze} \\
\min(0{,}055 \cdot \text{ESt},\ 0{,}119 \cdot (\text{ESt} - \text{Freigrenze})) & \text{其他}
\end{cases}
$$

实现在 `calcSoli()`（单身）和 `calcSoliJoint()`（阈值翻倍，§ 3 Abs. 4 SolzG 1995）。

## 步骤 11：Kirchensteuer 教会税

```ts
function kirchensteuerRate(state: string): number {
  return state === 'BY' || state === 'BW' ? 0.08 : 0.09;
}
```

计税基础 = festzusetzende ESt（简化：不做 `KFB-Hinzurechnung` 校正）。Zusammenveranlagung 时每位配偶仅在自己 `kirchensteuerpflichtig` 时缴；计税基础 = 共同 ESt 的一半（简化的对半分）。

### Joint 模式：分摊回个人

`distributeJointToPersons()` 把共同的 `assessedIncomeTax` 和 `soli` 按各自的 `tariffIncomeTaxWithoutKFB` 比例分摊回 `user / spouse`，使得 `sum(user.tax + spouse.tax) = jointTax.assessed`。CalculationView 的表格汇总需要这个等式。

`PersonTaxResult` 的 KFB / Kindergeld 字段在 Joint 模式下是 Einzelveranlagung 参考值（仅供参考）；法定有效的共同值在 `jointTax`。

## 2026 年常量 - 来源清单

所有常量在 [`constants.ts`](../../../frontend/src/calculation/constants.ts)，每条都附 § 引用：

| 常量 | 值 | 来源 |
| --- | --- | --- |
| `GRUNDFREIBETRAG_2026` | 12 348 € | § 32a Abs. 1 Nr. 1 EStG（通胀调整法） |
| Tarifkoeffizienten Zone 2-5 | 见文件 | § 32a Abs. 1 EStG 2026 |
| `ARBEITNEHMER_PAUSCHBETRAG` | 1 230 € | § 9a Nr. 1a EStG |
| `KFB_FULL_PER_CHILD_2026` | 9 756 €（= 6 828 € KFB + 2 928 € BEA） | § 32 Abs. 6 EStG |
| `KINDERGELD_PER_MONTH_PER_CHILD_2026` | 259 € | § 66 EStG（2025-01-01 起统一） |
| `BBG_KV_PV_MONTHLY_2026` | 5 812,50 € | SvEV 2026 |
| `BBG_RV_ALV_MONTHLY_2026` | 8 450 € | SvEV 2026 |
| `RV_RATE_AN` | 9,30 % | § 158 SGB VI |
| `ALV_RATE_AN` | 1,30 % | § 341 SGB III |
| `PV_RATE_AN_WITH_CHILD` | 1,80 %（SN: 2,30 %） | § 55 SGB XI |
| `VORSORGE_BASIS_HOECHSTBETRAG_2026` | 30 230 € | § 10 Abs. 3 EStG |
| `SPENDEN_HOECHSTGRENZE_RATE` | 20 % | § 10b Abs. 1 EStG |
| `SOLI_FREIGRENZE_SINGLE_2026` | 19 950 € | § 3 SolzG |
| `SOLI_FREIGRENZE_JOINT_2026` | 39 900 € | § 3 Abs. 4 SolzG |
| `SOLI_RATE` | 5,5 % | § 4 SolzG |
| `SOLI_MILDERUNGSZONE_RATE` | 11,9 % | § 4 SolzG |
| `KIST_RATE_BY_BW` / `KIST_RATE_OTHER` | 8 % / 9 % | 各州 Landeskirchensteuergesetz |

> ⚠ 切到下一税年（如 2027）时：`constants.ts` 全部常量重设，`.claude/decisions/` 写 ADR，更新测试。文件后缀 `_2026` 是有意的：将来 2026 + 2027 应该能并存。

## 有意为之的简化（汇总）

1. 不支持 KFB 非对称转让（始终对半）
2. ALG 期间 BA 对 PKV 的补贴未扣
3. 不算月度 Lohnsteuer 预扣（只算年度 ESt）
4. KiSt 计税基础未做 `KFB-Hinzurechnung` 校正
5. ALV 不计入 `Vorsorgeaufwendungen`（只能走 `Pauschbetrag`，未建模）
6. 其他所得（§ 22）和租金（§ 21）按“净”值直接进 `totalIncome`（未建模 Werbungskosten / AfA）
