# 06 - 工具链

> **30 秒了解：** `npm run build` 是本地「全部绿」入口，依次跑 lint、format、i18n 检查、TypeScript 和 Vite 构建。GitHub CI 单独跑 format、lint、Vitest coverage 和 `build:fast`。SonarCloud 通过 Vitest coverage + PowerShell 脚本跑。

## NPM 命令

| 命令                    | 作用                                                          | 检查策略          |
| ----------------------- | ------------------------------------------------------------- | ----------------- |
| `npm run dev`           | Vite 开发服务器，HMR 在 `<http://localhost:5173>`             | -                 |
| `npm run build`         | **严格**：`check:all` + `vue-tsc -b` + `vite build` + `dist/` | 提交前            |
| `npm run build:fast`    | 快速：仅 `vue-tsc -b` + `vite build`（本地调试用）            | -                 |
| `npm run preview`       | 本地启动 `dist/` 静态服务器（`<http://localhost:4173>`）      | -                 |
| `npm run check:all`     | 聚合：`lint:check` + `format:check` + `i18n:check`（不构建）  | 本地 build 内部   |
| `npm run lint:check`    | ESLint（只读）                                                | CI                |
| `npm run lint:fix`      | ESLint + 自动修复                                             | -                 |
| `npm run format:check`  | Prettier（只读）                                              | CI                |
| `npm run format:fix`    | Prettier + 自动修复                                           | -                 |
| `npm run test`          | Vitest 单元测试                                               | 推荐              |
| `npm run test:coverage` | Vitest + `coverage/lcov.info`，供 SonarCloud 读取             | 跑 Sonar 前推荐   |
| `npm run i18n:check`    | DE/ZH key 差异检查（见 [05](./05-i18n.md)）                   | 本地 `build` 阻塞 |
| `npm run sonar:all`     | `test:coverage` + SonarCloud 扫描 + 拉取报告                  | 发布前推荐        |

**经验法则：** 本地用 `dev` 和 `build:fast`，每次 commit 前跑 `build`。CI 不单独跑 `i18n:check`，所以涉及翻译 key 的改动尤其要本地跑 `npm run build`。

## 构建优化

Vite 配置（[`vite.config.ts`](../../../frontend/vite.config.ts)）加了两项默认不含的 bundle 优化：

### 1. PrimeIcons - 仅保留 woff2

PrimeIcons 的 `@font-face` 规则带五种字体格式（eot、woff2、woff、ttf、svg——合计 ~633 KB）。2026 年 **woff2 已足以覆盖 >97% 的浏览器**。一个小型 Vite 插件（`primeIconsWoff2Only`）在加载 CSS 时重写规则，只保留 woff2 引用；这样 eot/woff/ttf/svg 不会被打包。

**节省约：** ~598 KB 产物。

### 2. ChartView 异步加载

[`src/App.vue`](../../../frontend/src/App.vue) 中 `ChartView` 用 `defineAsyncComponent(() => import('./views/ChartView.vue'))` 加载。Chart.js（~200 KB）和图表组件被拆到独立 chunk，只有用户切到图表视图时才加载。

### 当前 bundle 大小（`npm run build` 后）

| Asset                   | 原始       | gzip       | 何时加载    |
| ----------------------- | ---------- | ---------- | ----------- |
| `index.html`            | 4.6 KB     | 1.6 KB     | First Paint |
| `index-*.css`           | 47.6 KB    | 10.0 KB    | First Paint |
| `primeicons-*.woff2`    | 35.1 KB    | -          | First Paint |
| `index-*.js`            | **942 KB** | **231 KB** | First Paint |
| `ChartView-*.js`        | 23.0 KB    | 7.3 KB     | 切到图表时  |
| `auto-*.js`（Chart.js） | 203.1 KB   | 69.6 KB    | 切到图表时  |

Tree-shaking 默认启用（Vite 8 + RollDown）。未使用的 PrimeVue 组件（如 `DataTable`、`Tree`、`Galleria`）不在 bundle 里——已通过 bundle 检查验证。

## Lint / Format 配置

| 工具            | 文件                                                                           | 要点                                                                      |
| --------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| ESLint          | [`eslint.config.js`](../../../frontend/eslint.config.js)                       | `typescript-eslint` + `eslint-plugin-vue`，Flat Config（默认 + 项目覆盖） |
| Prettier        | [`.prettierrc.json`](../../../frontend/.prettierrc.json)                       | 默认覆盖量少                                                              |
| Prettier Ignore | [`.prettierignore`](../../../frontend/.prettierignore)                         | 排除 `node_modules`、`dist`、`coverage`、Sonar 产物                       |
| Vue-I18n-Check  | [`scripts/check-i18n-keys.mjs`](../../../frontend/scripts/check-i18n-keys.mjs) | 见 [05](./05-i18n.md)                                                     |

## TypeScript

整个项目 `strict: true`。`vue-tsc` 在 `npm run build` 里跑。SFC 模板也会被类型检查。

| 文件                                                         | 角色                  |
| ------------------------------------------------------------ | --------------------- |
| [`tsconfig.json`](../../../frontend/tsconfig.json)           | Composite 根          |
| [`tsconfig.app.json`](../../../frontend/tsconfig.app.json)   | App 代码（`src/`）    |
| [`tsconfig.node.json`](../../../frontend/tsconfig.node.json) | Vite 配置 + Node 脚本 |

