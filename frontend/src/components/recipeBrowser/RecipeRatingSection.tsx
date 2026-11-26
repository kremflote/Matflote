import { useState } from "react";
import { useLanguage, useRecipes } from "../../contexts";
import type { IRecipe } from "../../interfaces/IRecipe";
import { ApiError, recipeService } from "../../services";
import type { SiteTheme } from "../../styles/appStyles";
import { DetailSection } from "./detailComponents";
import { recipeBrowserStyles } from "./recipeBrowserStyles";

const ratingValues = [1, 2, 3, 4, 5] as const;

type RecipeRatingSectionProps = {
  recipe: IRecipe;
  theme: SiteTheme;
};

/** One to five stars and a short note. A star click saves at once; the note has its own Save button. */
export default function RecipeRatingSection({ recipe, theme }: RecipeRatingSectionProps) {
  const { t } = useLanguage();
  const { upsertRecipe } = useRecipes();
  const [note, setNote] = useState(recipe.ratingNote ?? "");
  const [noteSource, setNoteSource] = useState({ recipeId: recipe.recipeId, ratingNote: recipe.ratingNote });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const text = t.recipeRating;

  // Another recipe, or a note saved elsewhere, resets the field; adjusted while rendering, not in an effect.
  if (noteSource.recipeId !== recipe.recipeId || noteSource.ratingNote !== recipe.ratingNote) {
    setNoteSource({ recipeId: recipe.recipeId, ratingNote: recipe.ratingNote });
    setNote(recipe.ratingNote ?? "");
  }

  const save = async (rating: number | null, nextNote: string) => {
    setIsSaving(true);
    setError(null);

    try {
      upsertRecipe(await recipeService.setRating(recipe.recipeId, rating, nextNote.trim().length > 0 ? nextNote.trim() : null));
    } catch (saveError) {
      setError(saveError instanceof ApiError && saveError.message.trim().length > 0
        ? `${text.couldNotSave} ${saveError.message}`
        : text.couldNotSave);
    } finally {
      setIsSaving(false);
    }
  };

  const rating = recipe.rating;

  return (
    <DetailSection title={text.title} subtitle={rating === null ? text.notRated : text.star(rating)} theme={theme}>
      <div className={recipeBrowserStyles.ratingBody}>
        <div aria-label={text.title} className={recipeBrowserStyles.ratingStars} role="group">
          {ratingValues.map((value) => (
            <button
              aria-label={text.star(value)}
              aria-pressed={rating === value}
              className={recipeBrowserStyles.ratingStar(theme, rating !== null && value <= rating)}
              disabled={isSaving}
              key={value}
              type="button"
              onClick={() => void save(value, note)}
            >
              <span aria-hidden="true">{rating !== null && value <= rating ? "★" : "☆"}</span>
            </button>
          ))}
          {rating !== null && (
            <button
              className={recipeBrowserStyles.ratingButton}
              disabled={isSaving}
              type="button"
              onClick={() => void save(null, "")}
            >
              {text.clear}
            </button>
          )}
        </div>
        {rating !== null && (
          <form
            className={recipeBrowserStyles.ratingNoteRow}
            onSubmit={(event) => {
              event.preventDefault();
              void save(rating, note);
            }}
          >
            <input
              aria-label={text.note}
              className={recipeBrowserStyles.ratingNoteInput}
              disabled={isSaving}
              maxLength={500}
              placeholder={text.notePlaceholder}
              type="text"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
            <button
              className={recipeBrowserStyles.ratingButton}
              disabled={isSaving || note.trim() === (recipe.ratingNote ?? "")}
              type="submit"
            >
              {isSaving ? text.saving : text.saveNote}
            </button>
          </form>
        )}
        <p className={recipeBrowserStyles.helperText(theme)}>{error ?? text.help}</p>
      </div>
    </DetailSection>
  );
}
