import type { SiteTheme } from "../../styles/appStyles";
import { formatLabel, recipeBrowserStyles } from "./recipeBrowserStyles";

export type NumberFilterOption = {
  disabled?: boolean;
  id: number;
  label: string;
};

type NumberFilterGroupProps = {
  title: string;
  values: readonly NumberFilterOption[];
  selectedValues: readonly number[];
  theme: SiteTheme;
  onToggle: (value: number) => void;
};

export function NumberFilterGroup({
  title,
  values,
  selectedValues,
  theme,
  onToggle,
}: NumberFilterGroupProps) {
  return (
    <fieldset className={recipeBrowserStyles.filterGroup(theme)}>
      <div className={recipeBrowserStyles.filterGroupHeader}>
        <legend className={recipeBrowserStyles.filterLegend(theme)}>{title}</legend>
      </div>
      <div className={recipeBrowserStyles.filterOptionList}>
        {values.map((value) => {
          const disabled = value.disabled === true;

          return (
            <label
              className={`${recipeBrowserStyles.checkboxLabel(theme)} ${
                disabled ? recipeBrowserStyles.disabledFilterOption(theme) : ""
              }`}
              key={value.id}
            >
              <input
                checked={disabled ? false : selectedValues.includes(value.id)}
                className={recipeBrowserStyles.checkbox}
                disabled={disabled}
                type="checkbox"
                onChange={() => onToggle(value.id)}
              />
              {value.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

type FilterGroupProps<TValue extends string> = {
  title: string;
  disabledValues?: readonly TValue[];
  values: readonly TValue[];
  selectedValues: readonly TValue[];
  theme: SiteTheme;
  onToggle: (value: TValue) => void;
};

export function FilterGroup<TValue extends string>({
  title,
  disabledValues = [],
  values,
  selectedValues,
  theme,
  onToggle,
}: FilterGroupProps<TValue>) {
  return (
    <fieldset className={recipeBrowserStyles.filterGroup(theme)}>
      <div className={recipeBrowserStyles.filterGroupHeader}>
        <legend className={recipeBrowserStyles.filterLegend(theme)}>{title}</legend>
      </div>
      <div className={recipeBrowserStyles.filterOptionList}>
        {values.map((value) => {
          const disabled = disabledValues.includes(value);

          return (
            <label
              className={`${recipeBrowserStyles.checkboxLabel(theme)} ${
                disabled ? recipeBrowserStyles.disabledFilterOption(theme) : ""
              }`}
              key={value}
            >
              <input
                checked={disabled ? false : selectedValues.includes(value)}
                className={recipeBrowserStyles.checkbox}
                disabled={disabled}
                type="checkbox"
                onChange={() => onToggle(value)}
              />
              {formatLabel(value)}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
