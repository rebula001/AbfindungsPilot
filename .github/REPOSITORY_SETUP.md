# GitHub Repository Setup

> Diese Datei beschreibt **alle Schritte, die nach dem ersten `git push` in der GitHub-Web-UI** erledigt werden muessen, damit CI, Deploy, License-Erkennung und Schutzregeln korrekt funktionieren.
>
> 本文件列出 **首次 `git push` 之后需要在 GitHub 网页上完成的所有设置**，让 CI、部署、许可证识别和保护规则都正常工作。

---

## 0. Voraussetzungen / 前置条件

Lokal ist bereits vorbereitet - diese Dateien existieren im Repo:

| Datei | Zweck |
| --- | --- |
| `.github/workflows/ci.yml` | CI: lint + format + i18n + build |
| `.github/workflows/deploy-pages.yml` | Auto-Deploy nach gruenem CI-Lauf |
| `.github/pull_request_template.md` | Hinweis: keine externen PRs |
| `LICENSE` | PolyForm Noncommercial 1.0.0 |
| `NOTICE.md`, `CONTRIBUTING.md` | DE+ZH Lizenz-/Beitrags-Hinweise |
| `frontend/vite.config.ts` | `base` per `VITE_BASE_PATH` Env |
| `.gitignore` (root) | Token / build artefacts exkludiert |

---

## 1. Repository erstellen / 创建仓库

1. <https://github.com/new>
2. **Owner**: dein Account
3. **Repository name**: `abfindungspilot`
   ⚠ Wenn du einen anderen Namen nimmst, in [`deploy-pages.yml`](workflows/deploy-pages.yml) den `VITE_BASE_PATH` anpassen (`/<repo-name>/`).
4. **Description**: Browser tool to optimize the German severance (Abfindung) tax strategy for 2026. 浏览器工具，优化 2026 年德国 Abfindung 税务方案。
5. **Visibility**: **Public**
6. **Initialize**: alles abwaehlen (LICENSE, README, .gitignore liegen lokal).
7. "Create repository".

---

## 2. Lokal pushen / 本地推送

```powershell
cd C:\Users\TianY13\Documents\Projects\abfindungspilot

# Commit-Identitaet (einmalig)
git config user.name "ÖÖ"
git config user.email "<id>+<username>@users.noreply.github.com"  # GitHub Noreply

# Pre-Push Sicherheitscheck: Token-Datei darf NICHT getrackt sein
git ls-files frontend/sonar-project.properties  # muss leer sein
git log --all -p -- frontend/sonar-project.properties  # muss leer sein

git remote add origin https://github.com/<your-username>/abfindungspilot.git
git branch -M main
git push -u origin main
```

⚠ Wenn `git log --all -p --` etwas zurueckgibt -> **nicht pushen**, sondern erst die Historie mit `git filter-repo` bereinigen, sonst landet das Sonar-Token oeffentlich im History.

---

## 3. Settings -> Pages

**Settings -> Pages -> Build and deployment**

- **Source**: `GitHub Actions` (NICHT "Deploy from a branch")

Ohne diese Auswahl schlaegt der Deploy-Workflow fehl. Es ist eine einmalige Klick-Aktion pro Repository.

Nach dem ersten erfolgreichen Deploy erscheint hier auch die oeffentliche URL:

```text
https://<your-username>.github.io/abfindungspilot/
```

---

## 4. Settings -> General -> Features

Alles abwaehlen, was nicht gebraucht wird:

- ☐ **Wikis**
- ☐ **Issues**
- ☐ **Sponsorships**
- ☐ **Projects**
- ☐ **Discussions**
- ☐ **Preserve this repository**

(PRs lassen sich nicht ganz deaktivieren - der Hinweis kommt automatisch ueber `pull_request_template.md`.)

---

## 5. Settings -> Branches -> Branch protection rule

Regel fuer `main`:

- **Branch name pattern**: `main`
- ✅ **Require a pull request before merging**
  - kann auch ohne Reviewer auskommen, da du Solo bist - verhindert nur Force-Push aus Versehen
