import { useState } from "react";
import { useLanguage } from "../../contexts";
import type { IIngredient, INutritionFacts, MeasurementUnit } from "../../interfaces/IIngredient";
import { getApiAssetUrl } from "../../services/apiClient";
import type { SiteTheme } from "../../styles/appStyles";
import { DetailSection, DetailText, DetailTextWithMeta, NutritionGrid } from "./detailComponents";
import { recipeBrowserStyles } from "./recipeBrowserStyles";
import type { EnrichedRecipe } from "./types";
type RecipeDetailContentProps = {
  allRecipes: EnrichedRecipe[];
  recipe: EnrichedRecipe;
  theme: SiteTheme;
  onIngredientClick?: (ingredient: IIngredient) => void;
  onRecipeClick?: (recipeId: number) => void;
};

function RecipeDetailContent({
  allRecipes,
  recipe,
  theme,
  onIngredientClick,
  onRecipeClick,
}: RecipeDetailContentProps) {
  const { t } = useLanguage();
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
              {t.cookbook.noImage}
            </div>
          )}
        </div>

        <div className={recipeBrowserStyles.recipeDetailDescriptionWrap}>
          <DetailTextWithMeta
            className={recipeBrowserStyles.recipeDetailDescriptionPanel}
            label={t.cookbook.description}
            meta={[
              t.enums.recipeTypes[recipe.recipeType],
              recipe.cuisine?.name,
              recipe.dessertType ? t.enums.dessertTypes[recipe.dessertType] : null,
            ].filter(Boolean).join(" · ")}
            theme={theme}
            value={recipe.description || t.cookbook.noDescription}
          />
        </div>
      </div>

      <div className={recipeBrowserStyles.recipeDetailSplitGrid}>
        <DetailSection
          title={t.cookbook.ingredients}
          theme={theme}
          headerAction={
            <label className={recipeBrowserStyles.scaleLabel}>
              <span className={recipeBrowserStyles.helperText(theme)}>{t.cookbook.scale}</span>
              <span className={`${recipeBrowserStyles.numberField} ${recipeBrowserStyles.scaleField}`}>
                <input
                  aria-label={t.cookbook.ingredientAmountMultiplier}
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
          <div className={recipeBrowserStyles.detailIngredientSections}>
            <RecipeIngredientSection
              amountMultiplier={amountMultiplier}
              ingredients={recipe.ingredients}
              title={t.cookbook.mainRecipe}
              theme={theme}
              onIngredientClick={onIngredientClick}
            />
            {recipe.components
              .slice()
              .sort((first, second) => first.sortOrder - second.sortOrder)
              .map((component) => {
                const fullComponentRecipe = allRecipes.find((currentRecipe) => currentRecipe.recipeId === component.recipeId);
                const componentIngredients = component.ingredients ?? fullComponentRecipe?.ingredients ?? [];

                return (
                  <RecipeIngredientSection
                    amountMultiplier={amountMultiplier}
                    ingredients={componentIngredients}
                    key={component.recipeId}
                    recipeId={component.recipeId}
                    title={t.enums.recipeTypes[component.recipeType]}
                    titleLinkLabel={component.name}
                    theme={theme}
                    onIngredientClick={onIngredientClick}
                    onRecipeClick={onRecipeClick}
                  />
                );
              })}
          </div>
        </DetailSection>

        <DetailText
          label={t.cookbook.instructions}
          theme={theme}
          value={recipe.instructions || t.cookbook.noInstructions}
        />
      </div>

      <DetailSection title={t.cookbook.dietaryInformation} theme={theme}>
        <NutritionGrid nutrition={nutrition} theme={theme} />
      </DetailSection>
    </div>
  );
}

type RecipeIngredientSectionProps = {
  amountMultiplier: number;
  ingredients: EnrichedRecipe["ingredients"];
  recipeId?: number;
  title: string;
  titleLinkLabel?: string;
  theme: SiteTheme;
  onIngredientClick?: (ingredient: IIngredient) => void;
  onRecipeClick?: (recipeId: number) => void;
};

