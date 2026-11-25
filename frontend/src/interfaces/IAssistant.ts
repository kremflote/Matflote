export interface IAssistantWriteLogEntry {
  id: number;
  /** ISO timestamp (UTC). */
  at: string;
  endpoint: string;
  summary: string;
  counts: Record<string, number>;
  canUndo: boolean;
  /** The write an undo would undo now. */
  isNextUndo: boolean;
  undoneAt?: string;
  /** For meal plan changes: the first and last date changed (yyyy-mm-dd). */
  from?: string;
  to?: string;
}

export interface IAssistantUndoSlot {
  date: string;
  slot: string;
  status: string;
  items: string[];
  warnings: string[];
}

export interface IAssistantUndoResult {
  dryRun: boolean;
  applied: boolean;
  undoneWriteId: number | null;
  undoneWriteSummary: string | null;
  errors: string[];
  slots: IAssistantUndoSlot[];
}
