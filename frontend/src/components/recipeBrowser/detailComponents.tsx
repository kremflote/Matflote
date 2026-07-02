import type { ReactNode } from "react";
import type { INutritionFacts } from "../../interfaces/IIngredient";
import type { SiteTheme } from "../../styles/appStyles";
import { formatLabel, recipeBrowserStyles } from "./recipeBrowserStyles";

type DetailSectionProps = {
  title: string;
  theme: SiteTheme;
  children: ReactNode;
  headerAction?: ReactNode;
};

export function DetailSection({ title, theme, children, headerAction }: DetailSectionProps) {
  return (
    <section className={recipeBrowserStyles.detailsPanel(theme)}>
      <div className={recipeBrowserStyles.detailSectionHeader}>
        <h3 className={recipeBrowserStyles.detailSectionTitle}>{title}</h3>
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
};

export function ChipList({ label, values, theme }: ChipListProps) {
  return (
    <section className={recipeBrowserStyles.detailChipSection}>
      <span className={recipeBrowserStyles.label(theme)}>{label}</span>
      <div className={recipeBrowserStyles.detailChipList}>
        {values.length === 0 ? (
          <span className={recipeBrowserStyles.helperText(theme)}>None</span>
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
};

export function NutritionGrid({ nutrition, theme }: NutritionGridProps) {
  if (nutrition === null) {
    return <p className={recipeBrowserStyles.helperText(theme)}>No dietary information yet.</p>;
  }

  const rows = [
    ["Calories", nutrition.calories === null ? null : `${nutrition.calories} kcal`],
    ["Carbs", formatGrams(nutrition.carbohydrateGrams)],
    ["Protein", formatGrams(nutrition.proteinGrams)],
    ["Salt", formatGrams(nutrition.saltGrams)],
    ["Fiber", formatGrams(nutrition.dietaryFiberGrams)],
    ["Saturated fats", formatGrams(nutrition.saturatedFatGrams)],
    ["Unsaturated fats", formatGrams(nutrition.unsaturatedFatGrams)],
    ["Monounsaturated fats", formatGrams(nutrition.monounsaturatedFatGrams)],
    ["Polyunsaturated fats", formatGrams(nutrition.polyunsaturatedFatGrams)],
    ["Vitamins", nutrition.vitamins.length === 0 ? null : nutrition.vitamins.map(formatLabel).join(", ")],
  ];

  return (
    <div className={recipeBrowserStyles.nutritionGrid}>
      {rows.map(([label, value]) => (
        <div className={recipeBrowserStyles.detailRow(theme)} key={label}>
          <span className={recipeBrowserStyles.detailRowLabel}>{label}</span>
          <span>{value ?? "Not set"}</span>
        </div>
      ))}
    </div>
  );
}

function formatGrams(value: number | null) {
  return value === null ? null : `${value} g`;
}
