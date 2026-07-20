import type { IScannerControls } from "@zxing/browser";
import { useCallback, useEffect, useId, useMemo, useRef, useState, type FormEvent } from "react";
import Modal from "../components/Modal";
import CreatableSelect from "../components/recipeBrowser/CreatableSelect";
import { useBrands, useIngredientTagCategories, useIngredients, useLanguage, useStores } from "../contexts";
import type { IngredientTag, INutritionFacts, NutritionDataSource } from "../interfaces/IIngredient";
import type { IBrand, IStore } from "../interfaces/ILookup";
import type { IMatvaretabellenCandidate, IProductLookupNutrition, IProductLookupResult } from "../interfaces/IProductLookup";
import { brandService, imageUploadService, ingredientPriceService, ingredientService, ingredientTagCategoryService, productLookupService, storeService } from "../services";
import { getApiAssetUrl } from "../services/apiClient";
import { pageStyles, scannerStyles, type SiteTheme } from "../styles/appStyles";
import { INGREDIENT_NAME_MAX_LENGTH } from "../constants/validation";
import { normalizePriceInput, todayInputValue } from "../utils/priceFormatting";
import {
  formatIngredientTagCategoryName,
  getIngredientTagGroupsWithCustomTags,
  ingredientTagGroups,
} from "../components/recipeBrowser/formOptions";
import { GroupedCheckboxPanel } from "../components/recipeBrowser/BrowserFilterGroups";
import { recipeBrowserStyles } from "../components/recipeBrowser/recipeBrowserStyles";
import IngredientTagCreateDialog from "../components/recipeBrowser/IngredientTagCreateDialog";
import NutritionEditor, { deriveVitaminsFromNutritionValues, type NutritionEditorValues } from "../components/recipeBrowser/NutritionEditor";

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
  kassalappNutritionPer100: INutritionFacts | null;
  matvaretabellenNutritionPer100: INutritionFacts | null;
  nutritionPer100: INutritionFacts | null;
  nutritionSource: NutritionDataSource;
  nutritionSupplementSource: NutritionDataSource | null;
  matvaretabellenSupplementAttempted: boolean;
  matvaretabellenSupplementStatus: "NotAttempted" | "Matched" | "NoMatch";
  matvaretabellenCandidates: MatvaretabellenCandidate[];
  nutritionSourceLabel: string | null;
  kassalappUrl: string | null;
  matvaretabellenFoodId: string | null;
  matvaretabellenUrl: string | null;
  nutritionMatchedName: string | null;
  nutritionMatchConfidence: number | null;
  tags: IngredientTag[];
  product: IProductLookupResult;
};

type IngredientDraft = {
  name: string;
  brandId: number | null;
  brandName: string;
  storeName: string;
  storeId: number | null;
  price: string;
  imageUrl: string | null;
  imageFile: File | null;
  tags: IngredientTag[];
  kassalappNutritionPer100: INutritionFacts | null;
  matvaretabellenNutritionPer100: INutritionFacts | null;
  nutritionPer100: INutritionFacts | null;
  nutritionSource: NutritionDataSource;
  nutritionSupplementSource: NutritionDataSource | null;
  matvaretabellenSupplementAttempted: boolean;
  matvaretabellenSupplementStatus: "NotAttempted" | "Matched" | "NoMatch";
  matvaretabellenCandidates: MatvaretabellenCandidate[];
  nutritionSourceLabel: string | null;
  kassalappUrl: string | null;
  matvaretabellenFoodId: string | null;
  matvaretabellenUrl: string | null;
  nutritionMatchedName: string | null;
  nutritionMatchConfidence: number | null;
};

