# 08 - GitHub Release & Open-Source-Setup

> **In 30 Sekunden:** Das Repo ist als **PolyForm Noncommercial** Open Source vorbereitet - Quelle lesbar, Forks erlaubt, kommerzielle Nutzung verboten. Externe Pull Requests werden rechtlich (Lizenz), organisatorisch (PR-Template) und über Berechtigungen (keine Schreibrechte für Dritte) geblockt. CI prüft jeden Push / PR, anschließend deployt Pages automatisch. Dependabot öffnet wöchentlich Update-PRs.

## Dateiübersicht

| Datei                                                                                                                   | Zweck                                                                               |
| ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| [`/LICENSE`](../../../LICENSE)                                                                                          | PolyForm Noncommercial 1.0.0 (Volltext) + `Copyright (c) 2026 Ö_Ö`                  |
| [`/NOTICE.md`](../../../NOTICE.md)                                                                                      | DE+ZH Erlaubt/Verboten-Tabellen, Steuer-Disclaimer                                  |
| [`/CONTRIBUTING.md`](../../../CONTRIBUTING.md)                                                                          | DE+ZH "keine externen Beiträge"                                                     |
| [`/README.md`](../../../README.md)                                                                                      | bilingual (oben DE, unten ZH); enthält Lizenz/Disclaimer-Sektion                    |
| [`.github/REPOSITORY_SETUP.md`](../../../.github/REPOSITORY_SETUP.md)                                                   | Operator-Handbuch: Schritt-für-Schritt GitHub-UI-Aktionen + A-E Szenario-Handbücher |
| [`.github/pull_request_template.md`](../../../.github/pull_request_template.md)                                         | Auto-Vorbefüllung für jede PR - DE/ZH-Warnung "keine externen PRs"                  |
| [`.github/dependabot.yml`](../../../.github/dependabot.yml)                                                             | Wöchentliche npm + monatliche actions Update-PRs                                    |
| [`.github/workflows/ci.yml`](../../../.github/workflows/ci.yml)                                                         | Format + Lint + Tests + Type-Check + Build bei Push/PR                              |
| [`.github/workflows/deploy-pages.yml`](../../../.github/workflows/deploy-pages.yml)                                     | GitHub Pages Deployment nach erfolgreichem CI-Run                                   |
| [`/frontend/index.html`](../../../frontend/index.html)                                                                  | SEO-Meta (OG, Twitter, JSON-LD WebApplication/FinanceApplication)                   |
| [`/frontend/public/robots.txt`](../../../frontend/public/robots.txt)                                                    | Allow-all + Sitemap-Platzhalter                                                     |
| [`.claude/tasks/2026-04-30-github-release-checklist.md`](../../../.claude/tasks/2026-04-30-github-release-checklist.md) | Pre-Push-Checkliste                                                                 |

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
3. **Technisch:** Keine Schreibrechte für Dritte; `main`-Ruleset verbietet Force-Push und Branch-Löschung. Aktuell darf der Repo-Owner direkt nach `main` pushen, CI prüft danach automatisch.

### Warum blockquote statt HTML-Kommentar im PR-Template?

| Variante                       | Sichtbar im "New PR"-Dialog? | Übersteht Prettier? |
| ------------------------------ | ---------------------------- | ------------------- |
| `<!-- versteckter Hinweis -->` | ❌ unsichtbar (zwecklos)     | ❌ wird zu `# <!--` |
| `> ⚠ Warnung (markdown quote)` | ✅ groß und sichtbar         | ✅ stabil           |

Die markdown-Blockquote-Form ist die einzige, die GitHub und Prettier gleichzeitig korrekt rendern. Diese Datei _nicht_ in `.prettierignore` aufnehmen - Prettier muss sie aktiv halten.

## CI-Workflow ([`ci.yml`](../../../.github/workflows/ci.yml))

**Auslöser:** Push auf `main`, Pull Requests, manueller Dispatch.

```yaml
jobs:
  build:
    name: Lint, test, type-check, build
    runs-on: ubuntu-latest
    steps:
      - actions/checkout@v6
      - actions/setup-node@v6 (node-version: 24, cache: npm)
      - npm ci --ignore-scripts (im frontend/-Verzeichnis)
      - npm run format:check
      - npm run lint:check
      - npm run test:coverage
      - npm run build:fast          # vue-tsc + vite build
```

