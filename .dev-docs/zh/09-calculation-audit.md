# 09 - 计算逻辑终检审计

日期：2026-06-19  
来源：由 2026-06-19 的临时终检报告整理而来。

## 用途

本文档总结最后一轮税务和社保计算逻辑审计。它不替代 [03 - 计算引擎](./03-calculation-engine.md)，而是专门记录：

- 哪些内容已经检查；
- 哪些属于产品假设；
- 哪些问题已经修正；
- 哪些边界仍然保留为范围限制。

## 总体结论

审计后，核心计算逻辑适合当前产品目标：围绕 Abfindung、ALG I、新工作收入和社保支出，提供非约束性的、可解释的年度净额估算。App 仍然不能替代 Steuerberater、Finanzamt、工资单系统或 Krankenkasse 的正式 Bescheid。

最重要的设计边界仍然是：第二个预测税年继续使用 2026 年参数。这不是对未来真实税法的判断，而是在还没有采用 2027 实际参数前，用 2026 法规做保守外推。

## 验证结果

审计过程中最近一次执行：

```bash
cmd.exe /d /c "cd frontend && npm run build"
```

结果通过。该命令覆盖 `eslint`、`prettier --check`、`i18n:check`、`vue-tsc -b` 和 `vite build`。另外也执行过 `git diff --check -- . ':(exclude)frontend/public/font-roboto/OFL.txt'`，没有发现空白格式问题。

之前 `CalculationView.vue` 和 `CalculationGroup.vue` 的 TypeScript 类型不一致问题已经解决：计算步骤展示类型现在统一放在 `frontend/src/types/calculationSteps.ts`。

## 产品假设

| 主题                   | 决定                                                                              | 结果                                               |
| ---------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------- |
| 失业年份之后的预测税年 | 继续使用 2026 年税务和社保参数                                                    | 2027 结果是预测，不是按 2027 实际税法核算          |
| Abfindung 与 § 34 EStG | 产品中的 Abfindung 语义限定为基本满足 Fünftelregelung 的 Entlassungsentschädigung | 不额外做 Entschädigung / Zusammenballung 条件验证  |
| 家庭模式 Kirchensteuer | 默认夫妻双方 Kirchensteuer 状态一致                                               | 不建模“只有一方缴 Kirchensteuer”                   |
| 结果性质               | 年度 Einkommensteuer / 现金流估算                                                 | 不做月度 Lohnsteuer 工资单计算，也不是正式报税软件 |

## 审计状态

| 模块                              | 状态           | 结论                                                                                                         |
| --------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------ |
| § 32a EStG 2026 与 Splitting      | 已确认         | Grundtarif、Splittingverfahren 和基础儿童数值实现方向合理。                                                  |
| Kindergeld/KFB 与 § 31 EStG       | 已确认但有边界 | Günstigerprüfung 思路正确；KFB/BEA 转移仍不建模。                                                            |
| Solidaritätszuschlag 2026         | 已修正         | Freigrenze 更新为 20,350 EUR / 40,700 EUR；过渡区用 11.9% 规则限制。                                         |
| Pflegeversicherung                | 已修正         | 已处理无子女附加费、多子女折扣、Sachsen 就业期特殊规则。                                                     |
| § 32b EStG ALG I                  | 已修正         | ALG I 进入 Progressionsvorbehalt 前会扣除未使用的 Arbeitnehmer-Pauschbetrag。                                |
| § 34 Abs. 1 Satz 3 EStG           | 已修正         | 普通 zvE 为负、总 zvE 为正的特例已实现。                                                                     |
| § 24b Alleinerziehende            | 已修正但有边界 | Single + 有孩子时可选择 Alleinerziehend；KFB/BEA 转移仍不建模。                                              |
| Sonderausgaben-Pauschbetrag       | 已修正         | 每个真实纳税人 36 EUR，Zusammenveranlagung 实际为 72 EUR，进入一般 Sonderausgaben。                          |
| ALG-I Anspruchsdauer              | 已修正         | 按年龄和过去 5 年内缴纳失业保险的月份数计算，符合 § 147 SGB III 结构。                                       |
| Soli/Kirchensteuer 基数           | 已修正但有边界 | Zuschlagsteuer 使用 § 51a EStG 的 Kinderfreibetrag 基数；Kappung、besonderes Kirchgeld、夫妻混合场景不建模。 |
| ALG-I 结束后的 GKV/PV             | 部分建模       | 因 Abfindung 阻断 Familienversicherung 的 freiwillige GKV/PV 自缴已做保守估算。                              |
| PKV、BA Zuschuss、Midijob/Minijob | 范围外         | 继续作为明确的产品简化。                                                                                     |

