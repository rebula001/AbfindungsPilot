# Abfindungspilot

[![CI](https://github.com/rebula001/AbfindungsPilot/actions/workflows/ci.yml/badge.svg)](https://github.com/rebula001/AbfindungsPilot/actions/workflows/ci.yml)
[![Deploy Pages](https://github.com/rebula001/AbfindungsPilot/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/rebula001/AbfindungsPilot/actions/workflows/deploy-pages.yml)
[![License: PolyForm Noncommercial](https://img.shields.io/badge/license-PolyForm%20Noncommercial-blue)](LICENSE)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=rebula001_AbfindungsPilot&metric=alert_status)](https://sonarcloud.io/summary/overall?id=rebula001_AbfindungsPilot)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=rebula001_AbfindungsPilot&metric=coverage)](https://sonarcloud.io/summary/overall?id=rebula001_AbfindungsPilot)

> Browser-Tool zur Optimierung der Abfindungs-Steuerstrategie nach deutschem Recht (Veranlagungszeitraum 2026).
>
> 浏览器工具，按 2026 年德国税法优化 Abfindung（遣散费）方案。

[DE Deutsch](#de-deutsch) · [CN 中文](#cn-中文) · [📁 Entwicklungsdoku / 开发文档](.dev-docs/README.md)

Live demo / 在线版本: <https://rebula001.github.io/AbfindungsPilot/>

Hinweis / 提示: Kein Support, keine externen Pull Requests. / 不提供支持，不接受外部 PR。

---

## DE Deutsch

### Was die App löst

Das deutsche Steuerrecht ist für Normalbürger eine Black Box. Beim Unterzeichnen eines **Aufhebungsvertrags mit Abfindung** stehen zwei zentrale Entscheidungen an, die das Familien-Netto über zwei Steuerjahre um mehrere Tausend Euro verschieben können:

1. **"In welchem Jahr soll die Abfindung ausgezahlt werden?"**
   Noch im laufenden Jahr oder Verschiebung auf das Folgejahr - der entscheidende Hebel ist die **Fünftelregelung (§ 34 EStG)**, die nur bei niedrigem übrigen zvE im Auszahlungsjahr ihre volle Wirkung entfaltet.
2. **"Wann und mit welchem Monatsbrutto in den neuen Job einsteigen?"**
   Wenn der neue Vertrag noch verhandelt wird, ist das Zusammenspiel aus **ALG-I-Bezug**, **Progressionsvorbehalt (§ 32b EStG)**, **SV-Beiträgen** und dem Wegfall des Fünftel-Effekts intuitiv kaum zu durchschauen.

Abfindungspilot rechnet alle relevanten Kombinationen über zwei Steuerjahre in Echtzeit durch und visualisiert sie - anstatt den Nutzer raten zu lassen.

Die fachlichen Steuerannahmen sind nicht im README definiert. Maßgeblich sind die Entwicklungsdokumente [03 - Berechnungs-Engine](.dev-docs/de/03-calculation-engine.md) und [09 - Abschlussaudit Berechnungslogik](.dev-docs/de/09-calculation-audit.md).

### Funktionsumfang

- **Drei-Spalten-Layout:** Eingabe (PrimeVue Forms + Projektvalidierung) - Tabellen-Vergleich - Diagramm (Chart.js)
- **Single- und Familien-Modus** mit Wahl zwischen Einzel- (§ 26a EStG) und Zusammenveranlagung (§ 26b EStG, Splittingtarif)
- Steuer- und Sozialversicherungsmodell für 2026 gemäß [Berechnungs-Engine-Dokumentation](.dev-docs/de/03-calculation-engine.md), u. a. Fünftelregelung, Progressionsvorbehalt, Splittingtarif, KFB/Kindergeld, Soli, Kirchensteuer und KV/PV/RV/ALV
- **Persistenz:** localStorage-Snapshot mit 3 h TTL
- **Zweisprachig:** Deutsch (Default) + Chinesisch

### Tech-Stack

| Schicht   | Wahl                                                  |
| --------- | ----------------------------------------------------- |
| Framework | Vue 3.5 + `<script setup>` Composition API            |
| Sprache   | TypeScript 6 (strict)                                 |
| Build     | Vite 8                                                |
| UI        | PrimeVue 4 (Aura Theme, violet) + Tailwind CSS 4      |
| Forms     | `@primevue/forms` + projektspezifische Validierung    |
| i18n      | vue-i18n 11 (DE / ZH)                                 |
| Chart     | Chart.js 4                                            |
| Quality   | ESLint 10 + Prettier 3 + Vitest Coverage + SonarCloud |
| CI/CD     | GitHub Actions + GitHub Pages                         |

### Schnellstart

```powershell
cd frontend
npm install
npm run dev        # http://localhost:5173
```

### Wichtige Befehle

| Befehl                  | Wirkung                                                      |
| ----------------------- | ------------------------------------------------------------ |
| `npm run dev`           | Vite Dev-Server                                              |
| `npm run build`         | Strikt: lint + format + i18n + TypeScript + Production-Build |
| `npm run build:fast`    | Schnell: TypeScript + Production-Build                       |
| `npm run preview`       | Lokaler Server für `dist/`                                   |
| `npm run lint:check`    | ESLint                                                       |
| `npm run format:check`  | Prettier                                                     |
| `npm run test`          | Vitest Unit-Tests                                            |
| `npm run test:coverage` | Vitest Coverage für SonarCloud                               |
| `npm run i18n:check`    | DE/ZH Key-Diff (blockiert lokalen `build`)                   |
| `npm run sonar:all`     | SonarCloud Scan + Report-Fetch                               |

### Build & Deployment

- CI läuft bei Push/PR mit Format-, Lint-, Coverage-Test- und Build-Schritten.
- GitHub Pages wird nach erfolgreicher CI über `.github/workflows/deploy-pages.yml` veröffentlicht.
- Für lokale Pages-Simulation:

```powershell
cd frontend
$env:VITE_BASE_PATH = "/AbfindungsPilot/"
npm run build:fast
npm run preview
$env:VITE_BASE_PATH = $null
```

### Projektstruktur

```text
.
├─ frontend/                     # Vue/Vite-App
│  ├─ public/                    # Statische Assets, robots.txt, sitemap.xml
│  ├─ scripts/                   # i18n-Check + SonarCloud-Scan
│  ├─ src/
│  │  ├─ calculation/            # Reine Berechnungs-Engine (framework-frei, testbar)
│  │  ├─ components/             # Wiederverwendbare UI-Bausteine
│  │  ├─ composables/            # App-State, Berechnung, Chart-Daten
│  │  ├─ i18n/                   # de.ts | zh.ts (strukturell 1:1)
│  │  ├─ tax-parameters/         # Jahresparameter, aktuell 2026
│  │  ├─ types/                  # UI-/Berechnungsnahe Typen
│  │  ├─ views/                  # InputView | CalculationView | ChartView
│  │  ├─ App.vue
│  │  ├─ main.ts
│  │  └─ style.css
│  ├─ tests/                     # Vitest-Tests
│  ├─ index.html                 # SEO, Open Graph, JSON-LD
│  ├─ vite.config.ts             # Vite, Vitest, Chunk-Splitting, Pages base
│  ├─ eslint.config.js
│  └─ sonar-project.properties   # SonarCloud-Konfiguration ohne Tokens
├─ .github/                      # CI, Pages Deployment, Dependabot, PR-Template
├─ .dev-docs/                    # Entwicklungsdokumentation (DE + ZH)
├─ LICENSE
├─ NOTICE.md
├─ CONTRIBUTING.md
└─ README.md
```

### Bewusste Vereinfachungen

- Keine asymmetrische KFB-Übertragung (immer hälftig)
- Kein BA-Zuschuss zur PKV während ALG-Bezug
- Keine monatliche Lohnsteuer-Vorabberechnung (nur Jahres-ESt)
- Keine Kapitalerträge (nur §§ 19 / 21 / 22 / 34)

Begründungen und vollständige Produktgrenzen stehen in [03 - Berechnungs-Engine](.dev-docs/de/03-calculation-engine.md) und [09 - Abschlussaudit Berechnungslogik](.dev-docs/de/09-calculation-audit.md).

### Quellen für Steuerkonstanten

Die konkrete Quellenliste für Tarif, Sozialversicherung, Soli, Kirchensteuer und Familienwerte steht in [03 - Berechnungs-Engine](.dev-docs/de/03-calculation-engine.md). Der Jahreswechsel-Prozess ist in [10 - Jahresparameter aktualisieren](.dev-docs/de/10-tax-parameter-upgrade.md) dokumentiert. Die aktiven Werte liegen in [`frontend/src/tax-parameters/2026.json`](frontend/src/tax-parameters/2026.json).

### Weiterführende Doku

- 📁 [Entwicklungsdokumentation](.dev-docs/de/README.md) - Architektur, Engine, Konventionen, Workflow

### Status

**Kernfunktionen ✅ fertig.** Das Projekt ist für GitHub Pages, CI, Dependabot, SonarCloud und nicht-kommerzielle Veröffentlichung vorbereitet.

### Lizenz

[**PolyForm Noncommercial License 1.0.0**](LICENSE) - Quellcode öffentlich, aber **nur für nicht-kommerzielle Nutzung**.

- ✅ Herunterladen, lesen, lokal modifizieren, fork für privaten Gebrauch
- ✅ Nutzung durch gemeinnützige Organisationen, Schulen, Forschung
- ❌ Jegliche kommerzielle Verwendung, kostenpflichtige Hosting-Angebote, Einsatz in gewinnorientierten Firmen

Kurzfassung in beiden Sprachen: [NOTICE.md](NOTICE.md)

### Beiträge

**Dieses Repository nimmt keine externen Pull Requests an.** Issues sind deaktiviert. Sie dürfen jederzeit forken und Ihre eigene Variante pflegen - bitte aber nichts in dieses Repository zurückspielen.

Details: [CONTRIBUTING.md](CONTRIBUTING.md)

### Haftungsausschluss

Die Steuerberechnungen sind eine bestmögliche Modellierung von § 32a / § 34 EStG, SolzG und SGB IV für 2026 - sie ersetzen **keine Steuerberatung**. Für verbindliche Auskünfte wenden Sie sich an einen Steuerberater oder Lohnsteuerhilfeverein.

Copyright (c) 2026 Ö_Ö

---

## CN 中文

### App 解决什么

德国税法对普通人来说是一个盲盒。签 **Aufhebungsvertrag（解约协议）** 和 Abfindung（遣散费）时，有两个核心决策，会让两个税年的家庭净收入差几千欧元：

1. **“Abfindung 应该哪一年领？”**
   当年领还是推到下一年？关键在于 **Fünftelregelung（§ 34 EStG，五分之一规则）** - 它只在领取年的其他 zvE（应税所得）足够低时才真正起到节税作用。
2. **“新工作什么时候、以多少月薪入职？”**
   如果新合同还在谈，**ALG I（失业救济）**、**Progressionsvorbehalt（§ 32b EStG，累进保留）**、**社保扣款**，以及 **Fünftelregelung 失效效应** 同时在起作用，凭直觉根本算不出哪种组合最划算。

Abfindungspilot 把所有相关组合在两个税年上实时算出来并可视化，而不是让用户瞎猜。

税务假设不以 README 为准。完整公式、法条引用和审计边界见 [03 - 计算引擎](.dev-docs/zh/03-calculation-engine.md) 与 [09 - 计算逻辑终检审计](.dev-docs/zh/09-calculation-audit.md)。

### 功能范围

- **三栏布局：** 输入（PrimeVue Forms + 项目校验逻辑）- 表格对比 - 图表（Chart.js）
- **Single（单身）和 Familie（家庭）两种模式**，家庭模式可在 Einzelveranlagung（§ 26a EStG）和 Zusammenveranlagung（§ 26b EStG，Splittingtarif）之间切换
- 2026 年税务和社保模型以 [计算引擎文档](.dev-docs/zh/03-calculation-engine.md) 为准，覆盖 Fünftelregelung、Progressionsvorbehalt、Splittingtarif、KFB/Kindergeld、Soli、Kirchensteuer 以及 KV/PV/RV/ALV
- **持久化：** `localStorage` snapshot，3 小时 TTL
- **双语：** 德语（默认）+ 中文

### 技术栈

| 层     | 选型                                                  |
| ------ | ----------------------------------------------------- |
| 框架   | Vue 3.5 + `<script setup>` Composition API            |
| 语言   | TypeScript 6 (strict)                                 |
| 构建   | Vite 8                                                |
| UI     | PrimeVue 4 (Aura 主题, violet) + Tailwind CSS 4       |
| 表单   | `@primevue/forms` + 项目自定义校验                    |
| 国际化 | vue-i18n 11 (DE / ZH)                                 |
| 图表   | Chart.js 4                                            |
| 质量   | ESLint 10 + Prettier 3 + Vitest Coverage + SonarCloud |
| CI/CD  | GitHub Actions + GitHub Pages                         |

### 快速开始

```powershell
cd frontend
npm install
npm run dev        # http://localhost:5173
```

### 常用命令

| 命令                    | 作用                                               |
| ----------------------- | -------------------------------------------------- |
| `npm run dev`           | Vite 开发服务器                                    |
| `npm run build`         | 严格：lint + format + i18n + TypeScript + 生产构建 |
| `npm run build:fast`    | 快速：TypeScript + 生产构建                        |
| `npm run preview`       | 本地启动 `dist/`                                   |
| `npm run lint:check`    | ESLint                                             |
| `npm run format:check`  | Prettier                                           |
| `npm run test`          | Vitest 单元测试                                    |
| `npm run test:coverage` | Vitest 覆盖率，供 SonarCloud 使用                  |
| `npm run i18n:check`    | de/zh key 差异检查（会阻断本地 `build`）           |
| `npm run sonar:all`     | SonarCloud 扫描 + 拉取报告                         |

### 构建与部署

- CI 在 push/PR 时运行 format、lint、coverage test 和 build。
- GitHub Pages 在 CI 成功后通过 `.github/workflows/deploy-pages.yml` 自动发布。
- 本地模拟 Pages 子路径：

```powershell
cd frontend
$env:VITE_BASE_PATH = "/AbfindungsPilot/"
npm run build:fast
npm run preview
$env:VITE_BASE_PATH = $null
```

### 项目结构

```text
.
├─ frontend/                     # Vue/Vite App
│  ├─ public/                    # 静态资源、robots.txt、sitemap.xml
│  ├─ scripts/                   # i18n 检查 + SonarCloud 扫描
│  ├─ src/
│  │  ├─ calculation/            # 纯计算引擎（无框架依赖，可测试）
│  │  ├─ components/             # 可复用 UI 组件
│  │  ├─ composables/            # App 状态、计算、图表数据
│  │  ├─ i18n/                   # de.ts | zh.ts（结构 1:1）
│  │  ├─ tax-parameters/         # 年度参数，目前 2026
│  │  ├─ types/                  # UI / 计算相关类型
│  │  ├─ views/                  # InputView | CalculationView | ChartView
│  │  ├─ App.vue
│  │  ├─ main.ts
│  │  └─ style.css
│  ├─ tests/                     # Vitest 测试
│  ├─ index.html                 # SEO、Open Graph、JSON-LD
│  ├─ vite.config.ts             # Vite、Vitest、分包、Pages base
│  ├─ eslint.config.js
│  └─ sonar-project.properties   # SonarCloud 配置，不含 token
├─ .github/                      # CI、Pages 部署、Dependabot、PR 模板
├─ .dev-docs/                    # 开发文档（DE + ZH）
├─ LICENSE
├─ NOTICE.md
├─ CONTRIBUTING.md
└─ README.md
```

### 有意为之的简化

- 不支持 KFB 非对称转让（始终对半）
- ALG 期间 BA 对 PKV 的补贴未扣
- 不算月度 Lohnsteuer 预扣（仅年度 ESt）
- 不算资本利得（只覆盖 §§ 19 / 21 / 22 / 34）

完整理由和产品边界见 [03 - 计算引擎](.dev-docs/zh/03-calculation-engine.md) 与 [09 - 计算逻辑终检审计](.dev-docs/zh/09-calculation-audit.md)。

### 税务常量来源

税率、社保、Soli、Kirchensteuer 和家庭参数的具体来源见 [03 - 计算引擎](.dev-docs/zh/03-calculation-engine.md)。年度换参流程见 [10 - 更新年度参数](.dev-docs/zh/10-tax-parameter-upgrade.md)。当前生效值位于 [`frontend/src/tax-parameters/2026.json`](frontend/src/tax-parameters/2026.json)。

### 延伸文档

- 📁 [开发文档](.dev-docs/zh/README.md) - 架构、引擎、规范、工作流

### 状态

**核心功能 ✅ 完成。** 项目已准备好通过 GitHub Pages、CI、Dependabot、SonarCloud 和非商业许可证公开发布。

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
