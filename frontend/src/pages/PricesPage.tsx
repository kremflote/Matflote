import { useEffect, useMemo, useState, type FormEvent } from "react";
import CreatableSelect from "../components/recipeBrowser/CreatableSelect";
import { useIngredients, useLanguage, useStores } from "../contexts";
import type { IIngredientPricePoint, IIngredientPriceSummary } from "../interfaces/IIngredientPrice";
import { ingredientPriceService, storeService } from "../services";
import { pageStyles, priceStyles, type SiteTheme } from "../styles/appStyles";
import { formatCurrency, formatPriceDate, normalizePriceInput, todayInputValue } from "../utils/priceFormatting";

type PricesPageProps = {
  theme: SiteTheme;
};

type PriceFormState = {
  ingredientId: string;
  storeId: number | null;
  price: string;
  date: string;
  note: string;
};

function PricesPage({ theme }: PricesPageProps) {
  const { ingredients } = useIngredients();
  const { stores, refreshStores } = useStores();
  const { t } = useLanguage();
  const [pricePoints, setPricePoints] = useState<IIngredientPricePoint[]>([]);
  const [summaries, setSummaries] = useState<IIngredientPriceSummary[]>([]);
  const [form, setForm] = useState<PriceFormState>({
    ingredientId: "",
    storeId: null,
    price: "",
    date: todayInputValue(),
    note: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIngredientId, setSelectedIngredientId] = useState<number | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadPrices() {
      setIsLoading(true);
      setError(null);

      try {
        const [nextPricePoints, nextSummaries] = await Promise.all([
          ingredientPriceService.getAll(),
          ingredientPriceService.getSummary(),
        ]);
        if (!ignore) {
          setPricePoints(nextPricePoints);
          setSummaries(nextSummaries);
          setSelectedIngredientId((currentId) => currentId ?? nextSummaries[0]?.ingredientId ?? null);
        }
      } catch {
        if (!ignore) {
          setError(t.prices.couldNotLoad);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void loadPrices();

    return () => {
      ignore = true;
    };
  }, [t.prices.couldNotLoad]);

  const groupedPricePoints = useMemo(() => groupPricePoints(pricePoints), [pricePoints]);
  const selectedSummary = summaries.find((summary) => summary.ingredientId === selectedIngredientId) ?? summaries[0] ?? null;
  const selectedPricePoints = useMemo(
    () =>
      selectedSummary === null
        ? []
        : pricePoints
            .filter((pricePoint) => pricePoint.ingredientId === selectedSummary.ingredientId)
            .sort((first, second) =>
              first.date.localeCompare(second.date) ||
              first.ingredientPricePointId - second.ingredientPricePointId,
            ),
    [pricePoints, selectedSummary],
  );

  async function savePricePoint(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const ingredientId = Number(form.ingredientId);
    const price = Number(form.price.replace(",", "."));
    if (!Number.isInteger(ingredientId) || ingredientId <= 0 || !Number.isFinite(price) || price <= 0 || form.storeId === null) {
      setError(t.prices.couldNotSave);
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const createdPricePoint = await ingredientPriceService.create({
        ingredientId,
        storeId: form.storeId,
        price,
        date: form.date,
        note: form.note.trim().length === 0 ? null : form.note.trim(),
      });
      const [nextPricePoints, nextSummaries] = await Promise.all([
        ingredientPriceService.getAll(),
        ingredientPriceService.getSummary(),
      ]);
      setPricePoints(nextPricePoints);
      setSummaries(nextSummaries);
      setSelectedIngredientId(createdPricePoint.ingredientId);
      setForm({
        ingredientId: form.ingredientId,
        storeId: form.storeId,
        price: "",
        date: todayInputValue(),
        note: "",
      });
    } catch {
      setError(t.prices.couldNotSave);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className={pageStyles.shell}>
      <section className={priceStyles.shell}>
        <header className={priceStyles.header}>
          <h1 className={priceStyles.title(theme)}>{t.prices.pageTitle}</h1>
          <p className={priceStyles.intro(theme)}>{t.prices.pageIntro}</p>
        </header>

        <section className={priceStyles.panel(theme)}>
          <h2 className={priceStyles.ingredientName}>{t.prices.addPrice}</h2>
          <form className={priceStyles.form} onSubmit={savePricePoint}>
            <label className={priceStyles.field}>
              <span className={priceStyles.label}>{t.prices.ingredient}</span>
              <select
                className={priceStyles.input(theme)}
                value={form.ingredientId}
                onChange={(event) => setForm({ ...form, ingredientId: event.target.value })}
              >
                <option value="">{t.cookbook.ingredientSingular}</option>
                {ingredients.map((ingredient) => (
                  <option key={ingredient.ingredientId} value={ingredient.ingredientId}>
                    {ingredient.ingredientName}
                  </option>
                ))}
              </select>
            </label>
            <CreatableSelect
              createLabel={t.common.createNew}
              label={t.prices.store}
              options={stores.map((store) => ({ id: store.storeId, name: store.name }))}
              placeholder={t.prices.selectStore}
              theme={theme}
              value={form.storeId}
              onChange={(storeId) => setForm({ ...form, storeId })}
              onCreate={async (name) => {
                const store = await storeService.create({ name });
                await refreshStores();
                return { id: store.storeId, name: store.name };
              }}
            />
            <label className={priceStyles.field}>
              <span className={priceStyles.label}>{t.prices.price}</span>
              <input
                className={priceStyles.input(theme)}
                inputMode="decimal"
                placeholder={t.prices.pricePlaceholder}
                type="text"
                value={form.price}
                onChange={(event) => setForm({ ...form, price: normalizePriceInput(event.target.value) })}
              />
            </label>
            <label className={priceStyles.field}>
              <span className={priceStyles.label}>{t.prices.date}</span>
              <input
                className={priceStyles.input(theme)}
                type="date"
                value={form.date}
                onChange={(event) => setForm({ ...form, date: event.target.value })}
              />
            </label>
            <label className={`${priceStyles.field} md:col-span-2`}>
              <span className={priceStyles.label}>{t.prices.note}</span>
              <input
                className={priceStyles.input(theme)}
                maxLength={500}
                placeholder={t.prices.notePlaceholder}
                value={form.note}
                onChange={(event) => setForm({ ...form, note: event.target.value })}
              />
            </label>
            <button className={priceStyles.primaryButton(theme)} disabled={isSaving} type="submit">
              {isSaving ? t.common.saving : t.prices.savePrice}
            </button>
          </form>
          {error !== null && <p className={priceStyles.statusError(theme)}>{error}</p>}
        </section>

        {summaries.length > 0 && (
          <section className={priceStyles.summaryGrid}>
            <SummaryCard
              label={t.prices.trackedIngredients}
              theme={theme}
              value={summaries.length.toLocaleString(t.locale)}
            />
            <SummaryCard
              label={t.prices.trackedPrices}
              theme={theme}
              value={pricePoints.length.toLocaleString(t.locale)}
            />
            <SummaryCard
              label={t.prices.lowest}
              meta={getLowestSummaryLabel(summaries, t.locale)}
              theme={theme}
              value={formatCurrency(getLowestSummaryPrice(summaries), t.locale)}
            />
          </section>
        )}

        {selectedSummary !== null && (
          <section className={priceStyles.panel(theme)}>
            <div className={priceStyles.ingredientHeader}>
              <div>
                <p className={priceStyles.kicker(theme)}>{t.prices.selectedIngredient}</p>
                <h2 className={priceStyles.ingredientName}>{selectedSummary.ingredientName}</h2>
              </div>
              <select
                className={priceStyles.select(theme)}
                value={selectedSummary.ingredientId}
                onChange={(event) => setSelectedIngredientId(Number(event.target.value))}
              >
                {summaries.map((summary) => (
                  <option key={summary.ingredientId} value={summary.ingredientId}>
                    {summary.ingredientName}
                  </option>
                ))}
              </select>
            </div>
            <div className={priceStyles.metricGrid}>
              <SummaryCard
                label={t.prices.latest}
                meta={formatSummaryMeta(selectedSummary.latestStoreName, selectedSummary.latestDate, t.locale)}
                theme={theme}
                value={formatCurrency(selectedSummary.latestPrice ?? 0, t.locale)}
              />
              <SummaryCard
                label={t.prices.lowest}
                meta={formatSummaryMeta(selectedSummary.lowestStoreName, selectedSummary.lowestDate, t.locale)}
                theme={theme}
                value={formatCurrency(selectedSummary.lowestPrice ?? 0, t.locale)}
              />
              <SummaryCard
                label={t.prices.average}
                theme={theme}
                value={formatCurrency(selectedSummary.averagePrice ?? 0, t.locale)}
              />
            </div>
            <PriceLineChart points={selectedPricePoints} theme={theme} />
            {selectedSummary.stores.length > 0 && (
              <section className={priceStyles.storeComparison}>
                <h3 className={priceStyles.sectionTitle}>{t.prices.storeComparison}</h3>
                <div className={priceStyles.priceRows}>
                  {selectedSummary.stores.map((store) => (
                    <div className={priceStyles.priceRow(theme)} key={store.storeId}>
                      <span className={priceStyles.rowMain}>
                        <span className={priceStyles.rowStore}>{store.storeName}</span>
                        <span className={priceStyles.rowNote(theme)}>
                          {store.pricePointCount.toLocaleString(t.locale)} {t.prices.trackedPrices.toLowerCase()}
                        </span>
                      </span>
                      <span className={priceStyles.rowPrice}>{formatCurrency(store.latestPrice, t.locale)}</span>
                      <span className={priceStyles.rowDate}>{formatPriceDate(store.latestDate, t.locale)}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </section>
        )}

        <section className={priceStyles.grid}>
          <h2 className={priceStyles.ingredientName}>{t.prices.history}</h2>
          {isLoading ? (
            <div className={priceStyles.emptyState(theme)}>{t.common.working}</div>
          ) : groupedPricePoints.length === 0 ? (
            <div className={priceStyles.emptyState(theme)}>{t.prices.empty}</div>
          ) : (
            groupedPricePoints.map((group) => (
              <article className={priceStyles.ingredientGroup(theme)} key={group.ingredientId}>
                <div className={priceStyles.ingredientHeader}>
                  <h3 className={priceStyles.ingredientName}>{group.ingredientName}</h3>
                  <span className={priceStyles.latestPrice(theme)}>
                    {t.prices.latest}: {formatCurrency(group.pricePoints[0]?.price ?? 0, t.locale)}
                  </span>
                </div>
                <div className={priceStyles.priceRows}>
                  {group.pricePoints.map((pricePoint) => (
                    <PricePointRow key={pricePoint.ingredientPricePointId} pricePoint={pricePoint} theme={theme} />
                  ))}
                </div>
              </article>
            ))
          )}
        </section>
      </section>
    </main>
  );
}

function SummaryCard({ label, value, meta, theme }: { label: string; value: string; meta?: string; theme: SiteTheme }) {
  return (
    <article className={priceStyles.summaryCard(theme)}>
      <span className={priceStyles.kicker(theme)}>{label}</span>
      <strong className={priceStyles.summaryValue}>{value}</strong>
      {meta !== undefined && <span className={priceStyles.summaryMeta(theme)}>{meta}</span>}
    </article>
  );
}

function PriceLineChart({ points, theme }: { points: IIngredientPricePoint[]; theme: SiteTheme }) {
  const { t } = useLanguage();

  if (points.length < 2) {
    return <div className={priceStyles.emptyState(theme)}>{t.prices.empty}</div>;
  }

  const width = 640;
  const height = 180;
  const padding = 24;
  const prices = points.map((point) => point.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = Math.max(maxPrice - minPrice, 1);
  const path = points
    .map((point, index) => {
      const x = padding + (index / Math.max(points.length - 1, 1)) * (width - padding * 2);
      const y = height - padding - ((point.price - minPrice) / priceRange) * (height - padding * 2);
      return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <figure className={priceStyles.chartFrame(theme)}>
      <svg className={priceStyles.chartSvg} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={t.prices.history}>
        <path className={priceStyles.chartGridLine(theme)} d={`M ${padding} ${height - padding} H ${width - padding}`} />
        <path className={priceStyles.chartLine(theme)} d={path} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((point, index) => {
          const x = padding + (index / Math.max(points.length - 1, 1)) * (width - padding * 2);
          const y = height - padding - ((point.price - minPrice) / priceRange) * (height - padding * 2);

          return (
            <circle
              className={priceStyles.chartPoint(theme)}
              cx={x}
              cy={y}
              key={point.ingredientPricePointId}
              r="4"
            />
          );
        })}
      </svg>
      <figcaption className={priceStyles.chartCaption(theme)}>
        {formatCurrency(minPrice, t.locale)} - {formatCurrency(maxPrice, t.locale)}
      </figcaption>
    </figure>
  );
}

function PricePointRow({ pricePoint, theme }: { pricePoint: IIngredientPricePoint; theme: SiteTheme }) {
  const { t } = useLanguage();

  return (
    <div className={priceStyles.priceRow(theme)}>
      <span className={priceStyles.rowMain}>
        <span className={priceStyles.rowStore}>{pricePoint.store.name}</span>
        {pricePoint.note !== null && <span className={priceStyles.rowNote(theme)}>{pricePoint.note}</span>}
      </span>
      <span className={priceStyles.rowPrice}>{formatCurrency(pricePoint.price, t.locale)}</span>
      <span className={priceStyles.rowDate}>{formatPriceDate(pricePoint.date, t.locale)}</span>
    </div>
  );
}

function groupPricePoints(pricePoints: IIngredientPricePoint[]) {
  const groups = new Map<number, { ingredientId: number; ingredientName: string; pricePoints: IIngredientPricePoint[] }>();

  pricePoints.forEach((pricePoint) => {
    const group = groups.get(pricePoint.ingredientId) ?? {
      ingredientId: pricePoint.ingredientId,
      ingredientName: pricePoint.ingredientName,
      pricePoints: [],
    };
    group.pricePoints.push(pricePoint);
    groups.set(pricePoint.ingredientId, group);
  });

  return [...groups.values()]
    .map((group) => ({
      ...group,
      pricePoints: group.pricePoints.sort((first, second) =>
        second.date.localeCompare(first.date) ||
        second.ingredientPricePointId - first.ingredientPricePointId,
      ),
    }))
    .sort((first, second) => first.ingredientName.localeCompare(second.ingredientName));
}

function getLowestSummaryPrice(summaries: IIngredientPriceSummary[]) {
  return summaries.reduce<number>((lowestPrice, summary) => {
    if (summary.lowestPrice === null) {
      return lowestPrice;
    }

    return Math.min(lowestPrice, summary.lowestPrice);
  }, Number.POSITIVE_INFINITY);
}

function getLowestSummaryLabel(summaries: IIngredientPriceSummary[], locale: string) {
  const lowestSummary = summaries
    .filter((summary) => summary.lowestPrice !== null)
    .sort((first, second) => (first.lowestPrice ?? 0) - (second.lowestPrice ?? 0))[0];

  if (lowestSummary === undefined) {
    return undefined;
  }

  return formatSummaryMeta(lowestSummary.ingredientName, lowestSummary.lowestDate, locale);
}

function formatSummaryMeta(label: string | null, date: string | null, locale: string) {
  return [label, date === null ? null : formatPriceDate(date, locale)]
    .filter((value): value is string => value !== null && value.length > 0)
    .join(" · ");
}

export default PricesPage;
