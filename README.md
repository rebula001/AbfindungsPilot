# Abfindungspilot

> Browser-Tool zur Optimierung der Abfindungs-Steuerstrategie nach deutschem Recht (Veranlagungszeitraum 2026).
>
> 浏览器工具，按 2026 年德国税法优化 Abfindung（遣散费）方案。

[DE Deutsch](#de-deutsch) · [CN 中文](#cn-中文) · [📁 Entwicklungsdoku / 开发文档](.dev-docs/README.md)

---

## DE Deutsch

### Was die App löst

Das deutsche Steuerrecht ist fuer Normalbuerger eine Black Box. Beim Unterzeichnen eines **Aufhebungsvertrags mit Abfindung** stehen zwei zentrale Entscheidungen an, die das Familien-Netto ueber zwei Steuerjahre um mehrere Tausend Euro verschieben koennen:

1. **"In welchem Jahr soll die Abfindung ausgezahlt werden?"**
   Noch im laufenden Jahr oder Verschiebung auf das Folgejahr - der entscheidende Hebel ist die **Fuenftelregelung (§ 34 EStG)**, die nur bei niedrigem uebrigen zvE im Auszahlungsjahr ihre volle Wirkung entfaltet.
2. **"Wann und mit welchem Monatsbrutto in den neuen Job einsteigen?"**
   Wenn der neue Vertrag noch verhandelt wird, ist das Zusammenspiel aus **ALG-I-Bezug**, **Progressionsvorbehalt (§ 32b EStG)**, **SV-Beitraegen** und dem Wegfall des Fuenftel-Effekts intuitiv kaum zu durchschauen.

Abfindungspilot rechnet alle relevanten Kombinationen ueber zwei Steuerjahre in Echtzeit durch und visualisiert sie - anstatt den Nutzer raten zu lassen.

### Funktionsumfang

- **Drei-Spalten-Layout:** Eingabe (PrimeVue Forms + zod) - Tabellen-Vergleich - Diagramm (Chart.js)
- **Single- und Familien-Modus** mit Wahl zwischen Einzel- (§ 26a EStG) und Zusammenveranlagung (§ 26b EStG, Splittingtarif)
- Vollstaendige Modellierung von:
  - § 32a EStG Tarif 2026 (Grund- + Splittingtabelle)
  - § 32b EStG Progressionsvorbehalt (ALG I)
  - § 34 Abs. 1 EStG Fuenftelregelung
  - § 31 EStG KFB + Kindergeld Guenstigerpruefung
  - § 10 / § 10b EStG Vorsorge- + Spendenabzug
  - SV-AN-Anteile (KV / PV / RV / ALV) inkl. BBG-Cap und Sachsen-Sonderfall PV
  - Solidaritaetszuschlag (Freigrenze + Milderungszone, einzeln + verdoppelt fuer Joint)
  - Kirchensteuer (8 % BY/BW, sonst 9 %)
- **Persistenz:** localStorage-Snapshot mit 3 h TTL
- **Zweisprachig:** Deutsch (Default) + Chinesisch

### Tech-Stack

| Schicht | Wahl |
| --- | --- |
| Framework | Vue 3.5 + `<script setup>` Composition API |
| Sprache | TypeScript 6 (strict) |
| Build | Vite 8 |
| UI | PrimeVue 4 (Aura Theme, violet) + Tailwind CSS 4 |
| Forms | `@primevue/forms` mit zod-Resolver |
| i18n | vue-i18n 11 (DE / ZH) |
| Chart | Chart.js 4 |
| Quality | ESLint 10 + Prettier 3 + SonarQube |

### Schnellstart

```powershell
cd frontend
npm install
npm run dev        # http://localhost:5173
```

### Wichtige Befehle

| Befehl | Wirkung |
| --- | --- |
| `npm run dev` | Vite Dev-Server |
| `npm run build` | TypeScript-Check + Production-Build |
| `npm run preview` | Lokaler Server fuer `dist/` |
| `npm run lint:check` | ESLint |
| `npm run format:check` | Prettier |
| `npm run i18n:check` | DE/ZH Key-Diff (CI-blockierend) |
| `npm run sonar:all` | SonarQube Scan + Report-Fetch |

### Projektstruktur

```text
.
├─ frontend/                  # Vue-App
│  ├─ src/
│  │  ├─ views/               # InputView | CalculationView | ChartView
│  │  ├─ composables/         # useUserInput | useCalculation | useScenarioChartData
│  │  ├─ calculation/         # Reine Berechnungs-Engine (framework-frei, testbar)
│  │  ├─ components/          # Wiederverwendbare UI
│  │  └─ i18n/                # de.ts | zh.ts (strukturell 1:1)
│  ├─ scripts/                # i18n-Check + Sonar-Scan
│  └─ sonar-project.properties # enthaelt Tokens, in .gitignore
├─ .dev-docs/                 # Entwicklungsdokumentation (DE + ZH)
└─ .claude/                   # ADRs + Task-Historie
```

### Bewusste Vereinfachungen

- Keine asymmetrische KFB-Uebertragung (immer haelftig)
- Kein BA-Zuschuss zur PKV waehrend ALG-Bezug
- Keine monatliche Lohnsteuer-Vorabberechnung (nur Jahres-ESt)
- Keine Kapitalertraege (nur §§ 19 / 21 / 22 / 34)

Begruendungen siehe Inline-Kommentare in [`engine.ts`](frontend/src/calculation/engine.ts) und Detail in [03 - Berechnungs-Engine](.dev-docs/de/03-calculation-engine.md).

### Quellen fuer Steuerkonstanten

- § 32a EStG (Inflationsausgleichsgesetz, Tarif 2026)
- SvEV 2026 (Beitragsbemessungsgrenzen)
- nettolohn.de (Cross-Check der Tarifformel)
- Alle Konstanten mit §-Verweis in [`constants.ts`](frontend/src/calculation/constants.ts)

### Weiterfuehrende Doku

- 📁 [Entwicklungsdokumentation](.dev-docs/de/README.md) - Architektur, Engine, Konventionen, Workflow
- 📕 [Architecture Decision Records](.claude/decisions/) - warum Dinge so gebaut wurden
- 📗 [Task-Historie](.claude/tasks/) - was ueber die Iterationen passiert ist

### Status

**Kernfunktionen ✅ fertig**, aktuell in der Optimierungs-Endphase. Offene Punkte siehe [Pre-Release-Checkliste](.claude/tasks/2026-04-29-pre-release-checklist.md).

### Lizenz

[**PolyForm Noncommercial License 1.0.0**](LICENSE) - Quellcode oeffentlich, aber **nur fuer nicht-kommerzielle Nutzung**.

- ✅ Herunterladen, lesen, lokal modifizieren, fork fuer privaten Gebrauch
- ✅ Nutzung durch gemeinnuetzige Organisationen, Schulen, Forschung
- ❌ Jegliche kommerzielle Verwendung, kostenpflichtige Hosting-Angebote, Einsatz in gewinnorientierten Firmen

Kurzfassung in beiden Sprachen: [NOTICE.md](NOTICE.md)

### Beitraege

**Dieses Repository nimmt keine externen Pull Requests an.** Issues sind deaktiviert. Sie duerfen jederzeit forken und Ihre eigene Variante pflegen - bitte aber nichts in dieses Repository zurueckspielen.

Details: [CONTRIBUTING.md](CONTRIBUTING.md)

### Haftungsausschluss

Die Steuerberechnungen sind eine bestmoegliche Modellierung von § 32a / § 34 EStG, SolzG und SGB IV fuer 2026 - sie ersetzen **keine Steuerberatung**. Fuer verbindliche Auskuenfte wenden Sie sich an einen Steuerberater oder Lohnsteuerhilfeverein.

Copyright (c) 2026 Ö_Ö

---

## CN 中文

### App 解决什么

德国税法对普通人来说是一个盲盒。签 **Aufhebungsvertrag（解约协议）** 和 Abfindung（遣散费）时，有两个核心决策，会让两个税年的家庭净收入差几千欧元：

1. **“Abfindung 应该哪一年领？”**
   当年领还是推到下一年？关键在于 **Fuenftelregelung（§ 34 EStG，五分之一规则）** - 它只在领取年的其他 zvE（应税所得）足够低时才真正起到节税作用。
2. **“新工作什么时候、以多少月薪入职？”**
   如果新合同还在谈，**ALG I（失业救济）**、**Progressionsvorbehalt（§ 32b EStG，累进保留）**、**社保扣款**，以及 **Fuenftelregelung 失效效应** 同时在起作用，凭直觉根本算不出哪种组合最划算。

Abfindungspilot 把所有相关组合在两个税年上实时算出来并可视化，而不是让用户瞎猜。

### 功能范围

- **三栏布局：** 输入（PrimeVue Forms + zod）- 表格对比 - 图表（Chart.js）
- **Single（单身）和 Familie（家庭）两种模式**，家庭模式可在 Einzelveranlagung（§ 26a EStG）和 Zusammenveranlagung（§ 26b EStG，Splittingtarif）之间切换
- 完整建模：
  - § 32a EStG 2026 税率表（Grundtabelle + Splittingtabelle）
  - § 32b EStG Progressionsvorbehalt（ALG I 抬高税率）
  - § 34 Abs. 1 EStG Fuenftelregelung
  - § 31 EStG KFB + Kindergeld 择优
  - § 10 / § 10b EStG Vorsorge 和捐款抵扣
  - 社保 AN 部分（KV / PV / RV / ALV）含 BBG 封顶和萨克森州 PV 特例
  - Solidaritaetszuschlag（起征点 + 缓和区，单身 + joint 双份）
  - Kirchensteuer（教会税，BY/BW 8%，其他 9%）
- **持久化：** `localStorage` snapshot，3 小时 TTL
- **双语：** 德语（默认）+ 中文

### 技术栈

| 层 | 选型 |
| --- | --- |
| 框架 | Vue 3.5 + `<script setup>` Composition API |
| 语言 | TypeScript 6 (strict) |
| 构建 | Vite 8 |
| UI | PrimeVue 4 (Aura 主题, violet) + Tailwind CSS 4 |
| 表单 | `@primevue/forms` + zod resolver |
| 国际化 | vue-i18n 11 (DE / ZH) |
| 图表 | Chart.js 4 |
| 质量 | ESLint 10 + Prettier 3 + SonarQube |

### 快速开始

```powershell
cd frontend
npm install
npm run dev        # http://localhost:5173
```

### 常用命令

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | Vite 开发服务器 |
| `npm run build` | TypeScript 检查 + 生产构建 |
| `npm run preview` | 本地启动 `dist/` |
| `npm run lint:check` | ESLint |
| `npm run format:check` | Prettier |
| `npm run i18n:check` | de/zh key 差异检查（CI 阻塞） |
| `npm run sonar:all` | SonarQube 扫描 + 拉取报告 |

### 项目结构

```text
.
├─ frontend/                  # Vue App
│  ├─ src/
│  │  ├─ views/               # InputView | CalculationView | ChartView
│  │  ├─ composables/         # useUserInput | useCalculation | useScenarioChartData
│  │  ├─ calculation/         # 纯计算引擎（无框架依赖，可测试）
│  │  ├─ components/          # 可复用 UI
│  │  └─ i18n/                # de.ts | zh.ts（结构 1:1）
│  ├─ scripts/                # i18n 检查 + Sonar 扫描
│  └─ sonar-project.properties # ⚠ 含 token，已 .gitignore
├─ .dev-docs/                 # 开发文档（DE + ZH）
└─ .claude/                   # ADR + 任务历史
```

### 有意为之的简化

- 不支持 KFB 非对称转让（始终对半）
- ALG 期间 BA 对 PKV 的补贴未扣
- 不算月度 Lohnsteuer 预扣（仅年度 ESt）
- 不算资本利得（只覆盖 §§ 19 / 21 / 22 / 34）

理由见 [`engine.ts`](frontend/src/calculation/engine.ts) 内联注释和 [03 - 计算引擎](.dev-docs/zh/03-calculation-engine.md)。

### 税务常量来源

- § 32a EStG（通胀调整法，2026 税率）
- SvEV 2026（社保 BBG）
- nettolohn.de（税率公式交叉验证）
- 所有常量都附 § 引用，见 [`constants.ts`](frontend/src/calculation/constants.ts)

### 延伸文档

- 📁 [开发文档](.dev-docs/zh/README.md) - 架构、引擎、规范、工作流
- 📕 [架构决策记录](.claude/decisions/) - 为什么这么设计
- 📗 [任务历史](.claude/tasks/) - 各次迭代做了什么

### 状态

**核心功能 ✅ 完成**，当前处于优化收尾阶段。待办见 [上线前检查清单](.claude/tasks/2026-04-29-pre-release-checklist.md)。

### 许可证

[**PolyForm Noncommercial License 1.0.0**](LICENSE) - 源码公开，**仅限非商业用途**。

- ✅ 下载、阅读、本地修改、个人 fork 自留
- ✅ 慈善机构、学校、政府、研究单位的非营利使用
- ❌ 任何商业用途、付费托管服务、营利性公司内部使用

中德双语简明对照：[NOTICE.md](NOTICE.md)

### 贡献

**本仓库不接受外部 Pull Request**，Issues 已关闭。欢迎 fork 后自维护分支 - 请不要把代码推回本仓库。

详情见 [CONTRIBUTING.md](CONTRIBUTING.md)

### 免责声明

代码中的税务计算是对 2026 年 § 32a / § 34 EStG、SolzG 与 SGB IV 的尽力建模，**不构成税务咨询意见**。正式申报请咨询 Steuerberater（税务师）或 Lohnsteuerhilfeverein（工资税援助协会）。

Copyright (c) 2026 Ö_Ö
