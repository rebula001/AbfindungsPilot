# Abfindungspilot - Entwicklungsdokumentation (DE)

> **Zielgruppe:** dein zukünftiges Ich (in 6 Monaten). Voraussetzungen: Vue 3 / TypeScript-Grundlagen, deutsches Steuerrecht-Vokabular.

## Lesereihenfolge

1. [01 - Überblick](./01-overview.md) - was die App tut, für wen, in welchen Szenarien
2. [02 - Architektur](./02-architecture.md) - Schichten, Datenfluss, Verzeichnisstruktur
3. [03 - Berechnungs-Engine](./03-calculation-engine.md) - Steuerformeln, §-Verweise, Algorithmen
4. [04 - UI-Konventionen](./04-ui-conventions.md) - PrimeVue, Forms, Naming
5. [05 - i18n](./05-i18n.md) - DE/ZH-Mechanik, Übersetzungsregeln
6. [06 - Tooling](./06-tooling.md) - Lint, Sonar, Build, Commit-Checkliste
7. [07 - Workflow](./07-development-workflow.md) - Schritt-für-Schritt: neue UI-Felder, Steuersätze ändern
8. [08 - GitHub Release & Open-Source-Setup](./08-github-release.md) - Lizenz, CI/CD, Pages, Dependabot, PR-Template
9. [09 - Abschlussaudit Berechnungslogik](./09-calculation-audit.md) - geprüfte Annahmen, Korrekturen, verbleibende Grenzen
10. [10 - Jahresparameter aktualisieren](./10-tax-parameter-upgrade.md) - JSON-Updateprozess fuer Steuer-/Sozialparameter

## Schnellreferenz

| Befehl                                | Wirkung                                  |
| ------------------------------------- | ---------------------------------------- |
| `npm run dev`                         | Vite dev-server                          |
| `npm run build`                       | strict: check:all + vue-tsc + vite build |
| `npm run build:fast`                  | Schnell: nur vue-tsc + vite build        |
| `npm run preview`                     | Lokaler Server für `dist/`               |
| `npm run check:all`                   | lint + format + i18n (kein Build)        |
| `npm run lint:check` / `lint:fix`     | ESLint                                   |
| `npm run format:check` / `format:fix` | Prettier                                 |
| `npm run test`                        | Vitest Unit-Tests                        |
| `npm run test:coverage`               | Vitest Coverage, erzeugt SonarCloud lcov |
| `npm run i18n:check`                  | DE/ZH Key-Diff (blockiert lokalen Build) |
| `npm run sonar:all`                   | SonarCloud Scan + Report-Fetch           |

## Verwandte Verzeichnisse

- [`.claude/decisions/`](../../../.claude/decisions/) - Architecture Decision Records (warum etwas so ist)
- [`.claude/tasks/`](../../../.claude/tasks/) - Historie der Refactorings & Features
- [`.claude/tasks/development-standards.md`](../../../.claude/tasks/development-standards.md) - formale Standards
