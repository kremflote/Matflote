import { useCallback, useEffect, useId, useState, type FormEvent } from "react";
import { useBrands, useIngredients, useLanguage, useRecipes } from "../../contexts";
import type { IIngredient, IngredientTag, Vitamin } from "../../interfaces/IIngredient";
import { brandService, imageUploadService, ingredientService } from "../../services";
import { getApiAssetUrl } from "../../services/apiClient";
import type { SiteTheme } from "../../styles/appStyles";
import { ingredientTagGroups, vitamins } from "./formOptions";
import { GroupedCheckboxPanel } from "./BrowserFilterGroups";
import CreatableSelect from "./CreatableSelect";
import { formatLabel, recipeBrowserStyles } from "./recipeBrowserStyles";

type IngredientCreateFormProps = {
  initialIngredient?: IIngredient | null;
  theme: SiteTheme;
  onCreated: () => void;
  onCancel: () => void;
};

const INGREDIENT_NAME_MAX_LENGTH = 30;

type NutritionNumberFieldProps = {
  label: string;
  theme: SiteTheme;
  value: string;
  className?: string;
  step?: string;
  unit?: string;
  onChange: (value: string) => void;
};

function NutritionNumberField({
  label,
  theme,
  value,
  className = "",
  step = "0.1",
  unit = "g",
  onChange,
}: NutritionNumberFieldProps) {
  return (
    <label className={`${recipeBrowserStyles.field} ${className}`}>
      <span className={recipeBrowserStyles.label(theme)}>{label}</span>
      <span className={recipeBrowserStyles.numberField}>
        <input
          className={recipeBrowserStyles.numberFieldInput(theme)}
          min="0"
          step={step}
          type="number"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <span className={recipeBrowserStyles.numberFieldSuffix(theme)}>{unit}</span>
      </span>
    </label>
  );
}

type CompactIngredientImagePickerProps = {
  inputId: string;
  initialImageUrl?: string | null;
  previewUrl: string | null;
  theme: SiteTheme;
  onFileChange: (file: File | null) => void;
};

function CompactIngredientImagePicker({
  inputId,
  initialImageUrl = null,
  previewUrl,
  theme,
  onFileChange,
}: CompactIngredientImagePickerProps) {
  const imageUrl = previewUrl ?? getApiAssetUrl(initialImageUrl);

  return (
    <div className={recipeBrowserStyles.compactIngredientImageControl}>
      <input
        accept="image/jpeg,image/png,image/webp"
        className={recipeBrowserStyles.hiddenFileInput}
        id={inputId}
        type="file"
        onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
      />
      <div className={recipeBrowserStyles.compactIngredientImagePreview(theme)}>
        {imageUrl === null ? (
          <div className={recipeBrowserStyles.compactIngredientImageFallback}>IMG</div>
        ) : (
          <img className={recipeBrowserStyles.compactIngredientImage} src={imageUrl} alt="" />
        )}
      </div>
      <label className={recipeBrowserStyles.compactIngredientImageButton(theme)} htmlFor={inputId}>
        Choose file
      </label>
    </div>
  );
}

