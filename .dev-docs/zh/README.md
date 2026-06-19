# Abfindungspilot - 开发文档（中文）

> **读者：** 半年后的你自己。前置：Vue 3 / TypeScript 基础、德国税法词汇。

## 阅读顺序

1. [01 - 总览](./01-overview.md) - App 是干什么的、给谁用、什么场景
2. [02 - 架构](./02-architecture.md) - 分层、数据流、目录结构
3. [03 - 计算引擎](./03-calculation-engine.md) - 税务公式、§ 法条引用、算法
4. [04 - UI 规范](./04-ui-conventions.md) - PrimeVue、Forms、命名
5. [05 - i18n](./05-i18n.md) - 德/中文语机制、翻译规则
6. [06 - 工具链](./06-tooling.md) - Lint、Sonar、Build、提交清单
7. [07 - 工作流](./07-development-workflow.md) - 端到端：加 UI 字段、改税率
8. [08 - GitHub 发布与开源准备](./08-github-release.md) - 许可证、CI/CD、Pages、Dependabot、PR 模板
9. [09 - 计算逻辑终检审计](./09-calculation-audit.md) - 已检查假设、修正项、剩余边界
10. [10 - 更新年度参数](./10-tax-parameter-upgrade.md) - 税务 / 社保 JSON 参数的年度更新流程

## 速查

| 命令                                  | 作用                                   |
| ------------------------------------- | -------------------------------------- |
| `npm run dev`                         | Vite 开发服务器                        |
| `npm run build`                       | 严格：check:all + vue-tsc + vite build |
| `npm run build:fast`                  | 快速：仅 vue-tsc + vite build          |
| `npm run preview`                     | 本地启动 `dist/`                       |
| `npm run check:all`                   | lint + format + i18n（不构建）         |
| `npm run lint:check` / `lint:fix`     | ESLint                                 |
| `npm run format:check` / `format:fix` | Prettier                               |
| `npm run i18n:check`                  | de/zh 键差异（CI 阻塞）                |
| `npm run sonar:all`                   | SonarQube 扫描 + 拉取报告              |

## 相关目录

- [`.claude/decisions/`](../../../.claude/decisions/) - 架构决策记录（为什么这么做）
- [`.claude/tasks/`](../../../.claude/tasks/) - 重构 / 功能开发的历史
- [`.claude/tasks/development-standards.md`](../../../.claude/tasks/development-standards.md) - 正式开发标准
