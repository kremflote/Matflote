import { useState, type ReactNode } from "react";
import { useLanguage } from "../../contexts";
import type { SiteTheme } from "../../styles/appStyles";
import type { Vitamin } from "../../interfaces/IIngredient";
import { recipeBrowserStyles } from "./recipeBrowserStyles";

export type NutritionEditorValues = {
  calories: string;
  carbohydrateGrams: string;
  proteinGrams: string;
  saltGrams: string;
  dietaryFiberGrams: string;
  saturatedFatGrams: string;
  transFatGrams: string;
  monounsaturatedFatGrams: string;
  polyunsaturatedFatGrams: string;
  omega3Grams: string;
  omega6Grams: string;
  cholesterolMilligrams: string;
  vitaminAMicrograms: string;
  vitaminB9Micrograms: string;
  vitaminB12Micrograms: string;
  vitaminCMilligrams: string;
  vitaminDMicrograms: string;
  vitaminEMilligrams: string;
  vitaminKMicrograms: string;
  cholineMilligrams: string;
};

type NutritionEditorProps = {
  theme: SiteTheme;
  values: NutritionEditorValues;
  fieldSubtitles?: Partial<Record<keyof NutritionEditorValues, string | null>>;
  fieldSubtitleClassName?: string;
  onChange: (key: keyof NutritionEditorValues, value: string) => void;
  onSearchMatvaretabellen?: () => void;
};

