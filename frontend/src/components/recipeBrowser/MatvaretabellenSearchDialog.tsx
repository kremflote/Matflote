import { useId, useState, type KeyboardEvent } from "react";
import Modal from "../Modal";
import { useLanguage } from "../../contexts";
import type { INutritionFacts } from "../../interfaces/IIngredient";
import type { IMatvaretabellenCandidate, IProductLookupNutrition } from "../../interfaces/IProductLookup";
import { productLookupService } from "../../services";
import type { SiteTheme } from "../../styles/appStyles";
import { recipeBrowserStyles } from "./recipeBrowserStyles";

export type MatvaretabellenNutritionCandidate = {
  foodId: string;
  foodName: string;
  url: string | null;
  confidence: number;
  nutrition: INutritionFacts;
};

type MatvaretabellenSearchDialogProps = {
  initialQuery?: string;
  theme: SiteTheme;
  onCancel: () => void;
  onSelect: (
    candidate: MatvaretabellenNutritionCandidate,
    candidates: MatvaretabellenNutritionCandidate[],
  ) => void;
};

function MatvaretabellenSearchDialog({
  initialQuery = "",
  theme,
  onCancel,
  onSelect,
}: MatvaretabellenSearchDialogProps) {
  const { t } = useLanguage();
  const titleId = useId();
  const [query, setQuery] = useState(initialQuery);
  const [candidates, setCandidates] = useState<MatvaretabellenNutritionCandidate[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch() {
    const trimmedQuery = query.trim();
    if (trimmedQuery.length === 0) {
      return;
    }

    setIsSearching(true);
    setError(null);
    try {
      const results = await productLookupService.searchMatvaretabellen(trimmedQuery);
      setCandidates(results.map(toMatvaretabellenNutritionCandidate));
      setHasSearched(true);
    } catch {
      setCandidates([]);
      setHasSearched(true);
      setError(t.scanner.searchMatvaretabellenError);
    } finally {
      setIsSearching(false);
    }
  }

  function handleSearchInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    void handleSearch();
  }

  return (
    <Modal
      backdropClassName={recipeBrowserStyles.modalBackdrop}
      bodyClassName={recipeBrowserStyles.nestedIngredientModalBody}
      closeButtonClassName={recipeBrowserStyles.modalCloseButton(theme)}
      closeLabel={t.common.close}
      footer={(
        <button className={recipeBrowserStyles.secondaryButton(theme)} type="button" onClick={onCancel}>
          {t.common.cancel}
        </button>
      )}
      footerClassName={recipeBrowserStyles.formActions}
      headerClassName={recipeBrowserStyles.modalHeader}
      panelClassName={recipeBrowserStyles.nestedIngredientModalPanel(theme)}
      title={t.scanner.searchMatvaretabellenTitle}
      titleClassName={recipeBrowserStyles.modalTitle}
      titleId={titleId}
      onClose={onCancel}
    >
      <div className={recipeBrowserStyles.matvareSearchForm}>
        <input
          className={recipeBrowserStyles.textField(theme)}
          placeholder={t.scanner.searchMatvaretabellenPlaceholder}
          type="search"
          value={query}
          onKeyDown={handleSearchInputKeyDown}
          onChange={(event) => setQuery(event.target.value)}
        />
        <button
          className={recipeBrowserStyles.primaryButton(theme)}
          disabled={isSearching || query.trim().length === 0}
          type="button"
          onClick={() => void handleSearch()}
        >
          {isSearching ? t.scanner.searching : t.scanner.searchMatvaretabellen}
        </button>
      </div>
      {error !== null && (
        <p className={recipeBrowserStyles.statusError(theme)}>{error}</p>
      )}
      {hasSearched && candidates.length === 0 && error === null && (
        <p className={recipeBrowserStyles.emptyState(theme)}>{t.scanner.searchMatvaretabellenEmpty}</p>
      )}
      <MatvaretabellenCandidateList
        candidates={candidates}
        theme={theme}
        onSelect={(candidate) => onSelect(candidate, candidates)}
      />
    </Modal>
  );
}

