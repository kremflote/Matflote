import type { IScannerControls } from "@zxing/browser";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import ConfirmationDialog from "../components/ConfirmationDialog";
import { useBrands, useIngredients, useLanguage } from "../contexts";
import type { IngredientTag, INutritionFacts } from "../interfaces/IIngredient";
import type { IProductLookupNutrition, IProductLookupResult } from "../interfaces/IProductLookup";
import { brandService, ingredientService, productLookupService } from "../services";
import { getApiAssetUrl } from "../services/apiClient";
import { pageStyles, scannerStyles, type SiteTheme } from "../styles/appStyles";
import { ingredientTags } from "../components/recipeBrowser/formOptions";
import { formatLabel } from "../components/recipeBrowser/recipeBrowserStyles";

type ScannerPageProps = {
  theme: SiteTheme;
};

type IngredientCandidate = {
  id: string;
  name: string;
  brandName: string;
  price: number | null;
  nutritionPer100: INutritionFacts | null;
  tags: IngredientTag[];
  color: string | null;
  product: IProductLookupResult;
};

type IngredientDraft = {
  name: string;
  brandName: string;
  price: string;
  tags: IngredientTag[];
  color: string;
  nutritionPer100: INutritionFacts | null;
};

function ScannerPage({ theme }: ScannerPageProps) {
  const { t } = useLanguage();
  const { brands, refreshBrands } = useBrands();
  const { refreshIngredients } = useIngredients();
  const [ean, setEan] = useState("");
  const [products, setProducts] = useState<IProductLookupResult[]>([]);
  const [lookedUpEan, setLookedUpEan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingIngredient, setIsSavingIngredient] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraStatus, setCameraStatus] = useState<string | null>(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [ingredientDraft, setIngredientDraft] = useState<IngredientDraft | null>(null);
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerControlsRef = useRef<IScannerControls | null>(null);
  const lastScannedEanRef = useRef<string | null>(null);
  const candidates = useMemo(() => buildIngredientCandidates(products), [products]);
  const selectedCandidate = candidates.find((candidate) => candidate.id === selectedCandidateId) ?? null;

  useEffect(() => {
    const firstCandidate = candidates[0];
    if (firstCandidate === undefined) {
      setSelectedCandidateId(null);
      setIngredientDraft(null);
      return;
    }

    setSelectedCandidateId(firstCandidate.id);
    setIngredientDraft(candidateToDraft(firstCandidate));
  }, [candidates]);

  const lookupEan = useCallback(async (rawEan: string) => {
    const normalizedEan = rawEan.replace(/\D/g, "");
    if (!/^(\d{8}|\d{13})$/.test(normalizedEan)) {
      setError(t.scanner.invalidEan);
      setProducts([]);
      setLookedUpEan(null);
      return false;
    }

    setIsLoading(true);
    setError(null);
    setProducts([]);
    setLookedUpEan(normalizedEan);

    try {
      const response = await productLookupService.lookupByEan(normalizedEan);
      setProducts(response.products);
      return true;
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : t.scanner.lookupFailed);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [t.scanner.invalidEan, t.scanner.lookupFailed]);

  const lookupProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await lookupEan(ean);
  };

  const selectCandidate = (candidate: IngredientCandidate) => {
    setSelectedCandidateId(candidate.id);
    setIngredientDraft(candidateToDraft(candidate));
  };

  const promptSaveIngredient = () => {
    if (ingredientDraft === null || ingredientDraft.name.trim().length === 0) {
      setError(t.scanner.noCandidateSelected);
      return;
    }

    setConfirmSaveOpen(true);
  };

  const saveIngredient = async () => {
    if (ingredientDraft === null) {
      return;
    }

    const ingredientName = ingredientDraft.name.trim().slice(0, 30);
    if (ingredientName.length === 0) {
      setError(t.scanner.noCandidateSelected);
      setConfirmSaveOpen(false);
      return;
    }

    setIsSavingIngredient(true);
    setError(null);

    try {
      const brandName = ingredientDraft.brandName.trim();
      const existingBrand = brands.find((brand) => brand.name.toLowerCase() === brandName.toLowerCase());
      const brand = brandName.length === 0
        ? null
        : existingBrand ?? await brandService.create({ name: brandName });

      if (brand !== null && existingBrand === undefined) {
        await refreshBrands();
      }

      await ingredientService.create({
        ingredientName,
        description: null,
        brandId: brand?.brandId ?? null,
        imageUrl: selectedCandidate?.product.imageUrl ?? null,
        price: nullableNumber(ingredientDraft.price),
        tags: ingredientDraft.tags.length > 0 ? ingredientDraft.tags : ["Other"],
        nutritionPer100: ingredientDraft.nutritionPer100,
        color: nullableText(ingredientDraft.color),
      });

      await refreshIngredients();
      setConfirmSaveOpen(false);
      setCameraStatus(t.scanner.ingredientSaved(ingredientName));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : t.scanner.lookupFailed);
    } finally {
      setIsSavingIngredient(false);
    }
  };

  const stopCamera = useCallback(() => {
    scannerControlsRef.current?.stop();
    scannerControlsRef.current = null;
    setIsCameraOpen(false);
  }, []);

  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError(t.scanner.cameraUnsupported);
      return;
    }

    setError(null);
    setCameraStatus(t.scanner.scannerReady);
    setIsCameraOpen(true);

    try {
      await new Promise<void>((resolve) => {
        window.requestAnimationFrame(() => resolve());
      });

      if (videoRef.current === null) {
        throw new Error("Scanner video element was not ready.");
      }

      const { BrowserMultiFormatReader } = await import("@zxing/browser");
      const scanner = new BrowserMultiFormatReader();
      const controls = await scanner.decodeFromVideoDevice(undefined, videoRef.current, (result) => {
        const detectedEan = result?.getText().replace(/\D/g, "");
        if (detectedEan === undefined || !/^(\d{8}|\d{13})$/.test(detectedEan)) {
          return;
        }

        if (detectedEan !== lastScannedEanRef.current) {
          lastScannedEanRef.current = detectedEan;
          setEan(detectedEan);
          setCameraStatus(t.scanner.scannerFound(detectedEan));
          controls.stop();
          scannerControlsRef.current = null;
          setIsCameraOpen(false);
          void lookupEan(detectedEan);
        }
      });

      scannerControlsRef.current = controls;
    } catch (caughtError) {
      const errorName = caughtError instanceof DOMException ? caughtError.name : "";
      setError(
        errorName === "NotAllowedError" || errorName === "PermissionDeniedError"
          ? t.scanner.cameraPermissionDenied
          : t.scanner.cameraUnsupported
      );
      setCameraStatus(null);
      stopCamera();
    }
  };

  useEffect(() => stopCamera, [stopCamera]);

  return (
    <main className={pageStyles.shell}>
      <section className={scannerStyles.shell}>
        <header className={scannerStyles.header}>
          <h1 className={scannerStyles.title(theme)}>{t.scanner.pageTitle}</h1>
          <p className={scannerStyles.intro(theme)}>{t.scanner.pageIntro}</p>
        </header>

        <div className={scannerStyles.mobileOnlyPanel(theme)}>{t.scanner.mobileOnly}</div>

        <div className={scannerStyles.mobileScannerSurface}>
          <section className={scannerStyles.panel(theme)}>
            <form className={scannerStyles.lookupForm} onSubmit={lookupProduct}>
              <label className={scannerStyles.field}>
                <span className={scannerStyles.label}>{t.scanner.eanLabel}</span>
                <input
                  className={scannerStyles.input(theme)}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder={t.scanner.eanPlaceholder}
                  value={ean}
                  onChange={(event) => setEan(event.target.value)}
                />
              </label>
              <button
                className={scannerStyles.submitButton(theme)}
                disabled={isLoading}
                type="submit"
              >
                {isLoading ? t.scanner.searching : t.scanner.lookup}
              </button>
            </form>

            <div className={scannerStyles.scannerActions}>
              <button
                className={scannerStyles.cameraButton(theme)}
                disabled={isLoading}
                onClick={isCameraOpen ? stopCamera : startCamera}
                type="button"
              >
                {isCameraOpen ? t.scanner.cameraStop : t.scanner.cameraStart}
              </button>
              <span className={scannerStyles.cameraStatus(theme)}>
                {cameraStatus ?? t.scanner.scanningHint}
              </span>
            </div>

            {isCameraOpen && (
              <div className={scannerStyles.cameraFrame(theme)}>
                <video
                  className={scannerStyles.cameraVideo}
                  muted
                  playsInline
                  ref={videoRef}
                />
                <div aria-hidden="true" className={scannerStyles.cameraGuide} />
              </div>
            )}

            {error !== null && <p className={scannerStyles.statusError(theme)}>{error}</p>}
          </section>

          {isLoading && (
            <div className={scannerStyles.emptyState(theme)}>{t.scanner.searching}</div>
          )}

          {!isLoading && lookedUpEan !== null && products.length === 0 && error === null && (
            <div className={scannerStyles.emptyState(theme)}>
              {t.scanner.noProductsFound(lookedUpEan)}
            </div>
          )}

          {candidates.length > 0 && ingredientDraft !== null && (
            <section className={scannerStyles.candidateSection}>
              <h2 className={scannerStyles.candidateTitle}>{t.scanner.scanCandidatesTitle}</h2>
              <div className={scannerStyles.candidateList}>
                {candidates.map((candidate) => (
                  <button
                    className={scannerStyles.candidateButton(theme, candidate.id === selectedCandidateId)}
                    key={candidate.id}
                    type="button"
                    onClick={() => selectCandidate(candidate)}
                  >
                    <span className="min-w-0">
                      <span className={scannerStyles.candidateName}>{candidate.name}</span>
                      <span className={scannerStyles.candidateMeta(theme)}>
                        {[candidate.brandName, candidate.price === null ? null : t.scanner.price(candidate.price)]
                          .filter(Boolean)
                          .join(" / ")}
                      </span>
                    </span>
                    <span className={scannerStyles.candidateSelectLabel(theme)}>{t.scanner.selectCandidate}</span>
                  </button>
                ))}
              </div>

              <IngredientDraftEditor
                draft={ingredientDraft}
                theme={theme}
                onChange={setIngredientDraft}
              />

              <button
                className={scannerStyles.saveButton(theme)}
                disabled={isSavingIngredient}
                type="button"
                onClick={promptSaveIngredient}
              >
                {isSavingIngredient ? t.scanner.savingIngredient : t.scanner.saveIngredient}
              </button>
            </section>
          )}

          {products.length > 0 && (
            <section className={scannerStyles.resultList} aria-label={t.scanner.resultsLabel}>
              {products.map((product, index) => (
                <ProductLookupCard
                  key={`${product.ean}-${product.store?.name ?? "store"}-${index}`}
                  product={product}
                  theme={theme}
                />
              ))}
            </section>
          )}
        </div>
      </section>

      {confirmSaveOpen && ingredientDraft !== null && (
        <ConfirmationDialog
          body={t.scanner.saveIngredientBody(ingredientDraft.name.trim() || t.scanner.suggestedIngredient)}
          confirmLabel={t.scanner.saveIngredient}
          isBusy={isSavingIngredient}
          theme={theme}
          title={t.scanner.saveIngredientTitle}
          tone="default"
          onCancel={() => setConfirmSaveOpen(false)}
          onConfirm={saveIngredient}
        />
      )}
    </main>
  );
}

