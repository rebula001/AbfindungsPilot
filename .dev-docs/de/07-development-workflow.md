# 07 - Workflow

> **In 30 Sekunden:** Drei häufige Aufgaben - neues UI-Feld, Steuerkonstante anpassen, neue Komponente - jeweils als Schritt-für-Schritt-Liste. Jede Aufgabe endet mit demselben Quality-Gate (lint + i18n + build).

## Aufgabe A: Neues Eingabefeld in der UI hinzufügen

Beispiel: ein neues Feld „Kapitalerträge pro Jahr“ einbauen, das in `totalIncome` einfließen soll.

### Schritt 1: Type erweitern (Domain)

[`calculation/types.ts`](../../../frontend/src/calculation/types.ts):

```ts
export interface PersonIncomeData {
  // ... bestehende Felder
  /** Kapitalerträge pro Jahr (vereinfacht netto, kein Saldo mit Sparerpauschbetrag) */
  capitalIncome?: number;
}
```

### Schritt 2: Engine konsumiert das neue Feld

[`calculation/engine.ts`](../../../frontend/src/calculation/engine.ts) -> `computePersonYear()`:

```ts
const capitalIncome = einkommen.capitalIncome ?? 0;
const totalIncome = employmentIncome + rentalIncomeNet + otherIncome + capitalIncome;
```

Falls die Änderung nicht-trivial ist (z. B. neue § oder eigene Tariflogik): **vorher** `.claude/decisions/YYYY-MM-DD-...md` ADR schreiben, weil die Engine eine Audit-History hat.

### Schritt 3: UserInputSnapshot erweitern

[`composables/useUserInput.ts`](../../../frontend/src/composables/useUserInput.ts):

```ts
export interface UserInputSnapshot {
  // ...
  capitalIncomeYearly: number;
}
```

### Schritt 4: Adapter

[`calculation/inputAdapter.ts`](../../../frontend/src/calculation/inputAdapter.ts) -> `inputToIncomeUser()`:

```ts
return {
  // ...
  capitalIncome: s.capitalIncomeYearly * userIncomeShare
};
```

Auch in `inputToIncomeSpouse()` analog (Single-Modus -> 0, Familie -> Restanteil).

### Schritt 5: InputView (UI + Form)

[`views/InputView.vue`](../../../frontend/src/views/InputView.vue):

```vue
<FormField v-slot="$field" name="capitalIncomeYearly" :initial-value="0">
  <InputNumber v-model="$field.value" :suffix="' ' + t('units.eurPerYear')" :min="0" size="small" />
  <Message v-if="$field.invalid" severity="error" size="small" variant="simple">
    {{ $field.error?.message }}
  </Message>
</FormField>
```

Validation im zod-Schema ergänzen: `capitalIncomeYearly: z.number().min(0)`.

### Schritt 6: i18n in BEIDEN Locales

[`i18n/de.ts`](../../../frontend/src/i18n/de.ts) + [`i18n/zh.ts`](../../../frontend/src/i18n/zh.ts):

```ts
form: {
  // ...
  capitalIncomeYearly: 'Kapitalerträge pro Jahr', // de.ts
  capitalIncomeYearly: '资本利得 / 年',              // zh.ts
}
```

### Schritt 7: Quality Gate

```powershell
cd frontend
npm run i18n:check   # 0 Missing, 0 Diff
npm run lint:check   # grün
npm run build        # vue-tsc grün -> bestätigt strukturelle Konsistenz
```

### Schritt 8: `.claude/` aktualisieren (falls nicht-trivial)

- Neue Engine-Felder / Vereinfachungen -> `.claude/decisions/YYYY-MM-DD-...md` ADR
- Neue Task -> `.claude/tasks/YYYY-MM-DD-task-X-...md` + Eintrag in `.claude/tasks/README.md`
- Engine-Vereinfachungen -> diese Doku ([03](./03-calculation-engine.md)) erweitern

## Aufgabe B: Steuerkonstanten ändern (z. B. Inflationsausgleich 2027)