## 关键修正

### Solidaritätszuschlag 2026

2026 年 Soli Freigrenze 不是 2025 年的值。本轮已修正为：

- single：20,350 EUR Einkommensteuer-Bemessungsgrundlage；
- joint：40,700 EUR Einkommensteuer-Bemessungsgrundlage；
- 完整 5.5% Soli 大约从 37,839 EUR / 75,678 EUR 开始。

### Pflegeversicherung

PV-AN 计算现在考虑：

- 通常按 `age >= 23` 处理无子女附加费；
- 第 2 到第 5 个 25 岁以下孩子的多子女折扣；
- Beschäftigung 期间 Sachsen 特殊规则；
- ALG-I 之后 freiwillige Selbstzahler 阶段不再使用 Sachsen 雇员/雇主拆分差异。

限制：因为没有收集出生月份，所以无法精确到“23 岁生日所在月份结束后”。

### ALG I 与 Progressionsvorbehalt

当某个税年 Arbeitnehmer-Pauschbetrag 没有被 Arbeitslohn 完全用掉时，未使用部分会先从 ALG I 中扣除，剩余 ALG I 才进入 § 32b EStG 的 Progressionsvorbehalt。家庭模式下按本人和配偶分别计算，避免一方未使用的 Pauschbetrag 错误转给另一方。

### § 34 EStG 负 ordinary zvE 特例

如果不含 Abfindung 的 zvE 为负，但加上 Abfindung 后总 zvE 为正，App 使用 Satz 3 逻辑：

```text
5 * ESt((ordinary zvE + Abfindung) / 5)
```

### ALG-I 结束后的 GKV/PV 自缴

高额 Abfindung 可能根据 § 10 SGB V 阻断 ALG-I 结束后的配偶 Familienversicherung。因此 App 会在以下条件同时成立时估算 freiwillige GKV/PV 自缴：

- ALG I 已结束；
- 当前场景中还没有新工作；
- Abfindung 推导出的阻断期仍未结束；
- 用户是 gesetzlich versichert。

Bemessungsgrundlage 为 `min(失业前最后月毛工资, KV/PV-BBG)`。如果用户没有输入最后月工资，App 会用旧工作当年总收入和失业前完整工作的月份数推导平均月工资。界面说明会分别显示：

- 用户输入或推导出的最后月毛工资；
- Beitragsbemessungsgrenze；
- 实际 Bemessungsgrundlage；
- 每月自缴金额乘以受影响月份数。

这个自缴阶段不会自动产生 Rentenversicherung 或 Arbeitslosenversicherung 缴费。

## 仍保留的范围限制

- 分居/离异父母中的 KFB/BEA 转移没有建模。
- Besonderes Kirchgeld、Kirchensteuer Kappung、夫妻只有一方缴 Kirchensteuer 没有建模。
- PKV 在 ALG-I 期间的 Bundesagentur Zuschuss 仍简化处理。
- Bürgergeld、Midijob/Minijob、Kapitalerträge、Riester/Rürup、Vermietung und Verpachtung 的详细成本/AfA 不在范围内。
- ALG-I 后的 GKV/PV 自缴是保守估算，不是 Krankenkasse Bescheid。最低 Bemessungsgrundlage、其他收入和 Krankenkasse 个案审核可能造成差异。
- Steuerklasse/Faktor 不影响当前年度 Einkommensteuer 计算。这对年度核税合理，但不适合模拟工资单预扣。

## 建议的后续保障

1. 给 engine 增加 golden tests：single/family、 getrennt/gemeinsam、Abfindung 当年/次年、只有 ALG I 的年份、Soli 阈值附近、PV 无子女/一个孩子/多个孩子、§ 34 Satz 3、ALG-I 后 GKV/PV 自缴。
2. 对 KFB/BEA 转移，要么在 UI 中明确说明不支持，要么后续单独建模。
3. 如果未来产品决定使用 2027 实际参数，需要同步更新中心常量和本文档。