function IngredientDraftEditor({
  draft,
  theme,
  onChange,
}: {
  draft: IngredientDraft;
  theme: SiteTheme;
  onChange: (draft: IngredientDraft) => void;
}) {
  const { t } = useLanguage();

  return (
    <section className={scannerStyles.ingredientEditor(theme)}>
      <div className={scannerStyles.compactFormGrid}>
        <label className={scannerStyles.field}>
          <span className={scannerStyles.label}>{t.scanner.nameLabel}</span>
          <input
            className={scannerStyles.input(theme)}
            maxLength={30}
            value={draft.name}
            onChange={(event) => onChange({ ...draft, name: event.target.value })}
          />
        </label>
        <label className={scannerStyles.field}>
          <span className={scannerStyles.label}>{t.scanner.brandLabel}</span>
          <input
            className={scannerStyles.input(theme)}
            value={draft.brandName}
            onChange={(event) => onChange({ ...draft, brandName: event.target.value })}
          />
        </label>
        <label className={scannerStyles.field}>
          <span className={scannerStyles.label}>{t.scanner.priceLabel}</span>
          <input
            className={scannerStyles.input(theme)}
            inputMode="decimal"
            min="0"
            step="0.01"
            type="number"
            value={draft.price}
            onChange={(event) => onChange({ ...draft, price: event.target.value })}
          />
        </label>
        <label className={scannerStyles.field}>
          <span className={scannerStyles.label}>{t.scanner.colorLabel}</span>
          <span className={scannerStyles.colorRow}>
            <input
              className={scannerStyles.input(theme)}
              value={draft.color}
              onChange={(event) => onChange({ ...draft, color: event.target.value })}
            />
            <input
              aria-label="Ingredient color"
              className={scannerStyles.colorInput}
              type="color"
              value={isHexColor(draft.color) ? draft.color : "#9ca3af"}
              onChange={(event) => onChange({ ...draft, color: event.target.value })}
            />
          </span>
        </label>
      </div>

      <section className={scannerStyles.field}>
        <span className={scannerStyles.label}>{t.scanner.selectTags}</span>
        <div className={scannerStyles.tagGrid}>
          {ingredientTags.map((tag) => (
            <label className={scannerStyles.tagOption(theme)} key={tag}>
              <input
                checked={draft.tags.includes(tag)}
                type="checkbox"
                onChange={() => onChange({ ...draft, tags: toggleValue(draft.tags, tag) })}
              />
              {formatLabel(tag)}
            </label>
          ))}
        </div>
      </section>
    </section>
  );
}

