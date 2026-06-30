import type { IProviderProps } from "../interfaces/IProviderProps";
import { DessertProvider } from "./DessertContext";
import { DishProvider } from "./DishContext";
import { IngredientProvider } from "./IngredientContext";
import { MealPlanProvider } from "./MealPlanContext";
import { RecipeProvider } from "./RecipeContext";

export function AppProviders({ children }: IProviderProps) {
  return (
    <IngredientProvider>
      <RecipeProvider>
        <DishProvider>
          <DessertProvider>
            <MealPlanProvider>{children}</MealPlanProvider>
          </DessertProvider>
        </DishProvider>
      </RecipeProvider>
    </IngredientProvider>
  );
}
