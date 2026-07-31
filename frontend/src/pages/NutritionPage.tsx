import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../contexts";
import type { INutritionSummary } from "../interfaces/INutrition";
import { nutritionService } from "../services";
import { nutritionStyles, pageStyles, type SiteTheme } from "../styles/appStyles";

type NutritionPageProps = {
  theme: SiteTheme;
};

const DEFAULT_PROFILE_ID = "female-25-50";
const DEFAULT_PEOPLE_EATING = 1;

function NutritionPage({ theme }: NutritionPageProps) {
  const { t } = useLanguage();
  const [profileId, setProfileId] = useState(DEFAULT_PROFILE_ID);
  const [peopleEating, setPeopleEating] = useState(DEFAULT_PEOPLE_EATING);
  const [weekStart, setWeekStart] = useState(() => toDateInput(startOfWeek(new Date())));
  const [summary, setSummary] = useState<INutritionSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);

  useEffect(() => {
    let ignore = false;

    async function loadPreference() {
      try {
        const preference = await nutritionService.getProfilePreference();
        if (!ignore && preference.profileId !== null) {
          setProfileId(preference.profileId);
        }
      } catch {
        // The summary still works when profile preference persistence is unavailable.
      }
    }

    void loadPreference();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadNutrition() {
      setIsLoading(true);
      setError(null);

      try {
        const nextSummary = await nutritionService.getWeeklySummary(weekStart, weekEnd, profileId);
        if (!ignore) {
          setSummary(nextSummary);
          setProfileId(nextSummary.profile.profileId);
        }
      } catch {
        if (!ignore) {
          setError(t.nutrition.couldNotLoad);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void loadNutrition();

    return () => {
      ignore = true;
    };
  }, [profileId, t.nutrition.couldNotLoad, weekEnd, weekStart]);

  return (
    <main className={pageStyles.shell}>
      <section className={nutritionStyles.shell}>
        <header className={nutritionStyles.header}>
          <h1 className={nutritionStyles.title(theme)}>{t.nutrition.pageTitle}</h1>
          <p className={nutritionStyles.intro(theme)}>{t.nutrition.pageIntro}</p>
          <p className={nutritionStyles.sourceText(theme)}>{t.nutrition.approximateNotice}</p>
        </header>

        <section className={nutritionStyles.panel(theme)}>
          <label className={nutritionStyles.field}>
            <span className={nutritionStyles.label}>{t.nutrition.weekStart}</span>
            <input
              className={nutritionStyles.input(theme)}
              type="date"
              value={weekStart}
              onChange={(event) => setWeekStart(event.target.value)}
            />
          </label>
          <label className={nutritionStyles.field}>
            <span className={nutritionStyles.label}>{t.nutrition.profile}</span>
            <select
              className={nutritionStyles.input(theme)}
              value={profileId}
              onChange={(event) => {
                const nextProfileId = event.target.value;
                setProfileId(nextProfileId);
                void nutritionService.updateProfilePreference(nextProfileId);
              }}
            >
              {(summary?.profiles ?? []).map((profile) => (
                <option key={profile.profileId} value={profile.profileId}>
                  {profile.label}
                </option>
              ))}
              {summary === null && <option value={DEFAULT_PROFILE_ID}>{t.nutrition.defaultProfile}</option>}
            </select>
          </label>
          <label className={nutritionStyles.field}>
            <span className={nutritionStyles.label}>{t.nutrition.peopleEating}</span>
            <input
              className={nutritionStyles.input(theme)}
              min="1"
              step="1"
              type="number"
              value={peopleEating}
              onChange={(event) => setPeopleEating(parsePeopleEating(event.target.value))}
            />
          </label>
        </section>

        {summary?.referenceSource !== null && summary?.referenceSource !== undefined && (
          <p className={nutritionStyles.sourceText(theme)}>
            {t.nutrition.referenceSource(
              summary.referenceSource.provider,
              formatDateTime(summary.referenceSource.importedAt, t.locale),
            )}{" "}
            <a className={nutritionStyles.sourceLink(theme)} href={summary.referenceSource.sourceUrl} target="_blank" rel="noreferrer">
              {t.nutrition.referenceSourceLink}
            </a>
          </p>
        )}

        {summary !== null && summary.missingNutritionIngredients.length > 0 && (
          <section className={nutritionStyles.warningPanel(theme)}>
            <h2 className={nutritionStyles.warningTitle}>{t.nutrition.missingNutritionTitle}</h2>
            <p className={nutritionStyles.warningText}>
              {t.nutrition.missingNutritionIntro(summary.missingNutritionIngredients.length)}
            </p>
            <div className={nutritionStyles.warningList}>
              {summary.missingNutritionIngredients.map((ingredient) => (
                <span className={nutritionStyles.warningChip(theme)} key={ingredient.ingredientId}>
                  {ingredient.brandName === null ? ingredient.ingredientName : `${ingredient.ingredientName}, ${ingredient.brandName}`}
                </span>
              ))}
            </div>
          </section>
        )}

        {error !== null && <p className={nutritionStyles.statusError(theme)}>{error}</p>}
        {isLoading ? (
          <div className={nutritionStyles.emptyState(theme)}>{t.common.working}</div>
        ) : summary === null ? (
          <div className={nutritionStyles.emptyState(theme)}>{t.nutrition.noData}</div>
        ) : (
          <>
            <section className={nutritionStyles.dailyPanel(theme)}>
              <div className={nutritionStyles.dailyHeader}>
                <h2 className={nutritionStyles.dailyTitle}>{t.nutrition.dailyCaloriesTitle}</h2>
                <span className={nutritionStyles.dailySubtitle(theme)}>{t.nutrition.dailyCaloriesSubtitle(peopleEating)}</span>
              </div>
              <div className={nutritionStyles.dailyGrid}>
                {summary.dailyCalories.map((day) => (
                  <article className={nutritionStyles.dailyItem(theme)} key={day.date}>
                    <span className={nutritionStyles.dailyDay}>{formatWeekday(day.date, t.locale)}</span>
                    <span className={nutritionStyles.dailyCalories(theme)}>
                      {formatCaloriesForPeople(day.calories, peopleEating, t.locale)}
                    </span>
                  </article>
                ))}
              </div>
            </section>

            <section className={nutritionStyles.grid}>
              {summary.items.map((item) => (
                <article className={nutritionStyles.item(theme)} key={item.key}>
                  <div className={nutritionStyles.itemHeader}>
                    <h2 className={nutritionStyles.itemTitle}>{t.nutrition.items[item.key] ?? item.label}</h2>
                    <span className={nutritionStyles.itemTotal(theme)}>{formatAmount(item.total, item.unit, t.locale)}</span>
                  </div>
                  <div className={nutritionStyles.progressTrack(theme)}>
                    <span
                      className={nutritionStyles.progressFill(theme)}
                      style={{ width: `${Math.min(item.percentOfRecommended ?? 0, 100)}%` }}
                    />
                  </div>
                  <span className={nutritionStyles.itemMeta(theme)}>
                    {formatReference(item, t)}
                  </span>
                  {item.coveragePercent !== null && (
                    <span className={nutritionStyles.itemMeta(theme)}>
                      {t.nutrition.coverage(item.coveragePercent)} · {t.nutrition.statusLabels[item.status] ?? item.status}
                    </span>
                  )}
                </article>
              ))}
            </section>
          </>
        )}
      </section>
    </main>
  );
}

function parsePeopleEating(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 1 ? Math.round(parsed) : DEFAULT_PEOPLE_EATING;
}

function formatWeekday(value: string, locale: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString(locale, {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

function formatCaloriesForPeople(value: number | null, peopleEating: number, locale: string) {
  if (value === null) {
    return "-";
  }

  return `${Math.round(value / peopleEating).toLocaleString(locale)} kcal`;
}

function startOfWeek(date: Date) {
  const nextDate = new Date(date);
  const day = (nextDate.getDay() + 6) % 7;
  nextDate.setDate(nextDate.getDate() - day);
  return nextDate;
}

function addDays(value: string, days: number) {
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + days);
  return toDateInput(date);
}

function toDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatAmount(value: number | null, unit: string, locale: string) {
  return value === null ? "-" : `${value.toLocaleString(locale, { maximumFractionDigits: 1 })} ${unit}`;
}

function formatReference(item: INutritionSummary["items"][number], t: ReturnType<typeof useLanguage>["t"]) {
  if (item.targetType.startsWith("energyRange:")) {
    const range = parseEnergyRange(item.targetType);
    return item.recommendedWeekly === null || range === null
      ? t.nutrition.referenceNotSet
      : t.nutrition.energyRangeComparison(item.recommendedWeekly, range.minimum, range.maximum);
  }

  if (item.targetType.startsWith("energyMaximum:")) {
    const maximum = parseEnergyThreshold(item.targetType);
    return item.recommendedWeekly === null || maximum === null
      ? t.nutrition.referenceNotSet
      : t.nutrition.energyMaximumComparison(item.recommendedWeekly, maximum);
  }

  if (item.targetType.startsWith("energyMinimum:")) {
    const minimum = parseEnergyThreshold(item.targetType);
    return item.recommendedWeekly === null || minimum === null
      ? t.nutrition.referenceNotSet
      : t.nutrition.energyMinimumComparison(item.recommendedWeekly, minimum);
  }

  if (item.targetType === "asLowAsPossible") {
    return t.nutrition.asLowAsPossibleTarget;
  }

  return item.recommendedWeekly === null
    ? t.nutrition.referenceNotSet
    : t.nutrition.comparedTo(formatAmount(item.recommendedWeekly, item.unit, t.locale), item.percentOfRecommended ?? 0);
}

function parseEnergyRange(targetType: string) {
  const [, rawRange] = targetType.split(":");
  const [rawMinimum, rawMaximum] = rawRange?.split("-") ?? [];
  const minimum = Number(rawMinimum);
  const maximum = Number(rawMaximum);

  return Number.isFinite(minimum) && Number.isFinite(maximum)
    ? { minimum, maximum }
    : null;
}

function parseEnergyThreshold(targetType: string) {
  const [, rawThreshold] = targetType.split(":");
  const threshold = Number(rawThreshold);
  return Number.isFinite(threshold) ? threshold : null;
}

function formatDateTime(value: string, locale: string) {
  return new Date(value).toLocaleDateString(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default NutritionPage;