type MatvaretabellenCandidate = {
  foodId: string;
  foodName: string;
  url: string | null;
  confidence: number;
  nutrition: INutritionFacts;
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
  const [editorError, setEditorError] = useState<string | null>(null);
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
      setEditorError(null);
      return;
    }

    setSelectedCandidateId(firstCandidate.id);
    setIngredientDraft(candidateToDraft(firstCandidate, stores, brands));
    setEditorError(null);
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
    setIngredientDraft(candidateToDraft(candidate, stores, brands));
    setEditorError(null);
    setIsEditorOpen(true);
  };

  const saveIngredient = async () => {
    if (ingredientDraft === null) {
      return;
    }

    const ingredientName = ingredientDraft.name.trim();
    if (ingredientName.length === 0) {
      setEditorError(t.scanner.noCandidateSelected);
      return;
    }

    if (ingredientName.length > INGREDIENT_NAME_MAX_LENGTH) {
      setEditorError(t.cookbook.ingredientNameTooLong(INGREDIENT_NAME_MAX_LENGTH));
      return;
    }

    setIsSavingIngredient(true);
    setError(null);
    setEditorError(null);

    try {
      const brandName = ingredientDraft.brandName.trim();
      const selectedBrand = brands.find((brand) => brand.brandId === ingredientDraft.brandId) ?? null;
      const existingBrand = brands.find((brand) => brand.name.toLowerCase() === brandName.toLowerCase());
      const brand = selectedBrand ?? (
        brandName.length === 0
          ? null
          : existingBrand ?? await brandService.create({ name: brandName })
      );

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
        nutritionPer100: withDerivedVitamins(ingredientDraft.nutritionPer100),
        nutritionSource: ingredientDraft.nutritionSource,
        nutritionSourceLabel: ingredientDraft.nutritionSourceLabel,
        matvaretabellenFoodId: ingredientDraft.matvaretabellenFoodId,
        nutritionMatchedName: ingredientDraft.nutritionMatchedName,
        nutritionMatchConfidence: ingredientDraft.nutritionMatchConfidence,
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
      setIsEditorOpen(false);
      setEditorError(null);
      setCameraStatus(t.scanner.ingredientSaved(ingredientName));
    } catch (caughtError) {
      setEditorError(caughtError instanceof Error ? caughtError.message : t.scanner.lookupFailed);
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
                onClick={() => void saveIngredient()}
              >
                {isSavingIngredient ? t.scanner.savingIngredient : t.scanner.saveIngredient}
              </button>
              {editorError !== null && (
                <p className={scannerStyles.editorModalError(theme)}>{editorError}</p>
              )}
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
            onChange={(nextDraft) => {
              setIngredientDraft(nextDraft);
              setEditorError(null);
            }}
          />
        </Modal>
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
  const { brands, refreshBrands } = useBrands();
  const { ingredients, refreshIngredients } = useIngredients();
  const { stores, refreshStores } = useStores();
  const { ingredientTagCategories, refreshIngredientTagCategories } = useIngredientTagCategories();
  const imageInputId = useId();
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isTagCreateOpen, setIsTagCreateOpen] = useState(false);
  const [isMatvarePickerOpen, setIsMatvarePickerOpen] = useState(false);
  const [showNutrition, setShowNutrition] = useState(false);
  const imageUrl = getApiAssetUrl(imagePreviewUrl ?? draft.imageUrl);
  const knownIngredientTags = (ingredientTagCategories.length === 0
    ? ingredientTagGroups.flatMap((group) => group.values)
    : ingredientTagCategories.flatMap((category) => category.tags)) as IngredientTag[];
  const existingCustomTags = ingredients
    .flatMap((ingredient) => ingredient.tags)
    .filter((tag) => !knownIngredientTags.includes(tag));
  const customTags = Array.from(new Set([
    ...existingCustomTags,
    ...draft.tags.filter((tag) => !knownIngredientTags.includes(tag)),
  ]));
  const groupedTags = getIngredientTagGroupsWithCustomTags(customTags, "pantry", ingredientTagCategories);
  const groupLabels = ingredientTagCategories.length === 0
    ? t.filters.ingredientTagGroups
    : Object.fromEntries(
        ingredientTagCategories.map((category) => [
          category.ingredientTagCategoryId.toString(),
          formatIngredientTagCategoryName(category.name, t.filters.ingredientTagGroups),
        ]),
      );
  const nutritionValues = nutritionToEditorValues(draft.nutritionPer100);
  const nutritionSource = getNutritionSource(
    draft,
    t.scanner.nutritionSources,
    t.scanner.nutritionSupplementedBy,
    t.scanner.nutritionSupplementSeparator,
  );
  const hasMatvaretabellenSupplement = draft.matvaretabellenNutritionPer100 !== null;
  const showMatvaretabellenFailedMessage = draft.matvaretabellenSupplementAttempted
    && draft.matvaretabellenSupplementStatus === "NoMatch"
    && !hasMatvaretabellenSupplement;

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
          <span className={scannerStyles.label}>
            {t.scanner.nameLabel}
            <span className={recipeBrowserStyles.inlineHint(theme)}>
              {draft.name.length}/{INGREDIENT_NAME_MAX_LENGTH}
            </span>
          </span>
          <input
            className={scannerStyles.input(theme)}
            value={draft.name}
            onChange={(event) => onChange({ ...draft, name: event.target.value })}
          />
        </label>
        <CreatableSelect
          createLabel={t.common.createNew}
          fieldClassName={scannerStyles.field}
          label={t.scanner.brandLabel}
          labelClassName={scannerStyles.label}
          options={brands.map((brand) => ({ id: brand.brandId, name: brand.name }))}
          placeholder={t.cookbook.selectBrand}
          theme={theme}
          value={draft.brandId}
          onChange={(brandId) => {
            const brandName = brands.find((brand) => brand.brandId === brandId)?.name ?? "";
            onChange({ ...draft, brandId, brandName });
          }}
          onCreate={async (name) => {
            const brand = await brandService.create({ name });
            await refreshBrands();
            return { id: brand.brandId, name: brand.name };
          }}
          onCreatedOptionSelected={(brand) => onChange({ ...draft, brandId: brand.id, brandName: brand.name })}
        />
        <CreatableSelect
          createLabel={t.common.createNew}
          fieldClassName={scannerStyles.field}
          label={t.scanner.storeLabel}
          labelClassName={scannerStyles.label}
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
        <label className={scannerStyles.priceField}>
          <span className={scannerStyles.label}>{t.scanner.priceLabel}</span>
          <input
            className={scannerStyles.input(theme)}
            inputMode="decimal"
            type="text"
            value={draft.price}
            onChange={(event) => onChange({ ...draft, price: normalizePriceInput(event.target.value) })}
          />
          <span className={scannerStyles.floatingLabelSubtitle(theme)}>{t.prices.priceUnitSubtitle}</span>
        </label>
      </div>

      <section className={scannerStyles.field}>
        <span className={scannerStyles.label}>{t.cookbook.nutrition}</span>
        <div className={scannerStyles.nutritionSourceRow}>
          {nutritionSource.links.length === 0 ? (
            <span className={scannerStyles.nutritionSourceText(theme)}>{nutritionSource.text}</span>
          ) : (
            <span className={scannerStyles.nutritionSourceText(theme)}>
              {nutritionSource.parts.map((part, index) => {
                if (typeof part === "string") {
                  return <span key={`${part}-${index}`}>{part}</span>;
                }

                if (part.url === null) {
                  return <span key={part.label}>{part.label}</span>;
                }

                return (
                  <a
                    className={scannerStyles.nutritionSourceLink(theme)}
                    href={part.url}
                    key={part.label}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {part.label}
                  </a>
                );
              })}
            </span>
          )}
          {hasMatvaretabellenSupplement && (
            <span className={scannerStyles.nutritionSourceActions}>
              {draft.matvaretabellenCandidates.length > 0 && (
                <button
                  className={scannerStyles.sourceActionButton(theme)}
                  type="button"
                  onClick={() => setIsMatvarePickerOpen(true)}
                >
                  {t.scanner.changeMatvaretabellen}
                </button>
              )}
              <button
                className={scannerStyles.sourceActionButton(theme)}
                type="button"
                onClick={() => onChange(removeMatvaretabellenSupplement(draft))}
              >
                {t.common.remove}
              </button>
            </span>
          )}
        </div>
        {showMatvaretabellenFailedMessage && (
          <div className={scannerStyles.nutritionSupplementWarningRow(theme)}>
            <span>
              {draft.matvaretabellenCandidates.length > 0
                ? t.scanner.matvaretabellenNoMatchFound
                : t.scanner.matvaretabellenSupplementFailed}
            </span>
            {draft.matvaretabellenCandidates.length > 0 && (
              <button
                className={scannerStyles.sourceActionButton(theme)}
                type="button"
                onClick={() => setIsMatvarePickerOpen(true)}
              >
                {t.scanner.chooseMatvaretabellenMatch}
              </button>
            )}
          </div>
        )}
        <button
          aria-expanded={showNutrition}
          className={recipeBrowserStyles.detailsToggleFull(theme)}
          type="button"
          onClick={() => setShowNutrition((currentValue) => !currentValue)}
        >
          {showNutrition ? t.cookbook.hideNutrition : t.cookbook.addNutrition}
        </button>
        {showNutrition && (
          <NutritionEditor
            theme={theme}
            values={nutritionValues}
            onChange={(key, value) => onChange(updateNutritionDraft(draft, key, value))}
          />
        )}
      </section>

      <section className={scannerStyles.field}>
        <span className={scannerStyles.label}>{t.scanner.selectTags}</span>
        <GroupedCheckboxPanel
          addActionLabel={t.common.manageTags}
          formatValue={(value) => t.enums.ingredientTags[value] ?? value}
          groupLabels={groupLabels}
          groups={groupedTags}
          panelClassName={`${recipeBrowserStyles.groupedTagPanel} ${recipeBrowserStyles.checkboxGridPanel(theme)}`}
          selectedValues={draft.tags}
          theme={theme}
          onAddTag={() => setIsTagCreateOpen(true)}
          onToggle={(tag) => onChange({ ...draft, tags: toggleValue(draft.tags, tag) })}
        />
      </section>
      {isTagCreateOpen && (
        <IngredientTagCreateDialog
          categories={ingredientTagCategories}
          existingTags={[...knownIngredientTags, ...customTags]}
          theme={theme}
          onCancel={() => setIsTagCreateOpen(false)}
          onCreate={async (tag, categoryId) => {
            await ingredientTagCategoryService.createTag(categoryId, { name: tag });
            await refreshIngredientTagCategories();
            onChange({ ...draft, tags: draft.tags.includes(tag) ? draft.tags : [...draft.tags, tag] });
            setIsTagCreateOpen(false);
          }}
          onCreateCategory={async (name) => {
            const category = await ingredientTagCategoryService.create({ name });
            await refreshIngredientTagCategories();
            return { id: category.ingredientTagCategoryId, name: category.name };
          }}
          onUpdateCategory={async (category) => {
            await ingredientTagCategoryService.update(category.id, { name: category.name });
            await refreshIngredientTagCategories();
          }}
          onDeleteCategory={async (category) => {
            await ingredientTagCategoryService.delete(category.id);
            await refreshIngredientTagCategories();
            await refreshIngredients();
          }}
          onUpdateTag={async (tagName, nextName) => {
            await ingredientTagCategoryService.updateTag(tagName, { name: nextName });
            await refreshIngredientTagCategories();
            await refreshIngredients();
          }}
          onDeleteTag={async (tagName) => {
            await ingredientTagCategoryService.deleteTag(tagName);
            await refreshIngredientTagCategories();
            await refreshIngredients();
          }}
        />
      )}
      {isMatvarePickerOpen && (
        <MatvaretabellenCandidateModal
          candidates={draft.matvaretabellenCandidates}
          theme={theme}
          onCancel={() => setIsMatvarePickerOpen(false)}
          onSelect={(candidate) => {
            onChange(applyMatvaretabellenCandidate(draft, candidate));
            setIsMatvarePickerOpen(false);
          }}
        />
      )}
    </section>
  );
}

