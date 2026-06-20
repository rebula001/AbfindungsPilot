# 06 - Tooling

> **In 30 Sekunden:** `npm run build` ist lokal die Single-Source-of-Truth für „alles ist grün“ - sie startet Lint, Format, i18n-Check, TypeScript- und Vite-Build hintereinander. GitHub CI läuft mit separaten Schritten für Format, Lint, Vitest-Coverage und `build:fast`. SonarCloud läuft via Vitest-Coverage + PowerShell-Skript.

## NPM-Befehle

| Befehl                  | Zweck                                                               | Prüfstrategie             |
| ----------------------- | ------------------------------------------------------------------- | ------------------------- |
| `npm run dev`           | Vite Dev-Server, HMR auf `<http://localhost:5173>`                  | -                         |
| `npm run build`         | `#strict#`: `check:all` + `vue-tsc -b` + `vite build` + `dist/`     | vor Commit                |
| `npm run build:fast`    | Schnell: nur `vue-tsc -b` + `vite build` (lokales Debugging)        | -                         |
| `npm run preview`       | Lokaler Server für `dist/` Ausgabe (`<http://localhost:4173>`)      | -                         |
| `npm run check:all`     | Aggregat: `lint:check` + `format:check` + `i18n:check` (kein Build) | im lokalen Build          |
| `npm run lint:check`    | ESLint (read-only)                                                  | CI                        |
| `npm run lint:fix`      | ESLint + auto-fix                                                   | -                         |
| `npm run format:check`  | Prettier (read-only)                                                | CI                        |
| `npm run format:fix`    | Prettier + auto-fix                                                 | -                         |
| `npm run test`          | Vitest Unit-Tests                                                   | empfohlen                 |
| `npm run test:coverage` | Vitest + `coverage/lcov.info` für SonarCloud                        | empfohlen vor Sonar       |
| `npm run i18n:check`    | DE/ZH Key-Diff (siehe [05](./05-i18n.md))                           | blockiert lokalen `build` |
| `npm run sonar:all`     | `test:coverage` + SonarCloud Scan + Report fetchen                  | empfohlen vor Release     |

**Faustregel:** lokal `dev` und `build:fast`, vor jedem Commit `build`. CI ruft `i18n:check` nicht separat auf; bei Änderungen an Übersetzungs-Keys daher besonders lokal `npm run build` laufen lassen.

## Build-Optimierungen

Die Vite-Konfiguration ([`vite.config.ts`](../../../frontend/vite.config.ts)) wendet zwei Bundle-Optimierungen an, die im Default-Setup von Vite nicht enthalten sind:

### 1. PrimeIcons - nur woff2

PrimeIcons liefert seine `@font-face`-Regel mit fünf Schriftformaten aus (eot, woff2, woff, ttf, svg - zusammen ~633 KB). Stand 2026 reicht **woff2 für >97 % aller Browser**. Ein eigenes Mini-Vite-Plugin (`primeIconsWoff2Only`) schreibt die CSS-Regel beim Laden so um, dass nur woff2 referenziert wird; dadurch werden eot/woff/ttf/svg vom Bundler nicht mehr emittiert.

**Ersparnis:** ~598 KB Auslieferung.

### 2. ChartView lazy laden

In [`src/App.vue`](../../../frontend/src/App.vue) wird `ChartView` per `defineAsyncComponent(() => import('./views/ChartView.vue'))` geladen. Dadurch wandern Chart.js (~200 KB) und die Chart-Composition in einen separaten Chunk, der erst beim Wechsel in die Diagramm-Ansicht geladen wird.

### Aktuelle Bundle-Größen (nach `npm run build`)

