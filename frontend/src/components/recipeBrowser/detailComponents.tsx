import type { ReactNode } from "react";
import { useLanguage } from "../../contexts";
import type { INutritionFacts } from "../../interfaces/IIngredient";
import type { SiteTheme } from "../../styles/appStyles";
import { recipeBrowserStyles } from "./recipeBrowserStyles";

type DetailSectionProps = {
  title: string;
  theme: SiteTheme;
  children: ReactNode;
  headerAction?: ReactNode;
  subtitle?: string;
};

export function DetailSection({ title, theme, children, headerAction, subtitle }: DetailSectionProps) {
  return (
    <section className={recipeBrowserStyles.detailsPanel(theme)}>
      <div className={recipeBrowserStyles.detailSectionHeader}>
        <div className={recipeBrowserStyles.detailSectionTitleRow}>
          <h3 className={recipeBrowserStyles.detailSectionTitle}>{title}</h3>
          {subtitle !== undefined && (
            <span className={recipeBrowserStyles.detailSectionSubtitle(theme)}>{subtitle}</span>
          )}
        </div>
        {headerAction}
      </div>
      {children}
    </section>
  );
}

type DetailTextProps = {
  label: string;
  theme: SiteTheme;
  value: string;
};

export function DetailText({ label, theme, value }: DetailTextProps) {
  return (
    <DetailSection title={label} theme={theme}>
      <p className={recipeBrowserStyles.detailText}>{value}</p>
    </DetailSection>
  );
}

type DetailTextWithMetaProps = DetailTextProps & {
  className?: string;
  meta: string;
};

export function DetailTextWithMeta({ className = "", label, meta, theme, value }: DetailTextWithMetaProps) {
  return (
    <section className={`${recipeBrowserStyles.detailsPanel(theme)} min-h-0 overflow-hidden ${className}`}>
      <div className={recipeBrowserStyles.detailTextMetaHeader}>
        <h3 className={recipeBrowserStyles.detailSectionTitle}>{label}</h3>
        <span className={recipeBrowserStyles.helperText(theme)}>{meta}</span>
      </div>
      <p className={recipeBrowserStyles.detailTextScrollable}>{value}</p>
    </section>
  );
}

type MetadataRowProps = {
  label: string;
  value: string;
  theme: SiteTheme;
};

