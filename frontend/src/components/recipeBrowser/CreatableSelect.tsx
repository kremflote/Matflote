import { useEffect, useRef, useState } from "react";
import ConfirmationDialog from "../ConfirmationDialog";
import { useLanguage } from "../../contexts";
import type { SiteTheme } from "../../styles/appStyles";
import { recipeBrowserStyles } from "./recipeBrowserStyles";

export type CreatableOption = {
  id: number;
  name: string;
};

type CreatableSelectProps = {
  label: string;
  value: number | null;
  options: CreatableOption[];
  theme: SiteTheme;
  fieldClassName?: string;
  labelClassName?: string;
  required?: boolean;
  placeholder?: string;
  createLabel?: string;
  onChange: (value: number | null) => void;
  onCreate: (name: string) => Promise<CreatableOption>;
  onCreatedOptionSelected?: (option: CreatableOption) => void;
  onDeleteOption?: (option: CreatableOption) => Promise<void>;
};

const createNewValue = "__create_new__";

function CreatableSelect({
  label,
  value,
  options,
  theme,
  fieldClassName,
  labelClassName,
  required = false,
  placeholder = "Select option",
  createLabel = "Create New",
  onChange,
  onCreate,
  onCreatedOptionSelected,
  onDeleteOption,
}: CreatableSelectProps) {
  const { t } = useLanguage();
  const selectRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingOptionId, setDeletingOptionId] = useState<number | null>(null);
  const [optionPendingDelete, setOptionPendingDelete] = useState<CreatableOption | null>(null);
  const selectedOption = options.find((option) => option.id === value) ?? null;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleOutsidePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      if (selectRef.current?.contains(target)) {
        return;
      }

      setIsOpen(false);
    };

    document.addEventListener("pointerdown", handleOutsidePointerDown);

    return () => document.removeEventListener("pointerdown", handleOutsidePointerDown);
  }, [isOpen]);

  const saveNewOption = async () => {
    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      setError(t.common.nameRequired);
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const created = await onCreate(trimmedName);
      if (onCreatedOptionSelected === undefined) {
        onChange(created.id);
      } else {
        onCreatedOptionSelected(created);
      }
      setName("");
      setIsCreating(false);
      setIsOpen(false);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : t.common.couldNotCreateOption);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteOption = async (option: CreatableOption) => {
    if (onDeleteOption === undefined) {
      return;
    }

    setDeletingOptionId(option.id);
    setError(null);

    try {
      await onDeleteOption(option);
      if (value === option.id) {
        onChange(null);
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : t.common.couldNotDeleteOption);
    } finally {
      setDeletingOptionId(null);
      setOptionPendingDelete(null);
    }
  };

  const labelContent = (
    <span className={labelClassName ?? recipeBrowserStyles.label(theme)}>
      {label}
      {required && <span className={recipeBrowserStyles.requiredMark(theme)}> *</span>}
    </span>
  );

  if (onDeleteOption !== undefined) {
    return (
      <div className={fieldClassName ?? recipeBrowserStyles.field} ref={selectRef}>
        {labelContent}
        <div className={recipeBrowserStyles.customSelectWrap}>
          <button
            aria-expanded={isOpen}
            className={recipeBrowserStyles.customSelectButton(theme)}
            type="button"
            onClick={() => setIsOpen((currentValue) => !currentValue)}
          >
            <span>{selectedOption?.name ?? placeholder}</span>
            <span aria-hidden="true">v</span>
          </button>

          {isOpen && (
            <div className={recipeBrowserStyles.customSelectMenu(theme)}>
              <button
                className={recipeBrowserStyles.customSelectOption(theme, value === null)}
                type="button"
                onClick={() => {
                  onChange(null);
                  setIsOpen(false);
                }}
              >
                <span>{placeholder}</span>
              </button>
              {options.map((option) => (
                <button
                  className={recipeBrowserStyles.customSelectOption(theme, value === option.id)}
                  key={option.id}
                  type="button"
                  onClick={() => {
                    onChange(option.id);
                    setIsOpen(false);
                  }}
                >
                  <span className={recipeBrowserStyles.customSelectOptionLabel}>{option.name}</span>
                  <span
                    aria-label={`Delete ${option.name}`}
                    className={recipeBrowserStyles.customSelectDeleteButton(theme)}
                    role="button"
                    tabIndex={0}
                    onClick={(event) => {
                      event.stopPropagation();
                      setOptionPendingDelete(option);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        event.stopPropagation();
                        setOptionPendingDelete(option);
                      }
                    }}
                  >
                    {deletingOptionId === option.id ? "..." : "x"}
                  </span>
                </button>
              ))}
              <button
                className={recipeBrowserStyles.customSelectOption(theme, false)}
                type="button"
                onClick={() => {
                  setIsCreating(true);
                  setIsOpen(false);
                }}
              >
                <span>{createLabel}</span>
              </button>
            </div>
          )}
        </div>

        {isCreating && (
          <CreateOptionPanel
            error={error}
            isSaving={isSaving}
            label={label}
            name={name}
            theme={theme}
            setName={setName}
            cancelLabel={t.common.cancel}
            createLabel={t.cookbook.create}
            savingLabel={t.common.saving}
            onCancel={() => {
              setIsCreating(false);
              setError(null);
              setName("");
            }}
            onSave={saveNewOption}
          />
        )}
        {optionPendingDelete !== null && (
          <ConfirmationDialog
            body={t.common.deleteNamed(optionPendingDelete.name)}
            confirmLabel={t.common.remove}
            isBusy={deletingOptionId === optionPendingDelete.id}
            theme={theme}
            title={t.common.removeNamed(optionPendingDelete.name)}
            onCancel={() => setOptionPendingDelete(null)}
            onConfirm={() => void deleteOption(optionPendingDelete)}
          />
        )}
      </div>
    );
  }

  return (
    <label className={fieldClassName ?? recipeBrowserStyles.field}>
      {labelContent}
      <select
        className={recipeBrowserStyles.textField(theme)}
        required={required}
        value={value ?? ""}
        onChange={(event) => {
          if (event.target.value === createNewValue) {
            setIsCreating(true);
            return;
          }

          onChange(event.target.value ? Number(event.target.value) : null);
        }}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
        <option value={createNewValue}>{createLabel}</option>
      </select>

      {isCreating && (
        <CreateOptionPanel
          error={error}
          isSaving={isSaving}
          label={label}
          name={name}
          theme={theme}
          setName={setName}
          cancelLabel={t.common.cancel}
          createLabel={t.cookbook.create}
          savingLabel={t.common.saving}
          onCancel={() => {
            setIsCreating(false);
            setError(null);
            setName("");
          }}
          onSave={saveNewOption}
        />
      )}
    </label>
  );
}