function MatvaretabellenCandidateModal({
  candidates,
  theme,
  onCancel,
  onSelect,
}: {
  candidates: MatvaretabellenCandidate[];
  theme: SiteTheme;
  onCancel: () => void;
  onSelect: (candidate: MatvaretabellenCandidate) => void;
}) {
  const { t } = useLanguage();
  const titleId = useId();

  return (
    <Modal
      backdropClassName={scannerStyles.editorModalBackdrop}
      bodyClassName={scannerStyles.matvareCandidateModalBody}
      closeButtonClassName={scannerStyles.editorModalCloseButton(theme)}
      closeLabel={t.common.close}
      footer={(
        <button className={scannerStyles.manualEntryButton(theme)} type="button" onClick={onCancel}>
          {t.common.cancel}
        </button>
      )}
      footerClassName={scannerStyles.editorModalFooter(theme)}
      headerClassName={scannerStyles.editorModalHeader}
      panelClassName={scannerStyles.matvareCandidateModalPanel(theme)}
      title={t.scanner.chooseMatvaretabellenEntry}
      titleClassName={scannerStyles.editorModalTitle}
      titleId={titleId}
      onClose={onCancel}
    >
      {candidates.map((candidate) => (
        <button
          className={scannerStyles.matvareCandidateButton(theme)}
          key={candidate.foodId}
          type="button"
          onClick={() => onSelect(candidate)}
        >
          <span className={scannerStyles.matvareCandidateName}>{candidate.foodName}</span>
          <span className={scannerStyles.matvareCandidateMeta(theme)}>
            {t.scanner.matvaretabellenScore(candidate.confidence)}
          </span>
          <span className={scannerStyles.matvareCandidateMacros(theme)}>
            {formatCandidateMacros(candidate.nutrition, {
              calories: t.cookbook.calories,
              carbs: t.cookbook.carbs,
              fiber: t.cookbook.fiber,
              protein: t.cookbook.protein,
            })}
          </span>
        </button>
      ))}
    </Modal>
  );
}