function RecipeIngredientSection({
  amountMultiplier,
  ingredients,
  recipeId,
  title,
  titleLinkLabel,
  theme,
  onIngredientClick,
  onRecipeClick,
}: RecipeIngredientSectionProps) {
  const { t } = useLanguage();

  return (
    <section className={recipeBrowserStyles.detailIngredientSection}>
      <h3 className={recipeBrowserStyles.detailIngredientSectionTitle(theme)}>
        <span>{title}</span>
        {titleLinkLabel !== undefined && recipeId !== undefined && (
          <>
            <span aria-hidden="true"> - </span>
            <button
              className={recipeBrowserStyles.detailIngredientSectionTitleButton(theme)}
              type="button"
              onClick={() => onRecipeClick?.(recipeId)}
            >
              {titleLinkLabel}
            </button>
          </>
        )}
      </h3>
      {ingredients.length === 0 ? (
        <p className={recipeBrowserStyles.helperText(theme)}>{t.cookbook.noIngredientsAdded}</p>
      ) : (
        <div className={recipeBrowserStyles.detailRows}>
          {ingredients.map((recipeIngredient) => (
            <button
              className={recipeBrowserStyles.detailIngredientRow(theme)}
              key={recipeIngredient.recipeIngredientId}
              type="button"
              onClick={() => onIngredientClick?.(recipeIngredient.ingredient)}
            >
              <span
                aria-hidden="true"
                className={recipeBrowserStyles.detailIngredientImageFrame(theme)}
                style={{ backgroundColor: recipeIngredient.ingredient.color ?? undefined }}
              >
                {recipeIngredient.ingredient.imageUrl ? (
                  <img
                    alt=""
                    className={recipeBrowserStyles.detailIngredientImage}
                    src={getApiAssetUrl(recipeIngredient.ingredient.imageUrl) ?? undefined}
                  />
                ) : (
                  <span className={recipeBrowserStyles.detailIngredientImageFallback}>
                    {getInitials(recipeIngredient.ingredient.ingredientName)}
                  </span>
                )}
              </span>
              <span className={recipeBrowserStyles.detailIngredientContent}>
                <span className={recipeBrowserStyles.detailIngredientName}>
                  {recipeIngredient.ingredient.ingredientName}
                </span>
                <span className={recipeBrowserStyles.detailIngredientMetaRow}>
                  <span className={recipeBrowserStyles.detailIngredientAmount}>
                    {formatRecipeIngredientAmount(
                      recipeIngredient.amount,
                      recipeIngredient.unit,
                      t.enums.measurementUnits,
                      amountMultiplier,
                    )}
                  </span>
                  <span className={recipeBrowserStyles.detailIngredientPreparation}>
                    {recipeIngredient.preparation !== "None" ? t.enums.ingredientPreparations[recipeIngredient.preparation] : ""}
                  </span>
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
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
    total.transFatGrams = addScaled(total.transFatGrams, nutrition.transFatGrams, factor);
    total.monounsaturatedFatGrams = addScaled(total.monounsaturatedFatGrams, nutrition.monounsaturatedFatGrams, factor);
    total.polyunsaturatedFatGrams = addScaled(total.polyunsaturatedFatGrams, nutrition.polyunsaturatedFatGrams, factor);
    total.omega3Grams = addScaled(total.omega3Grams, nutrition.omega3Grams, factor);
    total.omega6Grams = addScaled(total.omega6Grams, nutrition.omega6Grams, factor);
    total.cholesterolMilligrams = addScaled(total.cholesterolMilligrams, nutrition.cholesterolMilligrams, factor);
    total.vitaminAMicrograms = addScaled(total.vitaminAMicrograms, nutrition.vitaminAMicrograms, factor);
    total.vitaminB9Micrograms = addScaled(total.vitaminB9Micrograms, nutrition.vitaminB9Micrograms, factor);
    total.vitaminB12Micrograms = addScaled(total.vitaminB12Micrograms, nutrition.vitaminB12Micrograms, factor);
    total.vitaminCMilligrams = addScaled(total.vitaminCMilligrams, nutrition.vitaminCMilligrams, factor);
    total.vitaminDMicrograms = addScaled(total.vitaminDMicrograms, nutrition.vitaminDMicrograms, factor);
    total.vitaminEMilligrams = addScaled(total.vitaminEMilligrams, nutrition.vitaminEMilligrams, factor);
    total.vitaminKMicrograms = addScaled(total.vitaminKMicrograms, nutrition.vitaminKMicrograms, factor);
    total.cholineMilligrams = addScaled(total.cholineMilligrams, nutrition.cholineMilligrams, factor);
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
    transFatGrams: null,
    monounsaturatedFatGrams: null,
    polyunsaturatedFatGrams: null,
    omega3Grams: null,
    omega6Grams: null,
    cholesterolMilligrams: null,
    vitaminAMicrograms: null,
    vitaminB9Micrograms: null,
    vitaminB12Micrograms: null,
    vitaminCMilligrams: null,
    vitaminDMicrograms: null,
    vitaminEMilligrams: null,
    vitaminKMicrograms: null,
    cholineMilligrams: null,
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

function formatRecipeIngredientAmount(
  amount: number | null,
  unit: MeasurementUnit,
  unitLabels: Record<MeasurementUnit, string>,
  multiplier = 1,
) {
  if (amount === null) {
    return unitLabels[unit];
  }

  const scaledAmount = Math.round(amount * multiplier * 100) / 100;
  return `${scaledAmount} ${unitLabels[unit].toLowerCase()}`;
}

export default RecipeDetailContent;
