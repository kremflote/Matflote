import { useCallback, useMemo, useState, type FormEvent } from "react";
import { useCuisines, useIngredients, useLanguage, useRecipes } from "../../contexts";
import type { DessertType, IRecipe, RecipeTag, RecipeType } from "../../interfaces/IRecipe";
import { cuisineService, imageUploadService, recipeService } from "../../services";
import type { SiteTheme } from "../../styles/appStyles";
import RecipeThumbnail from "../RecipeThumbnail";
import {
  dessertTypes,
  recipeTagGroups,
  recipeTags,
  recipeTypes,
} from "./formOptions";
import { GroupedCheckboxPanel } from "./BrowserFilterGroups";
import CreatableSelect from "./CreatableSelect";
import ImageCropPicker from "./ImageCropPicker";
import Modal from "../Modal";
import {
  RecipeIngredientPickerContent,
  RecipeIngredientPickerDialog,
  SelectedIngredientCapsules,
} from "./RecipeIngredientPicker";
import { recipeBrowserStyles } from "./recipeBrowserStyles";
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

const RECIPE_NAME_MAX_LENGTH = 30;

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
  const { recipes, refreshRecipes } = useRecipes();
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
  const [selectedComponentIds, setSelectedComponentIds] = useState<number[]>(
    initialRecipe?.components
      .slice()
      .sort((first, second) => first.sortOrder - second.sortOrder)
      .map((component) => component.recipeId) ?? [],
  );
  const [selectedTags, setSelectedTags] = useState<RecipeTag[]>(
    initialRecipe?.tags.filter((tag) => recipeTags.includes(tag)) ?? [],
  );
  const [cuisineId, setCuisineId] = useState<number | null>(initialRecipe?.cuisineId ?? null);
  const [dessertType, setDessertType] = useState<DessertType>(initialRecipe?.dessertType ?? "Other");
  const [ingredientSearch, setIngredientSearch] = useState("");
  const [isIngredientPickerOpen, setIsIngredientPickerOpen] = useState(false);
  const [isComponentPickerOpen, setIsComponentPickerOpen] = useState(false);
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

  const componentRecipeOptions = useMemo(
    () =>
      recipes
        .filter((recipe) =>
          recipe.recipeId !== initialRecipe?.recipeId &&
          (recipe.recipeType === "Sauce" ||
            recipe.recipeType === "Dip" ||
            recipe.recipeType === "Side" ||
            recipe.recipeType === "SpiceMix"),
        )
        .sort((first, second) => first.name.localeCompare(second.name)),
    [initialRecipe?.recipeId, recipes],
  );
  const selectedComponentRecipes = useMemo(
    () =>
      selectedComponentIds
        .map((recipeId) => recipes.find((recipe) => recipe.recipeId === recipeId))
        .filter((recipe): recipe is IRecipe => recipe !== undefined),
    [recipes, selectedComponentIds],
  );

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
      setError(t.cookbook.recipeNeedsName);
      return;
    }

    if (trimmedName.length > RECIPE_NAME_MAX_LENGTH) {
      setError(t.cookbook.recipeNameTooLong(RECIPE_NAME_MAX_LENGTH));
      return;
    }

    if (selectedIngredients.length === 0) {
      setError(t.cookbook.chooseAtLeastOneIngredient);
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
        components: selectedComponentIds.map((recipeId, index) => ({
          recipeId,
          sortOrder: index + 1,
        })),
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
      setError(caughtError instanceof Error ? caughtError.message : t.cookbook.couldNotCreateRecipe);
    } finally {
      setIsSaving(false);
    }
  };

  const renderRecipeTypeField = (className = "") => (
    <label className={`${recipeBrowserStyles.field} ${className}`}>
      <span className={recipeBrowserStyles.label(theme)}>
        {t.cookbook.recipeType}<span className={recipeBrowserStyles.requiredMark(theme)}> *</span>
      </span>
      <select
        className={recipeBrowserStyles.textField(theme)}
        disabled={isEditing}
        value={recipeType}
        onChange={(event) => setRecipeType(event.target.value as RecipeType)}
      >
        {recipeTypes.map((type) => (
          <option key={type} value={type}>
            {t.enums.recipeTypes[type]}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <form className={recipeBrowserStyles.form} onSubmit={submitRecipe}>
      <div className={recipeBrowserStyles.formBodyScrollArea}>
        {error !== null && <p className={recipeBrowserStyles.statusError(theme)}>{error}</p>}

        <div className={recipeBrowserStyles.recipeCreateScrollArea(theme)}>
          <div className={recipeBrowserStyles.createFormTopGrid}>
            <div className={recipeBrowserStyles.createFormPrimaryFields}>
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

              {renderRecipeTypeField()}

              {recipeType === "Dish" && (
                <CreatableSelect
                  createLabel="Create New"
                  label={t.cookbook.cuisine}
                  options={cuisines.map((cuisine) => ({ id: cuisine.cuisineId, name: cuisine.name }))}
                  placeholder={t.cookbook.selectCuisine}
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
                  <span className={recipeBrowserStyles.label(theme)}>{t.cookbook.dessertType}</span>
                  <select
                    className={recipeBrowserStyles.textField(theme)}
                    value={dessertType}
                    onChange={(event) => setDessertType(event.target.value as DessertType)}
                  >
                    {dessertTypes.map((value) => (
                      <option key={value} value={value}>
                        {t.enums.dessertTypes[value]}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
            <div className={recipeBrowserStyles.createImageField}>
              <span className={`${recipeBrowserStyles.label(theme)} ${recipeBrowserStyles.createImageLabel}`}>
                {t.cookbook.image}
              </span>
              <div className={recipeBrowserStyles.createImageControl}>
                <ImageCropPicker
                  inputId={imageInputId}
                  initialImageUrl={initialRecipe?.imageUrl}
                  theme={theme}
                  onCroppedFileChange={handleCroppedFileChange}
                />
              </div>
            </div>
          </div>

          <section className={recipeBrowserStyles.field}>
            <span className={recipeBrowserStyles.label(theme)}>
              {t.cookbook.tags}
              <span className={recipeBrowserStyles.inlineHint(theme)}>{t.cookbook.optional}</span>
            </span>
            <GroupedCheckboxPanel
              formatValue={(value) => t.enums.recipeTags[value]}
              groupLabels={t.filters.recipeTagGroups}
              groups={recipeTagGroups}
              panelClassName={`${recipeBrowserStyles.groupedTagPanel} ${recipeBrowserStyles.checkboxGridPanel(theme)}`}
              selectedValues={selectedTags}
              theme={theme}
              onToggle={(value) => setSelectedTags((currentTags) => toggleValue(currentTags, value))}
            />
          </section>

          <section className={recipeBrowserStyles.field}>
            <span className={recipeBrowserStyles.label(theme)}>
              {t.cookbook.addSides}
              <span className={recipeBrowserStyles.inlineHint(theme)}>
                {t.cookbook.addSidesHelp}
              </span>
            </span>
            <button
              className={recipeBrowserStyles.detailsToggleFull(theme)}
              type="button"
              onClick={() => setIsComponentPickerOpen(true)}
            >
              {t.cookbook.addSides}
            </button>
            {selectedComponentRecipes.length === 0 ? (
              <p className={recipeBrowserStyles.helperText(theme)}>{t.cookbook.noSidesAdded}</p>
            ) : (
              <div className={recipeBrowserStyles.selectedComponentThumbnails}>
                {selectedComponentRecipes.map((componentRecipe) => (
                  <div className={recipeBrowserStyles.selectedComponentThumbnail} key={componentRecipe.recipeId}>
                    <RecipeThumbnail
                      className={recipeBrowserStyles.selectedComponentThumbnailCard}
                      interactiveEffect={false}
                      recipe={{
                        name: componentRecipe.name,
                        imageUrl: componentRecipe.imageUrl,
                        subtitle: t.enums.recipeTypes[componentRecipe.recipeType],
                      }}
                      textScale="micro"
                      theme={theme}
                      onClick={() =>
                        setSelectedComponentIds((currentIds) =>
                          currentIds.filter((recipeId) => recipeId !== componentRecipe.recipeId),
                        )
                      }
                    />
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className={recipeBrowserStyles.field}>
            <span className={recipeBrowserStyles.label(theme)}>
              {t.cookbook.ingredients}<span className={recipeBrowserStyles.requiredMark(theme)}> *</span>
            </span>
            <div className={recipeBrowserStyles.mobileIngredientSummary}>
              <button className={recipeBrowserStyles.detailsToggleFull(theme)} type="button" onClick={openMobileIngredientPicker}>
                {t.cookbook.chooseIngredients}
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
                  <span className={recipeBrowserStyles.label(theme)}>{t.cookbook.description}</span>
                  <textarea
                    className={recipeBrowserStyles.textArea(theme)}
                    maxLength={600}
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                  />
                </label>

                <label className={recipeBrowserStyles.field}>
                  <span className={recipeBrowserStyles.label(theme)}>{t.cookbook.instructions}</span>
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
          {t.common.cancel}
        </button>
        <button className={`${recipeBrowserStyles.primaryButton(theme)} ${recipeBrowserStyles.formActionButton}`} disabled={isSaving} type="submit">
          {isSaving ? t.common.saving : isEditing ? t.cookbook.saveRecipe : t.cookbook.createRecipe}
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
      {isComponentPickerOpen && (
        <RecipeComponentPickerDialog
          recipes={componentRecipeOptions}
          selectedRecipeIds={selectedComponentIds}
          theme={theme}
          onCancel={() => setIsComponentPickerOpen(false)}
          onConfirm={() => setIsComponentPickerOpen(false)}
          onToggle={(recipeId) =>
            setSelectedComponentIds((currentIds) =>
              currentIds.includes(recipeId)
                ? currentIds.filter((currentId) => currentId !== recipeId)
                : [...currentIds, recipeId],
            )
          }
        />
      )}
    </form>
  );
}

type RecipeComponentPickerDialogProps = {
  recipes: IRecipe[];
  selectedRecipeIds: number[];
  theme: SiteTheme;
  onCancel: () => void;
  onConfirm: () => void;
  onToggle: (recipeId: number) => void;
};

function RecipeComponentPickerDialog({
  recipes,
  selectedRecipeIds,
  theme,
  onCancel,
  onConfirm,
  onToggle,
}: RecipeComponentPickerDialogProps) {
  const { t } = useLanguage();

  return (
    <Modal
      backdropClassName={recipeBrowserStyles.nestedModalBackdrop}
      bodyClassName={recipeBrowserStyles.nestedIngredientModalBody}
      closeButtonClassName={recipeBrowserStyles.modalCloseAligned(theme)}
      closeLabel={t.common.close}
      footer={
        <>
          <button className={`${recipeBrowserStyles.secondaryButton(theme)} ${recipeBrowserStyles.formActionButton}`} type="button" onClick={onCancel}>
            {t.common.cancel}
          </button>
          <button className={`${recipeBrowserStyles.primaryButton(theme)} ${recipeBrowserStyles.formActionButton}`} type="button" onClick={onConfirm}>
            {t.common.confirm}
          </button>
        </>
      }
      footerClassName={recipeBrowserStyles.formActions}
      headerClassName={recipeBrowserStyles.modalHeader}
      panelClassName={recipeBrowserStyles.nestedIngredientModalPanel(theme)}
      title={t.cookbook.addSides}
      titleClassName={recipeBrowserStyles.modalTitle}
      onClose={onCancel}
    >
      {recipes.length === 0 ? (
        <p className={recipeBrowserStyles.helperText(theme)}>{t.cookbook.createSideRecipeFirst}</p>
      ) : (
        <div className={recipeBrowserStyles.componentRecipeBrowserGrid}>
          {recipes.map((recipe) => {
            const selected = selectedRecipeIds.includes(recipe.recipeId);

            return (
              <RecipeThumbnail
                ariaPressed={selected}
                className={selected ? recipeBrowserStyles.componentRecipeSelected : ""}
                interactiveEffect={false}
                key={recipe.recipeId}
                recipe={{
                  name: recipe.name,
                  imageUrl: recipe.imageUrl,
                  subtitle: t.enums.recipeTypes[recipe.recipeType],
                }}
                textScale="compact"
                theme={theme}
                onClick={() => onToggle(recipe.recipeId)}
              />
            );
          })}
        </div>
      )}
    </Modal>
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
