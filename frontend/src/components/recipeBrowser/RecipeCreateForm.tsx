import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useIngredientTagCategories, useIngredients, useLanguage, useRecipes } from "../../contexts";
import type { IRecipe, RecipeTag } from "../../interfaces/IRecipe";
import type { IConversionRule } from "../../interfaces/IConversionRule";
import { ApiError, conversionRuleService, imageUploadService, recipeService } from "../../services";
import { getAllCategoryTagNames, getRecipeVisibleTagCategories } from "../../utils/tagCatalog";
import {
  formatRecipeTagGroupName,
  getRecipeTagGroupsWithCustomTags,
} from "./formOptions";
import { GroupedCheckboxPanel } from "./BrowserFilterGroups";
import ImageCropPicker from "./ImageCropPicker";
import Modal from "../Modal";
import RecipeIngredientToggle from "./RecipeIngredientToggle";
import IngredientTagCreateDialog from "./IngredientTagCreateDialog";
import TagPickerDialog from "./TagPickerDialog";
import {
  RecipeComponentPickerContent,
  RecipeIngredientPickerContent,
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
import { parseOptionalNumber, toggleValue } from "../../utils/formValues";
import { tagManagementHandlers } from "./tagManagementHandlers";

type RecipeCreateFormProps = {
  imageInputId: string;
  initialRecipe?: IRecipe | null;
  showRecipeDetails: boolean;
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
  onToggleRecipeDetails,
  onCreated,
  onCancel,
}: RecipeCreateFormProps) {
  const isEditing = initialRecipe !== null;
  const { t } = useLanguage();
  const { ingredients } = useIngredients();
  const { recipes, refreshRecipes, upsertRecipe } = useRecipes();
  const { ingredientTagCategories, refreshIngredientTagCategories } = useIngredientTagCategories();
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
  const [isTagPickerOpen, setIsTagPickerOpen] = useState(false);
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
  const recipeVisibleTagCategories = getRecipeVisibleTagCategories(ingredientTagCategories);
  const knownRecipeTags = getAllCategoryTagNames(ingredientTagCategories) as RecipeTag[];
  const existingCustomRecipeTags = recipes
    .flatMap((recipe) => recipe.tags)
    .filter((tag) => !knownRecipeTags.includes(tag));
  const customRecipeTags = Array.from(new Set([
    ...existingCustomRecipeTags,
    ...selectedTags.filter((tag) => !knownRecipeTags.includes(tag)),
  ]));
  const groupedRecipeTags = getRecipeTagGroupsWithCustomTags(customRecipeTags, "style", recipeVisibleTagCategories);
  const recipeTagGroupLabels = Object.fromEntries(
    recipeVisibleTagCategories.map((category) => [
      category.ingredientTagCategoryId.toString(),
      formatRecipeTagGroupName(category.name, t.filters.recipeTagGroups),
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

    const parsedPortions = parseOptionalNumber(portions);
    if (parsedPortions === null || parsedPortions <= 0) {
      setError(t.cookbook.portionsRequired);
      return;
    }

    const parsedComponents = selectedComponents.map((component) => ({
      ...component,
      amount: parseOptionalNumber(component.amount),
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
        name: trimmedName,
        imageUrl: upload?.url ?? initialRecipe?.imageUrl ?? null,
        description: nullableText(description),
        instructions: nullableText(instructions),
        portions: parsedPortions,
        ingredients: selectedIngredients.map((ingredient) => ({
          ingredientId: ingredient.ingredientId,
          amount: parseOptionalNumber(ingredient.amount),
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
      };

      const saved = isEditing
        ? await recipeService.update(initialRecipe.recipeId, request)
        : await recipeService.create(request);

      upsertRecipe(saved);
      // Other recipes repeat a component's name; refresh them in the background only when that can have changed.
      if (isEditing && saved.name !== initialRecipe.name && recipes.some((recipe) =>
        recipe.components.some((component) => component.recipeId === saved.recipeId))) {
        void refreshRecipes();
      }
      onCreated();
    } catch (caughtError) {
      setError(caughtError instanceof ApiError && caughtError.status === 409
        ? t.cookbook.recipeNameTaken(trimmedName)
        : caughtError instanceof Error ? caughtError.message : t.cookbook.couldNotCreateRecipe);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form className={recipeBrowserStyles.form} onSubmit={submitRecipe}>
      <div className={recipeBrowserStyles.formBodyScrollArea}>
        {error !== null && <p className={recipeBrowserStyles.statusError}>{error}</p>}

        <div className={recipeBrowserStyles.recipeCreateScrollArea}>
          <div className={recipeBrowserStyles.createFormTopGrid}>
            <div className={recipeBrowserStyles.createFormPrimaryFields}>
              <label className={recipeBrowserStyles.field}>
                <span className={recipeBrowserStyles.label}>
                  {t.cookbook.name}<span className={recipeBrowserStyles.requiredMark}> *</span>
                  <span className={recipeBrowserStyles.inlineHint}>
                    {name.length}/{RECIPE_NAME_MAX_LENGTH}
                  </span>
                </span>
                <input
                  className={recipeBrowserStyles.textField}
                  maxLength={RECIPE_NAME_MAX_LENGTH}
                  required
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </label>

              <label className={recipeBrowserStyles.field}>
                <span className={recipeBrowserStyles.label}>
                  {t.cookbook.portions}<span className={recipeBrowserStyles.requiredMark}> *</span>
                </span>
                <input
                  className={recipeBrowserStyles.textField}
                  min="0"
                  required
                  step="0.25"
                  type="number"
                  value={portions}
                  onChange={(event) => setPortions(event.target.value)}
                />
              </label>

            </div>
            <div className={recipeBrowserStyles.createImageField}>
              <span className={`${recipeBrowserStyles.label} ${recipeBrowserStyles.createImageLabel}`}>
                {t.cookbook.image}
              </span>
              <div className={recipeBrowserStyles.createImageControl}>
                <ImageCropPicker
                  inputId={imageInputId}
                  initialImageUrl={initialRecipe?.imageUrl}
                  onCroppedFileChange={handleCroppedFileChange}
                />
              </div>
            </div>
          </div>

          {onToggleRecipeDetails && (
            <button
              aria-expanded={showRecipeDetails}
              className={recipeBrowserStyles.detailsToggleFull}
              type="button"
              onClick={onToggleRecipeDetails}
            >
              {showRecipeDetails ? t.cookbook.hideRecipeDetails : t.cookbook.addRecipeDetails}
            </button>
          )}

          {showRecipeDetails && (
            <div className={recipeBrowserStyles.detailsPanel}>
              <div className={recipeBrowserStyles.formGrid}>
                <label className={recipeBrowserStyles.field}>
                  <span className={recipeBrowserStyles.label}>{t.cookbook.description}</span>
                  <textarea
                    className={recipeBrowserStyles.textArea}
                    maxLength={600}
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                  />
                </label>

                <label className={recipeBrowserStyles.field}>
                  <span className={recipeBrowserStyles.label}>{t.cookbook.instructions}</span>
                  <textarea
                    className={recipeBrowserStyles.textArea}
                    value={instructions}
                    onChange={(event) => setInstructions(event.target.value)}
                  />
                </label>
              </div>
            </div>
          )}

          <section className={`${recipeBrowserStyles.field} ${recipeBrowserStyles.desktopTagSection}`}>
            <span className={recipeBrowserStyles.label}>
              {t.cookbook.tags}
              <span className={recipeBrowserStyles.inlineHint}>{t.cookbook.optional}</span>
            </span>
            <GroupedCheckboxPanel
              addActionLabel={t.common.manageTags}
              formatValue={(value) => t.enums.recipeTags[value] ?? formatLabel(value)}
              groupLabels={recipeTagGroupLabels}
              groups={groupedRecipeTags}
              panelClassName={`${recipeBrowserStyles.groupedTagPanel} ${recipeBrowserStyles.checkboxGridPanel}`}
              selectedValues={selectedTags}
              onAddTag={() => setIsTagCreateOpen(true)}
              onToggle={(value) => setSelectedTags((currentTags) => toggleValue(currentTags, value))}
            />
          </section>

          <div className={recipeBrowserStyles.mobileFormActionRow}>
            <button
              className={`${recipeBrowserStyles.detailsToggleFull} ${recipeBrowserStyles.mobileFormActionButton}`}
              type="button"
              onClick={() => setIsTagPickerOpen(true)}
            >
              {t.cookbook.tags}
            </button>
          </div>

          <section className={recipeBrowserStyles.field}>
            <div className={recipeBrowserStyles.fieldHeaderRow}>
              <span className={recipeBrowserStyles.label}>
                {t.cookbook.ingredients}<span className={recipeBrowserStyles.requiredMark}> *</span>
                <span className={recipeBrowserStyles.inlineHint}>
                  {t.cookbook.recipeLinesHelp}
                </span>
              </span>
              <button
                className={recipeBrowserStyles.inlineHelperButton}
                type="button"
                onClick={() => setIsConversionHelperOpen(true)}
              >
                {t.cookbook.conversionHelper}
              </button>
            </div>
            <RecipeLineModeToggle
              className="max-w-md max-sm:hidden"
              mode={recipeLinePickerMode}
              onChange={setRecipeLinePickerMode}
            />
            <div className={recipeBrowserStyles.mobileIngredientSummary}>
              <button className={recipeBrowserStyles.detailsToggleFull} type="button" onClick={openMobileIngredientPicker}>
                {recipeLinePickerMode === "ingredients" ? t.cookbook.chooseIngredients : t.cookbook.chooseRecipes}
              </button>
              {selectedIngredients.length === 0 && selectedComponents.length === 0 ? (
                <p className={recipeBrowserStyles.helperText}>{t.cookbook.noIngredientsSelected}</p>
              ) : null}
            </div>
            <div className={recipeBrowserStyles.desktopIngredientPicker}>
              {recipeLinePickerMode === "ingredients" ? (
                <RecipeIngredientPickerContent
                  ingredientSearch={ingredientSearch}
                  ingredients={visibleIngredients}
                  preparationLabels={t.enums.ingredientPreparations}
                  selectedIngredientIds={selectedIngredientIds}
                  selectedIngredients={selectedIngredients}
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
                  onToggle={(recipe) =>
                    setSelectedComponents((currentComponents) =>
                      toggleRecipeComponent(currentComponents, recipe),
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
        <button className={`${recipeBrowserStyles.secondaryButton} ${recipeBrowserStyles.formActionButton}`} disabled={isSaving} type="button" onClick={onCancel}>
          {t.common.cancel}
        </button>
        <button className={`${recipeBrowserStyles.primaryButton} ${recipeBrowserStyles.formActionButton}`} disabled={isSaving} type="submit">
          {isSaving ? t.common.saving : isEditing ? t.cookbook.saveRecipe : t.cookbook.createRecipe}
        </button>
      </div>
      {isIngredientPickerOpen && (
        <Modal
          backdropClassName={recipeBrowserStyles.nestedModalBackdrop}
          bodyClassName={recipeBrowserStyles.nestedIngredientModalBody}
          closeButtonClassName={recipeBrowserStyles.modalCloseAligned()}
          closeLabel={t.common.close}
          footer={
            <>
              <button className={`${recipeBrowserStyles.secondaryButton} ${recipeBrowserStyles.formActionButton}`} type="button" onClick={() => setIsIngredientPickerOpen(false)}>
                {t.common.cancel}
              </button>
              <button className={`${recipeBrowserStyles.primaryButton} ${recipeBrowserStyles.formActionButton}`} type="button" onClick={confirmMobileIngredients}>
                {t.common.confirm}
              </button>
            </>
          }
          footerClassName={recipeBrowserStyles.formActions}
          headerClassName={recipeBrowserStyles.modalHeader}
          panelClassName={recipeBrowserStyles.nestedIngredientModalPanel}
          title={t.cookbook.ingredients}
          titleClassName={recipeBrowserStyles.modalTitle}
          onClose={() => setIsIngredientPickerOpen(false)}
        >
          <RecipeLineModeToggle
            className="max-w-full"
            mode={recipeLinePickerMode}
            onChange={setRecipeLinePickerMode}
          />
          {recipeLinePickerMode === "ingredients" ? (
            <RecipeIngredientPickerContent
              ingredientSearch={ingredientSearch}
              ingredients={visibleMobileIngredients}
              preparationLabels={t.enums.ingredientPreparations}
              selectedIngredientIds={mobileSelectedIngredientIds}
              selectedIngredients={mobileIngredientDraft}
              onAmountChange={(ingredientId, amount) =>
                setMobileIngredientDraft((currentIngredients) =>
                  updateSelectedIngredient(currentIngredients, ingredientId, { amount }),
                )
              }
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
          ) : (
            <RecipeComponentPickerContent
              preparationLabels={t.enums.ingredientPreparations}
              recipeSearch={recipeSearch}
              recipes={visibleMobileComponentRecipes}
              selectedComponentIds={mobileSelectedComponentIds}
              selectedComponents={mobileComponentDraft}
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
              onToggle={(recipe) =>
                setMobileComponentDraft((currentComponents) =>
                  toggleRecipeComponent(currentComponents, recipe),
                )
              }
              onUnitChange={(recipeId, unit) =>
                setMobileComponentDraft((currentComponents) =>
                  updateSelectedRecipeComponent(currentComponents, recipeId, { unit }),
                )
              }
            />
          )}
        </Modal>
      )}
      {isConversionHelperOpen && (
        <ConversionHelperDialog
          onClose={() => setIsConversionHelperOpen(false)}
        />
      )}
      {isTagPickerOpen && (
        <TagPickerDialog
          addActionLabel={t.common.manageTags}
          formatValue={(value) => t.enums.recipeTags[value] ?? formatLabel(value)}
          groupLabels={recipeTagGroupLabels}
          groups={groupedRecipeTags}
          selectedValues={selectedTags}
          title={t.cookbook.tags}
          onAddTag={() => setIsTagCreateOpen(true)}
          onClose={() => setIsTagPickerOpen(false)}
          onToggle={(value) => setSelectedTags((currentTags) => toggleValue(currentTags, value))}
        />
      )}
      {isTagCreateOpen && (
        <IngredientTagCreateDialog
          categories={ingredientTagCategories}
          existingTags={[...knownRecipeTags, ...customRecipeTags]}
          initialMode="recipes"
          onCancel={() => setIsTagCreateOpen(false)}
          {...tagManagementHandlers({
            refreshCategories: refreshIngredientTagCategories,
            refreshTagUsers: refreshRecipes,
            onTagCreated: (tag) => {
              setSelectedTags((currentTags) => currentTags.includes(tag) ? currentTags : [...currentTags, tag]);
              setIsTagCreateOpen(false);
            },
            onTagRenamed: (tagName, nextName) =>
              setSelectedTags((currentTags) =>
                currentTags.map((tag) => tag.toLowerCase() === tagName.toLowerCase() ? nextName : tag),
              ),
            onTagDeleted: (tagName) =>
              setSelectedTags((currentTags) =>
                currentTags.filter((tag) => tag.toLowerCase() !== tagName.toLowerCase()),
              ),
          })}
        />
      )}
    </form>
  );
}

type ConversionHelperDialogProps = {
  onClose: () => void;
};

type RecipeLineModeToggleProps = {
  className?: string;
  mode: RecipeLinePickerMode;
  onChange: (mode: RecipeLinePickerMode) => void;
};

function RecipeLineModeToggle({ className = "", mode, onChange }: RecipeLineModeToggleProps) {
  return (
    <RecipeIngredientToggle
      value={mode}
      className={className}
      onChange={onChange}
    />
  );
}

function ConversionHelperDialog({ onClose }: ConversionHelperDialogProps) {
  const { language, t } = useLanguage();
  const [rules, setRules] = useState<IConversionRule[]>([]);
  const [fromText, setFromText] = useState("");
  const [toText, setToText] = useState("");
  const [isLoadingRules, setIsLoadingRules] = useState(true);
  const [isSavingRule, setIsSavingRule] = useState(false);
  const [rulesError, setRulesError] = useState<string | null>(null);

  const loadErrorMessage = t.cookbook.couldNotLoadConversionRules;

  useEffect(() => {
    let ignore = false;

    conversionRuleService
      .getAll()
      .then((loadedRules) => {
        if (!ignore) {
          setRules(loadedRules);
        }
      })
      .catch(() => {
        if (!ignore) {
          setRulesError(loadErrorMessage);
        }
      })
      .finally(() => {
        if (!ignore) {
          setIsLoadingRules(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [loadErrorMessage]);

  async function createRule() {
    const normalizedFromText = fromText.trim();
    const normalizedToText = toText.trim();
    if (normalizedFromText.length === 0 || normalizedToText.length === 0) {
      setRulesError(t.cookbook.conversionRuleNeedsValues);
      return;
    }

    setIsSavingRule(true);
    setRulesError(null);
    try {
      const createdRule = await conversionRuleService.create({
        fromText: normalizedFromText,
        toText: normalizedToText,
      });
      setRules((currentRules) => [
        ...currentRules.filter((rule) => rule.conversionRuleId !== createdRule.conversionRuleId),
        createdRule,
      ].sort((left, right) => left.sortOrder - right.sortOrder || left.fromText.localeCompare(right.fromText)));
      setFromText("");
      setToText("");
    } catch {
      setRulesError(t.cookbook.couldNotSaveConversionRule);
    } finally {
      setIsSavingRule(false);
    }
  }

  async function deleteRule(ruleId: number) {
    setRulesError(null);
    try {
      await conversionRuleService.delete(ruleId);
      setRules((currentRules) => currentRules.filter((rule) => rule.conversionRuleId !== ruleId));
    } catch {
      setRulesError(t.cookbook.couldNotDeleteConversionRule);
    }
  }

  return (
    <Modal
      backdropClassName={recipeBrowserStyles.nestedModalBackdrop}
      bodyClassName={recipeBrowserStyles.nestedIngredientModalBody}
      closeButtonClassName={recipeBrowserStyles.modalCloseAligned()}
      closeLabel={t.common.close}
      footer={
        <button className={`${recipeBrowserStyles.primaryButton} ${recipeBrowserStyles.formActionButton}`} type="button" onClick={onClose}>
          {t.common.close}
        </button>
      }
      footerClassName={recipeBrowserStyles.formActions}
      headerClassName={recipeBrowserStyles.modalHeader}
      panelClassName={recipeBrowserStyles.nestedIngredientModalPanel}
      title={t.cookbook.conversionHelper}
      titleClassName={recipeBrowserStyles.modalTitle}
      onClose={onClose}
    >
      <p className={recipeBrowserStyles.conversionHelperIntro}>
        {t.cookbook.conversionHelperIntro}
      </p>
      <p className={recipeBrowserStyles.conversionHelperSource}>
        {t.cookbook.conversionHelperSourceText}{" "}
        <a
          className={recipeBrowserStyles.conversionHelperSourceLink}
          href="https://www.matprat.no/artikler/mengde-mal-og-vekt/mal-og-vekt/"
          rel="noreferrer"
          target="_blank"
        >
          {t.cookbook.conversionHelperSourceLink}
        </a>
        .
      </p>
      <section className={recipeBrowserStyles.conversionSection}>
        <h3 className={recipeBrowserStyles.conversionSectionTitle}>{t.cookbook.conversions}</h3>
        {rulesError !== null && <p className={recipeBrowserStyles.statusError}>{rulesError}</p>}
        {isLoadingRules ? (
          <p className={recipeBrowserStyles.conversionHelperSource}>{t.common.working}</p>
        ) : (
          <div className={recipeBrowserStyles.conversionList}>
            {rules.map((rule) => {
              const localizedFromText = language === "nb" ? rule.fromTextNb ?? rule.fromText : rule.fromText;
              const localizedToText = language === "nb" ? rule.toTextNb ?? rule.toText : rule.toText;

              return (
                <div className={recipeBrowserStyles.conversionRow} key={rule.conversionRuleId}>
                  <span className={recipeBrowserStyles.conversionSource}>{localizedFromText}</span>
                  <span className={recipeBrowserStyles.conversionArrow}>=</span>
                  <span className={recipeBrowserStyles.conversionTarget}>{localizedToText}</span>
                  <button
                    className={recipeBrowserStyles.inlineTextButton}
                    type="button"
                    onClick={() => void deleteRule(rule.conversionRuleId)}
                  >
                    {t.common.remove}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
      <section className={recipeBrowserStyles.conversionSection}>
        <h3 className={recipeBrowserStyles.conversionSectionTitle}>{t.cookbook.addConversionRule}</h3>
        <div className={recipeBrowserStyles.conversionRuleForm}>
          <label className={recipeBrowserStyles.field}>
            <span className={recipeBrowserStyles.label}>{t.cookbook.conversionFrom}</span>
            <input
              className={recipeBrowserStyles.textField}
              maxLength={120}
              placeholder={t.cookbook.conversionFromPlaceholder}
              value={fromText}
              onChange={(event) => setFromText(event.target.value)}
            />
          </label>
          <label className={recipeBrowserStyles.field}>
            <span className={recipeBrowserStyles.label}>{t.cookbook.conversionTo}</span>
            <input
              className={recipeBrowserStyles.textField}
              maxLength={120}
              placeholder={t.cookbook.conversionToPlaceholder}
              value={toText}
              onChange={(event) => setToText(event.target.value)}
            />
          </label>
          <button
            className={`${recipeBrowserStyles.primaryButton} ${recipeBrowserStyles.formActionButton}`}
            disabled={isSavingRule}
            type="button"
            onClick={() => void createRule()}
          >
            {isSavingRule ? t.common.saving : t.common.add}
          </button>
        </div>
      </section>
    </Modal>
  );
}

function nullableText(value: string) {
  const trimmedValue = value.trim();
  return trimmedValue.length === 0 ? null : trimmedValue;
}

export default RecipeCreateForm;