## 参考法条

- EStG：§§ 9a, 10, 10b, 10c, 24b, 31, 32, 32a, 32b, 34, 51a, 66
- SolzG 1995：§§ 3, 4, 6
- SGB III：§ 147
- SGB V：§§ 10, 240, 241, 242, 243
- SGB XI：§§ 55, 58

## 2027/2028 年度换参清单

如果以后 App 不再有意使用 2026 年数值，而是要真正支持 2027 和 2028 年的计算，至少需要检查和更新下面这些内容。主要入口是 `frontend/src/tax-parameters/*.json`；`frontend/src/calculation/constants.ts` 只是兼容旧导出名的兼容层。具体年度升级流程见 [10 - 更新年度参数](./10-tax-parameter-upgrade.md)。

| 模块                                          | 需要检查 / 更新                                                                                                                                                                    | 代码和文案位置                                                                                                                                                                                                                    |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Einkommensteuertarif § 32a EStG               | Grundfreibetrag、各税率区间边界、累进区系数、比例税区、Reichensteuer 边界、取整规则；Splitting 形式仍是 `2 * Grundtarif(zvE / 2)`，但必须使用新年度 Grundtarif。                   | `constants.ts` 中的 `GRUNDFREIBETRAG_2026`、`TARIF_*_2026`；`engine.ts` 的 `grundtarifESt`；i18n 中写着 "Grundfreibetrag 12.348 €" 的说明                                                                                         |
| Arbeitnehmer- / Sonderausgaben-Pauschbetrag   | Arbeitnehmer-Pauschbetrag § 9a、Sonderausgaben-Pauschbetrag § 10c、Spendenabzug § 10b 的 20% 上限是否变化。                                                                        | `ARBEITNEHMER_PAUSCHBETRAG`、`SONDERAUSGABEN_PAUSCHBETRAG_*`、`SPENDEN_HOECHSTGRENZE_RATE`；i18n 计算说明                                                                                                                         |
| 子女 / 家庭                                   | Kinderfreibetrag 与 BEA、KFB 半额、Kindergeld 月额、§ 24b Alleinerziehende Entlastungsbetrag 以及每增加一个孩子的追加额。                                                          | `KFB_FULL_PER_CHILD_2026`、`KFB_HALF_PER_CHILD_2026`、`KINDERGELD_PER_MONTH_PER_CHILD_2026`、`ENTLASTUNGSBETRAG_ALLEINERZIEHENDE_*`；`InputView.vue` 默认 `childBenefitMonthlyPerChild`；i18n 中的 259 €、9.756 €、4.260 €、240 € |
| Solidaritätszuschlag                          | single/joint Freigrenze、Milderungszone 上限、Soli 税率 5.5%、Milderungsrate 11.9%、§ 51a 计算基数。                                                                               | `SOLI_FREIGRENZE_*`、`SOLI_OBERGRENZE_*`、`SOLI_RATE`、`SOLI_MILDERUNGSZONE_RATE`；`engine.ts` 的 `calcSoli*`；`CalculationView.vue`；i18n Soli 公式                                                                              |
| Kirchensteuer                                 | Bayern / Baden-Württemberg 8%、其他州 9% 是否仍然适用；是否要把 Kappung、besonderes Kirchgeld 纳入产品范围。                                                                       | `KIST_RATE_BY_BW`、`KIST_RATE_OTHER`、`kirchensteuerRate`；i18n 的 `churchTaxInfoTooltip`                                                                                                                                         |
| 社保 BBG                                      | KV/PV 月度和年度 BBG、RV/ALV 月度和年度 BBG；检查是否重新出现地区差异。                                                                                                            | `BBG_KV_PV_MONTHLY_2026`、`BBG_RV_ALV_MONTHLY_2026`；i18n 中的 5.812,50 €、8.450 €、69.750 €、101.400 €                                                                                                                           |
| Krankenversicherung                           | 一般 KV 费率、ermäßigter KV 费率、平均 Zusatzbeitrag、UI 默认 Zusatzbeitrag；JAEG/Jahresarbeitsentgeltgrenze。用户可以手动覆盖 Zusatzbeitrag，但默认值和 tooltip 应保持一致。      | `ALLGEMEINER_KV_RATE`、`ERMAESSIGTER_KV_RATE`；`InputView.vue` 默认 `healthInsuranceAdditionalRate` 和固定显示 `14.6`；i18n 中的 14,60%、14,0%、平均 Zusatzbeitrag、JAEG 73.800 €                                                 |
| Pflegeversicherung                            | 有子女总费率、雇员份额、Sachsen 特例、无子女附加费、多子女折扣、可享折扣的最大孩子数、无子女附加费年龄边界。                                                                       | `PV_RATE_TOTAL_WITH_CHILD`、`PV_RATE_AN_WITH_CHILD`、`PV_RATE_AN_WITH_CHILD_SACHSEN`、`PV_CHILDLESS_SURCHARGE_RATE`、`PV_CHILD_DISCOUNT_RATE`、`PV_CHILD_DISCOUNT_MAX_CHILDREN`；i18n PV 说明                                     |
| Rentenversicherung / Arbeitslosenversicherung | RV 雇员费率、ALV 雇员费率、双方分担规则、对应 BBG；确认 freiwillige 自缴阶段是否仍不产生 RV/ALV Pflichtbeiträge。                                                                  | `RV_RATE_AN`、`ALV_RATE_AN`；i18n 中的 9,30%、1,30%、2,60%                                                                                                                                                                        |
| Vorsorgeaufwendungen § 10 EStG                | Basisaltersvorsorge Höchstbetrag、RV 100% 抵扣、就业期 GKV 96% 口径、无 Krankengeld 权利的 KV 自缴 100% 口径、PV 抵扣、ALV 不作为 Sonderausgabe 抵扣。                             | `VORSORGE_BASIS_HOECHSTBETRAG_2026`、`VORSORGE_KV_KRANKENGELD_ABSCHLAG`；`calcPensionExpenseDeduction`；i18n Vorsorge 公式                                                                                                        |
| ALG I                                         | § 147 SGB III 领取期限表、Anwartschaftszeit、Sperrzeit / Ruhezeit 逻辑、tooltip 中的 ALG I 计算公式，包括 60% / 67% 和概算社保扣除。                                               | `inputAdapter.ts` 的 `deriveAlgDurationMonths`；`InputView.vue` 的 `deriveAlgDurationMonthsByInsurance`；i18n ALG 文案                                                                                                            |
| ALG-I 结束后的 GKV/PV 自缴                    | § 10 SGB V 对 Entlassungsentschädigung 和 Familienversicherung 的规则、§ 240 SGB V beitragspflichtige Einnahmen、ermäßigter KV Satz、最低 Bemessungsgrundlage、Krankenkasse 实务。 | `calcPersonIncome` 的自缴 segment；`calcSvAnteil`；i18n KV/PV 弹窗；`03-calculation-engine.md`                                                                                                                                    |
| Fünftelregelung / Zuschlagsteuern             | 检查 § 34 EStG、§ 32b EStG、§ 51a EStG 结构是否变化；特别是 § 34 Satz 3、ALG I 扣未使用 APB、Soli/KiSt 使用 KFB 基数。                                                             | `tariffEstWithFuenftelAndProgrV`、`estWithProgressionsvorbehalt`、`computePersonTax`、`computeJointTax`；i18n 计算解释                                                                                                            |
| 硬编码年份和示例文案                          | 所有写着 "2026" 的文本、01.08.2026 示例日期、2026/2027 fallback 日期、免责声明、图表说明都要同步更新。                                                                             | `rg -n -e "2026" -e "2027" -e "12\\.348" -e "259" -e "5\\.812" -e "8\\.450" -e "20\\.350" -e "40\\.700" frontend/src .dev-docs`                                                                                                   |
| 测试和合理性校验                              | 使用新年度数值更新 golden tests：single/family、separate/joint、Abfindung 当年/次年、只有 ALG I 的年份、Soli 阈值附近、PV 子女场景、§ 34 Satz 3、ALG-I 后 GKV/PV 自缴。            | 补充测试文件；然后运行 `npm run build`、`npm run i18n:check`、`git diff --check`                                                                                                                                                  |

重要：如果只是数值变化、计算结构不变，应通过 `frontend/src/tax-parameters/*.json` 更新。如果法律计算逻辑本身变化，JSON 不够，需要同步扩展 engine、UI 和审计文档。