function IngredientCreateForm({
  initialIngredient = null,
  theme,
  onCreated,
  onCancel,
}: IngredientCreateFormProps) {
  const isEditing = initialIngredient !== null;
  const { t } = useLanguage();
  const { brands, refreshBrands } = useBrands();
  const { refreshIngredients } = useIngredients();
  const { refreshRecipes } = useRecipes();
  const imageInputId = useId();
  const [ingredientName, setIngredientName] = useState(initialIngredient?.ingredientName ?? "");
  const [brandId, setBrandId] = useState<number | null>(initialIngredient?.brandId ?? null);
  const [croppedImageFile, setCroppedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<IngredientTag[]>(
    initialIngredient && initialIngredient.tags.length > 0 ? [...initialIngredient.tags] : ["Vegetable"],
  );
  const [calories, setCalories] = useState(numberToInputValue(initialIngredient?.nutritionPer100?.calories));
  const [carbohydrateGrams, setCarbohydrateGrams] = useState(
    numberToInputValue(initialIngredient?.nutritionPer100?.carbohydrateGrams),
  );
  const [proteinGrams, setProteinGrams] = useState(numberToInputValue(initialIngredient?.nutritionPer100?.proteinGrams));
  const [saltGrams, setSaltGrams] = useState(numberToInputValue(initialIngredient?.nutritionPer100?.saltGrams));
  const [dietaryFiberGrams, setDietaryFiberGrams] = useState(
    numberToInputValue(initialIngredient?.nutritionPer100?.dietaryFiberGrams),
  );
  const [saturatedFatGrams, setSaturatedFatGrams] = useState(
    numberToInputValue(initialIngredient?.nutritionPer100?.saturatedFatGrams),
  );
  const [unsaturatedFatGrams, setUnsaturatedFatGrams] = useState(
    numberToInputValue(initialIngredient?.nutritionPer100?.unsaturatedFatGrams),
  );
  const [monounsaturatedFatGrams, setMonounsaturatedFatGrams] = useState(
    numberToInputValue(initialIngredient?.nutritionPer100?.monounsaturatedFatGrams),
  );
  const [polyunsaturatedFatGrams, setPolyunsaturatedFatGrams] = useState(
    numberToInputValue(initialIngredient?.nutritionPer100?.polyunsaturatedFatGrams),
  );
  const [selectedVitamins, setSelectedVitamins] = useState<Vitamin[]>(
    initialIngredient?.nutritionPer100?.vitamins ?? [],
  );
  const [showNutrition, setShowNutrition] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const handleCroppedFileChange = useCallback((file: File | null) => {
    setCroppedImageFile(file);
  }, []);

  useEffect(() => {
    if (croppedImageFile === null) {
      setImagePreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(croppedImageFile);
    setImagePreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [croppedImageFile]);

  const submitIngredient = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = ingredientName.trim();

    if (trimmedName.length === 0) {
      setError("Ingredient needs a name.");
      return;
    }

    if (trimmedName.length > INGREDIENT_NAME_MAX_LENGTH) {
      setError(`Ingredient name can be at most ${INGREDIENT_NAME_MAX_LENGTH} characters.`);
      return;
    }

    if (selectedTags.length === 0) {
      setError("Choose at least one ingredient tag.");
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
        price: initialIngredient?.price ?? null,
        tags: selectedTags,
        nutritionPer100: {
          calories: nullableNumber(calories),
          carbohydrateGrams: nullableNumber(carbohydrateGrams),
          proteinGrams: nullableNumber(proteinGrams),
          saltGrams: nullableNumber(saltGrams),
          dietaryFiberGrams: nullableNumber(dietaryFiberGrams),
          saturatedFatGrams: nullableNumber(saturatedFatGrams),
          unsaturatedFatGrams: nullableNumber(unsaturatedFatGrams),
          monounsaturatedFatGrams: nullableNumber(monounsaturatedFatGrams),
          polyunsaturatedFatGrams: nullableNumber(polyunsaturatedFatGrams),
          vitamins: selectedVitamins,
        },
        color: initialIngredient?.color ?? null,
      };

      if (isEditing) {
        await ingredientService.update(initialIngredient.ingredientId, request);
      } else {
        await ingredientService.create(request);
      }

      await refreshIngredients();
      await refreshRecipes();
      onCreated();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not save ingredient.");
    } finally {
      setIsSaving(false);
    }
  };

  const nutritionPanel = (
    <div className={recipeBrowserStyles.detailsPanel(theme)}>
      <div className={recipeBrowserStyles.formGrid}>
        <NutritionNumberField
          label="Calories per 100g"
          step="1"
          theme={theme}
          unit="kcal"
          value={calories}
          onChange={setCalories}
        />
        <NutritionNumberField
          label="Carbs per 100g"
          theme={theme}
          value={carbohydrateGrams}
          onChange={setCarbohydrateGrams}
        />
        <NutritionNumberField
          label="Protein per 100g"
          theme={theme}
          value={proteinGrams}
          onChange={setProteinGrams}
        />
        <NutritionNumberField
          label="Salt per 100g"
          step="0.01"
          theme={theme}
          value={saltGrams}
          onChange={setSaltGrams}
        />
        <NutritionNumberField
          label="Fiber per 100g"
          theme={theme}
          value={dietaryFiberGrams}
          onChange={setDietaryFiberGrams}
        />
        <NutritionNumberField
          className={recipeBrowserStyles.nutritionSecondRowStart}
          label="Saturated fats per 100g"
          theme={theme}
          value={saturatedFatGrams}
          onChange={setSaturatedFatGrams}
        />
        <NutritionNumberField
          label="Unsaturated fats per 100g"
          theme={theme}
          value={unsaturatedFatGrams}
          onChange={setUnsaturatedFatGrams}
        />
        <NutritionNumberField
          label="Monounsaturated fats per 100g"
          theme={theme}
          value={monounsaturatedFatGrams}
          onChange={setMonounsaturatedFatGrams}
        />
        <NutritionNumberField
          label="Polyunsaturated fats per 100g"
          theme={theme}
          value={polyunsaturatedFatGrams}
          onChange={setPolyunsaturatedFatGrams}
        />
      </div>

      <section className={recipeBrowserStyles.field}>
        <span className={recipeBrowserStyles.label(theme)}>Vitamins</span>
        <div className={`${recipeBrowserStyles.tagCheckboxGrid} ${recipeBrowserStyles.checkboxGridPanel(theme)}`}>
          {vitamins.map((vitamin) => (
            <label className={recipeBrowserStyles.checkboxLabel(theme)} key={vitamin}>
              <input
                checked={selectedVitamins.includes(vitamin)}
                className={recipeBrowserStyles.checkbox}
                type="checkbox"
                onChange={() => setSelectedVitamins((currentVitamins) => toggleValue(currentVitamins, vitamin))}
              />
              {formatLabel(vitamin)}
            </label>
          ))}
        </div>
      </section>
    </div>
  );

  return (
    <form className={recipeBrowserStyles.form} onSubmit={submitIngredient}>
      <div className={recipeBrowserStyles.formBodyScrollArea}>
        {error !== null && <p className={recipeBrowserStyles.statusError(theme)}>{error}</p>}

        <div className={recipeBrowserStyles.ingredientCreateScrollArea(theme)}>
          <div className={recipeBrowserStyles.formGrid}>
            <label className={recipeBrowserStyles.field}>
              <span className={recipeBrowserStyles.label(theme)}>
                Name<span className={recipeBrowserStyles.requiredMark(theme)}> *</span>
                <span className={recipeBrowserStyles.inlineHint(theme)}>
                  {ingredientName.length}/{INGREDIENT_NAME_MAX_LENGTH}
                </span>
              </span>
              <input
                className={recipeBrowserStyles.textField(theme)}
                maxLength={INGREDIENT_NAME_MAX_LENGTH}
                required
                type="text"
                value={ingredientName}
                onChange={(event) => setIngredientName(event.target.value)}
              />
            </label>

            <CreatableSelect
              createLabel="Create New"
              label="Brand"
              options={brands.map((brand) => ({ id: brand.brandId, name: brand.name }))}
              placeholder="Select brand"
              theme={theme}
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
              <span className={recipeBrowserStyles.label(theme)}>Nutrition</span>
              <button
                aria-expanded={showNutrition}
                className={recipeBrowserStyles.detailsToggleFull(theme)}
                type="button"
                onClick={() => setShowNutrition((currentValue) => !currentValue)}
              >
                {showNutrition ? "Hide nutrition" : "Add nutrition"}
              </button>
              {showNutrition && <div className="md:hidden">{nutritionPanel}</div>}
            </section>

            <section className={recipeBrowserStyles.field}>
              <span className={recipeBrowserStyles.label(theme)}>Image</span>
              <CompactIngredientImagePicker
                inputId={imageInputId}
                initialImageUrl={initialIngredient?.imageUrl}
                previewUrl={imagePreviewUrl}
                theme={theme}
                onFileChange={handleCroppedFileChange}
              />
            </section>
          </div>

          {showNutrition && <div className="max-md:hidden">{nutritionPanel}</div>}

          <section className={recipeBrowserStyles.field}>
            <span className={recipeBrowserStyles.label(theme)}>
              Tags<span className={recipeBrowserStyles.requiredMark(theme)}> *</span>
              <span className={recipeBrowserStyles.inlineHint(theme)}>Pick 1 or more</span>
            </span>
            <GroupedCheckboxPanel
              formatValue={(value) => t.enums.ingredientTags[value]}
              groupLabels={t.filters.ingredientTagGroups}
              groups={ingredientTagGroups}
              panelClassName={`${recipeBrowserStyles.groupedTagPanel} ${recipeBrowserStyles.checkboxGridPanel(theme)}`}
              selectedValues={selectedTags}
              theme={theme}
              onToggle={(value) => setSelectedTags((currentTags) => toggleValue(currentTags, value))}
            />
          </section>
        </div>

      </div>

      <div className={recipeBrowserStyles.formActions}>
        <button className={`${recipeBrowserStyles.secondaryButton(theme)} ${recipeBrowserStyles.formActionButton}`} disabled={isSaving} type="button" onClick={onCancel}>
          Cancel
        </button>
        <button className={`${recipeBrowserStyles.primaryButton(theme)} ${recipeBrowserStyles.formActionButton}`} disabled={isSaving} type="submit">
          {isSaving ? "Saving..." : isEditing ? "Save ingredient" : "Create ingredient"}
        </button>
      </div>
    </form>
  );
}

function nullableNumber(value: string) {
  const trimmedValue = value.trim();
  if (trimmedValue.length === 0) {
    return null;
  }

  const parsedValue = Number(trimmedValue);
  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function numberToInputValue(value: number | null | undefined) {
  return value === null || value === undefined ? "" : value.toString();
}

function toggleValue<TValue>(values: TValue[], value: TValue) {
  return values.includes(value)
    ? values.filter((currentValue) => currentValue !== value)
    : [...values, value];
}

export default IngredientCreateForm;
