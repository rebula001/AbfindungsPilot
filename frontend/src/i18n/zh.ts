// 中文文案集合：键结构与 de.ts 完全对应
// 涉及德国税法 / 社保的专有名词（§ 32a EStG、ALG I、Soli、KFB、KV/PV/RV/ALV、GKV/PKV、zvE、ProgrV、Fünftelregelung 等）
// 一律保留德文/缩写，并以中文括注，便于在德国税务语境中精确对应。
export default {
  app: {
    name: '离职补偿指南',
    logoAlt: '离职补偿指南图表标'
  },
  nav: {
    input: '数据输入',
    calculation: '计算过程',
    chart: '图表',
    menuLabel: '主菜单：数据输入、计算过程、图表'
  },
  layout: {
    showInputPanel: '展开「数据输入」',
    hideInputPanel: '收起「数据输入」',
    showCalculationPanel: '显示「计算过程」',
    showChartPanel: '显示「图表」'
  },
  emptyState: {
    title: '尚未保存任何数据',
    intro: '要查看您的个人计算结果，请按以下步骤操作：',
    step1: '在左侧打开「数据输入」面板。',
    step2: '填写您的个人信息和财务数据。',
    step3: '点击「保存数据」——计算过程和图表会立即出现。',
    disclaimerTitle: '重要法律提示',
    disclaimerBody:
      '本应用<strong>免费</strong>提供，仅用于<strong>非约束性的参考</strong>。所有计算均为基于 {taxYear} 年德国税法的简化估算，<strong>不能代替税务、法律或财务咨询</strong>。我们对结果的准确性、完整性或时效性<strong>不承担任何责任</strong>——尤其是因使用本结果而产生的任何经济损失。如需具有约束力的结论，请咨询<strong>税务顾问 (Steuerberater)</strong> 或您所在的税务局 (Finanzamt)。<br><br><strong>数据隐私：</strong>您输入的所有数据仅保存在本地浏览器缓存中（3 小时），任何时候都不会上传到任何服务器。'
  },
  workspace: {
    sections: {
      basic: '基础数据',
      income: '收入与支出'
    }
  },
  form: {
    yes: '是',
    no: '否',
    submit: '保存数据',
    reset: '重置',
    requiredField: '必填项',
    savedToastSummary: '数据已保存',
    savedToastDetail: '您输入的数据已保存到本地浏览器缓存，仅用于本地计算。不会上传任何个人数据到服务器。缓存有效期 3 小时。',
    resetToastSummary: '缓存已清除',
    resetToastDetail: '本地缓存已清空，所有字段已恢复为默认值。',
    familyType: '家庭状况',
    familyTypeSingle: '单身 (Single)',
    familyTypeFamily: '家庭 (Familie)',
    spouseSection: '配偶 (Ehepartner)',
    taxClassOwn: '您的工资税等级 (Steuerklasse)',
    taxClassFactor: '工资税卡上的因子 (Faktor)',
    taxClassFactorAriaLabel: '关于因子的提示（IV 类带因子）',
    taxClassFactorTooltip:
      '<p>工资税等级 <strong>IV mit Faktor</strong>（带因子的 IV 类）中的<strong>因子 (Faktor)</strong> 把双方配偶的<strong>每月工资税预扣额 (Lohnsteuer-Vorauszahlung)</strong> 在全年中更公平地分摊。</p><p><strong>说明：</strong>本应用计算的是<strong>年度所得税 (Jahres-Einkommensteuer)</strong> 的核定 (Veranlagung)，并不是月工资税。因此该因子<strong>不会</strong>影响最终结果——这里仅为参考，不会传入计算引擎。</p>',
    taxClassInfoAriaLabel: '关于工资税等级的提示',
    churchTax: '是否缴纳教会税 (Kirchensteuer)',
    churchTaxInfoAriaLabel: '关于教会税的提示',
    federalState: '您所在的联邦州 (Bundesland)',
    federalStatePlaceholder: '选择联邦州',
    healthInsurance: '医疗保险 (Krankenversicherung)',
    healthInsuranceInfoAriaLabel: '关于医疗保险的提示',
    healthInsuranceRate: '医疗保险费率',
    healthInsuranceRateInfoAriaLabel: '关于医疗保险费率的提示',
    baseHealthInsuranceRate: '一般保险费率 (Allgemeiner Beitragssatz)',
    privateHealthInsuranceAnnual: '私人医疗保险费 / 年',
    privateCareInsuranceAnnual: '私人护理保险费 / 年',
    privateInsuranceDeductibleAriaLabel: '关于可抵扣金额的提示',
    hasChildren: '是否有子女？',
    careInsuranceInfoAriaLabel: '关于护理保险 (Pflegeversicherung) 的提示',
    childrenUnder25: '25 岁以下子女人数',
    singleParentRelief: '您是单亲抚养人吗？',
    singleParentReliefAriaLabel: '关于单亲减负额 (Entlastungsbetrag) 的提示',
    childAllowance: '子女免税额 (Kinderfreibetrag, KFB)',
    childAllowanceInfoAriaLabel: '关于 KFB 的提示',
    childBenefitMonthlyPerChild: '儿童金 (Kindergeld) 每月每个孩子',
    childBenefitInfoAriaLabel: '关于 Kindergeld 的提示',
    age: '您的年龄',
    pensionInsurance: '养老保险 (Rentenversicherung)',
    pensionInsuranceInfoAriaLabel: '关于养老保险的提示',
    unemploymentInsurance: '失业保险 (Arbeitslosenversicherung)',
    unemploymentInsuranceInfoAriaLabel: '关于失业保险的提示',
    hasNewJob: '已找到新工作',
    hasNewJobAriaLabel: '关于「已找到新工作」选项的提示',
    hasNewJobTooltip:
      '<p><strong>启用</strong>：新工作的开始日期与月度毛工资视为<strong>固定值</strong>。计算和图表只使用这两个值（一条直线，而不是扫描）。计算视图中的滑块会被锁定。</p><p><strong>未启用</strong>：尚无具体的工作。系统会基于<strong>工资带宽</strong>（最小 / 最大 / 步长）和失业开始后的 17 个月进行扫描；图表上每一档工资为一条曲线，计算视图允许任意组合试算。</p>',
    salaryRangeSection: '工资带宽 (Sweep，用于图表)',
    salaryRangeSectionAriaLabel: '关于工资带宽的提示',
    salaryRangeSectionTooltip:
      '<p>这三个值（<strong>最小</strong>、<strong>最大</strong>、<strong>步长</strong>）会生成一组新工作可能的<strong>月毛工资</strong>—— 例如 5.000 €、5.500 €、…、8.000 €。</p><ul><li><strong>用途：</strong>每个值在<strong>图表</strong>中绘制为一条独立颜色的曲线，并在<strong>计算视图</strong>中作为可选档位。</li><li><strong>规则：</strong>最多生成 <strong>7 档</strong>。如果 (Max − Min) / 步长 > 6，步长会自动向上调整。</li><li><strong>原因：</strong>折线图中超过 7 条线视觉上几乎无法区分；同时调色板基于 7 种区分度高的彩虹色（红 · 橙 · 黄 · 绿 · 青 · 蓝 · 紫）。</li></ul><p>提示：要更精细的分辨率，请缩小带宽 (Max − Min)；要更宽的概览，请增大步长。</p>',
    expectedMonthlySalaryMin: '最低月工资',
    expectedMonthlySalaryMax: '最高月工资',
    expectedMonthlySalaryStep: '步长',
    newJobStartDate: '新工作开始日期',
    newJobMonthlySalary: '新工作月毛工资',
    unemploymentSection: '解约金 (Abfindung) 与失业金 (ALG I)',
    abfindungGross: 'Abfindung（解约金，毛额）',
    unemploymentDate: '失业开始日期',
    possibleSeverancePaymentDates: 'Abfindung 可能的发放日期',
    possibleSeverancePaymentDatesAriaLabel: '关于可能发放日期的提示',
    possibleSeverancePaymentDatesTooltip:
      '<p>由<strong>失业开始日期</strong>推导得出 —— 应用会比较两种发放时点的税负：</p><ul><li><strong>同年发放</strong>（失业当月 15 日）：Abfindung 与当年工资叠加 → 累进效应更强。</li><li><strong>次年发放</strong>（1 月 15 日）：次年的 zvE（应税所得）通常较低 → <strong>Fünftelregelung（五分之一规则，§ 34 EStG）</strong>效果更好。</li></ul>',
    oldEmployerIncomeCurrentYear: '原雇主毛工资合计（当年）',
    oldEmployerIncomeCurrentYearAriaLabel: '关于原雇主毛工资的提示',
    oldEmployerIncomeCurrentYearTooltip:
      '<p>失业当年从原雇主获得的<strong>毛工资 (Bruttoarbeitslohn)</strong> 总额 —— 区间为 <strong>1 月 1 日至失业开始前一天</strong>。</p><p>例：失业开始于 {exampleUnemploymentDateIso} → 此处填入 {exampleOldJobStartIso} 至 {exampleOldJobEndIso} 的毛工资（含休假/圣诞补贴，不含 Abfindung）。</p>',
    lastMonthlyGrossBeforeUnemployment: '失业前最后一个月毛工资',
    lastMonthlyGrossBeforeUnemploymentAriaLabel: '关于失业前最后月工资的提示',
    lastMonthlyGrossBeforeUnemploymentTooltip:
      '<p>这个月工资只用于粗略估算 ALG I 结束后的 GKV/PV 自付金额。</p><p>背景：根据 § 10 Abs. 1 S. 4 SGB V，Abfindung 可能阻止免费挂靠配偶 Familienversicherung。App 会把 Abfindung 简化摊到若干个月，并在 ALG I 结束后按 freiwillige GKV/PV 自付估算。</p><p>如果这里填 0 €，计算会退回使用旧工作平均月毛工资。例如 {exampleUnemploymentDateIso} 开始失业，则用 1-7 月旧工作毛工资合计除以 {exampleWorkedMonths}。</p>',
    unemploymentBenefitMonthly: 'ALG I（失业金）/ 月',
    unemploymentBenefitMonthlyAriaLabel: '关于 ALG I 计算的提示',
    unemploymentBenefitMonthlyTooltip:
      '<p><strong>每月 ALG I</strong> 的计算如下：</p><ol><li><strong>每日核算工资 (Bemessungsentgelt)</strong> = 失业前 12 个月的应税毛工资 ÷ 365。</li><li><strong>每日给付工资 (Leistungsentgelt)</strong> = 核算工资 − 概算工资税（按 Steuerklasse） − 概算社保支出 (21%)。</li><li><strong>给付率 (Leistungssatz)</strong>：给付工资的 60 %；若至少有一个被认定的子女则为 67 %（§ 149 SGB III）。</li><li><strong>月额</strong> = 日给付 × 30。</li></ol><p>精确数值可使用<strong>联邦劳工局 (Bundesagentur für Arbeit) 官方工具</strong>计算。</p>',
    alvInsuranceMonthsLast5Years: '过去 5 年缴纳失业保险的月数',
    alvInsuranceMonthsLast5YearsAriaLabel: '关于 ALG I 保险月份数的提示',
    unemploymentBenefitDurationMonths: 'ALG I 领取期限',
    hasBenefitReductionPeriod: '封锁期 (Sperrzeit)',
    benefitReductionMonths: '封锁期月数',
    hasBenefitSuspensionPeriod: '休眠期 (Ruhezeit)',
    benefitSuspensionMonths: '休眠期月数',
    rentalIncomeSection: '出租与租赁 (Vermietung & Verpachtung, V&V)',
    rentalIncomeYearly: '租金收入 / 年（净额）',
    rentalIncomeYearlyAriaLabel: '关于租金收入的提示',
    rentalIncomeYearlyTooltip:
      '<p>请在此填写出租与租赁的<strong>净收入</strong> —— 即扣除所有相关支出（折旧 AfA、利息、维修、不可摊派的物业费、管理、保险）<strong>之后</strong>的租金收入。</p><p><strong>简化处理：</strong>本应用不自行计算 AfA 及其他 V&V 相关支出。该数值可在您的报税表 Anlage V/V（行项「Einkünfte aus Vermietung und Verpachtung」）或最近一份税务通知中找到。</p>',
    sharedIncomeUserShare: '本人 / 配偶分摊比例',
    sharedIncomeSpouseShare: '配偶分摊比例',
    donationSection: '捐赠 (Spenden)',
    donationSectionAriaLabel: '关于捐赠的提示',
    donationSectionTooltip:
      '<p>对享受税收优惠的接收方的<strong>捐赠 (Spenden)</strong> 可作为特别支出 (Sonderausgaben) 抵扣（§ 10b EStG）。</p><ul><li><strong>抵扣上限</strong>：最多<strong>总收入额 (Gesamtbetrag der Einkünfte) 的 20 %</strong> 或营业额、工资合计的 4 ‰。</li><li>未被采计的金额可结转至以后年度。</li><li><strong>对政党的捐赠</strong>另行处理（§ 34g EStG）。</li></ul>',
    donationYearly: '捐赠 / 年',
    sharedDonationUserShare: '本人 / 配偶分摊比例',
    sharedDonationSpouseShare: '配偶分摊比例',
    spouseGrossIncomeYearly: '配偶毛收入 / 年',
    otherIncomeYearly: '其他收入 / 年',
    insuranceStatutoryMandatory: '法定强制参保 (gesetzlich pflichtversichert)',
    insurancePrivate: '私人保险 (privat versichert)',
    insuranceVoluntaryStatutory: '自愿法定参保 (freiwillig gesetzlich versichert)',
    socialNotMandatory: '非法定强制参保',
    socialStatutoryMandatory: '法定强制参保',
    socialEmployerOnly: '仅雇主强制部分',
    socialEmployeeOnly: '仅雇员强制部分',
    monthsSuffix: ' 个月',
    taxClassFactorLabel: 'IV mit Faktor',
    taxClassInfoTitle: '德国工资税等级 (Lohnsteuerklassen)',
    taxClassInfoIntro: '工资税等级决定了每月从毛工资中预扣多少工资税。',
    taxClassInfoClasses: [
      '<strong>I</strong>: 单身、离异、长期分居',
      '<strong>II</strong>: 单亲（享有 Entlastungsbetrag 减负额）',
      '<strong>III</strong>: 已婚（主收入方）—— 配偶为 V 类',
      '<strong>IV</strong>: 已婚且双方收入相近',
      '<strong>IV mit Faktor</strong>: 已婚，按因子在月度间更公平分摊',
      '<strong>V</strong>: 已婚（低收入方）—— 配偶为 III 类',
      '<strong>VI</strong>: 第二份及以上工作'
    ],
    healthInsuranceInfoTooltip:
      '<p><strong>法定医疗保险 (gesetzliche Krankenversicherung, GKV)</strong> 是雇员低于<strong>年工资上限 (Jahresarbeitsentgeltgrenze, JAEG)</strong> 时的强制保险 —— {taxYear} 年为 {jaegYearly} 毛额/年（§ 6 Abs. 1 Nr. 1 SGB V）。长期高于此线者可转入<strong>私人医疗保险 (PKV)</strong> 或自愿留在 GKV。</p><p><strong>法定强制参保</strong>：JAEG 以下雇员的标准方案 —— 雇主与雇员各承担一半。</p><p><strong>自愿法定参保</strong>：JAEG 以上仍留在 GKV（如转回者、自雇者）。</p><p><strong>私人保险</strong>：PKV 替代 GKV；保费视风险与方案而定，雇主补贴最多为 GKV 最高保费的一半。</p>',
    churchTaxInfoTooltip:
      '<p>教会税在 Bayern / Baden-Württemberg 通常为所得税核算基数的 <strong>{kistRateByBw}</strong>，其他州通常为 <strong>{kistRateOther}</strong>。</p><p>有子女时，App 对 Soli / Kirchensteuer 使用 <strong>§ 51a EStG</strong> 下的核算基数：考虑 Kinderfreibetrag 后的 Einkommensteuer，不包含 Kindergeld 加回。</p><p><strong>家庭模式：</strong>App 默认夫妻双方的教会税状态相同；不单独建模“只有一方缴纳教会税”的情况。</p>',
    healthInsuranceRateInfoTooltip:
      '<p><strong>GKV 保险费率</strong>由两部分组成：</p><ul><li><strong>一般费率：{kvGeneralRate}</strong>（§ 241 SGB V）—— 固定，雇主与雇员各负担一半。</li><li><strong>各保险公司额外保费 (Zusatzbeitrag)</strong>（§ 242a SGB V）—— 各家保险公司自行制定。{taxYear} 年平均约 {kvAverageAdditionalRate}；请填写您所在保险公司的具体值。自 2019 年起也由双方平摊。</li></ul><p>雇员部分 = ({kvGeneralRate} + Zusatzbeitrag) ÷ 2，并受核算上限 (Beitragsbemessungsgrenze, BBG) 限制（{taxYear}: {bbgKvPvMonthly}/月）。</p>',
    careInsuranceInfoTooltip:
      '<p><strong>护理保险 (Pflegeversicherung) {taxYear}</strong>：核算工资在 BBG（{bbgKvPvMonthly}/月）以内的部分，费率为 {pvTotalWithChild}（无子女者 {pvChildlessTotal}）。</p><p>雇主与雇员各负担一半（雇员通常 {pvEmployeeWithChild}），萨克森州除外：萨克森州雇员费率为 {pvEmployeeWithChildSachsen}。无子女者额外的 {pvChildlessSurcharge} 附加费<strong>不</strong>由雇主分担。</p><p>25 岁以下子女可减轻雇员负担：免除无子女附加费；自第 2 个孩子起每增加一个孩子，PV 缴费率降低 {pvChildDiscount}（最多 {pvChildDiscountMaxChildren} 个孩子）。</p>',
    privateInsuranceDeductibleTooltip:
      '<p>仅私人 KV/PV 的<strong>基础部分 (Basisanteil)</strong> 可作为 Sonderausgabe 抵扣。</p><p>舒适和可选项目不在抵扣范围内。</p><p><strong>关于失业期的简化说明：</strong>领取 ALG I 期间，联邦劳工局 (BA) 会为 PKV 投保人提供最高相当于虚拟 GKV 缴费的补贴（§ 174 SGB III）—— 因此您此处填写的基础部分在失业月份事实上大部分会被覆盖。本应用仍然按全年基础保费计算，不扣除 BA 补贴。这会略微高估「躺平」情景下的 PKV 成本，从而让 Netto 结果偏向保守（倾向于「找新工作更划算」）。</p>',
    singleParentReliefTooltip:
      '<p><strong>§ 24b EStG</strong>：仅当至少一个有 Kindergeld 或 Kinderfreibetrag 资格的孩子属于您的家庭，并且您没有和另一名成年人成立共同生活家庭时适用。</p><p>{taxYear} 年：第一个孩子 <strong>{singleParentBase}</strong>，每增加一个孩子再加 <strong>{singleParentAdditionalChild}</strong>。只有您在这里确认符合条件时，App 才会把该金额纳入计算。</p>',
    childAllowanceInfoTooltip:
      '<p><strong>子女免税额 (Kinderfreibetrag, KFB + BEA = {kfbFullPerChild} / 子女, {taxYear})</strong> 在「优惠核查 (Günstigerprüfung)」中替代 Kindergeld。</p><p>0,5 = 父母各一半，1,0 = 全部转移到此人。</p><p><strong>说明：</strong>本应用目前在 Einzelveranlagung（单独核定）下始终按<strong>父母各一半</strong>处理，在 Zusammenveranlagung（共同报税）下使用<strong>整额 KFB</strong>。其他转移情形（§ 32 Abs. 6 EStG）<strong>暂不</strong>纳入计算，仅供参考。</p>',
    childBenefitInfoTooltip:
      '<p><strong>Kindergeld（儿童金）</strong> {taxYear}: 每个孩子 {kindergeldMonthlyPerChild}/月 (= {kindergeldYearlyPerChild}/年)。</p>',
    pensionInsuranceInfoTooltip:
      '<p><strong>法定养老保险 (gesetzliche Rentenversicherung)</strong> 是德国社保体系的一支，主要为雇员提供养老保障。</p><p>德国原则上<strong>强制参保</strong>。例外包括公务员、法官、军人及其他公共机构雇员，以及许多自雇者（通过 Versorgungswerk 或私人养老金独立保障）。</p><p><strong>强制参保</strong>：雇员标准方案 —— 雇员部分从毛工资中预扣。</p><p><strong>非强制参保</strong>：公务员、无 RV 义务的自雇者 —— 无雇员缴费。</p>',
    unemploymentInsuranceInfoTooltip:
      '<p><strong>失业保险 (Arbeitslosenversicherung)</strong> 在求职期间提供收入保障，并资助联邦劳工局的咨询与中介服务。</p><p>原则上对所有受雇人员<strong>强制参保</strong>；例外包括自雇者及在欧盟以外地区受雇者。</p><p><strong>{taxYear} 年费率：{alvTotalRate}</strong>（应税毛工资）—— 雇主与雇员各负担一半（各 {alvEmployeeRate}）。</p><p><strong>强制参保</strong>：雇员标准方案。</p><p><strong>非强制参保</strong>：如公务员、自雇者 —— 无 ALG I 领取权。</p>',
    alvInsuranceMonthsLast5YearsTooltip:
      '<p>根据 <strong>§ 147 SGB III</strong>，ALG I 领取期限取决于年龄，以及过去 5 年内缴纳失业保险的<strong>累计</strong>月份数。</p><p>这些月份<strong>不要求连续</strong>，中间可以有间断；关键是累计月数。同时，基本领取权还需要满足 Anwartschaftszeit（通常为过去 30 个月内至少 12 个月）。</p>',
    unemploymentBenefitDurationTooltip:
      '<p>ALG I 领取期限按 <strong>§ 147 SGB III</strong> 由年龄和保险月份共同决定。</p><ul><li>12 / 16 / 20 / 24 个保险月 → 6 / 8 / 10 / 12 个月 ALG I</li><li>满 50 岁 + 30 个保险月 → 15 个月</li><li>满 55 岁 + 36 个保险月 → 18 个月</li><li>满 58 岁 + 48 个保险月 → 24 个月</li></ul>',
    benefitReductionPeriodTooltip:
      '<p><strong>封锁期 (Sperrzeit)</strong>（§ 159 SGB III）：联邦劳工局认为失业是参保人在没有正当理由下自行造成时会施加。封锁期内<strong>不发放 ALG I</strong>；同时<strong>领取期限相应缩短</strong>。</p><p><strong>常见情形：</strong></p><ul><li><strong>因辞职导致的封锁</strong>：无正当理由（如被孤立、即将面临裁员）的自我离职或协议解除 —— 通常 <strong>12 周</strong>。</li><li><strong>拒绝合理工作机会</strong>：3、6 或 12 周（视重复次数）。</li><li><strong>努力不足</strong>或迟报失业（§ 38 SGB III）—— 通常 1 周。</li><li><strong>错过预约</strong>或拒绝参与培训 —— 1 周或更多。</li></ul><p><strong>后果：</strong>ALG I 起付推迟、最长领取期缩短，累计封锁 ≥ 21 周时整个权利失效。</p>',
    benefitSuspensionPeriodTooltip:
      '<p><strong>休眠期 (Ruhezeit)</strong>（§ 158 SGB III）：若 Abfindung 未遵守解约预告期，则 ALG 权利暂时停摆；但领取期限不变。</p>'
  },
  validation: {
    newJobBeforeUnemployment: '新工作开始日期不得早于失业开始日期。',
    benefitReductionExceedsDuration: '封锁期 ({months} 个月) 超过 ALG I 领取期 ({duration} 个月) —— ALG 将完全失效。请调整数值。'
  },
  views: {
    chart: {
      title: '图表'
    }
  },
  chart: {
    szenario: {
      title: 'Zusammenveranlagung（共同报税）下两年净收入',
      description:
        '折线图：在不同「新工作开始时间」下，两个税务年度的家庭 Netto 总额（按基础数据中的工资带宽进行 Sweep）。<br><strong>提示：</strong>将鼠标悬停在某个点上查看明细（Δ 相对躺平、额外工作月数、每月 Ø）。点击图下方按钮可隐藏/显示某条曲线。',
      xAxis: '新工作开始日期',
      yAxis: 'Netto（两年）'
    },
    szenarioSplit: {
      title: 'getrennte Veranlagung（分开报税）下两年净收入',
      description:
        '同上，但每人单独按基础税表 § 32a EStG 计税（分开报税 § 26a EStG）。<br><strong>提示：</strong>将鼠标悬停在数据点上查看明细；用图下方按钮隐藏/显示曲线。',
      xAxis: '新工作开始日期',
      yAxis: 'Netto（两年）'
    },
    szenarioSingle: {
      title: '两年净收入',
      description:
        '折线图：在不同「新工作开始时间」下，两个税务年度的 Netto 总额（按基础数据中的工资带宽进行 Sweep）。<br><strong>提示：</strong>将鼠标悬停在某个点上查看明细（Δ 相对躺平、额外工作月数、每月 Ø）。点击图下方按钮可隐藏/显示曲线。',
      xAxis: '新工作开始日期',
      yAxis: 'Netto（两年）'
    },
    legend: {
      auszahlungPrefix: '发放',
      referenceLabel: '躺平 (Liegenbleiben，参照线)'
    },
    diff: {
      differenz: '差额',
      maximum: '最大值'
    },
    tooltip: {
      diffVsLiegen: 'Δ 相对躺平: {amount}',
      extraMonths: '额外工作: {months} 个月',
      perMonth: '每多工作一个月 Ø: {amount} ({verdict})',
      perMonthVerdict: {
        negative: '不划算',
        low: '吸引力很低 (< 2.500 €)',
        mid: '一般 (2.500 – 3.000 €)',
        high: '明显划算 (≥ 3.000 €)'
      }
    },
    summary: {
      heading: '对比：找新工作 vs. 躺平',
      referenceIntro:
        '灰线（共同报税 {jointValue}，分开报税 {splitValue}）显示：本人自失业开始持续保持失业、Abfindung 在次年 ({payDateFolgejahr}) 才发放时，两年的家庭 Netto。所有彩色曲线代表「找新工作」—— 在灰线上方表示找新工作 Netto 更优，下方则相反。',
      referenceIntroSingle:
        '灰线 ({value}) 显示：本人自失业开始持续保持失业、Abfindung 在次年 ({payDateFolgejahr}) 才发放时，两年的 Netto 收入。所有彩色曲线代表「找新工作」—— 在灰线上方表示找新工作 Netto 更优，下方则相反。',
      bestPerMonth:
        '{veranlagungLabel}下的最佳选择：开始日期 {start}，月毛工资 {gross}，Abfindung 发放 {payDate} —— 即 <strong>{perMonth} / 每多工作一个月</strong>（{verdict}）。{months} 个月的额外工作可多得家庭 Netto {delta}（合计 {netto}）。',
      bestPerMonthSingle:
        '最佳选择：开始日期 {start}，月毛工资 {gross}，Abfindung 发放 {payDate} —— 即 <strong>{perMonth} / 每多工作一个月</strong>（{verdict}）。{months} 个月的额外工作可多得 Netto {delta}（合计 {netto}）。',
      perMonthVerdict: {
        negative: '不划算',
        low: '吸引力很低 —— 低于全职中位数 Netto',
        mid: '一般 —— 接近全职中位数 Netto',
        high: '明显划算 —— 高于全职中位数 Netto'
      },
      veranlagungJoint: '共同报税 (Zusammenveranlagung)',
      veranlagungSplit: '分开报税 (getrennte Veranlagung)',
      insightTitle: '需要注意的点',
      insightFuenftel: 'Fünftelregelung（§ 34 EStG，五分之一规则）在发放年度的常规 zvE 较低时效果最强 —— 通常出现在长时间失业后于次年发放的情形。',
      insightProgression: '一旦再有工资收入，边际税率上移，Fünftelregelung 的优势就会缩小。',
      insightSv: '新工资还会产生 KV / PV / RV / ALV 缴费（雇员部分约 21 %，至 BBG 为止）—— 它们会进一步压缩 Netto 增量。',
      insightTimingTitle: '实操建议',
      insightTimingPayDate: '尽量把 Abfindung 安排到常规 zvE 较低的年度 —— 通常是失业开始后的次年。',
      insightTimingStart:
        '是否找新工作，Netto 优势主要取决于<strong>月毛工资</strong> —— 工资低时往往完全消失。<strong>更早开始</strong>虽然两年绝对增量更大，但通常会拉低「每多工作一个月 Ø」的数值，因为损失的 ALG 与额外的社保/税也会被计入。',
      benchmarkTitle: '「每多工作一个月 Ø」的评级（Tooltip）',
      benchmarkBody:
        '在每个数据点的 Tooltip 中，<strong>每多工作一个月 Ø</strong>（= Δ Netto ÷ 额外工作月数）按以下阈值评级：<strong>≤ 0 €</strong> 不划算 · <strong>0 – 2.500 €</strong> 吸引力很低 · <strong>2.500 – 3.000 €</strong> 一般 · <strong>≥ 3.000 €</strong> 明显划算。基准 <strong>2.500 €/月</strong>对应德国估计的<strong>全职雇员中位数 Netto</strong>（Destatis 2023 年薪资调查，全职毛中位数 ≈ 3.978 €/月，Steuerklasse I）。<strong>说明：</strong>若您的生活水准或个人参照工资更高，您的个人阈值会上移 —— 例如 5.000 €/月。该评级仅作粗略参考。'
    }
  },
  calculation: {
    pageTitle: '计算流程 ({veranlagung})',
    pageIntro:
      '逐步推导 {veranlagung} 下的所得税 (Einkommensteuer) —— 左侧是静态的「躺平 (Liegenbleiben)」方案（本人持续失业），右侧是交互式的「找新工作」方案。',
    pageDisclaimer:
      '所有计算遵循 {taxYear} 年德国税法 (EStG, SolzG, SGB V/VI/III, {taxYear} 年 BBG 条例，含通胀调整法)。由于 {y1} 与 {y2} 年度尚无单独发布的数值，相关税表、免税额和起征额均沿用 {taxYear} 年的数值。',
    scenarios: {
      liegen: '躺平 (Liegenbleiben)',
      liegenSubtitle: '本人持续失业（无新工作）',
      neue: '找新工作',
      neueSubtitle: '可变：开始日期 / 月毛工资'
    },
    sliders: {
      newJobStartDate: '新工作开始日期（本人）',
      monthlyGrossNewJob: '新工作月毛工资（本人）',
      severancePaymentDate: 'Abfindung 发放日期',
      newJobFixedHint: '由「已找到新工作」输入项固定 —— Sweep 已禁用。'
    },
    veranlagungsart: {
      label: '核定方式 (Veranlagungsart)',
      separate: '分别',
      joint: '合并',
      separateLong: '分开报税 getrennte Veranlagung',
      jointLong: '共同报税 Zusammenveranlagung',
      singleLong: '单身 (Single)'
    },
    accordion: {
      year: '税务年度 {year}',
      summary: '总计 ({y1} + {y2})'
    },
    summary: {
      headline: '两年家庭 Netto',
      headlineSingle: '两年 Netto 收入',
      headlineHint: '本人 + 配偶 在 {y1} + {y2} 的合计 —— 扣除所有税款、社保和捐赠后实际到账的金额。',
      headlineHintSingle: '{y1} + {y2} 合计 —— 扣除所有税款、社保和捐赠后实际到账的金额。',
      verdictNeue: '找新工作能多带来 {amount} 家庭 Netto。',
      verdictNeueSingle: '找新工作能多带来 {amount} Netto 收入。',
      verdictLiegen: '躺平要好 {amount} —— 找新工作 Netto 更低。',
      verdictLiegenSingle: '躺平要好 {amount} —— 找新工作 Netto 更低。',
      verdictEven: '两种情景几乎等价（差额 {amount}）。',
      verdictEvenSingle: '两种情景几乎等价（差额 {amount}）。',
      perMonthDetail:
        '按额外工作量评估：<strong>{perMonth} 每多工作一个月 Ø</strong>（{verdict}）。在 {start} 至 {end} 之间额外工作 {months} 个月，合计多得 Netto {delta}。阈值（参照德国全职中位数 Netto ≈ 2.500 €）：≤ 0 € 不划算 · 0–2.500 € 吸引力很低 · 2.500–3.000 € 一般 · ≥ 3.000 € 明显划算。',
      breakdown: '各情景明细',
      breakdownJointHint:
        '提示（共同报税）：在把共同的 Festzus.-ESt + Soli 分摊给本人 / 配偶时，共同税额按各自单独的 Tarif-ESt 进行 {proportional}（按比例）分配 —— 仅用于直观展示个人列。具有法律约束力的数值是右侧的 {familySumme}。',
      colYear: '年度',
      colBrutto: '毛工资',
      colAbfindung: 'Abfindung',
      colAlg: 'ALG I',
      colSv: 'SV 缴费',
      colSteuer: '税款合计',
      colNetto: '家庭 Netto',
      colNettoSingle: 'Netto 收入',
      colSum: '{y1}+{y2} 合计',
      colDiff: 'Δ 找新工作 − 躺平',
      scenarioLiegen: '躺平',
      scenarioNeue: '找新工作'
    },
    person: {
      user: '本人',
      spouse: '配偶'
    },
    groups: {
      zvE: {
        title: '第 1 组：应税所得 (zvE) 的确定',
        legalBasis: '§ 2 EStG —— 课税范围；定义',
        incomeSection: '收入 (Einkünfte)',
        deductionSection: 'Sonderausgaben / 抵扣项'
      },
      sozialabgaben: {
        title: '第 2 组：社会保险缴费 (雇员部分)',
        legalBasis: 'SGB V/VI/XI/III —— 按月核算，使用 {taxYear} 年 BBG',
        deductionSection: '缴费'
      },
      est: {
        title: '第 3 组：所得税 (单独核定 / Progressionsvorbehalt / Fünftelregelung / Günstigerprüfung) + 团结税 (Soli)',
        legalBasis: '§§ 32a Abs. 1, 32b, 34, 31, 26a EStG, §§ 1 ff. SolzG —— 配偶分开报税',
        deductionSection: '附加税',
        alternativesSection: '辅助量（明细 & 优惠核查）',
        alternativesHint:
          '这些值<strong>不</strong>直接计入结果 (3)。2.1–2.4 用于 KFB ↔ Kindergeld 的 Günstigerprüfung（§ 31 EStG，结果：2.3 > 2.4 ⇒ 2.2 + 2.4，否则 2.1）。2.5 是已包含在 2.1 中、Abfindung 部分税额的拆解（§ 34 EStG）。'
      },
      netto: {
        title: '第 4 组：每人 Netto 收入',
        legalBasis: '在扣除社保、税款和自愿捐赠后实际可支配的现金',
        incomeSection: '现金流入',
        deductionSection: '现金流出'
      }
    },
    steps: {
      grossWages: {
        title: '毛工资（旧 + 新工作）',
        legalBasis: '§ 19 EStG —— 来源于非独立劳动的所得'
      },
      arbeitslosengeld: {
        title: 'ALG I（Progressionsvorbehalt 累进保留）',
        note: 'ALG I 免税，<strong>不</strong>计入 zvE。计算税率时，会先扣除未被工资使用掉的 Arbeitnehmer-Pauschbetrag (§ 32b Abs. 2 EStG)，剩余部分才进入 Progressionsvorbehalt。'
      },
      incomeRelatedExpenses: {
        title: 'Werbungskosten（雇员定额扣除）',
        legalBasis: '§ 9a Satz 1 Nr. 1 Buchst. a EStG —— 最高 {arbeitnehmerPauschbetrag}，但不超过工资；未用部分用于降低 § 32b 的 ALG 基数'
      },
      rentalIncomeNet: {
        title: '出租与租赁收入 (V&V)',
        legalBasis: '§ 21 EStG（简化，按净额，不含 AfA / 其他 Werbungskosten）。其他收入 (§ 22 EStG) 也并入收入合计 (Gesamtbetrag der Einkünfte)。'
      },
      singleParentRelief: {
        title: '单亲减负额 (Entlastungsbetrag)',
        legalBasis: '§ 24b EStG —— 第一个孩子 {singleParentBase}，每增加一个孩子 +{singleParentAdditionalChild}；仅在输入中确认符合条件时计算'
      },
      vorsorge: {
        title: 'Vorsorgeaufwendungen（养老/医疗/护理预扣，Sonderausgaben）',
        legalBasis: '§ 10 Abs. 1 Nr. 2 + 3 EStG'
      },
      spenden: {
        title: '捐赠 / Sonderausgaben-Pauschbetrag',
        legalBasis: '§§ 10b, 10c EStG —— 可扣捐赠额或 {sonderausgabenPauschbetragSingle} 定额扣除，两者取较高值'
      },
      zvE: {
        title: '应税所得 zvE（不含 KFB）',
        legalBasis: '§ 2 Abs. 5 EStG —— KFB 在 Günstigerprüfung 中才考虑'
      },
      kv: {
        title: '医疗保险 (KV-AN)',
        legalBasis: '就业期间：GKV 按半额。ALG I 结束后仍无新工作：按最后月工资/Abfindung 估算 freiwillige GKV 自付（§§ 10, 240, 243 SGB V）'
      },
      pv: {
        title: '护理保险 (PV-AN)',
        legalBasis: '就业期间：按子女状态/萨克森计算 PV 雇员部分。ALG I 结束后仍无新工作：按子女状态全额自付 PV'
      },
      rv: {
        title: '养老保险 (RV-AN)',
        legalBasis: '仅就业月份：min(月毛 ; {bbgRvAlvMonthly}) × {rvEmployeeRate} × 月数；ALG I 结束后失业状态不自动产生强制缴费'
      },
      alv: {
        title: '失业保险 (ALV-AN)',
        legalBasis: '仅就业月份：min(月毛 ; {bbgRvAlvMonthly}) × {alvEmployeeRate} × 月数；ALG I 结束后失业状态不自动产生强制缴费'
      },
      sozialabgabenGesamt: {
        title: '社保合计（雇员部分）',
        legalBasis: '= KV + PV + RV + ALV —— 领取 ALG I 期间个人不自付；ALG I 结束后可能有 KV/PV 自付'
      },
      tariffIncomeTaxWithoutKFB: {
        title: '不含 KFB 的 Tarif-ESt',
        legalBasis: '基础税表 (§ 32a Abs. 1) + ALG 扣除未用 APB 后的 ProgrV (§ 32b) + Abfindung 的 Fünftelregelung (§ 34)'
      },
      tariffIncomeTaxWithKFB: {
        title: '含 KFB 半额的 Tarif-ESt',
        legalBasis: '同 2.1，但 zvE 减 {kfbHalfPerChild} / 子女（KFB 半额）'
      },
      kfbSavings: {
        title: 'KFB 半额带来的税款节省',
        legalBasis: '= 2.1 − 2.2 —— Günstigerprüfung 中的直接比较值'
      },
      childBenefitShare: {
        title: 'Kindergeld 份额（年）',
        legalBasis: '{kindergeldHalfMonthlyPerChild}/月 × 12 × 子女数 —— 父母各一半；选择 KFB 时予以加回 (§ 31 Satz 4)'
      },
      abfindungSteuer: {
        title: 'Abfindung 对应的税款',
        legalBasis: '§ 34 EStG —— Fünftelregelung 后的额外部分（拆解；已包含在 2.1 / 2.2 中）'
      },
      soli: {
        title: '团结税 Solidaritätszuschlag',
        legalBasis: '§§ 1, 3, 4 SolzG 结合 § 51a EStG —— 含 KFB 的基数；起征点 {soliSingleFreigrenze} / {soliJointFreigrenze}'
      },
      steuerGesamt: {
        title: '税款合计',
        legalBasis: '= Festzus. ESt + Soli + Kirchensteuer；Soli/教会税使用含 KFB 的 §51a 基数（教会税 BY/BW {kistRateByBw}, 其他 {kistRateOther}）'
      },
      bruttoeinnahmen: {
        title: '毛收入合计（所有现金流入）',
        legalBasis: '= 毛工资 + Abfindung + ALG I + 租金收入 + Kindergeld 半份'
      },
      sozialabgabenAbfluss: {
        title: '社保（雇员部分）',
        legalBasis: '已在第 2 组中得出 —— 此处作为现金流出沿用'
      },
      steuerGesamtAbfluss: {
        title: '税款合计 (ESt + Soli)',
        legalBasis: '已在第 3 组中得出 —— 此处作为现金流出沿用'
      },
      spendenAbfluss: {
        title: '捐赠（实际支付）',
        legalBasis: '自愿支出；已作为 Sonderausgabe 在第 1 组 (0.5) 中扣除'
      },
      nettoEinkommen: {
        title: '每人 Netto 收入',
        legalBasis: '= 流入 − 流出 —— 年终实际留在账户的金额'
      }
    },
    abfindungBoxTitle: 'Abfindung（§ 34 EStG, Fünftelregelung 五分之一规则）',
    nettoSuffix: 'Netto',
    childUnit: { one: '个孩子', many: '个孩子' },
    popover: {
      kv: {
        formula: [
          '医疗保险：',
          '',
          '就业月份：min(月毛, KV/PV BBG) × ({kvGeneralRate} + Zusatzbeitrag) / 2 × 月数。',
          '领取 ALG I 期间：个人不自付，费用由 Bundesagentur für Arbeit 承担。',
          'ALG I 结束后仍无新工作：如果 Abfindung 根据 § 10 Abs. 1 S. 4 SGB V 阻止 Familienversicherung，',
          'App 会估算 freiwillige GKV 自付：',
          'min(最后月毛, KV/PV BBG) × ({kvReducedRate} ermäßigter Satz + Zusatzbeitrag) × 月数。',
          '',
          '这段自付期不会自动产生 RV/ALV 强制缴费。'
        ],
        detailWithoutSelfPay: ['就业期间 / PKV 输入保费 = {employment}', 'ALG I 结束后的 KV 自付 = 0 €', '', '→ KV 合计 = {total}'],
        detailWithSelfPay: [
          '就业期间 / PKV 输入保费 = {employment}',
          '',
          'ALG I 结束后的 KV 自付：',
          '最后月毛工资（输入/自动计算） = {gross}',
          'KV/PV-BBG {taxYear}          = {bbg}',
          'Bemessungsgrundlage          = min({gross}, {bbg}) = {base}',
          '月数                         = {months}',
          '费率                         = {rate}',
          '每月自付                     = {monthlySelfPay}',
          '自付合计                     = {monthlySelfPay} × {months} = {selfPay}',
          '',
          '→ KV 合计 = {employment} + {selfPay} = {total}'
        ]
      },
      pv: {
        formula: [
          '护理保险：',
          '',
          '就业月份：min(月毛, KV/PV BBG) × PV 雇员费率 × 月数。',
          'PV 雇员费率会考虑无子女附加费、多子女折扣和萨克森规则。',
          'ALG I 结束后仍无新工作：在同一核算基础上估算 PV 全额自付。',
          '自付时不再有雇主/萨克森分摊，按成员本人子女状态的全额费率计算。',
          '',
          '这段自付期不会自动产生 RV/ALV 强制缴费。'
        ],
        detailWithoutSelfPay: ['就业期间 / PKV 输入保费 = {employment}', 'ALG I 结束后的 PV 自付 = 0 €', '', '→ PV 合计 = {total}'],
        detailWithSelfPay: [
          '就业期间 / PKV 输入保费 = {employment}',
          '',
          'ALG I 结束后的 PV 自付：',
          '最后月毛工资（输入/自动计算） = {gross}',
          'KV/PV-BBG {taxYear}          = {bbg}',
          'Bemessungsgrundlage          = min({gross}, {bbg}) = {base}',
          '月数                         = {months}',
          '费率                         = {rate}',
          '每月自付                     = {monthlySelfPay}',
          '自付合计                     = {monthlySelfPay} × {months} = {selfPay}',
          '',
          '→ PV 合计 = {employment} + {selfPay} = {total}'
        ]
      },
      vorsorge: {
        formula: [
          'Vorsorgeaufwendungen = RV-AN + KV-Basis + PV-AN',
          '',
          '   RV-AN: 100 % 作为基础养老金抵扣（§ 10 Abs. 1 Nr. 2 EStG，自 2023 全额）',
          '   就业期间 KV: 仅 {vorsorgeKvEmploymentDeductRate}（{vorsorgeKvKrankengeldAbschlag} Krankengeld 部分不可抵扣，§ 10 Abs. 1 Nr. 3 Satz 4 EStG）',
          '   ALG I 结束后的 KV 自付: 无 Krankengeld Anspruch，按 100 % 计入',
          '   PV-AN: 100 % 抵扣（§ 10 Abs. 1 Nr. 3 Buchst. a EStG）',
          '   ALV-AN: 不作为 Sonderausgabe 抵扣（仅在「其他 Vorsorge」定额中）',
          '',
          '此处简化省略上限测算（在本应用涉及的收入水平下不敏感）。'
        ],
        detail: [
          'RV-AN                    = {rv}            (× 100 %)',
          '就业期间 KV              = {kvEmployment}',
          '就业期间 KV × {vorsorgeKvEmploymentDeductRate} = {kvEmploymentDeduct}',
          'ALG I 后 KV 自付          = {kvSelfPaid}    (× 100 %)',
          'KV-Basis 合计             = {kvDeduct}',
          'PV-AN                     = {pv}            (× 100 %)',
          '',
          '→ Vorsorge 抵扣           = {rv} + {kvDeduct} + {pv}',
          '                          = {total}'
        ]
      },
      fuenftel: {
        head: ['zvE_ord（不含 Abfindung） = {zvEOrd}', 'Abfindung                = {abfindung}', 'ALG (§ 32b，发放额)      = {alg}'],
        progrVWithAlg: [
          '减：未使用的 Arbeitnehmer-Pauschbetrag = {apbDeduction}',
          '进入 ProgrV 的 ALG = {algForProgression}',
          'ProgrV 税率 = ESt({zvEOrdPlain} + {algForProgressionPlain})/{sumPlain} = {ratePct} %',
          '基础 ESt    = {ratePct} % × {zvEOrdPlain} = {sockel}'
        ],
        progrVWithoutAlg: ['基础 ESt    = 基础税表({zvEOrdPlain}) = {sockel}'],
        fuenftelWithAbf: [
          '1/5 Abfindung      = {fuenftelBetrag}',
          'ESt(zvE_ord + 1/5) = {estMitFuenftel}',
          '§ 34 增量          = 5 × ({estMitPlain} − {sockelPlain}) = {zusatz}',
          '→ ESt = 基础 + 增量 = {total}'
        ],
        fuenftelNegativeOrdinary: [
          '§ 34 Abs. 1 Satz 3：zvE_ord 为负，但总 zvE 为正。',
          '总 zvE = zvE_ord + Abfindung = {totalZvE}',
          '总 zvE 的 1/5 = {satz3Base}',
          'ESt(总 zvE 的 1/5) = {estSatz3Base}',
          '→ ESt = 5 × {estSatz3BasePlain} = {total}'
        ],
        fuenftelWithoutAbf: ['→ ESt = 基础（无 Abfindung） = {sockel}']
      },
      tariffIncomeTaxWithoutKFB: {
        formula: [
          'Tarif-ESt = ESt(zvE_ord) + 5 × [ ESt(zvE_ord + Abfindung/5) − ESt(zvE_ord) ]',
          '   (§ 34 Abs. 1 EStG, Fünftelregelung)',
          '',
          'zvE_ord 是不含 Abfindung 的常规 zvE。Abfindung 通过 Fünftelregelung',
          '单独处理，仅以增量形式叠加。',
          '',
          'ESt(·) 含 ProgrV § 32b：ALG 先扣除未使用的 Arbeitnehmer-Pauschbetrag (§ 9a)。',
          '特别税率 = 基础税表(zvE + 进入 ProgrV 的 ALG) / (zvE + 进入 ProgrV 的 ALG)',
          '基础税表：起征点 {grundfreibetrag}，之后 4 个区段（§ 32a Abs. 1 EStG）'
        ]
      },
      tariffIncomeTaxWithKFB: {
        formula: ['同 2.1，但 zvE → zvE − KFB 半额', 'KFB 半额 = {kfbHalfPerChild} × 子女数（§ 32 Abs. 6 EStG，此处 {childCount} {childWord}）'],
        detailPrefix: ['KFB 半额               = {kfbHalf}', 'zvE_ord − KFB 半额     = {zvEminusKfb}', '']
      },
      kfbSavings: {
        formula: ['KFB 节税 = ESt(2.1) − ESt(2.2)', '这是与 Kindergeld 半份的直接比较值（§ 31 EStG）。'],
        detail: ['2.1: {est21}', '2.2: {est22}', '→   {savings}']
      },
      childBenefitShare: {
        formula: ['Kindergeld 半份 = ({kindergeldMonthlyPerChild} / 2) × 12 × 子女数（§ 31 EStG，单独核定下父母各一半）'],
        detail: ['{kgHalf} €/月', '× 12 个月 × {childCount} {childWord}', '= {result}']
      },
      abfindungSteuer: {
        formula: [
          'Abfindung 对应的税款 = § 34 EStG 增量',
          '   = 5 × [ ESt(zvE_ord + Abfindung/5) − ESt(zvE_ord) ]',
          '',
          'Abfindung 的有效税率 = 增量 / Abfindung',
          '',
          '参考：不含 KFB 的版本（与 2.1 一致）—— 对应工资税单的视角。',
          '与发放年度高度相关：在 zvE_ord 较低的年度（如躺平之后），',
          '1/5 计算从更平缓的税表区段开始 → Abfindung 的有效税率更低。',
          '',
          '此值<strong>不要</strong>加入结果 (3) —— 它已包含在 2.1 / 2.2 中。',
          '本行仅用于回答「Abfindung 究竟交了多少税」。'
        ],
        noAbfindung: '本年度无 Abfindung',
        detail: [
          'Abfindung           = {abfindung}',
          '1/5 Abfindung       = {fuenftel}',
          '',
          '基础 ESt(zvE_ord)              = {sockel}',
          'ESt(zvE_ord + 1/5 Abfindung)   = {mitFuenftel}',
          '§ 34 增量 = 5 × ({mitPlain} − {sockelPlain})',
          '         = {zusatz}',
          '',
          '→ Abfindung 有效税率',
          '   = {zusatzPlain} / {abfindungPlain}',
          '   = {ratePct} %'
        ]
      },
      soli: {
        formula: [
          '团结税 Solidaritätszuschlag {taxYear}：',
          '',
          '   单独核定：若 §51a 基数 ≤ {soliSingleFreigrenze}  → Soli = 0 €（起征点）',
          '   共同核定：若 §51a 基数 ≤ {soliJointFreigrenze}  → Soli = 0 €（起征点）',
          '',
          '   否则：Soli = min( {soliRate} × 基数 ; {soliMilderungszoneRate} × (基数 − 起征点) )',
          '          （减缓段至约 {soliSingleObergrenze} 单人 / {soliJointObergrenze} 共同；之后由上限主导）',
          '',
          '根据 § 51a EStG，计算基础是考虑 Kinderfreibetrag 后的 ESt，不包含 Kindergeld 加回。',
          '教会税在税款合计中使用同一 §51a 基数单独加上。'
        ],
        detailBelowFreigrenze: ['§51a 基数 = {est}', '→ ≤ 起征点 {freigrenze}', '→ Soli = 0 €'],
        detailAboveFreigrenze: [
          '§51a 基数 = {est}',
          '',
          '上限 ({soliRate})        = {soliRate} × {estPlain} = {cap}',
          '减缓段 ({milderungRate}) = {milderungRate} × ({estPlain} − {freigrenzePlain})',
          '                   = {milderung}',
          '',
          '→ Soli = min({capPlain}, {milderungPlain}) = {soli}',
          '   ({chosen})'
        ],
        jointAllocation: '共同报税：上方显示共同 Soli 基数；此格显示分摊到本人的金额 {allocated}。',
        capWins: '上限起作用',
        milderungActive: '减缓段生效'
      },
      steuerGesamt: {
        formula: [
          '税款合计 (3) = festzus. ESt + Soli (2.6)',
          '   festzus. ESt 来自 Günstigerprüfung § 31 EStG（见下），',
          '   Soli 在 2.6 单列。',
          '',
          'Günstigerprüfung § 31 EStG（单独核定下按人计算）：',
          '',
          '背景：Kindergeld 与 Kinderfreibetrag (KFB) 是替代关系，永远<strong>不会</strong>同时享受。',
          '年度内 Familienkasse 按月先行发放 Kindergeld。年终 Finanzamt 比较两种方案对家庭哪个更有利：',
          '',
          '   方案 A —— 仅 Kindergeld:',
          '      ESt        = 2.1（不含 KFB）',
          '      Kindergeld 完整保留在家庭中',
          '      → 实际向 FA 交 = 2.1',
          '',
          '   方案 B —— KFB + 加回 Kindergeld:',
          '      ESt        = 2.2（含 KFB → 更低）',
          '      + 2.4      Kindergeld 加回到 ESt（不是缴税！），',
          '                 以避免与 KFB 同时受益的「双重补贴」。',
          '                 钱实际仍留在家庭 —— 仅在税单上做对冲。',
          '      → 实际向 FA 交 = 2.2 + 2.4',
          '',
          '比较（数学上等价）：',
          '   2.3（= 2.1 − 2.2，KFB 节税）  vs.  2.4（Kindergeld）',
          '   若 2.3 > 2.4 → KFB 更优 → festzus. ESt = 2.2 + 2.4',
          '   否则        → Kindergeld 更优 → festzus. ESt = 2.1',
          '',
          '重要：任何方案下 Kindergeld 都<strong>不</strong>作为应税收入处理。',
          '方案 B 中的「+ 2.4」只是把已发放的家庭补贴在税单上对冲，避免双重补贴。'
        ],
        detailKfbWins: [
          '比较：',
          '   2.3 KFB 节税       = {kfbSavings}',
          '   2.4 Kindergeld    = {childBenefitShare}',
          '   → KFB 更优 {kfbDiff}',
          '',
          '方案 B（已选）—— KFB + 加回：',
          '   2.2 含 KFB 的 ESt        = {est22}',
          '   + 2.4 Kindergeld 加回    = {childBenefitShare}',
          '   = festzus. ESt          = {assessedIncomeTax}',
          '   §51a 基数 Soli/教会税     = {zuschlagsteuerBaseIncomeTax}',
          '   + 2.6 Soli               = {soli}',
          '   + 教会税                 = {kirchensteuer}',
          '   = 税款合计               = {total}',
          '',
          '与方案 A 对比：A 需 {est21}',
          '→ 家庭相对方案 A 节省 {savings}。',
          '',
          '说明：{childBenefitShare} 的 Kindergeld 实际仍在账户中。',
          '这里只是在税单上对冲，并<strong>未</strong>对其征税。'
        ],
        detailKindergeldWins: [
          '比较：',
          '   2.3 KFB 节税       = {kfbSavings}',
          '   2.4 Kindergeld    = {childBenefitShare}',
          '   → Kindergeld 更优 {kgDiff}',
          '',
          '方案 A（已选）—— 仅 Kindergeld:',
          '   2.1 不含 KFB 的 ESt       = {est21}',
          '   = festzus. ESt           = {assessedIncomeTax}',
          '   §51a 基数 Soli/教会税      = {zuschlagsteuerBaseIncomeTax}',
          '   + 2.6 Soli                = {soli}',
          '   + 教会税                  = {kirchensteuer}',
          '   = 税款合计                = {total}',
          '',
          'Kindergeld {childBenefitShare} 完整保留在家庭',
          '（未享 KFB，故无需加回）。'
        ],
        notes: {
          kfbWinsBadge: 'KFB 更优 → 2.2 + 2.4 = {est22} + {kg}',
          kindergeldWinsBadge: 'Kindergeld 更优 → 取 2.1（Kindergeld {kg} 保留）'
        }
      },
      bruttoeinnahmen: {
        formula: [
          '毛收入 = 毛工资 + Abfindung + ALG I + 租金收入 (V&V) + Kindergeld 半份',
          '',
          '   毛工资            —— 旧 + 新工作（社保/税前）',
          '   Abfindung         —— 仅在发放年度一次性发放（§ 34 EStG: 仅税务上 Fünftelregelung）',
          '   ALG I             —— 联邦劳工局发放（免税，ProgrV § 32b）',
          '   租金收入          —— V&V 净额（简化）',
          '   Kindergeld 半份   —— 父母各一半 ({kindergeldHalfMonthlyPerChild} × 12 × 子女数)',
          '',
          '说明：Kindergeld 在此作为现金流入计入 —— 与税务上是 KFB 还是 Kindergeld 更优无关（见第 3 组）。'
        ],
        detail: [
          '毛工资             = {brutto}',
          'Abfindung          = {abfindung}',
          'ALG I              = {alg}',
          '租金收入 V&V       = {vuv}',
          'Kindergeld 半份    = {kindergeld}',
          '',
          '→ 毛收入合计       = {sum}'
        ]
      },
      nettoEinkommen: {
        formula: ['Netto 收入 = 毛收入 − (社保 + 税款合计 + 捐赠)', '', '这是年终每人实际留下的真实金额。', '家庭 Netto = 本人 + 配偶 之和。'],
        detail: [
          '流入               = {zuflusse}',
          '   毛工资           {brutto}',
          '   Abfindung        {abfindung}',
          '   ALG I            {alg}',
          '   V&V              {vuv}',
          '   Kindergeld       {kindergeld}',
          '',
          '流出               = {abflusse}',
          '   社保             {sv}',
          '   税款合计         {steuer}',
          '   捐赠             {spenden}',
          '',
          '→ Netto = {zuflusse} − {abflusse} = {netto}'
        ]
      }
    }
  }
} as const;
