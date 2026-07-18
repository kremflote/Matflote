import { useCallback, useEffect, useId, useState, type FormEvent } from "react";
import { useBrands, useIngredients, useLanguage, useRecipes, useStores } from "../../contexts";
import type { IIngredient, IngredientTag, Vitamin } from "../../interfaces/IIngredient";
import { brandService, imageUploadService, ingredientPriceService, ingredientService, storeService } from "../../services";
import { getApiAssetUrl } from "../../services/apiClient";
import type { SiteTheme } from "../../styles/appStyles";
import { normalizePriceInput, todayInputValue } from "../../utils/priceFormatting";
import {
  getIngredientTagGroupsWithCustomTags,
  ingredientTagGroups,
  vitamins,
  type IngredientTagGroupKey,
} from "./formOptions";
import { GroupedCheckboxPanel } from "./BrowserFilterGroups";
import CreatableSelect from "./CreatableSelect";
import IngredientTagCreateDialog from "./IngredientTagCreateDialog";
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
  const { t } = useLanguage();
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
        {t.cookbook.chooseFile}
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
  const { stores, refreshStores } = useStores();
  const { ingredients, refreshIngredients } = useIngredients();
  const { refreshRecipes } = useRecipes();
  const imageInputId = useId();
  const [ingredientName, setIngredientName] = useState(initialIngredient?.ingredientName ?? "");
  const [brandId, setBrandId] = useState<number | null>(initialIngredient?.brandId ?? null);
  const [croppedImageFile, setCroppedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<IngredientTag[]>(
    initialIngredient && initialIngredient.tags.length > 0 ? [...initialIngredient.tags] : ["Vegetable"],
  );
  const [customTagGroups, setCustomTagGroups] = useState<Record<string, IngredientTagGroupKey>>({});
  const [isTagCreateOpen, setIsTagCreateOpen] = useState(false);
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
  const [showPriceInformation, setShowPriceInformation] = useState(false);
  const [priceStoreId, setPriceStoreId] = useState<number | null>(null);
  const [priceValue, setPriceValue] = useState("");
  const [priceDate, setPriceDate] = useState(todayInputValue());
  const [priceNote, setPriceNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const knownIngredientTags = ingredientTagGroups.flatMap((group) => group.values);
  const existingCustomTags = ingredients
    .flatMap((ingredient) => ingredient.tags)
    .filter((tag) => !knownIngredientTags.includes(tag));
  const customTags = Array.from(new Set([
    ...existingCustomTags,
    ...selectedTags.filter((tag) => !knownIngredientTags.includes(tag)),
  ]));
  const groupedTags = getIngredientTagGroupsWithCustomTags(customTags, "pantry").map((group) => {
    const groupCustomTags = customTags.filter((tag) => customTagGroups[tag] === group.key);

    return groupCustomTags.length === 0
      ? group
      : {
          ...group,
          values: Array.from(new Set([...group.values, ...groupCustomTags])),
        };
  });
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
      setError(t.cookbook.ingredientNeedsName);
      return;
    }

    if (trimmedName.length > INGREDIENT_NAME_MAX_LENGTH) {
      setError(t.cookbook.ingredientNameTooLong(INGREDIENT_NAME_MAX_LENGTH));
      return;
    }

    if (selectedTags.length === 0) {
      setError(t.cookbook.chooseAtLeastOneIngredientTag);
      return;
    }

    const parsedPricePointValue = nullableNumber(priceValue);
    if (
      showPriceInformation &&
      (priceStoreId === null || parsedPricePointValue === null || parsedPricePointValue <= 0 || priceDate.trim().length === 0)
    ) {
      setError(t.prices.couldNotSave);
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

      let ingredientId = initialIngredient?.ingredientId ?? null;
      if (isEditing) {
        await ingredientService.update(initialIngredient.ingredientId, request);
        ingredientId = initialIngredient.ingredientId;
      } else {
        const createdIngredient = await ingredientService.create(request);
        ingredientId = createdIngredient.ingredientId;
      }

      if (showPriceInformation) {
        await ingredientPriceService.create({
          ingredientId: ingredientId!,
          storeId: priceStoreId!,
          price: parsedPricePointValue!,
          date: priceDate,
          note: priceNote.trim().length === 0 ? null : priceNote.trim(),
        });
      }

      await refreshIngredients();
      await refreshRecipes();
      onCreated();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : t.cookbook.couldNotSaveIngredient);
    } finally {
      setIsSaving(false);
    }
  };

  const nutritionPanel = (
    <div className={recipeBrowserStyles.detailsPanel(theme)}>
      <div className={recipeBrowserStyles.formGrid}>
        <NutritionNumberField
          label={t.cookbook.caloriesPer100g}
          step="1"
          theme={theme}
          unit="kcal"
          value={calories}
          onChange={setCalories}
        />
        <NutritionNumberField
          label={t.cookbook.carbsPer100g}
          theme={theme}
          value={carbohydrateGrams}
          onChange={setCarbohydrateGrams}
        />
        <NutritionNumberField
          label={`${t.scanner.protein} per 100g`}
          theme={theme}
          value={proteinGrams}
          onChange={setProteinGrams}
        />
        <NutritionNumberField
          label={t.cookbook.saltPer100g}
          step="0.01"
          theme={theme}
          value={saltGrams}
          onChange={setSaltGrams}
        />
        <NutritionNumberField
          label={t.cookbook.fiberPer100g}
          theme={theme}
          value={dietaryFiberGrams}
          onChange={setDietaryFiberGrams}
        />
        <NutritionNumberField
          className={recipeBrowserStyles.nutritionSecondRowStart}
          label={t.cookbook.saturatedFatsPer100g}
          theme={theme}
          value={saturatedFatGrams}
          onChange={setSaturatedFatGrams}
        />
        <NutritionNumberField
          label={t.cookbook.unsaturatedFatsPer100g}
          theme={theme}
          value={unsaturatedFatGrams}
          onChange={setUnsaturatedFatGrams}
        />
        <NutritionNumberField
          label={t.cookbook.monounsaturatedFatsPer100g}
          theme={theme}
          value={monounsaturatedFatGrams}
          onChange={setMonounsaturatedFatGrams}
        />
        <NutritionNumberField
          label={t.cookbook.polyunsaturatedFatsPer100g}
          theme={theme}
          value={polyunsaturatedFatGrams}
          onChange={setPolyunsaturatedFatGrams}
        />
      </div>

      <section className={recipeBrowserStyles.field}>
        <span className={recipeBrowserStyles.label(theme)}>{t.cookbook.vitamins}</span>
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

  const priceInformationPanel = showPriceInformation && (
    <section className={`${recipeBrowserStyles.ingredientPricePanel} ${recipeBrowserStyles.detailsPanel(theme)}`}>
      <div className={recipeBrowserStyles.ingredientPriceGrid}>
        <CreatableSelect
          createLabel={t.common.createNew}
          label={t.prices.store}
          options={stores.map((store) => ({ id: store.storeId, name: store.name }))}
          placeholder={t.prices.selectStore}
          theme={theme}
          value={priceStoreId}
          onChange={setPriceStoreId}
          onCreate={async (name) => {
            const store = await storeService.create({ name });
            await refreshStores();
            return { id: store.storeId, name: store.name };
          }}
        />
        <label className={recipeBrowserStyles.field}>
          <span className={recipeBrowserStyles.label(theme)}>{t.prices.price}</span>
          <input
            className={recipeBrowserStyles.textField(theme)}
            inputMode="decimal"
            placeholder={t.prices.pricePlaceholder}
            type="text"
            value={priceValue}
            onChange={(event) => setPriceValue(normalizePriceInput(event.target.value))}
          />
        </label>
        <label className={recipeBrowserStyles.field}>
          <span className={recipeBrowserStyles.label(theme)}>{t.prices.date}</span>
          <input
            className={recipeBrowserStyles.textField(theme)}
            type="date"
            value={priceDate}
            onChange={(event) => setPriceDate(event.target.value)}
          />
        </label>
      </div>
      <label className={recipeBrowserStyles.field}>
        <span className={recipeBrowserStyles.label(theme)}>{t.prices.note}</span>
        <input
          className={recipeBrowserStyles.textField(theme)}
          maxLength={500}
          placeholder={t.prices.notePlaceholder}
          value={priceNote}
          onChange={(event) => setPriceNote(event.target.value)}
        />
      </label>
    </section>
  );

  return (
    <form className={recipeBrowserStyles.form} onSubmit={submitIngredient}>
      <div className={recipeBrowserStyles.formBodyScrollArea}>
        {error !== null && <p className={recipeBrowserStyles.statusError(theme)}>{error}</p>}

        <div className={recipeBrowserStyles.ingredientCreateScrollArea(theme)}>
          <div className={recipeBrowserStyles.ingredientEditorHeroGrid}>
            <div className={recipeBrowserStyles.ingredientEditorPrimaryStack}>
              <label className={recipeBrowserStyles.field}>
                <span className={recipeBrowserStyles.label(theme)}>
                    {t.cookbook.name}<span className={recipeBrowserStyles.requiredMark(theme)}> *</span>
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

              <div className={recipeBrowserStyles.ingredientBrandPriceRow}>
                <CreatableSelect
                  createLabel={t.common.createNew}
                  label={t.cookbook.brand}
                  options={brands.map((brand) => ({ id: brand.brandId, name: brand.name }))}
                  placeholder={t.cookbook.selectBrand}
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

                <section className={recipeBrowserStyles.ingredientPriceToggleField}>
                  <span className={recipeBrowserStyles.label(theme)}>{t.prices.priceInformation}</span>
                  <button
                    aria-expanded={showPriceInformation}
                    className={recipeBrowserStyles.ingredientPriceToggleButton(theme)}
                    type="button"
                    onClick={() => setShowPriceInformation((currentValue) => !currentValue)}
                  >
                    {showPriceInformation ? t.common.close : t.prices.addPrice}
                  </button>
                </section>
              </div>

              {priceInformationPanel}

              <section className={recipeBrowserStyles.field}>
                <span className={recipeBrowserStyles.label(theme)}>{t.cookbook.nutrition}</span>
                <button
                  aria-expanded={showNutrition}
                  className={recipeBrowserStyles.detailsToggleFull(theme)}
                  type="button"
                  onClick={() => setShowNutrition((currentValue) => !currentValue)}
                >
                  {showNutrition ? t.cookbook.hideNutrition : t.cookbook.addNutrition}
                </button>
                {showNutrition && <div className="md:hidden">{nutritionPanel}</div>}
              </section>
            </div>

            <section className={recipeBrowserStyles.ingredientEditorImageField}>
              <span className={recipeBrowserStyles.ingredientEditorImageLabel}>{t.cookbook.image}</span>
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
              {t.cookbook.tags}<span className={recipeBrowserStyles.requiredMark(theme)}> *</span>
              <span className={recipeBrowserStyles.inlineHint(theme)}>{t.cookbook.pickOneOrMore}</span>
            </span>
            <GroupedCheckboxPanel
              addActionLabel={t.common.addTag}
              formatValue={(value) => t.enums.ingredientTags[value] ?? formatLabel(value)}
              groupLabels={t.filters.ingredientTagGroups}
              groups={groupedTags}
              panelClassName={`${recipeBrowserStyles.groupedTagPanel} ${recipeBrowserStyles.checkboxGridPanel(theme)}`}
              selectedValues={selectedTags}
              theme={theme}
              onAddTag={() => setIsTagCreateOpen(true)}
              onToggle={(value) => setSelectedTags((currentTags) => toggleValue(currentTags, value))}
            />
          </section>
        </div>

      </div>

      {isTagCreateOpen && (
        <IngredientTagCreateDialog
          existingTags={[...knownIngredientTags, ...customTags]}
          theme={theme}
          onCancel={() => setIsTagCreateOpen(false)}
          onCreate={(tag, group) => {
            setCustomTagGroups((currentGroups) => ({ ...currentGroups, [tag]: group }));
            setSelectedTags((currentTags) => currentTags.includes(tag) ? currentTags : [...currentTags, tag]);
            setIsTagCreateOpen(false);
          }}
        />
      )}

      <div className={recipeBrowserStyles.formActions}>
        <button className={`${recipeBrowserStyles.secondaryButton(theme)} ${recipeBrowserStyles.formActionButton}`} disabled={isSaving} type="button" onClick={onCancel}>
          {t.common.cancel}
        </button>
        <button className={`${recipeBrowserStyles.primaryButton(theme)} ${recipeBrowserStyles.formActionButton}`} disabled={isSaving} type="submit">
          {isSaving ? t.common.saving : isEditing ? t.cookbook.saveIngredient : t.cookbook.createIngredient}
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
