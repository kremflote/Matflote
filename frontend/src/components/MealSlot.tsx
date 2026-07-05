import type { IMealPlanEntry } from "../interfaces/IMeal";
import type { IRecipe } from "../interfaces/IRecipe";
import { mealCalendarStyles, type SiteTheme } from "../styles/appStyles";
import { getApiAssetUrl } from "../services/apiClient";

type MealSlotProps = {
  entry?: IMealPlanEntry;
  onClick: () => void;
  recipesById: Map<number, IRecipe>;
  theme?: SiteTheme;
};

function MealSlot({ entry, onClick, recipesById, theme = "dark" }: MealSlotProps) {
  const plannedRecipes =
    entry?.recipes
      .slice()
      .sort((firstRecipe, secondRecipe) => firstRecipe.sortOrder - secondRecipe.sortOrder)
      .map((plannedRecipe) => ({
        ...plannedRecipe,
        recipe: recipesById.get(plannedRecipe.recipeId),
      })) ?? [];
  const mainRecipe = plannedRecipes.find((plannedRecipe) => plannedRecipe.role === "Main") ?? plannedRecipes[0];
  const supplementaryRecipes = plannedRecipes.filter((plannedRecipe) => plannedRecipe !== mainRecipe);

  return (
    <button
      aria-label="Open meal slot"
      className={`${mealCalendarStyles.mealSlot(theme)} ${mealCalendarStyles.mealSlotButton}`}
      type="button"
      onClick={onClick}
    >
      {plannedRecipes.length > 0 ? (
        <div className={mealCalendarStyles.mealSlotContent}>
          {mainRecipe?.recipe ? (
            <>
              <div className={mealCalendarStyles.mealSlotImageFrame(theme)}>
                {getApiAssetUrl(mainRecipe.recipe.imageUrl) ? (
                  <img
                    alt=""
                    className={mealCalendarStyles.mealSlotImage}
                    src={getApiAssetUrl(mainRecipe.recipe.imageUrl) ?? undefined}
                  />
                ) : (
                  <div className={mealCalendarStyles.mealSlotImageFallback(theme)} aria-hidden="true" />
                )}
              </div>
              <div className={mealCalendarStyles.mealSlotDetails}>
                <h3 className={mealCalendarStyles.mealSlotTitle(theme)}>
                  {mainRecipe.recipe.name}
                </h3>
                <div className={mealCalendarStyles.mealSlotRecipeList}>
                  {supplementaryRecipes.map((plannedRecipe) => (
                    <div
                      className={mealCalendarStyles.mealSlotRecipe(theme)}
                      key={`${plannedRecipe.mealPlanRecipeId}-${plannedRecipe.recipeId}`}
                      title={plannedRecipe.recipe?.name ?? `Recipe ${plannedRecipe.recipeId}`}
                    >
                      {plannedRecipe.recipe?.name ?? `Recipe ${plannedRecipe.recipeId}`}
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className={mealCalendarStyles.mealSlotInner(theme)} />
          )}
        </div>
      ) : (
        <div className={mealCalendarStyles.mealSlotInner(theme)} />
      )}
    </button>
  );
}

export default MealSlot;