function updateNutritionDraft(draft: IngredientDraft, key: keyof NutritionEditorValues, value: string): IngredientDraft {
  return {
    ...draft,
    nutritionSource: "Manual",
    nutritionSupplementSource: null,
    nutritionSourceLabel: null,
    kassalappUrl: null,
    kassalappNutritionPer100: null,
    matvaretabellenNutritionPer100: null,
    matvaretabellenSupplementStatus: "NotAttempted",
    matvaretabellenFoodId: null,
    matvaretabellenUrl: null,
    nutritionMatchedName: null,
    nutritionMatchConfidence: null,
    nutritionPer100: {
      ...emptyNutritionFacts(),
      ...draft.nutritionPer100,
      [key]: nullableNumber(value),
    },
  };
}

function applyMatvaretabellenCandidate(
  draft: IngredientDraft,
  candidate: MatvaretabellenCandidate,
): IngredientDraft {
  const mergedNutrition = mergeNutrition(draft.kassalappNutritionPer100, candidate.nutrition);
  return {
    ...draft,
    matvaretabellenNutritionPer100: candidate.nutrition,
    nutritionPer100: mergedNutrition.nutrition,
    nutritionSource: draft.kassalappNutritionPer100 === null ? "Matvaretabellen" : "Kassalapp",
    nutritionSupplementSource: draft.kassalappNutritionPer100 !== null && mergedNutrition.usedSupplement ? "Matvaretabellen" : null,
    matvaretabellenSupplementAttempted: true,
    matvaretabellenSupplementStatus: "Matched",
    nutritionSourceLabel: draft.kassalappNutritionPer100 === null ? "Matvaretabellen" : "Kassalapp",
    matvaretabellenFoodId: candidate.foodId,
    matvaretabellenUrl: candidate.url,
    nutritionMatchedName: candidate.foodName,
    nutritionMatchConfidence: candidate.confidence,
  };
}

