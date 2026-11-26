import { useCallback, useId, useState, type FormEvent } from "react";
import { useBrands, useIngredientTagCategories, useIngredients, useLanguage, useRecipes } from "../../contexts";
import type { IIngredient, IngredientTag, NutritionDataSource } from "../../interfaces/IIngredient";
import { ApiError, brandService, imageUploadService, ingredientService } from "../../services";
import { INGREDIENT_NAME_MAX_LENGTH } from "../../constants/validation";
import { getAllCategoryTagNames, getIngredientVisibleTagCategories } from "../../utils/tagCatalog";
import {
  formatIngredientTagCategoryName,
  getIngredientTagGroupsWithCustomTags,
} from "./formOptions";
import { GroupedCheckboxPanel } from "./BrowserFilterGroups";
import CreatableSelect from "./CreatableSelect";
import ImageCropPicker from "./ImageCropPicker";
import IngredientTagCreateDialog from "./IngredientTagCreateDialog";
import MatvaretabellenSearchDialog, { type MatvaretabellenNutritionCandidate } from "./MatvaretabellenSearchDialog";
import NutritionEditor from "./NutritionEditor";
import type { NutritionEditorValues } from "./nutritionEditorValues";
import TagPickerDialog from "./TagPickerDialog";
import { formatLabel, recipeBrowserStyles } from "./recipeBrowserStyles";
import { numberToInputValue, parseOptionalNumber, toggleValue } from "../../utils/formValues";
import { tagManagementHandlers } from "./tagManagementHandlers";

type IngredientCreateFormProps = {
  initialIngredient?: IIngredient | null;
  onCreated: (ingredientName?: string) => void;
  onCancel: () => void;
};

