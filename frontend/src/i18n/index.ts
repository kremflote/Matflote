import type { IngredientTag, MeasurementUnit, Vitamin } from "../interfaces/IIngredient";
import type { MealSlot, PlannerViewMode } from "../interfaces/IMeal";
import type { DessertType, RecipeTag, RecipeType } from "../interfaces/IRecipe";

export type SupportedLanguage = "en" | "nb";

type EnumLabels = {
  dessertTypes: Record<DessertType, string>;
  ingredientTags: Record<IngredientTag, string>;
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
    createIntro: string;
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
    norwegian: string;
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
    couldNotClear: (range: string) => string;
    couldNotGenerate: (range: string) => string;
    couldNotLoadMealPlan: string;
    dish: string;
    editMeal: (slot: string, label: string) => string;
    exportGroceryList: string;
    generateCurrent: (range: string) => string;
    generateMealPlan: string;
    generateRangeBody: (range: string) => string;
    generating: string;
    mealCalendar: string;
    mealPickerSearchPlaceholder: string;
    noMatchingRecipesFound: string;
    noMainDishRecipesFound: string;
    plannerControls: string;
    plannerView: string;
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
    weekLabel: (week: number) => string;
    yearLabel: (year: string) => string;
  };
  settings: {
    languageBody: string;
    languageTitle: string;
    pageTitle: string;
  };
  theme: {
    switchToDark: string;
    switchToLight: string;
  };
};

const commonEnumLabels = {
  dessertTypes: {
    Cake: "Cake",
    Pastry: "Pastry",
    IceCream: "Ice cream",
    Pudding: "Pudding",
    Cookie: "Cookie",
    Pie: "Pie",
    Tart: "Tart",
    Chocolate: "Chocolate",
    FruitDessert: "Fruit dessert",
    Other: "Other",
  },
  ingredientTags: {
    Vegetable: "Vegetable",
    Fruit: "Fruit",
    Chicken: "Chicken",
    Fish: "Fish",
    Beef: "Beef",
    Lamb: "Lamb",
    Mince: "Mince",
    Dairy: "Dairy",
    Grain: "Grain",
    Spice: "Spice",
    Herb: "Herb",
    Sauce: "Sauce",
    Pantry: "Pantry",
    Frozen: "Frozen",
    Other: "Other",
    LeafyGreen: "Leafy green",
  },
  measurementUnits: {
    Gram: "g",
    Kilogram: "kg",
    Milliliter: "ml",
    Liter: "l",
    Teaspoon: "tsp",
    Tablespoon: "tbsp",
    Cup: "cup",
    Piece: "piece",
    Clove: "clove",
    Pinch: "pinch",
    ToTaste: "to taste",
  },
  recipeTypes: {
    Dish: "Dish",
    Dessert: "Dessert",
    Sauce: "Sauce",
    Dip: "Dip",
    Side: "Side",
    SpiceMix: "Spice mix",
  },
  vitamins: {
    VitaminA: "Vitamin A",
    VitaminB: "Vitamin B",
    VitaminB12: "Vitamin B12",
    VitaminC: "Vitamin C",
    VitaminD: "Vitamin D",
    VitaminE: "Vitamin E",
    VitaminK: "Vitamin K",
  },
} as const;

