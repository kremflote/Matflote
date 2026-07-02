import type { IIngredient } from "../../interfaces/IIngredient";
import type { SiteTheme } from "../../styles/appStyles";
import { ChipList, DetailSection, DetailText, MetadataRow, NutritionGrid } from "./detailComponents";
import { formatLabel, recipeBrowserStyles } from "./recipeBrowserStyles";

type IngredientDetailContentProps = {
  ingredient: IIngredient;
  theme: SiteTheme;
};

function IngredientDetailContent({ ingredient, theme }: IngredientDetailContentProps) {
  return (
    <div className={recipeBrowserStyles.detailShell}>
      <div className={recipeBrowserStyles.detailRows}>
        <div className={recipeBrowserStyles.ingredientDetailMetaGrid}>
          <MetadataRow label="Brand" theme={theme} value={ingredient.brand?.name ?? "No brand"} />
          <MetadataRow
            label="Price"
            theme={theme}
            value={ingredient.price === null ? "No price" : `${ingredient.price.toFixed(2)} per kg`}
          />
        </div>
        <ChipList label="Tags" theme={theme} values={ingredient.tags.map(formatLabel)} />
        <DetailText
          label="Description"
          theme={theme}
          value={ingredient.description || "No description yet."}
        />
      </div>

      <DetailSection title="Dietary information per 100g" theme={theme}>
        <NutritionGrid nutrition={ingredient.nutritionPer100} theme={theme} />
      </DetailSection>
    </div>
  );
}

export default IngredientDetailContent;
