import { useId, useState, type FormEvent } from "react";
import type { IIngredient } from "../../interfaces/IIngredient";
import { useLanguage, useStores } from "../../contexts";
import { ingredientPriceService, storeService } from "../../services";
import { getApiAssetUrl } from "../../services/apiClient";
import type { SiteTheme } from "../../styles/appStyles";
import { normalizePriceInput, todayInputValue } from "../../utils/priceFormatting";
import Modal from "../Modal";
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
  const priceDialogTitleId = useId();
  const imageUrl = getApiAssetUrl(ingredient.imageUrl);
  const [isPriceDialogOpen, setIsPriceDialogOpen] = useState(false);
  const [priceForm, setPriceForm] = useState({
    storeId: null as number | null,
    price: "",
    date: todayInputValue(),
    note: "",
  });
  const [isSavingPrice, setIsSavingPrice] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);

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
      await ingredientPriceService.create({
        ingredientId: ingredient.ingredientId,
        storeId: priceForm.storeId,
        price,
        date: priceForm.date,
        note: priceForm.note.trim().length === 0 ? null : priceForm.note.trim(),
      });
      setPriceForm({
        storeId: priceForm.storeId,
        price: "",
        date: todayInputValue(),
        note: "",
      });
      setIsPriceDialogOpen(false);
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
            <button
              className={recipeBrowserStyles.ingredientDetailActionButton(theme)}
              type="button"
              onClick={() => {
                setPriceError(null);
                setIsPriceDialogOpen(true);
              }}
            >
              {t.prices.addPricePoint}
            </button>
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

      {isPriceDialogOpen && (
        <Modal
          backdropClassName={recipeBrowserStyles.nestedModalBackdrop}
          bodyClassName={recipeBrowserStyles.nestedIngredientModalBody}
          closeButtonClassName={recipeBrowserStyles.modalCloseAligned(theme)}
          closeLabel={t.common.close}
          footer={
            <>
              <button
                className={`${recipeBrowserStyles.secondaryButton(theme)} ${recipeBrowserStyles.formActionButton}`}
                type="button"
                onClick={() => setIsPriceDialogOpen(false)}
              >
                {t.common.cancel}
              </button>
              <button
                className={`${recipeBrowserStyles.primaryButton(theme)} ${recipeBrowserStyles.formActionButton}`}
                disabled={isSavingPrice}
                form="ingredient-price-point-form"
                type="submit"
              >
                {isSavingPrice ? t.common.saving : t.prices.savePrice}
              </button>
            </>
          }
          footerClassName={recipeBrowserStyles.formActions}
          headerClassName={recipeBrowserStyles.modalHeader}
          panelClassName={recipeBrowserStyles.nestedIngredientModalPanel(theme)}
          title={t.prices.addPricePoint}
          titleClassName={recipeBrowserStyles.modalTitle}
          titleId={priceDialogTitleId}
          onClose={() => setIsPriceDialogOpen(false)}
        >
          <form
            className={recipeBrowserStyles.ingredientPriceDialogForm}
            id="ingredient-price-point-form"
            onSubmit={savePricePoint}
          >
            {priceError !== null && <p className={recipeBrowserStyles.statusError(theme)}>{priceError}</p>}
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
            <label className={recipeBrowserStyles.field}>
              <span className={recipeBrowserStyles.label(theme)}>{t.prices.price}</span>
              <input
                className={recipeBrowserStyles.textField(theme)}
                inputMode="decimal"
                placeholder={t.prices.pricePlaceholder}
                type="text"
                value={priceForm.price}
                onChange={(event) => setPriceForm({ ...priceForm, price: normalizePriceInput(event.target.value) })}
              />
            </label>
            <label className={recipeBrowserStyles.field}>
              <span className={recipeBrowserStyles.label(theme)}>{t.prices.date}</span>
              <input
                className={recipeBrowserStyles.textField(theme)}
                type="date"
                value={priceForm.date}
                onChange={(event) => setPriceForm({ ...priceForm, date: event.target.value })}
              />
            </label>
          </form>
        </Modal>
      )}
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
