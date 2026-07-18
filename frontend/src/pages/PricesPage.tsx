import { useEffect, useMemo, useState, type FormEvent } from "react";
import CreatableSelect from "../components/recipeBrowser/CreatableSelect";
import { useIngredients, useLanguage, useStores } from "../contexts";
import type { IIngredientPricePoint } from "../interfaces/IIngredientPrice";
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

  useEffect(() => {
    let ignore = false;

    async function loadPrices() {
      setIsLoading(true);
      setError(null);

      try {
        const nextPricePoints = await ingredientPriceService.getAll();
        if (!ignore) {
          setPricePoints(nextPricePoints);
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
      setPricePoints((currentPricePoints) => [createdPricePoint, ...currentPricePoints]);
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

  return [...groups.values()].sort((first, second) => first.ingredientName.localeCompare(second.ingredientName));
}

export default PricesPage;
