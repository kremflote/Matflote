import { BrandProvider } from "./BrandContext";
import type { IProviderProps } from "../interfaces/IProviderProps";
import { IngredientProvider } from "./IngredientContext";
import { IngredientTagCategoryProvider } from "./IngredientTagCategoryContext";
import { LanguageProvider } from "./LanguageContext";
import { MealPlanProvider } from "./MealPlanContext";
import { RecipeProvider } from "./RecipeContext";
import { StoreProvider } from "./StoreContext";

export function AppProviders({ children }: IProviderProps) {
  return (
    <LanguageProvider>
      <BrandProvider>
        <StoreProvider>
          <IngredientTagCategoryProvider>
            <IngredientProvider>
              <RecipeProvider>
                <MealPlanProvider>{children}</MealPlanProvider>
              </RecipeProvider>
            </IngredientProvider>
          </IngredientTagCategoryProvider>
        </StoreProvider>
      </BrandProvider>
    </LanguageProvider>
  );
}