export function MatvaretabellenCandidateList({
  candidates,
  theme,
  onSelect,
}: {
  candidates: MatvaretabellenNutritionCandidate[];
  theme: SiteTheme;
  onSelect: (candidate: MatvaretabellenNutritionCandidate) => void;
}) {
  const { t } = useLanguage();

  return (
    <>
      {candidates.map((candidate) => (
        <button
          className={recipeBrowserStyles.matvareCandidateButton(theme)}
          key={candidate.foodId}
          type="button"
          onClick={() => onSelect(candidate)}
        >
          <span className={recipeBrowserStyles.matvareCandidateName}>{candidate.foodName}</span>
          <span className={recipeBrowserStyles.matvareCandidateMeta(theme)}>
            {t.scanner.matvaretabellenScore(candidate.confidence)}
          </span>
          <span className={recipeBrowserStyles.matvareCandidateMacros(theme)}>
            {formatCandidateMacros(candidate.nutrition, {
              calories: t.cookbook.calories,
              carbs: t.cookbook.carbs,
              fiber: t.cookbook.fiber,
              protein: t.cookbook.protein,
            })}
          </span>
        </button>
      ))}
    </>
  );
}

export function toMatvaretabellenNutritionCandidate(
  candidate: IMatvaretabellenCandidate,
): MatvaretabellenNutritionCandidate {
  return {
    foodId: candidate.foodId,
    foodName: candidate.foodName,
    url: candidate.url,
    confidence: candidate.confidence,
    nutrition: toIngredientNutrition(candidate.nutrition),
  };
}

function toIngredientNutrition(nutrition: IProductLookupNutrition): INutritionFacts {
  return {
    calories: nutrition.calories,
    carbohydrateGrams: nutrition.carbohydrateGrams,
    proteinGrams: nutrition.proteinGrams,
    saltGrams: nutrition.saltGrams,
    dietaryFiberGrams: nutrition.dietaryFiberGrams,
    saturatedFatGrams: nutrition.saturatedFatGrams,
    transFatGrams: nutrition.transFatGrams,
    monounsaturatedFatGrams: nutrition.monounsaturatedFatGrams,
    polyunsaturatedFatGrams: nutrition.polyunsaturatedFatGrams,
    omega3Grams: nutrition.omega3Grams,
    omega6Grams: nutrition.omega6Grams,
    cholesterolMilligrams: nutrition.cholesterolMilligrams,
    vitaminAMicrograms: nutrition.vitaminAMicrograms,
    vitaminB9Micrograms: nutrition.vitaminB9Micrograms,
    vitaminB12Micrograms: nutrition.vitaminB12Micrograms,
    vitaminCMilligrams: nutrition.vitaminCMilligrams,
    vitaminDMicrograms: nutrition.vitaminDMicrograms,
    vitaminEMilligrams: nutrition.vitaminEMilligrams,
    vitaminKMicrograms: nutrition.vitaminKMicrograms,
    cholineMilligrams: nutrition.cholineMilligrams,
    vitamins: [],
  };
}

function formatCandidateMacros(
  nutrition: INutritionFacts,
  labels: { calories: string; carbs: string; fiber: string; protein: string },
) {
  return [
    nutrition.calories === null ? null : `${labels.calories}: ${nutrition.calories} kcal`,
    nutrition.carbohydrateGrams === null ? null : `${labels.carbs}: ${nutrition.carbohydrateGrams} g`,
    nutrition.proteinGrams === null ? null : `${labels.protein}: ${nutrition.proteinGrams} g`,
    nutrition.dietaryFiberGrams === null ? null : `${labels.fiber}: ${nutrition.dietaryFiberGrams} g`,
  ].filter(Boolean).join(" · ");
}

export default MatvaretabellenSearchDialog;