- ✅ **Require status checks to pass**
  - Required check: `lint, type-check, build` (kommt aus `ci.yml`)
  - "Require branches to be up to date before merging"
- ✅ **Block force pushes**
- ✅ **Require linear history** (optional, erzwingt rebase)
- ❌ Bypass-Regeln: keine

---

## 6. Settings -> Code security and analysis

- ✅ **Dependency graph**
- ✅ **Dependabot alerts**
- ✅ **Dependabot security updates**
- ✅ **Secret scanning** (letzte Verteidigungslinie, falls doch ein Token reinrutscht)
- ✅ **Push protection** (blockiert Pushes mit erkannten Secrets)

---

## 7. Settings -> About (Zahnrad oben rechts auf der Repo-Hauptseite)

- **Description** (siehe oben, 1 Satz DE/EN/ZH ok)
- **Website**: nach Pages-Deploy -> `https://<user>.github.io/abfindungspilot/`
- **Topics**: `german-tax`, `abfindung`, `severance`, `vue3`, `typescript`, `primevue`, `tax-calculator`, `i18n`, `non-commercial`
- ☐ Releases (nicht benoetigt)
- ☐ Packages (nicht benoetigt)
- ✅ Deployments (zeigt Pages-Status)

---

## 8. Verifikation nach dem ersten Push

| Check | Wo pruefen? | Erwartet |
| --- | --- | --- |
| CI gruen | Actions -> CI | ⏱ ~2-3 min |
| Deploy gruen | Actions -> Deploy to GitHub Pages | ⏱ ~2 min nach CI |
| Pages erreichbar | URL aus Settings -> Pages | App laedt, DE/ZH switch geht |
| Lizenz erkannt | Repo-Hauptseite, rechte Spalte | "PolyForm Noncommercial 1.0.0" |
| `<html lang>` synchron | DevTools -> Elements -> `<html>` | wechselt mit DE/ZH-Button |
| OG-Karte vollstaendig | <https://opengraph.xyz> | DE-Titel + Description sichtbar |
| robots.txt | `/abfindungspilot/robots.txt` | 200 OK |
| Strukturierte Daten | <https://search.google.com/test/rich-results> | gueltig |
| 404 -> SPA fallback | `https://<user>.github.io/abfindungspilot/foo/bar` | App laedt, kein 404-Seite |

---

## 9. README badges (optional)

Nach dem ersten erfolgreichen Workflow-Lauf in [`README.md`](./README.md) ganz oben hinzufuegen:

```markdown
![CI](https://github.com/<user>/abfindungspilot/actions/workflows/ci.yml/badge.svg)
[![Deploy](https://github.com/<user>/abfindungspilot/actions/workflows/deploy-pages.yml/badge.svg)](https://<user>.github.io/abfindungspilot/)
[![License: PolyForm NC 1.0.0](https://img.shields.io/badge/License-PolyForm%20NC%201.0.0-blue.svg)](LICENSE)
```

---

## 10. Was NICHT eingerichtet werden muss

| Feature | Warum nicht |
| --- | --- |
| GitHub Actions Secrets | Aktuell keine - kein Sonar-Cloud, kein Custom-Domain-Token, keine API-Keys |
| Environments | `github-pages` wird automatisch von `actions/deploy-pages` erzeugt |
| Self-hosted Runner | Free `ubuntu-latest` reicht fuer Build-Zeit << 5 min |
| Codeowners | Single-Maintainer-Projekt |
| Issue Templates | Issues sind deaktiviert |
| GPG-Commit-Signing | Optional, nicht erforderlich |
| GitHub Sponsors | Nicht-kommerzielles Projekt, passt nicht zur Lizenz |

---

## 11. Spaetere Erweiterungen / 后续可选

- **Dependabot config** ([`.github/dependabot.yml`](dependabot.yml)) -> woechentlicher PR fuer npm + actions Updates
- **Custom domain** -> Settings -> Pages -> Custom domain (DNS CNAME noetig)
- **Lighthouse CI** -> ein extra Workflow misst Performance bei jedem PR
- **Pre-commit Hook** (`husky` + `lint-staged`) -> blockiert lokal das Committen ungeformatierter Dateien

