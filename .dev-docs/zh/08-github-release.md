# 08 - GitHub 发布与开源准备

> **30 秒了解：** 仓库以 **PolyForm Noncommercial** 准备开源——源码可读、允许 fork，但禁止商用。外部 PR 通过法律层（许可证）和组织层（PR 模板 + 分支保护）双重屏蔽。CI 检查每次 push，之后 Pages 自动部署。Dependabot 每周自动开依赖升级 PR。

## 文件清单

| 文件 | 作用 |
| --- | --- |
| [`/LICENSE`](../../../LICENSE) | PolyForm Noncommercial 1.0.0 全文 + `Copyright (c) 2026 Ö_Ö` |
| [`/NOTICE.md`](../../../NOTICE.md) | DE+ZH 允许/禁止表格、税务免责声明 |
| [`/CONTRIBUTING.md`](../../../CONTRIBUTING.md) | DE+ZH [不接受外部贡献] |
| [`/README.md`](../../../README.md) | 双语（上 DE 下 ZH）；含许可证 / 免责声明章节 |
| [`.github/REPOSITORY_SETUP.md`](../../../.github/REPOSITORY_SETUP.md) | 操作手册：分步 GitHub UI 操作 + 场景手册 A-E |
| [`.github/pull_request_template.md`](../../../.github/pull_request_template.md) | 每个 PR 自动预填 DE/ZH「禁止外部 PR」警告 |
| [`.github/dependabot.yml`](../../../.github/dependabot.yml) | npm 每周 + GitHub Actions 每月自动升级 PR |
| [`.github/workflows/ci.yml`](../../../.github/workflows/ci.yml) | push/PR 时跑 lint + type-check + build |
| [`.github/workflows/deploy-pages.yml`](../../../.github/workflows/deploy-pages.yml) | CI 成功后部署 GitHub Pages |
| [`/frontend/index.html`](../../../frontend/index.html) | SEO 元数据（OG、Twitter、JSON-LD WebApplication/FinanceApplication） |
| [`/frontend/public/robots.txt`](../../../frontend/public/robots.txt) | 允许全部爬虫 + sitemap 占位 |
| [`.claude/tasks/2026-04-30-github-release-checklist.md`](../../../.claude/tasks/2026-04-30-github-release-checklist.md) | Push 前清单 |

## 许可证模型：PolyForm Noncommercial 1.0.0

**为什么不用 MIT/Apache?** 此项目希望以 _source-available_ 形式开放，但 **禁止商用**（不得作为税务咨询工具转售、不得嵌入闭源 SaaS 等）。

**为什么不用 Creative Commons?** CC 不是为软件设计的。

**为什么用 PolyForm NC?** 专为软件设计，法律措辞清楚；OSI **不**承认它是 "Open Source"——这正是**有意为之**，因为 OSI 规则禁止按商用划用途。

**后果：**

- GitHub 不能通过 SPDX 自动识别 PolyForm NC。仓库 "About" 侧栏显示 "Other"——见 [`REPOSITORY_SETUP.md` §A](../../../.github/REPOSITORY_SETUP.md)
- `package.json` 写 `"license": "SEE LICENSE IN ../LICENSE"`（不带 SPDX 标识符）。

## 屏蔽外部贡献

三道防线（见 [`REPOSITORY_SETUP.md` §B](../../../.github/REPOSITORY_SETUP.md)）：

1. **法律：** PolyForm NC + `CONTRIBUTING.md` 明确写“不接受外部 PR”。
2. **UX：** `pull_request_template.md` 自动预填 PR body——DE/ZH 警告用 markdown blockquote（`>`），不是 HTML 注释。
3. **技术：** `main` 分支保护（禁止 force push、禁止删除分支、要求 PR + CI 绿）。

### PR 模板为什么用 blockquote 而不是 HTML 注释?

| 写法 | "New PR" 对话框可见? | 经过 Prettier? |
| --- | --- | --- |
| `<!-- 隐藏提示 -->` | ❌ 不可见（毫无作用） | ❌ 被改成 `# <!--` |
| `> ⚠ 警告（markdown 引用块）` | ✅ 醒目可见 | ✅ 稳定 |

blockquote 形式是 GitHub 和 Prettier 都能正确渲染的唯一方案。**不要**把这个文件加入 `.prettierignore`——必须让 Prettier 持续保持其格式。

## CI workflow ([`ci.yml`](../../../.github/workflows/ci.yml))

**触发：** push 到 `main`、Pull Request、手动 dispatch。

```yaml
jobs:
  build:
    name: Lint, type-check, build      # 这个名字必须填到 Branch Protection 的 Required Status Check
    runs-on: ubuntu-latest
    steps:
      - actions/checkout@v4
      - actions/setup-node@v4 (node-version: 22, cache: npm)
      - npm ci (在 frontend/ 目录)
      - npm run build                  # 严格模式 -> 内部跑 check:all + vue-tsc + vite build
      - actions/upload-artifact@v4 (dist, 保留 7 天)
```

**Concurrency：** `cancel-in-progress: true`——新 push 立刻让旧 Job 作废。

