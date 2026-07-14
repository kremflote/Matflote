import type {
  IngredientTag,
  MeasurementUnit,
  Vitamin,
} from "../interfaces/IIngredient";
import type { MealSlot, PlannerViewMode } from "../interfaces/IMeal";
import type {
  DessertType,
  IngredientPreparation,
  RecipeTag,
  RecipeType,
} from "../interfaces/IRecipe";

export type SupportedLanguage = "en" | "nb";

type EnumLabels = {
  dessertTypes: Record<DessertType, string>;
  ingredientTags: Record<IngredientTag, string>;
  ingredientPreparations: Record<IngredientPreparation, string>;
  mealSlots: Record<MealSlot, string>;
  measurementUnits: Record<MeasurementUnit, string>;
  recipeTags: Record<RecipeTag, string>;
  recipeTypes: Record<RecipeType, string>;
  vitamins: Record<Vitamin, string>;
  viewModes: Record<PlannerViewMode, string>;
};

export type TranslationDictionary = {
  calendar: {
    weekdaysShort: readonly string[];
  };
  common: {
    add: string;
    back: string;
    cancel: string;
    clear: string;
    clearFilters: string;
    confirm: string;
    createNew: string;
    close: string;
    edit: string;
    remove: string;
    removing: string;
    saving: string;
    search: string;
    working: string;
  };
  browser: {
    ingredientSearchPlaceholder: string;
    noIngredientsFound: string;
    openIngredientFilter: string;
    searchIngredients: string;
    searchIngredientsToInclude: string;
    searchRecipes: string;
  };
  cookbook: {
    allIngredients: string;
    allRecipes: string;
    cookbookSections: string;
    create: string;
    couldNotLoadIngredients: string;
    couldNotLoadRecipes: string;
    fetchingCookbook: string;
    fetchingPantry: string;
    ingredientFilter: string;
    ingredientSingular: string;
    ingredients: string;
    loadingIngredients: string;
    loadingRecipes: string;
    noIngredientsFound: string;
    noRecipesFound: string;
    openIngredientFilter: string;
    recipes: string;
    recipeSingular: string;
    searchIngredients: string;
    searchRecipes: string;
    addRecipeDetails: string;
    hideRecipeDetails: string;
    tryChangingSearch: string;
  };
  enums: EnumLabels;
  filters: {
    categories: string;
    cuisine: string;
    ingredientTags: string;
    includes: string;
    protein: string;
    recipeFilters: string;
    recipeType: string;
    tags: string;
    type: string;
  };
  language: {
    english: string;
    englishShort: string;
    norwegian: string;
    norwegianShort: string;
  };
  locale: string;
  nav: {
    cookbook: string;
    home: string;
    planner: string;
    primary: string;
    settings: string;
  };
  planner: {
    actionClear: string;
    actionExport: string;
    actionGenerate: string;
    actionPrep: string;
    addMeal: (slot: string) => string;
    addMealLower: (slot: string) => string;
    addSupplementsDescription: string;
    backToMain: string;
    chooseMainDish: string;
    chooseSides: string;
    chooseSupplements: string;
    clearCurrent: (range: string) => string;
    clearRange: (range: string) => string;
    clearRangeBody: (range: string) => string;
    clearing: string;
    collapseDay: (day: string, date: string) => string;
    couldNotClear: (range: string) => string;
    couldNotGenerate: (range: string) => string;
    couldNotLoadMealPlan: string;
    dish: string;
    editMeal: (slot: string, label: string) => string;
    exportGroceryList: string;
    expandDay: (day: string, date: string) => string;
    groceryExportCouldNotLoad: string;
    groceryExportCouldNotSend: string;
    groceryExportDescription: string;
    groceryExportEmpty: string;
    groceryExportLoading: string;
    groceryExportSections: Record<string, string>;
    groceryExportSelectedCount: (selected: number, total: number) => string;
    groceryExportSend: string;
    groceryExportSending: string;
    groceryExportSent: string;
    groceryExportSources: (sources: string) => string;
    groceryExportTitle: string;
    generateCurrent: (range: string) => string;
    generateMealPlan: string;
    generateRangeBody: (range: string) => string;
    generating: string;
    mealCalendar: string;
    mealPickerSearchPlaceholder: string;
    noMatchingRecipesFound: string;
    noMainDishRecipesFound: string;
    openPlannerActions: string;
    plannerControls: string;
    plannerTools: string;
    plannerView: string;
    prepHelper: string;
    prepActionLabels: Record<string, string>;
    prepHelperDescription: (from: string, to: string) => string;
    prepHelperEmpty: string;
    prepHelperSources: (sources: string) => string;
    prepHelperTitle: string;
    previousRange: (range: string) => string;
    nextRange: (range: string) => string;
    openMealSlot: string;
    rangeNames: Record<PlannerViewMode, string>;
    recipeFallback: (id: number) => string;
    removeMeal: string;
    removeMealBody: string;
    removeMealTitle: string;
    couldNotRemoveMeal: string;
    couldNotSaveMeal: string;
    removing: string;
    saveMeal: string;
    selectMainDescription: string;
    selectedCount: (count: number, max: number) => string;
    switchToView: (view: string) => string;
    weekLabel: (week: number) => string;
    yearLabel: (year: string) => string;
  };
  settings: {
    apiToken: string;
    apiTokenConfigured: string;
    apiTokenHelp: string;
    apiTokenPlaceholder: string;
    couldNotLoad: string;
    couldNotSave: string;
    currentProvider: string;
    currentProviderMode: string;
    databaseProvider: string;
    environment: string;
    exportBody: string;
    exportMode: string;
    exportModeSeparateTasks: string;
    exportModeSeparateTasksHelp: string;
    exportModeSingleTask: string;
    exportModeSingleTaskHelp: string;
    exportTitle: string;
    imageStorage: string;
    languageBody: string;
    languageTitle: string;
    pageTitle: string;
    projectId: string;
    provider: string;
    saveSettings: string;
    saved: string;
    saving: string;
    systemBody: string;
    systemTitle: string;
    vikunjaBaseUrl: string;
    vikunjaBaseUrlPlaceholder: string;
    testConnection: string;
    testingConnection: string;
    testConnectionSucceeded: string;
    testConnectionFailed: string;
  };
  theme: {
    switchToDark: string;
    switchToLight: string;
  };
};

