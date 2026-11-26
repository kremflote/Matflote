import { BrandProvider } from "./BrandContext";
import type { IProviderProps } from "../interfaces/IProviderProps";
import { IngredientProvider } from "./IngredientContext";
import { IngredientTagCategoryProvider } from "./IngredientTagCategoryContext";
import { LanguageProvider } from "./LanguageContext";
import { MealPlanProvider } from "./MealPlanContext";
import { RecipeProvider } from "./RecipeContext";

export function AppProviders({ children }: IProviderProps) {
  return (
    <LanguageProvider>
      <BrandProvider>
        <IngredientTagCategoryProvider>
          <IngredientProvider>
            <RecipeProvider>
              <MealPlanProvider>{children}</MealPlanProvider>
            </RecipeProvider>
          </IngredientProvider>
        </IngredientTagCategoryProvider>
      </BrandProvider>
    </LanguageProvider>
  );
}