function removeMatvaretabellenSupplement(draft: IngredientDraft): IngredientDraft {
  return {
    ...draft,
    matvaretabellenNutritionPer100: null,
    nutritionPer100: draft.kassalappNutritionPer100,
    nutritionSource: draft.kassalappNutritionPer100 === null ? "None" : "Kassalapp",
    nutritionSupplementSource: null,
    matvaretabellenSupplementStatus: draft.matvaretabellenSupplementAttempted ? "NoMatch" : "NotAttempted",
    nutritionSourceLabel: draft.kassalappNutritionPer100 === null ? null : "Kassalapp",
    matvaretabellenFoodId: null,
    matvaretabellenUrl: null,
    nutritionMatchedName: null,
    nutritionMatchConfidence: null,
  };
}

function mergeNutrition(primary: INutritionFacts | null, supplement: INutritionFacts | null) {
  if (primary === null) {
    return { nutrition: supplement, usedSupplement: supplement !== null };
  }

  if (supplement === null) {
    return { nutrition: primary, usedSupplement: false };
  }

  const nutrition: INutritionFacts = {
    calories: primary.calories ?? supplement.calories,
    carbohydrateGrams: primary.carbohydrateGrams ?? supplement.carbohydrateGrams,
    proteinGrams: primary.proteinGrams ?? supplement.proteinGrams,
    saltGrams: primary.saltGrams ?? supplement.saltGrams,
    dietaryFiberGrams: primary.dietaryFiberGrams ?? supplement.dietaryFiberGrams,
    saturatedFatGrams: primary.saturatedFatGrams ?? supplement.saturatedFatGrams,
    transFatGrams: primary.transFatGrams ?? supplement.transFatGrams,
    monounsaturatedFatGrams: primary.monounsaturatedFatGrams ?? supplement.monounsaturatedFatGrams,
    polyunsaturatedFatGrams: primary.polyunsaturatedFatGrams ?? supplement.polyunsaturatedFatGrams,
    omega3Grams: primary.omega3Grams ?? supplement.omega3Grams,
    omega6Grams: primary.omega6Grams ?? supplement.omega6Grams,
    cholesterolMilligrams: primary.cholesterolMilligrams ?? supplement.cholesterolMilligrams,
    vitaminAMicrograms: primary.vitaminAMicrograms ?? supplement.vitaminAMicrograms,
    vitaminB9Micrograms: primary.vitaminB9Micrograms ?? supplement.vitaminB9Micrograms,
    vitaminB12Micrograms: primary.vitaminB12Micrograms ?? supplement.vitaminB12Micrograms,
    vitaminCMilligrams: primary.vitaminCMilligrams ?? supplement.vitaminCMilligrams,
    vitaminDMicrograms: primary.vitaminDMicrograms ?? supplement.vitaminDMicrograms,
    vitaminEMilligrams: primary.vitaminEMilligrams ?? supplement.vitaminEMilligrams,
    vitaminKMicrograms: primary.vitaminKMicrograms ?? supplement.vitaminKMicrograms,
    cholineMilligrams: primary.cholineMilligrams ?? supplement.cholineMilligrams,
    vitamins: primary.vitamins,
  };

  return { nutrition, usedSupplement: hasSupplementFilledMissingValue(primary, supplement) };
}