## 测试 / 覆盖率

Vitest 配置在 [`vite.config.ts`](../../../frontend/vite.config.ts)：

- 环境：`jsdom`
- Coverage Provider：V8
- 报告：`coverage/lcov.info`
- 测试文件放在 [`tests/`](../../../frontend/tests/)

[`package.json`](../../../frontend/package.json) 里的 NPM scripts：

```json
"test": "vitest run",
"test:coverage": "vitest run --coverage"
```

```powershell
cd frontend
npm run test
npm run test:coverage
```

`coverage/` 是生成目录，继续由 `.gitignore` 忽略。

## SonarCloud

本项目不适合使用 SonarCloud Automatic Analysis，因为 Automatic Analysis 不支持 coverage 导入，并且会忽略 `sonar-project.properties`。因此本项目应在 SonarCloud 里**关闭 Automatic Analysis**，使用本地或之后 CI 里的 `npm run sonar:all`。

配置文件：

| 文件                                                                     | 内容                                                                         | 入 Git?          |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------- | ---------------- |
| [`sonar-project.properties`](../../../frontend/sonar-project.properties) | SonarCloud URL、Organization、Project Key、Sources/Tests、Coverage、Excludes | ✅（不含 token） |
| [`scripts/sonar-scan.ps1`](../../../frontend/scripts/sonar-scan.ps1)     | 一站式扫描 + 拉报告                                                          | ✅               |
| [`.vscode/settings.json`](../../../.vscode/settings.json)                | SonarLint 项目绑定（`projectKey` + `connectionId`）                          | ✅               |

关键 Excludes：

```properties
sonar.exclusions=**/node_modules/**,**/dist/**,**/coverage/**,**/*.config.js,**/*.config.ts
sonar.tests=tests
sonar.test.inclusions=tests/**/*.test.ts,tests/**/*.spec.ts
sonar.javascript.lcov.reportPaths=coverage/lcov.info
sonar.coverage.exclusions=src/views/**,src/components/**,src/App.vue,src/main.ts,src/**/*.d.ts
sonar.cpd.exclusions=src/i18n/**      # de.ts/zh.ts 结构相同（设计如此）
sonar.scm.disabled=false              # Git 初始化后启用（每行 blame）
```

Token：

- token **不写入** `sonar-project.properties`
- `SONAR_TOKEN` 需要设置为 Windows 用户环境变量
- 可选设置 `SONAR_REPORT_TOKEN`；否则报告拉取也使用 `SONAR_TOKEN`

```powershell
[Environment]::SetEnvironmentVariable("SONAR_TOKEN", "<token>", "User")
```

设置后重启 VS Code/终端。

脚本优先使用本地 `node_modules/.bin/sonar-scanner.cmd`。扫描前会清理 `.scannerwork/`，避免旧的临时目录或 lock 文件导致扫描失败。

报告输出：`frontend/.sonarqube-report/sonar-report.json`（一份 JSON 含 Quality Gate、Metrics、按文件分组的 Issues、重复代码详情）。便于本地查看或 diff。

当前目标状态：

- Quality Gate: OK
- New Code Coverage: >= 80%
- New Code 上 Issues/Bugs/Code Smells 为 0

### 本地 SonarLint（VS Code）

扩展 `sonarsource.sonarlint-vscode` 已装。Connected Mode 通过下面两个配置自动激活：

- `.vscode/settings.json` -> `connectionId: 'rebula001-sonarcloud'` + `projectKey: 'rebula001_AbfindungsPilot'`
- 用户 `settings` -> `sonarlint.connectedMode.connections.sonarcloud` 含 `organizationKey: 'rebula001'`、`connectionId: 'rebula001-sonarcloud'`、`region: 'EU'`

验证：VS Code -> Output -> "SonarLint" Channel -> 日志含 `Bound to project 'rebula001_AbfindungsPilot'`。

## Git

| 文件                                 | 作用                                                                                               |
| ------------------------------------ | -------------------------------------------------------------------------------------------------- |
| [`/.gitignore`](../../../.gitignore) | 仓库根，忽略生成物（`dist/`、`coverage/`、`.scannerwork/`、`.sonarqube-report/`、`node_modules/`） |

`core.autocrlf=true`（Windows 习惯）。首次 commit 的 LF<->CRLF 警告正常；仓库内文件以 LF 保存。

## 推荐提交清单

```powershell
cd frontend
npm run build           # check:all + vue-tsc + vite build 全绿?
cd ..
git status              # 只有预期改动?
git diff --stat
git add .
git commit -m "..."
```

`npm run build` 内部会调 `check:all`（lint + format + i18n），任何一项失败全部中止——提交前一个命令就够。

发布前 / 大重构时还应跑 `npm run sonar:all` 并检查 Quality Gate。

## 推荐 VS Code 扩展

（根据用户记忆；本地已装）

- `Vue.volar` - Vue 3 LSP
- `dbaeumer.vscode-eslint`
- `esbenp.prettier-vscode`
- `sonarsource.sonarlint-vscode`
- `bradlc.vscode-tailwindcss`
- `@primevue/mcp` 通过 MCP（在 `.vscode/mcp.json` 配置）查 PrimeVue 组件
