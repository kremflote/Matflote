import type { IIngredient } from "../../interfaces/IIngredient";
import type { SiteTheme } from "../../styles/appStyles";
import { DetailSection, DetailText, MetadataRow, NutritionGrid } from "./detailComponents";
import { recipeBrowserStyles } from "./recipeBrowserStyles";

type IngredientDetailContentProps = {
  ingredient: IIngredient;
  theme: SiteTheme;
};

function IngredientDetailContent({ ingredient, theme }: IngredientDetailContentProps) {
  return (
    <div className={recipeBrowserStyles.detailShell}>
      <DetailSection title="Overview" theme={theme}>
        <div className={recipeBrowserStyles.ingredientDetailMetaGrid}>
          <MetadataRow label="Brand" theme={theme} value={ingredient.brand?.name ?? ""} />
          <MetadataRow
            label="Price"
            theme={theme}
            value={ingredient.price === null ? "No price" : `${ingredient.price.toFixed(2)} per kg`}
          />
        </div>
      </DetailSection>

      <DetailText
        label="Description"
        theme={theme}
        value={ingredient.description || "No description yet."}
      />

      <DetailSection title="Dietary information per 100g" theme={theme}>
        <NutritionGrid nutrition={ingredient.nutritionPer100} theme={theme} />
      </DetailSection>
    </div>
  );
}

export default IngredientDetailContent;
