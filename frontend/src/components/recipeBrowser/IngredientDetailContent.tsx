import { useEffect, useState, type FormEvent } from "react";
import type { IIngredient } from "../../interfaces/IIngredient";
import { useLanguage, useStores } from "../../contexts";
import type { IIngredientPricePoint } from "../../interfaces/IIngredientPrice";
import { ingredientPriceService, storeService } from "../../services";
import { getApiAssetUrl } from "../../services/apiClient";
import type { SiteTheme } from "../../styles/appStyles";
import { formatCurrency, formatPriceDate, todayInputValue } from "../../utils/priceFormatting";
import { DetailSection, DetailText, NutritionGrid } from "./detailComponents";
import CreatableSelect from "./CreatableSelect";
import { recipeBrowserStyles } from "./recipeBrowserStyles";

type IngredientDetailContentProps = {
  ingredient: IIngredient;
  theme: SiteTheme;
};

function IngredientDetailContent({ ingredient, theme }: IngredientDetailContentProps) {
  const { t } = useLanguage();
  const { stores, refreshStores } = useStores();
  const imageUrl = getApiAssetUrl(ingredient.imageUrl);
  const [pricePoints, setPricePoints] = useState<IIngredientPricePoint[]>([]);
  const [priceForm, setPriceForm] = useState({
    storeId: null as number | null,
    price: "",
    date: todayInputValue(),
    note: "",
  });
  const [isLoadingPrices, setIsLoadingPrices] = useState(true);
  const [isSavingPrice, setIsSavingPrice] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadPricePoints() {
      setIsLoadingPrices(true);
      setPriceError(null);

      try {
        const nextPricePoints = await ingredientPriceService.getByIngredient(ingredient.ingredientId);
        if (!ignore) {
          setPricePoints(nextPricePoints);
        }
      } catch {
        if (!ignore) {
          setPriceError(t.prices.couldNotLoad);
        }
      } finally {
        if (!ignore) {
          setIsLoadingPrices(false);
        }
      }
    }

    void loadPricePoints();

    return () => {
      ignore = true;
    };
  }, [ingredient.ingredientId, t.prices.couldNotLoad]);

  async function savePricePoint(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const price = Number(priceForm.price.replace(",", "."));
    if (!Number.isFinite(price) || price <= 0 || priceForm.storeId === null) {
      setPriceError(t.prices.couldNotSave);
      return;
    }

    setIsSavingPrice(true);
    setPriceError(null);

    try {
      const createdPricePoint = await ingredientPriceService.create({
        ingredientId: ingredient.ingredientId,
        storeId: priceForm.storeId,
        price,
        date: priceForm.date,
        note: priceForm.note.trim().length === 0 ? null : priceForm.note.trim(),
      });
      setPricePoints((currentPricePoints) => [createdPricePoint, ...currentPricePoints]);
      setPriceForm({
        storeId: priceForm.storeId,
        price: "",
        date: todayInputValue(),
        note: "",
      });
    } catch {
      setPriceError(t.prices.couldNotSave);
    } finally {
      setIsSavingPrice(false);
    }
  }

  return (
    <div className={recipeBrowserStyles.detailShell}>
      <DetailSection title={t.cookbook.overview} theme={theme}>
        <div className={recipeBrowserStyles.ingredientDetailOverviewGrid}>
          <div
            className={recipeBrowserStyles.ingredientDetailImageFrame(theme)}
            style={imageUrl === null ? { backgroundColor: ingredient.color ?? undefined } : undefined}
          >
            {imageUrl === null ? (
              <span className={recipeBrowserStyles.ingredientDetailImageFallback}>
                {getInitials(ingredient.ingredientName)}
              </span>
            ) : (
              <img className={recipeBrowserStyles.ingredientDetailImage} src={imageUrl} alt={ingredient.ingredientName} />
            )}
          </div>
          <div className={recipeBrowserStyles.ingredientDetailMetaStack}>
            <IngredientMetaField label={t.cookbook.brand} theme={theme} value={ingredient.brand?.name ?? ""} />
            <IngredientMetaField
              label={t.cookbook.price}
              theme={theme}
              value={ingredient.price === null ? t.cookbook.noPrice : `${ingredient.price.toFixed(2)} per kg`}
            />
          </div>
        </div>
      </DetailSection>

      <DetailText
        label={t.cookbook.description}
        theme={theme}
        value={ingredient.description || t.cookbook.noDescription}
      />

      <DetailSection title={t.cookbook.dietaryInformationPer100g} theme={theme}>
        <NutritionGrid nutrition={ingredient.nutritionPer100} theme={theme} />
      </DetailSection>

      <DetailSection title={t.prices.history} theme={theme}>
        <form className={recipeBrowserStyles.ingredientPriceForm} onSubmit={savePricePoint}>
          <CreatableSelect
            createLabel={t.common.createNew}
            label={t.prices.store}
            options={stores.map((store) => ({ id: store.storeId, name: store.name }))}
            placeholder={t.prices.selectStore}
            theme={theme}
            value={priceForm.storeId}
            onChange={(storeId) => setPriceForm({ ...priceForm, storeId })}
            onCreate={async (name) => {
              const store = await storeService.create({ name });
              await refreshStores();
              return { id: store.storeId, name: store.name };
            }}
          />
          <label className={recipeBrowserStyles.ingredientPriceField}>
            <span className={recipeBrowserStyles.label(theme)}>{t.prices.price}</span>
            <input
              className={recipeBrowserStyles.ingredientPriceInput(theme)}
              inputMode="decimal"
              min="0"
              placeholder={t.prices.pricePlaceholder}
              step="0.01"
              type="number"
              value={priceForm.price}
              onChange={(event) => setPriceForm({ ...priceForm, price: event.target.value })}
            />
          </label>
          <label className={recipeBrowserStyles.ingredientPriceField}>
            <span className={recipeBrowserStyles.label(theme)}>{t.prices.date}</span>
            <input
              className={recipeBrowserStyles.ingredientPriceInput(theme)}
              type="date"
              value={priceForm.date}
              onChange={(event) => setPriceForm({ ...priceForm, date: event.target.value })}
            />
          </label>
          <label className={`${recipeBrowserStyles.ingredientPriceField} sm:col-span-2`}>
            <span className={recipeBrowserStyles.label(theme)}>{t.prices.note}</span>
            <input
              className={recipeBrowserStyles.ingredientPriceInput(theme)}
              maxLength={500}
              placeholder={t.prices.notePlaceholder}
              value={priceForm.note}
              onChange={(event) => setPriceForm({ ...priceForm, note: event.target.value })}
            />
          </label>
          <button className={recipeBrowserStyles.ingredientPriceButton(theme)} disabled={isSavingPrice} type="submit">
            {isSavingPrice ? t.common.saving : t.prices.savePrice}
          </button>
        </form>

        {priceError !== null && <p className={recipeBrowserStyles.helperText(theme)}>{priceError}</p>}
        {isLoadingPrices ? (
          <p className={recipeBrowserStyles.helperText(theme)}>{t.common.working}</p>
        ) : pricePoints.length === 0 ? (
          <p className={recipeBrowserStyles.helperText(theme)}>{t.prices.empty}</p>
        ) : (
          <div className={recipeBrowserStyles.ingredientPriceRows}>
            {pricePoints.map((pricePoint) => (
              <div className={recipeBrowserStyles.ingredientPriceRow(theme)} key={pricePoint.ingredientPricePointId}>
                <span className={recipeBrowserStyles.ingredientPriceRowMain}>
                  <span className={recipeBrowserStyles.ingredientPriceStore}>{pricePoint.store.name}</span>
                  {pricePoint.note !== null && (
                    <span className={recipeBrowserStyles.ingredientPriceNote(theme)}>{pricePoint.note}</span>
                  )}
                </span>
                <span className={recipeBrowserStyles.ingredientPriceValue}>
                  {formatCurrency(pricePoint.price, t.locale)}
                </span>
                <span className={recipeBrowserStyles.ingredientPriceDate}>
                  {formatPriceDate(pricePoint.date, t.locale)}
                </span>
              </div>
            ))}
          </div>
        )}
      </DetailSection>
    </div>
  );
}

type IngredientMetaFieldProps = {
  label: string;
  theme: SiteTheme;
  value: string;
};

function IngredientMetaField({ label, theme, value }: IngredientMetaFieldProps) {
  return (
    <div className={recipeBrowserStyles.ingredientDetailMetaField(theme)}>
      <span className={recipeBrowserStyles.ingredientDetailMetaLabel(theme)}>{label}</span>
      <span className={recipeBrowserStyles.ingredientDetailMetaValue}>{value}</span>
    </div>
  );
}

function getInitials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "?";
}

export default IngredientDetailContent;