function ProductLookupCard({
  product,
  theme,
}: {
  product: IProductLookupResult;
  theme: SiteTheme;
}) {
  const { t } = useLanguage();
  const imageUrl = getApiAssetUrl(product.imageUrl);

  return (
    <article className={scannerStyles.productCard(theme)}>
      <div className={scannerStyles.productImageFrame(theme)}>
        {imageUrl === null ? (
          <div className={scannerStyles.productImageFallback(theme)}>{t.scanner.noImage}</div>
        ) : (
          <img className={scannerStyles.productImage} src={imageUrl} alt="" />
        )}
      </div>

      <div className={scannerStyles.productMain}>
        <div>
          <h2 className={scannerStyles.productTitle}>{product.name}</h2>
          <p className={scannerStyles.productMeta(theme)}>
            {[product.brand, product.vendor].filter(Boolean).join(" / ") || t.scanner.unknownBrand}
          </p>
        </div>

        <div className={scannerStyles.chipRow}>
          <span className={scannerStyles.chip(theme)}>{product.source}</span>
          {product.store?.name && <span className={scannerStyles.chip(theme)}>{product.store.name}</span>}
          {product.weight !== null && product.weightUnit !== null && (
            <span className={scannerStyles.chip(theme)}>
              {product.weight} {product.weightUnit}
            </span>
          )}
        </div>

        {product.nutritionPer100 !== null && (
          <NutritionSummary nutrition={product.nutritionPer100} theme={theme} />
        )}
      </div>

      <div className={scannerStyles.priceBlock}>
        <span className={scannerStyles.price(theme)}>
          {product.currentPrice === null ? t.scanner.noPrice : t.scanner.price(product.currentPrice)}
        </span>
        {product.currentUnitPrice !== null && (
          <span className={scannerStyles.unitPrice(theme)}>
            {t.scanner.unitPrice(product.currentUnitPrice)}
          </span>
        )}
      </div>
    </article>
  );
}

