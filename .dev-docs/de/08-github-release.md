# 08 - GitHub Release & Open-Source-Setup

> **In 30 Sekunden:** Das Repo ist als **PolyForm Noncommercial** Open Source vorbereitet - Quelle lesbar, Forks erlaubt, kommerzielle Nutzung verboten. Externe Pull Requests sind sowohl rechtlich (Lizenz) als auch organisatorisch (PR-Template + Branch Protection) geblockt. CI prüft jeden Push, anschließend deployt Pages automatisch. Dependabot öffnet wöchentlich Update-PRs.

## Dateiübersicht

| Datei | Zweck |
| --- | --- |
| [`/LICENSE`](../../../LICENSE) | PolyForm Noncommercial 1.0.0 (Volltext) + `Copyright (c) 2026 Ö_Ö` |
| [`/NOTICE.md`](../../../NOTICE.md) | DE+ZH Erlaubt/Verboten-Tabellen, Steuer-Disclaimer |
| [`/CONTRIBUTING.md`](../../../CONTRIBUTING.md) | DE+ZH "keine externen Beiträge" |
| [`/README.md`](../../../README.md) | bilingual (oben DE, unten ZH); enthält Lizenz/Disclaimer-Sektion |
| [`.github/REPOSITORY_SETUP.md`](../../../.github/REPOSITORY_SETUP.md) | Operator-Handbuch: Schritt-für-Schritt GitHub-UI-Aktionen + A-E Szenario-Handbücher |
| [`.github/pull_request_template.md`](../../../.github/pull_request_template.md) | Auto-Vorbefüllung für jede PR - DE/ZH-Warnung "keine externen PRs" |
| [`.github/dependabot.yml`](../../../.github/dependabot.yml) | Wöchentliche npm + monatliche actions Update-PRs |
| [`.github/workflows/ci.yml`](../../../.github/workflows/ci.yml) | Lint + type-check + build bei Push/PR |
| [`.github/workflows/deploy-pages.yml`](../../../.github/workflows/deploy-pages.yml) | GitHub Pages Deployment nach erfolgreichem CI-Run |
| [`/frontend/index.html`](../../../frontend/index.html) | SEO-Meta (OG, Twitter, JSON-LD WebApplication/FinanceApplication) |
| [`/frontend/public/robots.txt`](../../../frontend/public/robots.txt) | Allow-all + Sitemap-Platzhalter |
| [`.claude/tasks/2026-04-30-github-release-checklist.md`](../../../.claude/tasks/2026-04-30-github-release-checklist.md) | Pre-Push-Checkliste |

## Lizenzmodell: PolyForm Noncommercial 1.0.0

**Warum nicht MIT/Apache?** Dieses Projekt soll als _source-available_ verfügbar sein, aber **kommerzielle Nutzung ausschließen** (Tool nicht zur Steuerberatung weiterverkaufen, nicht in proprietäre SaaS einbauen, etc.).

**Warum nicht Creative Commons?** CC ist nicht für Software gedacht.

**Warum PolyForm NC?** Speziell für Software entworfen, juristisch sauber, von der OSI **nicht** als "Open Source" anerkannt - das ist **Absicht**, denn OSI verbietet Diskriminierung gegen kommerzielle Nutzung.

**Konsequenz:**

- GitHub erkennt PolyForm NC nicht automatisch via SPDX. Im "About"-Sidebar wird die Lizenz als "Other" angezeigt - siehe §A in `REPOSITORY_SETUP.md`
- `package.json` enthält `"license": "SEE LICENSE IN ../LICENSE"` (kein SPDX-Identifier).

## Externe Beiträge blockieren

Drei Verteidigungslinien (siehe §B in `REPOSITORY_SETUP.md`):

1. **Rechtlich:** PolyForm NC + `CONTRIBUTING.md` mit explizitem "keine externen PRs"-Statement.
2. **UX:** Auto-vorbefüllter PR-Body via `pull_request_template.md` - DE/ZH-Warnung als markdown blockquote (`>`), nicht als HTML-Kommentar.
3. **Technisch:** Branch Protection auf `main` (Force-Push verboten, Branch-Löschung verboten, PR + erfolgreicher CI-Run erforderlich).

### Warum blockquote statt HTML-Kommentar im PR-Template?

| Variante | Sichtbar im "New PR"-Dialog? | Übersteht Prettier? |
| --- | --- | --- |
| `<!-- versteckter Hinweis -->` | ❌ unsichtbar (zwecklos) | ❌ wird zu `# <!--` |
| `> ⚠ Warnung (markdown quote)` | ✅ groß und sichtbar | ✅ stabil |

Die markdown-Blockquote-Form ist die einzige, die GitHub und Prettier gleichzeitig korrekt rendern. Diese Datei _nicht_ in `.prettierignore` aufnehmen - Prettier muss sie aktiv halten.

## CI-Workflow ([`ci.yml`](../../../.github/workflows/ci.yml))

**Auslöser:** Push auf `main`, Pull Requests, manueller Dispatch.

```yaml
jobs:
  build:
    name: Lint, type-check, build   # exakt dieser Name muss in Branch Protection eingetragen werden
    runs-on: ubuntu-latest
    steps:
      - actions/checkout@v4
      - actions/setup-node@v4 (node-version: 22, cache: npm)
      - npm ci (im frontend/-Verzeichnis)
      - npm run build               # strikt -> ruft check:all + vue-tsc + vite build
      - actions/upload-artifact@v4 (dist, retention 7 Tage)
```

**Concurrency:** `cancel-in-progress: true` -> neuer Push macht laufenden Job veraltet.

**Wichtig:** Der **Job-Name** "Lint, type-check, build" ist gleichzeitig der **Required Status Check** in Branch Protection. Wenn der Name geändert wird, muss die Branch-Protection-Regel mit angepasst werden.