| Asset                  | Roh        | gzip       | Wann?                 |
| ---------------------- | ---------- | ---------- | --------------------- |
| `index.html`           | 4.6 KB     | 1.6 KB     | First Paint           |
| `index-*.css`          | 47.6 KB    | 10.0 KB    | First Paint           |
| `primeicons-*.woff2`   | 35.1 KB    | -          | First Paint           |
| `index-*.js`           | **942 KB** | **231 KB** | First Paint           |
| `ChartView-*.js`       | 23.0 KB    | 7.3 KB     | beim Diagramm-Wechsel |
| `auto-*.js` (Chart.js) | 203.1 KB   | 69.6 KB    | beim Diagramm-Wechsel |

Tree-Shaking ist standardmäßig aktiv (Vite 8 + RollDown). Ungenutzte PrimeVue-Komponenten (z. B. `DataTable`, `Tree`, `Galleria`) sind im Bundle nicht enthalten - verifiziert per Bundle-Inspektion.

## Lint / Format-Konfiguration

| Tool            | Datei                                                                          | Wesentliches                                                                          |
| --------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| ESLint          | [`eslint.config.js`](../../../frontend/eslint.config.js)                       | `typescript-eslint` + `eslint-plugin-vue`, Flat Config (Standard + Projekt-Overrides) |
| Prettier        | [`.prettierrc.json`](../../../frontend/.prettierrc.json)                       | schlank                                                                               |
| Prettier Ignore | [`.prettierignore`](../../../frontend/.prettierignore)                         | schließt `node_modules`, `dist`, `coverage`, Sonar-Artefakte aus                      |
| Vue-I18n-Check  | [`scripts/check-i18n-keys.mjs`](../../../frontend/scripts/check-i18n-keys.mjs) | siehe [05](./05-i18n.md)                                                              |

## TypeScript

`strict: true` projektweit. `vue-tsc` läuft als Teil von `npm run build`. SFC-Templates werden mit-typegeprüft.

| File                                                         | Rolle                      |
| ------------------------------------------------------------ | -------------------------- |
| [`tsconfig.json`](../../../frontend/tsconfig.json)           | Composite root             |
| [`tsconfig.app.json`](../../../frontend/tsconfig.app.json)   | App-Code (`src/`)          |
| [`tsconfig.node.json`](../../../frontend/tsconfig.node.json) | Vite-Konfig + Node-Skripte |

## Tests / Coverage

Vitest ist in [`vite.config.ts`](../../../frontend/vite.config.ts) konfiguriert:

- Umgebung: `jsdom`
- Coverage Provider: V8
- Report: `coverage/lcov.info`
- Erste Tests liegen unter [`tests/`](../../../frontend/tests/)

NPM-Skripte in [`package.json`](../../../frontend/package.json):

```json
"test": "vitest run",
"test:coverage": "vitest run --coverage"
```

```powershell
cd frontend
npm run test
npm run test:coverage
```

`coverage/` ist ein generiertes Verzeichnis und bleibt in `.gitignore`.

## SonarCloud

Automatic Analysis ist für dieses Projekt nicht geeignet, weil SonarCloud Automatic Analysis kein Coverage-Import unterstützt und `sonar-project.properties` ignoriert. Für dieses Projekt gilt daher: **Automatic Analysis in SonarCloud deaktivieren** und lokal bzw. später per CI `npm run sonar:all` verwenden.

Konfig-Dateien:

| Datei                                                                    | Inhalt                                                                       | In Git?           |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------- | ----------------- |
| [`sonar-project.properties`](../../../frontend/sonar-project.properties) | SonarCloud URL, Organization, Project-Key, Sources/Tests, Coverage, Excludes | ✅ (keine Tokens) |
| [`scripts/sonar-scan.ps1`](../../../frontend/scripts/sonar-scan.ps1)     | One-shot Scan + Report-Fetch                                                 | ✅                |
| [`.vscode/settings.json`](../../../.vscode/settings.json)                | SonarLint Projektbindung (`projectKey` + `connectionId`)                     | ✅                |

Wichtige Excludes:

```properties
sonar.exclusions=**/node_modules/**,**/dist/**,**/coverage/**,**/*.config.js,**/*.config.ts
sonar.tests=tests
sonar.test.inclusions=tests/**/*.test.ts,tests/**/*.spec.ts
sonar.javascript.lcov.reportPaths=coverage/lcov.info
sonar.coverage.exclusions=src/views/**,src/components/**,src/App.vue,src/main.ts,src/**/*.d.ts
sonar.cpd.exclusions=src/i18n/**      # de.ts/zh.ts strukturidentisch (Design)
sonar.scm.disabled=false              # seit Git-Init aktiv (per-line blame)
```

Token:

- Tokens werden **nicht** in `sonar-project.properties` gespeichert.
- `SONAR_TOKEN` muss als Windows User-Environment-Variable gesetzt sein.
- Optional kann `SONAR_REPORT_TOKEN` gesetzt werden; sonst verwendet der Report-Fetcher ebenfalls `SONAR_TOKEN`.

```powershell
[Environment]::SetEnvironmentVariable("SONAR_TOKEN", "<token>", "User")
```

Danach VS Code/Terminal neu starten.

Das Skript verwendet bevorzugt den lokalen Scanner aus `node_modules/.bin/sonar-scanner.cmd`. Vor dem Scan wird `.scannerwork/` gelöscht, damit keine alten Temp-/Lock-Dateien den Scan blockieren.

Report-Output: `frontend/.sonarqube-report/sonar-report.json` (alles in einem JSON: Quality Gate, Metrics, Issues per File, Duplications-Detail). Praktisch für lokales Lesen oder Diff.

Aktueller Zielzustand:

- Quality Gate: OK
- New Code Coverage: >= 80 %
- Issues/Bugs/Code Smells: 0 auf New Code

### Lokaler SonarLint (VS Code)

Erweiterung `sonarsource.sonarlint-vscode` ist installiert. Connected Mode wird automatisch aktiv durch:

- `.vscode/settings.json` -> `connectionId: 'rebula001-sonarcloud'` + `projectKey: 'rebula001_AbfindungsPilot'`
- User-Settings -> `sonarlint.connectedMode.connections.sonarcloud` mit `organizationKey: 'rebula001'`, `connectionId: 'rebula001-sonarcloud'`, `region: 'EU'`

Kontrolle: VS Code -> Output -> "SonarLint" Channel -> Log enthält `Bound to project 'rebula001_AbfindungsPilot'`.

## Git

| Datei                                | Zweck                                                                                                                    |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| [`/.gitignore`](../../../.gitignore) | Repo-Root, ignoriert generierte Artefakte (`dist/`, `coverage/`, `.scannerwork/`, `.sonarqube-report/`, `node_modules/`) |

`core.autocrlf=true` (Windows-Konvention). LF<->CRLF-Warnung beim ersten Commit ist normal; im Repo werden Dateien als LF gespeichert.

## Empfohlene Commit-Checkliste

```powershell
cd frontend
npm run build           # check:all + vue-tsc + vite build alles grün?
cd ..
git status              # nur erwartete Änderungen?
git diff --stat
git add .
git commit -m "..."
```

`npm run build` ruft intern `check:all` auf (lint + format + i18n) und schlägt fehl, sobald irgendetwas davon scheitert - ein einziger Befehl genügt also vor dem Commit.

Vor Release / großen Refactorings zusätzlich `npm run sonar:all` und Quality Gate prüfen.

## Empfohlene VS Code Erweiterungen

(Aus User-Memory; lokal installiert)

- `Vue.volar` - Vue 3 LSP
- `dbaeumer.vscode-eslint`
- `esbenp.prettier-vscode`
- `sonarsource.sonarlint-vscode`
- `bradlc.vscode-tailwindcss`
- `@primevue/mcp` über MCP (in `.vscode/mcp.json` konfiguriert) für Komponenten-Lookup
