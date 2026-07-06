import { useCallback, useMemo, useState, type FormEvent } from "react";
import IngredientThumbnail from "../IngredientThumbnail";
import { useCuisines, useIngredients, useRecipes } from "../../contexts";
import type { IIngredient, MeasurementUnit } from "../../interfaces/IIngredient";
import type { DessertType, IRecipe, RecipeTag, RecipeType } from "../../interfaces/IRecipe";
import { cuisineService, imageUploadService, recipeService } from "../../services";
import type { SiteTheme } from "../../styles/appStyles";
import {
  dessertTypes,
  measurementUnits,
  recipeTags,
  recipeTypes,
} from "./formOptions";
import CreatableSelect from "./CreatableSelect";
import ImageCropPicker from "./ImageCropPicker";
import { formatLabel, recipeBrowserStyles } from "./recipeBrowserStyles";

type RecipeCreateFormProps = {
  imageInputId: string;
  initialRecipe?: IRecipe | null;
  showRecipeDetails: boolean;
  theme: SiteTheme;
  onCreated: () => void;
  onCancel: () => void;
};

const RECIPE_NAME_MAX_LENGTH = 20;

function RecipeCreateForm({
  imageInputId,
  initialRecipe = null,
  showRecipeDetails,
  theme,
  onCreated,
  onCancel,
}: RecipeCreateFormProps) {
  const isEditing = initialRecipe !== null;
  const { cuisines, refreshCuisines } = useCuisines();
  const { ingredients } = useIngredients();
  const { refreshRecipes } = useRecipes();
  const [recipeType, setRecipeType] = useState<RecipeType>(initialRecipe?.recipeType ?? "Dish");
  const [name, setName] = useState(initialRecipe?.name ?? "");
  const [description, setDescription] = useState(initialRecipe?.description ?? "");
  const [instructions, setInstructions] = useState(initialRecipe?.instructions ?? "");
  const [selectedIngredients, setSelectedIngredients] = useState<SelectedRecipeIngredient[]>(
    initialRecipe?.ingredients.map((recipeIngredient) => ({
      ingredientId: recipeIngredient.ingredient.ingredientId,
      amount: recipeIngredient.amount?.toString() ?? "",
      unit: recipeIngredient.unit,
    })) ?? [],
  );
  const [selectedTags, setSelectedTags] = useState<RecipeTag[]>(
    initialRecipe && initialRecipe.tags.length > 0 ? [...initialRecipe.tags] : ["Dinner"],
  );
  const [cuisineId, setCuisineId] = useState<number | null>(initialRecipe?.cuisineId ?? null);
  const [dessertType, setDessertType] = useState<DessertType>(initialRecipe?.dessertType ?? "Other");
  const [ingredientSearch, setIngredientSearch] = useState("");
  const [croppedImageFile, setCroppedImageFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const selectedIngredientIds = useMemo(
    () => selectedIngredients.map((ingredient) => ingredient.ingredientId),
    [selectedIngredients],
  );

  const visibleIngredients = useMemo(() => {
    const normalizedSearch = ingredientSearch.trim().toLowerCase();
    const selectedIds = new Set(selectedIngredientIds);

    return ingredients
      .filter((ingredient) => ingredient.ingredientName.toLowerCase().includes(normalizedSearch))
      .sort((first, second) => {
        const firstIsSelected = selectedIds.has(first.ingredientId);
        const secondIsSelected = selectedIds.has(second.ingredientId);

        if (firstIsSelected !== secondIsSelected) {
          return firstIsSelected ? -1 : 1;
        }

        return first.ingredientName.localeCompare(second.ingredientName);
      });
  }, [ingredientSearch, ingredients, selectedIngredientIds]);

  const handleCroppedFileChange = useCallback((file: File | null) => {
    setCroppedImageFile(file);
  }, []);

  const submitRecipe = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();

    if (trimmedName.length === 0) {
      setError("Recipe needs a name.");
      return;
    }

    if (trimmedName.length > RECIPE_NAME_MAX_LENGTH) {
      setError(`Recipe name can be at most ${RECIPE_NAME_MAX_LENGTH} characters.`);
      return;
    }

    if (selectedTags.length === 0) {
      setError("Choose at least one recipe tag.");
      return;
    }

    if (selectedIngredients.length === 0) {
      setError("Choose at least one ingredient.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const upload = croppedImageFile === null
        ? null
        : await imageUploadService.upload(croppedImageFile, "recipes");

      const request = {
        recipeType,
        name: trimmedName,
        imageUrl: upload?.url ?? initialRecipe?.imageUrl ?? null,
        description: nullableText(description),
        instructions: nullableText(instructions),
        ingredients: selectedIngredients.map((ingredient) => ({
          ingredientId: ingredient.ingredientId,
          amount: nullableNumber(ingredient.amount),
          unit: ingredient.unit,
        })),
        tags: selectedTags,
        cuisineId: recipeType === "Dish" ? cuisineId : null,
        dessertType: recipeType === "Dessert" ? dessertType : null,
      };

      if (isEditing) {
        await recipeService.update(initialRecipe.recipeId, request);
      } else {
        await recipeService.create(request);
      }

      await refreshRecipes();
      onCreated();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not create recipe.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form className={recipeBrowserStyles.form} onSubmit={submitRecipe}>
      <div className={recipeBrowserStyles.formBodyScrollArea}>
        {error !== null && <p className={recipeBrowserStyles.statusError(theme)}>{error}</p>}

        {showRecipeDetails && (
          <div className={recipeBrowserStyles.detailsPanel(theme)}>
            <div className={recipeBrowserStyles.formGrid}>
              <label className={recipeBrowserStyles.field}>
                <span className={recipeBrowserStyles.label(theme)}>Description</span>
                <textarea
                  className={recipeBrowserStyles.textArea(theme)}
                  maxLength={600}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </label>

              <label className={recipeBrowserStyles.field}>
                <span className={recipeBrowserStyles.label(theme)}>Instructions</span>
                <textarea
                  className={recipeBrowserStyles.textArea(theme)}
                  value={instructions}
                  onChange={(event) => setInstructions(event.target.value)}
                />
              </label>
            </div>
          </div>
        )}

        <div className={recipeBrowserStyles.recipeCreateScrollArea(theme)}>
          <div className={recipeBrowserStyles.recipeCreateTopGrid}>
            <div className={recipeBrowserStyles.recipePrimaryFields}>
              <label className={recipeBrowserStyles.field}>
                <span className={recipeBrowserStyles.label(theme)}>
                  Recipe type<span className={recipeBrowserStyles.requiredMark(theme)}> *</span>
                </span>
                <select
                  className={recipeBrowserStyles.textField(theme)}
                  disabled={isEditing}
                  value={recipeType}
                  onChange={(event) => setRecipeType(event.target.value as RecipeType)}
                >
                  {recipeTypes.map((type) => (
                    <option key={type} value={type}>
                      {formatLabel(type)}
                    </option>
                  ))}
                </select>
              </label>

              <label className={recipeBrowserStyles.field}>
                <span className={recipeBrowserStyles.label(theme)}>
                  Name<span className={recipeBrowserStyles.requiredMark(theme)}> *</span>
                  <span className={recipeBrowserStyles.inlineHint(theme)}>
                    {name.length}/{RECIPE_NAME_MAX_LENGTH}
                  </span>
                </span>
                <input
                  className={recipeBrowserStyles.textField(theme)}
                  maxLength={RECIPE_NAME_MAX_LENGTH}
                  required
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </label>

              {recipeType === "Dish" && (
                <CreatableSelect
                  createLabel="Create New"
                  label="Cuisine"
                  options={cuisines.map((cuisine) => ({ id: cuisine.cuisineId, name: cuisine.name }))}
                  placeholder="Select cuisine"
                  theme={theme}
                  value={cuisineId}
                  onChange={setCuisineId}
                  onCreate={async (name) => {
                    const cuisine = await cuisineService.create({ name });
                    await refreshCuisines();
                    return { id: cuisine.cuisineId, name: cuisine.name };
                  }}
                />
              )}

              {recipeType === "Dessert" && (
                <label className={recipeBrowserStyles.field}>
                  <span className={recipeBrowserStyles.label(theme)}>Dessert type</span>
                  <select
                    className={recipeBrowserStyles.textField(theme)}
                    value={dessertType}
                    onChange={(event) => setDessertType(event.target.value as DessertType)}
                  >
                    {dessertTypes.map((value) => (
                      <option key={value} value={value}>
                        {formatLabel(value)}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>

            <div className={recipeBrowserStyles.recipeImageField}>
              <label className={recipeBrowserStyles.imageUploadFloatingButton(theme)} htmlFor={imageInputId}>
                <ImageUploadIcon />
                Choose file
              </label>
              <ImageCropPicker
                inputId={imageInputId}
                initialImageUrl={initialRecipe?.imageUrl}
                theme={theme}
                onCroppedFileChange={handleCroppedFileChange}
              />
            </div>
          </div>

          <section className={recipeBrowserStyles.field}>
            <span className={recipeBrowserStyles.label(theme)}>
              Tags<span className={recipeBrowserStyles.requiredMark(theme)}> *</span>
              <span className={recipeBrowserStyles.inlineHint(theme)}>Pick 1 or more</span>
            </span>
            <div className={`${recipeBrowserStyles.tagCheckboxGrid} ${recipeBrowserStyles.checkboxGridPanel(theme)}`}>
              {recipeTags.map((tag) => (
                <CheckboxRow
                  checked={selectedTags.includes(tag)}
                  key={tag}
                  label={formatLabel(tag)}
                  theme={theme}
                  onChange={() => setSelectedTags((currentTags) => toggleValue(currentTags, tag))}
                />
              ))}
            </div>
          </section>

          <section className={recipeBrowserStyles.field}>
            <span className={recipeBrowserStyles.label(theme)}>
              Ingredients<span className={recipeBrowserStyles.requiredMark(theme)}> *</span>
            </span>
            <input
              className={recipeBrowserStyles.textField(theme)}
              placeholder="search ingredients..."
              type="search"
              value={ingredientSearch}
              onChange={(event) => setIngredientSearch(event.target.value)}
            />
            <div className={`${recipeBrowserStyles.recipeIngredientPickerGrid} ${recipeBrowserStyles.checkboxGridPanel(theme)}`}>
              {visibleIngredients.length === 0 ? (
                <p className={recipeBrowserStyles.helperText(theme)}>No ingredients found.</p>
              ) : (
                visibleIngredients.map((ingredient) => (
                  <IngredientPickerRow
                    amount={getSelectedIngredient(selectedIngredients, ingredient.ingredientId)?.amount ?? ""}
                    ingredient={ingredient}
                    key={ingredient.ingredientId}
                    selected={selectedIngredientIds.includes(ingredient.ingredientId)}
                    theme={theme}
                    unit={getSelectedIngredient(selectedIngredients, ingredient.ingredientId)?.unit ?? "Gram"}
                    onAmountChange={(amount) =>
                      setSelectedIngredients((currentIngredients) =>
                        updateSelectedIngredient(currentIngredients, ingredient.ingredientId, { amount }),
                      )
                    }
                    onToggle={() =>
                      setSelectedIngredients((currentIngredients) =>
                        toggleRecipeIngredient(currentIngredients, ingredient.ingredientId),
                      )
                    }
                    onUnitChange={(unit) =>
                      setSelectedIngredients((currentIngredients) =>
                        updateSelectedIngredient(currentIngredients, ingredient.ingredientId, { unit }),
                      )
                    }
                  />
                ))
              )}
            </div>
          </section>
        </div>
      </div>

      <div className={recipeBrowserStyles.formActions}>
        <button className={recipeBrowserStyles.secondaryButton(theme)} disabled={isSaving} type="button" onClick={onCancel}>
          Cancel
        </button>
        <button className={recipeBrowserStyles.primaryButton(theme)} disabled={isSaving} type="submit">
          {isSaving ? "Saving..." : isEditing ? "Save recipe" : "Create recipe"}
        </button>
      </div>
    </form>
  );
}

function ImageUploadIcon() {
  return (
    <svg
      aria-hidden="true"
      className={recipeBrowserStyles.imageUploadIcon}
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5v-11Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="m7 16 3.2-3.2a1.1 1.1 0 0 1 1.6 0L14 15l1.2-1.2a1.1 1.1 0 0 1 1.6 0L20 17"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M15 4v6m0-6 2 2m-2-2-2 2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
    </svg>
  );
}

type CheckboxRowProps = {
  checked: boolean;
  label: string;
  theme: SiteTheme;
  onChange: () => void;
};

function CheckboxRow({ checked, label, theme, onChange }: CheckboxRowProps) {
  return (
    <label className={recipeBrowserStyles.checkboxLabel(theme)}>
      <input
        checked={checked}
        className={recipeBrowserStyles.checkbox}
        type="checkbox"
        onChange={onChange}
      />
      {label}
    </label>
  );
}

type IngredientPickerRowProps = {
  amount: string;
  ingredient: IIngredient;
  selected: boolean;
  theme: SiteTheme;
  unit: MeasurementUnit;
  onAmountChange: (value: string) => void;
  onToggle: () => void;
  onUnitChange: (value: MeasurementUnit) => void;
};

function IngredientPickerRow({
  amount,
  ingredient,
  selected,
  theme,
  unit,
  onAmountChange,
  onToggle,
  onUnitChange,
}: IngredientPickerRowProps) {
  return (
    <div className={recipeBrowserStyles.recipeIngredientPickerRow}>
      <input
        aria-label={`Select ${ingredient.ingredientName}`}
        checked={selected}
        className={recipeBrowserStyles.checkbox}
        type="checkbox"
        onChange={onToggle}
      />
      <IngredientThumbnail
        className={recipeBrowserStyles.recipeIngredientThumbnailCompact}
        ingredient={ingredient}
        selected={selected}
        theme={theme}
        onClick={onToggle}
      />
      <input
        aria-label={`${ingredient.ingredientName} amount`}
        className={recipeBrowserStyles.compactTextField(theme)}
        disabled={!selected}
        min="0"
        placeholder="amount"
        step="0.01"
        type="number"
        value={amount}
        onChange={(event) => onAmountChange(event.target.value)}
      />
      <select
        aria-label={`${ingredient.ingredientName} unit`}
        className={recipeBrowserStyles.compactTextField(theme)}
        disabled={!selected}
        value={unit}
        onChange={(event) => onUnitChange(event.target.value as MeasurementUnit)}
      >
        {measurementUnits.map((value) => (
          <option key={value} value={value}>
            {formatLabel(value)}
          </option>
        ))}
      </select>
    </div>
  );
}

type SelectedRecipeIngredient = {
  ingredientId: number;
  amount: string;
  unit: MeasurementUnit;
};

function getSelectedIngredient(ingredients: SelectedRecipeIngredient[], ingredientId: number) {
  return ingredients.find((ingredient) => ingredient.ingredientId === ingredientId);
}

function toggleRecipeIngredient(ingredients: SelectedRecipeIngredient[], ingredientId: number) {
  if (ingredients.some((ingredient) => ingredient.ingredientId === ingredientId)) {
    return ingredients.filter((ingredient) => ingredient.ingredientId !== ingredientId);
  }

  return [
    ...ingredients,
    {
      ingredientId,
      amount: "",
      unit: "Gram" as MeasurementUnit,
    },
  ];
}

function updateSelectedIngredient(
  ingredients: SelectedRecipeIngredient[],
  ingredientId: number,
  value: Partial<Omit<SelectedRecipeIngredient, "ingredientId">>,
) {
  if (!ingredients.some((ingredient) => ingredient.ingredientId === ingredientId)) {
    return ingredients;
  }

  return ingredients.map((ingredient) =>
    ingredient.ingredientId === ingredientId
      ? {
          ...ingredient,
          ...value,
        }
      : ingredient,
  );
}

function toggleValue<T>(values: T[], value: T) {
  return values.includes(value)
    ? values.filter((currentValue) => currentValue !== value)
    : [...values, value];
}

function nullableText(value: string) {
  const trimmedValue = value.trim();
  return trimmedValue.length === 0 ? null : trimmedValue;
}

function nullableNumber(value: string) {
  const trimmedValue = value.trim();
  if (trimmedValue.length === 0) {
    return null;
  }

  const parsedValue = Number(trimmedValue);
  return Number.isFinite(parsedValue) ? parsedValue : null;
}

export default RecipeCreateForm;
