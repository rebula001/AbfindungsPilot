export type Scenario = 'liegen' | 'neue';
export type Cell = 'user' | 'spouse';
export type NoteVariant = 'info' | 'success' | 'warning';

export interface ScenarioValues {
  user: number;
  spouse: number;
}

export interface PopoverDetail {
  computation: string;
}

export interface StepPopover {
  formula: string;
  details: Record<Scenario, Record<Cell, PopoverDetail>>;
}

export interface ResultNote {
  text: string;
  variant: NoteVariant;
}

export interface CellMeta {
  suffix?: string;
  sub?: string;
}

export interface DisplayStep {
  label: string;
  titleKey: string;
  legalBasisKey: string;
  liegen: ScenarioValues;
  neue: ScenarioValues;
  isDeduction: boolean;
  highlight?: boolean;
  popover?: StepPopover;
  notes?: Record<Scenario, Record<Cell, ResultNote | undefined>>;
  cellMeta?: Record<Scenario, Record<Cell, CellMeta | undefined>>;
}

export interface StepGroup {
  titleKey: string;
  legalBasisKey: string;
  income?: DisplayStep[];
  deductions: DisplayStep[];
  alternatives?: DisplayStep[];
  result: DisplayStep;
}