### Schritt 1: ADR vorab

`.claude/decisions/YYYY-MM-DD-tarif-2027.md` schreiben:

- Quelle (Bundesgesetzblatt, BMF-Schreiben, …)
- Wirksamkeit (Veranlagungszeitraum)
- Welche Konstanten betroffen sind

### Schritt 2: Konstanten in `constants.ts`

Bevorzugt: **neue Konstanten mit Suffix `_2027`** anlegen, alte `_2026` behalten. Die Engine bekommt eine Versions-Auswahl (oder das `year`-Feld in `ComputeYearInput` triggert die Auswahl). So bleiben historische Berechnungen stabil.

```ts
// constants.ts
export const GRUNDFREIBETRAG_2026 = 12_348;
export const GRUNDFREIBETRAG_2027 = 12_852; // Beispiel

export function grundfreibetrag(year: number): number {
  return year >= 2027 ? GRUNDFREIBETRAG_2027 : GRUNDFREIBETRAG_2026;
}
```

### Schritt 3: Engine

In `engine.ts` die direkten Konstanten-Imports durch Aufrufe von `grundfreibetrag(year)` etc. ersetzen.

### Schritt 4: Tests (sobald Vitest eingerichtet)

Golden Snapshot Tests für 2026 dürfen sich **nicht** ändern. 2027er Tests neu hinzufügen.

### Schritt 5: Quality Gate (siehe Aufgabe A Schritt 7)

## Aufgabe C: Neue Vue-Komponente erstellen

### Checkliste

- [ ] Datei in `components/` (wiederverwendbar) oder direkt in `views/` (top-level)
- [ ] Mit `<script setup lang="ts">` (Composition API)
- [ ] Props mit `defineProps<...>()` + TS-Interface
- [ ] Emits mit `defineEmits<...>()`
- [ ] PrimeVue-Komponenten mit `size="small"`, keine eigenen Visuals
- [ ] Tailwind nur für Layout (`flex`, `grid`, `gap-*`, `p-*`)
- [ ] Alle sichtbaren Strings via `t('...')`
- [ ] `<style scoped>` möglichst leer
- [ ] Bei Forms: `@primevue/forms` mit zod resolver
- [ ] Bei Tooltip: `v-tooltip` Direktive
- [ ] Wenn Komponente Daten zeigt: Empty-State berücksichtigen (siehe `EmptyStateOverlay.vue` als Vorbild)

## Aufgabe D: Kleinen Bugfix / Textänderung

| Aufwand | Doku-Pflicht |
| --- | --- |
| `< 10 Zeilen, nur Text` | keine |
| neuer i18n-Key | beide Locales + `i18n:check` |
| Engine-Logik geändert | ADR + Tests + Doku-Update |
| Build-Konfig geändert | `.claude/tasks/` Eintrag |
| Neue Dependency | `.claude/tasks/` Eintrag, ggf. ADR |

## Was NICHT gemacht wird

- **Keine spekulativen Refactorings** ohne konkreten Anlass.
- **Keine eigenen Helper für Einmal-Operationen** - inline lassen.
- **Keine TypeScript-Typen / Docstrings zu unverändertem Code** hinzufügen.
- **Keine Default-Values** in Engine-Funktionen, die „nie passieren können“. Validation am Systemrand (Adapter, Forms) ist genug.
- **Keine `console.log`** in committetem Code.

## Wenn etwas nicht funktioniert

1. `npm run build` Output lesen - `vue-tsc` Fehlermeldungen sind oft präzise (Datei + Zeile).
2. Bei i18n-Fehler: `npm run i18n:check` direkt aufrufen und die Diff-Liste ansehen.
3. SonarLint-Squiggle in VS Code: rechte Maustaste -> "SonarLint: Show Issue Details" für Erklärung + Fix-Vorschlag.
4. Engine-Verhalten unklar: in `engine.ts` ist jede Schrittfolge kommentiert; bei Zweifel gegen [03](./03-calculation-engine.md) abgleichen.
