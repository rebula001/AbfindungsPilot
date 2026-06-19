# 03 - 计算引擎

> **30 秒了解：** `computeYear(input)` 在每个税年内对两个场景（`stayUnemployed`、`newJob`）和两个人各算一遍。现在覆盖工资/ALG/Abfindung、ALG-I 后继续失业时的 GKV/PV 自付、Vorsorgeaufwendungen、捐款或 Sonderausgaben-Pauschbetrag、§ 24b、§§ 32a/32b/34 EStG、KFB/Kindergeld、Soli 和 Kirchensteuer。所有 2026 年常量都在 `constants.ts`。

## 源文件

| 文件                                                                   | 内容                                                                                   |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| [`engine.ts`](../../../frontend/src/calculation/engine.ts)             | 全部公式（`computeYear`、`computePersonYear`、`computePersonTax`、`computeJointTax`…） |
| [`types.ts`](../../../frontend/src/calculation/types.ts)               | 接口定义                                                                               |
| [`constants.ts`](../../../frontend/src/calculation/constants.ts)       | 2026 税率、社保、家庭、Soli、Kirchensteuer 常量                                        |
| [`inputAdapter.ts`](../../../frontend/src/calculation/inputAdapter.ts) | UI snapshot -> Engine 输入                                                             |

## 输入 / 输出

```ts
interface ComputeYearInput {
  profileUser: PersonProfile;
  profileSpouse: PersonProfile;
  incomeUser: PersonIncomeData;
  incomeSpouse: PersonIncomeData;
  scenarioStayUnemployed: ScenarioOverride;
  scenarioNewJob: ScenarioOverride;
  year: number;
  veranlagungsart?: "separate" | "joint";
}

interface YearComputation {
  year: number;
  mode: "separate" | "joint";
  stayUnemployed: { user; spouse; userTax; spouseTax; jointTax? };
  newJob: { user; spouse; userTax; spouseTax; jointTax? };
}
```

## 高层流程

```text
computeYear(input)
|
├─ 对每个场景 x 每个人：
|   computePersonYear()
|   ├─ calcPersonIncome()            ← 月份分摊 + ALG + Abfindung + 自付医保段
|   ├─ calcSvAnteil()                ← KV/PV/RV/ALV + GKV/PV 自付
|   ├─ calcPensionExpenseDeduction() ← § 10 EStG
|   ├─ calcDonationDeduction()       ← § 10b EStG
|   └─ calcGeneralSpecialExpensesDeduction() ← § 10c EStG
|
├─ 对每个人或夫妻：
|   computePersonTax() 或 computeJointTax()
|   ├─ tariffEstWithFuenftelAndProgrV() ← §§ 32a + 32b + 34
|   ├─ KFB + Kindergeld 择优         ← § 31 EStG
|   ├─ calcSoli() / calcSoliJoint()  ← SolzG，§ 51a EStG 基数
|   └─ kirchensteuerRate(state)      ← BY/BW 8%，其它 9%，§ 51a EStG 基数
|
└─ mode='joint' 时：distributeJointToPersons() ← Joint -> Einzel 展示分摊
```

## 步骤 1：年内收入分段 (`calcPersonIncome`)

一年按月份切成就业、ALG I、新工作，以及可能的 GKV/PV 自付期：

| 阶段        | 时间区间                                                                                             | 收入 / 作用                         |
| ----------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------- |
| 旧工作      | `[年初 ... unemploymentDate)`                                                                        | `monthlyGrossOldJob x 月数`         |
| ALG I       | `[algStartDate ... min(algEnd, newJobStart, 年末))`                                                  | `monthlyUnemploymentBenefit x 月数` |
| 新工作      | `[newJobStartDate ... 年末)`                                                                         | `monthlyGrossNewJob x 月数`         |
| GKV/PV 自付 | `[max(unemploymentDate, ALG 结束, Abfindung 次月) ... min(newJobStart, Abfindung 覆盖期结束, 年末))` | 只算 KV/PV 自付，不产生 RV/ALV      |

特殊情况：