export const translations: Record<SupportedLanguage, TranslationDictionary> = {
  en: {
    calendar: {
      weekdaysShort: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],
    },
    common: {
      add: "Add",
      back: "Back",
      cancel: "Cancel",
      clear: "Clear",
      clearFilters: "Clear filters",
      confirm: "Confirm",
      createNew: "Create New",
      close: "Close",
      edit: "Edit",
      remove: "Remove",
      removing: "Removing...",
      saving: "Saving...",
      search: "search...",
      working: "Working...",
    },
    browser: {
      ingredientSearchPlaceholder: "search ingredient...",
      noIngredientsFound: "No ingredients found",
      openIngredientFilter: "Open ingredient filter",
      searchIngredients: "Search ingredients",
      searchIngredientsToInclude: "Search ingredients to include",
      searchRecipes: "Search recipes",
    },
    cookbook: {
      allIngredients: "All Ingredients",
      allRecipes: "All Recipes",
      cookbookSections: "Cookbook sections",
      create: "Create",
      createIntro: "Add recipes, desserts, sauces, ingredients, and the rest of the kitchen library.",
      couldNotLoadIngredients: "Could not load ingredients",
      couldNotLoadRecipes: "Could not load recipes",
      fetchingCookbook: "Fetching the cookbook.",
      fetchingPantry: "Fetching the pantry.",
      ingredientFilter: "Ingredient filter",
      ingredientSingular: "Ingredient",
      ingredients: "Ingredients",
      loadingIngredients: "Loading ingredients",
      loadingRecipes: "Loading recipes",
      noIngredientsFound: "No ingredients found",
      noRecipesFound: "No recipes found",
      openIngredientFilter: "Open ingredient filter",
      recipes: "Recipes",
      recipeSingular: "Recipe",
      searchIngredients: "Search ingredients",
      searchRecipes: "Search recipes",
      addRecipeDetails: "Add recipe details",
      hideRecipeDetails: "Hide recipe details",
      tryChangingSearch: "Try changing search or filters.",
    },
    enums: {
      ...commonEnumLabels,
      mealSlots: {
        Breakfast: "Breakfast",
        Lunch: "Lunch",
        Dinner: "Dinner",
        Snack1: "Snack 1",
        Snack2: "Snack 2",
      },
      recipeTags: {
        Breakfast: "Breakfast",
        Lunch: "Lunch",
        Dinner: "Dinner",
        Bowl: "Bowl",
        Grill: "Grill",
        Pasta: "Pasta",
        Vegetarian: "Vegetarian",
        Soup: "Soup",
        Stew: "Stew",
        Salad: "Salad",
        Pizza: "Pizza",
        Sandwich: "Sandwich",
        Taco: "Taco",
        Curry: "Curry",
        Casserole: "Casserole",
        Other: "Other",
      },
      viewModes: {
        week: "Week",
        month: "Month",
      },
    },
    filters: {
      cuisine: "Cuisine",
      ingredientTags: "Ingredient Tags",
      includes: "includes",
      protein: "Protein",
      recipeFilters: "Recipe filters",
      recipeType: "Recipe Type",
      tags: "Tags",
      type: "Type",
    },
    language: {
      english: "English",
      norwegian: "Norwegian",
    },
    locale: "en",
    nav: {
      cookbook: "Cookbook",
      home: "MATFLOTE home",
      planner: "Planner",
      primary: "Primary",
      settings: "Settings",
    },
    planner: {
      addMeal: (slot) => `Add ${slot}`,
      addMealLower: (slot) => `Add ${slot.toLowerCase()}`,
      addSupplementsDescription: "Add up to six sides, sauces, dips, spice mixes, or salads.",
      backToMain: "Back",
      chooseMainDish: "Choose main dish",
      chooseSides: "Choose sides",
      chooseSupplements: "Choose supplements",
      clearCurrent: (range) => `Clear ${range}`,
      clearRange: (range) => `Clear this ${range}?`,
      clearRangeBody: (range) => `This will clear the current ${range}.`,
      clearing: "Clearing...",
      couldNotClear: (range) => `Could not clear this ${range}.`,
      couldNotGenerate: (range) => `Could not generate meals for this ${range}.`,
      couldNotLoadMealPlan: "Could not load meal plan.",
      dish: "Dish",
      editMeal: (slot, label) => `Edit ${slot}: ${label}`,
      exportGroceryList: "Export grocery list",
      generateCurrent: (range) => `Generate this ${range}?`,
      generateMealPlan: "Generate meal plan",
      generateRangeBody: (range) =>
        `This will generate meals for empty slots in the current ${range}. Existing meals will stay unchanged.`,
      generating: "Generating...",
      mealCalendar: "Meal calendar",
      mealPickerSearchPlaceholder: "search recipes...",
      noMatchingRecipesFound: "No matching recipes found.",
      noMainDishRecipesFound: "No main dish recipes found.",
      nextRange: (range) => `Next ${range}`,
      openMealSlot: "Open meal slot",
      plannerControls: "Planner controls",
      plannerView: "Planner view",
      previousRange: (range) => `Previous ${range}`,
      rangeNames: {
        week: "week",
        month: "month",
      },
      recipeFallback: (id) => `Recipe ${id}`,
      removeMeal: "Remove meal",
      removeMealBody: "This will clear the meal slot.",
      removeMealTitle: "Remove this meal?",
      couldNotRemoveMeal: "Could not remove this meal. Please try again.",
      couldNotSaveMeal: "Could not save this meal. Please try again.",
      removing: "Removing...",
      saveMeal: "Save meal",
      selectMainDescription: "Select one dish for this meal slot.",
      selectedCount: (count, max) => `${count}/${max} selected`,
      weekLabel: (week) => `Week ${week}`,
      yearLabel: (year) => `Year ${year}`,
    },
    settings: {
      languageBody: "Choose which language the interface should use.",
      languageTitle: "Language",
      pageTitle: "Settings",
    },
    theme: {
      switchToDark: "Switch to dark mode",
      switchToLight: "Switch to palette light mode",
    },
  },
  nb: {
    calendar: {
      weekdaysShort: ["MAN", "TIR", "ONS", "TOR", "FRE", "LØR", "SØN"],
    },
    common: {
      add: "Legg til",
      back: "Tilbake",
      cancel: "Avbryt",
      clear: "Tøm",
      clearFilters: "Fjern filtre",
      confirm: "Bekreft",
      createNew: "Opprett ny",
      close: "Lukk",
      edit: "Rediger",
      remove: "Fjern",
      removing: "Fjerner...",
      saving: "Lagrer...",
      search: "søk...",
      working: "Jobber...",
    },
    browser: {
      ingredientSearchPlaceholder: "søk i ingrediens...",
      noIngredientsFound: "Ingen ingredienser funnet",
      openIngredientFilter: "Åpne ingrediensfilter",
      searchIngredients: "Søk i ingredienser",
      searchIngredientsToInclude: "Søk i ingredienser som skal være med",
      searchRecipes: "Søk i oppskrifter",
    },
    cookbook: {
      allIngredients: "Alle ingredienser",
      allRecipes: "Alle oppskrifter",
      cookbookSections: "Kokebokseksjoner",
      create: "Opprett",
      createIntro: "Legg til oppskrifter, desserter, sauser, ingredienser og resten av kjøkkenbiblioteket.",
      couldNotLoadIngredients: "Kunne ikke laste ingredienser",
      couldNotLoadRecipes: "Kunne ikke laste oppskrifter",
      fetchingCookbook: "Henter kokeboken.",
      fetchingPantry: "Henter ingrediensene.",
      ingredientFilter: "Ingrediensfilter",
      ingredientSingular: "Ingrediens",
      ingredients: "Ingredienser",
      loadingIngredients: "Laster ingredienser",
      loadingRecipes: "Laster oppskrifter",
      noIngredientsFound: "Ingen ingredienser funnet",
      noRecipesFound: "Ingen oppskrifter funnet",
      openIngredientFilter: "Åpne ingrediensfilter",
      recipes: "Oppskrifter",
      recipeSingular: "Oppskrift",
      searchIngredients: "Søk i ingredienser",
      searchRecipes: "Søk i oppskrifter",
      addRecipeDetails: "Legg til oppskriftsdetaljer",
      hideRecipeDetails: "Skjul oppskriftsdetaljer",
      tryChangingSearch: "Prøv å endre søk eller filtre.",
    },
    enums: {
      dessertTypes: {
        Cake: "Kake",
        Pastry: "Bakverk",
        IceCream: "Is",
        Pudding: "Pudding",
        Cookie: "Kjeks",
        Pie: "Pai",
        Tart: "Terte",
        Chocolate: "Sjokolade",
        FruitDessert: "Fruktdessert",
        Other: "Annet",
      },
      ingredientTags: {
        Vegetable: "Grønnsak",
        Fruit: "Frukt",
        Chicken: "Kylling",
        Fish: "Fisk",
        Beef: "Storfe",
        Lamb: "Lam",
        Mince: "Kjøttdeig",
        Dairy: "Meieri",
        Grain: "Korn",
        Spice: "Krydder",
        Herb: "Urter",
        Sauce: "Saus",
        Pantry: "Tørrvare",
        Frozen: "Frossen",
        Other: "Annet",
        LeafyGreen: "Bladgrønt",
      },
      mealSlots: {
        Breakfast: "Frokost",
        Lunch: "Lunsj",
        Dinner: "Middag",
        Snack1: "Mellommåltid 1",
        Snack2: "Mellommåltid 2",
      },
      measurementUnits: {
        Gram: "g",
        Kilogram: "kg",
        Milliliter: "ml",
        Liter: "l",
        Teaspoon: "ts",
        Tablespoon: "ss",
        Cup: "kopp",
        Piece: "stk",
        Clove: "fedd",
        Pinch: "klype",
        ToTaste: "etter smak",
      },
      recipeTags: {
        Breakfast: "Frokost",
        Lunch: "Lunsj",
        Dinner: "Middag",
        Bowl: "Bolle",
        Grill: "Grill",
        Pasta: "Pasta",
        Vegetarian: "Vegetar",
        Soup: "Suppe",
        Stew: "Gryte",
        Salad: "Salat",
        Pizza: "Pizza",
        Sandwich: "Sandwich",
        Taco: "Taco",
        Curry: "Curry",
        Casserole: "Form",
        Other: "Annet",
      },
      recipeTypes: {
        Dish: "Hovedrett",
        Dessert: "Dessert",
        Sauce: "Saus",
        Dip: "Dipp",
        Side: "Tilbehør",
        SpiceMix: "Krydderblanding",
      },
      vitamins: {
        VitaminA: "Vitamin A",
        VitaminB: "Vitamin B",
        VitaminB12: "Vitamin B12",
        VitaminC: "Vitamin C",
        VitaminD: "Vitamin D",
        VitaminE: "Vitamin E",
        VitaminK: "Vitamin K",
      },
      viewModes: {
        week: "Uke",
        month: "Måned",
      },
    },
    filters: {
      cuisine: "Kjøkken",
      ingredientTags: "Ingredienstagger",
      includes: "inneholder",
      protein: "Protein",
      recipeFilters: "Oppskriftsfiltre",
      recipeType: "Oppskriftstype",
      tags: "Tags",
      type: "Type",
    },
    language: {
      english: "Engelsk",
      norwegian: "Norsk",
    },
    locale: "nb-NO",
    nav: {
      cookbook: "Kokeboka",
      home: "MATFLOTE hjem",
      planner: "Planlegger",
      primary: "Hovednavigasjon",
      settings: "Innstillinger",
    },
    planner: {
      addMeal: (slot) => `Legg til ${slot}`,
      addMealLower: (slot) => `Legg til ${slot.toLowerCase()}`,
      addSupplementsDescription: "Legg til opptil seks tilbehør, sauser, dipper, krydderblandinger eller salater.",
      backToMain: "Tilbake",
      chooseMainDish: "Velg hovedrett",
      chooseSides: "Velg tilbehør",
      chooseSupplements: "Velg tilbehør",
      clearCurrent: (range) => `Tøm ${range}`,
      clearRange: (range) => `Tøm denne ${range}?`,
      clearRangeBody: (range) => `Dette tømmer gjeldende ${range}.`,
      clearing: "Tømmer...",
      couldNotClear: (range) => `Kunne ikke tømme denne ${range}.`,
      couldNotGenerate: (range) => `Kunne ikke generere måltider for denne ${range}.`,
      couldNotLoadMealPlan: "Kunne ikke laste måltidsplanen.",
      dish: "Rett",
      editMeal: (slot, label) => `Rediger ${slot}: ${label}`,
      exportGroceryList: "Eksporter handleliste",
      generateCurrent: (range) => `Generer denne ${range}?`,
      generateMealPlan: "Generer måltidsplan",
      generateRangeBody: (range) =>
        `Dette genererer måltider for tomme plasser i gjeldende ${range}. Eksisterende måltider beholdes.`,
      generating: "Genererer...",
      mealCalendar: "Måltidskalender",
      mealPickerSearchPlaceholder: "søk i oppskrifter...",
      noMatchingRecipesFound: "Ingen oppskrifter funnet.",
      noMainDishRecipesFound: "Ingen hovedretter funnet.",
      nextRange: (range) => `Neste ${range}`,
      openMealSlot: "Åpne måltidsplass",
      plannerControls: "Planleggerkontroller",
      plannerView: "Planleggervisning",
      previousRange: (range) => `Forrige ${range}`,
      rangeNames: {
        week: "uke",
        month: "måned",
      },
      recipeFallback: (id) => `Oppskrift ${id}`,
      removeMeal: "Fjern måltid",
      removeMealBody: "Dette tømmer måltidsplassen.",
      removeMealTitle: "Fjerne dette måltidet?",
      couldNotRemoveMeal: "Kunne ikke fjerne dette måltidet. Prøv igjen.",
      couldNotSaveMeal: "Kunne ikke lagre dette måltidet. Prøv igjen.",
      removing: "Fjerner...",
      saveMeal: "Lagre måltid",
      selectMainDescription: "Velg én rett for denne måltidsplassen.",
      selectedCount: (count, max) => `${count}/${max} valgt`,
      weekLabel: (week) => `Uke ${week}`,
      yearLabel: (year) => `År ${year}`,
    },
    settings: {
      languageBody: "Velg hvilket språk grensesnittet skal bruke.",
      languageTitle: "Språk",
      pageTitle: "Innstillinger",
    },
    theme: {
      switchToDark: "Bytt til mørk modus",
      switchToLight: "Bytt til lys palett",
    },
  },
};

export const defaultLanguage: SupportedLanguage = "en";

export const supportedLanguages: SupportedLanguage[] = ["en", "nb"];
