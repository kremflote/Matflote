import { useCallback, useMemo, useState, type FormEvent } from "react";
import { useIngredients, useLanguage, useRecipeTagCategories, useRecipes } from "../../contexts";
import type { DessertType, IRecipe, RecipeTag, RecipeType } from "../../interfaces/IRecipe";
import { imageUploadService, recipeService, recipeTagCategoryService } from "../../services";
import type { SiteTheme } from "../../styles/appStyles";
import {
  dessertTypes,
  formatRecipeTagCategoryName,
  getRecipeTagGroupsWithCustomTags,
  recipeTagGroups,
  recipeTypes,
} from "./formOptions";
import { GroupedCheckboxPanel } from "./BrowserFilterGroups";
import ImageCropPicker from "./ImageCropPicker";
import Modal from "../Modal";
import RecipeTagCreateDialog from "./RecipeTagCreateDialog";
import {
  RecipeComponentPickerContent,
  RecipeIngredientPickerContent,
  RecipeIngredientPickerDialog,
  SelectedIngredientCapsules,
  SelectedRecipeComponentCapsules,
} from "./RecipeIngredientPicker";
import { formatLabel, recipeBrowserStyles } from "./recipeBrowserStyles";
import {
  toggleRecipeComponent,
  toggleRecipeIngredient,
  updateSelectedRecipeComponent,
  updateSelectedIngredient,
  type SelectedRecipeComponent,
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
type RecipeLinePickerMode = "ingredients" | "recipes";

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
  const { ingredients } = useIngredients();
  const { recipes, refreshRecipes } = useRecipes();
  const { recipeTagCategories, refreshRecipeTagCategories } = useRecipeTagCategories();
  const [recipeType, setRecipeType] = useState<RecipeType>(initialRecipe?.recipeType ?? "Dish");
  const [name, setName] = useState(initialRecipe?.name ?? "");
  const [portions, setPortions] = useState((initialRecipe?.portions ?? 1).toString());
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
  const [selectedComponents, setSelectedComponents] = useState<SelectedRecipeComponent[]>(
    initialRecipe?.components
      .slice()
      .sort((first, second) => first.sortOrder - second.sortOrder)
      .map((component) => ({
        recipeId: component.recipeId,
        amount: component.amount.toString(),
        unit: component.unit,
        preparation: component.preparation,
      })) ?? [],
  );
  const [selectedTags, setSelectedTags] = useState<RecipeTag[]>(
    initialRecipe?.tags ?? [],
  );
  const [isTagCreateOpen, setIsTagCreateOpen] = useState(false);
  const [dessertType, setDessertType] = useState<DessertType>(initialRecipe?.dessertType ?? "Other");
  const [ingredientSearch, setIngredientSearch] = useState("");
  const [recipeSearch, setRecipeSearch] = useState("");
  const [recipeLinePickerMode, setRecipeLinePickerMode] = useState<RecipeLinePickerMode>("ingredients");
  const [isIngredientPickerOpen, setIsIngredientPickerOpen] = useState(false);
  const [isConversionHelperOpen, setIsConversionHelperOpen] = useState(false);
  const [mobileIngredientDraft, setMobileIngredientDraft] = useState<SelectedRecipeIngredient[]>([]);
  const [mobileComponentDraft, setMobileComponentDraft] = useState<SelectedRecipeComponent[]>([]);
  const [croppedImageFile, setCroppedImageFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const selectedIngredientIds = useMemo(
    () => selectedIngredients.map((ingredient) => ingredient.ingredientId),
    [selectedIngredients],
  );
  const selectedComponentIds = useMemo(
    () => selectedComponents.map((component) => component.recipeId),
    [selectedComponents],
  );
  const knownRecipeTags = (recipeTagCategories.length === 0
    ? recipeTagGroups.flatMap((group) => group.values)
    : recipeTagCategories.flatMap((category) => category.tags)) as RecipeTag[];
  const existingCustomRecipeTags = recipes
    .flatMap((recipe) => recipe.tags)
    .filter((tag) => !knownRecipeTags.includes(tag));
  const customRecipeTags = Array.from(new Set([
    ...existingCustomRecipeTags,
    ...selectedTags.filter((tag) => !knownRecipeTags.includes(tag)),
  ]));
  const groupedRecipeTags = getRecipeTagGroupsWithCustomTags(customRecipeTags, "style", recipeTagCategories);
  const recipeTagGroupLabels = recipeTagCategories.length === 0
    ? t.filters.recipeTagGroups
    : Object.fromEntries(
        recipeTagCategories.map((category) => [
          category.recipeTagCategoryId.toString(),
          formatRecipeTagCategoryName(category.name, t.filters.recipeTagGroups),
        ]),
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
        .filter((recipe) => recipe.recipeId !== initialRecipe?.recipeId)
        .sort((first, second) => first.name.localeCompare(second.name)),
    [initialRecipe?.recipeId, recipes],
  );

  const visibleComponentRecipes = useMemo(() => {
    const normalizedSearch = recipeSearch.trim().toLowerCase();
    const selectedIds = new Set(selectedComponentIds);

    return componentRecipeOptions
      .filter((recipe) => recipe.name.toLowerCase().includes(normalizedSearch))
      .sort((first, second) => {
        const firstIsSelected = selectedIds.has(first.recipeId);
        const secondIsSelected = selectedIds.has(second.recipeId);

        if (firstIsSelected !== secondIsSelected) {
          return firstIsSelected ? -1 : 1;
        }

        return first.name.localeCompare(second.name);
      });
  }, [componentRecipeOptions, recipeSearch, selectedComponentIds]);

  const mobileSelectedComponentIds = useMemo(
    () => mobileComponentDraft.map((component) => component.recipeId),
    [mobileComponentDraft],
  );

  const visibleMobileComponentRecipes = useMemo(() => {
    const normalizedSearch = recipeSearch.trim().toLowerCase();
    const selectedIds = new Set(mobileSelectedComponentIds);

    return componentRecipeOptions
      .filter((recipe) => recipe.name.toLowerCase().includes(normalizedSearch))
      .sort((first, second) => {
        const firstIsSelected = selectedIds.has(first.recipeId);
        const secondIsSelected = selectedIds.has(second.recipeId);

        if (firstIsSelected !== secondIsSelected) {
          return firstIsSelected ? -1 : 1;
        }

        return first.name.localeCompare(second.name);
      });
  }, [componentRecipeOptions, mobileSelectedComponentIds, recipeSearch]);

  const handleCroppedFileChange = useCallback((file: File | null) => {
    setCroppedImageFile(file);
  }, []);

  const openMobileIngredientPicker = () => {
    setMobileIngredientDraft(selectedIngredients);
    setMobileComponentDraft(selectedComponents);
    setIsIngredientPickerOpen(true);
  };

  const confirmMobileIngredients = () => {
    setSelectedIngredients(mobileIngredientDraft);
    setSelectedComponents(mobileComponentDraft);
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

    if (selectedIngredients.length === 0 && selectedComponents.length === 0) {
      setError(t.cookbook.chooseAtLeastOneIngredient);
      return;
    }

    const parsedPortions = nullableNumber(portions);
    if (parsedPortions === null || parsedPortions <= 0) {
      setError(t.cookbook.portionsRequired);
      return;
    }

    const parsedComponents = selectedComponents.map((component) => ({
      ...component,
      amount: nullableNumber(component.amount),
    }));
    if (parsedComponents.some((component) => component.amount === null || component.amount <= 0)) {
      setError(t.cookbook.recipeComponentAmountRequired);
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
        portions: parsedPortions,
        ingredients: selectedIngredients.map((ingredient) => ({
          ingredientId: ingredient.ingredientId,
          amount: nullableNumber(ingredient.amount),
          unit: ingredient.unit,
          preparation: ingredient.preparation,
        })),
        tags: selectedTags,
        components: parsedComponents.map((component, index) => ({
          recipeId: component.recipeId,
          amount: component.amount ?? 0,
          unit: component.unit,
          preparation: component.preparation,
          sortOrder: index + 1,
        })),
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

              <label className={recipeBrowserStyles.field}>
                <span className={recipeBrowserStyles.label(theme)}>
                  {t.cookbook.portions}<span className={recipeBrowserStyles.requiredMark(theme)}> *</span>
                </span>
                <input
                  className={recipeBrowserStyles.textField(theme)}
                  min="0"
                  required
                  step="0.25"
                  type="number"
                  value={portions}
                  onChange={(event) => setPortions(event.target.value)}
                />
              </label>

              {renderRecipeTypeField()}

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
              addActionLabel={t.common.manageTags}
              formatValue={(value) => t.enums.recipeTags[value] ?? formatLabel(value)}
              groupLabels={recipeTagGroupLabels}
              groups={groupedRecipeTags}
              panelClassName={`${recipeBrowserStyles.groupedTagPanel} ${recipeBrowserStyles.checkboxGridPanel(theme)}`}
              selectedValues={selectedTags}
              theme={theme}
              onAddTag={() => setIsTagCreateOpen(true)}
              onToggle={(value) => setSelectedTags((currentTags) => toggleValue(currentTags, value))}
            />
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

          <section className={recipeBrowserStyles.field}>
            <div className={recipeBrowserStyles.fieldHeaderRow}>
              <span className={recipeBrowserStyles.label(theme)}>
                {t.cookbook.ingredients}<span className={recipeBrowserStyles.requiredMark(theme)}> *</span>
                <span className={recipeBrowserStyles.inlineHint(theme)}>
                  {t.cookbook.recipeLinesHelp}
                </span>
              </span>
              <button
                className={recipeBrowserStyles.inlineHelperButton(theme)}
                type="button"
                onClick={() => setIsConversionHelperOpen(true)}
              >
                {t.cookbook.conversionHelper}
              </button>
            </div>
            <RecipeLineModeToggle
              mode={recipeLinePickerMode}
              theme={theme}
              onChange={setRecipeLinePickerMode}
            />
            <div className={recipeBrowserStyles.mobileIngredientSummary}>
              <button className={recipeBrowserStyles.detailsToggleFull(theme)} type="button" onClick={openMobileIngredientPicker}>
                {recipeLinePickerMode === "ingredients" ? t.cookbook.chooseIngredients : t.cookbook.chooseRecipes}
              </button>
              {recipeLinePickerMode === "ingredients" ? (
                <SelectedIngredientCapsules
                  ingredients={ingredients}
                  selectedIngredients={selectedIngredients}
                  theme={theme}
                />
              ) : (
                <SelectedRecipeComponentCapsules
                  recipes={recipes}
                  selectedComponents={selectedComponents}
                  theme={theme}
                />
              )}
            </div>
            <div className={recipeBrowserStyles.desktopIngredientPicker}>
              {recipeLinePickerMode === "ingredients" ? (
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
              ) : (
                <RecipeComponentPickerContent
                  preparationLabels={t.enums.ingredientPreparations}
                  recipeSearch={recipeSearch}
                  recipes={visibleComponentRecipes}
                  selectedComponentIds={selectedComponentIds}
                  selectedComponents={selectedComponents}
                  theme={theme}
                  onAmountChange={(recipeId, amount) =>
                    setSelectedComponents((currentComponents) =>
                      updateSelectedRecipeComponent(currentComponents, recipeId, { amount }),
                    )
                  }
                  onPreparationChange={(recipeId, preparation) =>
                    setSelectedComponents((currentComponents) =>
                      updateSelectedRecipeComponent(currentComponents, recipeId, { preparation }),
                    )
                  }
                  onSearchChange={setRecipeSearch}
                  onToggle={(recipeId) =>
                    setSelectedComponents((currentComponents) =>
                      toggleRecipeComponent(currentComponents, recipeId),
                    )
                  }
                  onUnitChange={(recipeId, unit) =>
                    setSelectedComponents((currentComponents) =>
                      updateSelectedRecipeComponent(currentComponents, recipeId, { unit }),
                    )
                  }
                />
              )}
            </div>
          </section>
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
      {isIngredientPickerOpen && recipeLinePickerMode === "ingredients" && (
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
      {isIngredientPickerOpen && recipeLinePickerMode === "recipes" && (
        <Modal
          backdropClassName={recipeBrowserStyles.nestedModalBackdrop}
          bodyClassName={recipeBrowserStyles.nestedIngredientModalBody}
          closeButtonClassName={recipeBrowserStyles.modalCloseAligned(theme)}
          closeLabel={t.common.close}
          footer={
            <>
              <button className={`${recipeBrowserStyles.secondaryButton(theme)} ${recipeBrowserStyles.formActionButton}`} type="button" onClick={() => setIsIngredientPickerOpen(false)}>
                {t.common.cancel}
              </button>
              <button className={`${recipeBrowserStyles.primaryButton(theme)} ${recipeBrowserStyles.formActionButton}`} type="button" onClick={confirmMobileIngredients}>
                {t.common.confirm}
              </button>
            </>
          }
          footerClassName={recipeBrowserStyles.formActions}
          headerClassName={recipeBrowserStyles.modalHeader}
          panelClassName={recipeBrowserStyles.nestedIngredientModalPanel(theme)}
          title={t.cookbook.recipes}
          titleClassName={recipeBrowserStyles.modalTitle}
          onClose={() => setIsIngredientPickerOpen(false)}
        >
          <RecipeComponentPickerContent
            preparationLabels={t.enums.ingredientPreparations}
            recipeSearch={recipeSearch}
            recipes={visibleMobileComponentRecipes}
            selectedComponentIds={mobileSelectedComponentIds}
            selectedComponents={mobileComponentDraft}
            theme={theme}
            onAmountChange={(recipeId, amount) =>
              setMobileComponentDraft((currentComponents) =>
                updateSelectedRecipeComponent(currentComponents, recipeId, { amount }),
              )
            }
            onPreparationChange={(recipeId, preparation) =>
              setMobileComponentDraft((currentComponents) =>
                updateSelectedRecipeComponent(currentComponents, recipeId, { preparation }),
              )
            }
            onSearchChange={setRecipeSearch}
            onToggle={(recipeId) =>
              setMobileComponentDraft((currentComponents) =>
                toggleRecipeComponent(currentComponents, recipeId),
              )
            }
            onUnitChange={(recipeId, unit) =>
              setMobileComponentDraft((currentComponents) =>
                updateSelectedRecipeComponent(currentComponents, recipeId, { unit }),
              )
            }
          />
        </Modal>
      )}
      {isConversionHelperOpen && (
        <ConversionHelperDialog
          theme={theme}
          onClose={() => setIsConversionHelperOpen(false)}
        />
      )}
      {isTagCreateOpen && (
        <RecipeTagCreateDialog
          categories={recipeTagCategories}
          existingTags={[...knownRecipeTags, ...customRecipeTags]}
          theme={theme}
          onCancel={() => setIsTagCreateOpen(false)}
          onCreate={async (tag, categoryId) => {
            await recipeTagCategoryService.createTag(categoryId, { name: tag });
            await refreshRecipeTagCategories();
            setSelectedTags((currentTags) => currentTags.includes(tag) ? currentTags : [...currentTags, tag]);
            setIsTagCreateOpen(false);
          }}
          onCreateCategory={async (name) => {
            const category = await recipeTagCategoryService.create({ name });
            await refreshRecipeTagCategories();
            return { id: category.recipeTagCategoryId, name: category.name };
          }}
          onUpdateCategory={async (category) => {
            await recipeTagCategoryService.update(category.id, { name: category.name });
            await refreshRecipeTagCategories();
          }}
          onDeleteCategory={async (category) => {
            await recipeTagCategoryService.delete(category.id);
            await refreshRecipeTagCategories();
            await refreshRecipes();
          }}
          onUpdateTag={async (tagName, nextName) => {
            await recipeTagCategoryService.updateTag(tagName, { name: nextName });
            await refreshRecipeTagCategories();
            await refreshRecipes();
            setSelectedTags((currentTags) =>
              currentTags.map((tag) => tag.toLowerCase() === tagName.toLowerCase() ? nextName : tag),
            );
          }}
          onDeleteTag={async (tagName) => {
            await recipeTagCategoryService.deleteTag(tagName);
            await refreshRecipeTagCategories();
            await refreshRecipes();
            setSelectedTags((currentTags) =>
              currentTags.filter((tag) => tag.toLowerCase() !== tagName.toLowerCase()),
            );
          }}
        />
      )}
    </form>
  );
}

type ConversionHelperDialogProps = {
  theme: SiteTheme;
  onClose: () => void;
};

type RecipeLineModeToggleProps = {
  mode: RecipeLinePickerMode;
  theme: SiteTheme;
  onChange: (mode: RecipeLinePickerMode) => void;
};

function RecipeLineModeToggle({ mode, theme, onChange }: RecipeLineModeToggleProps) {
  const { t } = useLanguage();

  return (
    <div className={recipeBrowserStyles.recipeLineModeToggle(theme)} role="group" aria-label={t.cookbook.recipeLineMode}>
      <button
        aria-pressed={mode === "ingredients"}
        className={recipeBrowserStyles.recipeLineModeOption(theme, mode === "ingredients")}
        type="button"
        onClick={() => onChange("ingredients")}
      >
        {t.cookbook.ingredients}
      </button>
      <button
        aria-pressed={mode === "recipes"}
        className={recipeBrowserStyles.recipeLineModeOption(theme, mode === "recipes")}
        type="button"
        onClick={() => onChange("recipes")}
      >
        {t.cookbook.recipes}
      </button>
    </div>
  );
}

function ConversionHelperDialog({ theme, onClose }: ConversionHelperDialogProps) {
  const { t } = useLanguage();

  return (
    <Modal
      backdropClassName={recipeBrowserStyles.nestedModalBackdrop}
      bodyClassName={recipeBrowserStyles.nestedIngredientModalBody}
      closeButtonClassName={recipeBrowserStyles.modalCloseAligned(theme)}
      closeLabel={t.common.close}
      footer={
        <button className={`${recipeBrowserStyles.primaryButton(theme)} ${recipeBrowserStyles.formActionButton}`} type="button" onClick={onClose}>
          {t.common.close}
        </button>
      }
      footerClassName={recipeBrowserStyles.formActions}
      headerClassName={recipeBrowserStyles.modalHeader}
      panelClassName={recipeBrowserStyles.nestedIngredientModalPanel(theme)}
      title={t.cookbook.conversionHelper}
      titleClassName={recipeBrowserStyles.modalTitle}
      onClose={onClose}
    >
      <p className={recipeBrowserStyles.conversionHelperIntro(theme)}>
        {t.cookbook.conversionHelperIntro}
      </p>
      {t.cookbook.conversionHelperSections.map((section) => (
        <section className={recipeBrowserStyles.conversionSection(theme)} key={section.title}>
          <h3 className={recipeBrowserStyles.conversionSectionTitle(theme)}>{section.title}</h3>
          <div className={recipeBrowserStyles.conversionList}>
            {section.items.map((item) => (
              <div className={recipeBrowserStyles.conversionRow(theme)} key={`${item.from}-${item.to}`}>
                <span className={recipeBrowserStyles.conversionSource}>{item.from}</span>
                <span className={recipeBrowserStyles.conversionArrow(theme)}>=</span>
                <span className={recipeBrowserStyles.conversionTarget}>{item.to}</span>
              </div>
            ))}
          </div>
        </section>
      ))}
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