**Concurrency:** `cancel-in-progress: true` -> neuer Push macht laufenden Job veraltet.

**Aktuelle Strategie:** `main` erzwingt weder PRs noch required status checks; der Owner kann direkt pushen, CI läuft danach. Wenn später "PR + grüne CI vor Merge" gewünscht ist, `"Lint, test, type-check, build"` in Branch Protection / Ruleset als Required Status Check eintragen.

## Pages-Deployment ([`deploy-pages.yml`](../../../.github/workflows/deploy-pages.yml))

**Auslöser:** `workflow_run` nach erfolgreicher CI + manueller Dispatch.

```yaml
jobs:
  build:
    permissions:
      contents: read
    - npm ci --ignore-scripts + npm run build:fast
    - VITE_BASE_PATH: /${{ github.event.repository.name }}/
    - Copy-Item dist/index.html dist/404.html    # SPA-Fallback (pwsh)
    - actions/upload-pages-artifact@v3
  deploy:
    permissions:
      pages: write
      id-token: write
    needs: build
    environment: github-pages
    - actions/deploy-pages@v4
```

**Warum `build:fast` statt `build`?** Der Pages-Workflow erzeugt und veröffentlicht nur die statischen Artefakte; Qualitätsprüfungen gehören in den CI-Workflow. Wenn der Pages-Workflow manuell gestartet wird, ist `build:fast` weiterhin akzeptabel - der Deploy-Workflow ist nicht das primäre Quality-Gate.

**`VITE_BASE_PATH`** wird in [`vite.config.ts`](../../../frontend/vite.config.ts) so gelesen:

```ts
base: (globalThis as { process?: { env?: { VITE_BASE_PATH?: string } } })
  .process?.env.VITE_BASE_PATH ?? "/";
```

(Cast statt `@types/node`-Dependency - `process` existiert in Vite-Build-Zeit, aber TS soll für SFC-Code nicht über Node-Globals stolpern.)

## Dependabot ([`dependabot.yml`](../../../.github/dependabot.yml))

| Ecosystem        | Pfad        | Frequenz         | PR-Limit | Gruppierung                              |
| ---------------- | ----------- | ---------------- | -------- | ---------------------------------------- |
| `npm`            | `/frontend` | Wöchentlich (Mo) | 5        | minor + patch in einem PR; major einzeln |
| `github-actions` | `/`         | Monatlich        | 3        | (keine Gruppe)                           |

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
$env:VITE_BASE_PATH = "/AbfindungsPilot/"
npm run build                    # Pages-Pfade korrekt?
$env:VITE_BASE_PATH = $null
cd ..
git status; git diff --stat      # nur erwartete Dateien?
```

## GitHub-UI-Aktionen

Konfiguration im Browser ist **nicht** im Repo - sie muss von Hand gemacht werden. Vollständige Anleitung mit Screenshots-Schritten:

-> [`.github/REPOSITORY_SETUP.md`](../../../.github/REPOSITORY_SETUP.md) (Sektionen 0-12 + Szenario-Handbücher A-E)

Wichtigste manuelle Schritte:

| #   | Aktion                                          | Wo                                         |
| --- | ----------------------------------------------- | ------------------------------------------ |
| 1   | Repo erstellen (public, leer)                   | github.com/new                             |
| 2   | Erstes Push                                     | lokal: `git remote add ... && git push -u` |
| 3   | `main`-Ruleset: Löschung und Force-Push sperren | Settings -> Rules -> Rulesets              |
| 4   | Pages aktivieren (Source: GitHub Actions)       | Settings -> Pages                          |
| 5   | Erstes manuelles Dispatch des Pages-Workflows   | Actions -> "Deploy Pages" -> Run workflow  |
| 6   | Custom Domain (optional)                        | Settings -> Pages -> Custom domain         |

## Deploy-Verifikation

Nach dem ersten erfolgreichen Pages-Deploy:

1. Öffne `https://<user>.github.io/AbfindungsPilot/`.
2. Wechsle in den Diagramm-Tab -> DevTools Network sollte **separaten Chunk** laden (`ChartView-*.js` + `auto-*.js`) -> bestätigt Lazy-Loading-Optimierung aus [06](./06-tooling.md#2-chartview-lazy-laden)
3. Klick auf ZH-Button -> DevTools Elements: `<html lang="zh">`
4. Page Source ansehen -> `<script type="application/ld+json">` enthält FinanceApplication-JSON-LD
