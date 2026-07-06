import { useEffect, useRef, useState, type FormEvent } from "react";
import IngredientThumbnail from "../IngredientThumbnail";
import { useBrands, useIngredients, useRecipes } from "../../contexts";
import type { IIngredient, IngredientTag, Vitamin } from "../../interfaces/IIngredient";
import { brandService, ingredientService } from "../../services";
import type { SiteTheme } from "../../styles/appStyles";
import { ingredientTags, vitamins } from "./formOptions";
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

function IngredientCreateForm({
  initialIngredient = null,
  theme,
  onCreated,
  onCancel,
}: IngredientCreateFormProps) {
  const isEditing = initialIngredient !== null;
  const { brands, refreshBrands } = useBrands();
  const { refreshIngredients } = useIngredients();
  const { refreshRecipes } = useRecipes();
  const [ingredientName, setIngredientName] = useState(initialIngredient?.ingredientName ?? "");
  const [brandId, setBrandId] = useState<number | null>(initialIngredient?.brandId ?? null);
  const [price, setPrice] = useState(numberToInputValue(initialIngredient?.price));
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
  const [color, setColor] = useState(initialIngredient?.color ?? "");
  const [colorDraft, setColorDraft] = useState("#00d83b");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showNutrition, setShowNutrition] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const colorControlRef = useRef<HTMLElement | null>(null);
  const selectedBrand = brands.find((brand) => brand.brandId === brandId) ?? null;

  useEffect(() => {
    if (!showColorPicker) {
      return;
    }

    const handleOutsidePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      if (colorControlRef.current?.contains(target)) {
        return;
      }

      setShowColorPicker(false);
    };

    document.addEventListener("pointerdown", handleOutsidePointerDown);

    return () => document.removeEventListener("pointerdown", handleOutsidePointerDown);
  }, [showColorPicker]);

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
      const request = {
        ingredientName: trimmedName,
        description: initialIngredient?.description ?? null,
        brandId,
        price: nullableNumber(price),
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
        color: nullableText(color),
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

            <label className={recipeBrowserStyles.field}>
              <span className={recipeBrowserStyles.label(theme)}>Price per kg</span>
              <input
                className={recipeBrowserStyles.textField(theme)}
                min="0"
                step="0.01"
                type="number"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
              />
            </label>

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
            </section>
          </div>

          {showNutrition && (
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
          )}

          <section className={recipeBrowserStyles.field}>
            <span className={recipeBrowserStyles.label(theme)}>
              Tags<span className={recipeBrowserStyles.requiredMark(theme)}> *</span>
              <span className={recipeBrowserStyles.inlineHint(theme)}>Pick 1 or more</span>
            </span>
            <div className={`${recipeBrowserStyles.tagCheckboxGrid} ${recipeBrowserStyles.checkboxGridPanel(theme)}`}>
              {ingredientTags.map((value) => (
                <label className={recipeBrowserStyles.checkboxLabel(theme)} key={value}>
                  <input
                    checked={selectedTags.includes(value)}
                    className={recipeBrowserStyles.checkbox}
                    type="checkbox"
                    onChange={() => setSelectedTags((currentTags) => toggleValue(currentTags, value))}
                  />
                  {formatLabel(value)}
                </label>
              ))}
            </div>
          </section>
        </div>

        <div className={recipeBrowserStyles.formGrid}>
          <section className={recipeBrowserStyles.field} ref={colorControlRef}>
            <span className={recipeBrowserStyles.label(theme)}>Color</span>
            <button
              className={recipeBrowserStyles.colorFieldButton(theme)}
              type="button"
              onClick={() => {
                setColorDraft(isHexColor(color) ? color : "#00d83b");
                setShowColorPicker((currentValue) => !currentValue);
              }}
            >
              <span>{color || "Select color"}</span>
              <span
                aria-hidden="true"
                className={recipeBrowserStyles.colorSwatch}
                style={{ backgroundColor: isHexColor(color) ? color : "transparent" }}
              />
            </button>
            {showColorPicker && (
              <div
                className={recipeBrowserStyles.colorPickerPanel(theme)}
                onPointerDown={(event) => event.stopPropagation()}
              >
                <input
                  aria-label="Choose ingredient color"
                  className={recipeBrowserStyles.colorPickerInput}
                  type="color"
                  value={colorDraft}
                  onChange={(event) => setColorDraft(event.target.value)}
                />
                <div className={recipeBrowserStyles.colorPickerActions}>
                  <button
                    className={recipeBrowserStyles.secondaryButton(theme)}
                    type="button"
                    onClick={() => setShowColorPicker(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className={recipeBrowserStyles.primaryButton(theme)}
                    type="button"
                    onClick={() => {
                      setColor(colorDraft);
                      setShowColorPicker(false);
                    }}
                  >
                    OK
                  </button>
                </div>
              </div>
            )}
          </section>

          <section className={recipeBrowserStyles.field}>
            <span className={recipeBrowserStyles.label(theme)}>Ingredient preview</span>
            <IngredientThumbnail
              ingredient={{
                ingredientName: ingredientName.trim() || "Ingredient",
                brand: selectedBrand,
                tags: selectedTags,
                color: nullableText(color),
              }}
              theme={theme}
            />
          </section>
        </div>
      </div>

      <div className={recipeBrowserStyles.formActions}>
        <button className={recipeBrowserStyles.secondaryButton(theme)} disabled={isSaving} type="button" onClick={onCancel}>
          Cancel
        </button>
        <button className={recipeBrowserStyles.primaryButton(theme)} disabled={isSaving} type="submit">
          {isSaving ? "Saving..." : isEditing ? "Save ingredient" : "Create ingredient"}
        </button>
      </div>
    </form>
  );
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

function numberToInputValue(value: number | null | undefined) {
  return value === null || value === undefined ? "" : value.toString();
}

function isHexColor(value: string) {
  return /^#[0-9a-f]{6}$/i.test(value);
}

function toggleValue<TValue>(values: TValue[], value: TValue) {
  return values.includes(value)
    ? values.filter((currentValue) => currentValue !== value)
    : [...values, value];
}

export default IngredientCreateForm;