- **Sperrzeit / Ruhezeit (§§ 158/159 SGB III)：** Adapter 设置 `algStartDate > unemploymentDate`；这段没有 ALG。
- **Sperrzeit** 同时缩短 `unemploymentBenefitDuration`；Ruhezeit 只推迟开始。
- **ALG-I Anspruchsdauer (§ 147 SGB III)：** Adapter 根据年龄和 `alvInsuranceMonthsLast5Years` 推导，保险月份是累计月份，不要求连续。
- **没有 ALV 义务 / 没有 ALV 缴费：** `monthlyUnemploymentBenefit = 0` 且 `unemploymentBenefitDuration = 0`（见 `isAlvSubject`，§ 142 SGB III）。
- **Abfindung** 只在 `severancePaymentDate.getFullYear() === year` 的年份计入。
- **失业前最后月毛工资：** 如果 UI 字段为 0，Adapter 用 `oldEmployerIncomeCurrentYear / 已工作月份数`。例：2026-08-01 开始失业 -> Jan-Jul 共 7 个月。
- **日期存储：** UI 用本地 `YYYY-MM-DD` 存纯日期，避免 `toISOString()` 的 UTC 转换把 8 月 1 日误读成前一天。

`spouse.personKey === 'spouse'` -> 当前 UI 下配偶不算 Abfindung、不算新工作、不单独算 ALG。

### Null-Spouse（单身模式） {#null-spouse}

`inputToProfileSpouse(s)` 在 `s.withSpouse === false` 时返回中性 profile：所有保险关、`activeTaxSubject=false`、`age=0`、`taxClass=1`、所有金额 0。`inputToIncomeSpouse(s)` 同理。Engine 对 spouse 算出 0 EUR SV / 0 EUR ESt；UI 隐藏 spouse 列。

## 步骤 2：社保 (`calcSvAnteil`)

每个就业段（`oldJob` / `newJob`）按月用 BBG 封顶：

| 2026 BBG                                 | 适用    |
| ---------------------------------------- | ------- |
| `BBG_KV_PV_MONTHLY_2026 = 5.812,50 EUR`  | KV、PV  |
| `BBG_RV_ALV_MONTHLY_2026 = 8.450,00 EUR` | RV、ALV |

### 就业月份

```text
KV-AN = min(月毛, BBG_KV/PV) x healthInsuranceRate / 2
RV-AN = min(月毛, BBG_RV/ALV) x 9,30 %
ALV-AN = min(月毛, BBG_RV/ALV) x 1,30 %
```

`healthInsuranceRate` = 一般医疗保险费率 14,60 % + 用户输入 Zusatzbeitrag。

PV-AN 由 `calcPvRateAn(stamm)` 计算：

- 基础：有子女 / 未满 23 岁为 1,80 %，Sachsen 为 2,30 %
- 无子女且 `age >= 23`：加 0,60 个百分点
- 有子女：不收无子女附加费
- 第 2 到第 5 个 25 岁以下子女：每个孩子减 0,25 个百分点

App 只有年龄，没有出生月份；所以 PV 的生日月份规则是全年近似。

### ALG-I 结束后的 GKV/PV 自付

如果用户 ALG I 结束后仍失业，并且 Abfindung 根据 § 10 Abs. 1 S. 4 SGB V 阻断免费 Familienversicherung，`calcPersonIncome()` 会生成 `selfPaidHealthInsuranceSegment`。

月份：

```text
Abfindung 覆盖月数 = ceil(Abfindung / 失业前最后月毛工资)
开始 = max(unemploymentDate, ALG 结束, Abfindung 发放后的下个月)
结束 = min(newJobStart, 覆盖期结束, 年末)
```

缴费：

```text
Bemessungsgrundlage = min(失业前最后月毛工资, BBG_KV/PV)
KV 自付 = Bemessungsgrundlage x (14,0 % ermaessigter Satz + Zusatzbeitrag) x 月数
PV 自付 = Bemessungsgrundlage x PV-Mitgliedssatz x 月数
```

