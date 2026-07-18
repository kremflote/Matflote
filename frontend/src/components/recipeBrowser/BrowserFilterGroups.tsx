import type { SiteTheme } from "../../styles/appStyles";
import { formatLabel, recipeBrowserStyles } from "./recipeBrowserStyles";

export type CheckboxGroup<TValue extends string> = {
  key: string;
  values: readonly TValue[];
};

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
  formatValue?: (value: TValue) => string;
  values: readonly TValue[];
  selectedValues: readonly TValue[];
  theme: SiteTheme;
  onToggle: (value: TValue) => void;
};

export function FilterGroup<TValue extends string>({
  title,
  disabledValues = [],
  formatValue = formatLabel,
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
              {formatValue(value)}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

type GroupedFilterGroupProps<TValue extends string> = {
  title: string;
  groups: readonly CheckboxGroup<TValue>[];
  groupLabels: Record<string, string>;
  disabledValues?: readonly TValue[];
  formatValue?: (value: TValue) => string;
  selectedValues: readonly TValue[];
  theme: SiteTheme;
  onToggle: (value: TValue) => void;
};

type GroupedCheckboxPanelProps<TValue extends string> = {
  groups: readonly CheckboxGroup<TValue>[];
  groupLabels: Record<string, string>;
  addActionLabel?: string;
  disabledValues?: readonly TValue[];
  formatValue?: (value: TValue) => string;
  selectedValues: readonly TValue[];
  theme: SiteTheme;
  panelClassName?: string;
  sectionClassName?: (theme: SiteTheme) => string;
  titleClassName?: (theme: SiteTheme) => string;
  optionListClassName?: string;
  optionLabelClassName?: (theme: SiteTheme, disabled: boolean) => string;
  checkboxClassName?: string;
  onAddTag?: () => void;
  onToggle: (value: TValue) => void;
};

export function GroupedCheckboxPanel<TValue extends string>({
  groups,
  groupLabels,
  addActionLabel,
  disabledValues = [],
  formatValue = formatLabel,
  selectedValues,
  theme,
  panelClassName = recipeBrowserStyles.groupedTagPanel,
  sectionClassName = recipeBrowserStyles.groupedTagSection,
  titleClassName = recipeBrowserStyles.groupedTagTitle,
  optionListClassName = recipeBrowserStyles.groupedTagGrid,
  optionLabelClassName = (currentTheme, disabled) =>
    `${recipeBrowserStyles.checkboxLabel(currentTheme)} ${
      disabled ? recipeBrowserStyles.disabledFilterOption(currentTheme) : ""
    }`,
  checkboxClassName = recipeBrowserStyles.checkbox,
  onAddTag,
  onToggle,
}: GroupedCheckboxPanelProps<TValue>) {
  return (
    <div className={panelClassName}>
      {groups.map((group) => (
        <section className={sectionClassName(theme)} key={group.key}>
          <h3 className={titleClassName(theme)}>{groupLabels[group.key]}</h3>
          <div className={optionListClassName}>
            {group.values.map((value) => {
              const disabled = disabledValues.includes(value);

              return (
                <label className={optionLabelClassName(theme, disabled)} key={value}>
                  <input
                    checked={disabled ? false : selectedValues.includes(value)}
                    className={checkboxClassName}
                    disabled={disabled}
                    type="checkbox"
                    onChange={() => onToggle(value)}
                  />
                  {formatValue(value)}
                </label>
              );
            })}
          </div>
        </section>
      ))}
      {addActionLabel !== undefined && onAddTag !== undefined && (
        <button
          className={recipeBrowserStyles.addTagButton(theme)}
          type="button"
          onClick={onAddTag}
        >
          {addActionLabel}
        </button>
      )}
    </div>
  );
}

export function GroupedFilterGroup<TValue extends string>({
  title,
  groups,
  groupLabels,
  disabledValues = [],
  formatValue = formatLabel,
  selectedValues,
  theme,
  onToggle,
}: GroupedFilterGroupProps<TValue>) {
  return (
    <fieldset className={recipeBrowserStyles.filterGroup(theme)}>
      <div className={recipeBrowserStyles.filterGroupHeader}>
        <legend className={recipeBrowserStyles.filterLegend(theme)}>{title}</legend>
      </div>
      <GroupedCheckboxPanel
        checkboxClassName={recipeBrowserStyles.checkbox}
        disabledValues={disabledValues}
        formatValue={formatValue}
        groupLabels={groupLabels}
        groups={groups}
        optionLabelClassName={(currentTheme, disabled) =>
          `${recipeBrowserStyles.checkboxLabel(currentTheme)} ${
            disabled ? recipeBrowserStyles.disabledFilterOption(currentTheme) : ""
          }`
        }
        optionListClassName={recipeBrowserStyles.filterOptionList}
        panelClassName={recipeBrowserStyles.groupedFilterOptionList}
        sectionClassName={recipeBrowserStyles.groupedFilterSection}
        selectedValues={selectedValues}
        theme={theme}
        titleClassName={recipeBrowserStyles.groupedTagTitle}
        onToggle={onToggle}
      />
    </fieldset>
  );
}
