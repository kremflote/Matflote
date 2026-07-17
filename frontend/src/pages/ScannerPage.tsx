import type { IScannerControls } from "@zxing/browser";
import { useCallback, useEffect, useId, useMemo, useRef, useState, type FormEvent } from "react";
import ConfirmationDialog from "../components/ConfirmationDialog";
import Modal from "../components/Modal";
import CreatableSelect from "../components/recipeBrowser/CreatableSelect";
import { useBrands, useIngredients, useLanguage, useStores } from "../contexts";
import type { IngredientTag, INutritionFacts } from "../interfaces/IIngredient";
import type { IStore } from "../interfaces/ILookup";
import type { IProductLookupNutrition, IProductLookupResult } from "../interfaces/IProductLookup";
import { brandService, imageUploadService, ingredientPriceService, ingredientService, productLookupService, storeService } from "../services";
import { getApiAssetUrl } from "../services/apiClient";
import { pageStyles, scannerStyles, type SiteTheme } from "../styles/appStyles";
import { todayInputValue } from "../utils/priceFormatting";
import { ingredientTagGroups } from "../components/recipeBrowser/formOptions";
import { GroupedCheckboxPanel } from "../components/recipeBrowser/BrowserFilterGroups";

type ScannerPageProps = {
  theme: SiteTheme;
};

type IngredientCandidate = {
  id: string;
  name: string;
  brandName: string;
  storeName: string;
  price: number | null;
  imageUrl: string | null;
  nutritionPer100: INutritionFacts | null;
  tags: IngredientTag[];
  product: IProductLookupResult;
};

type IngredientDraft = {
  name: string;
  brandName: string;
  storeName: string;
  storeId: number | null;
  price: string;
  imageUrl: string | null;
  imageFile: File | null;
  tags: IngredientTag[];
  nutritionPer100: INutritionFacts | null;
};