这段自付不会自动产生 RV/ALV 强制缴费。前端 Popover 会显示：最后月毛工资、BBG、Bemessungsgrundlage、每月自付额，以及 `每月自付 x 月数 = 合计`。

### PKV 路径 (`kvKind === 'pkv'`)

KV/PV 不按 BBG 算，直接采用用户输入的年度基础保费（`privateAnnualKV`、`privateAnnualPV`）。RV/ALV 仍只与就业月份相关。

**有意简化：** ALG-I 期间 BA 对 PKV 的补贴（§ 174 SGB III）未扣减，因此躺平场景的 PKV 成本略高估，方向上偏保守。

## 步骤 3：Vorsorgeaufwendungen (`calcPensionExpenseDeduction`, § 10 EStG)

```text
RV-Basis = min(RV-AN, VORSORGE_BASIS_HOECHSTBETRAG_2026)

GKV:
  Vorsorge = RV-Basis
            + 就业期间 KV x 96 %
            + ALG-I 后 KV 自付 x 100 %
            + PV x 100 %

PKV:
  Vorsorge = RV-Basis + KV 基础保费 x 100 % + PV 基础保费 x 100 %
```

- GKV 就业期间有 Krankengeld Anspruch，所以 KV 只有 96 % 可抵扣（§ 10 Abs. 1 Nr. 3 Satz 4 EStG）。
- ALG-I 后 GKV 自付使用无 Krankengeld Anspruch 的 ermäßigter Satz，因此按 100 % 计入。
- ALV 不作为 Sonderausgabe 抵扣。

## 步骤 4：捐款与 Sonderausgaben-Pauschbetrag

捐款上限（§ 10b EStG）：

```text
donationDeduction = min(年度捐款, 20 % x Gesamtbetrag der Einkuenfte 含 Abfindung)
```

一般 Sonderausgaben（§ 10c EStG）：

```text
generalSpecialExpensesDeduction = max(donationDeduction, 每个真实纳税人 36 EUR)
```

Joint 模式下两个真实纳税人自然合计 72 EUR。Single 模式的技术性 Null-Spouse 不拿这个 Pauschbetrag。

## 步骤 5：每人 zvE

```text
grossWages             = oldJobWage + newJobWage
incomeRelatedExpenses  = min(max(grossWages, 0), 1.230 EUR)
unusedAPB              = max(0, 1.230 EUR - incomeRelatedExpenses)
employmentIncome       = grossWages - incomeRelatedExpenses
singleParentRelief     = 符合 Single + Alleinerziehend 时的 § 24b 金额
totalIncome            = employmentIncome + rentalIncomeNet + otherIncome - singleParentRelief
specialExpenses        = pensionExpenseDeduction + generalSpecialExpensesDeduction
zvEwithoutKFB          = totalIncome - specialExpenses
```

ALG I 不进入 `totalIncome`，只进入 Progressionsvorbehalt。Abfindung 也不在 `zvEwithoutKFB` 里，而是在 § 34 中单独做税率处理；但捐款上限会把 Abfindung 作为 § 19 收入计入。

## 步骤 6：Einkommensteuertarif (§ 32a EStG 2026)

```text
zvE <= 12.348 EUR:                       ESt = 0
12.348 < zvE <= 17.799:                 ESt = (914,51*y + 1.400)*y
17.799 < zvE <= 69.878:                 ESt = (173,10*z + 2.397)*z + 1.034,87
69.878 < zvE <= 277.825:                ESt = 0,42*x - 11.135,63
zvE > 277.825:                          ESt = 0,45*x - 19.470,38
```

`x` 是向下取整后的 zvE。`y = (x - 12.348) / 10.000`，`z = (x - 17.799) / 10.000`。实现在 `grundtarifESt()`。

**Splittingtarif (§ 32a Abs. 5 EStG)：** `splittingESt(zvE) = 2 * grundtarifESt(zvE / 2)`。

## 步骤 7：Progressionsvorbehalt (§ 32b EStG)

ALG I 免税，但抬高税率。进入税率前，要先扣除未被工资使用掉的 Arbeitnehmer-Pauschbetrag：