## Pages-Deployment ([`deploy-pages.yml`](../../../.github/workflows/deploy-pages.yml))

**Auslöser:** `workflow_run` nach erfolgreicher CI + manueller Dispatch.

```yaml
env:
  VITE_BASE_PATH: /abfindungspilot/    # anpassen, wenn Repo-Name abweicht

jobs:
  build:
    - npm ci + npm run build:fast      # CI hat bereits validiert, jetzt nur emittieren
    - Copy-Item dist/index.html dist/404.html    # SPA-Fallback (pwsh)
    - actions/upload-pages-artifact@v3
  deploy:
    needs: build
    environment: github-pages
    - actions/deploy-pages@v4
```

**Warum `build:fast` statt `build`?** Weil CI gerade alle Lint/Format/i18n/TS-Checks gemacht hat. Doppelt prüfen ist Verschwendung. Wenn ein Push **nur** den Pages-Workflow manuell triggert (z. B. nach Branch-Wechsel-Test), läuft `build:fast` - das ist akzeptabel, da der Deploy-Workflow nicht das primäre Quality-Gate ist.

**`VITE_BASE_PATH`** wird in [`vite.config.ts`](../../../frontend/vite.config.ts) so gelesen:

```ts
base: (globalThis as { process?: { env?: { VITE_BASE_PATH?: string } } }).process?.env.VITE_BASE_PATH ?? '/';
```

(Cast statt `@types/node`-Dependency - `process` existiert in Vite-Build-Zeit, aber TS soll für SFC-Code nicht über Node-Globals stolpern.)

## Dependabot ([`dependabot.yml`](../../../.github/dependabot.yml))

| Ecosystem | Pfad | Frequenz | PR-Limit | Gruppierung |
| --- | --- | --- | --- | --- |
| `npm` | `/frontend` | Wöchentlich (Mo) | 5 | minor + patch in einem PR; major einzeln |
| `github-actions` | `/` | Monatlich | 3 | (keine Gruppe) |

**Warum gruppieren?** Vermeidet 10 separate "Bump @types/foo from 1.2.3 to 1.2.4"-PRs pro Woche. Major-Versionen bleiben einzeln, weil sie potenziell breaking sind.

**Dependabot-PRs umgehen das PR-Template-Prüfsystem nicht** - sie kommen vom internen `dependabot[bot]`-Account, nicht von externen Forks. CI läuft, du mergst nach Erfolg.

## SEO + i18n-Erkennung

[`frontend/index.html`](../../../frontend/index.html) enthält:

- `<title>`, `<meta name="description">`, `<meta name="keywords">` (auf Deutsch - primäre Zielgruppe)
- Open Graph + Twitter Card (für Social-Media-Vorschauen)
- JSON-LD `WebApplication` + `FinanceApplication` (strukturierte Daten für Suchmaschinen)
- `<noscript>` mit DE-H1 (Crawler ohne JS sehen mindestens den Titel)
- License-Meta-Tags

**`<html lang="...">` Runtime-Sync:** [`src/App.vue`](../../../frontend/src/App.vue) hat:

```ts
watchEffect(() => {
  document.documentElement.lang = locale.value;
});
```

-> Klick auf ZH-Button setzt das HTML-Element auf `lang="zh"` (für Screenreader und Sprach-Detection).

[`frontend/public/robots.txt`](../../../frontend/public/robots.txt) erlaubt alle Crawler + reserviert eine Sitemap-Zeile (manuell bei Bedarf erstellen).

## Pre-Release-Checkliste

Siehe [`.claude/tasks/2026-04-30-github-release-checklist.md`](../../../.claude/tasks/2026-04-30-github-release-checklist.md) für die vollständige Liste vor dem ersten Push.

Kurzfassung:

```powershell
cd frontend
npm run build                    # alles grün?
$env:VITE_BASE_PATH = "/abfindungspilot/"
npm run build                    # Pages-Pfade korrekt?
$env:VITE_BASE_PATH = $null
cd ..
git status; git diff --stat      # nur erwartete Dateien?
```

## GitHub-UI-Aktionen

Konfiguration im Browser ist **nicht** im Repo - sie muss von Hand gemacht werden. Vollständige Anleitung mit Screenshots-Schritten:

-> [`.github/REPOSITORY_SETUP.md`](../../../.github/REPOSITORY_SETUP.md) (Sektionen 0-12 + Szenario-Handbücher A-E)

Wichtigste manuelle Schritte:

| # | Aktion | Wo |
| --- | --- | --- |
| 1 | Repo erstellen (public, leer) | github.com/new |
| 2 | Erstes Push | lokal: `git remote add ... && git push -u` |
| 3 | Branch Protection auf `main` | Settings -> Branches -> Add rule |
| 4 | Pages aktivieren (Source: GitHub Actions) | Settings -> Pages |
| 5 | Erstes manuelles Dispatch des Pages-Workflows | Actions -> "Deploy Pages" -> Run workflow |
| 6 | Custom Domain (optional) | Settings -> Pages -> Custom domain |

## Deploy-Verifikation

Nach dem ersten erfolgreichen Pages-Deploy:

1. Öffne `https://<user>.github.io/abfindungspilot/`.
2. Wechsle in den Diagramm-Tab -> DevTools Network sollte **separaten Chunk** laden (`ChartView-*.js` + `auto-*.js`) -> bestätigt Lazy-Loading-Optimierung aus [06](./06-tooling.md#2-chartview-lazy-laden)
3. Klick auf ZH-Button -> DevTools Elements: `<html lang="zh">`
4. Page Source ansehen -> `<script type="application/ld+json">` enthält FinanceApplication-JSON-LD
