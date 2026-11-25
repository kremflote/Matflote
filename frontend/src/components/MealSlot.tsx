import { useLanguage } from "../contexts";
import type { IIngredient } from "../interfaces/IIngredient";
import type { IMealPlanEntry, MealSlot as MealSlotId } from "../interfaces/IMeal";
import type { IRecipe } from "../interfaces/IRecipe";
import { colorPalette, mealCalendarStyles, type SiteTheme } from "../styles/appStyles";
import { getThumbnailSrc } from "../utils/imageThumbnail";
import { getMainIngredientNames, getRecipeColorBarBackground, getRecipeTile } from "../utils/recipeTile";

type MealSlotProps = {
  canUseDesktopInteractions: boolean;
  date: string;
  /** The day in words ("Monday, November 30"), so each slot has its own accessible name. */
  dateLabel: string;
  entry?: IMealPlanEntry;
  ingredientsById: Map<number, IIngredient>;
  isDisabled: boolean;
  isLoading: boolean;
  /** Today's row is highlighted. */
  isToday?: boolean;
  onClick: () => void;
  onDeleteRequest: (date: string, slot: MealSlotId) => void;
  onDragEnd: () => void;
  onDragStart: (date: string, slot: MealSlotId) => void;
  onDropOnSlot: (date: string, slot: MealSlotId) => void;
  onOpenRecipe: (recipe: IRecipe) => void;
  slot: MealSlotId;
  recipesById: Map<number, IRecipe>;
  theme?: SiteTheme;
};