function ScannerPage({ theme }: ScannerPageProps) {
  const { t } = useLanguage();
  const { brands, refreshBrands } = useBrands();
  const { stores } = useStores();
  const { refreshIngredients } = useIngredients();
  const [ean, setEan] = useState("");
  const [products, setProducts] = useState<IProductLookupResult[]>([]);
  const [lookedUpEan, setLookedUpEan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingIngredient, setIsSavingIngredient] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);
  const [cameraStatus, setCameraStatus] = useState<string | null>(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [ingredientDraft, setIngredientDraft] = useState<IngredientDraft | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const editorTitleId = useId();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerControlsRef = useRef<IScannerControls | null>(null);
  const lastScannedEanRef = useRef<string | null>(null);
  const candidates = useMemo(() => buildIngredientCandidates(products), [products]);

  useEffect(() => {
    const firstCandidate = candidates[0];
    if (firstCandidate === undefined) {
      setSelectedCandidateId(null);
      setIngredientDraft(null);
      setIsEditorOpen(false);
      return;
    }

    setSelectedCandidateId(firstCandidate.id);
    setIngredientDraft(candidateToDraft(firstCandidate, stores));
  }, [candidates, stores]);

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
    setIngredientDraft(candidateToDraft(candidate, stores));
    setIsEditorOpen(true);
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

      const uploadedImage = ingredientDraft.imageFile === null
        ? null
        : await imageUploadService.upload(ingredientDraft.imageFile, "ingredients");

      const createdIngredient = await ingredientService.create({
        ingredientName,
        description: null,
        brandId: brand?.brandId ?? null,
        imageUrl: uploadedImage?.url ?? ingredientDraft.imageUrl,
        price: nullableNumber(ingredientDraft.price),
        tags: ingredientDraft.tags,
        nutritionPer100: ingredientDraft.nutritionPer100,
        color: null,
      });

      const scannedPrice = nullableNumber(ingredientDraft.price);
      if (scannedPrice !== null && ingredientDraft.storeId !== null) {
        await ingredientPriceService.create({
          ingredientId: createdIngredient.ingredientId,
          storeId: ingredientDraft.storeId,
          price: scannedPrice,
          date: todayInputValue(),
          note: null,
        });
      }

      await refreshIngredients();
      setConfirmSaveOpen(false);
      setIsEditorOpen(false);
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
          <p className={scannerStyles.intro(theme)}>
            {t.scanner.pageIntroBeforeKassalapp}
            <a className={scannerStyles.introLink(theme)} href="https://kassal.app/" rel="noreferrer" target="_blank">
              Kassalapp
            </a>
            {t.scanner.pageIntroAfterKassalapp}
          </p>
        </header>

        <div className={scannerStyles.scannerSurface}>
          <section className={scannerStyles.panel(theme)}>
            <div className={scannerStyles.desktopScannerHint(theme)}>{t.scanner.mobileOnly}</div>

            <div className={scannerStyles.scannerActions}>
              <button
                className={scannerStyles.cameraButton(theme)}
                disabled={isLoading}
                onClick={isCameraOpen ? stopCamera : startCamera}
                type="button"
              >
                {isCameraOpen ? t.scanner.cameraStop : t.scanner.cameraStart}
              </button>
              <button
                aria-expanded={isManualEntryOpen}
                className={scannerStyles.manualEntryButton(theme)}
                type="button"
                onClick={() => setIsManualEntryOpen((currentValue) => !currentValue)}
              >
                {isManualEntryOpen ? t.scanner.hideManualEntry : t.scanner.manualEntry}
              </button>
            </div>
            {cameraStatus !== null && (
              <span className={scannerStyles.cameraStatus(theme)}>
                {cameraStatus}
              </span>
            )}
            {!isCameraOpen && cameraStatus === null && (
              <span className={scannerStyles.cameraStatus(theme)}>
                {t.scanner.scanningHint}
              </span>
            )}

            <form className={scannerStyles.lookupForm(isManualEntryOpen)} onSubmit={lookupProduct}>
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
              <div className={scannerStyles.candidateHeader}>
                <h2 className={scannerStyles.candidateTitle}>{t.scanner.scanCandidatesTitle}</h2>
                <span className={scannerStyles.candidateSubtitle(theme)}>{t.scanner.scanCandidatesHelp}</span>
              </div>
              <div className={scannerStyles.candidateList}>
                {candidates.map((candidate) => (
                  <button
                    className={scannerStyles.candidateButton(theme, candidate.id === selectedCandidateId)}
                    key={candidate.id}
                    type="button"
                    onClick={() => selectCandidate(candidate)}
                  >
                    <CandidateImage candidate={candidate} theme={theme} />
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
            </section>
          )}
        </div>
      </section>

      {isEditorOpen && ingredientDraft !== null && (
        <Modal
          backdropClassName={scannerStyles.editorModalBackdrop}
          bodyClassName={scannerStyles.editorModalBody}
          closeButtonClassName={scannerStyles.editorModalCloseButton(theme)}
          closeLabel={t.common.close}
          footer={(
            <>
              <button
                className={`${scannerStyles.manualEntryButton(theme)} ${scannerStyles.editorModalActionButton}`}
                disabled={isSavingIngredient}
                type="button"
                onClick={() => setIsEditorOpen(false)}
              >
                {t.common.cancel}
              </button>
              <button
                className={`${scannerStyles.saveButton(theme)} ${scannerStyles.editorModalActionButton}`}
                disabled={isSavingIngredient}
                type="button"
                onClick={promptSaveIngredient}
              >
                {isSavingIngredient ? t.scanner.savingIngredient : t.scanner.saveIngredient}
              </button>
            </>
          )}
          footerClassName={scannerStyles.editorModalFooter(theme)}
          headerClassName={scannerStyles.editorModalHeader}
          panelClassName={scannerStyles.editorModalPanel(theme)}
          title={ingredientDraft.name || t.scanner.suggestedIngredient}
          titleClassName={scannerStyles.editorModalTitle}
          titleId={editorTitleId}
          onClose={() => setIsEditorOpen(false)}
        >
          <IngredientDraftEditor
            draft={ingredientDraft}
            theme={theme}
            onChange={setIngredientDraft}
          />
        </Modal>
      )}

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
  const { stores, refreshStores } = useStores();
  const imageInputId = useId();
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const imageUrl = getApiAssetUrl(imagePreviewUrl ?? draft.imageUrl);

  useEffect(() => {
    if (draft.imageFile === null) {
      setImagePreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(draft.imageFile);
    setImagePreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [draft.imageFile]);

  return (
    <section className={scannerStyles.ingredientEditor(theme)}>
      <div className={scannerStyles.editorImageRow}>
        <input
          accept="image/jpeg,image/png,image/webp"
          className={scannerStyles.hiddenFileInput}
          id={imageInputId}
          type="file"
          onChange={(event) => onChange({ ...draft, imageFile: event.target.files?.[0] ?? null })}
        />
        <span className={scannerStyles.editorImageLabel}>{t.scanner.productImageLabel}</span>
        <div className={scannerStyles.editorImageFrame(theme)}>
          {imageUrl === null ? (
            <div className={scannerStyles.productImageFallback(theme)}>{t.scanner.noImage}</div>
          ) : (
            <img className={scannerStyles.productImage} src={imageUrl} alt="" />
          )}
        </div>
        <label className={scannerStyles.editorImageButton(theme)} htmlFor={imageInputId}>
          {t.scanner.chooseImage}
        </label>
      </div>

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
        <CreatableSelect
          createLabel={t.common.createNew}
          label={t.scanner.storeLabel}
          options={stores.map((store) => ({ id: store.storeId, name: store.name }))}
          placeholder={t.prices.selectStore}
          theme={theme}
          value={draft.storeId}
          onChange={(storeId) => onChange({ ...draft, storeId })}
          onCreate={async (name) => {
            const store = await storeService.create({ name });
            await refreshStores();
            return { id: store.storeId, name: store.name };
          }}
        />
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
      </div>

      <section className={scannerStyles.field}>
        <span className={scannerStyles.label}>{t.scanner.selectTags}</span>
        <GroupedCheckboxPanel
          formatValue={(value) => t.enums.ingredientTags[value]}
          groupLabels={t.filters.ingredientTagGroups}
          groups={ingredientTagGroups}
          optionLabelClassName={(currentTheme) => scannerStyles.tagOption(currentTheme)}
          optionListClassName={scannerStyles.tagGrid}
          panelClassName={scannerStyles.groupedTagPanel}
          sectionClassName={scannerStyles.groupedTagSection}
          selectedValues={draft.tags}
          theme={theme}
          titleClassName={scannerStyles.groupedTagTitle}
          onToggle={(tag) => onChange({ ...draft, tags: toggleValue(draft.tags, tag) })}
        />
      </section>
    </section>
  );
}

function CandidateImage({ candidate, theme }: { candidate: IngredientCandidate; theme: SiteTheme }) {
  const { t } = useLanguage();
  const imageUrl = getApiAssetUrl(candidate.imageUrl);

  return (
    <span className={scannerStyles.candidateImageFrame(theme)}>
      {imageUrl === null ? (
        <span className={scannerStyles.productImageFallback(theme)}>{t.scanner.noImage}</span>
      ) : (
        <img className={scannerStyles.productImage} src={imageUrl} alt="" />
      )}
    </span>
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
        storeName: product.store?.name ?? "",
        price: product.currentUnitPrice ?? product.currentPrice,
        imageUrl: product.imageUrl,
        nutritionPer100: toIngredientNutrition(product.nutritionPer100),
        tags,
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

function candidateToDraft(candidate: IngredientCandidate, stores: IStore[]): IngredientDraft {
  return {
    name: candidate.name,
    brandName: candidate.brandName,
    storeName: candidate.storeName,
    storeId: findStoreId(candidate.storeName, stores),
    price: numberToInputValue(candidate.price),
    imageUrl: candidate.imageUrl,
    imageFile: null,
    tags: candidate.tags,
    nutritionPer100: candidate.nutritionPer100,
  };
}

function findStoreId(storeName: string, stores: IStore[]) {
  const normalizedStoreName = storeName.trim().toLowerCase();
  if (normalizedStoreName.length === 0) {
    return null;
  }

  return stores.find((store) => store.name.toLowerCase() === normalizedStoreName)?.storeId ?? null;
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

  return [];
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

function toggleValue<TValue>(values: TValue[], value: TValue) {
  return values.includes(value)
    ? values.filter((currentValue) => currentValue !== value)
    : [...values, value];
}

export default ScannerPage;