```text
algForProgression = max(0, ALG I - min(ALG I, unusedAPB))
besSatz = ESt(zvE + algForProgression) / (zvE + algForProgression)
tariflicheESt = besSatz x zvE
```

Zusammenveranlagung 时，每个人先各自算未用 APB，再汇总。实现在 `estWithProgressionsvorbehalt(zvE, progressionIncome, joint)`。

## 步骤 8：Fünftelregelung (§ 34 Abs. 1 EStG)

普通情况：

```text
ESt = ESt(zvE_ord) + 5 x (ESt(zvE_ord + Abfindung / 5) - ESt(zvE_ord))
```

这里的 `ESt(...)` 已经包含 Progressionsvorbehalt。

§ 34 Abs. 1 Satz 3 特例：

```text
如果 zvE_ord < 0 且 zvE_ord + Abfindung > 0:
  ESt = 5 x ESt((zvE_ord + Abfindung) / 5)
```

实现在 `tariffEstWithFuenftelAndProgrV(zvEord, abfindung, progressionIncome, joint)`。UI Popover 会单独展示这个特例公式。

## 步骤 9：KFB + Kindergeld 择优 (§ 31 EStG)

| 方案     | 公式                                                                                |
| -------- | ----------------------------------------------------------------------------------- |
| 不扣 KFB | `tariffIncomeTaxWithoutKFB = tariffEstWithFuenftelAndProgrV(zvEwithoutKFB, ...)`    |
| 扣 KFB   | `tariffIncomeTaxWithKFB = tariffEstWithFuenftelAndProgrV(zvEwithoutKFB - KFB, ...)` |

```text
kfbSavings   = tariffIncomeTaxWithoutKFB - tariffIncomeTaxWithKFB
kfbPreferred = kfbSavings > childBenefitShare
assessedIncomeTax =
  kfbPreferred ? tariffIncomeTaxWithKFB + childBenefitShare : tariffIncomeTaxWithoutKFB
```

2026 常量：

|               | Einzelveranlagung（每位父母半份） | Zusammenveranlagung（全额） |
| ------------- | --------------------------------- | --------------------------- |
| 每孩 KFB      | 4.878 EUR                         | 9.756 EUR                   |
| Kindergeld    | 129,50 EUR/月                     | 259 EUR/月                  |
| 年 Kindergeld | 1.554 EUR                         | 3.108 EUR                   |

KFB/BEA 非对称转移未建模；UI 中的 `childAllowance` 只是信息字段。

## 步骤 10：Solidaritätszuschlag (SolzG 2026)

Soli 使用 § 51a EStG 的 Zuschlagsteuer-Bemessungsgrundlage。若有孩子，这个基数是“含 KFB 的 ESt”，不包含 § 31 中的 Kindergeld 加回。

| Veranlagung         | Freigrenze     | Milderungszone 约到 |
| ------------------- | -------------- | ------------------- |
| Einzelveranlagung   | 20.350 EUR ESt | 37.839 EUR          |
| Zusammenveranlagung | 40.700 EUR ESt | 75.678 EUR          |

```text
Soli = 0，如果 Basis <= Freigrenze
否则 min(5,5 % x Basis, 11,9 % x (Basis - Freigrenze))
```

实现在 `calcSoli()` 和 `calcSoliJoint()`。

## 步骤 11：Kirchensteuer

```ts
function kirchensteuerRate(state: string): number {
  return state === "BY" || state === "BW" ? 0.08 : 0.09;
}
```

Kirchensteuer 也使用 § 51a 基数：含 KFB 的 ESt，不含 Kindergeld 加回。产品假设：Familie 模式下夫妻双方 Kirchensteuer 状态相同；不建模“只有一方缴 Kirchensteuer”。共同 Kirchensteuer 在表格展示上平分到 User/Spouse。

## Joint 模式：分摊回个人

`distributeJointToPersons()` 把共同 ESt 和 Soli 按各自 Einzel-`tariffIncomeTaxWithoutKFB` 比例分摊。Kirchensteuer 按产品假设平分。这只是表格展示；真正有效的是 `jointTax`。

