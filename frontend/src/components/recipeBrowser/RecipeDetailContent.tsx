import { useState } from "react";
import type { IIngredient, INutritionFacts } from "../../interfaces/IIngredient";
import { getApiAssetUrl } from "../../services/apiClient";
import type { SiteTheme } from "../../styles/appStyles";
import { DetailSection, DetailText, DetailTextWithMeta, NutritionGrid } from "./detailComponents";
import { formatLabel, recipeBrowserStyles } from "./recipeBrowserStyles";
import type { EnrichedRecipe } from "./types";

type RecipeDetailContentProps = {
  recipe: EnrichedRecipe;
  theme: SiteTheme;
  onIngredientClick?: (ingredient: IIngredient) => void;
};

function RecipeDetailContent({ recipe, theme, onIngredientClick }: RecipeDetailContentProps) {
  const imageUrl = getApiAssetUrl(recipe.imageUrl);
  const nutrition = calculateRecipeNutrition(recipe);
  const [ingredientMultiplier, setIngredientMultiplier] = useState("1");
  const amountMultiplier = parseAmountMultiplier(ingredientMultiplier);

  return (
    <div className={recipeBrowserStyles.detailShell}>
      <div className={recipeBrowserStyles.recipeDetailHeroGrid}>
        <div className={recipeBrowserStyles.recipeDetailImageFrame}>
          {imageUrl ? (
            <img className={recipeBrowserStyles.detailImage} src={imageUrl} alt={recipe.name} />
          ) : (
            <div className={recipeBrowserStyles.detailImageFallback}>
              No image
            </div>
          )}
        </div>

        <div className={recipeBrowserStyles.recipeDetailDescriptionWrap}>
          <DetailTextWithMeta
            className={recipeBrowserStyles.recipeDetailDescriptionPanel}
            label="Description"
            meta={[
              formatLabel(recipe.recipeType),
              recipe.cuisine?.name,
              recipe.dessertType ? formatLabel(recipe.dessertType) : null,
            ].filter(Boolean).join(" · ")}
            theme={theme}
            value={recipe.description || "No description yet."}
          />
        </div>
      </div>

      <div className={recipeBrowserStyles.recipeDetailSplitGrid}>
        <DetailSection
          title="Ingredients"
          theme={theme}
          headerAction={
            <label className={recipeBrowserStyles.scaleLabel}>
              <span className={recipeBrowserStyles.helperText(theme)}>Scale</span>
              <span className={`${recipeBrowserStyles.numberField} ${recipeBrowserStyles.scaleField}`}>
                <input
                  aria-label="Ingredient amount multiplier"
                  className={`${recipeBrowserStyles.compactTextField(theme)} ${recipeBrowserStyles.scaleInput}`}
                  min="0"
                  placeholder="1"
                  step="0.25"
                  type="number"
                  value={ingredientMultiplier}
                  onChange={(event) => setIngredientMultiplier(event.target.value)}
                />
                <span className={recipeBrowserStyles.numberFieldSuffix(theme)}>x</span>
              </span>
            </label>
          }
        >
          {recipe.ingredients.length === 0 ? (
            <p className={recipeBrowserStyles.helperText(theme)}>No ingredients added.</p>
          ) : (
            <div className={recipeBrowserStyles.detailRows}>
              {recipe.ingredients.map((recipeIngredient) => (
                <button
                  className={recipeBrowserStyles.detailIngredientRow(theme)}
                  key={recipeIngredient.recipeIngredientId}
                  type="button"
                  onClick={() => onIngredientClick?.(recipeIngredient.ingredient)}
                >
                  <span
                    aria-hidden="true"
                    className={recipeBrowserStyles.detailIngredientDot}
                    style={{ backgroundColor: recipeIngredient.ingredient.color ?? "currentColor" }}
                  />
                  <span className={recipeBrowserStyles.detailIngredientName}>{recipeIngredient.ingredient.ingredientName}</span>
                  <span className={recipeBrowserStyles.detailIngredientBrand}>
                    {recipeIngredient.ingredient.brand?.name ?? "no brand"}
                  </span>
                  <span className={recipeBrowserStyles.detailIngredientAmount}>
                    {formatRecipeIngredientAmount(recipeIngredient.amount, recipeIngredient.unit, amountMultiplier)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </DetailSection>

        <DetailText
          label="Instructions"
          theme={theme}
          value={recipe.instructions || "No instructions yet."}
        />
      </div>

      <DetailSection title="Dietary information" theme={theme}>
        <NutritionGrid nutrition={nutrition} theme={theme} />
      </DetailSection>
    </div>
  );
}

function calculateRecipeNutrition(recipe: EnrichedRecipe): INutritionFacts | null {
  const total = createEmptyNutrition();
  let hasNutrition = false;

  recipe.ingredients.forEach((recipeIngredient) => {
    const nutrition = recipeIngredient.ingredient.nutritionPer100;
    const grams = toGramAmount(recipeIngredient.amount, recipeIngredient.unit);

    if (nutrition === null || grams === null) {
      return;
    }

    hasNutrition = true;
    const factor = grams / 100;
    total.calories = addScaled(total.calories, nutrition.calories, factor);
    total.carbohydrateGrams = addScaled(total.carbohydrateGrams, nutrition.carbohydrateGrams, factor);
    total.proteinGrams = addScaled(total.proteinGrams, nutrition.proteinGrams, factor);
    total.saltGrams = addScaled(total.saltGrams, nutrition.saltGrams, factor);
    total.dietaryFiberGrams = addScaled(total.dietaryFiberGrams, nutrition.dietaryFiberGrams, factor);
    total.saturatedFatGrams = addScaled(total.saturatedFatGrams, nutrition.saturatedFatGrams, factor);
    total.unsaturatedFatGrams = addScaled(total.unsaturatedFatGrams, nutrition.unsaturatedFatGrams, factor);
    total.monounsaturatedFatGrams = addScaled(total.monounsaturatedFatGrams, nutrition.monounsaturatedFatGrams, factor);
    total.polyunsaturatedFatGrams = addScaled(total.polyunsaturatedFatGrams, nutrition.polyunsaturatedFatGrams, factor);
    total.vitamins = Array.from(new Set([...total.vitamins, ...nutrition.vitamins]));
  });

  return hasNutrition ? total : null;
}

function createEmptyNutrition(): INutritionFacts {
  return {
    calories: null,
    carbohydrateGrams: null,
    proteinGrams: null,
    saltGrams: null,
    dietaryFiberGrams: null,
    saturatedFatGrams: null,
    unsaturatedFatGrams: null,
    monounsaturatedFatGrams: null,
    polyunsaturatedFatGrams: null,
    vitamins: [],
  };
}

function addScaled(currentValue: number | null, value: number | null, factor: number) {
  if (value === null) {
    return currentValue;
  }

  return roundNutrition((currentValue ?? 0) + value * factor);
}

function roundNutrition(value: number) {
  return Math.round(value * 10) / 10;
}

function toGramAmount(amount: number | null, unit: string) {
  if (amount === null) {
    return null;
  }

  if (unit === "Gram") {
    return amount;
  }

  if (unit === "Kilogram") {
    return amount * 1000;
  }

  return null;
}

function parseAmountMultiplier(value: string) {
  const multiplier = Number(value);
  return Number.isFinite(multiplier) && multiplier >= 0 ? multiplier : 1;
}

function formatRecipeIngredientAmount(amount: number | null, unit: string, multiplier = 1) {
  if (amount === null) {
    return formatLabel(unit);
  }

  const scaledAmount = Math.round(amount * multiplier * 100) / 100;
  return `${scaledAmount} ${formatLabel(unit).toLowerCase()}`;
}

export default RecipeDetailContent;
