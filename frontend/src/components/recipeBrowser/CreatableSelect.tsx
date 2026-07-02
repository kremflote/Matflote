import { useEffect, useRef, useState } from "react";
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
  required?: boolean;
  placeholder?: string;
  createLabel?: string;
  onChange: (value: number | null) => void;
  onCreate: (name: string) => Promise<CreatableOption>;
  onDeleteOption?: (option: CreatableOption) => Promise<void>;
};

const createNewValue = "__create_new__";

function CreatableSelect({
  label,
  value,
  options,
  theme,
  required = false,
  placeholder = "Select option",
  createLabel = "Create New",
  onChange,
  onCreate,
  onDeleteOption,
}: CreatableSelectProps) {
  const selectRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingOptionId, setDeletingOptionId] = useState<number | null>(null);
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
      setError("Name is required.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const created = await onCreate(trimmedName);
      onChange(created.id);
      setName("");
      setIsCreating(false);
      setIsOpen(false);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not create option.");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteOption = async (option: CreatableOption) => {
    if (onDeleteOption === undefined) {
      return;
    }

    const confirmed = window.confirm(`Remove ${option.name}? This will delete the brand.`);
    if (!confirmed) {
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
      setError(caughtError instanceof Error ? caughtError.message : "Could not delete option.");
    } finally {
      setDeletingOptionId(null);
    }
  };

  const labelContent = (
    <span className={recipeBrowserStyles.label(theme)}>
      {label}
      {required && <span className={recipeBrowserStyles.requiredMark(theme)}> *</span>}
    </span>
  );

  if (onDeleteOption !== undefined) {
    return (
      <div className={recipeBrowserStyles.field} ref={selectRef}>
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
                      void deleteOption(option);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        event.stopPropagation();
                        void deleteOption(option);
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
            onCancel={() => {
              setIsCreating(false);
              setError(null);
              setName("");
            }}
            onSave={saveNewOption}
          />
        )}
      </div>
    );
  }

  return (
    <label className={recipeBrowserStyles.field}>
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
          Cancel
        </button>
        <button
          className={recipeBrowserStyles.primaryButton(theme)}
          disabled={isSaving}
          type="button"
          onClick={onSave}
        >
          {isSaving ? "Saving..." : "Create"}
        </button>
      </div>
    </div>
  );
}

export default CreatableSelect;