## 2026 年常量 - 来源清单

| 常量                                                       | 值            | 来源                   |
| ---------------------------------------------------------- | ------------- | ---------------------- |
| `GRUNDFREIBETRAG_2026`                                     | 12.348 EUR    | § 32a Abs. 1 EStG      |
| Tarifkoeffizienten Zone 2-5                                | 见文件        | § 32a Abs. 1 EStG 2026 |
| `ARBEITNEHMER_PAUSCHBETRAG`                                | 1.230 EUR     | § 9a Nr. 1a EStG       |
| `SONDERAUSGABEN_PAUSCHBETRAG_SINGLE`                       | 36 EUR        | § 10c EStG             |
| `KFB_FULL_PER_CHILD_2026`                                  | 9.756 EUR     | § 32 Abs. 6 EStG       |
| `KINDERGELD_PER_MONTH_PER_CHILD_2026`                      | 259 EUR       | § 66 EStG              |
| `ENTLASTUNGSBETRAG_ALLEINERZIEHENDE_BASE_2026`             | 4.260 EUR     | § 24b EStG             |
| `ENTLASTUNGSBETRAG_ALLEINERZIEHENDE_ADDITIONAL_CHILD_2026` | 240 EUR       | § 24b EStG             |
| `BBG_KV_PV_MONTHLY_2026`                                   | 5.812,50 EUR  | SvEV 2026              |
| `BBG_RV_ALV_MONTHLY_2026`                                  | 8.450 EUR     | SvEV 2026              |
| `ALLGEMEINER_KV_RATE`                                      | 14,60 %       | § 241 SGB V            |
| `ERMAESSIGTER_KV_RATE`                                     | 14,00 %       | § 243 SGB V            |
| `RV_RATE_AN`                                               | 9,30 %        | § 158 SGB VI           |
| `ALV_RATE_AN`                                              | 1,30 %        | § 341 SGB III          |
| `PV_RATE_TOTAL_WITH_CHILD`                                 | 3,60 %        | § 55 SGB XI            |
| `PV_CHILDLESS_SURCHARGE_RATE`                              | 0,60 个百分点 | § 55 SGB XI            |
| `PV_CHILD_DISCOUNT_RATE`                                   | 0,25 个百分点 | § 55 SGB XI            |
| `VORSORGE_BASIS_HOECHSTBETRAG_2026`                        | 30.230 EUR    | § 10 Abs. 3 EStG       |
| `SPENDEN_HOECHSTGRENZE_RATE`                               | 20 %          | § 10b Abs. 1 EStG      |
| `SOLI_FREIGRENZE_SINGLE_2026`                              | 20.350 EUR    | § 3 SolzG              |
| `SOLI_FREIGRENZE_JOINT_2026`                               | 40.700 EUR    | § 3 SolzG              |
| `SOLI_RATE`                                                | 5,5 %         | § 4 SolzG              |
| `SOLI_MILDERUNGSZONE_RATE`                                 | 11,9 %        | § 4 SolzG              |
| `KIST_RATE_BY_BW` / `KIST_RATE_OTHER`                      | 8 % / 9 %     | 各州 Kirchensteuer 法  |

> 产品假设：如果第二个预测税年是 2027，App 仍沿用 2026 参数作为预测基础；这是有意设计，直到更晚年度参数被正式维护进 App。

## 有意为之的简化（汇总）

1. 不支持 KFB/BEA 非对称转移。
2. Single + children 已支持 § 24b，但不覆盖所有分居/转移细节。
3. ALG-I 期间 BA 对 PKV 的补贴未扣。
4. ALG-I 结束后的 GKV/PV 自付是估算；Krankenkasse Bescheid、最低缴费基数、Bürgergeld、特殊家庭保险边界不覆盖。
5. 不算月度 Lohnsteuer 预扣，只算年度 ESt。
6. Kirchensteuer Kappung、besonderes Kirchgeld、夫妻一方缴 Kirchensteuer 不建模。
7. Midijob/Minijob、Kapitalerträge、Riester/Rürup、V&V 详细 Werbungskosten/AfA 不建模。