export function MetadataRow({ label, value, theme }: MetadataRowProps) {
  return (
    <div className={recipeBrowserStyles.detailRow(theme)}>
      <span className={recipeBrowserStyles.detailRowLabel}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

type ChipListProps = {
  label: string;
  values: string[];
  theme: SiteTheme;
  compact?: boolean;
};

export function ChipList({ compact = false, label, values, theme }: ChipListProps) {
  const { t } = useLanguage();

  return (
    <section className={compact ? recipeBrowserStyles.detailChipSectionCompact : recipeBrowserStyles.detailChipSection}>
      <span className={recipeBrowserStyles.label(theme)}>{label}</span>
      <div className={recipeBrowserStyles.detailChipList}>
        {values.length === 0 ? (
          <span className={recipeBrowserStyles.helperText(theme)}>{t.cookbook.none}</span>
        ) : (
          values.map((value) => (
            <span className={recipeBrowserStyles.filterChip(theme)} key={value}>
              {value}
            </span>
          ))
        )}
      </div>
    </section>
  );
}

type NutritionGridProps = {
  nutrition: INutritionFacts | null;
  theme: SiteTheme;
  variant?: "default" | "recipe";
};

export function NutritionGrid({ nutrition, theme, variant = "default" }: NutritionGridProps) {
  const { t } = useLanguage();

  if (nutrition === null) {
    return <p className={recipeBrowserStyles.helperText(theme)}>{t.cookbook.noDietaryInformation}</p>;
  }

  const overviewRows: Array<[string, string | null]> =
    variant === "recipe"
      ? [
        [t.cookbook.totalCaloriesInDish, nutrition.calories === null ? null : `${nutrition.calories} kcal`],
        [t.cookbook.carbs, formatGrams(nutrition.carbohydrateGrams)],
        [t.cookbook.protein, formatGrams(nutrition.proteinGrams)],
        [t.cookbook.nutritionFats, formatGrams(sumNutritionValues([
          nutrition.saturatedFatGrams,
          nutrition.transFatGrams,
          nutrition.monounsaturatedFatGrams,
          nutrition.polyunsaturatedFatGrams,
        ]))],
      ]
      : [
        [t.cookbook.calories, nutrition.calories === null ? null : `${nutrition.calories} kcal`],
        [t.cookbook.carbs, formatGrams(nutrition.carbohydrateGrams)],
        [t.cookbook.protein, formatGrams(nutrition.proteinGrams)],
      ];

  const rowGroups: Array<{ title: string; rows: Array<[string, string | null]> }> = [
    {
      title: variant === "recipe" ? t.cookbook.overview : t.cookbook.nutritionMacros,
      rows: overviewRows,
    },
    {
      title: t.cookbook.nutritionFats,
      rows: [
      [t.cookbook.saturatedFats, formatGrams(nutrition.saturatedFatGrams)],
      [t.cookbook.transFats, formatGrams(nutrition.transFatGrams)],
      [t.cookbook.monounsaturatedFats, formatGrams(nutrition.monounsaturatedFatGrams)],
      [t.cookbook.polyunsaturatedFats, formatGrams(nutrition.polyunsaturatedFatGrams)],
      [t.cookbook.omega3, formatGrams(nutrition.omega3Grams)],
      [t.cookbook.omega6, formatGrams(nutrition.omega6Grams)],
      [t.cookbook.cholesterol, formatUnit(nutrition.cholesterolMilligrams, "mg")],
      ],
    },
    {
      title: t.cookbook.nutritionVitamins,
      rows: [
      ["Vitamin A", formatUnit(nutrition.vitaminAMicrograms, "ug")],
      ["Vitamin B9", formatUnit(nutrition.vitaminB9Micrograms, "ug")],
      ["Vitamin B12", formatUnit(nutrition.vitaminB12Micrograms, "ug")],
      ["Vitamin C", formatUnit(nutrition.vitaminCMilligrams, "mg")],
      ["Vitamin D", formatUnit(nutrition.vitaminDMicrograms, "ug")],
      ["Vitamin E", formatUnit(nutrition.vitaminEMilligrams, "mg")],
      ["Vitamin K", formatUnit(nutrition.vitaminKMicrograms, "ug")],
      ],
    },
    {
      title: t.cookbook.nutritionOther,
      rows: [
      [t.cookbook.fiber, formatGrams(nutrition.dietaryFiberGrams)],
      ["Choline", formatUnit(nutrition.cholineMilligrams, "mg")],
      [t.cookbook.salt, formatGrams(nutrition.saltGrams)],
      ],
    },
  ];

  return (
    <div className={recipeBrowserStyles.nutritionGrid}>
      {rowGroups.map((group, groupIndex) => (
        <div className={recipeBrowserStyles.nutritionGridGroupWrap} key={group.title}>
          {groupIndex > 0 && <div className={recipeBrowserStyles.nutritionSeparator(theme)} />}
          <h4 className={recipeBrowserStyles.nutritionGridGroupTitle(theme)}>{group.title}</h4>
          <div className={recipeBrowserStyles.nutritionGridGroup}>
            {group.rows.map(([label, value]) => (
              <div className={recipeBrowserStyles.detailRow(theme)} key={label}>
                <span className={recipeBrowserStyles.detailRowLabel}>{label}</span>
                <span>{value ?? t.cookbook.notSet}</span>
              </div>
            ))}
            </div>
        </div>
      ))}
    </div>
  );
}

function formatGrams(value: number | null) {
  return value === null ? null : `${value} g`;
}

function sumNutritionValues(values: Array<number | null>) {
  const knownValues = values.filter((value): value is number => value !== null);

  if (knownValues.length === 0) {
    return null;
  }

  return knownValues.reduce((total, value) => total + value, 0);
}

function formatUnit(value: number | null, unit: string) {
  return value === null ? null : `${value} ${unit}`;
}