function NutritionEditor({
  fieldSubtitles = {},
  fieldSubtitleClassName,
  theme,
  values,
  onChange,
  onSearchMatvaretabellen,
}: NutritionEditorProps) {
  const { t } = useLanguage();
  const [openSections, setOpenSections] = useState<Record<NutritionEditorSectionId, boolean>>({
    macros: true,
    fats: true,
    vitamins: true,
    other: true,
  });

  const toggleSection = (sectionId: NutritionEditorSectionId) => {
    setOpenSections((current) => ({
      ...current,
      [sectionId]: !current[sectionId],
    }));
  };

  return (
    <div className={recipeBrowserStyles.detailsPanel(theme)}>
      {onSearchMatvaretabellen !== undefined && (
        <div className={recipeBrowserStyles.nutritionEditorActionRow}>
          <button
            className={`${recipeBrowserStyles.inlineHelperButton(theme)} text-sm`}
            type="button"
            onClick={onSearchMatvaretabellen}
          >
            {t.scanner.searchAndFillMatvaretabellen}
          </button>
        </div>
      )}
      <NutritionEditorSection
        isOpen={openSections.macros}
        theme={theme}
        title={t.cookbook.nutritionMacros}
        onToggle={() => toggleSection("macros")}
      >
        <NutritionNumberField label={t.cookbook.caloriesPer100g} step="1" subtitle={fieldSubtitles.calories} subtitleClassName={fieldSubtitleClassName} theme={theme} unit="kcal" value={values.calories} onChange={(value) => onChange("calories", value)} />
        <NutritionNumberField label={t.cookbook.carbsPer100g} subtitle={fieldSubtitles.carbohydrateGrams} subtitleClassName={fieldSubtitleClassName} theme={theme} value={values.carbohydrateGrams} onChange={(value) => onChange("carbohydrateGrams", value)} />
        <NutritionNumberField label={t.cookbook.proteinPer100g} subtitle={fieldSubtitles.proteinGrams} subtitleClassName={fieldSubtitleClassName} theme={theme} value={values.proteinGrams} onChange={(value) => onChange("proteinGrams", value)} />
      </NutritionEditorSection>

      <NutritionEditorSection
        isOpen={openSections.fats}
        theme={theme}
        title={t.cookbook.nutritionFats}
        onToggle={() => toggleSection("fats")}
      >
        <NutritionNumberField label={t.cookbook.saturatedFatsPer100g} subtitle={fieldSubtitles.saturatedFatGrams} subtitleClassName={fieldSubtitleClassName} theme={theme} value={values.saturatedFatGrams} onChange={(value) => onChange("saturatedFatGrams", value)} />
        <NutritionNumberField label={t.cookbook.transFatsPer100g} subtitle={fieldSubtitles.transFatGrams} subtitleClassName={fieldSubtitleClassName} theme={theme} value={values.transFatGrams} onChange={(value) => onChange("transFatGrams", value)} />
        <NutritionNumberField label={t.cookbook.monounsaturatedFatsPer100g} subtitle={fieldSubtitles.monounsaturatedFatGrams} subtitleClassName={fieldSubtitleClassName} theme={theme} value={values.monounsaturatedFatGrams} onChange={(value) => onChange("monounsaturatedFatGrams", value)} />
        <NutritionNumberField label={t.cookbook.polyunsaturatedFatsPer100g} subtitle={fieldSubtitles.polyunsaturatedFatGrams} subtitleClassName={fieldSubtitleClassName} theme={theme} value={values.polyunsaturatedFatGrams} onChange={(value) => onChange("polyunsaturatedFatGrams", value)} />
        <NutritionNumberField label={t.cookbook.omega3Per100g} step="0.01" subtitle={fieldSubtitles.omega3Grams} subtitleClassName={fieldSubtitleClassName} theme={theme} value={values.omega3Grams} onChange={(value) => onChange("omega3Grams", value)} />
        <NutritionNumberField label={t.cookbook.omega6Per100g} step="0.01" subtitle={fieldSubtitles.omega6Grams} subtitleClassName={fieldSubtitleClassName} theme={theme} value={values.omega6Grams} onChange={(value) => onChange("omega6Grams", value)} />
        <NutritionNumberField label={t.cookbook.cholesterolPer100g} subtitle={fieldSubtitles.cholesterolMilligrams} subtitleClassName={fieldSubtitleClassName} theme={theme} unit="mg" value={values.cholesterolMilligrams} onChange={(value) => onChange("cholesterolMilligrams", value)} />
      </NutritionEditorSection>

      <NutritionEditorSection
        isOpen={openSections.vitamins}
        theme={theme}
        title={t.cookbook.nutritionVitamins}
        onToggle={() => toggleSection("vitamins")}
      >
        <NutritionNumberField label={t.cookbook.vitaminAPer100g} subtitle={fieldSubtitles.vitaminAMicrograms} subtitleClassName={fieldSubtitleClassName} theme={theme} unit="ug" value={values.vitaminAMicrograms} onChange={(value) => onChange("vitaminAMicrograms", value)} />
        <NutritionNumberField label={t.cookbook.vitaminB9Per100g} subtitle={fieldSubtitles.vitaminB9Micrograms} subtitleClassName={fieldSubtitleClassName} theme={theme} unit="ug" value={values.vitaminB9Micrograms} onChange={(value) => onChange("vitaminB9Micrograms", value)} />
        <NutritionNumberField label={t.cookbook.vitaminB12Per100g} subtitle={fieldSubtitles.vitaminB12Micrograms} subtitleClassName={fieldSubtitleClassName} theme={theme} unit="ug" value={values.vitaminB12Micrograms} onChange={(value) => onChange("vitaminB12Micrograms", value)} />
        <NutritionNumberField label={t.cookbook.vitaminCPer100g} subtitle={fieldSubtitles.vitaminCMilligrams} subtitleClassName={fieldSubtitleClassName} theme={theme} unit="mg" value={values.vitaminCMilligrams} onChange={(value) => onChange("vitaminCMilligrams", value)} />
        <NutritionNumberField label={t.cookbook.vitaminDPer100g} subtitle={fieldSubtitles.vitaminDMicrograms} subtitleClassName={fieldSubtitleClassName} theme={theme} unit="ug" value={values.vitaminDMicrograms} onChange={(value) => onChange("vitaminDMicrograms", value)} />
        <NutritionNumberField label={t.cookbook.vitaminEPer100g} subtitle={fieldSubtitles.vitaminEMilligrams} subtitleClassName={fieldSubtitleClassName} theme={theme} unit="mg" value={values.vitaminEMilligrams} onChange={(value) => onChange("vitaminEMilligrams", value)} />
        <NutritionNumberField label={t.cookbook.vitaminKPer100g} subtitle={fieldSubtitles.vitaminKMicrograms} subtitleClassName={fieldSubtitleClassName} theme={theme} unit="ug" value={values.vitaminKMicrograms} onChange={(value) => onChange("vitaminKMicrograms", value)} />
      </NutritionEditorSection>

      <NutritionEditorSection
        isOpen={openSections.other}
        theme={theme}
        title={t.cookbook.nutritionOther}
        onToggle={() => toggleSection("other")}
      >
        <NutritionNumberField label={t.cookbook.fiberPer100g} subtitle={fieldSubtitles.dietaryFiberGrams} subtitleClassName={fieldSubtitleClassName} theme={theme} value={values.dietaryFiberGrams} onChange={(value) => onChange("dietaryFiberGrams", value)} />
        <NutritionNumberField label={t.cookbook.cholinePer100g} subtitle={fieldSubtitles.cholineMilligrams} subtitleClassName={fieldSubtitleClassName} theme={theme} unit="mg" value={values.cholineMilligrams} onChange={(value) => onChange("cholineMilligrams", value)} />
        <NutritionNumberField label={t.cookbook.saltPer100g} step="0.01" subtitle={fieldSubtitles.saltGrams} subtitleClassName={fieldSubtitleClassName} theme={theme} value={values.saltGrams} onChange={(value) => onChange("saltGrams", value)} />
      </NutritionEditorSection>
    </div>
  );
}