function NutritionSummary({
  nutrition,
  theme,
}: {
  nutrition: IProductLookupNutrition;
  theme: SiteTheme;
}) {
  const { t } = useLanguage();
  const items = [
    [t.scanner.calories, nutrition.calories === null ? null : `${nutrition.calories} kcal`],
    [t.scanner.carbs, nutrition.carbohydrateGrams],
    [t.scanner.protein, nutrition.proteinGrams],
    [t.scanner.salt, nutrition.saltGrams],
  ] as const;

  return (
    <dl className={scannerStyles.nutritionGrid}>
      {items.map(([label, value]) => (
        value !== null && (
          <div className={scannerStyles.nutritionItem(theme)} key={label}>
            <dt>{label}</dt>
            <dd>{typeof value === "number" ? `${value} g` : value}</dd>
          </div>
        )
      ))}
    </dl>
  );
}

function buildIngredientCandidates(products: IProductLookupResult[]): IngredientCandidate[] {
  const seen = new Set<string>();
  return products
    .map((product, index) => {
      const name = cleanIngredientName(product.name);
      const brandName = (product.brand ?? product.vendor ?? "").trim();
      const tags = inferIngredientTags(`${name} ${brandName}`);
      const candidate: IngredientCandidate = {
        id: `${product.ean}-${product.store?.name ?? "store"}-${index}`,
        name,
        brandName,
        price: product.currentUnitPrice ?? product.currentPrice,
        nutritionPer100: toIngredientNutrition(product.nutritionPer100),
        tags,
        color: colorForTag(tags[0] ?? "Other"),
        product,
      };

      return candidate;
    })
    .filter((candidate) => {
      const key = `${candidate.name.toLowerCase()}|${candidate.brandName.toLowerCase()}`;
      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    })
    .slice(0, 6);
}