**重要：** **Job 名** `"Lint, type-check, build"` 同时是 Branch Protection 的 **Required Status Check**。改名时分支保护规则也要同步改。

## Pages 部署 ([`deploy-pages.yml`](../../../.github/workflows/deploy-pages.yml))

**触发：** CI 成功后 `workflow_run` + 手动 dispatch。

```yaml
env:
  VITE_BASE_PATH: /abfindungspilot/    # 仓库名不同时要改

jobs:
  build:
    - npm ci + npm run build:fast      # CI 已检查过，这里只生成产物
    - Copy-Item dist/index.html dist/404.html    # SPA fallback (pwsh)
    - actions/upload-pages-artifact@v3
  deploy:
    needs: build
    environment: github-pages
    - actions/deploy-pages@v4
```

**为什么 `build:fast` 而不是 `build`?** 因为 CI 刚跑完 lint/format/i18n/TS 全套检查，再跑一次浪费。如果某次手动只触发 Pages workflow（例如分支切换测试），跑 `build:fast` 也可接受——Pages workflow 不是主 quality gate。

**`VITE_BASE_PATH`** 在 [`vite.config.ts`](../../../frontend/vite.config.ts) 中读取：

```ts
base: (globalThis as { process?: { env?: { VITE_BASE_PATH?: string } } }).process?.env.VITE_BASE_PATH ?? '/';
```

（用 cast 而不是 `@types/node`——`process` 仅在 Vite 构建期存在，不能让 TS 在 SFC 代码里把 Node 全局当成可用。）

## Dependabot ([`dependabot.yml`](../../../.github/dependabot.yml))

| Ecosystem | 路径 | 频率 | PR 上限 | 分组 |
| --- | --- | --- | --- | --- |
| `npm` | `/frontend` | 每周一 | 5 | `minor + patch` 合并；`major` 单独 |
| `github-actions` | `/` | 每月 | 3 | （无分组） |

**为什么分组?** 防止每周 10 个独立 `"Bump @types/foo from 1.2.3 to 1.2.4"` PR 占用通知。Major 版本仍单独，因为可能有 breaking change。

**Dependabot PR 不会被 PR 模板的“屏蔽外部贡献”机制拦截**——它来自内部的 `dependabot[bot]` 账号，不是外部 fork。CI 会跑，绿了你 merge。

## SEO + i18n 识别

[`frontend/index.html`](../../../frontend/index.html) 包含：

- `<title>`、`<meta name="description">`、`<meta name="keywords">`（德语——主要受众）
- Open Graph + Twitter Card（社交平台预览）
- JSON-LD `WebApplication` + `FinanceApplication`（搜索引擎结构化数据）
- `<noscript>` 含 DE H1（无 JS 的爬虫至少能看到标题）
- License meta tags

**`<html lang="...">` 运行时同步：** [`src/App.vue`](../../../frontend/src/App.vue) 中：

```ts
watchEffect(() => {
  document.documentElement.lang = locale.value;
});
```

-> 点 ZH 按钮后 HTML 元素自动变为 `lang="zh"`（屏幕阅读器和语言检测都会受益）。

[`frontend/public/robots.txt`](../../../frontend/public/robots.txt) 允许全部爬虫 + 预留一行 sitemap（按需手动生成）。

## 发布前清单

完整列表见 [`.claude/tasks/2026-04-30-github-release-checklist.md`](../../../.claude/tasks/2026-04-30-github-release-checklist.md)。

精简版：

```powershell
cd frontend
npm run build                    # 全绿?
$env:VITE_BASE_PATH = "/abfindungspilot/"
npm run build                    # Pages 路径正确?
$env:VITE_BASE_PATH = $null
cd ..
git status; git diff --stat      # 只有预期的文件?
```

## GitHub UI 操作

浏览器内的配置**不**在 repo 里——必须手动做。完整带步骤的指南：

-> [`.github/REPOSITORY_SETUP.md`](../../../.github/REPOSITORY_SETUP.md)（章节 0-12 + 场景手册 A-E）

最关键的手动步骤：

| # | 操作 | 位置 |
| --- | --- | --- |
| 1 | 创建仓库（public、空仓库） | `github.com/new` |
| 2 | 第一次 push | 本地：`git remote add ... && git push -u` |
| 3 | `main` 分支保护 | `Settings -> Branches -> Add rule` |
| 4 | 启用 Pages（Source: GitHub Actions） | `Settings -> Pages` |
| 5 | 第一次手动触发 Pages workflow | `Actions -> "Deploy Pages" -> Run workflow` |
| 6 | 自定义域名（可选） | `Settings -> Pages -> Custom domain` |

## 部署后验证

第一次 Pages 部署成功后：

1. 打开 `https://<user>.github.io/abfindungspilot/`
2. 切到图表 tab -> DevTools Network 应该看到**单独的 chunk** 加载（`ChartView-*.js` + `auto-*.js`）-> 验证 [06](./06-tooling.md#2-chartview-异步加载) 中的 lazy-loading 优化
3. 点 ZH 按钮 -> DevTools Elements：`<html lang="zh">`
4. 查看 page source -> `<script type="application/ld+json">` 含 `FinanceApplication` JSON-LD