function IngredientCreateForm({
  initialIngredient = null,
  onCreated,
  onCancel,
}: IngredientCreateFormProps) {
  const isEditing = initialIngredient !== null;
  const { t } = useLanguage();
  const { brands, refreshBrands } = useBrands();
  const { ingredients, refreshIngredients, upsertIngredient } = useIngredients();
  const { ingredientTagCategories, refreshIngredientTagCategories } = useIngredientTagCategories();
  const { refreshRecipes } = useRecipes();
  const imageInputId = useId();
  const [ingredientName, setIngredientName] = useState(initialIngredient?.ingredientName ?? "");
  const [brandId, setBrandId] = useState<number | null>(initialIngredient?.brandId ?? null);
  const [croppedImageFile, setCroppedImageFile] = useState<File | null>(null);
  const [selectedTags, setSelectedTags] = useState<IngredientTag[]>(
    initialIngredient ? [...initialIngredient.tags] : [],
  );
  const [isTagCreateOpen, setIsTagCreateOpen] = useState(false);
  const [isTagPickerOpen, setIsTagPickerOpen] = useState(false);
  const [calories, setCalories] = useState(numberToInputValue(initialIngredient?.nutritionPer100?.calories));
  const [carbohydrateGrams, setCarbohydrateGrams] = useState(
    numberToInputValue(initialIngredient?.nutritionPer100?.carbohydrateGrams),
  );
  const [proteinGrams, setProteinGrams] = useState(numberToInputValue(initialIngredient?.nutritionPer100?.proteinGrams));
  const [fatGrams, setFatGrams] = useState(numberToInputValue(initialIngredient?.nutritionPer100?.fatGrams));
  const [saltGrams, setSaltGrams] = useState(numberToInputValue(initialIngredient?.nutritionPer100?.saltGrams));
  const [dietaryFiberGrams, setDietaryFiberGrams] = useState(
    numberToInputValue(initialIngredient?.nutritionPer100?.dietaryFiberGrams),
  );
  const [saturatedFatGrams, setSaturatedFatGrams] = useState(
    numberToInputValue(initialIngredient?.nutritionPer100?.saturatedFatGrams),
  );
  const [transFatGrams, setTransFatGrams] = useState(
    numberToInputValue(initialIngredient?.nutritionPer100?.transFatGrams),
  );
  const [monounsaturatedFatGrams, setMonounsaturatedFatGrams] = useState(
    numberToInputValue(initialIngredient?.nutritionPer100?.monounsaturatedFatGrams),
  );
  const [polyunsaturatedFatGrams, setPolyunsaturatedFatGrams] = useState(
    numberToInputValue(initialIngredient?.nutritionPer100?.polyunsaturatedFatGrams),
  );
  const [omega3Grams, setOmega3Grams] = useState(
    numberToInputValue(initialIngredient?.nutritionPer100?.omega3Grams),
  );
  const [omega6Grams, setOmega6Grams] = useState(
    numberToInputValue(initialIngredient?.nutritionPer100?.omega6Grams),
  );
  const [cholesterolMilligrams, setCholesterolMilligrams] = useState(
    numberToInputValue(initialIngredient?.nutritionPer100?.cholesterolMilligrams),
  );
  const [vitaminAMicrograms, setVitaminAMicrograms] = useState(
    numberToInputValue(initialIngredient?.nutritionPer100?.vitaminAMicrograms),
  );
  const [vitaminB9Micrograms, setVitaminB9Micrograms] = useState(
    numberToInputValue(initialIngredient?.nutritionPer100?.vitaminB9Micrograms),
  );
  const [vitaminB12Micrograms, setVitaminB12Micrograms] = useState(
    numberToInputValue(initialIngredient?.nutritionPer100?.vitaminB12Micrograms),
  );
  const [vitaminCMilligrams, setVitaminCMilligrams] = useState(
    numberToInputValue(initialIngredient?.nutritionPer100?.vitaminCMilligrams),
  );
  const [vitaminDMicrograms, setVitaminDMicrograms] = useState(
    numberToInputValue(initialIngredient?.nutritionPer100?.vitaminDMicrograms),
  );
  const [vitaminEMilligrams, setVitaminEMilligrams] = useState(
    numberToInputValue(initialIngredient?.nutritionPer100?.vitaminEMilligrams),
  );
  const [showNutrition, setShowNutrition] = useState(false);
  const [isMatvareSearchOpen, setIsMatvareSearchOpen] = useState(false);
  const [nutritionSource, setNutritionSource] = useState<NutritionDataSource>(initialIngredient?.nutritionSource ?? "Manual");
  const [nutritionSourceLabel, setNutritionSourceLabel] = useState<string | null>(initialIngredient?.nutritionSourceLabel ?? null);
  const [matvaretabellenFoodId, setMatvaretabellenFoodId] = useState<string | null>(initialIngredient?.matvaretabellenFoodId ?? null);
  const [nutritionMatchedName, setNutritionMatchedName] = useState<string | null>(initialIngredient?.nutritionMatchedName ?? null);
  const [nutritionMatchConfidence, setNutritionMatchConfidence] = useState<number | null>(initialIngredient?.nutritionMatchConfidence ?? null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const ingredientVisibleTagCategories = getIngredientVisibleTagCategories(ingredientTagCategories);
  const knownIngredientTags = getAllCategoryTagNames(ingredientTagCategories) as IngredientTag[];
  const existingCustomTags = ingredients
    .flatMap((ingredient) => ingredient.tags)
    .filter((tag) => !knownIngredientTags.includes(tag));
  const customTags = Array.from(new Set([
    ...existingCustomTags,
    ...selectedTags.filter((tag) => !knownIngredientTags.includes(tag)),
  ]));
  const groupedTags = getIngredientTagGroupsWithCustomTags(customTags, "pantry", ingredientVisibleTagCategories);
  const groupLabels = Object.fromEntries(
    ingredientVisibleTagCategories.map((category) => [
      category.ingredientTagCategoryId.toString(),
      formatIngredientTagCategoryName(category.name, t.filters.ingredientTagGroups),
    ]),
  );
  const handleCroppedFileChange = useCallback((file: File | null) => {
    setCroppedImageFile(file);
  }, []);

  const submitIngredient = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = ingredientName.trim();

    if (trimmedName.length === 0) {
      setError(t.cookbook.ingredientNeedsName);
      return;
    }

    if (trimmedName.length > INGREDIENT_NAME_MAX_LENGTH) {
      setError(t.cookbook.ingredientNameTooLong(INGREDIENT_NAME_MAX_LENGTH));
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const upload = croppedImageFile === null
        ? null
        : await imageUploadService.upload(croppedImageFile, "ingredients");
      const request = {
        ingredientName: trimmedName,
        description: initialIngredient?.description ?? null,
        brandId,
        imageUrl: upload?.url ?? initialIngredient?.imageUrl ?? null,
        tags: selectedTags,
        nutritionPer100: {
          calories: parseOptionalNumber(calories),
          carbohydrateGrams: parseOptionalNumber(carbohydrateGrams),
          proteinGrams: parseOptionalNumber(proteinGrams),
          fatGrams: parseOptionalNumber(fatGrams),
          saltGrams: parseOptionalNumber(saltGrams),
          dietaryFiberGrams: parseOptionalNumber(dietaryFiberGrams),
          saturatedFatGrams: parseOptionalNumber(saturatedFatGrams),
          transFatGrams: parseOptionalNumber(transFatGrams),
          monounsaturatedFatGrams: parseOptionalNumber(monounsaturatedFatGrams),
          polyunsaturatedFatGrams: parseOptionalNumber(polyunsaturatedFatGrams),
          omega3Grams: parseOptionalNumber(omega3Grams),
          omega6Grams: parseOptionalNumber(omega6Grams),
          cholesterolMilligrams: parseOptionalNumber(cholesterolMilligrams),
          vitaminAMicrograms: parseOptionalNumber(vitaminAMicrograms),
          vitaminB9Micrograms: parseOptionalNumber(vitaminB9Micrograms),
          vitaminB12Micrograms: parseOptionalNumber(vitaminB12Micrograms),
          vitaminCMilligrams: parseOptionalNumber(vitaminCMilligrams),
          vitaminDMicrograms: parseOptionalNumber(vitaminDMicrograms),
          vitaminEMilligrams: parseOptionalNumber(vitaminEMilligrams),
        },
        nutritionSource,
        nutritionSourceLabel,
        matvaretabellenFoodId,
        nutritionMatchedName,
        nutritionMatchConfidence,
        color: initialIngredient?.color ?? null,
      };

      const saved = isEditing
        ? await ingredientService.update(initialIngredient.ingredientId, request)
        : await ingredientService.create(request);

      upsertIngredient(saved);
      // Recipes show an ingredient's name, brand, image, tags and colour; a new ingredient is in no recipe yet.
      if (isEditing) {
        void refreshRecipes();
      }
      onCreated(trimmedName);
    } catch (caughtError) {
      setError(caughtError instanceof ApiError && caughtError.status === 409
        ? t.cookbook.ingredientNameTaken(trimmedName)
        : caughtError instanceof Error ? caughtError.message : t.cookbook.couldNotSaveIngredient);
    } finally {
      setIsSaving(false);
    }
  };

  const nutritionValues: NutritionEditorValues = {
    calories,
    carbohydrateGrams,
    proteinGrams,
    fatGrams,
    saltGrams,
    dietaryFiberGrams,
    saturatedFatGrams,
    transFatGrams,
    monounsaturatedFatGrams,
    polyunsaturatedFatGrams,
    omega3Grams,
    omega6Grams,
    cholesterolMilligrams,
    vitaminAMicrograms,
    vitaminB9Micrograms,
    vitaminB12Micrograms,
    vitaminCMilligrams,
    vitaminDMicrograms,
    vitaminEMilligrams,
  };
  const updateNutritionValue = (key: keyof NutritionEditorValues, value: string) => {
    const setters: Record<keyof NutritionEditorValues, (value: string) => void> = {
      calories: setCalories,
      carbohydrateGrams: setCarbohydrateGrams,
      proteinGrams: setProteinGrams,
      fatGrams: setFatGrams,
      saltGrams: setSaltGrams,
      dietaryFiberGrams: setDietaryFiberGrams,
      saturatedFatGrams: setSaturatedFatGrams,
      transFatGrams: setTransFatGrams,
      monounsaturatedFatGrams: setMonounsaturatedFatGrams,
      polyunsaturatedFatGrams: setPolyunsaturatedFatGrams,
      omega3Grams: setOmega3Grams,
      omega6Grams: setOmega6Grams,
      cholesterolMilligrams: setCholesterolMilligrams,
      vitaminAMicrograms: setVitaminAMicrograms,
      vitaminB9Micrograms: setVitaminB9Micrograms,
      vitaminB12Micrograms: setVitaminB12Micrograms,
      vitaminCMilligrams: setVitaminCMilligrams,
      vitaminDMicrograms: setVitaminDMicrograms,
      vitaminEMilligrams: setVitaminEMilligrams,
    };

    setters[key](value);
  };
  const applyMatvaretabellenNutrition = (candidate: MatvaretabellenNutritionCandidate) => {
    setCalories(numberToInputValue(candidate.nutrition.calories));
    setCarbohydrateGrams(numberToInputValue(candidate.nutrition.carbohydrateGrams));
    setProteinGrams(numberToInputValue(candidate.nutrition.proteinGrams));
    setFatGrams(numberToInputValue(candidate.nutrition.fatGrams));
    setSaltGrams(numberToInputValue(candidate.nutrition.saltGrams));
    setDietaryFiberGrams(numberToInputValue(candidate.nutrition.dietaryFiberGrams));
    setSaturatedFatGrams(numberToInputValue(candidate.nutrition.saturatedFatGrams));
    setTransFatGrams(numberToInputValue(candidate.nutrition.transFatGrams));
    setMonounsaturatedFatGrams(numberToInputValue(candidate.nutrition.monounsaturatedFatGrams));
    setPolyunsaturatedFatGrams(numberToInputValue(candidate.nutrition.polyunsaturatedFatGrams));
    setOmega3Grams(numberToInputValue(candidate.nutrition.omega3Grams));
    setOmega6Grams(numberToInputValue(candidate.nutrition.omega6Grams));
    setCholesterolMilligrams(numberToInputValue(candidate.nutrition.cholesterolMilligrams));
    setVitaminAMicrograms(numberToInputValue(candidate.nutrition.vitaminAMicrograms));
    setVitaminB9Micrograms(numberToInputValue(candidate.nutrition.vitaminB9Micrograms));
    setVitaminB12Micrograms(numberToInputValue(candidate.nutrition.vitaminB12Micrograms));
    setVitaminCMilligrams(numberToInputValue(candidate.nutrition.vitaminCMilligrams));
    setVitaminDMicrograms(numberToInputValue(candidate.nutrition.vitaminDMicrograms));
    setVitaminEMilligrams(numberToInputValue(candidate.nutrition.vitaminEMilligrams));
    setNutritionSource("Matvaretabellen");
    setNutritionSourceLabel("Matvaretabellen");
    setMatvaretabellenFoodId(candidate.foodId);
    setNutritionMatchedName(candidate.foodName);
    setNutritionMatchConfidence(candidate.confidence);
    setShowNutrition(true);
  };
  const nutritionPanel = (
    <NutritionEditor
      values={nutritionValues}
      onChange={updateNutritionValue}
      onSearchMatvaretabellen={() => setIsMatvareSearchOpen(true)}
    />
  );

  return (
    <form className={recipeBrowserStyles.form} onSubmit={submitIngredient}>
      <div className={recipeBrowserStyles.formBodyScrollArea}>
        {error !== null && <p className={recipeBrowserStyles.statusError}>{error}</p>}

        <div className={recipeBrowserStyles.ingredientCreateScrollArea}>
          <div className={recipeBrowserStyles.createFormTopGrid}>
            <div className={recipeBrowserStyles.createFormPrimaryFields}>
              <label className={recipeBrowserStyles.field}>
                <span className={recipeBrowserStyles.label}>
                    {t.cookbook.name}<span className={recipeBrowserStyles.requiredMark}> *</span>
                  <span className={recipeBrowserStyles.inlineHint}>
                    {ingredientName.length}/{INGREDIENT_NAME_MAX_LENGTH}
                  </span>
                </span>
                <input
                  className={recipeBrowserStyles.textField}
                  maxLength={INGREDIENT_NAME_MAX_LENGTH}
                  required
                  type="text"
                  value={ingredientName}
                  onChange={(event) => setIngredientName(event.target.value)}
                />
              </label>

              <CreatableSelect
                createLabel={t.common.createNew}
                label={t.cookbook.brand}
                options={brands.map((brand) => ({ id: brand.brandId, name: brand.name }))}
                placeholder={t.cookbook.selectBrand}
                value={brandId}
                onChange={setBrandId}
                onCreate={async (name) => {
                  const brand = await brandService.create({ name });
                  await refreshBrands();
                  return { id: brand.brandId, name: brand.name };
                }}
                onDeleteOption={async (option) => {
                  await brandService.delete(option.id);
                  await refreshBrands();
                  await refreshIngredients();
                  await refreshRecipes();
                }}
              />

              <section className={recipeBrowserStyles.field}>
                <span className={recipeBrowserStyles.label}>{t.cookbook.nutrition}</span>
                <div className={recipeBrowserStyles.mobileFormActionRow}>
                  <button
                    className={`${recipeBrowserStyles.detailsToggleFull} ${recipeBrowserStyles.mobileFormActionButton}`}
                    type="button"
                    onClick={() => setIsTagPickerOpen(true)}
                  >
                    {t.cookbook.tags}
                  </button>
                  <button
                    aria-expanded={showNutrition}
                    className={`${recipeBrowserStyles.detailsToggleFull} ${recipeBrowserStyles.mobileFormActionButton}`}
                    type="button"
                    onClick={() => setShowNutrition((currentValue) => !currentValue)}
                  >
                    {showNutrition ? t.cookbook.hideNutrition : t.cookbook.addNutrition}
                  </button>
                </div>
                <button
                  aria-expanded={showNutrition}
                  className={`${recipeBrowserStyles.detailsToggleFull} max-sm:hidden`}
                  type="button"
                  onClick={() => setShowNutrition((currentValue) => !currentValue)}
                >
                  {showNutrition ? t.cookbook.hideNutrition : t.cookbook.addNutrition}
                </button>
                {showNutrition && <div className="md:hidden">{nutritionPanel}</div>}
              </section>
            </div>

            <section className={recipeBrowserStyles.createImageField}>
              <span className={`${recipeBrowserStyles.label} ${recipeBrowserStyles.createImageLabel}`}>
                {t.cookbook.image}
              </span>
              <div className={recipeBrowserStyles.createImageControl}>
                <ImageCropPicker
                  inputId={imageInputId}
                  initialImageUrl={initialIngredient?.imageUrl}
                  onCroppedFileChange={handleCroppedFileChange}
                />
              </div>
            </section>
          </div>

          {showNutrition && <div className="max-md:hidden">{nutritionPanel}</div>}

          <section className={`${recipeBrowserStyles.field} ${recipeBrowserStyles.desktopTagSection}`}>
            <span className={recipeBrowserStyles.label}>
              {t.cookbook.tags}
            </span>
            <GroupedCheckboxPanel
              addActionLabel={t.common.manageTags}
              formatValue={(value) => t.enums.ingredientTags[value] ?? formatLabel(value)}
              groupLabels={groupLabels}
              groups={groupedTags}
              panelClassName={`${recipeBrowserStyles.groupedTagPanel} ${recipeBrowserStyles.checkboxGridPanel}`}
              selectedValues={selectedTags}
              onAddTag={() => setIsTagCreateOpen(true)}
              onToggle={(value) => setSelectedTags((currentTags) => toggleValue(currentTags, value))}
            />
          </section>
        </div>

      </div>

      {isTagPickerOpen && (
        <TagPickerDialog
          addActionLabel={t.common.manageTags}
          formatValue={(value) => t.enums.ingredientTags[value] ?? formatLabel(value)}
          groupLabels={groupLabels}
          groups={groupedTags}
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
          existingTags={[...knownIngredientTags, ...customTags]}
          initialMode="ingredients"
          onCancel={() => setIsTagCreateOpen(false)}
          {...tagManagementHandlers({
            refreshCategories: refreshIngredientTagCategories,
            refreshTagUsers: async () => {
              await refreshIngredients();
              await refreshRecipes();
            },
            onTagCreated: (tag) => {
              setSelectedTags((currentTags) => currentTags.includes(tag) ? currentTags : [...currentTags, tag]);
              setIsTagCreateOpen(false);
            },
          })}
        />
      )}

      {isMatvareSearchOpen && (
        <MatvaretabellenSearchDialog
          initialQuery={ingredientName}
          onCancel={() => setIsMatvareSearchOpen(false)}
          onSelect={(candidate) => {
            applyMatvaretabellenNutrition(candidate);
            setIsMatvareSearchOpen(false);
          }}
        />
      )}

      <div className={recipeBrowserStyles.formActions}>
        <button className={`${recipeBrowserStyles.secondaryButton} ${recipeBrowserStyles.formActionButton}`} disabled={isSaving} type="button" onClick={onCancel}>
          {t.common.cancel}
        </button>
        <button className={`${recipeBrowserStyles.primaryButton} ${recipeBrowserStyles.formActionButton}`} disabled={isSaving} type="submit">
          {isSaving ? t.common.saving : isEditing ? t.cookbook.saveIngredient : t.cookbook.createIngredient}
        </button>
      </div>
    </form>
  );
}

export default IngredientCreateForm;