function MealSlot({
  canUseDesktopInteractions,
  date,
  dateLabel,
  entry,
  ingredientsById,
  isDisabled,
  isLoading,
  isToday = false,
  onClick,
  onDeleteRequest,
  onDragEnd,
  onDragStart,
  onDropOnSlot,
  onOpenRecipe,
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
  const supplementaryNames = supplementaryItems.map(
    (plannedRecipe) =>
      plannedRecipe.recipe?.name ??
      plannedRecipe.ingredient?.ingredientName ??
      t.planner.recipeFallback(plannedRecipe.recipeId ?? plannedRecipe.ingredientId ?? 0),
  );
  const mainName = mainItem?.recipe?.name ?? mainItem?.ingredient?.ingredientName;
  const mainImageSrc = getThumbnailSrc(mainItem?.recipe ?? mainItem?.ingredient);
  const mainRecipe = mainItem?.recipe;
  const mainColors = mainRecipe !== undefined
    ? getRecipeTile(mainRecipe).colors
    : [mainItem?.ingredient?.color ?? colorPalette.stone];
  const mainIngredientNames = mainRecipe !== undefined ? getMainIngredientNames(mainRecipe) : [];
  // Side dishes first; a card without a photo shows its main ingredients when there are none.
  const secondaryText =
    supplementaryNames.length > 0
      ? `+ ${supplementaryNames.join(", ")}`
      : mainImageSrc === null
        ? mainIngredientNames.join(" · ")
        : "";
  const slotLabel = t.enums.mealSlots[slot];
  const hasMeal = plannedItems.length > 0;
  const isUnavailable = isLoading || isDisabled;
  const canDragMeal = canUseDesktopInteractions && hasMeal && !isUnavailable;
  const showsTouchActions = !canUseDesktopInteractions && hasMeal && !isUnavailable;

  return (
    <div
      className={`${mealCalendarStyles.mealSlot(theme, isToday, showsTouchActions)} ${mealCalendarStyles.mealSlotDropTarget(theme)}`}
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
        aria-label={t.planner.mealSlotLabel(
          dateLabel,
          slotLabel,
          mainName === undefined
            ? null
            : [mainName, ...supplementaryNames].join(", "),
        )}
        className={`${mealCalendarStyles.mealSlotButton} ${
          canDragMeal ? mealCalendarStyles.mealSlotDraggableButton : ""
        } ${isDisabled && !isLoading ? mealCalendarStyles.mealSlotUnavailable : ""}`}
        aria-busy={isLoading}
        disabled={isUnavailable}
        draggable={canDragMeal}
        type="button"
        onClick={onClick}
        onDragEnd={onDragEnd}
        onDragStart={(event) => {
          if (!canDragMeal) {
            event.preventDefault();
            return;
          }

          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("text/plain", `${date}::${slot}`);
          onDragStart(date, slot);
        }}
      >
        {isLoading ? (
          <MealSlotSkeleton theme={theme} />
        ) : hasMeal && mainName !== undefined ? (
          <span className={mealCalendarStyles.mealSlotContent(mainImageSrc !== null)}>
            {mainImageSrc !== null ? (
              <span className={mealCalendarStyles.mealSlotImageFrame(theme)}>
                <img
                  alt=""
                  className={mealCalendarStyles.mealSlotImage}
                  src={mainImageSrc}
                  loading="lazy"
                  decoding="async"
                />
              </span>
            ) : (
              // Without a photo the card is text-first: a thin bar of the ingredients' colours, then the name.
              <span
                aria-hidden="true"
                className={mealCalendarStyles.mealSlotColorBar}
                data-testid="meal-slot-color-bar"
                style={{ background: getRecipeColorBarBackground(mainColors) }}
              />
            )}
            <span className={mealCalendarStyles.mealSlotDetails}>
              <span className={mealCalendarStyles.mealSlotEyebrow(theme)}>{slotLabel}</span>
              <span className={mealCalendarStyles.mealSlotTitle(theme)}>{mainName}</span>
              <span className={mealCalendarStyles.mealSlotMetaRow}>
                <span className={mealCalendarStyles.mealSlotSecondary(theme)} title={secondaryText || undefined}>
                  {secondaryText}
                </span>
                {mainItem?.portions !== null && mainItem?.portions !== undefined && (
                  <span className={mealCalendarStyles.mealSlotPortions(theme)}>
                    {t.planner.portionsCount(mainItem.portions)}
                  </span>
                )}
              </span>
            </span>
          </span>
        ) : (
          <span className={mealCalendarStyles.mealSlotEmpty(theme)}>
            <span aria-hidden="true" className={mealCalendarStyles.mealSlotEmptyPlus}>+</span>
            {slotLabel}
          </span>
        )}
      </button>
      {!isUnavailable && hasMeal && (
        <span className={mealCalendarStyles.mealSlotActions(canUseDesktopInteractions)}>
          {mainRecipe !== undefined && (
            <button
              aria-label={t.planner.openRecipe}
              className={mealCalendarStyles.mealSlotActionButton(theme, canUseDesktopInteractions)}
              title={t.planner.openRecipe}
              type="button"
              onClick={() => onOpenRecipe(mainRecipe)}
            >
              <BookIcon />
            </button>
          )}
          <button
            aria-label={t.planner.removeMeal}
            className={mealCalendarStyles.mealSlotDeleteButton(theme, canUseDesktopInteractions)}
            title={t.planner.removeMeal}
            type="button"
            onClick={() => onDeleteRequest(date, slot)}
          >
            <TrashIcon />
          </button>
        </span>
      )}
    </div>
  );
}

function MealSlotSkeleton({ theme }: { theme: SiteTheme }) {
  return (
    <span className={mealCalendarStyles.mealSlotContent(true)} aria-hidden="true">
      <span className={mealCalendarStyles.mealSlotSkeletonImage(theme)} />
      <span className={mealCalendarStyles.mealSlotSkeletonDetails}>
        <span className={mealCalendarStyles.mealSlotSkeletonLine(theme, "title")} />
        <span className={mealCalendarStyles.mealSlotSkeletonLine(theme, "short")} />
      </span>
    </span>
  );
}

function BookIcon() {
  return (
    <svg aria-hidden="true" className={mealCalendarStyles.mealSlotDeleteIcon} viewBox="0 0 24 24" fill="currentColor">
      <path d="M5 3h5.5c1 0 1.9.3 2.5 1 .6-.7 1.5-1 2.5-1H21v16h-5.5c-.7 0-1.3.2-1.8.7l-.7.7-.7-.7c-.5-.5-1.1-.7-1.8-.7H5V3Zm2 2v12h3.5c.6 0 1.1.1 1.5.3V6.5c-.3-1-1-1.5-1.5-1.5H7Zm7 1.5v10.8c.4-.2.9-.3 1.5-.3H19V5h-3.5c-.5 0-1.2.5-1.5 1.5Z" />
    </svg>
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
