import { useEffect, useMemo, useState } from "react";
import { useIngredients, useIngredientTagCategories, useLanguage } from "../../contexts";
import type { IPlanningPreferences } from "../../interfaces/IPlanningPreferences";
import { ApiError, appSettingsService } from "../../services";
import { controlStyles, settingsStyles, type SiteTheme } from "../../styles/appStyles";

type PlanningPreferencesPanelProps = {
  theme: SiteTheme;
};

/** The household's planning preferences: loads and saves itself. */
export default function PlanningPreferencesPanel({ theme }: PlanningPreferencesPanelProps) {
  const { t } = useLanguage();
  const { ingredients } = useIngredients();
  const { ingredientTagCategories } = useIngredientTagCategories();
  const [form, setForm] = useState<IPlanningPreferences | null>(null);
  const [ingredientToAdd, setIngredientToAdd] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const text = t.planningPreferences;

  useEffect(() => {
    let ignore = false;
    appSettingsService.getPlanningPreferences().then(
      (preferences) => {
        if (!ignore) {
          setForm(preferences);
        }
      },
      () => {
        if (!ignore) {
          setError(text.couldNotLoad);
        }
      },
    );

    return () => {
      ignore = true;
    };
  }, [text.couldNotLoad]);

  const tagNames = useMemo(
    () => ingredientTagCategories.flatMap((category) => category.tags.map((tag) => tag.name)),
    [ingredientTagCategories],
  );
  const ingredientNames = useMemo(
    () => [...new Set(ingredients.map((ingredient) => ingredient.ingredientName))].sort((first, second) => first.localeCompare(second)),
    [ingredients],
  );

  if (form === null) {
    return (
      <div className={settingsStyles.panel}>
        <h2 className={settingsStyles.panelTitle}>{text.title}</h2>
        {error !== null && <p className={settingsStyles.statusText(theme, "error")}>{error}</p>}
      </div>
    );
  }

  const update = (changes: Partial<IPlanningPreferences>) => {
    setForm({ ...form, ...changes });
    setSuccess(null);
  };

  const toggleTag = (tagName: string) =>
    update({
      avoidTags: form.avoidTags.includes(tagName)
        ? form.avoidTags.filter((name) => name !== tagName)
        : [...form.avoidTags, tagName],
    });

  const addIngredient = () => {
    if (ingredientToAdd.length > 0 && !form.avoidIngredients.includes(ingredientToAdd)) {
      update({ avoidIngredients: [...form.avoidIngredients, ingredientToAdd] });
    }

    setIngredientToAdd("");
  };

  const save = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      setForm(await appSettingsService.updatePlanningPreferences(form));
      setSuccess(text.saved);
    } catch (saveError) {
      setError(saveError instanceof ApiError && saveError.message.trim().length > 0
        ? `${text.couldNotSave} ${saveError.message}`
        : text.couldNotSave);
    } finally {
      setIsSaving(false);
    }
  };

  const numberField = (
    label: string,
    value: number,
    min: number,
    max: number,
    onChange: (value: number) => void,
    help?: string,
  ) => (
    <div className={`${settingsStyles.fieldGroup} content-start`}>
      <label className={settingsStyles.fieldGroup}>
        <span className={settingsStyles.label}>{label}</span>
        <input
          className={settingsStyles.textInput}
          disabled={isSaving}
          max={max}
          min={min}
          type="number"
          value={value}
          onChange={(event) => onChange(clamp(Number(event.target.value), min, max))}
        />
      </label>
      {help !== undefined && <span className={settingsStyles.helpText(theme)}>{help}</span>}
    </div>
  );

  return (
    <div className={settingsStyles.panel}>
      <div>
        <h2 className={settingsStyles.panelTitle}>{text.title}</h2>
        <p className={settingsStyles.panelBody(theme)}>{text.body}</p>
      </div>
      <form
        className={settingsStyles.form}
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <div className={settingsStyles.formGrid}>
          {numberField(text.peopleEating, form.peopleEating, 1, 20, (value) => update({ peopleEating: value }), text.peopleEatingHelp)}
          {numberField(text.repeatAfterWeeks, form.repeatAfterWeeks, 0, 12, (value) => update({ repeatAfterWeeks: value }), text.repeatAfterWeeksHelp)}
          {numberField(text.minFishDinners, form.minFishDinnersPerWeek, 0, 7, (value) => update({ minFishDinnersPerWeek: value }), text.minimumsHelp)}
          {numberField(text.minChickenDinners, form.minChickenDinnersPerWeek, 0, 7, (value) => update({ minChickenDinnersPerWeek: value }))}
        </div>

        <div aria-label={text.avoidTags} className={settingsStyles.fieldGroup} role="group">
          <span className={settingsStyles.label}>{text.avoidTags}</span>
          <div className={settingsStyles.buttonGroup}>
            {tagNames.map((tagName) => (
              <button
                aria-pressed={form.avoidTags.includes(tagName)}
                className={settingsStyles.languageButton(theme, form.avoidTags.includes(tagName))}
                disabled={isSaving}
                key={tagName}
                type="button"
                onClick={() => toggleTag(tagName)}
              >
                {t.enums.recipeTags[tagName] ?? t.enums.ingredientTags[tagName] ?? tagName}
              </button>
            ))}
          </div>
          <span className={settingsStyles.helpText(theme)}>{text.avoidTagsHelp}</span>
        </div>

        <div className={settingsStyles.fieldGroup}>
          <span className={settingsStyles.label} id="avoid-ingredients-label">{text.avoidIngredients}</span>
          <div className={settingsStyles.buttonGroup} aria-labelledby="avoid-ingredients-label" role="list">
            {form.avoidIngredients.length === 0 && (
              <span className={settingsStyles.helpText(theme)}>{text.noIngredientsAvoided}</span>
            )}
            {form.avoidIngredients.map((name) => (
              <span role="listitem" key={name}>
                <button
                  aria-label={text.removeIngredient(name)}
                  className={settingsStyles.languageButton(theme, true)}
                  disabled={isSaving}
                  type="button"
                  onClick={() => update({ avoidIngredients: form.avoidIngredients.filter((value) => value !== name) })}
                >
                  {name} ×
                </button>
              </span>
            ))}
          </div>
          <div className={settingsStyles.inlineActionRow}>
            <select
              aria-label={text.chooseIngredient}
              className={`${settingsStyles.selectInput} max-w-sm`}
              disabled={isSaving}
              value={ingredientToAdd}
              onChange={(event) => setIngredientToAdd(event.target.value)}
            >
              <option value="">{text.chooseIngredient}</option>
              {ingredientNames
                .filter((name) => !form.avoidIngredients.includes(name))
                .map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
            </select>
            <button
              className={settingsStyles.secondaryButton}
              disabled={isSaving || ingredientToAdd.length === 0}
              type="button"
              onClick={addIngredient}
            >
              {text.addIngredient}
            </button>
          </div>
          <span className={settingsStyles.helpText(theme)}>{text.avoidIngredientsHelp}</span>
        </div>

        <label className={settingsStyles.fieldGroup}>
          <span className={settingsStyles.label}>{text.notes}</span>
          <textarea
            className={controlStyles.textArea}
            disabled={isSaving}
            maxLength={1000}
            placeholder={text.notesPlaceholder}
            value={form.notes ?? ""}
            onChange={(event) => update({ notes: event.target.value })}
          />
        </label>

        <div className={settingsStyles.statusRow}>
          <div>
            {error !== null && <p className={settingsStyles.statusText(theme, "error")}>{error}</p>}
            {success !== null && <p className={settingsStyles.statusText(theme, "success")}>{success}</p>}
          </div>
          <button className={settingsStyles.saveButton} disabled={isSaving} type="submit">
            {isSaving ? text.saving : text.save}
          </button>
        </div>
      </form>
    </div>
  );
}

function clamp(value: number, min: number, max: number) {
  return Number.isFinite(value) ? Math.min(max, Math.max(min, Math.round(value))) : min;
}
