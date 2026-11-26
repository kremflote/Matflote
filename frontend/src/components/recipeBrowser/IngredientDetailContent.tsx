import type { IIngredient } from "../../interfaces/IIngredient";
import { useLanguage } from "../../contexts";
import { getApiAssetUrl } from "../../services/apiClient";
import { DetailSection, DetailText, NutritionGrid } from "./detailComponents";
import { recipeBrowserStyles } from "./recipeBrowserStyles";

type IngredientDetailContentProps = {
  ingredient: IIngredient;
};

function IngredientDetailContent({ ingredient }: IngredientDetailContentProps) {
  const { t } = useLanguage();
  const imageUrl = getApiAssetUrl(ingredient.imageUrl);

  return (
    <div className={recipeBrowserStyles.detailShell}>
      <DetailSection title={t.cookbook.overview}>
        <div className={recipeBrowserStyles.ingredientDetailOverviewGrid}>
          <div
            className={recipeBrowserStyles.ingredientDetailImageFrame}
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
            <IngredientMetaField label={t.cookbook.brand} value={ingredient.brand?.name ?? ""} />
          </div>
        </div>
      </DetailSection>

      <DetailText
        label={t.cookbook.description}
        value={ingredient.description || t.cookbook.noDescription}
      />

      <DetailSection title={t.cookbook.dietaryInformationPer100g}>
        <NutritionGrid nutrition={ingredient.nutritionPer100} />
      </DetailSection>
    </div>
  );
}

type IngredientMetaFieldProps = {
  label: string;
  value: string;
};

function IngredientMetaField({ label, value }: IngredientMetaFieldProps) {
  return (
    <div className={recipeBrowserStyles.ingredientDetailMetaField}>
      <span className={recipeBrowserStyles.ingredientDetailMetaLabel}>{label}</span>
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
