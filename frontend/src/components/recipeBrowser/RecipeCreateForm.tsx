import { useCallback, useMemo, useState, type FormEvent } from "react";
import { useCuisines, useIngredients, useLanguage, useRecipes } from "../../contexts";
import type { DessertType, IRecipe, RecipeTag, RecipeType } from "../../interfaces/IRecipe";
import { cuisineService, imageUploadService, recipeService } from "../../services";
import type { SiteTheme } from "../../styles/appStyles";
import {
  dessertTypes,
  recipeTags,
  recipeTypes,
} from "./formOptions";
import CreatableSelect from "./CreatableSelect";
import ImageCropPicker from "./ImageCropPicker";
import {
  RecipeIngredientPickerContent,
  RecipeIngredientPickerDialog,
  SelectedIngredientCapsules,
} from "./RecipeIngredientPicker";
import { formatLabel, recipeBrowserStyles } from "./recipeBrowserStyles";
import {
  toggleRecipeIngredient,
  updateSelectedIngredient,
  type SelectedRecipeIngredient,
} from "./recipeIngredientSelection";

type RecipeCreateFormProps = {
  imageInputId: string;
  initialRecipe?: IRecipe | null;
  showRecipeDetails: boolean;
  theme: SiteTheme;
  onToggleRecipeDetails?: () => void;
  onCreated: () => void;
  onCancel: () => void;
};

const RECIPE_NAME_MAX_LENGTH = 20;

function RecipeCreateForm({
  imageInputId,
  initialRecipe = null,
  showRecipeDetails,
  theme,
  onToggleRecipeDetails,
  onCreated,
  onCancel,
}: RecipeCreateFormProps) {
  const isEditing = initialRecipe !== null;
  const { t } = useLanguage();
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
      preparation: recipeIngredient.preparation,
    })) ?? [],
  );
  const [selectedTags, setSelectedTags] = useState<RecipeTag[]>(
    initialRecipe?.tags.filter((tag) => recipeTags.includes(tag)) ?? [],
  );
  const [cuisineId, setCuisineId] = useState<number | null>(initialRecipe?.cuisineId ?? null);
  const [dessertType, setDessertType] = useState<DessertType>(initialRecipe?.dessertType ?? "Other");
  const [ingredientSearch, setIngredientSearch] = useState("");
  const [isIngredientPickerOpen, setIsIngredientPickerOpen] = useState(false);
  const [mobileIngredientDraft, setMobileIngredientDraft] = useState<SelectedRecipeIngredient[]>([]);
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

  const mobileSelectedIngredientIds = useMemo(
    () => mobileIngredientDraft.map((ingredient) => ingredient.ingredientId),
    [mobileIngredientDraft],
  );

  const visibleMobileIngredients = useMemo(() => {
    const normalizedSearch = ingredientSearch.trim().toLowerCase();
    const selectedIds = new Set(mobileSelectedIngredientIds);

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
  }, [ingredientSearch, ingredients, mobileSelectedIngredientIds]);

  const handleCroppedFileChange = useCallback((file: File | null) => {
    setCroppedImageFile(file);
  }, []);

  const openMobileIngredientPicker = () => {
    setMobileIngredientDraft(selectedIngredients);
    setIsIngredientPickerOpen(true);
  };

  const confirmMobileIngredients = () => {
    setSelectedIngredients(mobileIngredientDraft);
    setIsIngredientPickerOpen(false);
  };

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
          preparation: ingredient.preparation,
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
            <div className={recipeBrowserStyles.mobileIngredientSummary}>
              <button className={recipeBrowserStyles.detailsToggleFull(theme)} type="button" onClick={openMobileIngredientPicker}>
                Choose ingredients
              </button>
              <SelectedIngredientCapsules
                ingredients={ingredients}
                selectedIngredients={selectedIngredients}
                theme={theme}
              />
            </div>
            <div className={recipeBrowserStyles.desktopIngredientPicker}>
              <RecipeIngredientPickerContent
                ingredientSearch={ingredientSearch}
                ingredients={visibleIngredients}
                preparationLabels={t.enums.ingredientPreparations}
                selectedIngredientIds={selectedIngredientIds}
                selectedIngredients={selectedIngredients}
                theme={theme}
                onAmountChange={(ingredientId, amount) =>
                  setSelectedIngredients((currentIngredients) =>
                    updateSelectedIngredient(currentIngredients, ingredientId, { amount }),
                  )
                }
                onPreparationChange={(ingredientId, preparation) =>
                  setSelectedIngredients((currentIngredients) =>
                    updateSelectedIngredient(currentIngredients, ingredientId, { preparation }),
                  )
                }
                onSearchChange={setIngredientSearch}
                onToggle={(ingredientId) =>
                  setSelectedIngredients((currentIngredients) =>
                    toggleRecipeIngredient(currentIngredients, ingredientId),
                  )
                }
                onUnitChange={(ingredientId, unit) =>
                  setSelectedIngredients((currentIngredients) =>
                    updateSelectedIngredient(currentIngredients, ingredientId, { unit }),
                  )
                }
              />
            </div>
          </section>

          {onToggleRecipeDetails && (
            <button
              aria-expanded={showRecipeDetails}
              className={recipeBrowserStyles.detailsToggleFull(theme)}
              type="button"
              onClick={onToggleRecipeDetails}
            >
              {showRecipeDetails ? t.cookbook.hideRecipeDetails : t.cookbook.addRecipeDetails}
            </button>
          )}

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
        </div>
      </div>

      <div className={recipeBrowserStyles.formActions}>
        <button className={`${recipeBrowserStyles.secondaryButton(theme)} ${recipeBrowserStyles.formActionButton}`} disabled={isSaving} type="button" onClick={onCancel}>
          Cancel
        </button>
        <button className={`${recipeBrowserStyles.primaryButton(theme)} ${recipeBrowserStyles.formActionButton}`} disabled={isSaving} type="submit">
          {isSaving ? "Saving..." : isEditing ? "Save recipe" : "Create recipe"}
        </button>
      </div>
      {isIngredientPickerOpen && (
        <RecipeIngredientPickerDialog
          closeLabel={t.common.close}
          ingredientSearch={ingredientSearch}
          ingredients={visibleMobileIngredients}
          preparationLabels={t.enums.ingredientPreparations}
          selectedIngredientIds={mobileSelectedIngredientIds}
          selectedIngredients={mobileIngredientDraft}
          theme={theme}
          onAmountChange={(ingredientId, amount) =>
            setMobileIngredientDraft((currentIngredients) =>
              updateSelectedIngredient(currentIngredients, ingredientId, { amount }),
            )
          }
          onCancel={() => setIsIngredientPickerOpen(false)}
          onConfirm={confirmMobileIngredients}
          onPreparationChange={(ingredientId, preparation) =>
            setMobileIngredientDraft((currentIngredients) =>
              updateSelectedIngredient(currentIngredients, ingredientId, { preparation }),
            )
          }
          onSearchChange={setIngredientSearch}
          onToggle={(ingredientId) =>
            setMobileIngredientDraft((currentIngredients) =>
              toggleRecipeIngredient(currentIngredients, ingredientId),
            )
          }
          onUnitChange={(ingredientId, unit) =>
            setMobileIngredientDraft((currentIngredients) =>
              updateSelectedIngredient(currentIngredients, ingredientId, { unit }),
            )
          }
        />
      )}
    </form>
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
