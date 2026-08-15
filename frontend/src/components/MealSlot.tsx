import { useLanguage } from "../contexts";
import type { IIngredient } from "../interfaces/IIngredient";
import type { IMealPlanEntry, MealSlot as MealSlotId } from "../interfaces/IMeal";
import type { IRecipe } from "../interfaces/IRecipe";
import { mealCalendarStyles, type SiteTheme } from "../styles/appStyles";
import { getApiAssetUrl } from "../services/apiClient";

type MealSlotProps = {
  canUseDesktopInteractions: boolean;
  date: string;
  entry?: IMealPlanEntry;
  ingredientsById: Map<number, IIngredient>;
  onClick: () => void;
  onDeleteRequest: (date: string, slot: MealSlotId) => void;
  onDragEnd: () => void;
  onDragStart: (date: string, slot: MealSlotId) => void;
  onDropOnSlot: (date: string, slot: MealSlotId) => void;
  slot: MealSlotId;
  recipesById: Map<number, IRecipe>;
  theme?: SiteTheme;
};

function MealSlot({
  canUseDesktopInteractions,
  date,
  entry,
  ingredientsById,
  onClick,
  onDeleteRequest,
  onDragEnd,
  onDragStart,
  onDropOnSlot,
  recipesById,
  slot,
  theme = "dark",
}: MealSlotProps) {
  const { t } = useLanguage();
  const plannedItems =
    entry?.recipes
      .slice()
      .sort((firstRecipe, secondRecipe) => firstRecipe.sortOrder - secondRecipe.sortOrder)
      .map((plannedRecipe) => ({
        ...plannedRecipe,
        recipe: plannedRecipe.recipeId === null ? undefined : recipesById.get(plannedRecipe.recipeId),
        ingredient: plannedRecipe.ingredientId === null ? undefined : ingredientsById.get(plannedRecipe.ingredientId),
      })) ?? [];
  const mainItem = plannedItems.find((plannedRecipe) => plannedRecipe.role === "Main") ?? plannedItems[0];
  const supplementaryItems = plannedItems.filter((plannedRecipe) => plannedRecipe !== mainItem);
  const mainName = mainItem?.recipe?.name ?? mainItem?.ingredient?.ingredientName;
  const mainImageUrl = mainItem?.recipe?.imageUrl ?? mainItem?.ingredient?.imageUrl ?? null;
  const hasMeal = plannedItems.length > 0;

  return (
    <div
      className={`${mealCalendarStyles.mealSlot(theme)} ${mealCalendarStyles.mealSlotDropTarget(theme)}`}
      onDragOver={(event) => {
        if (!canUseDesktopInteractions) {
          return;
        }

        event.preventDefault();
        event.currentTarget.dataset.dragActive = "true";
      }}
      onDragLeave={(event) => {
        event.currentTarget.dataset.dragActive = "false";
      }}
      onDrop={(event) => {
        if (!canUseDesktopInteractions) {
          return;
        }

        event.preventDefault();
        event.currentTarget.dataset.dragActive = "false";
        onDropOnSlot(date, slot);
      }}
    >
      <button
        aria-label={t.planner.openMealSlot}
        className={`${mealCalendarStyles.mealSlotButton} ${
          canUseDesktopInteractions && hasMeal ? mealCalendarStyles.mealSlotDraggableButton : ""
        }`}
        draggable={canUseDesktopInteractions && hasMeal}
        type="button"
        onClick={onClick}
        onDragEnd={onDragEnd}
        onDragStart={(event) => {
          if (!canUseDesktopInteractions || !hasMeal) {
            event.preventDefault();
            return;
          }

          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("text/plain", `${date}::${slot}`);
          onDragStart(date, slot);
        }}
      >
        {hasMeal ? (
          <div className={mealCalendarStyles.mealSlotContent}>
            {mainName !== undefined ? (
              <>
                <div className={mealCalendarStyles.mealSlotImageFrame(theme)}>
                  {getApiAssetUrl(mainImageUrl) ? (
                    <img
                      alt=""
                      className={mealCalendarStyles.mealSlotImage}
                      src={getApiAssetUrl(mainImageUrl) ?? undefined}
                    />
                  ) : (
                    <div className={mealCalendarStyles.mealSlotImageFallback(theme)} aria-hidden="true" />
                  )}
                </div>
                <div className={mealCalendarStyles.mealSlotDetails}>
                  <h3 className={mealCalendarStyles.mealSlotTitle(theme)}>
                    {mainName}
                  </h3>
                  {mainItem?.portions !== null && mainItem?.portions !== undefined && (
                    <span className={mealCalendarStyles.mealSlotPortions(theme)}>
                      {mainItem.portions}x
                    </span>
                  )}
                  <div className={mealCalendarStyles.mealSlotRecipeList}>
                    {supplementaryItems.map((plannedRecipe) => {
                      const name = plannedRecipe.recipe?.name ?? plannedRecipe.ingredient?.ingredientName ?? t.planner.recipeFallback(plannedRecipe.recipeId ?? plannedRecipe.ingredientId ?? 0);

                      return (
                        <div
                          className={mealCalendarStyles.mealSlotRecipe(theme)}
                          key={`${plannedRecipe.mealPlanRecipeId}-${plannedRecipe.recipeId ?? plannedRecipe.ingredientId}`}
                          title={name}
                        >
                          {name}
                        </div>
                      );
                    })}
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
      {canUseDesktopInteractions && hasMeal && (
        <button
          aria-label={t.planner.removeMeal}
          className={mealCalendarStyles.mealSlotDeleteButton(theme)}
          title={t.planner.removeMeal}
          type="button"
          onClick={() => onDeleteRequest(date, slot)}
        >
          <TrashIcon />
        </button>
      )}
    </div>
  );
}

function TrashIcon() {
  return (
    <svg aria-hidden="true" className={mealCalendarStyles.mealSlotDeleteIcon} fill="none" viewBox="0 0 24 24">
      <path
        d="M9 4h6m-8 4h10m-9 0 .7 11.2A2 2 0 0 0 10.7 21h2.6a2 2 0 0 0 2-1.8L16 8M10 11v6m4-6v6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

export default MealSlot;