function candidateToDraft(candidate: IngredientCandidate): IngredientDraft {
  return {
    name: candidate.name,
    brandName: candidate.brandName,
    price: numberToInputValue(candidate.price),
    tags: candidate.tags,
    color: candidate.color ?? "",
    nutritionPer100: candidate.nutritionPer100,
  };
}

function cleanIngredientName(name: string) {
  const cleaned = name
    .replace(/\b\d+([,.]\d+)?\s?(g|gram|kg|ml|l|liter|stk|pk|pack|x)\b/gi, "")
    .replace(/\b\d+\s?x\s?\d+([,.]\d+)?\s?(g|kg|ml|l)\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  return (cleaned.length === 0 ? name : cleaned).slice(0, 30);
}

function inferIngredientTags(searchText: string): IngredientTag[] {
  const normalized = searchText.toLowerCase();

  if (/\b(kylling|chicken)\b/.test(normalized)) return ["Chicken"];
  if (/\b(okse|storfe|beef|biff)\b/.test(normalized)) return ["Beef"];
  if (/\b(lam|lamb)\b/.test(normalized)) return ["Lamb"];
  if (/\b(fisk|fish|laks|salmon|torsk|cod)\b/.test(normalized)) return ["Fish"];
  if (/\b(melk|milk|yoghurt|yogurt|ost|cheese|fløte|cream)\b/.test(normalized)) return ["Dairy"];
  if (/\b(ris|rice|pasta|nudler|noodle|mel|flour|havre|oat)\b/.test(normalized)) return ["Grain", "Pantry"];
  if (/\b(saus|sauce|dressing|dip)\b/.test(normalized)) return ["Sauce"];
  if (/\b(krydder|spice|pepper|salt)\b/.test(normalized)) return ["Spice"];
  if (/\b(basilikum|basil|persille|parsley|koriander|cilantro|dill)\b/.test(normalized)) return ["Herb"];
  if (/\b(eple|apple|banan|banana|appelsin|orange|bær|berry|druer|grape)\b/.test(normalized)) return ["Fruit"];
  if (/\b(salat|spinach|spinat|ruccola|kale|grønnkål)\b/.test(normalized)) return ["Vegetable", "LeafyGreen"];
  if (/\b(gulrot|carrot|løk|onion|tomat|tomato|agurk|cucumber|potet|potato|paprika)\b/.test(normalized)) return ["Vegetable"];
  if (/\b(frossen|frozen)\b/.test(normalized)) return ["Frozen"];

  return ["Other"];
}

function toIngredientNutrition(nutrition: IProductLookupNutrition | null): INutritionFacts | null {
  if (nutrition === null) {
    return null;
  }

  return {
    calories: nutrition.calories,
    carbohydrateGrams: nutrition.carbohydrateGrams,
    proteinGrams: nutrition.proteinGrams,
    saltGrams: nutrition.saltGrams,
    dietaryFiberGrams: nutrition.dietaryFiberGrams,
    saturatedFatGrams: nutrition.saturatedFatGrams,
    unsaturatedFatGrams: null,
    monounsaturatedFatGrams: nutrition.monounsaturatedFatGrams,
    polyunsaturatedFatGrams: nutrition.polyunsaturatedFatGrams,
    vitamins: [],
  };
}

function colorForTag(tag: IngredientTag) {
  switch (tag) {
    case "Vegetable":
    case "LeafyGreen":
      return "#5a9f58";
    case "Fruit":
      return "#f59e0b";
    case "Chicken":
    case "Beef":
    case "Lamb":
    case "Mince":
      return "#dc6b5f";
    case "Fish":
      return "#4f9fcf";
    case "Dairy":
      return "#d8e7f3";
    case "Grain":
    case "Pantry":
      return "#c8a96a";
    case "Spice":
    case "Herb":
      return "#7a8864";
    case "Sauce":
      return "#b77946";
    case "Frozen":
      return "#9cc9d9";
    default:
      return "#9ca3af";
  }
}

function nullableText(value: string) {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function nullableNumber(value: string) {
  const trimmed = value.trim().replace(",", ".");
  if (trimmed.length === 0) {
    return null;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
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

export default ScannerPage;
