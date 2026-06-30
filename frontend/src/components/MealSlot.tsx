import { mealCalendarStyles, type SiteTheme } from "../styles/appStyles";

type MealSlotProps = {
  theme?: SiteTheme;
};

function MealSlot({ theme = "dark" }: MealSlotProps) {
  return (
    <div className={mealCalendarStyles.mealSlot(theme)}>
      <div className={mealCalendarStyles.mealSlotInner(theme)} />
    </div>
  );
}

export default MealSlot;