type NutritionEditorSectionId = "macros" | "fats" | "vitamins" | "other";

type NutritionEditorSectionProps = {
  children: ReactNode;
  isOpen: boolean;
  theme: SiteTheme;
  title: string;
  onToggle: () => void;
};

function NutritionEditorSection({ children, isOpen, theme, title, onToggle }: NutritionEditorSectionProps) {
  return (
    <section className={recipeBrowserStyles.nutritionEditorGroup(theme)}>
      <button
        aria-expanded={isOpen}
        className={recipeBrowserStyles.nutritionEditorGroupButton(theme)}
        type="button"
        onClick={onToggle}
      >
        <span>{title}</span>
        <span aria-hidden="true" className={recipeBrowserStyles.nutritionEditorGroupIcon(isOpen)}>
          <ChevronIcon />
        </span>
      </button>
      {isOpen && <div className={recipeBrowserStyles.nutritionEditorSection}>{children}</div>}
    </section>
  );
}

function ChevronIcon() {
  return (
    <svg aria-hidden="true" className={recipeBrowserStyles.nutritionEditorGroupSvg} viewBox="0 0 24 24">
      <path d="m8.6 5.8 6.2 6.2-6.2 6.2 1.4 1.4 7.6-7.6L10 4.4 8.6 5.8Z" />
    </svg>
  );
}

type NutritionNumberFieldProps = {
  label: string;
  theme: SiteTheme;
  value: string;
  className?: string;
  step?: string;
  subtitle?: string | null;
  subtitleClassName?: string;
  unit?: string;
  onChange: (value: string) => void;
};

function NutritionNumberField({
  label,
  theme,
  value,
  className = "",
  step = "0.1",
  subtitle = null,
  subtitleClassName,
  unit = "g",
  onChange,
}: NutritionNumberFieldProps) {
  return (
    <label className={`${recipeBrowserStyles.field} ${className}`}>
      <span className={recipeBrowserStyles.label(theme)}>{label}</span>
      <span className={recipeBrowserStyles.numberField}>
        <input
          className={recipeBrowserStyles.numberFieldInput(theme)}
          min="0"
          step={step}
          type="number"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <span className={recipeBrowserStyles.numberFieldSuffix(theme)}>{unit}</span>
      </span>
      {subtitleClassName !== undefined && (
        <span className={subtitleClassName}>{subtitle ?? "\u00A0"}</span>
      )}
    </label>
  );
}

export function deriveVitaminsFromNutritionValues(values: NutritionEditorValues): Vitamin[] {
  const vitamins: Vitamin[] = [];

  if (hasValue(values.vitaminAMicrograms)) {
    vitamins.push("VitaminA");
  }
  if (hasValue(values.vitaminB9Micrograms)) {
    vitamins.push("VitaminB9");
  }
  if (hasValue(values.vitaminB12Micrograms)) {
    vitamins.push("VitaminB12");
  }
  if (hasValue(values.vitaminCMilligrams)) {
    vitamins.push("VitaminC");
  }
  if (hasValue(values.vitaminDMicrograms)) {
    vitamins.push("VitaminD");
  }
  if (hasValue(values.vitaminEMilligrams)) {
    vitamins.push("VitaminE");
  }
  if (hasValue(values.vitaminKMicrograms)) {
    vitamins.push("VitaminK");
  }
  if (hasValue(values.cholineMilligrams)) {
    vitamins.push("Choline");
  }

  return vitamins;
}

function hasValue(value: string) {
  return value.trim().length > 0;
}

export default NutritionEditor;
