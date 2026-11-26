import { useId, useMemo, useRef, useState, type FormEvent } from "react";
import Modal from "../components/Modal";
import SuccessToast from "../components/SuccessToast";
import { useBarcodeScanner, type BarcodeScannerError } from "../hooks/useBarcodeScanner";
import { useBrands, useIngredients, useLanguage } from "../contexts";
import type { IProductLookupResult } from "../interfaces/IProductLookup";
import { brandService, imageUploadService, ingredientService, productLookupService } from "../services";
import { getApiAssetUrl } from "../services/apiClient";
import { pageStyles, scannerStyles } from "../styles/appStyles";
import { INGREDIENT_NAME_MAX_LENGTH } from "../constants/validation";
import {
  type IngredientCandidate,
  type IngredientDraft,
  buildIngredientCandidates,
  candidateToDraft,
} from "./scanner/scannerDraft";
import { IngredientDraftEditor } from "./scanner/IngredientDraftEditor";

function ScannerPage() {
  const { t } = useLanguage();
  const { brands, refreshBrands } = useBrands();
  const { refreshIngredients } = useIngredients();
  const [ean, setEan] = useState("");
  const [products, setProducts] = useState<IProductLookupResult[]>([]);
  const [lookedUpEan, setLookedUpEan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingIngredient, setIsSavingIngredient] = useState(false);
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);
  const [cameraStatus, setCameraStatus] = useState<string | null>(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [ingredientDraft, setIngredientDraft] = useState<IngredientDraft | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const editorTitleId = useId();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const candidates = useMemo(() => buildIngredientCandidates(products), [products]);

  // New lookup results preselect their first candidate (or clear the editor when there are none).
  const showProducts = (nextProducts: IProductLookupResult[]) => {
    setProducts(nextProducts);
    const firstCandidate = buildIngredientCandidates(nextProducts)[0];
    setEditorError(null);

    if (firstCandidate === undefined) {
      setSelectedCandidateId(null);
      setIngredientDraft(null);
      setIsEditorOpen(false);
      return;
    }

    setSelectedCandidateId(firstCandidate.id);
    setIngredientDraft(candidateToDraft(firstCandidate, brands));
  };

  const lookupEan = async (rawEan: string) => {
    const normalizedEan = rawEan.replace(/\D/g, "");
    if (!/^(\d{8}|\d{13})$/.test(normalizedEan)) {
      setError(t.scanner.invalidEan);
      showProducts([]);
      setLookedUpEan(null);
      return false;
    }

    setIsLoading(true);
    setError(null);
    showProducts([]);
    setLookedUpEan(normalizedEan);

    try {
      const response = await productLookupService.lookupByEan(normalizedEan);
      showProducts(response.products);
      return true;
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : t.scanner.lookupFailed);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const lookupProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await lookupEan(ean);
  };

  const selectCandidate = (candidate: IngredientCandidate) => {
    setSelectedCandidateId(candidate.id);
    setIngredientDraft(candidateToDraft(candidate, brands));
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

      await ingredientService.create({
        ingredientName,
        description: null,
        brandId: brand?.brandId ?? null,
        imageUrl: uploadedImage?.url ?? ingredientDraft.imageUrl,
        tags: ingredientDraft.tags,
        nutritionPer100: ingredientDraft.nutritionPer100,
        nutritionSource: ingredientDraft.nutritionSource,
        nutritionSourceLabel: ingredientDraft.nutritionSourceLabel,
        matvaretabellenFoodId: ingredientDraft.matvaretabellenFoodId,
        nutritionMatchedName: ingredientDraft.nutritionMatchedName,
        nutritionMatchConfidence: ingredientDraft.nutritionMatchConfidence,
        color: null,
      });

      await refreshIngredients();
      setIsEditorOpen(false);
      setEditorError(null);
      setCameraStatus(t.scanner.ingredientSaved(ingredientName));
      setSuccessMessage(t.common.ingredientAdded(ingredientName));
    } catch (caughtError) {
      setEditorError(caughtError instanceof Error ? caughtError.message : t.scanner.lookupFailed);
    } finally {
      setIsSavingIngredient(false);
    }
  };

  const handleBarcodeDetected = (detectedEan: string) => {
    setEan(detectedEan);
    setCameraStatus(t.scanner.scannerFound(detectedEan));
    void lookupEan(detectedEan);
  };

  const handleCameraError = (cameraError: BarcodeScannerError) => {
    setError(cameraError === "permissionDenied" ? t.scanner.cameraPermissionDenied : t.scanner.cameraUnsupported);
    setCameraStatus(null);
  };

  const { isOpen: isCameraOpen, start: startScanner, stop: stopCamera } = useBarcodeScanner({
    videoRef,
    onDetected: handleBarcodeDetected,
    onError: handleCameraError,
  });

  const startCamera = () => {
    setError(null);
    setCameraStatus(t.scanner.scannerReady);
    void startScanner();
  };

  return (
    <main className={pageStyles.shell}>
      <section className={scannerStyles.shell}>
        <header className={scannerStyles.header}>
          <h1 className={scannerStyles.title}>{t.scanner.pageTitle}</h1>
          <p className={scannerStyles.intro}>
            {t.scanner.pageIntroBeforeKassalapp}
            <a className={scannerStyles.introLink} href="https://kassal.app/" rel="noreferrer" target="_blank">
              Kassalapp
            </a>
            {t.scanner.pageIntroAfterKassalapp}
          </p>
        </header>

        <div className={scannerStyles.scannerSurface}>
          <section className={scannerStyles.panel}>
            <div className={scannerStyles.desktopScannerHint}>{t.scanner.mobileOnly}</div>

            <div className={scannerStyles.scannerActions}>
              <button
                className={scannerStyles.cameraButton}
                disabled={isLoading}
                onClick={isCameraOpen ? stopCamera : startCamera}
                type="button"
              >
                {isCameraOpen ? t.scanner.cameraStop : t.scanner.cameraStart}
              </button>
              <button
                aria-expanded={isManualEntryOpen}
                className={scannerStyles.manualEntryButton}
                type="button"
                onClick={() => setIsManualEntryOpen((currentValue) => !currentValue)}
              >
                {isManualEntryOpen ? t.scanner.hideManualEntry : t.scanner.manualEntry}
              </button>
            </div>
            {cameraStatus !== null && (
              <span className={scannerStyles.cameraStatus}>
                {cameraStatus}
              </span>
            )}
            <form className={scannerStyles.lookupForm(isManualEntryOpen)} onSubmit={lookupProduct}>
              <label className={scannerStyles.field}>
                <span className={scannerStyles.label}>{t.scanner.eanLabel}</span>
                <input
                  className={scannerStyles.input}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder={t.scanner.eanPlaceholder}
                  value={ean}
                  onChange={(event) => setEan(event.target.value)}
                />
              </label>
              <button
                className={scannerStyles.submitButton}
                disabled={isLoading}
                type="submit"
              >
                {isLoading ? t.scanner.searching : t.scanner.lookup}
              </button>
            </form>

            {isCameraOpen && (
              <div className={scannerStyles.cameraFrame}>
                <video
                  className={scannerStyles.cameraVideo}
                  muted
                  playsInline
                  ref={videoRef}
                />
                <div aria-hidden="true" className={scannerStyles.cameraGuide} />
              </div>
            )}

            {error !== null && <p className={scannerStyles.statusError}>{error}</p>}
          </section>

          {isLoading && (
            <div className={scannerStyles.emptyState}>{t.scanner.searching}</div>
          )}

          {!isLoading && lookedUpEan !== null && products.length === 0 && error === null && (
            <div className={scannerStyles.emptyState}>
              {t.scanner.noProductsFound(lookedUpEan)}
            </div>
          )}

          {candidates.length > 0 && ingredientDraft !== null && (
            <section className={scannerStyles.candidateSection}>
              <div className={scannerStyles.candidateHeader}>
                <h2 className={scannerStyles.candidateTitle}>{t.scanner.scanCandidatesTitle}</h2>
                <span className={scannerStyles.candidateSubtitle}>{t.scanner.scanCandidatesHelp}</span>
              </div>
              <div className={scannerStyles.candidateList}>
                {candidates.map((candidate) => (
                  <button
                    className={scannerStyles.candidateButton(candidate.id === selectedCandidateId)}
                    key={candidate.id}
                    type="button"
                    onClick={() => selectCandidate(candidate)}
                  >
                    <CandidateImage candidate={candidate} />
                    <span className={scannerStyles.candidateTextStack}>
                      <span className={scannerStyles.candidateName}>{candidate.name}</span>
                      {candidate.brandName.length > 0 && (
                        <span className={scannerStyles.candidateMeta}>{candidate.brandName}</span>
                      )}
                    </span>
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
          closeButtonClassName={scannerStyles.editorModalCloseButton}
          closeLabel={t.common.close}
          footer={(
            <>
              <button
                className={`${scannerStyles.manualEntryButton} ${scannerStyles.editorModalActionButton}`}
                disabled={isSavingIngredient}
                type="button"
                onClick={() => setIsEditorOpen(false)}
              >
                {t.common.cancel}
              </button>
              <button
                className={`${scannerStyles.saveButton} ${scannerStyles.editorModalActionButton}`}
                disabled={isSavingIngredient}
                type="button"
                onClick={() => void saveIngredient()}
              >
                {isSavingIngredient ? t.scanner.savingIngredient : t.scanner.saveIngredient}
              </button>
              {editorError !== null && (
                <p className={scannerStyles.editorModalError}>{editorError}</p>
              )}
            </>
          )}
          footerClassName={scannerStyles.editorModalFooter}
          headerClassName={scannerStyles.editorModalHeader}
          panelClassName={scannerStyles.editorModalPanel}
          title={ingredientDraft.name || t.scanner.suggestedIngredient}
          titleClassName={scannerStyles.editorModalTitle}
          titleId={editorTitleId}
          onClose={() => setIsEditorOpen(false)}
        >
          <IngredientDraftEditor
            draft={ingredientDraft}
            onChange={(nextDraft) => {
              setIngredientDraft(nextDraft);
              setEditorError(null);
            }}
          />
        </Modal>
      )}
      {successMessage !== null && (
        <SuccessToast
          closeLabel={t.common.close}
          message={successMessage}
          onClose={() => setSuccessMessage(null)}
        />
      )}
    </main>
  );
}

function CandidateImage({ candidate }: { candidate: IngredientCandidate; }) {
  const { t } = useLanguage();
  const imageUrl = getApiAssetUrl(candidate.imageUrl);

  return (
    <span className={scannerStyles.candidateImageFrame}>
      {imageUrl === null ? (
        <span className={scannerStyles.productImageFallback}>{t.scanner.noImage}</span>
      ) : (
        <img className={scannerStyles.productImage} src={imageUrl} alt="" />
      )}
    </span>
  );
}

export default ScannerPage;