---

## 12. Notfall: Token doch oeffentlich gepusht

Falls das passiert:

1. **Sofort** in der SonarQube-Web-UI das Token revoken (User -> Security -> Revoke).
2. Neues Token generieren, lokal in `frontend/sonar-project.properties` eintragen.
3. Git-History bereinigen mit [`git-filter-repo`](https://github.com/newren/git-filter-repo).
4. `git push --force` (in Branch-Protection voruebergehend Bypass aktivieren).
5. GitHub-Support kontaktieren, damit Caches invalidiert werden.
6. Nachsehen, ob das Token irgendwo missbraucht wurde (Sonar Audit Log).

---

# 操作场景手册 / Szenario-Anleitungen

下面是几个常见操作的“按钮级”步骤说明，写给完全没接触过 GitHub 设置的情况。

---

## A. 如何让 GitHub 识别你的 PolyForm 许可证

GitHub 默认只能识别 SPDX 列表里的开源协议（MIT、Apache 等），PolyForm Noncommercial **不在** SPDX 里，所以**不会自动显示在仓库主页右侧**。

### 你能看到什么

| 情况 | 显示 |
| --- | --- |
| 默认（GitHub 不识别） | 右侧 "About" 面板里许可证一行 **缺失** |
| 用 `licensee` 工具友好的格式 | 显示 "Other" 或 "View license"，**点击会跳到 LICENSE 文件** |

我们当前的 `LICENSE` 文件已经使用 PolyForm 官方格式开头（`PolyForm Noncommercial License 1.0.0`），GitHub 至少会显示 **"View license"** 链接，这已经够了。

### 加强可见度（推荐）

1. 在 README 顶部加 license badge（见 §9 已有示例）。
2. 在仓库 About -> Description 末尾追加 `· PolyForm NC 1.0.0`。
3. 在每个源码文件顶部添加简短头注（可选，过度繁琐，**不推荐**对小项目做）。

---

## B. 如何彻底禁止外部 Pull Request

GitHub **不允许你彻底关闭 PR 按钮**（这是平台规则，不是你能选的）。但你可以“让外部 PR 实际上没有意义”：

### 已生效的措施

| 措施 | 效果 |
| --- | --- |
| `.github/pull_request_template.md` 已就位 | 任何人开 PR 时顶部都自动出现“不接受外部贡献”的中德双语 banner |
| `CONTRIBUTING.md` 明确写明 | GitHub 会在 PR 创建页自动链接到这个文件 |
| `main` 加了 branch protection | 任何 PR 必须通过 CI + 你的批准才能合并 |

### 关于 [`pull_request_template.md`](pull_request_template.md)

这个文件的特殊性，需要单独说明：

**它做什么**

GitHub 在用户点 "New Pull Request" 时，**自动**把这个文件的全部内容预填到 PR description 输入框里。这是 GitHub 唯一能在 PR 创建瞬间**强制**显示警告的渠道 - LICENSE / NOTICE / CONTRIBUTING 都要主动点链接才会被看见。

**为什么用 markdown 引用块（`>`）而不是 HTML 注释（`<!-- -->`）**

最直觉的写法是：

```html
<!--
⚠ This repository does NOT accept external contributions.
-->
```

这样警告**不会**显示在最终 PR 里（HTML 注释在 GitHub 渲染时被隐藏），看起来更“干净”，但实际**完全失效** - PR 作者根本看不到警告，只看到一个空白的描述框。

而且 Prettier 会把行 HTML 注释的开头格式化成 `* <!--`（被识别成标题），把警告文字渲染成 PR 标题。

**当前的方案**：

```markdown
> ## ⚠ This repository does NOT accept external contributions
>
> ---
>
> See / 详见: [LICENSE](../LICENSE) · [NOTICE.md](../NOTICE.md) · [CONTRIBUTING.md](../CONTRIBUTING.md)

<!-- Maintainer-only: describe the change below this line -->
```

- 顶部用 `>` 引用块 -> PR description 里渲染成显眼的 quote box，**强制可见**
- DE/ZH 双语 + 链接到 LICENSE / NOTICE / CONTRIBUTING
- 底部一行 HTML 注释只是给你自己（合 PR 时）一个提示，不会显示在 PR 上
- Prettier 校验通过（已实测），不会再被破坏

**外部贡献者实际体验**

打开 New PR 时第一眼看到的就是一段红色 ⚠ 的拒绝声明 + 三个链接。绝大多数人到这一步就放弃了；少数继续提交的，你直接 Close 即可（回复模板见下方）。

**维护要点**

- 不要把这个文件放进 `.prettierignore` - 当前格式 Prettier 已经接受
- 不要回退到 `<!-- -->` 写法
- 要修改文案直接改这个文件，commit 后 GitHub 立刻生效（无 cache）

### 仍需手动做的事

1. **遇到外部 PR 直接 Close + 礼貌回复一句**：

   Thank you for your interest. As stated in CONTRIBUTING.md, this repository does not accept external pull requests. You are welcome to fork and maintain your own version. Closing.

2. **不要回复讨论**，避免被解读为“准入意向”。
3. 如果有恶意 / 垃圾 PR：仓库主页右上 `...` -> **Block user**。

### 如果想更强硬

可以在仓库加一个 [`.github/CODEOWNERS`](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners) 文件，把整个仓库的 owner 设为只有你：

```text
.github/CODEOWNERS
* @<your-username>
```

配合 branch protection 的 "Require review from Code Owners"，外部 PR 100% 需要你的 approve 才能合并 - 你只要不点就永远合不进。

---

## C. 如何禁止非本人 push 到 main

只有你一个 collaborator 时，**默认就只有你能 push** - 因为别人根本没有 write 权限。但要避免**自己手滑 push 错东西**，按以下步骤强化：

### Step 1: Branch Protection（必做）

**Settings -> Branches -> Add branch ruleset** 或 **"Add classic branch protection rule"**。

经典模式（更简单）：

- **Branch name pattern**: `main`
- ✅ **Require a pull request before merging**
  - 这意味着**连你自己也不能直接 `git push origin main`**
  - 你必须开 PR 才能合并 -> 防误操作
  - ⚠ 如果觉得太麻烦，可以暂时关掉，但留着更安全
- ✅ **Require status checks to pass**
  - 选择 `lint, type-check, build`（CI workflow 的 job 名）
  - "Require branches to be up to date before merging"
- ✅ **Block force pushes** -> **必须淘汰** `git push --force` 把历史搞乱
- ✅ **Restrict deletions** -> 防止误删 main 分支
- ❌ **Allow bypassing the above settings** -> **不要勾**

### Step 2: 检查 Collaborators

**Settings -> Collaborators**：

- 应该 **只有你一个**（owner 角色）
- 如果有任何陌生账号 -> Remove

### Step 3: 检查 Deploy Keys & SSH Keys

**Settings -> Deploy keys** 和你账号的 **Settings -> SSH and GPG keys**：

- 不该有你不认识的 key
- 旧机器的 key 用不到了 -> Delete

### 结果

| 谁 | 能做什么 |
| --- | --- |
| 任何路人 | 只能 fork / clone |
| 你（直接 push main） | ❌ 被 branch protection 拦截 |
| 你（通过 PR 合并） | ✅ CI 绿后可以合并 |
| 你（紧急 force push） | 需要先临时关 protection（明确知道自己在做什么） |

---

## D. 如何执行部署到 GitHub Pages

部署完全自动化，**你不需要敲任何命令**。下面是从零到上线的全流程：

### 一次性设置（首次部署前必做）

1. **Settings -> Pages**
2. **Build and deployment** -> **Source**: 选择 **"GitHub Actions"**
   - ⚠ 不要选 "Deploy from a branch"！那是另一种方案，会和我们的 workflow 冲突
3. 不需要点任何 "Configure"，workflow 文件已经写好了

### 触发部署

部署会在以下三种情况**自动**发生：

| 触发方式 | 流程 |
| --- | --- |
| **Push 到 main** | CI 跑 -> 绿后 deploy-pages 自动跑 -> ~5 分钟后线上更新 |
| **PR 合并到 main** | 同上 |
| **手动触发** | Actions -> "Deploy to GitHub Pages" -> 右上 "Run workflow" -> Run |

### 观察部署状态

1. **Actions 标签**（仓库主页顶部）
   - 看到一个 "Deploy to GitHub Pages" 的 workflow run
   - 点进去看每一步的实时输出
2. **Settings -> Pages**
   - 顶部显示 "Your site is live at https://...github.io/abfindungspilot/"
   - 每次新部署都会更新时间戳
3. **首页右下角 Deployments**
   - 点开看历史部署记录

### 部署失败常见原因

| 错误 | 原因 | 修复 |
| --- | --- | --- |
| `Error: Get Pages site failed` | 没在 Settings -> Pages 选 "GitHub Actions" | 见上面 step 2 |
| 页面打开是 404 | 仓库名 ≠ `abfindungspilot` | 改 [`deploy-pages.yml`](workflows/deploy-pages.yml) 里的 `VITE_BASE_PATH` |
| 资源全部 404（白屏 + console 红） | `base` 没设对 | 同上 |
| 路由刷新后 404 | `404.html` 没生成 | 检查 workflow 里 `Copy-Item` 那步是否成功 |
| Actions 标签显示 "skipped" | CI 没跑成功，被 `if:` 条件拦下 | 先修 CI |

### 取消 / 暂停部署

- **临时暂停**: Settings -> Pages -> Source -> 改成 "None"。Pages URL 变 404，文件保留。
- **完全删除**: Settings -> Pages -> 滚到底 -> "Unpublish site"。

### 重新部署旧版本

如果新部署有 bug 想回滚：

1. Actions -> 找到上一次绿色的 deploy run
2. 右上 "Re-run all jobs"
3. 旧版本会被重新部署（前提是仓库 `main` 还在那个 commit 之前没改）

如果 `main` 已经走远了想回到老 commit：

```powershell
git revert <bad-commit-sha>
git push    # CI + deploy 自动跑，回到正确版本
```

**永远不要** `git reset --hard` + `git push --force` - branch protection 会拦下，应该用 `revert`。

### E. 部署后自查清单（5 分钟）

部署成功后用这个清单跑一遍：

| ✓ | 检查 | 怎么做 |
| --- | --- | --- |
| ☐ | Pages URL 能打开 | `https://<user>.github.io/abfindungspilot/` 应显示 App 主界面 |
| ☐ | Logo / favicon 显示 | 浏览器标签页右上角 |
| ☐ | DE/ZH 切换正常 | 顶部按钮，DevTools `<html lang>` 跟着变 |
| ☐ | 图表能加载（懒加载） | 切到图表 tab，DevTools Network 应看到 `ChartView-*.js` 和 `auto-*.js` |
| ☐ | localStorage 持久化 | 输入数据 -> 刷新 -> 数据还在 |
| ☐ | robots.txt | 访问 `/abfindungspilot/robots.txt` -> 200 |
| ☐ | og 卡片 | `<https://opengraph.xyz>` 输入 URL -> 看到德语标题 |
| ☐ | 结构化数据 | `<https://search.google.com/test/rich-results>` -> 无错误 |
| ☐ | Console 无红色报错 | DevTools Console 干净 |
| ☐ | Lighthouse 跑分 | DevTools -> Lighthouse -> 至少 SEO 90+, Performance 70+ |

---

## F. 如何让用户能搜到你的 App

把仓库设为 public **不会**自动让人找到你。**被发现**分两个独立战场：**GitHub 站内**（开发者）和**公开互联网**（普通用户搜 Google/Bing）。下面是按优先级排序的操作清单。

### Step 1: 填仓库元数据（5 分钟，GitHub 内部 SEO 的核心）

仓库主页 -> 右上 **About** 区域的齿轮图标：

| 字段 | 填什么 |
| --- | --- |
| **Description** | `Abfindungspilot - Rechner fuer Abfindungen, Fuenftelregelung und ELSTER-Vergleich (DE 2026). Source-available, non-commercial.` |
| **Website** | `https://<user>.github.io/abfindungspilot/`（部署成功后填） |
| **Topics** | `abfindung` `fuenftelregelung` `steuer` `einkommensteuer` `elster` `germany` `deutschland` `tax-calculator` `vue3` `typescript` |

**为什么 Topics 重要：** 用户浏览（<https://github.com/topics/abfindung> 这种页面时），你的项目会出现在那里。Topics 是 GitHub 站内搜索的主要排序信号 - 比 README 内容权重高。

### Step 2: Social Preview Image（15 分钟）

**Settings -> General -> Social preview -> Edit**：

- 上传一张 **1280x640** PNG
- 用途：别人在 X/Twitter、LinkedIn、微信、Slack、Discord 分享你的仓库链接时显示的预览图
- 不传 -> 默认丑陋的灰色 GitHub logo
- 这张图还可以同时当 [`frontend/index.html`](./frontend/index.html) 的 `og:image` 用（一图两用）

最低标准：项目名 + slogan + logo。Figma / Canva 30 分钟可做完。

### Step 3: Sitemap + Search Console（30 分钟，公开搜索引擎入口）

文件已就位：[`frontend/public/sitemap.xml`](./frontend/public/sitemap.xml) + [`frontend/public/robots.txt`](./frontend/public/robots.txt)。两个文件都含 `<USER>` 占位符。

**(a) 替换占位符**

```powershell
# 在 frontend/public/sitemap.xml 和 robots.txt 里
# 把 <USER> 全部替换为你的 GitHub 用户名（或自定义域名）
```

**(b) 重新部署**

push -> CI -> deploy -> 验证：

- `https://<user>.github.io/abfindungspilot/sitemap.xml` 返回 200 + XML
- `https://<user>.github.io/abfindungspilot/robots.txt` 含 `Sitemap:` 行

**(c) Google Search Console**

1. <https://search.google.com/search-console> -> "Add property"
2. 选 **URL prefix** -> 输入 `https://<user>.github.io/abfindungspilot/`
3. 验证方式：选 "HTML tag" - GitHub Pages 不能改 HTTP header，所以 DNS / file 验证都不行
4. 把 Google 给的 `<meta name="google-site-verification" content="...">` 加到 [`frontend/index.html`](./frontend/index.html) 的 `<head>`
5. `push` -> 重新部署 -> 回到 Search Console 点 "Verify"
6. 验证通过 -> 左侧 **Sitemaps** -> 输入 `sitemap.xml` -> Submit

-> Google 通常 1-7 天开始索引，2-4 周才会在搜索结果里出现。

**(d) Bing Webmaster Tools**

<https://www.bing.com/webmasters> -> 同样流程。中文受众用 Bing 不少，国内访问也比 Google 顺畅。

### Step 4: README badges（5 分钟，信任信号）

部署成功后给 [`README.md`](./README.md) 顶部加 badges。模板见 §9。

**作用：** 让访问者一眼看到**项目活着、CI 是绿的、license 清楚** -> 提高停留时间 -> GitHub 算法判定为高质量项目。

### Step 5: 反向链接（最重要也最慢）

Google 排序的核心信号是“有多少高质量网站链接向你”。GitHub Pages 默认 PageRank 是 0。提升办法（按“性价比”排序）：

| 方式 | 难度 | 预期效果 |
| --- | --- | --- |
| dev.to 写一篇 "I built an Abfindungsrechner" | 低 | 高（持续流量） |
| Hacker News "Show HN" | 低 | 高（如果上首页） |
| Reddit r/Finanzen / r/de（按 sub 规则） | 低 | 中 |
| 德国论坛：wallstreet-online, finanzfrage.net | 中 | 中（窄但精准受众） |
| 中文社区：少数派、V2EX | 低 | 中（中文受众） |
| 自己博客 / 个人网站友情链接 | 低 | 低 |

⚠ **不要做：** 链接农场、群发外链、买反向链接。Google 会反向惩罚，永久。

### Step 6: 关键词预期管理

德语 SEO 现状：

| 关键词 | 你能进的位置 | 原因 |
| --- | --- | --- |
| `Abfindungspilot` | 第 1 位 | 独有名字，无人竞争 |
| `Abfindungsrechner Open Source` | 第 1-3 位 | 长尾词，竞争少 |
| `DSGVO-konformer Abfindungsrechner` | 第 1-5 位 | 你的差异化卖点（不收集数据） |
| `Abfindungsrechner ohne Anmeldung` | 第 1-5 位 | 同上 |
| `Fuenftelregelung Rechner 2026` | 第 5-10 页 | 大站盘踞（Brutto-Netto-Rechner, Smartsteuer 等） |
| `Abfindung Rechner` | 第 10 页+ | 极高竞争词，新站无戏 |

**策略：** 不要追 "Abfindung Rechner" 这种红海词。在 README 和 [`frontend/index.html`](./frontend/index.html) 强调差异化长尾词 - 流量小但转化率高。

### 验证 SEO 已生效

部署后 1-7 天：

| 检查 | 怎么做 |
| --- | --- |
| Google 已收录 | Google 搜 `site:<user>.github.io/abfindungspilot`，看是否有结果 |
| Sitemap 已读取 | Search Console -> Sitemaps，状态应为 "Success" + 显示 URL 数 |
| 富媒体结果 | <https://search.google.com/test/rich-results> 输入 URL -> JSON-LD 应被识别 |
| OG 卡片渲染正确 | <https://opengraph.xyz> 输入 URL -> DE 标题 + 描述 + 图片 |
| Bing 已收录 | Bing 搜 `site:<user>.github.io/abfindungspilot` |

### Step 7: Releases（GitHub 内部曝光放大器）

每次重大更新打 git tag -> 在 GitHub UI 创建 Release：

```powershell
git tag v1.0.0
git push origin v1.0.0
```

然后 **Releases -> Create a new release**：

- Tag: 选刚才的 `v1.0.0`
- Title: `v1.0.0 - Initial public release`
- Description: changelog（手写或用 GitHub 的 "Generate release notes" 自动从 commits 生成）

**作用：**

- Release 出现在仓库主页右侧栏 -> 访问者一眼看到“在维护”
- watcher 收到邮件通知
- GitHub Trending 算法把“近期有 release”作为加权
- Search Console 重新爬取信号

### 不该做的事

| ❌ 别做 | 原因 |
| --- | --- |
| 启用 Discussions 但不回应 | 会变成“用户求助”积压现场，看起来像项目死了 |
| 启用 Issues 但不回应 | 同上。要么关掉（默认已关），要么准备好定期清理 |
| 频繁 force push main | 破坏 GitHub 的“近期活跃度”信号 |
| 在 commit message 里塞关键词 | Google 不读 commit message，只是显得不专业 |
| 给自己的项目刷 star | GitHub 会检测并反向惩罚 |

### 优先级速查（如果时间紧）

1. **5 分钟：** Step 1（Description + Topics + Website）
2. **15 分钟：** Step 2（Social Preview）
3. **30 分钟：** Step 3（Sitemap + Search Console）
4. **5 分钟：** Step 4（README badges）
5. **持续性：** Step 5（反向链接）+ Step 7（每次重要更新打 release）

---

## Referenzen

- Vorbereitete Checkliste (vor dem Push): [`.claude/tasks/2026-04-30-github-release-checklist.md`](./.claude/tasks/2026-04-30-github-release-checklist.md)
- Beitrags-Politik: [`CONTRIBUTING.md`](./CONTRIBUTING.md)
- Lizenz: [`LICENSE`](./LICENSE) + [`NOTICE.md`](./NOTICE.md)
