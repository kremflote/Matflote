import type { IIngredient } from "../../interfaces/IIngredient";
import { useLanguage } from "../../contexts";
import { getApiAssetUrl } from "../../services/apiClient";
import type { SiteTheme } from "../../styles/appStyles";
import { DetailSection, DetailText, NutritionGrid } from "./detailComponents";
import { recipeBrowserStyles } from "./recipeBrowserStyles";

type IngredientDetailContentProps = {
  ingredient: IIngredient;
  theme: SiteTheme;
};

function IngredientDetailContent({ ingredient, theme }: IngredientDetailContentProps) {
  const { t } = useLanguage();
  const imageUrl = getApiAssetUrl(ingredient.imageUrl);

  return (
    <div className={recipeBrowserStyles.detailShell}>
      <DetailSection title={t.cookbook.overview} theme={theme}>
        <div className={recipeBrowserStyles.ingredientDetailOverviewGrid}>
          <div
            className={recipeBrowserStyles.ingredientDetailImageFrame(theme)}
            style={imageUrl === null ? { backgroundColor: ingredient.color ?? undefined } : undefined}
          >
            {imageUrl === null ? (
              <span className={recipeBrowserStyles.ingredientDetailImageFallback}>
                {getInitials(ingredient.ingredientName)}
              </span>
            ) : (
              <img className={recipeBrowserStyles.ingredientDetailImage} src={imageUrl} alt={ingredient.ingredientName} />
            )}
          </div>
          <div className={recipeBrowserStyles.ingredientDetailMetaStack}>
            <IngredientMetaField label={t.cookbook.brand} theme={theme} value={ingredient.brand?.name ?? ""} />
          </div>
        </div>
      </DetailSection>

      <DetailText
        label={t.cookbook.description}
        theme={theme}
        value={ingredient.description || t.cookbook.noDescription}
      />

      <DetailSection title={t.cookbook.dietaryInformationPer100g} theme={theme}>
        <NutritionGrid nutrition={ingredient.nutritionPer100} theme={theme} />
      </DetailSection>
    </div>
  );
}

type IngredientMetaFieldProps = {
  label: string;
  theme: SiteTheme;
  value: string;
};

function IngredientMetaField({ label, theme, value }: IngredientMetaFieldProps) {
  return (
    <div className={recipeBrowserStyles.ingredientDetailMetaField(theme)}>
      <span className={recipeBrowserStyles.ingredientDetailMetaLabel(theme)}>{label}</span>
      <span className={recipeBrowserStyles.ingredientDetailMetaValue}>{value}</span>
    </div>
  );
}

function getInitials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "?";
}

export default IngredientDetailContent;
