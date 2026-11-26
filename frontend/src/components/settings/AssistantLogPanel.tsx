import { useCallback, useEffect, useState } from "react";
import { useLanguage } from "../../contexts";
import type { IAssistantWriteLogEntry } from "../../interfaces/IAssistant";
import { assistantService } from "../../services";
import { settingsStyles } from "../../styles/appStyles";
import ConfirmationDialog from "../ConfirmationDialog";
import { describeLogCounts, describeLogTitle, formatLogTime } from "./assistantLogFormat";

/** The latest writes through the assistant API, with Undo for the newest meal plan change. */
export default function AssistantLogPanel() {
  const { locale, t } = useLanguage();
  const text = t.assistantLog;
  const [entries, setEntries] = useState<IAssistantWriteLogEntry[] | null>(null);
  const [pendingUndo, setPendingUndo] = useState<IAssistantWriteLogEntry | null>(null);
  const [conflict, setConflict] = useState(false);
  const [isUndoing, setIsUndoing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setEntries(await assistantService.getLog(10));
    } catch (_error) {
      setError(text.couldNotLoad);
    }
  }, [text.couldNotLoad]);

  useEffect(() => {
    let ignore = false;
    assistantService.getLog(10).then(
      (nextEntries) => {
        if (!ignore) {
          setEntries(nextEntries);
        }
      },
      () => {
        if (!ignore) {
          setError(text.couldNotLoad);
        }
      },
    );

    return () => {
      ignore = true;
    };
  }, [text.couldNotLoad]);

  const undo = async (force: boolean) => {
    setIsUndoing(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await assistantService.undoMealPlan(force);
      if (result.applied) {
        setPendingUndo(null);
        setConflict(false);
        setSuccess(text.undoFinished(result.slots.length));
        await load();
      } else {
        setConflict(true);
      }
    } catch (_error) {
      setPendingUndo(null);
      setError(text.couldNotUndo);
    } finally {
      setIsUndoing(false);
    }
  };

  return (
    <div className={settingsStyles.panel}>
      <div className={settingsStyles.statusRow}>
        <div>
          <h2 className={settingsStyles.panelTitle}>{text.title}</h2>
          <p className={settingsStyles.panelBody}>{text.body}</p>
        </div>
        <button className={settingsStyles.secondaryButton} disabled={isUndoing} type="button" onClick={() => void load()}>
          {text.refresh}
        </button>
      </div>

      {entries !== null && entries.length === 0 && <p className={settingsStyles.helpText}>{text.empty}</p>}
      {entries !== null && entries.length > 0 && (
        <ul className="grid gap-2" aria-label={text.title}>
          {entries.map((entry) => {
            const counts = describeLogCounts(entry, t);
            return (
              <li className="flex flex-wrap items-center justify-between gap-3 border-b pb-3 last:border-b-0 last:pb-0" key={entry.id}>
                <div className="grid min-w-0 gap-1">
                  <span className={settingsStyles.label}>{describeLogTitle(entry, t, locale)}</span>
                  <span className={settingsStyles.helpText} title={entry.summary}>
                    {formatLogTime(entry.at, locale)}
                    {counts.length > 0 && ` · ${counts}`}
                    {entry.undoneAt !== undefined && ` · ${text.undoneAt(formatLogTime(entry.undoneAt, locale))}`}
                  </span>
                </div>
                {entry.isNextUndo && (
                  <button
                    className={settingsStyles.secondaryButton}
                    disabled={isUndoing}
                    type="button"
                    onClick={() => {
                      setConflict(false);
                      setPendingUndo(entry);
                    }}
                  >
                    {text.undo}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {(error !== null || success !== null) && (
        <p className={settingsStyles.statusText(error !== null ? "error" : "success")}>{error ?? success}</p>
      )}

      {pendingUndo !== null && (
        <ConfirmationDialog
          body={conflict ? text.conflict : text.undoBody(`${describeLogTitle(pendingUndo, t, locale)}: ${describeLogCounts(pendingUndo, t)}.`)}
          confirmLabel={isUndoing ? text.undoing : conflict ? text.undoAnyway : text.undo}
          isBusy={isUndoing}
          title={text.undoTitle}
          tone={conflict ? "danger" : "default"}
          onCancel={() => {
            setPendingUndo(null);
            setConflict(false);
          }}
          onConfirm={() => void undo(conflict)}
        />
      )}
    </div>
  );
}