function hasSupplementFilledMissingValue(primary: INutritionFacts, supplement: INutritionFacts) {
  return (primary.calories === null && supplement.calories !== null)
    || (primary.carbohydrateGrams === null && supplement.carbohydrateGrams !== null)
    || (primary.proteinGrams === null && supplement.proteinGrams !== null)
    || (primary.saltGrams === null && supplement.saltGrams !== null)
    || (primary.dietaryFiberGrams === null && supplement.dietaryFiberGrams !== null)
    || (primary.saturatedFatGrams === null && supplement.saturatedFatGrams !== null)
    || (primary.transFatGrams === null && supplement.transFatGrams !== null)
    || (primary.monounsaturatedFatGrams === null && supplement.monounsaturatedFatGrams !== null)
    || (primary.polyunsaturatedFatGrams === null && supplement.polyunsaturatedFatGrams !== null)
    || (primary.omega3Grams === null && supplement.omega3Grams !== null)
    || (primary.omega6Grams === null && supplement.omega6Grams !== null)
    || (primary.cholesterolMilligrams === null && supplement.cholesterolMilligrams !== null)
    || (primary.vitaminAMicrograms === null && supplement.vitaminAMicrograms !== null)
    || (primary.vitaminB9Micrograms === null && supplement.vitaminB9Micrograms !== null)
    || (primary.vitaminB12Micrograms === null && supplement.vitaminB12Micrograms !== null)
    || (primary.vitaminCMilligrams === null && supplement.vitaminCMilligrams !== null)
    || (primary.vitaminDMicrograms === null && supplement.vitaminDMicrograms !== null)
    || (primary.vitaminEMilligrams === null && supplement.vitaminEMilligrams !== null)
    || (primary.vitaminKMicrograms === null && supplement.vitaminKMicrograms !== null)
    || (primary.cholineMilligrams === null && supplement.cholineMilligrams !== null);
}

