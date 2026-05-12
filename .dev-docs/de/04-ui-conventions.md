# 04 - UI-Konventionen

> **In 30 Sekunden:** PrimeVue + Default-Styles, Tailwind nur für Layout, Forms zwingend `@primevue/forms`, alle Identifier englisch (außer Steuerterminologie), keine deutschen Strings im Template.

## PrimeVue zuerst - Default-Styles akzeptieren

| Regel | Erlaubt | Verboten |
| --- | --- | --- |
| Komponentenwahl | PrimeVue 4 (Aura, violet) | Eigene Re-Implementierungen, andere UI-Bibliotheken |
| Größe | `size="small"` (default für Buttons, Inputs, DataTables) | Andere Größen ohne Grund |
| Visuelle Overrides | nur wenn unvermeidlich, dann Rückfrage beim User | `*pt{...}` mit Farben, `bg-…`, `py-2!` etc. |
| Tailwind-Klassen | Layout: `flex`, `grid`, `gap-*`, `p-*`, `m-*`, `w-*`, `h-*`, `items-*`, `justify-*` | Visuelle Klassen wie `bg-blue-500`, `text-3xl`, `rounded-xl` |
| Icons | PrimeIcons (`pi pi-*`) | Andere Icon-Sets |
| Tooltip | `v-tooltip` Direktive (in `main.ts` als `tooltip` registriert) | Eigene Tooltip-Komponenten |

**Begründung:** Aura-Theme ist intern konsistent (Spacing, Farbsystem, Fokus-Ringe). Selbstüberschreibungen bringen die Konsistenz schnell durcheinander. Wenn etwas nicht passt -> erst hinterfragen, ob die Designvorgabe richtig ist, dann ggf. Aura-Token anpassen, **nicht** punktuell überschreiben.

### Akzeptierte Override-Stelle: Accordion

Eine bewusste Ausnahme für InputView/CalculationView Konsistenz (siehe `.claude/tasks/development-standards.md` § 1.8):

```html
<AccordionPanel class="border border-surface-200 dark:border-surface-700 rounded-md overflow-hidden mb-2">
  <AccordionHeader class="bg-surface-50! dark:bg-surface-900! py-2.5!">
    <span class="font-semibold">{{ t('...') }}</span>
  </AccordionHeader>
</AccordionPanel>
```

## Forms

Nur `@primevue/forms` mit zod / yup / valibot Resolver. Keine handgeschriebenen `ref()` + `onSubmit`-Pattern.

```vue
<script setup lang="ts">
import { Form, FormField } from '@primevue/forms';
import { zodResolver } from '@primevue/forms/resolvers/zod';
import { z } from 'zod';

const schema = z.object({ email: z.string().email(t('form.errors.invalidEmail')) });
const resolver = zodResolver(schema);
function onFormSubmit(e) {
  if (e.valid) commit(e.values);
}
</script>
<template>
  <Form v-slot="$form" :resolver="resolver" @submit="onFormSubmit">
    <FormField v-slot="$field" name="email" initial-value="">
      <InputText v-model="$field.value" size="small" />
      <Message v-if="$field.invalid" severity="error" size="small" variant="simple">
        {{ $field.error?.message }}
      </Message>
    </FormField>
  </Form>
</template>
```

## Naming - alle Identifier englisch

**Erlaubt deutsch (Steuerterminologie):**

`zvE`, `KFB`, `BBG`, `KV`/`PV`/`RV`/`ALV`, `Soli`, `Tarif`, `Grundtarif`, `Splittingtarif`, `Fünftelregelung`, `Progressionsvorbehalt`, `Veranlagungsart`, alle `*_2026` Konstanten, `§ XX EStG/SolzG/SGB ...` Verweise, deutsche Kommentare im Quellcode.

**Sonst englisch:**

| Schicht | Beispiele |
| --- | --- |
| Types | `PersonProfile`, `PersonIncomeData`, `IncomeBreakdown`, `SvBreakdown`, `PersonYearResult`, `PersonTaxResult`, `JointTaxResult`, `YearComputation` |
| Veranlagungsart-Werte | `separate` \|\| `joint` (NICHT `einzeln` \|\| `zusammen`) |
| Engine-Funktionen | `estWithProgressionsvorbehalt`, `tarifEStWithFuenftelAndProgrV`, `calcPensionExpenseDeduction` |
| ComputeYearInput-Felder | `profileUser`, `profileSpouse`, `incomeUser`, `incomeSpouse`, `scenarioStayUnemployed`, `scenarioNewJob` |
| YearComputation-Felder | `stayUnemployed`, `newJob` (NICHT `liegen` \|\| `neueArbeit`) |
| Views | `InputView.vue`, `CalculationView.vue`, `ChartView.vue` (NICHT `EingabeView`) |
| i18n-Keys | `workspace.sections.basic`, `calculation.veranlagungsart.separate` |

## Hardcoded-Strings - rote Linie

In jeder `.vue` und `.ts` UI-Datei gilt:

| Stelle | ❌ Verboten | ✅ Pflicht |
| --- | --- | --- |
| Sichtbarer Template-Text | `<span>Daten speichern</span>` | `<span>{{ t('form.commit') }}</span>` |
| Property mit Text | `label="Speichern"`, `placeholder="z. B. 50000"`, `header="Stammdaten"` | `:label="t('...')"`, `:placeholder="t('...')"`, `:header="t('...')"` |
| Toast / Message | `summary: "Fehler"` | `summary: t('toast.errorTitle')` |
| Suffix / Prefix | `suffix="Monate"` | `:suffix="' ' + t('units.months')"` |
| Mehrzeilige Listen / Formeln | inline | `tList()` + `tm()` Array (siehe `CalculationView.vue`) |

**Erlaubt als Literal:**

- Bundesland-Codes (`'BY'`, `'BW'`, `'SN'` …) und Steuerklassen-Ziffern (`'I'`-`'VI'`)
- Gesetzes-IDs (`'§ 32a EStG'`, `'§ 158 SGB III'`)
- Konstantennamen aus dem Domain-Layer (sind keine UI-Texte)

Validierung: `npm run i18n:check` (siehe [05](./05-i18n.md)) findet die meisten Verstöße automatisch.

## Komponenten-Struktur

```vue
<script setup lang="ts">
// 1. Imports (Vue, PrimeVue, eigene Composables, Types)
// 2. Props/Emits (mit defineProps/defineEmits + TS Generics)
// 3. State (ref/computed)
// 4. Composables (useI18n, useUserInput, ...)
// 5. Methoden
// 6. Watch / lifecycle
</script>

<template>
  <!-- Template; alle sichtbaren Strings via t() -->
</template>

<style scoped>
/* möglichst leer; CSS gehört ins Theme */
</style>
```

## Composable-Struktur

```ts
// composables/useXxx.ts
export function useXxx() {
  // 1. abhängige composables einbinden (z. B. useUserInput)
  // 2. lokaler ref()/computed()/watch() State
  // 3. Hilfsfunktionen
  // 4. Rückgabe-Objekt am Ende, EXPORT NUR DAS NÖTIGE
  return { stateA, stateB, action1 };
}
```

Composables dürfen **kein** Domain-Layer reimplementieren - sie reichen Calls an `engine.ts` durch und packen Vue-Reaktivität herum.