type CreateOptionPanelProps = {
  error: string | null;
  isSaving: boolean;
  label: string;
  name: string;
  cancelLabel: string;
  createLabel: string;
  savingLabel: string;
  theme: SiteTheme;
  setName: (name: string) => void;
  onCancel: () => void;
  onSave: () => void;
};

function CreateOptionPanel({
  error,
  isSaving,
  label,
  name,
  cancelLabel,
  createLabel,
  savingLabel,
  theme,
  setName,
  onCancel,
  onSave,
}: CreateOptionPanelProps) {
  return (
    <div className={recipeBrowserStyles.createOptionPanel(theme)}>
      {error !== null && <p className={recipeBrowserStyles.statusError(theme)}>{error}</p>}
      <input
        className={recipeBrowserStyles.textField(theme)}
        maxLength={120}
        placeholder={label}
        type="text"
        value={name}
        onChange={(event) => setName(event.target.value)}
      />
      <div className={recipeBrowserStyles.createOptionActions}>
        <button
          className={recipeBrowserStyles.secondaryButton(theme)}
          disabled={isSaving}
          type="button"
          onClick={onCancel}
        >
          {cancelLabel}
        </button>
        <button
          className={recipeBrowserStyles.primaryButton(theme)}
          disabled={isSaving}
          type="button"
          onClick={onSave}
        >
          {isSaving ? savingLabel : createLabel}
        </button>
      </div>
    </div>
  );
}

export default CreatableSelect;