function withDerivedVitamins(nutrition: INutritionFacts | null): INutritionFacts | null {
  if (nutrition === null) {
    return null;
  }

  const values = nutritionToEditorValues(nutrition);
  return {
    ...nutrition,
    vitamins: deriveVitaminsFromNutritionValues(values),
  };
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
        kassalappNutritionPer100: toIngredientNutrition(product.kassalappNutritionPer100),
        matvaretabellenNutritionPer100: toIngredientNutrition(product.matvaretabellenNutritionPer100),
        nutritionPer100: toIngredientNutrition(product.nutritionPer100),
        nutritionSource: product.nutritionSource,
        nutritionSupplementSource: product.nutritionSupplementSource,
        matvaretabellenSupplementAttempted: product.matvaretabellenSupplementAttempted,
        matvaretabellenSupplementStatus: product.matvaretabellenSupplementStatus,
        matvaretabellenCandidates: product.matvaretabellenCandidates.map(toMatvaretabellenCandidate),
        nutritionSourceLabel: product.nutritionSourceLabel,
        kassalappUrl: product.kassalappUrl,
        matvaretabellenFoodId: product.matvaretabellenFoodId,
        matvaretabellenUrl: product.matvaretabellenUrl,
        nutritionMatchedName: product.nutritionMatchedName,
        nutritionMatchConfidence: product.nutritionMatchConfidence,
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

function toMatvaretabellenCandidate(candidate: IMatvaretabellenCandidate): MatvaretabellenCandidate {
  return {
    foodId: candidate.foodId,
    foodName: candidate.foodName,
    url: candidate.url,
    confidence: candidate.confidence,
    nutrition: toIngredientNutrition(candidate.nutrition) ?? emptyNutritionFacts(),
  };
}

function candidateToDraft(candidate: IngredientCandidate, stores: IStore[], brands: IBrand[]): IngredientDraft {
  return {
    name: candidate.name,
    brandId: findBrandId(candidate.brandName, brands),
    brandName: candidate.brandName,
    storeName: candidate.storeName,
    storeId: findStoreId(candidate.storeName, stores),
    price: numberToInputValue(candidate.price),
    imageUrl: candidate.imageUrl,
    imageFile: null,
    tags: candidate.tags,
    kassalappNutritionPer100: candidate.kassalappNutritionPer100,
    matvaretabellenNutritionPer100: candidate.matvaretabellenNutritionPer100,
    nutritionPer100: candidate.nutritionPer100,
    nutritionSource: candidate.nutritionSource,
    nutritionSupplementSource: candidate.nutritionSupplementSource,
    matvaretabellenSupplementAttempted: candidate.matvaretabellenSupplementAttempted,
    matvaretabellenSupplementStatus: candidate.matvaretabellenSupplementStatus,
    matvaretabellenCandidates: candidate.matvaretabellenCandidates,
    nutritionSourceLabel: candidate.nutritionSourceLabel,
    kassalappUrl: candidate.kassalappUrl,
    matvaretabellenFoodId: candidate.matvaretabellenFoodId,
    matvaretabellenUrl: candidate.matvaretabellenUrl,
    nutritionMatchedName: candidate.nutritionMatchedName,
    nutritionMatchConfidence: candidate.nutritionMatchConfidence,
  };
}

function getNutritionSource(
  draft: IngredientDraft,
  labels: Record<NutritionDataSource, string>,
  supplementedByLabel: (primary: string, supplement: string) => string,
  supplementSeparator: string,
) {
  if (draft.nutritionPer100 === null || draft.nutritionSource === "None") {
    return { text: labels.None, links: [], parts: [labels.None] };
  }

  const matchedName = draft.nutritionMatchedName?.trim() ?? null;
  const primary = sourceLink(
    labels,
    draft.nutritionSource,
    draft.nutritionSource === "Kassalapp" ? draft.kassalappUrl : draft.matvaretabellenUrl,
    draft.nutritionSource === "Matvaretabellen" ? matchedName : null,
  );
  const supplement = draft.nutritionSupplementSource === null
    ? null
    : sourceLink(
        labels,
        draft.nutritionSupplementSource,
        draft.nutritionSupplementSource === "Kassalapp" ? draft.kassalappUrl : draft.matvaretabellenUrl,
        draft.nutritionSupplementSource === "Matvaretabellen" ? matchedName : null,
      );

  if (supplement !== null) {
    const text = supplementedByLabel(primary.label, supplement.label);
    return {
      text,
      links: [primary, supplement].filter((link) => link.url !== null),
      parts: [primary, supplementSeparator, supplement],
    };
  }

  return {
    text: primary.label,
    links: primary.url === null ? [] : [primary],
    parts: [primary],
  };
}

type NutritionSourceLink = {
  label: string;
  url: string | null;
};

function sourceLink(
  labels: Record<NutritionDataSource, string>,
  source: NutritionDataSource,
  url: string | null,
  matchedName: string | null,
): NutritionSourceLink {
  const label = source === "Matvaretabellen" && matchedName
    ? `${labels.Matvaretabellen}: ${matchedName}`
    : labels[source];

  return { label, url };
}

function formatCandidateMacros(
  nutrition: INutritionFacts,
  labels: { calories: string; carbs: string; fiber: string; protein: string },
) {
  const parts = [
    nutrition.calories === null ? null : `${labels.calories}: ${nutrition.calories} kcal`,
    nutrition.carbohydrateGrams === null ? null : `${labels.carbs}: ${nutrition.carbohydrateGrams} g`,
    nutrition.proteinGrams === null ? null : `${labels.protein}: ${nutrition.proteinGrams} g`,
    nutrition.dietaryFiberGrams === null ? null : `${labels.fiber}: ${nutrition.dietaryFiberGrams} g`,
  ].filter(Boolean);

  return parts.join(" / ");
}

function findBrandId(brandName: string, brands: IBrand[]) {
  const normalizedBrandName = brandName.trim().toLowerCase();
  if (normalizedBrandName.length === 0) {
    return null;
  }

  return brands.find((brand) => brand.name.toLowerCase() === normalizedBrandName)?.brandId ?? null;
}

function findStoreId(storeName: string, stores: IStore[]) {
  const normalizedStoreName = storeName.trim().toLowerCase();
  if (normalizedStoreName.length === 0) {
    return null;
  }

  return stores.find((store) => store.name.toLowerCase() === normalizedStoreName)?.storeId ?? null;
}

function cleanIngredientName(name: string) {
  return name.replace(/\s{2,}/g, " ").trim();
}

function inferIngredientTags(searchText: string): IngredientTag[] {
  const normalized = searchText.toLowerCase();

  if (/\b(kylling|chicken)\b/.test(normalized)) return ["Chicken"];
  if (/\b(okse|storfe|beef|biff)\b/.test(normalized)) return ["Beef"];
  if (/\b(lam|lamb)\b/.test(normalized)) return ["Lamb"];
  if (/\b(fisk|fish|laks|salmon|torsk|cod)\b/.test(normalized)) return ["Fish"];
  if (/\b(melk|milk|yoghurt|yogurt|ost|cheese|fløte|cream)\b/.test(normalized)) return ["Dairy"];
  if (/\b(brød|bread|loff|baguette|rundstykke)\b/.test(normalized)) return ["Bread", "Pantry"];
  if (/\b(ris|rice|pasta|nudler|noodle|mel|flour|havre|oat)\b/.test(normalized)) return ["Grain", "Pantry"];
  if (/\b(dip|dipp)\b/.test(normalized)) return ["Dip", "Pantry"];
  if (/\b(saus|sauce|dressing)\b/.test(normalized)) return ["Sauce"];
  if (/\b(krydder|spice|pepper|salt)\b/.test(normalized)) return ["Spice"];
  if (/\b(basilikum|basil|persille|parsley|koriander|cilantro|dill)\b/.test(normalized)) return ["Herb"];
  if (/\b(bær|berry|berries|jordbær|strawberry|bringebær|raspberry|blåbær|blueberry)\b/.test(normalized)) return ["Fruit", "Berry"];
  if (/\b(eple|apple|banan|banana|appelsin|orange|druer|grape)\b/.test(normalized)) return ["Fruit"];
  if (/\b(salat|spinach|spinat|ruccola|kale|grønnkål)\b/.test(normalized)) return ["Vegetable", "LeafyGreen"];
  if (/\b(gulrot|carrot|potet|potato|pastinakk|parsnip|sellerirot|celeriac|kålrot|swede|rødbete|beetroot)\b/.test(normalized)) return ["Vegetable", "RootVegetable"];
  if (/\b(løk|onion|tomat|tomato|agurk|cucumber|paprika)\b/.test(normalized)) return ["Vegetable"];
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

function emptyNutritionFacts(): INutritionFacts {
  return {
    calories: null,
    carbohydrateGrams: null,
    proteinGrams: null,
    saltGrams: null,
    dietaryFiberGrams: null,
    saturatedFatGrams: null,
    transFatGrams: null,
    monounsaturatedFatGrams: null,
    polyunsaturatedFatGrams: null,
    omega3Grams: null,
    omega6Grams: null,
    cholesterolMilligrams: null,
    vitaminAMicrograms: null,
    vitaminB9Micrograms: null,
    vitaminB12Micrograms: null,
    vitaminCMilligrams: null,
    vitaminDMicrograms: null,
    vitaminEMilligrams: null,
    vitaminKMicrograms: null,
    cholineMilligrams: null,
    vitamins: [],
  };
}

function nutritionToEditorValues(nutrition: INutritionFacts | null): NutritionEditorValues {
  return {
    calories: numberToInputValue(nutrition?.calories),
    carbohydrateGrams: numberToInputValue(nutrition?.carbohydrateGrams),
    proteinGrams: numberToInputValue(nutrition?.proteinGrams),
    saltGrams: numberToInputValue(nutrition?.saltGrams),
    dietaryFiberGrams: numberToInputValue(nutrition?.dietaryFiberGrams),
    saturatedFatGrams: numberToInputValue(nutrition?.saturatedFatGrams),
    transFatGrams: numberToInputValue(nutrition?.transFatGrams),
    monounsaturatedFatGrams: numberToInputValue(nutrition?.monounsaturatedFatGrams),
    polyunsaturatedFatGrams: numberToInputValue(nutrition?.polyunsaturatedFatGrams),
    omega3Grams: numberToInputValue(nutrition?.omega3Grams),
    omega6Grams: numberToInputValue(nutrition?.omega6Grams),
    cholesterolMilligrams: numberToInputValue(nutrition?.cholesterolMilligrams),
    vitaminAMicrograms: numberToInputValue(nutrition?.vitaminAMicrograms),
    vitaminB9Micrograms: numberToInputValue(nutrition?.vitaminB9Micrograms),
    vitaminB12Micrograms: numberToInputValue(nutrition?.vitaminB12Micrograms),
    vitaminCMilligrams: numberToInputValue(nutrition?.vitaminCMilligrams),
    vitaminDMicrograms: numberToInputValue(nutrition?.vitaminDMicrograms),
    vitaminEMilligrams: numberToInputValue(nutrition?.vitaminEMilligrams),
    vitaminKMicrograms: numberToInputValue(nutrition?.vitaminKMicrograms),
    cholineMilligrams: numberToInputValue(nutrition?.cholineMilligrams),
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
